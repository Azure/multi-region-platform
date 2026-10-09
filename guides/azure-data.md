# Azure data collection

The [region planning workbook](region-planner.md) loads published snapshots from `docs/data/`, not live Azure APIs. Data collection happens through maintainer-run scripts, separate from browser use and the normal build.

Run the commands below from the repository root in Bash. Both refresh scripts use only the Python standard library and require Python 3.10 or later. In PowerShell, use the direct equivalents `python site\tools\refresh_data.py` and `python site\tools\refresh_latency.py` with the same flags.

## Service-availability indicators and pricing

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

The page is HTML, not a documented data API; the visible table is generated from an availability dataset embedded in the page's JavaScript. The scraper parses and validates those embedded records, stopping if the dataset shape or status values change unexpectedly. This is a separate exploratory snapshot and does not refresh prices or replace the pricing-derived availability data.

| File | Contents |
|---|---|
| `docs/data/meta.json` | Snapshot time, coverage, and partial-run status |
| `docs/data/catalog.json` | Regions and services with regional consumption meters |
| `docs/data/products.json` | Product-level regional meter coverage |
| `docs/data/pricing/<region>.json` | Regional price comparisons for each baseline region |
| `.cache/product-availability.json` | Scraped product/SKU availability by region (local exploratory output) |

**Availability is inferred from pricing, not collected as an authoritative service inventory.** A service or product is listed when it has a regional consumption meter. Confirm [products available by region](https://azure.microsoft.com/explore/global-infrastructure/products-by-region/), the required SKU and features, preview status, quota, and subscription access before making a placement decision. Record verified corrections in the evidence or notes for qualification check 4.1; Services and Pricing are read-only snapshot views.

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

There is currently **no checked-in daily refresh workflow**. Run the scripts manually, or add a reviewed scheduled workflow separately; references to `.github/workflows/refresh-data.yml` in script comments are not evidence that automation is installed.

Review snapshot dates, coverage, source warnings, and the diff before committing `docs/data/`. Pricing data files are rewritten only when content changes, but `meta.json` records the refresh time. Latency files and their `generated` timestamp change only when the data changes. Latency collection stops without writing if a source loses more than one fifth of its rows relative to the existing snapshot.

`./build.sh site` preserves the snapshot; it does not refresh it. Publish approved `docs/data/` changes with the website. Without a snapshot, the workbook uses seeded regions and shows "No data" for Services and Pricing.
