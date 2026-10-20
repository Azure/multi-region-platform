# Azure data collection

The [Multi-region planner](region-planner.md) loads published snapshots from `docs/data/`, not live Azure APIs. Data collection happens through maintainer-run scripts, separate from browser use and the normal build.

Run the commands below from the repository root. Collection/import scripts use only the Python standard library and require Python 3.10 or later. In PowerShell, use backslash paths, for example `python site\tools\refresh_data.py`.

## Service availability: manually supplied CSV

Services and pricing use **independent catalogs**. The Services tab uses the maintainer-supplied CSV, never Retail Prices API meter coverage. To update it, place the new CSV in the ignored `temp/` directory and run:

```powershell
python site\tools\import_service_catalog.py temp\service_availability_product_sku.csv
```

The import writes `docs/data/availability-catalog-latest.json` and regenerates `docs/data/service-pricing-map.json`. It does not collect or change retail pricing. The source filename, SHA-256 digest, row count, and original CSV import timestamp are recorded. Reimporting the same file with unchanged classifications does not change the catalog or create a backup. A classification change rebuilds the catalog and archives the previous version under the normal monthly policy, without changing the original CSV import timestamp.

### Monthly snapshot backups

Before replacing availability data, the importer copies the previous latest snapshot to `docs/data/availability-catalog-YYYY-MM.json`, using **the previous snapshot's original import month**, not the replacement month. For example, replacing October's data in November archives it as `availability-catalog-2026-10.json`.

Retail API refreshes use the same policy. The complete current snapshot lives in `docs/data/retail-latest/`; before replacement it is backed up to `docs/data/retail-YYYY-MM/`, dated from its original `meta.json.generated` timestamp. Each directory includes `meta.json`, `catalog.json`, `products.json`, and all `pricing/<region>.json` files so prices and catalogs stay together.

Each source keeps **one latest snapshot plus up to six monthly backups** independently. If more than one snapshot from a creation month is replaced, the **first archived snapshot for that month is retained unchanged**. After a successful replacement, archives beyond the six newest month labels are removed. These are six archived months, not a rolling 180-day cutoff; missing months do not produce empty backups. Repeated same-month changes are not all retained.

Collection, parsing, validation, and staging finish before the existing snapshot is archived/replaced. A failed collection or CSV validation leaves latest data and backups unchanged. Publication errors are reported, and retail directory replacement restores the previous latest directory if the new directory cannot be installed. The browser reads only latest paths, and normal website builds preserve latest data and all archives. The maintained service-name mapping and latency files are not part of this backup policy.

The existing snapshots were renamed without recollection or timestamp changes. For an older local checkout with the legacy layout, migrate it once before importing/collecting:

```powershell
python site\tools\snapshot_history.py
```

Only these CSV fields are used:

| CSV field | Meaning |
|---|---|
| `service_family` | Service Family, used to group the service picker |
| `service_name` | Service Name |
| `product_name` | Product Name |
| `sku_name` | SKU |
| `region` | Region identifier |
| `region_display_name` | Region Name |
| `geography` | Geography |
| `arm_zones` | Availability Zones, parsed from a JSON array of zone IDs |
| `is_available` | Regional availability (`1` or `0`) |

**Release Status (`pbr_state`) is deliberately not imported or displayed.** Other availability flags and other CSV columns are ignored.

The importer aggregates availability with an OR: a service is available if any matching service/product/SKU row has `is_available=1`; a product is available if any matching product/SKU row does. Selecting a SKU uses that SKU's rows only. Duplicate rows do not inflate zone counts. AZ counts are shown only for available matching rows with supplied zone information. Different counts are retained (for example, `1/3 AZs`), not combined into a claim of three-zone support for every SKU. Blank, `null`, and empty zone arrays produce no AZ label.

The Services tab has separate Product and SKU selectors; changing or clearing Product clears SKU. Saved plans and Excel exports retain both selections and include availability and reported AZ counts. Saved retail-era service names migrate only when the availability name is already an exact match or the mapping is unambiguous. Obsolete products and ambiguous names remain visible with a correction message, rather than silently choosing another service.

### Generic availability records versus specific SKUs

Some CSV rows explicitly repeat a service or product name in `sku_name`. These are not created by filling blank fields. All source rows remain in the catalog for availability and AZ rollups, but **reviewed generic SKU entries are not selectable as specific SKUs**.

[`docs/data/sku-classifications.json`](../docs/data/sku-classifications.json) is the canonical review file. Each entry contains exact `service`, `product`, and `sku` names plus a `classification` of `generic` (evidence only) or `specific` (a legitimate SKU choice, even if its name repeats a parent). Initial generic classifications cover Azure Load Balancer, Azure Firewall, and Azure Bastion; other repeated names are not automatically hidden. Same-named Products remain selectable.

Every import records unclassified SKUs whose names exactly match their Service or Product in the catalog's `skuReview` array and prints their names to stderr for review. Unreviewed entries remain selectable: matching names alone are not proof of bad data. Classify confirmed cases, then rerun the normal import command using the current CSV. Use `--classifications <file>` for a separate review file. Invalid or duplicate classification entries stop the import before publication; classifications not found in the current CSV produce warnings rather than matching a different name.

With no SKU selected, product availability includes its generic evidence and all specific SKUs. Selecting a specific SKU uses only that SKU's evidence, never the generic record. Products with no selectable specific SKUs show a disabled field labelled **No specific SKU information**. Previously saved generic SKU selections are retained with an explicit correction message and **No data**, not silently broadened to product availability. Clear the SKU to choose aggregate availability, or choose a specific SKU. JSON/Excel exports preserve the saved selection and unknown availability until corrected.

### Manually updating the downstream ADR-EMR planner

`Azure/multi-region-platform` is the only upstream for the Region Planner and Advanced Networking tool. Updates flow to `mcaps-microsoft/adr-emr-region-planning`, never back. ADR-EMR's Capacity tab, its state, validation, Checks gating, review, and exports are downstream customizations; this repository does not acquire that module.

Build the source site, then review and apply the one-way sync from this repository:

```powershell
$env:PYTHONUTF8 = '1'
python site\build.py
python site\tools\sync_planner.py --target C:\github\mcaps\adr-emr-region-planning
python site\tools\sync_planner.py --target C:\github\mcaps\adr-emr-region-planning --apply
node --test C:\github\mcaps\adr-emr-region-planning\tools\test_planner_sync.cjs
python C:\github\mcaps\adr-emr-region-planning\tools\test_planner_capacity.py
git -C C:\github\mcaps\adr-emr-region-planning diff --check
```

The default is a dry run. The command reads the **published working-tree files**, including uncommitted updates: `docs/assets` (except the guidance search index), `docs/data` (including monthly archives), and `tools/geolz-explorer`. It copies only the embedded region seed into the downstream `index.html`, preserving its standalone shell. Other downstream files, governance, documentation, and tests are not overwritten. Review the source changes before syncing; collection and CSV imports still happen here, not downstream.

Keep `.planner-upstream/baseline.zip` tracked **in ADR-EMR**. It stores the exact last upstream payload, not the customized downstream files. Future updates use Git's three-way merge against that baseline, preserving local additions and removing only previously managed files whose upstream deletion does not conflict with downstream changes. A conflict stops the entire update before destination files are changed; write failures roll back already-written files. Repository identity checks reject reverse synchronization or unrelated destinations. Sync does not commit, push, or enable automation.

If there is a conflict, rerun with `--resolutions <empty-folder-outside-both-checkouts>`. This exports `.upstream` copies and fingerprints; manually combine each with the downstream customization into a sibling file without the `.upstream` suffix, then rerun with the same arguments and `--apply`. Incoming copies are never approved automatically; stale resolutions and remaining conflict markers are rejected. Re-run the downstream regressions and inspect the diff before manually committing and pushing. First-time onboarding alone uses `--base-ref <upstream-commit>` identifying the reviewed version originally copied downstream; never reset an existing baseline to bypass a conflict.

### Mapping availability services to retail pricing

[`docs/data/svcavail-retailprice.csv`](../docs/data/svcavail-retailprice.csv) is the canonical, manually maintained mapping. It stays CSV for straightforward editing; the browser consumes the generated `service-pricing-map.json`. After editing the mapping, rerun the import command with the current availability CSV. Every availability service must have a mapping row; the import fails explicitly if a row is missing.

Pricing inherits the selected availability services and displays their mapped Retail API service names without changing its comparison layout. Product and SKU choices narrow availability only; prices remain service-level meter comparisons. Multiple selected availability services can map to the same retail service; they remain separate selected rows, with their original spend shares and source labels. Entries marked `No Retail meter ...` stay visible with that explanation and no price comparison. Unmapped names never fall back to a guessed retail service.

Confirm features, subscription access, quotas, and the required SKU with Microsoft before making a placement decision. These are published planning snapshots, not live subscription capability checks.

## Retail pricing: API collection

[`site/tools/refresh_data.py`](../site/tools/refresh_data.py) collects consumption meters from the public [Azure Retail Prices API](https://learn.microsoft.com/rest/api/cost-management/retail-prices/azure-retail-prices). The default refresh needs no Azure account or sign-in.

```bash
./build.sh data                 # full price snapshot, then latency
./build.sh data --arm           # also obtain region metadata through Azure CLI
python3 site/tools/refresh_data.py  # prices only
python3 site/tools/refresh_data.py --max-pages 20 --out .cache/price-test
```

The last command is a partial test run in a separate output folder, not a production snapshot. A full refresh follows pages of up to 1,000 price items and can take more than an hour, depending on throttling. The script retries throttled requests with backoff; no fixed request-rate guarantee is assumed. The `data` build target attempts latency even if pricing fails, while retaining a failure exit status.

[`site/tools/scrape_product_availability.py`](../site/tools/scrape_product_availability.py) separately scrapes Microsoft's [Product Availability by Region](https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table) page. It records product and SKU rows with per-region statuses (`generally_available`, `public_preview`, `retiring`, or `null`) and the separate non-regional status. It uses only the Python standard library and writes to `.cache/product-availability.json` by default:

```bash
python site/tools/scrape_product_availability.py
python site/tools/scrape_product_availability.py --html .cache/product-availability-source.html --out .cache/product-availability.json
```

The page is HTML, not a documented data API; the visible table is generated from an availability dataset embedded in the page's JavaScript. The scraper parses and validates those embedded records, stopping if the dataset shape or status values change unexpectedly. This is a separate exploratory snapshot and does not refresh prices or replace the Services tab's CSV catalog.

| File | Contents |
|---|---|
| `docs/data/retail-latest/meta.json` | Snapshot time, coverage, and partial-run status |
| `docs/data/retail-latest/catalog.json` | Regions and services with regional consumption meters |
| `docs/data/retail-latest/products.json` | Product-level regional meter coverage |
| `docs/data/retail-latest/pricing/<region>.json` | Regional price comparisons for each baseline region |
| `docs/data/availability-catalog-latest.json` | Independent CSV-derived services, products, SKUs, availability and AZ counts |
| `docs/data/availability-catalog-YYYY-MM.json` | Up to six monthly availability backups |
| `docs/data/retail-YYYY-MM/` | Up to six complete monthly retail backups |
| `docs/data/svcavail-retailprice.csv` | Canonical, manually maintained service-name mapping |
| `docs/data/service-pricing-map.json` | Generated browser-readable service-name mapping |
| `.cache/product-availability.json` | Scraped product/SKU availability by region (local exploratory output) |

The retail catalog's service/product masks describe consumption-meter coverage only; they do not drive the Services tab. Record verified corrections in the evidence or notes for qualification check 4.1; Services and Pricing are read-only snapshot views.

Prices are list prices in USD. Comparisons report the median percentage difference across meters present in both regions, with the matched-meter count. Spot, low-priority, dev/test, reservation, savings-plan prices, and negotiated discounts are excluded. These comparisons are not a workload cost estimate.

Geography, availability-zone support, pairing, access, and coordinates come from [`site/data/regions-seed.json`](../site/data/regions-seed.json), not the price API. Review that seed when Azure introduces regions. `--arm` requires Azure CLI and an authenticated account and reads `az account list-locations`; `--locations <file>` reads previously saved CLI JSON instead. The script reports regions lacking reference metadata.

## Latency

[`site/tools/refresh_latency.py`](../site/tools/refresh_latency.py) writes:

- `docs/data/latency.json`: region-to-region and ExpressRoute peering-location-to-region values.
- `docs/data/latency-cities.json`: city-to-peering-location estimates.

```bash
./build.sh latency
./build.sh latency --cache .cache/latency
python3 site/tools/refresh_latency.py --out .cache/latency-test
python3 site/tools/refresh_latency.py --min-pop 500000
```

The script downloads public files from GitHub, with no Azure sign-in. Cities include national and first-level capitals in countries with an Azure region or commercial peering location, plus other places with at least 1,000,000 residents by default; `--min-pop` changes that threshold.

Sources:

- [Azure network round-trip latency statistics](https://learn.microsoft.com/azure/networking/azure-network-latency): directional region-to-region P50 round trips, a 30-day median. `dataset` records the article's dataset date.
- [ExpressRoute locations and connectivity providers](https://learn.microsoft.com/azure/expressroute/expressroute-locations-providers): commercial peering locations and their local Azure regions.
- [Natural Earth](https://www.naturalearthdata.com/): public-domain populated places, including coordinates for peering metros and cities.

Only the first row below is a published measurement:

| Value | Source code | Method |
|---|---|---|
| Region pair in Microsoft's table | `m` | Published value copied unchanged |
| Region pair absent from the table | `d` | Distance estimate |
| Peering location to region through a local region | `l` | Estimated local hop plus published regional latency; smallest sum across local regions |
| Other peering-location-to-region values | `d` | Distance estimate, including the local hop alone |
| City to peering location | All values | Distance estimate |

Microsoft's source does not publish city or peering-location latency. These are planning estimates, not measured circuits or physical routes. The distance model is `3 ms + slope x great-circle km`, with a 1 ms floor. The slope is fitted to published regional pairs; the fixed 3 ms reflects the smallest published round trips between the Canberra regions. `model` in `latency.json` records the slope, `r2`, and median error. Route detours can produce much larger errors. Validate shortlisted paths from the customer's network; city-to-peering estimates cover only the provider leg.

Maintain regional `lat` and `lon` values in the seed file. The script reports unknown region names; regions lacking published measurements use estimates. Peering coordinates come from city-name matching in Natural Earth, with exceptions in `PEERING_PLACES`. Collection stops for unplaceable locations or locations more than 1,000 km from their local region, helping catch same-named cities in different countries.

## Review and publish a refresh

The [`Refresh retail prices` workflow](../.github/workflows/refresh-retail-prices.yml) runs on the **1st of every month at 06:00 UTC** and supports manual dispatch. It collects the full Retail Prices API snapshot and opens a pull request against the default branch for review; it never changes the availability catalog, service-name mapping, or latency. Scheduled runs begin only after the workflow is merged into the default branch and GitHub Actions is enabled. Schedule times are best-effort and can be delayed by GitHub.

In repository **Settings > Actions > General > Workflow permissions**, allow GitHub Actions to create pull requests. Organization policy must also permit the workflow's `contents: write` and `pull-requests: write` permissions. No Azure credentials or third-party PR action are required. This workflow does not merge or deploy its own results; merge the reviewed data PR and publish through the normal website process. GitHub may disable schedules in inactive public repositories after 60 days.

Review snapshot dates, coverage, source warnings, and the diff before committing `docs/data/`. Pricing data files are rewritten only when content changes, but `meta.json` records the refresh time. Latency files and their `generated` timestamp change only when the data changes. Latency collection stops without writing if a source loses more than one fifth of its rows relative to the existing snapshot.

`./build.sh site` preserves both catalogs; it does not refresh them. Publish approved `docs/data/` changes with the website. Each tab reports its own missing data independently: availability works without pricing, and a missing availability catalog never substitutes retail meter coverage.
