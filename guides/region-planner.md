# Multi-region planner

The [published planner](https://azure.github.io/multi-region-platform/region-planner.html) supports regional qualification and design selection (steps 2 and 3 of the framework). Teams answer the four qualification checks, compare availability indicators, prices, and latency, select regions, and record their Platform Services profiles, shared-service placement, and hybrid connectivity.

The planner exports Excel and saves or opens JSON planning records. Visitor-entered planning data stays in the browser; it is not sent to a server. Azure reference data is loaded from published snapshots: see [Azure data collection](azure-data.md) for provenance and limitations.

Check 3 uses one shared answer per workload question, marked **Applies to all regions**.
Choose **Edit overrides** to override individual regions; **Use shared answer** restores
inheritance. Changing the shared answer updates only regions without an override, including newly
added candidates. Hiding regional answers does not remove overrides. Existing plans retain different
regional answers and show them automatically. JSON saves retain defaults and overrides; Excel exports
contain each region's effective answers. Zone resiliency remains a workload requirement:
check 4 flags a capability gap rather than weakening the requirement.

The six tabs are **Scope**, **Checks 1 to 3**, **Check 4**, **Outcome**, **Regional design**, and
**Review + export**. Check 4 has four substeps: **Latency**, **Pricing**, **Check 4 questions**, then
**Annotations** (optional).
Selecting the **Check 4** tab or its mobile step-menu entry always opens **Latency**.
Substep links and Previous/Next navigation open their explicit targets without clearing entered data.
Evidence-based suggestions have dashed outlines and remain unrecorded until accepted.
Outcome has one row per region and only four classifications: **Excluded**, **Candidate**,
**Conditional**, and **Qualified**. Regions with no business need are Excluded; older saved
classifications for that case migrate automatically. Subsequent checks show **Not needed**
without erasing previously recorded answers. Only Qualified and Conditional regions can be selected
for regional design; all regions remain in JSON, text, Excel, and the review record.

### Annotations

The optional fourth Check 4 substep supports user-defined Text, Dropdown, Date, and Notes fields.
No field names or dropdown choices are preloaded. Choose **Add field** to define a column, or
**Import field template** to append definitions from a JSON template. **Download field template**
exports definitions only, never regional values. Import rejects invalid or duplicate IDs without
replacing existing fields. Up to 20 fields and 500 rows are supported.

Each current or candidate region gets a region-level row, including excluded candidates.
There is no separate region/zone entry form. Previously saved zone-level annotations remain
editable and retain their labels; those labels do not assert physical zone mappings.
Removing a region from Scope removes its annotation rows. Removing a field or saved zone
row requires a second click and deletes the associated values. Annotations never alter check
answers, qualification outcomes, or Azure reference data.

Browser autosave retains annotations. **Include annotations in saved files and exports**
is on by default on every page load and after opening or replacing a plan. Turn it off in the
annotations substep or inside the **Annotations** box in Review + export to exclude annotations
from saved JSON, Excel, copied text, and the printed Review report.
The Annotations box follows **All regions in this plan**. With inclusion off, even field definitions are omitted from downloaded plans.
With inclusion on, JSON retains editable definitions and values; Excel adds an annotation sheet.
The annotations editor itself is never printed. This is not a CSA-only or access-controlled area:
only enter information approved for the device and workflow. Annotation editor and report content
are marked for Clarity masking; masking is not authorization or a guarantee of confidentiality.

Templates use this shape (the example defines a plain text field; dropdown choices must be
supplied by the template author in an `options` array):

```json
{
  "kind": "planner-annotation-template",
  "version": 1,
  "fields": [{ "id": "reference", "label": "Reference", "type": "text" }]
}
```

After building, run `python site\tools\test_planner_annotations.py` for template import, custom
fields, saved zone-row compatibility, persistence, export inclusion, and responsive-layout checks.

Scope starts with **Plan**, followed by optional **On-premises datacenters** and
**ExpressRoute peering locations** side by side, then **Current platform** and **Regions to qualify**.
Neutral cards use color for status and selections rather than decorative section bands.
Each current region records one of the four Platform Services profiles. Older Full-Platform flags
migrate to Full platform; an unmarked legacy region's profile remains unspecified.
Add or remove locations there. Scope lists location names without peering-path or latency-target controls.
Existing saved city locations, targets, peering choices, and measured overrides are retained
and continue to inform the Latency view; no replacement editing controls are introduced yet.
A nearest peering path is labelled as an estimate, not a confirmed circuit.
Each current region's **Primary ExpressRoute circuit** selects one of the peering locations added in Scope,
or **None**. Adding a latency-test location alone does not assert circuit ownership.
Each region can have a different primary circuit. The gateway provider's primary circuit (or the first
connected current region's primary circuit for a local gateway) is the default for regional reuse decisions,
unless another user-added peering location is selected explicitly. Older plan-wide primary circuit
assignments migrate to the current regions without replacing explicit per-region choices.

Latency displays comparisons, target markers, breaches, evidence sources, and the map, with an
**Edit locations in Scope** link. Measured-latency overrides and their reset controls remain in Latency.
Its bars and legend use equal-width steps at 0, 30, 60, 120, 200, and 250 ms, interpolating
within each interval and filling at 250 ms. Location comparisons precede region-to-region comparisons.
The location table shows only on-premises datacenters, with **On-Premises Locations** and
**ExpressRoute Peering location** columns and no target column. Peering locations form part of
each datacenter's path rather than separate rows; their saved entries remain available in Scope.
Pricing keeps the baseline selector and spend-weight toggle next to its summaries; enabling weighting
reveals a spend-share input for each service. Diverging bars share a zero-centered scale.

In Regional design, **Hub Connections** is a searchable multi-select: select or clear regions without
closing the dropdown. Arrow keys move between options; Enter or Space toggles a selection, and Esc closes
the list. Saved plans, review records, and Excel exports retain every selected region. Older plans
with a single Full-Platform region keep that selection. Remote shared services still name one supplying region;
when no supplier is specified, the first selected hub is used.

Saved plans using earlier names for Minimal platform migrate automatically without changing custom notes,
service placements, or hub selections. The advanced networking tool keeps its stable `minimal-hub` pattern ID.

**Existing connectivity** is a dropdown containing only ExpressRoute peering locations the user added
in Scope. Customer cities and their peering paths do not supply circuit options, and the Azure catalog
does not add options automatically. Removing a peering location clears its current-region circuit
assignments. Previously saved connectivity outside the added locations remains in JSON with a warning
and must be replaced or its peering location added before the design is complete.
After building, run `python site\tools\test_planner_connectivity.py` for the hub multi-select,
saved-plan compatibility, review/export, diagram inheritance, and peering-suggestion browser checks.

Every planner tab uses the full page width, with a compact header and the website navigation behind the
**Table of contents** button. Open that menu to return to the guidance without narrowing the planner.
Planner actions, Essentials, and step tabs remain available throughout.
After building, run `python site\tools\test_planner_layout.py` for full-width, navigation, and responsive
layout regressions across all tabs in light and dark themes.

Question **3.5** embeds up to 100 service entries in Check 3. Add the same service as many times as needed within that limit, with an independent Product, SKU, and spend share for each entry. Always-visible **Any product** and **Any SKU** selectors narrow the comparison; select a product before a specific SKU. It shows 10 service rows at a time; scroll within the table to reach the rest, with column headers kept visible. Saved plans, Excel exports, and printing retain every entry, including repeated services.

Check 3 uses the guidance's four workload archetypes and shows their typical profile fits.
Saved archetype names migrate without losing regional overrides. In Regional design, the actual
connectivity requirements determine the suggested profile; a typical archetype fit is not automatic
qualification. Shared-service defaults and explicit choices are always editable in one table,
tagged **Profile default** or **Decided here**. Management groups, access control, policy, and Key Vault
are not regional shared-service placement choices; existing saved placements remain in JSON.
Key Vault remains available as a workload service in Check 3.5. Review triggers are a date and a list of changes
to requirements, constraints, or platform capabilities; previous custom reassessment text remains
editable as an additional trigger. Review records include the outcome date, archetype, profile,
connectivity, service placement, documented constraints, ownership, and review triggers.

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

The Latency substep in Check 4 ends with a geographic view derived from Scope's current/candidate regions, selected peering locations and customer cities, and the same published, estimated, or edited latency values as the tables. It adds no duplicate tables. Blue current-region, green candidate, and orange peering labels follow the planner's light/dark styling.

**Add a peering location** lists every location in the published peering snapshot in a scrollable dropdown,
without a 50-result cutoff. Search remains available; locations already added are omitted to prevent duplicates.

Current-to-candidate and peering-to-current links start on; peering-to-candidate, other region pairs, and city-to-peering links are optional. Location focus, zoom, fit, and reset keep the view readable. Hover or keyboard-focus a latency badge for direction, source, and approximate great-circle distance. City links show only the provider leg. Locations without coordinates are explicitly listed rather than guessed.

The map fits the selected footprint worldwide, including date-line crossings. It uses a local generalized Natural Earth basemap (public domain; boundaries are not legal boundaries). No external map service, API key, or runtime map request is needed.

**Review + export** always shows a fitted overview of every current and candidate region, including unselected or excluded candidates, and the plan's peering locations and customer cities. It does not inherit focus or zoom from the interactive map. Printing gives this geographic overview its own page.

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

Regional diagrams place workload spokes at the top and platform shared services at the bottom,
with hubs aligned along the lower edge. Virtual WAN shared services VNets sit below workloads,
above their virtual hubs.

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
hybrid decisions. Every existing region receives its profile's local firewall and DNS defaults,
independently of whether a new region consumes them. Each current region's primary ExpressRoute circuit
is attached to its own local gateway; a circuit shared with a new region is represented once per
on-premises site and peering location, with all attached regions retained.
Named `ExpressRoute circuit in <peering location>` connections are attached to the
appropriate local or remote gateways; matching on-premises datacenters identify their sites.
Only datacenter entries become on-premises sites, never the peering-location entries themselves.
Scope offers **Standard** and **Metro** peering locations. The advanced tool's peering-location
selectors, new-circuit defaults and resiliency switches use only the locations added in Scope.
Add the corresponding Standard or Metro entry in Scope before switching to that offering.
Metro is preserved as a single circuit with two peering locations; its Scope map position is a
city-level reference, not a facility-specific latency estimate.
An unspecified site is explicitly labelled rather than inventing a datacenter. Site-to-site VPN choices
are also mapped. Unselected qualification candidates are not imported.

The **Plan definitions** panel retains every shared service (including custom services),
placement, supplying region, management method, east-west choice and hybrid change. GeoLZ has one topology
per diagram and does not model every planner capability or product choice. Mixed topologies, SD-WAN/NVA
paths, incomplete hybrid definitions and other limitations are called out in the panel. Firewall and DNS
symbols illustrate the capability, not a confirmed product selection. Current-region services use
profile defaults, not a verified inventory. Datacenter paths use saved or nearest estimated peering
paths, matched to a circuit by city: Amsterdam, Amsterdam2 and Amsterdam Metro are one city. A registered
but unmatched circuit keeps its exact location and an explicitly unspecified site.
Both tools use **Governance-Only**, **Remote platform**, **Minimal platform**, and **Full platform**. Full-Platform regions provide
hybrid connectivity and shared services from other regions; Azure geography names remain reference-data labels,
not Platform Services profiles. Saved plans using the previous profile names are converted when opened, including
regional connection choices that previously referred to the remote hub.

Every selected hub connection is passed to the diagram. A Remote platform region keeps one service-provider
hub (the first selection). In the advanced editor, **Region links > Remote-region spoke peerings** adds
independent global VNet peerings from its spokes to other regions' **hub VNets** or **workload spokes**.
Direct spoke peerings bypass hub firewalls. Hub peering requires route tables and forwarded traffic through
the target hub firewall; it does not by itself provide transitive connectivity or gateway transit.
A managed Virtual WAN hub cannot accept global VNet peering, so hub-VNet targets are disabled in that topology;
explicit workload-spoke peerings remain available. These are tool-only refinements, not changes to the saved plan.

Changes to networking definitions in the plan refresh the explorer, including its live presentation window.
Tool-only refinements survive unrelated renders, hiding and reopening, but are replaced by a networking
definition change. **Reset from plan** discards them explicitly. They do not modify the plan and
are not saved to the standalone explorer's browser autosave. JSON Export can preserve a refined diagram;
Excel and JSON exports of the plan continue to contain its authoritative decisions.

**Review + export** automatically loads and shows the latest advanced networking design diagram, even if the editor was never enabled in Regional design. The diagram includes current regions and selected regional designs; the geographic overview also retains candidates not selected for design. Tool-only refinements are preserved when moving between these views.

Once enabled, printing Regional design includes the latest full diagram. Using **Print** in Review + export includes the geographic overview, networking diagram, and inherited records on separate pages, in a light theme,
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
