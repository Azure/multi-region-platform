---
title: Get started with a multi-region platform
description: A six-step sequence to establish the first additional Azure regional options, from naming the drivers to placing the first workload.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Get started with a multi-region platform

Use this sequence to establish the first additional regional options. Start with one candidate region and the workloads that need it. The same process scales to a broader portfolio, and later regions reuse the decisions made for the first.

1. **Name the drivers.** Identify what is prompting the discussion: business growth, regulation, service or SKU availability, resiliency, a datacenter or connectivity event, cost, or another measurable requirement. See [common drivers](./framework-overview.md#common-drivers-of-multi-region-platform-discussions).
1. **Understand the concepts.** Learn how a [multi-region platform differs from a multi-region workload](./platform-and-workload.md), the four [connectivity profiles](./connectivity-profiles.md) a region can provide, and the four [Workload Landing Zone archetypes](./application-landing-zone-archetypes.md) that describe what applications need. You make no decisions here. You learn the terms the next steps use.
1. **Shortlist and qualify candidate regions.** Work through the four [qualification checks](./regional-qualification.md). Start with the two that need no technical assessment, [business and geography](./business-and-geography.md) and [data and compliance](./data-and-compliance.md), and remove regions that cannot satisfy mandatory conditions. For the regions that remain, identify [workload requirements and dependencies](./workload-requirements.md), then validate [regional capability and availability](./regional-capability.md). Record each option as excluded, candidate, conditional, or qualified for the defined requirements, with evidence and revalidation triggers. See [Assessment outcome](./regional-qualification.md#assessment-outcome).
1. **Select the regional design.** For each qualified region, select the most efficient [connectivity profile](./profile-selection.md#which-connectivity-profile-should-this-region-provide) that meets the requirements, decide [where each shared service is provided](./platform-enablement-connectivity.md), and confirm whether the [hybrid connectivity](./hybrid-connectivity.md) you already have is enough. Write the three choices into the [regional design record](./platform-architecture.md#the-regional-design-record), and agree who owns each decision.
1. **Prepare the region.** Build what the record says, through the automation you already run. Read only the page for the profile you selected: [Disconnected Spokes](./disconnected-spokes.md), [Remote Hub Connected](./remote-hub-connected.md), [Minimal Regional Hub](./minimal-regional-hub.md), or [Full Regional Hub](./full-regional-hub.md). Use the [platform readiness checklist](./platform-readiness.md) to confirm the region is ready before the first workload arrives.
1. **Place the first workload.** Apply the [workload-placement process](./workload-placement.md) using current evidence. Revalidate regional capabilities at decision time, govern the placement and resiliency decisions, and feed newly discovered requirements or platform gaps back into regional qualification.

> [!TIP]
> **What success looks like:** Being able to qualify a regional option, enable only the platform capabilities it requires, and onboard workloads through a repeatable governed process.

## Related resources

- [Regional qualification decision tree](./regional-qualification.md#should-this-region-be-qualified)
- [Using availability zones and regions](https://learn.microsoft.com/azure/well-architected/design-guides/regions-availability-zones) in the Azure Well-Architected Framework

## Next step

> [!div class="nextstepaction"]
> [Multi-region platform and multi-region workload](./platform-and-workload.md)
