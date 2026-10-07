---
title: Prepare the region overview
description: Build what the regional design record says, through the landing-zone automation you already run. See what each connectivity profile adds in a new Azure region, what is global and needs no action, and the order of work.
ms.date: 10/06/2026
ms.topic: conceptual
---

# Prepare the region overview

Preparing a region is a targeted change to the platform you already run, not a new landing zone. You build only what the selected connectivity profile and shared-service placement call for, through your existing landing-zone automation. For two of the four profiles there is no hub to build.

## What each profile adds

| Profile | What you add in the region | What you reuse |
|---|---|---|
| [Disconnected Spokes](./disconnected-spokes.md) | The region in policy and in landing-zone provisioning. Workload spokes with their own internet ingress and egress. No hub, no gateway, no peering. | Governance, identity, policy, monitoring, and automation. |
| [Remote Hub Connected](./remote-hub-connected.md) | The same, plus a cross-region connection from each spoke to an existing hub, with routing and DNS settings. No hub. | An existing geographic hub: its gateways, firewall, DNS, and shared services. |
| [Minimal Regional Hub](./minimal-regional-hub.md) | The same, plus a hub in the region with only the components you selected. | The geographic hub, for everything you didn't make local. |
| [Full Regional Hub](./full-regional-hub.md) | The same, plus a complete hub in the region. | The landing-zone foundation and, where they meet requirements, the existing ExpressRoute circuits. |

The Cloud Adoption Framework already describes how to [add a new region to an existing landing zone](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/considerations/regions#add-a-new-region-to-an-existing-landing-zone), including a new hub in the region. That path is the Full Regional Hub. The other three profiles do part of it, for regions whose workloads need less.

## What is global and needs no action

Most of the landing zone isn't tied to a region:

- **Management groups, subscriptions, and access control.** No action. Don't create management groups to model regions.
- **Policy.** Definitions and assignments apply everywhere. Update only the assignments that restrict allowed locations, so that they admit the new region.
- **Private DNS zones.** They are global. Create them once and link virtual networks to them.
- **Platform subscriptions.** Use the existing connectivity and identity subscriptions, with a new resource group for the region.

## Order of work

The order is the same for every profile. The profile decides how much each item contains.

1. **Allow the region in policy**, for the workload requirements it is qualified for.
1. **Reserve address space** that doesn't overlap the rest of the estate, even for Disconnected Spokes.
1. **Build the network part** that the profile calls for: nothing, connections to an existing hub, or a hub.
1. **Extend the shared services** that must be local, such as DNS forwarding or domain controllers.
1. **Turn on landing-zone provisioning** for the region, so that workload teams receive spokes that match the profile.
1. **Extend operations**: monitoring, security coverage, backup, and runbooks.
1. **Run the [platform readiness checklist](./platform-readiness.md).**

## Profiles coexisting across one estate

Different profiles can coexist across the estate. A region's profile changes only when workload and platform requirements change, not because regions are expected to progress along a maturity path.

:::image type="content" source="./media/profiles-coexisting-estate.png" alt-text="Illustrative estate: on-premises datacenters connect to two strategic geographic hubs in regions A and B. Region C runs a minimal regional hub that reuses an existing ExpressRoute circuit, region D runs a minimal hub without an on-premises path, regions E and F use remote-hub-connected spokes, region G uses disconnected spokes, and region H is a candidate not yet enabled." lightbox="./media/profiles-coexisting-estate.png":::

*An illustrative estate. Two strategic hubs provide resilient hybrid connectivity; other regions consume what they need. Region C's minimal hub reaches on-premises by reusing an existing ExpressRoute circuit; region D's does not. Both are valid. Names and placements are examples only.*

## When the region is ready

A region is **ready for workloads** when the required capability set is in place through standard automation, its open conditions are resolved, and every applicable item on the [platform readiness checklist](./platform-readiness.md) is true. Workloads can then onboard without platform exceptions.

## In this section

- [Disconnected Spokes](./disconnected-spokes.md), [Remote Hub Connected](./remote-hub-connected.md), [Minimal Regional Hub](./minimal-regional-hub.md), and [Full Regional Hub](./full-regional-hub.md): what to deploy for each profile.
- [Platform readiness checklist](./platform-readiness.md): what must be true before workloads arrive.

## Reference links

- [Landing zone regions](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/considerations/regions) — How to add a region to an existing landing zone, area by area.
- [Management groups](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/resource-org-management-groups) — Why the management group structure doesn't change for more regions.
- [Subscription vending](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/subscription-vending) — Automated provisioning of application landing zones, including their networking.

## Next step

> [!div class="nextstepaction"]
> [Disconnected Spokes](./disconnected-spokes.md)
