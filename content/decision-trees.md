---
title: Multi-region decision trees
description: Two decision tools for a multi-region Azure platform — whether a candidate region should be qualified, and which regional platform connectivity profile a region should provide.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Multi-region decision trees

Most multi-region platform discussions come down to two decisions: whether a candidate region should become a qualified option, and how much platform capability that region needs. Each decision tree puts one of those decisions on a page.

Use the trees to structure the conversation, not as gates. Most paths are short, and a "no" or "not yet" is a valid, low-cost answer that you record and revisit when conditions change. Each question maps to guidance elsewhere in this scenario.

## Should this region be qualified?

Apply the tree per candidate region and set of defined workload requirements. Each decision point is a dimension of the [Regional Qualification Framework](./regional-qualification.md), and each branch ends in one of four classifications: excluded, candidate, conditional, or qualified.

:::image type="content" source="./media/regional-qualification-decision-tree.png" alt-text="Decision tree with six questions that follow the five qualification dimensions. A no on business value ends the assessment; a mandatory data or compliance gap excludes the region; unknown workload requirements, missing hybrid connectivity, or missing platform enablement leave the region a candidate; unresolved regional capability makes it conditional; passing every question qualifies the region as of the assessment date." lightbox="./media/regional-qualification-decision-tree.png":::

*Regional qualification decision tree. Filters come first, then technical fit, then platform readiness. Candidate and conditional options return to the tree when validation or enablement is complete, or when conditions change.*

The six questions, in order:

| Question | If the answer is no or not yet |
|---|---|
| 1. Does the region have sufficient business value to justify deeper assessment? | Stop. No deeper assessment is needed. |
| 2. Can it satisfy all mandatory data, compliance, and policy requirements? | **Excluded.** A mandatory requirement cannot be satisfied. |
| 3. Are the workload requirements, archetypes, and dependencies known and validated? | **Candidate.** Complete discovery, or set guardrails and assess at onboarding. |
| 4. Do services, models, SKUs, zones, access, and quota meet the requirements, including recovery? | **Conditional**, or excluded if the gap is mandatory. Record material gaps, required changes, and validation owners. |
| 5. Is the hybrid connectivity foundation sufficient for datacenters and users in the geography? | **Candidate.** Identify the required changes to backbone access, diversity, scale, or ownership. |
| 6. Are the capability set and connectivity profile defined, with platform ownership established? | **Candidate.** Platform enablement is required before the requirements are supported. |

A yes to all six means the region is **qualified** for the defined workload requirements as of the assessment date.

> [!TIP]
> Questions 1 and 2 need no technical assessment. Answer them for every candidate region first, so that deeper work is spent only on the regions that pass.

A qualified outcome is not a placement decision. Workload onboarding still revalidates regional suitability at decision time. For each classification, see [Regional assessment outcome](./assessment-outcome.md).

## Which connectivity profile should this region provide?

Start from the workload requirements and dependencies expected in the region. Each question comes from the "choose when" criteria of the [connectivity profiles](./connectivity-profiles.md); stop at the first profile that satisfies the identified requirements.

:::image type="content" source="./media/connectivity-profile-decision-tree.png" alt-text="Decision tree with three questions. If workloads need no private access to enterprise services, use disconnected spokes. If they can tolerate the latency and coupling of another region, use remote-hub-connected spokes. If requirements do not justify a comprehensive local capability set, use a minimal regional hub; otherwise use a full regional hub." lightbox="./media/connectivity-profile-decision-tree.png":::

*Connectivity profile selection tree. Questions escalate from dependency, to tolerance of remote consumption, to required independence. The outcome is a platform capability, not a workload design.*

The same tree as a table, lightest profile first:

| Profile | Choose when the workloads expected in the region | What the region gets |
|---|---|---|
| Disconnected Spokes | Need no private access to enterprise services, on-premises systems, centralized security inspection, another application portfolio, or geographic-hub capabilities. | No hub and no gateway. Workload spokes use the estate's standard identity, policy, security, and deployment practices. |
| Remote Hub Connected | Need that access, and can tolerate the latency, availability coupling, and dependency on connectivity to another region. | No local hub. Workload spokes consume an existing geographic hub. |
| Minimal Regional Hub | Need some capabilities locally, without a comprehensive local set. | A limited hub with only the services that must be local. Everything else stays remote. |
| Full Regional Hub | Need a comprehensive local capability set, or independence from other hubs. | The complete local connectivity and shared services that the region's workloads require. |

Two of the four profiles need no local hub, and only the Full Regional Hub approaches the footprint of an existing geographic hub.

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
