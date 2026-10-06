---
title: Multi-region platform and multi-region workload
description: A multi-region platform creates governed regional choices for the Azure estate. A multi-region workload applies one or more of those choices. Keep the two layers separate when you plan regions.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Multi-region platform and multi-region workload

A **multi-region platform** and a **multi-region workload** operate at different layers. The platform creates governed regional choices for the customer estate; the workload applies one or more of those choices to a specific workload. Keeping these concepts separate prevents multi-region strategy from being treated as an automatic requirement for a new landing zone, workload migration, active-active high availability, or active/passive disaster recovery.

<!-- site-only:start -->
## The city analogy

Think of the platform as a city, and workloads as the people and businesses that live in it. The city builds neighborhoods, services, roads, transit, and laws once. A family settles in one neighborhood; a bank spreads across several. Neither builds a new city.

:::image type="content" source="./media/city-analogy.png" alt-text="Isometric city used as an analogy for a multi-region platform. An office campus outside the city connects to Downtown through express toll lanes with two interchanges. Downtown has every service locally. Riverside has a fire station and a clinic. Hillcrest and Midtown have homes only and reach Downtown's services by transit. Lakeside is an off-grid island with no roads or transit. A new plot is zoned but not yet built. Numbered pins mark where four families live, and bank badges mark two branches and a backup operations center." lightbox="./media/city-analogy.png":::

*The platform as a city. Each neighborhood stands for a region with a different connectivity profile; the office campus is on-premises. Use the download button for the complete picture, including both workloads.*

:::row:::
   :::column:::
      **The household: a single-region workload**

      Most workloads live in one neighborhood: the one that fits how they live.

      1. **Commutes to the office every day** (hybrid-connected) picks Hillcrest, for transit plus the express lanes.
      2. **Works fully remote and is self-sufficient** (isolated) picks Lakeside; off-grid is fine.
      3. **Works remote but relies on city services** (connected) picks Midtown, one transit ride from the hospital.
      4. **Extended family, always visiting** (interconnected portfolio) picks Riverside, with local services for a close-knit group.
   :::column-end:::
   :::column:::
      **The bank: a multi-region workload**

      Some workloads need several neighborhoods, for reach and for resilience.

      - **Headquarters and core systems** stay on the office campus: on-premises.
      - **Express lanes through two interchanges**, so one can close: ExpressRoute with circuit diversity.
      - **Branches in Riverside and Midtown** serve customers together: active-active.
      - **A backup operations center in Hillcrest** stands by: active/passive recovery.
      - **Banking licenses and secure vaults** on top of city law: compliance and specialized SKUs.
   :::column-end:::
:::row-end:::

| In the city | In Azure |
|---|---|
| Neighborhoods | Azure regions |
| Transit between neighborhoods | Connectivity between regions |
| Express toll lanes | ExpressRoute |
| Office campus outside the city | On-premises |
| Police, fire, hospitals, utilities | Shared services |
| Laws, codes, zoning | Governance and policy |
<!-- site-only:end -->

## Platform and workload layers

:::image type="content" source="./media/platform-and-workload-layers.png" alt-text="Diagram contrasting the multi-region platform, which creates governed regional choices through governance, identity and security, monitoring, connectivity patterns, deployment automation, and quota planning, with the multi-region workload, which selects qualified regions for net-new placement, relocation, active/passive recovery, active-active distribution, or continued single-region operation." lightbox="./media/platform-and-workload-layers.png":::

- A **multi-region platform** targets placement flexibility across the Azure estate. It qualifies additional regions through the existing landing-zone operating model, approved connectivity patterns, deployment automation, and quota planning. It does not require a separate connectivity landing zone or identical shared services in every region; workload requirements determine the cross-region design.
- A **multi-region workload** targets the requirements of a specific workload or component. Depending on workload requirements and regional suitability, the outcome might be net-new placement in another region, selective relocation, active/passive recovery, active-active distribution, or continued operation in one region.

| | Multi-region platform | Multi-region workload |
|---|---|---|
| **Purpose** | Enable placement flexibility across qualified Azure regions | Meet workload-specific objectives and requirements such as availability, disaster recovery, user proximity, or regulatory requirements |
| **Focus** | Regional readiness and consistency of shared platform capabilities | Application architecture, data, dependencies, traffic, availability, and recovery |
| **Design driven by** | The needs of the portfolio of workloads the platform is expected to support | The specific workload's requirements, such as availability, resiliency, RTO/RPO, latency, or data requirements |

Multi-region platform readiness establishes the shared capabilities needed to support workloads across selected Azure regions. Reuse the existing Azure landing-zone operating model by default. Extend regional policy parameters, connectivity, shared services, automation, and operations only where documented workload requirements justify them. Regional suitability depends on service and SKU fit, dependencies, quota, latency, cost, and data constraints; actual capacity remains a deployment-time condition.

## Next step

> [!div class="nextstepaction"]
> [Common connectivity profiles](./connectivity-profiles.md)
