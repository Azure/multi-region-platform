---
title: Key Vault across regions
description: Use regional vaults for secrets and certificates and compare six key patterns, with regional diagrams, service-specific recovery scenarios, and a decision tree.
ms.date: 10/29/2026
ms.topic: conceptual
---

# Key Vault across regions

## Summary

- **Certificates and secrets:** Use [a Key Vault in each region](#secrets-certificates-pattern-1). Manage objects in each vault through deployment pipelines, with customer-managed application failover.

- **Single KEK (key encryption key):** Use [Key Vault paired-region replication](#keys-pattern-1) with Microsoft-managed failover. The primary and paired vault regions do not need to match the consuming services' regions. Alternative: [Managed HSM with geo-replication](#keys-pattern-4).

- **Dual KEK (key encryption key):** Use [a Key Vault in each region](#keys-pattern-2). Manage objects in each vault through deployment pipelines, with customer-managed application failover. Alternative: [Managed HSM with geo-replication](#keys-pattern-4).

<a id="failover-guidance"></a>

## Microsoft-managed failover

### Microsoft-managed failover for Azure Key Vault Standard or Premium

Keep using the same vault URI; Microsoft reroutes requests after failover. You cannot trigger this failover. Initiation can take hours or longer, independently of other services. Asynchronous replication means recent changes can be lost.

> [!IMPORTANT]
> - Microsoft-managed failover is best effort, not a customer-triggered recovery mechanism or a guaranteed application recovery time. Once initiated, public endpoint convergence is designed to take a few minutes; private endpoints can require up to an additional 20 minutes. Do not treat those routing timings as the total outage duration.
> - When using Key Vault in paired regions (for certificates, secrets, and dual KEK (key encryption key) scenarios), Key Vault replica instances do not need to be in the same region as the consuming services. Confirm any consuming-service-specific requirements for vault and key placement.

| Scenario | Microsoft-managed failover | What to verify |
|---|---|---|
| Reciprocally paired regions within the same geography | Supported | Use the [Azure regions list](https://learn.microsoft.com/azure/reliability/regions-list) to confirm that the primary and paired regions are within the same geography and paired with each other. |
| Paired regions in different geographies | [Unsupported](https://learn.microsoft.com/azure/reliability/reliability-key-vault#microsoft-managed-failover-to-a-paired-region) | Use the [Azure regions list](https://learn.microsoft.com/azure/reliability/regions-list) to compare the geography of the primary and paired regions. A pairing across geographies does not qualify. |
| Nonreciprocal (asymmetric) region pairing | [Unsupported](https://learn.microsoft.com/azure/reliability/reliability-key-vault#microsoft-managed-failover-to-a-paired-region) | Region A is paired with Region B, but Region B is paired with another region or has no pair. A one-way pairing does not qualify. |
| Regions without a pair | [Unsupported](https://learn.microsoft.com/azure/reliability/reliability-key-vault#microsoft-managed-failover-to-a-paired-region) | The primary region has no paired region for Microsoft-managed failover. |

### Microsoft-managed failover for Azure Key Vault Managed HSM

Managed HSM resources are deployed into a single Azure region. If the region becomes unavailable, your Managed HSM is also unavailable. Managed HSM supports [multiregion replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication), which you can use to extend a Managed HSM pool from one Azure region (the *primary region*) to a second Azure region (the *extended region*).

For reliability details, see [Reliability in Azure Key Vault Managed HSM](https://learn.microsoft.com/azure/reliability/reliability-managed-hsm).

> [!IMPORTANT]
> **If a primary or extended region goes down, you can still perform both read and write operations.**
>
> - **Regions:** Any Managed HSM region can be primary; [extended-region support](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication#azure-region-support) varies. No pairing required.
> - **Routing:** DNS selects the closest available region (5-second TTL); caching can delay failover.
> - **Replication:** Key and role changes can take up to 6 minutes; cross-region consistency isn't guaranteed during this window. External keys (EKM) aren't supported by multiregion replication.
>
> See [Managed HSM multiregion replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication) for more details.

| Scenario | Microsoft-managed failover | What to verify |
|---|---|---|
| Primary region unavailable with multiregion replication configured | Supported | The healthy extended region continues serving read and write requests. Configure replication to a [supported extended region](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication#azure-region-support) before an outage; region pairing isn't required. |
| Extended region unavailable with multiregion replication configured | Supported | The healthy primary region continues serving read and write requests. |
| Single-region deployment without multiregion replication | Unsupported | If the region becomes unavailable, the Managed HSM is also unavailable. |
| Unsupported extended region | Unsupported | Check [Azure region support](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication#azure-region-support) before selecting the extended region. |
| Managed HSM with External Key Management (EKM) | Unsupported | [Multiregion replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication) isn't supported with external keys, so there is no geo-replicated failover target. |

## Customer-managed failover

Consider customer-controlled failover design patterns when Microsoft-managed failover does not meet your application's recovery time objectives (RTOs). These patterns let you choose regions for your workloads, subject to product availability, supported extended regions, and consuming-service requirements.

> [!IMPORTANT]
> - Prepare identities, permissions, networking, and required versions in each region.
> - For independent vaults, configure application fallback and test failover and return to the primary before production. A second vault alone is not enough.
> - Key Vault backups are point-in-time and restore only within the same subscription and Azure geography.

| Service | Regional deployment and recovery | Artifact provisioning | Failover behaviour |
|---|---|---|---|
| Key Vault Standard or Premium (Keys, Secrets, Certificates) | <ul><li>One [vault per region](#secrets-certificates-pattern-1).</li><li>Local read/write access.</li></ul> | <ul><li>Use an automation pipeline for secrets and certificates.</li><li>With an on-premises HSM, consider [BYOK into each Premium vault](#keys-pattern-3).</li><li>HSM-backed BYOK requires Premium, not Standard.</li></ul> | <ul><li>Use SDK retries with exponential backoff and respect DNS TTL.</li><li>Design application fallback to the recovery region to meet your RTO.</li><li>Test connectivity regularly.</li></ul> |
| Key Vault Managed HSM (Keys) | <ul><li>Enable [geo-replication](#keys-pattern-4) to a supported extended region.</li><li>Both regions support read/write, with asynchronous replication in either direction.</li><li>Microsoft manages routing and failover.</li></ul> | <ul><li>Keys only.</li><li>Generate in Managed HSM or [import from your on-premises HSM using BYOK](#keys-pattern-5), then replicate.</li></ul> | <ul><li>Use SDK retries with exponential backoff and respect DNS TTL.</li><li>Reads and writes continue if either region fails.</li><li>DNS routes to the closest available region (5-second TTL); caching can delay failover.</li><li>Replication: Key and role changes can take up to 6 minutes; regions may differ during this window.</li><li>External keys (EKM) cannot be geo-replicated.</li></ul> |

## Secrets and certificates scenarios

<a id="application-level-secrets-or-certificates"></a>

Your workload decides whether each region uses independent secrets and certificates or shares common ones. It uses the Key Vault in its own region and can optionally fail over to secrets and certificates in a recovery region if its primary region is unavailable.

**Patterns you can use:**

| Pattern | Object provisioning | Recovery behavior | Diagram |
|---|---|---|---|
| [Standard or Premium vault in each region](#secrets-certificates-pattern-1) | An approved deployment pipeline populates each regional vault with secrets and certificates. | Each region has independent read/write access. The application manages failover to a recovery-region vault; there is no vault-to-vault replication. | :::image type="content" source="./media/key-vault-secrets-per-region.png" alt-text="An approved deployment pipeline loads secrets and certificates into each regional vault independently. There is no vault-to-vault replication." lightbox="./media/key-vault-secrets-per-region.png"::: |

## Single KEK (key encryption key) scenarios

A single KEK design uses a shared key encryption key to protect the data encryption keys (DEKs) for the same data across regions, rather than a different KEK in each region. The DEKs encrypt the data; the KEK wraps and unwraps those DEKs. Recovery requires access to the original key material and any historical versions used by existing data or backups.

> [!IMPORTANT]
> Key Vault regions can be selected independently of the consuming services' regions. For Standard or Premium vaults, choose a region with a reciprocal region pair in the same Azure geography. This enables Microsoft-managed failover to the paired region for recovery during a regional outage. Failover remains best effort, without a guaranteed recovery time.

**Patterns you can use:**

Use one of these shared-key patterns for the scenarios below, subject to each service's requirements.

| Pattern | Key origin | Recovery behavior | Diagram |
|---|---|---|---|
| [Standard or Premium vault with paired-region replication](#keys-pattern-1) | Created in Azure Key Vault; software-protected in Standard or HSM-protected in Premium. | Both data copies depend on Microsoft-managed vault recovery. Failover is best effort, and the recovered vault is read-only. | :::image type="content" source="./media/key-vault-keys-paired-region.png" alt-text="A Standard or Premium vault generates the key in region A, using software or HSM protection respectively. Microsoft asynchronously replicates it to a paired-region copy of the same vault, which is read-only after failover." lightbox="./media/key-vault-keys-paired-region.png"::: |
| [Managed HSM with geo-replication](#keys-pattern-4) | Created in Managed HSM. | Maintain access to the shared key through geo-replication; both regions support reads and writes. | :::image type="content" source="./media/key-vault-keys-managed-hsm-geo.png" alt-text="Managed HSM creates the key in the primary region. Asynchronous multi-region replication synchronizes keys and roles between the primary and extended regions. Both regions support reads and writes." lightbox="./media/key-vault-keys-managed-hsm-geo.png"::: |
| [Managed HSM geo-replication with external HSM and BYOK](#keys-pattern-5) | Created in an external HSM and imported using BYOK. | Maintain access to the shared key through geo-replication; both regions support reads and writes. | :::image type="content" source="./media/key-vault-keys-managed-hsm-geo-byok.png" alt-text="A customer-owned external HSM supplies a BYOK import into the primary Managed HSM. Managed HSM then replicates key material and roles to the extended region; both regions serve reads and writes." lightbox="./media/key-vault-keys-managed-hsm-geo-byok.png"::: |

### Application-level encryption {#application-level-encryption-single-kek}

- Application-level encryption commonly uses one shared KEK across regions, but this is a design choice, not a technical requirement. Because you control the encryption algorithm and key-management logic, you can also use a [Dual KEK approach](#dual-kek-key-encryption-key-scenarios) with separate regional keys.

### Azure Storage - Geo-redundant storage (GRS) {#azure-storage-grs}

- When you configure customer-managed keys for a storage account, Azure Storage wraps the root data encryption key for the account with the customer-managed key in the associated key vault or managed HSM. The protection of the root encryption key changes, but the data in your Azure Storage account remains encrypted at all times. You don't need to take any additional action to ensure that your data remains encrypted. Protection by customer-managed keys takes effect immediately.
- GRS copies are replicas of one storage account, not independently configured accounts. Both primary and secondary storage account replicas need access to the same Key Vault or Managed HSM and the account's CMK. Independent regional vaults do not let you assign a different key store to each GRS replica. Consider a replicated key store and test key access during account failover. See [Storage CMKs](https://learn.microsoft.com/azure/storage/common/customer-managed-keys-overview).

### Azure SQL Database, Azure SQL Managed Instance and Azure Cosmos DB geo-replication {#database-geo-replication}

- Database replicas need access to the same Azure Key Vault as the primary. When replicating across countries, pair replication with online key rotation. Online key rotation requires both primary and secondary database instances to be online and their Azure Key Vault instances to be accessible, making it unsuitable as a disaster recovery solution.
- These customer-managed key access and rotation concerns do not apply when replicating databases using Microsoft-managed keys (MMK).
- Azure Key Vault Managed HSM is the preferred solution in these cases, where supported by the consuming database service. Customers can geo-replicate their single-tenant Azure Key Vault Managed HSM to a supported region of choice, and failover preserves the Azure Key Vault Managed HSM endpoint's fully qualified domain name (FQDN).

See [SQL customer-managed TDE](https://learn.microsoft.com/azure/azure-sql/database/transparent-data-encryption-byok-overview) and [Cosmos DB CMKs](https://learn.microsoft.com/azure/cosmos-db/how-to-setup-customer-managed-keys).

### Azure SQL Database, Azure SQL Managed Instance and Azure Cosmos DB geo-restore {#database-geo-restore}

- Restoring data does not restore access to its encryption keys. Retain all historical keys required by the backup, authorize the restored service, and verify the target region/geography against that service's restore rules.

> [!IMPORTANT]
> Geo-restore is not possible for Microsoft-managed key (MMK) or Customer-managed key (CMK) scenarios when using paired regions in different geographies.

### Purview Information Protection

- Non-exportable keys, inability to re-encrypt old content at scale.
- Customers can import an on-premises HSM key for use in Microsoft 365, but only by first transferring it into an Azure Key Vault (or Azure Key Vault Managed HSM). There is no direct, real-time use of an on-prem HSM by Microsoft 365 services. [See supported HSMs](https://learn.microsoft.com/en-us/azure/key-vault/keys/hsm-protected-keys-byok?tabs=azure-cli). When using BYOK, customer becomes fully responsible for key generation, rotation, and protection. Improper key rotation or accidental deletion of keys can irreversibly lock the customer out of their data. For example, deleting or disabling a key that is still in use will make any data it protected permanently inaccessible, even Microsoft cannot recover it without the key.
- All encryption operations depend on the Azure Key Vault. If the key vault (or managed HSM) experiences downtime or is unreachable, critical services (like Exchange Online, SharePoint, OneDrive, Teams, etc.) may become unable to decrypt or encrypt data, leading to potential service disruption.

> [!IMPORTANT]
> Default to Microsoft-managed keys unless regulation clearly requires customer control; where customer-managed keys are mandatory, create and preserve keys outside the primary geography and validate recovery design before production rollout.

## Dual KEK (key encryption key) scenarios

A dual KEK design uses separate key encryption keys for the primary and recovery regions, rather than one shared KEK. Each KEK protects the data encryption keys (DEKs) used by its regional data copy. The consuming service must support independent regional keys and make the recovery data decryptable with the recovery region's key. Provision and test regional key access, and preserve the key material and versions required by existing data and backups.

**Patterns you can use:**

Use the following patterns subject to each service's requirements.

| Pattern | Key origin | Recovery behavior | Diagram |
|---|---|---|---|
| [Standard or Premium vault in each region](#keys-pattern-2) | A separate key is generated in each regional vault. | Each surviving region retains full local read and write access; the service uses its configured regional key. | :::image type="content" source="./media/key-vault-keys-vault-per-region.png" alt-text="A separate Key Vault, Standard or Premium, in each region creates its own key. The regions hold different keys and operate independently without vault-to-vault replication." lightbox="./media/key-vault-keys-vault-per-region.png"::: |
| [Premium vault per region with external HSM and BYOK](#keys-pattern-3) | Created in an external HSM and imported into each Premium vault. | Each surviving region uses its local imported key. Coordinate imports, versions, rotation, and service configuration. | :::image type="content" source="./media/key-vault-keys-byok-per-region.png" alt-text="A customer-owned external HSM is the key origin. The BYOK process imports the same key into a Premium vault in each region, with no vault-to-vault replication." lightbox="./media/key-vault-keys-byok-per-region.png"::: |
| [Managed HSM with geo-replication](#keys-pattern-4) | Created in Managed HSM. | Maintain access through Managed HSM geo-replication; both regions support reads and writes. | :::image type="content" source="./media/key-vault-keys-managed-hsm-geo.png" alt-text="Managed HSM creates the key in the primary region. Asynchronous multi-region replication synchronizes keys and roles between the primary and extended regions. Both regions support reads and writes." lightbox="./media/key-vault-keys-managed-hsm-geo.png"::: |
| [Managed HSM geo-replication with external HSM and BYOK](#keys-pattern-5) | Created in an external HSM and imported using BYOK. | Maintain access through Managed HSM geo-replication; both regions support reads and writes. | :::image type="content" source="./media/key-vault-keys-managed-hsm-geo-byok.png" alt-text="A customer-owned external HSM supplies a BYOK import into the primary Managed HSM. Managed HSM then replicates key material and roles to the extended region; both regions serve reads and writes." lightbox="./media/key-vault-keys-managed-hsm-geo-byok.png"::: |

### Application-level encryption

Your application decides whether each region uses an independent key or a common key. Preserve the key identifier and version needed to decrypt existing data. EKM is designed for compatible CMK encryption-at-rest integrations and exposes a restricted operation set; do not assume arbitrary application signing or encryption works unchanged. See [key operations](https://learn.microsoft.com/azure/key-vault/keys/about-keys-details) and [external key lifecycle](https://learn.microsoft.com/azure/key-vault/managed-hsm/external-key-management-key-lifecycle).

The application must handle independent regional keys or regional imports. When using Managed HSM, use supported operations, including imported keys for BYOK.

### Azure Storage - Object replication for block blobs {#storage-object-replication}

Source and destination are separate accounts, so their CMK configuration can be independent. Validate each account's identity, key versions, and recovery behavior. Do not carry GRS's shared-account constraint into this topology. See [object replication](https://learn.microsoft.com/azure/storage/blobs/object-replication-overview).

Source and destination accounts can use independent keys. For BYOK, import and authorize keys for each account. With Managed HSM, configure each account's CMK integration.

### PostgreSQL and MySQL Flexible Server

Distinguish read replicas, geo-redundant backups, and geo-restore. Their key, region, and identity requirements are not interchangeable. Provision recovery-region keys and identities as required; verify each product separately. See [PostgreSQL encryption](https://learn.microsoft.com/azure/postgresql/security/security-data-encryption) and [MySQL encryption](https://learn.microsoft.com/azure/mysql/security/security-customer-managed-key).

Meet regional key and identity requirements; for BYOK, validate key import for the recovery feature. Confirm Managed HSM support and regional requirements for that feature, including BYOK import where used.

### VM disk encryption

You can choose to manage encryption at the level of each managed disk, with your own keys. When you specify a customer-managed key, that key is used to protect and control access to the key that encrypts your data.

Azure managed disks handle encryption and decryption by using envelope encryption. Envelope encryption lets you rotate keys periodically without affecting your VMs. During rotation, the Storage service re-wraps DEKs with the new key version, and the underlying disk data isn't re-encrypted. Keep both the old and new key versions enabled until re-wrapping completes. See [Server-side encryption of Azure managed disks](https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption#azure-managed-disk-encryption-key-management).

Configure regional Disk Encryption Sets and keys, including regional imports for BYOK. With Managed HSM, satisfy the disk/key-store regional requirements, including imported key access for BYOK.

> [!IMPORTANT]
> Key Vault must be in the same region as each Disk Encryption Set.

### Azure Site Recovery

Pre-create a compatible target-region Disk Encryption Set and authorize it to access its regional key vault. Include the source disks and cache storage account in the design. Site Recovery does not automatically apply encryption-key changes to protected VMs: the documented procedure requires disabling and re-enabling replication to adopt changes. Do not infer Site Recovery support from a general disk-encryption capability. See [replication with CMK-enabled disks](https://learn.microsoft.com/azure/site-recovery/azure-to-azure-how-to-enable-replication-cmk-disks).

> [!IMPORTANT]
> ASR uses Single KEK and Dual KEK. It uses Storage GRS for the temporary replication cache (using Single KEK) and disk encryption for the VM disks in the source and target regions (using Dual KEK).

Use only [Standard or Premium vault in each region](#keys-pattern-2) or [Premium vault per region with external HSM and BYOK](#keys-pattern-3). The documented regional-vault approach requires target-region Disk Encryption Set access. For BYOK, validate the imported key and complete Site Recovery configuration.

## Secrets and certificates patterns {#secrets-and-certificates}

For secrets and certificates, choose between independent regional vaults and a vault with Microsoft-managed paired-region replication. Managed HSM does not support secrets or certificates.

Treat each independent region as a deployment stamp. Do not store secret values in the IaC repository. Optional application-level fallback to another vault requires explicit identity, networking, and version-selection design; a second endpoint alone does not provide safe fallback.

### Pattern 1: Standard or Premium vault in each region {#secrets-certificates-pattern-1}

- **Deployment:** One Standard or Premium vault per workload per region, configured consistently through infrastructure as code (IaC).
- **Artifact origin:** An approved secret-management process supplies secrets and certificates; the pipeline populates each regional vault.
- **During an outage:** Each surviving region uses its own vault with full read and write access.
- **Best for:** Workloads that need recovery independent of Microsoft-managed vault failover.
- **Watch for:** Keep versions, renewal, access policies, identities, and private connectivity ready before an outage. Roll changes out sequentially, not globally at once.

:::image type="content" source="./media/key-vault-secrets-per-region.png" alt-text="An approved deployment pipeline loads secrets and certificates into each regional vault independently. There is no vault-to-vault replication." lightbox="./media/key-vault-secrets-per-region.png":::

*Secrets and certificates - Pattern 1: independent Standard or Premium vaults populated by a pipeline.*

### Pattern 2: Standard or Premium vault in a paired region {#secrets-certificates-pattern-2}

- **Deployment:** One Standard or Premium vault in a region eligible for Microsoft-managed paired-region replication.
- **Artifact origin:** The pipeline populates the primary vault; Microsoft asynchronously replicates its contents.
- **During an outage:** Microsoft decides when to fail over. Afterward you can read, but cannot create, update, renew, or rotate objects until normal operation returns.
- **Best for:** Workloads that can tolerate Microsoft-managed recovery timing and read-only access.
- **Watch for:** Confirm the same-geography pairing, service exclusions, and recovery path rather than assuming any pair qualifies.

:::image type="content" source="./media/key-vault-secrets-paired-region.png" alt-text="A deployment pipeline loads secrets and certificates into the primary Key Vault. Microsoft asynchronously replicates them to its paired-region copy, which is read-only after Microsoft-managed failover." lightbox="./media/key-vault-secrets-paired-region.png":::

*Secrets and certificates - Pattern 2: one Standard or Premium vault with a Microsoft-managed paired-region copy.*

## Keys management patterns {#keys}

Customer-managed keys (CMKs) protect a service's data encryption keys; the data service still encrypts and decrypts the data. Bring your own key (BYOK) means importing externally generated key material. Here, BYOK refers to the supported HSM-to-HSM transfer process, not generic software-key import.

The six patterns below separate regional deployment from key protection. Standard supports software-protected keys; Premium supports HSM-protected keys. Both tiers share the same paired-region recovery model. The HSM-backed BYOK patterns use Premium or Managed HSM.

| Compare | [Standard or Premium vault with paired-region replication](#keys-pattern-1) | [Standard or Premium vault in each region](#keys-pattern-2) | [Premium vault per region with external HSM and BYOK](#keys-pattern-3) | [Managed HSM with geo-replication](#keys-pattern-4) | [Managed HSM geo-replication with external HSM and BYOK](#keys-pattern-5) | [Managed HSM with external key management](#keys-pattern-6) |
|---|---|---|---|---|---|---|
| Key origin | Primary vault | Each regional vault | Customer-owned external HSM | Primary Managed HSM | Customer-owned external HSM | Customer-owned external HSM |
| Distribution | Microsoft replication | Independent keys | Import into each vault | Geo-replication | Import, then geo-replicate | Register external key reference |
| Outage behavior | Read-only after failover | Local read/write | Local read/write | Healthy-region read/write | Healthy-region read/write | Recover failed component |
| Main constraint | Microsoft recovery timing | Service must allow separate vaults/keys | Same as Pattern 2; manage imports | Asynchronous replication window | Replication window and import lifecycle | No geo-replication or end-to-end SLA |

### Pattern 1: Standard or Premium vault with paired-region replication {#keys-pattern-1}

- **Deployment:** One Standard or Premium vault with an eligible Microsoft-managed paired-region copy.
- **Key origin:** Generate the key in the primary vault. Use Standard for software-protected keys or Premium for HSM-protected keys.
- **Distribution:** Microsoft replicates the same vault's contents; you do not create an independent secondary vault.
- **During an outage:** Read-only key access after Microsoft-managed failover; no key creation or rotation until normal operation returns.
- **Best for / watch for:** Services that accept Microsoft-managed recovery timing. Choose the tier for the required key protection and consuming-service support; Premium does not improve regional recovery control compared with Standard. Validate whether the application can meet its recovery objective.

:::image type="content" source="./media/key-vault-keys-paired-region.png" alt-text="A Standard or Premium vault generates the key in region A, using software or HSM protection respectively. Microsoft asynchronously replicates it to a paired-region copy of the same vault, which is read-only after failover." lightbox="./media/key-vault-keys-paired-region.png":::

*Keys - Pattern 1: Standard or Premium vault with Microsoft-managed paired-region replication.*

### Pattern 2: Standard or Premium vault in each region {#keys-pattern-2}

- **Deployment:** One Standard or Premium vault per workload per region.
- **Key origin:** Generate a separate key in each vault.
- **Distribution:** No vault-to-vault replication; each service instance uses its configured regional key.
- **During an outage:** Each surviving region retains full local read and write access.
- **Best for / watch for:** Services that support independent regional keys. Do not apply this topology to a single GRS account or a shared-key dependency without service-specific support.

:::image type="content" source="./media/key-vault-keys-vault-per-region.png" alt-text="A separate Key Vault, Standard or Premium, in each region creates its own key. The regions hold different keys and operate independently without vault-to-vault replication." lightbox="./media/key-vault-keys-vault-per-region.png":::

*Keys - Pattern 2: independent vaults with different regional keys.*

### Pattern 3: Premium vault per region with external HSM and BYOK {#keys-pattern-3}

- **Deployment:** One Premium vault per workload per region.
- **Key origin:** A customer-owned external HSM.
- **Distribution:** The BYOK process imports key material into each vault. This is not automatic vault-to-vault replication.
- **During an outage:** Each surviving region uses its local imported key with full read and write access.
- **Best for / watch for:** External key-origin requirements with independent regional vaults. Coordinate imports, versions, rotation, and consuming-service configuration. Pattern 2's service constraints still apply.

:::image type="content" source="./media/key-vault-keys-byok-per-region.png" alt-text="A customer-owned external HSM is the key origin. The BYOK process imports the same key into a Premium vault in each region, with no vault-to-vault replication." lightbox="./media/key-vault-keys-byok-per-region.png":::

*Keys - Pattern 3: external key material imported into independent Premium vaults.*

### Pattern 4: Managed HSM with geo-replication {#keys-pattern-4}

- **Deployment:** One Managed HSM pool with a primary and one supported extended region.
- **Key origin:** Generate the key in Managed HSM.
- **Distribution:** Asynchronous replication shares key material, roles, and permissions between regions.
- **During an outage:** The healthy region continues serving reads and writes through the pool's endpoint.
- **Best for / watch for:** Supported services requiring a shared key store and a customer-selected recovery region. Changes replicate within six minutes; recent changes can be lost if the primary is unrecoverable.

:::image type="content" source="./media/key-vault-keys-managed-hsm-geo.png" alt-text="Managed HSM creates the key in the primary region. Asynchronous multi-region replication synchronizes keys and roles between the primary and extended regions. Both regions support reads and writes." lightbox="./media/key-vault-keys-managed-hsm-geo.png":::

*Keys - Pattern 4: Managed HSM key generation and multi-region replication.*

### Pattern 5: Managed HSM geo-replication with external HSM and BYOK {#keys-pattern-5}

- **Deployment:** The same primary/extended-region pool as Keys - Pattern 4.
- **Key origin:** A customer-owned external HSM.
- **Distribution:** Import the key into the primary pool through BYOK, then use Managed HSM geo-replication.
- **During an outage:** The healthy region continues serving reads and writes.
- **Best for / watch for:** External key-origin requirements plus replicated Managed HSM. Plan the import lifecycle and the same asynchronous replication window as Pattern 4; imported key material now resides in Azure HSMs.

:::image type="content" source="./media/key-vault-keys-managed-hsm-geo-byok.png" alt-text="A customer-owned external HSM supplies a BYOK import into the primary Managed HSM. Managed HSM then replicates key material and roles to the extended region; both regions serve reads and writes." lightbox="./media/key-vault-keys-managed-hsm-geo-byok.png":::

*Keys - Pattern 5: BYOK import followed by Managed HSM geo-replication.*

### Pattern 6: Managed HSM with external key management {#keys-pattern-6}

- **Deployment:** Managed HSM, an EKM proxy, and your external HSM; no Managed HSM geo-replication for external keys.
- **Key origin:** A customer-owned external HSM; the key encryption key never leaves it.
- **Distribution:** Register an external key reference, not an imported copy of the key material.
- **During an outage:** Recovery depends on Managed HSM, the proxy, external HSM, networking, or the region. There is no geo-replicated failover target.
- **Best for / watch for:** A requirement for physical key custody outside Microsoft. Every external operation adds network round trips. No end-to-end Microsoft SLA covers the external components. Recreate an external key reference rather than attempting unsupported backup/restore.

:::image type="content" source="./media/key-vault-keys-managed-hsm-ekm.png" alt-text="A customer-owned external HSM retains the key encryption key. Region A's Managed HSM and EKM proxy use an external key reference; no key material is imported. Region B has no geo-replicated failover target." lightbox="./media/key-vault-keys-managed-hsm-ekm.png":::

*Keys - Pattern 6: externally held key material, without geo-replication.*

For replicated Managed HSM, respect DNS time to live (TTL) so clients can reach a healthy region. Keep soft delete, purge protection, historical key versions, identities, and networking in the recovery plan. See [multi-region replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication), [BYOK](https://learn.microsoft.com/azure/key-vault/keys/hsm-protected-keys), and [EKM scope and limitations](https://learn.microsoft.com/azure/key-vault/managed-hsm/external-key-management-overview).

## Decision tree

Check the scenario conditions before following the chart. Results identify candidate patterns, not universal service support. "Secrets and certificates" uses Pattern 1; "Keys" uses Patterns 1-6.

:::image type="content" source="./media/key-vault-decision-tree.png" alt-text="Decision tree for secrets and certificates and keys, with results labeled by pattern name. Secrets and certificates: use a Standard or Premium vault in each region for customer-managed application failover, or a Standard or Premium vault in a paired region when eligible and Microsoft-managed recovery timing and read-only access are acceptable. Keys: choose Managed HSM with external key management for external custody; Managed HSM with geo-replication, optionally with external HSM and BYOK, for a shared replicated key store; Standard or Premium vaults in each region, or Premium vaults per region with external HSM and BYOK, for independent regional vaults; or a Standard or Premium vault with paired-region replication for eligible Microsoft-managed recovery. Validate consuming-service support first." lightbox="./media/key-vault-decision-tree.png":::

*Select a candidate pattern, then validate the consuming service's replication, restore, and key-lifecycle requirements.*

## Reference links

- [Azure Key Vault security worlds](https://learn.microsoft.com/azure/key-vault/general/overview-security-worlds)
- [Azure paired regions](https://learn.microsoft.com/azure/reliability/regions-paired)
- [External key management](https://learn.microsoft.com/azure/key-vault/managed-hsm/external-key-management-overview)
- [HSM-protected key import](https://learn.microsoft.com/azure/key-vault/keys/hsm-protected-keys)
- [Key Vault availability and redundancy](https://learn.microsoft.com/azure/key-vault/general/disaster-recovery-guidance)
- [Key-management product selection](https://learn.microsoft.com/azure/security/fundamentals/key-management-choose)
- [Managed HSM multi-region replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication)
- [Microsoft-managed failover to a paired region](https://learn.microsoft.com/azure/reliability/reliability-key-vault#microsoft-managed-failover-to-a-paired-region)
- [Reliability in Azure Key Vault Managed HSM](https://learn.microsoft.com/azure/reliability/reliability-managed-hsm)
- [Services that support CMKs](https://learn.microsoft.com/azure/security/fundamentals/encryption-customer-managed-keys-support)

## Next step

> [!div class="nextstepaction"]
> [Private DNS zones for multi-region private endpoints](./private-dns-multi-region.md)
