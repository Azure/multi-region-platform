---
title: Platform architecture for a multi-region platform
description: How Application Landing Zone archetypes and regional platform connectivity profiles work together to plan the platform capability each Azure region provides.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Platform architecture

Once candidate regions are qualified, two constructs shape what the platform provides in each region:

- **[Application Landing Zone archetypes](./application-landing-zone-archetypes.md)** describe what applications require: recurring connectivity and dependency characteristics.
- **[Regional platform connectivity profiles](./connectivity-profiles.md)** describe what the platform provides: from Disconnected Spokes through Remote Hub Connected and Minimal Regional Hub to a Full Regional Hub.

The mapping is not one-to-one. One archetype can use different profiles, and one profile can support multiple archetypes. Keeping the two layers separate lets the platform plan capability without prescribing application designs.

:::image type="content" source="./media/archetype-profile-matrix.png" alt-text="Matrix of the four archetypes against the four connectivity profiles. Hybrid-connected and connected cloud-native or AI applications typically use remote hub, minimal hub, or full hub; isolated cloud-native or AI applications often use disconnected spokes and other profiles where justified; interconnected portfolios can use spoke-to-spoke connectivity, a remote hub where acceptable, and a minimal or full hub when justified." lightbox="./media/archetype-profile-matrix.png":::

*Archetype-to-profile relationships are many-to-many. Each row is a set of options, not an assignment; the selected profile follows dependencies, latency, traffic, resiliency, and independence requirements.*

## East-west traffic in interconnected portfolios

Where significant east-west traffic exists within a region, evaluate whether direct spoke-to-spoke connectivity or a regional hub is a better path than routing through a remote hub. Direct connectivity may suit a few tightly coupled workloads; a Minimal or Full Regional Hub fits broader routing, inspection, resiliency, or operational needs.

## Portfolio-level requirements

Because a portfolio's combined dependencies can require capabilities beyond any single application, select its profile from aggregate connectivity, shared-service, resiliency, scale, and operational requirements, not from a single workload.

## In this section

- [Application Landing Zone archetypes](./application-landing-zone-archetypes.md)
- [Regional platform connectivity profiles](./connectivity-profiles.md)
- [Profile selection and hub implementations](./profile-selection.md)
- [Platform readiness checklist](./platform-readiness.md)

## Next step

> [!div class="nextstepaction"]
> [Application Landing Zone archetypes](./application-landing-zone-archetypes.md)
