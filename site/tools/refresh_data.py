#!/usr/bin/env python3
"""Refresh the Azure reference data that the region planning workbook reads.

    python3 site/tools/refresh_data.py              # full refresh: the whole consumption price list, page by page
    python3 site/tools/refresh_data.py --max-pages 20   # quick partial run, to test the pipeline
    python3 site/tools/refresh_data.py --arm        # also read region metadata from 'az account list-locations'

The workbook (docs/region-planner.html) never calls Azure. It reads the snapshot that this script writes to
docs/data/, so run the script on a schedule (see .github/workflows/refresh-data.yml) and publish the result.

Source: the Azure Retail Prices API (https://prices.azure.com/api/retail/prices). It is public and needs no sign-in.
Only the Python standard library is used.

What is written:

  docs/data/meta.json              when the snapshot was taken and what it holds
  docs/data/catalog.json           regions (with geography, zones, pairing) and services, with the regions each
                                   service has consumption meters in
  docs/data/products.json          the same, one level down: products of each service by region
  docs/data/pricing/<region>.json  for one baseline region: the median price difference of every service in
                                   every other region, over the meters that exist in both

Two things to know about the data:

  * Availability is derived from pricing. A service counts as available in a region when the price list has a
    consumption meter for it there. That is a good first filter, not a guarantee: confirm SKUs, features, and
    preview status on "Products available by region" before a decision depends on it.
  * The price comparison uses list prices in USD for consumption meters. Spot, low-priority, dev/test,
    reservation, and savings-plan prices are left out, and so are negotiated discounts.

Geography, availability-zone support, and region pairing aren't in the price list. They come from
site/data/regions-seed.json, or from Azure Resource Manager when you pass --arm or --locations.
"""
import argparse, datetime, json, os, re, shutil, statistics, subprocess, sys, time
import urllib.error, urllib.parse, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
API = "https://prices.azure.com/api/retail/prices"
SEED = os.path.join(ROOT, "site", "data", "regions-seed.json")
OUT = os.path.join(ROOT, "docs", "data")

# Region names in the price list that aren't public Azure regions (sovereign clouds, staging, edge zones).
NOT_PUBLIC = re.compile(r"^(usgov|usdod|ussec|usnat|china|att|global$)|(stg|stage|euap)$")
REGION_ID = re.compile(r"[a-z][a-z0-9]+")
# Meters that aren't comparable list prices.
NOT_COMPARABLE = re.compile(r"\b(spot|low priority)\b", re.I)


def log(*a):
    print(*a, file=sys.stderr, flush=True)


# ───────────────────────────── fetch
def get_json(url, tries=7):
    """GET with backoff. The API throttles with 429 and now and then answers 5xx."""
    delay = 2.0
    for attempt in range(1, tries + 1):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "multi-region-platform-data/1.0"})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or attempt == tries:
                raise
            try:
                wait = min(float(e.headers.get("Retry-After") or delay), 120)
            except ValueError:
                wait = delay
            why = "the API is throttling requests (HTTP 429)" if e.code == 429 else f"the API answered HTTP {e.code}"
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError) as e:
            if attempt == tries:
                raise
            wait, why = delay, f"no usable answer ({type(e).__name__}: {e})"
        log(f"  {why}; waiting {wait:.0f}s, then trying again ({attempt} of {tries - 1})")
        time.sleep(wait)
        delay = min(delay * 2, 60)


def fetch_items(api, max_pages=0):
    """Yield every consumption price item, following NextPageLink."""
    url = api + "?$filter=" + urllib.parse.quote("priceType eq 'Consumption'")
    page, total, t0 = 0, 0, time.time()
    while url:
        data = get_json(url)
        page += 1
        items = data.get("Items") or []
        total += len(items)
        yield from items
        if page == 1:
            log(f"  first page received ({len(items)} items); the full price list is several hundred pages")
        elif page % 25 == 0:
            log(f"  page {page}: {total} items so far, {time.time() - t0:.0f}s")
        if max_pages and page >= max_pages:
            log(f"  stopped after {page} pages (--max-pages)")
            return
        url = data.get("NextPageLink")


# ───────────────────────────── region metadata
def load_seed():
    seed = json.load(open(SEED, encoding="utf-8"))
    return {r["id"]: r for r in seed["regions"]}, seed.get("reviewed", "")


def load_arm(path=None):
    """Region metadata from Azure Resource Manager: a saved file, or the az CLI if it is signed in."""
    if path:
        raw = json.load(open(path, encoding="utf-8-sig"))
    else:
        az = shutil.which("az")
        if not az:
            log("  az CLI not found; using the seed file for region metadata")
            return {}
        res = subprocess.run([az, "account", "list-locations", "-o", "json"], capture_output=True, text=True)
        if res.returncode:
            log("  az account list-locations failed; using the seed file for region metadata")
            return {}
        raw = json.loads(res.stdout)
    out = {}
    for loc in raw.get("value", []) if isinstance(raw, dict) else raw:
        md = loc.get("metadata") or {}
        if md.get("regionType") != "Physical":
            continue
        pair = (md.get("pairedRegion") or [{}])[0].get("name")
        out[loc["name"].lower()] = {
            "name": loc.get("displayName"), "geo": md.get("geography"), "group": md.get("geographyGroup"),
            "loc": md.get("physicalLocation"), "zones": bool(loc.get("availabilityZoneMappings")), "pair": pair,
        }
    return out


# ───────────────────────────── aggregate
def aggregate(items):
    names, family = {}, {}
    svc_regions, prod_regions = {}, {}
    prices = {}          # service -> meter key -> region -> (rank, price)
    count = 0
    for it in items:
        count += 1
        if (it.get("type") or "Consumption") != "Consumption":
            continue
        svc, region = (it.get("serviceName") or "").strip(), (it.get("armRegionName") or "").strip().lower()
        if not svc:
            continue
        family.setdefault(svc, it.get("serviceFamily") or "")
        prod = (it.get("productName") or "").strip()
        svc_regions.setdefault(svc, set()).add(region)
        prod_regions.setdefault(svc, {}).setdefault(prod, set()).add(region)
        if region and it.get("location"):
            names.setdefault(region, it["location"])
        price = it.get("retailPrice") or 0
        sku, meter = it.get("skuName") or "", it.get("meterName") or ""
        if not region or price <= 0 or NOT_COMPARABLE.search(sku) or NOT_COMPARABLE.search(meter):
            continue
        key = (prod, sku, meter, it.get("unitOfMeasure") or "", it.get("tierMinimumUnits") or 0)
        rank = (bool(it.get("isPrimaryMeterRegion")), it.get("effectiveStartDate") or "")
        slot = prices.setdefault(svc, {}).setdefault(key, {})
        if region not in slot or rank > slot[region][0]:
            slot[region] = (rank, price)
    return count, names, family, svc_regions, prod_regions, prices


def pick_regions(svc_regions, seed, arm, min_services):
    """Public regions seen in the price list. A region that isn't in the reference data is kept when it carries enough services."""
    counts = {}
    for regs in svc_regions.values():
        for r in regs:
            counts[r] = counts.get(r, 0) + 1
    keep = []
    for r, n in counts.items():
        if not REGION_ID.fullmatch(r) or NOT_PUBLIC.search(r):
            continue
        if r in seed or r in arm or n >= min_services:
            keep.append(r)
    return sorted(keep), counts


def mask(regs, ridx):
    """Regions as a hex string: region i is bit (i % 4) of hex digit (i // 4)."""
    nib = [0] * ((len(ridx) + 3) // 4)
    for r in regs:
        i = ridx.get(r)
        if i is not None:
            nib[i >> 2] |= 1 << (i & 3)
    return "".join("%x" % v for v in nib)


def compare_prices(prices, region_ids):
    """For each baseline region and service: median price difference (percent) per other region, and the meters it rests on."""
    ridx = {r: i for i, r in enumerate(region_ids)}
    n_reg = len(region_ids)
    out = {r: {} for r in region_ids}
    for svc in sorted(prices):
        meters = []
        for slot in prices[svc].values():
            m = [(ridx[r], v[1]) for r, v in slot.items() if r in ridx]
            if len(m) > 1:
                meters.append(m)
        if not meters:
            continue
        with_region = [[] for _ in range(n_reg)]
        for m in meters:
            for i, p in m:
                with_region[i].append((m, p))
        for b in range(n_reg):
            if not with_region[b]:
                continue
            ratios = [[] for _ in range(n_reg)]
            for m, base in with_region[b]:
                for i, p in m:
                    ratios[i].append(p / base)
            pct, n = [None] * n_reg, [0] * n_reg
            for i in range(n_reg):
                if i != b and ratios[i]:
                    pct[i] = round((statistics.median(ratios[i]) - 1) * 100, 1) + 0.0
                    n[i] = len(ratios[i])
            if any(n):
                out[region_ids[b]][svc] = {"p": pct, "n": n}
    return out


# ───────────────────────────── write
def dump(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def write_if_changed(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    try:
        if open(path, encoding="utf-8").read() == text:
            return False
    except OSError:
        pass
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out", default=OUT, help="output folder (default: docs/data)")
    ap.add_argument("--api-url", default=API, help="price list endpoint (for tests)")
    ap.add_argument("--max-pages", type=int, default=0, help="stop after N pages; the snapshot is marked partial")
    ap.add_argument("--arm", action="store_true", help="read region metadata from 'az account list-locations'")
    ap.add_argument("--locations", help="file saved from 'az account list-locations -o json', instead of --arm")
    ap.add_argument("--min-services", type=int, default=15, help="keep a region that isn't in the reference data when it has at least this many services")
    ap.add_argument("--force", action="store_true", help="write even if the new snapshot is much smaller than the last one")
    args = ap.parse_args()

    seed, reviewed = load_seed()
    arm = load_arm(args.locations) if (args.arm or args.locations) else {}
    log("reading the Azure Retail Prices API …")
    t0 = time.time()
    count, names, family, svc_regions, prod_regions, prices = aggregate(fetch_items(args.api_url, args.max_pages))
    log(f"  {count} price items in {time.time() - t0:.0f}s")

    region_ids, counts = pick_regions(svc_regions, seed, arm, args.min_services)
    if not region_ids:
        sys.exit("no regions found in the price list; nothing written")
    ridx = {r: i for i, r in enumerate(region_ids)}

    # don't replace a good snapshot with a broken one
    old_path = os.path.join(args.out, "catalog.json")
    if os.path.exists(old_path) and not args.force and not args.max_pages:
        old = json.load(open(old_path, encoding="utf-8"))
        if len(region_ids) < 0.7 * len(old.get("regions", [])) or len(svc_regions) < 0.7 * len(old.get("services", [])):
            sys.exit(f"snapshot looks incomplete ({len(region_ids)} regions, {len(svc_regions)} services); "
                     "kept the existing data. Use --force to write anyway.")

    regions = []
    for r in region_ids:
        ref = {**seed.get(r, {}), **{k: v for k, v in arm.get(r, {}).items() if v is not None}}
        regions.append({
            "id": r, "name": ref.get("name") or names.get(r) or r, "geo": ref.get("geo") or "", "group": ref.get("group") or "Other",
            "loc": ref.get("loc") or "", "zones": ref.get("zones"), "pair": ref.get("pair"),
            "access": seed.get(r, {}).get("access", ""), "services": counts[r], "known": r in seed or r in arm,
        })

    services, products = [], {}
    for svc in sorted(svc_regions):
        regs = svc_regions[svc]
        is_regional = any(r in ridx for r in regs)
        # "global": the service also has meters that belong to no region (for example, global or zone-based billing)
        services.append({"name": svc, "family": family.get(svc, ""), "r": mask(regs, ridx),
                         "global": any(not r or r == "global" or not REGION_ID.fullmatch(r) for r in regs)})
        if is_regional:
            products[svc] = {p: mask(rg, ridx) for p, rg in sorted(prod_regions[svc].items()) if p}

    log("comparing prices …")
    t0 = time.time()
    pricing = compare_prices(prices, region_ids)
    log(f"  done in {time.time() - t0:.0f}s")

    changed = 0
    changed += write_if_changed(os.path.join(args.out, "catalog.json"), dump({"regions": regions, "services": services}))
    changed += write_if_changed(os.path.join(args.out, "products.json"), dump({"regions": region_ids, "services": products}))
    pdir = os.path.join(args.out, "pricing")
    for r in region_ids:
        changed += write_if_changed(os.path.join(pdir, r + ".json"), dump({"baseline": r, "regions": region_ids, "services": pricing[r]}))
    if os.path.isdir(pdir):
        for f in os.listdir(pdir):
            if f.endswith(".json") and f[:-5] not in ridx:
                os.remove(os.path.join(pdir, f))
    meta = {
        "generated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "Azure Retail Prices API", "currency": "USD", "items": count,
        "regions": len(regions), "services": len(services), "partial": bool(args.max_pages),
        "regionMetadata": "Azure Resource Manager" if arm else f"reference file, reviewed {reviewed}",
    }
    write_if_changed(os.path.join(args.out, "meta.json"), dump(meta))
    unknown = [r["id"] for r in regions if not r["known"]]
    if unknown:
        log("  regions without reference data (add them to site/data/regions-seed.json or use --arm): " + ", ".join(unknown))
    log(f"wrote {len(regions)} regions, {len(services)} services to {args.out} ({changed} data file(s) changed)")


if __name__ == "__main__":
    main()
