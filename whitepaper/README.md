# The Adaptable Multi-Region Azure Platform — editable source

Page-accurate HTML/CSS sources for the full whitepaper and executive brief PDFs (US Letter landscape). Rendering reports the current page count; the executive brief retains 14 pages.

See [Building and publishing](../guides/building.md#generate-pdfs-directly) for prerequisites, both PDF editions, output locations, and publication. See [Authoring](../guides/authoring.md#whitepaper-page-to-article-mapping) for the article-to-page mapping and cross-format updates.

- `pages/NN-*.html` — page sources; edit text and diagrams here. `build.py` maps every article to these files and orders the full edition from `content/toc.yml`. The five steps lead into Service Guides for Multi Region, then Resources. Stable filenames are not the final reading order.
- `styles.css` — design tokens (colors, type scale, components).
- `layout.js` — running heads, folios, contents page numbers, and diagram connectors
  (declared in pages as `<i class="ln" data-from=".." data-to="..">`).
- `gen/scenarios.py` — data and generator for the customer-scenario pages (`pages/19-scenarios-1.html`, `19b-scenarios-2.html`). Edit scenarios there, then run it; it reads the scenarios, checks, and outcomes from `../shared/summary.json`, and running it again must leave `git status whitepaper/pages` empty.
- `figures.json` — maps each figure container id in the pages (for example `fig14`) to the figure name used in the Markdown (`content/media/<name>.png`). `build.py` uses it to give each container `role="img"` and the Markdown alt text as its label; `../site/tools/extract_figures.py` uses it to write `site/figures/` and `content/media/`.
- `gen/keyvault.py` — generates the five Key Vault pages and registers their eight diagrams. Update this generator, not its generated pages, then regenerate the website figures before building the full deck.
- `build.py full|exec` — assembles `whitepaper.html` or `executive.html`. Placeholders `{{EDITION}}`, `{{SITE_URL}}`, `{{WORKBOOK_URL}}`, `{{PLANNER_NAME}}`, and `{{SERVICE_GUIDES}}` come from `../shared/summary.json`. A page can call `{{PY:art.…}}` for artwork and `{{PY:city.pdf_figure()}}` for the city analogy (`../art/city_analogy.py`).
- `render.py --pdf [--exec]` — renders `out/whitepaper.pdf` (or `out-exec/executive.pdf`; vector, tagged, with bookmarks) and PNG previews with Playwright/Chromium. It is strict: it prints content that overflows a page and layout warnings from `layout.js` (a connector, `data-toc`, or `data-figref` target that does not exist), and exits 1 when either list is not empty. Add `--no-strict` to look at a draft.
- `art.py` — generates the vector cover, contents, and back-cover artwork (and the Microsoft logo mark; swap in the official brand asset if required).
- `fonts/` — Open Sans (SIL OFL), used as an openly licensed stand-in for Segoe UI.
- `assets/` — the five original figures from the source Word document, for reference.

Type and color rules: no text under 8 px in figures, running HTML text at 9 px or more, and 4.5:1 contrast for small text. Mark text that sits on SVG artwork with `data-on-art`, and icon glyph text with `aria-hidden="true"`.

Rebuild: `python3 build.py full && python3 render.py --pdf`, then `python3 build.py exec && python3 render.py --pdf --exec`. After changing a figure, run `python3 ../site/tools/extract_figures.py` to refresh the website and Markdown copies.
