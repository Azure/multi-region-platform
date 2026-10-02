#!/usr/bin/env python3
"""Build the Word edition of the guidance from the Markdown in content/.

    python3 word/build.py            ->  dist/Adaptable-Multi-Region-Azure-Platform.docx

The Word document is generated, never edited by hand: it carries the same text as the website,
in toc.yml order, with the figures from content/media. Needs pandoc (3.x) and PyYAML.
The output goes to dist/, which is git-ignored.
"""
import os, re, shutil, subprocess, sys, tempfile, zipfile
import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
OUT = os.path.join(ROOT, "dist", "Adaptable-Multi-Region-Azure-Platform.docx")
TITLE = "Adaptable multi-region Azure platform"
SUBTITLE = "Technical guidance"
FIG_W = "6.5in"
ALERT = {"NOTE": "Note", "TIP": "Tip", "IMPORTANT": "Important", "WARNING": "Warning", "CAUTION": "Caution"}


def toc_order():
    toc = yaml.safe_load(open(os.path.join(CONTENT, "toc.yml"), encoding="utf-8"))
    out = []

    def walk(items):
        for it in items:
            href = it.get("href", "")
            if href.endswith(".md"):
                out.append(href)
            walk(it.get("items", []))
    walk(toc["items"])
    return out


def slug(name):
    return "art-" + name[:-3]


def contents():
    """A static, linked contents list that follows toc.yml (no field to update when the file opens)."""
    toc = yaml.safe_load(open(os.path.join(CONTENT, "toc.yml"), encoding="utf-8"))
    out = ['::: {custom-style="TOC Heading"}', "Contents", ":::", ""]

    def walk(items, depth):
        for it in items:
            href, name = it.get("href", ""), it["name"]
            label = f"[{name}](#{slug(href)})" if href.endswith(".md") else name
            out.append("    " * depth + "- " + label)
            walk(it.get("items", []), depth + 1)
    walk(toc["items"], 0)
    return "\n".join(out) + "\n"


def convert(name):
    """One Learn-flavored article -> pandoc Markdown."""
    s = open(os.path.join(CONTENT, name), encoding="utf-8").read().replace("\r\n", "\n")
    meta = {}
    m = re.match(r"^---\n(.*?)\n---\n", s, flags=re.S)
    if m:
        meta = yaml.safe_load(m.group(1)) or {}
        s = s[m.end():]
    s = re.sub(r"^[ \t]*<!--\s*site-only:(start|end)\s*-->[ \t]*\n?", "", s, flags=re.M)   # keep the content
    s = re.sub(r"^## Next step\n.*?(?=^## |\Z)", "", s, flags=re.S | re.M)                 # navigation only

    # figures: :::image ...::: followed by an italic caption paragraph
    def fig(mm):
        src, cap = mm.group(1), (mm.group(3) or "").strip()
        base = os.path.basename(src)
        path = os.path.join(CONTENT, "media", base)
        if not os.path.exists(path):
            path = os.path.join(ROOT, "site", "media", base)
        cap = cap.replace("[", "(").replace("]", ")")
        return f"![{cap}]({path}){{width={FIG_W}}}\n"
    s = re.sub(r':::image[^\n]*?source="([^"]+)"[^\n]*?:::\n(\n\*([^\n]+?)\*\n)?', fig, s)

    # card grids: keep the cards as paragraphs
    lines, out, in_col = s.split("\n"), [], False
    for ln in lines:
        t = ln.strip()
        if t in (":::row:::", ":::row-end:::", ":::column-end:::"):
            in_col = False if t != ":::row:::" else in_col
            out.append("")
            continue
        if t.startswith(":::column"):
            in_col = True
            out.append("")
            continue
        out.append(re.sub(r"^ {3,6}", "", ln) if in_col else ln)
    s = "\n".join(out)

    # alerts -> block quotes with a bold label
    s = re.sub(r"^> \[!(\w+)\]\n> ", lambda mm: f"> **{ALERT.get(mm.group(1), mm.group(1).title())}:** ", s, flags=re.M)

    # links between articles -> links inside the document
    def link(mm):
        text, f, anchor = mm.group(1), mm.group(2), mm.group(3)
        return f"[{text}](#{anchor[1:] if anchor else slug(f)})"
    s = re.sub(r"\[([^\]]+)\]\(\./([a-z0-9-]+\.md)(#[^)]*)?\)", link, s)

    # chapter heading with a stable id; the description becomes the standfirst
    desc = (meta.get("description") or "").strip()
    s = re.sub(r"^# (.+)$", lambda mm: f"# {mm.group(1)} {{#{slug(name)}}}\n\n" + (f"::: {{custom-style=\"Standfirst\"}}\n{desc}\n:::\n" if desc else ""), s, count=1, flags=re.M)
    return re.sub(r"\n{3,}", "\n\n", s).strip() + "\n"


# ---------------------------------------------------------------- reference document (styles, page, footer)
INK, BLUE, BLUE_D, TEXT, MUTED, LINE, WASH, SOFT = "0A2340", "0F6CBD", "0F548C", "28323E", "5B6778", "D3DBE4", "F5F8FB", "EEF5FC"
FONT = '<w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:eastAsia="Segoe UI" w:cs="Segoe UI"/>'


def style(sid, name, ppr="", rpr="", based="Normal", typ="paragraph", nxt="BodyText", extra=""):
    b = f'<w:basedOn w:val="{based}"/>' if based else ""
    n = f'<w:next w:val="{nxt}"/>' if nxt and typ == "paragraph" else ""
    return (f'<w:style w:type="{typ}" w:styleId="{sid}"{extra}><w:name w:val="{name}"/>{b}{n}<w:qFormat/>'
            f'<w:pPr>{ppr}</w:pPr><w:rPr>{rpr}</w:rPr></w:style>')


def border(side, color, sz=4, space=0):
    return f'<w:{side} w:val="single" w:sz="{sz}" w:space="{space}" w:color="{color}"/>'


STYLES = {
    "Normal": style("Normal", "Normal", '<w:spacing w:after="120" w:line="288" w:lineRule="auto"/>', f'{FONT}<w:color w:val="{TEXT}"/><w:sz w:val="21"/><w:szCs w:val="21"/>', based="", nxt="", extra=' w:default="1"'),
    "BodyText": style("BodyText", "Body Text", '<w:spacing w:before="0" w:after="140"/>'),
    "FirstParagraph": style("FirstParagraph", "First Paragraph", '<w:spacing w:before="0" w:after="140"/>', based="BodyText"),
    "Compact": style("Compact", "Compact", '<w:spacing w:before="20" w:after="20" w:line="264" w:lineRule="auto"/>', '<w:sz w:val="19"/><w:szCs w:val="19"/>', based="BodyText"),
    "Title": style("Title", "Title", '<w:spacing w:before="2400" w:after="120" w:line="240" w:lineRule="auto"/>', f'<w:color w:val="{INK}"/><w:sz w:val="64"/><w:szCs w:val="64"/>'),
    "Subtitle": style("Subtitle", "Subtitle", '<w:spacing w:before="0" w:after="240"/>', f'<w:color w:val="{BLUE}"/><w:sz w:val="32"/><w:szCs w:val="32"/>', based="Title"),
    "Date": style("Date", "Date", '<w:spacing w:before="0" w:after="0"/>', f'<w:color w:val="{MUTED}"/><w:sz w:val="22"/><w:szCs w:val="22"/>'),
    "Heading1": style("Heading1", "heading 1", f'<w:keepNext/><w:keepLines/><w:pageBreakBefore/><w:pBdr>{border("bottom", LINE, 6, 6)}</w:pBdr><w:spacing w:before="0" w:after="200" w:line="240" w:lineRule="auto"/><w:outlineLvl w:val="0"/>', f'<w:b/><w:color w:val="{INK}"/><w:sz w:val="44"/><w:szCs w:val="44"/>'),
    "Heading2": style("Heading2", "heading 2", '<w:keepNext/><w:keepLines/><w:spacing w:before="320" w:after="100" w:line="240" w:lineRule="auto"/><w:outlineLvl w:val="1"/>', f'<w:b/><w:color w:val="{BLUE_D}"/><w:sz w:val="30"/><w:szCs w:val="30"/>'),
    "Heading3": style("Heading3", "heading 3", '<w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="80" w:line="240" w:lineRule="auto"/><w:outlineLvl w:val="2"/>', f'<w:b/><w:color w:val="{INK}"/><w:sz w:val="24"/><w:szCs w:val="24"/>'),
    "BlockText": style("BlockText", "Block Text", f'<w:pBdr>{border("left", BLUE, 18, 10)}</w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="{SOFT}"/><w:spacing w:before="120" w:after="160"/><w:ind w:left="240" w:right="120"/>', f'<w:color w:val="{INK}"/>', based="BodyText"),
    "ImageCaption": style("ImageCaption", "Image Caption", '<w:spacing w:before="60" w:after="240"/>', f'<w:i/><w:color w:val="{MUTED}"/><w:sz w:val="18"/><w:szCs w:val="18"/>', based="BodyText"),
    "CaptionedFigure": style("CaptionedFigure", "Captioned Figure", '<w:keepNext/><w:spacing w:before="200" w:after="0"/><w:jc w:val="center"/>', based="BodyText"),
    "Figure": style("Figure", "Figure", '<w:spacing w:before="200" w:after="120"/><w:jc w:val="center"/>', based="BodyText"),
    "TOCHeading": style("TOCHeading", "TOC Heading", '<w:keepNext/><w:pageBreakBefore/><w:spacing w:before="0" w:after="240"/>', f'<w:b/><w:color w:val="{INK}"/><w:sz w:val="36"/><w:szCs w:val="36"/>'),
}
STANDFIRST = style("Standfirst", "Standfirst", '<w:spacing w:before="0" w:after="280" w:line="300" w:lineRule="auto"/>', f'<w:color w:val="{MUTED}"/><w:sz w:val="25"/><w:szCs w:val="25"/>', based="BodyText")
HYPERLINK = f'<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="BodyTextChar"/><w:rPr><w:color w:val="{BLUE}"/><w:u w:val="single"/></w:rPr></w:style>'
TABLE = (f'<w:style w:type="table" w:default="1" w:styleId="Table"><w:name w:val="Table"/><w:basedOn w:val="TableNormal"/><w:semiHidden/><w:unhideWhenUsed/><w:qFormat/>'
         f'<w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblBorders>{border("top", LINE)}{border("left", LINE)}{border("bottom", LINE)}{border("right", LINE)}{border("insideH", LINE)}{border("insideV", LINE)}</w:tblBorders>'
         f'<w:tblCellMar><w:top w:w="70" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr>'
         f'<w:tblStylePr w:type="firstRow"><w:rPr><w:b/><w:color w:val="{INK}"/></w:rPr><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{WASH}"/></w:tcPr></w:tblStylePr></w:style>')
FOOTER = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
          f'<w:p><w:pPr><w:pBdr>{border("top", LINE, 4, 6)}</w:pBdr><w:tabs><w:tab w:val="right" w:pos="9360"/></w:tabs><w:spacing w:after="0"/></w:pPr>'
          f'<w:r><w:rPr><w:color w:val="{MUTED}"/><w:sz w:val="16"/></w:rPr><w:t>{TITLE}</w:t></w:r><w:r><w:rPr><w:color w:val="{MUTED}"/><w:sz w:val="16"/></w:rPr><w:tab/></w:r>'
          f'<w:r><w:rPr><w:color w:val="{INK}"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:color w:val="{INK}"/><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>'
          f'<w:r><w:rPr><w:color w:val="{INK}"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>')


def reference_doc(path, work):
    ref0 = os.path.join(work, "ref0.docx")
    with open(ref0, "wb") as f:
        f.write(subprocess.run(["pandoc", "--print-default-data-file", "reference.docx"], capture_output=True, check=True).stdout)
    d = os.path.join(work, "ref")
    with zipfile.ZipFile(ref0) as z:
        z.extractall(d)
    sp = os.path.join(d, "word", "styles.xml")
    s = open(sp, encoding="utf-8").read()
    for sid, xml in STYLES.items():
        s, n = re.subn(rf'<w:style [^>]*w:styleId="{sid}"[^>]*>.*?</w:style>', lambda _m: xml, s, count=1, flags=re.S)
        if not n:
            s = s.replace("</w:styles>", xml + "</w:styles>")
    s = re.sub(r'<w:style [^>]*w:styleId="Hyperlink"[^>]*>.*?</w:style>', lambda _m: HYPERLINK, s, count=1, flags=re.S)
    s = re.sub(r'<w:style [^>]*w:styleId="Table"[^>]*>.*?</w:style>', lambda _m: TABLE, s, count=1, flags=re.S)
    s = s.replace("</w:styles>", STANDFIRST + "</w:styles>")
    open(sp, "w", encoding="utf-8").write(s)
    # page: US Letter portrait, 1-inch margins, footer with page number
    open(os.path.join(d, "word", "footer1.xml"), "w", encoding="utf-8").write(FOOTER)
    rp = os.path.join(d, "word", "_rels", "document.xml.rels")
    r = open(rp, encoding="utf-8").read()
    r = r.replace("</Relationships>", '<Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>')
    open(rp, "w", encoding="utf-8").write(r)
    cp = os.path.join(d, "[Content_Types].xml")
    c = open(cp, encoding="utf-8").read()
    c = c.replace("</Types>", '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>')
    open(cp, "w", encoding="utf-8").write(c)
    dp = os.path.join(d, "word", "document.xml")
    x = open(dp, encoding="utf-8").read()
    sect = ('<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter1"/><w:pgSz w:w="12240" w:h="15840"/>'
            '<w:pgMar w:top="1440" w:right="1440" w:bottom="1296" w:left="1440" w:header="720" w:footer="576" w:gutter="0"/></w:sectPr>')
    x, n = re.subn(r"<w:sectPr\b.*?</w:sectPr>|<w:sectPr\b[^>]*/>", lambda _m: sect, x, count=1, flags=re.S)
    if not n:
        x = x.replace("</w:body>", sect + "</w:body>")
    if "xmlns:r=" not in x:
        x = x.replace("<w:document ", '<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ', 1)
    open(dp, "w", encoding="utf-8").write(x)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for base, _dirs, files in os.walk(d):
            for fn in files:
                full = os.path.join(base, fn)
                z.write(full, os.path.relpath(full, d))


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else OUT
    os.makedirs(os.path.dirname(out), exist_ok=True)
    work = tempfile.mkdtemp(prefix="mrp-docx-")
    try:
        import datetime
        date = datetime.date.today().strftime("%B %Y")
        body = "\n\n".join(convert(n) for n in toc_order())
        md = os.path.join(work, "combined.md")
        open(md, "w", encoding="utf-8").write(f"---\ntitle: \"{TITLE}\"\nsubtitle: \"{SUBTITLE}\"\ndate: \"{date}\"\n---\n\n" + contents() + "\n" + body)
        ref = os.path.join(work, "reference.docx")
        reference_doc(ref, work)
        subprocess.run(["pandoc", md, "-f", "markdown+pipe_tables+implicit_figures+link_attributes+fenced_divs-auto_identifiers+gfm_auto_identifiers",
                        "-t", "docx", "--reference-doc", ref, "--resource-path", ROOT, "-o", out], check=True)
        print("wrote", out, f"({os.path.getsize(out) / 1e6:.1f} MB, {len(toc_order())} articles)")
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
