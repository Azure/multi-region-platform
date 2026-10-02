---
title: Regional dependencies and resiliency
description: The regional and service behaviors a platform team should understand when it qualifies regional combinations, including paired and nonpaired regions, storage, backup, and Key Vault, with links to workload design guidance.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Regional dependencies and resiliency

A multi-region platform creates qualified regional options. Whether a specific workload uses more than one of those regions, and how, is a workload design decision.

This section isn't workload design guidance. The Azure Well-Architected Framework covers how to design a multi-region workload. This section covers the regional and service behaviors a platform team should understand when it qualifies regional combinations: region pairing is one input into resiliency design, not the definition of it, and cross-region behavior can differ significantly by service and regional combination.

## Where workload design guidance lives

- [Using availability zones and regions](https://learn.microsoft.com/azure/well-architected/design-guides/regions-availability-zones) — How to choose a single-region, zonal, or multi-region design for a workload.
- [Architecture strategies for designing for redundancy](https://learn.microsoft.com/azure/well-architected/reliability/highly-available-multi-region-design) — Multi-region deployment models, including active-active and active-passive.
- [Design methodology for mission-critical workloads](https://learn.microsoft.com/azure/well-architected/mission-critical/mission-critical-design-methodology) — The full multi-region active design for the most demanding workloads.
- [Multi-region solutions in nonpaired regions](https://learn.microsoft.com/azure/reliability/cross-region-replication-azure-no-pair) — Service-by-service guidance for regions without a pair.
- [Azure reliability service guides](https://learn.microsoft.com/azure/reliability/overview-reliability-guidance) — Regional behavior for each Azure service.

## In this section

The articles in this section cover the dependencies that most often decide whether a regional combination works as built.

| Article | What it covers |
|---|---|
| [Paired and nonpaired regions](./paired-nonpaired-regions.md) | What pairing provides, what it doesn't, and how region-of-choice designs shift responsibility for recovery. |
| [Storage, backup, and Key Vault](./storage-backup-key-vault.md) | Paired-region and region-of-choice behavior for three services that need special attention, and the recommended Key Vault pattern. |
| [Resiliency scenarios](./resiliency-scenarios.md) | Three situations that show how service behavior changes a recovery design. |

## Next step

> [!div class="nextstepaction"]
> [Paired and nonpaired regions](./paired-nonpaired-regions.md)
