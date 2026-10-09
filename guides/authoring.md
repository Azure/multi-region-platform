# Authoring and maintaining the guidance

The Markdown in `content/` is the primary article text. It uses Microsoft Learn syntax so the same files drive the website now and can be prepared for a future Cloud Adoption Framework (CAF) submission. CAF publication is not yet implied by this repository.

See [Building and publishing](building.md) for prerequisites and commands, [Azure data collection](azure-data.md) for reference snapshots, and [Region planning workbook](region-planner.md) for the website-only tool.

## Repository organization

| Deliverable | Source of truth | Output |
|---|---|---|
| Website | `content/*.md`, `content/toc.yml`, and `site/` templates/assets | `docs/` |
| Future CAF article set | `content/*.md`, `content/toc.yml`, and `content/media/` | `dist/caf/` after export |
| Whitepaper PDF and HTML | `whitepaper/pages/*.html` | `dist/Adaptable-Multi-Region-Azure-Platform.pdf` and `.html` |
| Executive brief PDF and HTML | `whitepaper/exec/pages/*.html` | `dist/Adaptable-Multi-Region-Azure-Platform-Executive-Brief.pdf` and `.html` |
| PowerPoint decks | `decks/full/`, `decks/exec/` | `dist/*.pptx` |
| Word edition | `content/` through `word/build.py` | `dist/*.docx` |
| Region planning workbook | `site/planner/`, `site/assets/planner*.js`, regional seed | `docs/region-planner.html` and `docs/data/` |

`art/` contains diagram generators and prototypes. `backup/` retains retired material, not current guidance. `build.sh` rebuilds the deliverables; generated `dist/` files are git-ignored. Don't edit generated `docs/` pages by hand.

## Make a content change

1. Edit `content/<article>.md`. For a new article, add it to `content/toc.yml` and update the preceding article's `## Next step` link.
2. Mirror the change on the matching whitepaper page using the mapping below. Update `whitepaper/exec/pages/` when the executive story is affected.
3. Update matching slides in `decks/full/f*.js` and, for executive-level changes, `decks/exec/e.js`.
4. Edit shared diagrams in `whitepaper/pages/`. `./build.sh site` extracts live website figures into `site/figures/` and CAF PNGs into `content/media/`. Deck diagrams are drawn separately; mirror structural changes there.
5. Rebuild the affected formats, inspect changed pages, and run `./build.sh check`. It lists Markdown sentences not carried verbatim in the whitepaper (intentional condensation is expected) and checks for retired terms. Add renamed terms to `RETIRED` in `site/tools/drift.py`.
6. Update `ms.date` in each changed article's front matter. Mirror check/profile/default-placement wording in `site/assets/planner-data.js`.

The Word edition is generated from Markdown and should not be edited manually. PDF and deck layouts intentionally condense prose and require manual updates. The whitepaper's numbered parts correspond to the website's five steps; "Service behavior across regions" is Appendix A.

## Whitepaper page-to-article mapping

| Whitepaper pages | Articles |
|---|---|
| `02b` summary (intro, assumptions, how it works), `03` intro figure | `index.md` |
| `02b` approach at a glance, `03` intro prose, `03b` drivers, `04` constructs, `05` journey, `21` conclusion | `framework-overview.md` |
| `06`-`07` platform vs. workload, `07b` city analogy | `platform-and-workload.md` |
| `08`, `08b`, `08c` profiles | `connectivity-profiles.md`; profile considerations and reassessment in `profile-selection.md` |
| `09` archetypes, `09b` matrix, `09c` terminology | `application-landing-zone-archetypes.md` |
| `10` four checks, `10b` outcome, `10c` qualification tree | `regional-qualification.md` |
| `11` checks 1-2, `12`/`12b` check 3, `13`/`13b` check 4 | `business-and-geography.md`, `data-and-compliance.md`, `workload-requirements.md`, `regional-capability.md` |
| `14` part 3 opener, `14b` requirements and design record | `platform-architecture.md` |
| `15` profile principles/cost, `15b` profile tree and decision | `profile-selection.md` |
| `16` shared-service placement | `platform-enablement-connectivity.md` |
| `16b` hybrid connectivity | `hybrid-connectivity.md` |
| `17` part 4 opener, `17a` order of work and readiness | `prepare-region.md` |
| `17b` Disconnected Spokes | `disconnected-spokes.md` |
| `17c`-`17d` Remote Hub Connected | `remote-hub-connected.md` (`17d` includes an extra connection figure) |
| `17e`-`17f` Minimal Regional Hub | `minimal-regional-hub.md` |
| `17g`-`17h` Full Regional Hub | `full-regional-hub.md` (`17h` includes hub design options) |
| `17i` readiness | `platform-readiness.md` |
| `18`-`18b` placement | `workload-placement.md` |
| `19`-`19b` scenarios, `20` misconceptions, `20b` getting started | Resources articles |
| `22a0`-`22a5` appendix | `workload-design.md` and its three children |
| `23`/`23b` references | Article reference-link sections; part 4 profiles carry links inline and in the Guidance column |

The removed operating-model material remains in `backup/operating-model.md` and `backup/whitepaper-25-operating-model.html`, not on the website or in the PDF.

The home page is a short landing page; longer explanations live in `framework-overview.md` and `platform-and-workload.md`. The whitepaper sometimes retains fuller text: `02b` carries all six approach-at-a-glance cards, while the overview article folds three into construct descriptions. Don't shorten a whitepaper page solely because its article is shorter. Profile considerations also appear on `08b`/`08c`; hub design options appear on the Full Regional Hub pages.

Figure IDs and extraction names live in `site/tools/extract_figures.py` (`FIGS`) and `site/figures/manifest.json`.

## Markdown conventions

The website generator (`site/build.py`) renders these Learn constructs:

| Syntax | Website rendering |
|---|---|
| `:::image type="content" source="./media/x.png" alt-text="...":::` followed by an italic paragraph | Live scalable figure with caption, zoom, and PNG download; PNG fallback if no extracted figure exists |
| `:::row:::` / `:::column:::` | Card grid |
| `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]` | Alert boxes |
| `> [!div class="nextstepaction"]` | Next-step button |
| `**Question:**`, `**Decision:**`, `**Takeaway:**` | Styled callouts |
| `**Fits when:**`, `**Regional footprint:**`, `**Key considerations:**`, `**Reassess when:**` | Profile attribute rows |
| `[text](other-article.md#anchor)` | Link rewritten to `.html` |
| `<!-- site-only:start -->` / `<!-- site-only:end -->` | Website-only content removed by the CAF exporter |

External Learn links use `https://learn.microsoft.com/azure/...` without a locale.

### Website-only figures

Wrap website-only content, such as the city analogy, in the site-only comment markers. Its images belong in `site/media/`, not `content/media/`; live figures can live in `site/figures/<name>.html`.

`art/city_analogy.py` requires Playwright and writes the full infographic to `art/out/`, the website figure to `site/figures/city-analogy.html`, and its downloadable image to `site/media/city-analogy.png`. Rerun it after picture changes, then run `./build.sh site`.

`whitepaper/pages/07b-city.html` and `whitepaper/exec/pages/08b-city.html` both call `city.pdf_figure()` during PDF assembly. That function draws the labeled city and icon legend; edit its legend text there. No separate diagram run is needed for those PDF pages.

## Prepare a future CAF submission

When CAF placement is approved:

1. Run `python3 site/tools/export_caf.py`. It writes `dist/caf/` with website-only content removed. Copy the Markdown and `media/` into the approved CAF scenario folder under Key adoption scenarios, and merge its `toc.yml` into the CAF navigation.
2. Add required front-matter metadata (`author`, `ms.author`, `ms.service`/`ms.subservice`) using the destination repository's conventions, and update `ms.date`.
3. Convert links within the CAF documentation set to the relative Markdown paths used there. Other Azure documentation links can remain site-relative or absolute Learn URLs as permitted by that repository.
4. Run the destination Learn build, style, and link validation. Review sentence-case headings and "multi-region" terminology.
5. After CAF publishes, decide whether to redirect this website or retain it as a download hub.

Until then, the website is the publishing channel and offers the two PDFs as downloads. Decks and the Word edition remain local build outputs.
