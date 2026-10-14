---
title: "Prepare a region: Disconnected Spokes"
description: What to deploy to prepare a new Azure region for Disconnected Spokes — no hub, no gateway, and no peering — with recommendations, considerations, and links to the Azure landing zone guidance for each area.
ms.date: 10/06/2026
ms.topic: conceptual
---

# Disconnected Spokes

Workload spokes run in the region with no private connectivity to a hub, another Azure region, or an on-premises environment. There is no hub to build. Preparing the region means letting the landing zone you already run accept it.

In the Azure landing zone architecture, these spokes are *online* landing zones: workloads that use direct internet connectivity, or that don't need a virtual network, and that don't connect to the corporate network through a hub.

## What you deploy

| Area | What to do | Guidance |
|---|---|---|
| Policy | Add the region to any policy assignment that restricts allowed locations. | [Landing zone regions](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/considerations/regions#add-a-new-region-to-an-existing-landing-zone) |
| Management groups and access control | Nothing. Place the subscriptions under the management group you use for landing zones without corporate connectivity. | [Management groups](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/resource-org-management-groups) |
| Landing-zone provisioning | Offer the region in subscription vending, with a spoke virtual network that isn't peered to a hub, or with no virtual network. | [Subscription vending](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/subscription-vending) |
| Address space | Assign address space that doesn't overlap the rest of the estate. | [Platform readiness checklist](./platform-readiness.md#network-foundation) |
| Internet egress and ingress | Give each spoke explicit outbound connectivity, such as a NAT gateway. Protect inbound HTTP and HTTPS with a web application firewall. | [Plan for inbound and outbound internet connectivity](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/plan-for-inbound-and-outbound-internet-connectivity) |
| Name resolution | Use Azure-provided DNS. For private endpoints, link the spoke virtual network to the private DNS zones it needs. | [Private Link and DNS integration at scale](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/private-link-and-dns-integration-at-scale) |
| Monitoring and security | Send logs to the existing workspace, or to a workspace in the region when data must stay there. Extend security posture and threat detection to the region. | [Design a Log Analytics workspace architecture](https://learn.microsoft.com/azure/azure-monitor/logs/workspace-design) |
| Backup and keys | Create backup vaults and Key Vaults in the region. | [Storage, backup, and Key Vault](./storage-backup-key-vault.md) |

## Where shared services sit

- **Global:** management groups, access control, policy, and private DNS zones.
- **Remote:** the log workspace, unless data residency requires one in the region.
- **Local:** backup vaults, Key Vaults, and each spoke's own egress and ingress.
- **Not used:** a hub firewall, hybrid connectivity gateways, DNS forwarders, and domain controllers.

## Recommendations and considerations

- **Keep address space unique.** A spoke that isn't peered today can move to a connected profile later only if its address space doesn't overlap.
- **Plan outbound access explicitly.** New virtual networks default to private subnets, without default outbound access. A NAT gateway is the recommended method for most workloads that don't need a firewall.
- **Decide who owns private DNS zones.** A disconnected spoke can't use a DNS resolver in a hub. Its virtual network needs its own links to the private DNS zones for the private endpoints it uses, whether those zones are the central ones or zones that the workload owns.
- **Plan operator access.** Without a hub there is no shared management path. Decide how operators reach workloads, for example with Azure Bastion in the spoke.
- **Check identity.** Workloads authenticate with Microsoft Entra ID. A workload that needs domain controllers doesn't fit this profile.
- **Connect spokes directly only where needed.** Where applications in the region need east-west communication, evaluate direct spoke-to-spoke connectivity without assuming that a regional hub is required. Limit it to spokes of the same environment and workload.
- **Validate the operating procedures.** Validate administration, identity, DNS, secrets, telemetry, data movement, software distribution, private endpoints, incident response, and support procedures.
- **Look for hidden dependencies.** Confirm that no hidden dependency requires connectivity to a geographic hub or on-premises environment.

**Reassess when:** Workloads require private access to enterprise services, centralized security inspection, on-premises systems, another application portfolio, or capabilities hosted through a geographic hub.

## Reference links

- [Default outbound access in Azure](https://learn.microsoft.com/azure/virtual-network/ip-services/default-outbound-access) — Private subnets and the explicit outbound methods.
- [DNS for on-premises and Azure resources](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/dns-for-on-premises-and-azure-resources) — Name resolution when only Azure resolution is required.
- [Hub-spoke network topology in Azure](https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke) — Direct connectivity between spokes.

## Next step

> [!div class="nextstepaction"]
> [Platform readiness checklist](./platform-readiness.md)
