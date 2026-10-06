---
title: Get started with a multi-region platform
description: A five-step sequence to establish the first additional Azure regional options, from naming the drivers to placing the first workload.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Get started with a multi-region platform

Use this sequence to establish the first additional regional options. Start with one candidate region and the workloads that need it. The same process scales to a broader portfolio, and later regions reuse the decisions made for the first.

1. **Name the drivers.** Identify what is prompting the discussion: business growth, regulation, service or SKU availability, resiliency, a datacenter or connectivity event, cost, or another measurable requirement. See [common drivers](./framework-overview.md#common-drivers-of-multi-region-platform-discussions).
1. **Understand the concepts.** Learn how a [multi-region platform differs from a multi-region workload](./platform-and-workload.md), the four [connectivity profiles](./connectivity-profiles.md) a region can provide, and the four [Workload Landing Zone archetypes](./application-landing-zone-archetypes.md) that describe what applications need. You make no decisions here. You learn the terms the next steps use.
1. **Shortlist and qualify candidate regions.** Work through the four [qualification checks](./regional-qualification.md). Start with the two that need no technical assessment: [business and geographic requirements](./business-and-geography.md) and mandatory [data and compliance](./data-and-compliance.md) constraints. Remove regions that cannot satisfy mandatory conditions before investing in deeper technical assessment. For the regions that remain, identify [workload requirements and dependencies](./workload-requirements.md): start with known workloads and application portfolios, validate representative dependencies, identify the closest-fitting archetypes, and establish planning guardrails where future workload requirements are not yet known. Then validate [regional capability and availability](./regional-capability.md): required services, models, SKUs, availability-zone support, dependencies, latency, pricing, regional access, and quota. Record each option as excluded, candidate, conditional, or qualified for the defined requirements, with evidence and revalidation triggers. See [Regional assessment outcome](./regional-qualification.md#assessment-outcome).
1. **Select capabilities and connectivity profile.** For each qualified region, determine local versus remote shared services, confirm the hybrid connectivity foundation, and select the most efficient [connectivity profile](./platform-architecture.md#which-connectivity-profile-should-this-region-provide) that meets the requirements. Use the [platform readiness checklist](./platform-readiness.md) to plan the gaps to close for the identified workloads, and agree who owns each decision before the first workload arrives. See [Select capabilities and connectivity profile](./platform-architecture.md).
1. **Place the first workload.** Apply the [workload-placement process](./workload-placement.md) using current evidence. Revalidate regional capabilities at decision time, govern the placement and resiliency decisions, and feed newly discovered requirements or platform gaps back into regional qualification.

> [!TIP]
> **What success looks like:** Being able to qualify a regional option, enable only the platform capabilities it requires, and onboard workloads through a repeatable governed process.

## Related resources

- [Regional qualification decision tree](./regional-qualification.md#should-this-region-be-qualified)
- [Connectivity profile decision tree](./platform-architecture.md#which-connectivity-profile-should-this-region-provide)
- [Platform readiness checklist](./platform-readiness.md)
- [Using availability zones and regions](https://learn.microsoft.com/azure/well-architected/design-guides/regions-availability-zones) in the Azure Well-Architected Framework

## Next step

> [!div class="nextstepaction"]
> [Multi-region platform and multi-region workload](./platform-and-workload.md)
