---
title: Profile selection and hub implementations
description: What each increase in local platform capability costs, how hubs are implemented in practice, and principles for choosing and evolving a regional connectivity profile.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Profile selection and hub implementations

Regional connectivity profiles describe capability, not a specific network build. Two questions matter in practice: what each increase in local capability costs to run, and how the selected hub capabilities are implemented in your organization.

## How the profiles trade local capability for platform scope

Greater local capability and independence usually increase fixed platform cost and operational scope, but they can reduce cross-region dependencies, latency exposure, and availability coupling.

There is no required progression between profiles. Select the most efficient profile for current requirements and add local capabilities only when a measurable need justifies them.

:::image type="content" source="./media/profile-cost-tradeoff.png" alt-text="Chart plotting the four profiles on a rising curve: fixed platform cost and operational scope increase with local capability and independence, from disconnected spokes through remote-hub-connected and minimal regional hub to full regional hub, while cross-region transfer and availability coupling decrease." lightbox="./media/profile-cost-tradeoff.png":::

*A qualitative trade-off, not a price list.*

## Hub implementations vary between organizations

| Implementation example | Description |
|---|---|
| Azure Firewall hub | Platform-native routing, traffic inspection, and egress services implemented with Azure Firewall and related Azure networking capabilities. |
| NVA firewall hub | Third-party network virtual appliances provide routing, inspection, or security functions. |
| SD-WAN-integrated hub | Branch, datacenter, and cloud connectivity are integrated through the organization's SD-WAN architecture. |
| Separate transit and security functions | Transit, hybrid connectivity, routing, and security inspection are separated where scale, ownership, or architecture requirements justify it. |

:::image type="content" source="./media/hub-implementations.png" alt-text="Four hub implementation examples, each shown as workload spokes above a hub layer: an Azure Firewall hub, an NVA firewall hub, an SD-WAN-integrated hub, and separate transit and security functions." lightbox="./media/hub-implementations.png":::

*The profiles are implementation-neutral. Any of these hub designs can sit behind a strategic, minimal, or full regional hub.*

> [!NOTE]
> The connectivity profiles can be implemented using hub-and-spoke virtual networks, Azure Virtual WAN, or other approved Azure networking patterns. Topology determines how the required capability is implemented; workload and platform requirements determine which profile is appropriate.

## Profile selection principles

- Start with the **workload requirements and dependencies** identified during regional qualification, including application-portfolio dependencies and relevant architecture characteristics.
- Use Application Landing Zone archetypes as a planning abstraction to help identify recurring connectivity and shared-service requirements; validate the selected profile against actual workload requirements.
- Select the **most efficient regional connectivity profile** that satisfies the identified requirements.
- Keep capabilities remote when latency, dependency, data, security, resiliency, availability, and operational characteristics permit. Deploy capabilities locally only when a measurable workload or platform requirement justifies the additional regional footprint.
- Consider direct spoke-to-spoke connectivity where workloads require significant east-west communication and a hub transit path is unnecessary. Introduce regional routing, inspection, or shared services when broader connectivity or platform requirements justify them.
- Allow different profiles to coexist across the estate. Profiles should evolve only when workload and platform requirements change, not because a region is expected to progress through a predefined maturity path.
- A connectivity profile defines the platform capabilities available in a region. Workload placement, profile evolution, and future qualification remain separate decisions.

## Profiles coexisting across one estate

:::image type="content" source="./media/profiles-coexisting-estate.png" alt-text="Illustrative estate: on-premises datacenters connect to two strategic geographic hubs in regions A and B. Region C runs a minimal regional hub that reuses an existing ExpressRoute circuit, region D runs a minimal hub without an on-premises path, regions E and F use remote-hub-connected spokes, region G uses disconnected spokes, and region H is a candidate not yet enabled." lightbox="./media/profiles-coexisting-estate.png":::

*An illustrative estate. Two strategic hubs provide resilient hybrid connectivity; other regions consume what they need. Region C's minimal hub reaches on-premises by reusing an existing ExpressRoute circuit; region D's does not. Both are valid. Names and placements are examples only.*

## Next step

> [!div class="nextstepaction"]
> [Platform readiness checklist](./platform-readiness.md)
