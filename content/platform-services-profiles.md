---
title: Platform Services profiles
description: Learn the four Platform Services profiles — No platform, Remote platform, Minimal platform, and Full platform — before you qualify a region.
ms.date: 10/30/2026
ms.topic: conceptual
---

# Platform Services profiles

Enabling an additional Azure region does not require changing or duplicating the full platform footprint of an existing full-service region. An organization can maintain a small number of strategic regions providing a more complete set of Platform Services, using the Full regional platform profile, that provide resilient hybrid connectivity and common enterprise services. Other regions can use more efficient profiles, such as Remote platform or Minimal platform, and consume capabilities from other more strategic regions when workload requirements permit.

These common four profiles form a spectrum: from No platform, with no dependency on another region’s hub and other platform services (although still governed from a Management Group, Policy and RBAC standpoint), through Remote platform and Minimal platform, to Full platform, with greater local capability and independence. They aren’t maturity stages. A profile can remain the right target for a region as long as it continues to satisfy workload and platform requirements.

Profiles describe platform services and capabilities that can be offered, not workload designs; [Workload Landing Zone archetypes](./workload-landing-zone-archetypes.md) describe what workloads need from the Platform.

:::image type="content" source="./media/platform-services-profile-spectrum.png" alt-text="Spectrum of Platform Services profiles from no dedicated regional platform resources to the full required local platform service set. No platform has no dedicated regional platform resources; Remote platform consumes platform services from other more strategic regions through private connectivity; Minimal platform provides selected platform services locally; Full platform provides the full required local platform service set. The Full platform and remote region show the Security, Identity, Management, and Networking categories." lightbox="./media/platform-services-profile-spectrum.png":::

*The spectrum of Platform Services profiles. Moving right adds local capability and independence, and also cost and operational scope. Platform Services span Security, Identity, Management, and Networking. Only required capabilities are deployed locally; any profile can be the right long-term target.*

## No platform

Workload spokes in the new region do not require platform shared services, can operate without a private network path to a more strategic region, and/or to an on-premises environment. They could still use direct connectivity to other spokes where required and approved private or public connectivity to Azure platform services. The Subscriptions in this new region are still governed from a Management Group, Policy and RBAC standpoint.

**Fits when:** Workloads can operate without shared platform services, private connectivity to a more strategic region, and/or to an on-premises environment, and their required platform capabilities can be consumed globally or through approved Azure service connectivity, such as Public or Private endpoints, and without any dedicated regional platform resources. This can include self-contained cloud-native, AI, development, test, batch, HPC, VDI, or internet-facing workloads where those conditions are met.

**Regional footprint:** Workload resources plus the controls needed to deploy, secure, monitor, and operate them. These spokes still use the estate's standard identity, policy, security, and deployment practices.

## Remote platform

Workloads in the new region use cross-region connectivity to consume platform services from an existing more strategic region. A more strategic region can provide connectivity to on-premises environments, traffic inspection, internet egress, routing, DNS, identity, monitoring, and other shared platform services.

Cross-region connectivity can be implemented through appropriate Azure networking capabilities based on the required topology and routing model, usually Global Virtual Network peering, Virtual WAN Virtual Network Connection, or Azure Virtual Network Manager. Public application ingress can remain local through services such as Azure Front Door and/or Application Gateway when appropriate.

**Fits when:** Workloads require private access to selected enterprise or on-premises services but can tolerate the latency, availability coupling, data-transfer implications, and dependency on connectivity to another region.

**Regional footprint:** Workload spokes and any capabilities that must remain close to the workloads. Gateways, firewalls, routing resources, and other platform resources can remain in a more strategic region when workload requirements permit.

## Minimal platform

The new region provides the minimal required shared platform services locally while continuing to consume other services from a more strategic region.

The Minimal platform provides only the local capabilities required by its workloads rather than replicating a complete platform footprint. Depending on workload requirements, these capabilities can include east-west routing, DNS, monitoring, backup, traffic inspection, egress, private connectivity, selected identity or directory services, on-premises connectivity, or other services that must remain close to the workloads.

**Fits when:** Workloads require some local shared platform services, application-to-application connectivity, lower-latency dependency paths, regional security controls, or greater independence than a Remote platform profile can provide.

**Regional footprint:** A local network hub containing only the connectivity and a few shared-service capabilities that must operate locally. Connectivity to on-premises environments, specialized networking functions, management resources, and other platform services can remain in a more strategic region when appropriate.

## Full platform

The region provides the complete set of local connectivity and other shared platform services required for its designated workloads and geographic responsibilities. Depending on those requirements, this can include local hybrid connectivity, traffic inspection, routing, internet ingress and egress, DNS, identity services, monitoring, backup, key management, and other required platform capabilities.

A full-service region uses the same operating model and control baselines as other full-service regions in the estate. It does not have to be an identical copy; its capabilities should reflect the workloads and geography it supports.

**Fits when:** Workload and platform requirements justify the full required local platform service set, for example to meet connectivity, latency, data-boundary, or resilience requirements; any need to continue operating during an outage of a more strategic region must be validated across all critical dependencies.

**Regional footprint:** The approved set of local connectivity, shared services, operational capabilities, and independent critical paths required by the region's workload portfolio.

> [!NOTE]
> None of the profiles, including Full platform, require new ExpressRoute circuits. If you don't have new on-premises datacenters near the new region, reuse your existing circuits. You might still need to upgrade the circuit SKU or bandwidth and deploy a gateway in the new region. For recommendations and considerations, see [Confirm hybrid connectivity](./hybrid-connectivity.md).

## Next step

> [!div class="nextstepaction"]
> [Workload Landing Zone archetypes](./workload-landing-zone-archetypes.md)
