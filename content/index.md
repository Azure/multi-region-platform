---
title: Multi-region platform strategy
description: Extend Azure landing-zone principles so that additional Azure regions become qualified options that workloads can use selectively, without separate governance models or an identical platform footprint in every region.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Multi-region platform strategy

Adding an Azure region shouldn't mean starting another landing-zone project. If you already run Azure landing zones, most of what a new region needs already exists: the governance, identity, policy, automation, and operating model.

## What adding a region involves

A new region is often assumed to be a large project. With this approach, it is a short series of decisions and a targeted change to the platform you already run.

| Common assumption | With this approach |
|---|---|
| A new region needs its own landing-zone design. | Reuse the existing landing zone. The region is added to the policies, automation, and monitoring you already run. See [Framework overview](./framework-overview.md#principles-and-constructs). |
| Every region needs a full hub. | Start with the most efficient [connectivity profile](./connectivity-profiles.md) that meets the requirements. Two of the four profiles need no local hub. |
| Every region needs another ExpressRoute circuit. | Reuse existing hybrid connectivity where reachability and resiliency requirements allow. Add circuits only when a requirement justifies them. See [Platform capabilities and connectivity](./platform-enablement-connectivity.md#resilient-hybrid-connectivity). |
| Enabling a region means migrating workloads. | Nothing has to move. Workloads use the region when their own requirements call for it. See [Place workloads](./workload-placement.md). |
| Qualification is a long assessment. | It is four checks, each with one question, answered from what your teams already know. Unknowns are recorded and revisited, not treated as blockers. See [Regional qualification](./regional-qualification.md). |

The first additional region takes the most thought, because the decisions are made for the first time. Later regions reuse those decisions and become mostly configuration. For more examples, see [Common misconceptions](./misconceptions.md).

## How it works

The framework has four parts. Each part answers one question.

1. **[Understand concepts](./platform-and-workload.md).** What is a multi-region platform, what can a region provide, and what do applications need? Four [connectivity profiles](./connectivity-profiles.md) describe the platform options. Four [Workload Landing Zone archetypes](./application-landing-zone-archetypes.md) describe what applications require.
1. **[Qualify regions](./regional-qualification.md).** Can this region support the workloads we expect? Four checks lead to one of four outcomes: excluded, candidate, conditional, or qualified.
1. **[Select capabilities and connectivity profile](./platform-architecture.md).** What should the platform provide in a qualified region? Decide which capabilities are local, remote, or centralized, whether the hybrid connectivity you already have is enough, and the most efficient profile that meets the requirements.
1. **[Place workloads](./workload-placement.md).** Should this workload use the region now? Decide per workload, with current evidence.

> [!TIP]
> New to the framework? [Getting started](./getting-started.md) walks through the first additional region in five steps.

## From a fixed pair to governed options

:::image type="content" source="./media/fixed-pair-to-governed-options.png" alt-text="Diagram comparing a fixed primary and disaster-recovery region pair, where the full footprint is mirrored, with an adaptable platform in which six regions sit on one governed landing-zone foundation: two strategic hubs, a minimal hub, remote-hub-connected spokes, isolated spokes, and a candidate region." lightbox="./media/fixed-pair-to-governed-options.png":::

*From a fixed regional pair to governed regional options. Instead of mirroring a complete footprint in each new region, the platform extends one governed foundation and gives each region only the capability its workloads require.*

## Related resources

- [Framework overview](./framework-overview.md): the drivers, principles, planning constructs, and adoption journey behind the four parts.

## Next step

> [!div class="nextstepaction"]
> [Getting started](./getting-started.md)
