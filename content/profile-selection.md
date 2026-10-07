---
title: Select the connectivity profile
description: Select one of the four regional connectivity profiles for a qualified Azure region, using the archetype-to-profile matrix, the selection principles, and the profile decision tree, and know when to reassess the selection.
ms.date: 10/06/2026
ms.topic: conceptual
---

# Select the connectivity profile

**Question:** What is the most efficient regional platform design that supports the identified requirements?

Determine how workloads in the region will reach geographic hubs, shared platform services, application dependencies, other Azure regions, and hybrid environments. Those connectivity and dependency requirements determine which [connectivity profile](./connectivity-profiles.md) fits: Disconnected Spokes, Remote Hub Connected, Minimal Regional Hub, or Full Regional Hub.

Start with the matrix to see which connectivity profiles each [archetype](./application-landing-zone-archetypes.md) typically uses. Then apply the selection principles and use the decision tree to pick the most efficient profile that meets the requirements.

:::image type="content" source="./media/archetype-profile-matrix.png" alt-text="Matrix of the four archetypes against the four connectivity profiles. Hybrid-connected and connected cloud-native or AI applications typically use remote hub, minimal hub, or full hub; isolated cloud-native or AI applications often use disconnected spokes and other profiles where justified; interconnected portfolios can use spoke-to-spoke connectivity, a remote hub where acceptable, and a minimal or full hub when justified." lightbox="./media/archetype-profile-matrix.png":::

*Archetype-to-profile relationships are many-to-many. Each row is a set of options, not an assignment; the selected profile follows dependencies, latency, traffic, resiliency, and independence requirements.*

## Profile selection principles

- Start with the **workload requirements and dependencies** identified during regional qualification, including portfolio-level dependencies. Use Workload Landing Zone archetypes to spot recurring needs, then validate the profile against the actual workloads.
- Select the **most efficient profile** that satisfies those requirements, not the maximum possible one.
- Keep capabilities remote when latency, dependency, data, security, resiliency, availability, and operational requirements permit. Add local capabilities only when a measurable requirement justifies the larger regional footprint; adoption growth alone doesn't.
- Consider direct spoke-to-spoke connectivity where workloads have significant east-west traffic and a hub transit path is unnecessary. Add regional routing, inspection, or shared services when broader requirements justify them.

## Which connectivity profile should this region provide?

Each question comes from the "fits when" criteria of the [connectivity profiles](./connectivity-profiles.md). Stop at the first profile that satisfies the requirements identified in [check 3](./workload-requirements.md#platform-and-connectivity-requirements).

:::image type="content" source="./media/connectivity-profile-decision-tree.png" alt-text="Decision tree with three questions. If workloads need no private access to enterprise services, use disconnected spokes. If they can tolerate the latency and coupling of another region, use remote-hub-connected spokes. If requirements do not justify a comprehensive local capability set, use a minimal regional hub; otherwise use a full regional hub." lightbox="./media/connectivity-profile-decision-tree.png":::

*Connectivity profile selection tree. Questions escalate from dependency, to tolerance of remote consumption, to required independence. The outcome is a platform capability, not a workload design.*

The same tree as a table, from the smallest regional footprint to the largest:

| Profile | Fits when the workloads expected in the region | What the region gets |
|---|---|---|
| [Disconnected Spokes](./disconnected-spokes.md) | Need no private access to enterprise services, on-premises systems, centralized security inspection, another application portfolio, or geographic-hub capabilities. | No hub and no gateway. Workload spokes use the estate's standard identity, policy, security, and deployment practices. |
| [Remote Hub Connected](./remote-hub-connected.md) | Need that access, and can tolerate the latency, availability coupling, and dependency on connectivity to another region. | No local hub. Workload spokes consume an existing geographic hub. |
| [Minimal Regional Hub](./minimal-regional-hub.md) | Need some capabilities locally, without a comprehensive local set. | A limited hub with only the services that must be local. Everything else stays remote. |
| [Full Regional Hub](./full-regional-hub.md) | Need a comprehensive local capability set, or independence from other hubs. | The complete local connectivity and shared services that the region's workloads require. |

Two of the four profiles need no local hub, and only the Full Regional Hub approaches the footprint of an existing geographic hub.

**Decision:** Select the most efficient regional platform connectivity profile that satisfies the identified requirements and can evolve as regional adoption changes.

## Considerations and reassessment by profile

Check these points before you settle on a profile, and revisit the profile when its reassessment trigger applies. Profiles can move in both directions.

### Disconnected Spokes

**Key considerations:** Validate administration, identity, DNS, secrets, telemetry, data movement, software distribution, private endpoints, incident response, and support procedures. Where applications require east-west communication within the region, evaluate direct spoke-to-spoke connectivity without assuming that a regional hub is required. Confirm that no hidden dependency requires connectivity to a geographic hub or on-premises environment.

**Reassess when:** Workloads require private access to enterprise services, centralized security inspection, on-premises systems, another application portfolio, or capabilities hosted through a geographic hub.

### Remote Hub Connected

**Key considerations:** Measure latency and bandwidth using representative traffic. Evaluate cross-region data-transfer cost, routing and transit behavior, inspection paths, geographic hub scale, dependency criticality, and operational ownership. Document how workloads behave if the geographic hub or cross-region connectivity is degraded or unavailable.

**Reassess when:** Cross-region traffic, latency, east-west communication, dependency criticality, regulatory requirements, scale, or availability coupling justify deploying selected connectivity or shared-service capabilities locally.

### Minimal Regional Hub

**Key considerations:** Clearly define which capabilities operate locally and which remain remote. Avoid ambiguous routing, overlapping responsibilities, and unnecessary duplication of platform controls. Validate workload and operational behavior when either local capabilities or remote dependencies are unavailable. When connectivity to on-premises environments is required, determine whether existing ExpressRoute circuits and gateway topology can provide the required reachability before introducing additional circuits; do not assume that each Azure region requires a dedicated ExpressRoute circuit.

**Reassess when:** Workload growth introduces additional local connectivity or shared-service requirements, multiple interconnected application portfolios require broader regional capabilities, stricter independence requirements emerge, significant hybrid connectivity is required locally, or other requirements justify expanding the regional platform footprint.

### Full Regional Hub

**Key considerations:** Confirm that the required level of independence justifies the additional cost and operational scope. Validate automation, observability, support ownership, security operations, configuration consistency, dependency behavior, and lifecycle management. Where on-premises connectivity is required, determine whether existing ExpressRoute circuits can provide the required reachability and resiliency before introducing additional connectivity.

**Reassess when:** Workload demand or requirements decrease, services can be safely centralized, dependencies change, or the full regional footprint no longer provides sufficient value relative to its cost and operational complexity.

## What each step up costs

Greater local capability and independence usually increase fixed platform cost and operational scope, but they can reduce cross-region dependencies, latency exposure, and availability coupling.

:::image type="content" source="./media/profile-cost-tradeoff.png" alt-text="Chart plotting the four profiles on a rising curve: fixed platform cost and operational scope increase with local capability and independence, from disconnected spokes through remote-hub-connected and minimal regional hub to full regional hub, while cross-region transfer and availability coupling decrease." lightbox="./media/profile-cost-tradeoff.png":::

*A qualitative trade-off, not a price list.*

## Next step

> [!div class="nextstepaction"]
> [Place shared services](./platform-enablement-connectivity.md)
