---
title: Regional design overview
description: Select the regional design for a qualified Azure region with three choices from short lists — the Platform Services profile, where each shared service is provided, and whether existing hybrid connectivity is reused — and record them so the region can be prepared.
ms.date: 10/28/2026
ms.topic: conceptual
---

# Regional design overview

Selecting the regional design is a set of decisions, not a deployment. For each qualified region, you make three choices, each from a short list. Nothing is built yet: deployment follows later, through the automation you already run.

Each choice follows from the workloads you expect in the region, not from the footprint of an existing Full-Platform region.

| Choice | You select | Page |
|---|---|---|
| 1. Platform Services profile | One of four: No platform, Remote platform, Minimal platform, or Full platform. | [Select the Platform Services profile](./profile-selection.md) |
| 2. Shared-service placement | For each shared service the workloads depend on: local, remote, or global. | [Place shared services](./platform-enablement-connectivity.md) |
| 3. Hybrid connectivity | Reuse the existing foundation, change it, or confirm that none is required. | [Confirm hybrid connectivity](./hybrid-connectivity.md) |

<!-- site-only:start -->
> [!TIP]
> The [Multi-region planner](./region-planner.html) walks through the three choices for each selected region and produces the regional design record.
<!-- site-only:end -->

## Start from workload requirements

Use the workload requirements identified earlier to determine how workloads should consume regional and centralized platform capabilities. Workload Landing Zone archetypes can help inform the assessment, but the resulting connectivity design should be based on the actual dependencies and requirements of each workload.

- For existing workloads, particularly those with legacy or hybrid dependencies, use validated application, network, datacenter, and shared-service dependencies to determine whether existing Full-Platform regions can continue to support the workload or whether additional regional capabilities are required.
- For new workloads, derive connectivity needs from the intended architecture and known dependencies, using the Workload Landing Zone archetypes as a planning aid. Reuse existing Full-Platform regions, shared services, and platform capabilities where they meet those needs; a new region does not automatically require a new platform footprint.

Existing and new workloads follow the same rule: requirements and dependencies determine the Platform Services profile. Known requirements can shape platform planning in advance; validate workload-specific fit during onboarding and add regional capabilities only when justified.

## Three choices on one path

The three choices sit on one path, from on-premises locations to the workloads in the region. They influence one another, but each has different requirements and tradeoffs. Connectivity that is specific to one application isn't decided here. It is designed when the [workload is placed](./workload-placement.md).

:::image type="content" source="./media/connectivity-planning-layers.png" alt-text="Three decisions shown on one path. Resilient hybrid connectivity links on-premises datacenters and users to the Azure backbone in the selected geography through ExpressRoute or VPN. Platform capabilities covers the Full-Platform regions and shared services, each provided locally, remotely, or centrally. Regional platform connectivity covers the Workload Landing Zones, supported by the Platform Services profile." lightbox="./media/connectivity-planning-layers.png":::

*The three decisions on one path: resilient hybrid connectivity, platform capabilities, and regional platform connectivity. They are related, but each is a separate decision.*

## The regional design record

Keep one record per region. Record the selected profile, the placement of each shared platform service (and which region provides the remote ones), the hybrid connectivity decision, the owner, the date, and the triggers that would reopen the decision.

| Region | Platform Services profile | Shared services | Hybrid connectivity | Open conditions |
|---|---|---|---|---|
| Region C | Minimal platform | Local: selected capabilities. Remote from Region A: remaining shared services. | Reuse: existing foundation where required. | None |
| Region D | Remote platform | Remote from a Full-Platform region. | Reuse: via the remote region where required. | Latency test with representative traffic. |
| Region E | No platform | None required. | Not required. | None |

*Illustrative example. Regions and choices are examples only.*

A region with a complete record is **selected**. Record the open conditions of a conditional region with it, and update the record when a reassessment trigger applies.

## In this section

- [Select the Platform Services profile](./profile-selection.md): the selection principles, the decision tree, and what each step up costs.
- [Place shared services](./platform-enablement-connectivity.md): where each shared service is provided, with a default for each profile.
- [Confirm hybrid connectivity](./hybrid-connectivity.md): whether the hybrid connectivity you already have is enough.

## Next step

> [!div class="nextstepaction"]
> [Select the Platform Services profile](./profile-selection.md)
