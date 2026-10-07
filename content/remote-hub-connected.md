---
title: "Prepare a region: Remote Hub Connected"
description: What to deploy to prepare a new Azure region for Remote Hub Connected — spokes that connect across regions to an existing hub, with no hub in the region — with recommendations, considerations, and links to the Azure networking guidance.
ms.date: 10/06/2026
ms.topic: conceptual
---

# Remote Hub Connected

Workload spokes in the region connect across regions to an existing geographic hub and use its gateways, firewall, DNS, and shared services. No hub is built in the region. Preparing the region means connecting its spokes to the hub you already operate.

## What you deploy

| Area | What to do | Guidance |
|---|---|---|
| Policy, address space, monitoring, backup, and keys | The same as for [Disconnected Spokes](./disconnected-spokes.md#what-you-deploy). Address space must not overlap the hub or the other spokes. | [Landing zone regions](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/considerations/regions#add-a-new-region-to-an-existing-landing-zone) |
| Landing-zone provisioning | Offer the region in subscription vending, with a spoke virtual network that the platform team connects to the remote hub. | [Subscription vending](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/subscription-vending) |
| Connection to the hub | Connect each spoke to the existing hub in the other region. See [Connect to the existing hub](#connect-to-the-existing-hub). | [Virtual network peering](https://learn.microsoft.com/azure/virtual-network/virtual-network-peering-overview) |
| Routing and inspection | Apply the same route tables as for spokes in the hub's own region, so that traffic reaches the hub firewall. | [Traditional Azure networking topology](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/traditional-azure-networking-topology) |
| Name resolution | Point the spokes at the DNS resolver or forwarders in the hub. The private DNS zones are global and don't change. | [DNS for on-premises and Azure resources](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/dns-for-on-premises-and-azure-resources) |
| Identity | Use the domain controllers in the hub region, if workloads need them. | [Hybrid identity in Azure landing zones](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/identity-access-active-directory-hybrid-identity) |
| Internet ingress | Public application ingress can stay in the region, with a web application firewall close to the workload. | [Plan for inbound and outbound internet connectivity](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/plan-for-inbound-and-outbound-internet-connectivity) |

## Connect to the existing hub

How you connect depends on the topology of the hub you already run:

- **Hub-and-spoke virtual networks.** Create global virtual network peering between each spoke and the hub virtual network. Turn on gateway transit when the spokes use the hub's VPN or ExpressRoute gateways. Gateway transit works over global peering.
- **Azure Virtual WAN.** Connect each spoke virtual network to the existing virtual hub. Virtual WAN supports connecting a virtual network in one region to a virtual hub in another, and describes it as a good option when the footprint is mostly in one region with a few remote spokes.

Check these limits before you rely on the connection:

- A spoke that uses remote gateways can't have its own gateway, and it can use the gateways of only one peering.
- ExpressRoute FastPath doesn't support global virtual network peering.
- Resources can't reach the front end of a basic load balancer across global peering.
- Peering isn't transitive. Spokes that peer to the same hub don't reach each other through peering alone; they route through the hub firewall or connect directly.

## Where shared services sit

- **Global:** management groups, access control, policy, and private DNS zones.
- **Remote:** gateways, firewall and egress, DNS resolution, domain controllers, and the log workspace, all from the geographic hub.
- **Local:** backup vaults, Key Vaults, and public application ingress where the workload needs it.

## Recommendations and considerations

- **Accept the dependency knowingly.** Microsoft's hub-spoke architecture guidance recommends at least one hub per region, with only same-region spokes connected to it, so that a failure in one region's hub doesn't affect other regions. This profile trades that isolation for speed and cost. Use it for workloads that can tolerate the dependency, and document how they behave if the geographic hub or cross-region connectivity is degraded or unavailable.
- **Measure before you commit.** Measure latency and bandwidth using representative traffic.
- **Count the cross-region cost.** Global virtual network peering carries traffic charges. Evaluate cross-region data-transfer cost, routing and transit behavior, and inspection paths.
- **Check the hub's capacity.** Evaluate geographic hub scale: gateway and firewall throughput, peering limits, and dependency criticality.
- **Agree who operates the path.** Agree operational ownership for the connection, routes, and DNS settings between the team that runs the hub and the teams in the new region.
- **Keep east-west traffic local where it matters.** For spokes in the region that exchange a lot of traffic, direct connectivity between them avoids a round trip through the remote hub. Limit it to spokes of the same environment and workload.

**Reassess when:** Cross-region traffic, latency, east-west communication, dependency criticality, regulatory requirements, scale, or availability coupling justify deploying selected connectivity or shared-service capabilities locally.

## Reference links

- [Use a VPN or ExpressRoute gateway in a different region](https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-different-region) — Gateway transit over global virtual network peering, with its requirements and limitations.
- [Global transit network architecture and Virtual WAN](https://learn.microsoft.com/azure/virtual-wan/virtual-wan-global-transit-network-architecture) — Cross-region virtual network connections to a virtual hub.
- [Hub-spoke network topology in Azure](https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke) — The recommendation of a hub per region, and connectivity between spokes.

## Next step

> [!div class="nextstepaction"]
> [Platform readiness checklist](./platform-readiness.md)
