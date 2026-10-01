---
title: Multi-region workload design
description: Workload-level resiliency guidance for a multi-region Azure platform — paired and nonpaired regions, storage, backup, Key Vault, and resiliency scenarios.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Multi-region workload design

A multi-region platform creates qualified regional options. Whether a specific workload uses more than one of those regions, and how, is a workload design decision. Depending on workload requirements and regional suitability, the outcome might be net-new placement in another region, selective relocation, active/passive recovery, active-active distribution, or continued operation in one region.

Workload design depends on regional behavior that qualification alone doesn't settle. Region pairing is one input into resiliency design, not the definition of it, and cross-region behavior can differ significantly by service and regional combination. The articles in this section cover the dependencies that most often decide whether a regional combination works as built.

| Article | What it covers |
|---|---|
| [Paired and nonpaired regions](./paired-nonpaired-regions.md) | What pairing provides, what it doesn't, and how region-of-choice designs shift responsibility for recovery. |
| [Storage, backup, and Key Vault](./storage-backup-key-vault.md) | Paired-region and region-of-choice behavior for three services that need special attention, and the recommended Key Vault pattern. |
| [Resiliency scenarios](./resiliency-scenarios.md) | Three situations that show how service behavior changes a recovery design. |

For workload-level multi-region architecture guidance, see [Using availability zones and regions](https://learn.microsoft.com/azure/well-architected/design-guides/regions-availability-zones) in the Azure Well-Architected Framework and the [Azure reliability service guides](https://learn.microsoft.com/azure/reliability/overview-reliability-guidance).

## Next step

> [!div class="nextstepaction"]
> [Paired and nonpaired regions](./paired-nonpaired-regions.md)
