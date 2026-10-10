#!/usr/bin/env python3
"""Build the Word editions of the guidance.

    python3 word/build.py                      both editions into dist/
    python3 word/build.py full  [out.docx]     the full guidance, from content/*.md in toc.yml order
    python3 word/build.py brief [out.docx]     the executive brief, from word/brief.md
    python3 word/build.py <something.docx>     the same as: full <something.docx>

The documents are generated, never edited by hand. Markdown (Microsoft Learn dialect) goes through
pandoc with a reference document whose styles are written here, and a post-pass finishes what pandoc
cannot express: card grids, row settings, header, footer, cover and document properties.
Page: US Letter portrait, 0.75 in margins (7.0 in text width), Aptos 9 pt body text.
Needs pandoc 3.x, PyYAML, lxml and Pillow; the brief edition also needs Playwright (word/brief_figures.py).
Output goes to dist/, which is git-ignored.
"""
import datetime
import html
import importlib.util
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from dataclasses import dataclass, field
from xml.sax.saxutils import escape

sys.dont_write_bytecode = True                              # a build leaves no __pycache__ in the repository

import yaml
from lxml import etree
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(ROOT, "content")
DIST = os.path.join(ROOT, "dist")
BRIEF_DIR = os.environ.get("WORD_BRIEF_DIR", HERE)      # holds brief.md and brief_figures.py

SUMMARY = json.load(open(os.path.join(ROOT, "shared", "summary.json"), encoding="utf-8"))
TITLE = SUMMARY["title"]
RUNNING_TITLE = TITLE.removeprefix("The ")[:1].upper() + TITLE.removeprefix("The ")[1:]
EDITION = SUMMARY["edition"]
SITE_URL, WORKBOOK_URL, LEGAL = SUMMARY["siteUrl"], SUMMARY["workbookUrl"], SUMMARY["legal"]
KEYWORDS = "Azure, multi-region, landing zones, regional qualification, connectivity profiles, workload placement"

# Color tokens: the values come from shared/summary.json "tokens" (site/tools/check_tokens.py compares them).
INK, BLUE, BLUE_D, TEXT, MUTED = "0A2340", "0F6CBD", "0F548C", "28323E", "5B6778"
FAINT, LINE, WASH, SOFT = "667182", "D3DBE4", "F5F8FB", "EEF5FC"
TEAL, TEAL_D, TEAL_SOFT = "04807A", "03615F", "EDF8F6"
WARM, WARM_SOFT = "A84E1F", "FBF4EE"
GREEN, GREEN_SOFT = "107C41", "DFF1E6"
AMBER, AMBER_SOFT = "8A5A00", "FFF1CC"
SLATE = "243A57"

FONT_NAME = "Aptos"
PAGE_W, PAGE_H, MARGIN = 12240, 15840, 1080              # twips: Letter, 0.75 in margins
TEXT_W = 10080                                            # twips (7.0 in)
TEXT_W_IN = TEXT_W / 1440
LONG_ARTICLE = 1700                                       # shorter chapters may share a page after a clear divider
MAX_FIGURE_H = 5.6                                        # inches
EMU = 914400
ALERTS = {"NOTE": "Note", "TIP": "Tip", "IMPORTANT": "Important", "WARNING": "Warning", "CAUTION": "Warning"}
CALLOUTS = ("Question", "Decision", "Takeaway")
ATTRIBUTES = ("Fits when", "Regional footprint", "Key considerations", "Reassess when")
ROW, COL, END = "§§ROW§§", "§§COL§§", "§§END§§"           # card-grid markers, replaced by tables in the post-pass
LOGO_COLORS = ("F25022", "7FBA00", "00A4EF", "FFB900")
COVER_TAGS = ("Azure architecture", "Platform strategy")
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}


def q(tag):
    """Qualified WordprocessingML tag name."""
    return f"{{{W}}}{tag}"


# ================================================================= editions and sources
@dataclass
class Edition:
    """What differs between the two Word files."""
    key: str
    subtitle: str
    out: str
    art: str
    accent: str


EDITIONS = {
    "full": Edition("full", "Technical guidance", os.path.join(DIST, "Adaptable-Multi-Region-Azure-Platform.docx"),
                    os.path.join(ROOT, "decks", "img", "cover_panel.png"), BLUE),
    "brief": Edition("brief", "Executive brief", os.path.join(DIST, "Adaptable-Multi-Region-Azure-Platform-Executive-Brief.docx"),
                     os.path.join(ROOT, "decks", "img", "teal", "cover_panel.png"), TEAL),
}


@dataclass
class Section:
    """One chapter: an article of the guidance or a section of the brief."""
    key: str                       # article file name without extension, or brief-N
    body: str                      # Markdown, starting with the "# " heading
    eyebrow: str | None
    standfirst: str
    new_page: bool
    source: str = ""               # the article file name, for cross-article links


@dataclass
class Entry:
    name: str
    href: str
    eyebrow: str | None
    first: bool = False


@dataclass
class Group:
    """A group in toc.yml; a top-level article is a solo group."""
    label: str
    entries: list = field(default_factory=list)
    solo: bool = False


def part_label(name, appendix_index):
    """toc.yml group name -> eyebrow: "2. Qualify regions" -> "Part 2 · Qualify regions"."""
    m = re.match(r"^(\d+)\.\s+(.*)$", name)
    if m:
        return f"Part {m.group(1)} · {m.group(2)}"
    if name == "Resources":
        return name
    return f"Appendix {chr(65 + appendix_index)} · {name}"


def toc_outline():
    """Groups and entries in toc.yml order, each entry with its eyebrow."""
    toc = yaml.safe_load(open(os.path.join(CONTENT, "toc.yml"), encoding="utf-8"))["items"]
    groups, appendix = [], 0
    for it in toc:
        name = it["name"]
        if "items" in it:
            label = part_label(name, appendix)
            appendix += not re.match(r"^\d+\.", name) and name != "Resources"
            entries = []
            for n, sub in enumerate(it["items"]):
                check = re.match(r"^(\d+)\.", sub["name"])
                eyebrow = f"{label} · Check {check.group(1)}" if check and label.startswith("Part") else label
                entries.append(Entry(sub["name"], sub["href"], eyebrow, first=(n == 0)))
            groups.append(Group(label, entries))
        else:
            numbered = re.match(r"^\d+\.", name)
            label = part_label(name, 0) if numbered else name
            eyebrow = "Overview" if it["href"] == "index.md" else label
            groups.append(Group(label, [Entry(name, it["href"], eyebrow, first=True)], solo=True))
    return groups


def split_front_matter(raw):
    """(front matter dict, body) of a Markdown file."""
    raw = raw.replace("\r\n", "\n")
    m = re.match(r"^---\n(.*?)\n---\n", raw, flags=re.S)
    if not m:
        return {}, raw
    return yaml.safe_load(m.group(1)) or {}, raw[m.end():]


def full_sections(groups):
    """The articles of the full guidance, in reading order."""
    out = []
    for g in groups:
        for e in g.entries:
            meta, body = split_front_matter(open(os.path.join(CONTENT, e.href), encoding="utf-8").read())
            out.append(Section(key=e.href[:-3], body=body, eyebrow=e.eyebrow, standfirst=(meta.get("description") or "").strip(),
                               new_page=e.first or len(body) > LONG_ARTICLE, source=e.href))
    return out


def brief_sections(path):
    """Sections of word/brief.md: one per "# " heading; <!-- eyebrow: … --> before it, <!-- standfirst: … --> after it.
    The sections of the brief follow one another on the page; only headings that would be stranded move on."""
    _meta, text = split_front_matter(open(path, encoding="utf-8").read())
    sections, current, eyebrow = [], None, None
    for line in text.split("\n"):
        m = re.match(r"^<!--\s*(eyebrow|standfirst):\s*(.*?)\s*-->\s*$", line)
        if m and m.group(1) == "eyebrow":
            eyebrow = m.group(2)
        elif m and current:
            current["standfirst"] = m.group(2)
        elif line.startswith("# "):
            current = {"lines": [line], "eyebrow": eyebrow, "standfirst": ""}
            sections.append(current)
            eyebrow = None
        elif current:
            current["lines"].append(line)
    return [Section(key=f"brief-{n}", body="\n".join(s["lines"]), eyebrow=s["eyebrow"], standfirst=s["standfirst"], new_page=False)
            for n, s in enumerate(sections, 1)]


# ================================================================= Markdown conversion
def slugify(text, sep="-"):
    """The website's heading-id function (site/build.py), so ids match the anchors written in the Markdown."""
    t = re.sub(r"<[^>]+>", "", text)
    t = html.unescape(t).lower()
    t = re.sub(r"[^\w\s-]", "", t)
    return re.sub(r"[\s_]+", sep, t).strip(sep)


class Images:
    """Finds the picture files an edition refers to and sizes them to the text width."""

    def __init__(self, work, extra=None):
        self.work, self.extra = work, extra or {}

    def find(self, src):
        """(path relative to the pandoc resource path, absolute path, capture scale) for a figure source."""
        base = os.path.basename(src)
        if base in self.extra:
            dest = os.path.join(self.work, "brief-media", base)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            if os.path.abspath(self.extra[base]) != os.path.abspath(dest):
                shutil.copy(self.extra[base], dest)
            return f"brief-media/{base}", dest, 2.0
        for folder, scale in ((os.path.join(CONTENT, "media"), 2.0), (os.path.join(ROOT, "site", "media"), 1.5)):
            if os.path.exists(os.path.join(folder, base)):
                path = os.path.join(folder, base)
                return os.path.relpath(path, ROOT).replace(os.sep, "/"), path, scale
        raise SystemExit(f"error: figure not found: {src}")

    def markup(self, src, caption, alt):
        """Pandoc image markup: text-width bound, normally native size; alt text carried into the picture description."""
        caption = re.sub(r"\s*Use the download button for the complete picture, including both workloads\.\s*$", "", caption, flags=re.I)
        if os.path.basename(src) in ("figCity.png", "city-analogy.png") and "figCity-legend.png" in self.extra:
            city = self._markup_one("figCity.png", "", alt)
            legend = self._markup_one("figCity-legend.png", caption, "Legend for the city analogy, explaining the places, routes, laws, and shared services on the map.")
            return city + legend
        return self._markup_one(src, caption, alt)

    def _markup_one(self, src, caption, alt):
        rel, path, scale = self.find(src)
        with Image.open(path) as im:
            native = im.size[0] / scale / 96, im.size[1] / scale / 96
        width = min(native[0], TEXT_W_IN, MAX_FIGURE_H * native[0] / native[1])
        if os.path.basename(src) == "xfCost.png" and os.path.basename(src) in self.extra:
            # This brief-only chart can use its otherwise empty page without shrinking the estate.
            width = min(TEXT_W_IN, MAX_FIGURE_H * native[0] / native[1])
        attrs = "width=%.2fin" % width
        if alt:
            attrs += ' alt="%s"' % alt.replace("\\", "\\\\").replace('"', '\\"')
        if caption:
            return f"![{caption}]({rel}){{{attrs}}}\n"
        title = alt.replace("\\", "\\\\").replace('"', '\\"')               # pandoc keeps the title; describe_pictures() turns it into the description
        return f'::: {{custom-style="Figure"}}\n![]({rel} "{title}"){{width={width:.2f}in}}\n:::\n'


def convert_figures(s, images):
    """:::image … ::: plus an optional italic caption line -> pandoc images."""
    def fig(m):
        src = re.search(r'source="([^"]+)"', m.group(1)).group(1)
        alt = re.search(r'alt-text="([^"]*)"', m.group(1))
        caption = (m.group(2) or "").strip().replace("[", "(").replace("]", ")")
        return images.markup(src, caption, html.unescape(alt.group(1)) if alt else "")
    return re.sub(r':::image([^\n]*?):::[ \t]*\n(?:\n\*([^\n]+?)\*[ \t]*\n)?', fig, s)


def convert_cards(s):
    """:::row::: / :::column::: card grids -> marker paragraphs; the post-pass turns them into tables."""
    out, column = [], None
    for line in s.split("\n"):
        t = line.strip()
        if t == ":::row:::":
            out += ["", ROW, ""]
        elif t.startswith(":::column") and not t.endswith("-end:::"):
            column = []
            out += ["", COL, ""]
        elif t == ":::column-end:::":
            out += _dedent(column) + [""]
            column = None
        elif t == ":::row-end:::":
            out += ["", END, ""]
        elif column is not None:
            column.append(line)
        else:
            out.append(line)
    return "\n".join(out)


def _dedent(lines):
    """Remove the indentation the Learn dialect gives column content."""
    indents = [len(l) - len(l.lstrip()) for l in lines if l.strip()]
    cut = min(indents) if indents else 0
    return [l[cut:] for l in lines]


def convert_alerts(s):
    """> [!NOTE] blocks -> styled divs with a bold label. Navigation blocks ([!div …]) are dropped."""
    def alert(m):
        lines = [re.sub(r"^> ?", "", l) for l in m.group(0).rstrip("\n").split("\n")]
        kind = re.match(r"\[!(\w+)\]", lines[0])
        if not kind:
            return m.group(0)
        style = ALERTS.get(kind.group(1))
        if not style:
            return ""
        body = [l for l in lines[1:]]
        label = f"**{style}:**"
        if body and not re.match(r"^\s*([-*+]|\d+\.)\s", body[0]) and body[0].strip():
            bold_lead = style == "Tip" and re.match(r"^\s*\*\*[^*]+:\*\*", body[0])
            if not bold_lead:
                body[0] = f"{label} {body[0]}"
        else:
            body = [label, ""] + body
        return f'\n::: {{custom-style="{style}"}}\n' + "\n".join(body) + "\n:::\n"
    return re.sub(r"(?:^>.*(?:\n|$))+", alert, s, flags=re.M)


def convert_callouts(s):
    """**Question:** / **Decision:** / **Takeaway:** and the four attribute rows -> styled paragraphs."""
    def callout(m):
        name, text = m.group(1), m.group(2)
        label = "Label Teal" if name == "Takeaway" else "Label"
        return f'::: {{custom-style="{name}"}}\n[{name}:]{{custom-style="{label}"}} {text}\n:::'
    s = re.sub(rf"^\*\*({'|'.join(CALLOUTS)}):\*\* (.+)$", callout, s, flags=re.M)

    def attribute(m):
        label = "Label Warm" if m.group(1) == "Reassess when" else "Label"
        return f'::: {{custom-style="Attribute"}}\n[{m.group(1)}:]{{custom-style="{label}"}} {m.group(2)}\n:::'
    return re.sub(rf"^\*\*({'|'.join(ATTRIBUTES)}):\*\* (.+)$", attribute, s, flags=re.M)


def rewrite_links(s, key, known):
    """Links inside the document. Same-article anchors first, then links to other articles; site pages become absolute."""
    s = re.sub(r"\]\(#([^)\s]+)\)", lambda m: f"](#{key}--{m.group(1)})", s)

    def article(m):
        stem, anchor = m.group(1), m.group(2) or ""
        if stem in known:
            return f"](#{stem}--{anchor[1:]})" if anchor else f"](#art-{stem})"
        return f"]({SITE_URL}{stem}.html{anchor})"
    s = re.sub(r"\]\(\./([a-z0-9-]+)\.md(#[^)\s]*)?\)", article, s)
    return re.sub(r"\]\(\./([a-z0-9-]+\.html)(#[^)\s]*)?\)", lambda m: f"]({SITE_URL}{m.group(1)}{m.group(2) or ''})", s)


def add_heading_ids(s, key):
    """H1 gets art-<key>; H2 to H4 get <key>--<slug> (the site's slug, de-duplicated like the website does)."""
    seen = set()

    def unique(slug):
        while slug in seen:
            m = re.match(r"^(.*)_(\d+)$", slug)
            slug = f"{m.group(1)}_{int(m.group(2)) + 1}" if m else f"{slug}_1"
        seen.add(slug)
        return slug

    def heading(m):
        text = m.group(2).strip()
        plain = re.sub(r"[*`]", "", re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", text))
        return f"{m.group(1)} {text} {{#{key}--{unique(slugify(plain))}}}"
    s = re.sub(r"^(#{2,4}) (.+)$", heading, s, flags=re.M)
    return re.sub(r"^# (.+)$", lambda m: f"# {m.group(1)} {{#art-{key}}}", s, count=1, flags=re.M)


def space_tables(s):
    """Rewrite each pipe table's rule row so that pandoc gives columns widths in proportion to their content (at most 4:1)."""
    rule = re.compile(r"^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$")
    lines, out, i = s.split("\n"), [], 0
    while i < len(lines):
        if lines[i].lstrip().startswith("|") and i + 1 < len(lines) and rule.match(lines[i + 1]):
            j = i + 2
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                j += 1
            out += _respace(lines[i:j])
            i = j
        else:
            out.append(lines[i])
            i += 1
    return "\n".join(out)


def _cells(row):
    parts = re.split(r"(?<!\\)\|", row.strip())
    return parts[1 if row.strip().startswith("|") else 0: -1 if row.strip().endswith("|") else None]


def _plain(cell):
    """A table cell's visible text."""
    return re.sub(r"[*`]|\]\([^)]*\)|\[", "", cell).strip()


def _respace(rows):
    """One table: header, rule, body rows -> same rows with a proportional rule row."""
    def length(cell):
        return len(_plain(cell))
    aligns = [("L" if c.strip().startswith(":") else "") + ("R" if c.strip().endswith(":") else "") for c in _cells(rows[1])]
    longest = [max(length(_cells(r)[k]) for r in rows[:1] + rows[2:] if k < len(_cells(r))) or 1 for k in range(len(aligns))]
    def longest_word(k):
        return max(min(len(w), 18) for r in rows[:1] + rows[2:] if k < len(_cells(r)) for w in (_plain(_cells(r)[k]).split() or [""]))
    words = [longest_word(k) for k in range(len(aligns))]
    top = max(longest)
    share = [min(max(n, top / 4), top) for n in longest]
    floor = [(w * 0.075 + 0.25) / TEXT_W_IN for w in words]            # the longest word must fit on one line
    frac = [x / sum(share) for x in share]
    short = [k for k, f in enumerate(frac) if f < floor[k]]
    rest = sum(f for k, f in enumerate(frac) if k not in short) or 1
    frac = [floor[k] if k in short else f * (1 - sum(floor[j] for j in short)) / rest for k, f in enumerate(frac)]
    dashes = [max(4, round(100 * f)) for f in frac]
    rule = "|" + "|".join(("" if "L" not in a else ":") + "-" * d + ("" if "R" not in a else ":") for a, d in zip(aligns, dashes)) + "|"
    return [rows[0], rule] + rows[2:]


def convert(section, known, images):
    """One section -> pandoc Markdown."""
    s = section.body
    s = re.sub(r"^[ \t]*<!--\s*site-only:(start|end)\s*-->[ \t]*\n?", "", s, flags=re.M)     # keep the content
    s = re.sub(r"^## Next step\n.*?(?=^## |\Z)", "", s, flags=re.S | re.M)                    # navigation only
    s = convert_figures(s, images)
    s = convert_cards(s)
    s = convert_alerts(s)
    s = convert_callouts(s)
    s = rewrite_links(s, section.key, known)
    s = add_heading_ids(s, section.key)
    s = space_tables(s)
    head = ""
    if section.eyebrow:
        style = "Eyebrow New Page" if section.new_page else "Eyebrow"
        head = f'::: {{custom-style="{style}"}}\n{section.eyebrow}\n:::\n\n'
    standfirst = f'::: {{custom-style="Standfirst"}}\n{section.standfirst}\n:::\n' if section.standfirst else ""
    s = re.sub(r"^(# .+)$", lambda m: f"{m.group(1)}\n\n{standfirst}", s, count=1, flags=re.M)
    return head + re.sub(r"\n{3,}", "\n\n", s).strip() + "\n"


# ================================================================= front and back matter
def contents_markdown(groups, sections, brief):
    """The contents list, with two paragraph styles (group, entry) and a link to every chapter."""
    out = ["# Contents {#contents}\n"]

    def para(style, text):
        out.append(f'::: {{custom-style="{style}"}}\n{text}\n:::\n')
    para("ResourceLinks", f"[Website]({SITE_URL})  ·  [Region planning workbook]({WORKBOOK_URL})")
    if brief:
        for sec in sections:
            title = re.match(r"^# (.+)$", sec.body, flags=re.M).group(1)
            para("TOC Entry", f"[{title}](#art-{sec.key})")
        para("TOC Entry", "[Links](#art-links)")
        return "\n".join(out)
    for g in groups:
        if g.solo:
            para("TOC Group", f"[{g.label}](#art-{g.entries[0].href[:-3]})")
            continue
        para("TOC Group", f"[{g.label}](#art-{g.entries[0].href[:-3]})")
        for e in g.entries:
            para("TOC Entry", f"[{e.name}](#art-{e.href[:-3]})")
    para("TOC Entry", "[Links](#art-links)")
    return "\n".join(out)


def links_markdown(brief=False):
    """The last page: where to find the site and the workbook, then the legal notice."""
    intro = ("This executive brief summarizes the Multi-Region Platform Whitepaper. The full paper contains detailed qualification checks, profile criteria, deployment guidance, placement steps, and service-level resiliency guidance.\n\n"
             if brief else "")
    return ('::: {custom-style="Eyebrow New Page"}\nResources\n:::\n\n'
            "# Links {#art-links}\n\n" + intro +
            f"**Website:** [{SITE_URL}]({SITE_URL})\n\n"
            f"**Region planning workbook:** [{WORKBOOK_URL}]({WORKBOOK_URL})\n\n"
            f'::: {{custom-style="Legal"}}\n{LEGAL}\n:::\n')


def run_xml(text, size=None, bold=False, color=None, caps=False, track=None, raise_=None, fill=None):
    """One run, with properties in schema order."""
    props = f'<w:b/>' if bold else ""
    props += "<w:caps/>" if caps else ""
    props += f'<w:color w:val="{color}"/>' if color else ""
    props += f'<w:spacing w:val="{track}"/>' if track else ""
    props += f'<w:position w:val="{raise_}"/>' if raise_ else ""
    props += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>' if size else ""
    props += f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>' if fill else ""
    return f'<w:r><w:rPr>{props}</w:rPr><w:t xml:space="preserve">{escape(text)}</w:t></w:r>'


def drawing_xml(rid, doc_id, name, descr, cx, cy, anchor_y=None):
    """A picture: inline, or anchored to the page edge at anchor_y (twips from the top) and as wide as the page."""
    graphic = (f'<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
               f'<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{doc_id}" name="{name}" descr="{escape(descr)}"/><pic:cNvPicPr/></pic:nvPicPr>'
               f'<pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
               f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>')
    ns = 'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"'
    prop = f'<wp:docPr id="{doc_id}" name="{name}" descr="{escape(descr)}"/>'
    if anchor_y is None:
        return f'<w:r><w:drawing><wp:inline {ns} distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/>{prop}{graphic}</wp:inline></w:drawing></w:r>'
    return (f'<w:r><w:drawing><wp:anchor {ns} distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="0" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1">'
            f'<wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH>'
            f'<wp:positionV relativeFrom="page"><wp:posOffset>{anchor_y}</wp:posOffset></wp:positionV><wp:extent cx="{cx}" cy="{cy}"/>'
            f'<wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/>{prop}<wp:cNvGraphicFramePr/>{graphic}</wp:anchor></w:drawing></w:r>')


def cover_title_runs(accent):
    """The title, with its accent word in bold blue, on three lines like the PDF cover."""
    m = re.match(r"^(.*?)\s*(multi-region)\s*(.*)$", TITLE)
    if not m:
        return run_xml(TITLE)
    br = "<w:r><w:br/></w:r>"
    return run_xml(m.group(1)) + br + run_xml(m.group(2), bold=True, color=accent) + br + run_xml(m.group(3))


def cover_xml(edition, art_size):
    """The cover section: logo, tags, title, subtitle, edition date, and the artwork band bleeding off the bottom."""
    logo = 0.27 * EMU
    cx = int(PAGE_W / 1440 * EMU)
    cy = int(cx * art_size[1] / art_size[0])
    art_y = int(PAGE_H / 1440 * EMU) - cy
    second_tag = "Executive brief" if edition.key == "brief" else COVER_TAGS[1]
    subtitle = ("A leadership summary: how to make additional Azure regions governed options — adopted when business and workload requirements justify them, without duplicating the platform in every region."
                if edition.key == "brief" else edition.subtitle)
    tags = run_xml(" " + COVER_TAGS[0].upper() + " ", size=15, bold=True, color=BLUE_D, track=24, fill=SOFT) + run_xml("  ") + \
        run_xml(" " + second_tag.upper() + " ", size=15, bold=True, color=TEAL_D, track=24, fill=TEAL_SOFT)
    sect = (f'<w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="{PAGE_W}" w:h="{PAGE_H}"/>'
            f'<w:pgMar w:top="{MARGIN}" w:right="{MARGIN}" w:bottom="{MARGIN}" w:left="{MARGIN}" w:header="540" w:footer="540" w:gutter="0"/></w:sectPr>')
    return (
        f'<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>'
        f'{drawing_xml("rIdCoverArt", 9001, "Cover artwork", "Isometric blocks on a platform, linked by arcs, on a blue gradient", cx, cy, anchor_y=art_y)}'
        f'{drawing_xml("rIdCoverLogo", 9002, "Microsoft logo", "Microsoft logo", int(logo), int(logo))}'
        f'{run_xml(" Microsoft", size=30, color=MUTED, raise_=8)}</w:p>'
        f'<w:p><w:pPr><w:spacing w:before="1500" w:after="260"/></w:pPr>{tags}</w:p>'
        f'<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr>{cover_title_runs(edition.accent)}</w:p>'
        f'<w:p><w:pPr><w:pStyle w:val="Subtitle"/></w:pPr>{run_xml(subtitle, color=edition.accent)}</w:p>'
        f'<w:p><w:pPr><w:pStyle w:val="Date"/></w:pPr>{run_xml(EDITION)}</w:p>'
        f'<w:p><w:pPr>{sect}</w:pPr></w:p>')


def cover_images(edition, work):
    """Write the logo and the cropped artwork band; return (logo path, art path, art pixel size)."""
    s = 480
    logo = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw, gap = ImageDraw.Draw(logo), s // 24
    half = (s - gap) // 2
    for n, color in enumerate(LOGO_COLORS):
        x, y = (n % 2) * (half + gap), (n // 2) * (half + gap)
        draw.rectangle([x, y, x + half - 1, y + half - 1], fill="#" + color)
    logo_path = os.path.join(work, "cover-logo.png")
    logo.save(logo_path)
    art_path = edition.art
    if not os.path.exists(art_path):
        art_path = EDITIONS["full"].art
    with Image.open(art_path) as im:
        im = im.convert("RGBA")
        band = int(im.size[0] * 5.5 / (PAGE_W / 1440))             # the band is 5.5 in tall on an 8.5 in wide page
        top = max(0, min(im.size[1] - band, int(im.size[1] * 0.62) - band // 2))
        art = im.crop((0, top, im.size[0], top + band))
        art_out = os.path.join(work, "cover-art.png")
        art.save(art_out)
    return logo_path, art_out, art.size


# ================================================================= styles (reference document)
def ppr(keep=False, keep_lines=False, brk=False, border="", shade=None, tabs="", before=0, after=100, line=None, left=0, right=0, hanging=0, jc=None, outline=None):
    """Paragraph properties in schema order."""
    x = "<w:keepNext/><w:keepLines/>" if keep else "<w:keepLines/>" if keep_lines else ""
    x += "<w:pageBreakBefore/>" if brk else ""
    x += f"<w:pBdr>{border}</w:pBdr>" if border else ""
    x += f'<w:shd w:val="clear" w:color="auto" w:fill="{shade}"/>' if shade else ""
    x += f"<w:tabs>{tabs}</w:tabs>" if tabs else ""
    x += f'<w:spacing w:before="{before}" w:after="{after}"' + (f' w:line="{line}" w:lineRule="auto"' if line else "") + "/>"
    x += f'<w:ind w:left="{left}" w:right="{right}"' + (f' w:hanging="{hanging}"' if hanging else "") + "/>" if left or right or hanging else ""
    x += f'<w:jc w:val="{jc}"/>' if jc else ""
    x += f'<w:outlineLvl w:val="{outline}"/>' if outline is not None else ""
    return x


def rpr(size=None, bold=False, italic=False, color=None, caps=False, track=None, underline=False):
    """Run properties in schema order."""
    x = "<w:b/><w:bCs/>" if bold else ""
    x += "<w:i/><w:iCs/>" if italic else ""
    x += "<w:caps/>" if caps else ""
    x += f'<w:color w:val="{color}"/>' if color else ""
    x += f'<w:spacing w:val="{track}"/>' if track else ""
    x += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>' if size else ""
    x += '<w:u w:val="single"/>' if underline else ""
    return x


def border(side, color, sz=4, space=0):
    return f'<w:{side} w:val="single" w:sz="{sz}" w:space="{space}" w:color="{color}"/>'


def style(sid, name, p="", r="", based="Normal", typ="paragraph", nxt="BodyText", extra=""):
    """A style definition. The style id is the name without spaces, which is how pandoc finds custom styles."""
    b = f'<w:basedOn w:val="{based}"/>' if based else ""
    n = f'<w:next w:val="{nxt}"/>' if nxt and typ == "paragraph" else ""
    pp = f"<w:pPr>{p}</w:pPr>" if p else ""
    return f'<w:style w:type="{typ}" w:styleId="{sid}"{extra}><w:name w:val="{name}"/>{b}{n}<w:qFormat/>{pp}<w:rPr>{r}</w:rPr></w:style>'


def callout(sid, name, rule, fill, size=None, color=TEXT, rule_sz=18, before=140, after=140):
    """A paragraph box: a left rule and a tinted fill."""
    borders = border("left", rule, rule_sz, 8) + '<w:right w:val="nil" w:space="8"/>'
    return style(sid, name, ppr(border=borders, shade=fill, before=before, after=after, line=288),
                 rpr(size=size, color=color), based="BodyText")


FONT = f'<w:rFonts w:ascii="{FONT_NAME}" w:hAnsi="{FONT_NAME}" w:eastAsia="{FONT_NAME}" w:cs="{FONT_NAME}"/>'
TABLE_BORDERS = "".join(border(side, LINE) for side in ("top", "left", "bottom", "right", "insideH", "insideV"))

STYLES = [
    style("Normal", "Normal", ppr(after=100, line=276), FONT + rpr(size=18, color=TEXT), based="", nxt="", extra=' w:default="1"'),
    style("BodyText", "Body Text", ppr(after=100)),
    style("FirstParagraph", "First Paragraph", ppr(after=100), based="BodyText"),
    style("Compact", "Compact", ppr(before=20, after=20, line=276), based="BodyText"),
    style("CardText", "Card Text", ppr(before=0, after=40, line=250), rpr(size=16), based="BodyText"),
    style("TableText", "Table Text", ppr(before=30, after=30, line=262), rpr(size=17), based="Compact"),
    style("Title", "Title", ppr(before=160, after=160, line=235), rpr(size=56, color=INK), nxt="Subtitle"),
    style("Subtitle", "Subtitle", ppr(before=60, after=120), rpr(size=28, color=BLUE), nxt="Date"),
    style("Date", "Date", ppr(after=0), rpr(size=20, color=MUTED)),
    style("Heading1", "heading 1", ppr(keep=True, border=border("bottom", LINE, 6, 6), before=0, after=160, line=235, outline=0), rpr(size=36, bold=True, color=INK)),
    style("Heading2", "heading 2", ppr(keep=True, before=280, after=80, line=240, outline=1), rpr(size=26, bold=True, color=BLUE_D)),
    style("Heading3", "heading 3", ppr(keep=True, before=200, after=60, line=240, outline=2), rpr(size=21, bold=True, color=SLATE)),
    style("Heading4", "heading 4", ppr(keep=True, before=160, after=40, line=240, outline=3), rpr(size=19, bold=True, color=MUTED)),
    style("Eyebrow", "Eyebrow", ppr(keep=True, border=border("bottom", LINE, 4, 3), before=650, after=60), rpr(size=16, bold=True, color=BLUE, caps=True, track=24), nxt="Heading1"),
    style("EyebrowNewPage", "Eyebrow New Page", ppr(keep=True, brk=True, before=0, after=40), rpr(size=16, bold=True, color=BLUE, caps=True, track=24), based="Eyebrow", nxt="Heading1"),
    style("Standfirst", "Standfirst", ppr(keep=True, before=0, after=180, line=288), rpr(size=22, color=MUTED), based="BodyText"),
    style("BlockText", "Block Text", ppr(border=border("left", LINE, 18, 8), before=100, after=140, left=160, right=120), rpr(color=MUTED), based="BodyText"),
    callout("Question", "Question", BLUE, None, size=24, color=BLUE_D, rule_sz=24, before=200, after=140),
    callout("Decision", "Decision", BLUE, SOFT, color=INK),
    callout("Takeaway", "Takeaway", TEAL, TEAL_SOFT, color=INK),
    style("Attribute", "Attribute", ppr(border=border("left", LINE, 12, 8), before=40, after=80, line=288), based="BodyText"),
    callout("Note", "Note", BLUE, SOFT),
    callout("Tip", "Tip", GREEN, GREEN_SOFT),
    callout("Important", "Important", AMBER, AMBER_SOFT),
    callout("Warning", "Warning", WARM, WARM_SOFT),
    style("ImageCaption", "Image Caption", ppr(keep_lines=True, before=60, after=140, jc="center"), rpr(size=16, italic=True, color=MUTED), based="BodyText"),
    style("CaptionedFigure", "Captioned Figure", ppr(keep=True, before=100, after=0, jc="center"), based="BodyText"),
    style("Figure", "Figure", ppr(keep=True, before=160, after=140, jc="center"), based="BodyText"),
    style("TOCGroup", "TOC Group", ppr(keep=True, border=border("bottom", LINE, 4, 2), tabs=f'<w:tab w:val="right" w:leader="dot" w:pos="{TEXT_W}"/>', before=180, after=40), rpr(size=19, bold=True, color=INK), based="BodyText", nxt="TOCEntry"),
    style("TOCEntry", "TOC Entry", ppr(tabs=f'<w:tab w:val="right" w:leader="dot" w:pos="{TEXT_W}"/>', before=0, after=20, left=240), rpr(size=18), based="BodyText"),
    style("ResourceLinks", "Resource Links", ppr(before=0, after=140), rpr(size=16, color=FAINT), based="BodyText"),
    style("Legal", "Legal", ppr(border=border("top", LINE, 4, 8), before=600, after=0, line=252), rpr(size=15, color=FAINT), based="BodyText"),
    style("Spacer", "Spacer", ppr(before=0, after=0, line=120), rpr(size=8), based="Normal"),
    style("Label", "Label", r=rpr(bold=True, color=BLUE_D), based="DefaultParagraphFont", typ="character"),
    style("LabelTeal", "Label Teal", r=rpr(bold=True, color=TEAL_D), based="Label", typ="character"),
    style("LabelWarm", "Label Warm", r=rpr(bold=True, color=WARM), based="Label", typ="character"),
    style("Hyperlink", "Hyperlink", r=rpr(color=BLUE, underline=True), based="DefaultParagraphFont", typ="character"),
]
TABLE_STYLES = [
    '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/>'
    '<w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>',
    f'<w:style w:type="table" w:styleId="Table"><w:name w:val="Table"/><w:basedOn w:val="TableNormal"/><w:qFormat/>'
    f'<w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblBorders>{TABLE_BORDERS}</w:tblBorders>'
    f'<w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr>'
    '</w:style>',
]


def build_reference(path):
    """pandoc's default reference.docx with this publication's styles and Aptos as the theme font."""
    raw = subprocess.run(["pandoc", "--print-default-data-file", "reference.docx"], capture_output=True, check=True).stdout
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        parts = {n: z.read(n) for n in z.namelist()}
    s = parts["word/styles.xml"].decode("utf-8")
    for xml in STYLES + TABLE_STYLES:
        sid = re.search(r'w:styleId="([^"]+)"', xml).group(1)
        s, n = re.subn(rf'<w:style [^>]*w:styleId="{sid}"[^>]*>.*?</w:style>', lambda _m: xml, s, count=1, flags=re.S)
        if not n:
            s = s.replace("</w:styles>", xml + "</w:styles>")
    s = re.sub(r"<w:rPrDefault>.*?</w:rPrDefault>", f'<w:rPrDefault><w:rPr>{FONT}<w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>', s, flags=re.S)
    parts["word/styles.xml"] = s.encode("utf-8")
    # pandoc limits a picture to the text width of the reference document, which has no page setup of its own
    page = f'<w:sectPr><w:pgSz w:w="{PAGE_W}" w:h="{PAGE_H}"/><w:pgMar w:top="1000" w:right="{MARGIN}" w:bottom="1000" w:left="{MARGIN}" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr>'
    parts["word/document.xml"] = parts["word/document.xml"].decode("utf-8").replace("<w:sectPr />", page).encode("utf-8")
    theme = parts["word/theme/theme1.xml"].decode("utf-8")
    parts["word/theme/theme1.xml"] = re.sub(r'(<a:(?:major|minor)Font>\s*<a:latin typeface=")[^"]*', rf"\g<1>{FONT_NAME}", theme).encode("utf-8")
    write_zip(path, parts)


def write_zip(path, parts):
    """Write a package, [Content_Types].xml first."""
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for name in sorted(parts, key=lambda n: (n != "[Content_Types].xml", n)):
            z.writestr(name, parts[name])


# ================================================================= post-pass on the package
def field_xml(instr, result, rpr_xml, dirty=False):
    """A complex field with a cached result."""
    mark = ' w:dirty="true"' if dirty else ""
    return (f'<w:r>{rpr_xml}<w:fldChar w:fldCharType="begin"{mark}/></w:r><w:r>{rpr_xml}<w:instrText xml:space="preserve"> {instr} </w:instrText></w:r>'
            f'<w:r>{rpr_xml}<w:fldChar w:fldCharType="separate"/></w:r><w:r>{rpr_xml}<w:t>{escape(result)}</w:t></w:r><w:r>{rpr_xml}<w:fldChar w:fldCharType="end"/></w:r>')


def header_xml(right=None):
    """Running header on one line: publication title left; right, the current eyebrow (part and check, or the brief's
    section number and name; STYLEREF "Eyebrow") or a fixed word for the pages that have no eyebrow."""
    small = f'<w:rPr><w:caps/><w:color w:val="{MUTED}"/><w:spacing w:val="20"/><w:sz w:val="14"/></w:rPr>'
    tail = field_xml('STYLEREF "Eyebrow"', "Overview", small) if right is None else f"<w:r>{small}<w:t>{escape(right)}</w:t></w:r>"
    return (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="{W}"><w:p><w:pPr><w:pBdr>{border("bottom", LINE, 4, 6)}</w:pBdr>'
            f'<w:tabs><w:tab w:val="right" w:pos="{TEXT_W}"/></w:tabs><w:spacing w:after="0"/></w:pPr>'
            f'<w:r>{small}<w:t>{escape(RUNNING_TITLE)}</w:t></w:r><w:r>{small}<w:tab/></w:r>{tail}</w:p></w:hdr>')


def footer_xml(edition):
    """Footer: publication and edition left, page number right."""
    small = f'<w:rPr><w:color w:val="{MUTED}"/><w:sz w:val="15"/></w:rPr>'
    ink = f'<w:rPr><w:b/><w:color w:val="{INK}"/><w:sz w:val="15"/></w:rPr>'
    return (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="{W}"><w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="{TEXT_W}"/></w:tabs><w:spacing w:after="0"/></w:pPr>'
            f'<w:r>{small}<w:t>{escape(f"Microsoft · {edition.subtitle} · {EDITION}")}</w:t></w:r><w:r>{small}<w:tab/></w:r>{field_xml("PAGE", "1", ink)}</w:p></w:ftr>')


HEADERS = {"eyebrow": ("rIdHeaderEyebrow", None), "contents": ("rIdHeaderContents", "Contents"), "links": ("rIdHeaderLinks", "Links")}


def section_xml(header, final=False):
    """The properties of one section of the body: running header (a key of HEADERS), the shared footer, page size, margins.
    The final one sits in the body; the others sit in the last paragraph of their section (section_break)."""
    ns = f' xmlns:w="{W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"' if final else ""
    return (f'<w:sectPr{ns}><w:headerReference w:type="default" r:id="{HEADERS[header][0]}"/><w:footerReference w:type="default" r:id="rIdFooter1"/>'
            f'<w:type w:val="nextPage"/><w:pgSz w:w="{PAGE_W}" w:h="{PAGE_H}"/>'
            f'<w:pgMar w:top="1040" w:right="{MARGIN}" w:bottom="920" w:left="{MARGIN}" w:header="500" w:footer="460" w:gutter="0"/></w:sectPr>')


def section_break(header):
    """Raw openxml block: an empty paragraph that ends a section, so that the next page has its own header."""
    return ('```{=openxml}\n<w:p><w:pPr><w:pStyle w:val="Spacer"/>' + section_xml(header) + '</w:pPr></w:p>\n```\n')


def core_xml(edition):
    """Document properties: title, creator, subject, keywords, dates from the edition (not the build date)."""
    stamp = datetime.datetime.strptime(EDITION, "%B %Y").strftime("%Y-%m-%dT00:00:00Z")
    title = TITLE if edition.key == "full" else f"{TITLE}: {edition.subtitle.lower()}"
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            f'<dc:title>{escape(title)}</dc:title><dc:subject>{escape(edition.subtitle)}</dc:subject><dc:creator>Microsoft</dc:creator><cp:keywords>{escape(KEYWORDS)}</cp:keywords>'
            f'<cp:lastModifiedBy>Microsoft</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">{stamp}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">{stamp}</dcterms:modified></cp:coreProperties>')


def el(tag, **attrs):
    e = etree.Element(q(tag))
    for k, v in attrs.items():
        e.set(q(k), str(v))
    return e


def marker(node):
    """The card-grid marker text of a body element, or None."""
    if node.tag != q("p"):
        return None
    text = "".join(node.itertext()).strip()
    return text if text in (ROW, COL, END) else None


def card_table(cells):
    """A borderless table, one tinted cell per column, white gutters between the cards."""
    n = len(cells)
    tbl = el("tbl")
    pr = etree.SubElement(tbl, q("tblPr"))
    etree.SubElement(pr, q("tblW"), {q("w"): str(TEXT_W), q("type"): "dxa"})
    borders = etree.SubElement(pr, q("tblBorders"))
    for side in ("top", "left", "bottom", "right"):
        etree.SubElement(borders, q(side), {q("val"): "nil"})
    etree.SubElement(borders, q("insideH"), {q("val"): "nil"})
    etree.SubElement(borders, q("insideV"), {q("val"): "single", q("sz"): "48", q("color"): "FFFFFF"})
    etree.SubElement(pr, q("tblLayout"), {q("type"): "fixed"})
    mar = etree.SubElement(pr, q("tblCellMar"))
    for side, w in (("top", 80), ("left", 140), ("bottom", 40), ("right", 140)):
        etree.SubElement(mar, q(side), {q("w"): str(w), q("type"): "dxa"})
    grid = etree.SubElement(tbl, q("tblGrid"))
    for _ in cells:
        etree.SubElement(grid, q("gridCol"), {q("w"): str(TEXT_W // n)})
    row = etree.SubElement(tbl, q("tr"))
    for content in cells:
        tc = etree.SubElement(row, q("tc"))
        tcpr = etree.SubElement(tc, q("tcPr"))
        etree.SubElement(tcpr, q("tcW"), {q("w"): str(TEXT_W // n), q("type"): "dxa"})
        etree.SubElement(tcpr, q("shd"), {q("val"): "clear", q("color"): "auto", q("fill"): WASH})
        for node in content:
            for st in node.iterfind(".//w:pStyle", NS):
                if st.get(q("val")) in ("BodyText", "FirstParagraph", "Compact"):
                    st.set(q("val"), "CardText")
            tc.append(node)
        if not len(content) or content[-1].tag != q("p"):
            tc.append(el("p"))
    return tbl


def wrap_cards(body):
    """Replace each ROW … COL … END marker run by a card table (followed by a small spacer paragraph)."""
    nodes = list(body)
    i = 0
    while i < len(nodes):
        if marker(nodes[i]) != ROW:
            i += 1
            continue
        cells, j = [], i + 1
        while marker(nodes[j]) != END:
            if marker(nodes[j]) == COL:
                cells.append([])
            else:
                cells[-1].append(nodes[j])
            j += 1
        table, spacer = card_table(cells), el("p")
        etree.SubElement(etree.SubElement(spacer, q("pPr")), q("pStyle"), {q("val"): "Spacer"})
        body.insert(body.index(nodes[i]), table)
        table.addnext(spacer)
        for node in nodes[i:j + 1]:
            if node.getparent() is body:                           # content nodes already moved into the cells
                body.remove(node)
        i = j + 1


def emphasize(cell, color=None):
    """Bold (and optionally colored) runs in a table cell, keeping the schema order of run properties."""
    for run in cell.iter(q("r")):
        props = run.find("w:rPr", NS)
        if props is None:
            props = el("rPr")
            run.insert(0, props)
        if props.find("w:b", NS) is None:
            at = 1 if props.find("w:rStyle", NS) is not None else 0
            props.insert(at, el("b"))
        if color and props.find("w:rStyle", NS) is None and props.find("w:color", NS) is None:
            props.append(el("color", val=color))


def finish_tables(root):
    """Data tables: tinted header row, bold first column, table text style, rows that never split across pages, no single-row pages."""
    for tbl in root.iter(q("tbl")):
        if tbl.find("w:tblPr/w:tblLayout", NS) is not None and tbl.find("w:tblPr/w:tblStyle", NS) is None:
            # Card grids have a fixed layout but no data-table style.
            continue
        for p in tbl.iter(q("p")):
            st = p.find("w:pPr/w:pStyle", NS)
            if st is not None and st.get(q("val")) in ("Compact", "BodyText", "FirstParagraph"):
                st.set(q("val"), "TableText")
        rows = tbl.findall("w:tr", NS)
        header = [" ".join("".join(tc.itertext()).split()) for tc in rows[0].findall("w:tc", NS)] if rows else []
        if header[:2] == ["Today", "With this model"]:
            left_width = round(TEXT_W * 0.49)
            widths = [left_width, TEXT_W - left_width]
        elif header[:1] == ["Scenario"] and len(header) == 5:
            widths = [1400, 1700, 1700, 3100, TEXT_W - 7900]
        elif header == ["Component", "Make it local when", "Keep it remote when", "Guidance"]:
            widths = [1600, 2100, 3900, TEXT_W - 7600]
        elif header == ["Area", "What to do", "Guidance"]:
            old = [int(c.get(q("w"), "1")) for c in tbl.findall("w:tblGrid/w:gridCol", NS)]
            remain, old_rest = TEXT_W - 1600, sum(old[1:]) or 1
            widths = [1600] + [round(remain * x / old_rest) for x in old[1:]]
            widths[-1] += TEXT_W - sum(widths)
        else:
            widths = []
        if widths:
            grid = tbl.find("w:tblGrid", NS)
            for col, width in zip(grid.findall("w:gridCol", NS), widths):
                col.set(q("w"), str(width))
            for tr in rows:
                for tc, width in zip(tr.findall("w:tc", NS), widths):
                    tcw = tc.find("w:tcPr/w:tcW", NS)
                    if tcw is not None:
                        tcw.set(q("w"), str(width))
        keep_rows = rows[:-1] if len(rows) <= 6 else rows[:2] + rows[-2:-1]
        for tr in keep_rows:
            for p in tr.iter(q("p")):
                _set_ppr_child(_ppr(p), "keepNext")
        for tr in rows:
            is_header = tr.find("w:trPr/w:tblHeader", NS) is not None
            for n, tc in enumerate(tr.findall("w:tc", NS)):
                if is_header:
                    tcpr = tc.find("w:tcPr", NS)
                    tcpr.append(el("shd", val="clear", color="auto", fill=WASH))
                    emphasize(tc, INK)
                elif n == 0 and header[:1] not in (["Today"], ["Scenario"]):
                    emphasize(tc, INK)
        if header[:2] == ["Today", "With this model"] and rows:
            for tc in rows[-1].findall("w:tc", NS):
                tcpr = tc.find("w:tcPr", NS)
                if tcpr is not None and tcpr.find("w:noWrap", NS) is None:
                    tcpr.append(el("noWrap"))
                for run in tc.iter(q("r")):
                    rpr_ = run.find("w:rPr", NS)
                    style_ = rpr_.find("w:rStyle", NS) if rpr_ is not None else None
                    if style_ is None or style_.get(q("val")) != "VerbatimChar":
                        continue
                    for size_tag in ("sz", "szCs"):
                        size = rpr_.find(f"w:{size_tag}", NS)
                        if size is None:
                            size = etree.SubElement(rpr_, q(size_tag))
                        size.set(q("val"), "16")
    for tbl in root.iter(q("tbl")):                                   # air between a table and the paragraph under it
        after = tbl.getnext()
        if after is not None and after.tag == q("p"):
            ppr_ = after.find("w:pPr", NS)
            if ppr_ is not None and [c.tag for c in ppr_] == [q("pStyle")] and ppr_[0].get(q("val")) in ("BodyText", "FirstParagraph"):
                ppr_.append(el("spacing", before=140))
    for tr in root.iter(q("tr")):
        trpr = tr.find("w:trPr", NS)
        if trpr is None:
            trpr = el("trPr")
            tr.insert(1 if tr.find("w:tblPrEx", NS) is not None else 0, trpr)
        if trpr.find("w:cantSplit", NS) is None:
            trpr.insert(0, el("cantSplit"))


def plain_contents_links(root):
    """Links in the contents list are not underlined."""
    for p in root.iter(q("p")):
        st = p.find("w:pPr/w:pStyle", NS)
        if st is not None and st.get(q("val")) in ("TOCGroup", "TOCEntry", "ResourceLinks"):
            for props in p.iterfind(".//w:hyperlink/w:r/w:rPr", NS):
                underline = props.find("w:u", NS)
                if underline is None:
                    underline = el("u")
                    props.append(underline)
                underline.set(q("val"), "none")
                if st.get(q("val")) in ("TOCGroup", "ResourceLinks"):
                    color = props.find("w:color", NS)
                    if color is None:
                        color = el("color")
                        props.append(color)
                    color.set(q("val"), INK if st.get(q("val")) == "TOCGroup" else MUTED)


def add_page_refs(root):
    """Append a dirty PAGEREF field to each linked contents entry."""
    small = f'<w:rPr><w:color w:val="{INK}"/><w:sz w:val="18"/></w:rPr>'
    for p in root.iter(q("p")):
        st = p.find("w:pPr/w:pStyle", NS)
        if st is None or st.get(q("val")) not in ("TOCGroup", "TOCEntry"):
            continue
        link = p.find("w:hyperlink", NS)
        anchor = link.get(q("anchor")) if link is not None else None
        if not anchor:
            continue
        tab = el("r")
        etree.SubElement(tab, q("tab"))
        p.append(tab)
        instr = f"PAGEREF {anchor} \\h"
        fields = etree.fromstring(f'<root xmlns:w="{W}">{field_xml(instr, "1", small, dirty=True)}</root>'.encode("utf-8"))
        for field in list(fields):
            p.append(field)


def _ppr(p):
    ppr_ = p.find("w:pPr", NS)
    if ppr_ is None:
        ppr_ = el("pPr")
        p.insert(0, ppr_)
    return ppr_


def _set_ppr_child(ppr_, name, **attrs):
    child = ppr_.find(f"w:{name}", NS)
    if child is None:
        child = el(name)
        order = ["pStyle", "keepNext", "keepLines", "pageBreakBefore", "framePr", "widowControl", "numPr",
                 "suppressLineNumbers", "pBdr", "shd", "tabs", "suppressAutoHyphens", "kinsoku", "wordWrap",
                 "overflowPunct", "topLinePunct", "autoSpaceDE", "autoSpaceDN", "bidi", "adjustRightInd",
                 "snapToGrid", "spacing", "ind", "contextualSpacing", "mirrorIndents", "suppressOverlap", "jc",
                 "textDirection", "textAlignment", "textboxTightWrap", "outlineLvl", "divId", "cnfStyle",
                 "rPr", "sectPr", "pPrChange"]
        index = order.index(name) if name in order else len(order)
        before = next((i for i, node in enumerate(ppr_) if node.tag in {q(n) for n in order[index + 1:]}), len(ppr_))
        ppr_.insert(before, child)
    for key, value in attrs.items():
        child.set(q(key), str(value))
    return child


def finish_paragraphs(body):
    """Keep headings, captions, labels, and lead-ins with what they introduce; set list and widow spacing."""
    for p in body.iter(q("p")):
        ppr_ = _ppr(p)
        _set_ppr_child(ppr_, "widowControl")
        st = ppr_.find("w:pStyle", NS)
        style_id = st.get(q("val"), "") if st is not None else ""
        text = "".join(p.itertext()).strip()
        if style_id in ("Heading1", "Heading2", "Heading3", "Heading4", "Eyebrow", "EyebrowNewPage"):
            _set_ppr_child(ppr_, "keepNext")
            _set_ppr_child(ppr_, "keepLines")
        if p.find(".//w:drawing", NS) is not None:
            ppr_.remove(ppr_.find("w:ind", NS)) if ppr_.find("w:ind", NS) is not None else None
            _set_ppr_child(ppr_, "jc", val="center")
            _set_ppr_child(ppr_, "keepLines")
            following = p.getnext()
            if following is not None and following.tag == q("p"):
                next_style = following.find("w:pPr/w:pStyle", NS)
                if next_style is not None and next_style.get(q("val")) in ("ImageCaption", "CaptionedFigure"):
                    _set_ppr_child(ppr_, "keepNext")
        if style_id == "Figure":
            _set_ppr_child(ppr_, "jc", val="center")
        if style_id != "ImageCaption" and text and len(text) <= 100:
            runs = [r for r in p.iter(q("r")) if "".join(r.itertext()).strip()]
            if runs and all(r.find("w:rPr/w:b", NS) is not None for r in runs):
                _set_ppr_child(ppr_, "keepNext")
        if text.endswith(":"):
            nxt = p.getnext()
            while nxt is not None and nxt.tag == q("p") and not "".join(nxt.itertext()).strip():
                nxt = nxt.getnext()
            if nxt is not None and (nxt.tag == q("tbl") or (nxt.tag == q("p") and
                    (nxt.find("w:pPr/w:numPr", NS) is not None or nxt.find(".//w:drawing", NS) is not None))):
                _set_ppr_child(ppr_, "keepNext")
        if p.find("w:pPr/w:numPr", NS) is not None:
            num = p.find("w:pPr/w:numPr/w:numId", NS)
            level = p.find("w:pPr/w:numPr/w:ilvl", NS)
            next_item = p.getnext()
            while next_item is not None and next_item.tag == q("p") and not "".join(next_item.itertext()).strip():
                next_item = next_item.getnext()
            next_num = next_item.find("w:pPr/w:numPr/w:numId", NS) if next_item is not None and next_item.tag == q("p") else None
            next_level = next_item.find("w:pPr/w:numPr/w:ilvl", NS) if next_item is not None and next_item.tag == q("p") else None
            same_list = num is not None and next_num is not None and num.get(q("val")) == next_num.get(q("val"))
            deeper_list = same_list and level is not None and next_level is not None and int(next_level.get(q("val"))) > int(level.get(q("val")))
            if not same_list or deeper_list:
                spacing = ppr_.find("w:spacing", NS)
                if spacing is None:
                    spacing = _set_ppr_child(ppr_, "spacing")
                spacing.set(q("after"), "100")

    for p in body.iter(q("p")):
        if p.getnext() is None or p.getnext().tag != q("tbl"):
            continue
        text = "".join(p.itertext()).strip()
        if text and any(r.find("w:rPr/w:i", NS) is not None for r in p.iter(q("r"))):
            ppr_ = _ppr(p)
            st = ppr_.find("w:pStyle", NS)
            if st is None:
                st = el("pStyle", val="ImageCaption")
                ppr_.insert(0, st)
            else:
                st.set(q("val"), "ImageCaption")


def start_eyebrow_pages(root):
    """An eyebrow that starts a page is a plain Eyebrow (so the running header can quote one style) with a page break before it."""
    for p in root.iter(q("p")):
        st = p.find("w:pPr/w:pStyle", NS)
        if st is None or st.get(q("val")) != "EyebrowNewPage":
            continue
        st.set(q("val"), "Eyebrow")
        _set_ppr_child(p.find("w:pPr", NS), "pageBreakBefore")
        spacing = p.find("w:pPr/w:spacing", NS)
        if spacing is None:
            spacing = _set_ppr_child(p.find("w:pPr", NS), "spacing")
        spacing.set(q("before"), "0")


def describe_pictures(root):
    """pandoc names the inner picture after the file; give it the same description as the drawing."""
    ns = {"wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing", "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture"}
    for drawing in root.iter(q("drawing")):
        outer = drawing.find(".//wp:docPr", ns)
        inner = drawing.find(".//pic:cNvPr", ns)
        if outer is None or inner is None:
            continue
        if not outer.get("descr") and outer.get("title"):         # a picture without a caption carries its alt text as the title
            outer.set("descr", outer.get("title"))
            outer.set("title", "")
        inner.set("descr", outer.get("descr", ""))


def flow_brief(body):
    """Balance the brief without forced chapter breaks; keep captions and individual scenario rows intact."""
    for tbl in body.findall("w:tbl", NS):
        text = "".join(tbl.itertext()).strip()
        if text.startswith("Hybrid-connected applications"):
            # Readable card text also balances the governance page before the full-size city map.
            for run in tbl.iter(q("r")):
                props = run.find("w:rPr", NS)
                if props is None:
                    props = el("rPr")
                    run.insert(0, props)
                for name in ("sz", "szCs"):
                    size = props.find(f"w:{name}", NS)
                    if size is None:
                        size = etree.SubElement(props, q(name))
                    size.set(q("val"), "19")
        if text.startswith("ScenarioQualification"):
            widths = [2300, 1700, 1800, 2100, 2180]
            for col, width in zip(tbl.findall("w:tblGrid/w:gridCol", NS), widths):
                col.set(q("w"), str(width))
            for row in tbl.findall("w:tr", NS):
                for cell, width in zip(row.findall("w:tc", NS), widths):
                    props = cell.find("w:tcPr", NS)
                    if props is None:
                        props = el("tcPr")
                        cell.insert(0, props)
                    size = props.find("w:tcW", NS)
                    if size is None:
                        size = el("tcW", type="dxa")
                        props.insert(0, size)
                    size.set(q("w"), str(width))
            # Keep the header with the first scenario, not all four scenarios.
            for row in tbl.findall("w:tr", NS)[1:]:
                for p in row.iter(q("p")):
                    _set_ppr_child(_ppr(p), "keepNext", val="0")
    for p in body.findall("w:p", NS):
        st = p.find("w:pPr/w:pStyle", NS)
        style_id = st.get(q("val"), "") if st is not None else ""
        following = p.getnext()
        if style_id == "Standfirst" and following is not None and (
                following.tag == q("tbl") or following.find(".//w:drawing", NS) is not None):
            _set_ppr_child(_ppr(p), "keepNext", val="0")
        if style_id == "Figure" and following is not None and following.find(".//w:drawing", NS) is not None:
            # The city map and its separate legend may occupy consecutive pages.
            _set_ppr_child(_ppr(p), "keepNext", val="0")
        if style_id == "Eyebrow" and "".join(p.itertext()).strip() == "Resources":
            brk = p.find("w:pPr/w:pageBreakBefore", NS)
            if brk is not None:
                p.find("w:pPr", NS).remove(brk)
            _set_ppr_child(_ppr(p), "spacing", before="650")
        if style_id == "Legal":
            _set_ppr_child(_ppr(p), "spacing", before="140")
            _set_ppr_child(_ppr(p), "keepLines")


def finish_document(data, edition):
    """document.xml: card tables, table rows, page breaks, and the last section with its header and footer."""
    root = etree.fromstring(data)
    body = root.find("w:body", NS)
    wrap_cards(body)
    finish_tables(root)
    finish_paragraphs(body)
    describe_pictures(root)
    plain_contents_links(root)
    start_eyebrow_pages(root)
    if edition.key == "brief":
        flow_brief(body)
    add_page_refs(body)
    for old in body.findall("w:sectPr", NS):
        body.remove(old)
    body.append(etree.fromstring(section_xml("links" if edition.key == "full" else "eyebrow", final=True)))
    return etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)


def tighten_lists(data):
    """pandoc indents list levels by 0.5 in; at 9 pt a quarter inch reads better."""
    s = data.decode("utf-8")
    s = re.sub(r'<w:ind w:left="(\d+)" w:hanging="\d+"\s*/>', lambda m: f'<w:ind w:left="{int(m.group(1)) // 2}" w:hanging="260"/>', s)
    return s.encode("utf-8")


def finish_package(path, edition, logo, art):
    """Add header, footer, cover pictures and properties to pandoc's output; post-process document.xml."""
    with zipfile.ZipFile(path) as z:
        parts = {n: z.read(n) for n in z.namelist()}
    parts["word/document.xml"] = finish_document(parts["word/document.xml"], edition)
    if "word/numbering.xml" in parts:
        parts["word/numbering.xml"] = tighten_lists(parts["word/numbering.xml"])
    for n, (rid, right) in enumerate(HEADERS.values(), 1):
        parts[f"word/header{n}.xml"] = header_xml(right).encode("utf-8")
    parts["word/footer1.xml"] = footer_xml(edition).encode("utf-8")
    parts["word/media/cover-logo.png"] = open(logo, "rb").read()
    parts["word/media/cover-art.png"] = open(art, "rb").read()
    parts["docProps/core.xml"] = core_xml(edition).encode("utf-8")
    base = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    rels = "".join(f'<Relationship Id="{i}" Type="{base}/{t}" Target="{target}"/>' for i, t, target in (
        *((rid, "header", f"header{n}.xml") for n, (rid, _) in enumerate(HEADERS.values(), 1)), ("rIdFooter1", "footer", "footer1.xml"),
        ("rIdCoverLogo", "image", "media/cover-logo.png"), ("rIdCoverArt", "image", "media/cover-art.png")))
    parts["word/_rels/document.xml.rels"] = parts["word/_rels/document.xml.rels"].decode("utf-8").replace("</Relationships>", rels + "</Relationships>").encode("utf-8")
    types = "".join(f'<Override PartName="/word/{n}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.{n[:-1]}+xml"/>' for n in ("header1", "header2", "header3", "footer1"))
    ct = parts["[Content_Types].xml"].decode("utf-8")
    if 'Extension="png"' not in ct:
        types += '<Default Extension="png" ContentType="image/png"/>'
    parts["[Content_Types].xml"] = ct.replace("</Types>", types + "</Types>").encode("utf-8")
    write_zip(path, parts)


# ================================================================= checks
def check_links(path):
    """Fail on a dead internal link, a relative external link, a picture without alt text or one wider than the text. Returns the counts."""
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8")
        rels = z.read("word/_rels/document.xml.rels").decode("utf-8")
    anchors = re.findall(r'w:anchor="([^"]+)"', xml)
    bookmarks = set(re.findall(r'<w:bookmarkStart [^>]*w:name="([^"]+)"', xml))
    dead = sorted({a for a in anchors if a not in bookmarks})
    external = re.findall(r'<Relationship [^>]*Target="([^"]+)"[^>]*TargetMode="External"', rels) + \
        re.findall(r'<Relationship [^>]*TargetMode="External"[^>]*Target="([^"]+)"', rels)
    relative = sorted({t for t in external if not t.startswith("http")})
    pictures = re.findall(r"<wp:docPr [^>]*>", xml)
    no_alt = [p for p in pictures if not re.search(r'descr="[^"]+"', p)]
    wide = [int(m) for m in re.findall(r'<wp:inline[^>]*><wp:extent cx="(\d+)"', xml) if int(m) > TEXT_W_IN * EMU + EMU // 50]
    problems = [f"{len(wide)} picture(s) wider than the text" if wide else "", f"dead internal links: {', '.join(dead)}" if dead else "", f"relative external links: {', '.join(relative)}" if relative else "",
                f"{len(no_alt)} picture(s) without alt text" if no_alt else ""]
    if any(problems):
        raise SystemExit("error: " + "; ".join(p for p in problems if p))
    return len(anchors), len(pictures)


def check_pandoc():
    """Pandoc 3 is required: the picture alt attribute and the figure styles depend on it."""
    try:
        out = subprocess.run(["pandoc", "--version"], capture_output=True, text=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        raise SystemExit("error: pandoc was not found; install pandoc 3 or newer")
    version = re.search(r"pandoc (\d+)\.", out)
    if not version or int(version.group(1)) < 3:
        raise SystemExit(f"error: pandoc 3 or newer is required, found {out.splitlines()[0]}")


# ================================================================= build
def brief_sources():
    """(brief.md, brief_figures.py) paths, or None when either is missing."""
    md, fig = os.path.join(BRIEF_DIR, "brief.md"), os.path.join(BRIEF_DIR, "brief_figures.py")
    return (md, fig) if os.path.exists(md) and os.path.exists(fig) else None


def capture_brief_figures(module_path, out_dir):
    """Run word/brief_figures.py capture(out_dir): {figure name: png path}."""
    spec = importlib.util.spec_from_file_location("brief_figures", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    found = {}
    for name, path in module.capture(out_dir).items():
        found[os.path.basename(path)] = found[name if name.endswith(".png") else name + ".png"] = path
    return found


def build(key, out=None):
    """Build one edition; returns the output path."""
    check_pandoc()
    edition = EDITIONS[key]
    out = out or edition.out
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    work = tempfile.mkdtemp(prefix="mrp-docx-")
    try:
        if key == "full":
            groups = toc_outline()
            sections = full_sections(groups)
            sources = brief_sources()
            if sources:
                spec = importlib.util.spec_from_file_location("brief_figures", sources[1])
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                extra = module.capture_pdf_city(os.path.join(work, "city-capture"))
                images = Images(work, extra)
            else:
                images = Images(work)
        else:
            md, fig = brief_sources()
            groups, sections = [], brief_sections(md)
            images = Images(work, capture_brief_figures(fig, os.path.join(work, "capture")))
        known = {s.source[:-3] for s in sections if s.source}
        logo, art, art_size = cover_images(edition, work)
        full = key == "full"
        parts = ["```{=openxml}\n" + cover_xml(edition, art_size) + "\n```\n", contents_markdown(groups, sections, not full)]
        parts += [section_break("contents")] if full else []
        parts += [convert(s, known, images) for s in sections]
        parts += [section_break("eyebrow")] if full else []
        parts.append(links_markdown(brief=not full))
        source = os.path.join(work, "combined.md")
        open(source, "w", encoding="utf-8").write("\n".join(parts))
        reference = os.path.join(work, "reference.docx")
        build_reference(reference)
        subprocess.run(["pandoc", source, "-f", "markdown+pipe_tables+implicit_figures+link_attributes+fenced_divs+bracketed_spans-auto_identifiers",
                        "-t", "docx", "--reference-doc", reference, "--resource-path", os.pathsep.join((ROOT, work)), "-o", out], check=True)
        finish_package(out, edition, logo, art)
        links, pictures = check_links(out)
        print(f"wrote {out} ({os.path.getsize(out) / 1e6:.1f} MB, {len(sections)} chapters, {links} internal links, 0 dead, {pictures} pictures with alt text)")
        return out
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main(argv):
    if not argv:
        build("full")
        if brief_sources():
            build("brief")
        else:
            print("skipped the executive brief: word/brief.md or word/brief_figures.py is missing")
    elif argv[0] in EDITIONS:
        if argv[0] == "brief" and not brief_sources():
            raise SystemExit("error: the executive brief needs word/brief.md and word/brief_figures.py, and at least one is missing")
        build(argv[0], argv[1] if len(argv) > 1 else None)
    elif argv[0].endswith(".docx"):
        build("full", argv[0])
    else:
        raise SystemExit(__doc__.split("\n\n")[0] + "\n\nusage: build.py [full|brief] [out.docx]")


if __name__ == "__main__":
    main(sys.argv[1:])
