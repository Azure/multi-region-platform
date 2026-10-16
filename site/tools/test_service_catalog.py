#!/usr/bin/env python3
"""Regression checks for availability CSV import and the maintained pricing mapping."""
import csv
import json
import tempfile
import unittest
from pathlib import Path

from import_service_catalog import MAPPING_COLUMNS, build_catalog, build_mapping, write_json


class CatalogImportTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.csv = self.root / "availability.csv"

    def row(self, **changes):
        return {
            "service_family": "Compute", "service_name": "Example", "product_name": "",
            "sku_name": "", "region": "eastus", "region_display_name": "East US",
            "geography": "United States", "arm_zones": "", "is_available": "0", **changes,
        }

    def catalog(self, rows):
        fields = sorted(set().union(*(r.keys() for r in rows)))
        with self.csv.open("w", encoding="utf-8-sig", newline="") as source:
            writer = csv.DictWriter(source, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
        return build_catalog(self.csv)

    def test_rollups_use_only_is_available_and_keep_sku_specific_zones(self):
        catalog = self.catalog([
            self.row(pbr_state="ga", arm_available="1", rp_available="1"),
            self.row(product_name="Product", sku_name="Small", is_available="1", arm_zones='["1"]', pbr_state=""),
            self.row(product_name="Product", sku_name="Large", is_available="1", arm_zones='["3","1","2"]'),
            self.row(product_name="Product", sku_name="Large", is_available="1", arm_zones='["2","3","1"]'),
            self.row(product_name="Product", sku_name="Unavailable", arm_zones='["1","2","3"]', pbr_state="preview"),
            self.row(product_name="Other", arm_zones="null"),
        ])
        service = catalog["services"][0]
        self.assertEqual(service["regions"]["eastus"], {"available": True, "zoneCounts": [1, 3]})
        product = service["products"]["Product"]
        self.assertEqual(product["regions"]["eastus"], service["regions"]["eastus"])
        self.assertEqual(product["skus"]["Small"]["regions"]["eastus"]["zoneCounts"], [1])
        self.assertEqual(product["skus"]["Large"]["regions"]["eastus"]["zoneCounts"], [3])
        self.assertEqual(product["skus"]["Unavailable"]["regions"]["eastus"], {"available": False, "zoneCounts": []})
        self.assertFalse(service["products"]["Other"]["regions"]["eastus"]["available"])
        self.assertNotIn("pbr_state", json.dumps(catalog))
        self.assertNotIn("arm_available", json.dumps(catalog))
        self.assertEqual(catalog["regions"], [{"id": "eastus", "name": "East US", "geo": "United States"}])
        self.assertEqual(catalog["rows"], 6)

    def test_missing_zone_data_never_creates_zone_counts(self):
        catalog = self.catalog([self.row(is_available="1", arm_zones=value) for value in ("", "null", "[]")])
        self.assertEqual(catalog["services"][0]["regions"]["eastus"], {"available": True, "zoneCounts": []})

    def test_two_zone_support_counts_distinct_zone_ids(self):
        catalog = self.catalog([self.row(is_available="1", arm_zones='["3","1"]')])
        self.assertEqual(catalog["services"][0]["regions"]["eastus"]["zoneCounts"], [2])

    def test_invalid_flags_zones_and_orphan_skus_fail(self):
        for change in ({"is_available": ""}, {"is_available": "true"}, {"arm_zones": "invalid"},
                       {"arm_zones": '["4"]'}, {"arm_zones": '["1","1"]'}, {"sku_name": "orphan"}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                self.catalog([self.row(**change)])

    def test_missing_required_columns_fail(self):
        self.csv.write_text("service_name\nExample\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Missing CSV columns"):
            build_catalog(self.csv)

    def test_conflicting_region_metadata_fails(self):
        with self.assertRaisesRegex(ValueError, "conflicting metadata"):
            self.catalog([self.row(), self.row(region_display_name="Different")])

    def test_mapping_retains_explanations_and_rejects_missing_services(self):
        path = self.root / "mapping.csv"
        with path.open("w", newline="", encoding="utf-8") as source:
            writer = csv.writer(source)
            writer.writerow(MAPPING_COLUMNS)
            writer.writerows([["Example", "Retail Example"], ["Free", "No Retail meter (free service)"]])
        mapping = build_mapping(path, [{"name": "Example"}, {"name": "Free"}])
        self.assertEqual(mapping["Example"], {"service": "Retail Example"})
        self.assertEqual(mapping["Free"], {"service": None, "note": "No Retail meter (free service)"})
        with self.assertRaisesRegex(ValueError, "missing from pricing mapping"):
            build_mapping(path, [{"name": "Unmapped"}])

    def test_json_output_is_stable(self):
        path = self.root / "output.json"
        write_json(path, {"b": 2, "a": 1})
        previous = path.stat().st_mtime_ns
        write_json(path, {"a": 1, "b": 2})
        self.assertEqual(path.stat().st_mtime_ns, previous)
        self.assertEqual(json.loads(path.read_text()), {"a": 1, "b": 2})


if __name__ == "__main__":
    unittest.main()
