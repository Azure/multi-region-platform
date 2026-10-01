#!/usr/bin/env python3
"""Render whitepaper.html to PDF + per-page PNG previews, and report overflow."""
import os, sys, json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out")
only = [int(a) for a in sys.argv[1:] if a.isdigit()]
pdf = "--pdf" in sys.argv
exe = "--exec" in sys.argv
SRC = "executive.html" if exe else "whitepaper.html"
OUT = os.path.join(ROOT, "out-exec" if exe else "out")
PDFNAME = "executive.pdf" if exe else "whitepaper.pdf"

CHECK = r"""
() => {
  const res = [];
  document.querySelectorAll('.page').forEach((pg, i) => {
    pg.scrollIntoView();
    if (pg.classList.contains('nofolio')) return;
    const pr = pg.getBoundingClientRect();
    const issues = [];
    pg.querySelectorAll('*').forEach(el => {
      if (el.closest('.runhead,.folio,.bleed,svg,defs') ) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.bottom > pr.bottom - 38 || r.right > pr.right - 40 || r.left < pr.left + 40) {
        issues.push((el.className||el.tagName).toString().slice(0,40) + ' b=' + Math.round(r.bottom-pr.top) + ' r=' + Math.round(r.right-pr.left));
      }
      if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow === 'hidden' && !el.classList.contains('page')) {
        issues.push('CLIP ' + (el.className||el.tagName).toString().slice(0,40));
      }
    });
    // text escaping its own box (diagram nodes, cards) or covered by a later sibling
    pg.querySelectorAll('.node, .col, .rg, .rg2, .ac, .pc, .dc, .s, .x, .oc, .q, .p, .card, .ly, .fd, .ad').forEach(box => {
      if (box.closest('svg')) return;
      const br = box.getBoundingClientRect(); if (!br.height) return;
      box.querySelectorAll('*').forEach(ch => {
        if (ch.closest('svg')) return;
        const cr = ch.getBoundingClientRect(); if (!cr.height || !cr.width) return;
        if (cr.bottom > br.bottom + 0.5 || cr.right > br.right + 0.5) issues.push('SPILL ' + (box.id || box.className).toString().slice(0,30) + ' <' + (ch.textContent||'').trim().slice(0,30) + '>');
      });
    });
    // text hidden under positioned elements: sample text rects against elementFromPoint
    const walker = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT);
    let n; while ((n = walker.nextNode())) {
      if (!n.textContent.trim() || n.parentElement.closest('svg,.runhead,.folio')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) {
        if (r.width < 4) continue;
        const pts = [[r.left + 2, r.top + r.height/2], [r.right - 2, r.top + r.height/2]];
        for (const [x, y] of pts) {
          const e = document.elementFromPoint(x, y);
          if (e && e !== n.parentElement && !n.parentElement.contains(e) && !e.contains(n.parentElement) && !(e.closest && e.closest('svg.conn-layer'))) {
            issues.push('COVERED <' + n.textContent.trim().slice(0,30) + '> by ' + (e.className||e.tagName).toString().slice(0,30)); break;
          }
        }
      }
    }
    if (issues.length) res.push({page: i+1, issues: [...new Set(issues)].slice(0,10)});
  });
  return res;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1100, "height": 900}, device_scale_factor=1.6)
    pg.emulate_media(media="print")
    pg.goto("file://" + os.path.join(ROOT, SRC))
    pg.wait_for_selector("body[data-ready='1']", timeout=20000)
    pg.wait_for_timeout(300)
    for m in pg.evaluate("() => window.__warn || []"):
        print(m)
    print(json.dumps(pg.evaluate(CHECK), indent=1))
    pages = pg.query_selector_all(".page")
    print("pages:", len(pages))
    os.makedirs(OUT + "/png", exist_ok=True)
    for i, el in enumerate(pages, 1):
        if only and i not in only:
            continue
        el.screenshot(path=f"{OUT}/png/p{i:02d}.png")
    if pdf:
        os.makedirs(OUT, exist_ok=True)
        pg.pdf(path=f"{OUT}/{PDFNAME}", width="11in", height="8.5in", print_background=True,
               prefer_css_page_size=True, margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
        print("pdf written")
    b.close()
