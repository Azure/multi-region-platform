---
title: "Dimension 2: Data and compliance"
description: Determine whether anticipated workloads and their data can operate in a candidate Azure region, and exclude regions that can't satisfy mandatory requirements.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Data and compliance

**Question:** Are we allowed to operate here?

Determine whether anticipated workloads and their data can operate in the region. Consider data residency and sovereignty, regulatory and industry requirements, company policy, customer commitments, support access, encryption requirements, and restrictions on data movement or operational control.

**Decision:** Exclude a region when it cannot satisfy a mandatory data, compliance, or policy requirement.

## How the first two dimensions filter the portfolio

The first two dimensions act as filters. Business value decides whether a region merits deeper assessment; mandatory data, compliance, and policy requirements decide whether it can be used at all. Only regions that pass both proceed to workload, capability, and platform analysis.

:::image type="content" source="./media/dimensions-1-2-filter.png" alt-text="Funnel showing many candidate regions filtered first by business value, where regions without value receive no deeper assessment, and then by mandatory data and compliance requirements, where failing regions are excluded; the remaining regions proceed to dimensions 3 to 5." lightbox="./media/dimensions-1-2-filter.png":::

*The first two dimensions filter the portfolio before deeper technical assessment.*

## Reference links

- [Data residency in Azure](https://azure.microsoft.com/explore/global-infrastructure/data-residency/) — Explains customer-data location, geographic boundaries, and service-specific exceptions.
- [Azure compliance documentation](https://learn.microsoft.com/azure/compliance/) — References for regional, industry-specific, and global compliance requirements.
- [Reliability and sovereignty in Azure](https://learn.microsoft.com/azure/reliability/concept-reliability-sovereignty) — Connects sovereignty requirements to regional selection, backup and replication destinations, encryption, and operational control.

## Next step

> [!div class="nextstepaction"]
> [Workload requirements and dependencies](./workload-requirements.md)
