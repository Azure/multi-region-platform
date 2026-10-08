/* spec.js: reading, validating and editing the explorer spec. */
const SPEC_FORMAT = 1;
const ROLE_KEYS = Object.keys(CATALOG.roles).filter(r => !CATALOG.roles[r].derived);
const COMMON = ['dns_model', 'hub_routing_preference', ...ROLE_KEYS];
const SPEC_FIELDS = {
  spec: ['format', 'title', 'customer', 'global_entry', 'defaults', 'vwans', 'onprem', 'hybrid_connections',
    'regions', 'region_links'],
  defaults: ['topology', 'routing_intent', ...COMMON],
  region: ['id', 'name', 'pattern', 'remote_hub', 'capabilities', 'vwan', 'er_preferred', ...COMMON],
  site: ['id', 'name', 'interconnect'],
  connection: ['id', 'type', 'site', 'name', 'peering_location', 'connection', 'provider', 'connects_to'],
  link: ['from', 'to', 'kind', 'reason'],
  vwan: ['id', 'name'],
  global: ['type', 'origins'],
  origin: ['region', 'role']
};
// Fields of former versions that name a feature this explorer doesn't model (rules.js notModelled).
const NOT_MODELLED = { onprem_transit: 'on-premises transit through Azure', transport: 'SD-WAN over ExpressRoute',
  route_server: 'Azure Route Server as an optional service', route_server_reason: 'Azure Route Server reasons',
  type: 'virtual WAN types (Standard only)', hub_routing_preference: 'Route Server routing preference',
  routing_method: 'global entry routing methods', private_link: 'Front Door Private Link to origins',
  priority: 'origin priority', weight: 'origin weight', er_remote_vnets: 'VNet-to-VNet traffic over ExpressRoute',
  primary: 'a primary link chosen per site', backup: 'a backup link chosen per site' };

/* ===== THE CHECK: shape, format, fields and values ===== */
// Returns the spec with a non-enumerable "notes" list (never saved); throws on a spec that can't be read.
function validSpec(s) {
  if (!Array.isArray((s || {}).regions) || !s.defaults) throw new Error('needs "defaults" and "regions"');
  if (s.format !== undefined && s.format !== SPEC_FORMAT) {
    throw new Error(`unknown format ${JSON.stringify(s.format)}: this explorer reads format ${SPEC_FORMAT}`);
  }
  const notes = [], name = (o, k) => o.name || o.id || `#${k + 1}`;
  const groups = [['spec', [s], () => 'spec'], ['defaults', [s.defaults], () => 'defaults'],
    ['region', s.regions, (o, k) => `region ${name(o, k)}`], ['site', s.onprem || [], (o, k) => `site ${name(o, k)}`],
    ['connection', s.hybrid_connections || [], (o, k) => `connection ${name(o, k)}`],
    ['link', s.region_links || [], (o, k) => `region link ${o.from}–${o.to || k + 1}`],
    ['vwan', s.vwans || [], (o, k) => `virtual WAN ${name(o, k)}`],
    ['global', s.global_entry ? [s.global_entry] : [], () => 'global entry'],
    ['origin', Array.isArray((s.global_entry || {}).origins) ? s.global_entry.origins : [],
      (o, k) => `global origin ${o.region || '#' + (k + 1)}`]];
  for (const [kind, list, where] of groups) {
    list.forEach((o, k) => dropIngressChoices(o, where(o, k), notes));
    list.forEach((o, k) => dropUnknown(o, SPEC_FIELDS[kind], where(o, k), notes));
  }
  for (const obj of [s.defaults, ...s.regions]) dropBadValues(obj, obj === s.defaults ? 'defaults' : obj.name, notes);
  dropConnectionTypes(s, notes);
  dropSpokePeerings(s, notes);
  if (s.defaults.topology !== 'vwan') [s.defaults, ...s.regions].forEach(o => dropUnknown(o, Object.keys(o).filter(k =>
    k !== 'hub_routing_preference'), o === s.defaults ? 'defaults' : `region ${o.name}`, notes));
  s.format = SPEC_FORMAT;
  validateGlobalEntry(s, notes);
  if (s.defaults.topology === 'vwan') ensureVwans(s);  // topology.js
  for (const r of s.regions.filter(r => r.vwan && !(s.vwans || []).some(w => w.id === r.vwan))) {
    notes.push(`Not recognised, ignored: virtual WAN "${r.vwan}" of region ${r.name}: the hub is shown in the first` +
      ' one.');
    delete r.vwan;
  }
  for (const [r, value] of pruneDnsModels(s)) {  // spec.js
    notes.push(`Ignored: DNS model "${value}" of region ${r.name}. ${dnsModelFixed(s, r)}`);
  }
  return Object.defineProperty(s, 'notes', { value: notes, configurable: true });
}
function dropSpokePeerings(s, notes) {
  const regionName = id => ((s.regions || []).find(r => r.id === id) || {}).name || id;
  for (const l of (s.region_links || []).filter(x => x.kind === 'spoke-peering')) {
    notes.push(`Not recognised, ignored: spoke peering ${regionName(l.from)}–${regionName(l.to)} ` +
      '(direct spoke peering: not modelled in this explorer).');
  }
  if (s.region_links) s.region_links = s.region_links.filter(x => x.kind !== 'spoke-peering');
}
function dropIngressChoices(obj, where, notes) {
  const fields = [
    ['appgw_design', 'parallel', 'in-front', 'Application Gateway in front of the firewall'],
    ['connector_route', 'direct', 'firewall', "the private network connector's route through the firewall"]
  ];
  for (const [key, drawn, notDrawn, label] of fields) {
    if (obj[key] === notDrawn) {
      notes.push(`Not recognised, ignored: "${key}" of ${where} (${label}: not modelled in this explorer; ` +
        'ingress is drawn direct to the spoke).');
      delete obj[key];
    } else if (obj[key] === drawn) delete obj[key];
  }
}
// Hybrid connections of a type this explorer doesn't model (SD-WAN, or unknown) are dropped.
function dropConnectionTypes(s, notes) {
  const known = Object.keys(CONNECTION_TYPES), why = t => (t === 'sdwan' ? ' (SD-WAN: not modelled in this explorer)'
    : '');  // hybrid.js
  for (const c of (s.hybrid_connections || []).filter(x => !known.includes(x.type))) {
    notes.push(`Not recognised, ignored: ${c.type || 'untyped'} connection ${c.name || c.id || ''} from site ` +
      `${c.site}${why(c.type)}.`);
  }
  if (s.hybrid_connections) s.hybrid_connections = s.hybrid_connections.filter(x => known.includes(x.type));
}
// Global entry: an unknown service type means none; an unknown origin role means active.
function validateGlobalEntry(s, notes) {
  if (!s.global_entry) return;
  const entry = s.global_entry;
  if (!RULES.globalEntry.types[entry.type]) {
    notes.push(`Not recognised, ignored: global entry type "${entry.type}".`);
    s.global_entry = { type: 'none', origins: [] };
    return;
  }
  entry.origins = Array.isArray(entry.origins) ? entry.origins : [];
  for (const o of entry.origins.filter(o => o.role !== undefined && !GLOBAL_ROLES.includes(o.role))) {
    notes.push(`Not recognised, ignored: role "${o.role}" of global origin ${o.region}: treated as active.`);
    delete o.role;
  }
}
function dropUnknown(obj, fields, where, notes) {
  for (const key of Object.keys(obj).filter(k => !fields.includes(k))) {
    const why = NOT_MODELLED[key] ? ` (${NOT_MODELLED[key]}: not modelled in this explorer)` : '';
    notes.push(`Not recognised, ignored: "${key}" of ${where}${why}.`);
    delete obj[key];
  }
}
// Values that name nothing this explorer knows: a product of a role, a capability state.
function dropBadValues(obj, where, notes) {
  for (const role of ROLE_KEYS.filter(r => obj[r] !== undefined && obj[r] !== 'none' && !CATALOG.products[obj[r]])) {
    notes.push(`Not recognised, ignored: product "${obj[role]}" (${CATALOG.roles[role].label}) of ${where}.`);
    delete obj[role];
  }
  for (const [key, value] of Object.entries(obj.capabilities || {})) {
    if (CAP_STATES.includes(value)) continue;
    notes.push(`Not recognised, ignored: capability "${key}": "${value}" of ${where}.`);
    delete obj.capabilities[key];
  }
}

/* ===== EDITOR HELPERS: dotted paths into the spec, and where an effective value comes from ===== */
// Write a value at a dotted path such as "regions.2.dns_model"; '' removes the key.
function setPath(obj, path, value) {
  const keys = path.split('.'), last = keys.pop();
  for (const k of keys) obj = obj[k] = obj[k] || {};
  if (value === '') delete obj[last]; else obj[last] = value;
}
function getPath(obj, path) { return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj); }
function roleSource(spec, region, role) {
  const hit = resolveRole(spec, region, role), product = hit && CATALOG.products[hit.product];
  if ((patternOf(region).spoke_roles || []).includes(role)) {  // an isolated region: only what its spoke deploys
    return product ? `${product.label} · in this spoke` : 'not deployed · can be added in the spoke';
  }
  if (!product) return 'none configured';
  if (region[role] || hit.owner === region.id) return product.label + (region[role] ? ' · set here' : ' · default');
  return `${product.label} · from ${regionById(spec, hit.owner).name} hub`;
}
function settingSource(spec, region, key) {  // key: 'dns_model'
  const value = setting(spec, region, key);
  return value + (region[key] ? ' · set here' : ' · default');
}
// Remove every region DNS model override that can't apply (engine.js dnsModelFixed: no resolver, or the resolver in
// another region). Returns [region, value] for each removed one that differed from the model the region uses.
function pruneDnsModels(spec) {
  const fixed = spec.regions.filter(r => r.dns_model !== undefined && dnsModelFixed(spec, r));
  return fixed.map(r => { const value = r.dns_model; delete r.dns_model; return [r, value]; })
    .filter(([r, value]) => value !== dnsModelOf(spec, r));
}
// Switch a region to another Azure region: id and name change, and every reference to the old id follows.
function renameRegion(spec, i, id) {
  const region = spec.regions[i], old = region.id, next = AZURE_REGIONS.regions.find(r => r.id === id);
  if (!next) return;
  const swap = v => (v === old ? next.id : v);
  Object.assign(region, { id: next.id, name: next.name });
  spec.regions.forEach(r => { if (r.remote_hub) r.remote_hub = swap(r.remote_hub); });
  hybridConnections(spec).forEach(c => { c.connects_to = (c.connects_to || []).map(swap); });
  (spec.region_links || []).forEach(l => Object.assign(l, { from: swap(l.from), to: swap(l.to) }));
}

/* ===== ORDERING: areas and regions (diagram columns) and on-premises sites ===== */
// Swap two entries of a list in place; false when the move would leave the list.
function swapIn(list, i, delta) {
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return false;
  [list[i], list[j]] = [list[j], list[i]];
  return true;
}
// Move a whole area block left (-1) or right (+1): spec.regions is rewritten area by area.
function moveArea(spec, area, delta) {
  const groups = areaGroups(spec), moved = swapIn(groups, groups.findIndex(g => g.area === area), delta);
  if (moved) spec.regions = groups.flatMap(g => g.regions);
  return moved;
}
// Move a region left or right within its own area.
function moveRegion(spec, id, delta) {
  const groups = areaGroups(spec), group = groups.find(g => g.regions.some(r => r.id === id));
  const moved = !!group && swapIn(group.regions, group.regions.findIndex(r => r.id === id), delta);
  if (moved) spec.regions = groups.flatMap(g => g.regions);
  return moved;
}
// Sites: their order breaks ties when the diagram places them under the hubs they connect to.
function moveSite(spec, i, delta) { return swapIn(spec.onprem || [], i, delta); }

/* ===== PATTERN CHANGE: remove what the new pattern doesn't allow (rules.js "fields", "links") ===== */
// Returns short texts for what was removed. Regions that use this one as their remote hub are not changed: Checks
// reports them. A minimal hub that becomes another pattern loses the hub link to its remote hub (linkRemoteHub
// added it).
function changePattern(spec, region, next) {
  const was = region.pattern === 'minimal-hub' && region.remote_hub;
  region.pattern = next;
  const removed = [...dropConnections(spec, region), ...dropLinks(spec, region), ...dropSettings(spec, region)];
  return was && next !== 'minimal-hub' ? [...removed, ...unlinkRemoteHub(spec, region, was, true)] : removed;
}
// A minimal hub takes capabilities from its remote hub over a hub link (hub-spoke; Virtual WAN links its hubs
// implicitly). assign: give it a remote hub when it has none (on becoming a minimal hub: the first full hub, in its
// virtual WAN when there are several); a remote hub the user cleared stays cleared. Returns what was added.
function linkRemoteHub(spec, region, assign = true) {
  if (region.pattern !== 'minimal-hub') return [];
  const added = [], fits = r => r !== region && r.pattern === 'full-hub' && (!isVwan(spec) ||
    vwanOf(spec, r) === vwanOf(spec, region));
  if (assign && !regionById(spec, region.remote_hub)) {
    const hub = spec.regions.find(fits) || spec.regions.find(r => r !== region && r.pattern === 'full-hub');
    if (!hub) return added;
    region.remote_hub = hub.id;
    added.push(`remote hub ${hub.name}`);
  }
  const remote = regionById(spec, region.remote_hub);
  if (remote && !isVwan(spec) && hasHub(remote) && remote !== region && !linkBetween(spec, region.id, remote.id)) {
    setLink(spec, remote.id, region.id, true);
    added.push(`hub link to ${remote.name}`);
  }
  return added;
}
// The other half: a minimal hub's previous remote hub (no longer its remote hub, or the region is no longer a
// minimal hub: wasMinimal) loses its hub link. Returns what was removed, as short texts.
function unlinkRemoteHub(spec, region, previous, wasMinimal = region.pattern === 'minimal-hub') {
  const old = regionById(spec, previous), links = spec.region_links || [];
  if (!wasMinimal || !old || previous === region.remote_hub ||
    !links.some(l => (!l.kind || l.kind === 'hub') && sameLink(l, region.id, previous))) return [];
  setLink(spec, region.id, previous, false);
  return [`hub link to ${old.name}`];
}
// Hybrid connections: a region that can no longer host a gateway leaves every connection; a connection left with
// no region is removed.
function dropConnections(spec, region) {
  if (canHostGateway(spec, region)) return [];
  const removed = [];
  for (const c of connectionsTo(spec, region.id)) {
    c.connects_to = c.connects_to.filter(id => id !== region.id);
    const what = c.type === 'expressroute' ? 'ExpressRoute ' + (c.name || 'circuit') : connectionName(spec, c);
    removed.push(c.connects_to.length ? `${what} connection` : what);
  }
  spec.hybrid_connections = hybridConnections(spec).filter(c => (c.connects_to || []).length);
  return removed;
}
// Region links of a kind the pattern can't take part in.
function dropLinks(spec, region) {
  const kinds = patternOf(region).links || [], name = id => (regionById(spec, id) || { name: id }).name;
  const gone = (spec.region_links || []).filter(l => [l.from, l.to].includes(region.id) &&
    !kinds.includes(l.kind || 'hub'));
  spec.region_links = (spec.region_links || []).filter(l => !gone.includes(l));
  return gone.map(l => 'region link to ' + name(l.from === region.id ? l.to : l.from));
}
// Region settings: remote hub, capabilities, role overrides and DNS model the pattern has no field for.
function dropSettings(spec, region) {
  const removed = [];
  const drop = (key, text) => {
    if (region[key] === undefined || allowsField(region, key)) return;
    delete region[key];
    removed.push(text);
  };
  drop('remote_hub', 'remote hub ' + ((regionById(spec, region.remote_hub) || {}).name || region.remote_hub));
  drop('capabilities', 'capabilities');
  for (const role of Object.keys(CATALOG.roles)) drop(role, CATALOG.roles[role].label + ' override');
  drop('dns_model', 'DNS model override');
  const gw = r => canHostGateway(spec, r);
  for (const [key, text, keep] of [['hub_routing_preference', 'hub routing preference', hasHub],
    ['vwan', 'virtual WAN', hasHub], ['er_preferred', 'preferred circuit', gw]]) {
    if (region[key] !== undefined && !keep(region)) { delete region[key]; removed.push(text); }
  }
  return removed;
}

// A circuit's resiliency (the editor's dropdown): the peering location switches to a matching one.
function setCircuitResiliency(spec, i, resiliency) {
  const c = hybridConnections(spec)[i];
  if (resiliencyOf(c) !== resiliency) c.peering_location = matchingLocation(c.peering_location, resiliency);
}

/* ===== REGION LINKS: the editor's "Connect all hubs" / "Disconnect all hubs" button ===== */
// Every pair of hubs, in spec order (the editor's tick boxes).
function hubPairs(spec) {
  const hubs = spec.regions.filter(hasHub);
  return hubs.flatMap((a, i) => hubs.slice(i + 1).map(b => [a.id, b.id]));
}
// True when every pair of hubs already has a hub link (the button then disconnects). Never in Virtual WAN.
function allHubsLinked(spec) {
  const pairs = hubPairs(spec);
  return spec.defaults.topology !== 'vwan' && pairs.length > 0 && pairs.every(([a, b]) => linkBetween(spec, a, b));
}
// Adds the missing hub links, or (all linked) removes every hub link. The implicit remote-hub peerings are not
// touched. Returns the editor status: text (e.g. "2 hub links added."), offering Undo.
function toggleHubLinks(spec) {
  const links = spec.region_links = spec.region_links || [], before = links.length;
  if (allHubsLinked(spec)) {
    spec.region_links = links.filter(l => l.kind && l.kind !== 'hub');
  } else {
    hubPairs(spec).forEach(([a, b]) => setLink(spec, a, b, true));
  }
  const n = Math.abs(spec.region_links.length - before);
  const text = `${n} hub link${n === 1 ? '' : 's'} ${spec.region_links.length < before ? 'removed' : 'added'}.`;
  return { key: 'links', text, undo: true, undone: 'Hub links change undone.' };
}

/* ===== HYBRID CONNECTIONS: the editor's "+ ExpressRoute circuit" and "+ VPN connection" ===== */
// A new connection from a site (default: the first) to a hub (default: the first that can host a gateway); an ER
// circuit starts at a Metro peering location in that hub's geopolitical region (resilience default), or the first
// location in the list. Returns the connection.
function addConnection(spec, type, siteId, hubId) {
  if (!(spec.onprem || []).length) spec.onprem = [{ id: 's' + Date.now().toString(36), name: 'New site' }];
  const hub = regionById(spec, hubId) || spec.regions.find(r => canHostGateway(spec, r));
  const conns = hybridConnections(spec);
  const ids = new Set(conns.map(c => c.id)), id = [...Array(conns.length + 2).keys()].map(k => 'c' + Date.now()
    .toString(36) + (k || '')).find(x => !ids.has(x));
  spec.hybrid_connections = conns;
  const conn = { id, type, site: siteId || spec.onprem[0].id, connects_to: hub ? [hub.id] : [] };
  if (type === 'expressroute') {
    const geo = ER_LOCATIONS.geopolitical.find(g => hub && g.regions.includes(hub.id)) || ER_LOCATIONS.geopolitical[0];
    const loc = geo.locations.find(l => / Metro$/.test(l)) || geo.locations[0];
    Object.assign(conn, { name: `Circuit ${conns.filter(c => c.type === type).length + 1}`, peering_location: loc });
  }
  conns.push(conn);
  return conn;
}
