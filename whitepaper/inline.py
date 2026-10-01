#!/usr/bin/env python3
"""Make a single self-contained HTML file (fonts, CSS, JS inlined)."""
import base64, os, re, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
html = open(os.path.join(ROOT, src), encoding="utf-8").read()
css = open(os.path.join(ROOT, "styles.css"), encoding="utf-8").read()
def font(m):
    p = os.path.join(ROOT, m.group(1))
    return 'url("data:font/woff2;base64,' + base64.b64encode(open(p, "rb").read()).decode() + '")'
css = re.sub(r'url\("(fonts/[^"]+)"\)', font, css)
def asset(m):
    p = os.path.join(ROOT, m.group(1)); ext = p.rsplit(".", 1)[-1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "svg": "image/svg+xml", "webp": "image/webp"}[ext]
    return 'data:' + mime + ';base64,' + base64.b64encode(open(p, "rb").read()).decode()
html = re.sub(r'(assets/[^"\')\s]+)', asset, html)
html = html.replace('<link rel="stylesheet" href="styles.css">', "<style>\n" + css + "\n</style>")
js = open(os.path.join(ROOT, "layout.js"), encoding="utf-8").read()
html = html.replace('<script src="layout.js"></script>', "<script>\n" + js + "\n</script>")
open(dst, "w", encoding="utf-8").write(html)
print("wrote", dst, round(len(html) / 1e6, 2), "MB")
