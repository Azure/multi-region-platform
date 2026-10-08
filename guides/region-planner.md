# Region planning workbook

The [published workbook](https://azure.github.io/multi-region-platform/region-planner.html) supports regional qualification and design selection (steps 2 and 3 of the framework). Teams answer the four qualification checks, compare availability indicators, prices, and latency, select regions, and record their connectivity profiles, shared-service placement, and hybrid connectivity.

The workbook exports Excel and saves or opens JSON planning records. Visitor-entered planning data stays in the browser; it is not sent to a server. Azure reference data is loaded from published snapshots: see [Azure data collection](azure-data.md) for provenance and limitations.

## Source organization

The planner is website-only, not an article in `content/toc.yml` or part of the CAF export. `site/build.py` registers it in `TOOLS`, supplies the shared header and navigation, lists it under Resources, and adds it to search. The overview articles link to it through website-only content.

| File | Responsibility |
|---|---|
| `site/planner/planner.html` | Page body and script container |
| `site/assets/planner-data.js` | Questions, options, defaults, and example shared by the page and Excel export |
| `site/assets/planner-core.js` | State, reference data, qualification/evidence/latency/profile logic, and planning record; no DOM |
| `site/assets/planner-icons.js`, `planner-kit.js` | Icons, diagrams, and shared UI components |
| `site/assets/planner-views.js`, `planner-design.js` | Scope, Services, Latency, Pricing, Checks, Regional design, and Review + export views |
| `site/assets/planner-map.js`, `planner-map.json` | Workbook-derived geographic view and local Natural Earth boundaries |
| `site/assets/planner-network.js` | Optional embedded networking explorer and print integration |
| `site/assets/planner.js`, `planner.css` | Frame, events, and styles |
| `site/assets/planner-export.js`, `xlsx-lite.js` | Excel export and the small `.xlsx` writer; no third-party spreadsheet library |
| `site/data/regions-seed.json` | Geography, zones, pairing, access, and coordinate reference data |
| `site/tools/refresh_data.py`, `refresh_latency.py` | Published availability/pricing and latency snapshots |

When checks, profiles, or default placements change in the articles, mirror the wording in `planner-data.js`. Build and serve `docs/` over HTTP as described in [Building and publishing](building.md).

## Workbook geography view

The Latency tab ends with a geographic view derived from Scope's current/candidate regions, selected peering locations and customer cities, and the same published, estimated, or edited latency values as the tables. It adds no duplicate tables. Blue current-region, green candidate, and orange peering labels follow the workbook's light/dark styling.

Current-to-candidate and peering-to-current links start on; peering-to-candidate, other region pairs, and city-to-peering links are optional. Location focus, zoom, fit, and reset keep the view readable. Hover or keyboard-focus a latency badge for direction, source, and approximate great-circle distance. City links show only the provider leg. Locations without coordinates are explicitly listed rather than guessed.

The map fits the selected footprint worldwide, including date-line crossings. It uses a local generalized Natural Earth basemap (public domain; boundaries are not legal boundaries). No external map service, API key, or runtime map request is needed.

From the repository root (Python commands also work in PowerShell with backslash paths):

```bash
python3 site/tools/build_planner_map.py
python3 site/build.py
python3 site/tools/test_planner_map.py
```

The targeted browser checks require Playwright and Chromium, like existing website QA.

## Advanced networking design

Regional design ends with the workbook geography map and an **Enable Advanced Networking Design Tool**
button. The button opens the [Geo Landing Zone Connectivity Explorer](../tools/geolz-explorer/README.md)
inline at the bottom of the page. Use its **Editor** to build or change hub-spoke or Virtual WAN designs,
shared services, regional links, and hybrid connectivity. You can hide and reopen the tool or switch workbook
tabs without losing the loaded design.

While the tool is shown, the website navigation moves behind the header's **Table of contents** button and
the workbook uses the full page width. Hiding it or leaving Regional design restores the normal navigation.
**Editor** and **Details** show one side panel at a time; on narrower screens they overlay the canvas instead
of shrinking it. The tool follows the website theme, with no separate theme switch.

**Expand to full page** makes the tool fill the browser window, above the website header. Select
**Exit full page**, or press **Esc** while focus is outside the diagram, to return. Inside the diagram, **Esc**
keeps its usual meaning of resetting the view. Hiding the tool or leaving Regional design also exits full page.

**Present** (or **F**) opens the current design and selected path in a separate presentation window. Changes
to the inline design, layers, or website theme update that window while it remains open. The popup has no
editor and does not overwrite the saved design. Close it with **Close presentation** or **Esc**. If the
browser blocks popups, allow them for this site and retry.

The explorer has its own browser autosave and JSON Import/Export; it does not automatically copy the workbook's
region selections or become part of the workbook's Excel/JSON exports. Once enabled, printing Regional design
or using **Print** in Review + export includes its latest full diagram on a separate page, in a light theme,
without the explorer's controls or editor. Zoom and pan do not crop the printed design; selected paths and
layer visibility are retained. A normal site build publishes the explorer under `docs/tools/geolz-explorer/`.

Run `python site\tools\test_planner_network.py` after building to check embedding, state retention, responsive
layout, diagram printing, and load failures with Playwright and Chromium.

## Standalone geography prototypes

The prototypes are separate design concepts, not the published planner or a complete Azure service inventory.

Open [`art/azure-geography-explorer.html`](../art/azure-geography-explorer.html) directly in a browser. It is self-contained and works offline, with a map-first responsive layout, accessible layer switches, per-location focus, zoom/fit controls, system/light/dark appearance, and export of the visible map as SVG. Details and geography notes expand on demand. The [preview PNG](../art/azure-geography-explorer.png) is static. Source UI: `art/azure_geography_explorer.html.in`.

The [original SVG](../art/azure-geography-prototype.svg) and [PNG](../art/azure-geography-prototype.png) illustrate current West Europe and North Europe regions, Frankfurt and Dublin peering metros, and Sweden Central, Denmark East, and Italy North candidates. Country and administrative borders provide context without capital markers. Small single-line location labels (11 px) and latency tags (10 px) keep the map visible.

Open the SVG directly in a browser to use its four switches (click or Space/Enter); image embeds and PNGs are static. Both prototypes preserve six existing-to-new-region comparisons and four peering-to-existing-region comparisons by default. Peering-to-new-region links (six) and other region pairs (four) start off. SVG switches affect lines and latency labels without hiding markers; hover titles show endpoints and distance, and the matrix retains every comparison.

Regenerate the prototypes using the [build prerequisites](building.md#prerequisites):

```bash
python3 art/azure_geography_prototype.py
```

The generator reuses the regional seed and caches public-domain Natural Earth boundaries in `.cache/latency/`. Its RTTs are **illustrative**, computed as `round(3 + 0.018 * distance_km)` rather than using telemetry or measured Azure latency. Distances are approximate great-circle kilometres, not network paths. Region and peering markers approximate metros, not facilities. Dublin's overlapping markers are visually offset; comparisons use their original shared coordinate.

Lines show comparisons, not verified circuits or physical routes. Azure geography is distinct from ExpressRoute geopolitical coverage and ExpressRoute Local eligibility.
