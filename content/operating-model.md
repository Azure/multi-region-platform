---
title: Governance and operating model
description: Keep governance, security, automation, and operational standards consistent across the Azure estate while regional implementation and workload placement adapt.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Governance and operating model

A multi-region platform should use one operating model across the estate. Keep governance and architecture standards stable, while regional implementation and workload placement adapt to business, application, and regulatory requirements.

:::image type="content" source="./media/operating-model-consistent-adaptable.png" alt-text="Six adaptable decisions — application regional placement, controls for regional or data-boundary requirements, regional connectivity profile, regional service and SKU parameters, local shared-services footprint, and workload scale and resiliency decisions — each sitting on a consistent foundation of governance guardrails, identity and security baselines, architecture principles, deployment automation, monitoring and operational standards, and ownership and lifecycle processes." lightbox="./media/operating-model-consistent-adaptable.png":::

*What stays consistent and what adapts. Placement varies, governance does not; profiles vary, approved patterns do not.*

| Keep consistent | Adapt by region and workload | Example |
|---|---|---|
| Governance guardrails and policy intent | Application regional placement | Same policy set everywhere; the allowed-locations setting differs per landing zone |
| Identity, security, and compliance baselines | Controls for regional or data-boundary requirements | Same baseline; an added data-residency control only where a regulation requires it |
| Architecture principles and approved patterns | Regional platform connectivity profile | Same approved hub design; one region is a Full Regional Hub, another is Remote Hub Connected |
| Deployment automation and infrastructure as code | Regional service, SKU, and configuration parameters | Same modules and pipelines; region and SKU are passed in as parameters |
| Monitoring, support, and operational standards | Local shared-services footprint | Same alerting and runbooks; local DNS or firewall only where needed |
| Ownership, approval, and lifecycle processes | Workload scale, latency, dependency, and resiliency decisions | Same approval path; each workload team decides its own recovery design |

## Who decides what

- **The platform team** owns regional qualification, the connectivity profile for each region, and the decision register. Adding platform capability to a region is a platform decision, not something a workload team changes on its own.
- **Security and compliance** own the mandatory gates: data residency, sovereignty, and policy requirements.
- **Workload teams** own placement and resiliency decisions for their workloads, within the qualified options.

Each qualified option has a named owner, an assessment date, and revalidation triggers. See [Regional assessment outcome](./assessment-outcome.md).

## Region-agnostic does not mean region-random

Regional adaptability operates within a governed framework. Workloads select from qualified regional options based on their requirements, their Workload Landing Zone archetype, and each region's current capabilities and qualification status. Regional qualification should be reassessed as workload requirements and Azure capabilities change.

## Next step

> [!div class="nextstepaction"]
> [Workload placement](./workload-placement.md)
