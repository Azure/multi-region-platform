#!/usr/bin/env python3
"""City analogy illustration: multi-region platform (the city) vs. multi-region workload (the household).

Same isometric language and palette as the whitepaper cover (whitepaper/art.py).
    python3 art/city_analogy.py      -> art/out/city-analogy.svg + city-analogy.png (2x)
"""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "whitepaper"))
from art import P, poly, prism, defs, background  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
FONT = "Pub Sans, Segoe UI, Open Sans, sans-serif"
U = "ca"                      # gradient id prefix
W, H = 1800, 1290
S, OX, OY = 48, 470, 430      # iso scale and origin for the city
WEB_W, WEB_H, WEB_Y = 1085, 950, 168   # crop used for the website's city-only figure
PDF_X, PDF_Y, PDF_W, PDF_H = 14, 218, 1072, 836   # crop used for the whitepaper and executive brief page
PDF_LABEL = 1.32                       # labels are enlarged in the PDF figure, which prints at about 60%

# ───────────────────────── icons (24×24 glyphs, white on a coloured badge)
ICON = {
    "hospital": '<path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z" fill="#fff"/>',
    "fire": '<path d="M12 3c.6 3.2 5.5 4.6 5.5 10a5.5 5.5 0 0 1-11 0c0-2.6 1.6-3.8 2.3-5.6.9 1 1.5 2 1.6 3.2C11 8.4 11.3 5.6 12 3z" fill="#fff"/>',
    "police": '<path d="M12 3l7.5 3v5.2c0 4.6-3.1 8-7.5 9.8-4.4-1.8-7.5-5.2-7.5-9.8V6z" fill="#fff"/><path d="M12 8.2l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" fill="#0F548C"/>',
    "power": '<path d="M13.5 2.5L5.5 13.5h5.5l-1 8 8-11h-5.5z" fill="#fff"/>',
    "water": '<path d="M12 3c3.2 4.6 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.8-6.4 6-11z" fill="#fff"/>',
    "sewer": '<g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M3.5 9.5q2.1-2.4 4.2 0t4.3 0 4.3 0 4.2 0"/><path d="M3.5 15q2.1-2.4 4.2 0t4.3 0 4.3 0 4.2 0"/></g>',
    "bank": '<g fill="none" stroke="#fff" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"><path d="M3 9.5 12 4l9 5.5z" fill="#fff"/><path d="M6 11v6.5M10 11v6.5M14 11v6.5M18 11v6.5M3.5 20h17"/></g>',
    "campus": '<g fill="#fff"><rect x="4" y="6" width="9" height="15" rx="1"/><rect x="14" y="10" width="6" height="11" rx="1" fill-opacity=".75"/></g><g fill="#0F548C"><rect x="6" y="8.5" width="2" height="2"/><rect x="9.5" y="8.5" width="2" height="2"/><rect x="6" y="12.5" width="2" height="2"/><rect x="9.5" y="12.5" width="2" height="2"/></g>',
    "lane": '<g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M7 21 10 3M17 21 14 3"/><path d="M12 6v3M12 12v3M12 18v2" stroke-width="1.8"/></g>',
    "law-old": '<g fill="none" stroke="#fff" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"><path d="M3 9.5 12 4l9 5.5z" fill="#fff"/><path d="M6 11v6.5M10 11v6.5M14 11v6.5M18 11v6.5M3.5 20h17"/></g>',
    "scales": '<g fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M7 20h10M5 7h14"/><path d="M5 7 2.5 13h5zM19 7l-2.5 6h5z" fill="#fff" fill-opacity=".9"/></g>',
    "train": '<g fill="none" stroke="#fff" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"><rect x="6" y="3" width="12" height="14" rx="3" fill="#fff" fill-opacity=".18"/><path d="M6 10h12"/><path d="M8.5 21l2-4M15.5 21l-2-4"/></g><circle cx="9.5" cy="13.6" r="1.1" fill="#fff"/><circle cx="14.5" cy="13.6" r="1.1" fill="#fff"/>',
    "home": '<g fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M3.5 11.5 12 4.5l8.5 7"/><path d="M6 10v9.5h12V10"/><path d="M10.2 19.5v-5h3.6v5"/></g>',
    "hood": '<g fill="#fff"><path d="M2 13l4.5-4 4.5 4v7H2z"/><path d="M13 11.5l4.5-4 4.5 4V20h-9z" fill-opacity=".75"/><path d="M8 15.5l4-3.4 4 3.4V21H8z" fill-opacity=".9"/></g>',
    "pin": '<path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5c0 4.8 6.5 12.5 6.5 12.5s6.5-7.7 6.5-12.5A6.5 6.5 0 0 0 12 2.5z" fill="#fff"/><circle cx="12" cy="9" r="2.4" fill="#0F6CBD"/>',
    "bed": '<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18V7M3 13h18v5M21 13v-1.5a3 3 0 0 0-3-3h-7v4.5"/></g><circle cx="7" cy="10.5" r="1.8" fill="#fff"/>',
    "car": '<g fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M4 16v-3.5l2-5h12l2 5V16z"/></g><circle cx="7.5" cy="16.5" r="1.8" fill="#fff"/><circle cx="16.5" cy="16.5" r="1.8" fill="#fff"/>',
    "palette": '<path d="M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.6 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" fill="#fff"/><circle cx="7.6" cy="11" r="1.4" fill="#C2410C"/><circle cx="10" cy="7" r="1.4" fill="#0F6CBD"/><circle cx="14.6" cy="7" r="1.4" fill="#04807A"/>',
    "coin": '<circle cx="12" cy="12" r="8.2" fill="none" stroke="#fff" stroke-width="2"/><path d="M14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.6 0-2.6.8-2.6 2s1.1 1.6 2.6 2 2.7.8 2.7 2.1-1.2 2.1-2.7 2.1c-1.2 0-2.3-.6-2.8-1.5M12 6v1.8M12 16.2V18" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>',
    "check": '<path d="M5.5 12.5l4.2 4.2 8.8-9.2" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
    "x": '<path d="M7 7l10 10M17 7 7 17" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>',
    "stake": '<path d="M8.5 20.5V4.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M9.6 5.2 18.5 8.4 9.6 11.6z" fill="#FFB38A"/>',
    "moon": '<path d="M17.5 14.6A7 7 0 0 1 9.4 6.5a7 7 0 1 0 8.1 8.1z" fill="#fff"/>',
}
SVC = {  # badge colours for city services
    "hospital": "#D13438", "bank": "#0B3A63", "campus": "#243A57", "lane": "#E0607E", "fire": "#E8590C", "police": "#0F548C", "power": "#C98A00",
    "water": "#1AA5D6", "sewer": "#5B6778", "law": "#5C2E91", "scales": "#5C2E91", "train": "#8661C5",
}


def badge(cx, cy, kind, r=13, color=None, ring=True):
    c = color or SVC.get(kind, "#0F6CBD")
    sc = (r * 1.25) / 24
    ringc = f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r + 2.5:.1f}" fill="#FFFFFF" fill-opacity=".9"/>' if ring else ""
    return (f'{ringc}<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{c}"/>'
            f'<g transform="translate({cx - 12 * sc:.1f},{cy - 12 * sc:.1f}) scale({sc:.3f})">{ICON[kind]}</g>')


def pin_badge(x, y, z, kind, lift=0.55, r=12.5):
    """Badge floating above a 3D point with a thin stem."""
    bx, by = p(x, y, z)
    ty = by - lift * S
    return (f'<line x1="{bx:.1f}" y1="{by:.1f}" x2="{bx:.1f}" y2="{ty + r:.1f}" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="1.2"/>'
            + badge(bx, ty, kind, r=r))


def p(x, y, z=0.0):
    return P(x, y, z, S, OX, OY)


def box(x0, y0, x1, y1, z0, z1, top, left, right, op=.95, edge=.55):
    return prism(x0, y0, x1, y1, z0, z1, S, OX, OY, top, left, right, op=op, edge=edge)


def house(x0, y0, w, d, h, rh, wall=("#FFFFFF", "#E3ECF5"), roof=("#2B88D8", "#0F548C"), door="#0F548C", solar=False):
    """Gable-roof house; ridge parallel to the x axis."""
    x1, y1, ym = x0 + w, y0 + d, y0 + d / 2
    st = 'stroke="#FFFFFF" stroke-opacity=".5" stroke-width=".8" stroke-linejoin="round"'
    o = [poly([p(x0, y0, h), p(x1, y0, h), p(x1, ym, h + rh), p(x0, ym, h + rh)], roof[1], st),
         poly([p(x0, y1, 0), p(x1, y1, 0), p(x1, y1, h), p(x0, y1, h)], wall[0], st),
         poly([p(x1, y0, 0), p(x1, y1, 0), p(x1, y1, h), p(x1, ym, h + rh), p(x1, y0, h)], wall[1], st),
         poly([p(x0, y1, h), p(x1, y1, h), p(x1, ym, h + rh), p(x0, ym, h + rh)], roof[0], st)]
    # door + window on the front-left wall
    dx = x0 + w * 0.22
    o.append(poly([p(dx, y1, 0), p(dx + w * 0.18, y1, 0), p(dx + w * 0.18, y1, h * .62), p(dx, y1, h * .62)], door))
    wx = x0 + w * 0.58
    o.append(poly([p(wx, y1, h * .35), p(wx + w * .24, y1, h * .35), p(wx + w * .24, y1, h * .75), p(wx, y1, h * .75)], "#BFE3FF"))
    if solar:
        a = .18
        pts = [(x0 + w * a, y1 - d * .08), (x1 - w * a, y1 - d * .08), (x1 - w * a, ym + d * .1), (x0 + w * a, ym + d * .1)]
        zz = lambda yy: h + rh * (y1 - yy) / (y1 - ym) + .015
        o.append(poly([p(x, y, zz(y)) for x, y in pts], "#16335C", 'stroke="#9FD4FF" stroke-width=".7"'))
    return "\n".join(o)


def tower(x0, y0, x1, y1, h, kind="blue"):
    t, l, r = {"blue": (f"url(#{U}hubT)", f"url(#{U}hubL)", f"url(#{U}hubR)"),
               "cyan": (f"url(#{U}minT)", f"url(#{U}minL)", f"url(#{U}minR)"),
               "white": ("#FFFFFF", "#DCE8F3", "#B8CDE2")}[kind]
    o = [box(x0, y0, x1, y1, 0, h, t, l, r, op=.96)]
    # window bands
    g = []
    z = 0.32
    while z < h - .15:
        a, b = p(x0 + .06, y1, z), p(x1 - .06, y1, z)
        c, d = p(x1, y0 + .06, z), p(x1, y1 - .06, z)
        g.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/><line x1="{c[0]:.1f}" y1="{c[1]:.1f}" x2="{d[0]:.1f}" y2="{d[1]:.1f}"/>')
        z += .28
    o.append('<g stroke="#FFFFFF" stroke-opacity=".38" stroke-width="1">' + "".join(g) + "</g>")
    return "\n".join(o)


def civic(x0, y0, x1, y1, h):
    """City hall: base, columns, pediment."""
    o = [box(x0, y0, x1, y1, 0, .12, "#FFFFFF", "#D6E2EE", "#B9CBDD", op=1)]
    o.append(box(x0 + .12, y0 + .12, x1 - .12, y1 - .12, .12, h, "#F4F8FC", "#E6EEF7", "#C9D8E8", op=1))
    cols = []
    n = 5
    for i in range(n):
        cx = x0 + .2 + i * (x1 - x0 - .4) / (n - 1)
        a, b = p(cx, y1 - .05, .12), p(cx, y1 - .05, h - .05)
        cols.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')
    o.append('<g stroke="#8FA6BE" stroke-width="2.4" stroke-linecap="round">' + "".join(cols) + "</g>")
    ym = (y0 + y1) / 2
    o.append(poly([p(x0, y0, h), p(x1, y0, h), p(x1, ym, h + .38), p(x0, ym, h + .38)], "#C9D8E8", 'stroke="#fff" stroke-opacity=".6"'))
    o.append(poly([p(x0, y1, h), p(x1, y1, h), p(x1, ym, h + .38), p(x0, ym, h + .38)], "#FFFFFF", 'stroke="#fff" stroke-opacity=".6"'))
    o.append(poly([p(x1, y0, h), p(x1, y1, h), p(x1, ym, h + .38)], "#DCE6F1", 'stroke="#fff" stroke-opacity=".6"'))
    return "\n".join(o)


def cylinder(x, y, z0, z1, rx, fill_side, fill_top, stroke="#FFFFFF"):
    a, b = p(x, y, z0), p(x, y, z1)
    r = rx * S * 0.866
    ry = r * .5
    return (f'<path d="M{a[0] - r:.1f},{a[1]:.1f} L{b[0] - r:.1f},{b[1]:.1f} A{r:.1f},{ry:.1f} 0 0 0 {b[0] + r:.1f},{b[1]:.1f} '
            f'L{a[0] + r:.1f},{a[1]:.1f} A{r:.1f},{ry:.1f} 0 0 1 {a[0] - r:.1f},{a[1]:.1f}z" fill="{fill_side}" stroke="{stroke}" stroke-opacity=".5" stroke-width=".8"/>'
            f'<ellipse cx="{b[0]:.1f}" cy="{b[1]:.1f}" rx="{r:.1f}" ry="{ry:.1f}" fill="{fill_top}" stroke="{stroke}" stroke-opacity=".7" stroke-width=".8"/>')


def water_tower(x, y):
    o = []
    for dx, dy in ((-.22, -.22), (.22, -.22), (-.22, .22), (.22, .22)):
        a, b = p(x + dx, y + dy, 0), p(x + dx * .55, y + dy * .55, 1.0)
        o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#DCEAF7" stroke-width="2"/>')
    o.append(cylinder(x, y, 1.0, 1.45, .36, "#1AA5D6", "#BDEBFA"))
    return "".join(o)


def tree(x, y, r=.24, h=.5, c=("#2BC7B4", "#0B8A7F")):
    base, top = p(x, y, 0), p(x, y, h)
    rr = r * S
    return (f'<line x1="{base[0]:.1f}" y1="{base[1]:.1f}" x2="{top[0]:.1f}" y2="{top[1]:.1f}" stroke="#4B3B2E" stroke-width="2"/>'
            f'<circle cx="{top[0]:.1f}" cy="{top[1] - rr * .6:.1f}" r="{rr:.1f}" fill="url(#{U}tree)"/>')


def lake(cx, cy, rx, ry):
    pts = [p(cx + rx * math.cos(t), cy + ry * math.sin(t), .02) for t in [i * math.pi / 24 for i in range(48)]]
    return poly(pts, "url(#" + U + "lake)", 'stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1.2"')


def solar_field(x0, y0, n=3):
    o = []
    for i in range(n):
        xa = x0 + i * .42
        o.append(poly([p(xa, y0, .05), p(xa + .34, y0, .05), p(xa + .34, y0 + .5, .22), p(xa, y0 + .5, .22)], "#16335C", 'stroke="#9FD4FF" stroke-width=".7"'))
    return "".join(o)


def label(x, y, title, sub, anchor="middle", w=None, k=1.0):
    tw = (w or max(len(title) * 7.6, len(sub) * 6.0) + 26) * k
    lx = x - tw / 2 if anchor == "middle" else x
    return (f'<g><rect x="{lx:.1f}" y="{y:.1f}" width="{tw:.1f}" height="{40 * k:g}" rx="{10 * k:g}" fill="#0B2E57" fill-opacity=".72" stroke="#FFFFFF" stroke-opacity=".35"/>'
            f'<text x="{lx + 12 * k:.1f}" y="{y + 17 * k:.1f}" font-family="{FONT}" font-size="{13 * k:g}" font-weight="700" fill="#FFFFFF">{title}</text>'
            f'<text x="{lx + 12 * k:.1f}" y="{y + 32 * k:.1f}" font-family="{FONT}" font-size="{round(10.8 * k, 1):g}" fill="#CFE4F7">{sub}</text></g>')


# ───────────────────────── the city
TILE = 3.5
DT, RV, HC = (0.5, 0.5), (4.75, 0.5), (9.0, 0.5)          # back row: Downtown, Riverside, Hillcrest
MT, NP = (4.75, 4.75), (9.0, 4.75)                          # front row: Midtown, New plot
LK = (-0.15, 5.65)                                          # Lakeside — on its own island
ISL = (-0.45, 5.35, 3.65, 9.45)                             # island footprint
CAMPUS = (-4.5, 0.6, -2.9, 3.9)                             # office campus (on-premises), outside the city
Z = .14


def face(pts3, fill, extra=""):
    return poly([p(*q) for q in pts3], fill, extra)


def city_ground():
    """L-shaped city foundation + separate Lakeside island + campus + highway deck."""
    o = []
    st = 'stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1" stroke-linejoin="round"'
    zb = -.5
    # office campus pad (outside the city)
    x0, y0, x1, y1 = CAMPUS
    o.append(box(x0, y0, x1, y1, zb, 0, "#3A5578", "#1E2F45", "#15243A", op=1, edge=.4))
    # highway deck from campus to the city edge
    o.append(box(x1, 1.0, 0, 3.6, -.32, -.02, "#55708F", "#2A3F58", "#203248", op=1, edge=.35))
    # city foundation (L shape)
    top = [(0, 0, 0), (13, 0, 0), (13, 8.75, 0), (4.6, 8.75, 0), (4.6, 4.6, 0), (0, 4.6, 0)]
    o.append(face([(0, 4.6, zb), (4.6, 4.6, zb), (4.6, 4.6, 0), (0, 4.6, 0)], f"url(#{U}fdL)", st))
    o.append(face([(4.6, 8.75, zb), (13, 8.75, zb), (13, 8.75, 0), (4.6, 8.75, 0)], f"url(#{U}fdL)", st))
    o.append(face([(13, 0, zb), (13, 8.75, zb), (13, 8.75, 0), (13, 0, 0)], f"url(#{U}fdR)", st))
    o.append(face(top, f"url(#{U}fdT)", st))
    # Lakeside island: earth sides, grass top — no road reaches it
    ix0, iy0, ix1, iy1 = ISL
    o.append(box(ix0, iy0, ix1, iy1, zb, 0, f"url(#{U}islT)", "#6B5A45", "#54463A", op=1, edge=.35))
    return "\n".join(o)


def roads():
    o = []
    rl = []
    for (xa, ya), (xb, yb) in (((4.375, .25), (4.375, 4.6)), ((8.625, .25), (8.625, 8.5)), ((4.6, 4.375), (12.75, 4.375))):
        a, b = p(xa, ya), p(xb, yb)
        rl.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')
    o.append('<g stroke="#FFFFFF" stroke-opacity=".28" stroke-width="1.2" stroke-dasharray="7 7">' + "".join(rl) + "</g>")
    return "\n".join(o)


def express_lanes():
    """Express toll lanes (ExpressRoute) from the campus to two separate interchanges."""
    o = []
    # general lanes (the public highway) in the middle of the deck
    for yy in (2.05, 2.55):
        a, b = p(-2.9, yy, -.02), p(0, yy, -.02)
        o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="5 6"/>')
    # two express lanes → interchange A (x≈1.3) and B (x≈3.3)
    for ya in (1.3, 3.3):
        pts = [p(-2.9, ya, -.01), p(.05, ya, .01), p(.45, ya, .02)]
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        o.append(f'<path d="{d}" fill="none" stroke="#3A0F2A" stroke-opacity=".35" stroke-width="11" stroke-linecap="round"/>')
        o.append(f'<path d="{d}" fill="none" stroke="url(#{U}lane)" stroke-width="7" stroke-linecap="round"/>')
        o.append(f'<path d="{d}" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-dasharray="6 6"/>')
    return "\n".join(o)


def gantry(x, y):
    """Toll gantry over an express lane at a city interchange."""
    a, b = p(x, y - .3, 0), p(x, y + .3, 0)
    at, bt = p(x, y - .3, .55), p(x, y + .3, .55)
    return (f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{at[0]:.1f}" y2="{at[1]:.1f}" stroke="#FFFFFF" stroke-width="2"/>'
            f'<line x1="{b[0]:.1f}" y1="{b[1]:.1f}" x2="{bt[0]:.1f}" y2="{bt[1]:.1f}" stroke="#FFFFFF" stroke-width="2"/>'
            f'<line x1="{at[0]:.1f}" y1="{at[1]:.1f}" x2="{bt[0]:.1f}" y2="{bt[1]:.1f}" stroke="#FFB38A" stroke-width="4" stroke-linecap="round"/>')


def tile_plate(x0, y0, kind):
    x1, y1 = x0 + TILE, y0 + TILE
    if kind == "cand":
        return poly([p(x0, y0, .03), p(x1, y0, .03), p(x1, y1, .03), p(x0, y1, .03)], "#FFFFFF",
                    'fill-opacity=".08" stroke="#FFFFFF" stroke-opacity=".9" stroke-width="1.5" stroke-dasharray="6 5"')
    g = {"hub": ("hubL", "hubR"), "min": ("minL", "minR"), "tl": ("tlL", "tlR"), "lk": ("tlL", "tlR")}[kind]
    top = {"hub": f"url(#{U}plHub)", "min": f"url(#{U}plMin)", "tl": f"url(#{U}plTl)", "lk": f"url(#{U}plLk)"}[kind]
    if kind == "lk":  # unpaved: no raised plate edge, just grass
        return poly([p(x0, y0, .02), p(x1, y0, .02), p(x1, y1, .02), p(x0, y1, .02)], top, 'stroke="#FFFFFF" stroke-opacity=".35"')
    return box(x0, y0, x1, y1, 0, .14, top, f"url(#{U}{g[0]})", f"url(#{U}{g[1]})", op=.95, edge=.5)


def bank_bldg(x0, y0, x1, y1, h, backup=False):
    side = ("#DCE6F1", "#B9CBDD") if not backup else ("#C9D3DE", "#A9B6C6")
    o = [box(x0, y0, x1, y1, 0, h, "#FFFFFF", side[0], side[1], op=1)]
    ym = (y0 + y1) / 2
    o.append(poly([p(x0, y1, h), p(x1, y1, h), p(x1, ym, h + .28), p(x0, ym, h + .28)], "#0B3A63" if not backup else "#5B6778", 'stroke="#fff" stroke-opacity=".6"'))
    o.append(poly([p(x1, y0, h), p(x1, y1, h), p(x1, ym, h + .28)], "#E6EEF7", 'stroke="#fff" stroke-opacity=".6"'))
    cols = []
    for i in range(4):
        cx = x0 + .12 + i * (x1 - x0 - .24) / 3
        a, b = p(cx, y1, .05), p(cx, y1, h - .05)
        cols.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')
    o.append('<g stroke="#8FA6BE" stroke-width="2" stroke-linecap="round">' + "".join(cols) + "</g>")
    return "\n".join(o)


def numpin(x, y, z, n, lift=.62, r=11.5, color="#04807A"):
    bx, by = p(x, y, z)
    ty = by - lift * S
    return (f'<line x1="{bx:.1f}" y1="{by:.1f}" x2="{bx:.1f}" y2="{ty + r:.1f}" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="1.2"/>'
            f'<circle cx="{bx:.1f}" cy="{ty:.1f}" r="{r + 2.5:.1f}" fill="#FFFFFF" fill-opacity=".92"/><circle cx="{bx:.1f}" cy="{ty:.1f}" r="{r:.1f}" fill="{color}"/>'
            f'<text x="{bx:.1f}" y="{ty + 4.3:.1f}" text-anchor="middle" font-family="{FONT}" font-size="12.5" font-weight="700" fill="#FFFFFF">{n}</text>')


def city():
    o = [city_ground()]
    # city limits: one set of laws everywhere — island included, campus outside
    lim = [p(-.7, -.15, .01), p(13.15, -.15, .01), p(13.15, 9.7, .01), p(-.7, 9.7, .01)]
    o.append(poly(lim, "none", 'stroke="#E9D8FF" stroke-opacity=".9" stroke-width="1.6" stroke-dasharray="2 6" stroke-linecap="round"'))
    o.append(roads())
    for (x0, y0), k in ((DT, "hub"), (RV, "min"), (HC, "tl"), (MT, "tl"), (NP, "cand"), (LK, "lk")):
        o.append(tile_plate(x0, y0, k))
    o.append(lake(LK[0] + 2.35, LK[1] + 2.4, .85, .7))
    # dirt paths on the island (unpaved)
    for (xa, ya), (xb, yb) in (((LK[0] + .7, LK[1] + 1.15), (LK[0] + .7, LK[1] + 2.0)), ((LK[0] + 1.15, LK[1] + .75), (LK[0] + 1.9, LK[1] + .75)),
                               ((LK[0] + 1.9, LK[1] + 1.15), (LK[0] + 2.7, LK[1] + 1.55))):
        a, b = p(xa, ya, .03), p(xb, yb, .03)
        o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#A88B67" stroke-width="3" stroke-dasharray="3 4" stroke-linecap="round"/>')
    o.append(express_lanes())

    # transit between neighborhoods (cross-region private connectivity)
    route = [p(4.375, 1.0, .02), p(4.375, 4.375, .02), p(11.4, 4.375, .02)]
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in route)
    o.append(f'<path d="{d}" fill="none" stroke="#2A1B55" stroke-opacity=".35" stroke-width="13" stroke-linejoin="round"/>')
    o.append(f'<path d="{d}" fill="none" stroke="url(#{U}rail)" stroke-width="8" stroke-linejoin="round"/>')
    o.append(f'<path d="{d}" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="1.5 5" stroke-linejoin="round"/>')
    a, b = p(11.4, 4.375, .02), p(11.4, 5.4, .02)
    o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#E9D8FF" stroke-width="3" stroke-dasharray="4 5"/>')

    items = []

    def add(depth, svg, lift=True):
        items.append((depth, f'<g transform="translate(0,{-Z * S:.1f})">{svg}</g>' if lift else svg))

    # campus buildings (on-premises)
    cx0, cy0, cx1, cy1 = CAMPUS
    add(cx0 + cy0 + 1.5, tower(cx0 + .3, cy0 + .3, cx0 + 1.25, cy0 + 1.3, 1.5, "white"), lift=False)
    add(cx0 + cy0 + 2.6, tower(cx0 + .3, cy0 + 1.6, cx0 + 1.25, cy0 + 2.5, 1.05, "white"), lift=False)
    add(cx0 + cy0 + 3.6, box(cx0 + .35, cy0 + 2.75, cx0 + 1.2, cy0 + 3.05, 0, .55, "#FFFFFF", "#C9D3DE", "#A9B6C6", op=1), lift=False)
    add(1.0, gantry(.1, 1.3) + gantry(.1, 3.3), lift=False)

    # stations
    for sx, sy in ((4.05, 2.0), (6.4, 4.05), (6.4, 4.7), (10.6, 4.05)):
        add(sx + sy + .2, box(sx - .3, sy - .12, sx + .3, sy + .12, 0, .1, "#F0E9FF", "#B7A2E8", "#9A82D8", op=1)
            + box(sx - .32, sy - .14, sx + .32, sy + .14, .38, .44, "#FFFFFF", "#D9CCF7", "#C2B1EE", op=1), lift=False)
    add(4.375 + 3.3 + .6, box(4.25, 2.7, 4.5, 3.9, .03, .34, "#FFFFFF", "#8661C5", "#6E4CB6", op=1, edge=.7), lift=False)
    add(8.4 + 4.375 + .6, box(7.6, 4.25, 9.2, 4.5, .03, .34, "#FFFFFF", "#8661C5", "#6E4CB6", op=1, edge=.7), lift=False)

    # ── Downtown: full regional hub
    X, Y = DT
    at = lambda dx, dy: (X + dx, Y + dy)
    add(X + Y + .9, tower(*at(.25, .25), *at(1.05, 1.05), 2.6))
    add(X + Y + 1.9, tower(*at(1.3, .25), *at(1.95, .9), 3.1, "cyan"))
    add(X + Y + 2.8, civic(*at(2.2, .25), *at(3.25, 1.15), .62))
    add(X + Y + 2.3, tower(*at(.25, 1.45), *at(1.25, 2.3), 1.05, "white") + box(*at(.55, 1.65), *at(.95, 2.05), 1.05, 1.2, "#FFFFFF", "#D13438", "#A4262C", op=1))
    add(X + Y + 3.5, box(*at(1.55, 1.45), *at(2.35, 2.15), 0, .55, "#FFE3D6", "#E8590C", "#B8470A", op=1))
    add(X + Y + 4.3, box(*at(2.55, 1.45), *at(3.25, 2.15), 0, .62, "#DCEAF7", "#0F548C", "#0B3A63", op=1))
    add(X + Y + 3.4, box(*at(.25, 2.6), *at(1.15, 3.25), 0, .5, "#FFF4D6", "#C98A00", "#9C6B00", op=1) + box(*at(.85, 2.7), *at(1.02, 2.87), .5, 1.5, "#FFFFFF", "#D6DEE8", "#B9C4D1", op=1))
    add(X + Y + 4.6, water_tower(*at(1.75, 2.9)))
    add(X + Y + 5.6, cylinder(*at(2.65, 2.75), 0, .28, .3, "#7D8A9B", "#C9D3DE") + cylinder(*at(3.05, 3.15), 0, .24, .24, "#7D8A9B", "#C9D3DE"))
    badges = [
        pin_badge(*at(2.72, .7), Z + 1.0, "scales", lift=.75),
        pin_badge(*at(.75, 1.85), Z + 1.2, "hospital", lift=.62),
        pin_badge(*at(1.95, 1.8), Z + .55, "fire", lift=.62),
        pin_badge(*at(2.9, 1.8), Z + .62, "police", lift=.62),
        pin_badge(*at(.7, 2.92), Z + 1.5, "power", lift=.42),
        pin_badge(*at(1.75, 2.9), Z + 1.45, "water", lift=.5),
        pin_badge(*at(2.85, 2.95), Z + .28, "sewer", lift=.62),
    ]
    rc = [("#2B88D8", "#0F548C"), ("#C2410C", "#8E2F09"), ("#04807A", "#03615F"), ("#C98A00", "#8F6200"), ("#8661C5", "#5C2E91")]

    # ── Riverside: minimal hub — fire station + clinic; bank branch A
    X, Y = RV
    add(X + Y + 1.2, box(X + .3, Y + .3, X + 1.2, Y + 1.05, 0, .5, "#FFE3D6", "#E8590C", "#B8470A", op=1))
    add(X + Y + 2.4, box(X + 1.5, Y + .3, X + 2.5, Y + 1.05, 0, .62, "#FFFFFF", "#DCE8F3", "#B8CDE2", op=1) + box(X + 1.85, Y + .55, X + 2.15, Y + .85, .62, .72, "#FFFFFF", "#D13438", "#A4262C", op=1))
    add(X + Y + 3.2, bank_bldg(X + 2.55, Y + .35, X + 3.25, Y + 1.0, .5))
    for i, (hx, hy) in enumerate(((.3, 1.5), (1.35, 1.5), (2.4, 1.5), (.3, 2.5), (1.35, 2.5), (2.4, 2.5))):
        add(X + Y + hx + hy + .9, house(X + hx, Y + hy, .8, .7, .38, .26, roof=rc[i % 5]))
    badges += [pin_badge(X + .75, Y + .68, Z + .5, "fire", lift=.55), pin_badge(X + 2.0, Y + .68, Z + .72, "hospital", lift=.5),
               pin_badge(X + 2.9, Y + .68, Z + .78, "bank", lift=.5), numpin(X + 1.75, Y + 2.85, Z + .64, "4")]

    # ── Hillcrest: remote-hub-connected — homes; bank backup operations center
    X, Y = HC
    for i, (hx, hy) in enumerate(((.3, .3), (1.35, .3), (.3, 1.4), (1.35, 1.4), (2.4, 1.4), (.3, 2.5), (1.35, 2.5))):
        add(X + Y + hx + hy + .9, house(X + hx, Y + hy, .8, .7, .38, .26, roof=rc[(i + 2) % 5]))
    add(X + Y + 3.0, bank_bldg(X + 2.4, Y + .3, X + 3.25, Y + 1.0, .45, backup=True))
    add(X + Y + 5.6, tree(X + 2.85, Y + 2.85) + tree(X + 3.15, Y + 2.55, r=.2))
    badges += [pin_badge(X + 2.82, Y + .65, Z + .73, "bank", lift=.5), numpin(X + .7, Y + 1.75, Z + .64, "1")]

    # ── Midtown: remote-hub-connected — homes, apartments; bank branch B
    X, Y = MT
    add(X + Y + 1.5, tower(X + .3, Y + .45, X + 1.2, Y + 1.25, 1.15, "white"))
    add(X + Y + 2.5, bank_bldg(X + 1.45, Y + .5, X + 2.25, Y + 1.2, .5))
    for i, (hx, hy) in enumerate(((2.45, .45), (.3, 1.55), (1.35, 1.55), (2.4, 1.55), (.3, 2.6), (1.35, 2.6))):
        add(X + Y + hx + hy + .9, house(X + hx, Y + hy, .8, .7, .38, .26, roof=rc[(i + 1) % 5]))
    add(X + Y + 5.9, tree(X + 2.9, Y + 2.95))
    badges += [pin_badge(X + 1.85, Y + .85, Z + .78, "bank", lift=.5), numpin(X + 1.75, Y + 1.9, Z + .64, "3")]

    # ── Lakeside: disconnected island — off-grid, unpaved, no transit or lanes
    X, Y = LK
    for i, (hx, hy, ang) in enumerate(((.3, .3, 0), (1.45, .3, 1), (.3, 1.4, 2))):
        add(X + Y + hx + hy + .9, house(X + hx, Y + hy, .85, .75, .38, .28, roof=rc[(i * 2) % 5], solar=True), lift=False)
    add(X + Y + 3.2, solar_field(X + 2.55, Y + .35, 2) + cylinder(X + 2.9, Y + 1.3, 0, .3, .16, "#1AA5D6", "#BDEBFA"), lift=False)
    for tx, ty in ((.35, 2.6), (.75, 3.1), (1.2, 2.85), (3.1, 2.0), (3.2, 3.15), (-.1, 1.0), (2.2, -.05), (3.45, .6)):
        add(X + Y + tx + ty, tree(X + tx, Y + ty), lift=False)
    badges += [numpin(X + .72, Y + .68, .66, "2")]

    # ── New plot
    X, Y = NP
    stakes = []
    for sx, sy in ((.6, .6), (2.9, .6), (2.9, 2.9), (.6, 2.9)):
        a, b = p(X + sx, Y + sy, .03), p(X + sx, Y + sy, .35)
        stakes.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#FFFFFF" stroke-width="2"/><path d="M{b[0]:.1f},{b[1]:.1f} l9,3 -9,3z" fill="#FFB38A"/>')
    add(X + Y + 1, "".join(stakes), lift=False)

    for _, svg in sorted(items, key=lambda t: t[0]):
        o.append(svg)
    o.extend(badges)
    return "\n".join(o)


# ───────────────────────── panels
def card(x, y, w, h):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="22" fill="#FFFFFF" fill-opacity=".97"/>'


def household(px, py, pw):
    o = [card(px, py, pw, 448)]
    x = px + 30
    o.append(f'<text x="{x}" y="{py + 40}" font-family="{FONT}" font-size="11.5" font-weight="700" letter-spacing="2" fill="#04807A">SINGLE-REGION WORKLOAD</text>')
    o.append(f'<text x="{x}" y="{py + 74}" font-family="{FONT}" font-size="26" font-weight="700" fill="#0A2340">The household</text>')
    o.append(f'<text x="{x}" y="{py + 100}" font-family="{FONT}" font-size="13.5" fill="#28323E">Most workloads live in one neighborhood: the one that fits how they live.</text>')
    fam = [("1", "Commutes to the office every day", "Hybrid-connected", "Hillcrest", "transit, plus express lanes to the office"),
           ("2", "Works fully remote, self-sufficient", "Isolated", "Lakeside", "off-grid is fine; needs nothing from the city"),
           ("3", "Remote, but relies on city services", "Connected", "Midtown", "hospital and services one transit ride away"),
           ("4", "Extended family, always visiting", "Interconnected portfolio", "Riverside", "local services for a close-knit group")]
    cw, ch = (pw - 60 - 14) / 2, 140
    for i, (n, t, arch, hood, why) in enumerate(fam):
        cx = x + (i % 2) * (cw + 14)
        cy = py + 122 + (i // 2) * (ch + 14)
        o.append(f'<rect x="{cx:.0f}" y="{cy}" width="{cw:.0f}" height="{ch}" rx="14" fill="#F5F8FB" stroke="#E4E9EF"/>')
        o.append(f'<circle cx="{cx + 24:.0f}" cy="{cy + 26}" r="13" fill="#04807A"/><text x="{cx + 24:.0f}" y="{cy + 30.5}" text-anchor="middle" font-family="{FONT}" font-size="13" font-weight="700" fill="#FFFFFF">{n}</text>')
        o.append(f'<text x="{cx + 46:.0f}" y="{cy + 31}" font-family="{FONT}" font-size="13.2" font-weight="700" fill="#0A2340">{t}</text>')
        o.append(f'<rect x="{cx + 16:.0f}" y="{cy + 50}" width="{len(arch) * 6.9 + 20:.0f}" height="22" rx="11" fill="#E0F2EF"/>')
        o.append(f'<text x="{cx + 26:.0f}" y="{cy + 65}" font-family="{FONT}" font-size="11" font-weight="700" fill="#035E59">{arch}</text>')
        o.append(f'<text x="{cx + 16:.0f}" y="{cy + 98}" font-family="{FONT}" font-size="12.4" fill="#5B6778">Picks</text>')
        o.append(f'<text x="{cx + 52:.0f}" y="{cy + 98}" font-family="{FONT}" font-size="13.4" font-weight="700" fill="#0F548C">{hood}</text>')
        o.append(f'<text x="{cx + 16:.0f}" y="{cy + 119}" font-family="{FONT}" font-size="11.6" fill="#28323E">{why}</text>')
    return "\n".join(o)


def bank_panel(px, py, pw):
    o = [card(px, py, pw, 436)]
    x = px + 30
    o.append(f'<text x="{x}" y="{py + 40}" font-family="{FONT}" font-size="11.5" font-weight="700" letter-spacing="2" fill="#0F6CBD">MULTI-REGION WORKLOAD</text>')
    o.append(f'<text x="{x}" y="{py + 74}" font-family="{FONT}" font-size="26" font-weight="700" fill="#0A2340">The bank</text>')
    o.append(f'<text x="{x}" y="{py + 100}" font-family="{FONT}" font-size="13.5" fill="#28323E">Some workloads need several neighborhoods, for reach and for resilience.</text>')
    rows = [("campus", "#243A57", "Headquarters and core systems on the office campus", "on-premises"),
            ("lane", "#E0607E", "Express lanes through two interchanges; one can close", "ExpressRoute, circuit diversity"),
            ("bank", "#0B3A63", "Branches in Riverside and Midtown serve customers together", "active-active"),
            ("moon", "#5B6778", "Backup operations center in Hillcrest stands by", "active/passive recovery"),
            ("scales", "#5C2E91", "Banking licenses and secure vaults on top of city law", "compliance, specialized SKUs")]
    for i, (ic, c, t, m) in enumerate(rows):
        ry = py + 122 + i * 60
        o.append(f'<rect x="{x}" y="{ry}" width="{pw - 60}" height="50" rx="12" fill="#F5F8FB" stroke="#E4E9EF"/>')
        o.append(badge(x + 25, ry + 25, ic, r=14, color=c, ring=False))
        o.append(f'<text x="{x + 50}" y="{ry + 21}" font-family="{FONT}" font-size="13" font-weight="700" fill="#0A2340">{t}</text>')
        o.append(f'<text x="{x + 50}" y="{ry + 39}" font-family="{FONT}" font-size="11.6" fill="#0F548C">≈ {m}</text>')
    return "\n".join(o)


def legend(y):
    items = [("hood", "#2B88D8", "Neighborhoods", "Azure regions"),
             ("train", "#8661C5", "Transit between neighborhoods", "Connectivity between regions"),
             ("lane", "#E0607E", "Express toll lanes", "ExpressRoute"),
             ("campus", "#243A57", "Office campus", "On-premises"),
             ("hospital", "#D13438", "Police, fire, hospitals, utilities", "Shared services"),
             ("scales", "#5C2E91", "Laws, codes, zoning", "Governance and policy")]
    o = [f'<rect x="40" y="{y}" width="{W - 80}" height="92" rx="20" fill="#071A31" fill-opacity=".4" stroke="#FFFFFF" stroke-opacity=".18"/>']
    colw = (W - 120) / len(items)
    for i, (ic, c, a, b) in enumerate(items):
        x = 60 + i * colw
        o.append(badge(x + 20, y + 46, ic, r=16, color=c))
        o.append(f'<text x="{x + 46}" y="{y + 41}" font-family="{FONT}" font-size="12.6" font-weight="600" fill="#FFFFFF">{a}</text>')
        o.append(f'<text x="{x + 46}" y="{y + 60}" font-family="{FONT}" font-size="12.6" fill="#9FE6F7">→ {b}</text>')
    return "\n".join(o)


def build(web=False, pdf=False):
    """web: city only, for the website. pdf: city only with larger labels that name what each place stands for."""
    extra = f"""
<defs>
  <linearGradient id="{U}plHub" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#BFE3FF" stop-opacity=".85"/><stop offset="1" stop-color="#7FB9EA" stop-opacity=".75"/></linearGradient>
  <linearGradient id="{U}plMin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D3F4FC" stop-opacity=".85"/><stop offset="1" stop-color="#8ADBF0" stop-opacity=".75"/></linearGradient>
  <linearGradient id="{U}plTl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D5F5EF" stop-opacity=".85"/><stop offset="1" stop-color="#86D9CC" stop-opacity=".75"/></linearGradient>
  <linearGradient id="{U}plLk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#CFEFC8"/><stop offset="1" stop-color="#8CCB86"/></linearGradient>
  <linearGradient id="{U}islT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#BFE5B5"/><stop offset="1" stop-color="#7DBB76"/></linearGradient>
  <radialGradient id="{U}tree" cx=".35" cy=".35" r=".75"><stop offset="0" stop-color="#7EE0C9"/><stop offset=".6" stop-color="#2BB39E"/><stop offset="1" stop-color="#0B7A6E"/></radialGradient>
  <linearGradient id="{U}lake" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FD8F5"/><stop offset="1" stop-color="#1A8FC4"/></linearGradient>
  <linearGradient id="{U}rail" x1="0" x2="1"><stop offset="0" stop-color="#C9B6F5"/><stop offset="1" stop-color="#9B7FE0"/></linearGradient>
  <linearGradient id="{U}lane" x1="0" x2="1"><stop offset="0" stop-color="#FFB38A"/><stop offset="1" stop-color="#FF7FA6"/></linearGradient>
</defs>"""
    if pdf:   # city only, cropped: the title and the icon legend are real HTML on the PDF page
        o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{PDF_X} {PDF_Y} {PDF_W} {PDF_H}" font-family="{FONT}" style="display:block;width:100%;height:auto">',
             defs(U), extra, f'<clipPath id="{U}clip"><rect x="{PDF_X}" y="{PDF_Y}" width="{PDF_W}" height="{PDF_H}" rx="20"/></clipPath>',
             f'<g clip-path="url(#{U}clip)">', background(U, 0, 0, W, H)]
    elif web:   # city only, cropped: the panels and legend are real HTML on the website
        o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{WEB_W}" height="{WEB_H}" viewBox="0 {WEB_Y} {WEB_W} {WEB_H}" font-family="{FONT}">',
             defs(U), extra, f'<clipPath id="{U}clip"><rect x="0" y="{WEB_Y}" width="{WEB_W}" height="{WEB_H}" rx="14"/></clipPath>',
             f'<g clip-path="url(#{U}clip)">', background(U, 0, 0, W, H)]
    else:
        o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{FONT}">',
             defs(U), extra, background(U, 0, 0, W, H)]
    for i in range(4, 0, -1):
        r = 70 + 46 * i
        o.append(f'<rect x="{960 - r}" y="{90 - r}" width="{2 * r}" height="{2 * r}" rx="{r * .3:.0f}" fill="#FFFFFF" fill-opacity="{.02 + .015 * (4 - i)}" stroke="#FFFFFF" stroke-opacity=".14"/>')
    web = web or pdf
    if not web:
        o.append(f'<text x="60" y="64" font-family="{FONT}" font-size="13" font-weight="700" letter-spacing="2.4" fill="#BFE3FF">AN EVERYDAY ANALOGY</text>')
    if not web:
        o.append(f'<text x="60" y="106" font-family="{FONT}" font-size="34" font-weight="300" fill="#FFFFFF">The platform is the <tspan font-weight="700">city</tspan>. Workloads are the <tspan font-weight="700">people and businesses</tspan> that live in it.</text>')
    if not web:
        o.append(f'<text x="60" y="138" font-family="{FONT}" font-size="15.5" fill="#DDEBF9">The city builds neighborhoods, services, roads, transit, and laws once. A family settles in one neighborhood; a bank spreads across several. Neither builds a new city.</text>')
    if not pdf:
        o.append(f'<text x="60" y="196" font-family="{FONT}" font-size="12" font-weight="700" letter-spacing="2" fill="#9FE6F7">MULTI-REGION PLATFORM · THE CITY</text>')
    o.append(city())
    # neighborhood + campus labels: (title, sub, centre x, top y, leader target)
    L = [("Office campus", "On-premises · outside the city", 165, 222, p(-3.7, 1.0, 1.5)),
         ("Express toll lanes", "Two interchanges into Downtown", 400, 266, p(-1.4, 1.3, 0)),
         ("Downtown", "Full regional hub · every service local", 650, 236, p(2.0, .9, 2.9)),
         ("Riverside", "Minimal regional hub · fire station, clinic", 790, 330, p(6.6, 1.2, .9)),
         ("Hillcrest", "Remote-hub-connected · services by transit", 930, 470, p(10.9, 1.4, .6)),
         ("Midtown", "Remote-hub-connected · services by transit", 430, 900, p(5.4, 8.1, .3)),
         ("Lakeside", "Disconnected · off-grid, no city roads", 150, 800, p(.4, 8.9, .3)),
         ("New plot", "Candidate · zoned, not yet built", 968, 905, p(11.6, 7.4, .05))]
    k = 1.0
    if pdf:   # the label names what the place stands for; the legend beside the picture explains the icons
        k = PDF_LABEL
        L = [("Office campus", "On-premises", 150, 240, p(-3.7, 1.0, 1.5)),
             ("Express toll lanes", "ExpressRoute", 415, 280, p(-1.4, 1.3, 0)),
             ("Downtown", "Full Regional Hub", 668, 240, p(2.0, .9, 2.9)),
             ("Riverside", "Minimal Regional Hub", 842, 340, p(6.6, 1.2, .9)),
             ("Hillcrest", "Remote Hub Connected", 960, 470, p(10.9, 1.4, .6)),
             ("Midtown", "Remote Hub Connected", 400, 970, p(5.4, 8.1, .3)),
             ("Lakeside", "Disconnected Spokes", 128, 880, p(.4, 8.9, .3)),
             ("New plot", "Candidate region", 968, 960, p(11.6, 7.4, .05))]
    for t, sub, cx, ty, (ax, ay) in L:
        ly = ty + 40 * k if ay > ty + 40 * k else ty
        o.append(f'<line x1="{cx:.1f}" y1="{ly:.1f}" x2="{ax:.1f}" y2="{ay:.1f}" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1.2"/><circle cx="{ax:.1f}" cy="{ay:.1f}" r="3" fill="#FFFFFF"/>')
        o.append(label(cx, ty, t, sub, k=k))
    if not pdf:
        o.append(f'<text x="64" y="1094" font-family="{FONT}" font-size="12.5" fill="#E9D8FF">· · ·  City limits: one set of laws, codes, and zoning in every neighborhood, Lakeside included</text>')
    if web:
        o.append("</g>")
    else:
        o.append(household(1090, 172, 670))
        o.append(bank_panel(1090, 636, 670))
        o.append(legend(1118))
    o.append("</svg>")
    return "\n".join(o)


# ───────────────────────── PDF page figure: the city with a legend for every icon on it
def _ic(kind, color=None):
    return f'<svg class="ic" viewBox="0 0 32 32" aria-hidden="true">{badge(16, 16, kind, r=14, color=color, ring=False)}</svg>'


def _swatch(kind):
    """A line as it is drawn on the map, on a chip of the map's background colour."""
    line = {"lane": '<path d="M6 16h20" stroke="#FF9A98" stroke-width="6" stroke-linecap="round"/><path d="M7 16h18" stroke="#fff" stroke-width="1.3" stroke-dasharray="3.5 3.5"/>',
            "rail": '<path d="M5 16h22" stroke="#B49CEB" stroke-width="6"/><path d="M5 16h22" stroke="#fff" stroke-width="1.6" stroke-dasharray="1.2 3.6"/>',
            "limits": '<path d="M6 16h20" stroke="#E9D8FF" stroke-width="2.2" stroke-dasharray="1.6 4.4" stroke-linecap="round"/>'}[kind]
    return f'<svg class="ic" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="8" fill="#17458A"/><g fill="none">{line}</g></svg>'


def _pin(n):
    return (f'<svg class="ic" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#04807A"/>'
            f'<text x="16" y="21" text-anchor="middle" font-family="{FONT}" font-size="14.5" font-weight="700" fill="#fff">{n}</text></svg>')


PDF_CSS = """
.cty { display: grid; grid-template-columns: 596px 1fr; gap: 0 22px; align-items: start; }
.cty .ic { width: 22px; height: 22px; flex: none; display: block; }
.cty h4 { font-size: 9.2px; letter-spacing: .1em; color: var(--b700); padding-bottom: 4px; border-bottom: 1px solid var(--line-soft); margin: 11px 0 1px; display: flex; justify-content: space-between; gap: 8px; }
.cty h4:first-child { margin-top: 0; }
.cty h4 em { font-style: normal; color: var(--t600); }
.cty .r { display: grid; grid-template-columns: 22px 1fr; gap: 9px; padding: 5px 0; align-items: start; }
.cty .r + .r { border-top: 1px solid var(--line-soft); }
.cty .r b { display: block; font-size: 10.8px; line-height: 1.25; color: var(--ink); font-weight: 650; }
.cty .r span { display: block; font-size: 10px; line-height: 1.36; color: var(--muted); margin-top: 1px; }
.cty .r span i { font-style: normal; color: var(--b700); font-weight: 650; }
.cty .sv { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 10px; padding: 6px 0 5px; border-top: 1px solid var(--line-soft); }
.cty .sv div { display: flex; align-items: center; gap: 7px; font-size: 10.2px; font-weight: 650; color: var(--ink); line-height: 1.2; }
.cty .sv .ic { width: 19px; height: 19px; }
.cty .svn { font-size: 10px; line-height: 1.36; color: var(--muted); }
.cty .svn i { font-style: normal; color: var(--b700); font-weight: 650; }
.cty .who { display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; margin-top: 10px; }
.cty .who > div { border-radius: 10px; background: var(--wash); padding: 9px 12px 8px; }
.cty .who h4 { border-bottom-color: var(--line); }
.cty .who p { font-size: 10px; line-height: 1.38; color: var(--muted); margin: 5px 0 0; }
.cty .who p b { color: var(--ink); font-weight: 650; }
.cty .who .hh { display: grid; grid-template-columns: 1fr 1.25fr; gap: 5px 8px; margin-top: 7px; }
.cty .who .hh div { display: flex; align-items: center; gap: 6px; font-size: 10px; line-height: 1.2; color: var(--muted); }
.cty .who .hh div b { display: block; color: var(--ink); font-weight: 650; }
.cty .who .hh .ic { width: 18px; height: 18px; }
.cty .who .bk { display: grid; grid-template-columns: 22px 1fr; gap: 9px; margin-top: 6px; align-items: start; }
.cty .who .bk p { margin: 0; }
"""


def pdf_figure():
    """The city and a legend for every icon drawn on it, as an HTML block for a whitepaper or executive brief page."""
    def row(icon, name, what):
        return f'<div class="r">{icon}<div><b>{name}</b><span>{what}</span></div></div>'
    services = [("hospital", "Hospital or clinic"), ("fire", "Fire station"), ("police", "Police station"),
                ("power", "Power plant"), ("water", "Water tower"), ("sewer", "Sewer plant")]
    legend_col = "".join([
        '<h4>Places <em>Regions and on-premises</em></h4>',
        row(_ic("hood", "#2B88D8"), "Neighborhood", "An <i>Azure region</i>. The label names its connectivity profile."),
        row(_ic("campus"), "Office campus", "<i>On-premises</i> datacenters and users, outside the city."),
        row(_ic("stake", "#17458A"), "Staked plot", "A <i>candidate region</i>: zoned, but not built yet."),
        '<h4>Routes <em>Connectivity</em></h4>',
        row(_swatch("lane"), "Express toll lanes", "<i>ExpressRoute</i>. Two interchanges give the campus two separate paths into the city."),
        row(_swatch("rail"), "Transit line and stations", "<i>Private connectivity between regions</i>. Hillcrest and Midtown ride it to Downtown."),
        '<h4>Laws <em>Governance and policy</em></h4>',
        row(_ic("scales"), "City hall", "Laws, codes, and zoning: <i>governance and policy</i>, set once for the whole city."),
        row(_swatch("limits"), "City limits", "Where the laws apply: every neighborhood, Lakeside included."),
        '<h4>City services <em>Shared services</em></h4>',
        '<div class="sv">' + "".join(f'<div>{_ic(k)}{n}</div>' for k, n in services) + '</div>',
        '<div class="svn">Together they are the platform&rsquo;s <i>shared services</i>. Downtown has every one. Riverside has a fire station and a clinic. '
        'Hillcrest and Midtown use Downtown&rsquo;s. Lakeside needs none.</div>',
    ])
    homes = [(1, "Hybrid-connected", "Hillcrest"), (2, "Isolated", "Lakeside"), (3, "Connected", "Midtown"), (4, "Interconnected portfolio", "Riverside")]
    who = ('<div class="who">'
           '<div><h4>Numbered pins <em>Single-region workloads</em></h4>'
                      '<div class="hh">' + "".join(f'<div>{_pin(n)}<span><b>{a}</b>{hood}</span></div>' for n, a, hood in homes) + '</div></div>'
           '<div><h4>Bank <em style="color:var(--b600)">Multi-region workload</em></h4>'
           f'<div class="bk">{_ic("bank")}<p>Branches in <b>Riverside</b> and <b>Midtown</b> serve customers together. '
           'A backup operations center in <b>Hillcrest</b> stands by.</p></div></div>'
           '</div>')
    return f'<style>{PDF_CSS}</style><div class="cty"><div><div class="cty-map">{build(pdf=True)}</div>{who}</div><div class="cty-lg">{legend_col}</div></div>'


def _render(svg, path, w, h, scale, clip_y=0):
    fonts = os.path.abspath(os.path.join(HERE, "..", "whitepaper", "fonts"))
    css = "".join(f'@font-face{{font-family:"Pub Sans";src:url("file://{fonts}/open-sans-latin-{wt}-normal.woff2");font-weight:{wt}}}' for wt in (300, 400, 500, 600, 700))
    hp = os.path.join(OUT, "_render.html")
    open(hp, "w", encoding="utf-8").write(f'<html><head><meta charset="utf-8"><style>{css} body{{margin:0}}</style></head><body>{svg}</body></html>')
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=scale)
        pg.goto("file://" + hp)
        pg.wait_for_timeout(400)
        pg.screenshot(path=path, clip={"x": 0, "y": 0, "width": w, "height": h})
        b.close()
    os.remove(hp)


def main():
    """Writes the full infographic (art/out) and the website pieces (site/figures, site/media)."""
    os.makedirs(OUT, exist_ok=True)
    root = os.path.abspath(os.path.join(HERE, ".."))
    # full infographic: slides, PDF, download
    svg = build()
    open(os.path.join(OUT, "city-analogy.svg"), "w", encoding="utf-8").write(svg)
    _render(svg, os.path.join(OUT, "city-analogy.png"), W, H, 2)
    # website: city-only live figure + the full infographic as the figure's download
    web = build(web=True)
    os.makedirs(os.path.join(root, "site", "media"), exist_ok=True)
    open(os.path.join(root, "site", "figures", "city-analogy.html"), "w", encoding="utf-8").write(
        "<!-- generated by art/city_analogy.py; website-only figure (not part of the CAF article set) -->\n"
        f'<div class="wpf" data-w="{WEB_W}" data-h="{WEB_H}" style="width:{WEB_W}px">{web}</div>\n')
    _render(svg, os.path.join(root, "site", "media", "city-analogy.png"), W, H, 1.5)
    print("wrote art/out/city-analogy.{svg,png}, site/figures/city-analogy.html, site/media/city-analogy.png")


if __name__ == "__main__":
    main()
