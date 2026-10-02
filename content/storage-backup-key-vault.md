---
title: Storage, backup, and Key Vault across regions
description: Paired-region and region-of-choice behavior for Azure Storage replication, backup and restore, and Key Vault, and the recommended Key Vault pattern for multi-region workloads.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Storage, backup, and Key Vault across regions

Storage replication, backup and restore, and Key Vault illustrate why regional qualification cannot stop at "the service exists in both regions." Cross-region behavior can differ significantly depending on the service and regional combination.

## Storage

**Paired-region options**

- Geo-redundant storage options such as GRS and GZRS replicate data asynchronously to the service-defined secondary region.
- Built-in geo-redundancy and failover behavior must be evaluated separately from workload-level recoverability.

**Region-of-choice options**

- Object replication can asynchronously replicate **block blobs** between selected storage accounts and regions.
- It requires change feed on the source and blob versioning on source and destination accounts.
- Object replication does not support append blobs, page blobs, or accounts with hierarchical namespace enabled.
- A source account can currently replicate to no more than two destination accounts.

> [!IMPORTANT]
> Replicated data does not by itself make the workload recoverable. Validate the application recovery path end to end.

## Backup and restore

**Paired-region capabilities**

- Azure Backup Cross Region Restore uses the Azure paired region for supported data sources when the required vault replication and configuration are enabled.
- Support and behavior differ by backup workload and configuration.

**Region-of-choice capabilities**

- Determine which backup technologies and restore targets support the intended recovery region.
- Azure Site Recovery supports Azure VM disaster recovery between Azure regions, subject to its support matrix and regional restrictions.
- Restricted-access regions can require explicit access approval.

> [!IMPORTANT]
> Demonstrate RTO and RPO through recovery testing, not configuration alone.

## Key Vault

**Paired-region behavior**

- In most paired regions, Key Vault asynchronously replicates vault contents to the paired region.
- Microsoft-managed regional failover is Microsoft initiated, best effort, and can occur only after significant delay; after failover, the vault operates with restrictions, including read-only management behavior. Workloads with tighter recovery objectives need an explicit multi-region design.
- Some paired regions and all nonpaired regions do not use this Microsoft-managed cross-region replication and failover model. For the current list, see [Reliability in Azure Key Vault](https://learn.microsoft.com/azure/reliability/reliability-key-vault).

**Region-of-choice designs**

- Where built-in failover does not meet workload requirements, use separate regional vaults or another supported custom multi-region design.
- Keys, secrets, and certificates each require their own recovery analysis. Secrets and certificates can often be provisioned independently into regional vaults through controlled deployment processes. Cryptographic keys, particularly customer-managed keys, can have additional constraints and should not be assumed to be reproducible by the same process.
- Azure Managed HSM provides an optional two-region replication model with both regions active. It applies to keys, not to ordinary Key Vault secrets and certificates; not every region can serve as an extended region, and it has its own cost considerations.

> [!IMPORTANT]
> Key Vault is often a runtime dependency. Applications can require keys, secrets, and certificates simply to initialize, so data can be recoverable while the application still cannot start.

## Recommended Key Vault pattern

**Independent Key Vault per workload per region.** For workloads that require controlled region-of-choice recovery, design the runtime dependency so that each active or recovery region has the Key Vault capability it needs **before failover is required**.

:::image type="content" source="./media/key-vault-regional-pattern.png" alt-text="An approved deployment process, combining infrastructure as code for configuration with a separate secret-management process, populates an independent regional Key Vault in region A and in region B. Workloads such as App Service, virtual machine scale sets, and SQL Database in each region read only their local vault." lightbox="./media/key-vault-regional-pattern.png":::

*Pre-provisioned regional vaults. This pattern applies to secrets and certificates; design customer-managed keys separately.*

- **Independent regional vault.** Each workload uses the vault associated with its local region rather than depending at runtime on a vault hosted in another region.
- **Deploy configuration consistently.** Infrastructure as code should consistently provision vault configuration, access controls, private connectivity, monitoring, and policy. Use an approved secret-management or deployment process to populate the required secrets and certificates in each regional vault; do not treat the IaC repository itself as a store for secret values.
- **Do not make failover the synchronization strategy.** Populate and validate required runtime dependencies before an outage. Recovery should not depend on creating or restoring a regional vault after the primary region has already failed.
- **Design cryptographic keys separately.** Customer-managed keys cannot always be reproduced using the same process as secrets or certificates. Select an appropriate key-resiliency pattern, such as supported Key Vault backup and restore constraints, Managed HSM multi-region capabilities, or another workload-specific design, based on security and recovery requirements.

## Reference links

- [Azure Storage redundancy](https://learn.microsoft.com/azure/storage/common/storage-redundancy)
- [Object replication for block blobs](https://learn.microsoft.com/azure/storage/blobs/object-replication-overview)
- [Restore Azure VMs, including Cross Region Restore](https://learn.microsoft.com/azure/backup/backup-azure-arm-restore-vms)
- [Azure Site Recovery support matrix](https://learn.microsoft.com/azure/site-recovery/azure-to-azure-support-matrix)
- [Azure Key Vault availability and redundancy](https://learn.microsoft.com/azure/key-vault/general/disaster-recovery-guidance)
- [Reliability in Azure Key Vault](https://learn.microsoft.com/azure/reliability/reliability-key-vault)
- [Managed HSM multi-region replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication)

## Next step

> [!div class="nextstepaction"]
> [Resiliency scenarios](./resiliency-scenarios.md)
