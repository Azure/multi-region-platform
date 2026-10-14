// Region planning workbook — reference lists: the checks of step 2, the choices of step 3, and their options.
// The wording follows the articles in content/. Change a question here and it changes in the page and in the Excel export.
(function (global) {
  'use strict';

  const O = {
    reason: ['Markets and users', 'Datacenter and partner locations', 'Planned launches or migrations', 'Anticipated growth and proximity', 'Geographic concentration risk', 'Other'],
    yesNo: ['Yes', 'No', 'To confirm'],
    comply: ['Yes', 'No (mandatory gap)', 'To validate', 'Not applicable'],
    known: ['Known', 'Partly known (guardrails set)', 'Not known'],
    archetype: ['Hybrid-Connected Applications', 'Isolated Cloud-Native or AI Applications', 'Connected Cloud-Native or AI Applications', 'Interconnected Application Portfolios', 'Several (see note)'],
    capability: ['Yes', 'No (mandatory gap)', 'Gap accepted with a condition', 'To validate', 'Not applicable'],
    outcome: ['Excluded', 'Candidate', 'Conditional', 'Qualified', 'No deeper assessment'],
    topology: ['Hub-and-spoke virtual networks', 'Azure Virtual WAN'],
    estateTopology: ['Hub-and-spoke virtual networks', 'Azure Virtual WAN', 'Both', 'No hub yet'],
    managed: ['Azure Virtual Network Manager', 'Infrastructure as code (peerings or hub connections)', 'Manual configuration'],
    estateHybrid: ['ExpressRoute', 'ExpressRoute and VPN', 'VPN', 'SD-WAN or network virtual appliance', 'None'],
    placement: ['Local', 'Remote', 'Global', 'Not required'],
    hybrid: ['Not required', 'Reuse', 'Change'],
    hybridReason: ['Peering-location diversity or resiliency', 'Latency from on-premises locations', 'Bandwidth or gateway capacity', 'A capability that needs a local gateway (for example, FastPath)', 'On-premises path must survive the loss of another region', 'Other'],
  };

  // Tone of an answer: good, warn, bad. Anything else shows no status icon.
  const TONE = {
    'Yes': 'good', 'Known': 'good', 'Partly known (guardrails set)': 'good',
    'To confirm': 'warn', 'To validate': 'warn', 'Gap accepted with a condition': 'warn', 'Not known': 'warn',
    'No': 'bad', 'No (mandatory gap)': 'bad',
  };
  // Outcome to status icon kind.
  const OUTCOME_ICON = { 'Qualified': 'success', 'Conditional': 'warning', 'Candidate': 'info', 'Excluded': 'error', 'No deeper assessment': 'neutral' };

  // ── step 2: the four checks. `neutral` rows record a requirement, not a pass or fail. `ev` names the evidence shown under the answer.
  const CHECKS = [
    { n: 1, title: 'Business and geography', q: 'Where do we need Azure presence?', href: 'business-and-geography.html',
      decision: 'Confirm that the region has sufficient business value to justify deeper assessment.', rows: [
        { id: '1.1', label: 'Do we need Azure presence in this region?', opts: O.yesNo },
        { id: '1.2', label: 'What is the main business reason?', opts: O.reason, neutral: true },
      ] },
    { n: 2, title: 'Data and compliance', q: 'Are we allowed to operate here?', href: 'data-and-compliance.html',
      decision: 'Exclude a region when it cannot satisfy a mandatory data, compliance, or policy requirement.', rows: [
        { id: '2.1', label: 'Can the region meet the data residency and sovereignty requirements?', opts: O.comply },
        { id: '2.2', label: 'Can it meet the regulatory, industry, and company-policy requirements?', opts: O.comply },
      ] },
    { n: 3, title: 'Workload requirements and dependencies', q: 'What workload requirements and dependencies must the region support?', href: 'workload-requirements.html',
      decision: 'Identify and record the workload-driven platform requirements.', rows: [
        { id: '3.1', label: 'Are the workload requirements and dependencies known?', opts: O.known },
        { id: '3.2', label: 'Which Workload Landing Zone archetype fits best?', opts: O.archetype, neutral: true },
        { id: '3.3', label: 'Do the workloads need private access to on-premises or enterprise shared services?', opts: O.yesNo, neutral: true },
        { id: '3.4', label: 'Do the workloads require zone resiliency?', opts: O.yesNo, neutral: true },
      ] },
    { n: 4, title: 'Regional capability and availability', q: 'Which regions can support the identified workload requirements?', href: 'regional-capability.html',
      decision: 'Qualify candidate regions, documenting conditions, constraints, and unresolved validations.', rows: [
        { id: '4.1', label: 'Are the required services and SKUs available?', opts: O.capability, ev: 'services' },
        { id: '4.2', label: 'Do availability zones meet the resiliency requirement?', opts: O.capability, ev: 'zones' },
        { id: '4.3', label: 'Is cross-region service behavior validated for the intended region combination?', opts: O.capability, ev: 'pair' },
        { id: '4.4', label: 'Does latency to datacenters and users meet the targets?', opts: O.capability, ev: 'latency' },
        { id: '4.5', label: 'Is the price difference from the current region acceptable?', opts: O.capability, ev: 'pricing' },
        { id: '4.6', label: 'Can the subscriptions and offer types deploy here, with regional access approved?', opts: O.capability, ev: 'access' },
        { id: '4.7', label: 'Is quota available or requested for the expected scale?', opts: O.capability },
      ] },
  ];
  const CAPABILITY_IDS = CHECKS[3].rows.map(r => r.id);

  // ── step 3
  const PROFILES = [
    { id: 'Disconnected Spokes', href: 'disconnected-spokes.html', gets: 'No hub and no gateway. Workload spokes use the estate’s standard identity, policy, security, and deployment practices.',
      reassess: 'Workloads require private access to enterprise services, centralized security inspection, on-premises systems, another application portfolio, or capabilities hosted through a geographic hub.' },
    { id: 'Remote Hub Connected', href: 'remote-hub-connected.html', gets: 'No local hub. Workload spokes consume an existing geographic hub.',
      reassess: 'Cross-region traffic, latency, east-west communication, dependency criticality, regulatory requirements, scale, or availability coupling justify deploying selected connectivity or shared-service capabilities locally.' },
    { id: 'Minimal Regional Hub', href: 'minimal-regional-hub.html', gets: 'A limited hub with only the services that must be local. Everything else stays remote.',
      reassess: 'Workload growth introduces additional local connectivity or shared-service requirements, multiple interconnected application portfolios require broader regional capabilities, stricter independence requirements emerge, or significant hybrid connectivity is required locally.' },
    { id: 'Full Regional Hub', href: 'full-regional-hub.html', gets: 'The complete local connectivity and shared services that the region’s workloads require.',
      reassess: 'Workload demand or requirements decrease, services can be safely centralized, dependencies change, or the full regional footprint no longer provides sufficient value relative to its cost and operational complexity.' },
  ];
  const PROFILE_QUESTIONS = [
    { id: 'q1', label: 'Do the workloads need private access to enterprise services, on-premises systems, centralized inspection, another application portfolio, or geographic-hub capabilities?' },
    { id: 'q2', label: 'Can they tolerate the latency, availability coupling, and dependency on connectivity to another region?' },
    { id: 'q3', label: 'Do requirements justify a comprehensive local capability set, or independence from other hubs?' },
  ];

  // Shared services and their default placement per profile, in the order of PROFILES. '' means a choice for each region.
  const SHARED = [
    { id: 'governance', icon: 'checklist', name: 'Management groups, access control, policy', short: 'Management groups, access control, and policy', d: ['Global', 'Global', 'Global', 'Global'] },
    { id: 'pdns', icon: 'dns', name: 'Private DNS zones', short: 'Private DNS zones', d: ['Global', 'Global', 'Global', 'Global'] },
    { id: 'dnsres', icon: 'dns', name: 'DNS resolution across premises (private resolver or forwarders)', short: 'DNS private resolver or forwarders', d: ['Not required', 'Remote', '', 'Local'] },
    { id: 'inspect', icon: 'firewall', name: 'Traffic inspection and internet egress (Azure Firewall or network virtual appliance)', short: 'Firewall for traffic inspection and internet egress', d: ['Not required', 'Remote', '', 'Local'] },
    { id: 'gateway', icon: 'gateway', name: 'Hybrid connectivity gateways (ExpressRoute or VPN)', short: 'ExpressRoute or VPN gateway', d: ['Not required', 'Remote', '', 'Local'] },
    { id: 'directory', icon: 'people', name: 'Directory services (domain controllers)', short: 'Domain controllers', d: ['Not required', 'Remote', '', 'Local'] },
    { id: 'logs', icon: 'logs', name: 'Log workspace', short: 'Log workspace', d: ['Remote', 'Remote', 'Remote', 'Remote'], hint: 'Local only for data residency or significant cross-region charges.' },
    { id: 'backup', icon: 'backup', name: 'Backup vaults', short: 'Backup vaults', d: ['Local', 'Local', 'Local', 'Local'], hint: 'Local in every profile: Azure Backup works within a region.' },
    { id: 'keyvault', icon: 'key', name: 'Key Vault', short: 'Key Vault', d: ['Local', 'Local', 'Local', 'Local'], hint: 'Local in every profile: a vault for each workload in its region.' },
  ];
  const HUB_SERVICES = ['dnsres', 'inspect', 'gateway', 'directory'];   // the services that make a hub a hub

  // How the region reaches on-premises locations. `where`: remote paths use the geographic hub, local paths use something in the region.
  // `topo`: the hub topology the path belongs to, or '' when it fits both.
  const HYBRID_PATHS = [
    { id: 'Gateways in the geographic hub (gateway transit over global peering)', where: 'remote', topo: 'Hub-and-spoke virtual networks', say: 'through the gateways in the geographic hub' },
    { id: 'Existing virtual hub in another region (Virtual WAN)', where: 'remote', topo: 'Azure Virtual WAN', say: 'through the existing virtual hub in another region' },
    { id: 'SD-WAN or network virtual appliance in the geographic hub', where: 'remote', topo: '', say: 'over SD-WAN or a network virtual appliance in the geographic hub' },
    { id: 'New gateway in this region, connected to the existing circuit', where: 'local', topo: 'Hub-and-spoke virtual networks', say: 'through a new gateway in this region' },
    { id: 'New virtual hub in this region, connected to the existing circuits (Virtual WAN)', where: 'local', topo: 'Azure Virtual WAN', say: 'through a new virtual hub in this region' },
    { id: 'Site-to-site VPN to a gateway in this region', where: 'local', topo: '', say: 'over site-to-site VPN to a gateway in this region' },
    { id: 'SD-WAN or network virtual appliance in this region', where: 'local', topo: '', say: 'over SD-WAN or a network virtual appliance in this region' },
  ];
  // The paths a profile offers. gateway: the placement of the shared service 'gateway' ('' while it isn't placed).
  function hybridPathOptions(profile, topology, gateway) {
    const g = gateway || '';
    const remote = profile === 'Remote Hub Connected' || (profile === 'Minimal Regional Hub' && (g === '' || g === 'Remote'));
    const local = profile === 'Full Regional Hub' || (profile === 'Minimal Regional Hub' && (g === '' || g === 'Local'));
    return HYBRID_PATHS.filter(p => ((p.where === 'remote' && remote) || (p.where === 'local' && local)) && (!topology || !p.topo || p.topo === topology)).map(p => p.id);
  }

  const HYBRID_DECISIONS = [
    { id: 'Not required', text: 'The region uses Disconnected Spokes, or its workloads need no private path to on-premises locations.', icon: 'close' },
    { id: 'Reuse', text: 'The existing circuits, gateways, and peering locations meet what the workloads in the new region need.', icon: 'reset' },
    { id: 'Change', text: 'A requirement can’t be met by the existing foundation. Record the requirement and the change it justifies.', icon: 'edit' },
  ];

  // How the region connects to the geographic hub, by profile and topology.
  const direct = 'Direct between spokes (peering or Azure Virtual Network Manager mesh)';
  function linkOptions(profile, topology) {
    const wan = topology === 'Azure Virtual WAN';
    if (profile === 'Remote Hub Connected') return wan ? ['Virtual network connections to the remote virtual hub']
      : ['Global virtual network peering from each spoke to the remote hub', 'Azure Virtual Network Manager hub-and-spoke configuration to the remote hub'];
    if (profile === 'Minimal Regional Hub' || profile === 'Full Regional Hub') return wan ? ['Automatic between virtual hubs of the same Virtual WAN']
      : ['Global virtual network peering between the hub virtual networks', 'Azure Virtual Network Manager connectivity configuration between the hubs'];
    return [];
  }
  function eastWestOptions(profile) {
    if (profile === 'Disconnected Spokes') return ['Not required', direct];
    if (profile === 'Remote Hub Connected') return ['Through the remote hub', direct, 'Not required'];
    if (profile === 'Minimal Regional Hub') return ['Through the local hub (firewall or network virtual appliance)', direct, 'Through the remote hub', 'Not required'];
    if (profile === 'Full Regional Hub') return ['Through the local hub (firewall or network virtual appliance)', direct, 'Not required'];
    return [];
  }

  // Service names as the Azure Retail Prices API spells them. Only the ones found in the data snapshot are added.
  const STARTER_SERVICES = ['Virtual Machines', 'Storage', 'Virtual Network', 'Azure Kubernetes Service', 'Azure App Service', 'SQL Database', 'Azure Database for PostgreSQL', 'Azure Cosmos DB', 'Key Vault', 'Azure Monitor', 'Log Analytics', 'Backup', 'Azure Firewall', 'Application Gateway', 'Load Balancer', 'ExpressRoute', 'VPN Gateway', 'Azure DNS', 'Azure Bastion', 'Foundry Models'];

  // An illustrative, filled-in workbook. Every value is an example.
  const EXAMPLE = {
    v: 2, meta: { name: 'Example: Nordic expansion', owner: 'Platform team', date: '' },
    estate: { topology: 'Hub-and-spoke virtual networks', managed: 'Azure Virtual Network Manager', hybrid: 'ExpressRoute' },
    current: [{ id: 'westeurope', hub: true }], baseline: 'westeurope',
    regions: [
      { id: 'swedencentral', checks: { '1.1': 'Yes', '1.2': 'Markets and users', '2.1': 'Yes', '2.2': 'Yes', '3.1': 'Known', '3.2': 'Hybrid-Connected Applications', '3.3': 'Yes', '3.4': 'Yes', '4.1': 'Yes', '4.2': 'Yes', '4.3': 'Yes', '4.4': 'Yes', '4.5': 'Yes', '4.6': 'Yes', '4.7': 'Yes' },
        outcome: '', selected: true, conditions: '', owner: 'Platform team', review: '',
        design: { q1: 'Yes', q2: 'No', q3: 'No', profile: 'Minimal Regional Hub', hub: 'westeurope', topology: 'Hub-and-spoke virtual networks', managed: 'Azure Virtual Network Manager',
          link: 'Azure Virtual Network Manager connectivity configuration between the hubs', eastWest: 'Through the local hub (firewall or network virtual appliance)',
          ss: { dnsres: { p: 'Local' }, inspect: { p: 'Local' }, gateway: { p: 'Local' }, directory: { p: 'Remote', from: 'westeurope' } }, custom: [],
          hybrid: 'Reuse', hybridUse: 'ExpressRoute circuit in Frankfurt', hybridPath: 'New gateway in this region, connected to the existing circuit', owner: 'Network team' } },
      { id: 'polandcentral', checks: { '1.1': 'Yes', '1.2': 'Markets and users', '2.1': 'Yes', '2.2': 'To validate', '3.1': 'Partly known (guardrails set)', '3.2': 'Connected Cloud-Native or AI Applications', '3.3': 'Yes', '3.4': 'Yes' },
        outcome: '', selected: false, conditions: 'Compliance review of the regulatory requirements is still open.', owner: 'Compliance', review: '' },
      { id: 'switzerlandnorth', checks: { '1.1': 'No', '1.2': 'Datacenter and partner locations' }, outcome: '', selected: false, conditions: '', owner: '', review: '' },
    ],
    notes: { '2.1': 'Customer data must stay in the EU or EEA.', '4.4': 'Measured with Connection Monitor from a test VM.' },
    sites: [
      { id: 's1', kind: 'city', city: { n: 'Stockholm', a: 'Stockholm', c: 'Sweden', cc: 'SE', k: 'capital', lat: 59.33, lon: 18.06 }, peering: 'Stockholm', target: 15, edits: {} },
      { id: 's2', kind: 'city', city: { n: 'Oslo', a: 'Oslo', c: 'Norway', cc: 'NO', k: 'capital', lat: 59.91, lon: 10.75 }, peering: '', target: 30, edits: {} },
      { id: 's3', kind: 'peering', city: null, peering: 'Frankfurt', target: 35, edits: {} },
    ],
    services: STARTER_SERVICES.slice(0, 10).map((s, i) => ({ id: 'v' + i, service: s, product: '', weight: '' })),
    ui: { essentials: true, weighted: false },
  };

  global.MRP = Object.assign(global.MRP || {}, { O, TONE, OUTCOME_ICON, CHECKS, CAPABILITY_IDS, PROFILES, PROFILE_QUESTIONS, SHARED, HUB_SERVICES, HYBRID_PATHS, HYBRID_DECISIONS, hybridPathOptions, linkOptions, eastWestOptions, STARTER_SERVICES, EXAMPLE });
})(window);
