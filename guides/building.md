# Building and publishing

Run commands from the repository root unless noted otherwise. See [Authoring](authoring.md) for source-of-truth rules and [Azure data collection](azure-data.md) for snapshot refreshes.

## Prerequisites

| Tool | Version | Used for |
|---|---|---|
| Python | 3.10 or later | all generators and checks |
| Playwright with Chromium | Playwright 1.42 or later | PDFs, figures, art, browser QA |
| Node.js | 18 or later | PowerPoint decks (and the optional `sharp` package for deck icons) |
| PowerPoint on Windows, or LibreOffice + `pdftoppm` | optional | rendered deck previews: `decks/qa.py --render` |

`build.sh` is a Bash script: on Windows use Git Bash or WSL, with the dependencies installed in that environment. The direct Python commands below can also run in PowerShell (`python` instead of `python3`, and backslashes for local paths).

```bash
pip install -r requirements.txt
python3 -m playwright install chromium
(cd decks && npm install)
```

Install the deck dependencies only if you need PowerPoint outputs.

## Build targets

```bash
./build.sh          # pdf, site (including shared figures), decks, check
./build.sh site     # figures + website + browser QA
./build.sh pdf      # whitepaper + executive brief PDFs
./build.sh decks    # both PowerPoint decks, each checked by decks/qa.py
./build.sh check    # navigation coverage, content drift, summary titles, tokens, built PDFs and decks
./build.sh art      # regenerate the art; not part of the default build
./build.sh clean    # delete build outputs
./build.sh data     # prices + latency; not part of the default build
./build.sh latency  # latency only
```

Every target stops at the first failing step and exits with a non-zero status. `check` is the exception: it runs every check and then fails if any of them failed.

| Output | Location |
|---|---|
| Website | `docs/` |
| Whitepaper PDF | `dist/Adaptable-Multi-Region-Azure-Platform.pdf` |
| Executive brief PDF | `dist/Adaptable-Multi-Region-Azure-Platform-Executive-Brief.pdf` |
| Full and executive PowerPoint decks | `temp/Adaptable-Multi-Region-Azure-Platform-Full.pptx` and `-Executive.pptx` |
| CAF-ready articles | `dist/caf/` after `python3 site/tools/export_caf.py` |

`dist/` is git-ignored. The site target copies existing PDFs from `dist/` into `docs/downloads/`; it does not generate them. Run `./build.sh pdf` before `./build.sh site` when PDF content changes. PowerPoint decks stay local and are not published as website downloads. PDF and PPTX are the supported document formats. Word generation and Pandoc are retired; `word/` is historical source, excluded from builds and checks.

`./build.sh clean` removes the PDF, HTML, PPTX, and DOCX files in `dist/`, the two generated decks in `temp/`, `whitepaper/out`, `whitepaper/out-exec`, the two assembled HTML files in `whitepaper/`, and `decks/out`. Other files in `dist/` and `temp/` are left alone.

## Generate PDFs directly

The page-accurate HTML/CSS sources live in [whitepaper/](../whitepaper/README.md). From that directory:

```bash
python3 build.py full
python3 render.py --pdf
python3 build.py exec
python3 render.py --pdf --exec
```

The renderer writes `whitepaper/out/whitepaper.pdf`, `whitepaper/out-exec/executive.pdf`, and per-page PNG previews. Rendering is strict: it exits with status 1 when content overflows a page or a layout warning is raised, so `./build.sh pdf` stops there. Add `--no-strict` to `render.py` to look at a draft. The PDFs are tagged and carry bookmarks. The root `./build.sh pdf` target regenerates maintained scenario and Key Vault pages, then copies the PDFs to `dist/`. Assembled HTML remains an internal rendering source; standalone HTML and Word files are not distribution outputs.

The edition date, website and planner links, planner name, and service-guides title come from `shared/summary.json` (`{{EDITION}}`, `{{SITE_URL}}`, `{{WORKBOOK_URL}}`, `{{PLANNER_NAME}}`, and `{{SERVICE_GUIDES}}`). See [Shared data](authoring.md#shared-data). The full PDF follows `content/toc.yml`, using the article-to-page mapping in `whitepaper/build.py`; missing articles, missing pages, duplicate mappings, and unassigned pages fail assembly.

## Build the decks

```bash
./build.sh decks                          # build both decks in temp/, run the QA
(cd decks && node build_full.js)          # temp/Adaptable-Multi-Region-Azure-Platform-Full.pptx
(cd decks && node build_exec.js)          # temp/Adaptable-Multi-Region-Azure-Platform-Executive.pptx
(cd decks && DECK_ONLY=30-part3 node build_full.js)   # one module only, for a quick look while editing
python3 decks/qa.py full                  # check a built deck: full or exec
python3 decks/qa.py exec --render         # render slides to decks/out/preview/ (PowerPoint on Windows, or LibreOffice + pdftoppm)
```

The full deck is assembled from the modules `decks/full/NN-*.js`, run in file-name order. `DECK_ONLY` takes one or more module name prefixes, separated by commas. The executive deck is built from `decks/exec/`.

The default build extracts website/CAF diagrams before generating the decks, so PowerPoint embeds the current shared Key Vault and private DNS images. After editing shared diagrams, run `./build.sh site` before a standalone `./build.sh decks`.

On Windows without LibreOffice, the renderer uses installed PowerPoint through `render_windows.ps1`, exports slides without saving changes to the deck, and closes only the presentation it opened. An already-running PowerPoint application is left running.

`decks/qa.py` fails (exit 1) when a slide has missing or duplicate titles, a title lacks explicit position or left alignment or does not bind to its layout's title slot, a slide uses the wrong layout (DEFAULT for cover and closing, CONTENT elsewhere), a picture has no alt text or has a file path as alt text, any text is under 9 pt, or `site/tools/drift.py --terms` reports a `RETIRED` or `MISSING` term. It also reports the share of small text per slide. Both direct Node builds and `./build.sh decks` always create PPTX files in the repository's git-ignored `temp/` folder, separate from PDFs in `dist/`. QA reads them from `temp/`; slide previews remain in `decks/out/preview/`.

## Check the formats against each other

`./build.sh check` runs these in order and then reports a failure if any of them failed:

| Check | What it tests |
|---|---|
| `drift.py whitepaper` | Markdown sentences missing from the whitepaper pages and not in the baseline; retired and required terms; summary titles |
| `drift.py exec --terms` | retired and required terms in the executive pages |
| `drift.py summary` | the titles in `shared/summary.json` against the Markdown |
| `check_tokens.py` | color tokens in `shared/summary.json`, `whitepaper/styles.css`, and `decks/lib.js` |
| `test_publication.py` | complete PDF page mapping, website reading order, separate service guides and Resources, deck sections, and no Word generation |
| `test_archetypes.py` | canonical archetype ordering, conditional profile applicability, qualification-status column alignment, planner options, and generated deck content |
| `test_planner_profiles.py` | canonical hub names, profile decisions, saved-plan migration, and geographic-hub terminology |
| `drift.py` on built `.pdf` files in `dist/` and `.pptx` files in `temp/` | retired and required terms, including the current planner and service-guides names |

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

Article text, figures, tables, cards, and callouts share a responsive maximum width of 900 CSS pixels, controlled by `--article-w` in `site/assets/site.css`. The Multi-region planner retains its custom wider layout. These website styles do not control the PDF or PowerPoint layouts.

The shared page template includes a shield-shaped Privacy and project information link beside the theme toggle in the header on every generated page, including the Multi-region planner. The website-only page is authored in `site/privacy.html` and registered in `SITE_PAGES` in `site/build.py`; it covers Microsoft Clarity, support, contributing, and trademarks, and is not part of the guidance table of contents or document exports. The homepage also includes a short Clarity disclosure linking to this page. Disclosure wording does not implement consent controls or establish regulatory compliance.

The site is desktop-first but remains usable below 960 px: pages use one column, the table of contents moves behind a menu, wide tables scroll, and figures shrink with an expand option.
