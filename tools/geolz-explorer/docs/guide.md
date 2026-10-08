# Geo Landing Zone Connectivity Explorer: reference guide

The detailed reference behind the [README](../README.md): the spec format, the editor, the rules and checks,
the keyboard and the files. Everything here describes this version; there is no import of older formats.

## Contents

- [The spec (format 1)](#the-spec-format-1)
- [Global entry](#global-entry)
- [Minimal hub capabilities](#minimal-hub-capabilities)
- [Virtual WAN](#virtual-wan)
- [Hybrid connectivity](#hybrid-connectivity)
- [Simulated failures](#simulated-failures)
- [Ingress](#ingress)
- [The editor](#the-editor)
- [Keyboard](#keyboard)
- [How the rules work](#how-the-rules-work)
- [Checks](#checks)
- [Add a product, a check or a path](#add-a-product-a-check-or-a-path)
- [Files](#files)
- [References](#references)

## The spec (format 1)

```json
{
  "format": 1,
  "title": "Geo Landing Zone Connectivity Explorer",
  "customer": "Contoso (fictional)",
  "global_entry": {
    "type": "front-door",
    "origins": [ { "region": "westeurope", "role": "active" }, { "region": "germanywestcentral", "role": "backup" } ]
  },
  "defaults": {
    "topology": "hub-spoke",
    "firewall": "azure-firewall", "ingress": "appgw-waf", "dns": "private-resolver",
    "dns_model": "centralized", "bastion": "bastion", "private_user_access": "entra-private-access"
  },
  "onprem": [
    { "id": "dc1", "name": "Primary DC", "interconnect": ["dc2"] },
    { "id": "dc2", "name": "Secondary DC" }
  ],
  "hybrid_connections": [
    { "id": "circuit-a", "type": "expressroute", "site": "dc1", "name": "Circuit A",
      "peering_location": "Amsterdam", "connection": "provider", "connects_to": ["westeurope"] },
    { "id": "dc1-vpn", "type": "vpn", "site": "dc1", "connects_to": ["westeurope"] }
  ],
  "regions": [
    { "id": "westeurope", "name": "West Europe", "pattern": "full-hub" },
    { "id": "swedencentral", "name": "Sweden Central", "pattern": "minimal-hub", "remote_hub": "westeurope",
      "capabilities": { "firewall": "local", "dns": "local" } }
  ],
  "region_links": [ { "from": "westeurope", "to": "swedencentral" } ]
}
```

| Object | Fields |
| --- | --- |
| spec | `format` (1), `title`, `customer`, `global_entry`, `defaults`, `vwans`, `onprem`, `hybrid_connections`, `regions`, `region_links` |
| global entry | `type` (`none`, `front-door`, `traffic-manager`, `third-party`), `origins` |
| global origin | `region`, `role` (`active` or `backup`; unset: active) |
| `defaults` | `topology` (`hub-spoke` or `vwan`), `routing_intent` (Virtual WAN), the role products (`firewall`, `ingress`, `dns`, `bastion`, `private_user_access`, …), `dns_model` (`centralized` / `distributed`), `hub_routing_preference` (Virtual WAN) |
| region | `id`, `name`, `pattern`, `remote_hub`, `capabilities` (minimal hub), `vwan`, `er_preferred`, and the overrides its pattern allows |
| site (`onprem`) | `id`, `name`, `interconnect` (other site ids) |
| connection | `id`, `type` (`expressroute`, `vpn`), `site`, `name`, `peering_location`, `connection` (`provider` or `direct`), `provider`, `connects_to` (hub region ids) |
| region link | `from`, `to`, `kind` (absent for a hub link), `reason` |
| virtual WAN | `id`, `name` |

- **Reading a spec** (`spec.js`): a spec needs `defaults` and `regions`. A `format` other than 1 is
  refused with *unknown format …: this explorer reads format 1*. Every field or value not listed above (an
  unknown product id, capability state or virtual WAN) is dropped and listed in Checks as *Not recognised,
  ignored: …*; a field that names a feature this explorer doesn't model says so, e.g. `"er_remote_vnets"` (*VNet-to-VNet traffic
  over ExpressRoute: not modelled in this explorer*). In hub-spoke, `hub_routing_preference` is dropped the
  same way (Route Server routing preference is not modelled). A connection of another type than ExpressRoute or
  VPN (for example `sdwan`) is dropped with a note, and so are a site's `primary` and `backup`: Azure's routing
  decides them.
- A region's `id` and `name` come from `js/data/catalog.js`. A region that isn't listed still loads; Checks warns.
- The order of `regions` is the diagram order (areas by first appearance, then spec order); the order of
  `onprem` breaks ties when sites are placed.
- A region can set the fields its pattern lists (`js/data/rules.js → patterns.<id>.fields`): full hub `firewall`,
  `ingress`, `dns`, `bastion`, `private_user_access`, `dns_model`; minimal hub adds `remote_hub` and
  `capabilities`; remote hub `remote_hub`, `ingress`, `bastion`, `private_user_access`, `dns_model`. A
  disconnected region sets its own spoke services (`spoke_roles`). An override the pattern doesn't allow is
  ignored, with a Checks warning.
- **Role resolution:** region override → local default (a full hub, or a minimal hub's *Local* capability) →
  the remote hub's product (a capability *From <remote hub>*) → none (*Not needed*). A *Local* capability with no
  product (no override, estate default none) resolves to none: the capability line says *(none configured)* and
  Checks warns.
- **DNS model** (`dns_model`) applies only where the region hosts its own DNS Private Resolver. Without a
  resolver the spokes use Azure-provided DNS (no model; the paths, notes and DNS context say so, for full hubs too).
  With the resolver in another region (a remote-hub region, or a minimal hub's DNS *From <remote hub>*) the model
  is centralized, because a forwarding ruleset can't be linked to a VNet in another region. In both cases the
  editor shows the reason instead of the dropdown, and an override that can't apply is removed (on import with a
  Checks note).
- **Gateways are derived:** a hub gets an ExpressRoute gateway when a circuit lists it and a VPN Gateway when a
  VPN does. Only a full hub, or a minimal hub whose *Hybrid gateway* is *Local*, can host one; other regions
  use their remote hub's.
- **Region links** connect regions that have a hub. In hub-spoke, peering is not transitive: a hub link is
  drawn through both hub firewalls (*Use Azure Firewall to route a multi hub and spoke topology*), so both hubs
  need a firewall. A remote-hub region's peering to its hub is implicit. Imported direct spoke peerings are
  dropped with a Checks warning because direct peering between spokes is not modelled.

## Global entry

`global_entry` is optional; absence is identical to `{ "type": "none", "origins": [] }`, so existing format-1
exports load without migration. Origins reference estate region ids and need a public regional ingress (WAF).

| Type | In the path | In the diagram |
| --- | --- | --- |
| `front-door` | Internet → Azure Front Door → the origin's regional ingress | Global services row, under Internet |
| `traffic-manager` | Internet → (DNS answer) → the origin's regional ingress, directly | Global services row, dotted DNS line |
| `third-party` | Internet → global LB/CDN → the origin's regional ingress | Users & internet band (not Azure) |

**Roles.** Every healthy *active* origin takes internet traffic; when none is left, every healthy *backup* does.
An active origin's path is drawn normally; a backup on standby is drawn faint with a *Standby* note. How a
service chooses between several active origins (Front Door priority, latency and weight; Traffic Manager routing
methods) is not modelled, and neither is Front Door Private Link to origins.
`routing_method`, `private_link`, `priority` and `weight` fields are dropped on import with a *not modelled*
note.

Only the internet ingress sub-path of an origin region is composed with global entry; the path keeps that
region's Application Gateway and firewall design. A region that is not an origin keeps its regional internet
ingress unchanged (with a note). **Fail origin** is offered on an origin that takes traffic when another origin
exists: traffic moves to the first remaining active origin, else the first backup (spec order). It is separate
from the hybrid failure state and resets when another region or path type is chosen.

Diagram: origins are tagged *Active origin* / *Backup origin* (*endpoint* for Traffic Manager) in their region
headers. Ownership boundaries are the bands (`layout.bands[].owner`: `internet`, `azure`, `network`,
`customer`); the Microsoft Azure band encloses the global services row, area strips and region columns; each
connectivity provider box is the provider's part (no provider band). Path crossings between owners are marked
with ticks; VPN hops are not marked. The diagram has no hover tooltips: a click on a component opens its details
or, with the editor open, its settings.

## Minimal hub capabilities

`regions[i].capabilities` maps each capability to `"local"`, `"remote"` (from the remote hub) or `"none"`
(not needed; for DNS the editor calls it *Azure-provided DNS*: no resolver, the spokes use 168.63.129.16).
Unset: the firewall is local; everything else comes from the remote hub, or is not needed when no `remote_hub`
is set (a `remote_hub` that is set but missing still counts as remote, and Checks reports it). `remote_hub` is
required only when at least one capability is `"remote"`. In hub-spoke, switching a region to Minimal hub gives it a
remote hub (the first full hub, if it has none) and adds the hub link to it. Changing the remote hub moves the link
(the link to the previous one is removed, the new one added); clearing the remote hub removes its link and leaves
it cleared. The status line names what changed, with Undo.

| Topology | Capabilities |
| --- | --- |
| Hub-spoke | `firewall`, `dns`, `hybrid` (on-premises), `ingress` (public ingress), `bastion`, `private_user_access` |
| Virtual WAN | `firewall` (secured hub; *Local* or *Not needed*), `hybrid` (ER / VPN gateways in the virtual hub), `shared` (a local shared services VNet) |

- The diagram and the editor show one line, e.g. *Local: firewall · From West Europe: DNS, Bastion · Not
  needed: on-premises*; a full hub shows *All capabilities local*.
- A path for a capability that is not needed says so, e.g. *No on-premises connectivity — not needed for this
  region's workloads*. With DNS not needed, Azure-provided DNS still answers.
- A connection may target a minimal hub only when its *Hybrid gateway* is *Local* (the same rule in both
  topologies). When it is, an info note suggests checking whether an existing ExpressRoute circuit can provide
  the reachability before adding a new one (pattern guidance).
- In Virtual WAN the minimal virtual hub holds the hub router and, if secured, its firewall; its remote hub
  must be a full hub in the same virtual WAN.

## Virtual WAN

With the topology *Virtual WAN* each hub is a virtual hub: a Microsoft-managed virtual network. Only Standard
virtual WANs are modelled.

- **Hub security** (`firewall` in Virtual WAN): `azure-firewall` (secured virtual hub, the default),
  `vhub-security` (third-party security in the hub) or `none`.
- **Routing intent** (`defaults.routing_intent`, on by default) sends private traffic through the hub
  firewalls, including between hubs; without it, inter-hub traffic is not inspected by the hub firewalls.
  Routing intent needs hub security in that hub (a check).
- **Shared services VNet:** DNS Private Resolver, Application Gateway, Azure Bastion and the private network
  connector sit in a VNet at the top of the region's spokes, not in the virtual hub.
- **Virtual WANs** (`vwans`): hubs of one virtual WAN are linked implicitly;
  hubs in different virtual WANs don't communicate (an info note and *No route* in the matrix).
- **Hub routing preference** (`hub_routing_preference`): `expressroute` (default), `vpn` or `aspath`.
  Notes name the default where it affects a path.

## Hybrid connectivity

- **ExpressRoute circuit** (`type: "expressroute"`): a `peering_location` from `js/data/catalog.js`, `connects_to`
  hubs. A location whose name ends in *Metro* makes it a Metro circuit; its two links run through the two
  locations of the metro area (*Amsterdam* and *Amsterdam2*). Optional `connection: "direct"` (ExpressRoute
  Direct: no provider box) and `provider` (a name; circuits naming the same provider share it).
- **Site-to-site VPN** (`type: "vpn"`) runs from the hub straight to the site over the internet.
- **Primary and backup links follow Azure's routing at each hub:** in hub-spoke, routes learned over ExpressRoute
  are preferred over VPN routes for the same prefix (the documented default; the Route Server routing preference is
  not modelled). In Virtual WAN the hub routing preference decides: ExpressRoute or VPN; with AS path the shortest
  AS path wins and, when equal, ExpressRoute (drawn so, with a note that on-premises prepending changes it). The
  site's other link type at that hub is the backup. A site doesn't choose its own primary (that would be the
  on-premises direction only, and could contradict Azure's): configure on-premises routing to match.
- **Preferred circuit** per hub (`er_preferred`). Without it, the explorer picks the first circuit whose
  peering location is in the hub region's country, else the first that lists the hub first, else the first in
  spec order; the others are its backup circuits. A hub whose other circuits come from a site that isn't
  interconnected with the preferred circuit's site gets an info note.
- **Datacenter interconnect** (`interconnect`): the sites whose networks a site reaches on-premises;
  a hub may then reroute that site's traffic over another site's circuit.
- **Traffic between virtual networks over ExpressRoute** (the gateway setting *Allow traffic from remote virtual
  networks*) is not modelled: east-west traffic uses hub links. An imported `er_remote_vnets` is dropped with a
  note.

## Simulated failures

On an on-premises path (also ingress from on-premises users; not on DNS queries, which ignore a simulated failure):

- **Fail primary** fails the first element of the path's failover chain, then reads **Fail next** and fails
  the next one; **Restore** resets. The side panel shows a breadcrumb, e.g. *Primary: Circuit A ✕ → Backup:
  Circuit B ✓ (via Secondary DC)*.
- **Other failure scenarios** (collapsed) lists only the elements on the current path: *Peering
  location down: Amsterdam (Standard circuit fails)*, *One Metro location down: Amsterdam2 (circuit stays up on
  the other link)*, *Whole Metro area down*, *Connectivity provider of Circuit A down*.
- Failed lines turn red and dotted, failed locations and providers are greyed and crossed.

## Ingress

Ingress is drawn **direct to the spoke**. Public internet ingress is Application Gateway WAF to the workload, in
parallel with the firewall; the firewall remains the path for inbound non-HTTP(S) traffic and for outbound traffic
through UDRs. Private user access is drawn as users → private network connector → workload, over the connector
subnet's default routes and VNet peering. The alternative designs (Application Gateway in front of the firewall,
and a UDR sending the connector-to-app hop through the hub firewall) are talking points and are listed under
*Not modelled*.

## The editor

- Tabs: **Estate** (title, customer, topology; in Virtual WAN the virtual WANs and routing intent; a collapsed
  *Default products and settings*), **Regions** (one collapsed section per region, by area), **Region links**
  (hub × hub grid, Connect all hubs) and **Hybrid** (sites, the site × hub
  connection grid with each hub's resulting resiliency, the connection fields with the Standard / Metro /
  Maximum comparison; hub settings).
- **Click to edit:** a click on a diagram item opens its settings in a *Selected item* panel on the right tab.
- **Checks** link to the setting they are about; inline badges sit next to the item.
- **Undo / Redo** keep the last 50 states in memory. **Changing a pattern** removes what the new pattern can't
  have, with a message and Undo.
- **Guided start** (*New… → Blank estate* or `?new=1`): 1 Estate (title, customer, topology), 2 first region,
  3 more regions, 4 on-premises, 5 done.

## Keyboard

| Key | Where | Does |
| --- | --- | --- |
| **O** | page | Overview (no path) |
| **←** / **→** | page | previous / next step of the path |
| **A** | page | show all steps |
| **C** / **D** / **L** | page | Compare / Details panel / Layers panel |
| **F** | page | presentation mode (again, or **Esc**, leaves it) |
| **T** | page | theme Auto → Light → Dark |
| **0** | page | fit the diagram |
| **Ctrl+Z** (**Cmd+Z**) | page and editor (not in a text field) | Undo |
| **Ctrl+Y**, **Shift+Ctrl+Z** | page and editor (not in a text field) | Redo |
| **Esc** | page | close Layers, else Compare, else presentation mode, else the selected item, else Overview |
| **Esc** | editor | clear the selected item |
| **←** / **→**, **Home** / **End** | editor tabs | previous / next / first / last tab |

## How the rules work

**Path templates** (`js/data/rules.js → patterns.<pattern>.paths`, Virtual WAN: `js/data/rules.js → vwanPaths`) are
arrays of step tokens:

| Token | Meaning |
| --- | --- |
| `spoke`, `spoke2`, `internet`, `users`, `admins` | Fixed diagram nodes. |
| `{firewall}`, `{dns}`, … | The region's product for that role (may come from its remote hub). |
| `{hybrid}` | The gateway for the site's primary link (or its backup during a simulated failure). |
| `edge`, `provider` | The peering location (the link in use) and the connectivity provider of that circuit. |
| `{remote_hub.firewall}` | The product in the region's remote hub. |
| `{host:<role>.firewall}` | The firewall of the hub that hosts `<role>` for the region. |
| `peering:remote_hub`, `peering:host:<role>` | A labelled cross-region hop (no diagram node). |
| `onprem` | The site at the other end of that connection. |
| `azure_dns`, `dns_zones`, `own_zones`, `ruleset`, `pe_ip` | DNS nodes and labelled DNS steps. |
| `token@note` | Adds a note to the step label. |
| `…?` | Optional: dropped silently when it does not resolve. |

A template without `steps` is a choice: `byRole`, sub-options (`subOptions`), `byHub` (Virtual WAN hub state)
or variants (`variantBy`, e.g. the DNS model). Cross-region templates live in
`js/data/rules.js → crossRegion` and `js/data/rules.js → vwanCross`; the *Not needed* texts in `js/data/rules.js → notNeeded`.

**Talking points** are data too (text and an optional `ref`). The side panel shows them collapsed, and only the
points marked `"key": true` (else the first three): keep 2–4 per path, the ones that carry its main design
message. The path's *Based on* list holds its own sources; there is no estate-wide reference list.

**Checks** are data:

```json
{ "id": "minimal-local-missing", "when": "pattern == 'minimal-hub' && local_missing != 'none'",
  "require": "local_missing == 'none'", "severity": "warning", "message": "{name}: {local_missing} set to Local, ..." }
```

The expression language is tiny: `field == 'x'`, `field != 'x'`, `field in ['a','b']`, joined with `&&`.
Unknown fields raise a visible error. `{field}` placeholders in messages are filled from the same facts:

| Checks | Facts |
| --- | --- |
| region (`checks`, `vwanChecks`) | `id`, `name`, `pattern`, `pattern_label`, `uses_remote`, `remote_hub`, `remote_hub_pattern`, `remote_hub_name`, `dns_state`, `hybrid_state`, `dns_model` (the model in use: `none` without a resolver), `local_missing`, `topology`, `known_region`, `has_links`, `linked_to_remote_hub`, `ignored_overrides`, `er_single`, `er_single_name`, `er_same_city`, `er_level`, `er_names`, `er_isolated`, `er_isolated_sites`, `er_preferred_site`, `vwan_hub`, `hub_security`, `routing_intent`, `vwan_name`, `vwan_minimal`, `fw_state`, `vwan_remote_issue` |
| link (`linkChecks`, `vwanLinkChecks`) | `name`, `kind`, `topology`, `implicit`, `ends_exist`, `ends_have_hubs`, `ends_connected`, `both_firewalls`, `without_firewall`, `shared_circuits`, `same_vwan`, `aspath_both` |
| connection (`hybridChecks`) | `name`, `type`, `site`, `site_exists`, `has_targets`, `peering_location`, `location_named`, `location_known`, `geo`, `cross_geo`, `no_hub_targets`, `minimal_targets` |
| estate (`estateChecks`) | `vwans_apart` |

Each result names the item it is about (`region:`, `hub:`, `link:`, `conn:`, `site:`), which the editor
badges and the Checks links use.

## Checks

The checks catch design mistakes; everything else is a talking point with its source.

| Design mistake | Check ids |
| --- | --- |
| A hub depends on a single standard circuit | `er-single-standard` (warning) |
| Only one circuit: no maximum resiliency | `er-no-maximum` (info) |
| Two circuits in the same metro area | `er-same-city` (warning) |
| Routing intent without hub security | `vwan-intent-no-security` (error) |
| ExpressRoute bow tie | `vwan-bowtie`, `vwan-bowtie-aspath` (Virtual WAN) |
| Invalid remote hub (missing, wrong pattern, other virtual WAN) | `remote-hub-target`, `minimal-needs-link`, `vwan-remote-full-hub` |
| A connection to a minimal hub without a local hybrid gateway | `hybrid-minimal-gateway` (error); `minimal-hybrid-local` (info, pattern guidance) |
| A connection to a region that can't host a gateway | `hybrid-no-gateway` (error) |
| A hub link without a firewall in both hubs (hub-spoke) | `link-firewalls` (error) |
| Different virtual WANs: no route | `vwan-apart` (info) |
| Disconnected-region rules | `disconnected-no-remote`, `disconnected-no-links` (errors) |
| Preferred circuit from a site that isn't interconnected | `er-not-interconnected` (info) |
| Unknown region or peering location | `unknown-region`, `er-location-known` (warnings) |

Also kept: a minimal virtual hub whose firewall is set to come from the remote hub (`vwan-minimal-firewall`), a minimal hub capability set to Local with no product configured (`minimal-local-missing`,
warning), a circuit in another geopolitical region (premium add-on, `er-cross-geo`), and the
consistency checks of the spec itself (`hybrid-site`, `hybrid-targets`, `link-ends`, `link-hubs-only`,
`override-ignored`).

## Add a product, a check or a path

- **Product:** add an entry to `js/data/catalog.js → products` with a `role`, `label`, `vendor`, a 2–4 letter
  `badge`, an optional `ref` (an id from `js/data/rules.js`) and one or two `points`. Microsoft products get a
  badge in their role's group colour; third-party ones a neutral badge and no vendor name.
- **Check:** append an object to the right list. If it needs a new fact, add one line to `regionFacts()` /
  `linkFacts()` (`engine.js`), `connectionFacts()` / `estateFacts()` (`topology.js`), `vwanFacts()`
  (`topology.js`) or `siteFacts()` (`hybrid.js`).
- **Path:** edit the step tokens, `note` and `ref` of the template.
- **Reference:** add `id: { tier, title, url }` to `js/data/rules.js` (`tier`: `aac` or `learn`; learn.microsoft.com
  URLs only).
- **Feature left out:** add it to `js/data/rules.js → notModelled` (shown in the app) and to the README.

## Files

Folder layout:

```text
index.html
README.md
css/
  styles.css
  diagram.css
js/
  theme.js
  data/
    rules.js
    catalog.js
    examples.js
  engine.js
  spec.js
  topology.js
  hybrid.js
  layout.js
  draw.js
  editor.js
  editor-actions.js
  panels.js
  app.js
docs/
  guide.md
```

| File | What it holds |
| --- | --- |
| `index.html` | Markup only: the CSP, the page structure, stylesheet links and `<script src>` tags. |
| `README.md` | User-facing overview, privacy notes, contribution rules and main references. |
| `css/styles.css` | Page, controls and editor styles, light and dark. |
| `css/diagram.css` | SVG diagram, link, node, path and feedback styles. |
| `docs/guide.md` | Detailed user and maintainer guide. |
| `js/theme.js` | Applies the theme before the first paint. |
| `js/data/rules.js` | All rule data: path types, patterns, templates, checks, talking points, references, Virtual WAN and global-entry rules. |
| `js/data/catalog.js` | Roles, products, minimal-hub capabilities, Azure regions and ExpressRoute peering locations. |
| `js/data/examples.js` | Built-in fictional example specs: Contoso and Fabrikam. |
| `js/engine.js` | Rule engine, global-entry path composition, DNS/admin/access summaries and matrix helpers. |
| `js/spec.js` | Spec format validation and spec edits without DOM. |
| `js/topology.js` | Hub-spoke and Virtual WAN topology, region links, hybrid attachments, east-west and ingress helpers. |
| `js/hybrid.js` | Primary/backup hybrid routing, preferred circuits, simulated failover and datacenter interconnect. |
| `js/layout.js` | Diagram geometry, hybrid/circuit layout and route segment helpers. |
| `js/draw.js` | SVG rendering for the diagram, path overlay and failure marks. |
| `js/editor.js` | Editor field helpers and the Estate, Regions, Region links and Hybrid tabs. |
| `js/editor-actions.js` | Editor shell/events, selected-item panel, Undo / Redo and the new-estate wizard. |
| `js/panels.js` | Layers, header/legend/path navigation, side panels, checks, references and Compare. |
| `js/app.js` | Local storage/import/export, app state, startup, render cycle and global events. |

Data files are JSON with a one-line `window.X = ` (or `Object.assign(window.RULES, ...)`) prefix, so they load
from `file://` with a `<script>` tag.
## References

- [Hub-spoke network topology in Azure](https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke) (Architecture Center)
- [Hub-spoke network topology with Azure Virtual WAN](https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke-virtual-wan-architecture) (Architecture Center)
- [Spoke-to-spoke networking](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/hybrid-networking/virtual-network-peering) (Architecture Center)
- [Azure Firewall and Application Gateway for virtual networks](https://learn.microsoft.com/en-us/azure/architecture/example-scenario/gateway/firewall-application-gateway) (Architecture Center)
- [Zero-trust network for web applications with Azure Firewall and Application Gateway](https://learn.microsoft.com/en-us/azure/architecture/example-scenario/gateway/application-gateway-before-azure-firewall) (Architecture Center)
- [Azure DNS Private Resolver architecture](https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/azure-dns-private-resolver) (Architecture Center)
- [Azure architecture icons](https://learn.microsoft.com/en-us/azure/architecture/icons/) (Architecture Center)
- [Private resolver architecture (centralized and distributed DNS)](https://learn.microsoft.com/en-us/azure/dns/private-resolver-architecture)
- [Use Azure Firewall to route a multi hub and spoke topology](https://learn.microsoft.com/en-us/azure/firewall/firewall-multi-hub-spoke)
- [What is Azure Firewall?](https://learn.microsoft.com/en-us/azure/firewall/overview)
- [Web Application Firewall on Azure Application Gateway](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/ag-overview)
- [What is Azure Front Door?](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview)
- [What is Azure ExpressRoute?](https://learn.microsoft.com/en-us/azure/expressroute/expressroute-introduction)
- [ExpressRoute connectivity providers and locations](https://learn.microsoft.com/en-us/azure/expressroute/expressroute-locations-providers)
- [Design and architect Azure ExpressRoute for resiliency](https://learn.microsoft.com/en-us/azure/expressroute/design-architecture-for-resiliency)
- [About ExpressRoute Metro](https://learn.microsoft.com/en-us/azure/expressroute/metro)
- [Link a virtual network to ExpressRoute circuits](https://learn.microsoft.com/en-us/azure/expressroute/expressroute-howto-linkvnet-portal-resource-manager)
- [Designing for disaster recovery with ExpressRoute private peering](https://learn.microsoft.com/en-us/azure/expressroute/designing-for-disaster-recovery-with-expressroute-privatepeering)
- [What is Azure VPN Gateway?](https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-about-vpngateways)
- [What is Azure DNS Private Resolver?](https://learn.microsoft.com/en-us/azure/dns/dns-private-resolver-overview)
- [What is Azure NAT Gateway?](https://learn.microsoft.com/en-us/azure/nat-gateway/nat-overview)
- [What is Azure Bastion?](https://learn.microsoft.com/en-us/azure/bastion/bastion-overview)
- [What is Azure Private Link?](https://learn.microsoft.com/en-us/azure/private-link/private-link-overview)
- [Virtual WAN hub routing intent and routing policies](https://learn.microsoft.com/en-us/azure/virtual-wan/how-to-routing-policies)
- [Learn about Microsoft Entra Private Access](https://learn.microsoft.com/en-us/entra/global-secure-access/concept-private-access)
- [Azure Private Endpoint private DNS zone values](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns)
- [Private Link and DNS integration at scale](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/private-link-and-dns-integration-at-scale)
- [List of Azure regions](https://learn.microsoft.com/en-us/azure/reliability/regions-list)
- [Configure ExpressRoute and site-to-site VPN coexisting connections](https://learn.microsoft.com/en-us/azure/expressroute/expressroute-howto-coexist-resource-manager)
- [Using site-to-site VPN as a backup for ExpressRoute private peering](https://learn.microsoft.com/en-us/azure/expressroute/use-s2s-vpn-as-backup-for-expressroute-privatepeering)
- [Virtual WAN virtual hub routing preference](https://learn.microsoft.com/en-us/azure/virtual-wan/about-virtual-hub-routing-preference)
- [About NVAs in a Virtual WAN hub](https://learn.microsoft.com/en-us/azure/virtual-wan/about-nva-hub)
- [Resolve Azure and on-premises domains (Azure DNS Private Resolver)](https://learn.microsoft.com/en-us/azure/dns/private-resolver-hybrid-dns)
- [Azure DNS Private Resolver endpoints and rulesets](https://learn.microsoft.com/en-us/azure/dns/private-resolver-endpoints-rulesets)
- [Tutorial: Set up DNS failover using private resolvers](https://learn.microsoft.com/en-us/azure/dns/tutorial-dns-private-resolver-failover)
- [What is Azure Private DNS?](https://learn.microsoft.com/en-us/azure/dns/private-dns-overview)
- [Azure Private Endpoint DNS integration scenarios](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns-integration)
- [What is IP address 168.63.129.16?](https://learn.microsoft.com/en-us/azure/virtual-network/what-is-ip-address-168-63-129-16)
- [Azure virtual network peering](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview)
- [Default outbound access in Azure](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/default-outbound-access)
- [Microsoft Entra private network connectors](https://learn.microsoft.com/en-us/entra/global-secure-access/concept-connectors)
- [Azure Bastion FAQ](https://learn.microsoft.com/en-us/azure/bastion/bastion-faq)
- [Just-in-time machine access (Microsoft Defender for Cloud)](https://learn.microsoft.com/en-us/azure/defender-for-cloud/just-in-time-access-overview)
- [Azure Firewall features by SKU](https://learn.microsoft.com/en-us/azure/firewall/features-by-sku)
- [Azure Firewall Manager policy overview](https://learn.microsoft.com/en-us/azure/firewall-manager/policy-overview)
- [Deploy highly available NVAs](https://learn.microsoft.com/en-us/azure/architecture/networking/guide/network-virtual-appliance-high-availability) (Architecture Center)
- [Secure traffic to Azure Front Door origins](https://learn.microsoft.com/en-us/azure/frontdoor/origin-security)
- [About active-active VPN gateways](https://learn.microsoft.com/en-us/azure/vpn-gateway/about-active-active-gateways)
- [Azure Virtual WAN FAQ](https://learn.microsoft.com/en-us/azure/virtual-wan/virtual-wan-faq)
- [About virtual hub routing (Azure Virtual WAN)](https://learn.microsoft.com/en-us/azure/virtual-wan/about-virtual-hub-routing)
- [Optimize traffic flow with Microsoft Entra application proxy](https://learn.microsoft.com/en-us/entra/identity/app-proxy/application-proxy-network-topology)
- [Azure virtual network traffic routing](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview)
- [What is a secured virtual hub?](https://learn.microsoft.com/en-us/azure/firewall-manager/secured-virtual-hub)
- [What is Azure Virtual WAN? (virtual WAN types, hub router)](https://learn.microsoft.com/en-us/azure/virtual-wan/virtual-wan-about)
- [Guide to Private Link and DNS in Azure Virtual WAN](https://learn.microsoft.com/en-us/azure/architecture/networking/guide/private-link-virtual-wan-dns-guide) (Architecture Center)
- [Virtual hub extension pattern](https://learn.microsoft.com/en-us/azure/architecture/networking/guide/private-link-virtual-wan-dns-virtual-hub-extension-pattern) (Architecture Center)
- [Route traffic to indirect spokes (Azure Virtual WAN)](https://learn.microsoft.com/en-us/azure/virtual-wan/indirect-spoke-architecture)
- [Use routing intent with static routes in Azure Virtual WAN](https://learn.microsoft.com/en-us/azure/virtual-wan/routing-intent-static-route)
- [Connectivity between virtual networks over Azure ExpressRoute](https://learn.microsoft.com/en-us/azure/expressroute/virtual-network-connectivity-guidance)
- [Configure a virtual network gateway for ExpressRoute (Azure portal)](https://learn.microsoft.com/en-us/azure/expressroute/expressroute-howto-add-gateway-portal-resource-manager)
- [About ExpressRoute Global Reach](https://learn.microsoft.com/en-us/azure/expressroute/expressroute-global-reach)

Product names are trademarks of their owners. Example companies are fictional.
