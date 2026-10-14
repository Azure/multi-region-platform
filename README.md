# Adaptable multi-region Azure platform

Extend the Azure landing-zone foundation you already run so that additional Azure regions become **qualified options for workloads**, without creating separate governance models or copying an identical platform footprint into every region.

This repository provides guidance and a browser-based planning workbook for platform and workload teams. It helps you qualify candidate regions, choose the connectivity and shared services each region needs, prepare the platform, and make workload-specific placement decisions. Enabling a region does not require moving workloads or deploying every workload across multiple regions.

## Explore the guidance

- **[Read the guidance](https://azure.github.io/multi-region-platform/)** or start with [Getting started](https://azure.github.io/multi-region-platform/getting-started.html).
- **[Use the region planning workbook](https://azure.github.io/multi-region-platform/region-planner.html)** to compare regions, record qualification evidence and regional designs, and export to Excel or save a JSON planning record.
- Download the [whitepaper](https://azure.github.io/multi-region-platform/downloads/Adaptable-Multi-Region-Azure-Platform.pdf) or [executive brief](https://azure.github.io/multi-region-platform/downloads/Adaptable-Multi-Region-Azure-Platform-Executive-Brief.pdf).

The scope is Azure public-cloud regions. This is guidance and planning tooling, not a deployable landing-zone implementation or a guarantee of service availability. Availability is inferred from a published pricing snapshot; prices and estimated latency are planning inputs that must be revalidated for a workload.

## Work with the repository

The primary article text lives in [`content/`](content/). Website tooling lives in [`site/`](site/), and GitHub Pages serves the generated [`docs/`](docs/) folder. The repository also contains editable whitepaper, PowerPoint, and Word-generation sources.

| Task | Guide |
|---|---|
| Write or update articles, diagrams, and related formats; prepare a CAF export | [Authoring and maintaining the guidance](guides/authoring.md) |
| Generate the website, PDFs, decks, or Word edition; publish the site | [Building and publishing](guides/building.md) |
| Collect Azure service-availability indicators, prices, region metadata, and latency | [Azure data collection](guides/azure-data.md) |
| Maintain the planning workbook and geography views | [Region planning workbook](guides/region-planner.md) |

## Contribute and report issues

Contributions and feedback are welcome. See [Contributing](CONTRIBUTING.md) for the workflow and Microsoft Contributor License Agreement. Use [GitHub issues](https://github.com/Azure/multi-region-platform/issues) for non-security bugs, documentation corrections, and suggestions. **Do not post security vulnerabilities publicly**; follow [Security](SECURITY.md).

This project follows the [Microsoft Open Source Code of Conduct](CODE_OF_CONDUCT.md) and is licensed under the [MIT License](LICENSE). Third-party assets retain their own terms, and the license does not grant rights to Microsoft or other trademarks; see [Contributing](CONTRIBUTING.md#license-and-trademarks).
