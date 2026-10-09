#!/usr/bin/env python3
"""Render the deck artwork from whitepaper/art.py.

    python3 decks/render_art.py            # both tone sets
    python3 decks/render_art.py blue       # only decks/img/      (full deck)
    python3 decks/render_art.py teal       # only decks/img/teal/ (executive deck)

Each set holds the four pictures the slide code loads through IMG(name, tone):
    cover_panel.png   transparent panel on the cover        (6.6 x 7.5 in)
    bg_full.jpg       full-bleed closing / back background  (13.33 x 7.5 in)
    band.jpg          wide band behind the closing quote    (12.3 x 1.5 in)
    panel_tall.jpg    tall panel beside the agenda          (4.2 x 6.2 in)
Everything is drawn at 2.5 device pixels per CSS pixel. Needs Python 3 with playwright (Chromium installed).
The city picture (decks/img/city-analogy.png) is written by art/city_analogy.py, not by this script.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "whitepaper"))
import art  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

SCALE = 2.5
SETS = {"blue": os.path.join(HERE, "img"), "teal": os.path.join(HERE, "img", "teal")}


def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>'


def jobs(tone):
    """file name -> (width, height, svg body)"""
    d = lambda uid: art.defs(uid, tone)
    out = {}
    # cover panel 6.6 x 7.5 in -> 634 x 720 px, with the curved left edge cut out
    W, H = 634, 720
    out["cover_panel.png"] = (W, H, d("a") + f'<defs><clipPath id="c"><path d="M60,0 H{W} V{H} H0 C0,{H} 0,110 60,0 Z"/></clipPath></defs><g clip-path="url(#c)">'
                              + art.background("a", 0, 0, W, H) + art.discs("a", 575, 60, n=4, r0=30, step=38) + art.estate("a", 262, 338, 33)
                              + f'<path d="M-20,640 C160,580 340,660 {W + 20},560" fill="none" stroke="url(#aswoosh)" stroke-width="2.4"/></g>')
    # full-bleed background 1280 x 720
    out["bg_full.jpg"] = (1280, 720, d("b") + art.background("b", 0, 0, 1280, 720) + art.discs("b", 1040, 330, n=5, r0=24, step=42)
                          + '<g transform="translate(1040,330)"><circle r="26" fill="#fff"/><circle r="10" fill="#0F6CBD"/></g>'
                          + '<path d="M-10,560 C300,500 640,620 1290,470" fill="none" stroke="url(#bswoosh)" stroke-width="2.4"/>')
    # band for quotes 12.3 x 1.5 in -> 1180 x 144 px
    out["band.jpg"] = (1180, 144, d("q") + art.background("q", 0, 0, 1180, 144)
                       + '<path d="M700,136 C850,80 1000,150 1200,50" fill="none" stroke="url(#qswoosh)" stroke-width="2"/>')
    # tall panel for the agenda 4.2 x 6.2 in -> 403 x 595 px
    out["panel_tall.jpg"] = (403, 595, d("t") + art.background("t", 0, 0, 403, 595) + art.discs("t", 200, 210, n=5, r0=18, step=28)
                             + '<g transform="translate(200,210)"><circle r="22" fill="#fff"/><circle r="9" fill="#0F6CBD"/></g>'
                             + '<path d="M-20,420 C100,380 260,460 420,390" fill="none" stroke="url(#tswoosh)" stroke-width="2.2"/>')
    return out


def main(tones):
    with sync_playwright() as p:
        b = p.chromium.launch()
        for tone in tones:
            folder = SETS[tone]
            os.makedirs(folder, exist_ok=True)
            for name, (w, h, body) in jobs(tone).items():
                pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=SCALE)
                pg.set_content(f'<html><body style="margin:0">{svg(w, h, body)}</body></html>')
                target = os.path.join(folder, name)
                clip = {"x": 0, "y": 0, "width": w, "height": h}
                if name.endswith(".png"):
                    pg.screenshot(path=target, type="png", omit_background=True, clip=clip)
                else:
                    pg.screenshot(path=target, type="jpeg", quality=90, clip=clip)
                pg.close()
                print("wrote", os.path.relpath(target, HERE))
        b.close()


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(SETS)
    unknown = [t for t in wanted if t not in SETS]
    if unknown:
        raise SystemExit(f"unknown tone {unknown}; use blue, teal, or no argument\n\n{__doc__}")
    main(wanted)
