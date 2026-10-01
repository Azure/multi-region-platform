---
title: Multi-region decision trees
description: Two decision tools for a multi-region Azure platform — whether a candidate region should be qualified, and which regional platform connectivity profile a region should provide.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Multi-region decision trees

Two decisions recur in every multi-region platform discussion: whether a candidate region should become a qualified option, and how much platform capability that region needs. Use these decision trees to structure both conversations. Each question maps to guidance elsewhere in this scenario.

## Should this region be qualified?

Apply the tree per candidate region and set of defined workload requirements. Each decision point is a dimension of the [Regional Qualification Framework](./regional-qualification.md), and each branch ends in one of four classifications: excluded, candidate, conditional, or qualified.

:::image type="content" source="./media/regional-qualification-decision-tree.png" alt-text="Decision tree with six questions that follow the five qualification dimensions. A no on business value ends the assessment; a mandatory data or compliance gap excludes the region; unknown workload requirements, missing hybrid connectivity, or missing platform enablement leave the region a candidate; unresolved regional capability makes it conditional; passing every question qualifies the region as of the assessment date." lightbox="./media/regional-qualification-decision-tree.png":::

*Regional qualification decision tree. Filters come first, then technical fit, then platform readiness. Candidate and conditional options return to the tree when validation or enablement is complete, or when conditions change.*

A qualified outcome is not a placement decision. Workload onboarding still revalidates regional suitability at decision time. For each classification, see [Regional assessment outcome](./assessment-outcome.md).

## Which connectivity profile should this region provide?

Start from the workload requirements and dependencies expected in the region. Each question comes from the "choose when" criteria of the [connectivity profiles](./connectivity-profiles.md); stop at the first profile that satisfies the identified requirements.

:::image type="content" source="./media/connectivity-profile-decision-tree.png" alt-text="Decision tree with three questions. If workloads need no private access to enterprise services, use disconnected spokes. If they can tolerate the latency and coupling of another region, use remote-hub-connected spokes. If requirements do not justify a comprehensive local capability set, use a minimal regional hub; otherwise use a full regional hub." lightbox="./media/connectivity-profile-decision-tree.png":::

*Connectivity profile selection tree. Questions escalate from dependency, to tolerance of remote consumption, to required independence. The outcome is a platform capability, not a workload design.*

Choose the most efficient profile, not the maximum possible one. Keep capabilities remote when latency, dependency, data, security, resiliency, availability, and operational characteristics permit; deploy locally only when a measurable requirement justifies it.

Profiles evolve in both directions. Reassess a region's profile when:

| Current profile | Reassess when |
|---|---|
| Disconnected Spokes | Workloads require private access to enterprise services, inspection, on-premises systems, another portfolio, or hub capabilities. |
| Remote Hub Connected | Cross-region traffic, latency, east-west communication, dependency criticality, regulation, scale, or availability coupling justify local capabilities. |
| Minimal Regional Hub | Growth adds local requirements, interconnected portfolios need broader capabilities, independence requirements become stricter, or significant local hybrid connectivity is required. |
| Full Regional Hub | Demand or requirements decrease, services can be safely centralized, dependencies change, or the footprint no longer justifies its cost. |

## Next step

> [!div class="nextstepaction"]
> [Regional qualification](./regional-qualification.md)
