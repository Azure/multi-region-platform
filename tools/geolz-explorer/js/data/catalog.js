/* catalog.js: product catalogue, Azure regions and ExpressRoute peering-location data. */
window.CATALOG = /* catalog.js: roles and products. Everything below this line is plain JSON. */ {
  "virtualHub": {
    "about": "Allow-list of a Virtual WAN virtual hub (Microsoft-managed): only what Virtual WAN offers in the hub. Any other role or product (also a future one) is drawn in the region's shared services VNet, else its spoke.",
    "roles": ["hub_router", "er_gateway", "vpn_gateway", "firewall"],
    "products": ["virtual-hub-router", "expressroute", "vpn", "azure-firewall", "vhub-security"]
  },
  "roles": {
    "ingress":     { "label": "Public ingress", "group": "security",
                     "placement": { "hub-spoke": ["hub", "spoke"] } },
    "firewall":    { "label": "Firewall / NVA", "group": "security", "perHub": ["vwan"],
                     "placement": { "hub-spoke": ["hub", "spoke"] },
                     "vwan": { "label": "Hub security", "default": "azure-firewall", "none": "None (virtual hub without firewall)" } },
    "dns":         { "label": "DNS resolution", "group": "shared",
                     "placement": { "hub-spoke": ["hub", "spoke"] } },
    "hub_router":  { "label": "Virtual hub router", "group": "connectivity", "derived": "vhub",
                     "placement": { "hub-spoke": [] }, "products": { "vwan": "virtual-hub-router" } },
    "er_gateway":  { "label": "ExpressRoute gateway", "group": "connectivity", "derived": "hybrid",
                     "placement": { "hub-spoke": ["hub"] },
                     "connection": "expressroute", "products": { "hub-spoke": "expressroute", "vwan": "expressroute" } },
    "vpn_gateway": { "label": "VPN Gateway", "group": "connectivity", "derived": "hybrid",
                     "placement": { "hub-spoke": ["hub"] },
                     "connection": "vpn", "products": { "hub-spoke": "vpn", "vwan": "vpn" },
                     "line": "Site-to-site VPN (IPsec) over internet" },
    "private_user_access": { "label": "Private user access (ZTNA)", "group": "connectivity",
                     "placement": { "hub-spoke": ["hub", "spoke"] } },
    "bastion":     { "label": "Remote admin access", "group": "shared",
                     "placement": { "hub-spoke": ["hub", "spoke"] } },
    "egress_nat":  { "label": "Spoke-local egress", "group": "spoke",
                     "placement": { "hub-spoke": ["spoke"] } }
  },
  "places": { "hub": "Hub VNet", "virtual-hub": "Virtual hub", "shared-services": "Shared services VNet", "spoke": "Spoke VNet" },
  "capabilities": {
    "about": "A minimal hub's capabilities per topology: [editor label, short name]. Each is Local, From the remote hub or Not needed.",
    "hub-spoke": { "firewall": ["Firewall", "firewall"], "dns": ["DNS", "DNS"], "hybrid": ["Hybrid gateway", "on-premises"],
      "ingress": ["Ingress (WAF)", "public ingress"], "bastion": ["Bastion", "Bastion"],
      "private_user_access": ["Private access", "private access"] },
    "vwan": { "firewall": ["Firewall (secured hub)", "firewall"], "hybrid": ["Hybrid gateway", "on-premises"],
      "shared": ["Local shared services", "shared services"] }
  },
  "groups": {
    "security":     { "label": "Security",             "color": "#1D3D70" },
    "connectivity": { "label": "Connectivity",         "color": "#7A5C00" },
    "shared":       { "label": "Shared services",      "color": "#4A5560" },
    "spoke":        { "label": "Spoke-level services", "color": "#7B4B2A" }
  },
  "generic": {
    "internet": { "label": "Internet", "sub": "public endpoints" },
    "users":    { "label": "Users", "sub": "corporate and remote" },
    "admins":   { "label": "Admins", "sub": "browser / native client" },
    "spoke":    { "label": "Workload", "sub": "spoke VNet" },
    "spoke2":   { "label": "Peer workload", "sub": "spoke VNet" },
    "onprem":   { "label": "On-premises" },
    "edge":     { "label": "Peering location", "sub": "Microsoft edge (MSEE)" },
    "azure_dns": { "label": "Azure-provided DNS", "sub": "168.63.129.16 · resolver upstream", "badge": "DNS" },
    "dns_zones": { "label": "Private DNS zones (global)", "sub": "privatelink.* · linked to resolver hubs", "badge": "PDZ",
                   "vwanSub": "linked to shared services VNets" },
    "own_zones": { "label": "Own private DNS zones", "sub": "linked to this spoke only", "badge": "PDZ" },
    "ruleset":   { "label": "DNS forwarding ruleset", "step": true },
    "pe_ip":     { "label": "Private endpoint IP (the answer)", "step": true }
  },
  "products": {
    "azure-firewall": {
      "role": "firewall", "label": "Azure Firewall", "vendor": "Microsoft", "badge": "FW", "ref": "learn-azure-firewall",
      "points": [{ "text": "Managed firewall with built-in high availability (no extra load balancer needed) that autoscales; deploy it across availability zones for zone redundancy.", "ref": "learn-fw-features" },
                 { "text": "Firewall Policy can be inherited: a parent policy for the estate, child policies per region.", "ref": "learn-fw-policy" }],
      "vwan": { "option": "Azure Firewall (secured virtual hub)", "sub": "secured virtual hub",
        "points": [{ "text": "In a virtual hub, Azure Firewall makes it a secured virtual hub: security and routing policies configured with Azure Firewall Manager, with built-in routing (no UDRs).", "ref": "learn-secured-vhub" },
                   { "text": "Each virtual hub needs its own firewall: a hub can't use the firewall of another secured hub.", "ref": "learn-vwan-faq" }] }
    },
    "third-party-firewall": {
      "role": "firewall", "label": "Third-party firewall (NVA)", "vendor": "Third party", "badge": "NVA", "ref": "aac-hub-spoke",
      "sub": "HA pair + load balancer", "where": ["hub", "spoke", "shared-services"],
      "vwan": { "option": "Third-party firewall (NVA) in the shared services VNet", "sub": "in the shared services VNet",
        "points": [{ "text": "A generic NVA can't be deployed in a virtual hub (only the partner NVAs listed for Virtual WAN hubs): it runs in a spoke VNet connected to the hub, here the shared services VNet. Static routes on its VNet connection (for example 0.0.0.0/0, propagated to the other connections) send traffic to it; workloads whose traffic must pass it are indirect spokes peered to the NVA VNet, with UDRs.", "ref": "learn-vwan-indirect-spoke" },
                   { "text": "With a security solution in the virtual hub, routing intent with static routes can inspect traffic in the hub first and then forward selected prefixes (indirect spokes, tunnels, forced-tunnel internet) to an NVA in a spoke.", "ref": "learn-vwan-ri-static" }] },
      "points": [{ "text": "Deploy at least two instances for high availability, for example behind a Standard Load Balancer with HA ports; confirm with the vendor how the design keeps stateful traffic symmetric (internet flows typically need SNAT).", "ref": "aac-nva-ha" },
                 { "text": "Check that the vendor supports and validates the chosen topology (hub VNet or Virtual WAN hub); confirm who handles sizing, licensing and patching.", "ref": "aac-nva-ha" }]
    },
    "vhub-security": {
      "role": "firewall", "label": "Third-party security in the hub", "short": "Third-party security", "vendor": "Third party",
      "badge": "NVA", "ref": "learn-vwan-nva", "sub": "NVA or SaaS in the virtual hub", "where": ["virtual-hub"],
      "alt": { "hub": "third-party-firewall", "spoke": "third-party-firewall", "shared-services": "third-party-firewall" },
      "vwan": { "option": "Third-party security in the hub (integrated NVA or SaaS)" },
      "points": [{ "text": "Only the partner NVAs listed for Virtual WAN hubs can be deployed in a virtual hub, as a managed application from Azure Marketplace (not any Marketplace NVA).", "ref": "learn-vwan-nva" },
                 { "text": "A next-generation firewall NVA or a SaaS security solution deployed in the virtual hub, which routing intent can use as next hop. Only some NVAs are eligible as the routing intent next hop: confirm with the vendor that the offering runs in a Virtual WAN hub and can be the next hop.", "ref": "learn-vwan-routing-intent" },
                 { "text": "A virtual hub hosts one integrated NVA (SD-WAN, NGFW or dual-role) and at most one SaaS security solution; confirm sizing, licensing and support with the vendor.", "ref": "aac-vwan" }]
    },
    "virtual-hub-router": {
      "role": "hub_router", "label": "Virtual hub router", "vendor": "Microsoft", "badge": "RT", "ref": "learn-vwan-about",
      "sub": "built in", "where": ["virtual-hub"],
      "points": [{ "text": "Built into every virtual hub of a Standard virtual WAN: it manages the routes between the hub's gateways and carries transit between the virtual networks connected to the hub and between hubs.", "ref": "learn-vwan-about" },
                 { "text": "With routing intent, Virtual WAN routes VNet and on-premises traffic to the routing policy's next hop without processing it through the virtual hub router.", "ref": "learn-vwan-routing-intent" }]
    },
    "appgw-waf": {
      "role": "ingress", "label": "Application Gateway WAF", "vendor": "Microsoft", "badge": "AG", "ref": "learn-appgw-waf",
      "sub": "regional L7 + WAF",
      "points": ["Layer-7 load balancer deployed in your virtual network, with WAF managed rule sets and a Bot Manager rule set.",
                 "Terminates TLS at the gateway; end-to-end TLS to the backend is supported."],
      "vwan": { "points": [{ "text": "Virtual WAN: internet ingress isn't a routing intent traffic class; terminate the client connection at Application Gateway in a spoke virtual network (here the shared services VNet), or publish with a DNAT rule on the hub firewall.", "ref": "aac-vwan" }] }
    },
    "expressroute": {
      "role": "er_gateway", "label": "ExpressRoute gateway", "vendor": "Microsoft", "badge": "ER",
      "ref": "learn-expressroute", "sub": "to ExpressRoute circuits",
      "points": ["Private connectivity with an SLA that does not cross the internet.",
                 { "text": "Plan ExpressRoute gateways in more than one region for disaster recovery and link the circuits to them; confirm that hybrid access survives the loss of one region.", "ref": "learn-er-resiliency" }]
    },
    "vpn": {
      "role": "vpn_gateway", "label": "VPN Gateway", "vendor": "Microsoft", "badge": "VPN", "ref": "learn-vpn-gateway",
      "sub": "site-to-site IPsec",
      "points": ["IPsec/IKE tunnels over the public internet; unlike ExpressRoute, latency isn't consistent. Compare setup time and cost with ExpressRoute for your sites.",
                 { "text": "Use active-active gateways and two tunnels per site for resilience.", "ref": "learn-vpn-active-active" }]
    },
    "private-resolver": {
      "role": "dns", "label": "DNS Private Resolver", "vendor": "Microsoft", "badge": "DNS", "ref": "learn-private-resolver",
      "sub": "inbound + outbound endpoints",
      "points": ["Managed inbound and outbound DNS endpoints: no DNS servers to patch.",
                 "Forwarding rulesets send on-premises domains to on-premises DNS servers."],
      "vwan": { "points": [{ "text": "Private DNS zones can't be linked to a Virtual WAN hub: deploy the resolver in a virtual network connected to the hub (a virtual hub extension) and link the zones to that network.", "ref": "aac-vwan-dns" }] }
    },
    "entra-private-access": {
      "role": "private_user_access", "label": "Entra Private Access", "vendor": "Microsoft", "badge": "EPA",
      "ref": "learn-entra-private-access", "sub": "private network connector",
      "points": ["Identity-centric access with Conditional Access per application segment.",
                 { "text": "Connectors make outbound-only connections; use at least two connectors per connector group (for example, one group per hub) for high availability.", "ref": "learn-entra-connectors" }]
    },
    "third-party-ztna": {
      "role": "private_user_access", "label": "Third-party private access (ZTNA)", "vendor": "Third party", "badge": "ZTNA",
      "sub": "app connector",
      "points": ["Vendor-specific: confirm with the vendor how users reach applications (per-app access, client requirements, inbound ports).",
                 "Vendor-specific: confirm the connector model with the vendor (outbound connections, placement in each hub that fronts private apps)."]
    },
    "nat-gateway": {
      "role": "egress_nat", "label": "NAT Gateway", "vendor": "Microsoft", "badge": "NAT", "ref": "learn-nat-gateway",
      "sub": "outbound SNAT",
      "points": ["Scalable outbound SNAT with static public IPs (up to 16 per NAT gateway); for inspection or FQDN filtering, pair it with Azure Firewall (NAT Gateway on the AzureFirewallSubnet)."]
    },
    "bastion": {
      "role": "bastion", "label": "Azure Bastion", "vendor": "Microsoft", "badge": "BA", "ref": "learn-bastion",
      "points": ["RDP and SSH from the browser or native client without public IPs on VMs."],
      "vwan": { "points": [{ "text": "Deploying Bastion in a Virtual WAN hub isn't supported: deploy it in a spoke virtual network and use IP-based connection to reach VMs in other virtual networks through the hub. With a secured virtual hub, the Bastion VNet's connection must not propagate the default route (0.0.0.0/0).", "ref": "learn-bastion-faq" }] }
    }
  }
};

window.AZURE_REGIONS = /* catalog.js: Azure regions, built only from Microsoft Learn "List of Azure regions"
   (last updated 09/23/2026). "area" groups geographies as that page does. Plain JSON below. */ {
  "source": "https://learn.microsoft.com/en-us/azure/reliability/regions-list",
  "areas": ["Americas", "Europe", "Middle East", "Africa", "Asia Pacific"],
  "regions": [
    {"id": "australiacentral", "name": "Australia Central", "zones": null, "paired": null, "location": "Canberra", "geography": "Australia", "area": "Asia Pacific"},
    {"id": "australiaeast", "name": "Australia East", "zones": 3, "paired": "Australia Southeast", "location": "New South Wales", "geography": "Australia", "area": "Asia Pacific"},
    {"id": "australiasoutheast", "name": "Australia Southeast", "zones": null, "paired": "Australia East", "location": "Victoria", "geography": "Australia", "area": "Asia Pacific"},
    {"id": "austriaeast", "name": "Austria East", "zones": 3, "paired": null, "location": "Vienna", "geography": "Austria", "area": "Europe"},
    {"id": "belgiumcentral", "name": "Belgium Central", "zones": 3, "paired": null, "location": "Brussels", "geography": "Belgium", "area": "Europe"},
    {"id": "brazilsouth", "name": "Brazil South", "zones": 3, "paired": "South Central US", "location": "Sao Paulo State", "geography": "Brazil", "area": "Americas"},
    {"id": "canadacentral", "name": "Canada Central", "zones": 3, "paired": "Canada East", "location": "Toronto", "geography": "Canada", "area": "Americas"},
    {"id": "canadaeast", "name": "Canada East", "zones": null, "paired": "Canada Central", "location": "Quebec", "geography": "Canada", "area": "Americas"},
    {"id": "centralindia", "name": "Central India", "zones": 3, "paired": "South India", "location": "Pune", "geography": "India", "area": "Asia Pacific"},
    {"id": "centralus", "name": "Central US", "zones": 3, "paired": "East US 2", "location": "Iowa", "geography": "United States", "area": "Americas"},
    {"id": "chilecentral", "name": "Chile Central", "zones": 3, "paired": null, "location": "Santiago", "geography": "Chile", "area": "Americas"},
    {"id": "denmarkeast", "name": "Denmark East", "zones": 3, "paired": null, "location": "Copenhagen", "geography": "Denmark", "area": "Europe"},
    {"id": "eastasia", "name": "East Asia", "zones": 3, "paired": "Southeast Asia", "location": "Hong Kong", "geography": "Asia Pacific", "area": "Asia Pacific"},
    {"id": "eastus", "name": "East US", "zones": 3, "paired": "West US", "location": "Virginia", "geography": "United States", "area": "Americas"},
    {"id": "eastus2", "name": "East US 2", "zones": 4, "paired": "Central US", "location": "Virginia", "geography": "United States", "area": "Americas"},
    {"id": "francecentral", "name": "France Central", "zones": 3, "paired": null, "location": "Paris", "geography": "France", "area": "Europe"},
    {"id": "germanywestcentral", "name": "Germany West Central", "zones": 3, "paired": null, "location": "Frankfurt", "geography": "Germany", "area": "Europe"},
    {"id": "indiasouthcentral", "name": "India South Central", "zones": 3, "paired": "Central India", "location": "Hyderabad", "geography": "India", "area": "Asia Pacific"},
    {"id": "indonesiacentral", "name": "Indonesia Central", "zones": 3, "paired": null, "location": "Jakarta", "geography": "Indonesia", "area": "Asia Pacific"},
    {"id": "israelcentral", "name": "Israel Central", "zones": 3, "paired": null, "location": "Israel", "geography": "Israel", "area": "Middle East"},
    {"id": "italynorth", "name": "Italy North", "zones": 3, "paired": null, "location": "Milan", "geography": "Italy", "area": "Europe"},
    {"id": "japaneast", "name": "Japan East", "zones": 3, "paired": "Japan West", "location": "Tokyo, Saitama", "geography": "Japan", "area": "Asia Pacific"},
    {"id": "japanwest", "name": "Japan West", "zones": 3, "paired": "Japan East", "location": "Osaka", "geography": "Japan", "area": "Asia Pacific"},
    {"id": "koreacentral", "name": "Korea Central", "zones": 3, "paired": "Korea South", "location": "Seoul", "geography": "Korea", "area": "Asia Pacific"},
    {"id": "koreasouth", "name": "Korea South", "zones": null, "paired": "Korea Central", "location": "Busan", "geography": "Korea", "area": "Asia Pacific"},
    {"id": "malaysiawest", "name": "Malaysia West", "zones": 3, "paired": null, "location": "Kuala Lumpur", "geography": "Malaysia", "area": "Asia Pacific"},
    {"id": "mexicocentral", "name": "Mexico Central", "zones": 3, "paired": null, "location": "Querétaro State", "geography": "Mexico", "area": "Americas"},
    {"id": "newzealandnorth", "name": "New Zealand North", "zones": 3, "paired": null, "location": "Auckland", "geography": "New Zealand", "area": "Asia Pacific"},
    {"id": "northcentralus", "name": "North Central US", "zones": 3, "paired": "South Central US", "location": "Illinois", "geography": "United States", "area": "Americas"},
    {"id": "northeurope", "name": "North Europe", "zones": 3, "paired": "West Europe", "location": "Ireland", "geography": "Europe", "area": "Europe"},
    {"id": "norwayeast", "name": "Norway East", "zones": 3, "paired": null, "location": "Norway", "geography": "Norway", "area": "Europe"},
    {"id": "polandcentral", "name": "Poland Central", "zones": 3, "paired": null, "location": "Warsaw", "geography": "Poland", "area": "Europe"},
    {"id": "qatarcentral", "name": "Qatar Central", "zones": 3, "paired": null, "location": "Doha", "geography": "Qatar", "area": "Middle East"},
    {"id": "southafricanorth", "name": "South Africa North", "zones": 3, "paired": null, "location": "Johannesburg", "geography": "South Africa", "area": "Africa"},
    {"id": "southcentralus", "name": "South Central US", "zones": 3, "paired": "North Central US", "location": "Texas", "geography": "United States", "area": "Americas"},
    {"id": "southindia", "name": "South India", "zones": null, "paired": "Central India", "location": "Chennai", "geography": "India", "area": "Asia Pacific"},
    {"id": "southeastasia", "name": "Southeast Asia", "zones": 3, "paired": "East Asia", "location": "Singapore", "geography": "Asia Pacific", "area": "Asia Pacific"},
    {"id": "spaincentral", "name": "Spain Central", "zones": 3, "paired": null, "location": "Madrid", "geography": "Spain", "area": "Europe"},
    {"id": "swedencentral", "name": "Sweden Central", "zones": 3, "paired": null, "location": "Gävle", "geography": "Sweden", "area": "Europe"},
    {"id": "switzerlandnorth", "name": "Switzerland North", "zones": 3, "paired": null, "location": "Zurich", "geography": "Switzerland", "area": "Europe"},
    {"id": "uaenorth", "name": "UAE North", "zones": 3, "paired": null, "location": "Dubai", "geography": "UAE", "area": "Middle East"},
    {"id": "uksouth", "name": "UK South", "zones": 3, "paired": "UK West", "location": "London", "geography": "United Kingdom", "area": "Europe"},
    {"id": "ukwest", "name": "UK West", "zones": null, "paired": "UK South", "location": "Cardiff", "geography": "United Kingdom", "area": "Europe"},
    {"id": "westcentralus", "name": "West Central US", "zones": null, "paired": "West US 2", "location": "Wyoming", "geography": "United States", "area": "Americas"},
    {"id": "westeurope", "name": "West Europe", "zones": 3, "paired": "North Europe", "location": "Netherlands", "geography": "Europe", "area": "Europe"},
    {"id": "westindia", "name": "West India", "zones": null, "paired": "South India", "location": "Mumbai", "geography": "India", "area": "Asia Pacific"},
    {"id": "westus", "name": "West US", "zones": null, "paired": "East US", "location": "California", "geography": "United States", "area": "Americas"},
    {"id": "westus2", "name": "West US 2", "zones": 3, "paired": "West Central US", "location": "Washington", "geography": "United States", "area": "Americas"},
    {"id": "westus3", "name": "West US 3", "zones": 3, "paired": "East US", "location": "Phoenix", "geography": "United States", "area": "Americas"}
  ]
};

window.ER_LOCATIONS = {
  "source": "https://learn.microsoft.com/en-us/azure/expressroute/expressroute-locations-providers",
  "geopolitical": [
    { "name": "North America", "regions": ["eastus", "westus", "eastus2", "westus2", "westus3", "centralus",
      "southcentralus", "northcentralus", "westcentralus", "canadacentral", "canadaeast", "mexicocentral"],
      "locations": ["Atlanta", "Atlanta2", "Atlanta Metro", "Chicago", "Chicago2", "Chicago Metro", "Dallas",
      "Dallas2", "Dallas Metro", "Denver", "Las Vegas", "Los Angeles", "Los Angeles2", "Miami", "Minneapolis",
      "Montreal", "New York", "New York2", "New York Metro", "Phoenix", "Phoenix2", "Quebec City",
      "Queretaro (Mexico)", "Quincy", "San Antonio", "Seattle", "Silicon Valley", "Silicon Valley2",
      "Silicon Valley Metro", "Toronto", "Toronto2", "Toronto Metro", "Vancouver", "Washington DC", "Washington DC2",
      "Washington DC Metro"] },
    { "name": "South America", "regions": ["brazilsouth"], "locations": ["Campinas", "Rio de Janeiro", "Sao Paulo",
      "Sao Paulo2", "Santiago"] },
    { "name": "Europe", "regions": ["austriaeast", "belgiumcentral", "denmarkeast", "francecentral", "germanywestcentral", "italynorth", "northeurope", "norwayeast", "polandcentral",
      "spaincentral", "swedencentral", "switzerlandnorth", "ukwest", "uksouth", "westeurope"],
      "locations": ["Amsterdam", "Amsterdam2", "Amsterdam Metro", "Berlin", "Brussels", "Brussels2",
      "Brussels Metro", "Copenhagen", "Dublin", "Dublin2", "Dublin Metro", "Frankfurt", "Frankfurt2",
      "Frankfurt Metro", "Geneva", "London", "London2", "Madrid", "Madrid2", "Madrid Metro", "Marseille", "Milan",
      "Milan2", "Milan Metro", "Munich", "Newport (Wales)", "Oslo", "Oslo2", "Oslo Metro", "Paris", "Paris2",
      "Stavanger", "Stockholm", "Stockholm2", "Stockholm Metro", "Vienna", "Vienna2", "Vienna Metro", "Warsaw",
      "Zurich", "Zurich2", "Zurich Metro"] },
    { "name": "South Africa", "regions": ["southafricanorth"], "locations": ["Cape Town",
      "Johannesburg"] },
    { "name": "Asia", "regions": ["eastasia", "malaysiawest", "southeastasia"], "locations": ["Bangkok", "Hong Kong",
      "Hong Kong2", "Jakarta", "Jakarta2", "Jakarta Metro", "Kuala Lumpur", "Kuala Lumpur2", "Singapore",
      "Singapore2", "Taipei", "Taipei2", "Taipei Metro"] },
    { "name": "India", "regions": ["westindia", "centralindia", "southindia"], "locations": ["Chennai", "Chennai2",
      "Mumbai", "Mumbai2", "Mumbai Metro", "Pune"] },
    { "name": "Israel", "regions": ["israelcentral"], "locations": ["Tel Aviv", "Tel Aviv2"] },
    { "name": "Japan", "regions": ["japanwest", "japaneast"], "locations": ["Osaka", "Tokyo", "Tokyo2", "Tokyo3"] },
    { "name": "South Korea", "regions": ["koreacentral", "koreasouth"], "locations": ["Busan", "Seoul", "Seoul2"] },
    { "name": "Qatar", "regions": ["qatarcentral"], "locations": ["Doha", "Doha2"] },
    { "name": "UAE", "regions": ["uaenorth"], "locations": ["Abu Dhabi", "Dubai", "Dubai2"] },
    { "name": "Australia Government", "regions": ["australiacentral"], "locations": ["Canberra",
      "Canberra2"] },
    { "name": "Oceania", "regions": ["australiaeast", "australiasoutheast", "newzealandnorth"], "locations":
      ["Auckland", "Auckland2", "Melbourne", "Melbourne2", "Melbourne Metro", "Perth", "Sydney", "Sydney2",
      "Sydney Metro"] }
  ],
  "countries": {
    "United States": ["Atlanta", "Chicago", "Dallas", "Denver", "Las Vegas", "Los Angeles", "Miami", "Minneapolis", "New York", "Phoenix", "Quincy", "San Antonio", "Seattle", "Silicon Valley", "Washington DC"],
    "Canada": ["Montreal", "Quebec City", "Toronto", "Vancouver"],
    "Mexico": ["Queretaro (Mexico)"],
    "Brazil": ["Campinas", "Rio de Janeiro", "Sao Paulo"],
    "Chile": ["Santiago"],
    "Netherlands": ["Amsterdam"],
    "Germany": ["Berlin", "Frankfurt", "Munich"],
    "Belgium": ["Brussels"],
    "Denmark": ["Copenhagen"],
    "Ireland": ["Dublin"],
    "Switzerland": ["Geneva", "Zurich"],
    "United Kingdom": ["London", "Newport (Wales)"],
    "Spain": ["Madrid"],
    "France": ["Marseille", "Paris"],
    "Italy": ["Milan"],
    "Norway": ["Oslo", "Stavanger"],
    "Sweden": ["Stockholm"],
    "Austria": ["Vienna"],
    "Poland": ["Warsaw"],
    "South Africa": ["Cape Town", "Johannesburg"],
    "Thailand": ["Bangkok"],
    "Hong Kong": ["Hong Kong"],
    "Indonesia": ["Jakarta"],
    "Malaysia": ["Kuala Lumpur"],
    "Singapore": ["Singapore"],
    "Taiwan": ["Taipei"],
    "India": ["Chennai", "Mumbai", "Pune"],
    "Israel": ["Tel Aviv"],
    "Japan": ["Osaka", "Tokyo"],
    "Korea": ["Busan", "Seoul"],
    "Qatar": ["Doha"],
    "UAE": ["Abu Dhabi", "Dubai"],
    "Australia": ["Canberra", "Melbourne", "Perth", "Sydney"],
    "New Zealand": ["Auckland"]
  }
};
