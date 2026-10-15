---
title: Storage across regions
description: Paired-region and region-of-choice behavior for Azure Storage replication in multi-region workloads.
ms.date: 10/15/2026
ms.topic: conceptual
---

# Storage across regions

Storage replication illustrates why regional qualification cannot stop at "the service exists in both regions."

## Paired-region options

- Geo-redundant storage options such as GRS and GZRS replicate data asynchronously to the service-defined secondary region.
- Built-in geo-redundancy and failover behavior must be evaluated separately from workload-level recoverability.

## Region-of-choice options

- Object replication can asynchronously replicate **block blobs** between selected storage accounts and regions.
- It requires change feed on the source and blob versioning on source and destination accounts.
- Object replication does not support append blobs, page blobs, or accounts with hierarchical namespace enabled.
- A source account can currently replicate to no more than two destination accounts.

> [!IMPORTANT]
> Replicated data does not by itself make the workload recoverable. Validate the application recovery path end to end.

## Reference links

- [Azure Storage redundancy](https://learn.microsoft.com/azure/storage/common/storage-redundancy)
- [Object replication for block blobs](https://learn.microsoft.com/azure/storage/blobs/object-replication-overview)

## Next step

> [!div class="nextstepaction"]
> [Backup and restore across regions](./backup-across-regions.md)
