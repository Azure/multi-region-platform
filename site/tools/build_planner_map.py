#!/usr/bin/env python3
"""Build the planner's local, public-domain Natural Earth basemap (no runtime map service)."""
import argparse
import json
import math
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCES = {
    "countries": "ne_50m_admin_0_countries.geojson",
    "administrative": "ne_10m_admin_1_states_provinces_lines.geojson",
}
BASE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"


def simplify(points, tolerance=0.12):
    if len(points) <= 2:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = dx * dx + dy * dy
    farthest, index = 0, 0
    for i, p in enumerate(points[1:-1], 1):
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) if length else 0
        distance = math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
        if distance > farthest:
            farthest, index = distance, i
    if farthest <= tolerance:
        return [a, b]
    return simplify(points[:index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)


def build(cache):
    result = {"source": "Natural Earth (public domain); generalized planning boundaries, not legal boundaries",
              "urls": [BASE + name for name in SOURCES.values()]}
    cache.mkdir(parents=True, exist_ok=True)
    for layer, filename in SOURCES.items():
        path = cache / filename
        if not path.exists():
            with urllib.request.urlopen(BASE + filename, timeout=120) as response:
                path.write_bytes(response.read())
        features = json.loads(path.read_text(encoding="utf-8"))["features"]
        lines = []
        for feature in features:
            geometry = feature.get("geometry")
            if not geometry:
                continue
            kind, coordinates = geometry["type"], geometry["coordinates"]
            if kind == "MultiPolygon":
                rings = [ring for polygon in coordinates for ring in polygon]
            elif kind in ("Polygon", "MultiLineString"):
                rings = coordinates
            elif kind == "LineString":
                rings = [coordinates]
            else:
                raise ValueError(f"Unsupported geometry: {kind}")
            for ring in rings:
                line = [[round(x, 3), round(y, 3)] for x, y, *_ in simplify(ring)]
                if len(line) > (3 if "Polygon" in kind else 1):
                    lines.append(line)
        result[layer] = lines
    output = ROOT / "site" / "assets" / "planner-map.json"
    output.write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    print(f"{output}: {output.stat().st_size:,} bytes")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=ROOT / ".cache" / "planner-map")
    build(parser.parse_args().cache)
