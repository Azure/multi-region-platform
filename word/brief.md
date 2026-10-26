
<!-- eyebrow: Executive summary -->
# Evolve landing zones from fixed regional footprints into a governed operating model
<!-- standfirst: Adding an Azure region shouldn't mean starting another landing-zone project. In a governed geographic operating model — for example, across Europe — regional placement becomes an adaptable, application-level decision instead of a permanent architectural dependency. -->

## Five moves

:::row:::
   :::column:::
      **01 Standardize governance**

      Policies, security controls, operational rigor, and compliance are the constants across the geography.
   :::column-end:::
   :::column:::
      **02 Decouple connectivity**

      Plan resilient hybrid connectivity to Azure geographically, not again for every region.
   :::column-end:::
   :::column:::
      **03 Tier the regional footprint**

      A small number of strategic geographic hubs carry the full stack; other regions use more efficient patterns.
   :::column-end:::
   :::column:::
      **04 Classify workloads by archetype**

      Four Workload Landing Zone archetypes describe what each workload needs from the platform.
   :::column-end:::
   :::column:::
      **05 Preserve regional optionality**

      Qualified regions stay available for the next workload when capacity, services, or regulation change.
   :::column-end:::
:::row-end:::

Adaptability becomes a **deliberate architectural property** rather than a reaction to the next country-level power, regulatory, or supply-chain constraint.

**Takeaway:** Standardize the operating model, not necessarily the regional footprint.

**Takeaway:** The goal is not to select the perfect two regions. **It is to make additional regions significantly easier to adopt when business and workload requirements justify them.**

<!-- eyebrow: 01 · Reframe the objective -->
# An operating model that keeps working as the environment changes
<!-- standfirst: The architecture should not depend on the regions we pick today staying the right answer. -->

Azure landing zones have usually been established in a particular region — often a primary and a disaster-recovery region — with a fairly complete set of networking, security, management, and shared services around them. That works well while the regions an organization wants to use stay relatively static.

The challenge now is different. Regulatory requirements and power availability can change across European countries, even as Microsoft continues to invest in and grow capacity across Europe. For regulated organizations, the question becomes how to **de-risk continued growth** in an industry-wide dynamic that keeps changing.

:::image type="content" source="./brief-media/fig1.png" alt-text="Diagram comparing a fixed primary and disaster-recovery region pair, where the full footprint is mirrored, with an adaptable platform in which six regions sit on one governed landing-zone foundation: two geographic hubs, a Minimal Hub, Remote Hub, No Hub, and a candidate region." lightbox="./brief-media/fig1.png":::

*From a fixed regional pair to governed regional options. Instead of mirroring a complete footprint in each new region, the platform extends one governed foundation and gives each region only the capability its workloads require. Regional capability is a spectrum, not a copy.*

<!-- eyebrow: 02 · From a region mindset to a geography mindset -->
# Define the landing zone by geography, not by region
<!-- standfirst: Broaden the architectural boundary. The individual regions underneath become adaptable deployment locations. -->

Rather than defining the cloud architecture around a small number of permanently designated Azure regions, define the overarching landing zone in geographic terms — for a European estate, a boundary such as the EU Data Boundary, governed by common security, operational, and compliance policies across multiple regions.

At that level, policies, security controls, operational rigor, and compliance requirements are the constants. The Azure regions underneath become qualified deployment options, and regional implementation adapts only where business, workload, or regulatory requirements call for it.

:::image type="content" source="./brief-media/xfGeo.png" alt-text="Diagram of a geographic landing zone, for example Europe, run as one governed operating model. A band lists the constants across the geography: policies, security controls, operational rigor, and compliance requirements. Below it, Regions A and B are geographic hubs with full networking, security, management, and shared services; Regions C, D, and E are qualified, with a Minimal Hub, spokes connected to a geographic hub, and self-contained AI workloads; Region F is a candidate that is assessed but not yet enabled." lightbox="./brief-media/xfGeo.png":::

*A geographic landing zone. The operating model is standardized across the geography; regions underneath are adaptable deployment locations with only the capabilities their workloads need. Region names and roles are illustrative.*

**Takeaway:** **Standardize the operating model,** not necessarily the regional footprint.

<!-- eyebrow: 03 · Decouple connectivity from individual regions -->
# Plan hybrid connectivity once, for the geography
<!-- standfirst: Instead of rebuilding the full networking stack every time another Azure region is adopted, treat connectivity as a geographic design. -->

Establish redundant connectivity into the Azure backbone through strategically located ExpressRoute or ExpressRoute Direct peering locations. That provides route diversity and lets connectivity be planned for the geography rather than independently for every region. **Enabling an additional Azure region does not by itself require another ExpressRoute circuit**; add circuits, peering locations, gateways, or paths only where reachability, diversity, failure-domain isolation, latency, bandwidth, routing, or resiliency requirements justify them.

:::image type="content" source="./brief-media/xfConn.png" alt-text="Diagram of hybrid connectivity planned once for a geography. Two on-premises datacenters connect over crossed, redundant circuits to two ExpressRoute peering locations, which reach the Azure backbone. The backbone serves a geography, for example Europe, where Regions A and B are geographic hubs with gateways, Region C is a Minimal Hub that reuses existing circuits, Region D reaches on-premises through a hub, Region E is self-contained with no hybrid path, and Region F is a candidate with no new circuit assumed." lightbox="./brief-media/xfConn.png":::

*Geographic hybrid connectivity. Diverse paths through strategically located peering locations reach the Azure backbone once; regions consume that foundation through their own hubs or a geographic hub. Reachability depends on circuit type — for example, Standard circuits reach regions in the same geopolitical region, Premium extends globally — so validate it per design. Locations and roles are illustrative.*

:::row:::
   :::column:::
      **Route diversity**

      Redundant circuits across separate peering locations remove single points of failure for the whole geography.
   :::column-end:::
   :::column:::
      **Decoupled from each region**

      Hybrid connectivity, hub placement, and application connectivity are separate decisions with separate tradeoffs.
   :::column-end:::
   :::column:::
      **Sustainable economics**

      A complete footprint in every additional region is expensive and hard to sustain; reuse what already meets the requirements.
   :::column-end:::
:::row-end:::

<!-- eyebrow: 04 · Tier the regional footprint -->
# Not every region needs a full landing zone
<!-- standfirst: A few geographic hubs carry the full stack; other regions use the most efficient pattern that meets their requirements. -->

With a geographic foundation in place, the full landing zone does not have to be copied into every Azure region. Maintain a **small number of strategic geographic hubs** — often two or three regions — with the full networking, security, management, and shared-service footprint.

Other regions are consumed through more efficient patterns appropriate to each workload, evaluated application by application. The four connectivity profiles are **not maturity stages**: adoption growth alone does not justify moving toward a Full Hub.

:::image type="content" source="./brief-media/fig14.png" alt-text="Spectrum of four profiles from no dependency on a geographic hub to greater local capability. No Hub has no hub or gateway; Remote Hub connects privately to a geographic hub; a Minimal Hub hosts selected shared services such as private DNS, a virtual network gateway, and Azure Monitor; a Full Hub adds comprehensive shared services including Azure Firewall." lightbox="./brief-media/fig14.png":::

*The spectrum of regional platform connectivity profiles. Moving right adds local capability and independence — and cost and operational scope. Services shown are examples; each hub includes only what its workloads require. Any profile can be the right long-term target.*

<!-- eyebrow: 04 · Tier the regional footprint -->
# Pay for local capability only where it is justified

:::image type="content" source="./brief-media/xfCost.png" alt-text="Curve with local capability and independence on the horizontal axis and fixed platform cost and operational scope on the vertical axis. The curve rises from No Hub at the low end through Remote Hub and a Minimal Hub to a Full Hub at the top right." lightbox="./brief-media/xfCost.png":::

*A qualitative trade-off, not a price list. More local capability usually raises fixed cost and operational scope, but can reduce cross-region dependency, latency exposure, and availability coupling.*

> There is no required progression between profiles. Select the **most efficient profile** for current requirements; different profiles coexist across the estate under the same landing-zone guardrails.

:::image type="content" source="./brief-media/fig15.png" alt-text="Illustrative estate: on-premises datacenters connect to two geographic hubs in regions A and B. Region C runs a Minimal Hub that reuses an existing ExpressRoute circuit, region D runs a Minimal Hub without an on-premises path, regions E and F use Remote Hub, region G uses No Hub, and region H is a candidate not yet enabled." lightbox="./brief-media/fig15.png":::

*An illustrative estate: two geographic hubs provide resilient hybrid connectivity; other regions consume what they need. Minimal Hubs take selected services from Region A (dashed) — Region C also reaches on-premises by reusing an existing ExpressRoute circuit, Region D does not. Both are valid. Names and placements are examples only.*

<!-- eyebrow: 05 · Classify workloads by archetype -->
# Four Workload Landing Zone archetypes
<!-- standfirst: Archetypes describe what applications require; connectivity profiles describe what the platform provides. The mapping is not one-to-one. -->

:::image type="content" source="./brief-media/xfArch.png" alt-text="Four Workload Landing Zone archetypes: Isolated cloud-native or AI applications, Connected cloud-native or AI applications, Hybrid-connected applications, and Interconnected application portfolios. Each card describes application dependencies, the typical deployment pattern, and typical connectivity profiles." lightbox="./brief-media/xfArch.png":::

The profile labels list typical connectivity profiles, most common first; actual dependencies and requirements decide.

**Takeaway:** Region-agnostic does not mean region-random.

## Governance moves up a level

Governance is not removed; it moves into policies that do not depend on particular regions. Instead of prescribing one regional architecture for every application, define a governed operating model and a small number of approved archetypes. Each application selects the **most efficient pattern** that satisfies its connectivity, resiliency, data, security, and service requirements.

<!-- eyebrow: The model as a city -->
# The platform is the city. Workloads are the people and businesses that live in it.
<!-- standfirst: A city builds its neighborhoods, services, roads, transit, and laws once. Neither a family nor a bank builds a second city. -->

:::image type="content" source="./brief-media/figCity.png" alt-text="Isometric city used as an analogy for a multi-region platform. An office campus outside the city connects to Downtown through express toll lanes with two interchanges. Downtown has every service locally. Riverside has a fire station and a clinic. Hillcrest and Midtown have homes only and reach Downtown's services by transit. Lakeside is an off-grid island with no roads or transit. A new plot is zoned but not yet built. Numbered pins mark where four families live, and bank badges mark two branches and a backup operations center. A legend beside the map explains each icon." lightbox="./brief-media/figCity.png":::

*The platform as a city. Each neighborhood is a region with its own connectivity profile. The legend explains each icon on the map.*

<!-- eyebrow: 06 · Qualify regions -->
# Regional qualification
<!-- standfirst: Which Azure regions should be prepared to support workload requirements — not whether an individual workload should use multiple regions. -->

Regions enter the model through a repeatable assessment, not by assumption. Four checks decide which Azure regions should be prepared for which workload requirements, and each option is recorded with evidence, owners, and revalidation triggers. What the platform then provides in a qualified region — its connectivity profile, where each shared service is provided, and its hybrid connectivity — is selected next, and is not a qualification check. Whether an individual workload uses multiple regions remains a workload-specific design decision.

:::image type="content" source="../content/media/regional-qualification-framework.png" alt-text="The full guidance regional qualification framework: business and geography, data and compliance, workload requirements and dependencies, and regional capability and availability. Each check has a question and decision; assessment outcomes are excluded, candidate, conditional, or qualified for defined requirements." lightbox="../content/media/regional-qualification-framework.png":::

*Four checks — the recommended sequence. Outcomes are specific to defined workload requirements, never a blanket certification; workload resiliency requirements are identified during workload design.*

<!-- eyebrow: 07 · Why this creates agility -->
# Region becomes a deployment parameter
<!-- standfirst: Geographic hubs remain deliberate choices. Workloads stop inheriting those choices automatically. -->

| Today | With this model |
|---|---|
| **Region as a permanent architectural dependency** | **Region as a deployment parameter** |
| Every workload inherits the same regional pair and its full platform footprint, whether or not its requirements need it. | Each workload selects from qualified regional options that fit its archetype and requirements, validated at decision time. |
| `region = "primary" // fixed for every workload` | `region = qualified_option(archetype, requirements)` |

:::image type="content" source="./brief-media/xfAgility.png" alt-text="Three circumstances can change: capacity is available somewhere else, a required service is stronger in another region, and the regulatory or energy environment changes. They lead to the outcome of more options for where the next workload can go, with Region A, Region B, Region C, Region E, and further qualified options listed." lightbox="./brief-media/xfAgility.png":::

*Regional optionality. Placement is revalidated at decision time for services, SKUs, AI models, regional access, and quota; capacity remains a deployment-time condition. Staying in the current region is always a valid outcome.*

> **Deliberate where it matters:** where the major geographic hubs live.

> **Adaptable where it helps:** which regions individual applications consume.

<!-- eyebrow: 08 · Agility in practice -->
# Four scenarios at a glance
<!-- standfirst: From a business or technical driver to a governed regional and workload decision. Illustrative, not customer-specific recommendations. -->

| Scenario | Qualification | Connectivity | Placement | Takeaway |
|---|---|---|---|---|
| **Regulated bank adopts a new in-country region.** A new in-country region opens while regulation requires certain data or services to remain there. | Qualified for defined Hybrid-Connected requirements; other workloads remain candidates. | Minimal Hub; existing hybrid connectivity reused where it permits. | In-scope workloads relocate selectively; others remain in place. | Qualify for defined requirements without forcing portfolio-wide relocation; if the new region is nonpaired, design the recovery path explicitly. |
| **AI team requires a specific model or GPU SKU.** The model, SKU, or service is unavailable — or quota-limited — in existing regions. | Qualified for the defined AI requirements; conditional where private connectivity is not yet designed. | No Hub where self-contained; connected only where dependencies justify it. | Net-new deployment, revalidated at decision time. | Do not introduce enterprise connectivity or regional platform capabilities before a workload requirement justifies them. |
| **Acquisition brings an estate in another geography.** Interdependent applications, shared data, and local users where there is little Azure presence. | Candidate until dependencies are understood; then qualified for defined portfolio requirements. | Remote Hub, or Minimal Hub where east-west traffic or independence justify it. | Remain in place initially; relocate selectively as integration proceeds. | Aggregate portfolio dependencies determine the profile; application count or acquisition status does not. |
| **Datacenter exit accelerates migration.** Hybrid-connected applications must leave a colocation facility; is another region now required? | Existing target region remains qualified; an additional region stays a candidate. | No new profile: the existing geographic hub is reused; no new hub solely because another region is available. | Most workloads land in the existing qualified region. | Remaining in an existing qualified region is a valid outcome; a new region can stay an option, not a project. |

<!-- eyebrow: 09 · The strategic benefit -->
# Architect so that perfect prediction is unnecessary
<!-- standfirst: No one can predict which European regions will offer the best combination of capacity, service availability, energy supply, and regulatory environment three to five years from now. Architect so that it does not need to be predicted perfectly. -->

That means separating what must stay consistent — governance, security, compliance, and the operating model — from what should stay adaptable: which regions individual applications consume.

> **For regulated organizations,** application-level, region-agnostic placement is a way to de-risk cloud growth if future power restrictions affect the industry's ability to keep expanding hyperscale capacity in a particular country.

:::image type="content" source="./brief-media/xfStrategy.png" alt-text="Four layers supporting adaptable regional placement: Workload Landing Zone archetypes, geographically resilient connectivity, a small number of strategic geographic hubs, and one governed operating model." lightbox="./brief-media/xfStrategy.png":::

:::row:::
   :::column:::
      **Workload Landing Zone archetypes**

      Applications select the most efficient pattern that meets their requirements.
   :::column-end:::
   :::column:::
      **Geographically resilient connectivity**

      Diverse peering locations into the Azure backbone, planned for the geography.
   :::column-end:::
   :::column:::
      **A small number of strategic geographic hubs**

      The full footprint lives where it is justified, not in every region.
   :::column-end:::
   :::column:::
      **One governed operating model**

      Landing-zone guardrails and operating standards stay stable across the estate.
   :::column-end:::
:::row-end:::

Together: an architecture that can evolve as Europe evolves.

**Takeaway:** The goal is not to select the perfect two regions. **It is to make additional regions significantly easier to adopt when business and workload requirements justify them.**
