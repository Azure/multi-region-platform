---
title: Platform architecture for a multi-region platform
description: How Workload Landing Zone archetypes and regional platform connectivity profiles work together to plan the platform capability each Azure region provides.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Platform architecture

Once candidate regions are qualified, two constructs help you decide what the platform provides in each region:

- **[Workload Landing Zone archetypes](./application-landing-zone-archetypes.md)** describe the demand: what applications need from the platform, grouped by recurring connectivity and dependency characteristics.
- **[Regional platform connectivity profiles](./connectivity-profiles.md)** describe the supply: what the platform provides in a region, from Disconnected Spokes through Remote Hub Connected and Minimal Regional Hub to a Full Regional Hub.

An archetype doesn't dictate a profile. Use the archetypes expected in a region to understand what it needs, then choose the lightest profile that meets those needs. For example, a hybrid-connected application might run well on a Remote Hub Connected profile in one region and need a Minimal Regional Hub in another, depending on latency, traffic, and resiliency requirements. One profile can also serve several archetypes at once.

:::image type="content" source="./media/archetype-profile-matrix.png" alt-text="Matrix of the four archetypes against the four connectivity profiles. Hybrid-connected and connected cloud-native or AI applications typically use remote hub, minimal hub, or full hub; isolated cloud-native or AI applications often use disconnected spokes and other profiles where justified; interconnected portfolios can use spoke-to-spoke connectivity, a remote hub where acceptable, and a minimal or full hub when justified." lightbox="./media/archetype-profile-matrix.png":::

*Archetype-to-profile relationships are many-to-many. Each row is a set of options, not an assignment; the selected profile follows dependencies, latency, traffic, resiliency, and independence requirements.*

> [!NOTE]
> Interconnected application portfolios need extra care, because their combined dependencies can call for more than any single application does. See [Interconnected Application Portfolios](./application-landing-zone-archetypes.md#interconnected-application-portfolios).

## In this section

- [Workload Landing Zone archetypes](./application-landing-zone-archetypes.md)
- [Regional platform connectivity profiles](./connectivity-profiles.md)
- [Profile selection and hub implementations](./profile-selection.md)
- [Platform readiness checklist](./platform-readiness.md)

## Next step

> [!div class="nextstepaction"]
> [Workload Landing Zone archetypes](./application-landing-zone-archetypes.md)
