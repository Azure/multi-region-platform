# Multi-region planner

The [published planner](https://azure.github.io/multi-region-platform/region-planner.html) supports regional qualification and design selection (steps 2 and 3 of the framework). Teams answer the four qualification checks, compare availability indicators, prices, and latency, select regions, and record their Platform Services profiles, shared-service placement, and hybrid connectivity.

The planner exports Excel and saves or opens JSON planning records. Visitor-entered planning data stays in the browser; it is not sent to a server. Azure reference data is loaded from published snapshots: see [Azure data collection](azure-data.md) for provenance and limitations.

In Regional design, **Hub Connections** is a searchable multi-select: select or clear regions without
closing the dropdown. Arrow keys move between options; Enter or Space toggles a selection, and Esc closes
the list. Saved plans, review records, and Excel exports retain every selected region. Older plans
with a single Full-Platform region keep that selection. Remote shared services still name one supplying region;
when no supplier is specified, the first selected hub is used.

Saved plans using earlier names for Minimal platform migrate automatically without changing custom notes,
service placements, or hub selections. The advanced networking tool keeps its stable `minimal-hub` pattern ID.

**Existing connectivity** suggests only locations in the Azure ExpressRoute peering-location snapshot,
independently of the Latency tab. Customer cities and their estimated routes do not establish existing
circuits. Suggestions identify valid peering locations, not circuits the customer owns. You can still
type a circuit description or other existing connectivity, such as a VPN. If the catalog is unavailable,
the field explains why no locations are suggested.
After building, run `python site\tools\test_planner_connectivity.py` for the hub multi-select,
saved-plan compatibility, review/export, diagram inheritance, and peering-suggestion browser checks.

Every planner tab uses the full page width, with a compact header and the website navigation behind the
**Table of contents** button. Open that menu to return to the guidance without narrowing the planner.
Planner actions, Essentials, and step tabs remain available throughout.
After building, run `python site\tools\test_planner_layout.py` for full-width, navigation, and responsive
layout regressions across all tabs in light and dark themes.

The Services tab supports up to 100 services in one table. It shows 10 service rows at a time; scroll within the table to reach the rest, with column headers kept visible. Saved plans, Excel exports, and printing include the full list.

Services, Products, and SKUs come from the manually imported availability CSV. Separate Product and SKU selectors narrow the selection; leaving either unselected checks whether any matching entry is available. Regional cells show small AZ counts only where the CSV supplies them. Release Status is not imported. Pricing inherits those services through the maintained service-name mapping, but continues to use its separate Retail Prices API snapshot and service-level comparisons. See [Azure data collection](azure-data.md) for monthly CSV imports and the monthly pricing refresh Action.

After building the site, run `python site\tools\test_planner_services.py` for the targeted browser regression checks.
Importer and data-layer regressions run with `python -m unittest discover -s site\tools -p test_service_catalog.py` and `node --test site\tools\test_service_catalog.cjs`.
Monthly backup retention and collection failure-safety checks run with `python -m unittest discover -s site\tools -p test_snapshot_history.py`. The website loads `availability-catalog-latest.json` and `retail-latest/` only; each source keeps up to six monthly backups separately.

## Source organization

The planner is website-only, not an article in `content/toc.yml` or part of the CAF export. `site/build.py` registers it in `TOOLS`, supplies the shared header and navigation, lists it under Resources, and adds it to search. The overview articles link to it through website-only content.

| File | Responsibility |
|---|---|
| `site/planner/planner.html` | Page body and script container |
| `site/assets/planner-data.js` | Questions, options, defaults, and example shared by the page and Excel export |
| `site/assets/planner-core.js` | State, reference data, qualification/evidence/latency/profile logic, and planning record; no DOM |
| `site/assets/planner-icons.js`, `planner-kit.js` | Icons, diagrams, and shared UI components |
| `site/assets/planner-views.js`, `planner-design.js` | Scope, Services, Latency, Pricing, Checks, Regional design, and Review + export views |
| `site/assets/planner-map.js`, `planner-map.json` | Planner-derived geographic view and local Natural Earth boundaries |
| `site/assets/planner-network.js` | Optional embedded networking explorer and print integration |
| `site/assets/planner.js`, `planner.css` | Frame, events, and styles |
| `site/assets/planner-export.js`, `xlsx-lite.js` | Excel export and the small `.xlsx` writer; no third-party spreadsheet library |
| `site/data/regions-seed.json` | Geography, zones, pairing, access, and coordinate reference data |
| `site/tools/import_service_catalog.py` | Manual availability CSV import and service-pricing mapping generation |
| `site/tools/refresh_data.py`, `refresh_latency.py` | Independent retail pricing and latency snapshots |

When checks, profiles, or default placements change in the articles, mirror the wording in `planner-data.js`. Build and serve `docs/` over HTTP as described in [Building and publishing](building.md).

## Planner geography view

The Latency tab ends with a geographic view derived from Scope's current/candidate regions, selected peering locations and customer cities, and the same published, estimated, or edited latency values as the tables. It adds no duplicate tables. Blue current-region, green candidate, and orange peering labels follow the planner's light/dark styling.

**Add a peering location** lists every location in the published peering snapshot in a scrollable dropdown,
without a 50-result cutoff. Search remains available; locations already added are omitted to prevent duplicates.

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

Regional design ends with the planner geography map and an **Enable Advanced Networking Design Tool**
button. The button opens the [Geo Landing Zone Connectivity Explorer](../tools/geolz-explorer/README.md)
inline at the bottom of the page. Use its **Editor** to build or change hub-spoke or Virtual WAN designs,
shared services, regional links, and hybrid connectivity. You can hide and reopen the tool or switch planner
tabs without losing the loaded design.

The tool uses the same full-width layout and collapsed website navigation as the rest of the planner.
Hiding it or leaving Regional design keeps that planner layout.
**Editor** and **Details** show one side panel at a time; on narrower screens they overlay the canvas instead
of shrinking it. The tool follows the website theme, with no separate theme switch.

**Expand to full page** makes the tool fill the browser window, above the website header. Select
**Exit full page**, or press **Esc** while focus is outside the diagram, to return. Inside the diagram, **Esc**
keeps its usual meaning of resetting the view. Hiding the tool or leaving Regional design also exits full page.

**Present** (or **F**) opens the current design and selected path in a separate presentation window. Changes
to the inline design, layers, or website theme update that window while it remains open. The popup has no
editor and does not overwrite the saved design. Close it with **Close presentation** or **Esc**. If the
browser blocks popups, allow them for this site and retry.

The embedded explorer inherits current regions from Scope and the new regions selected for Regional design.
It uses their effective profiles, hub connections, topology, regional links, shared-service placements and
hybrid decisions. Named `ExpressRoute circuit in <peering location>` connections are attached to the
appropriate local or remote gateways; matching Latency locations identify their on-premises sites.
An unspecified site is explicitly labelled rather than inventing a datacenter. Site-to-site VPN choices
are also mapped. Unselected qualification candidates are not imported.

The **Plan definitions** panel retains every shared service (including custom services),
placement, supplying region, management method, east-west choice and hybrid change. GeoLZ has one topology
per diagram and does not model every planner capability or product choice. Mixed topologies, SD-WAN/NVA
paths, incomplete hybrid definitions and other limitations are called out in the panel. Firewall and DNS
symbols illustrate the capability, not a confirmed product selection. Current-region services are only
inferred where a new region requires them; the planner does not inventory all existing services.
Both tools use **No platform**, **Remote platform**, **Minimal platform**, and **Full platform**. Full-Platform regions provide
hybrid connectivity and shared services from other regions; Azure geography names remain reference-data labels,
not Platform Services profiles. Saved plans using the previous profile names are converted when opened, including
regional connection choices that previously referred to the remote hub.

Every selected hub connection is passed to the diagram. For Remote platform, GeoLZ models
traffic through one Full-Platform region (the first selection); this limitation is called out in Plan definitions.

Changes to networking definitions in the plan refresh the explorer, including its live presentation window.
Tool-only refinements survive unrelated renders, hiding and reopening, but are replaced by a networking
definition change. **Reset from plan** discards them explicitly. They do not modify the plan and
are not saved to the standalone explorer's browser autosave. JSON Export can preserve a refined diagram;
Excel and JSON exports of the plan continue to contain its authoritative decisions.

Once enabled, printing Regional design
or using **Print** in Review + export includes its latest full diagram and inherited records on separate pages, in a light theme,
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
