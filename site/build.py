#!/usr/bin/env python3
"""Build the GitHub Pages site (docs/) from the CAF-ready Markdown in content/.

    python3 site/build.py

Content is authored once in Microsoft Learn–flavored Markdown (content/*.md + content/toc.yml),
so the same files can later be submitted to the Cloud Adoption Framework repo. This generator
understands the Learn extensions used there:

  :::image type="content" source="..." alt-text="..." :::   -> live HTML figure (site/figures/<name>.html)
                                                             or the PNG if no live figure exists
  *italic paragraph right after an image*                    -> figure caption
  :::row::: / :::column::: ... :::column-end::: / :::row-end::: -> card grid
  > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING]             -> alert
  > [!div class="nextstepaction"]                            -> next-step button
  **Question:** / **Decision:** paragraphs                   -> styled callouts
"""
import html, json, os, re, shutil, textwrap, datetime
import markdown, yaml

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CONTENT = os.path.join(ROOT, "content")
SITE = os.path.join(ROOT, "site")
OUT = os.path.join(ROOT, "docs")
SITE_TITLE = "Multi-region platform"
SITE_SUB = "Adaptable multi-region Azure platform"

DOWNLOADS = [
    ("Full technical guidance (PDF)", "downloads/Adaptable-Multi-Region-Azure-Platform.pdf", "pdf", "46 pages"),
    ("Executive brief (PDF)", "downloads/Adaptable-Multi-Region-Azure-Platform-Executive-Brief.pdf", "pdf", "13 pages"),
]


# ───────────────────────────── helpers
def slugify(text, sep="-"):
    t = re.sub(r"<[^>]+>", "", text)
    t = html.unescape(t).lower()
    t = re.sub(r"[^\w\s-]", "", t)
    return re.sub(r"[\s_]+", sep, t).strip(sep)


def read_front_matter(path):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", raw, flags=re.S)
    meta = yaml.safe_load(m.group(1)) if m else {}
    return meta, raw[m.end():] if m else raw


def md_link_to_html(href):
    if href.startswith(("http://", "https://", "#", "mailto:")):
        return href
    href = href[2:] if href.startswith("./") else href
    return re.sub(r"\.md(#|$)", r".html\1", href)


FIGS = {}


def figure_html(src, alt, caption):
    name = os.path.splitext(os.path.basename(src))[0]
    png = "media/" + os.path.basename(src)
    frag_path = os.path.join(SITE, "figures", name + ".html")
    cap = f'<figcaption>{caption}</figcaption>' if caption else ""
    tools = (f'<div class="fig-tools"><button class="fig-zoom" type="button" aria-label="Expand figure" title="Expand">'
             f'<svg viewBox="0 0 16 16"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>'
             f'<a class="fig-png" href="{png}" download title="Download image" aria-label="Download image">'
             f'<svg viewBox="0 0 16 16"><path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M3 13h10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a></div>')
    if os.path.exists(frag_path):
        frag = open(frag_path, encoding="utf-8").read()
        frag = re.sub(r"^<!--.*?-->\n", "", frag)
        return (f'<figure class="fig live" data-fig="{name}" role="img" aria-label="{html.escape(alt)}">{tools}'
                f'<div class="fig-stage"><div class="fig-scale">{frag}</div></div>{cap}</figure>')
    return (f'<figure class="fig img" data-fig="{name}">{tools}<div class="fig-stage"><img src="{png}" alt="{html.escape(alt)}" loading="lazy"></div>{cap}</figure>')


# ───────────────────────────── Learn-flavored markdown
ALERT_ICONS = {
    "note": '<path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3.2a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6ZM9 11.5H7V7.4h2Z"/>',
    "tip": '<path d="M8 1.5a4.5 4.5 0 0 0-2.7 8.1V11a1 1 0 0 0 1 1h3.4a1 1 0 0 0 1-1V9.6A4.5 4.5 0 0 0 8 1.5ZM6 13.2h4v1.3H6Z"/>',
    "important": '<path d="M8 1 15 14H1L8 1Zm-.9 4.6.2 4.4h1.4l.2-4.4Zm.9 5.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z"/>',
    "warning": '<path d="M8 1 15 14H1L8 1Zm-.9 4.6.2 4.4h1.4l.2-4.4Zm.9 5.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z"/>',
    "caution": '<path d="M8 1 15 14H1L8 1Zm-.9 4.6.2 4.4h1.4l.2-4.4Zm.9 5.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z"/>',
}


def render_md(text, store):
    """Render Learn-flavored markdown. `store` collects raw HTML blocks behind placeholders."""
    def keep(h):
        store.append(h)
        return f"\n\nRAWBLOCK{len(store) - 1}END\n\n"

    # website-only blocks: keep the content, drop the markers (site/tools/export_caf.py removes the whole block)
    text = re.sub(r"^[ \t]*<!--\s*site-only:(start|end)\s*-->[ \t]*\n?", "", text, flags=re.M)
    lines = text.split("\n")
    out, i = [], 0
    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        # :::image ... :::  (+ optional italic caption paragraph)
        m = re.match(r':::image\s+(.*?):::\s*$', s)
        if m:
            attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            cap = ""
            if j < len(lines) and re.match(r"^\*[^*].*\*$", lines[j].strip()):
                cap = inline_md(lines[j].strip()[1:-1], store)
                i = j
            out.append(keep(figure_html(attrs.get("source", ""), attrs.get("alt-text", ""), cap)))
            i += 1
            continue
        # :::row::: ... :::row-end:::
        if s == ":::row:::":
            cols, cur, j = [], None, i + 1
            while j < len(lines) and lines[j].strip() != ":::row-end:::":
                t = lines[j].strip()
                if t == ":::column:::":
                    cur = []
                elif t == ":::column-end:::":
                    cols.append("\n".join(cur)); cur = None
                elif cur is not None:
                    cur.append(lines[j])
                j += 1
            cells = "".join(f'<div class="card">{render_md(textwrap.dedent(c), store)}</div>' for c in cols)
            out.append(keep(f'<div class="rowgrid cols-{len(cols)}">{cells}</div>'))
            i = j + 1
            continue
        # blockquote group
        if s.startswith(">"):
            block = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                block.append(re.sub(r"^\s*> ?", "", lines[i]))
                i += 1
            first = block[0].strip()
            ma = re.match(r"\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]", first, flags=re.I)
            mn = re.match(r'\[!div class="nextstepaction"\]', first)
            if ma:
                kind = ma.group(1).lower()
                inner = render_md("\n".join(block[1:]), store)
                out.append(keep(f'<div class="alert {kind}"><p class="alert-title"><svg viewBox="0 0 16 16">{ALERT_ICONS[kind]}</svg>{kind.capitalize()}</p>{inner}</div>'))
            elif mn:
                rest = " ".join(b.strip() for b in block[1:])
                ml = re.match(r"\[(.+?)\]\((.+?)\)", rest)
                if ml:
                    out.append(keep(f'<p class="nextstep"><a class="btn-next" href="{md_link_to_html(ml.group(2))}">{html.escape(ml.group(1))}<svg viewBox="0 0 16 16"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></a></p>'))
            else:
                inner = render_md("\n".join(block), store)
                out.append(keep(f'<blockquote class="pull">{inner}</blockquote>'))
            continue
        out.append(ln)
        i += 1

    md = markdown.Markdown(extensions=["tables", "sane_lists", "attr_list", "toc"],
                           extension_configs={"toc": {"slugify": slugify, "permalink": False}})
    h = md.convert("\n".join(out))
    return h


def inline_md(text, store):
    h = markdown.markdown(text, extensions=[])
    return re.sub(r"^<p>(.*)</p>$", r"\1", h.strip(), flags=re.S)


def expand_raw(h, store):
    for _ in range(6):
        new = re.sub(r"<p>RAWBLOCK(\d+)END</p>|RAWBLOCK(\d+)END", lambda m: store[int(m.group(1) or m.group(2))], h)
        if new == h:
            break
        h = new
    return h


def postprocess(h):
    # links
    h = re.sub(r'href="([^"]+)"', lambda m: f'href="{md_link_to_html(m.group(1))}"', h)
    h = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener"', h)
    # Question / Decision callouts
    h = re.sub(r"<p><strong>Question:</strong>\s*(.*?)</p>",
               r'<div class="callout question"><span class="callout-k">Question</span><p>\1</p></div>', h, flags=re.S)
    h = re.sub(r"<p><strong>Decision:</strong>\s*(.*?)</p>",
               r'<div class="callout decision"><span class="callout-k">Decision</span><p>\1</p></div>', h, flags=re.S)
    h = re.sub(r"<p><strong>(Choose when|Regional footprint|Key considerations|Reassess when):</strong>\s*(.*?)</p>",
               lambda m: f'<div class="attr attr-{slugify(m.group(1))}"><span class="attr-k">{m.group(1)}</span><p>{m.group(2)}</p></div>', h, flags=re.S)
    h = re.sub(r"<p><strong>Takeaway:</strong>\s*(.*?)</p>",
               r'<div class="takeaway"><span class="callout-k">Takeaway</span><p>\1</p></div>', h, flags=re.S)
    # tables
    h = re.sub(r"<table>(.*?)</table>", r'<div class="table-wrap"><table>\1</table></div>', h, flags=re.S)
    # heading anchors
    h = re.sub(r'<h([23]) id="([^"]+)">(.*?)</h\1>',
               r'<h\1 id="\2">\3<a class="anchor" href="#\2" aria-label="Link to this section">#</a></h\1>', h)
    return h


# ───────────────────────────── navigation
def load_toc():
    return yaml.safe_load(open(os.path.join(CONTENT, "toc.yml"), encoding="utf-8"))["items"]


def flat_pages(items, out=None, parent=None):
    out = [] if out is None else out
    for it in items:
        href = it.get("href")
        if href and href.endswith(".md"):
            out.append({"name": it["name"], "href": href, "parent": parent})
        if it.get("items"):
            flat_pages(it["items"], out, it["name"])
    return out


def nav_html(items, current, depth=0):
    parts = []
    for it in items:
        href = it.get("href")
        kids = it.get("items") or []
        is_ext = bool(href and href.startswith("http"))
        link = md_link_to_html(href) if href else None
        active = href == current
        contains = any(k.get("href") == current for k in walk(kids))
        open_ = active or contains
        cls = ["nav-item", f"d{depth}"]
        if active: cls.append("active")
        if kids: cls.append("has-kids")
        if open_: cls.append("open")
        chev = '<button class="chev" type="button" aria-label="Expand section"><svg viewBox="0 0 16 16"><path d="M5 6.5 8 9.5l3-3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>' if kids else '<span class="chev-sp"></span>'
        ext = ' <svg class="ext" viewBox="0 0 16 16"><path d="M9 3h4v4M13 3 7.5 8.5M11 9.5V13H3V5h3.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' if is_ext else ""
        if link:
            tgt = ' target="_blank" rel="noopener"' if is_ext else ""
            cur = ' aria-current="page"' if active else ""
            label = f'<a href="{link}"{tgt}{cur}>{html.escape(it["name"])}{ext}</a>'
        else:
            label = f'<span class="nav-group">{html.escape(it["name"])}</span>'
        sub = f'<ul>{nav_html(kids, current, depth + 1)}</ul>' if kids else ""
        parts.append(f'<li class="{" ".join(cls)}"><div class="nav-row">{chev}{label}</div>{sub}</li>')
    return "".join(parts)


def walk(items):
    for it in items:
        yield it
        yield from walk(it.get("items") or [])


# ───────────────────────────── page assembly
def read_time(text):
    words = len(re.findall(r"\w+", re.sub(r":::.*?:::", "", text)))
    return max(1, round(words / 220))


def build():
    toc = load_toc()
    pages = flat_pages(toc)
    tmpl = open(os.path.join(SITE, "templates", "page.html"), encoding="utf-8").read()
    sprite = open(os.path.join(SITE, "assets", "sprite.svg"), encoding="utf-8").read()
    if os.path.exists(OUT):
        for n in os.listdir(OUT):
            if n in ("downloads",):
                continue
            p = os.path.join(OUT, n)
            shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
    os.makedirs(OUT, exist_ok=True)
    shutil.copytree(os.path.join(SITE, "assets"), os.path.join(OUT, "assets"), dirs_exist_ok=True)
    os.remove(os.path.join(OUT, "assets", "sprite.svg"))
    shutil.copytree(os.path.join(CONTENT, "media"), os.path.join(OUT, "media"), dirs_exist_ok=True)
    if os.path.isdir(os.path.join(SITE, "media")):   # website-only images (not part of the CAF article set)
        shutil.copytree(os.path.join(SITE, "media"), os.path.join(OUT, "media"), dirs_exist_ok=True)
    open(os.path.join(OUT, ".nojekyll"), "w").close()

    dl_items = "".join(
        f'<a class="dl-item" href="{u}" download><span class="dl-ic {k}">{k.upper()}</span><span><b>{n}</b><small>{d}</small></span></a>'
        for n, u, k, d in DOWNLOADS)
    search_index = []
    for idx, pg in enumerate(pages):
        meta, body = read_front_matter(os.path.join(CONTENT, pg["href"]))
        store = []
        h = render_md(body, store)
        h = expand_raw(h, store)
        h = postprocess(h)
        # split H1
        m = re.search(r"<h1[^>]*>(.*?)</h1>", h, flags=re.S)
        h1 = m.group(1) if m else meta.get("title", pg["name"])
        h = h[:m.start()] + h[m.end():] if m else h
        # in this article
        h2s = re.findall(r'<h2 id="([^"]+)">(.*?)<a class="anchor"', h)
        rail = "".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in h2s if i != "next-step")
        prev_pg = pages[idx - 1] if idx > 0 else None
        next_pg = pages[idx + 1] if idx + 1 < len(pages) else None
        pn = '<nav class="pager">'
        pn += (f'<a class="prev" href="{md_link_to_html(prev_pg["href"])}"><small>Previous</small><span>{html.escape(prev_pg["name"])}</span></a>' if prev_pg else "<span></span>")
        pn += (f'<a class="next" href="{md_link_to_html(next_pg["href"])}"><small>Next</small><span>{html.escape(next_pg["name"])}</span></a>' if next_pg else "<span></span>")
        pn += "</nav>"
        crumbs = [SITE_TITLE] + ([pg["parent"]] if pg["parent"] else [])
        crumb_html = " <span>/</span> ".join(html.escape(c) for c in crumbs)
        date = str(meta.get("ms.date", ""))
        try:
            fmt = "%B %#d, %Y" if os.name == "nt" else "%B %-d, %Y"
            date = datetime.datetime.strptime(date, "%m/%d/%Y").strftime(fmt)
        except ValueError:
            pass
        is_home = pg["href"] == "index.md"
        hero = ""
        if is_home:
            hero = f'''<section class="hero"><div class="hero-in">
<p class="hero-kicker">Cloud Adoption Framework · Key adoption scenario</p>
<h1 class="hero-title">{html.escape(SITE_SUB)}</h1>
<p class="hero-lede">Add Azure regions without starting another landing-zone project. Reuse the platform you already run, qualify each region, and enable only what its workloads need.</p>
<div class="hero-cta"><a class="btn primary" href="getting-started.html">Get started in six steps</a><a class="btn ghost" href="{DOWNLOADS[0][1]}" download>Full technical guidance (PDF)</a><a class="btn ghost" href="{DOWNLOADS[1][1]}" download>Executive brief (PDF)</a></div>
</div></section>'''
        page = (tmpl.replace("{{TITLE}}", html.escape(meta.get("title", pg["name"])))
                .replace("{{DESCRIPTION}}", html.escape(meta.get("description", "")))
                .replace("{{SITE_TITLE}}", SITE_TITLE)
                .replace("{{NAV}}", nav_html(toc, pg["href"]))
                .replace("{{CRUMBS}}", crumb_html)
                .replace("{{H1}}", h1)
                .replace("{{META}}", f'{date} · {read_time(body)} min read')
                .replace("{{BODY}}", h)
                .replace("{{RAIL}}", rail)
                .replace("{{PAGER}}", pn)
                .replace("{{HERO}}", hero)
                .replace("{{BODYCLASS}}", "home" if is_home else "article")
                .replace("{{DOWNLOADS}}", dl_items)
                .replace("{{SPRITE}}", sprite)
                .replace("{{YEAR}}", "2026"))
        out_name = md_link_to_html(pg["href"])
        open(os.path.join(OUT, out_name), "w", encoding="utf-8").write(page)
        text = re.sub(r"<[^>]+>", " ", re.sub(r'<figure.*?</figure>', " ", h, flags=re.S))
        text = html.unescape(re.sub(r"\s+", " ", text)).strip()
        search_index.append({"t": re.sub(r"<[^>]+>", "", h1), "u": out_name, "s": pg["parent"] or "",
                             "h": [[i, re.sub(r"<[^>]+>", "", t)] for i, t in h2s if i != "next-step"], "x": text[:6000]})
        print(f"  {out_name:42s} {len(h2s):2d} sections")
    json.dump(search_index, open(os.path.join(OUT, "assets", "search-index.json"), "w"), ensure_ascii=False)
    # small-screen / 404
    shutil.copy(os.path.join(OUT, "index.html"), os.path.join(OUT, "404.html"))
    print(f"built {len(pages)} pages -> {OUT}")


if __name__ == "__main__":
    build()
