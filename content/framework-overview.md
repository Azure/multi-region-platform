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

An adaptable multi-region platform extends Azure landing zones without creating separate governance structures or identical infrastructure in every region. The same operating model applies across the estate, while each region is qualified against the workloads it may need to support.

## Common drivers of multi-region platform discussions

Multi-region platform work rarely starts as an architecture initiative. It usually starts with a change in the business, regulation, workload requirements, service availability, or risk. These drivers open the discussion; they do not determine the regional architecture or workload-placement outcome.

| Driver | Typical triggers |
|---|---|
| Business growth and proximity | Expansion into new markets or geographies; acquisitions or divestitures that introduce estates in other regions; digital products that must be closer to customers; user-latency requirements. |
| Data residency, sovereignty, and regulation | New or changing data-residency laws; industry requirements for operational resilience or concentration risk; customer contracts; public-sector requirements. |
| Service, AI model, SKU, and quota availability | AI models, GPU SKUs, or Azure services available only in selected regions; quota constraints; availability-zone requirements. |
| Resiliency and concentration risk | RTO or RPO requirements that the existing regional design cannot satisfy; concentration-risk concerns; paired or nonpaired-region considerations; audit or regulatory findings; lessons from incidents. |
| Datacenter and connectivity events | Datacenter or colocation exits; migration waves; office or datacenter moves; network-provider changes; a new Azure region opening within the required geography. |
| Cost and operating model | Regional price differences and cross-region transfer cost; landing-zone redesigns or platform refreshes; opportunities to reduce unnecessary regional infrastructure; sustainability objectives. |

> [!NOTE]
> This guidance covers Azure public-cloud regions. Sovereign cloud offerings and Azure Local have their own constraints and aren't covered, although the same qualification logic can inform them.

## Principles and constructs

Three principles apply in every region. Three planning constructs put them into practice.

:::row:::
   :::column:::
      **Extend, do not replicate**

      The landing-zone operating model stays consistent across the Azure estate. New regions add only the most efficient platform capabilities required by the workloads expected to use them, rather than replicating an existing regional footprint.
   :::column-end:::
   :::column:::
      **Keep platform readiness and workload placement separate**

      Regional qualification determines whether a region can become a viable platform option. Placement occurs later, when a specific workload and its current requirements are known. Placement, relocation, recovery, and multi-region operation remain workload-specific decisions.
   :::column-end:::
   :::column:::
      **Keep the operating model consistent while allowing regional adaptation**

      The operating model stays consistent across regions; implementation can vary where business, workload, or regulatory requirements call for it. Region-agnostic does not mean region-random.
   :::column-end:::
:::row-end:::

Because platform teams cannot predict every future workload, this guidance uses three planning constructs.

- **[Regional Platform Connectivity Profiles](./connectivity-profiles.md)** describe what the platform provides. A region can use Disconnected Spokes, Remote Hub Connected, Minimal Regional Hub, or Full Regional Hub. These profiles are not maturity stages. The most efficient profile can remain the target as long as it continues to satisfy requirements; add local capabilities only when a measurable need for connectivity, latency, resiliency, security, data handling, or operations justifies them. Hybrid connectivity and regional workload connectivity are related but separate decisions, so adopting another region does not by itself require duplicating the existing connectivity platform.
- **[Workload Landing Zone archetypes](./application-landing-zone-archetypes.md)** group recurring dependency and connectivity characteristics so platform teams can plan before every workload is known. Archetypes describe what applications require. The four archetypes are Hybrid-Connected Applications, Isolated Cloud-Native or AI Applications, Connected Cloud-Native or AI Applications, and Interconnected Application Portfolios. Use known requirements for advance planning; defer implementation details that do not affect regional qualification to workload onboarding.
- **[Regional qualification](./regional-qualification.md)** provides a repeatable way to assess candidate regions. Four checks evaluate business and geographic need, data and compliance boundaries, workload requirements and dependencies, and regional capabilities. The result is an excluded, candidate, conditional, or qualified regional option, backed by current evidence, known constraints, ownership, and review triggers. Qualification creates a governed regional option; it does not permanently approve the region for every workload.

:::image type="content" source="./media/three-planning-constructs.png" alt-text="Diagram showing the three constructs — Regional Platform Connectivity Profiles, Workload Landing Zone archetypes, and regional qualification with its four checks — converging into governed regional options, which workloads revalidate at onboarding to remain in place, deploy net-new, relocate, recover elsewhere, or operate across active regions." lightbox="./media/three-planning-constructs.png":::

*How the three constructs connect. Archetypes (application requirements) and connectivity profiles (platform capability) stay distinct; together with regional qualification they produce governed options.*

Together, these constructs create governed regional options without predetermining workload placement. During onboarding, teams revalidate the region against the workload's current dependencies and requirements, then decide whether to stay put, deploy net-new, relocate, recover elsewhere, or operate across regions. Migration and resiliency remain workload-specific. The framework makes later regional adoption easier without trying to predict the final estate up front.

> The goal is not to select the perfect two regions. It is to make additional regions significantly easier to adopt when business and workload requirements justify them.

## Progressive adoption journey

The journey below shows the recommended sequence for adopting regional options. It is not a mandatory maturity path; platform capabilities and workload use evolve only when business and application requirements justify them.

:::image type="content" source="./media/progressive-adoption-journey.png" alt-text="Four-step journey: extend the platform to create regional options, place net-new growth in qualified regions, selectively rebalance movable workloads, and improve workload resiliency with recovery or active-active deployments where justified." lightbox="./media/progressive-adoption-journey.png":::

*A progressive journey for multi-region adoption. Regional options are created first and consumed selectively; a platform can stop at any step that continues to meet requirements.*

## Design for continuing regional choice

No organization can predict which Azure regions will offer the best mix of services, regulatory fit, business proximity, and workload suitability several years from now. Design the platform so that perfect prediction is unnecessary.

- **Consistent operating model:** Keep the landing-zone guardrails and operating standards stable across the Azure estate.
- **Adaptable regional platform:** Strategic geographic hubs, resilient hybrid connectivity, and regional connectivity profiles allow capabilities to be distributed according to workload requirements without requiring an identical platform footprint in every region.
- **Workload-led placement:** Qualified regional options, Workload Landing Zone archetypes, and current workload requirements allow applications to use the regional and platform capabilities appropriate to their needs.

This framework extends Azure landing-zone principles rather than replacing them. Regional adoption, workload placement, platform expansion, and resiliency can evolve without redesigning the broader platform for every new region.

## Next step

> [!div class="nextstepaction"]
> [Multi-region platform and multi-region workload](./platform-and-workload.md)
