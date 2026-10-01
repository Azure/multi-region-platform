---
title: Regional assessment outcome
description: Classify each candidate Azure region as excluded, candidate, conditional, or qualified against defined workload requirements, and record the evidence behind the decision.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Regional assessment outcome

Consolidate the workload requirements and platform needs identified through the five dimensions. Assess each candidate region against the same criteria and document the result, key tradeoffs, and outstanding validation. Reuse the assessment in architecture reviews and regional planning.

Classify each regional option as:

- **Excluded:** A mandatory requirement cannot be satisfied.
- **Candidate:** The region is potentially viable, but additional discovery or platform enablement is required before qualification.
- **Conditional:** Current evidence supports the defined workload requirements if one or more documented conditions are resolved.
- **Qualified as of the assessment date:** Current evidence supports the defined workload requirements, platform ownership is established, and workload-onboarding revalidation is still required.

Record the evidence date, review date, workload requirements in scope, required platform connectivity profile, key constraints, outstanding validations, owner, and revalidation triggers.

:::image type="content" source="./media/assessment-outcome-example.png" alt-text="Example grid of five candidate regions against the four archetypes. Two strategic hub regions are qualified for most archetypes; an in-country region is qualified for two, conditional for one, and a candidate for another; an AI region is qualified for isolated AI and conditional for connected AI; a region in another geography is excluded for all." lightbox="./media/assessment-outcome-example.png":::

*Illustrative example: one portfolio, classified per archetype. Regions and statuses are illustrative.*

The same region can be qualified for one set of requirements, conditional or a candidate for another, and excluded for a third. Qualification is a dated planning input, not permanent approval; decision-time validation at onboarding remains authoritative.

> [!NOTE]
> The purpose is not to certify a region for every possible workload, but to know which options are excluded, which remain candidates or conditional, and which are ready for defined workload requirements.

Workload onboarding revalidates options and feeds new findings back into the assessment. See [Workload placement](./workload-placement.md).

## Next step

> [!div class="nextstepaction"]
> [Business and geography](./business-and-geography.md)
