---
title: Platform readiness checklist for a new region
description: The platform items that most often stall a newly qualified Azure region — network foundation, governance and automation, operations and data, capacity and security.
ms.date: 10/02/2026
ms.topic: conceptual
---

# Platform readiness checklist for a new region

These are the platform items that most often stall a new region after it has been qualified. Most are inexpensive to plan early and expensive to retrofit. Get these right once, and each later region becomes mostly configuration instead of a new project. Apply only those the region's connectivity profile and workload requirements call for.

Hub and shared-service implementations differ between organizations. The checklist names what must be true, not how a specific hub is built. Items marked as **common blockers** should be planned before qualification completes; confirm the others as the capability set is enabled.

## Network foundation

Private DNS across regions, routing and inspection paths, and hybrid connectivity apply only to connected profiles. Everything else on this page applies to every profile, including Disconnected Spokes.

| Item | What must be true |
|---|---|
| **IP address planning** (common blocker) | Reserve non-overlapping address space for future regions and profiles. |
| Private DNS across regions | Private endpoints and hybrid names resolve wherever the workload runs. |
| Routing and inspection paths | Traffic reaches hubs and firewalls without asymmetric paths. |
| Hybrid connectivity | Existing circuits are reused, or paths are added. See [resilient hybrid connectivity](./platform-enablement-connectivity.md#resilient-hybrid-connectivity). |
| Firewall and partner allow-lists | On-premises firewalls and third-party allow-lists include the new region's address ranges. |
| Identity services | The directory and identity services that workloads depend on are reachable from the region. |

## Governance and automation

| Item | What must be true |
|---|---|
| **Region settings in policy** (common blocker) | Allowed-locations and region parameters admit the new region only for its qualified workload requirements. |
| Region-aware infrastructure as code | Modules, naming, and tagging are parameterized by region, with no hard-coded locations. |
| Landing-zone provisioning | Subscription or landing-zone vending can place workloads in the region. |
| Regional access | Subscriptions have access to the region where access is restricted. |

## Operations and data

| Item | What must be true |
|---|---|
| **Where logs and telemetry live** (common blocker) | Workspace location and residency for monitoring and security data are decided. |
| Backup placement | Vaults and valid restore targets exist for the region. See [Storage, backup, and Key Vault](./storage-backup-key-vault.md). |
| Runbooks and support | Incident, on-call, and support procedures include the region. |

## Capacity and security

| Item | What must be true |
|---|---|
| **Quota and specific capacity** (common blocker) | Quota for the required SKUs and models is requested ahead of onboarding; capacity reservations are used where justified. |
| Key Vault placement | Workload vaults exist per region rather than as a cross-region dependency. See [Storage, backup, and Key Vault](./storage-backup-key-vault.md#recommended-key-vault-pattern). |
| Security coverage | Security posture, threat detection, and privileged access paths extend to the region. |

> [!TIP]
> **Ready for workloads** means the region is qualified for its workload requirements, the required capability set is in place through standard automation, and workloads can onboard without platform exceptions.

## Next step

> [!div class="nextstepaction"]
> [Governance and operating model](./operating-model.md)
