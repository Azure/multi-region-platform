#!/usr/bin/env python3
"""Cache Azure Retail Prices API records that are not keyed to a regular Azure region.

    python site/tools/fetch_nonregional_prices.py

The regional cache is filtered by armRegionName, so records whose armRegionName is blank,
"Global", or a billing zone (for example Front Door "Zone 1", NAT Gateway "Global",
Azure Red Hat OpenShift "") are never captured. This tool saves them to
temp/nonregional_price_cache/<label>.json.gz in the same snapshot format.
"""
import argparse
import gzip
import json
import pathlib
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
DEFAULT_CACHE = ROOT / "temp" / "nonregional_price_cache"
API = "https://prices.azure.com/api/retail/prices"
API_VERSION = "2023-01-01-preview"
DEFAULT_VALUES = [
    "",
    "Global",
    "Zone 1",
    "Zone 2",
    "Zone 3",
    "Zone 4",
    "Zone 5",
    "Zone 6",
    "US Gov",
    "US Gov Zone 1",
    "US Gov Zone 2",
    "US Gov Zone 3",
    "DE Zone 1",
    "DE Zone 2",
    "DE Zone 3",
    "EU Zone 1",
    "EU Zone 2",
    "Intercontinental",
]


def label_for(value):
    return "blank" if value == "" else value.strip().casefold().replace(" ", "-")


def get_json(url, retries=8):
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                return json.load(response)
        except Exception as error:
            if attempt == retries - 1:
                raise
            delay = min(2 ** attempt, 30)
            print(f"  retry {attempt + 1} after {error!r}; sleeping {delay}s")
            time.sleep(delay)


def fetch(value):
    odata = f"priceType eq 'Consumption' and armRegionName eq '{value}'"
    params = {"$filter": odata, "api-version": API_VERSION, "currencyCode": "USD"}
    url = f"{API}?{urllib.parse.urlencode(params)}"
    started = datetime.now(timezone.utc).isoformat()
    items, pages, next_url = [], 0, url
    while next_url:
        page = get_json(next_url)
        pages += 1
        items.extend(page.get("Items", []))
        next_url = page.get("NextPageLink")
    return {
        "region": value,
        "label": label_for(value),
        "complete": True,
        "url": url,
        "started": started,
        "finished": datetime.now(timezone.utc).isoformat(),
        "pages": pages,
        "items": items,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--cache-dir", type=pathlib.Path, default=DEFAULT_CACHE)
    parser.add_argument("--values", nargs="*", default=None, help="armRegionName values to fetch")
    args = parser.parse_args()
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    for value in DEFAULT_VALUES if args.values is None else args.values:
        snapshot = fetch(value)
        count = len(snapshot["items"])
        print(f"[{value}] {count} records, {snapshot['pages']} pages")
        if not count:
            continue
        path = args.cache_dir / f"{snapshot['label']}.json.gz"
        with gzip.open(path, "wt", encoding="utf-8") as target:
            json.dump(snapshot, target, ensure_ascii=False)


if __name__ == "__main__":
    main()
