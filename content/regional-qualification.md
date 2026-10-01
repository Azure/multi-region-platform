---
title: Regional qualification for a multi-region platform
description: Use five dimensions to determine which Azure regions should be prepared to support workload requirements, and record each regional option with evidence, owners, and revalidation triggers.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Regional qualification

This framework determines which Azure regions should be prepared to support workload requirements. It does not determine whether an individual workload should use multiple regions or define its multi-region architecture. Those are workload-specific design decisions. Use the following five dimensions to evaluate candidate regions consistently.

:::image type="content" source="./media/regional-qualification-framework.png" alt-text="Five dimension cards in sequence — business and geography, data and compliance, workload requirements and dependencies, regional capability and availability, and platform enablement and connectivity — each with its key question and decision, followed by the four framework outcomes: excluded, candidate, conditional, and qualified." lightbox="./media/regional-qualification-framework.png":::

*The five dimensions, in the recommended sequence. Outcomes are specific to defined workload requirements, never a blanket certification.*

| Dimension | Question | Decision |
|---|---|---|
| [1. Business and geography](./business-and-geography.md) | Where do we need Azure presence? | Confirm that the region has sufficient business value to justify deeper assessment. |
| [2. Data and compliance](./data-and-compliance.md) | Are we allowed to operate here? | Exclude a region when it cannot satisfy a mandatory data, compliance, or policy requirement. |
| [3. Workload requirements and dependencies](./workload-requirements.md) | What workload requirements and dependencies must the region support? | Identify the workload-driven platform requirements that must be validated as part of regional qualification. |
| [4. Regional capability and availability](./regional-capability.md) | Which regions can support the identified workload requirements? | Qualify candidate regions, documenting conditions, constraints, and unresolved validations. |
| [5. Platform enablement and connectivity](./platform-enablement-connectivity.md) | What must the platform enable for the identified workload requirements? | Define the most efficient capability set and regional connectivity profile. |

The dimensions produce one of four outcomes for each regional option: **excluded**, **candidate**, **conditional**, or **qualified as of the assessment date**. For definitions and what to record, see [Regional assessment outcome](./assessment-outcome.md). To walk the dimensions as a single flow, use the [regional qualification decision tree](./decision-trees.md#should-this-region-be-qualified).

## Next step

> [!div class="nextstepaction"]
> [Regional assessment outcome](./assessment-outcome.md)
