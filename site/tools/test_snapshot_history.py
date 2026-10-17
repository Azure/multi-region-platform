#!/usr/bin/env python3
"""Offline regressions for monthly backup retention, import/refresh and migration."""
import datetime
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import import_service_catalog as importer
import refresh_data as retail
from snapshot_history import migrate_layout, publish_snapshot


class SnapshotHistoryTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)

    def snapshot(self, path, month, value, directory=False):
        data = {"generated": f"2026-{month:02d}-05T12:00:00Z", "value": value}
        if directory:
            path.mkdir(parents=True)
            (path / "pricing").mkdir()
            (path / "pricing" / "eastus.json").write_text(json.dumps({"value": value}), encoding="utf-8")
            (path / "catalog.json").write_text(json.dumps({"value": value}), encoding="utf-8")
            (path / "products.json").write_text(json.dumps({"value": value}), encoding="utf-8")
            (path / "meta.json").write_text(json.dumps(data), encoding="utf-8")
        else:
            path.write_text(json.dumps(data), encoding="utf-8")
        return path

    def read(self, path):
        return json.loads((path / "meta.json" if path.is_dir() else path).read_text(encoding="utf-8"))

    def test_first_backup_per_creation_month_and_six_month_retention_for_both_sources(self):
        for directory, name in [(False, "availability-catalog-latest.json"), (True, "retail-latest")]:
            with self.subTest(directory=directory):
                parent = self.root / ("retail" if directory else "availability")
                parent.mkdir()
                latest = parent / name
                self.snapshot(latest, 1, "first", directory)
                for month in range(1, 9):
                    staged = self.snapshot(parent / "staged", month, f"month-{month}", directory)
                    publish_snapshot(staged, latest)
                prefix = "retail-" if directory else "availability-catalog-"
                suffix = "" if directory else ".json"
                archives = sorted(p for p in parent.iterdir() if p != latest)
                self.assertEqual([p.name for p in archives], [f"{prefix}2026-{m:02d}{suffix}" for m in range(2, 8)])
                self.assertEqual(self.read(latest)["value"], "month-8")
                if directory:
                    self.assertEqual(json.loads((archives[-1] / "pricing" / "eastus.json").read_text())["value"], "month-7")

    def test_same_month_backup_is_immutable_and_uses_old_month(self):
        latest = self.snapshot(self.root / "availability-catalog-latest.json", 1, "first")
        publish_snapshot(self.snapshot(self.root / "staged", 1, "second"), latest)
        archive = self.root / "availability-catalog-2026-01.json"
        first_bytes = archive.read_bytes()
        publish_snapshot(self.snapshot(self.root / "staged", 2, "third"), latest)
        self.assertEqual(archive.read_bytes(), first_bytes)
        self.assertFalse((self.root / "availability-catalog-2026-02.json").exists())

    def test_placeholder_is_not_archived(self):
        latest = self.root / "availability-catalog-latest.json"
        latest.write_text('{"generated":null}', encoding="utf-8")
        publish_snapshot(self.snapshot(self.root / "staged", 1, "new"), latest)
        self.assertEqual(sorted(p.name for p in self.root.iterdir()), [latest.name])

    def test_bad_staging_leaves_latest_and_history_unchanged(self):
        latest = self.snapshot(self.root / "availability-catalog-latest.json", 1, "old")
        before = latest.read_bytes()
        staged = self.root / "staged"
        staged.write_text("not json", encoding="utf-8")
        with self.assertRaises(json.JSONDecodeError):
            publish_snapshot(staged, latest)
        self.assertEqual(latest.read_bytes(), before)
        self.assertFalse(list(self.root.glob("availability-catalog-2026-*")))

    def test_directory_publication_failure_restores_latest(self):
        latest = self.snapshot(self.root / "retail-latest", 1, "old", True)
        staged = self.snapshot(self.root / "staged", 2, "new", True)
        replace = Path.replace

        def fail_staged(path, target):
            if path == staged:
                raise OSError("simulated publication failure")
            return replace(path, target)

        with patch.object(Path, "replace", fail_staged), self.assertRaisesRegex(OSError, "simulated"):
            publish_snapshot(staged, latest)
        self.assertEqual(self.read(latest)["value"], "old")
        self.assertEqual(self.read(self.root / "retail-2026-01")["value"], "old")

    def test_migration_preserves_bytes_dates_and_is_repeatable(self):
        self.snapshot(self.root / "availability-catalog.json", 1, "availability")
        legacy = self.snapshot(self.root / "legacy", 2, "retail", True)
        originals = {path.relative_to(legacy): path.read_bytes() for path in legacy.rglob("*") if path.is_file()}
        for path in list(legacy.iterdir()):
            path.replace(self.root / path.name)
        legacy.rmdir()
        migrate_layout(self.root)
        migrate_layout(self.root)
        self.assertEqual(self.read(self.root / "availability-catalog-latest.json")["generated"], "2026-01-05T12:00:00Z")
        for relative, content in originals.items():
            self.assertEqual((self.root / "retail-latest" / relative).read_bytes(), content)
        self.assertFalse((self.root / "meta.json").exists())
        self.assertFalse(list(self.root.glob("retail-2026-*")))

    def test_csv_import_noop_failure_and_new_data_backup(self):
        source = self.root / "source.csv"
        mapping = self.root / "mapping.csv"
        mapping.write_text(",".join(importer.MAPPING_COLUMNS) + "\nExample,Retail Example\n", encoding="utf-8")
        header = "service_family,service_name,product_name,sku_name,region,region_display_name,geography,arm_zones,is_available\n"
        source.write_text(header + "Compute,Example,,,eastus,East US,US,,1\n", encoding="utf-8")
        argv = ["import_service_catalog.py", str(source), "--mapping", str(mapping), "--out", str(self.root)]
        with patch("sys.argv", argv):
            importer.main()
            latest = self.root / "availability-catalog-latest.json"
            before = latest.read_bytes()
            importer.main()
            self.assertEqual(latest.read_bytes(), before)
            self.assertFalse(list(self.root.glob("availability-catalog-20*.json")))
            mapping.write_text("bad mapping", encoding="utf-8")
            with self.assertRaises(ValueError):
                importer.main()
            self.assertEqual(latest.read_bytes(), before)
            self.assertFalse(list(self.root.glob("availability-catalog-20*.json")))
            mapping.write_text(",".join(importer.MAPPING_COLUMNS) + "\nExample,Retail Example\n", encoding="utf-8")
            old = json.loads(before)
            old["generated"] = "2026-01-05T12:00:00Z"
            latest.write_text(json.dumps(old), encoding="utf-8")
            source.write_text(header + "Compute,Example,,,eastus,East US,US,,0\n", encoding="utf-8")
            importer.main()
            self.assertEqual(self.read(self.root / "availability-catalog-2026-01.json"), old)
            self.assertFalse(self.read(latest)["services"][0]["regions"]["eastus"]["available"])

    def test_retail_refresh_archives_complete_snapshot_and_failed_collection_is_safe(self):
        item = {"type": "Consumption", "serviceName": "Example", "serviceFamily": "Compute",
                "productName": "Product", "skuName": "Basic", "meterName": "Requests", "unitOfMeasure": "1",
                "armRegionName": "eastus", "retailPrice": 1}
        argv = ["refresh_data.py", "--out", str(self.root)]
        seed = {"eastus": {"name": "East US"}, "westus": {"name": "West US"}}
        clock = SimpleNamespace(datetime=SimpleNamespace(now=lambda _: datetime.datetime(2026, 1, 5, tzinfo=datetime.timezone.utc)),
                                timezone=datetime.timezone)
        with patch("sys.argv", argv), patch.object(retail, "load_seed", return_value=(seed, "test")), \
                patch.object(retail, "fetch_items", return_value=iter([item, {**item, "armRegionName": "westus", "retailPrice": 2}])), \
                patch.object(retail, "datetime", clock):
            retail.main()
        latest = self.root / "retail-latest"
        before = {p.relative_to(latest): p.read_bytes() for p in latest.rglob("*") if p.is_file()}
        with patch("sys.argv", argv), patch.object(retail, "load_seed", return_value=(seed, "test")), \
                patch.object(retail, "fetch_items", side_effect=ValueError("API failure")):
            with self.assertRaisesRegex(ValueError, "API failure"):
                retail.main()
        self.assertFalse(list(self.root.glob("retail-2026-*")))
        with patch("sys.argv", argv), patch.object(retail, "load_seed", return_value=(seed, "test")), \
                patch.object(retail, "fetch_items", return_value=iter([item, {**item, "armRegionName": "westus", "retailPrice": 3}])):
            retail.main()
        archive = self.root / "retail-2026-01"
        self.assertEqual({p.relative_to(archive): p.read_bytes() for p in archive.rglob("*") if p.is_file()}, before)
        prices = json.loads((latest / "pricing" / "eastus.json").read_text())
        self.assertEqual(prices["services"]["Example"]["p"], [None, 200.0])


if __name__ == "__main__":
    unittest.main()
