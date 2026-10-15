---
title: Backup and restore across regions
description: Paired-region and region-of-choice behavior for Azure Backup, restore, and Azure Site Recovery in multi-region workloads.
ms.date: 10/15/2026
ms.topic: conceptual
---

# Backup and restore across regions

Backup and restore capabilities differ by workload and region combination, so confirm them for each intended recovery region.

## Paired-region capabilities

- Azure Backup Cross Region Restore uses the Azure paired region for supported data sources when the required vault replication and configuration are enabled.
- Support and behavior differ by backup workload and configuration.

## Region-of-choice capabilities

- Determine which backup technologies and restore targets support the intended recovery region.
- Azure Site Recovery supports Azure VM disaster recovery between Azure regions, subject to its support matrix and regional restrictions.
- Restricted-access regions can require explicit access approval.

> [!IMPORTANT]
> Demonstrate RTO and RPO through recovery testing, not configuration alone.

## Reference links

- [Restore Azure VMs, including Cross Region Restore](https://learn.microsoft.com/azure/backup/backup-azure-arm-restore-vms)
- [Azure Site Recovery support matrix](https://learn.microsoft.com/azure/site-recovery/azure-to-azure-support-matrix)

## Next step

> [!div class="nextstepaction"]
> [Key Vault across regions](./key-vault-across-regions.md)
