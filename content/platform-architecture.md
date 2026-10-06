---
title: Capabilities and connectivity profile overview
description: Decide what the platform provides in a qualified Azure region — which capabilities are local, remote, or centralized, whether existing hybrid connectivity is sufficient, and which regional platform connectivity profile fits — using the archetype-to-profile matrix, the selection principles, and the profile decision tree.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Capabilities and connectivity profile overview

This step is a set of decisions, not a deployment. For each qualified region, you decide what the platform provides there. Nothing is built yet: deployment follows later, through the automation you already run.

You make three decisions. Each follows from the workloads you expect in the region, not from the footprint of an existing hub.

- **[Platform capabilities](./platform-enablement-connectivity.md#platform-capabilities).** Which shared services and operational capabilities are provided in the region, consumed from another region, or kept centralized?
- **[Hybrid connectivity](./platform-enablement-connectivity.md#resilient-hybrid-connectivity).** Is the hybrid connectivity you already have sufficient, or does a requirement justify a change?
- **[Connectivity profile](#which-connectivity-profile-should-this-region-provide).** Which of the four profiles is the most efficient one that meets the requirements?

Start with the matrix to see which [connectivity profiles](./connectivity-profiles.md) each [archetype](./application-landing-zone-archetypes.md) typically uses. Then apply the selection principles and use the decision tree to pick the most efficient profile that meets the requirements.

:::image type="content" source="./media/archetype-profile-matrix.png" alt-text="Matrix of the four archetypes against the four connectivity profiles. Hybrid-connected and connected cloud-native or AI applications typically use remote hub, minimal hub, or full hub; isolated cloud-native or AI applications often use disconnected spokes and other profiles where justified; interconnected portfolios can use spoke-to-spoke connectivity, a remote hub where acceptable, and a minimal or full hub when justified." lightbox="./media/archetype-profile-matrix.png":::

*Archetype-to-profile relationships are many-to-many. Each row is a set of options, not an assignment; the selected profile follows dependencies, latency, traffic, resiliency, and independence requirements.*

## Profile selection principles

- Start with the **workload requirements and dependencies** identified during regional qualification, including portfolio-level dependencies.
- Use Workload Landing Zone archetypes to spot recurring connectivity and shared-service needs, then validate the profile against the actual workloads.
- Select the **most efficient profile** that satisfies those requirements, not the maximum possible one.
- Keep capabilities remote when latency, dependency, data, security, resiliency, availability, and operational requirements permit. Add local capabilities only when a measurable requirement justifies the larger regional footprint.
- Consider direct spoke-to-spoke connectivity where workloads have significant east-west traffic and a hub transit path is unnecessary. Add regional routing, inspection, or shared services when broader requirements justify them.

## Which connectivity profile should this region provide?

Start from the workload requirements and dependencies identified in [check 3](./workload-requirements.md#platform-and-connectivity-requirements). Each question comes from the "fits when" criteria of the [connectivity profiles](./connectivity-profiles.md); stop at the first profile that satisfies the identified requirements.

:::image type="content" source="./media/connectivity-profile-decision-tree.png" alt-text="Decision tree with three questions. If workloads need no private access to enterprise services, use disconnected spokes. If they can tolerate the latency and coupling of another region, use remote-hub-connected spokes. If requirements do not justify a comprehensive local capability set, use a minimal regional hub; otherwise use a full regional hub." lightbox="./media/connectivity-profile-decision-tree.png":::

*Connectivity profile selection tree. Questions escalate from dependency, to tolerance of remote consumption, to required independence. The outcome is a platform capability, not a workload design.*

The same tree as a table, from the smallest regional footprint to the largest:

| Profile | Fits when the workloads expected in the region | What the region gets |
|---|---|---|
| Disconnected Spokes | Need no private access to enterprise services, on-premises systems, centralized security inspection, another application portfolio, or geographic-hub capabilities. | No hub and no gateway. Workload spokes use the estate's standard identity, policy, security, and deployment practices. |
| Remote Hub Connected | Need that access, and can tolerate the latency, availability coupling, and dependency on connectivity to another region. | No local hub. Workload spokes consume an existing geographic hub. |
| Minimal Regional Hub | Need some capabilities locally, without a comprehensive local set. | A limited hub with only the services that must be local. Everything else stays remote. |
| Full Regional Hub | Need a comprehensive local capability set, or independence from other hubs. | The complete local connectivity and shared services that the region's workloads require. |

Two of the four profiles need no local hub, and only the Full Regional Hub approaches the footprint of an existing geographic hub.

**Decision:** Select the most efficient regional platform connectivity profile that satisfies the identified requirements and can evolve as regional adoption changes.

Profiles evolve in both directions. Reassess a region's profile when the trigger below applies. For the full considerations, see [Profile considerations and hub implementations](./profile-selection.md#considerations-and-reassessment-by-profile).

| Current profile | Reassess when |
|---|---|
| Disconnected Spokes | Workloads require private access to enterprise services, inspection, on-premises systems, another portfolio, or hub capabilities. |
| Remote Hub Connected | Cross-region traffic, latency, east-west communication, dependency criticality, regulation, scale, or availability coupling justify local capabilities. |
| Minimal Regional Hub | Growth adds local requirements, interconnected portfolios need broader capabilities, independence requirements become stricter, or significant local hybrid connectivity is required. |
| Full Regional Hub | Demand or requirements decrease, services can be safely centralized, dependencies change, or the footprint no longer justifies its cost. |

## In this section

- [Platform capabilities and connectivity](./platform-enablement-connectivity.md): which capabilities the region needs, whether existing hybrid connectivity is sufficient, and how workloads reach hubs and shared services.
- [Profile considerations and hub implementations](./profile-selection.md): the considerations for each profile, what each step up costs, and how hubs are built.
- [Platform readiness checklist](./platform-readiness.md): what must be true before workloads arrive.

## Next step

> [!div class="nextstepaction"]
> [Platform capabilities and connectivity](./platform-enablement-connectivity.md)
