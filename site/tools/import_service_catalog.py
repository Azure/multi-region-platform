#!/usr/bin/env python3
"""Import the manually supplied availability CSV without collecting retail prices."""
import argparse
import csv
import datetime
import hashlib
import json
import tempfile
from pathlib import Path

from snapshot_history import publish_snapshot

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "docs" / "data"
COLUMNS = {
    "service_family", "service_name", "product_name", "sku_name", "region",
    "region_display_name", "geography", "arm_zones", "is_available",
}
MAPPING_COLUMNS = ["Service Availability - service_name", "Retail API - service_name"]


def node(name):
    return {"name": name, "regions": {}}


def merge_region(target, region, available, zones):
    entry = target["regions"].setdefault(region, {"available": False, "zoneCounts": []})
    entry["available"] |= available
    if available and zones and len(zones) not in entry["zoneCounts"]:
        entry["zoneCounts"] = sorted([*entry["zoneCounts"], len(zones)])


def build_catalog(path):
    services, regions = {}, {}
    count = 0
    with path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        missing = COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise ValueError("Missing CSV columns: " + ", ".join(sorted(missing)))
        for line, row in enumerate(reader, 2):
            count += 1
            values = {key: (row.get(key) or "").strip() for key in COLUMNS}
            name, rid = values["service_name"], values["region"]
            if not name or not rid or not values["region_display_name"] or not values["geography"]:
                raise ValueError(f"Row {line}: missing service or region metadata.")
            flag = values["is_available"]
            if flag not in ("0", "1"):
                raise ValueError(f"Row {line}: is_available must be 0 or 1, got {flag!r}.")
            try:
                zones = json.loads(values["arm_zones"]) if values["arm_zones"] else None
            except json.JSONDecodeError as error:
                raise ValueError(f"Row {line}: invalid arm_zones JSON.") from error
            if zones is not None and (
                not isinstance(zones, list)
                or any(not isinstance(z, str) or z not in ("1", "2", "3") for z in zones)
                or len(set(zones)) != len(zones)
            ):
                raise ValueError(f"Row {line}: arm_zones must be null or a list of distinct zone IDs 1, 2, 3.")
            region = {"id": rid, "name": values["region_display_name"], "geo": values["geography"]}
            if rid in regions and regions[rid] != region:
                raise ValueError(f"Row {line}: conflicting metadata for region {rid!r}.")
            regions[rid] = region
            service = services.setdefault(name, {**node(name), "family": values["service_family"], "products": {}})
            if service["family"] != values["service_family"]:
                raise ValueError(f"Row {line}: conflicting Service Family for {name!r}.")
            targets = [service]
            product, sku = values["product_name"], values["sku_name"]
            if sku and not product:
                raise ValueError(f"Row {line}: SKU has no Product Name.")
            if product:
                product_node = service["products"].setdefault(product, {**node(product), "skus": {}})
                targets.append(product_node)
                if sku:
                    targets.append(product_node["skus"].setdefault(sku, node(sku)))
            # Roll up all matching rows, including child SKUs; duplicate rows never inflate AZ counts.
            for target in targets:
                merge_region(target, rid, flag == "1", zones)
    if not count:
        raise ValueError("Availability CSV contains no data rows.")
    return {
        "source": path.name,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "rows": count,
        "regions": [regions[r] for r in sorted(regions)],
        "services": [services[s] for s in sorted(services)],
    }


def build_mapping(path, services):
    mapping = {}
    with path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        if reader.fieldnames != MAPPING_COLUMNS:
            raise ValueError("Unexpected service-pricing mapping CSV headers.")
        for line, row in enumerate(reader, 2):
            name, retail = (row[key].strip() for key in MAPPING_COLUMNS)
            if not name or not retail or name in mapping:
                raise ValueError(f"Mapping row {line}: missing or duplicate service name.")
            mapping[name] = {"service": None, "note": retail} if retail.startswith("No Retail meter") else {"service": retail}
    missing = {s["name"] for s in services} - mapping.keys()
    if missing:
        raise ValueError("Services missing from pricing mapping: " + ", ".join(sorted(missing)))
    return mapping


def write_json(path, value):
    text = json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":")) + "\n"
    if not path.exists() or path.read_text(encoding="utf-8") != text:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(".json.tmp")
        temporary.write_text(text, encoding="utf-8")
        temporary.replace(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path, help="Availability CSV supplied in temp/")
    parser.add_argument("--mapping", type=Path, default=DATA / "svcavail-retailprice.csv")
    parser.add_argument("--out", type=Path, default=DATA)
    args = parser.parse_args()
    catalog = build_catalog(args.csv)
    mapping = build_mapping(args.mapping, catalog["services"])
    previous_path = args.out / "availability-catalog-latest.json"
    previous = json.loads(previous_path.read_text(encoding="utf-8")) if previous_path.exists() else {}
    catalog["generated"] = previous.get("generated") if previous.get("sha256") == catalog["sha256"] else (
        datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    if previous != catalog:
        args.out.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix=".availability-", dir=args.out) as temporary:
            staged = Path(temporary) / "catalog.json"
            write_json(staged, catalog)
            publish_snapshot(staged, previous_path)
    write_json(args.out / "service-pricing-map.json", mapping)
    print(f"Imported {catalog['rows']} rows: {len(catalog['services'])} services, "
          f"{len(catalog['regions'])} regions. Retail pricing was not changed.")


if __name__ == "__main__":
    main()
