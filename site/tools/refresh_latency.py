#!/usr/bin/env python3
"""Refresh the latency data that the region planning workbook reads.

    python3 site/tools/refresh_latency.py                   # download the three sources, write docs/data/
    python3 site/tools/refresh_latency.py --cache .cache    # keep the downloads in .cache and reuse them on the next run
    python3 site/tools/refresh_latency.py --min-pop 500000  # also list cities of 500,000 people or more

The workbook never calls the internet. It reads the two files this script writes to docs/data/, so run the
script when one of its sources changes (.github/workflows/refresh-data.yml does it every day) and publish the result.
Only the Python standard library is used, and the script runs on Python 3.10 or later.

Sources, all public files on GitHub:

  * Region to region: the P50 round-trip latency that Microsoft publishes in the "Azure network round-trip latency
    statistics" article (MicrosoftDocs/azure-docs). Each value is a 30-day median and is directional.
  * ExpressRoute peering locations and the Azure regions that are local to each one: the "Locations and connectivity
    providers for Azure ExpressRoute" article (MicrosoftDocs/azure-docs), section "Global commercial Azure".
  * Places: Natural Earth populated places (public domain). They give the coordinates of the peering locations, and
    the national capitals, first-level administrative capitals, and large cities that the workbook offers.

What is written:

  docs/data/latency.json         region to region, and peering location to region, in whole milliseconds, with a
                                 source code for every value
  docs/data/latency-cities.json  city to peering location, in whole milliseconds

What is measured and what is estimated:

  * Measured: region to region, for the pairs in Microsoft's table. The script copies those values unchanged.
  * Derived from a measured value: peering location to region, when the peering location has a local Azure region
    and Microsoft publishes the latency from that region to the target. The value is the short hop to the local
    region (an estimate) plus Microsoft's measured value from there.
  * Estimated from distance: every other value. That includes the pairs that Microsoft doesn't publish (regions
    added since the last dataset), peering locations without a local region, and every city. Nothing is measured
    from a city, and nothing public is measured between a peering location and a region.

The distance estimate is a straight line fitted to Microsoft's published pairs: great-circle kilometres against
the measured round trip. It carries the behavior of Microsoft's backbone, but real routes detour, so an estimate
can be well off for a single pair. The file records the fit and its error. Treat estimates as a planning aid and
confirm a shortlist by measuring from the customer's network.

Region coordinates come from site/data/regions-seed.json (approximate datacenter metro, not an exact address).
"""
import argparse, collections, csv, datetime, io, json, math, os, re, sys, time, unicodedata
import urllib.error, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SEED = os.path.join(ROOT, "site", "data", "regions-seed.json")
OUT = os.path.join(ROOT, "docs", "data")

SOURCES = {
    "latency": "https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/main/articles/networking/azure-network-latency.md",
    "peering": "https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/main/articles/expressroute/expressroute-locations-providers.md",
    "places": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson",
}
# file names inside --cache
CACHE_NAMES = {"latency": "latency.md", "peering": "er.md", "places": "ne.geojson"}

EARTH_KM = 6371.0088
# The smallest published round trip is 3 to 4 ms, between two regions on the same site (Australia Central and
# Central 2). A free fit puts the intercept near 5 ms, which would also add 5 ms to a city that sits next to its
# peering location. The intercept is fixed here and the slope is fitted.
INTERCEPT_MS = 3.0
MIN_MS = 1
SHORT_KM = 500
# A peering location and the Azure region it names as local are in the same metro area. Further apart than this,
# the place lookup picked the wrong city.
LOCAL_MAX_KM = 1000

# Natural Earth feature classes that are real places. Research stations and similar are left out.
PLACE_CLASSES = {"populated place", "admin-0 capital", "admin-0 capital alt", "admin-0 region capital",
                 "admin-1 capital", "admin-1 region capital"}

# Peering location names (without the site number) that need help. A location is looked up by its city name in
# Natural Earth. "search" names the place when the article and the data spell it differently; "cc" narrows it to
# one country. "place" gives the coordinates directly, for places that Natural Earth doesn't list. Where the
# article names a facility in a smaller town than the one the data knows, the coordinates are the facility's town.
PEERING_PLACES = {
    "Copenhagen":      {"search": "Kobenhavn"},
    "Quebec City":     {"search": "Quebec"},
    "Silicon Valley":  {"search": "San Jose", "cc": "US"},       # the sites are in San Jose and Santa Clara
    "Newport(Wales)":  {"place": ("Newport", "GB", 51.59, -2.99)},    # Natural Earth only has Newport, Rhode Island
    "Quincy":          {"place": ("Quincy", "US", 47.23, -119.85)},   # Natural Earth only has Quincy, Illinois
    "Washington DC":   {"place": ("Ashburn", "US", 39.04, -77.49)},   # the peering sites are in Ashburn, Virginia
}

# Natural Earth names that read badly in English, and country names that read badly anywhere.
CITY_NAMES = {"København": "Copenhagen"}
COUNTRY_NAMES = {"United States of America": "United States", "Hong Kong S.A.R.": "Hong Kong"}
# Natural Earth gives no ISO code to a few disputed places.
FALLBACK_CC = {"KOS": "XK"}


def log(*a):
    # a Windows console may not encode every place name; losing one character beats stopping the run
    msg = " ".join(str(x) for x in a)
    enc = sys.stderr.encoding or "utf-8"
    print(msg.encode(enc, "replace").decode(enc), file=sys.stderr, flush=True)


def die(*lines):
    sys.exit("\n".join(lines))


# ───────────────────────────── fetch
def download(url, tries=7):
    """GET with backoff. GitHub answers 429 and now and then 5xx under load."""
    delay = 2.0
    for attempt in range(1, tries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "multi-region-platform-data/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or attempt == tries:
                raise
            try:
                wait = min(float(e.headers.get("Retry-After") or delay), 120)
            except ValueError:
                wait = delay
            why = "the server is throttling requests (HTTP 429)" if e.code == 429 else f"the server answered HTTP {e.code}"
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            if attempt == tries:
                raise
            wait, why = delay, f"no usable answer ({type(e).__name__}: {e})"
        log(f"  {why}; waiting {wait:.0f}s, then trying again ({attempt} of {tries - 1})")
        time.sleep(wait)
        delay = min(delay * 2, 60)


def load_source(key, cache_dir):
    """The text of one source: from the cache folder if it holds a copy, else downloaded (and then cached)."""
    path = os.path.join(cache_dir, CACHE_NAMES[key]) if cache_dir else None
    if path and os.path.exists(path):
        log(f"  {key}: using {path}")
        with open(path, encoding="utf-8", newline="") as f:
            return f.read().replace("\r\n", "\n")
    log(f"  {key}: downloading {SOURCES[key]}")
    try:
        text = download(SOURCES[key]).replace("\r\n", "\n")
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        die(f"could not download the {key} source ({e}). Nothing was written.",
            "Run again, or use --cache with a folder that already holds " + CACHE_NAMES[key] + ".")
    if path:
        os.makedirs(cache_dir, exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
    return text


# ───────────────────────────── parse
def norm(s):
    return re.sub(r"\s+", "", s).casefold()


def parse_latency(text):
    """The dataset date and the published matrix: (date, region display names, {(from, to): ms})."""
    m = re.search(r"dataset dates from \*([^*]+)\*", text)
    if not m:
        die("the latency article no longer says when its dataset dates from; check the page layout.")
    block = re.search(r"```csv\n(.*?)\n```", text, re.S)
    if not block:
        die("the latency article has no csv block with the full table; check the page layout.")
    rows = list(csv.reader(io.StringIO(block.group(1))))
    header = rows[0]
    names = header[1:]
    if header[0] != "Source" or len(names) < 20 or len(rows) - 1 != len(names):
        die(f"the latency table has an unexpected shape ({len(rows) - 1} rows, {len(names)} columns).")
    cells = {}
    for row in rows[1:]:
        if len(row) != len(header) or row[0] not in names:
            die(f"the latency table has a malformed row: {row[:3]}")
        for to, v in zip(names, row[1:]):
            if v.strip() == "":
                continue
            try:
                ms = int(v)
            except ValueError:
                die(f"the latency table has a value that isn't a whole number: {row[0]} to {to}: {v!r}")
            if ms <= 0:
                die(f"the latency table has a value of {ms} ms: {row[0]} to {to}")
            cells[(row[0], to)] = ms
    return m.group(1).strip(), names, cells


def parse_peering(text):
    """[(name, [local region display names])] for the commercial cloud, in the order of the article."""
    start = text.find("### Global commercial Azure")
    if start < 0:
        die('the ExpressRoute article has no section "Global commercial Azure"; check the page layout.')
    end = text.find("\n### ", start + 5)
    out = []
    for line in text[start:end if end > 0 else len(text)].split("\n"):
        if not line.startswith("| **"):
            continue
        cells = [c.strip() for c in line.split("|")]
        if len(cells) < 7:
            die(f"a peering location row has fewer columns than expected: {line[:80]}")
        name = cells[1].replace("**", "").strip()
        local = [x.strip() for x in re.split(r"<br\s*/?>|,", cells[4]) if x.strip() and x.strip() != "&cross;"]
        out.append((name, local))
    if len(out) < 50 or len({n for n, _ in out}) != len(out):
        die(f"read {len(out)} peering locations, or some names repeat; check the page layout.")
    return out


def clean_name(s):
    """Single spaces, and no macrons: English writes Osaka and Kobe, where Natural Earth has Ōsaka and Kōbe."""
    s = unicodedata.normalize("NFD", s)
    s = unicodedata.normalize("NFC", s.replace("\u0304", ""))
    return re.sub(r"\s+", " ", s).strip()


def parse_places(text):
    """Natural Earth places as dicts with coordinates from the point geometry."""
    out = []
    for ft in json.loads(text)["features"]:
        p = ft["properties"]
        cls = (p.get("featurecla") or "").strip().lower()
        if cls not in PLACE_CLASSES:
            continue
        coords = (ft.get("geometry") or {}).get("coordinates") or [p["longitude"], p["latitude"]]
        cc = p.get("iso_a2") or ""
        if len(cc) != 2:
            cc = FALLBACK_CC.get(p.get("adm0_a3"), "")
        out.append({
            "name": clean_name(p["name"]), "ascii": clean_name(p.get("nameascii") or p["name"]), "cls": cls, "cc": cc,
            "adm0": p.get("adm0name") or "", "sov": p.get("sov0name") or "", "admin1": clean_name(p.get("adm1name") or ""),
            "lat": round(coords[1], 2), "lon": round(coords[0], 2), "pop": p.get("pop_max") or 0,
        })
    if len(out) < 5000:
        die(f"read only {len(out)} places; check the Natural Earth file.")
    return out


# ───────────────────────────── geometry and the distance model
def km_between(a, b):
    """Great-circle distance in km between two (lat, lon) points."""
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * EARTH_KM * math.asin(math.sqrt(min(1.0, h)))


def weighted_median(pairs):
    pairs = sorted(pairs)
    half, acc = sum(w for _, w in pairs) / 2, 0.0
    for v, w in pairs:
        acc += w
        if acc >= half:
            return v


def median(v):
    v = sorted(v)
    n = len(v)
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2


def fit_model(pairs):
    """Fit ms = INTERCEPT_MS + b * km to [(km, ms)], never below MIN_MS.

    The slope minimises the sum of relative errors |model - ms| / ms. That is a weighted median of the per-pair
    slopes, so the answer is exact and a few detouring routes can't drag it. A plain least-squares line is pulled
    up by those routes: it adds about 15 ms to every short hop.
    """
    b = weighted_median([((ms - INTERCEPT_MS) / km, km / ms) for km, ms in pairs if km > 0])
    b = round(b, 6)

    def est(km):
        return max(MIN_MS, int(math.floor(INTERCEPT_MS + b * km + 0.5)))

    ms_all = [ms for _, ms in pairs]
    mean = sum(ms_all) / len(ms_all)
    fit = [max(MIN_MS, INTERCEPT_MS + b * km) for km, _ in pairs]
    sse = sum((f - ms) ** 2 for f, (_, ms) in zip(fit, pairs))
    sst = sum((ms - mean) ** 2 for ms in ms_all)
    err = [abs(f - ms) for f, (_, ms) in zip(fit, pairs)]
    short = [e for e, (km, _) in zip(err, pairs) if km < SHORT_KM]
    long_ = [e for e, (km, _) in zip(err, pairs) if km >= SHORT_KM]
    stats = {"a": INTERCEPT_MS, "b": b, "r2": round(1 - sse / sst, 3), "pairs": len(pairs),
             "medianAbsError": round(median(err), 1)}
    return est, stats, round(median(short), 1), round(median(long_), 1)


# ───────────────────────────── regions
def load_seed():
    with open(SEED, encoding="utf-8") as f:
        seed = json.load(f)
    regions = {}
    for r in seed["regions"]:
        if isinstance(r.get("lat"), (int, float)) and isinstance(r.get("lon"), (int, float)):
            regions[r["id"]] = r
        else:
            log(f"  warning: region {r['id']} has no coordinates in the seed file and is left out")
    return regions


# ───────────────────────────── places
class Places:
    def __init__(self, places):
        self.all = places
        self.by_name = {}
        for p in places:
            for key in {p["name"].casefold(), p["ascii"].casefold()}:
                self.by_name.setdefault(key, []).append(p)
        # A country is its ISO code. Natural Earth files French Guiana, Guadeloupe and the like under France, and
        # names the Chatham Islands as a country of their own; the code keeps each place with the country it is in.
        names = collections.defaultdict(collections.Counter)
        for p in places:
            if p["cc"]:
                names[p["cc"]][COUNTRY_NAMES.get(p["adm0"], p["adm0"])] += 1
        self.country_of_cc = {cc: c.most_common(1)[0][0] for cc, c in names.items()}

    def nearest(self, pt):
        return min(self.all, key=lambda p: km_between(pt, (p["lat"], p["lon"])))


def peering_base(name):
    """The city part of a peering location name: drop the site number, a qualifier in brackets, and 'SAR'."""
    s = re.sub(r"\s*\(.*?\)", "", name)
    s = re.sub(r"\d+$", "", s).strip()
    return re.sub(r"\s+SAR$", "", s).strip()


def resolve_peering(name, local_pts, places):
    """(city, country, cc, lat, lon) for a peering location, or None.

    When several places share the name, the one closest to the location's local Azure region wins, because the
    local region is in the same metro area. Without a local region the largest place wins.
    """
    key = re.sub(r"(?<=\D)\d+$", "", name)
    rule = PEERING_PLACES.get(key, {})
    if "place" in rule:
        city, cc, lat, lon = rule["place"]
        return city, places.country_of_cc.get(cc, cc), cc, lat, lon
    cands = places.by_name.get(rule.get("search", peering_base(name)).casefold(), [])
    if "cc" in rule:
        cands = [p for p in cands if p["cc"] == rule["cc"]]
    if not cands:
        return None
    if local_pts:
        best = min(cands, key=lambda p: min(km_between((p["lat"], p["lon"]), q) for q in local_pts))
    else:
        best = max(cands, key=lambda p: p["pop"])
    return CITY_NAMES.get(best["name"], best["name"]), places.country_of_cc.get(best["cc"], best["adm0"]), best["cc"], best["lat"], best["lon"]


def kind_of(p, min_pop):
    c = p["cls"]
    if c in ("admin-0 capital", "admin-0 capital alt"):
        return "capital"
    # the capital of an entity that has its own country entry (Hong Kong) counts as a national capital; the capital of
    # a nation inside a country (Edinburgh, Cardiff) counts as a first-level capital
    if c == "admin-0 region capital":
        return "capital" if p["adm0"] != p["sov"] else "state"
    if c in ("admin-1 capital", "admin-1 region capital"):
        return "state"
    if c == "populated place" and p["pop"] >= min_pop:
        return "city"
    return None


# ───────────────────────────── write
def dump(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def write_if_changed(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    try:
        with open(path, encoding="utf-8") as f:
            if f.read() == text:
                return False
    except OSError:
        pass
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    return True


def keep_old_timestamp(path, doc):
    """Reuse the old 'generated' value when nothing else changed, so an unchanged dataset is an unchanged file."""
    try:
        with open(path, encoding="utf-8") as f:
            old = json.load(f)
    except (OSError, ValueError):
        return
    if isinstance(old, dict) and "generated" in old and {**old, "generated": doc["generated"]} == doc:
        doc["generated"] = old["generated"]


def refuse_shrunken(path, peering_count, pair_count):
    """Stop when a source has lost a large part of its content since the last run, as when an article is edited badly."""
    try:
        with open(path, encoding="utf-8") as f:
            old = json.load(f)
        old_peering, old_pairs = len(old["peering"]), old["model"]["pairs"]
    except (OSError, ValueError, KeyError, TypeError):
        return
    if peering_count < 0.8 * old_peering or pair_count < 0.8 * old_pairs:
        die(f"the sources now give {peering_count} peering locations and {pair_count} published region pairs, "
            f"against {old_peering} and {old_pairs} in {path}. That looks like a damaged source, so the existing data was kept.",
            "If the change is real, delete the old file and run again.")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out", default=OUT, help="output folder (default: docs/data)")
    ap.add_argument("--cache", metavar="DIR", help="read the sources from this folder if they are there, and save downloads to it")
    ap.add_argument("--min-pop", type=int, default=1000000, help="smallest population for a city that is neither a capital nor a state capital (default 1000000)")
    args = ap.parse_args()

    log("reading the sources …")
    dataset, csv_names, published_by_name = parse_latency(load_source("latency", args.cache))
    peering_rows = parse_peering(load_source("peering", args.cache))
    places = Places(parse_places(load_source("places", args.cache)))

    # ── regions and the published matrix
    seed = load_seed()
    ids = sorted(seed)
    idx = {r: i for i, r in enumerate(ids)}
    by_norm = {norm(r["name"]): r["id"] for r in seed.values()}
    unknown = []

    def region_id(display):
        rid = by_norm.get(norm(display))
        if rid is None and display not in unknown:
            unknown.append(display)
        return rid

    published = {}
    for (src, dst), ms in published_by_name.items():
        a, b = region_id(src), region_id(dst)
        if a and b and a != b:
            published[(a, b)] = ms
    pt = {r: (seed[r]["lat"], seed[r]["lon"]) for r in ids}

    # ── the distance model, fitted on the published pairs (mean of the two directions)
    fit_pairs = []
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            v = [published[k] for k in ((a, b), (b, a)) if k in published]
            if v:
                fit_pairs.append((km_between(pt[a], pt[b]), sum(v) / len(v)))
    if len(fit_pairs) < 100:
        die(f"only {len(fit_pairs)} published region pairs match the seed file; the distance model needs more.")
    est, model, short_err, long_err = fit_model(fit_pairs)
    model["note"] = (
        f"Estimated round trip in ms = {INTERCEPT_MS:g} + {model['b']:.4f} x great-circle km, and never below {MIN_MS}. "
        f"The slope is fitted to {model['pairs']} published region pairs; the median error on those pairs is "
        f"{short_err:g} ms under {SHORT_KM} km and {long_err:g} ms from {SHORT_KM} km, and a route that detours can be much further off."
    )
    log(f"  model: {INTERCEPT_MS:g} ms + {model['b']} ms/km, r2 {model['r2']}, median error {model['medianAbsError']} ms "
        f"({short_err} ms under {SHORT_KM} km, {long_err} ms above), {model['pairs']} pairs")

    # ── region to region
    rr, rr_src = [], []
    for a in ids:
        row, src = [], []
        for b in ids:
            if a == b:
                row.append(0), src.append("-")
            elif (a, b) in published:
                row.append(published[(a, b)]), src.append("m")
            else:
                row.append(est(km_between(pt[a], pt[b]))), src.append("d")
        rr.append(row)
        rr_src.append("".join(src))
    has_row = {a for a, _ in published}      # regions that have a published row: a usable local region

    # ── peering locations
    problems, peering = [], []
    for name, local_names in peering_rows:
        local = []
        for ln in local_names:
            rid = region_id(ln)
            if rid:
                local.append(rid)
        found = resolve_peering(name, [pt[r] for r in local], places)
        if found is None:
            problems.append(f"{name}: no place called '{peering_base(name)}' in the places file; add it to PEERING_PLACES")
            continue
        city, country, cc, lat, lon = found
        too_far = [(r, km_between((lat, lon), pt[r])) for r in local]
        far = [f"{r} {d:,.0f} km" for r, d in too_far if d > LOCAL_MAX_KM]
        if local and len(far) == len(local):
            problems.append(f"{name}: resolved to {city}, {country}, which is {', '.join(far)} from its local region; "
                            "pick the right place in PEERING_PLACES")
            continue
        peering.append({"name": name, "city": city, "country": country, "cc": cc, "lat": lat, "lon": lon, "local": sorted(local)})
    if problems:
        die("peering locations that could not be placed:", *("  " + p for p in problems), "Nothing was written.")
    peering.sort(key=lambda p: p["name"])

    pr, pr_src = [], []
    for p in peering:
        loc = (p["lat"], p["lon"])
        row, src = [], []
        for r in ids:
            direct = est(km_between(loc, pt[r]))
            # through a local region: its short hop plus Microsoft's measured value onward. Only a measured onward leg
            # counts; for the local region itself there is no onward leg, so the hop is the whole value and an estimate.
            via = [est(km_between(loc, pt[l])) + published[(l, r)]
                   for l in p["local"] if l != r and (l, r) in published]
            if r not in p["local"] and via:
                row.append(min(via)), src.append("l")
            else:
                row.append(direct), src.append("d")
        pr.append(row)
        pr_src.append("".join(src))

    # ── cities
    countries = {places.nearest(pt[r])["cc"] for r in ids} | {places.nearest((p["lat"], p["lon"]))["cc"] for p in peering}
    countries.discard("")
    chosen = {}
    rank = {"capital": 0, "state": 1, "city": 2}
    for pl in places.all:
        if pl["cc"] not in countries:
            continue
        k = kind_of(pl, args.min_pop)
        if k is None:
            continue
        key = (pl["name"], pl["cc"], pl["admin1"])
        if key not in chosen or rank[k] < rank[chosen[key][0]]:
            chosen[key] = (k, pl)
    # two places of one name in one country can't be told apart in the list; the state goes in brackets for both
    same_name = collections.Counter((pl["name"], pl["cc"]) for _, pl in chosen.values())
    cities = []
    for k, pl in chosen.values():
        n, a = CITY_NAMES.get(pl["name"], pl["name"]), pl["ascii"]
        if same_name[(pl["name"], pl["cc"])] > 1 and pl["admin1"]:
            n, a = f"{n} ({pl['admin1']})", f"{a} ({pl['admin1']})"
        cities.append({"n": n, "a": a, "c": places.country_of_cc[pl["cc"]], "cc": pl["cc"], "k": k, "lat": pl["lat"], "lon": pl["lon"]})
    cities.sort(key=lambda c: (c["c"].casefold(), c["a"].casefold(), c["n"], c["lat"], c["lon"]))
    cp = [[est(km_between((c["lat"], c["lon"]), (p["lat"], p["lon"]))) for p in peering] for c in cities]

    # ── write
    generated = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    main_doc = {"generated": generated, "dataset": dataset, "sources": SOURCES, "model": model, "regions": ids,
                "rr": rr, "rrSrc": rr_src, "peering": peering, "pr": pr, "prSrc": pr_src}
    cities_doc = {"peering": [p["name"] for p in peering], "cities": cities, "cp": cp}
    main_path = os.path.join(args.out, "latency.json")
    refuse_shrunken(main_path, len(peering), model["pairs"])
    keep_old_timestamp(main_path, main_doc)
    changed = write_if_changed(main_path, dump(main_doc))
    changed += write_if_changed(os.path.join(args.out, "latency-cities.json"), dump(cities_doc))

    if unknown:
        log("  warning: these regions are in the sources but have no coordinates in site/data/regions-seed.json (add them, with lat and lon): "
            + ", ".join(sorted(unknown)))
    no_row = [r for r in ids if r not in has_row]
    if no_row:
        log("  regions without published latency (every value for them is an estimate): " + ", ".join(no_row))
    log(f"wrote {len(ids)} regions, {len(peering)} peering locations, {len(cities)} cities in {len(countries)} countries "
        f"to {args.out} ({changed} file(s) changed); dataset {dataset}")


if __name__ == "__main__":
    main()
