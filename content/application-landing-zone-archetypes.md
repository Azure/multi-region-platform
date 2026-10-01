---
title: Application Landing Zone archetypes
description: Four archetypes that group recurring application connectivity and dependency requirements, so platform teams can plan regional capability before every workload is known.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Application Landing Zone archetypes

**Application Landing Zone archetypes provide a planning abstraction for grouping recurring application connectivity and dependency requirements.** In this guidance, an Application Landing Zone archetype describes what an application or application portfolio requires from the platform; it does not replace the existing Azure landing-zone hierarchy or prescribe a specific regional connectivity profile.

Use known workload requirements and application portfolios to anticipate the capabilities that candidate regions may need to support. Where future workload requirements are not yet sufficiently defined, use the archetypes to establish planning guardrails without unnecessarily constraining future placement decisions.

Archetypes describe what applications require; connectivity profiles describe what the platform provides. The mapping is not one-to-one. One archetype can use different profiles, and one profile can support multiple archetypes. For planning, assign the closest-fitting archetype and record material requirements that fall outside it. Portfolio-level dependencies can also affect the platform capabilities needed across several workloads.

Use archetypes during regional qualification to surface recurring requirements that a candidate region may need to support. Placement still happens later, when the workload's current requirements, regional capabilities, and platform readiness are known.

:::image type="content" source="./media/application-landing-zone-archetypes.png" alt-text="Four archetype cards — hybrid-connected applications, isolated cloud-native or AI applications, connected cloud-native or AI applications, and interconnected application portfolios — each with its defining characteristics and typical connectivity profiles." lightbox="./media/application-landing-zone-archetypes.png":::

*The four archetypes, grouped by the platform connectivity and dependency capabilities each requires.*

## Hybrid-Connected Applications

Applications with significant dependencies on on-premises environments, enterprise networks, or centralized shared services that require persistent private connectivity to the wider enterprise environment.

These workloads typically use **Remote Hub Connected, Minimal Regional Hub, or Full Regional Hub**, depending on dependency latency, resiliency, regulatory, operational, and shared-service requirements.

## Isolated Cloud-Native or AI Applications

Self-contained workloads that can operate without persistent private connectivity to enterprise, on-premises, or centralized shared-service dependencies.

These workloads can often use **Disconnected Spokes**. A connected profile may still be selected where platform requirements such as private management, security, data access, or centralized services justify connectivity.

## Connected Cloud-Native or AI Applications

Cloud-native or AI applications that are primarily self-contained but require private connectivity to selected enterprise services, data sources, APIs, or other Azure environments.

These workloads can use **Remote Hub Connected, Minimal Regional Hub, or Full Regional Hub**, depending on dependency latency, traffic patterns, resiliency, security, and operational requirements.

## Interconnected Application Portfolios

Groups of applications with meaningful dependencies on each other, including shared data, common services, east-west communication, or coordinated connectivity and operations across applications, regions, or business domains.

Where significant east-west traffic exists within a region, evaluate whether **direct spoke-to-spoke connectivity or a regional hub** provides a more appropriate path than routing traffic through a remote hub. Direct connectivity may suit a limited number of tightly coupled workloads, while a **Minimal Regional Hub or Full Regional Hub** may be more appropriate where broader connectivity, shared routing, traffic inspection, resiliency, or operational requirements justify regional platform capabilities.

Because this is a **portfolio-level archetype**, its combined dependencies may require capabilities beyond those needed by any individual application. Select the appropriate connectivity profile based on the portfolio's aggregate connectivity, shared-service, resiliency, scale, and operational requirements rather than the requirements of a single workload.

## Next step

> [!div class="nextstepaction"]
> [Regional platform connectivity profiles](./connectivity-profiles.md)
