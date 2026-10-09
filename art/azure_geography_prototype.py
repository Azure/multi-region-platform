#!/usr/bin/env python3
"""Render the European customer scenario as a standalone SVG and PNG.

Run: python art/azure_geography_prototype.py
Requires the repository's Playwright dependency and Chromium.
Natural Earth public-domain basemaps are downloaded into .cache/latency/.
"""
import html
import itertools
import json
import math
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "latency"
W, H = 2160, 1540
MAP = (76, 352, 1496, 682)
SOURCES = {
    "europe-countries.geojson": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
    "europe-admin1-10m.geojson": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces_lines.geojson",
}
REGION_SOURCE = "https://learn.microsoft.com/azure/reliability/regions-list"
PEERING_SOURCE = "https://learn.microsoft.com/azure/expressroute/expressroute-locations-providers"
SELECTED = [
    ("WEU", "westeurope", "current"),
    ("NEU", "northeurope", "current"),
    ("SWE", "swedencentral", "candidate"),
    ("DKE", "denmarkeast", "candidate"),
    ("ITN", "italynorth", "candidate"),
]
PEERING = [
    ("FRA", "Frankfurt", "Germany", 8.68, 50.11),
    ("DUB", "Dublin", "Ireland", -6.26, 53.35),
]
COUNTRY_LABELS = [
    ("IRELAND", -8.9, 52.5), ("UNITED KINGDOM", -3.5, 55.8),
    ("FRANCE", 1.2, 46.8), ("SPAIN", -3.8, 41.5),
    ("GERMANY", 11.1, 51.2), ("NORWAY", 7.7, 61),
    ("SWEDEN", 14, 62), ("FINLAND", 25, 61),
    ("DENMARK", 8.8, 56), ("POLAND", 20, 52),
    ("ITALY", 12.8, 43.4), ("AUSTRIA", 13.7, 47.6),
    ("SWITZERLAND", 7.5, 46.8), ("BELGIUM", 3.6, 50.3),
    ("NETHERLANDS", 5.8, 53.5),
]
CSS = """
:root {
  --cp-bg: #f7f4ef;
  --cp-bg-elevated: #fcfbf8;
  --cp-surface: #ffffff;
  --cp-surface-soft: #f5f5f5;
  --cp-border: #dedede;
  --cp-border-strong: #919191;
  --cp-text: #242424;
  --cp-text-muted: #5c5c5c;
  --cp-text-soft: #6f6f6f;
  --cp-accent: #b11f4b;
  --cp-accent-soft: rgba(177, 31, 75, 0.08);
  --cp-accent-fg: #ffffff;
  --cp-link: #0078d4;
}
text { font-family: "Segoe UI", Aptos, Calibri, sans-serif; fill: var(--cp-text); }
.muted { fill: var(--cp-text-muted); }
.soft { fill: var(--cp-text-soft); }
.accent { fill: var(--cp-accent); }
.mono { font-family: Consolas, "Courier New", monospace; }
.country { fill: var(--cp-surface-soft); stroke: var(--cp-border-strong); stroke-width: 1; stroke-linejoin: round; }
.admin { fill: none; stroke: var(--cp-border); stroke-width: .6; }
svg:not([data-show-candidate-peering]) [data-layer="candidate-peering"],
svg:not([data-show-other-regions]) [data-layer="other-regions"],
svg[data-hide-current-new] [data-layer="current-new"],
svg[data-hide-current-peering] [data-layer="current-peering"] { display: none; }
[data-toggle] { cursor: pointer; }
[data-toggle]:focus-visible > rect { stroke: var(--cp-accent); stroke-width: 3; }
[data-toggle] .toggle-track { fill: var(--cp-border); }
[data-toggle] .toggle-knob { fill: var(--cp-surface); }
[data-toggle][aria-checked="true"] .toggle-track { fill: var(--cp-accent); }
[data-toggle][aria-checked="true"] .toggle-knob { transform: translateX(20px); }
"""

LAYERS = [
    ("current-new", "Existing regions to new regions", "6 regional comparisons", True),
    ("current-peering", "Peering to existing regions", "Frankfurt + Dublin to West + North Europe", True),
    ("candidate-peering", "Peering to new regions", "Optional: both peering locations to all candidates", False),
    ("other-regions", "Other region-to-region links", "Optional: existing pair + candidate-to-candidate", False),
]


def comparison_layer(a, b, kind, points):
    if kind == "peering":
        return "candidate-peering" if points[b]["kind"] == "candidate" else "current-peering"
    return "current-new" if points[a]["kind"] != points[b]["kind"] else "other-regions"


def load_source(name):
    path = CACHE / name
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(SOURCES[name], timeout=90) as response:
            data = response.read()
        json.loads(data)
        path.write_bytes(data)
    return json.loads(path.read_text(encoding="utf-8"))


def project(lon, lat):
    """Mercator viewport covering the selected European customer footprint."""
    def mercator(latitude):
        return math.log(math.tan(math.pi / 4 + math.radians(latitude) / 2))
    left, right, bottom, top = -14, 30, 39, 64
    x0, y0, width, height = MAP
    scale = min(width / math.radians(right-left), height / (mercator(top)-mercator(bottom)))
    ox = x0 + (width - math.radians(right-left)*scale)/2
    return ox + math.radians(lon-left)*scale, y0 + (mercator(top)-mercator(lat))*scale


def distance(a, b):
    lat1, lat2 = math.radians(a["lat"]), math.radians(b["lat"])
    h = (math.sin((lat2-lat1)/2)**2 +
         math.cos(lat1)*math.cos(lat2)*math.sin(math.radians(b["lon"]-a["lon"])/2)**2)
    return 2 * 6371.0088 * math.asin(math.sqrt(min(1, h)))


def metrics(a, b):
    km = distance(a, b)
    return round(3 + km*.018), round(km)


def path_data(lines, closed=False):
    commands = []
    for line in lines:
        points = [project(*p[:2]) for p in line]
        commands.append("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in points) + (" Z" if closed else ""))
    return " ".join(commands)


def overlaps(a, b, margin=5):
    return (a[0] < b[0]+b[2]+margin and a[0]+a[2]+margin > b[0]
            and a[1] < b[1]+b[3]+margin and a[1]+a[3]+margin > b[1])


def curve_point(start, control, end, t):
    return tuple((1-t)**2*a + 2*(1-t)*t*b + t*t*c
                 for a, b, c in zip(start, control, end))


def latency_box(start, control, end, occupied, width=34, height=16):
    """Keep badges on their own curve where possible; disclose offset with a leader."""
    options = []
    offsets = [(0, y) for y in (0, 22, -22, 44, -44, 70, -70, 100, -100)]
    offsets += [(x, y) for x in (60, -60, 100, -100, 140, -140)
                for y in (0, 45, -45, 90, -90)]
    for dx, dy in offsets:
        for t in (.5, .35, .65, .22, .78, .12, .88):
            x, y = curve_point(start, control, end, t)
            box = (x-width/2+dx, y-height/2+dy, width, height)
            if not (MAP[0] <= box[0] and MAP[1] <= box[1]
                    and box[0]+width <= MAP[0]+MAP[2] and box[1]+height <= MAP[1]+MAP[3]):
                continue
            if not any(overlaps(box, other) for other in occupied):
                options.append((math.hypot(dx, dy)*2+abs(t-.5)*100, box, (x, y)))
    if not options:
        raise ValueError("Cannot place a non-overlapping latency badge")
    _, box, point = min(options, key=lambda option: option[0])
    occupied.append(box)
    return box, point


class Drawing:
    def __init__(self):
        self.parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title description">',
            '<title id="title">Azure European footprint and candidate regions</title>',
            '<desc id="description">West Europe and North Europe are current regions. Frankfurt and Dublin are ExpressRoute peering metros. Sweden Central, Denmark East and Italy North are candidate regions. By default only existing-to-new region latency and peering-to-existing region latency are shown. Four keyboard-accessible switches control connection layers, including optional peering-to-new regions. Open the SVG directly in a browser to use the switches. The PNG is a static default view. All RTT values are illustrative, not measured performance.</desc>',
            f'<style>{CSS}</style>',
        ]

    def add(self, value):
        self.parts.append(value)

    def text(self, x, y, value, size=18, cls="", weight=400, anchor="start"):
        self.add(f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" class="{cls}" font-weight="{weight}" text-anchor="{anchor}">{html.escape(value)}</text>')

    def rect(self, x, y, width, height, fill="--cp-surface", radius=16, stroke="--cp-border"):
        self.add(f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="{radius}" fill="var({fill})" stroke="var({stroke})"/>')

    def line(self, x1, y1, x2, y2, color="--cp-border", width=1, dash=""):
        self.add(f'<path d="M{x1:.1f},{y1:.1f} L{x2:.1f},{y2:.1f}" fill="none" stroke="var({color})" stroke-width="{width}" stroke-dasharray="{dash}"/>')

    def marker(self, x, y, kind, size=10):
        if kind == "peering":
            self.add(f'<path d="M{x},{y-size} L{x+size},{y} L{x},{y+size} L{x-size},{y} Z" fill="var(--cp-link)" stroke="var(--cp-surface)" stroke-width="2"/>')
        else:
            fill = "--cp-accent" if kind == "current" else "--cp-surface"
            self.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{size}" fill="var({fill})" stroke="var(--cp-accent)" stroke-width="3"/>')
            if kind == "candidate":
                self.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{size+6}" fill="none" stroke="var(--cp-accent)" stroke-width="1.2" stroke-dasharray="3 3"/>')


def render():
    countries = load_source("europe-countries.geojson")
    administrative = load_source("europe-admin1-10m.geojson")
    seed = json.loads((ROOT / "site" / "data" / "regions-seed.json").read_text(encoding="utf-8"))
    regions = {r["id"]: r for r in seed["regions"]}
    nodes = [dict(regions[rid], code=code, kind=kind) for code, rid, kind in SELECTED]
    nodes += [dict(code=code, name=name, loc=loc, lon=lon, lat=lat, kind="peering")
              for code, name, loc, lon, lat in PEERING]
    points = {n["code"]: n for n in nodes}
    assert len(points) == 7
    d = Drawing()
    d.rect(0, 0, W, H, "--cp-bg", 0, "--cp-bg")
    d.text(48, 58, "AZURE  /  GEOGRAPHY PLANNING", 16, "accent", 700)
    d.text(48, 112, "Your European footprint. Your next region.", 42, weight=700)
    d.text(48, 151, "Current estate + ExpressRoute peering + expansion shortlist  |  Public Azure", 22, "muted")
    d.rect(1772, 48, 340, 44, "--cp-accent-soft", 10, "--cp-accent-soft")
    d.text(1942, 77, "CONCEPT  /  NOT LIVE DATA", 16, "accent", 700, "middle")
    d.text(2112, 132, "Scenario: 07 Oct 2026", 16, "muted", anchor="end")
    d.rect(48, 181, 2064, 53)
    for x, kind, label in [(76, "current", "Current region"), (406, "candidate", "Region under validation"),
                            (856, "peering", "Customer ExpressRoute peering")]:
        d.marker(x, 208, kind, 8)
        d.text(x+23, 214, label, 18)
    d.line(1370, 208, 1407, 208, "--cp-border-strong", 1)
    d.text(1420, 214, "Country border", 17, "muted")
    d.line(1690, 208, 1727, 208, "--cp-border", 1)
    d.text(1740, 214, "Administrative border", 17, "muted")

    d.rect(48, 254, 1552, 844)
    d.text(76, 291, "EUROPEAN CUSTOMER FOOTPRINT", 20, weight=700)
    d.text(76, 318, "2 current regions  /  3 regions under validation  /  2 peering metros", 17, "muted")
    d.text(1572, 292, "Line labels: illustrative RTT in ms", 16, "muted", anchor="end")
    d.line(76, 334, 1572, 334)
    d.add(f'<defs><clipPath id="map-clip"><rect x="{MAP[0]}" y="{MAP[1]}" width="{MAP[2]}" height="{MAP[3]}"/></clipPath></defs>')
    d.add('<g clip-path="url(#map-clip)">')
    for feature in countries["features"]:
        p = feature["properties"]
        if p["CONTINENT"] != "Europe":
            continue
        geometry = feature["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        rings = [ring for polygon in polygons for ring in polygon]
        d.add(f'<path data-country="{html.escape(p["NAME"])}" class="country" fill-rule="evenodd" d="{path_data(rings, True)}"/>')
    relevant = {"Ireland", "United Kingdom", "France", "Belgium", "Netherlands", "Germany", "Denmark",
                "Sweden", "Norway", "Finland", "Italy", "Switzerland", "Austria", "Poland", "Spain"}
    for feature in administrative["features"]:
        if feature["properties"]["ADM0_NAME"] not in relevant:
            continue
        geometry = feature["geometry"]
        lines = geometry["coordinates"] if geometry["type"] == "MultiLineString" else [geometry["coordinates"]]
        # Keep the detailed boundaries in the footprint, not distant territories.
        lines = [line for line in lines if any(-14 < p[0] < 30 and 39 < p[1] < 64 for p in line)]
        if lines:
            d.add(f'<path data-admin="{html.escape(feature["properties"]["ADM0_NAME"])}" class="admin" d="{path_data(lines)}"/>')
    for name, lon, lat in COUNTRY_LABELS:
        x, y = project(lon, lat)
        d.add('<g opacity=".35">')
        d.text(x, y, name, 14, "soft", 600, "middle")
        d.add("</g>")

    # Two separate symbols share Dublin's approximate metro coordinates.
    # Leader lines disclose the visual offset; calculations use the original point.
    display = {code: project(n["lon"], n["lat"]) for code, n in points.items()}
    dx, dy = display["DUB"]
    display["NEU"] = (dx-15, dy-14)
    display["DUB"] = (dx+15, dy+14)
    d.add("</g>")
    label_offsets = {
        "NEU": (-105, -28), "DUB": (-52, 23), "WEU": (-96, 14),
        "FRA": (15, 17), "SWE": (18, -15), "DKE": (18, -10), "ITN": (17, 14),
    }
    location_boxes = {}
    for n in nodes:
        x, y = display[n["code"]]
        ox, oy = label_offsets[n["code"]]
        location_boxes[n["code"]] = (x+ox, y+oy, len(n["name"])*6.1+10, 19)
    occupied = list(location_boxes.values())
    occupied.extend((x-14, y-14, 28, 28) for x, y in display.values())

    # Every region pair and every peering-to-region comparison are explicit.
    # Region lines are subdued; peering links retain current/candidate styling.
    links = []
    region_codes = [code for code, _, _ in SELECTED]
    for i, (a, b) in enumerate(itertools.combinations(region_codes, 2)):
        links.append((a, b, "region", (-1 if i % 2 else 1)*(65+i*12)))
    for peer, _, _, _, _ in PEERING:
        for i, region in enumerate(region_codes):
            bend = (-85-i*24) if peer == "FRA" else (90+i*26)
            if peer == "DUB" and region == "NEU":
                bend = -65
            links.append((peer, region, "peering", bend))
    curves = []
    for a, b, kind, bend in links:
        start, end = display[a], display[b]
        vx, vy = end[0]-start[0], end[1]-start[1]
        length = math.hypot(vx, vy)
        control = ((start[0]+end[0])/2-vy/length*bend,
                   (start[1]+end[1])/2+vx/length*bend)
        planned = points[a]["kind"] == "candidate" or points[b]["kind"] == "candidate"
        color = "--cp-border-strong" if kind == "region" else ("--cp-accent" if planned else "--cp-link")
        dash = ' stroke-dasharray="7 5"' if planned else ""
        width = .9 if kind == "region" else 1.3
        opacity = ".6" if kind == "region" else ".85"
        layer = comparison_layer(a, b, kind, points)
        d.add(f'<path data-layer="{layer}" data-comparison="{a}-{b}" data-link-kind="{kind}" d="M{start[0]:.1f},{start[1]:.1f} Q{control[0]:.1f},{control[1]:.1f} {end[0]:.1f},{end[1]:.1f}" fill="none" stroke="var({color})" stroke-width="{width}" opacity="{opacity}"{dash}/>')
        curves.append((a, b, start, control, end, color, layer))
    # Place the short local link first, then the more flexible long comparisons.
    # Default layers get first choice of badge positions.
    curves.sort(key=lambda c: (c[6] in ("candidate-peering", "other-regions"), math.dist(c[2], c[4])))
    for a, b, start, control, end, color, layer in curves:
        box, (x, y) = latency_box(start, control, end, occupied)
        bx, by, bw, bh = box
        d.add(f'<g data-layer="{layer}">')
        if not (bx <= x <= bx+bw and by <= y <= by+bh):
            d.line(x, y, min(max(x, bx), bx+bw), min(max(y, by), by+bh), color, .9)
        ms, km = metrics(points[a], points[b])
        d.add(f'<g data-latency="{a}-{b}" data-rtt="{ms}"><title>{html.escape(points[a]["name"]+" to "+points[b]["name"])}: illustrative {ms} ms RTT, approximate {km:,} km</title>')
        d.rect(bx, by, bw, bh, radius=3)
        d.text(bx+bw/2, by+11.5, f"{ms} ms", 10, "accent" if color == "--cp-accent" else "", 600, "middle")
        d.add("</g>")
        d.add("</g>")

    for n in nodes:
        x, y = display[n["code"]]
        px, py = project(n["lon"], n["lat"])
        if (x, y) != (px, py):
            d.line(px, py, x, y, "--cp-border-strong", 1)
        bx, by, bw, bh = location_boxes[n["code"]]
        d.line(x, y, min(max(x, bx), bx+bw), min(max(y, by), by+bh), "--cp-border-strong", 1)
        d.add(f'<g data-location="{html.escape(n["name"])}" data-kind="{n["kind"]}">')
        d.rect(bx, by, bw, bh, radius=3)
        d.text(bx+5, by+13, n["name"], 11, "accent" if n["kind"] == "candidate" else "", 600)
        d.marker(x, y, n["kind"], size=6)
        d.add("</g>")
    d.line(76, 1070, 115, 1070, "--cp-border-strong", 1.4)
    d.text(126, 1075, "Region to region", 15, "muted")
    d.line(330, 1070, 369, 1070, "--cp-link", 2)
    d.text(380, 1075, "Peering to current", 15, "muted")
    d.line(620, 1070, 659, 1070, "--cp-accent", 2, "8 5")
    d.text(670, 1075, "Peering to candidate", 15, "muted")
    d.text(1572, 1075, "Illustrative RTT / links are not physical routes", 15, "muted", anchor="end")

    sx, sw = 1624, 488
    d.rect(sx, 254, sw, 241)
    d.text(sx+24, 291, "THE CUSTOMER SCENARIO", 17, weight=700)
    d.text(sx+24, 327, "Today", 20, weight=700)
    d.text(sx+24, 355, "West Europe + North Europe", 19, "muted")
    d.text(sx+24, 387, "ExpressRoute: Frankfurt + Dublin", 18, "muted")
    d.text(sx+24, 424, "Under validation", 20, "accent", 700)
    d.text(sx+24, 454, "Sweden Central, Denmark East, Italy North", 18, "muted")
    d.text(sx+24, 479, "Denmark is shown as Azure region Denmark East.", 14, "muted")

    d.rect(sx, 515, sw, 360)
    d.text(sx+24, 552, "CHOOSE THE CONNECTIONS TO SHOW", 17, weight=700)
    d.text(sx+24, 578, "Toggle a layer; its lines and latency labels change together.", 14, "muted")
    for i, (layer, label, description, enabled) in enumerate(LAYERS):
        y = 595+i*57
        d.add(f'<g data-toggle="{layer}" role="switch" tabindex="0" aria-checked="{str(enabled).lower()}" aria-label="{html.escape(label)}">')
        d.rect(sx+16, y, sw-32, 51, "--cp-bg-elevated", 8)
        d.text(sx+28, y+20, label, 16, weight=600)
        d.text(sx+28, y+40, description, 12, "muted")
        d.add(f'<rect class="toggle-track" x="{sx+sw-78}" y="{y+13}" width="44" height="24" rx="12"/>')
        d.add(f'<circle class="toggle-knob" cx="{sx+sw-66}" cy="{y+25}" r="9"/>')
        d.add("</g>")
    d.text(sx+24, 846, "SVG: open in a browser; click or use Space / Enter.", 15, "muted")
    d.text(sx+24, 866, "PNG: static snapshot of the default layers.", 14, "muted")

    d.rect(sx, 895, sw, 203, "--cp-bg-elevated")
    d.text(sx+24, 934, "AZURE GEOGRAPHIES", 17, weight=700)
    d.text(sx+24, 968, "West / North Europe: Europe geography", 16, "muted")
    d.text(sx+24, 996, "Candidates: Sweden, Denmark, Italy geographies", 16, "muted")
    d.text(sx+24, 1032, "This view spans geographies within Europe.", 16, weight=600)
    d.text(sx+24, 1061, "ExpressRoute geopolitical coverage is separate.", 15, "muted")

    d.rect(48, 1122, 1552, 332)
    d.text(76, 1160, "EVERY SELECTED POINT, SIDE BY SIDE", 20, weight=700)
    d.text(76, 1188, "Each cell: illustrative RTT (ms) / approximate distance (km). No latency measurements.", 16, "muted")
    x0, y0, roww, cellw, rowh = 76, 1232, 252, 175, 27
    for j, n in enumerate(nodes):
        d.text(x0+roww+j*cellw+cellw/2, y0-12, n["code"], 15,
               "accent" if n["kind"] == "candidate" else "", 700, "middle")
    for i, a in enumerate(nodes):
        y = y0+i*rowh
        if i % 2 == 0:
            d.rect(x0, y, roww+len(nodes)*cellw, rowh, "--cp-surface-soft", 0, "--cp-surface-soft")
        d.marker(x0+9, y+14, a["kind"], 5)
        d.text(x0+24, y+19, f'{a["code"]}  {a["name"]}', 14, weight=600)
        for j, b in enumerate(nodes):
            value = "-" if i == j else "{} / {:,}".format(*metrics(a, b))
            d.text(x0+roww+j*cellw+cellw/2, y+19, value, 14, "mono muted", anchor="middle")
    d.text(76, 1440, "WEU / NEU: current  |  SWE / DKE / ITN: under validation  |  FRA / DUB: ExpressRoute peering metros", 14, "muted")

    d.rect(sx, 1122, sw, 332)
    d.text(sx+24, 1160, "PROTOTYPE / NOT MEASURED PERFORMANCE", 16, "accent", 700)
    notes = [
        "Only the customer's selected locations are shown.",
        "Region / peering positions are approximate metros.",
        "Dublin markers are offset to show both endpoints.",
        "Zero km means shared reference, not zero latency.",
        "Example RTT = 3 + 0.018 x distance in km.",
        "Distance is not fibre length; links are comparisons.",
        "Confirm shortlisted paths using customer telemetry.",
        "Frankfurt peering does not imply ExpressRoute Local",
        "eligibility for West Europe or any candidate region.",
    ]
    for i, line in enumerate(notes):
        d.text(sx+24, 1195+i*27, line, 15, "muted")
    d.text(48, 1492, "Sources: Microsoft Learn region / ExpressRoute references; repository region seed; Natural Earth country and administrative boundaries (public domain).", 14, "muted")
    d.text(48, 1518, "Customer-supplied selection. Prototype RTT is symmetric and illustrative; real network RTT is measured, directional, and route-dependent.", 14, "soft")
    d.add(f'<metadata>{html.escape(json.dumps({"regionSource": REGION_SOURCE, "peeringSource": PEERING_SOURCE, "basemap": SOURCES, "latency": "Illustrative only: round(3 + distance_km * 0.018)", "distance": "Haversine, Earth radius 6371.0088 km", "nodes": nodes, "comparisons": [{"from": a, "to": b, "kind": kind} for a, b, kind, _ in links]}))}</metadata>')
    d.add("""<script><![CDATA[
(() => {
  const root = document.documentElement;
  const attributes = {
    "current-new": ["data-hide-current-new", false],
    "current-peering": ["data-hide-current-peering", false],
    "candidate-peering": ["data-show-candidate-peering", true],
    "other-regions": ["data-show-other-regions", true]
  };
  for (const control of document.querySelectorAll("[data-toggle]")) {
    const activate = () => {
      const enabled = control.getAttribute("aria-checked") !== "true";
      control.setAttribute("aria-checked", String(enabled));
      const [attribute, showWhenPresent] = attributes[control.dataset.toggle];
      root.toggleAttribute(attribute, enabled === showWhenPresent);
    };
    control.addEventListener("click", activate);
    control.addEventListener("keydown", event => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        activate();
      }
    });
  }
})();
]]></script>""")
    d.add("</svg>")
    output = ROOT / "art" / "azure-geography-prototype.svg"
    output.write_text("\n".join(d.parts), encoding="utf-8")
    return output


def export_png(svg):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        page.goto(svg.as_uri())
        png = svg.with_suffix(".png")
        temporary = png.with_suffix(".tmp.png")
        page.locator("svg").screenshot(path=str(temporary))
        temporary.replace(png)
        browser.close()


def export_explorer(svg):
    """Reuse the map geometry and scenario; HTML supplies responsive native controls."""
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    source = ET.parse(svg).getroot()
    ns = "{http://www.w3.org/2000/svg}"
    data = json.loads(source.find(ns+"metadata").text)
    points = {node["code"]: node for node in data["nodes"]}
    for comparison in data["comparisons"]:
        a, b = comparison["from"], comparison["to"]
        comparison["layer"] = comparison_layer(a, b, comparison["kind"], points)
        comparison["rtt"], comparison["km"] = metrics(points[a], points[b])
    map_svg = ET.Element(ns+"svg", {
        "id": "network-map", "viewBox": "370 400 920 620",
        "role": "group", "aria-label": "European customer footprint and visible latency connections",
    })
    # Map geometry and labels only, not the legacy slide's header or side panels.
    for child in source:
        tag = child.tag.removeprefix(ns)
        if (tag == "defs" or tag == "path"
                or child.get("clip-path") or child.get("data-location") or child.get("data-layer")):
            map_svg.append(child)
    template = (ROOT / "art" / "azure_geography_explorer.html.in").read_text(encoding="utf-8")
    output = svg.with_name("azure-geography-explorer.html")
    markup = template.replace("@@MAP@@", ET.tostring(map_svg, encoding="unicode"))
    markup = markup.replace("@@DATA@@", json.dumps(data).replace("<", "\\u003c"))
    output.write_text(markup, encoding="utf-8")
    return output


def export_explorer_png(explorer):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 1200}, device_scale_factor=1)
        page.goto(explorer.as_uri()+"?scoutTheme=light")
        png = explorer.with_suffix(".png")
        temporary = png.with_suffix(".tmp.png")
        page.screenshot(path=str(temporary), full_page=True)
        temporary.replace(png)
        browser.close()


if __name__ == "__main__":
    svg = render()
    export_png(svg)
    explorer = export_explorer(svg)
    export_explorer_png(explorer)
    print(svg)
    print(svg.with_suffix(".png"))
    print(explorer)
    print(explorer.with_suffix(".png"))
