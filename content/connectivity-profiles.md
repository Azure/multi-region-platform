---
title: Understand common connectivity profiles
description: Learn the four regional platform connectivity profiles — Disconnected Spokes, Remote Hub Connected, Minimal Regional Hub, and Full Regional Hub — before you qualify a region.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Understand common connectivity profiles

Enabling an additional Azure region doesn't require changing or duplicating the full platform footprint of an existing geographic hub. An organization can maintain a small number of strategic geographic hubs that provide resilient hybrid connectivity and common enterprise services. Other Azure regions can use a more efficient profile and consume capabilities from those hubs when workload requirements permit.

The four profiles form a spectrum: from Disconnected Spokes, with no dependency on a geographic hub, through Remote Hub Connected and Minimal Regional Hub, to a Full Regional Hub with greater local capability and independence. They aren't maturity stages. A profile can remain the right target for a region as long as it continues to satisfy workload and platform requirements.

Profiles describe platform capabilities, not workload designs; [Workload Landing Zone archetypes](./application-landing-zone-archetypes.md) describe what applications need. You don't select a profile here. That happens in [step 3](./platform-architecture.md), after the region is [qualified](./regional-qualification.md).

:::image type="content" source="./media/connectivity-profile-spectrum.png" alt-text="Spectrum of four profiles from no dependency on a geographic hub to greater local capability. Disconnected spokes have no hub or gateway; remote-hub-connected spokes connect privately to a hub region; a minimal regional hub hosts selected shared services such as private DNS, a virtual network gateway, and Azure Monitor; a full regional hub adds comprehensive shared services including Azure Firewall." lightbox="./media/connectivity-profile-spectrum.png":::

*The spectrum of regional platform connectivity profiles. Moving right adds local capability and independence, and also cost and operational scope. Services shown are examples; each hub includes only what its workloads require.*

## Disconnected Spokes

Workload spokes operate without private connectivity to an enterprise geographic hub, another Azure region, or an on-premises environment. They can still use direct connectivity to other spokes where required and approved private or public connectivity to Azure platform services.

**Fits when:** Workloads can operate without private connectivity to an enterprise geographic hub, another Azure region, or an on-premises environment, and their required platform services can be consumed locally or through approved Azure service connectivity. This can include self-contained cloud-native, AI, development, test, batch, HPC, VDI, or internet-facing workloads where those conditions are met.

**Regional footprint:** Workload resources plus the controls needed to deploy, secure, monitor, and operate them. These spokes still use the estate's standard identity, policy, security, and deployment practices.

## Remote Hub Connected

Workload spokes in the additional region use cross-region connectivity to access an existing strategic geographic hub. The geographic hub can provide hybrid connectivity, security inspection, internet egress, routing, DNS, identity, monitoring, or other shared services without requiring a complete hub to be deployed locally.

Cross-region connectivity can be implemented through appropriate Azure networking capabilities based on the required topology and routing model. Public application ingress can remain local through services such as Azure Front Door or Application Gateway when appropriate.

**Fits when:** Workloads require private access to selected enterprise or on-premises services but can tolerate the latency, availability coupling, data-transfer implications, and dependency on connectivity to another region.

**Regional footprint:** Workload spokes and any capabilities that must remain close to the workloads. Gateways, firewalls, hybrid connectivity, routing services, and selected shared services can remain in an existing geographic hub when workload requirements permit.

## Minimal Regional Hub

The additional region includes a limited hub footprint that provides selected local connectivity and shared services while continuing to consume other capabilities from an existing geographic hub.

The Minimal Regional Hub provides only the local capabilities required by its workloads rather than replicating a complete platform footprint. Depending on workload requirements, these capabilities can include east-west routing, DNS, monitoring, backup, security inspection, egress, private connectivity, selected identity or directory services, on-premises connectivity, or other services that must remain close to the workloads.

**Fits when:** Workloads require some local shared services, application-to-application connectivity, lower-latency dependency paths, regional security controls, or greater independence than a Remote Hub Connected profile can provide.

**Regional footprint:** A regional hub containing only the connectivity and shared-service capabilities that must operate locally. Hybrid connectivity, specialized networking functions, central management, and other services can remain in a strategic geographic hub when appropriate.

## Full Regional Hub

The region provides the complete set of local connectivity and shared services required for its designated workloads and geographic responsibilities. Depending on those requirements, this can include local hybrid connectivity, security inspection, routing, internet ingress and egress, DNS, identity services, monitoring, backup, key management, and other required platform capabilities.

A Full Regional Hub uses the same operating model and control baselines as other strategic hubs. It does not have to be an identical copy; its capabilities should reflect the workloads and geography it supports.

**Fits when:** Workload and platform requirements justify a comprehensive local capability set—for example, where the region requires local hybrid connectivity, substantial local shared services, strict latency or data-boundary controls, significant interconnected application portfolios, or sufficient independence to continue operating when another region or geographic hub is unavailable.

**Regional footprint:** The approved set of local connectivity, shared services, operational capabilities, and independent critical paths required by the region's workload portfolio.

## Next step

> [!div class="nextstepaction"]
> [Workload Landing Zone archetypes](./application-landing-zone-archetypes.md)
