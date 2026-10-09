# Building and publishing

Run commands from the repository root unless noted otherwise. See [Authoring](authoring.md) for source-of-truth rules and [Azure data collection](azure-data.md) for snapshot refreshes.

## Prerequisites

Use Python 3.10 or later, Node.js 18 or later for decks, and Playwright's Chromium browser for PDFs, figures, and browser QA. The Word edition also requires Pandoc 3.x.

`build.sh` is a Bash script: on Windows use Git Bash or WSL, with the dependencies installed in that environment. The direct Python commands below can also run in PowerShell (`python` instead of `python3`, and backslashes for local paths).

```bash
pip install -r requirements.txt
python3 -m playwright install chromium
(cd decks && npm install)
```

Install the deck dependencies only if you need PowerPoint outputs.

## Build targets

```bash
./build.sh          # PDFs + HTML, decks, figures, website, Word, QA, drift checks
./build.sh site     # figures + website + browser QA
./build.sh pdf      # whitepaper + executive brief PDFs and single-file HTML
./build.sh decks    # both PowerPoint decks
./build.sh word     # Word edition from Markdown (requires Pandoc)
./build.sh check    # drift check against the other formats
./build.sh data     # prices + latency; not part of the default build
./build.sh latency  # latency only
```

| Output | Location |
|---|---|
| Website | `docs/` |
| Whitepaper PDF and single-file HTML | `dist/Adaptable-Multi-Region-Azure-Platform.pdf` and `.html` |
| Executive brief PDF and single-file HTML | `dist/Adaptable-Multi-Region-Azure-Platform-Executive-Brief.pdf` and `.html` |
| Full and executive PowerPoint decks | `dist/Adaptable-Multi-Region-Azure-Platform-Full.pptx` and `-Executive.pptx` |
| Word edition | `dist/Adaptable-Multi-Region-Azure-Platform.docx` |
| CAF-ready articles | `dist/caf/` after `python3 site/tools/export_caf.py` |

`dist/` is git-ignored. The site target copies existing PDFs from `dist/` into `docs/downloads/`; it does not generate them. Run `./build.sh pdf` before `./build.sh site` when PDF content changes. Decks and Word documents stay local and are not published as website downloads.

## Generate PDFs directly

The page-accurate HTML/CSS sources live in [whitepaper/](../whitepaper/README.md). From that directory:

```bash
python3 build.py full
python3 render.py --pdf
python3 build.py exec
python3 render.py --pdf --exec
```

The renderer writes `whitepaper/out/whitepaper.pdf`, `whitepaper/out-exec/executive.pdf`, and per-page PNG previews. It reports page overflow; an empty `[]` means no detected issues. The root `./build.sh pdf` target also copies the PDFs to `dist/` and produces self-contained HTML with `whitepaper/inline.py`.

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

Screenshots land in `site/tools/shots/`. Use `./build.sh check` for cross-format text and retired-term checks; review intentional condensation rather than assuming every text difference is a defect.

## Publish with GitHub Pages

1. Rebuild the affected outputs and include the generated `docs/` changes in your pull request.
2. In **Settings > Pages > Build and deployment**, choose **Deploy from a branch**, then `main` and `/docs`.
3. The repository site is served at `https://azure.github.io/multi-region-platform/`.

`docs/.nojekyll` is already present. Website links are relative, allowing a custom domain or subpath. Site builds preserve existing `docs/data/` snapshots and `docs/downloads/`; publish refreshed snapshots and PDFs explicitly when those inputs change.

The site is desktop-first but remains usable below 960 px: pages use one column, the table of contents moves behind a menu, wide tables scroll, and figures shrink with an expand option.
