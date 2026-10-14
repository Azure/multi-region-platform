---
title: Multi-region resiliency scenarios
description: Three scenarios that show how service-specific regional behavior changes workload recovery design — nonpaired DR, the paired-region fallacy, and customer-managed keys across regions.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Multi-region resiliency scenarios

These examples show how service-specific regional behavior changes workload recovery design. They complement the broader [customer scenarios](./customer-scenarios.md). They're representative situations, not drawn from a specific customer; confirm current service capabilities on Microsoft Learn at decision time.

## A workload in a nonpaired region requires DR

A workload operates in a zone-enabled region without a paired region and must recover in another Azure region.

| Layer | Design consideration |
|---|---|
| Storage | Use a supported region-of-choice replication pattern such as object replication where suitable, or application-level replication for storage types that require it. |
| Compute | Use a supported cross-region recovery technology such as Azure Site Recovery for applicable VMs, or redeploy stateless compute from infrastructure as code. |
| Key Vault | Pre-provision the required regional vault and ensure runtime secrets, certificates, and any required key strategy are available before recovery. |
| Backup | Place backup and restore capabilities deliberately based on the intended recovery region and supported service behavior. |

**Takeaway:** A nonpaired region can participate in a resilient multi-region architecture, but each workload layer needs an explicit recovery design. See [Paired and nonpaired regions](./paired-nonpaired-regions.md) and [Multi-region solutions in nonpaired regions](https://learn.microsoft.com/azure/reliability/cross-region-replication-azure-no-pair).

## "We're paired, so we have DR"

Data is geo-replicated to the paired region, but the complete application has never been failed over and tested.

| Aspect | Detail |
|---|---|
| Symptom | Data is recoverable, but the application cannot operate successfully in the secondary region. |
| Possible causes | Key Vault or another runtime dependency is unavailable; DNS or private-endpoint configuration is incomplete; compute or shared services are not recoverable; application dependencies were not included in the recovery design. |
| Correction | Treat data, identity, secrets and keys, DNS, networking, shared services, and compute as workload dependencies. Validate end-to-end recovery against RTO and RPO. |

**Takeaway:** Data recovery is not application recovery, and Azure region pairing does not replace a tested workload recovery plan. See [Storage, backup, and Key Vault across regions](./storage-backup-key-vault.md).

## Customer-managed keys across two regions

A workload uses customer-managed encryption keys and must operate or recover across two Azure regions.

| Aspect | Detail |
|---|---|
| Constraint | Key material has different recovery and replication characteristics from secrets and certificates and cannot simply be assumed to be recreated by the deployment pipeline. |
| Options | Evaluate Key Vault behavior for the selected regions, supported backup and restore patterns, Azure Managed HSM multi-region replication where appropriate, or another workload-specific key-management design. |
| Validate | Confirm key availability, access, private connectivity, permissions, and application behavior in the secondary region before the recovery path is considered complete. |

**Takeaway:** Design key availability explicitly. For some workloads, the key-management architecture can determine which recovery regions are viable. See the [recommended Key Vault pattern](./storage-backup-key-vault.md#recommended-key-vault-pattern) and [Managed HSM multi-region replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication).

## Next step

> [!div class="nextstepaction"]
> [Customer scenarios](./customer-scenarios.md)
