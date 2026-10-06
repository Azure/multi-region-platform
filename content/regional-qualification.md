---
title: Regional qualification overview
description: Use four checks and one decision tree to determine which Azure regions should be prepared to support workload requirements, classify each regional option as excluded, candidate, conditional, or qualified, and record it with evidence, owners, and revalidation triggers.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Regional qualification overview

Regional qualification determines which Azure regions should be prepared to support workload requirements. It does not determine whether an individual workload should use multiple regions or define its multi-region architecture. Those are workload-specific design decisions. Use the following four checks to evaluate candidate regions consistently.

:::image type="content" source="./media/regional-qualification-framework.png" alt-text="Four check cards in sequence — business and geography, data and compliance, workload requirements and dependencies, and regional capability and availability — each with its key question and decision. The third card is wider and lists what comes from the workloads beside what they require from the platform: platform enablement, resilient hybrid connectivity, and regional platform connectivity. Below the cards are the four qualification outcomes: excluded, candidate, conditional, and qualified." lightbox="./media/regional-qualification-framework.png":::

*The qualification checks, in the recommended sequence. Outcomes are specific to defined workload requirements, never a blanket certification.*

| Check | Question | Decision |
|---|---|---|
| [1. Business and geography](./business-and-geography.md) | Where do we need Azure presence? | Confirm that the region has sufficient business value to justify deeper assessment. |
| [2. Data and compliance](./data-and-compliance.md) | Are we allowed to operate here? | Exclude a region when it cannot satisfy a mandatory data, compliance, or policy requirement. |
| [3. Workload requirements and dependencies](./workload-requirements.md) | What workload requirements and dependencies must the region support? | Identify and record the workload-driven platform requirements that check 4 validates and step 3 uses. |
| [4. Regional capability and availability](./regional-capability.md) | Which regions can support the identified workload requirements? | Qualify candidate regions, documenting conditions, constraints, and unresolved validations. |

The checks produce one of four outcomes for each regional option: **excluded**, **candidate**, **conditional**, or **qualified as of the assessment date**.

## Assessment outcome

Consolidate the workload requirements and platform needs identified through the four checks. Assess each candidate region against the same criteria and document the result, key tradeoffs, and outstanding validation. Reuse the assessment in architecture reviews and regional planning.

Classify each regional option as:

- **Excluded:** A mandatory requirement cannot be satisfied.
- **Candidate:** The region is potentially viable, but additional discovery or validation is required before qualification.
- **Conditional:** Current evidence supports the defined workload requirements if one or more documented conditions are resolved.
- **Qualified as of the assessment date:** Current evidence supports the defined workload requirements, platform ownership is established, and workload-onboarding revalidation is still required.

Record the evidence date, review date, workload requirements in scope, key constraints, outstanding validations, owner, and revalidation triggers. Add the platform connectivity profile when you select it in [step 3](./platform-architecture.md).

:::image type="content" source="./media/assessment-outcome-example.png" alt-text="Example grid of five candidate regions against the four archetypes. Two strategic hub regions are qualified for most archetypes; an in-country region is qualified for two, conditional for one, and a candidate for another; an AI region is qualified for isolated AI and conditional for connected AI; a region in another geography is excluded for all." lightbox="./media/assessment-outcome-example.png":::

*Illustrative example: one portfolio, classified per archetype. Regions and statuses are illustrative.*

The same region can be qualified for one set of requirements, conditional or a candidate for another, and excluded for a third. Qualification is a dated planning input, not permanent approval; decision-time validation at onboarding remains authoritative.

> [!NOTE]
> The purpose is not to certify a region for every possible workload, but to know which options are excluded, which remain candidates or conditional, and which are ready for defined workload requirements.

## Should this region be qualified?

Apply the tree per candidate region and set of defined workload requirements. Each question is one of the four checks, and each branch ends in one of four classifications: excluded, candidate, conditional, or qualified.

Use the tree to structure the conversation, not as a gate. Most paths are short, and a "no" or "not yet" is a valid, low-cost answer that you record and revisit when conditions change.

:::image type="content" source="./media/regional-qualification-decision-tree.png" alt-text="Decision tree with four questions, one for each qualification check. A no on business value ends the assessment; a mandatory data or compliance gap excludes the region; workload requirements, dependencies, archetypes, or platform needs that are not yet known leave the region a candidate; unresolved regional capability makes it conditional; passing every question qualifies the region as of the assessment date." lightbox="./media/regional-qualification-decision-tree.png":::

*Regional qualification decision tree. Filters come first, then requirements, then technical fit. Candidate and conditional options return to the tree when validation is complete, or when conditions change.*

The four questions, in order:

| Question | If the answer is no or not yet |
|---|---|
| 1. Does the region have sufficient business value to justify deeper assessment? | Stop. No deeper assessment is needed. |
| 2. Can it satisfy all mandatory data, compliance, and policy requirements? | **Excluded.** A mandatory requirement cannot be satisfied. |
| 3. Are the workload requirements, dependencies, archetypes, and platform needs known and validated? | **Candidate.** Complete discovery, or set guardrails and assess at onboarding. |
| 4. Do services, models, SKUs, zones, access, and quota meet the requirements, including recovery? | **Conditional**, or excluded if the gap is mandatory. Record material gaps, required changes, and validation owners. |

A yes to all four means the region is **qualified** for the defined workload requirements as of the assessment date. The next step is to [select its capabilities and connectivity profile](./platform-architecture.md).

> [!TIP]
> Questions 1 and 2 need no technical assessment. Answer them for every candidate region first, so that deeper work is spent only on the regions that pass.

A qualified outcome is not a placement decision. Workload onboarding still revalidates regional suitability at decision time.

## Next step

> [!div class="nextstepaction"]
> [Business and geography](./business-and-geography.md)
