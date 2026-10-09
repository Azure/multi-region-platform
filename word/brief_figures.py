#!/usr/bin/env python3
"""Figures and text check for the Word edition of the executive brief.

    python3 word/brief_figures.py <out_dir>   write one PNG per figure into <out_dir>
    python3 word/brief_figures.py --check     verify word/brief.md against whitepaper/exec/pages

`word/brief.md` is the linear Markdown source of the executive brief (pages 2 to 13). The
figures it references as ./brief-media/<id>.png are screenshots of the figure elements of the
assembled executive brief (whitepaper/executive.html).
"""
import html
import pathlib
import re
import subprocess
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
WP = ROOT / "whitepaper"
PAGES = WP / "exec" / "pages"
BRIEF = ROOT / "word" / "brief.md"

# Figure element ids on the executive brief pages, in reading order.
FIGURES = ["fig1", "xfGeo", "xfConn", "fig14", "xfCost", "fig15", "figCity", "fig5", "xfAgility"]

# Extra CSS per figure, applied before the screenshot. The comparison block of xfAgility
# (today / with this model) is a table in brief.md, so the picture shows the rest of the figure.
FIGURE_CSS = {
    "xfAgility": "#xfAgility .ag2 { display: none !important; } #xfAgility > .cap { margin-top: 0 !important; }",
}

# Wording alignment: phrases on the pages that are being replaced, old -> new. Applied to the
# page text before comparing, so brief.md can carry the new wording now.
ALIGN = {
    "right-sizing regional platform connectivity": "selecting the most efficient regional platform connectivity",
    "Right-size regional connectivity": "Choose the most efficient regional connectivity",
    "selective connectivity — right-sized without a full hub": "selective connectivity, without a full hub",
    "lighter patterns": "more efficient patterns",
    "lightest pattern": "most efficient pattern",
    "Lightweight Workload Landing Zone archetypes": "Workload Landing Zone archetypes",
}

# Wording that must not appear in brief.md.
RETIRED = ["right-siz", "lightest", "lighter", "lightweight", "dimension"]

PAD = 16  # CSS px of white around each figure
MIN_WORDS = 3  # shorter fragments are not compared


# ---------------------------------------------------------------------------------------------
# Figures
# ---------------------------------------------------------------------------------------------
def capture(out_dir):
    """Assemble the executive brief, write <out_dir>/<id>.png for every id in FIGURES, and remove the assembled page
    again when it was not there before, so a build leaves nothing in the repository."""
    out = pathlib.Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    source = WP / "executive.html"
    existed = source.exists()
    subprocess.run([sys.executable, "-B", "build.py", "exec"], cwd=WP, check=True, stdout=subprocess.DEVNULL)
    if not source.exists():
        raise SystemExit(f"build.py exec did not write {source}")
    try:
        return _capture_figures(source, out)
    finally:
        if not existed:
            source.unlink(missing_ok=True)


def _capture_figures(source, out):
    """Screenshot every figure element of the assembled executive brief."""
    from playwright.sync_api import sync_playwright

    result = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1100, "height": 900}, device_scale_factor=2)
        page.emulate_media(media="print")
        page.goto(source.as_uri())
        page.wait_for_selector("body[data-ready='1']", timeout=30000)
        page.wait_for_timeout(300)
        css = "html, body { background: #fff !important; } .figure .figcap, .figure .fighead .fn { display: none !important; } "
        page.add_style_tag(content=css + " ".join(FIGURE_CSS.values()))

        missing = [i for i in FIGURES if not page.query_selector(f"#{i}")]
        if missing:
            browser.close()
            raise SystemExit("Figure id not found on the executive brief pages: " + ", ".join(missing))

        for fid in FIGURES:
            el = page.query_selector(f"#{fid}")
            el.scroll_into_view_if_needed()
            # hide every neighbouring block, at every level up to the page, so nothing leaks into the padding
            page.evaluate(
                """(id) => {
                    window.__hid = [];
                    let node = document.getElementById(id);
                    while (node && node.parentElement && !node.classList.contains('page')) {
                        for (const s of node.parentElement.children) {
                            if (s !== node) { window.__hid.push([s, s.style.visibility]); s.style.visibility = 'hidden'; }
                        }
                        node = node.parentElement;
                    }
                }""",
                fid,
            )
            box = el.evaluate(
                """f => { const r = f.getBoundingClientRect();
                         return {x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height}; }"""
            )
            target = out / f"{fid}.png"
            page.screenshot(
                path=str(target),
                full_page=True,
                clip={"x": box["x"] - PAD, "y": box["y"] - PAD, "width": box["width"] + 2 * PAD, "height": box["height"] + 2 * PAD},
            )
            page.evaluate("() => { for (const [s, v] of window.__hid) s.style.visibility = v; }")
            result[fid] = str(target)
            print(f"{fid:10s} {round(box['width'])}x{round(box['height'])}  {target}")
        browser.close()
    return result


# ---------------------------------------------------------------------------------------------
# Text normalization
# ---------------------------------------------------------------------------------------------
def norm(text):
    t = html.unescape(text)
    t = t.replace("­", "").replace("‑", "-").replace(" ", " ")
    t = re.sub(r"[‘’]", "'", t)
    t = re.sub(r"[“”]", '"', t)
    t = re.sub(r"[–—]", "-", t)
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def align(text):
    for old, new in ALIGN.items():
        text = text.replace(old, new)
    return text


def split_sentences(text):
    out = []
    for s in re.split(r"(?<=[.!?:;])\s+", text):
        s = s.strip()
        if len(norm(s).split()) >= MIN_WORDS:
            out.append(s)
    return out


# ---------------------------------------------------------------------------------------------
# brief.md
# ---------------------------------------------------------------------------------------------
def read_brief():
    return BRIEF.read_text(encoding="utf-8").replace("\r\n", "\n")


def brief_figure_refs(md):
    return re.findall(r"source=\"\./brief-media/([^\"]+)\.png\"", md)


def brief_sentences(md):
    """Sentences of brief.md to be found on the pages. Skips the file comment, alt text, and table headers."""
    md = re.sub(r"\A\s*<!--.*?-->", "", md, count=1, flags=re.S)  # first-line file comment
    md = re.sub(r"<!--\s*(?:eyebrow|standfirst):\s*(.*?)\s*-->", r"\1", md, flags=re.S)
    md = re.sub(r"^:::image[^\n]*:::\s*$", "", md, flags=re.M)
    md = re.sub(r"^\s*:::[a-z-]+:::\s*$", "", md, flags=re.M)
    md = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", md)
    sentences = []
    lines = md.split("\n")
    skip_header = False
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        if line.startswith("|"):
            if re.fullmatch(r"\|[-| :]+\|", line):
                continue
            nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
            if re.fullmatch(r"\|[-| :]+\|", nxt):
                continue  # header row
            cells = [c.strip() for c in line.strip("|").split("|")]
        else:
            cells = [line]
        for c in cells:
            c = re.sub(r"^(#+|>)\s*", "", c)
            c = re.sub(r"[*`]", "", c)
            sentences.extend(split_sentences(c))
    return sentences


def brief_text(md):
    """All of brief.md as one normalized string (for the reverse check), alt text excluded."""
    return norm(" ".join(split_all(md)))


def split_all(md):
    """Every non-empty text fragment of brief.md, including short ones, for the reverse check."""
    md = re.sub(r"\A\s*<!--.*?-->", "", md, count=1, flags=re.S)
    md = re.sub(r"<!--\s*(?:eyebrow|standfirst):\s*(.*?)\s*-->", r"\1", md, flags=re.S)
    md = re.sub(r"^:::image[^\n]*:::\s*$", "", md, flags=re.M)
    md = re.sub(r"^\s*:::[a-z-]+:::\s*$", "", md, flags=re.M)
    md = re.sub(r"[*`|]", " ", md)
    return [md]


# ---------------------------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------------------------
VOID = {"br", "hr", "img", "input", "meta", "link", "path", "rect", "circle", "use", "line", "stop", "ellipse", "polygon", "polyline"}


class PageText(HTMLParser):
    """Collects text of <p>, headings, and figure captions, and flags text inside figures."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []  # (tag, classes)
        self.skip = 0
        self.cur = None  # (kind, in_figure, [chunks])
        self.items = []  # (kind, in_figure, text)
        self.all_text = []

    def _classes(self, attrs):
        return set((dict(attrs).get("class") or "").split())

    def handle_starttag(self, tag, attrs):
        if tag in ("style", "script"):
            self.skip += 1
        if tag in VOID:
            return
        cls = self._classes(attrs)
        self.stack.append((tag, cls))
        kind = None
        if tag == "p":
            kind = "p"
        elif tag in ("h1", "h2", "h3"):
            kind = "heading"
        elif tag == "span" and "ft" in cls and any("figcap" in c for _, c in self.stack):
            kind = "caption"
        if kind and self.cur is None:
            in_fig = any("figure" in c for _, c in self.stack[:-1])
            self.cur = (kind, in_fig, [], len(self.stack))

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        if tag in ("style", "script"):
            self.skip = max(0, self.skip - 1)
        if tag in VOID:
            return
        depth = len(self.stack)
        if self.cur is not None and depth == self.cur[3] and self.stack[-1][0] == tag:
            self.items.append((self.cur[0], self.cur[1], re.sub(r"\s+", " ", "".join(self.cur[2])).strip()))
            self.cur = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self.skip:
            return
        self.all_text.append(data)
        if self.cur is not None:
            self.cur[2].append(data)


def page_files(include_edges=False):
    files = sorted(PAGES.glob("*.html"))
    if include_edges:
        return files
    return [f for f in files if not f.name.startswith(("01-", "99-"))]


def clean_page(raw):
    raw = re.sub(r"<!--.*?-->", " ", raw, flags=re.S)
    raw = re.sub(r"\{\{PY:.*?\}\}", " ", raw)
    return raw


def pages_text():
    """Normalized text of pages 2 to 13, wording alignment applied."""
    parts = []
    for f in page_files():
        parser = PageText()
        parser.feed(clean_page(f.read_text(encoding="utf-8")))
        parts.append(" ".join(parser.all_text))
    return norm(align(" ".join(parts)))


def page_items():
    items = []
    for f in page_files():
        parser = PageText()
        parser.feed(clean_page(f.read_text(encoding="utf-8")))
        for kind, in_fig, text in parser.items:
            items.append((f.name, kind, in_fig, align(text)))
    return items


# ---------------------------------------------------------------------------------------------
# Check
# ---------------------------------------------------------------------------------------------
def check():
    md = read_brief()
    failed = False

    # 1. figures referenced <-> FIGURES
    refs = brief_figure_refs(md)
    not_listed = sorted(set(refs) - set(FIGURES))
    not_used = [f for f in FIGURES if f not in refs]
    dupes = sorted({r for r in refs if refs.count(r) > 1})
    print(f"1. figures: {len(refs)} referenced in brief.md, {len(FIGURES)} in FIGURES")
    for label, ids in (("referenced but not in FIGURES", not_listed), ("in FIGURES but not referenced", not_used), ("referenced more than once", dupes)):
        if ids:
            failed = True
            print(f"   FAIL {label}: {', '.join(ids)}")
    if not (not_listed or not_used or dupes):
        print("   ok")

    # 2. every sentence of brief.md is on the pages
    pages = pages_text()
    sentences = brief_sentences(md)
    missing = [s for s in sentences if norm(s) not in pages]
    print(f"2. text: {len(sentences)} sentences in brief.md checked against pages 2 to 13")
    if missing:
        failed = True
        print(f"   FAIL {len(missing)} not found on the pages:")
        for s in missing:
            print("   -", s)
    else:
        print("   ok")
    bad = [w for w in RETIRED if re.search(w, md, flags=re.I)]
    if bad:
        failed = True
        print("   FAIL retired wording in brief.md: " + ", ".join(bad))

    # 3. reverse coverage (information only)
    covered = brief_text(md)
    print("3. reverse coverage (information only): page text not in brief.md")
    body, in_figure = [], []
    for name, kind, in_fig, text in page_items():
        for s in split_sentences(text):
            if norm(s) not in covered:
                (in_figure if in_fig else body).append((name, kind, s))
    for name, kind, s in body:
        print(f"   {name} [{kind}] {s}")
    if not body:
        print("   none outside figures")
    if in_figure:
        print(f"   {len(in_figure)} more fragments sit inside figure pictures (expected):")
        for name, kind, s in in_figure:
            print(f"   (figure) {name} [{kind}] {s}")
    print("RESULT:", "FAIL" if failed else "ok")
    return 1 if failed else 0


def main(argv):
    if len(argv) == 2 and argv[1] == "--check":
        return check()
    if len(argv) == 2 and not argv[1].startswith("-"):
        capture(argv[1])
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
