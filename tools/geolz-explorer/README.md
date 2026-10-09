# Geo Landing Zone Connectivity Explorer

A small, offline, single-page tool for exploring how traffic flows through a multi-region Azure landing zone.
Each region picks one of four connectivity patterns: **full hub**, **minimal hub**, **remote hub** or
**disconnected**. The explorer draws the estate and walks through the ingress, egress, DNS, east-west and
on-premises paths of each region, with checks, talking points and Microsoft Learn sources.

> Not an official Microsoft product. Illustrative only: validate every design against current Azure
> documentation and your own requirements.

Version 1.0 (October 2026), the first stable version. Created by Ramona Lefter, Cloud Solution Architect.

## What it is

- **A diagram of the whole estate:** regions grouped by area, their hubs (or virtual hubs) and spokes, hub
  links, the ExpressRoute peering locations, connectivity providers and on-premises sites.
- **Paths you can step through:** pick a region and a path (Ingress, Egress, DNS, East-west, On-prem); the
  diagram highlights each hop and the side panel explains it, with a *source* link per statement.
- **Checks:** design mistakes (a hub that depends on a single standard circuit, a remote hub that can't serve,
  a hub link without a firewall at one end, routing intent without hub security, …) as errors, warnings and
  info notes, each linked to the setting it is about.
- **An editor:** change the estate in four tabs and see the diagram, paths and checks update on every change.
- **Two topologies:** hub-spoke (VNet peering) and Azure Virtual WAN (Standard).
- **Optional estate-wide global entry:** Azure Front Door, Azure Traffic Manager, or an unnamed third-party
  global load balancer/CDN, with regional origins and an origin-failover walkthrough.

The four connectivity patterns:

| Pattern | What the region has |
| --- | --- |
| **Full hub** | Its own hub with every shared service (firewall, DNS, hybrid gateways, ingress, Bastion, private access). |
| **Minimal hub** | Its own small hub. Each capability is *Local*, *From <remote hub>* or *Not needed*. |
| **Remote hub** | No hub: the spokes peer to another region's hub. |
| **Disconnected** | An isolated region: no hub, no links; anything it needs sits in its own spoke. |

A minimal hub's line reads, for example, *Local: firewall · From West Europe: DNS, Bastion · Not needed:
on-premises*; a path for a capability that is not needed says so (*No on-premises connectivity — not needed for
this region's workloads*). In Virtual WAN a minimal virtual hub has the built-in hub router and, if secured, its
firewall; *Hybrid gateway* and *Local shared services* can be made local, and its remote hub must be a full hub
in the same virtual WAN.

## How to open it

- **Locally:** open `index.html` in a browser (double-click works; `file://` is fine).
- **GitHub Pages:** push this folder to a repository and enable Pages.
- No build step, no libraries, no CDN: plain HTML, CSS and JavaScript.

Useful links: `?example=minimal-gsa` opens the Virtual WAN example, `?new=1` opens the guided start of a blank
estate, `?theme=light|dark|auto` forces a theme.

The multi-region platform site's Region planning workbook also embeds this tool below the Regional design
map, behind **Enable Advanced Networking Design Tool**. The embedded tool inherits current and selected new
regions, effective connectivity profiles, hub links, shared-service placements and named hybrid connections.
The **Workbook definitions** panel retains custom services and choices GeoLZ cannot model, with explicit limitations.
Workbook definition changes refresh the diagram. Tool-only refinements remain until such a change or
**Reset from workbook**; they never alter the workbook or the standalone tool's autosave. Use JSON Export
to keep refinements. The workbook's print output includes the full current networking
diagram in a light theme, preserving selected paths and visible layers but ignoring zoom and pan.
In the workbook, the website navigation collapses, Editor and Details share one side panel (overlaying the
diagram on narrow screens), and the theme follows the website without a separate switch. **Present** or **F**
opens a separate live presentation window for the current design; **Esc** closes it. The standalone tool's
theme and in-page presentation controls are unchanged.
Folder layout:

```text
index.html
README.md
css/          stylesheets
js/           app code
js/data/      rules, catalogues, locations and examples
docs/         detailed guide
```

## A quick tour

1. The page opens in **Overview** (the whole estate, no path). The side panel summarises the selected region.
2. Pick a **region** tab and a **path**. Use **←/→** to step through it, **A** to show all steps, **O** to go back
   to Overview.
3. On an on-premises path, **Fail primary** fails the first element of the path's failover chain. It then reads
   **Fail next** and steps down the chain (for the Contoso example: Circuit A → Circuit B via the interconnect →
   VPN → no route); **Restore** resets. The side panel shows a breadcrumb such as *Primary: Circuit A ✕ →
   Backup: Circuit B ✓ (via Secondary DC)*.
4. **Compare** (**C**) lists every path per region and an east-west connectivity matrix.
5. **Editor** opens the four tabs: **Estate** (title, customer, topology, virtual WANs and routing intent,
   default products and settings), **Regions**, **Region links** and **Hybrid** (sites, the site × hub
   connection grid, each hub's resulting ExpressRoute resiliency). A click on a diagram item opens its
   settings.
6. **Layers** (**L**) hides background layers; **Present** (**F**) gives a full-screen view; **Theme** (**T**)
   cycles Auto → Light → Dark.

## Global entry and ownership boundaries

The Estate tab can put one service in front of the internet ingress of chosen **origin** regions: **Azure Front
Door** (a content delivery network on Microsoft's edge: clients connect to it, and it forwards each request to an
origin), **Azure Traffic Manager** (DNS only: the client then connects to the
region directly) or an unnamed **third-party global load balancer/CDN** (confirm its behaviour with the vendor).
Each origin is **Active** (takes internet traffic) or **Backup** (takes it only when every active origin is
unavailable). The path continues through the origin region's own Application Gateway/firewall design; a region
that is not an origin keeps its own regional ingress. On an active origin, **Fail origin** shows which region
takes over; **Restore** resets it. A backup on standby is drawn faint. How a service chooses between several
active origins, and Front Door Private Link, are not modelled (see *Not modelled*).

The bands are the ownership boundaries: **Users & internet** (outside), **Microsoft Azure** (global services and
every region), **Microsoft global network** (backbone lanes, with the ExpressRoute peering locations at its edge)
and **Customer on-premises**; each **connectivity provider** box is the provider's part between the peering
location and the site. On a selected path a short tick marks each crossing; VPN hops run
over the internet and get none. The ticks describe traffic, not who manages what.

The full keyboard list, the spec format and the rules are in [docs/guide.md](docs/guide.md).

## Focused legend

All settings and failure controls are available. The legend stays focused: it lists only the region patterns and
line styles used by the current diagram, plus all path colours.

## ExpressRoute resiliency at a glance

| Level | What it is | What fails it |
| --- | --- | --- |
| **Standard** | One circuit, both links at one peering location. | An outage of that location. |
| **Metro (high)** | One circuit, its two links at two peering locations of one metro area (e.g. Amsterdam and Amsterdam2). | An outage of the whole metro area. |
| **Maximum** | Two circuits at two different peering locations. | Both locations down. |

The diagram draws a Metro circuit's two links separately (*Metro · link 1 of 2*, *link 2 of 2*, grouped under
*Amsterdam Metro*) and a standard circuit's links through one location (*Standard · 2 links, 1 location*). A hub
at maximum resiliency carries a *Maximum resiliency* tag. Wording and suitability notes come from *Link a
virtual network to ExpressRoute circuits* and *About ExpressRoute Metro* on Microsoft Learn.

## Not modelled in this explorer

These are deliberately left out; a spec field or path that touches one says *not modelled*. The same list is in
the app (side panel, *Not modelled in this explorer*).

- **SD-WAN connections and Azure Route Server**: on-premises sites connect over ExpressRoute or site-to-site VPN.
  Hub-spoke hubs show the default routing behaviour (ExpressRoute preferred); the Virtual WAN hub routing
  preference is modelled.
- **On-premises transit through Azure**: site to site through a hub (Azure Route Server branch-to-branch in
  hub-spoke, or Virtual WAN branch-to-branch).
- **Basic virtual WANs**: every virtual WAN is Standard.
- **A primary link chosen per site**: Azure's routing decides it at each hub (ExpressRoute; in Virtual WAN the hub
  routing preference) and the other link is the backup. Configure the on-premises routers to match, or the
  traffic is asymmetric.
- **Traffic between virtual networks over ExpressRoute** (the gateway setting *Allow traffic from remote virtual
  networks*): east-west traffic uses hub links. It is off by default and Microsoft recommends virtual network
  peering instead.
- **Application Gateway in front of the firewall, and the private network connector's route through the firewall**:
  ingress is drawn direct to the spoke; talking points cover both designs.
- **Direct peering between spokes** (in the same region or across regions): east-west traffic goes through the
  hubs. A talking point covers direct peering: it bypasses the hub firewalls.
- **How a global entry service chooses between several active origins** (Front Door priority, latency and
  weight; Traffic Manager routing methods): origins are shown as active or backup.
- **Azure Front Door Private Link to origins**: not drawn.
- **Front Door WAF policy, caching, rules engine, domains, certificates and session affinity.**

## Your data stays in this browser

- The current spec is auto-saved about half a second after each change in this browser's `localStorage`
  (key `geolz-explorer.spec.v1`), for this page's location only. Nothing is sent anywhere.
- On load, `?example=<id>` wins; otherwise a saved session is restored (*Restored your last session · saved
  HH:MM*); otherwise the Contoso example opens. A saved session from another version is removed with a message.
- The theme (`geolz-explorer.theme`) and hidden layers (`geolz-explorer.layers`) have their own keys and are
  never part of the spec or an export.
- **Clear saved data** removes the spec, theme, layers and the old mode key (`geolz-explorer.mode`), then
  loads the default example.
- If storage is unavailable (private mode, some `file://` setups) the page keeps working and says *Not saved:
  browser storage unavailable — use Export*.
- **Export** saves the spec as JSON (the browser's save dialog where available, else a download); **Import**
  reads one back. Use them to move between machines or browsers.
- Imports are checked: the spec format is `"format": 1`; another format is refused with a clear message, and
  any field or value the explorer doesn't recognise is dropped with a warning in Checks that lists each one (no
  silent drops).

## Privacy & network

- The page makes **no network requests**: no fetch, XHR, WebSocket or beacon, no external scripts, styles,
  fonts or images. The only outbound traffic is a learn.microsoft.com reference link that **you** click (new
  tab, `rel="noopener noreferrer"`, no referrer).
- A Content Security Policy in `index.html` enforces this: `default-src 'none'; script-src 'self'; style-src
  'self'; img-src 'self' data:; connect-src 'none'; font-src 'none'; object-src 'none'; frame-src 'none';
  base-uri 'none'; form-action 'none'`. There is no inline script or style, so `'unsafe-inline'` is not needed.
- Opening `index.html` from disk works with this policy in Chromium-based browsers. If another browser blocks
  local scripts from disk, serve the folder over HTTP (GitHub Pages or any static server) rather than loosening
  the policy.

## Contribute

- Data lives in `js/data/rules.js` (paths, checks, notes, talking points and references),
  `js/data/catalog.js` (roles, products, Azure regions and ExpressRoute peering locations) and
  `js/data/examples.js` (fictional examples). Code reads them; it holds no product or rule text.
- Every technical statement cites the Microsoft Learn or Azure Architecture Center page that supports it. Where
  a page doesn't settle a point, the text says *confirm …*. Statements about the four connectivity patterns
  themselves are the explorer's own design vocabulary and carry no public reference.
- Simplify by omission, never by approximation: leave a feature out (and add it to *Not modelled*) rather than
  drawing it roughly.
- Keep the code readable: one concern per file, at most about 1000 lines, section comments, and lines up to
  120 characters. Page/editor styles are in `css/styles.css`; SVG diagram styles are in `css/diagram.css`.
  No libraries, build step, network requests, or inline script/style.
- Links go to learn.microsoft.com only; examples use fictional companies; no vendor names.
- How to add a product, a check or a path template: see [docs/guide.md](docs/guide.md).

## Credits

Product behaviour, routing, DNS and hybrid connectivity statements rest on public Azure Architecture Center and
Microsoft Learn pages; each names its page (each path's *Based on* list and the *source* links of talking points
and checks). The main ones:

- [Hub-spoke network topology in Azure](https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke)
- [Hub-spoke network topology with Azure Virtual WAN](https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke-virtual-wan-architecture)
- [Use Azure Firewall to route a multi hub and spoke topology](https://learn.microsoft.com/en-us/azure/firewall/firewall-multi-hub-spoke)
- [Private resolver architecture](https://learn.microsoft.com/en-us/azure/dns/private-resolver-architecture)
- [ExpressRoute connectivity providers and locations](https://learn.microsoft.com/en-us/azure/expressroute/expressroute-locations-providers)
- [About ExpressRoute Metro](https://learn.microsoft.com/en-us/azure/expressroute/metro)
- [Link a virtual network to ExpressRoute circuits](https://learn.microsoft.com/en-us/azure/expressroute/expressroute-howto-linkvnet-portal-resource-manager)
- [Designing for disaster recovery with ExpressRoute private peering](https://learn.microsoft.com/en-us/azure/expressroute/designing-for-disaster-recovery-with-expressroute-privatepeering)
- [Virtual WAN virtual hub routing preference](https://learn.microsoft.com/en-us/azure/virtual-wan/about-virtual-hub-routing-preference)
- [How to configure Virtual WAN hub routing intent and routing policies](https://learn.microsoft.com/en-us/azure/virtual-wan/how-to-routing-policies)
- [List of Azure regions](https://learn.microsoft.com/en-us/azure/reliability/regions-list)

The full list is in [docs/guide.md](docs/guide.md). Product names are
trademarks of their owners. Example companies (Contoso, Fabrikam) are fictional.
