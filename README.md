# Adaptable multi-region Azure platform

Source for the multi-region platform guidance and every format it ships in:

| Deliverable | Source of truth | Built output |
|---|---|---|
| Website (GitHub Pages) | `content/*.md` + `content/toc.yml` | `docs/` |
| CAF article set (future) | `content/*.md` + `content/toc.yml` + `content/media/` | submitted as-is to the CAF repo |
| Whitepaper PDF (45 pages) + single-file HTML | `whitepaper/pages/*.html` | `dist/Adaptable-Multi-Region-Azure-Platform.pdf` / `.html` |
| Executive brief PDF (13 pages) + HTML | `whitepaper/exec/pages/*.html` | `dist/…-Executive-Brief.pdf` / `.html` |
| Full deck (42 slides) | `decks/full/f1.js` – `f5.js` | `dist/…-Full.pptx` |
| Executive deck (13 slides) | `decks/exec/e.js` | `dist/…-Executive.pptx` |

The Markdown in `content/` is written in Microsoft Learn syntax, so the same files drive the website now and the Cloud Adoption Framework (CAF) later. Diagrams are drawn once, in the whitepaper, and extracted for the other formats.

```
content/            Learn-flavored Markdown, toc.yml, media/*.png (CAF-ready)
whitepaper/         page-accurate HTML/CSS → PDF (full edition and exec brief)
decks/              pptxgenjs sources for both decks
site/               website generator, template, CSS/JS, figure extractor, QA
docs/               generated website (GitHub Pages serves this folder)
dist/               generated PDFs, HTML, and PPTX (git-ignored)
build.sh            rebuilds everything
```

## Build

Prerequisites: Python 3.10+, Node 18+, and Chromium for Playwright.

```bash
pip install -r requirements.txt && python3 -m playwright install chromium
(cd decks && npm install)

./build.sh          # everything: PDFs + HTML, decks, figures, website, QA
./build.sh site     # website only (use after Markdown-only edits)
./build.sh pdf      # whitepaper + executive brief
./build.sh decks    # both PowerPoint decks
```

`./build.sh site` finishes with `site/tools/qa.py`. It checks every page for broken links and anchors, horizontal overflow, and console errors. It should print `no problems`. For a visual review, run `python3 site/tools/qa.py --shots` (add `--dark` or `--width 1280`); screenshots land in `site/tools/shots/`.

`render.py` lists any content that overflows a PDF page. An empty `[]` means clean.

## Publish the website

1. Push this repository to GitHub.
2. Go to **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, then select `main` and `/docs`.
3. The site is served at `https://<account>.github.io/<repo>/`. `docs/.nojekyll` is already in place, and all links are relative, so a custom domain or a subpath works without changes.

The site is desktop-first. Below 960 px wide it shows a download panel (both PDFs and both decks) instead of the article layout. The downloads come from `docs/downloads/`, which `./build.sh` refreshes.

> Visibility: the pages carry the Microsoft logo and a Microsoft copyright footer. Publish to a public repository only when that is approved. Otherwise use a private repository with Pages restricted to your organization (GitHub Enterprise), or remove the branding in `site/templates/page.html`.

## Making a content change

The Markdown is the primary text. The PDF and decks are designed layouts, so their changes are made by hand. Use this checklist so the formats don't drift:

1. **Markdown**: edit `content/<article>.md`. For a new article, also add it to `content/toc.yml` and update the `## Next step` link of the article before it.
2. **Whitepaper**: make the same change on the matching page in `whitepaper/pages/` (see the mapping below). If it affects the executive story, update `whitepaper/exec/pages/` too.
3. **Decks**: update the matching slide in `decks/full/f*.js` and, if it's exec-level, `decks/exec/e.js`.
4. **Diagrams**: edit them only in `whitepaper/pages/`. `./build.sh site` re-extracts them into live website figures (`site/figures/`) and CAF PNGs (`content/media/`). The deck diagrams are drawn separately in `decks/`, so mirror any structural change there.
5. Run `./build.sh`, check `no problems` and `[]`, and spot-check the changed pages.
6. Bump `ms.date` in the front matter of every Markdown article you changed.

Whitepaper page → article mapping:

| Whitepaper pages | Article(s) |
|---|---|
| `02b` summary, `03` intro, `03b` drivers, `04` constructs, `05` journey, `06`–`07` platform vs. workload, `26` conclusion | `index.md` |
| `08` framework, `08b` outcome, `09` dimensions 1–2, `10`/`10b` dimension 3, `11`/`11b` dimension 4, `12`–`13` dimension 5 | `regional-qualification.md`, the five dimension articles, `assessment-outcome.md` |
| `15` qualification tree, `22` profile tree | `decision-trees.md` |
| `16` archetypes, `17` matrix, `18`–`20b` profiles, `21` principles, `13b` readiness | `platform-architecture.md` and its four children |
| `25` operating model | `operating-model.md` |
| `23`–`24` placement | `workload-placement.md` |
| `26a1`–`26a5` appendix | `workload-design.md` and its three children |
| `25b`–`25c` scenarios, `25d` misconceptions, `25e` getting started | Resources articles |
| `27`/`27b` references | "Reference links" sections across the articles |

Figure IDs and the names they're extracted under are listed in `site/tools/extract_figures.py` (`FIGS`) and `site/figures/manifest.json`.

## Markdown conventions (Learn syntax)

The website generator (`site/build.py`) renders these Learn constructs, so the files need no changes for CAF:

| Syntax | Website rendering |
|---|---|
| `:::image type="content" source="./media/x.png" alt-text="…":::` followed by an *italic paragraph* | Live, scalable HTML figure (zoom + PNG download) with the paragraph as its caption. Falls back to the PNG if no extracted figure exists. |
| `:::row:::` / `:::column:::` | Card grid |
| `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]` | Alert boxes |
| `> [!div class="nextstepaction"]` | Next-step button |
| `**Question:**`, `**Decision:**`, `**Takeaway:**` paragraphs | Styled callouts |
| `**Choose when:**`, `**Regional footprint:**`, `**Key considerations:**`, `**Reassess when:**` | Profile attribute rows |
| `[text](other-article.md#anchor)` | Rewritten to `.html` |

External links use `https://learn.microsoft.com/azure/...` without a locale, as Learn requires.

## Moving to the Cloud Adoption Framework

When the CAF placement is approved:

1. Copy `content/*.md` and `content/media/` into the scenario folder of the CAF repository (under *Key adoption scenarios*), and merge `content/toc.yml` into the CAF `toc.yml` as a new node.
2. Add the required metadata to each article's front matter: `author`, `ms.author`, `ms.service`/`ms.subservice` (per CAF conventions), and update `ms.date`.
3. Convert links that point into the CAF docs set (`https://learn.microsoft.com/azure/cloud-adoption-framework/...`) to the repo-relative `.md` paths the CAF repo uses. Links to other Azure docs can stay as site-relative or absolute Learn URLs, per the repo's contributor guide.
4. Run the Learn build validation (acrolinx and link checks) and fix any style flags. Common ones: sentence-case headings and "multi-region" vs. "multiregion".
5. After CAF publishes, point the website to it: replace the site with a redirect page, or keep it as the download hub for the PDF and decks.

Until then the website is the go-to-market channel, and the PDF and decks are its downloads.
