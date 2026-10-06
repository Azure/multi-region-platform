---
title: "Check 4: Regional capability and availability"
description: Evaluate candidate Azure regions against identified workload requirements — services, SKUs, availability zones, pairing, latency, pricing, access, and quota.
ms.date: 10/05/2026
ms.topic: conceptual
---

# Regional capability and availability

**Question:** Which regions can support the identified workload requirements?

Evaluate each candidate region against the workload requirements identified in check 3. Consider required Azure services, deployment models and SKUs, availability-zone support, regional service dependencies, latency, pricing, expected scale, regional access, and quota requirements.

## Availability zones and region pairing

Assess availability-zone support and region pairing separately. Prefer zone-enabled regions when zone resiliency is required, but do not assume that region pairing alone provides workload recovery or that a nonpaired region cannot be used as a recovery destination. Validate service-specific capabilities such as replication, backup and restore, and other regional dependencies against the resiliency requirements identified for the workload.

For requirements that depend on multiple regions, validate the intended regional combination at the service level. This includes built-in paired-region behavior such as Storage GRS and region-of-choice capabilities such as Azure SQL replication. Record material gaps, required changes, and owners for unresolved validation. For detailed design, see [Service behavior across regions](./workload-design.md).

:::image type="content" source="./media/zones-and-pairing.png" alt-text="Availability-zone support and region pairing shown as two separate considerations, with two cautions — do not assume a paired region provides workload recovery, and do not assume a nonpaired region cannot support it — and a validation step for Storage GRS, Azure SQL replication, backup and restore, and Key Vault that leads either to built-in capabilities or to additional workload design." lightbox="./media/zones-and-pairing.png":::

*Zones and pairing are independent questions. Neither guarantees nor rules out workload recovery.*

## Regional access and quota

Validate whether the intended subscription and offer types can deploy in the region, and identify any regional access restrictions or approvals that must be resolved before deployment. Assess required quota based on expected workload scale and identify any quota increases that may be required.

> [!IMPORTANT]
> Quota should not be treated as an indication or guarantee of Azure capacity, which remains subject to availability at deployment time.

## Evidence-based evaluation

Where possible, evaluate objective regional characteristics programmatically. Inputs can include required services and SKUs, zone requirements, latency targets, pricing considerations, expected scale, access eligibility, and quota requirements. The resulting assessment should identify candidate regions, unmet requirements, conditional constraints, and items that require additional validation. Use manual review for considerations that cannot be determined reliably from published or programmatically available information.

:::image type="content" source="./media/programmatic-regional-evaluation.png" alt-text="Inputs such as services and SKUs, zone requirements, latency targets, pricing, expected scale, and access and quota feed a regional assessment, supplemented by manual review, which produces candidate regions, unmet requirements, conditional constraints, and items requiring validation." lightbox="./media/programmatic-regional-evaluation.png":::

*Programmatic regional evaluation narrows the options; manual review covers what can't be determined reliably.*

If a requirement that could materially affect regional suitability is unresolved, retain the region as a conditional candidate until it is validated. Evaluate requirements that do not affect regional qualification later, during workload onboarding or reassessment.

**Decision:** Qualify candidate regions against identified workload requirements, documenting conditions, constraints, and unresolved validations while preserving viable options for future workloads.

## Reference links

- [Azure region pairs and nonpaired regions](https://learn.microsoft.com/azure/reliability/regions-paired)
- [Azure services that support multiple regions](https://learn.microsoft.com/azure/reliability/regions-multiregion-support)
- [Azure services that support availability zones](https://learn.microsoft.com/azure/reliability/availability-zones-service-support)
- [Zonal resources and zone resiliency](https://learn.microsoft.com/azure/reliability/availability-zones-zonal-resource-resiliency)
- [Enable zone resiliency for Azure workloads](https://learn.microsoft.com/azure/reliability/availability-zones-enable-zone-resiliency)

## Next step

> [!div class="nextstepaction"]
> [Capabilities and connectivity profile overview](./platform-architecture.md)
