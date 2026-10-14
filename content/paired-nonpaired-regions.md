---
title: Paired and nonpaired regions
description: What Azure region pairing provides and what it doesn't, and how nonpaired or region-of-choice designs change responsibility for workload recovery.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Paired and nonpaired regions

Azure supports resilient architectures using paired regions, nonpaired regions, or combinations of both; the appropriate approach depends on workload requirements and the capabilities of the Azure services involved.

:::row:::
   :::column:::
      **Azure paired regions**

      *Platform-assisted regional relationship*

      - Microsoft defines region pairs, usually within the same Azure geography, although asymmetric and cross-geography exceptions exist.
      - Some Azure services use the paired region for built-in geo-replication or geo-redundancy.
      - Azure uses region pairs for considerations such as sequential platform updates and recovery prioritization.
      - Deploying into both members of a region pair does **not** automatically provide workload high availability, disaster recovery, or failover.

      **Consider:** Built-in service behavior can constrain the secondary region to the Azure-defined pair. Some paired regions have restricted access, and individual services can have different regional capabilities. Validate current service behavior before selecting a recovery architecture.
   :::column-end:::
   :::column:::
      **Nonpaired or region-of-choice designs**

      *Architecture-led recovery*

      - Many newer Azure regions are nonpaired and use availability zones as an important part of their intra-region resiliency model.
      - A multi-region workload can use a nonpaired or customer-selected secondary region where the required Azure services support that regional combination.
      - This can provide flexibility for residency, latency, service availability, or business-continuity requirements.
      - The recovery architecture, replication method, dependencies, and failover process must be explicitly designed and validated per workload.
   :::column-end:::
:::row-end:::

> [!IMPORTANT]
> Pairing can provide useful platform and service capabilities; it does not replace a tested workload recovery design.

## What to record during qualification

Assess availability zones, region pairing, and service-specific cross-region behavior separately, as described in [regional capability and availability](./regional-capability.md#availability-zones-and-region-pairing). For each regional combination that workloads are expected to use, record:

- Whether each region is paired, which region it is paired with, and whether access to the paired region is restricted.
- Availability-zone support in each region.
- For each service the workloads depend on, whether its cross-region capability is tied to the paired region or supports a region of choice.
- The intended recovery region for the defined workload requirements, and who validates the recovery path.

## Reference links

- [Azure region pairs and nonpaired regions](https://learn.microsoft.com/azure/reliability/regions-paired)
- [Azure services that support multiple regions](https://learn.microsoft.com/azure/reliability/regions-multiregion-support)
- [Multi-region solutions in nonpaired regions](https://learn.microsoft.com/azure/reliability/cross-region-replication-azure-no-pair)

## Next step

> [!div class="nextstepaction"]
> [Storage, backup, and Key Vault](./storage-backup-key-vault.md)
