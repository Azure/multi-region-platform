---
title: Profile selection and hub implementations
description: Principles for choosing a regional connectivity profile, what each step up in local capability costs, how profiles coexist across an estate, and how hubs are implemented.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Profile selection and hub implementations

This article covers how to choose a regional connectivity profile, what each step up in local capability costs, how profiles coexist across an estate, and how hubs are implemented. To make the choice as a sequence of questions, use the [connectivity profile decision tree](./decision-trees.md#which-connectivity-profile-should-this-region-provide).

## Profile selection principles

- Start with the **workload requirements and dependencies** identified during regional qualification, including portfolio-level dependencies.
- Use Workload Landing Zone archetypes to spot recurring connectivity and shared-service needs, then validate the profile against the actual workloads.
- Select the **most efficient profile** that satisfies those requirements.
- Keep capabilities remote when latency, dependency, data, security, resiliency, and operational requirements permit. Add local capabilities only when a measurable requirement justifies the larger regional footprint.
- Consider direct spoke-to-spoke connectivity where workloads have significant east-west traffic and a hub transit path is unnecessary. Add regional routing, inspection, or shared services when broader requirements justify them.

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
