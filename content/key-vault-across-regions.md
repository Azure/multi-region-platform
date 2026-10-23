---
title: Key Vault across regions
description: Choose a multi-region pattern for Azure Key Vault secrets, certificates, and keys, with a deployment diagram for each pattern and a decision tree.
ms.date: 10/23/2026
ms.topic: conceptual
---

# Key Vault across regions

Key Vault is often a runtime dependency, so its regional behavior can decide whether a recovery region is viable. Pick the product first, then the pattern. Each product handles regions differently.

> [!IMPORTANT]
> Key Vault is often a runtime dependency. Applications can require keys, secrets, and certificates simply to initialize, so data can be recoverable while the application still cannot start.

## Choose the product

Azure Key Vault is multi-tenant. The Standard tier protects keys with software that meets FIPS 140 Level 1. The Premium tier protects keys with HSMs that meet FIPS 140-3 Level 3. Managed HSM is single-tenant and also meets FIPS 140-3 Level 3. Managed HSM External Key Management (EKM) connects customer-managed key encryption in Azure services to an HSM that you operate outside Microsoft.

| | Key Vault Standard | Key Vault Premium | Managed HSM | Managed HSM + EKM |
|---|---|---|---|---|
| Protection | Software, FIPS 140 Level 1 | HSM-backed keys, FIPS 140-3 Level 3 | Single-tenant HSM, FIPS 140-3 Level 3 | Key stays in your own HSM outside Microsoft |
| SLA | 99.99% | 99.99% | 99.9% in one region; 99.99% when replicated across regions | No end-to-end SLA; the Managed HSM SLA covers only the service |
| Holds | Asymmetric keys, secrets, certificates | Asymmetric and symmetric keys (preview), secrets, certificates | Asymmetric and symmetric keys | Asymmetric and symmetric keys |
| Availability zones | Automatic zone redundancy in zone regions | Automatic zone redundancy in zone regions | Not zone-based; partitions sit on separate servers in different racks | Depends on your HSM |
| Replication | To the paired region only (same geography); none without a pair | To the paired region only (same geography); none without a pair | Multi-region replication to one extended region, paired or not | None; EKM does not support geo-replication |
| Failover | Microsoft-managed; read-only after failover | Microsoft-managed; read-only after failover | Both regions stay active; reads and writes continue | No failover target; recovery depends on the failing part |

### Paired-region behavior

- Most paired regions replicate vault contents asynchronously to the pair.
- Microsoft runs a tested failover for geo-replicated regions. Public endpoints fail over in a few minutes. Private endpoints take up to an additional 20 minutes. After failover, the vault is read-only.
- Some paired regions, and all nonpaired regions, do not use this model. For the current list, see [Reliability in Azure Key Vault](https://learn.microsoft.com/azure/reliability/reliability-key-vault).

Plan for three regional design constraints:

- **3+0:** The region has no pair, such as Qatar Central, Belgium Central, and Spain Central.
- **3+1, asymmetric:** The region replicates to a pair that does not replicate back, such as West US 3 to East US.
- **3+1, outside the geography:** The pair is in another geography, such as Brazil South and South Central US.

## Secrets and certificates

Secrets and certificates can be loaded into any vault by a pipeline, which makes a vault in each region practical. Managed HSM and EKM do not hold secrets or certificates, so use Key Vault Standard or Premium.

### Pattern 1: Key Vault in each region

- **Created in:** Each vault. CI/CD and infrastructure as code (IaC) load the same secrets and certificates into every vault.
- **During an outage:** Each region keeps full read and write access on its own vault.
- **Best for:** Mission-critical workloads that need a short recovery time.
- **Watch for:** You must keep the vaults in sync with your pipeline.

:::image type="content" source="./media/key-vault-secrets-per-region.png" alt-text="An approved deployment pipeline loads secrets and certificates into each regional vault independently. There is no vault-to-vault replication." lightbox="./media/key-vault-secrets-per-region.png":::

*Secrets and certificates, pattern 1: a Key Vault in each region.*

### Pattern 2: Key Vault in a paired region

- **Created in:** One vault. Microsoft fails it over to the paired region.
- **During an outage:** The vault is read-only until failover ends. You can read, but you can't create, update, or rotate.
- **Best for:** Less critical workloads that accept read-only access and Microsoft's failover timing.
- **Watch for:** The vault fails over only to a pair in the same geography that is paired in both directions.

:::image type="content" source="./media/key-vault-secrets-paired-region.png" alt-text="A deployment pipeline loads secrets and certificates into the primary Key Vault. Microsoft asynchronously replicates them to its paired-region copy, which is read-only after Microsoft-managed failover." lightbox="./media/key-vault-secrets-paired-region.png":::

*Secrets and certificates, pattern 2: a Key Vault in a paired region.*

**Design guidance.** Treat each region as its own deployment stamp with its own vault. Roll secrets out through a pipeline, one region at a time, so one bad change can't reach every region. App-level fallback to another region's vault is optional and needs careful design of networking (private endpoints) and identity (managed identities). Do not treat the IaC repository itself as a store for secret values.

## Keys

Customer-managed keys have extra limits, so design them separately from secrets. Confirm that every service that uses the key supports your pattern. Standard doesn't support bring your own key (BYOK); check [Supported HSMs for BYOK](https://learn.microsoft.com/azure/key-vault/keys/hsm-protected-keys) for Premium.

### Pattern 1: One Key Vault per region

- **Created in:** Key Vault Standard or Premium, one vault per workload per region.
- **During an outage:** Each region works on its own vault, with full read and write access.
- **Best for:** Workloads whose services can use a separate key in each region.
- **Watch for:** Services that geo-replicate can't use two vaults. Storage with GRS uses one key from one vault for both copies, so a vault outage affects both.

:::image type="content" source="./media/key-vault-keys-vault-per-region.png" alt-text="A separate Key Vault, Standard or Premium, in each region. Each vault creates its own key, so the two regions hold different keys and each reads and writes independently." lightbox="./media/key-vault-keys-vault-per-region.png":::

*Keys, pattern 1: one Key Vault per region.*

### Pattern 2: One Premium vault per region plus an external HSM

- **Created in:** Imported from your external HSM (BYOK) into a Premium vault in each region.
- **During an outage:** Each region works on its own vault, with full read and write access.
- **Best for:** You must own and hold the master key, or meet BYOK rules, and want to control recovery time.
- **Watch for:** The same service limits as pattern 1, and extra cost.

:::image type="content" source="./media/key-vault-keys-byok-per-region.png" alt-text="A customer-owned external HSM is the key origin. The BYOK process imports the same key into a Premium vault in each region, with no vault-to-vault replication." lightbox="./media/key-vault-keys-byok-per-region.png":::

*Keys, pattern 2: a Premium vault per region with BYOK.*

### Pattern 3: Managed HSM with geo-replication

- **Created in:** Managed HSM with multi-region replication.
- **During an outage:** Reads and writes stay available in the healthy region.
- **Best for:** You must own and hold the master key, and you run mission-critical workloads with customer-controlled recovery.
- **Watch for:** Cost. Changes to keys, role definitions, and role assignments replicate asynchronously within 6 minutes, so the last changes before a region failure can be lost if the primary can't be recovered.

:::image type="content" source="./media/key-vault-keys-managed-hsm-geo.png" alt-text="Managed HSM creates the key in the primary region. Asynchronous multi-region replication synchronizes keys and roles between the primary and extended regions. Both regions support reads and writes." lightbox="./media/key-vault-keys-managed-hsm-geo.png":::

*Keys, pattern 3: Managed HSM with multi-region replication.*

### Pattern 4: Managed HSM with geo-replication plus an external HSM

- **Created in:** Imported from your external HSM, then replicated.
- **During an outage:** Reads and writes stay available in the healthy region.
- **Best for:** The same as pattern 3, with your HSM as the key origin.
- **Watch for:** Cost, and the same replication window as pattern 3.

:::image type="content" source="./media/key-vault-keys-managed-hsm-geo-byok.png" alt-text="A customer-owned external HSM imports the key into a Managed HSM in region A. Multi-region replication copies it to region B. Both regions stay active for reads and writes." lightbox="./media/key-vault-keys-managed-hsm-geo-byok.png":::

*Keys, pattern 4: Managed HSM with multi-region replication and BYOK.*

### Pattern 5: Managed HSM without geo-replication plus EKM

- **Created in:** The key never leaves your HSM.
- **During an outage:** Recovery depends on the failing part: Managed HSM, EKM proxy, your HSM, or the whole region. There is no failover target, so you wait for restore.
- **Best for:** You must own and hold the key outside Microsoft.
- **Watch for:** EKM doesn't support geo-replication, and there is no end-to-end Microsoft SLA for external keys. Failures in the EKM proxy or your HSM can interrupt Azure workloads and don't count against their SLAs.

:::image type="content" source="./media/key-vault-keys-managed-hsm-ekm.png" alt-text="A Managed HSM with an External Key Management proxy in region A uses a key that stays in the customer's own HSM outside Azure. Region B has no failover target because External Key Management does not support geo-replication." lightbox="./media/key-vault-keys-managed-hsm-ekm.png":::

*Keys, pattern 5: Managed HSM with EKM.*

**Design guidance for Managed HSM.** Enable multi-region replication. Azure Traffic Manager routes each request to the closest region, so avoid caching DNS longer than the time to live (TTL). EKM adds network round trips to your proxy and HSM on every key operation. Managed HSM doesn't support backup and restore of external keys, so recreate the external key reference instead of restoring.

## Decision tree

:::image type="content" source="./media/key-vault-decision-tree.png" alt-text="Decision tree. For secrets and certificates: if you need full read and write in the surviving region, use a Key Vault in each region; otherwise, if a pair exists in the same geography and is paired both ways, use a Key Vault in a paired region. For keys: if the key must stay in your own HSM outside Microsoft, use Managed HSM with EKM; otherwise, if you need read and write in a healthy region during failover, use Managed HSM with geo-replication, with an external HSM if you import the key; otherwise use a Premium vault per region with an external HSM if you import the key, or one Key Vault per region." lightbox="./media/key-vault-decision-tree.png":::

*Which Key Vault pattern fits? Validate current service behavior before you commit.*

## Reference links

- [Reliability in Azure Key Vault](https://learn.microsoft.com/azure/reliability/reliability-key-vault)
- [Azure Key Vault availability and redundancy](https://learn.microsoft.com/azure/key-vault/general/disaster-recovery-guidance)
- [Azure paired regions](https://learn.microsoft.com/azure/reliability/regions-paired)
- [Regions that support availability zones](https://learn.microsoft.com/azure/reliability/availability-zones-region-support)
- [Managed HSM multi-region replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication)
- [Managed HSM overview](https://learn.microsoft.com/azure/key-vault/managed-hsm/overview)
- [Supported HSMs for BYOK](https://learn.microsoft.com/azure/key-vault/keys/hsm-protected-keys)
- [Services that support customer-managed keys](https://learn.microsoft.com/azure/security/fundamentals/encryption-models)
- [How to choose the right key management solution](https://learn.microsoft.com/azure/security/fundamentals/key-management-choose)
- [Key Vault and Managed HSM SLAs](https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services)

## Next step

> [!div class="nextstepaction"]
> [Private DNS zones for multi-region private endpoints](./private-dns-multi-region.md)
