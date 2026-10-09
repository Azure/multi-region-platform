# Contributing

Contributions to the guidance, planning workbook, and build tooling are welcome.

## Before you start

Use [GitHub issues](https://github.com/Azure/multi-region-platform/issues) for documentation corrections, non-security bugs, and feature suggestions. Discuss substantial changes before implementing them. Include the affected article or tool, current behavior, expected behavior, and reproducible steps where relevant. Do not include credentials, customer planning records, or other confidential information.

For security vulnerabilities, follow [SECURITY.md](SECURITY.md) rather than opening a public issue. Participation in this project is governed by the [Microsoft Open Source Code of Conduct](CODE_OF_CONDUCT.md).

## Submit a change

1. Create a branch or fork and make a focused change.
2. Follow the [authoring guide](guides/authoring.md) for content and cross-format updates, the [build guide](guides/building.md) for generation and checks, and the [data guide](guides/azure-data.md) for snapshot changes.
3. Edit source files, not generated website pages in `docs/`. Rebuild the affected outputs and include the corresponding generated website changes. Data snapshots are generated separately by the refresh scripts.
4. Open a pull request explaining the purpose, affected formats, and checks performed. Cite authoritative sources for Azure behavior and distinguish published data from estimates.

## Contributor License Agreement

Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit [https://cla.opensource.microsoft.com](https://cla.opensource.microsoft.com).

When you submit a pull request, the CLA bot will determine whether you need to provide a CLA and decorate the PR appropriately. Follow the bot's instructions. You only need to do this once across repositories using Microsoft's CLA.

## License and trademarks

Repository code and documentation are available under the [MIT License](LICENSE), except where separately noted. Preserve existing third-party notices and licenses, including the [Open Sans SIL Open Font License](whitepaper/fonts/OFL-OpenSans.txt). Natural Earth datasets used by the maps and location tooling are [public domain](https://www.naturalearthdata.com/about/terms-of-use/); data fetched from other external sources remains subject to those sources' terms.

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to [Microsoft's Trademark and Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks). Modified versions must not cause confusion or imply Microsoft sponsorship. Use of third-party trademarks or logos is subject to those third parties' policies. The MIT License does not grant trademark rights.
