---
title: Workload placement using qualified options
description: Eight steps to place a workload in a qualified Azure region, with decision-time validation and feedback into regional qualification.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Workload placement

Place a workload only after its requirements are understood well enough to make a decision. Regional qualification narrows the choices; it does not permanently approve a region for every application.

Placement ends in one of these outcomes: place the workload in a qualified region, keep it where it is, relocate it, extend it to another region for recovery or active use, or conclude that no qualified option meets its requirements yet.

:::image type="content" source="./media/workload-placement-flow.png" alt-text="Eight-step placement flow grouped into understanding the workload, matching it to qualified regional options, and deciding and governing. Side outcomes cover guaranteed capacity, additional platform capabilities as a separate governed decision, and valid outcomes such as retaining the current region; findings loop back to regional qualification." lightbox="./media/workload-placement-flow.png":::

*Workload placement using qualified options. Onboarding findings return to regional qualification, closing the loop between platform readiness and workload adoption.*

## The eight placement steps

For each workload or related application portfolio:

1. **Define the placement objective.** Is the workload new, staying where it is, or moving or expanding to another region?
1. **Identify the Workload Landing Zone archetype.** Assess the workload's connectivity, shared-service, data, security, operational, and dependency characteristics and pick the closest-fitting archetype. Record any material requirements it doesn't cover as explicit additions to it.
1. **Establish mandatory requirements.** Confirm data-location restrictions, required Azure services and features, availability-zone requirements, latency thresholds, expected scale, connectivity, resiliency requirements, and critical dependencies.
1. **Review qualified regional options.** Consider regions previously assessed against the relevant workload requirements. Review their supported capabilities, connectivity profiles, known constraints, when each was last assessed, and any outstanding validations.
1. **Validate current regional suitability.** Qualification was an earlier planning assessment, so re-check the target region before onboarding, whether the workload is new or moving. Confirm that the services, SKUs, AI models, regional access, quota, and dependencies it needs are available now. Quota allows deployment but doesn't guarantee capacity. If the workload needs guaranteed capacity, decide here whether to reserve it.
1. **Select the supporting connectivity profile.** Confirm that an available regional connectivity profile satisfies the workload's requirements. If additional platform capabilities are required, treat their introduction as a separate governed platform decision rather than allowing the workload team to redefine the regional profile independently.
1. **Determine the resiliency role separately.** Define whether the region will support the workload as its primary location, recovery location, or as part of a multi-region active deployment. Apply workload-specific availability, RTO, RPO, replication, data-consistency, and failover requirements.
1. **Record and govern the decision.** Document the selected region, Workload Landing Zone archetype, connectivity profile, placement and resiliency outcomes, assumptions, constraints, owners, and revalidation triggers. Feed newly identified regional requirements or platform gaps back into the regional qualification process.

## Qualification versus placement

:::image type="content" source="./media/qualification-versus-placement.png" alt-text="Platform qualification asks whether a region is a viable option for defined requirements; workload placement asks where and in what role a workload runs. Qualified options flow to placement and new findings flow back." lightbox="./media/qualification-versus-placement.png":::

*The platform qualifies regions against defined requirements; each workload decides where and how it actually runs. Each informs the other.*

Regional adaptability still operates within the established landing-zone guardrails and qualified regional options.

Workload onboarding can reveal new regional requirements, constraints, or platform gaps. Use these findings to update regional qualification and determine whether an option should remain qualified, become conditional, require additional platform capabilities, or be removed from consideration for the affected workload requirements.

## Next step

> [!div class="nextstepaction"]
> [Regional dependencies and resiliency](./workload-design.md)
