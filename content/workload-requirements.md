---
title: "Check 3: Workload requirements and dependencies"
description: Identify the workload requirements and dependencies a candidate Azure region must support, from existing and future workloads, including workloads moving into the region, and what those workloads require from the platform.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Workload requirements and dependencies

**Question:** What workload requirements and dependencies must the region support?

Regional qualification should reflect the requirements of the workloads expected to use the region. These come from two sources: existing workloads, including any that would move into the region, and future workloads that are planned but not yet built. This check gathers requirements, but it doesn't decide how they are met, and it doesn't disqualify a region directly.

Review the architecture, connectivity, data, shared-service, security, resiliency, scale, and operational requirements and dependencies of workloads expected to consume the region. Where useful, map the key workloads you expect to move to or deploy in the new region, whether existing or new, to the closest-fitting [Workload Landing Zone archetype](./application-landing-zone-archetypes.md) based on its platform connectivity and dependency requirements. If a workload has requirements beyond its primary archetype, record them as explicit additions to that archetype rather than forcing the workload into multiple classifications. For how an archetype differs from an architecture style, a design pattern, and a workload pattern, see [How archetypes differ from other architecture terms](./application-landing-zone-archetypes.md#how-archetypes-differ-from-other-architecture-terms).

:::image type="content" source="./media/workloads-to-platform-requirements.png" alt-text="Flow from two workload sources — existing workloads, including those moving into the region, and future workloads — into a review of requirements and dependencies, which produces workload-driven platform requirements; requirements that affect suitability go to check 4 and implementation details are deferred to onboarding." lightbox="./media/workloads-to-platform-requirements.png":::

*From workloads to platform requirements. Requirements that could materially affect regional suitability are validated in check 4; implementation-specific decisions can wait for onboarding.*

## Existing and future workloads

For **existing workloads**—running in Azure, on-premises, or in another cloud—start with the current application inventory and architecture. Validate important dependencies with workload owners, focusing first on critical or representative applications and portfolios. Capture application and data dependencies, connectivity, shared services, required Azure services, security and resiliency requirements, and expected scale.

- **If an existing workload would move into the region**, from another Azure region or from outside Azure, also identify which components must move together, which dependencies can stay where they are, and how the workload behaves while it's split across locations: latency, data movement, required application changes, acceptable disruption, and any temporary operating requirements.

For **future workloads**, use known business and technical requirements, predefined workload patterns, intended architecture, expected dependencies, required Azure services, and anticipated security, resiliency, connectivity, and scale requirements to determine the regional and platform capabilities they will need. Where aspects of the application design are still evolving, identify the requirements that must influence regional qualification and defer implementation-specific decisions that can be validated during workload onboarding.

## Platform and connectivity requirements

Workload requirements also define what the platform must provide in the region. Capture them in three areas. [Step 3](./platform-architecture.md) decides how the platform meets each one, after the region qualifies.

| Area | What to identify | Decided in step 3 |
|---|---|---|
| **Platform enablement** | The shared services and operational capabilities the workloads depend on, such as identity, security controls, monitoring, backup, and key management, and which of them must be close to the workloads. | [Platform capabilities](./platform-enablement-connectivity.md#platform-capabilities) |
| **Resilient hybrid connectivity** | The datacenters and users the workloads must reach, and the latency, bandwidth, routing, and resilience they need on that path. | [Resilient hybrid connectivity](./platform-enablement-connectivity.md#resilient-hybrid-connectivity) |
| **Regional platform connectivity** | How the workloads must reach geographic hubs, shared platform services, application dependencies, other Azure regions, and hybrid environments. | [Regional platform connectivity](./platform-enablement-connectivity.md#regional-platform-connectivity) |

> [!IMPORTANT]
> This check doesn't approve workload relocation or define migration execution. Relocation readiness, migration sequencing, recovery design, and ongoing multi-region operation remain workload-specific activities.

**Decision:** Identify and record the workload-driven platform requirements. They are the input to check 4, which validates what the region can support, and to step 3, which decides what the platform provides.

## Reference links

- [Evaluate a cloud workload for relocation](https://learn.microsoft.com/azure/azure-resource-manager/management/relocate-evaluate) — Dependency discovery, workload ownership, acceptable disruption, and target-region supportability.
- [Relocate cloud workloads](https://learn.microsoft.com/azure/azure-resource-manager/management/relocate-index) — The broader Azure-to-Azure relocation process, which distinguishes assessment from migration and cutover.

## Next step

> [!div class="nextstepaction"]
> [Regional capability and availability](./regional-capability.md)
