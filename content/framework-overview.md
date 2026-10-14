---
title: Framework overview
description: The drivers, principles, planning constructs, and adoption journey behind an adaptable multi-region Azure platform that extends the Azure landing zones you already run.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Framework overview

This guidance shows how to reuse the Azure landing-zone foundation you already run so that additional regions become **qualified options that workloads can use selectively**, without creating separate governance models or reproducing an identical platform footprint in every region.

The objective is not to prebuild every capability everywhere. It is to keep one operating model, qualify regional options against known business and workload requirements, and enable only the platform capabilities that each region needs.

## Extend Azure landing zones for adaptable regional placement

Azure landing zones provide a governed foundation for identity, connectivity, security, management, and application delivery. Many organizations initially establish this foundation around a small, fixed set of Azure regions, typically a primary region and a disaster-recovery region, reflecting traditional datacenter and colocation design. This model works while demand and placement requirements remain predictable. It becomes less adaptable as business expansion, data boundaries, service and AI availability, latency requirements, and other regional conditions evolve.

## Common drivers of multi-region platform discussions

Multi-region platform work rarely starts as an architecture initiative. It usually starts with a change in the business, regulation, workload requirements, service availability, or risk. These drivers open the discussion; they do not determine the regional architecture or workload-placement outcome.

:::image type="content" source="./media/common-drivers.png" alt-text="Six drivers feed into a multi-region platform discussion. Business growth and proximity: new markets or geographies, acquisitions or divestitures, products closer to customers, and user latency. Data residency, sovereignty, and regulation: data-residency laws, operational resilience requirements, customer contracts, and public-sector requirements. Service, AI model, SKU, and quota availability: AI models and GPU SKUs, services in selected regions only, quota constraints, and availability-zone requirements. Resiliency and concentration risk: RTO or RPO requirements, concentration risk, paired or nonpaired regions, audit or regulatory findings, and lessons from incidents. Datacenter and connectivity events: datacenter or colocation exits, migration waves, office or datacenter moves, network-provider changes, and a new Azure region in the geography. Cost and operating model: regional price differences, cross-region transfer cost, landing-zone redesign, unnecessary infrastructure, and sustainability objectives. The drivers open the discussion but don't determine the outcome, which is decided by qualifying regions, selecting the regional design, preparing the region, and placing workloads." lightbox="./media/common-drivers.png":::

> [!NOTE]
> This guidance covers Azure public-cloud regions. Sovereign cloud offerings and Azure Local have their own constraints and aren't covered, although the same qualification logic can inform them.

## Principles and constructs

Three principles apply in every region. Three planning constructs put them into practice.

:::row:::
   :::column:::
      **Extend, do not replicate**

      New regions add only the platform capabilities required by the workloads expected to use them, rather than replicating an existing regional footprint.
   :::column-end:::
   :::column:::
      **Keep platform readiness and workload placement separate**

      Regional qualification determines whether a region can become a viable platform option. Placement occurs later, when a specific workload and its current requirements are known. Placement, relocation, recovery, and multi-region operation remain workload-specific decisions.
   :::column-end:::
   :::column:::
      **Keep the operating model consistent while allowing regional adaptation**

      Implementation can vary where business, workload, or regulatory requirements call for it. Region-agnostic does not mean region-random.
   :::column-end:::
:::row-end:::

Because platform teams cannot predict every future workload, this guidance uses three planning constructs.

- **[Regional Platform Connectivity Profiles](./connectivity-profiles.md)** describe what the platform provides in a region: Disconnected Spokes, Remote Hub Connected, Minimal Regional Hub, or Full Regional Hub. They are not maturity stages; the most efficient profile can remain the target as long as it continues to satisfy requirements.
- **[Workload Landing Zone archetypes](./application-landing-zone-archetypes.md)** group recurring dependency and connectivity characteristics so platform teams can plan before every workload is known. The four archetypes are Hybrid-Connected Applications, Isolated Cloud-Native or AI Applications, Connected Cloud-Native or AI Applications, and Interconnected Application Portfolios.
- **[Regional qualification](./regional-qualification.md)** provides a repeatable way to assess candidate regions. Four checks lead to an excluded, candidate, conditional, or qualified regional option, backed by current evidence, known constraints, ownership, and review triggers.

:::image type="content" source="./media/three-planning-constructs.png" alt-text="Diagram showing the three constructs — Regional Platform Connectivity Profiles, Workload Landing Zone archetypes, and regional qualification with its four checks — converging into governed regional options, which workloads revalidate at onboarding to remain in place, deploy net-new, relocate, recover elsewhere, or operate across active regions." lightbox="./media/three-planning-constructs.png":::

*How the three constructs connect. Archetypes (application requirements) and connectivity profiles (platform capability) stay distinct; together with regional qualification they produce governed options.*

Together, these constructs create governed regional options without predetermining workload placement. During onboarding, teams revalidate the region against the workload's current dependencies and requirements, then decide whether to stay put, deploy net-new, relocate, recover elsewhere, or operate across regions.

## Progressive adoption journey

The journey below shows the recommended sequence for adopting regional options. It is not a mandatory maturity path; platform capabilities and workload use evolve only when business and application requirements justify them.

:::image type="content" source="./media/progressive-adoption-journey.png" alt-text="Four-step journey: extend the platform to create regional options, place net-new growth in qualified regions, selectively rebalance movable workloads, and improve workload resiliency with recovery or active-active deployments where justified." lightbox="./media/progressive-adoption-journey.png":::

*A progressive journey for multi-region adoption. Regional options are created first and consumed selectively; a platform can stop at any step that continues to meet requirements.*

## Design for continuing regional choice

No organization can predict which Azure regions will offer the best mix of services, regulatory fit, business proximity, and workload suitability several years from now. Design the platform so that perfect prediction is unnecessary.

> The goal is not to select the perfect two regions. It is to make additional regions significantly easier to adopt when business and workload requirements justify them.

## Next step

> [!div class="nextstepaction"]
> [Multi-region platform and multi-region workload](./platform-and-workload.md)
