/* rules.js: all rule data: core path rules, hybrid and global-entry data, references and Virtual WAN rules. */
window.RULES = /* rules.js: pattern rules as data. Everything below this line is plain JSON. */ {
  "pathTypes": {
    "ingress":   { "label": "Ingress",    "color": "#F7630C", "dash": "12 4", "subBy": "ingress_from",
                   "subOptions": { "internet": "From internet", "users": "From users (private access)",
                                   "admin": "Admin access (Bastion)", "onprem": "From on-premises users" },
                   "subNeeds": {
                     "internet": { "role": "ingress", "why": "No public ingress (WAF) for this region: none in its hub, remote hub or spoke." },
                     "users": { "role": "private_user_access", "why": "No private network connector for this region: none in its hub, remote hub or spoke." },
                     "admin": { "role": "bastion", "why": "No Azure Bastion for this region: none in its hub, remote hub or spoke." },
                     "onprem": { "role": "hybrid", "why": "No hybrid connection reaches this region's hub or its remote hub." } } },
    "egress":    { "label": "Egress",     "color": "#D13438", "dash": "8 3 2 3" },
    "dns":       { "label": "DNS",        "color": "#107C10", "dash": "1 7", "variantBy": "dns_model", "subBy": "dns_query",
                   "subOptions": { "azure": "Azure names", "onprem": "On-prem names", "inbound": "On-prem → Azure" } },
    "east_west": { "label": "East-west",  "color": "#038387", "dash": "16 4 4 8" },
    "onprem":    { "label": "On-prem",    "color": "#5C2D91", "dash": "4 4" }
  },
  "notNeeded": {
    "text": "No {what} — not needed for this region's workloads.",
    "what": { "hybrid": "on-premises connectivity", "dns": "DNS resolver", "shared": "shared services" },
    "as": { "dns": "Azure-provided DNS" },
    "texts": { "dns": "No DNS resolver: this region uses Azure-provided DNS (168.63.129.16), so there is no resolver to forward on-premises names or to receive queries from on-premises." },
    "dns": { "steps": ["spoke@VM, Azure-provided DNS", "azure_dns", "dns_zones"], "note": "No DNS resolver: the spokes use Azure-provided DNS (168.63.129.16), and private endpoint names resolve where the private DNS zones are linked to the spoke VNets.", "ref": "learn-resolver-arch" }
  },
  "dnsModelFixed": {
    "none": "No DNS Private Resolver for this region: its spokes use Azure-provided DNS (168.63.129.16), so no DNS model applies.",
    "remote": "Centralized: the resolver is in {hub}, and a DNS forwarding ruleset can't be linked to a VNet in another region."
  },
  "topologies": {
    "hub-spoke": {
      "label": "Hub-spoke (VNet peering)", "hub": "Hub VNet", "cross": "Global VNet peering", "connection": "Global VNet peering", "ref": "aac-hub-spoke",
      "notes": {}
    },
    "vwan": {
      "label": "Virtual WAN", "hub": "Virtual hub", "cross": "Virtual WAN hub-to-hub", "connection": "VNet connection", "ref": "aac-vwan"
    }
  },
  "patterns": {
    "full-hub": {
      "label": "Full hub", "hub": "full", "vwanPaths": true,
      "color": "#2F6FB3", "tint": "#E9F1FA", "dark": { "color": "#6FA8E0", "tint": "#1C2A3A" },
      "description": "All shared connectivity services run in the region's own hub.",
      "vwanDescription": "The region's own virtual hub (virtual hub router, firewall, the gateways of its hybrid connections) and its shared services VNet run all shared connectivity services.",
      "fields": ["firewall", "ingress", "dns", "bastion", "private_user_access", "dns_model"],
      "links": ["hub"],
      "paths": {
        "ingress": {
          "internet": "ingress-internet",
          "users": "ingress-users", "admin": "ingress-admin", "onprem": "ingress-onprem"
        },
        "egress": { "steps": ["spoke", "{firewall}", "internet"], "note": "A default route sends spoke traffic to the hub firewall, which filters it and translates it to its public IPs.", "ref": "aac-hub-spoke" },
        "dns": {
          "centralized": {
            "azure": { "steps": ["spoke@VM", "{dns}@inbound endpoint", "azure_dns", "dns_zones"], "note": "The spoke VNets use the resolver's inbound endpoint as custom DNS. The resolver forwards to Azure-provided DNS (168.63.129.16), which answers from the private DNS zones linked to the hub VNet: privatelink.blob.core.windows.net, for example, returns the private endpoint's IP.", "ref": "caf-private-link-dns" },
            "onprem": { "steps": ["spoke@VM", "{dns}@inbound to outbound endpoint", "ruleset", "{hybrid}?", "edge?", "provider?", "onprem@DNS servers"], "note": "A query for an on-premises domain matches a rule in the forwarding ruleset linked to the hub VNet and leaves through the outbound endpoint to the on-premises DNS servers, over the hybrid connection.", "ref": "learn-resolver-hybrid-dns" },
            "inbound": { "steps": ["onprem@DNS server, conditional forwarder", "provider?", "edge?", "{hybrid}", "{dns}@inbound endpoint", "azure_dns", "dns_zones"], "note": "On-premises DNS servers conditionally forward the Azure service zones (for example blob.core.windows.net) to the resolver's inbound endpoint over the hybrid connection; Azure-provided DNS answers from the linked private DNS zones.", "ref": "aac-dns-resolver" }
          },
          "distributed": {
            "azure": { "steps": ["spoke@VM, Azure-provided DNS", "azure_dns", "dns_zones"], "note": "Spokes keep Azure-provided DNS (168.63.129.16). Private endpoint names resolve if the private DNS zones are linked to each spoke VNet, or if the spoke's linked ruleset forwards those zones to the hub's inbound endpoint.", "ref": "learn-resolver-arch" },
            "onprem": { "steps": ["spoke@VM, Azure-provided DNS", "ruleset@linked to the spoke VNet", "{dns}@outbound endpoint", "{hybrid}?", "edge?", "provider?", "onprem@DNS servers"], "note": "A forwarding ruleset linked to the spoke VNet sends on-premises domains to the resolver's outbound endpoint, then over the hybrid connection to the on-premises DNS servers.", "ref": "learn-resolver-rulesets" },
            "inbound": { "steps": ["onprem@DNS server, conditional forwarder", "provider?", "edge?", "{hybrid}", "{dns}@inbound endpoint", "azure_dns", "dns_zones"], "note": "Inbound resolution is the same in both models: on-premises forwards to the inbound endpoint, Azure-provided DNS answers from the linked zones.", "ref": "learn-resolver-rulesets" }
          }
        },
        "east_west": { "byRole": ["firewall"],
          "firewall": { "steps": ["spoke", "peering:to:host:firewall?", "{firewall}", "peering:host:firewall?", "spoke2"], "note": "Spoke-to-spoke traffic is sent to the hub firewall by the spokes' route tables (peering is not transitive), so it is inspected.", "ref": "learn-fw-multi-hub",
            "awayNote": "This minimal hub has no local firewall: traffic between its spokes goes to the remote hub's firewall and back over global peering. Expect extra peering hops (added cost) and higher latency than regional peering; validate them, or set Firewall to Local to keep it in the region.", "awayRef": "aac-spoke-to-spoke" },
          "*": { "steps": [], "note": "No route: there is no firewall in this hub to carry spoke-to-spoke traffic (peering is not transitive). Set a firewall for the hub.", "ref": "aac-hub-spoke" }
        },
        "onprem": { "byRole": ["firewall"],
          "firewall": { "steps": ["spoke", "peering:to:host:firewall?", "{firewall}", "{hybrid}", "edge?", "provider?", "onprem"], "note": "Hybrid traffic is inspected by the hub firewall in both directions: GatewaySubnet routes send spoke prefixes to the firewall, and spoke route tables don't learn on-premises routes.", "ref": "learn-fw-multi-hub",
            "awayNote": "This minimal hub has no local firewall: hybrid traffic is inspected by the remote hub's firewall over global peering. Validate the added latency and peering charges.", "awayRef": "aac-spoke-to-spoke" },
          "*": { "steps": ["spoke", "{hybrid}", "edge?", "provider?", "onprem"], "note": "No firewall in this hub: spokes reach on-premises through the gateway without inspection. Set a firewall for the hub so hybrid traffic is inspected.", "ref": "learn-fw-multi-hub" }
        }
      },
      "talking_points": [
        "Inspection, hybrid gateway, DNS and ingress are all local, so the region keeps working if another region is lost.",
        "Highest run cost and operational surface of the four patterns.",
        "Full hubs need not be identical: products and SKUs can differ per region."
      ],
      "vwan_talking_points": [
        { "key": true, "text": "A full virtual hub has the built-in virtual hub router, a firewall (secured hub, the default), the gateways of its hybrid connections and a shared services VNet in the region." }
      ],
      "refs": ["aac-hub-spoke"]
    },
    "minimal-hub": {
      "label": "Minimal hub", "hub": "partial", "vwanPaths": true,
      "color": "#6B6FA8", "tint": "#EFEFF7", "dark": { "color": "#A3A7D6", "tint": "#25263A" },
      "description": "A small local hub: each capability is local, taken from a remote hub, or not needed.",
      "vwanDescription": "A virtual hub with the built-in virtual hub router and, if secured, a firewall; on-premises connectivity and shared services are local, come from a full virtual hub in the same virtual WAN (its remote hub) over hub-to-hub, or are not needed.",
      "fields": ["remote_hub", "capabilities", "firewall", "ingress", "dns", "bastion", "private_user_access", "dns_model"],
      "links": ["hub"],
      "sameAs": "full-hub",
      "talking_points": [
        "Hosts only the capabilities set to Local; the ones set to From the remote hub are borrowed, the ones not needed are left out.",
        "Local capabilities keep working if the remote hub's region is down; borrowed ones do not.",
        { "text": "Borrowed capabilities are reached over global peering: consider the added latency (regional peering is lowest) and peering data transfer charges.", "ref": "learn-vnet-peering" }
      ],
      "vwan_talking_points": [
        { "key": true, "text": "A minimal virtual hub has the built-in virtual hub router and, if secured, its own firewall; a hybrid gateway and a shared services VNet only where they are set to Local." }
      ],
      "refs": ["aac-hub-spoke"]
    },
    "remote-hub": {
      "label": "Remote hub", "hub": "none", "vwanPaths": true,
      "color": "#9C7A45", "tint": "#F7F1E6", "dark": { "color": "#CDAE7C", "tint": "#2E2920" },
      "description": "No local hub: spokes connect to a hub in another region.",
      "vwanDescription": "No local virtual hub: spokes connect to a virtual hub in another region (VNet connections).",
      "fields": ["remote_hub", "ingress", "bastion", "private_user_access", "dns_model"],
      "links": [],
      "paths": {
        "ingress": {
          "internet": "ingress-internet",
          "users": "ingress-users", "admin": "ingress-admin", "onprem": "ingress-onprem"
        },
        "egress": { "steps": ["spoke", "peering:remote_hub", "{remote_hub.firewall}", "internet"], "note": "The default route points to the remote hub firewall over global peering: consider the added latency and peering data transfer charges.", "ref": "aac-hub-spoke" },
        "dns": {
          "centralized": {
            "azure": { "steps": ["spoke@VM", "peering:remote_hub", "{remote_hub.dns}@inbound endpoint", "azure_dns", "dns_zones"], "note": "The spoke VNets use the remote hub's inbound endpoint as custom DNS. A forwarding ruleset can't be linked to a VNet in another region, so the distributed model isn't available here.", "ref": "learn-resolver-rulesets" },
            "onprem": { "steps": ["spoke@VM", "peering:remote_hub", "{remote_hub.dns}@inbound to outbound endpoint", "ruleset", "{remote_hub.hybrid}?", "edge?", "provider?", "onprem@DNS servers"], "note": "On-premises names are resolved by the remote hub's resolver: its ruleset sends them through the outbound endpoint and the remote hub's hybrid connection.", "ref": "learn-resolver-arch" },
            "inbound": { "steps": ["onprem@DNS server, conditional forwarder", "provider?", "edge?", "{remote_hub.hybrid}", "{remote_hub.dns}@inbound endpoint", "azure_dns", "dns_zones"], "note": "On-premises queries land on the remote hub's resolver. Private DNS zones are global resources, so if the zones holding this region's private endpoint records are linked to the remote hub VNet, those records are answered there too.", "ref": "learn-private-dns-overview" }
          }
        },
        "east_west": { "steps": ["spoke", "peering:remote_hub", "{remote_hub.firewall}", "peering:host:firewall?", "spoke2"], "note": "Traffic between two local spokes is inspected by the remote hub's firewall, so it crosses regions and back over global peering: validate the added latency and peering charges.", "ref": "aac-spoke-to-spoke" },
        "onprem": { "steps": ["spoke", "peering:remote_hub", "{remote_hub.firewall}", "{remote_hub.hybrid}", "edge?", "provider?", "onprem"], "note": "Hybrid traffic is inspected by the remote hub's firewall and uses its gateway.", "ref": "learn-vnet-peering" }
      },
      "talking_points": [
        { "text": "No hub in the region: spokes peer to a hub in another region for inspection, hybrid access and DNS.", "ref": "learn-vnet-peering" },
        "Smallest platform footprint and quickest to stand up; availability follows the remote hub's region.",
        "Traffic between local spokes hairpins to the remote hub's firewall; if that latency matters, use a minimal hub with a local firewall."
      ],
      "vwan_talking_points": [
        { "key": true, "text": "No virtual hub in the region: spokes connect to a virtual hub in another region (VNet connections) for inspection, hybrid access and shared services." }
      ],
      "refs": ["aac-hub-spoke", "aac-spoke-to-spoke"]
    },
    "disconnected": {
      "label": "Disconnected", "hub": "none", "dashed": true, "spokeExtras": ["own_zones"],
      "color": "#7A7774", "tint": "#F3F2F1", "dark": { "color": "#A19F9D", "tint": "#2A2928" },
      "description": "No hub, no gateway, no peering: the region's spoke holds whatever services its workload needs.",
      "fields": [], "links": [],
      "spoke_roles": ["ingress", "bastion", "egress_nat", "firewall", "dns", "private_user_access"],
      "editor_notes": ["Estate defaults don't apply to an isolated region: pick each service for its own spoke.",
                       "DNS: Azure-provided DNS · own private zones"],
      "paths": {
        "ingress": {
          "internet": "ingress-internet-disconnected",
          "users": "ingress-users", "admin": "ingress-admin", "onprem": "ingress-onprem"
        },
        "egress": { "byRole": ["firewall", "egress_nat"],
          "firewall": { "steps": ["spoke", "{firewall}", "internet"], "note": "The spoke's own firewall filters outbound traffic and translates it to its public IPs. The workload team runs it: there is no central firewall.", "ref": "aac-fw-appgw" },
          "egress_nat": { "steps": ["spoke", "{egress_nat}", "internet"], "note": "Spoke-local NAT Gateway: scalable outbound SNAT with static public IPs. For FQDN-based egress filtering, use a firewall (NSGs filter only at layers 3 and 4).", "ref": "learn-nat-gateway" },
          "*": { "steps": [], "note": "No firewall or NAT Gateway in this spoke: VMs in private subnets (the default for new virtual networks) can't reach the internet, and older subnets fall back to default outbound access, which Microsoft recommends replacing. Give the spoke an explicit outbound path: a NAT Gateway or a firewall.", "ref": "learn-default-outbound" }
        },
        "dns": { "*": {
          "azure": { "steps": ["spoke@VM", "{dns}?@inbound endpoint, in the spoke", "azure_dns", "own_zones", "pe_ip"], "note": "The spoke uses Azure-provided DNS (168.63.129.16), or its own DNS Private Resolver if one is deployed in the spoke. The answer comes from the region's own private DNS zones, linked to its spoke VNets: the private endpoint's IP. The shared central zones aren't linked to this region's VNets in this design, so their records don't resolve here.", "ref": "learn-pe-dns-integration" },
          "onprem": { "steps": [], "note": "No route by design: without a hybrid connection the on-premises DNS servers can't be reached, so on-premises names don't resolve.", "ref": "learn-private-resolver" },
          "inbound": { "steps": [], "note": "No route by design: on-premises has no path to this region, and its private zones are linked to its own spoke VNets only.", "ref": "learn-private-resolver" }
        } },
        "east_west": { "steps": [], "note": "No route by design: the spoke VNets of an isolated region aren't peered with each other or with anything else, so their workloads can't reach each other. Expose a service to another virtual network through Private Link, which needs no peering or routing (direct peering between spokes is not modelled in this explorer).", "ref": "learn-private-link" },
        "onprem": { "steps": [], "note": "No route by design: no gateway and no route to on-premises.", "ref": "aac-spoke-to-spoke" }
      },
      "talking_points": [
        { "text": "No hub, gateway or peering by design. Whatever the workload needs (public ingress, outbound, Bastion, a DNS resolver, a private access connector) runs in its own spoke.", "ref": "learn-bastion" },
        { "text": "Keeps its own private DNS zones; with no hybrid connection, confirm whether it needs on-premises names. Share services with it through Private Link.", "ref": "learn-private-link" },
        { "text": "Configure an explicit outbound path (NAT Gateway or a firewall) before the workload needs internet access, since no central firewall sees this traffic; consider Azure Policy guardrails too.", "ref": "learn-default-outbound" }
      ],
      "refs": ["learn-private-link", "learn-nat-gateway"]
    }
  },
  "sharedPaths": {
    "ingress-users": { "steps": ["users", "{private_user_access}@private network connector",
      "peering:host:private_user_access?", "spoke"],
      "note": "Users reach the app through the private access service (Entra Private Access or a third-party ZTNA service) and its private network connector. The connector only sends outbound requests, so no inbound ports need to be opened; access is controlled per app with Conditional Access. Direct: the connector's own connection to the app follows the default routes of the connector subnet (over the VNet peering), so the hub firewall doesn't see this hop: control it with NSGs.",
      "awayNote": "This region uses the connector in another region's hub, so traffic crosses global VNet peering. Microsoft recommends location-based connector groups to reduce latency: place a connector group in this region.",
      "ref": "learn-entra-connectors" },
    "ingress-internet": { "steps": ["internet", "{ingress}", "spoke"], "autoPeering": true,
      "note": "Application Gateway (WAF) sends HTTP(S) traffic to the workload by standard virtual network routing, in parallel with the firewall (a common design); the firewall handles inbound non-HTTP(S) traffic and, through UDRs, all outbound traffic.",
      "awayNote": "This region uses an Application Gateway in another region: the traffic crosses global VNet peering, so validate the added latency and how the routes reach the workload.",
      "ref": "aac-fw-appgw" },
    "ingress-internet-disconnected": { "steps": ["internet", "{ingress}", "spoke"], "autoPeering": true,
      "note": "The workload publishes itself through its own Application Gateway WAF in the spoke.",
      "ref": "aac-fw-appgw" },
    "ingress-admin": { "steps": ["admins", "{bastion}", "peering:host:bastion?", "spoke@VM"],
      "note": "Admins connect to Azure Bastion over TLS (Azure portal or native client); Bastion opens RDP or SSH to the VM's private IP, over VNet peering when the VM sits in another VNet. Route tables aren't supported on the Bastion subnet, so this traffic doesn't pass the hub firewall: control it with NSGs on the Bastion subnet and the workload subnets.",
      "ref": "learn-bastion-faq" },
    "ingress-onprem": { "steps": ["onprem@users", "provider?", "edge?", "{hybrid}", "{host:hybrid.firewall}", "peering:host:hybrid?", "spoke"],
      "note": "On-premises users reach the workload over the hybrid connection (ExpressRoute or VPN gateway), then through the hub firewall to the spoke, via GatewaySubnet routes that point spoke prefixes at the firewall.", "ref": "learn-fw-multi-hub" }
  },
  "ingressPoints": {
    "internet": [
      { "key": true, "text": "This explorer draws Application Gateway in parallel with the firewall, a common design: Application Gateway protects the HTTP(S) applications from web attacks, the firewall protects the other workloads and filters outbound traffic.", "ref": "aac-fw-appgw" },
      { "key": true, "text": "Alternative: Application Gateway in front of the firewall, which then inspects the traffic between Application Gateway and the back ends: it needs UDRs in the Application Gateway subnet (to the workload prefixes) and in the workload subnets (back to the Application Gateway subnet).", "ref": "aac-fw-appgw" }
    ],
    "users": [
      { "key": true, "text": "This explorer draws the connector's connection to the app direct, over the VNet peering (the connector subnet's default routes): the hub firewall doesn't see this hop, so control it with NSGs. A UDR on the connector subnet can send it through the hub firewall instead, which adds firewall rules and logs for this hop.", "ref": "learn-entra-connectors" },
      { "key": true, "text": "Microsoft's placement guidance is to install the connector as close to the application as possible; location-based connector groups serve local applications.", "ref": "learn-appproxy-topology" }
    ]
  },
  "checks": [
    { "id": "remote-hub-target", "when": "uses_remote == 'yes'", "require": "remote_hub_pattern in ['full-hub','minimal-hub']", "severity": "error",
      "message": "{name} takes capabilities from a remote hub, which must be an existing full-hub or minimal-hub region (currently '{remote_hub}').", "ref": "aac-hub-spoke" },
    { "id": "minimal-needs-link", "when": "pattern == 'minimal-hub' && uses_remote == 'yes' && remote_hub_pattern in ['full-hub','minimal-hub']", "require": "linked_to_remote_hub == 'yes'", "severity": "error",
      "message": "{name} takes capabilities from {remote_hub} but has no region link to it: add a link under Region links.", "ref": "aac-hub-spoke" },
    { "id": "disconnected-no-remote", "when": "pattern == 'disconnected'", "require": "remote_hub == 'none'", "severity": "error",
      "message": "{name} is disconnected and cannot use a remote hub.", "ref": "learn-private-link" },
    { "id": "disconnected-no-links", "when": "pattern == 'disconnected'", "require": "has_links == 'no'", "severity": "error",
      "message": "{name} is disconnected and can't take part in region links.", "ref": "learn-private-link" },
    { "id": "unknown-region", "when": "known_region == 'no'", "require": "known_region == 'yes'", "severity": "warning",
      "message": "{name} ({id}) is not in the Azure region list (catalog.js); pick a region from the list.", "ref": "learn-regions-list" },
    { "id": "override-ignored", "when": "ignored_overrides != 'none'", "require": "ignored_overrides == 'none'", "severity": "warning",
      "message": "{name}: {ignored_overrides} can't be set on a {pattern_label} region and is ignored (remove it from the spec or change the pattern).", "ref": "aac-hub-spoke" },
    { "id": "er-single-standard", "when": "er_single == 'standard'", "require": "er_single != 'standard'", "severity": "warning",
      "message": "{name} depends on a single standard-resiliency circuit, {er_single_name}: both of its links are at one peering location, and standard resiliency does not provide protection against location-wide outages. Microsoft recommends high resiliency (ExpressRoute Metro, same cost as standard) as a minimum; for maximum resiliency add a second circuit at a different peering location.", "ref": "learn-er-linkvnet" },
    { "id": "er-no-maximum", "when": "er_level in ['standard','high'] && er_single != 'standard'", "require": "er_level == 'maximum'", "severity": "info",
      "message": "{name}: no maximum resiliency ({er_names}). Maximum resiliency is two circuits in different ExpressRoute locations, strongly recommended for all critical and production workloads.", "ref": "learn-er-linkvnet" },
    { "id": "er-same-city", "when": "er_same_city != 'none'", "require": "er_same_city == 'none'", "severity": "warning",
      "message": "{name}: {er_same_city} are in the same metro area: an event such as a natural disaster can take both paths down. Circuits in different metros lower that chance, at the cost of higher end-to-end latency.", "ref": "learn-er-dr" },
    { "id": "er-not-interconnected", "when": "er_isolated != 'none'", "require": "er_isolated == 'none'", "severity": "info",
      "message": "{name}: other circuits reach this hub ({er_isolated}), but {er_isolated_sites} isn't interconnected with {er_preferred_site}, the site of the preferred circuit {er_preferred}, so they can't take over its traffic: if {er_preferred} fails, {er_preferred_site} falls back to its own backup link, if any. Confirm the on-premises interconnect and route advertisement; if the sites are connected, tick \"Interconnected with\" on the site.", "ref": "learn-er-dr" },
    { "id": "minimal-hybrid-local", "when": "pattern == 'minimal-hub' && hybrid_state == 'local'", "require": "hybrid_state != 'local'", "severity": "info",
      "message": "{name} has its own hybrid gateway (Hybrid gateway: Local). Pattern guidance: check whether an existing ExpressRoute circuit can provide the reachability before adding a new one." },
    { "id": "minimal-local-missing", "when": "pattern == 'minimal-hub' && local_missing != 'none'", "require": "local_missing == 'none'", "severity": "warning",
      "message": "{name}: {local_missing} set to Local, but no product is configured for it (no region override, and the estate default is none), so the region has none. Pick one under Overrides, or choose another option for the capability (for DNS: Azure-provided DNS).", "ref": "aac-hub-spoke" }
  ],
  "linkChecks": [
    { "id": "link-ends", "when": "ends_exist == 'no'", "require": "ends_exist == 'yes'", "severity": "error",
      "message": "Region link {name}: both ends must be existing, different regions.", "ref": "aac-hub-spoke" },
    { "id": "link-hubs-only", "when": "kind == 'hub' && ends_exist == 'yes'", "require": "ends_have_hubs == 'yes'", "severity": "error",
      "message": "Region link {name}: hub links connect regions that have a hub (full or minimal); a remote-hub region uses its remote hub.", "ref": "aac-hub-spoke" },
    { "id": "link-firewalls", "when": "kind == 'hub' && topology == 'hub-spoke' && ends_have_hubs == 'yes'", "require": "both_firewalls == 'yes'", "severity": "error",
      "message": "Region link {name}: in this design both hubs need their own firewall/NVA ({without_firewall} has none). Peering is not transitive: a hub only knows its directly peered VNets, so a UDR on each firewall subnet sends traffic for the remote region's spokes to the firewall in the remote hub (and back through the local one).", "ref": "learn-fw-multi-hub" },
    
  ],
  "crossRegion": {
    "linkLabels": { "hub-spoke": "both firewalls", "vwan-inspected": "inspected in both hubs (routing intent)", "vwan-direct": "not inspected (no routing intent)",
                    "vwan-unsecured": "not inspected (no hub security)", "vwan-partial": "inspected in {hub} only" },
    "templates": {
      "both": { "steps": ["spoke", "peering:src_hub?", "{src_hub.firewall}", "link", "{dst_hub.firewall}", "peering:dst?", "dst.spoke"], "matrix": "Both firewalls",
        "note": "Peering is not transitive: the {src_hub} hub has no route to the spokes behind {dst_hub}, so a UDR sends the flow to {src_hub}'s firewall, across the hub link, to {dst_hub}'s firewall. The return traffic crosses the same two firewalls in reverse.", "ref": "learn-fw-multi-hub" },
      "same-hub": { "steps": ["spoke", "peering:src_hub?", "{src_hub.firewall}", "peering:dst?", "dst.spoke"], "matrix": "Via {src_hub} firewall",
        "note": "Both regions use the {src_hub} hub, so the flow transits that hub once, through its firewall (peering is not transitive on its own).", "ref": "aac-spoke-to-spoke" },
      "no-link": { "steps": [], "matrix": "No route",
        "note": "No route: peering is not transitive; add a link between {src_hub} and {dst_hub}.", "ref": "learn-fw-multi-hub" },
      "no-hub": { "steps": [], "matrix": "No route",
        "note": "No route: {src} or {dst} has no hub to transit.", "ref": "aac-spoke-to-spoke" },
      "disconnected": { "steps": [], "matrix": "No route by design",
        "note": "No route by design: a disconnected region has no peering. Share services through Private Link instead.", "ref": "learn-private-link" }
    },
    "talking_points": [
      { "key": true, "text": "With VNet peering, the multi-hub design sends hub-link traffic through both firewalls: hub A only knows its directly peered VNets, so a UDR on its firewall subnet sends region B's prefixes to the firewall in hub B.", "ref": "learn-fw-multi-hub" },
      { "key": true, "text": "Inter-region spoke traffic traverses both firewalls in each direction, which keeps the path symmetric. Consider the latency added by two inspection hops, and confirm both firewall policies allow the flow.", "ref": "aac-spoke-to-spoke" },
      { "key": true, "text": "For direct, uninspected traffic between two spokes, in the same region or across regions, connect them directly, for example with VNet peering (global VNet peering across regions) or Virtual Network Manager direct connectivity: the hub firewalls don't see it, so control it with NSGs. This explorer draws east-west traffic through the hubs.", "ref": "aac-spoke-to-spoke" }
    ]
  },
  "dnsContext": {
    "centralized": { "refs": ["learn-resolver-arch", "learn-private-dns-overview", "caf-private-link-dns", "learn-private-resolver"],
      "servers": "Resolver inbound endpoint in {dns_hub} (custom DNS on the spoke VNets)",
      "zones": "Global private DNS zones, linked to the hub VNets that host a resolver: {zones_linked}",
      "can": [{ "text": "Private endpoint names from the privatelink zones" }, { "text": "On-premises names, through the forwarding ruleset and outbound endpoint", "needs": "onprem" },
              { "text": "Queries from on-premises, forwarded to the inbound endpoint", "needs": "onprem" }], "cannot": [] },
    "distributed": { "refs": ["learn-resolver-arch", "aac-dns-resolver", "learn-resolver-rulesets"],
      "servers": "Azure-provided DNS (168.63.129.16), with a forwarding ruleset linked to each spoke VNet",
      "zones": "Global private DNS zones, linked to the resolver hubs ({zones_linked}); spokes resolve them through a zone link on each spoke VNet, or a ruleset rule that forwards the zone to an inbound endpoint",
      "can": [{ "text": "Private endpoint names, where the zones are linked to the spoke VNet" }, { "text": "On-premises names, through the ruleset and the outbound endpoint in {dns_hub}", "needs": "onprem" },
              { "text": "Queries from on-premises, forwarded to the inbound endpoint in {dns_hub}", "needs": "onprem" }], "cannot": [] },
    "none": { "refs": ["learn-168-63-129-16", "learn-private-dns-overview"],
      "servers": "Azure-provided DNS (168.63.129.16); no resolver configured",
      "zones": "Private DNS zones must be linked to the spoke VNets directly",
      "can": [{ "text": "Names in zones linked to the spoke VNet" }], "cannot": ["On-premises names (no resolver)", "Queries from on-premises"] },
    "disconnected": { "refs": ["learn-private-resolver", "learn-private-dns-overview", "learn-pe-dns-integration"],
      "servers": "Azure-provided DNS (168.63.129.16), or its own DNS Private Resolver in the spoke",
      "zones": "Its own private DNS zones, linked to its spoke VNets",
      "can": [{ "text": "Names in its own private DNS zones (private endpoint IPs)" }],
      "cannot": ["The shared central private DNS zones", "On-premises names (no route by design)", "Queries from on-premises (no route by design)"] }
  },
  "dnsTalkingPoints": [
    { "key": true, "text": "Private DNS zones are global resources: the same privatelink zones can be linked to VNets in several regions. Validate whether one shared set fits your multi-region design.", "ref": "learn-private-dns-overview" },
    { "key": true, "text": "Put the inbound endpoints of resolvers in at least two regions in the on-premises conditional forwarders (with the zones linked to both resolver VNets), so resolution can fail over when one resolver or its connection is down. Test the failover.", "ref": "learn-resolver-failover" },
    { "key": true, "text": "With private endpoints in several regions, the Private Link DNS records need manual maintenance: decide how a shared zone's record changes when a region fails over.", "ref": "caf-private-link-dns" }
  ]
};

Object.assign(window.RULES, /* rules.js: hybrid connectivity and global entry rules as data (checks, talking points,`n   failover notes, resiliency levels, global-entry options and what is not modelled). Everything below this line is plain JSON. */ {
  "hybridChecks": [
    { "id": "hybrid-site", "when": "type in ['expressroute','vpn']", "require": "site_exists == 'yes'", "severity": "error",
      "message": "{name}: on-premises site '{site}' doesn't exist.", "ref": "aac-hub-spoke" },
    { "id": "hybrid-targets", "when": "type in ['expressroute','vpn']", "require": "has_targets == 'yes'", "severity": "warning",
      "message": "{name} connects to no region: tick at least one hub.", "ref": "aac-hub-spoke" },
    { "id": "hybrid-no-gateway", "when": "type in ['expressroute','vpn']", "require": "no_hub_targets == 'none'", "severity": "error",
      "message": "{name}: {no_hub_targets} has no hub, so it can't host a gateway. Connect the hub it uses instead.", "ref": "aac-hub-spoke" },
    { "id": "hybrid-minimal-gateway", "when": "type in ['expressroute','vpn']", "require": "minimal_targets == 'none'", "severity": "error",
      "message": "{name}: {minimal_targets} is a minimal hub without Hybrid gateway set to Local, so it has no gateway. Set its Hybrid gateway to Local, or connect the hub it takes on-premises connectivity from." },
    { "id": "er-location-known", "when": "type == 'expressroute' && location_named == 'yes'", "require": "location_known == 'yes'", "severity": "warning",
      "message": "{name}: '{peering_location}' is not an ExpressRoute peering location in the list.", "ref": "learn-er-locations" },
    { "id": "er-cross-geo", "when": "type == 'expressroute' && location_known == 'yes'", "require": "cross_geo == 'none'", "severity": "warning",
      "message": "{name}: {cross_geo} is outside {geo}, the geopolitical region of {peering_location}. This needs the ExpressRoute premium add-on (connectivity across geopolitical regions).", "ref": "learn-er-locations" }
  ],
  "estateChecks": [
    { "id": "vwan-apart", "when": "vwans_apart != 'none'", "require": "vwans_apart == 'none'", "severity": "info",
      "message": "Virtual WANs {vwans_apart} are isolated from each other: virtual hubs in different virtual WANs don't communicate, so there is no route between their regions.", "ref": "learn-vwan-about" }
  ],
  "hybridTalkingPoints": [
    { "key": true, "text": "A peering location is a Microsoft edge site (MSEE) at a colocation facility, not an Azure region; circuits terminate there.", "ref": "learn-er-locations" },
    { "key": true, "text": "High resiliency (ExpressRoute Metro): one circuit whose two links land at two facilities (peering locations) in the same metro area, at the same cost as a standard circuit; Microsoft recommends it as the minimum.", "ref": "learn-er-locations" },
    { "key": true, "text": "Maximum resiliency: two circuits at two different peering locations, so no single site in the Microsoft network path can cut on-premises access; recommended for business- and mission-critical workloads.", "ref": "learn-er-resiliency" },
    { "key": true, "text": "Azure's routing decides the primary link at each hub, and the other link is the backup. Configure the on-premises routers to send over the same link (for example a higher BGP local preference for the routes learned over ExpressRoute), or the traffic is asymmetric.", "ref": "learn-er-vpn-backup" }
  ],
  "fixedPreference": {
    "hub-spoke": { "text": "Routes learned over ExpressRoute are preferred over VPN routes for the same prefix (the longest prefix match still wins first); the site-to-site VPN acts as the backup, carrying traffic only if the ExpressRoute path fails.", "ref": "learn-er-vpn-coexist" }
  },
  "failover": {
    "circuit": { "text": "Simulated failure of {what}: {hub} now uses {circuit} at the {location} peering location, through the same ExpressRoute gateway. Expect added latency if that peering location is farther away. On-premises must send the return traffic over the same circuit (BGP local preference), or the flow is asymmetric. Stand-by circuits need active management: test failover and failback periodically.", "ref": "learn-er-dr" },
    "link": { "text": "Simulated failure of {what}: no circuit is left for this hub, so traffic takes the {backup} backup. A passive backup often fails alongside the primary for lack of maintenance: validate it and test failover, and the switch back to ExpressRoute, periodically during a maintenance window.", "ref": "learn-er-vpn-backup" },
    "none": { "text": "Simulated failure of {what}: {hub} has no other circuit or backup link for this site, so on-premises can't be reached from here until it recovers.", "ref": "learn-er-dr" },
    "unaffected": { "text": "The simulated failure of {what} doesn't affect this path: {hub} keeps using {circuit}.", "ref": "learn-er-dr" },
    "metro_link": { "text": "Simulated failure of {what}: {circuit} stays up on its other link, at {location}, because a Metro circuit has redundancy across its two peering locations. {hub} keeps using it with no failover, but without that redundancy until the location recovers.", "ref": "learn-er-linkvnet" },
    "shared_provider": "{shared} use the same connectivity provider, which can be a shared point of failure: for diverse paths consider different service providers.",
    "other_site": "The path reaches {home} through {site} over the on-premises interconnect: a design assumption, so confirm the interconnect and that {site} advertises {home}'s routes to Azure.",
    "not_interconnected": "{circuits} can't take over: {sites} isn't interconnected with {home} on-premises.",
    "cut": "No route: every connection this hub could use for on-premises traffic has failed in the simulation."
  },
  "resiliencyLevels": [
    { "id": "standard", "label": "Standard", "what": "one circuit, both links at one peering location",
      "fails": "Fails with a location-wide outage at that peering location.",
      "note": "Suitable for non-critical and non-production workloads.", "refs": ["learn-er-linkvnet"] },
    { "id": "high", "label": "Metro (high)", "what": "one Metro circuit, its two links at two peering locations in one metro area",
      "fails": "Fails only if both peering locations are down; one alone: the circuit stays up on the other link.",
      "note": "Microsoft recommends high resiliency as a minimum for all workloads.", "refs": ["learn-er-linkvnet", "learn-er-metro", "learn-er-locations"] },
    { "id": "maximum", "label": "Maximum", "what": "two circuits at different peering locations",
      "fails": "Maximum protection against location-wide outages at one ExpressRoute location.",
      "note": "Strongly recommended for all critical and production workloads.", "refs": ["learn-er-linkvnet"] }
  ],
  "notModelled": [
    "SD-WAN connections and Azure Route Server: on-premises sites connect over ExpressRoute or site-to-site VPN.",
    "On-premises transit through Azure: site to site through a hub (Azure Route Server branch-to-branch in hub-spoke, or Virtual WAN branch-to-branch).",
    "Basic virtual WANs: every virtual WAN is Standard.",
    "A primary link chosen per site: Azure's routing decides it at each hub (ExpressRoute; in Virtual WAN the hub routing preference) and the other link is the backup.",
    "Traffic between virtual networks over ExpressRoute (the gateway setting Allow traffic from remote virtual networks): east-west traffic uses hub links.",
    "Application Gateway in front of the firewall, and the private network connector's route through the firewall: ingress is drawn direct to the spoke; talking points cover both designs.",
    "Direct peering between spokes (in the same region or across regions): east-west traffic goes through the hubs; a talking point covers direct peering.",
    "How a global entry service chooses between several active origins (Front Door priority, latency and weight; Traffic Manager routing methods): origins are shown as active or backup.",
    "Azure Front Door Private Link to origins: not drawn.",
    "Front Door WAF policy, caching, rules engine, domains, certificates and session affinity."
  ]
});

Object.assign(window.RULES, /* rules.js: the Microsoft Learn and Azure Architecture Center pages the rules
   cite. Everything below this line is plain JSON. */ {
  "references": {
    "aac-hub-spoke":       { "tier": "aac", "title": "Hub-spoke network topology in Azure", "url": "https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke" },
    "aac-vwan":            { "tier": "aac", "title": "Hub-spoke network topology with Azure Virtual WAN", "url": "https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke-virtual-wan-architecture" },
    "aac-spoke-to-spoke":  { "tier": "aac", "title": "Spoke-to-spoke networking", "url": "https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/hybrid-networking/virtual-network-peering" },
    "aac-fw-appgw":        { "tier": "aac", "title": "Azure Firewall and Application Gateway for virtual networks", "url": "https://learn.microsoft.com/en-us/azure/architecture/example-scenario/gateway/firewall-application-gateway" },
    "aac-dns-resolver":    { "tier": "aac", "title": "Azure DNS Private Resolver architecture", "url": "https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/azure-dns-private-resolver" },
    "learn-resolver-arch": { "tier": "learn", "title": "Private resolver architecture (centralized and distributed DNS)", "url": "https://learn.microsoft.com/en-us/azure/dns/private-resolver-architecture" },
    "learn-fw-multi-hub":  { "tier": "learn", "title": "Use Azure Firewall to route a multi hub and spoke topology", "url": "https://learn.microsoft.com/en-us/azure/firewall/firewall-multi-hub-spoke" },
    "learn-azure-firewall":  { "tier": "learn", "title": "What is Azure Firewall?", "url": "https://learn.microsoft.com/en-us/azure/firewall/overview" },
    "learn-appgw-waf":       { "tier": "learn", "title": "Web Application Firewall on Azure Application Gateway", "url": "https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/ag-overview" },
    "learn-front-door":      { "tier": "learn", "title": "What is Azure Front Door?", "url": "https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview" },
    "learn-expressroute":    { "tier": "learn", "title": "What is Azure ExpressRoute?", "url": "https://learn.microsoft.com/en-us/azure/expressroute/expressroute-introduction" },
    "learn-er-locations":    { "tier": "learn", "title": "ExpressRoute connectivity providers and locations", "url": "https://learn.microsoft.com/en-us/azure/expressroute/expressroute-locations-providers" },
    "learn-er-resiliency":   { "tier": "learn", "title": "Design and architect Azure ExpressRoute for resiliency", "url": "https://learn.microsoft.com/en-us/azure/expressroute/design-architecture-for-resiliency" },
    "learn-er-metro":        { "tier": "learn", "title": "About ExpressRoute Metro", "url": "https://learn.microsoft.com/en-us/azure/expressroute/metro" },
    "learn-er-linkvnet":      { "tier": "learn", "title": "Link a virtual network to ExpressRoute circuits", "url": "https://learn.microsoft.com/en-us/azure/expressroute/expressroute-howto-linkvnet-portal-resource-manager" },
    "learn-er-dr":           { "tier": "learn", "title": "Designing for disaster recovery with ExpressRoute private peering", "url": "https://learn.microsoft.com/en-us/azure/expressroute/designing-for-disaster-recovery-with-expressroute-privatepeering" },
    "learn-vpn-gateway":     { "tier": "learn", "title": "What is Azure VPN Gateway?", "url": "https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-about-vpngateways" },
    "learn-private-resolver": { "tier": "learn", "title": "What is Azure DNS Private Resolver?", "url": "https://learn.microsoft.com/en-us/azure/dns/dns-private-resolver-overview" },
    "learn-nat-gateway":     { "tier": "learn", "title": "What is Azure NAT Gateway?", "url": "https://learn.microsoft.com/en-us/azure/nat-gateway/nat-overview" },
    "learn-bastion":         { "tier": "learn", "title": "What is Azure Bastion?", "url": "https://learn.microsoft.com/en-us/azure/bastion/bastion-overview" },
    "learn-private-link":    { "tier": "learn", "title": "What is Azure Private Link?", "url": "https://learn.microsoft.com/en-us/azure/private-link/private-link-overview" },
    "learn-vwan-routing-intent": { "tier": "learn", "title": "Virtual WAN hub routing intent and routing policies", "url": "https://learn.microsoft.com/en-us/azure/virtual-wan/how-to-routing-policies" },
    "learn-entra-private-access":  { "tier": "learn", "title": "Learn about Microsoft Entra Private Access", "url": "https://learn.microsoft.com/en-us/entra/global-secure-access/concept-private-access" },
    "caf-private-link-dns":  { "tier": "learn", "title": "Private Link and DNS integration at scale", "url": "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/private-link-and-dns-integration-at-scale" },
    "learn-regions-list":    { "tier": "learn", "title": "List of Azure regions", "url": "https://learn.microsoft.com/en-us/azure/reliability/regions-list" },
    "learn-er-vpn-coexist":  { "tier": "learn", "title": "Configure ExpressRoute and site-to-site VPN coexisting connections", "url": "https://learn.microsoft.com/en-us/azure/expressroute/expressroute-howto-coexist-resource-manager" },
    "learn-er-vpn-backup":   { "tier": "learn", "title": "Using site-to-site VPN as a backup for ExpressRoute private peering", "url": "https://learn.microsoft.com/en-us/azure/expressroute/use-s2s-vpn-as-backup-for-expressroute-privatepeering" },
    "learn-vwan-hub-pref":   { "tier": "learn", "title": "Virtual WAN virtual hub routing preference", "url": "https://learn.microsoft.com/en-us/azure/virtual-wan/about-virtual-hub-routing-preference" },
    "learn-vwan-nva":        { "tier": "learn", "title": "About NVAs in a Virtual WAN hub", "url": "https://learn.microsoft.com/en-us/azure/virtual-wan/about-nva-hub" },
    "learn-resolver-hybrid-dns": { "tier": "learn", "title": "Resolve Azure and on-premises domains (Azure DNS Private Resolver)", "url": "https://learn.microsoft.com/en-us/azure/dns/private-resolver-hybrid-dns" },
    "learn-resolver-rulesets": { "tier": "learn", "title": "Azure DNS Private Resolver endpoints and rulesets", "url": "https://learn.microsoft.com/en-us/azure/dns/private-resolver-endpoints-rulesets" },
    "learn-resolver-failover": { "tier": "learn", "title": "Tutorial: Set up DNS failover using private resolvers", "url": "https://learn.microsoft.com/en-us/azure/dns/tutorial-dns-private-resolver-failover" },
    "learn-private-dns-overview": { "tier": "learn", "title": "What is Azure Private DNS?", "url": "https://learn.microsoft.com/en-us/azure/dns/private-dns-overview" },
    "learn-pe-dns-integration": { "tier": "learn", "title": "Azure Private Endpoint DNS integration scenarios", "url": "https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns-integration" },
    "learn-168-63-129-16":   { "tier": "learn", "title": "What is IP address 168.63.129.16?", "url": "https://learn.microsoft.com/en-us/azure/virtual-network/what-is-ip-address-168-63-129-16" },
    "learn-vnet-peering":    { "tier": "learn", "title": "Azure virtual network peering", "url": "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview" },
    "learn-default-outbound": { "tier": "learn", "title": "Default outbound access in Azure", "url": "https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/default-outbound-access" },
    "learn-entra-connectors": { "tier": "learn", "title": "Microsoft Entra private network connectors", "url": "https://learn.microsoft.com/en-us/entra/global-secure-access/concept-connectors" },
    "learn-bastion-faq":     { "tier": "learn", "title": "Azure Bastion FAQ", "url": "https://learn.microsoft.com/en-us/azure/bastion/bastion-faq" },
    "learn-fw-features":     { "tier": "learn", "title": "Azure Firewall features by SKU", "url": "https://learn.microsoft.com/en-us/azure/firewall/features-by-sku" },
    "learn-fw-policy":       { "tier": "learn", "title": "Azure Firewall Manager policy overview", "url": "https://learn.microsoft.com/en-us/azure/firewall-manager/policy-overview" },
    "aac-nva-ha":            { "tier": "aac", "title": "Deploy highly available NVAs", "url": "https://learn.microsoft.com/en-us/azure/architecture/networking/guide/network-virtual-appliance-high-availability" },
    "learn-fd-origin-security": { "tier": "learn", "title": "Secure traffic to Azure Front Door origins", "url": "https://learn.microsoft.com/en-us/azure/frontdoor/origin-security" },
    "learn-vpn-active-active": { "tier": "learn", "title": "About active-active VPN gateways", "url": "https://learn.microsoft.com/en-us/azure/vpn-gateway/about-active-active-gateways" },
    "learn-vwan-faq":        { "tier": "learn", "title": "Azure Virtual WAN FAQ", "url": "https://learn.microsoft.com/en-us/azure/virtual-wan/virtual-wan-faq" },
    "learn-appproxy-topology": { "tier": "learn", "title": "Optimize traffic flow with Microsoft Entra application proxy", "url": "https://learn.microsoft.com/en-us/entra/identity/app-proxy/application-proxy-network-topology" },
    "learn-secured-vhub":    { "tier": "learn", "title": "What is a secured virtual hub?", "url": "https://learn.microsoft.com/en-us/azure/firewall-manager/secured-virtual-hub" },
    "learn-vwan-about":      { "tier": "learn", "title": "What is Azure Virtual WAN? (virtual WAN types, hub router)", "url": "https://learn.microsoft.com/en-us/azure/virtual-wan/virtual-wan-about" },
    "aac-vwan-dns":          { "tier": "aac", "title": "Guide to Private Link and DNS in Azure Virtual WAN", "url": "https://learn.microsoft.com/en-us/azure/architecture/networking/guide/private-link-virtual-wan-dns-guide" },
    "aac-vhub-extension":    { "tier": "aac", "title": "Virtual hub extension pattern", "url": "https://learn.microsoft.com/en-us/azure/architecture/networking/guide/private-link-virtual-wan-dns-virtual-hub-extension-pattern" },
    "learn-vwan-indirect-spoke": { "tier": "learn", "title": "Route traffic to indirect spokes (Azure Virtual WAN)", "url": "https://learn.microsoft.com/en-us/azure/virtual-wan/indirect-spoke-architecture" },
    "learn-vwan-ri-static":  { "tier": "learn", "title": "Use routing intent with static routes in Azure Virtual WAN", "url": "https://learn.microsoft.com/en-us/azure/virtual-wan/routing-intent-static-route" },
    "learn-front-door-routing-methods": { "tier": "learn", "title": "Traffic routing methods to origin (Azure Front Door)", "url": "https://learn.microsoft.com/en-us/azure/frontdoor/routing-methods" },
    "learn-traffic-manager": { "tier": "learn", "title": "What is Traffic Manager?", "url": "https://learn.microsoft.com/en-us/azure/traffic-manager/traffic-manager-overview" },
    "learn-traffic-manager-routing": { "tier": "learn", "title": "Traffic Manager routing methods", "url": "https://learn.microsoft.com/en-us/azure/traffic-manager/traffic-manager-routing-methods" }
  }
});

Object.assign(window.RULES, /* rules.js: the Virtual WAN rules as data (path templates, east-west between
   virtual hubs, checks, notes, talking points); the logic is in topology.js. Everything below this line is plain JSON. */ {
  "vwan": {
    "stateLabels": { "intent": "Inspected (routing intent)", "secured": "Secured hub, no routing intent", "none": "No hub security", "nva": "Firewall NVA in the shared services VNet", "local": "In this region's spoke" },
    "preferenceDefault": "{pref} is preferred ({how} routing preference) for routes learned over more than one connection type.",
    "preferenceAsPath": "The shortest AS path wins: with equal AS paths the hub chooses ExpressRoute, as drawn; on-premises can make the VPN preferred by prepending the routes it advertises over ExpressRoute.",
    "fallback": { "nva": "none" },
    "away": { "text": "This path uses a virtual hub, gateway or shared service in another region (over hub-to-hub, or a VNet connection to that region's virtual hub): consider the added latency, and include the hub-to-hub data transfer, charged at inter-region rates, in the cost estimate.", "ref": "aac-vwan" },
    "bowtie": "{circuits} connect to both {src_hub} and {dst_hub} (bow-tie): Virtual WAN currently prefers the ExpressRoute circuit path over hub-to-hub for traffic between their VNets, unless the hubs use AS Path as hub routing preference. The path drawn is hub-to-hub: see Checks.",
    "talking_points": [
      { "key": true, "text": "A virtual hub is a Microsoft-managed virtual network: it holds the hub router, the gateways and the hub security (Azure Firewall, an NVA or a SaaS solution). Shared services such as DNS resources or Azure Bastion can't be deployed in it.", "ref": "aac-vhub-extension" },
      { "key": true, "text": "A secured virtual hub has Azure Firewall or third-party security; routing intent (internet and private traffic policies) sends traffic through it without UDRs. Each virtual hub needs its own firewall.", "ref": "learn-secured-vhub" }
    ],
    "cross_points": [
      { "key": true, "text": "The hubs of one Standard virtual WAN are connected in full mesh; inter-hub traffic goes through the virtual hub routers unless routing intent sends it through the hub firewalls.", "ref": "learn-vwan-faq" },
      { "key": true, "text": "Routing intent is the only way in Virtual WAN to inspect inter-hub traffic with the hubs' security solutions, and it needs to be enabled on all hubs so the routing stays symmetric.", "ref": "learn-vwan-routing-intent" },
      { "key": true, "text": "Hub-to-hub data transfer is charged at inter-region rates: include it in the cost estimate.", "ref": "aac-vwan" }
    ]
  },
  "vwanPaths": {
    "ingress": {
      "internet": { "byHub": true, "localRole": "ingress",
        "intent": { "steps": ["internet", "{ingress}", "{host:ingress.vhub}?", "{vhub}", "spoke"], "autoPeering": true,
          "note": "Application Gateway (WAF) in the shared services VNet, a spoke connected to the virtual hub, terminates the client connection and reaches the workload through the virtual hub. That is VNet-to-VNet traffic, so routing intent (private traffic policy) sends it through the hub firewall. The workload sees the client IP address in the X-Forwarded-For header.", "ref": "aac-vwan" },
        "secured": { "steps": ["internet", "{ingress}", "{host:ingress.vhub}?", "{vhub}", "spoke"], "autoPeering": true,
          "note": "Not inspected by the hub firewall: Application Gateway (WAF) in the shared services VNet reaches the workload through the virtual hub router, because routing intent (private traffic policy) is off. Turn it on to send this VNet-to-VNet traffic through the hub firewall.", "ref": "learn-vwan-routing-intent" },
        "none": { "steps": ["internet", "{ingress}", "{host:ingress.vhub}?", "{vhub}", "spoke"], "autoPeering": true,
          "note": "Not inspected: this virtual hub has no security solution, so Application Gateway (WAF) in the shared services VNet reaches the workload through the virtual hub router only.", "ref": "aac-vwan" },
        "local": { "steps": ["internet", "{ingress}", "spoke"], "note": "Application Gateway (WAF) in this region's own spoke reaches the workload without crossing the virtual hub.", "ref": "aac-fw-appgw" } },
      "users": { "byHub": true, "localRole": "private_user_access",
        "intent": { "steps": ["users", "{private_user_access}@private network connector", "{host:private_user_access.vhub}?", "{vhub}", "spoke"], "autoPeering": true,
          "note": "Users reach the app through the private access service and its private network connector in the shared services VNet; the connector only makes outbound connections, so no inbound ports are opened. Its connection to the app is VNet-to-VNet traffic through the virtual hub, which routing intent (private traffic policy) sends through the hub firewall: confirm the firewall's sizing for it.", "ref": "learn-entra-connectors" },
        "*": { "steps": ["users", "{private_user_access}@private network connector", "{host:private_user_access.vhub}?", "{vhub}", "spoke"], "autoPeering": true,
          "note": "Not inspected: users reach the app through the private access service and its private network connector in the shared services VNet; the connector's connection to the app goes through the virtual hub router, with no private traffic routing policy (no routing intent, or no security solution in the hub).", "ref": "learn-entra-connectors" },
        "local": { "steps": ["users", "{private_user_access}@private network connector", "spoke"], "note": "The private network connector in this region's own spoke reaches the app without crossing the virtual hub; it only makes outbound connections, so no inbound ports are opened.", "ref": "learn-entra-connectors" } },
      "admin": { "byHub": true, "localRole": "bastion",
        "intent": { "steps": ["admins", "{bastion}", "{host:bastion.vhub}?", "{vhub}", "spoke@VM"], "autoPeering": true,
          "note": "Admins connect to Azure Bastion in the shared services VNet (Bastion can't be deployed in a virtual hub), which reaches VMs in other virtual networks through the virtual hub with IP-based connection. Routing intent (private traffic policy) sends this VNet-to-VNet traffic through the hub firewall: confirm the firewall policy allows RDP / SSH from the Bastion subnet. With a secured hub, the Bastion VNet's connection must not propagate the default route (0.0.0.0/0).", "ref": "learn-bastion-faq" },
        "*": { "steps": ["admins", "{bastion}", "{host:bastion.vhub}?", "{vhub}", "spoke@VM"], "autoPeering": true,
          "note": "Admins connect to Azure Bastion in the shared services VNet (Bastion can't be deployed in a virtual hub), which reaches VMs in other virtual networks through the virtual hub with IP-based connection; not inspected (no private traffic routing policy). With a secured hub, the Bastion VNet's connection must not propagate the default route (0.0.0.0/0).", "ref": "learn-bastion-faq" },
        "local": { "steps": ["admins", "{bastion}", "spoke@VM"], "note": "Admins connect to Azure Bastion in this region's own spoke; Bastion opens RDP or SSH to the VM's private IP without crossing the virtual hub.", "ref": "learn-bastion-faq" } },
      "onprem": { "byHub": true,
        "intent": { "steps": ["onprem@users", "provider?", "edge?", "{hybrid}", "{host:hybrid.vhubfw}?", "{firewall}", "spoke"], "autoPeering": true,
          "note": "On-premises users reach the workload over the hybrid connection to the virtual hub (ExpressRoute or VPN gateway); routing intent (private traffic policy) sends branch-to-VNet traffic through the hub firewall.", "ref": "learn-vwan-routing-intent" },
        "*": { "steps": ["onprem@users", "provider?", "edge?", "{hybrid}", "{host:hybrid.vhubfw}?", "{viahost:hybrid}?", "{via:hybrid}?", "spoke"], "autoPeering": true,
          "note": "Not inspected: on-premises users reach the workload through the virtual hub's gateway, with no private traffic routing policy (no routing intent, or no security solution in the hub).", "ref": "learn-vwan-routing-intent" } }
    },
    "egress": { "byHub": true,
      "intent": { "steps": ["spoke", "{firewall}", "internet"], "autoPeering": true,
        "note": "Routing intent (internet traffic policy) advertises a default route to the VNet connections and sends internet-bound traffic to the hub's security solution, which inspects it and sends it to the internet (direct access), with no UDRs. The default route doesn't propagate between hubs, so each hub egresses through its own firewall.", "ref": "learn-vwan-routing-intent" },
      "secured": { "steps": ["spoke", "{firewall}", "internet"], "autoPeering": true,
        "note": "Secured virtual hub without routing intent: the hub propagates the default route it learns from its firewall to the connections where that is enabled, so internet traffic leaves through the firewall. Confirm the secured hub's internet traffic setting and the VNet connections' default route setting.", "ref": "learn-vwan-faq" },
      "nva": { "steps": ["spoke", "{hub_router}", "{firewall}", "internet"], "autoPeering": true,
        "note": "The third-party firewall (NVA) runs in the shared services VNet, because a generic NVA can't be deployed in a virtual hub. A static route 0.0.0.0/0 on the NVA's VNet connection, propagated to the other connections, sends the hub's internet traffic to it; the NVA inspects it and sends it to the internet. The 0.0.0.0/0 route isn't propagated across hubs, so each hub uses its local NVA.", "ref": "learn-vwan-indirect-spoke" },
      "none": { "steps": [], "note": "Not inspected — confirm how internet egress is provided: this virtual hub has no security solution, so no hub firewall filters internet traffic, and another hub's firewall can't serve it (a default route doesn't propagate between hubs).", "ref": "learn-vwan-faq" } },
    "east_west": { "byHub": true,
      "intent": { "steps": ["spoke", "{firewall}", "spoke2"], "autoPeering": true,
        "note": "Routing intent (private traffic policy) sends VNet-to-VNet traffic through the hub firewall: inspected, with no UDRs in the spokes.", "ref": "learn-vwan-routing-intent" },
      "secured": { "steps": ["spoke", "{vhub}", "spoke2"], "autoPeering": true,
        "note": "Not inspected in this model: without routing intent (private traffic policy), traffic between spokes is drawn through the virtual hub router, not the hub firewall. Confirm the secured hub's private traffic settings, or turn routing intent on.", "ref": "learn-vwan-routing-intent" },
      "nva": { "steps": ["spoke", "{vhub}", "spoke2"], "autoPeering": true,
        "note": "Not inspected: traffic between spokes connected directly to the virtual hub goes through the hub router, not the firewall NVA in the shared services VNet. Workloads whose traffic must pass the NVA are indirect spokes peered to the NVA VNet, with UDRs: confirm the design.", "ref": "learn-vwan-indirect-spoke" },
      "none": { "steps": ["spoke", "{vhub}", "spoke2"], "autoPeering": true,
        "note": "Not inspected: this virtual hub has no security solution, so traffic between its spokes goes through the virtual hub router only. Set Hub security (and routing intent) to inspect it.", "ref": "learn-vwan-about" } },
    "onprem": { "byHub": true,
      "intent": { "steps": ["spoke", "{firewall}", "{host:hybrid.vhubfw}?", "{hybrid}", "edge?", "provider?", "onprem"], "autoPeering": true,
        "note": "Routing intent (private traffic policy) sends the traffic between the spokes and on-premises through the hub firewall in both directions; the virtual hub's gateway connects the site.", "ref": "learn-vwan-routing-intent" },
      "*": { "steps": ["spoke", "{via:hybrid}?", "{viahost:hybrid}?", "{host:hybrid.vhubfw}?", "{hybrid}", "edge?", "provider?", "onprem"], "autoPeering": true,
        "note": "Not inspected: spokes reach on-premises through the virtual hub's gateway, with no private traffic routing policy (no routing intent, or no security solution in this hub).", "ref": "learn-vwan-routing-intent" } },
    "dns": { "centralized": {
      "azure": { "byHub": true,
        "intent": { "steps": ["spoke@VM", "{vhub}", "{host:dns.vhub}?", "{dns}@inbound endpoint", "azure_dns", "dns_zones"], "autoPeering": true,
          "note": "The spoke VNets use the resolver's inbound endpoint in the shared services VNet as custom DNS; routing intent (private traffic policy) sends the query through the hub firewall. Private DNS zones can't be linked to a virtual hub, so they are linked to the shared services VNet (a virtual hub extension), and Azure-provided DNS answers from them: a private endpoint's IP, for example.", "ref": "aac-vwan-dns" },
        "*": { "steps": ["spoke@VM", "{vhub}", "{host:dns.vhub}?", "{dns}@inbound endpoint", "azure_dns", "dns_zones"], "autoPeering": true,
          "note": "The spoke VNets use the resolver's inbound endpoint in the shared services VNet as custom DNS; the query crosses the virtual hub router (not inspected). Private DNS zones can't be linked to a virtual hub, so they are linked to the shared services VNet, and Azure-provided DNS answers from them.", "ref": "aac-vwan-dns" } },
      "onprem": { "byHub": true,
        "intent": { "steps": ["spoke@VM", "{vhub}", "{host:dns.vhub}?", "{dns}@inbound to outbound endpoint", "ruleset", "{hybrid}?", "edge?", "provider?", "onprem@DNS servers"], "autoPeering": true,
          "note": "A query for an on-premises domain reaches the resolver's inbound endpoint in the shared services VNet through the hub firewall (routing intent), matches a rule in the forwarding ruleset and leaves through the outbound endpoint to the on-premises DNS servers over the virtual hub's hybrid connection; with routing intent that traffic to on-premises crosses the hub firewall too (not drawn twice).", "ref": "learn-resolver-hybrid-dns" },
        "*": { "steps": ["spoke@VM", "{vhub}", "{host:dns.vhub}?", "{dns}@inbound to outbound endpoint", "ruleset", "{hybrid}?", "edge?", "provider?", "onprem@DNS servers"], "autoPeering": true,
          "note": "A query for an on-premises domain reaches the resolver's inbound endpoint in the shared services VNet through the virtual hub router, matches a rule in the forwarding ruleset and leaves through the outbound endpoint to the on-premises DNS servers over the virtual hub's hybrid connection (not inspected).", "ref": "learn-resolver-hybrid-dns" } },
      "inbound": { "byHub": true,
        "intent": { "steps": ["onprem@DNS server, conditional forwarder", "provider?", "edge?", "{hybrid}", "{host:hybrid.vhubfw}?", "{host:dns.vhubfw}?", "{dns}@inbound endpoint", "azure_dns", "dns_zones"], "autoPeering": true,
          "note": "On-premises DNS servers conditionally forward the Azure zones to the resolver's inbound endpoint in the shared services VNet, over the virtual hub's hybrid connection and, with routing intent, the hub firewall; Azure-provided DNS answers from the private DNS zones linked to the shared services VNet.", "ref": "aac-vwan-dns" },
        "*": { "steps": ["onprem@DNS server, conditional forwarder", "provider?", "edge?", "{hybrid}", "{host:hybrid.vhubfw}?", "{host:dns.vhubfw}?", "{dns}@inbound endpoint", "azure_dns", "dns_zones"], "autoPeering": true,
          "note": "On-premises DNS servers conditionally forward the Azure zones to the resolver's inbound endpoint in the shared services VNet, over the virtual hub's hybrid connection (not inspected); Azure-provided DNS answers from the private DNS zones linked to the shared services VNet.", "ref": "aac-vwan-dns" } }
    } }
  },
  "vwanCross": {
    "vwan-inspected": { "steps": ["spoke", "peering:src_hub?", "{src_hub.firewall}", "link", "{dst_hub.firewall}", "peering:dst?", "dst.spoke"], "matrix": "vWAN · inspected in both hubs",
      "note": "Routing intent (private traffic policy) sends inter-hub traffic through the firewall in both secured hubs: {src_hub} and {dst_hub}.", "ref": "learn-vwan-routing-intent" },
    "vwan-partial": { "steps": ["spoke", "peering:src_hub?", "{src_hub.vhub}", "link", "{dst_hub.vhub}", "peering:dst?", "dst.spoke"], "matrix": "vWAN · inspected in {fw_hub} only",
      "note": "Only {fw_hub} has a security solution with routing intent, so the flow is inspected there; {open_hub} has none, so its side isn't inspected. Inter-hub inspection needs routing intent on all hubs to keep the routing symmetric between the security solutions: confirm this design.", "ref": "learn-vwan-routing-intent" },
    "vwan-direct": { "steps": ["spoke", "peering:src_hub?", "{src_hub.hub_router}", "link", "{dst_hub.hub_router}", "peering:dst?", "dst.spoke"], "matrix": "vWAN · not inspected",
      "note": "Not inspected: without a private traffic routing policy in either hub, the virtual hub routers carry the traffic between {src_hub} and {dst_hub} (hub-to-hub); no hub firewall inspects the flow.", "ref": "learn-vwan-routing-intent" },
    "vwan-same-hub": { "steps": ["spoke", "peering:src_hub?", "{src_hub.firewall}", "peering:dst?", "dst.spoke"], "matrix": "Via {src_hub} hub firewall",
      "note": "Both regions' VNets connect to the {src_hub} virtual hub: routing intent (private traffic policy) sends the flow through its firewall.", "ref": "learn-vwan-routing-intent" },
    "vwan-same-hub-direct": { "steps": ["spoke", "peering:src_hub?", "{src_hub.hub_router}", "peering:dst?", "dst.spoke"], "matrix": "Via {src_hub} virtual hub · not inspected",
      "note": "Both regions' VNets connect to the {src_hub} virtual hub: the flow goes through its router and isn't inspected (no routing intent, or no security solution in the hub).", "ref": "learn-vwan-about" },
    "vwan-different": { "steps": [], "matrix": "No route: different virtual WANs",
      "note": "No route: {src_hub} is in virtual WAN {src_wan} and {dst_hub} in virtual WAN {dst_wan}. Virtual WANs are isolated from each other: virtual hubs in different virtual WANs don't communicate.", "ref": "learn-vwan-about" },
  },
  "vwanChecks": [
    { "id": "vwan-intent-no-security", "when": "vwan_hub == 'yes' && routing_intent == 'yes'", "require": "hub_security != 'none'", "severity": "error",
      "message": "{name}: routing intent is on, but this virtual hub has no security solution. Routing policies need Azure Firewall, an NVA or a SaaS solution deployed in the hub (a firewall NVA in a spoke VNet can't be the next hop), so this hub's east-west, egress and on-premises paths aren't inspected. Set its Hub security, or turn routing intent off.", "ref": "learn-vwan-routing-intent" },
    { "id": "vwan-remote-full-hub", "when": "vwan_minimal == 'yes' && uses_remote == 'yes' && remote_hub_pattern in ['full-hub','minimal-hub']", "require": "vwan_remote_issue == 'none'", "severity": "error",
      "message": "{name}: a minimal virtual hub takes capabilities from a full virtual hub in the same virtual WAN, over hub-to-hub, but its remote hub {remote_hub_name} is {vwan_remote_issue}. Pick a full hub in virtual WAN {vwan_name}." },
    { "id": "vwan-minimal-firewall", "when": "vwan_minimal == 'yes'", "require": "fw_state != 'remote'", "severity": "warning",
      "message": "{name}: Firewall is set to From the remote hub, but a virtual hub can't use the firewall of another secured hub, so this hub has none. Set Firewall to Local (secured hub) or Not needed.", "ref": "learn-vwan-faq" }
  ],
  "vwanLinkChecks": [
    { "id": "vwan-bowtie", "when": "kind == 'hub' && topology == 'vwan' && shared_circuits != 'none' && aspath_both == 'no'", "require": "shared_circuits == 'none'", "severity": "warning",
      "message": "Virtual hubs {name}: {shared_circuits} connect to both hubs (bow-tie). Virtual WAN currently prefers the ExpressRoute circuit path over hub-to-hub for traffic between the two hubs' VNets, which Microsoft doesn't encourage. Set AS Path as the hub routing preference of the virtual hubs (traffic then uses hub-to-hub through the virtual hub routers), or connect one hub to several circuits (different providers) and use hub-to-hub for inter-region traffic.", "ref": "learn-vwan-faq" },
    { "id": "vwan-bowtie-aspath", "when": "kind == 'hub' && topology == 'vwan' && shared_circuits != 'none' && aspath_both == 'yes'", "require": "shared_circuits == 'none'", "severity": "info",
      "message": "Virtual hubs {name}: {shared_circuits} connect to both hubs (bow-tie); with AS Path as the hub routing preference of both hubs, traffic between their VNets uses hub-to-hub rather than the ExpressRoute path.", "ref": "learn-vwan-faq" }
  ]
});

Object.assign(window.RULES, /* Global-entry data. Origins are active or backup;
   routing methods, weights and Private Link are talking points or "Not modelled". "inPath": clients connect through
   the service (else it only answers DNS); "kind": the diagram's short description. Plain JSON below. */ {
  "globalEntry": {
    "types": {
      "none": { "label": "None" },
      "front-door": {
        "label": "Azure Front Door", "short": "Front Door", "badge": "AFD", "inPath": true, "kind": "Edge CDN",
        "refs": ["learn-front-door", "learn-front-door-routing-methods"],
        "points": [
          { "key": true, "text": "Clients connect to Front Door, which forwards each request to a healthy origin. Among origins it selects by priority, then latency, then weight; the explorer shows origins only as active or backup.", "ref": "learn-front-door-routing-methods" },
          { "key": true, "text": "Restrict each origin so it accepts traffic only from your Front Door profile.", "ref": "learn-fd-origin-security" }
        ]
      },
      "traffic-manager": {
        "label": "Azure Traffic Manager", "short": "Traffic Manager", "badge": "TM", "inPath": false, "kind": "DNS only",
        "refs": ["learn-traffic-manager", "learn-traffic-manager-routing"],
        "points": [
          { "key": true, "text": "Traffic Manager is DNS-based: it answers the client's DNS query with a healthy endpoint, and the client then connects to that endpoint directly, not through Traffic Manager.", "ref": "learn-traffic-manager" }
        ]
      },
      "third-party": {
        "label": "Third-party global load balancer/CDN", "short": "Global LB / CDN", "inPath": true, "kind": "Third party", "refs": [],
        "points": [ { "key": true, "text": "Confirm routing, health probes, origin security and failover with the vendor." } ]
      }
    },
    "roles": { "active": "Active", "backup": "Backup" }
  }
});
