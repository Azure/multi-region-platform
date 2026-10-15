# Building and publishing

Run commands from the repository root unless noted otherwise. See [Authoring](authoring.md) for source-of-truth rules and [Azure data collection](azure-data.md) for snapshot refreshes.

## Prerequisites

| Tool | Version | Used for |
|---|---|---|
| Python | 3.10 or later | all generators and checks |
| Playwright with Chromium | Playwright 1.42 or later | PDFs, figures, art, the Word brief figures, browser QA |
| Pandoc | 3.x | Word editions |
| Node.js | 18 or later | PowerPoint decks (and the optional `sharp` package for deck icons) |
| LibreOffice (`soffice`) | optional | previews only: `decks/qa.py --render` |

`build.sh` is a Bash script: on Windows use Git Bash or WSL, with the dependencies installed in that environment. The direct Python commands below can also run in PowerShell (`python` instead of `python3`, and backslashes for local paths).

```bash
pip install -r requirements.txt
python3 -m playwright install chromium
(cd decks && npm install)
```

Install the deck dependencies only if you need PowerPoint outputs.

## Build targets

```bash
./build.sh          # pdf, decks, site, word, check
./build.sh site     # figures + website + browser QA
./build.sh pdf      # whitepaper + executive brief PDFs and single-file HTML
./build.sh decks    # both PowerPoint decks, each checked by decks/qa.py
./build.sh word     # both Word editions (requires Pandoc)
./build.sh check    # drift check, summary titles, color tokens, built decks and Word files
./build.sh art      # regenerate the art; not part of the default build
./build.sh clean    # delete build outputs
./build.sh data     # prices + latency; not part of the default build
./build.sh latency  # latency only
```

Every target stops at the first failing step and exits with a non-zero status. `check` is the exception: it runs every check and then fails if any of them failed.

| Output | Location |
|---|---|
| Website | `docs/` |
| Whitepaper PDF and single-file HTML | `dist/Adaptable-Multi-Region-Azure-Platform.pdf` and `.html` |
| Executive brief PDF and single-file HTML | `dist/Adaptable-Multi-Region-Azure-Platform-Executive-Brief.pdf` and `.html` |
| Full and executive PowerPoint decks | `dist/Adaptable-Multi-Region-Azure-Platform-Full.pptx` and `-Executive.pptx` |
| Word editions (full guidance and executive brief) | `dist/Adaptable-Multi-Region-Azure-Platform.docx` and `-Executive-Brief.docx` |
| CAF-ready articles | `dist/caf/` after `python3 site/tools/export_caf.py` |

`dist/` is git-ignored. The site target copies existing PDFs from `dist/` into `docs/downloads/`; it does not generate them. Run `./build.sh pdf` before `./build.sh site` when PDF content changes. Decks and Word documents stay local and are not published as website downloads.

`./build.sh clean` removes the PDF, HTML, PPTX, and DOCX files in `dist/`, `whitepaper/out`, `whitepaper/out-exec`, the two assembled HTML files in `whitepaper/`, and `decks/out`. Other files in `dist/` are left alone.

## Generate PDFs directly

The page-accurate HTML/CSS sources live in [whitepaper/](../whitepaper/README.md). From that directory:

```bash
python3 build.py full
python3 render.py --pdf
python3 build.py exec
python3 render.py --pdf --exec
```

The renderer writes `whitepaper/out/whitepaper.pdf`, `whitepaper/out-exec/executive.pdf`, and per-page PNG previews. Rendering is strict: it exits with status 1 when content overflows a page or a layout warning is raised, so `./build.sh pdf` stops there. Add `--no-strict` to `render.py` to look at a page that still overflows. The PDFs are tagged and carry bookmarks. The root `./build.sh pdf` target also copies the PDFs to `dist/` and produces self-contained HTML with `whitepaper/inline.py`.

The edition date and the links to the website and the region planning workbook come from `shared/summary.json` (`{{EDITION}}` and `{{SITE_URL}}` in the page files). See [Shared data](authoring.md#shared-data).

## Build the decks

```bash
./build.sh decks                          # build both decks, run the QA, copy them to dist/
(cd decks && node build_full.js)          # decks/out/Adaptable-Multi-Region-Azure-Platform-Full.pptx
(cd decks && node build_exec.js)          # decks/out/Adaptable-Multi-Region-Azure-Platform-Executive.pptx
(cd decks && DECK_ONLY=30-part3 node build_full.js)   # one module only, for a quick look while editing
python3 decks/qa.py full                  # check a built deck: full or exec
python3 decks/qa.py exec --render         # also render the slides to decks/out/preview/ (needs LibreOffice and pdftoppm)
```

The full deck is assembled from the modules `decks/full/NN-*.js`, run in file-name order. `DECK_ONLY` takes one or more module name prefixes, separated by commas. The executive deck is built from `decks/exec/`.

`decks/qa.py` fails (exit 1) when a slide has missing or duplicate titles, a title lacks explicit position or left alignment or does not bind to its layout's title slot, a slide uses the wrong layout (DEFAULT for cover and closing, CONTENT elsewhere), a picture has no alt text or has a file path as alt text, any text is under 9 pt, or `site/tools/drift.py --terms` reports a `RETIRED` or `MISSING` term. It also reports the share of small text per slide. `./build.sh decks` copies the decks to `dist/` only when both pass.

## Build the Word editions

```bash
./build.sh word
python3 word/build.py full [out.docx]     # full guidance, generated from content/
python3 word/build.py brief [out.docx]    # executive brief, generated from word/brief.md
```

Both editions have portrait body pages with 9 pt Aptos text and finish with the matching PDF's landscape closing splash. The cover artwork has a rectangular, full-bleed edge. Contents and every major chapter start on separate pages; the brief's contents uses the same top-level entry style as the full edition.

Pictures preserve and lock their aspect ratios. The city map uses 50% of its original size and its separate legend 45%; all other landscape pictures use 34%, while portrait or square pictures use 45%. Percentages take priority over filling the print width. The brief's scenario columns are 1.63, 1.25, 1.31, 1.13, and 1.82 inches; its side margins accommodate their 7.14-inch total. Data-table headers stay with their first row, but longer tables can flow between intact rows. The builder checks chapter breaks, final-row keep chains, and links before and after the Office save.

Both files contain live PAGE and PAGEREF fields with refresh-on-open enabled. On Windows the build uses Microsoft Word to repaginate, update the contents and footer fields, and save their cached values before delivery. Other environments require a Word-compatible reader to refresh the fields on opening.

The brief is built from `word/brief.md` and the figures in `word/brief_figures.py`; both editions need Playwright for artwork and the closing splash. The archetype cards are a picture in the brief, its qualification picture is the full guidance figure, and the strategic-benefit picture precedes its comparison table. Without a file name the editions are written to `dist/Adaptable-Multi-Region-Azure-Platform.docx` and `dist/Adaptable-Multi-Region-Azure-Platform-Executive-Brief.docx`. Both editions are generated; don't edit the `.docx` files by hand.

## Check the formats against each other

`./build.sh check` runs these in order and then reports a failure if any of them failed:

| Check | What it tests |
|---|---|
| `drift.py whitepaper` | Markdown sentences missing from the whitepaper pages and not in the baseline; retired and required terms; summary titles |
| `drift.py exec --terms` | retired and required terms in the executive pages |
| `drift.py brief` | `word/brief.md` against the executive pages (skipped when the file is absent) |
| `drift.py summary` | the titles in `shared/summary.json` against the Markdown |
| `check_tokens.py` | color tokens in `shared/summary.json`, `whitepaper/styles.css`, `decks/lib.js`, and `word/build.py` |
| `drift.py` on each built `.docx` and `.pptx` in `dist/` | retired and required terms; the full Word edition is also compared sentence by sentence, for information only |

Files that are not built are skipped with a message. [Authoring](authoring.md#cross-format-checks) explains each line the checks print and how to fix it.

## Preview and check the website

Serve `docs/` over HTTP; opening the planner as a local file prevents its snapshot loading.

```bash
python3 -m http.server 8000 --directory docs
```

Open `http://localhost:8000/`. Stop the server when finished.

`./build.sh site` finishes with `site/tools/qa.py`, which checks links and anchors, horizontal overflow, and console errors. It should print `no problems`. For screenshots:

```bash
python3 site/tools/qa.py --shots
python3 site/tools/qa.py --shots --dark --width 1280
```

Screenshots land in `site/tools/shots/`. Use `./build.sh check` for the cross-format text, retired-term, and token checks.

## Publish with GitHub Pages

1. Rebuild the affected outputs and include the generated `docs/` changes in your pull request.
2. In **Settings > Pages > Build and deployment**, choose **Deploy from a branch**, then `main` and `/docs`.
3. The repository site is served at `https://azure.github.io/multi-region-platform/`.

`docs/.nojekyll` is already present. Website links are relative, allowing a custom domain or subpath. Site builds preserve existing `docs/data/` snapshots and `docs/downloads/`; publish refreshed snapshots and PDFs explicitly when those inputs change.

Article text, figures, tables, cards, and callouts share a responsive maximum width of 900 CSS pixels, controlled by `--article-w` in `site/assets/site.css`. The planning workbook retains its custom wider layout. These website styles do not control the generated PDF, Word, or PowerPoint layouts.

The shared page template includes a shield-shaped Privacy and project information link beside the theme toggle in the header on every generated page, including the planning workbook. The website-only page is authored in `site/privacy.html` and registered in `SITE_PAGES` in `site/build.py`; it covers Microsoft Clarity, support, contributing, and trademarks, and is not part of the guidance table of contents or document exports. The homepage also includes a short Clarity disclosure linking to this page. Disclosure wording does not implement consent controls or establish regulatory compliance.

The site is desktop-first but remains usable below 960 px: pages use one column, the table of contents moves behind a menu, wide tables scroll, and figures shrink with an expand option.
