#!/usr/bin/env python3
"""QA the built site: console errors, broken internal links/anchors, horizontal overflow, screenshots.
    python3 site/tools/qa.py [--shots] [--width 1440] [page.html ...]
"""
import os, sys, re, json, threading, http.server, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DOCS = os.path.join(ROOT, "docs")
SHOTS = os.path.join(ROOT, "site", "tools", "shots")
args = sys.argv[1:]
shots = "--shots" in args
width = int(args[args.index("--width") + 1]) if "--width" in args else 1440
only = [a for a in args if a.endswith(".html")]
theme = "dark" if "--dark" in args else None

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DOCS)
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
Handler = functools.partial(H, directory=DOCS)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8765), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()

pages = sorted(f for f in os.listdir(DOCS) if f.endswith(".html") and f != "404.html")
if only:
    pages = [p for p in pages if p in only]
os.makedirs(SHOTS, exist_ok=True)
problems = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": width, "height": 900}, device_scale_factor=1)
    if theme:
        ctx.add_init_script(f"localStorage.setItem('mrp-theme','{theme}')")
    for name in pages:
        pg = ctx.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"http://127.0.0.1:8765/{name}")
        pg.wait_for_load_state("networkidle")
        pg.wait_for_timeout(250)
        info = pg.evaluate("""() => {
          const out = {links: [], overflow: []};
          document.querySelectorAll('main a[href], nav a[href]').forEach(a => {
            const h = a.getAttribute('href');
            if (/^https?:/.test(h) || h.startsWith('mailto:')) return;
            out.links.push(h);
          });
          document.querySelectorAll('main *').forEach(e => {
            if (e.closest('.fig-scale') || e.classList.contains('fig-stage')) return;
            if (innerWidth <= 960 && e.classList.contains('table-wrap')) return;   // tables scroll sideways on small screens
            if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== 'visible') out.overflow.push((e.className || e.tagName) + '');
          });
          const m = document.querySelector('main');
          if (m.scrollWidth > m.clientWidth + 2) out.overflow.push('MAIN');
          out.ids = [...document.querySelectorAll('[id]')].map(e => e.id);
          return out;
        }""")
        for h in info["links"]:
            path, _, frag = h.partition("#")
            target = path or name
            if not os.path.exists(os.path.join(DOCS, target)):
                problems.append(f"{name}: broken link {h}")
            elif frag:
                ids = info["ids"] if target == name else re.findall(r'id="([^"]+)"', open(os.path.join(DOCS, target), encoding="utf-8").read())
                if frag not in ids:
                    problems.append(f"{name}: missing anchor {h}")
        for o in set(info["overflow"]):
            problems.append(f"{name}: overflow {o}")
        for e in errs:
            problems.append(f"{name}: console {e}")
        if shots:
            pg.screenshot(path=os.path.join(SHOTS, name.replace(".html", f"-{width}{'-dark' if theme else ''}.png")), full_page=True)
        pg.close()
    b.close()
srv.shutdown()
print("\n".join(problems) if problems else "no problems")
print(len(pages), "pages checked")
