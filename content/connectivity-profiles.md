---
title: Regional platform connectivity profiles
description: Four regional platform connectivity profiles — Disconnected Spokes, Remote Hub Connected, Minimal Regional Hub, and Full Regional Hub — and when to choose and reassess each one.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Regional platform connectivity profiles

Enabling an additional Azure region doesn't require changing or duplicating the full platform footprint of an existing geographic hub. Instead, choose the most efficient regional connectivity profile that supports the workloads expected to use the region.

An organization can maintain a small number of strategic geographic hubs that provide resilient hybrid connectivity and common enterprise services. Other Azure regions can use lighter profiles and consume capabilities from those hubs when workload requirements permit.

Regional enablement is a spectrum: from Disconnected Spokes, with no dependency on a geographic hub, through Remote Hub Connected and Minimal Regional Hub, to a Full Regional Hub with greater local capability and independence. These profiles aren't maturity stages. A profile can remain the right target for a region as long as it continues to satisfy workload and platform requirements.

Connectivity profiles describe platform capabilities, not workload designs. A Workload Landing Zone archetype doesn't dictate a profile; choose the profile from the workloads' actual dependencies, latency, resiliency, security, data, and operational requirements.

:::image type="content" source="./media/connectivity-profile-spectrum.png" alt-text="Spectrum of four profiles from no dependency on a geographic hub to greater local capability. Disconnected spokes have no hub or gateway; remote-hub-connected spokes connect privately to a hub region; a minimal regional hub hosts selected shared services such as private DNS, a virtual network gateway, and Azure Monitor; a full regional hub adds comprehensive shared services including Azure Firewall." lightbox="./media/connectivity-profile-spectrum.png":::

*The spectrum of regional platform connectivity profiles. Moving right adds local capability and independence, and also cost and operational scope. Services shown are examples; each hub includes only what its workloads require.*

## Disconnected Spokes

Workload spokes operate without private connectivity to an enterprise geographic hub, another Azure region, or an on-premises environment. They can still use direct connectivity to other spokes where required and approved private or public connectivity to Azure platform services.

**Choose when:** Workloads can operate without private connectivity to an enterprise geographic hub, another Azure region, or an on-premises environment, and their required platform services can be consumed locally or through approved Azure service connectivity. This can include self-contained cloud-native, AI, development, test, batch, HPC, VDI, or internet-facing workloads where those conditions are met.

**Regional footprint:** Workload resources plus the controls needed to deploy, secure, monitor, and operate them. These spokes still use the estate's standard identity, policy, security, and deployment practices.

**Key considerations:** Validate administration, identity, DNS, secrets, telemetry, data movement, software distribution, private endpoints, incident response, and support procedures. Where applications require east-west communication within the region, evaluate direct spoke-to-spoke connectivity without assuming that a regional hub is required. Confirm that no hidden dependency requires connectivity to a geographic hub or on-premises environment.

**Reassess when:** Workloads require private access to enterprise services, centralized security inspection, on-premises systems, another application portfolio, or capabilities hosted through a geographic hub.

## Remote Hub Connected

Workload spokes in the additional region use cross-region connectivity to access an existing strategic geographic hub. The geographic hub can provide hybrid connectivity, security inspection, internet egress, routing, DNS, identity, monitoring, or other shared services without requiring a complete hub to be deployed locally.

Cross-region connectivity can be implemented through appropriate Azure networking capabilities based on the required topology and routing model. Public application ingress can remain local through services such as Azure Front Door or Application Gateway when appropriate.

**Choose when:** Workloads require private access to selected enterprise or on-premises services but can tolerate the latency, availability coupling, data-transfer implications, and dependency on connectivity to another region.

**Regional footprint:** Workload spokes and any capabilities that must remain close to the workloads. Gateways, firewalls, hybrid connectivity, routing services, and selected shared services can remain in an existing geographic hub when workload requirements permit.

**Key considerations:** Measure latency and bandwidth using representative traffic. Evaluate cross-region data-transfer cost, routing and transit behavior, inspection paths, geographic hub scale, dependency criticality, and operational ownership. Document how workloads behave if the geographic hub or cross-region connectivity is degraded or unavailable.

**Reassess when:** Cross-region traffic, latency, east-west communication, dependency criticality, regulatory requirements, scale, or availability coupling justify deploying selected connectivity or shared-service capabilities locally.

## Minimal Regional Hub

The additional region includes a limited hub footprint that provides selected local connectivity and shared services while continuing to consume other capabilities from an existing geographic hub.

The Minimal Regional Hub provides only the local capabilities required by its workloads rather than replicating a complete platform footprint. Depending on workload requirements, these capabilities can include east-west routing, DNS, monitoring, backup, security inspection, egress, private connectivity, selected identity or directory services, on-premises connectivity, or other services that must remain close to the workloads.

**Choose when:** Workloads require some local shared services, application-to-application connectivity, lower-latency dependency paths, regional security controls, or greater independence than a Remote Hub Connected profile can provide.

**Regional footprint:** A regional hub containing only the connectivity and shared-service capabilities that must operate locally. Hybrid connectivity, specialized networking functions, central management, and other services can remain in a strategic geographic hub when appropriate.

**Key considerations:** Clearly define which capabilities operate locally and which remain remote. Avoid ambiguous routing, overlapping responsibilities, and unnecessary duplication of platform controls. Validate workload and operational behavior when either local capabilities or remote dependencies are unavailable. When connectivity to on-premises environments is required, determine whether existing ExpressRoute circuits and gateway topology can provide the required reachability before introducing additional circuits; do not assume that each Azure region requires a dedicated ExpressRoute circuit.

**Reassess when:** Workload growth introduces additional local connectivity or shared-service requirements, multiple interconnected application portfolios require broader regional capabilities, stricter independence requirements emerge, significant hybrid connectivity is required locally, or other requirements justify expanding the regional platform footprint.

## Full Regional Hub

The region provides the complete set of local connectivity and shared services required for its designated workloads and geographic responsibilities. Depending on those requirements, this can include local hybrid connectivity, security inspection, routing, internet ingress and egress, DNS, identity services, monitoring, backup, key management, and other required platform capabilities.

A Full Regional Hub uses the same operating model and control baselines as other strategic hubs. It does not have to be an identical copy; its capabilities should reflect the workloads and geography it supports.

**Choose when:** Workload and platform requirements justify a comprehensive local capability set—for example, where the region requires local hybrid connectivity, substantial local shared services, strict latency or data-boundary controls, significant interconnected application portfolios, or sufficient independence to continue operating when another region or geographic hub is unavailable.

**Regional footprint:** The approved set of local connectivity, shared services, operational capabilities, and independent critical paths required by the region's workload portfolio.

**Key considerations:** Confirm that the required level of independence justifies the additional cost and operational scope. Validate automation, observability, support ownership, security operations, configuration consistency, dependency behavior, and lifecycle management. Where on-premises connectivity is required, determine whether existing ExpressRoute circuits can provide the required reachability and resiliency before introducing additional connectivity.

**Reassess when:** Workload demand or requirements decrease, services can be safely centralized, dependencies change, or the full regional footprint no longer provides sufficient value relative to its cost and operational complexity.

## Next step

> [!div class="nextstepaction"]
> [Profile selection and hub implementations](./profile-selection.md)
