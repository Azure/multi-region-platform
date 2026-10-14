/* examples.js: built-in example estates (fictional data) used by the New menu and ?example=<id>. */
(window.EXAMPLES = window.EXAMPLES || {})["contoso-estate"] = /* Plain JSON below (fictional company). */ {
  "format": 1,
  "title": "Geo Landing Zone Connectivity Explorer",
  "customer": "Contoso (fictional)",
  "global_entry": {
    "type": "front-door",
    "origins": [
      { "region": "westeurope", "role": "active" },
      { "region": "germanywestcentral", "role": "backup" }
    ]
  },
  "defaults": {
    "topology": "hub-spoke",
    "firewall": "azure-firewall",
    "ingress": "appgw-waf",
    "dns": "private-resolver",
    "dns_model": "centralized",
    "bastion": "bastion",
    "private_user_access": "entra-private-access"
  },
  "onprem": [
    { "id": "dc1", "name": "Primary DC", "interconnect": ["dc2"] },
    { "id": "dc2", "name": "Secondary DC" }
  ],
  "hybrid_connections": [
    { "id": "circuit-a", "type": "expressroute", "site": "dc1", "name": "Circuit A", "peering_location": "Amsterdam", "connection": "provider", "connects_to": ["westeurope", "germanywestcentral"] },
    { "id": "circuit-b", "type": "expressroute", "site": "dc2", "name": "Circuit B", "peering_location": "Frankfurt", "connection": "provider", "connects_to": ["germanywestcentral", "westeurope"] },
    { "id": "dc1-vpn", "type": "vpn", "site": "dc1", "connects_to": ["westeurope", "germanywestcentral"] },
    { "id": "dc2-vpn", "type": "vpn", "site": "dc2", "connects_to": ["germanywestcentral", "westeurope"] }
  ],
  "regions": [
    { "id": "westeurope", "name": "West Europe", "pattern": "full-hub" },
    { "id": "germanywestcentral", "name": "Germany West Central", "pattern": "full-hub" },
    { "id": "swedencentral", "name": "Sweden Central", "pattern": "minimal-hub", "remote_hub": "westeurope",
      "capabilities": { "firewall": "local", "dns": "local" } },
    { "id": "francecentral", "name": "France Central", "pattern": "remote-hub", "remote_hub": "westeurope",
      "ingress": "appgw-waf" },
    { "id": "italynorth", "name": "Italy North", "pattern": "disconnected", "ingress": "appgw-waf", "egress_nat": "nat-gateway",
      "bastion": "bastion" }
  ],
  "region_links": [
    { "from": "westeurope", "to": "germanywestcentral" },
    { "from": "westeurope", "to": "swedencentral" }
  ]
};

(window.EXAMPLES = window.EXAMPLES || {})["minimal-gsa"] = /* Plain JSON below (fictional company). */ {
  "format": 1,
  "title": "Geo Landing Zone Connectivity Explorer",
  "customer": "Fabrikam (fictional)",
  "defaults": {
    "topology": "vwan",
    "firewall": "azure-firewall",
    "ingress": "appgw-waf",
    "dns": "private-resolver",
    "dns_model": "centralized",
    "bastion": "bastion",
    "private_user_access": "entra-private-access",
    "routing_intent": true,
    "hub_routing_preference": "expressroute"
  },
  "vwans": [
    { "id": "vwan-global", "name": "Global" }
  ],
  "onprem": [
    { "id": "ho", "name": "Head Office" }
  ],
  "hybrid_connections": [
    { "id": "ho-er", "type": "expressroute", "site": "ho", "name": "Circuit A", "peering_location": "Washington DC", "connection": "provider", "connects_to": ["eastus2", "westus3"] },
    { "id": "ho-vpn", "type": "vpn", "site": "ho", "connects_to": ["eastus2", "westus3"] }
  ],
  "regions": [
    { "id": "eastus2", "name": "East US 2", "pattern": "full-hub", "vwan": "vwan-global" },
    { "id": "westus3", "name": "West US 3", "pattern": "full-hub", "vwan": "vwan-global" }
  ]
};
