---
title: Key Vault across regions
description: Compare two secrets and certificates patterns and seven key patterns, with regional diagrams, service-specific recovery scenarios, and a decision tree.
ms.date: 10/27/2026
ms.topic: conceptual
---

# Key Vault across regions

Key Vault is often a runtime dependency: an application can need keys, secrets, and certificates just to start. Recovering data in another region is not enough if its key cannot be reached. Start with regional behavior, compare the products and patterns, then check the consuming service's requirements.

> [!IMPORTANT]
> A key store's replication capability does not establish support for every service's replication or restore operation. Validate key access, identities, networking, rotation, and recovery together.

## Paired and nonpaired regions

**Paired regions.** In eligible same-geography region pairs, Key Vault Standard and Premium replicate vault contents asynchronously to a Microsoft-managed secondary. That copy is part of the same vault, not a second vault you manage. Microsoft decides when to fail over; afterward, secrets, certificates, and keys are available read-only until normal operation returns.

**Nonpaired regions.** Do not assume a Microsoft-managed secondary exists. Use independent regional vaults when the consuming service supports them, or configure Managed HSM multi-region replication for keys. Managed HSM can extend to one supported additional region; it is not restricted to region pairs.

Check three design constraints:

- **3+0:** No paired region, for example Qatar Central, Belgium Central, and Spain Central.
- **3+1, asymmetric:** A pairing relationship is not necessarily reciprocal. Check West US 3 and East US against the service's replication exclusions.
- **3+1, cross-geography:** A pair can cross geography boundaries, for example Brazil South and South Central US. Pairing alone does not establish a data-residency boundary or Key Vault replication eligibility.

The [Key Vault reliability guide](https://learn.microsoft.com/azure/reliability/reliability-key-vault) lists exclusions, including Brazil South, Brazil Southeast, West US 3, and nonpaired regions. Microsoft-managed failover is best effort, not a customer-triggered recovery mechanism or a guaranteed application recovery time. Once initiated, public endpoint convergence is designed to take a few minutes; private endpoints can require up to an additional 20 minutes. Do not treat those routing timings as the total outage duration.

## Choose the product

Key Vault is multi-tenant; Managed HSM is single-tenant. Keep the product choice separate from the regional deployment choice.

| Capability | Key Vault Standard | Key Vault Premium | Managed HSM | Managed HSM with EKM |
|---|---|---|---|---|
| Key protection | Software, FIPS 140 Level 1 | HSM, FIPS 140-3 Level 3 | Single-tenant HSM, FIPS 140-3 Level 3 | Customer-owned HSM outside Microsoft |
| Artifacts | Keys, secrets, certificates | Keys, secrets, certificates; symmetric keys in preview | Asymmetric and symmetric keys | External key references |
| Availability | Automatic zone redundancy where supported | Same regional resilience as Standard | Rack-level redundancy; optional extended region | Also depends on your proxy and HSM |
| Regional replication | Eligible same-geography pair | Eligible same-geography pair | One supported extended region | No geo-replication |
| SLA | 99.99% | 99.99% | 99.9% single region; 99.99% replicated | No end-to-end SLA for external keys |

With external key management (EKM), Managed HSM authenticates and authorizes requests, but the key encryption key stays in your external HSM. You operate the proxy, HSM, and their recovery path. See the [product selection guidance](https://learn.microsoft.com/azure/security/fundamentals/key-management-choose) and [current SLA terms](https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services).

## Secrets and certificates

Use Key Vault Standard or Premium. Managed HSM and EKM do not store secrets or certificates. Compare the patterns, then review their distribution diagrams.

| Compare | [Pattern 1](#secrets-certificates-pattern-1)<br>Vault in each region | [Pattern 2](#secrets-certificates-pattern-2)<br>Vault in a paired region |
|---|---|---|
| Deployment | One vault per workload per region | One vault with a Microsoft-managed paired-region copy |
| Artifact distribution | Pipeline populates each vault | Pipeline populates primary; Microsoft replicates |
| During an outage | Full local read and write | Read-only after Microsoft-managed failover |
| Best fit | Short, customer-controlled recovery | Workloads that accept Microsoft-managed recovery |
| Main constraint | Keep vaults synchronized | Eligible pair and read-only recovery |

### Pattern 1: Key Vault in each region {#secrets-certificates-pattern-1}

- **Deployment:** One vault per workload per region, configured consistently through infrastructure as code (IaC).
- **Artifact origin:** An approved secret-management process supplies secrets and certificates; the pipeline populates each regional vault.
- **During an outage:** Each surviving region uses its own vault with full read and write access.
- **Best for:** Workloads that need recovery independent of Microsoft-managed vault failover.
- **Watch for:** Keep versions, renewal, access policies, identities, and private connectivity ready before an outage. Roll changes out sequentially, not globally at once.

:::image type="content" source="./media/key-vault-secrets-per-region.png" alt-text="An approved deployment pipeline loads secrets and certificates into each regional vault independently. There is no vault-to-vault replication." lightbox="./media/key-vault-secrets-per-region.png":::

*Secrets and certificates - Pattern 1: independent regional vaults populated by a pipeline.*

### Pattern 2: Key Vault in a paired region {#secrets-certificates-pattern-2}

- **Deployment:** One vault in a region eligible for Microsoft-managed paired-region replication.
- **Artifact origin:** The pipeline populates the primary vault; Microsoft asynchronously replicates its contents.
- **During an outage:** Microsoft decides when to fail over. Afterward you can read, but cannot create, update, renew, or rotate objects until normal operation returns.
- **Best for:** Workloads that can tolerate Microsoft-managed recovery timing and read-only access.
- **Watch for:** Confirm the same-geography pairing, service exclusions, and recovery path rather than assuming any pair qualifies.

:::image type="content" source="./media/key-vault-secrets-paired-region.png" alt-text="A deployment pipeline loads secrets and certificates into the primary Key Vault. Microsoft asynchronously replicates them to its paired-region copy, which is read-only after Microsoft-managed failover." lightbox="./media/key-vault-secrets-paired-region.png":::

*Secrets and certificates - Pattern 2: one vault with a Microsoft-managed paired-region copy.*

Treat each independent region as a deployment stamp. Do not store secret values in the IaC repository. Optional application-level fallback to another vault requires explicit identity, networking, and version-selection design; a second endpoint alone does not provide safe fallback.

## Keys

Customer-managed keys (CMKs) protect a service's data encryption keys; the data service still encrypts and decrypts the data. Bring your own key (BYOK) means importing externally generated key material. Here, BYOK refers to the supported HSM-to-HSM transfer process, not generic software-key import.

The seven patterns below follow the updated guidance's numbering. Standard supports software-protected keys; the HSM-backed BYOK patterns use Premium or Managed HSM.

| Compare | [Pattern 1](#keys-pattern-1)<br>Standard + pair | [Pattern 2](#keys-pattern-2)<br>Premium + pair | [Pattern 3](#keys-pattern-3)<br>Vault per region | [Pattern 4](#keys-pattern-4)<br>Premium per region + BYOK | [Pattern 5](#keys-pattern-5)<br>Replicated Managed HSM | [Pattern 6](#keys-pattern-6)<br>Replicated Managed HSM + BYOK | [Pattern 7](#keys-pattern-7)<br>External key management |
|---|---|---|---|---|---|---|---|
| Key origin | Primary vault | Primary vault | Each regional vault | Customer-owned external HSM | Primary Managed HSM | Customer-owned external HSM | Customer-owned external HSM |
| Distribution | Microsoft replication | Microsoft replication | Independent keys | Import into each vault | Geo-replication | Import, then geo-replicate | Register external key reference |
| Outage behavior | Read-only after failover | Read-only after failover | Local read/write | Local read/write | Healthy-region read/write | Healthy-region read/write | Recover failed component |
| Main constraint | Microsoft recovery timing | Microsoft recovery timing | Service must allow separate vaults/keys | Same as Pattern 3; manage imports | Asynchronous replication window | Replication window and import lifecycle | No geo-replication or end-to-end SLA |

### Pattern 1: Standard vault with paired-region replication {#keys-pattern-1}

- **Deployment:** One Standard vault with an eligible Microsoft-managed paired-region copy.
- **Key origin:** Generate a software-protected key in the primary vault.
- **Distribution:** Microsoft replicates the same vault's contents; you do not create an independent secondary vault.
- **During an outage:** Read-only key access after Microsoft-managed failover; no key creation or rotation until normal operation returns.
- **Best for / watch for:** Services that accept software-protected keys and Microsoft-managed recovery timing. Validate whether the application can meet its recovery objective.

:::image type="content" source="./media/key-vault-keys-standard-paired-region.png" alt-text="A Standard vault generates the key in region A. Microsoft asynchronously replicates it to a paired-region copy of the same vault, which is read-only after failover." lightbox="./media/key-vault-keys-standard-paired-region.png":::

*Keys - Pattern 1: Standard vault with Microsoft-managed paired-region replication.*

### Pattern 2: Premium vault with paired-region replication {#keys-pattern-2}

- **Deployment:** One Premium vault with an eligible Microsoft-managed paired-region copy.
- **Key origin:** Generate an HSM-protected key in the primary vault.
- **Distribution:** Microsoft asynchronously replicates the same vault's contents.
- **During an outage:** The same read-only recovery model as Keys - Pattern 1.
- **Best for / watch for:** HSM protection without a customer-configured replicated Managed HSM. Premium does not improve the vault's regional recovery control compared with Standard.

:::image type="content" source="./media/key-vault-keys-premium-paired-region.png" alt-text="A Premium vault generates an HSM-protected key in region A. Microsoft asynchronously replicates it to a paired-region copy of the same vault, which is read-only after failover." lightbox="./media/key-vault-keys-premium-paired-region.png":::

*Keys - Pattern 2: Premium vault with Microsoft-managed paired-region replication.*

### Pattern 3: One Key Vault per region {#keys-pattern-3}

- **Deployment:** One Standard or Premium vault per workload per region.
- **Key origin:** Generate a separate key in each vault.
- **Distribution:** No vault-to-vault replication; each service instance uses its configured regional key.
- **During an outage:** Each surviving region retains full local read and write access.
- **Best for / watch for:** Services that support independent regional keys. Do not apply this topology to a single GRS account or a shared-key dependency without service-specific support.

:::image type="content" source="./media/key-vault-keys-vault-per-region.png" alt-text="A separate Key Vault, Standard or Premium, in each region creates its own key. The regions hold different keys and operate independently without vault-to-vault replication." lightbox="./media/key-vault-keys-vault-per-region.png":::

*Keys - Pattern 3: independent vaults with different regional keys.*

### Pattern 4: Premium vault per region with external HSM and BYOK {#keys-pattern-4}

- **Deployment:** One Premium vault per workload per region.
- **Key origin:** A customer-owned external HSM.
- **Distribution:** The BYOK process imports key material into each vault. This is not automatic vault-to-vault replication.
- **During an outage:** Each surviving region uses its local imported key with full read and write access.
- **Best for / watch for:** External key-origin requirements with independent regional vaults. Coordinate imports, versions, rotation, and consuming-service configuration. Pattern 3's service constraints still apply.

:::image type="content" source="./media/key-vault-keys-byok-per-region.png" alt-text="A customer-owned external HSM is the key origin. The BYOK process imports the same key into a Premium vault in each region, with no vault-to-vault replication." lightbox="./media/key-vault-keys-byok-per-region.png":::

*Keys - Pattern 4: external key material imported into independent Premium vaults.*

### Pattern 5: Managed HSM with geo-replication {#keys-pattern-5}

- **Deployment:** One Managed HSM pool with a primary and one supported extended region.
- **Key origin:** Generate the key in Managed HSM.
- **Distribution:** Asynchronous replication shares key material, roles, and permissions between regions.
- **During an outage:** The healthy region continues serving reads and writes through the pool's endpoint.
- **Best for / watch for:** Supported services requiring a shared key store and a customer-selected recovery region. Changes replicate within six minutes; recent changes can be lost if the primary is unrecoverable.

:::image type="content" source="./media/key-vault-keys-managed-hsm-geo.png" alt-text="Managed HSM creates the key in the primary region. Asynchronous multi-region replication synchronizes keys and roles between the primary and extended regions. Both regions support reads and writes." lightbox="./media/key-vault-keys-managed-hsm-geo.png":::

*Keys - Pattern 5: Managed HSM key generation and multi-region replication.*

### Pattern 6: Managed HSM geo-replication with external HSM and BYOK {#keys-pattern-6}

- **Deployment:** The same primary/extended-region pool as Keys - Pattern 5.
- **Key origin:** A customer-owned external HSM.
- **Distribution:** Import the key into the primary pool through BYOK, then use Managed HSM geo-replication.
- **During an outage:** The healthy region continues serving reads and writes.
- **Best for / watch for:** External key-origin requirements plus replicated Managed HSM. Plan the import lifecycle and the same asynchronous replication window as Pattern 5; imported key material now resides in Azure HSMs.

:::image type="content" source="./media/key-vault-keys-managed-hsm-geo-byok.png" alt-text="A customer-owned external HSM supplies a BYOK import into the primary Managed HSM. Managed HSM then replicates key material and roles to the extended region; both regions serve reads and writes." lightbox="./media/key-vault-keys-managed-hsm-geo-byok.png":::

*Keys - Pattern 6: BYOK import followed by Managed HSM geo-replication.*

### Pattern 7: Managed HSM with external key management {#keys-pattern-7}

- **Deployment:** Managed HSM, an EKM proxy, and your external HSM; no Managed HSM geo-replication for external keys.
- **Key origin:** A customer-owned external HSM; the key encryption key never leaves it.
- **Distribution:** Register an external key reference, not an imported copy of the key material.
- **During an outage:** Recovery depends on Managed HSM, the proxy, external HSM, networking, or the region. There is no geo-replicated failover target.
- **Best for / watch for:** A requirement for physical key custody outside Microsoft. Every external operation adds network round trips. No end-to-end Microsoft SLA covers the external components. Recreate an external key reference rather than attempting unsupported backup/restore.

:::image type="content" source="./media/key-vault-keys-managed-hsm-ekm.png" alt-text="A customer-owned external HSM retains the key encryption key. Region A's Managed HSM and EKM proxy use an external key reference; no key material is imported. Region B has no geo-replicated failover target." lightbox="./media/key-vault-keys-managed-hsm-ekm.png":::

*Keys - Pattern 7: externally held key material, without geo-replication.*

For replicated Managed HSM, respect DNS time to live (TTL) so clients can reach a healthy region. Keep soft delete, purge protection, historical key versions, identities, and networking in the recovery plan. See [multi-region replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication), [BYOK](https://learn.microsoft.com/azure/key-vault/keys/hsm-protected-keys), and [EKM scope and limitations](https://learn.microsoft.com/azure/key-vault/managed-hsm/external-key-management-overview).

## Common key-management scenarios

The columns use the **Keys** pattern numbers above. Keep the service conditions in the cells when comparing options; read the scenario sections below before choosing. **Conditional** means that the named feature, topology, or key operation must satisfy the linked service guidance. It is not a blanket support guarantee.

| Scenario | [Pattern 1](#keys-pattern-1)<br>Standard + pair | [Pattern 2](#keys-pattern-2)<br>Premium + pair | [Pattern 3](#keys-pattern-3)<br>Vault per region | [Pattern 4](#keys-pattern-4)<br>Premium per region + BYOK | [Pattern 5](#keys-pattern-5)<br>Replicated Managed HSM | [Pattern 6](#keys-pattern-6)<br>Replicated Managed HSM + BYOK | [Pattern 7](#keys-pattern-7)<br>External key management |
|---|---|---|---|---|---|---|---|
| [Application-level encryption](#application-level-encryption)<br>Application selects cryptographic operations and keys. | Supported: software key operations. | Supported: HSM key operations. | Supported: app must handle independent keys. | Supported: app must handle imported regional keys. | Supported: supported Managed HSM operations. | Supported: imported Managed HSM keys. | Conditional: supported external-key operations only; not a general replacement for application cryptography. |
| [Azure Storage GRS](#azure-storage-grs)<br>Both data copies share the account's CMK configuration. | Supported; depends on Microsoft-managed vault recovery. | Supported; depends on Microsoft-managed vault recovery. | Not supported as a separate key/vault per GRS replica. | Not supported as a separate vault per GRS replica. | Supported; maintain shared key access. | Supported; maintain shared key access. | Conditional: Storage CMK integration, proxy availability, and no external-key geo-replication. |
| [Storage object replication](#storage-object-replication)<br>Separate source and destination accounts. | Supported; configure each account's key access. | Supported; configure each account's key access. | Supported; accounts can use independent keys. | Supported; import and authorize each account. | Supported; configure each account. | Supported; configure each account. | Conditional: account CMK integration and external dependency recovery. |
| [VM disk encryption](#vm-disk-encryption)<br>Server-side encryption using Disk Encryption Sets. | Conditional: same-region key store. | Conditional: same-region key store. | Supported: regional Disk Encryption Sets and keys. | Supported: regional imports and Disk Encryption Sets. | Conditional: disk/key-store regional requirements. | Conditional: regional requirements and imported key. | Conditional: supported disk profile; Secure Key Release is not supported. |
| [Azure Site Recovery](#azure-site-recovery)<br>Source disks, cache account, and target disks. | Not sufficient alone: pre-create target-region encryption dependencies. | Not sufficient alone: pre-create target-region encryption dependencies. | Documented approach: target-region Disk Encryption Set and vault access. | Conditional: validate the imported key and complete Site Recovery configuration. | Do not assume support from managed-disk support; validate Site Recovery's key-store requirements. | Same Site Recovery restrictions as Pattern 5. | Do not assume support; Site Recovery CMK guidance must cover the exact configuration. |
| [PostgreSQL and MySQL Flexible Server](#postgresql-and-mysql-flexible-server)<br>Replica, backup, and restore are different operations. | Conditional: product and recovery feature. | Conditional: product and recovery feature. | Conditional: regional key/identity requirements. | Conditional: key import and recovery feature. | Conditional: Managed HSM and regional requirements. | Conditional: import, Managed HSM, and recovery feature. | Conditional: supported service CMK integration; validate the recovery feature separately. |
| [Database geo-replication](#database-geo-replication)<br>SQL Database, SQL Managed Instance, and Cosmos DB. | Conditional: key access and Microsoft-managed recovery risk. | Conditional: key access and Microsoft-managed recovery risk. | Not a general shared-key recovery solution; SQL has service-specific regional-copy designs. | Conditional: only a documented service-specific key-copy/rotation design. | Candidate for supported shared-key dependencies; validate each database service. | Same as Pattern 5 with imported key lifecycle. | Conditional: supported service integration; no geo-replicated external key. |
| [Database geo-restore](#database-geo-restore)<br>Restore requires historical key versions and permissions. | Conditional: restore target and original key access. | Conditional: restore target and original key access. | Conditional: retained original keys, not a newly generated substitute. | Conditional: required key material and history. | Conditional: service restore support and key availability. | Conditional: service restore support and key history. | Conditional: original external key/reference availability; no external-key backup/restore. |
| [Purview Information Protection](#purview-information-protection)<br>Azure Rights Management tenant-key BYOK is not Microsoft 365 Customer Key. | Conditional: tenant-key feature and lifecycle requirements. | Documented HSM-backed vault option; preserve keys for old content. | Not applicable as a workload-region stamp; Microsoft 365 is not a regional app deployment. | External HSM import into a dedicated Premium vault; validate tenant-key configuration. | Confirm the exact Purview feature's Managed HSM support. | Confirm that feature's Managed HSM/BYOK configuration. | No blanket support claim: verify the exact Purview feature and external-key operations. |

### Application-level encryption

Your application decides whether each region uses an independent key or a common key. Preserve the key identifier and version needed to decrypt existing data. EKM is designed for compatible CMK encryption-at-rest integrations and exposes a restricted operation set; do not assume arbitrary application signing or encryption works unchanged. See [key operations](https://learn.microsoft.com/azure/key-vault/keys/about-keys-details) and [external key lifecycle](https://learn.microsoft.com/azure/key-vault/managed-hsm/external-key-management-key-lifecycle).

### Azure Storage GRS

GRS copies are replicas of one storage account, not independently configured accounts. Both depend on that account's CMK. Independent regional vaults do not let you assign a different key store to each GRS replica. Consider a replicated key store and test key access during account failover. See [Storage CMKs](https://learn.microsoft.com/azure/storage/common/customer-managed-keys-overview).

### Storage object replication

Source and destination are separate accounts, so their CMK configuration can be independent. Validate each account's identity, key versions, and recovery behavior. Do not carry GRS's shared-account constraint into this topology. See [object replication](https://learn.microsoft.com/azure/storage/blobs/object-replication-overview).

### VM disk encryption

For managed-disk server-side encryption, configure regional Disk Encryption Sets and key access. Managed disks and their key store must meet same-region requirements. This is different from guest-based Azure Disk Encryption and confidential VM key release. EKM does not support Secure Key Release. See [managed-disk encryption](https://learn.microsoft.com/azure/virtual-machines/disk-encryption).

### Azure Site Recovery

Pre-create a compatible target-region Disk Encryption Set and authorize it to access its regional key vault. Include the source disks and cache storage account in the design. Site Recovery does not automatically apply encryption-key changes to protected VMs: the documented procedure requires disabling and re-enabling replication to adopt changes. Do not infer Site Recovery support from a general disk-encryption capability. See [replication with CMK-enabled disks](https://learn.microsoft.com/azure/site-recovery/azure-to-azure-how-to-enable-replication-cmk-disks).

### PostgreSQL and MySQL Flexible Server

Distinguish read replicas, geo-redundant backups, and geo-restore. Their key, region, and identity requirements are not interchangeable. Provision recovery-region keys and identities as required; verify each product separately. See [PostgreSQL encryption](https://learn.microsoft.com/azure/postgresql/security/security-data-encryption) and [MySQL encryption](https://learn.microsoft.com/azure/mysql/security/security-customer-managed-key).

### Database geo-replication

SQL Database and SQL Managed Instance need the required TDE protector keys available to their replicas. Documented SQL designs can use regional copies of key material; rotation must preserve access to every required version. Cosmos DB uses an account-level CMK dependency and has its own networking and key-store requirements. Do not assume SQL's key-copy design applies to Cosmos DB. Replicated Managed HSM is a candidate where supported; compare its cost with the accepted risk of Microsoft-managed vault recovery, not an arbitrary number-of-keys threshold. See [SQL customer-managed TDE](https://learn.microsoft.com/azure/azure-sql/database/transparent-data-encryption-byok-overview) and [Cosmos DB CMKs](https://learn.microsoft.com/azure/cosmos-db/how-to-setup-customer-managed-keys).

### Database geo-restore

Restoring data does not restore access to its encryption keys. Retain all historical keys required by the backup, authorize the restored service, and verify the target region/geography against that service's restore rules. A fresh key in a new vault is not a substitute. There is no single cross-geography rule that can safely represent every SQL and Cosmos DB restore feature. See the [SQL recovery requirements](https://learn.microsoft.com/azure/azure-sql/database/transparent-data-encryption-byok-overview#backup-and-restore-considerations) and the [Cosmos DB CMK requirements](https://learn.microsoft.com/azure/cosmos-db/how-to-setup-customer-managed-keys).

### Purview Information Protection

Identify whether the requirement concerns an Azure Rights Management tenant key, Microsoft 365 Customer Key, or another protection feature. These are not interchangeable integrations. For tenant-key BYOK, the documented Premium-vault approach imports an external HSM key into Azure; it is not direct real-time use of an on-premises HSM. Preserve keys that protect old content and test recovery before production. Consider Microsoft-managed keys unless customer control is required. See [Rights Management BYOK](https://learn.microsoft.com/purview/rights-management-byok).

## Decision tree

Check the scenario conditions before following the chart. Results identify candidate patterns, not universal service support. "Secrets and certificates" uses Patterns 1-2; "Keys" uses Patterns 1-7.

:::image type="content" source="./media/key-vault-decision-tree.png" alt-text="Decision tree for secrets and certificates and keys. Secrets and certificates: independent regional read-write needs lead to Pattern 1; an eligible paired-region read-only recovery design leads to Pattern 2. Keys: external custody leads to Pattern 7; a shared replicated key store leads to Pattern 5 or Pattern 6 with BYOK; independent regional vaults lead to Pattern 3 or Pattern 4 with BYOK; eligible Microsoft-managed recovery leads to Pattern 1 for software protection or Pattern 2 for HSM protection. Validate consuming-service support first." lightbox="./media/key-vault-decision-tree.png":::

*Select a candidate pattern, then validate the consuming service's replication, restore, and key-lifecycle requirements.*

## Reference links

- [Reliability in Azure Key Vault](https://learn.microsoft.com/azure/reliability/reliability-key-vault)
- [Key Vault availability and redundancy](https://learn.microsoft.com/azure/key-vault/general/disaster-recovery-guidance)
- [Azure paired regions](https://learn.microsoft.com/azure/reliability/regions-paired)
- [Managed HSM multi-region replication](https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication)
- [External key management](https://learn.microsoft.com/azure/key-vault/managed-hsm/external-key-management-overview)
- [Services that support CMKs](https://learn.microsoft.com/azure/security/fundamentals/encryption-customer-managed-keys-support)
- [Key-management product selection](https://learn.microsoft.com/azure/security/fundamentals/key-management-choose)
- [HSM-protected key import](https://learn.microsoft.com/azure/key-vault/keys/hsm-protected-keys)

## Next step

> [!div class="nextstepaction"]
> [Private DNS zones for multi-region private endpoints](./private-dns-multi-region.md)
