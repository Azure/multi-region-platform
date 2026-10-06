---
title: Platform capabilities and connectivity
description: Decide which platform capabilities a qualified Azure region needs, confirm the hybrid connectivity foundation, and select the most efficient regional connectivity profile.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Platform capabilities and connectivity

After a region is qualified, decide what the platform must provide there for the identified workload requirements: shared services and operational capabilities, resilient hybrid connectivity, and regional platform connectivity.

These decisions don't rule a region in or out. They define the capabilities a qualified region uses, and they build on the platform and connectivity requirements identified in [check 3](./workload-requirements.md#platform-and-connectivity-requirements).

## Three related decisions

The three decisions sit on one path, from on-premises locations to the workloads in the region. They influence one another, but each has different requirements and tradeoffs. Connectivity that is specific to one application isn't decided here. It is designed when the [workload is placed](./workload-placement.md).

:::image type="content" source="./media/connectivity-planning-layers.png" alt-text="Three decisions shown on one path. Resilient hybrid connectivity links on-premises datacenters and users to the Azure backbone in the selected geography through ExpressRoute or VPN. Platform capabilities covers the strategic geographic hubs and shared services, each provided locally, remotely, or centrally. Regional platform connectivity covers the Workload Landing Zones, supported by the regional platform connectivity profile." lightbox="./media/connectivity-planning-layers.png":::

*The three decisions on one path: resilient hybrid connectivity, platform capabilities, and regional platform connectivity. They are related, but each is a separate decision.*

Use the workload requirements identified earlier to determine how workloads should consume regional and centralized platform capabilities. Workload Landing Zone archetypes can help inform the assessment, but the resulting connectivity design should be based on the actual dependencies and requirements of each workload.

- For existing workloads, particularly those with legacy or hybrid dependencies, use validated application, network, datacenter, and shared-service dependencies to determine whether existing geographic hubs can continue to support the workload or whether additional regional capabilities are required.
- For new workloads, derive connectivity needs from the intended architecture and known dependencies, using the Workload Landing Zone archetypes as a planning aid. Reuse existing geographic hubs, shared services, and platform capabilities where they meet those needs; a new region does not automatically require a new platform footprint.

Existing and new workloads follow the same rule: requirements and dependencies determine the regional connectivity profile. Known requirements can shape platform planning in advance; validate workload-specific fit during onboarding and add regional capabilities only when justified.

## Platform capabilities

**Question:** What platform capabilities must be enabled to support the identified workload requirements?

Determine which shared services and operational capabilities must be provided in the region, consumed from another region, or remain centralized. Consider identity and access, policy and security controls, deployment automation, monitoring and logging, backup and recovery, key and secret management, operational support, platform resiliency, ownership, and cost.

Qualifying a region does not require recreating the full platform footprint used elsewhere. Enable only the regional capabilities required by expected workloads, and document which services remain centralized or are consumed remotely. Define the conditions that would trigger future expansion.

**Decision:** Define the most efficient platform capability set, where each capability will be provided, who will operate it, and what requirements would trigger future expansion.

For the items that most often stall a new region, see the [platform readiness checklist](./platform-readiness.md).

## Resilient hybrid connectivity

**Question:** Does the operating geography have resilient hybrid connectivity to Azure that satisfies the identified workload requirements?

Enabling an additional Azure region doesn't by itself require another ExpressRoute circuit. Evaluate the existing ExpressRoute, VPN, SD-WAN, or other hybrid connectivity against datacenter and user locations, latency, bandwidth, and routing requirements. Add circuits, peering locations, gateways, or more connectivity paths only where the existing foundation can't provide the required reachability, diversity, or resilience.

**Decision:** Confirm the hybrid connectivity foundation and identify any required changes to reachability, resiliency, diversity, scale, or ownership.

## Regional platform connectivity

**Question:** What is the most efficient regional platform design that supports the identified requirements?

Determine how workloads in the region will reach geographic hubs, shared platform services, application dependencies, other Azure regions, and hybrid environments. Those connectivity and dependency requirements determine which profile fits: Disconnected Spokes, Remote Hub Connected, Minimal Regional Hub, or Full Regional Hub.

Choose the profile that meets the requirements without unnecessary infrastructure. Adoption growth alone does not justify moving toward a Full Regional Hub. Expand local capabilities when shared-service placement, resiliency, scale, connectivity, or operational requirements change.

You make this decision on the step 3 Overview, with the [selection principles](./platform-architecture.md#profile-selection-principles) and the [connectivity profile decision tree](./platform-architecture.md#which-connectivity-profile-should-this-region-provide). Before you settle on a profile, check [Profile considerations and hub implementations](./profile-selection.md).

> [!TIP]
> Geographic hybrid connectivity and workload connectivity remain related but distinct decisions. Enabling another region does not automatically require duplicating the existing connectivity platform. For each profile in detail, see [Common connectivity profiles](./connectivity-profiles.md).

## Reference links

- [Azure landing zone design areas and conceptual architecture](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-areas) — Supports the broader platform assessment: identity, security, governance, management, connectivity, and deployment automation.
- [Designing for disaster recovery with ExpressRoute private peering](https://learn.microsoft.com/azure/expressroute/designing-for-disaster-recovery-with-expressroute-privatepeering) — Resilient connectivity from on-premises locations to Azure, including peering-location diversity, redundant paths, and failover.
- [Network topology and connectivity](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/network-topology-and-connectivity) — Assessing connectivity between workloads, shared services, and the broader platform.
- [Define an Azure network topology](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/define-an-azure-network-topology) — Choosing topology approaches based on cross-region connectivity and routing requirements.

## Next step

> [!div class="nextstepaction"]
> [Profile considerations and hub implementations](./profile-selection.md)
