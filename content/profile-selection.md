---
title: Profile considerations and hub implementations
description: What to check for each regional connectivity profile, when to reassess it, what each step up in local capability costs, how profiles coexist across an estate, and how hubs are implemented.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Profile considerations and hub implementations

Check these points before you settle on a regional connectivity profile, and revisit the profile when its reassessment trigger applies. For what each profile is, see [Common connectivity profiles](./connectivity-profiles.md). To select a profile, use the [selection principles](./platform-architecture.md#profile-selection-principles) and the [connectivity profile decision tree](./platform-architecture.md#which-connectivity-profile-should-this-region-provide) on the Overview.

## Considerations and reassessment by profile

Profiles can move in both directions.

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

## Profiles coexisting across one estate

Different profiles can coexist across the estate. A region's profile changes only when workload and platform requirements change, not because regions are expected to progress along a maturity path.

:::image type="content" source="./media/profiles-coexisting-estate.png" alt-text="Illustrative estate: on-premises datacenters connect to two strategic geographic hubs in regions A and B. Region C runs a minimal regional hub that reuses an existing ExpressRoute circuit, region D runs a minimal hub without an on-premises path, regions E and F use remote-hub-connected spokes, region G uses disconnected spokes, and region H is a candidate not yet enabled." lightbox="./media/profiles-coexisting-estate.png":::

*An illustrative estate. Two strategic hubs provide resilient hybrid connectivity; other regions consume what they need. Region C's minimal hub reaches on-premises by reusing an existing ExpressRoute circuit; region D's does not. Both are valid. Names and placements are examples only.*

## Hub implementations vary between organizations

Profiles describe capability, not a specific network build. The same profile can be implemented in different ways:

| Implementation example | Description |
|---|---|
| Azure Firewall hub | Platform-native routing, traffic inspection, and egress services implemented with Azure Firewall and related Azure networking capabilities. |
| NVA firewall hub | Third-party network virtual appliances provide routing, inspection, or security functions. |
| SD-WAN-integrated hub | Branch, datacenter, and cloud connectivity are integrated through the organization's SD-WAN architecture. |
| Separate transit and security functions | Transit, hybrid connectivity, routing, and security inspection are separated where scale, ownership, or architecture requirements justify it. |

> [!NOTE]
> Any of these designs can sit behind a Minimal or Full Regional Hub. Profiles can be implemented using hub-and-spoke virtual networks, Azure Virtual WAN, or other approved Azure networking patterns. Topology determines how the capability is implemented; workload and platform requirements determine which profile is appropriate.

## Next step

> [!div class="nextstepaction"]
> [Platform readiness checklist](./platform-readiness.md)
