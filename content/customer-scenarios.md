---
title: Multi-region customer scenarios
description: Four illustrative scenarios that follow the multi-region framework from a business or technical driver to a governed regional and workload decision.
ms.date: 09/30/2026
ms.topic: conceptual
---

# Customer scenarios

These examples show how the framework moves from a business or technical driver to a governed regional and workload decision. They are illustrative, not customer-specific recommendations.

## Regulated bank adopts a new in-country region

A financial-services organization operates workloads outside its home country. A new Azure region opens in-country while regulatory or business requirements create a need for certain data or services to remain there.

| Step | Outcome |
|---|---|
| Driver | Data residency and regulatory requirements; new in-country Azure region. |
| Framework | Dimension 2 confirms mandatory location requirements. Dimension 3 identifies affected workloads and dependencies. Dimension 4 validates required regional capabilities, services, zones, access, and constraints. |
| Qualification | The region can be qualified for defined Hybrid-Connected workload requirements while other portfolio workloads remain candidates until their dependencies are understood. |
| Application Landing Zone archetype | **Hybrid-Connected Applications** |
| Connectivity profile | **Minimal Regional Hub** where selected local capabilities are required and existing hybrid connectivity can be reused where reachability and resiliency requirements permit. |
| Placement | In-scope workloads can relocate selectively; other workloads can remain in place. Recovery architecture remains a workload-specific decision. |

**Takeaway:** A new in-country region can be qualified for defined workload requirements without forcing portfolio-wide relocation. A nonpaired recovery path must be designed explicitly. See [Resiliency scenarios](./resiliency-scenarios.md).

## AI team requires a specific model or GPU SKU

A product team requires an AI model, GPU SKU, or related Azure service that is unavailable in the organization's existing regions or constrained by quota.

| Step | Outcome |
|---|---|
| Driver | AI model, service, SKU, or quota availability. |
| Framework | Dimension 1 confirms the business requirement. Dimension 2 validates data and compliance constraints. Dimension 4 validates current model, service, SKU, zone, regional access, and quota support. |
| Qualification | The region can be qualified for the defined AI workload requirements; additional dependencies can remain conditional until their design is known. |
| Application Landing Zone archetype | **Isolated Cloud-Native or AI Applications** where the workload is self-contained; **Connected Cloud-Native or AI Applications** where private enterprise dependencies are required. |
| Connectivity profile | **Disconnected Spokes** where the workload is self-contained; a connected profile only where actual dependencies justify it. |
| Placement | Net-new deployment. Revalidate current model, SKU, service, regional access, and quota support at decision time. |

**Takeaway:** Qualify against the requirements that exist today; do not introduce enterprise connectivity or regional platform capabilities before a workload requirement justifies them.

## Acquisition brings an estate in another geography

An acquisition introduces a portfolio of interdependent applications, shared data, and local users in a geography where the organization has little or no existing Azure platform presence.

| Step | Outcome |
|---|---|
| Driver | Business expansion through acquisition. |
| Framework | Dimension 1 confirms the business need. Dimension 2 evaluates local data obligations. Dimension 3 maps portfolio-level dependencies, shared services, and connectivity requirements. |
| Qualification | Candidate while material dependencies remain unknown; qualified against defined portfolio requirements once sufficient discovery is complete. |
| Application Landing Zone archetype | **Interconnected Application Portfolios** |
| Connectivity profile | **Remote Hub Connected** where cross-region dependencies are acceptable; **Minimal Regional Hub** where aggregate east-west traffic, shared services, latency, or independence requirements justify local capability. |
| Placement | Workloads can remain in place initially and relocate selectively as business and integration requirements become known. |

**Takeaway:** Aggregate portfolio dependencies determine the appropriate regional connectivity profile; application count or acquisition status does not.

## Datacenter exit accelerates migration

A colocation contract is ending. Hybrid-connected applications must leave the datacenter, and the organization asks whether the event also requires adoption of another Azure region.

| Step | Outcome |
|---|---|
| Driver | Datacenter and connectivity event. |
| Framework | Dimension 3 identifies applications and components that must move together. Dimension 5 validates hybrid connectivity, datacenter and user geography, reachability, resiliency, and whether existing connectivity can support the target design. |
| Qualification | The existing target region can remain qualified for the identified workload requirements while an additional region remains a candidate for future use. |
| Application Landing Zone archetype | **Hybrid-Connected Applications** |
| Connectivity profile | Continue to use an existing strategic geographic hub where it satisfies requirements; do not create a new regional hub solely because another Azure region is available. |
| Placement | Most workloads can land in the existing qualified region where it satisfies their requirements. Revisit the additional regional option when requirements change. |

**Takeaway:** Remaining in an existing qualified region is a valid outcome. An additional region can remain an option rather than automatically becoming a deployment project.

## Next step

> [!div class="nextstepaction"]
> [Common misconceptions](./misconceptions.md)
