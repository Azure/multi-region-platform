# Authoring and maintaining the guidance

The Markdown in `content/` is the primary article text. It uses Microsoft Learn syntax so the same files drive the website now and can be prepared for a future Cloud Adoption Framework (CAF) submission. CAF publication is not yet implied by this repository.

See [Building and publishing](building.md) for prerequisites and commands, [Azure data collection](azure-data.md) for reference snapshots, and [Multi-region planner](region-planner.md) for the website-only tool.

## Repository organization

| Deliverable | Source of truth | Output |
|---|---|---|
| Website | `content/*.md`, `content/toc.yml`, and `site/` templates/assets | `docs/` |
| Future CAF article set | `content/*.md`, `content/toc.yml`, and `content/media/` | `dist/caf/` after export |
| Whitepaper PDF | `whitepaper/pages/*.html` | `dist/Adaptable-Multi-Region-Azure-Platform.pdf` |
| Executive brief PDF | `whitepaper/exec/pages/*.html` | `dist/Adaptable-Multi-Region-Azure-Platform-Executive-Brief.pdf` |
| PowerPoint decks | `decks/full/NN-*.js` with `decks/full/sections.js`, and `decks/exec/` | `temp/*.pptx` (always; separate from PDFs) |
| Short lists, edition date, URLs, navigation names, color tokens | `shared/summary.json` | read by PDF and PowerPoint builds |
| Multi-region planner | `site/planner/`, `site/assets/planner*.js`, regional seed | `docs/region-planner.html` and `docs/data/` |

`art/` contains the art generators (see [Art generators](#art-generators)) and prototypes. `backup/` retains retired material, not current guidance. `build.sh` rebuilds the deliverables; generated `dist/` files are git-ignored. Don't edit generated `docs/` pages by hand.

## Make a content change

1. Edit `content/<article>.md`. For a new article, add it to `content/toc.yml` and update the preceding article's `## Next step` link.
2. Mirror the change on the matching whitepaper page using the mapping below. Update `whitepaper/exec/pages/` when the executive story or its links and navigation are affected. Word is retired; do not generate or maintain Word editions.
3. Update the matching slides. The full deck is a set of modules in `decks/full/`, one per section (`NN-*.js`, run in file-name order); `decks/full/sections.js` lists the sections and generates the eyebrows, footer labels, PowerPoint sections, and agenda slide. Executive-level changes go in `decks/exec/`.
4. If the change renames a part, check, outcome, choice, profile, archetype, scenario, misconception, or getting-started step, or changes the edition date or a URL, edit `shared/summary.json` (see [Shared data](#shared-data)).
5. Edit shared diagrams in `whitepaper/pages/`. `./build.sh site` extracts live website figures into `site/figures/` and CAF PNGs into `content/media/`. Deck diagrams are drawn separately; mirror structural changes there.
6. Rebuild the affected formats, inspect changed pages and slides, and run `./build.sh check`. It fails on retired or missing names, on summary titles that are not in the Markdown, and on Markdown sentences that are missing from the whitepaper and not in the baseline. Retired names go into `RETIRED` in `site/tools/drift.py`, so no format can bring them back. See [Cross-format checks](#cross-format-checks).
7. Update `ms.date` in each changed article's front matter. Mirror check/profile/default-placement wording in `site/assets/planner-data.js`.

PDF and deck layouts intentionally condense prose and require manual updates. The whitepaper's numbered parts correspond to the website's five steps. **Service Guides for Multi Region** follows step 5, with separate Storage, Backup and restore, Key Vault, and Private DNS zones guides. **Resources** follows: Getting started, Customer scenarios, Common misconceptions, Paired and nonpaired regions, and Resiliency scenarios. These are no longer an appendix. The executive editions retain their strategic story but must use current tool names, links, and pointers to the full guidance.

The full PDF's reading order comes from `content/toc.yml` through `ARTICLE_PAGES` in `whitepaper/build.py`, not filename order. Add new article/page mappings there; incomplete or duplicated coverage fails the build. Keep filenames stable for figure generators. The full deck follows the same section order through `decks/full/sections.js` and the numbered modules: `55-service-guides.js`, `60-resources.js`, `65-region-resources.js`, `70-conclusion.js`, and `99-back.js`. `resources.js` provides the individual resource and conclusion slides. Run `python -m unittest discover -s site/tools -p test_publication.py` after navigation changes.

## Shared data

`shared/summary.json` holds the values that several formats show: `edition`, `siteUrl`, `workbookUrl`, `plannerName`, `serviceGuidesTitle`, `title`, `legal`, `constructs`, `parts`, `checks`, `outcomes`, `choices`, `profiles`, `archetypes`, `scenarios`, `misconceptions`, `gettingStarted`, and `tokens`. PDF and PowerPoint builds read these values. Change `edition` to relabel the edition date everywhere. `workbookUrl` remains the stable field name for the Multi-region planner URL.

Keep archetype lists, cards, matrix rows and columns, planner choices, and numbered city examples in this order: **Isolated Cloud-Native or AI Applications**, **Connected Cloud-Native or AI Applications**, **Hybrid-Connected Applications**, **Interconnected Application Portfolios**. This is increasing platform connectivity and dependency complexity, not application sophistication or maturity. When reordering a qualification matrix, move the evidence/status cells with their archetype, not just the headings.

Profile applicability is many-to-many. No Hub is often suitable for isolated applications and is conditional for connected applications and portfolios: approved same-region spoke connectivity or Azure service endpoints must meet all requirements without geographic-hub or on-premises dependencies. Hybrid-connected workloads require Remote Hub, Selective Hub, or Full Hub. Keep these qualifications in cards, matrices, slide notes, and the profile-selection questions. Run `python -m unittest discover -s site/tools -p test_archetypes.py` after changing these surfaces.

The Markdown stays the source for prose. The titles in `shared/summary.json` (each scenario `title`, misconception `claim`, getting-started `title`, part and check `name`) must still appear in the matching article; `drift.py summary` checks that and the service-guides name against `content/toc.yml`. `tokens` is the reference for the color tokens in `whitepaper/styles.css` and `decks/lib.js`.

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
| Whitepaper pages, whitepaper PDF, full deck | five part names, "four checks", three choice names, four outcome names, "selected", "ready for workloads", four profiles, four archetypes, planner name, service-guides name, and current service/resource headings |
| Executive pages and PDF, executive deck | "four checks", four profiles, four archetypes, planner name, and service-guides name |

Names are compared ignoring case and punctuation, so a figure may say "Remote Hub".

Targets: `whitepaper`, `exec`, `summary`, or the path of a built `.pdf` or `.pptx`. Useful options are `--terms` (names only, for summaries such as the decks), `--article NAME`, and `--reverse` (text in the target that is not in the Markdown, for information).

The whitepaper condenses some Markdown on purpose. `site/tools/drift-baseline.txt` lists those sentences, normalized, under a `# article` line each. After an intentional condensation, run

```bash
python3 site/tools/drift.py whitepaper --update-baseline
```

review the diff of `drift-baseline.txt`, and commit it with the change. The baseline applies to the whitepaper only. Review content and navigation before accepting condensation; required names and navigation coverage fail independently of the sentence baseline.

## Whitepaper page-to-article mapping

| Whitepaper pages | Articles |
|---|---|
| `02b` summary (intro, assumptions, how it works), `03` intro figure | `index.md` |
| `02b` approach at a glance, `03` intro prose, `03b` drivers, `04` constructs, `05` journey, `21` conclusion | `framework-overview.md` |
| `06`-`07` platform vs. workload, `07b` city analogy | `platform-and-workload.md` |
| `08`, `08b`, `08c` profiles | `connectivity-profiles.md`; profile considerations and reassessment in `profile-selection.md` |
| `09` archetypes, `09b` matrix, `09c` terminology | `application-landing-zone-archetypes.md` |
| `10` four checks, `10b` outcome, `10c` qualification tree | `regional-qualification.md` |
| `11` checks 1-2, `12`/`12b` check 3, `13`/`13b` check 4, `13c` planner | `business-and-geography.md`, `data-and-compliance.md`, `workload-requirements.md`, `regional-capability.md`; `guides/region-planner.md` for the tool |
| `14` part 3 opener, `14b` requirements and design record | `platform-architecture.md` |
| `15` profile principles/cost, `15b` profile tree and decision | `profile-selection.md` |
| `16` shared-service placement | `platform-enablement-connectivity.md` |
| `16b` hybrid connectivity | `hybrid-connectivity.md` |
| `17` part 4 opener, `17a` order of work and readiness | `prepare-region.md` |
| `17b` No Hub | `disconnected-spokes.md` |
| `17c`-`17d` Remote Hub | `remote-hub-connected.md` (`17d` includes an extra connection figure) |
| `17e`-`17f` Selective Hub | `minimal-regional-hub.md` |
| `17g`-`17h` Full Hub | `full-regional-hub.md` (`17h` includes hub design options) |
| `17i` readiness | `platform-readiness.md` |
| `18`-`18b` placement | `workload-placement.md` |
| `19`-`19b` scenarios, `20` misconceptions, `20b` getting started | Resources articles |
| `22a0`, `22a2`, `22a3`, `22a4-kv1`-`22a4-kv5`, `22a4a`-`22a4d` service guides | `workload-design.md`, `storage-across-regions.md`, `restore-across-regions.md`, `key-vault-across-regions.md`, `private-dns-multi-region.md` |
| `22a1` pairing, `22a5` resiliency, after the other Resources | `paired-nonpaired-regions.md`, `resiliency-scenarios.md` |
| `23`/`23b` references | Article reference-link sections; part 4 profiles carry links inline and in the Guidance column |

The removed operating-model material remains in `backup/operating-model.md` and `backup/whitepaper-25-operating-model.html`, not on the website or in the PDF.

The home page is a short landing page; longer explanations live in `framework-overview.md` and `platform-and-workload.md`. The whitepaper sometimes retains fuller text: `02b` carries all six approach-at-a-glance cards, while the overview article folds three into construct descriptions. Don't shorten a whitepaper page solely because its article is shorter. Profile considerations also appear on `08b`/`08c`; hub design options appear on the Full Hub pages.

Figure IDs and extraction names live in `site/tools/extract_figures.py` (`FIGS`) and `site/figures/manifest.json`.

The connectivity profile display names are **No Hub**, **Remote Hub**, **Selective Hub**, and **Full Hub**. Keep the existing article filenames and URLs stable when changing these labels; update links to renamed section anchors.

Keep the full Key Vault guide to at most five rendered PDF pages and five PowerPoint slides: product comparison and paired-region constraints, secrets and certificates, vault-based key patterns, Managed HSM key patterns, and the decision tree with references. Keep all seven pattern diagrams; use speaker notes for detailed slide caveats rather than adding slides. After regeneration, check the actual PDF page count for this section as well as source-page coverage.
Use `data-export-width` on a figure to set its standalone export width independently of the PDF column width. The seven Key Vault pattern diagrams use 380 pixels so their web and PNG objects have consistent sizes; their PDF placement still follows the two- or three-column layout.

The private DNS article uses `content/media/private-dns-global-zone.png` and `private-dns-regional-zones.png`, imported from the supplied HTML diagrams. The website discovers it through `content/toc.yml`; the PDF mapping places its four pages after Key Vault. The single-file HTML exporter embeds the shared images. `55-service-guides.js` calls `key-vault.js`, then `private-dns.js`. Executive editions point to the guides without reproducing these technical pages. `whitepaper/gen/keyvault.py` generates the five Key Vault pages and eight registered diagrams; edit that generator, rerun it, extract figures, and rebuild both full outputs. To publish website-only changes, run `python3 site/build.py`.

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

Until then, the website is the publishing channel and offers the two PDFs as downloads. PowerPoint decks remain local build outputs. Word documents are no longer generated.
