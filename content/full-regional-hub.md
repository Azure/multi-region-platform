---
title: "Prepare a region: Full Regional Hub"
description: What to deploy to prepare a new Azure region with a Full Regional Hub — a complete hub that can keep operating when other hubs are unavailable — with the order of work, hub design options, recommendations, and links to the Azure landing zone guidance.
ms.date: 10/06/2026
ms.topic: conceptual
---

# Full Regional Hub

The region gets a complete hub: local connectivity, inspection, DNS, identity, and the other shared services its workloads need. It can keep operating when other hubs are unavailable. This is the path that the Cloud Adoption Framework describes for adding a region to an existing landing zone, so most of the work is documented there. A Full Regional Hub uses the same operating model and control baselines as your other hubs. It doesn't have to be an identical copy.

## What you deploy

Start with what every profile needs: the region in policy, address space, landing-zone provisioning, monitoring, backup, and keys. See [Disconnected Spokes](./disconnected-spokes.md#what-you-deploy). Then build the hub in this order.

| Step | Hub-and-spoke virtual networks | Azure Virtual WAN |
|---|---|---|
| 1. Hub | In the existing connectivity subscription, create a resource group and a hub virtual network in the region. | In the existing Virtual WAN, create a virtual hub in the region. |
| 2. Inspection | Deploy Azure Firewall or network virtual appliances in the hub. | Deploy Azure Firewall or a supported appliance in the virtual hub, with routing intent and routing policies. |
| 3. Hybrid connectivity | Deploy VPN or ExpressRoute gateways and connect them, reusing existing circuits where they meet requirements. | Deploy the gateways in the virtual hub and connect them. |
| 4. Connection to other hubs | Peer the new hub virtual network with the other hub virtual networks. | Automatic between hubs of the same Virtual WAN. |
| 5. Routing | Configure Azure Route Server or user-defined routes. | Configure any static routes the virtual hub needs. |
| 6. Name resolution | Deploy DNS forwarders for the region and link them to the private DNS zones. | Deploy them in a spoke connected to the virtual hub. |
| 7. Identity | In the identity subscription, create a virtual network in the region, peer it to the hub, and deploy domain controllers if workloads need them. | The same. |
| 8. Spokes | Peer workload spokes in the region to the new hub. | Connect them to the new virtual hub. |

For the detail of each step, follow [Add a new region to an existing landing zone](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/considerations/regions#add-a-new-region-to-an-existing-landing-zone).

## Hub design options

Profiles describe capability, not a specific network build. The same profile can be implemented in different ways:

| Implementation example | Description |
|---|---|
| Azure Firewall hub | Platform-native routing, traffic inspection, and egress services implemented with Azure Firewall and related Azure networking capabilities. |
| NVA firewall hub | Third-party network virtual appliances provide routing, inspection, or security functions. |
| SD-WAN-integrated hub | Branch, datacenter, and cloud connectivity are integrated through the organization's SD-WAN architecture. |
| Separate transit and security functions | Transit, hybrid connectivity, routing, and security inspection are separated where scale, ownership, or architecture requirements justify it. |

> [!NOTE]
> Any of these designs can sit behind a Minimal or Full Regional Hub. Profiles can be implemented using hub-and-spoke virtual networks, Azure Virtual WAN, or other approved Azure networking patterns. Topology determines how the capability is implemented; workload and platform requirements determine which profile is appropriate.

## Connect the hub to the rest of the estate

- **Two regions.** Connect the hub virtual networks with global virtual network peering.
- **More than two regions.** Connect the hub virtual networks in each region to the same ExpressRoute circuits, or use Azure Virtual WAN for managed transit between regions.
- **A few workloads across regions.** Connect the landing-zone virtual networks that need each other directly with global peering, instead of routing all traffic through the hubs.

## Where shared services sit

- **Global:** management groups, access control, policy, and private DNS zones.
- **Local:** gateways, firewall and egress, DNS resolution, domain controllers, backup vaults, and Key Vaults.
- **Local or remote:** the log workspace. Start with the existing workspace unless data must stay in the region.

## Recommendations and considerations

- **Confirm the hub is justified.** Confirm that the required level of independence justifies the additional cost and operational scope.
- **Reuse circuits before you add them.** Where on-premises connectivity is required, determine whether existing ExpressRoute circuits can provide the required reachability and resiliency before introducing additional connectivity.
- **Build hybrid connectivity to the resiliency recommendations.** Use circuits from more than one peering location and zone-redundant gateways where the region supports them.
- **Remove the dependencies you built the hub to avoid.** A full hub that still resolves names, authenticates, or sends egress through another region isn't independent. Test the region with the other hubs unavailable.
- **Plan inspection between regions.** When hubs share ExpressRoute circuits, spokes in different regions can learn routes to each other and bypass the firewalls. Use route tables to send that traffic through the firewall where it must be inspected.
- **Operate it like the other hubs.** Validate automation, observability, support ownership, security operations, configuration consistency, dependency behavior, and lifecycle management.

**Reassess when:** Workload demand or requirements decrease, services can be safely centralized, dependencies change, or the full regional footprint no longer provides sufficient value relative to its cost and operational complexity.

## Reference links

- [Traditional Azure networking topology](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/traditional-azure-networking-topology) — A regional hub per region, connections between hubs, and cross-region inspection.
- [Virtual WAN network topology](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/virtual-wan-network-topology) — A virtual hub per region, secured hubs, and routing intent.
- [Connectivity to Azure](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/connectivity-to-azure) — ExpressRoute and VPN recommendations for landing zones.
- [Hub-spoke network topology in Azure](https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke) — The reference architecture for a hub and its shared services.
- [DNS for on-premises and Azure resources](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/dns-for-on-premises-and-azure-resources) — DNS private resolver in the hub.

## Next step

> [!div class="nextstepaction"]
> [Platform readiness checklist](./platform-readiness.md)
