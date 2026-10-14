---
title: Place shared services
description: Decide where each shared service is provided for a qualified Azure region — local, remote from another hub, or global — starting from a default for each connectivity profile and changing it only when a workload requirement says so.
ms.date: 10/06/2026
ms.topic: conceptual
---

# Place shared services

**Question:** Where is each shared service that the workloads depend on provided?

Determine which shared services and operational capabilities must be provided in the region, consumed from another region, or remain centralized. Each service has one of three placements:

- **Local:** deployed in the region.
- **Remote:** consumed from a hub or a shared instance in another region. Record which one.
- **Global:** not tied to a region. There is nothing to deploy.

## Default placement by profile

The table gives a starting point for each profile. The defaults aren't rules: change a cell when a workload requirement calls for it, and record the reason. For a Minimal Regional Hub, each row is a separate choice.

| Shared service | Disconnected Spokes | Remote Hub Connected | Minimal Regional Hub | Full Regional Hub |
|---|---|---|---|---|
| Management groups, access control, policy | Global | Global | Global | Global |
| Private DNS zones | Global | Global | Global | Global |
| DNS resolution across premises (private resolver or forwarders) | Not required | Remote | Local or remote | Local |
| Traffic inspection and internet egress (Azure Firewall or network virtual appliance) | Not required | Remote | Local or remote | Local |
| Hybrid connectivity gateways (ExpressRoute or VPN) | Not required | Remote | Local or remote | Local |
| Directory services (domain controllers) | Not required | Remote | Local or remote | Local |
| Log workspace | Remote, or local for data residency | Remote, or local for data residency | Remote, or local for data residency | Remote, or local for data residency |
| Backup vaults | Local | Local | Local | Local |
| Key Vault | Local | Local | Local | Local |

Some placements are set by the service, not by the profile:

- **Backup vaults are local in every profile.** Azure Backup works within a region, so you need a vault in each region that holds protected resources.
- **Key Vault is local in every profile.** Give each workload a vault in the region it runs in. See the [recommended Key Vault pattern](./storage-backup-key-vault.md#recommended-key-vault-pattern).
- **Private DNS zones are global.** Create them once, in the connectivity subscription, and link virtual networks to them.
- **Start with a single log workspace.** Add a workspace in the region only when data must stay in that geography, or when the charges for sending data to another region are significant.
- **Policy, access control, and management groups aren't tied to a region.** The one change is to allow the new region in any policy assignment that restricts locations.

Also consider operational support, platform resiliency, ownership, and cost. Enable only the regional capabilities required by expected workloads, and document which services remain centralized or are consumed remotely.

**Decision:** Define the most efficient platform capability set, where each capability will be provided, who will operate it, and what requirements would trigger future expansion.

## Reference links

- [Landing zone regions](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/considerations/regions) — What is global and what is regional in a landing zone, and what to do for each area when you add a region.
- [Azure landing zone design areas and conceptual architecture](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-areas) — Supports the broader platform assessment: identity, security, governance, management, connectivity, and deployment automation.
- [Design a Log Analytics workspace architecture](https://learn.microsoft.com/azure/azure-monitor/logs/workspace-design) — When a single workspace is enough and when to add one per region.
- [Private Link and DNS integration at scale](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/private-link-and-dns-integration-at-scale) — Central private DNS zones and the policies that keep their records current.
- [Hybrid identity with Active Directory and Microsoft Entra ID in Azure landing zones](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/identity-access-active-directory-hybrid-identity) — Where to place domain controllers, including across regions.
- [Azure Backup support matrix](https://learn.microsoft.com/azure/backup/backup-support-matrix) — Vault and region requirements.

## Next step

> [!div class="nextstepaction"]
> [Confirm hybrid connectivity](./hybrid-connectivity.md)
