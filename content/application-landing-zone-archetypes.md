---
title: Understand Workload Landing Zone archetypes
description: Four archetypes that group recurring application connectivity and dependency requirements, so platform teams can plan regional capability before every workload is known.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Understand Workload Landing Zone archetypes

Workload Landing Zone archetypes are a planning abstraction that groups recurring application connectivity and dependency requirements. An archetype describes what an application or application portfolio requires from the platform. It doesn't replace the existing Azure landing-zone hierarchy.

Archetypes describe what applications require; connectivity profiles describe what the platform provides. The mapping isn't one-to-one: one archetype can use different profiles, and one profile can support multiple archetypes. Assign each workload the closest-fitting archetype and record any material requirements that fall outside it. Portfolio-level dependencies can also affect the platform capabilities needed across several workloads.

Use archetypes during regional qualification to anticipate the capabilities a candidate region may need to support. Where future workload requirements aren't yet defined, they give you planning guardrails without constraining later placement, which happens once the workload's current requirements, regional capabilities, and platform readiness are known.

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

## How archetypes map to connectivity profiles

An archetype doesn't dictate a profile. Use the archetypes expected in a region to understand what it needs, then choose the most efficient profile that meets those needs. For example, a hybrid-connected application might run well on a Remote Hub Connected profile in one region and need a Minimal Regional Hub in another, depending on latency, traffic, and resiliency requirements. One profile can also serve several archetypes at once.

:::image type="content" source="./media/archetype-profile-matrix.png" alt-text="Matrix of the four archetypes against the four connectivity profiles. Hybrid-connected and connected cloud-native or AI applications typically use remote hub, minimal hub, or full hub; isolated cloud-native or AI applications often use disconnected spokes and other profiles where justified; interconnected portfolios can use spoke-to-spoke connectivity, a remote hub where acceptable, and a minimal or full hub when justified." lightbox="./media/archetype-profile-matrix.png":::

*Archetype-to-profile relationships are many-to-many. Each row is a set of options, not an assignment; the selected profile follows dependencies, latency, traffic, resiliency, and independence requirements.*

## How archetypes differ from other architecture terms

Several architecture concepts help identify and organize workload requirements, but they describe different aspects of a workload and should not be used interchangeably. An archetype is the only one of them that describes what a workload requires from the platform.

| Term | What it describes | Examples | Level |
|---|---|---|---|
| Architecture style | The fundamental structural organization of an application | Microservices, N-tier, event-driven, web-queue-worker, big compute | Application architecture |
| Architecture or design pattern | A reusable solution to a recurring technical problem | Circuit Breaker, Retry, CQRS, Strangler Fig, Competing Consumers | Design technique |
| Workload pattern | A recurring workload behavior or set of operational characteristics that can influence platform requirements | Latency-sensitive, data-intensive, batch-oriented, globally distributed, hybrid-dependent | Workload characteristics |
| Workload Landing Zone archetype | A classification of a workload based on the platform connectivity and dependency capabilities it requires | Hybrid-Connected, Connected Cloud-Native or AI, Isolated Cloud-Native or AI, Interconnected Application Portfolios | Platform-consumption model |

> [!NOTE]
> The Azure landing zones reference architecture also uses *archetypes*: built-in definitions of what must be true for a landing zone to meet environment and compliance requirements at a given scope. Workload Landing Zone archetypes in this guidance describe what a workload requires from the platform, which is a different concept.

## What you don't decide yet

You don't assign a profile to an archetype here. [Regional qualification](./regional-qualification.md) uses the archetypes in [check 3](./workload-requirements.md) to describe the workloads a region must support. [Step 3](./platform-architecture.md) then selects the profile those workloads need.

## Reference links

- [Architecture styles](https://learn.microsoft.com/azure/architecture/guide/architecture-styles/) — Supports the discussion of workload architecture, including N-tier, microservices, and event-driven approaches.
- [Built-in Azure landing zone archetypes](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/tailoring-alz#built-in-archetypes-for-the-azure-landing-zone-reference-architecture) — Describes what needs to be true for a landing zone to meet the expected environment and compliance requirements at a specific scope.

## Next step

> [!div class="nextstepaction"]
> [Regional qualification overview](./regional-qualification.md)
