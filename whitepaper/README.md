# The Adaptable Multi-Region Azure Platform — editable source

Page-accurate HTML/CSS source for the whitepaper PDF (US Letter landscape, 57 pages; the executive brief is 14 pages from `exec/pages`).

- `pages/NN-*.html` — one file per page; edit text and diagrams here.
- `styles.css` — design tokens (colors, type scale, components).
- `layout.js` — running heads, folios, contents page numbers, and diagram connectors
  (declared in pages as `<i class="ln" data-from=".." data-to="..">`).
- `gen/scenarios.py` — data and generator for the customer-scenario pages (edit scenarios there, then run it).
- `build.py` — assembles `whitepaper.html` from the page files. A page can call `{{PY:art.…}}` for the vector artwork and `{{PY:city.pdf_figure()}}` for the city analogy with its icon legend (`../art/city_analogy.py`).
- `render.py --pdf` — renders `out/whitepaper.pdf` (vector) and PNG previews with Playwright/Chromium,
  and reports any content overflowing a page.
- `art.py` — generates the vector cover, contents, and back-cover artwork (and the Microsoft logo mark; swap in the official brand asset if required).
- `fonts/` — Open Sans (SIL OFL), used as an openly licensed stand-in for Segoe UI.
- `assets/` — the five original figures from the source Word document, for reference.

Rebuild: `python3 build.py && python3 render.py --pdf`
