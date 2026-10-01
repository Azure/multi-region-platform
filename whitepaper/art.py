"""Procedural vector artwork for the cover, contents, and back cover.

An isometric 'estate' of translucent regional platforms standing on one shared
foundation slab: two tall strategic hubs, a minimal hub, spokes, isolated spokes,
and an empty candidate footprint — the paper's model rendered as an object.
"""
import math

C30 = math.cos(math.radians(30))


def P(x, y, z, s, ox, oy):
    return (ox + (x - y) * C30 * s, oy + (x + y) * 0.5 * s - z * s)


def poly(pts, fill, extra=""):
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return f'<polygon points="{d}" fill="{fill}" {extra}/>'


def prism(x0, y0, x1, y1, z0, z1, s, ox, oy, top, left, right, op=0.92, edge=0.55, dash=None):
    p = lambda x, y, z: P(x, y, z, s, ox, oy)
    st = f'stroke="#FFFFFF" stroke-opacity="{edge}" stroke-width="1" stroke-linejoin="round"'
    if dash:
        st += f' stroke-dasharray="{dash}"'
    out = []
    # front-left face (y = y1)
    out.append(poly([p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)], left, f'fill-opacity="{op}" {st}'))
    # front-right face (x = x1)
    out.append(poly([p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1)], right, f'fill-opacity="{op}" {st}'))
    # top
    out.append(poly([p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)], top, f'fill-opacity="{op}" {st}'))
    return "\n".join(out)


def defs(uid):
    return f"""
<defs>
  <linearGradient id="{uid}bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0B2E57"/>
    <stop offset=".45" stop-color="#0F6CBD"/>
    <stop offset=".78" stop-color="#1AA5D6"/>
    <stop offset="1" stop-color="#2BC7C9"/>
  </linearGradient>
  <radialGradient id="{uid}g1" cx=".15" cy=".18" r=".55"><stop offset="0" stop-color="#8661C5" stop-opacity=".85"/><stop offset="1" stop-color="#8661C5" stop-opacity="0"/></radialGradient>
  <radialGradient id="{uid}g2" cx=".92" cy=".95" r=".5"><stop offset="0" stop-color="#FFB38A" stop-opacity=".75"/><stop offset=".5" stop-color="#FF8FB1" stop-opacity=".25"/><stop offset="1" stop-color="#FF8FB1" stop-opacity="0"/></radialGradient>
  <radialGradient id="{uid}g3" cx=".78" cy=".22" r=".45"><stop offset="0" stop-color="#50E6FF" stop-opacity=".55"/><stop offset="1" stop-color="#50E6FF" stop-opacity="0"/></radialGradient>
  <radialGradient id="{uid}g4" cx=".2" cy=".85" r=".5"><stop offset="0" stop-color="#0B2E57" stop-opacity=".7"/><stop offset="1" stop-color="#0B2E57" stop-opacity="0"/></radialGradient>
  <linearGradient id="{uid}hubT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#BFE3FF" stop-opacity=".85"/></linearGradient>
  <linearGradient id="{uid}hubL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B88D8"/><stop offset="1" stop-color="#0F548C"/></linearGradient>
  <linearGradient id="{uid}hubR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F6CBD"/><stop offset="1" stop-color="#0B3A63"/></linearGradient>
  <linearGradient id="{uid}minT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6F7FF"/><stop offset="1" stop-color="#9FE6F7"/></linearGradient>
  <linearGradient id="{uid}minL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#50E6FF"/><stop offset="1" stop-color="#1A8FC4"/></linearGradient>
  <linearGradient id="{uid}minR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1AA5D6"/><stop offset="1" stop-color="#0F6CBD"/></linearGradient>
  <linearGradient id="{uid}tlT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6FAF6"/><stop offset="1" stop-color="#9FE3DA"/></linearGradient>
  <linearGradient id="{uid}tlL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2BC7B4"/><stop offset="1" stop-color="#04807A"/></linearGradient>
  <linearGradient id="{uid}tlR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04807A"/><stop offset="1" stop-color="#03615F"/></linearGradient>
  <linearGradient id="{uid}fdT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".08"/></linearGradient>
  <linearGradient id="{uid}fdL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#123E6B"/><stop offset="1" stop-color="#0A2442"/></linearGradient>
  <linearGradient id="{uid}fdR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B2E57"/><stop offset="1" stop-color="#071A31"/></linearGradient>
  <radialGradient id="{uid}glow"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="#FFFFFF" stop-opacity=".6"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  <linearGradient id="{uid}swoosh" x1="0" x2="1"><stop offset="0" stop-color="#FFB38A" stop-opacity="0"/><stop offset=".35" stop-color="#FFB38A"/><stop offset=".7" stop-color="#FF8FB1"/><stop offset="1" stop-color="#8661C5" stop-opacity="0"/></linearGradient>
</defs>"""


def background(uid, x, y, w, h):
    r = f'x="{x}" y="{y}" width="{w}" height="{h}"'
    return (f'<rect {r} fill="url(#{uid}bg)"/><rect {r} fill="url(#{uid}g1)"/><rect {r} fill="url(#{uid}g3)"/>'
            f'<rect {r} fill="url(#{uid}g2)"/><rect {r} fill="url(#{uid}g4)"/>')


def estate(uid, ox, oy, s):
    """Isometric estate. Returns SVG markup."""
    o = []
    p = lambda x, y, z: P(x, y, z, s, ox, oy)
    # foundation slab
    o.append(prism(0, 0, 9, 6, -0.55, 0, s, ox, oy, f"url(#{uid}fdT)", f"url(#{uid}fdL)", f"url(#{uid}fdR)", op=1, edge=.45))
    # grid on slab top
    g = []
    for i in range(1, 9):
        a, b = p(i, 0, 0), p(i, 6, 0)
        g.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')
    for j in range(1, 6):
        a, b = p(0, j, 0), p(9, j, 0)
        g.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')
    o.append('<g stroke="#FFFFFF" stroke-opacity=".10" stroke-width=".8">' + "".join(g) + "</g>")

    T = 2.2
    tiles = [  # (x0, y0, height, kind) — drawn back to front
        (0.5, 0.5, 1.75, "hub"),
        (3.4, 0.5, 1.75, "hub"),
        (0.5, 3.3, 1.05, "min"),
        (6.3, 0.5, 0.55, "tl"),
        (3.4, 3.3, 0.3, "tl2"),
        (6.3, 3.3, 0.0, "cand"),
    ]
    tops = {}
    for x0, y0, h, k in tiles:
        x1, y1 = x0 + T, y0 + T
        if k == "cand":
            pts = [p(x0, y0, 0.02), p(x1, y0, 0.02), p(x1, y1, 0.02), p(x0, y1, 0.02)]
            o.append(poly(pts, "#FFFFFF", 'fill-opacity=".08" stroke="#FFFFFF" stroke-opacity=".85" stroke-width="1.4" stroke-dasharray="5 4"'))
        elif k == "hub":
            o.append(prism(x0, y0, x1, y1, 0, h, s, ox, oy, f"url(#{uid}hubT)", f"url(#{uid}hubL)", f"url(#{uid}hubR)", op=.94))
        elif k == "min":
            o.append(prism(x0, y0, x1, y1, 0, h, s, ox, oy, f"url(#{uid}minT)", f"url(#{uid}minL)", f"url(#{uid}minR)", op=.9))
        else:
            o.append(prism(x0, y0, x1, y1, 0, h, s, ox, oy, f"url(#{uid}tlT)", f"url(#{uid}tlL)", f"url(#{uid}tlR)", op=.88 if k == "tl" else .7))
        tops[(x0, y0)] = p(x0 + T / 2, y0 + T / 2, h)
        # workload cubes on spokes / hubs
        if k in ("tl", "tl2", "min"):
            cubes = [(0.35, 0.35), (1.25, 0.35), (0.35, 1.25)] if k != "tl2" else [(0.35, 0.35), (1.25, 1.25)]
            for cx0, cy0 in cubes:
                o.append(prism(x0 + cx0, y0 + cy0, x0 + cx0 + 0.6, y0 + cy0 + 0.6, h, h + 0.45, s, ox, oy,
                               "#E6FAF6", "#04807A", "#03615F", op=.95, edge=.6))

    # connections between region tops (drawn above tiles)
    def arc(a, b, lift, dash=None, w=1.6, op=.95):
        mx, my = (a[0] + b[0]) / 2, min(a[1], b[1]) - lift
        da = f' stroke-dasharray="{dash}"' if dash else ""
        return f'<path d="M{a[0]:.1f},{a[1]:.1f} Q{mx:.1f},{my:.1f} {b[0]:.1f},{b[1]:.1f}" fill="none" stroke="#FFFFFF" stroke-opacity="{op}" stroke-width="{w}"{da}/>'
    A, B, Cm, D, E, F = (tops[(0.5, 0.5)], tops[(3.4, 0.5)], tops[(0.5, 3.3)], tops[(6.3, 0.5)], tops[(3.4, 3.3)], tops[(6.3, 3.3)])
    o.append(arc(A, B, s * 1.1, w=2))
    o.append(arc(A, Cm, s * 0.9, dash="4 4"))
    o.append(arc(B, D, s * 0.9, w=1.5))
    # hub nodes
    for c, r in ((A, 1.0), (B, 1.0), (Cm, .7)):
        o.append(f'<ellipse cx="{c[0]:.1f}" cy="{c[1]:.1f}" rx="{s * r:.1f}" ry="{s * r * .5:.1f}" fill="url(#{uid}glow)" opacity=".9"/>')
        o.append(f'<ellipse cx="{c[0]:.1f}" cy="{c[1]:.1f}" rx="{s * .32 * r:.1f}" ry="{s * .16 * r:.1f}" fill="#0F6CBD" stroke="#FFFFFF" stroke-width="1.6"/>')
    return "\n".join(o)


def discs(uid, cx, cy, n=5, r0=60, step=34):
    """Concentric translucent rounded squares (Fluent geometry)."""
    o = []
    for i in range(n, 0, -1):
        r = r0 + step * i
        o.append(f'<rect x="{cx - r}" y="{cy - r}" width="{2 * r}" height="{2 * r}" rx="{r * .32:.0f}" fill="#FFFFFF" fill-opacity="{.05 + .025 * (n - i)}" stroke="#FFFFFF" stroke-opacity=".28"/>')
    return "\n".join(o)


def ms_logo(x, y, sq=10, gap=1.6, word=True, word_color="#737373", size=17):
    """Microsoft four-square logo mark with wordmark set in the document typeface.
    Replace with the official brand asset for final publication if required."""
    c = ["#F25022", "#7FBA00", "#00A4EF", "#FFB900"]
    o = [f'<rect x="{x}" y="{y}" width="{sq}" height="{sq}" fill="{c[0]}"/>',
         f'<rect x="{x + sq + gap}" y="{y}" width="{sq}" height="{sq}" fill="{c[1]}"/>',
         f'<rect x="{x}" y="{y + sq + gap}" width="{sq}" height="{sq}" fill="{c[2]}"/>',
         f'<rect x="{x + sq + gap}" y="{y + sq + gap}" width="{sq}" height="{sq}" fill="{c[3]}"/>']
    if word:
        tx = x + 2 * sq + gap + sq * 0.8
        o.append(f'<text x="{tx:.1f}" y="{y + 2 * sq + gap - 2.6:.1f}" font-family="Pub Sans, Segoe UI, sans-serif" font-size="{size}" font-weight="600" fill="{word_color}" letter-spacing="-.2">Microsoft</text>')
    return "".join(o)
