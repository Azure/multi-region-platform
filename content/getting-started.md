---
title: Get started with a multi-region platform
description: A six-step sequence to establish the first additional Azure regional options, from naming the drivers to onboarding the first workload.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Get started with a multi-region platform

Use this sequence to establish the first additional regional options. Start with one candidate region and the workloads that need it. The same process scales to a broader portfolio, and later regions reuse the decisions made for the first.

1. **Name the drivers.** Identify what is prompting the discussion: business growth, regulation, service or SKU availability, resiliency, a datacenter or connectivity event, cost, or another measurable requirement. See [common drivers](./index.md#common-drivers-of-multi-region-platform-discussions).
1. **Shortlist candidate regions.** Apply [business and geographic requirements](./business-and-geography.md) together with mandatory [data and compliance](./data-and-compliance.md) constraints. Remove regions that cannot satisfy mandatory conditions before investing in deeper technical assessment.
1. **Identify workload requirements and archetypes.** Start with known workloads and application portfolios. Validate representative dependencies and identify the closest-fitting [Workload Landing Zone archetypes](./application-landing-zone-archetypes.md). Establish planning guardrails where future workload requirements are not yet known. See [Workload requirements and dependencies](./workload-requirements.md).
1. **Qualify candidates against workload requirements.** Validate [regional capability and availability](./regional-capability.md): required services, models, SKUs, availability-zone support, dependencies, latency, pricing, regional access, and quota. Record each option as excluded, candidate, conditional, or qualified for the defined requirements, with evidence and revalidation triggers. See [Regional assessment outcome](./assessment-outcome.md).
1. **Enable the most efficient platform.** Select the regional [connectivity profile](./profile-selection.md), confirm the hybrid connectivity foundation, determine local versus remote shared services, and close the [platform-readiness](./platform-readiness.md) gaps required for the identified workloads. Agree [who decides what](./operating-model.md#who-decides-what) before the first workload arrives.
1. **Onboard the first workload.** Apply the [workload-placement process](./workload-placement.md) using current evidence. Revalidate regional capabilities at decision time, govern the placement and resiliency decisions, and feed newly discovered requirements or platform gaps back into regional qualification.

> [!TIP]
> **What success looks like:** Being able to qualify a regional option, enable only the platform capabilities it requires, and onboard workloads through a repeatable governed process.

## Related resources

- [Multi-region decision trees](./decision-trees.md)
- [Platform readiness checklist](./platform-readiness.md)
- [Using availability zones and regions](https://learn.microsoft.com/azure/well-architected/design-guides/regions-availability-zones) in the Azure Well-Architected Framework
