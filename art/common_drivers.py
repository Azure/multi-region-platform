#!/usr/bin/env python3
"""Common drivers of multi-region platform discussions, as a picture.

Six driver cards feed one hub; the hub leads to the statement that drivers open the discussion
and to the steps that decide the outcome. Same palette, type, chips, and icons as the whitepaper figures.

    python3 art/common_drivers.py      -> art/common-drivers.svg + common-drivers.png (2x),
                                          site/figures/common-drivers.html, content/media/common-drivers.png

Text stays live in the SVG. Chip and title sizes are measured with the publication font
(whitepaper/fonts), so edit the wording in shared/summary.json ("drivers") and rerun instead of moving boxes by hand.
"""
import html, json, math, os, pathlib, re, shutil, tempfile

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
FONTS = os.path.join(ROOT, "whitepaper", "fonts")
SPRITE = os.path.join(ROOT, "site", "assets", "sprite.svg")
FONT = "Pub Sans, Segoe UI, Open Sans, sans-serif"
U = "cd"                                   # id prefix, so the SVG can sit inline on a page

# palette: whitepaper/styles.css (v* is the deck's violet)
INK, FAINT, LINE = "#0A2340", "#667182", "#D3DBE4"
B800, B700, B600, B500, B200, B100, B50 = "#0B3A63", "#0F548C", "#0F6CBD", "#2B88D8", "#BCD9F5", "#DDEBF9", "#EEF5FC"
T700, T600, T100 = "#03615F", "#04807A", "#D6EFEC"
S800, S600, S100 = "#243A57", "#4A5B72", "#E8EDF3"
W600, W100 = "#A84E1F", "#F8E8DD"
V700, V600, V100 = "#5C3D9C", "#8661C5", "#EBE5F7"

# Driver names and triggers come from shared/summary.json ("drivers"), which the full deck reads too.
# tone -> tile, connector, chip background, chip text
TONES = {"b": (B600, B500, B100, B700), "w": (W600, W600, W100, W600), "v": (V600, V600, V100, V700),
         "n": (B800, B800, "#DFE8F2", B800), "s": (S800, S600, S100, S800), "t": (T600, T600, T100, T700)}
_SUMMARY = json.load(open(os.path.join(ROOT, "shared", "summary.json"), encoding="utf-8"))
_FIG = _SUMMARY["driversFigure"]
# icon, tile, connector, chip background, chip text, driver, typical triggers (one list per chip row)
DRIVERS = [(d["icon"], *TONES[d["tone"]], d["name"], d["triggers"]) for d in _SUMMARY["drivers"]]
HUB = _FIG["hub"]
OPEN_T, OPEN_S = _FIG["openTitle"], _FIG["openText"]
NEXT_T = _FIG["nextTitle"]
STEPS = [(p["name"], T700 if p["n"] == 5 else B700) for p in _SUMMARY["parts"][1:]]
CAP_L, CAP_R = _FIG["captionLeft"], _FIG["captionRight"]
TITLE = _FIG["title"]

# geometry (content is 940 wide, like every whitepaper figure; PAD is the white margin around it)
PAD, W = 16, 940
CW, CPAD, TILE, GAPY = 332, 13, 30, 12              # driver card
CHIP_H, CHIP_PX, CHIP_GAP, CHIP_FS = 17, 8, 5, 9.6
NAME_FS, NAME_LH = 12.2, 15
TOP = 26                                             # cards start below the caption row
HUB_R, HALO_R = 56, 66
BAND_H, BAND_GAP = 40, 24


def esc(s):
    return html.escape(s, quote=True)


def icons():
    """Icon glyphs from the site sprite, keyed by name, with a {c} colour slot."""
    src = open(SPRITE, encoding="utf-8").read()
    out = {}
    for name, body in re.findall(r'<symbol id="i-([\w-]+)"[^>]*>(.*?)</symbol>', src, re.S):
        out[name] = re.sub(r"></(path|circle|rect|ellipse)>", "/>", body).replace("currentColor", "{c}")
    return out


def icon(glyphs, name, x, y, size, color):
    s = size / 24
    return f'<g transform="translate({x:.2f},{y:.2f}) scale({s:.4f})">{glyphs[name].format(c=color)}</g>'


def text(x, y, s, size, weight, fill, anchor="start", ls=None):
    extra = f' letter-spacing="{ls}"' if ls else ""
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    return f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size}" font-weight="{weight}" fill="{fill}"{a}{extra}>{esc(s)}</text>'


def arrow(tip, ang, color, size=6.2):
    """Solid arrowhead with its tip at `tip`, pointing along `ang` (radians, screen coordinates)."""
    (x, y), c, s = tip, math.cos(ang), math.sin(ang)
    bx, by, hw = x - c * size, y - s * size, size * 0.46
    return f'<path d="M{x:.2f},{y:.2f} L{bx - s * hw:.2f},{by + c * hw:.2f} L{bx + s * hw:.2f},{by - c * hw:.2f} Z" fill="{color}"/>'


def wrap(words, widths, space, limit):
    """Greedy line break; returns lists of word indexes."""
    lines, cur, w = [], [], 0
    for i, ww in enumerate(widths):
        add = ww if not cur else w + space + ww
        if cur and add > limit:
            lines.append(cur); cur, w = [i], ww
        else:
            cur.append(i); w = add
    if cur:
        lines.append(cur)
    return lines


def build(measure):
    g = icons()
    o = []

    # ── measure everything that sizes a box
    chip_w = {c: measure(c, CHIP_FS, 700, 0.02) + 2 * CHIP_PX for d in DRIVERS for r in d[6] for c in r}
    inner = CW - 2 * CPAD
    for d in DRIVERS:
        for r in d[6]:
            used = sum(chip_w[c] for c in r) + CHIP_GAP * (len(r) - 1)
            assert used <= inner, f"chip row too wide ({used:.0f} > {inner}): {r}"
    nrows = max(len(d[6]) for d in DRIVERS)
    CH = CPAD + TILE + 10 + nrows * CHIP_H + (nrows - 1) * CHIP_GAP + CPAD
    cards_h = 3 * CH + 2 * GAPY
    hub = (W / 2, TOP + cards_h / 2)
    y_open = TOP + cards_h + BAND_GAP
    y_next = y_open + BAND_H + BAND_GAP
    H = y_next + BAND_H

    # ── caption row
    o.append(text(0, 11, CAP_L.upper(), 9.2, 700, B600, ls=".12em"))
    o.append(text(W, 11, CAP_R.upper(), 9.2, 700, FAINT, anchor="end", ls=".12em"))

    # ── hub: halo, disc, icon, three lines
    hx, hy = hub
    o.append(f'<circle cx="{hx}" cy="{hy}" r="{HALO_R}" fill="{B50}" stroke="{B200}"/>')
    o.append(f'<circle cx="{hx}" cy="{hy}" r="{HUB_R}" fill="url(#{U}-hub)"/>')
    o.append(icon(g, "network", hx - 12, hy - 41, 24, "#FFFFFF"))
    for i, ln in enumerate(HUB):
        o.append(text(hx, hy + 1 + i * 15.5, ln, 12.6, 700, "#FFFFFF", anchor="middle"))

    # ── driver cards and their connectors
    tip_r = HALO_R + 3
    for i, (ic, tile, line, cbg, cfg, name, chips) in enumerate(DRIVERS):
        left, row = i < 3, i % 3
        x0, y0 = (0 if left else W - CW), TOP + row * (CH + GAPY)
        cy = y0 + CH / 2
        px = x0 + CW if left else x0                    # port on the edge that faces the hub
        sgn = 1 if left else -1

        # connector: leaves the card horizontally, arrives radially
        ang = math.radians((1 - row) * 44)              # the top card arrives from above, the bottom card from below
        ux, uy = sgn * math.cos(ang), math.sin(ang)     # unit vector pointing into the hub
        tip = (hx - ux * tip_r, hy - uy * tip_r)
        end = (tip[0] - ux * 4, tip[1] - uy * 4)
        if row == 1:
            d = f"M{px:.2f},{cy:.2f} L{end[0]:.2f},{end[1]:.2f}"
        else:
            c1 = (px + sgn * 46, cy)
            c2 = (end[0] - ux * 40, end[1] - uy * 40)
            d = f"M{px:.2f},{cy:.2f} C{c1[0]:.2f},{c1[1]:.2f} {c2[0]:.2f},{c2[1]:.2f} {end[0]:.2f},{end[1]:.2f}"
        o.append(f'<path d="{d}" fill="none" stroke="{line}" stroke-width="1.4" stroke-linecap="round"/>')
        o.append(arrow(tip, math.atan2(uy, ux), line))

        # card
        o.append(f'<rect x="{x0 + .5}" y="{y0 + .5}" width="{CW - 1}" height="{CH - 1}" rx="10" fill="#FFFFFF" stroke="{LINE}"/>')
        o.append(f'<circle cx="{px}" cy="{cy}" r="3.4" fill="{line}" stroke="#FFFFFF" stroke-width="1.5"/>')
        tx, ty = x0 + CPAD, y0 + CPAD
        o.append(f'<rect x="{tx}" y="{ty}" width="{TILE}" height="{TILE}" rx="8.5" fill="{tile}"/>')
        o.append(icon(g, ic, tx + (TILE - 18) / 2, ty + (TILE - 18) / 2, 18, "#FFFFFF"))

        # driver name, wrapped beside the tile and centred on it
        words = name.split(" ")
        ww = [measure(w, NAME_FS, 700) for w in words]
        lines = wrap(words, ww, measure("a a", NAME_FS, 700) - 2 * measure("a", NAME_FS, 700), CW - CPAD - TILE - 10 - CPAD)
        base = ty + TILE / 2 + 0.36 * NAME_FS - (len(lines) - 1) * NAME_LH / 2
        for k, ln in enumerate(lines):
            o.append(text(tx + TILE + 10, base + k * NAME_LH, " ".join(words[j] for j in ln), NAME_FS, 700, INK))

        # trigger chips
        yy = ty + TILE + 10
        for r in chips:
            xx = x0 + CPAD
            for c in r:
                w = chip_w[c]
                o.append(f'<rect x="{xx:.2f}" y="{yy:.2f}" width="{w:.2f}" height="{CHIP_H}" rx="{CHIP_H / 2}" fill="{cbg}"/>')
                o.append(text(xx + w / 2, yy + CHIP_H / 2 + 0.36 * CHIP_FS, c, CHIP_FS, 700, cfg, anchor="middle", ls=".02em"))
                xx += w + CHIP_GAP
            yy += CHIP_H + CHIP_GAP

    # ── hub → "drivers open the discussion"
    o.append(f'<path d="M{hx},{hy + HALO_R + 3} L{hx},{y_open - 6}" fill="none" stroke="{B600}" stroke-width="1.4" stroke-linecap="round"/>')
    o.append(arrow((hx, y_open - 2), math.pi / 2, B600))
    o.append(f'<rect x="0" y="{y_open}" width="{W}" height="{BAND_H}" rx="9" fill="{B600}"/>')
    o.append(icon(g, "flag", 16, y_open + (BAND_H - 20) / 2, 20, "#FFFFFF"))
    o.append(text(50, y_open + BAND_H / 2 + 0.36 * 12.4, OPEN_T, 12.4, 700, "#FFFFFF"))
    o.append(text(50 + measure(OPEN_T, 12.4, 700) + 14, y_open + BAND_H / 2 + 0.36 * 10.8, OPEN_S, 10.8, 400, "#D6E8FA"))

    # ── → the steps that decide the outcome
    o.append(f'<path d="M{hx},{y_open + BAND_H + 2} L{hx},{y_next - 6}" fill="none" stroke="{B600}" stroke-width="1.4" stroke-linecap="round"/>')
    o.append(arrow((hx, y_next - 2), math.pi / 2, B600))
    o.append(f'<rect x=".5" y="{y_next + .5}" width="{W - 1}" height="{BAND_H - 1}" rx="9" fill="{B50}" stroke="{B200}"/>')
    o.append(icon(g, "route", 16, y_next + (BAND_H - 20) / 2, 20, B600))
    o.append(text(50, y_next + BAND_H / 2 + 0.36 * 12.4, NEXT_T, 12.4, 700, B700))
    sfs, sh, spx, sgap = 10.2, 22, 11, 26
    sw = [measure(s, sfs, 700, 0.02) + 2 * spx for s, _ in STEPS]
    xx = W - 10 - sum(sw) - sgap * (len(STEPS) - 1)
    sy = y_next + (BAND_H - sh) / 2
    for k, ((s, col), w) in enumerate(zip(STEPS, sw)):
        if k:
            o.append(f'<path d="M{xx - sgap + 6:.2f},{sy + sh / 2} L{xx - 9:.2f},{sy + sh / 2}" fill="none" stroke="{B500}" stroke-width="1.4" stroke-linecap="round"/>')
            o.append(arrow((xx - 5, sy + sh / 2), 0, B500, 5.6))
        o.append(f'<rect x="{xx:.2f}" y="{sy:.2f}" width="{w:.2f}" height="{sh}" rx="{sh / 2}" fill="#FFFFFF" stroke="{B200 if col == B700 else "#7CC9C3"}"/>')
        o.append(text(xx + w / 2, sy + sh / 2 + 0.36 * sfs, s, sfs, 700, col, anchor="middle", ls=".02em"))
        xx += w + sgap

    desc = (TITLE + ". " + " ".join(f"{d[5]}: {'; '.join(c for r in d[6] for c in r)}." for d in DRIVERS)
            + f" {OPEN_T}. {OPEN_S} {NEXT_T}: {', '.join(s for s, _ in STEPS)}.")
    tw, th = W + 2 * PAD, H + 2 * PAD
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{tw}" height="{th:g}" viewBox="0 0 {tw} {th:g}" '
        f'font-family="{FONT}" role="img" aria-labelledby="{U}-t {U}-d">\n'
        f'<title id="{U}-t">{esc(TITLE)}</title>\n<desc id="{U}-d">{esc(desc)}</desc>\n'
        f'<defs><linearGradient id="{U}-hub" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{B700}"/><stop offset="1" stop-color="{B600}"/></linearGradient></defs>\n'
        f'<rect width="{tw}" height="{th:g}" fill="#FFFFFF"/>\n<g transform="translate({PAD},{PAD})">\n' + "\n".join(o) + "\n</g>\n</svg>\n")
    return svg, tw, th


def _session(pw):
    """A Chromium page with the publication font loaded, and a text-width measure that uses it."""
    faces = "".join(f'@font-face{{font-family:"Pub Sans";src:url("{pathlib.Path(FONTS, f"open-sans-latin-{wt}-normal.woff2").as_uri()}");font-weight:{wt}}}' for wt in (300, 400, 500, 600, 700))
    workdir = tempfile.mkdtemp()
    page_html = os.path.join(workdir, "render.html")
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1000, "height": 700}, device_scale_factor=2)

    def show(body):
        with open(page_html, "w", encoding="utf-8") as fh:
            fh.write(f'<html><head><meta charset="utf-8"><style>{faces} body{{margin:0}}</style></head><body>{body}</body></html>')
        pg.goto(pathlib.Path(page_html).as_uri())
        pg.evaluate("() => Promise.all([400, 700].map(w => document.fonts.load(w + ' 12px \"Pub Sans\"')))")

    show("")
    cache = {}

    def measure(s, size, weight, ls=0.0):
        key = (s, size, weight, ls)
        if key not in cache:
            w = pg.evaluate("([s, f]) => { const c = document.createElement('canvas').getContext('2d'); c.font = f; return c.measureText(s).width; }",
                            [s, f'{weight} {size}px "Pub Sans"'])
            cache[key] = w + ls * size * len(s)
        return cache[key]

    def close():
        b.close()
        shutil.rmtree(workdir, ignore_errors=True)

    return pg, show, measure, close


_FIGURE = {}


def _figure():
    if not _FIGURE:
        with sync_playwright() as pw:
            _pg, _show, measure, close = _session(pw)
            _FIGURE["svg"] = build(measure)
            close()
    return _FIGURE["svg"]


def pdf_figure(width=None):
    """The figure as an inline SVG string for a whitepaper page. Text stays live; ids carry the 'cd-' prefix.
    The white margin is cropped (the page has its own). `width` (CSS px) scales the picture; the default is the native 940 px."""
    svg, tw, th = _figure()
    cw, ch = tw - 2 * PAD, th - 2 * PAD
    w = width or cw
    h = round(ch * w / cw, 2)
    svg = svg.replace(f'width="{tw}" height="{th:g}" viewBox="0 0 {tw} {th:g}"', f'width="{w:g}" height="{h:g}" viewBox="{PAD} {PAD} {cw} {ch:g}" style="display:block"', 1)
    return svg.strip()


def main():
    """Writes the picture (art/), the website fragment (site/figures) and the article/Word picture (content/media)."""
    with sync_playwright() as pw:
        pg, show, measure, close = _session(pw)
        svg, tw, th = build(measure)
        with open(os.path.join(HERE, "common-drivers.svg"), "w", encoding="utf-8") as fh:
            fh.write(svg)
        with open(os.path.join(ROOT, "site", "figures", "common-drivers.html"), "w", encoding="utf-8", newline="\n") as fh:
            fh.write("<!-- generated by art/common_drivers.py; copy of art/common-drivers.svg for the website and the Word edition -->\n"
                     f'<div class="wpf" data-w="{tw}" data-h="{th:g}" style="width:{tw}px">{svg.strip()}</div>\n')
        show(svg)
        pg.set_viewport_size({"width": tw, "height": math.ceil(th)})
        pg.wait_for_timeout(300)
        for target in (os.path.join(HERE, "common-drivers.png"), os.path.join(ROOT, "content", "media", "common-drivers.png")):
            pg.screenshot(path=target, clip={"x": 0, "y": 0, "width": tw, "height": th})
        close()
    print(f"wrote art/common-drivers.svg and .png, site/figures/common-drivers.html, content/media/common-drivers.png ({tw}x{th:g})")


if __name__ == "__main__":
    main()
