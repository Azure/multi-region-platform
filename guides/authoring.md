# Authoring and maintaining the guidance

The Markdown in `content/` is the primary article text. It uses Microsoft Learn syntax so the same files drive the website now and can be prepared for a future Cloud Adoption Framework (CAF) submission. CAF publication is not yet implied by this repository.

See [Building and publishing](building.md) for prerequisites and commands, [Azure data collection](azure-data.md) for reference snapshots, and [Multi-region planner](region-planner.md) for the website-only tool.

## Repository organization

| Deliverable | Source of truth | Output |
|---|---|---|
| Website | `content/*.md`, `content/toc.yml`, and `site/` templates/assets | `docs/` |
| Future CAF article set | `content/*.md`, `content/toc.yml`, and `content/media/` | `dist/caf/` after export |
| Whitepaper PDF and HTML | `whitepaper/pages/*.html` | `dist/Adaptable-Multi-Region-Azure-Platform.pdf` and `.html` |
| Executive brief PDF and HTML | `whitepaper/exec/pages/*.html` | `dist/Adaptable-Multi-Region-Azure-Platform-Executive-Brief.pdf` and `.html` |
| PowerPoint decks | `decks/full/NN-*.js` with `decks/full/sections.js`, and `decks/exec/` | `dist/*.pptx` |
| Word edition, full guidance | `content/` through `word/build.py full` | `dist/Adaptable-Multi-Region-Azure-Platform.docx` |
| Word edition, executive brief | `word/brief.md` and `word/brief_figures.py` through `word/build.py brief` | `dist/Adaptable-Multi-Region-Azure-Platform-Executive-Brief.docx` |
| Short lists, edition date, URLs, color tokens | `shared/summary.json` | read by the PDF, deck, and Word builds |
| Multi-region planner | `site/planner/`, `site/assets/planner*.js`, regional seed | `docs/region-planner.html` and `docs/data/` |

`art/` contains the art generators (see [Art generators](#art-generators)) and prototypes. `backup/` retains retired material, not current guidance. `build.sh` rebuilds the deliverables; generated `dist/` files are git-ignored. Don't edit generated `docs/` pages by hand.

## Make a content change

1. Edit `content/<article>.md`. For a new article, add it to `content/toc.yml` and update the preceding article's `## Next step` link.
2. Mirror the change on the matching whitepaper page using the mapping below. Update `whitepaper/exec/pages/` when the executive story is affected, and mirror that change in `word/brief.md`.
3. Update the matching slides. The full deck is a set of modules in `decks/full/`, one per section (`NN-*.js`, run in file-name order); `decks/full/sections.js` lists the sections and generates the eyebrows, footer labels, PowerPoint sections, and agenda slide. Executive-level changes go in `decks/exec/`.
4. If the change renames a part, check, outcome, choice, profile, archetype, scenario, misconception, or getting-started step, or changes the edition date or a URL, edit `shared/summary.json` (see [Shared data](#shared-data)).
5. Edit shared diagrams in `whitepaper/pages/`. `./build.sh site` extracts live website figures into `site/figures/` and CAF PNGs into `content/media/`. Deck diagrams are drawn separately; mirror structural changes there.
6. Rebuild the affected formats, inspect changed pages and slides, and run `./build.sh check`. It fails on retired or missing names, on summary titles that are not in the Markdown, and on Markdown sentences that are missing from the whitepaper and not in the baseline. Retired names go into `RETIRED` in `site/tools/drift.py`, so no format can bring them back. See [Cross-format checks](#cross-format-checks).
7. Update `ms.date` in each changed article's front matter. Mirror check/profile/default-placement wording in `site/assets/planner-data.js`.

The Word editions are generated and should not be edited manually: the full edition from the Markdown, the executive brief from `word/brief.md`. PDF and deck layouts intentionally condense prose and require manual updates. The whitepaper's numbered parts correspond to the website's five steps; "Service behavior across regions" is Appendix A.

## Shared data

`shared/summary.json` holds the values that several formats show, in the short form that summaries use: `edition`, `siteUrl`, `workbookUrl`, `title`, `legal`, `constructs`, `parts`, `checks`, `outcomes`, `choices`, `profiles`, `archetypes`, `scenarios`, `misconceptions`, `gettingStarted`, and `tokens`. The PDF, deck, and Word builds read it instead of typing these again, so one edit changes every format. Change `edition` to relabel the edition date everywhere.

The Markdown stays the source for prose. The titles in `shared/summary.json` (each scenario `title`, misconception `claim`, getting-started `title`, part and check `name`) must still appear in the matching article; `drift.py summary` checks that. `tokens` is the reference for the color tokens that `site/tools/check_tokens.py` compares across `whitepaper/styles.css`, `decks/lib.js`, and `word/build.py`.

## Cross-format checks

`./build.sh check` runs `site/tools/drift.py` and `site/tools/check_tokens.py`. Each problem prints one line, and any problem makes the check fail.

| Line | Meaning | Fix |
|---|---|---|
| `RETIRED TERM  '<match>'  in <where>` | A name the guidance no longer uses (matched case-insensitively, on text only, not tags or styles) | Replace it with the Markdown wording |
| `MISSING TERM  '<term>'  (<target>)` | A name the target must carry is absent | Add the name where the target introduces it |
| `SUMMARY DRIFT  '<title>'  not in <article>` | A title in `shared/summary.json` is not in the Markdown | Make the two agree |
| `NEW DRIFT  <article>  '<sentence>'` | A Markdown sentence is missing from the target and is not in the baseline | Restore the sentence, or accept the condensation |

`RETIRED` in `drift.py` is the list of retired names. Add a name there when you rename a concept. The executive deck's speaker notes that quote the talk track verbatim ("Talk track: …") may say "lighter-weight" and "lightweight": the patterns do not match those phrases.

The required names are read from `shared/summary.json`:

| Target | Must contain |
|---|---|
| Whitepaper pages, whitepaper PDF or Word file, full deck | the five part names, "four checks", the three choice names, the four outcome names, "selected", "ready for workloads", the four profiles, the four archetypes |
| Executive pages and brief (PDF, Word, `word/brief.md`), executive deck | "four checks", the four profiles, the four archetypes |

Names are compared ignoring case and punctuation, so a figure may say "Remote-hub-connected".

Targets: `whitepaper`, `exec`, `brief`, `summary`, or the path of a built `.pdf`, `.pptx`, or `.docx`. Useful options are `--terms` (names only, for summaries such as the decks), `--article NAME`, and `--reverse` (text in the target that is not in the Markdown, for information).

The whitepaper condenses some Markdown on purpose. `site/tools/drift-baseline.txt` lists those sentences, normalized, under a `# article` line each. After an intentional condensation, run

```bash
python3 site/tools/drift.py whitepaper --update-baseline
```

review the diff of `drift-baseline.txt`, and commit it with the change. The baseline applies to the whitepaper only. The full Word edition is compared sentence by sentence without a baseline, for information; `word/brief.md` has no baseline, so any sentence that is not on the executive pages is reported.

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
| `22a0`-`22a5` appendix | `workload-design.md` and its four children; `22a4a`-`22a4d` cover `private-dns-multi-region.md` after the Key Vault pattern |
| `23`/`23b` references | Article reference-link sections; part 4 profiles carry links inline and in the Guidance column |

The removed operating-model material remains in `backup/operating-model.md` and `backup/whitepaper-25-operating-model.html`, not on the website or in the PDF.

The home page is a short landing page; longer explanations live in `framework-overview.md` and `platform-and-workload.md`. The whitepaper sometimes retains fuller text: `02b` carries all six approach-at-a-glance cards, while the overview article folds three into construct descriptions. Don't shorten a whitepaper page solely because its article is shorter. Profile considerations also appear on `08b`/`08c`; hub design options appear on the Full Regional Hub pages.

Figure IDs and extraction names live in `site/tools/extract_figures.py` (`FIGS`) and `site/figures/manifest.json`.

The private DNS article uses `content/media/private-dns-global-zone.png` and `private-dns-regional-zones.png`, imported from the supplied HTML diagrams. The website and full Word edition discover the article through `content/toc.yml`; the Word converter preserves the service table's HTML line break as a native Word break. The full PDF/HTML build discovers its `22a4a`-`22a4d` page files in filename order; the single-file HTML exporter embeds the shared `../content/media/` images. The full deck's `90-appendix.js` calls `private-dns.js` between the Key Vault pattern and Resiliency scenarios. These sources do not change the executive editions. To publish website-only changes without rebuilding or copying distribution files, run `python3 site/build.py`.

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

`whitepaper/pages/07b-city.html` and `whitepaper/exec/pages/08b-city.html` both call `city.pdf_figure()` during PDF assembly. That function draws the labeled city and icon legend; edit its legend text there. No separate diagram run is needed for those PDF pages.

### Art generators

`./build.sh art` runs the three Python generators below. They need Playwright.

| Command | Writes |
|---|---|
| `python3 art/city_analogy.py` | `art/out/` (full infographic), `site/figures/city-analogy.html`, `site/media/city-analogy.png`, `decks/img/city-analogy.png` |
| `python3 art/common_drivers.py` | `art/common-drivers.svg` and `.png`, `site/figures/common-drivers.html`, `content/media/common-drivers.png` |
| `python3 render_art.py` (run in `decks/`) | deck backgrounds: the blue set in `decks/img/`, the teal set in `decks/img/teal/` |
| `node icons.js` (run in `decks/`) | icon PNGs for the decks from `decks/icons.json`; needs the optional `sharp` package and is not part of `./build.sh art` |

Rerun the generator after picture or wording changes, then rebuild what uses the output: `./build.sh site` for the website, `./build.sh pdf`, and `./build.sh decks`.

## Prepare a future CAF submission

When CAF placement is approved:

1. Run `python3 site/tools/export_caf.py`. It writes `dist/caf/` with website-only content removed. Copy the Markdown and `media/` into the approved CAF scenario folder under Key adoption scenarios, and merge its `toc.yml` into the CAF navigation.
2. Add required front-matter metadata (`author`, `ms.author`, `ms.service`/`ms.subservice`) using the destination repository's conventions, and update `ms.date`.
3. Convert links within the CAF documentation set to the relative Markdown paths used there. Other Azure documentation links can remain site-relative or absolute Learn URLs as permitted by that repository.
4. Run the destination Learn build, style, and link validation. Review sentence-case headings and "multi-region" terminology.
5. After CAF publishes, decide whether to redirect this website or retain it as a download hub.

Until then, the website is the publishing channel and offers the two PDFs as downloads. Decks and the Word editions remain local build outputs.
