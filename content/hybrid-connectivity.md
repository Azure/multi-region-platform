---
title: Confirm hybrid connectivity
description: Decide whether the ExpressRoute, VPN, or SD-WAN connectivity you already have is enough for a new Azure region, and what justifies a change. A new region doesn't by itself require another circuit.
ms.date: 10/06/2026
ms.topic: conceptual
---

# Confirm hybrid connectivity

**Question:** Does the operating geography have resilient hybrid connectivity to Azure that satisfies the identified workload requirements?

Enabling an additional Azure region doesn't by itself require another ExpressRoute circuit. Evaluate the existing ExpressRoute, VPN, SD-WAN, or other hybrid connectivity against datacenter and user locations, latency, bandwidth, and routing requirements. Add circuits, peering locations, gateways, or more connectivity paths only where the existing foundation can't provide the required reachability, diversity, or resilience.

The outcome is one of three:

| Outcome | When |
|---|---|
| **Not required** | The region uses Disconnected Spokes, or its workloads need no private path to on-premises locations. |
| **Reuse** | The existing circuits, gateways, and peering locations meet the reachability, latency, bandwidth, routing, and resilience that the workloads in the new region need. |
| **Change** | A requirement can't be met by the existing foundation: diversity, failure-domain isolation, latency, bandwidth, routing, or resiliency. Record the requirement and the change it justifies. |

## How a new region reuses what exists

- **A gateway in another region can serve the new region.** Global virtual network peering supports gateway transit, so spokes in the new region can use the gateways of an existing hub.
- **An existing circuit can connect to a gateway in the new region.** An ExpressRoute circuit can connect virtual networks in the same geopolitical region, and across geopolitical regions with the premium add-on. A hub in the new region doesn't need a circuit of its own.
- **Azure Virtual WAN extends in the same way.** A virtual network in the new region can connect to an existing virtual hub in another region, or a new virtual hub in the region can connect to the existing circuits.

## When a change is justified

- **The foundation doesn't meet resiliency recommendations today.** Microsoft recommends ExpressRoute circuits from more than one peering location, so that a peering-location outage isn't a single point of failure. A new region is a reason to check this, not a reason to add a circuit for each region.
- **On-premises locations or users are far from the existing peering locations.** Measure latency on the real path before you decide.
- **Bandwidth or gateway capacity is exhausted.** Check the circuit and gateway sizes against the traffic the new region adds.
- **Workloads need a capability that doesn't work across regions.** For example, ExpressRoute FastPath doesn't support global virtual network peering, so workloads that rely on it need a gateway in their own region.
- **The region must keep its on-premises path when another region is unavailable.** That requirement points to a local gateway, and usually to a Full Regional Hub.

**Decision:** Confirm the hybrid connectivity foundation and identify any required changes to reachability, resiliency, diversity, scale, or ownership.

## Reference links

- [Connectivity to Azure](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/connectivity-to-azure) — Landing-zone recommendations for ExpressRoute and VPN, including circuits from different peering locations and zone-redundant gateways.
- [Designing for disaster recovery with ExpressRoute private peering](https://learn.microsoft.com/azure/expressroute/designing-for-disaster-recovery-with-expressroute-privatepeering) — Resilient connectivity from on-premises locations to Azure, including peering-location diversity, redundant paths, and failover.
- [Use a VPN or ExpressRoute gateway in a different region](https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-different-region) — Gateway transit over global virtual network peering, with its requirements and limitations.
- [Traditional Azure networking topology](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/traditional-azure-networking-topology) — How hubs in several regions share ExpressRoute circuits.
- [Global transit network architecture and Virtual WAN](https://learn.microsoft.com/azure/virtual-wan/virtual-wan-global-transit-network-architecture) — Cross-region virtual network connections and hub-to-hub transit.

## Next step

> [!div class="nextstepaction"]
> [Prepare the region overview](./prepare-region.md)
