#!/usr/bin/env python3
"""Extract diagrams from the whitepaper source into:
  - site/figures/<name>.html   live HTML fragment used by the website (crisp, selectable text)
  - site/assets/figures.css    whitepaper CSS scoped under .wpf so it cannot leak into the site
  - content/media/<name>.png   2x raster for the CAF / Microsoft Learn Markdown

Run after any change to whitepaper/pages/*.html:  python3 site/tools/extract_figures.py
"""
import os, re, sys, json
import tinycss2
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WP = os.path.join(ROOT, "whitepaper")
FIG_OUT = os.path.join(ROOT, "site", "figures")
MEDIA = os.path.join(ROOT, "content", "media")
CSS_OUT = os.path.join(ROOT, "site", "assets", "figures.css")

# whitepaper element id -> figure name used in Markdown (content/media/<name>.png)
FIGS = {
    "fig1": "fixed-pair-to-governed-options",
    "fig2": "three-planning-constructs",
    "fig3": "progressive-adoption-journey",
    "fig4": "platform-and-workload-layers",
    "fig5": "regional-qualification-framework",
    "fig6": "dimensions-1-2-filter",
    "fig7": "workloads-to-platform-requirements",
    "fig8": "zones-and-pairing",
    "figEval": "programmatic-regional-evaluation",
    "fig9": "connectivity-planning-layers",
    "fig10": "assessment-outcome-example",
    "figQualTree": "regional-qualification-decision-tree",
    "fig12": "application-landing-zone-archetypes",
    "fig13": "archetype-profile-matrix",
    "fig14": "connectivity-profile-spectrum",
    "figCost": "profile-cost-tradeoff",
    "figHubs": "hub-implementations",
    "fig15": "profiles-coexisting-estate",
    "figProfileTree": "connectivity-profile-decision-tree",
    "figPlacement": "workload-placement-flow",
    "fig18b": "qualification-versus-placement",
    "fig18": "operating-model-consistent-adaptable",
    "figKVPattern": "key-vault-regional-pattern",
}


def scope_css(text):
    """Prefix every selector with .wpf; map :root/html/body to .wpf; keep @font-face global."""
    out = []
    rules = tinycss2.parse_stylesheet(text, skip_comments=True, skip_whitespace=True)

    def pre(sel):
        parts = []
        for s in sel.split(","):
            s = s.strip()
            if not s:
                continue
            s2 = re.sub(r"^(:root|html|body)\b", ".wpf", s)
            if s2.startswith(".wpf"):
                parts.append(s2)
            elif s == "*":
                parts.append(".wpf, .wpf *")
            else:
                parts.append(".wpf " + s)
        return ", ".join(parts)

    for r in rules:
        if r.type == "qualified-rule":
            sel = tinycss2.serialize(r.prelude).strip()
            out.append(f"{pre(sel)} {{{tinycss2.serialize(r.content)}}}")
        elif r.type == "at-rule":
            kw = r.lower_at_keyword
            if kw == "font-face":
                body = tinycss2.serialize(r.content).replace('url("fonts/', 'url("fonts/')
                out.append(f"@font-face {{{body}}}")
            elif kw == "media":
                q = tinycss2.serialize(r.prelude).strip()
                if "print" in q:
                    continue
                inner = scope_css(tinycss2.serialize(r.content))
                out.append(f"@media {q} {{\n{inner}\n}}")
            elif kw in ("page", "import"):
                continue
            else:
                out.append(tinycss2.serialize([r]))
    return "\n".join(out)


def main():
    os.makedirs(FIG_OUT, exist_ok=True); os.makedirs(MEDIA, exist_ok=True)
    os.system(f"cd {WP} && python3 build.py >/dev/null")
    base = open(os.path.join(WP, "styles.css"), encoding="utf-8").read()
    manifest = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1100, "height": 900}, device_scale_factor=2)
        pg.goto("file://" + os.path.join(WP, "whitepaper.html"))
        pg.wait_for_selector("body[data-ready='1']", timeout=20000)
        pg.wait_for_timeout(300)
        page_css = pg.evaluate("() => [...document.querySelectorAll('section.page style')].map(s => s.textContent).join('\\n')")
        sprite = pg.evaluate("() => document.querySelector('body > svg').outerHTML")
        # hide captions and PDF figure numbers before measuring / capturing
        pg.add_style_tag(content=".figure .figcap, .figure .fighead .fn { display: none !important; }")
        for fid, name in FIGS.items():
            el = pg.query_selector(f"#{fid}")
            if not el:
                print("missing", fid); continue
            el.scroll_into_view_if_needed()
            box = el.bounding_box()
            w, h = round(box["width"]), round(box["height"])
            html = pg.evaluate("""([id, pre]) => {
                const f = document.getElementById(id).cloneNode(true);
                f.querySelectorAll('.figcap, .fighead .fn').forEach(e => e.remove());
                f.removeAttribute('id');
                // keep internal ids (gradients, arrowhead markers) but make them unique per figure
                const ids = new Set();
                f.querySelectorAll('[id]').forEach(e => { ids.add(e.id); e.id = pre + e.id; });
                let html = f.outerHTML;
                ids.forEach(i => {
                    html = html.split('url(#' + i + ')').join('url(#' + pre + i + ')')
                               .split('href="#' + i + '"').join('href="#' + pre + i + '"');
                });
                return html;
            }""", [fid, name + "--"])
            open(os.path.join(FIG_OUT, name + ".html"), "w", encoding="utf-8").write(
                f'<!-- extracted from whitepaper #{fid}; regenerate with site/tools/extract_figures.py -->\n'
                f'<div class="wpf" data-w="{w}" data-h="{h}" style="width:{w}px">{html}</div>\n')
            box = el.bounding_box(); pad = 16
            pg.screenshot(path=os.path.join(MEDIA, name + ".png"), clip={"x": box["x"] - pad, "y": box["y"] - pad, "width": box["width"] + 2 * pad, "height": box["height"] + 2 * pad})
            manifest[name] = {"w": w, "h": h, "source": fid}
            print(f"{name:42s} {w}x{h}")
        b.close()
    css = "/* Whitepaper figure styles, scoped under .wpf. Generated by site/tools/extract_figures.py — do not edit. */\n"
    css += scope_css(base + "\n" + page_css)
    css = css.replace('url("fonts/', 'url("fonts/')
    open(CSS_OUT, "w", encoding="utf-8").write(css)
    open(os.path.join(ROOT, "site", "assets", "sprite.svg"), "w", encoding="utf-8").write(sprite)
    json.dump(manifest, open(os.path.join(FIG_OUT, "manifest.json"), "w"), indent=1)
    print("css bytes", len(css))


if __name__ == "__main__":
    main()
