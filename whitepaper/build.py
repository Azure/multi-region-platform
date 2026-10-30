#!/usr/bin/env python3
"""Assemble whitepaper.html from pages/*.html (editable source)."""
import glob, html as htmllib, importlib.util, json, math, os, re
import art
import yaml

ROOT = os.path.dirname(os.path.abspath(__file__))

# The website TOC controls reading order; page filenames remain stable for figure generators.
ARTICLE_PAGES = {
    "index": [],
    "framework-overview": ["03-*", "03b-*", "04-*", "05-*"],
    "platform-and-workload": ["06-*", "07-*", "07b-*"],
    "platform-services-profiles": ["08-*", "08b-*", "08c-*"],
    "workload-landing-zone-archetypes": ["09-*", "09b-*", "09c-*"],
    "regional-qualification": ["10-*", "10b-*", "10c-*"],
    "business-and-geography": ["11-*"],
    "data-and-compliance": [],
    "workload-requirements": ["12-*", "12b-*"],
    "regional-capability": ["13-*", "13b-*", "13c-*"],
    "platform-architecture": ["14-*", "14b-*"],
    "profile-selection": ["15-*", "15b-*"],
    "platform-enablement-connectivity": ["16-*"],
    "hybrid-connectivity": ["16b-*"],
    "prepare-region": ["17-*", "17a-*"],
    "disconnected-spokes": ["17b-*"],
    "remote-hub": ["17c-*", "17d-*"],
    "minimal-regional-hub": ["17e-*", "17f-*"],
    "full-regional-hub": ["17g-*", "17h-*"],
    "platform-readiness": ["17i-*"],
    "workload-placement": ["18-*", "18b-*"],
    "workload-design": ["22a0-*"],
    "storage-across-regions": ["22a2-*"],
    "restore-across-regions": ["22a3-*"],
    "key-vault-across-regions": ["22a4-kv*"],
    "private-dns-multi-region": ["22a4?-dns-*"],
    "getting-started": ["20b-*"],
    "customer-scenarios": ["19-*", "19b-*"],
    "misconceptions": ["20-*"],
    "paired-nonpaired-regions": ["22a1-*"],
    "resiliency-scenarios": ["22a5-*"],
}


def publication_pages():
    """Fail rather than silently omit a new website article or an unmapped PDF page."""
    with open(os.path.join(ROOT, "..", "content", "toc.yml"), encoding="utf-8") as fh:
        toc = yaml.safe_load(fh)["items"]

    def articles(items):
        for item in items:
            if "href" in item:
                yield os.path.splitext(item["href"])[0]
            yield from articles(item.get("items", []))

    names = list(articles(toc))
    if set(names) != set(ARTICLE_PAGES):
        raise ValueError(f"Update ARTICLE_PAGES for website TOC changes: {set(names) ^ set(ARTICLE_PAGES)}")
    patterns = ["01-*", "02-*", "02b-*"]
    for name in names:
        patterns.extend(ARTICLE_PAGES[name])
    patterns.extend(["21-*", "23-*", "23b-*", "24-*"])
    pages = []
    for pattern in patterns:
        matches = sorted(glob.glob(os.path.join(ROOT, "pages", pattern + ".html")))
        if not matches:
            raise ValueError(f"No whitepaper pages match {pattern}")
        pages.extend(matches)
    available = set(glob.glob(os.path.join(ROOT, "pages", "*.html")))
    if len(pages) != len(set(pages)) or set(pages) != available:
        raise ValueError(f"Duplicate or unmapped whitepaper pages: {available ^ set(pages)}")
    return pages


def _art_module(name):
    """art/<name>.py, loaded by path: the repository folder 'art' has the same name as the module art.py here."""
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, "..", "art", name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


city = _art_module("city_analogy")
drivers = _art_module("common_drivers")

with open(os.path.join(ROOT, "..", "shared", "summary.json"), encoding="utf-8") as _fh:
    SUMMARY = json.load(_fh)
# Figure containers: element id -> figure name (figures.json, shared with site/tools/extract_figures.py).
# The name selects the picture's alt text in content/*.md, which becomes the figure's description in the PDF.
with open(os.path.join(ROOT, "figures.json"), encoding="utf-8") as _fh:
    FIGURES = json.load(_fh)


def _alt_texts():
    alts = {}
    for path in sorted(glob.glob(os.path.join(ROOT, "..", "content", "*.md"))):
        with open(path, encoding="utf-8") as fh:
            for name, alt in re.findall(r'source="\./media/([\w-]+)\.png"\s+alt-text="([^"]*)"', fh.read()):
                alts.setdefault(name, alt)
    return alts


def hide_pin_numbers(html):
    """Pin numbers on the city picture are icon glyphs (the key beside the picture carries the same numbers as text)."""
    return re.sub(r'<text (?=[^>]*font-size="12\.5")([^>]*>\d</text>)', r'<text aria-hidden="true" \1', html)


def describe_figures(html):
    """Give each figure container role="img" and the Markdown alt text as its label."""
    alts = _alt_texts()
    for fid, name in FIGURES.items():
        alt = alts.get(name)
        if not alt:
            continue
        attrs = f' role="img" aria-label="{htmllib.escape(alt, quote=True)}"'
        html = re.sub(r'(<[a-zA-Z0-9]+\b[^>]*\bid="' + re.escape(fid) + r'")', lambda m: m.group(1) + attrs, html, count=1)
    return html


# Placeholders usable in any page: {{EDITION}}, {{SITE_URL}}, {{WORKBOOK_URL}}
PLACEHOLDERS = {"EDITION": SUMMARY["edition"], "SITE_URL": SUMMARY["siteUrl"], "WORKBOOK_URL": SUMMARY["workbookUrl"],
                "SERVICE_GUIDES": SUMMARY["serviceGuidesTitle"], "PLANNER_NAME": SUMMARY["plannerName"]}
for key, values in (("ARCHETYPE", SUMMARY["archetypes"]), ("ARCHETYPE_LABEL", SUMMARY["archetypeLabels"]),
                    ("PROFILE", SUMMARY["profiles"])):
    PLACEHOLDERS.update({f"{key}_{i}": value for i, value in enumerate(values, 1)})
for i, order in enumerate(SUMMARY["archetypeProfileOrder"], 1):
    PLACEHOLDERS[f"ARCHETYPE_CHIPS_{i}"] = "".join(
        f'<span class="chip blue">{SUMMARY["profiles"][j]}</span>'
        for j in order
    )

SPRITE = """
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
 <defs>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.4" fill="currentColor"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 2.8v5.4c0 4.4-3 8-7 9.8-4-1.8-7-5.4-7-9.8V5.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 12l2.2 2.2L15.5 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-id" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="11" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.3 15.6c.6-1.3 1.6-2 2.7-2s2.1.7 2.7 2M14 10h4M14 13h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="i-monitor" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="12.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M6.5 13l3-3 2.5 2.2L17 8M9 20.5h6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-network" viewBox="0 0 24 24"><circle cx="12" cy="5.5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="5.5" cy="17.5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="18.5" cy="17.5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10.8 7.6L6.7 15.4M13.2 7.6l4.1 7.8M7.8 17.5h8.4" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
  <symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="12" r="6.3" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>
  <symbol id="i-gauge" viewBox="0 0 24 24"><path d="M4 16a8 8 0 1 1 16 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M12 16l4-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16" r="1.6" fill="currentColor"/><path d="M4 19.5h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
  <symbol id="i-building" viewBox="0 0 24 24"><path d="M4.5 20.5V6.5l7-3v17M11.5 20.5V9.5l8 2.5v8.5M3 20.5h18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M7 9h2M7 12h2M7 15h2M14 14h2.5M14 17h2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="16.5" cy="9" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 13.8c2.2 0 3.9 1.3 4.6 3.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="i-data" viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="2.7" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 6v12c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7V6M5 12c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>
  <symbol id="i-app" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 8.5h18M10 12l-2.3 2.2L10 16.4M14 12l2.3 2.2L14 16.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-hub" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.4" fill="currentColor"/><circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="i-spoke" viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="15" height="15" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="8.5" y="8.5" width="7" height="7" rx="1.6" fill="currentColor"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-x" viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
  <symbol id="i-doc" viewBox="0 0 24 24"><path d="M6 3.5h8l4 4v13H6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3.5v4h4M9 12h6M9 15h6M9 18h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="15.5" r="1.5" fill="currentColor"/></symbol>
  <symbol id="i-layers" viewBox="0 0 24 24"><path d="M12 4l8.5 4.5L12 13 3.5 8.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
  <symbol id="i-route" viewBox="0 0 24 24"><circle cx="6" cy="18" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="18" cy="6" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.4 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></symbol>
  <symbol id="i-flag" viewBox="0 0 24 24"><path d="M5.5 21V4M5.5 4.5h11l-2.2 4 2.2 4h-11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></symbol>
  <symbol id="i-loop" viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2.1-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M17.5 3v4.2h-4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
 </defs>
</svg>
"""


def dot_field(x0, y0, x1, y1, cx, cy, R, step=17.0, r=1.25, color="#8CC0EE", maxop=0.85, seed_holes=()):
    """Hexagonal dot grid fading radially from (cx, cy)."""
    out = []
    j = 0
    y = y0
    while y <= y1:
        off = (step / 2) if j % 2 else 0
        x = x0 + off
        while x <= x1:
            d = math.hypot(x - cx, (y - cy) * 1.15)
            if d < R:
                op = maxop * (1 - d / R) ** 1.35
                if op > 0.04:
                    out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{color}" opacity="{op:.2f}"/>')
            x += step
        y += step * 0.866
        j += 1
    return "\n".join(out)


EDITIONS = {
    "full": dict(src="pages", out="whitepaper.html", folio="Multi-Region Platform Whitepaper",
                 title="Adaptable Multi-Region Azure Platform — Multi-Region Platform Whitepaper"),
    "exec": dict(src="exec/pages", out="executive.html", folio="Multi-Region Platform · Executive Brief",
                 title="Adaptable Multi-Region Azure Platform — Executive Brief"),
}


def build(edition="full"):
    ed = EDITIONS[edition]
    pages = publication_pages() if edition == "full" else sorted(glob.glob(os.path.join(ROOT, ed["src"], "*.html")))
    body = []
    for p in pages:
        with open(p, encoding="utf-8") as fh:
            body.append(f"<!-- {os.path.basename(p)} -->\n" + fh.read())
    html = "\n".join(body)

    def repl(m):
        args = []
        for a in m.group(1).split(","):
            a = a.strip()
            try:
                args.append(float(a))
            except ValueError:
                args.append(a)
        return dot_field(*args)
    html = re.sub(r"\{\{DOTS:([^}]+)\}\}", repl, html)
    html = re.sub(r"\{\{PY:(.+?)\}\}", lambda m: str(eval(m.group(1), {"art": art, "city": city, "drivers": drivers})), html)

    html = hide_pin_numbers(describe_figures(html))
    html = re.sub(r"\{\{(" + "|".join(PLACEHOLDERS) + r")\}\}", lambda m: PLACEHOLDERS[m.group(1)], html)

    doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{ed["title"]}</title>
<meta name="viewport" content="width=1056">
<link rel="stylesheet" href="styles.css">
</head>
<body data-folio="{ed["folio"]}">
{SPRITE}
{html}
<script src="layout.js"></script>
</body>
</html>
"""
    with open(os.path.join(ROOT, ed["out"]), "w", encoding="utf-8") as fh:
        fh.write(doc)
    print(f"built {len(pages)} page files")


if __name__ == "__main__":
    import sys
    build(sys.argv[1] if len(sys.argv) > 1 else "full")
