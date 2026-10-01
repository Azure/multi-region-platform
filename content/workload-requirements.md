---
title: "Dimension 3: Workload requirements and dependencies"
description: Identify the workload requirements and dependencies a candidate Azure region must support, from existing and future workloads, including workloads moving into the region.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Workload requirements and dependencies

**Question:** What workload requirements and dependencies must the region support?

Regional qualification should reflect the requirements of workloads expected to consume the region. These requirements may be identified from existing applications, net-new workload plans, or workloads being considered for relocation between Azure regions.

Review the architecture, connectivity, data, shared-service, security, resiliency, scale, and operational requirements and dependencies of workloads expected to consume the region. Where useful, map each workload to the closest-fitting [Application Landing Zone archetype](./application-landing-zone-archetypes.md) based on its platform connectivity and dependency requirements. If a workload has requirements beyond its primary archetype, record them as explicit additions to that archetype rather than forcing the workload into multiple classifications.

:::image type="content" source="./media/workloads-to-platform-requirements.png" alt-text="Flow from two workload sources — existing workloads, including those moving into the region, and future workloads — into a review of requirements and dependencies, which produces workload-driven platform requirements; requirements that affect suitability go to dimension 4 and implementation details are deferred to onboarding." lightbox="./media/workloads-to-platform-requirements.png":::

*From workloads to platform requirements. Requirements that could materially affect regional suitability are validated in dimension 4; implementation-specific decisions can wait for onboarding.*

## Existing and future workloads

For **existing workloads**—running in Azure, on-premises, or in another cloud—start with the current application inventory and architecture. Validate important dependencies with workload owners, focusing first on critical or representative applications and portfolios. Capture application and data dependencies, connectivity, shared services, required Azure services, security and resiliency requirements, and expected scale.

- **If an existing workload would move into the region**, from another Azure region or from outside Azure, also identify which components must move together, which dependencies can stay where they are, and how the workload behaves while it's split across locations: latency, data movement, required application changes, acceptable disruption, and any temporary operating requirements.

For **future workloads**, use known business and technical requirements, predefined workload patterns, intended architecture, expected dependencies, required Azure services, and anticipated security, resiliency, connectivity, and scale requirements to determine the regional and platform capabilities they will need. Where aspects of the application design are still evolving, identify the requirements that must influence regional qualification and defer implementation-specific decisions that can be validated during workload onboarding.

> [!IMPORTANT]
> This phase identifies the **regional and platform capabilities that workloads require**. It does not approve workload relocation or define migration execution. Relocation readiness, migration sequencing, recovery design, and ongoing multi-region operation remain workload-specific activities.

**Decision:** Identify the workload-driven platform requirements that must be validated as part of regional qualification.

## Organize requirements with the right concept

Architecture concepts can help identify and organize these requirements, but they describe different aspects of a workload and should not be used interchangeably.

| Term | What it describes | Examples | Level |
|---|---|---|---|
| Architecture style | The fundamental structural organization of an application | Microservices, N-tier, event-driven, web-queue-worker, big compute | Application architecture |
| Architecture or design pattern | A reusable solution to a recurring technical problem | Circuit Breaker, Retry, CQRS, Strangler Fig, Competing Consumers | Design technique |
| Workload pattern | A recurring workload behavior or set of operational characteristics that can influence platform requirements | Latency-sensitive, data-intensive, batch-oriented, globally distributed, hybrid-dependent | Workload characteristics |
| Application Landing Zone archetype | A classification of a workload based on the platform connectivity and dependency capabilities it requires | Hybrid-Connected, Connected Cloud-Native or AI, Isolated Cloud-Native or AI, Interconnected Application Portfolios | Platform-consumption model |

> [!NOTE]
> The Azure landing zones reference architecture also uses *archetypes*: built-in definitions of what must be true for a landing zone to meet environment and compliance requirements at a given scope. Application Landing Zone archetypes in this guidance describe what a workload requires from the platform, which is a different concept.

## Reference links

- [Architecture styles](https://learn.microsoft.com/azure/architecture/guide/architecture-styles/) — Supports the discussion of workload architecture, including N-tier, microservices, and event-driven approaches.
- [Built-in application landing zone archetypes](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/tailoring-alz#built-in-archetypes-for-the-azure-landing-zone-reference-architecture) — Describes what needs to be true for a landing zone to meet the expected environment and compliance requirements at a specific scope.
- [Evaluate a cloud workload for relocation](https://learn.microsoft.com/azure/azure-resource-manager/management/relocate-evaluate) — Dependency discovery, workload ownership, acceptable disruption, and target-region supportability.
- [Relocate cloud workloads](https://learn.microsoft.com/azure/azure-resource-manager/management/relocate-index) — The broader Azure-to-Azure relocation process, which distinguishes assessment from migration and cutover.

## Next step

> [!div class="nextstepaction"]
> [Regional capability and availability](./regional-capability.md)
