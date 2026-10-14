---
title: "Prepare a region: Minimal Regional Hub"
description: What to deploy to prepare a new Azure region with a Minimal Regional Hub — a hub that holds only the components its workloads need and takes the rest from a geographic hub — with optional components, example compositions, recommendations, and links to the Azure landing zone guidance.
ms.date: 10/06/2026
ms.topic: conceptual
---

# Minimal Regional Hub

A Minimal Regional Hub is a hub in the region that holds only what its workloads need locally. Everything else comes from a geographic hub. It isn't a fixed design. Which components are local is a choice for each region. The fewer components you make local, the faster the region is ready and the less it costs to run.

## The base

Every Minimal Regional Hub has the same base:

- A hub in the region, in the connectivity subscription you already use, with a new resource group for the region. The hub is a hub virtual network, or a virtual hub in your existing Azure Virtual WAN.
- A connection from that hub to the geographic hub.
- Connections from the spokes in the region to the local hub.
- The routing that sends traffic to the right hub.

## Optional components

Add a component only when a workload requirement calls for it in the region.

| Component | Make it local when | Keep it remote when | Guidance |
|---|---|---|---|
| ExpressRoute or VPN gateway | Workloads need an on-premises path from the region for latency, bandwidth, or independence. The gateway can connect to an existing circuit. | On-premises traffic is light or tolerates the path through the geographic hub. | [Confirm hybrid connectivity](./hybrid-connectivity.md) |
| Azure Firewall or network virtual appliance | Traffic between spokes in the region is heavy, internet egress must leave from the region, or data must be inspected inside a boundary. | Inspection in the geographic hub meets latency, cost, and data requirements. | [Plan for inbound and outbound internet connectivity](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/plan-for-inbound-and-outbound-internet-connectivity) |
| DNS private resolver or forwarders | Name resolution for the region must not depend on the link to another region. | Spokes can use the resolver in the geographic hub. | [DNS for on-premises and Azure resources](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/dns-for-on-premises-and-azure-resources) |
| Domain controllers | Applications authenticate against them often, or must keep working when the other region is unavailable. | Authentication traffic is light and tolerates the dependency. | [Hybrid identity in Azure landing zones](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/identity-access-active-directory-hybrid-identity) |
| Other shared services | A requirement for latency, residency, or independence names the service. | No requirement names it. | [Place shared services](./platform-enablement-connectivity.md) |

## Example compositions

These are examples, not designs to copy. Each follows from a workload reason.

- **Local on-premises path.** A hub with an ExpressRoute gateway connected to an existing circuit. Inspection, DNS, and identity stay in the geographic hub. The reason is latency-sensitive traffic to a nearby datacenter.
- **Local inspection and egress.** A hub with a firewall and DNS forwarding, and no on-premises path of its own. The reason is heavy traffic between spokes in the region, or internet egress that must leave from the region.
- **Local shared services only.** A hub virtual network that hosts DNS forwarding and connects to domain controllers in the region, with no firewall and no gateway. The reason is applications that must keep authenticating and resolving names when the link to the other region is down.

## What you deploy

| Area | What to do | Guidance |
|---|---|---|
| Policy, address space, landing-zone provisioning, monitoring, backup, and keys | The same as for [Disconnected Spokes](./disconnected-spokes.md#what-you-deploy), with spokes that connect to the local hub. | [Landing zone regions](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/considerations/regions#add-a-new-region-to-an-existing-landing-zone) |
| Hub (the base) | Create the hub virtual network or virtual hub, connect it to the geographic hub, connect the spokes, and configure routing. | [Traditional Azure networking topology](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/traditional-azure-networking-topology) or [Virtual WAN network topology](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/virtual-wan-network-topology) |
| Optional components | Deploy the components that must be local, in the same order as for a [Full Regional Hub](./full-regional-hub.md#what-you-deploy): inspection, gateways, name resolution, then identity. | [Landing zone regions](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/considerations/regions#add-a-new-region-to-an-existing-landing-zone) |

## Hub design

The same choices apply as for a full hub, on a smaller scale:

- **Topology.** Hub-and-spoke virtual networks or Azure Virtual WAN. Use the topology the rest of the estate uses.
- **Inspection.** Azure Firewall or a third-party network virtual appliance, if the hub has inspection at all.
- **Transit.** Integrated in the hub, or part of the organization's SD-WAN.

For the options in full, see [hub design options](./full-regional-hub.md#hub-design-options).

## Recommendations and considerations

- **Write down the split.** Clearly define which capabilities operate locally and which remain remote. Avoid ambiguous routing, overlapping responsibilities, and unnecessary duplication of platform controls.
- **Plan the on-premises path when the hub has no gateway.** Virtual network peering isn't transitive, so spokes don't reach the geographic hub's gateways through the local hub automatically. Connect a gateway in the local hub to an existing circuit, peer the spokes that need the path to the geographic hub as well and use its gateways, or use Virtual WAN, which provides transit between hubs. Routing through network virtual appliances in both hubs is possible, but the region's address space must then be advertised to on-premises.
- **Reuse circuits before you add them.** When connectivity to on-premises environments is required, determine whether existing ExpressRoute circuits and gateway topology can provide the required reachability before introducing additional circuits; do not assume that each Azure region requires a dedicated ExpressRoute circuit.
- **Test both failure directions.** Validate workload and operational behavior when either local capabilities or remote dependencies are unavailable.
- **Watch for inspection being bypassed.** When hubs in different regions share ExpressRoute circuits, spokes in different regions can learn routes to each other and bypass the firewalls. Plan route tables so that traffic between regions is inspected where it must be.
- **Know which profile you have.** The hub is minimal as long as the region still depends on a geographic hub for something. When it can keep operating without the other hubs, it is a Full Regional Hub, and its cost and operating scope should be planned as one.

**Reassess when:** Workload growth introduces additional local connectivity or shared-service requirements, multiple interconnected application portfolios require broader regional capabilities, stricter independence requirements emerge, significant hybrid connectivity is required locally, or other requirements justify expanding the regional platform footprint.

## Reference links

- [Landing zone regions](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/considerations/regions) — The steps to add a hub in a new region. A minimal hub uses the steps for the components it includes.
- [Use a VPN or ExpressRoute gateway in a different region](https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-different-region) — Using the gateways of another hub over global peering, and the limits.
- [Hub-spoke network topology in Azure](https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke) — What a hub hosts and how spokes connect.

## Next step

> [!div class="nextstepaction"]
> [Platform readiness checklist](./platform-readiness.md)
