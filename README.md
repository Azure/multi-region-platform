# Adaptable multi-region Azure platform

> **Live guidance site:** [https://azure.github.io/multi-region-platform/](https://azure.github.io/multi-region-platform/)

Source for the multi-region platform guidance and every format it ships in:

| Deliverable | Source of truth | Built output |
|---|---|---|
| Website (GitHub Pages) | `content/*.md` + `content/toc.yml` | `docs/` |
| CAF article set (future) | `content/*.md` + `content/toc.yml` + `content/media/` | submitted as-is to the CAF repo |
| Whitepaper PDF (47 pages) + single-file HTML | `whitepaper/pages/*.html` | `dist/Adaptable-Multi-Region-Azure-Platform.pdf` / `.html` |
| Executive brief PDF (13 pages) + HTML | `whitepaper/exec/pages/*.html` | `dist/…-Executive-Brief.pdf` / `.html` |

The Markdown in `content/` is written in Microsoft Learn syntax, so the same files drive the website now and the Cloud Adoption Framework (CAF) later. Diagrams are drawn once, in the whitepaper, and extracted for the other formats.

```
content/            Learn-flavored Markdown, toc.yml, media/*.png (CAF-ready)
whitepaper/         page-accurate HTML/CSS → PDF (full edition and exec brief)
decks/              pptxgenjs sources for both decks
word/               generator for the Word edition (built from the Markdown)
site/               website generator, template, CSS/JS, figure extractor, QA
docs/               generated website (GitHub Pages serves this folder)
dist/               generated PDFs, HTML, PPTX, and DOCX (git-ignored)
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
./build.sh word     # Word edition, generated from the Markdown (needs pandoc)
./build.sh check    # drift check: Markdown against the whitepaper, decks, and Word edition
```

`./build.sh site` finishes with `site/tools/qa.py`. It checks every page for broken links and anchors, horizontal overflow, and console errors. It should print `no problems`. For a visual review, run `python3 site/tools/qa.py --shots` (add `--dark` or `--width 1280`); screenshots land in `site/tools/shots/`.

`render.py` lists any content that overflows a PDF page. An empty `[]` means clean.

## Publish the website

1. Push this repository to GitHub.
2. Go to **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, then select `main` and `/docs`.
3. The site is served at `https://<account>.github.io/<repo>/`. `docs/.nojekyll` is already in place, and all links are relative, so a custom domain or a subpath works without changes.

The site is desktop-first. Below 960 px wide it shows a download panel (both PDFs) instead of the article layout. The decks and the Word edition are not published: they stay in `dist/`, which is git-ignored. The downloads come from `docs/downloads/`, which `./build.sh` refreshes.

## Making a content change

The Markdown is the primary text. The Word edition is generated from it, so it always carries the same text. The PDF and decks are designed layouts that condense some prose, so their changes are made by hand. Use this checklist so the formats don't drift:

1. **Markdown**: edit `content/<article>.md`. For a new article, also add it to `content/toc.yml` and update the `## Next step` link of the article before it.
2. **Whitepaper**: make the same change on the matching page in `whitepaper/pages/` (see the mapping below). If it affects the executive story, update `whitepaper/exec/pages/` too.
3. **Decks**: update the matching slide in `decks/full/f*.js` and, if it's exec-level, `decks/exec/e.js`.
4. **Diagrams**: edit them only in `whitepaper/pages/`. `./build.sh site` re-extracts them into live website figures (`site/figures/`) and CAF PNGs (`content/media/`). The deck diagrams are drawn separately in `decks/`, so mirror any structural change there.
5. Run `./build.sh`, check `no problems` and `[]`, and spot-check the changed pages. Then run `./build.sh check`: it lists Markdown sentences that the whitepaper doesn't carry word for word (review new ones; condensed card and figure text is expected) and fails on retired terms in any format. Add a term to `RETIRED` in `site/tools/drift.py` whenever you rename something.
6. Bump `ms.date` in the front matter of every Markdown article you changed.

Whitepaper page → article mapping:

| Whitepaper pages | Article(s) |
|---|---|
| `02b` summary (intro, assumptions table, how it works), `03` intro (figure only) | `index.md` |
| `02b` summary (approach at a glance), `03` intro (prose), `03b` drivers, `04` constructs, `05` journey, `21` conclusion | `framework-overview.md` |
| `06`–`07` platform vs. workload | `platform-and-workload.md` |
| `08`, `08b`, `08c` profiles (each profile also carries its considerations and reassessment triggers) | `connectivity-profiles.md`, and "Considerations and reassessment by profile" in `profile-selection.md` |
| `09` archetypes, `09b` matrix, `09c` terminology table | `application-landing-zone-archetypes.md` |
| `10` four checks, `10b` outcome, `10c` qualification tree | `regional-qualification.md` |
| `11` checks 1–2, `12`/`12b` check 3, `13`/`13b` check 4 | the four check articles |
| `14` part 3 opener (three decisions, the three-decisions figure) | `platform-architecture.md` (intro), `platform-enablement-connectivity.md` ("Three related decisions") |
| `15`, `15b` platform capabilities, hybrid connectivity, regional platform connectivity | `platform-enablement-connectivity.md` |
| `16` selection principles, `16b` profile tree | `platform-architecture.md` |
| `16` coexisting-estate figure, `16c` profiles in practice | `profile-selection.md` |
| `17` readiness | `platform-readiness.md` |
| `18`–`18b` placement | `workload-placement.md` |
| `19`–`19b` scenarios, `20` misconceptions, `20b` getting started | Resources articles |
| `22a0`–`22a5` appendix | `workload-design.md` and its three children |
| `23`/`23b` references | "Reference links" sections across the articles |
| (removed) operating model | Not on the website or in the PDF. Kept in `backup/operating-model.md` and `backup/whitepaper-25-operating-model.html`. |

The home page (`index.md`) is a short landing page: intro, assumptions table, the four parts, and one figure. The longer explanation lives in `framework-overview.md` and `platform-and-workload.md`. Where the website condenses text, the whitepaper keeps the full version: `framework-overview.md` folds three of the six "approach at a glance" cards into the construct descriptions, and page `02b` still carries all six in full. Don't shorten a whitepaper page because its article got shorter.

The whitepaper numbers the four parts of the framework as Part 1 to Part 4, where the articles say step 1 to step 4. Its page order follows the website menu, except that the profile selection principles and decision tree come after the capabilities pages, and "Service behavior across regions" is Appendix A.

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
| `**Fits when:**`, `**Regional footprint:**`, `**Key considerations:**`, `**Reassess when:**` | Profile attribute rows |
| `[text](other-article.md#anchor)` | Rewritten to `.html` |
| `<!-- site-only:start -->` … `<!-- site-only:end -->` | Website-only content. The site renders it; `site/tools/export_caf.py` removes it from the CAF set. |

### Website-only content

Some content suits the website but not CAF, such as the city analogy in `platform-and-workload.md`. Wrap it in `<!-- site-only:start -->` and `<!-- site-only:end -->` comment lines in the Markdown. Website-only images go in `site/media/` (not `content/media/`), and a live figure for one can go in `site/figures/<name>.html`.

The city analogy is generated by `art/city_analogy.py`, which needs Playwright. It writes the full infographic to `art/out/`, the website's city figure to `site/figures/city-analogy.html`, and the downloadable image to `site/media/city-analogy.png`. Rerun it after changing the picture, then run `./build.sh site`.

External links use `https://learn.microsoft.com/azure/...` without a locale, as Learn requires.

## Moving to the Cloud Adoption Framework

When the CAF placement is approved:

1. Run `python3 site/tools/export_caf.py`. It writes the CAF-ready set to `dist/caf/`, with website-only content removed. Copy `dist/caf/*.md` and `dist/caf/media/` into the scenario folder of the CAF repository (under *Key adoption scenarios*), and merge `dist/caf/toc.yml` into the CAF `toc.yml` as a new node.
2. Add the required metadata to each article's front matter: `author`, `ms.author`, `ms.service`/`ms.subservice` (per CAF conventions), and update `ms.date`.
3. Convert links that point into the CAF docs set (`https://learn.microsoft.com/azure/cloud-adoption-framework/...`) to the repo-relative `.md` paths the CAF repo uses. Links to other Azure docs can stay as site-relative or absolute Learn URLs, per the repo's contributor guide.
4. Run the Learn build validation (acrolinx and link checks) and fix any style flags. Common ones: sentence-case headings and "multi-region" vs. "multiregion".
5. After CAF publishes, point the website to it: replace the site with a redirect page, or keep it as the download hub for the PDF and decks.

Until then the website is the go-to-market channel, and the PDF and decks are its downloads.
