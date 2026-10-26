---
title: Understand Workload Landing Zone archetypes
description: Four archetypes that group recurring application connectivity and dependency requirements, so platform teams can plan regional capability before every workload is known.
ms.date: 10/23/2026
ms.topic: conceptual
---

# Understand Workload Landing Zone archetypes

Workload Landing Zone archetypes group recurring workload connectivity and dependency requirements.

Classify each workload on its own. When workloads have material east-west dependencies on each other, classify the group as an Interdependent Workload Group and combine its members' requirements. Each workload or group gets exactly one archetype.

Traffic between instances of the same workload in different regions does not change its archetype.

These archetypes describe what a workload depends on. They are separate from the Internal (Corp), Online, and Local management groups of an Azure landing zone, which set the policies a subscription inherits, and a workload has one of each.

| Archetype | Online | Internal (Corp) |
|---|---|---|
| Self-Contained Workloads | Common | Rare |
| Selectively Connected Workloads | Possible | Common |
| Hybrid-Dependent Workloads | Possible | Common |
| Interdependent Workload Groups | Possible | Common |

Use archetypes during regional qualification to anticipate the capabilities a candidate region may need to support. Where future workload requirements aren't yet defined, they give you planning guardrails without constraining later placement, which happens once the workload's current requirements, regional capabilities, and platform readiness are known.

:::image type="content" source="./media/application-landing-zone-archetypes.png" alt-text="Four archetype cards — Self-Contained Workloads, Selectively Connected Workloads, Hybrid-Dependent Workloads, and Interdependent Workload Groups — each with its defining characteristics and typical connectivity profiles." lightbox="./media/application-landing-zone-archetypes.png":::

*The four archetypes, grouped by the platform connectivity and dependency capabilities each requires.*

## Self-Contained Workloads

Workloads with no persistent private dependency outside the workload. These can include cloud-native or AI applications.

These workloads can often use **No Hub**. A connected profile may still be selected where platform requirements such as private management, security, data access, or centralized services justify connectivity.

## Selectively Connected Workloads

Workloads that reach selected services through private endpoints or specific private APIs, without routed access to the enterprise network. Common for data, analytics, and AI platforms.

These workloads can use **No Hub** when approved direct same-region spoke connectivity or Azure service endpoints meet their dependency and control requirements without a geographic hub or on-premises path. Otherwise, use **Remote Hub, Minimal Hub, or Full Hub**, depending on dependency latency, traffic patterns, resiliency, security, and operational requirements.

## Hybrid-Dependent Workloads

Workloads that need routed access to on-premises environments or the enterprise network, including shared services hosted in a hub. Common in migrations and hybrid scenarios. The boundary with Selectively Connected Workloads is named endpoints versus routed network access, not Azure versus on-premises.

These workloads typically use **Remote Hub, Minimal Hub, or Full Hub**, depending on dependency latency, resiliency, regulatory, operational, and shared-service requirements. **No Hub** doesn't fit a mandatory private dependency on on-premises or geographic-hub services.

## Interdependent Workload Groups

Groups of workloads with material east-west dependencies on each other, such as shared data, synchronous calls, or private east-west traffic. Classify at group level and combine the members' requirements.

Where significant east-west traffic exists within a region, evaluate whether **direct spoke-to-spoke connectivity or a local hub** provides a more appropriate path than routing traffic through a geographic hub in another region. Direct connectivity may suit a limited number of tightly coupled workloads, while a **Minimal Hub or Full Hub** may be more appropriate where broader connectivity, shared routing, traffic inspection, resiliency, or operational requirements justify regional platform capabilities.

**No Hub** is an option only when approved same-region spoke-to-spoke connectivity and Azure service endpoints satisfy the group's aggregate requirements without a geographic hub or on-premises path. **Remote Hub** is an option when cross-region latency, traffic, and availability coupling are acceptable; use **Minimal Hub or Full Hub** when local capabilities are justified.

Because this is a **group-level archetype**, its combined dependencies may require capabilities beyond those needed by any individual workload. Select the profile from the group's aggregate connectivity, shared-service, resiliency, scale, and operational requirements.

## How archetypes map to connectivity profiles

Archetypes describe what applications require; connectivity profiles describe what the platform provides. An archetype doesn't dictate a profile: one archetype can use different profiles, and one profile can serve several archetypes. Use the archetypes expected in a region to understand what it needs, then choose the most efficient profile that meets those needs. For example, a hybrid-dependent workload might run well on a Remote Hub profile in one region and need a Minimal Hub in another, depending on latency, traffic, and resiliency requirements.

The [archetype-to-profile matrix](./profile-selection.md) shows the typical options for each archetype.

## How archetypes differ from other architecture terms

Several architecture concepts help identify and organize workload requirements, but they describe different aspects of a workload and should not be used interchangeably. An archetype is the only one of them that describes what a workload requires from the platform.

| Term | What it describes | Examples | Level |
|---|---|---|---|
| Architecture style | The fundamental structural organization of an application | Microservices, N-tier, event-driven, web-queue-worker, big compute | Application architecture |
| Architecture or design pattern | A reusable solution to a recurring technical problem | Circuit Breaker, Retry, CQRS, Strangler Fig, Competing Consumers | Design technique |
| Workload pattern | A recurring workload behavior or set of operational characteristics that can influence platform requirements | Latency-sensitive, data-intensive, batch-oriented, globally distributed, hybrid-dependent | Workload characteristics |
| Workload Landing Zone archetype | A classification of a workload based on the platform connectivity and dependency capabilities it requires | Self-Contained Workloads, Selectively Connected Workloads, Hybrid-Dependent Workloads, Interdependent Workload Groups | Platform-consumption model |

> [!NOTE]
> The Azure landing zones reference architecture also uses *archetypes*: built-in definitions of what must be true for a landing zone to meet environment and compliance requirements at a given scope. Workload Landing Zone archetypes in this guidance describe what a workload requires from the platform, which is a different concept.

## Reference links

- [Architecture styles](https://learn.microsoft.com/azure/architecture/guide/architecture-styles/) — Supports the discussion of workload architecture, including N-tier, microservices, and event-driven approaches.
- [Built-in Azure landing zone archetypes](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/tailoring-alz#built-in-archetypes-for-the-azure-landing-zone-reference-architecture) — Describes what needs to be true for a landing zone to meet the expected environment and compliance requirements at a specific scope.
- [Azure Private Link](https://learn.microsoft.com/azure/private-link/private-link-overview) — Private endpoints provide access to Azure services without requiring a hub-based network path.
- [Hub-spoke network topology](https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke) — Distinguishes direct spoke connectivity from shared routing, inspection, and hybrid gateways.

## Next step

> [!div class="nextstepaction"]
> [Regional qualification overview](./regional-qualification.md)
