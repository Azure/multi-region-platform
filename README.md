# Adaptable multi-region Azure platform

> **Live guidance site:** [https://azure.github.io/multi-region-platform/](https://azure.github.io/multi-region-platform/)

Source for the multi-region platform guidance and every format it ships in:

| Deliverable | Source of truth | Built output |
|---|---|---|
| Website (GitHub Pages) | `content/*.md` + `content/toc.yml` | `docs/` |
| CAF article set (future) | `content/*.md` + `content/toc.yml` + `content/media/` | submitted as-is to the CAF repo |
| Whitepaper PDF (57 pages) + single-file HTML | `whitepaper/pages/*.html` | `dist/Adaptable-Multi-Region-Azure-Platform.pdf` / `.html` |
| Executive brief PDF (14 pages) + HTML | `whitepaper/exec/pages/*.html` | `dist/…-Executive-Brief.pdf` / `.html` |
| Region planning workbook (website tool) | `site/planner/`, `site/assets/planner*.js`, `site/data/regions-seed.json` | `docs/region-planner.html` + `docs/data/` |

The Markdown in `content/` is written in Microsoft Learn syntax, so the same files drive the website now and the Cloud Adoption Framework (CAF) later. Diagrams are drawn once, in the whitepaper, and extracted for the other formats.

```
content/            Learn-flavored Markdown, toc.yml, media/*.png (CAF-ready)
whitepaper/         page-accurate HTML/CSS → PDF (full edition and exec brief)
decks/              pptxgenjs sources for both decks
word/               generator for the Word edition (built from the Markdown)
site/               website generator, template, CSS/JS, figure extractor, QA, and the region planning workbook
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
./build.sh data     # refresh the Azure data snapshot for the region planning workbook (takes a while, not part of "all")
```

`./build.sh site` finishes with `site/tools/qa.py`. It checks every page for broken links and anchors, horizontal overflow, and console errors. It should print `no problems`. For a visual review, run `python3 site/tools/qa.py --shots` (add `--dark` or `--width 1280`); screenshots land in `site/tools/shots/`.

`render.py` lists any content that overflows a PDF page. An empty `[]` means clean.

## Publish the website

1. Push this repository to GitHub.
2. Go to **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, then select `main` and `/docs`.
3. The site is served at `https://<account>.github.io/<repo>/`. `docs/.nojekyll` is already in place, and all links are relative, so a custom domain or a subpath works without changes.

The site is desktop-first, but it opens on any screen. Below 960 px wide the same pages show in one column, the table of contents moves behind a menu button, wide tables scroll sideways, and figures shrink to fit (the expand button opens them at a readable size). The decks and the Word edition are not published: they stay in `dist/`, which is git-ignored. The downloads come from `docs/downloads/`, which `./build.sh` refreshes.

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
| `06`–`07` platform vs. workload, `07b` city analogy (the picture and its icon legend come from `art/city_analogy.py`) | `platform-and-workload.md` |
| `08`, `08b`, `08c` profiles (each profile also carries its considerations and reassessment triggers) | `connectivity-profiles.md`, and "Considerations and reassessment by profile" in `profile-selection.md` |
| `09` archetypes, `09b` matrix, `09c` terminology table | `application-landing-zone-archetypes.md` |
| `10` four checks, `10b` outcome, `10c` qualification tree | `regional-qualification.md` |
| `11` checks 1–2, `12`/`12b` check 3, `13`/`13b` check 4 | the four check articles |
| `14` part 3 opener (three choices, the three-decisions figure), `14b` workload requirements and the regional design record | `platform-architecture.md` |
| `15` connectivity profile (question, principles, cost figure), `15b` profile tree and decision | `profile-selection.md` |
| `16` shared-service placement | `platform-enablement-connectivity.md` |
| `16b` hybrid connectivity | `hybrid-connectivity.md` |
| `17` part 4 opener (what each profile adds, what is global), `17a` order of work, coexisting-estate figure, ready for workloads | `prepare-region.md` |
| `17b` Disconnected Spokes | `disconnected-spokes.md` |
| `17c`–`17d` Remote Hub Connected (`17d` adds a connection figure that the article doesn't have) | `remote-hub-connected.md` |
| `17e`–`17f` Minimal Regional Hub | `minimal-regional-hub.md` |
| `17g`–`17h` Full Regional Hub (`17h` carries the hub design options figure) | `full-regional-hub.md` |
| `17i` readiness | `platform-readiness.md` |
| `18`–`18b` placement | `workload-placement.md` |
| `19`–`19b` scenarios, `20` misconceptions, `20b` getting started | Resources articles |
| `22a0`–`22a5` appendix | `workload-design.md` and its three children |
| `23`/`23b` references | "Reference links" sections across the articles. The profile pages in part 4 carry their links inline and in the Guidance column instead of a reference list. |
| (removed) operating model | Not on the website or in the PDF. Kept in `backup/operating-model.md` and `backup/whitepaper-25-operating-model.html`. |

The home page (`index.md`) is a short landing page: intro, assumptions table, the five parts, and one figure. The longer explanation lives in `framework-overview.md` and `platform-and-workload.md`. Where the website condenses text, the whitepaper keeps the full version: `framework-overview.md` folds three of the six "approach at a glance" cards into the construct descriptions, and page `02b` still carries all six in full. Don't shorten a whitepaper page because its article got shorter.

The whitepaper numbers the five parts of the framework as Part 1 to Part 5, where the articles say step 1 to step 5. Its page order follows the website menu, and "Service behavior across regions" is Appendix A. Two things sit elsewhere than on the website: each profile's considerations and reassessment triggers are also on the part 1 profile pages (`08b`, `08c`), and the hub design options figure is on the Full Regional Hub pages.

Figure IDs and the names they're extracted under are listed in `site/tools/extract_figures.py` (`FIGS`) and `site/figures/manifest.json`.

## Region planning workbook

`docs/region-planner.html` is an interactive page for steps 2 and 3. A team answers the four qualification checks for each candidate region, compares service availability, prices, and latency, selects one or more regions, and then records the connectivity profile, shared-service placement, and hybrid connectivity of each one. It exports to Excel, and saves to and opens from a JSON file. Everything a visitor enters stays in the browser: the page sends nothing to a server.

The page is website-only. It isn't an article, so it isn't in `content/toc.yml` and it isn't part of the CAF export. `site/build.py` lists it in `TOOLS`, gives it the same header and navigation as the articles, lists it as the last entry under Resources, and adds it to the search index. The two overview articles link to it from website-only tips.

| File | What it holds |
|---|---|
| `site/planner/planner.html` | The page body: the container the scripts fill. |
| `site/assets/planner-data.js` | The questions, options, defaults, and the example. Change a question here, and it changes in the page and in the Excel export. |
| `site/assets/planner-core.js` | State, the Azure data, and the logic: suggested outcome, evidence, latency, profile suggestion, defaults, and the record. No DOM. |
| `site/assets/planner-icons.js`, `planner-kit.js` | The icons and small diagrams (inline SVG drawn for the page), and the shared interface pieces: buttons, form rows, message bars, the combobox, tooltips. |
| `site/assets/planner-views.js`, `planner-design.js` | The views: Scope, Services, Latency, Pricing, and Checks; Regional design and Review + export. |
| `site/assets/planner.js`, `planner.css` | The frame (command bar, Essentials, step tabs, footer) and events, and the styles. |
| `site/assets/planner-export.js`, `xlsx-lite.js` | The Excel export and the small `.xlsx` writer behind it. No third-party library. |
| `site/data/regions-seed.json` | Reference data for regions: geography, availability zones, pairing, access, and coordinates. Review it when Azure adds a region. |
| `site/tools/refresh_data.py` | Writes the Azure data snapshot to `docs/data/`. |
| `site/tools/refresh_latency.py` | Writes the latency data to `docs/data/`. |

When you change the wording of a check, a profile, or a default placement in the articles, make the same change in `planner-data.js`.

### Azure data snapshot

The page never calls Azure. It reads a snapshot from `docs/data/` that `site/tools/refresh_data.py` builds from the [Azure Retail Prices API](https://learn.microsoft.com/rest/api/cost-management/retail-prices/azure-retail-prices), which is public and needs no sign-in. The script uses only the Python standard library.

```bash
./build.sh data                 # full refresh: the whole consumption price list, in pages of 1,000 items
./build.sh data --max-pages 20  # quick partial run to test the pipeline (the snapshot is marked partial)
./build.sh data --arm           # also read geography, zones, and pairing from 'az account list-locations'
```

`.github/workflows/refresh-data.yml` runs the script every day and commits `docs/data/`. The data files are rewritten only when their content changes, but `meta.json` carries the snapshot time, so expect one small commit a day. `./build.sh site` keeps `docs/data/` as it is, the same way it keeps `docs/downloads/`. Until the first snapshot exists, the page still works: regions come from the seed file, and Services and Pricing show "No data" with a note on how to create the snapshot.

- **Availability is derived from pricing.** A service or product counts as available in a region when the price list has a consumption meter for it there. That is a first filter, not a guarantee, and the page says so. Services and Pricing are read-only results: a correction that a team confirms elsewhere goes into the note of check 4.1.
- **Prices are compared as a median.** For each service, the script takes the meters that exist in both regions and reports the median difference in percent, with the number of meters. They are list prices in USD. Spot, low-priority, dev/test, reservation, and savings-plan prices are left out.
- **The API is rate limited.** It allows about 10 requests a minute for each caller, and the price list is several hundred pages, so a full run takes more than an hour. The script waits when the API throttles it and then continues.
- **Region metadata isn't in the price list.** Geography, zones, and pairing come from the seed file, or from Azure Resource Manager with `--arm` or `--locations <file>`. The script lists the regions it found no reference data for.

### Latency data

The page reads latency from two files that `site/tools/refresh_latency.py` writes to `docs/data/`:

- `latency.json`: region to region, and ExpressRoute peering location to region.
- `latency-cities.json`: city to peering location. The cities are the national capitals and first-level capitals of every country that has an Azure region or a commercial peering location, plus other places of 1,000,000 people or more (`--min-pop` changes the limit).

```bash
./build.sh latency                                        # download the sources and write docs/data/
./build.sh latency --cache .cache                         # keep the downloads in .cache and reuse them next time
python3 site/tools/refresh_latency.py --out /tmp/latency  # write somewhere else
```

The script needs GitHub and nothing else, uses only the Python standard library, and runs on Python 3.10 or later. It writes a file only when its content changes. `generated` in `latency.json` moves only when the data does, so the daily workflow doesn't add a commit for an unchanged dataset. It stops without writing when a source has lost more than a fifth of its rows since the last run.

Sources, all public files on GitHub (the two articles are in `MicrosoftDocs/azure-docs`):

- The [Azure network round-trip latency statistics](https://learn.microsoft.com/azure/networking/azure-network-latency) article: P50 round trip between regions, directional, a 30-day median. `dataset` in the file is the date the article gives.
- The [ExpressRoute locations](https://learn.microsoft.com/azure/expressroute/expressroute-locations-providers) article, section "Global commercial Azure": the peering locations and their local Azure regions.
- [Natural Earth](https://www.naturalearthdata.com/) populated places (public domain): coordinates of the peering locations, and the cities.

Every value has a source. Only the first row is a measurement.

| Value | Code | How it is built |
|---|---|---|
| Region to region, pair in Microsoft's table | `m` | Microsoft's published value, copied. |
| Region to region, pair not in the table | `d` | Distance estimate. |
| Peering location to region, through a local region | `l` | The estimated hop to the local region, plus Microsoft's published value from that region to the target. With several local regions, the smallest sum. |
| Peering location to region, any other | `d` | Distance estimate. This includes a peering location's own local region, where only the hop remains. |
| City to peering location | all estimated | Distance estimate. |

Microsoft publishes no latency from a peering location or a city, so those values are planning figures. The distance estimate is `3 ms + slope x great-circle km`, never below 1 ms. The slope is fitted to the published region pairs, so the estimate follows Microsoft's backbone. The 3 ms is fixed, because the smallest published round trips, between the two Canberra regions, are 3 to 4 ms. The slope, `r2`, and the median error are in `model` in `latency.json`. A route that detours is further off than the median.

Two things to maintain:

- **Regions.** The script takes regions and their `lat` and `lon` from `site/data/regions-seed.json`. It lists regions that the sources name and the seed file doesn't have. Add them, with coordinates, and run it again. A region without published latency gets estimates for every value.
- **Peering locations.** Each location is placed by the city in its name, in Natural Earth. The `PEERING_PLACES` table in the script holds the few names that need help (spelling differences, and places that Natural Earth doesn't list). The script stops and names any location it can't place, or that ends up more than 1,000 km from its local region. That check catches same-named cities in other countries, such as Newport in Wales and Newport in Rhode Island.

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

The two PDFs carry the city on a page of their own: `whitepaper/pages/07b-city.html` and `whitepaper/exec/pages/08b-city.html`. Both call `city.pdf_figure()` from the same script when the whitepaper is built, so they need no separate run. That function draws the city with labels that name what each place stands for, and adds a legend for every icon on the map. Edit the legend text in `pdf_figure()`.

External links use `https://learn.microsoft.com/azure/...` without a locale, as Learn requires.

## Moving to the Cloud Adoption Framework

When the CAF placement is approved:

1. Run `python3 site/tools/export_caf.py`. It writes the CAF-ready set to `dist/caf/`, with website-only content removed. Copy `dist/caf/*.md` and `dist/caf/media/` into the scenario folder of the CAF repository (under *Key adoption scenarios*), and merge `dist/caf/toc.yml` into the CAF `toc.yml` as a new node.
2. Add the required metadata to each article's front matter: `author`, `ms.author`, `ms.service`/`ms.subservice` (per CAF conventions), and update `ms.date`.
3. Convert links that point into the CAF docs set (`https://learn.microsoft.com/azure/cloud-adoption-framework/...`) to the repo-relative `.md` paths the CAF repo uses. Links to other Azure docs can stay as site-relative or absolute Learn URLs, per the repo's contributor guide.
4. Run the Learn build validation (acrolinx and link checks) and fix any style flags. Common ones: sentence-case headings and "multi-region" vs. "multiregion".
5. After CAF publishes, point the website to it: replace the site with a redirect page, or keep it as the download hub for the PDF and decks.

Until then the website is the go-to-market channel, and the PDF and decks are its downloads.
