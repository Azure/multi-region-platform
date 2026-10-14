#!/usr/bin/env python3
"""Export the CAF-ready article set to dist/caf/.

Copies content/*.md, toc.yml and media/, removing every website-only block:
    <!-- site-only:start --> ... <!-- site-only:end -->
Website-only images live in site/media/ and are never copied.
    python3 site/tools/export_caf.py
"""
import os, re, shutil, glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC, DST = os.path.join(ROOT, "content"), os.path.join(ROOT, "dist", "caf")
BLOCK = re.compile(r"^[ \t]*<!--\s*site-only:start\s*-->.*?<!--\s*site-only:end\s*-->[ \t]*\n?\n?", re.S | re.M)

shutil.rmtree(DST, ignore_errors=True)
os.makedirs(DST)
removed = 0
for p in sorted(glob.glob(os.path.join(SRC, "*.md"))):
    s = open(p, encoding="utf-8").read()
    out, n = BLOCK.subn("", s)
    assert "site-only" not in out, f"unbalanced site-only markers in {os.path.basename(p)}"
    removed += n
    open(os.path.join(DST, os.path.basename(p)), "w", encoding="utf-8").write(out)
shutil.copy(os.path.join(SRC, "toc.yml"), DST)
shutil.copytree(os.path.join(SRC, "media"), os.path.join(DST, "media"))
print(f"exported {len(glob.glob(os.path.join(DST, '*.md')))} articles to dist/caf ({removed} website-only block(s) removed)")
