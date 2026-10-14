#!/usr/bin/env python3
"""Scrape Microsoft's published Product Availability by Region table.

    python site/tools/scrape_product_availability.py
    python site/tools/scrape_product_availability.py --out .cache/product-availability.json

The script uses only the Python standard library. Its output is an independent source snapshot;
it does not replace the existing pricing-derived availability data.
"""
import argparse
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.request

URL = "https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table"
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, ".cache", "product-availability.json")
STATUS_CLASSES = {
    "GA": "generally_available",
    "Preview": "public_preview",
    "Closing Down": "retiring",
}


def parse_page(html):
    """Extract the page's embedded availability records into product/SKU rows."""
    match = re.search(r"\bconst\s+data\s*=\s*(\[.*?\])\s*;", html, re.DOTALL)
    if not match:
        raise ValueError("Could not find the embedded availability dataset.")
    records = json.loads(match.group(1))
    if not isinstance(records, list) or len(records) < 1000:
        raise ValueError(f"Unexpected availability dataset size: {len(records) if isinstance(records, list) else 'not a list'}.")

    region_geographies = {}
    entries = {}
    for record in records:
        if not isinstance(record, dict):
            raise ValueError("Availability dataset contains a malformed record.")
        region = record.get("RegionName")
        geography = record.get("GeographyName")
        product = record.get("OfferingName")
        sku = record.get("ProductSkuName") or ""
        state = record.get("CurrentState")
        if not all(isinstance(value, str) and value.strip() for value in (region, product, state)):
            raise ValueError("Availability dataset contains a record missing its region, product, or status.")
        region, product, sku = region.strip(), product.strip(), sku.strip()
        if region != "Non Regional":
            if not isinstance(geography, str) or not geography.strip():
                raise ValueError(f"Missing geography for region {region!r}.")
            previous_geography = region_geographies.setdefault(region, geography.strip())
            if previous_geography != geography.strip():
                raise ValueError(f"Conflicting geography names for region {region!r}.")
        if state not in STATUS_CLASSES:
            raise ValueError(f"Unknown availability status {state!r}.")

        key = (product, sku)
        entry = entries.setdefault(key, {"regions": {}, "nonRegional": None})
        availability = STATUS_CLASSES[state]
        if region == "Non Regional":
            if entry["nonRegional"] is not None and entry["nonRegional"] != availability:
                raise ValueError(f"Conflicting non-regional statuses for {product!r} / {sku!r}.")
            entry["nonRegional"] = availability
        else:
            if region in entry["regions"] and entry["regions"][region] != availability:
                raise ValueError(f"Conflicting statuses for {product!r} / {sku!r} in {region!r}.")
            entry["regions"][region] = availability

    if len(region_geographies) < 20 or len(entries) < 100:
        raise ValueError(
            f"Unexpected dataset coverage: {len(region_geographies)} regions and {len(entries)} product/SKU rows."
        )

    output_rows = []
    for (product, sku), availability in entries.items():
        output_rows.append(
            {
                "type": "sku" if sku else "product",
                "product": product,
                "sku": sku or None,
                "nonRegional": availability["nonRegional"],
                "regions": availability["regions"],
            }
        )
    regions = [
        {"name": name, "geography": geography}
        for name, geography in region_geographies.items()
    ]
    return regions, output_rows


def download(url):
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "text/html",
            "User-Agent": "multi-region-platform-data/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read().decode("utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--url", default=URL, help="source page URL")
    parser.add_argument("--html", help="read a saved HTML page instead of downloading")
    parser.add_argument("--out", default=OUT, help="output JSON path (default: .cache/product-availability.json)")
    args = parser.parse_args()

    try:
        if args.html:
            with open(args.html, encoding="utf-8") as source:
                html = source.read()
        else:
            html = download(args.url)
        regions, rows = parse_page(html)
        result = {
            "source": args.url if not args.html else os.path.abspath(args.html),
            "retrievedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "statusDefinitions": {
                "GA": "generally_available",
                "Preview": "public_preview",
                "Closing Down": "retiring",
            },
            "regions": regions,
            "rows": rows,
        }
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with open(args.out, "w", encoding="utf-8", newline="\n") as output:
            json.dump(result, output, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            output.write("\n")
    except (OSError, UnicodeError, urllib.error.URLError, TimeoutError, ValueError) as error:
        sys.exit(f"Product availability scrape failed; no output written: {error}")

    print(f"Wrote {len(rows)} product/SKU rows across {len(regions)} regions to {args.out}")


if __name__ == "__main__":
    main()
