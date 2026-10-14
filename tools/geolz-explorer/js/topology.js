/* topology.js: hub-spoke and Virtual WAN topology, region links, hybrid attachments, east-west and ingress helpers. */
const ER_LOCATIONS = window.ER_LOCATIONS || { geopolitical: [] };

/* ===== REGION LINKS: explicit hub-to-hub links, implicit Virtual WAN links ===== */
const sameLink = (l, a, b) => (l.from === a && l.to === b) || (l.from === b && l.to === a);
// Hub-to-hub links: they exist or not. Hub-spoke: the explicit entries (always inspected by both hub firewalls,
// because peering is not transitive). Virtual WAN: every pair of hubs in the same Standard virtual WAN, implicitly
// (topology.js); routing intent is topology-wide. A link with an end whose pattern can't take part (rules.js
// patterns[x].links) is left out of paths and the diagram; Checks reports it (raw = true lists every entry).
function linkUsable(spec, link) {
  const ends = [link.from, link.to].map(id => regionById(spec, id));
  const apart = isVwan(spec) && ends.every(Boolean) && vwanOf(spec, ends[0]) !== vwanOf(spec, ends[1]);
  return link.from !== link.to && !apart && ends.every(r => r && (patternOf(r).links || [])
    .includes(link.kind || 'hub'));
}
function regionLinks(spec, raw = false) {
  if (spec.defaults.topology !== 'vwan') {
    return (spec.region_links || []).filter(l => (!l.kind || l.kind === 'hub') && (raw || linkUsable(spec, l)));
  }
  const hubs = spec.regions.filter(hasHub), all = [];
  hubs.forEach((a, i) => hubs.slice(i + 1).filter(b => vwanLinked(spec, a, b))
    .forEach(b => all.push({ from: a.id, to: b.id, implicit: true })));
  return all;
}
const routingIntent = spec => spec.defaults.routing_intent !== false;  // Virtual WAN only; on unless set to false
function linkBetween(spec, a, b) { return regionLinks(spec).find(l => sameLink(l, a, b)) || null; }
// The hub a region's traffic transits: its own hub, or the hub of its remote hub region.
function hubOf(spec, region) {
  if (hasHub(region)) return region;
  const remote = region.pattern === 'remote-hub' && regionById(spec, region.remote_hub);
  return hasHub(remote) ? remote : null;
}
// Add (on = true) or remove the explicit hub link a↔b (hub-spoke; Virtual WAN links all hubs implicitly).
function setLink(spec, a, b, on) {
  const links = spec.region_links = spec.region_links || [];
  const i = links.findIndex(l => (!l.kind || l.kind === 'hub') && sameLink(l, a, b));
  if (on && i < 0) links.push({ from: a, to: b });
  if (!on && i >= 0) links.splice(i, 1);
}
// Connections drawn in the backbone band: implicit remote-hub peerings and hub links.
function backboneConnections(spec) {
  const remote = spec.regions.filter(r => r.pattern === 'remote-hub' && hasHub(regionById(spec, r.remote_hub)));
  return [...remote.map(r => ({ kind: 'remote', from: r.id, to: r.remote_hub })),
    ...regionLinks(spec).map(link => ({ kind: 'hub', from: link.from, to: link.to, link }))];
}
function connectionLabel(spec, c) {
  const a = regionById(spec, c.from), b = regionById(spec, c.to), topo = topologyOf(spec);
  if (c.kind === 'remote') return `${topo.connection || topo.cross} · ${a.name} → ${b.name} hub`;
  if (isVwan(spec)) return vwanLaneLabel(spec, a, b);  // topology.js
  return `${topo.cross} · ${a.name} ↔ ${b.name} · ${RULES.crossRegion.linkLabels['hub-spoke']}`;
}

/* ===== HYBRID CONNECTIONS: the single source of truth for gateways and on-premises routes ===== */
// Each connection: { id, type: 'expressroute' | 'vpn', site, name?, peering_location? (ER only),
// connects_to: [region ids] }. The hub component each type needs is a derived role in catalog.js ("connection"),
// with its product per topology ("products"). The order of the roles is the order of preference for a region's
// paths.
const GATEWAYS = Object.fromEntries(Object.entries(CATALOG.roles).filter(([, r]) => r.connection)
  .map(([role, r]) => [role, r.connection]));  // derived hub role -> connection type
const GATEWAY_ROLE = Object.fromEntries(Object.entries(GATEWAYS).map(([role, type]) => [type, role]));
const derivedProduct = (spec, role) => CATALOG.roles[role].products[spec.defaults.topology === 'vwan' ? 'vwan'
  : 'hub-spoke'];
const hybridConnections = spec => spec.hybrid_connections || [];
const siteById = (spec, id) => (spec.onprem || []).find(s => s.id === id);
// A region can host a gateway when it has a full hub, or a minimal hub with Hybrid gateway set to Local.
const canHostGateway = (spec, region) => hasHub(region) && capState(spec, region, 'hybrid') === 'local';
function connectionsTo(spec, regionId, type) {
  return hybridConnections(spec).filter(c => (!type || c.type === type) && (c.connects_to || []).includes(regionId));
}
// Gateways are derived: a hub gets an ExpressRoute gateway when an ER circuit connects to it, a VPN Gateway when a
// VPN does. A region that can't host one uses its remote hub's gateway (resolveRole calls this for derived roles).
function gatewayRole(spec, region, role, depth) {
  const product = derivedProduct(spec, role);
  if (!region || depth > 3 || !product || capState(spec, region, 'hybrid') === 'none') return null;
  if (canHostGateway(spec, region)) {
    return connectionsTo(spec, region.id, GATEWAYS[role]).length ? { product, owner: region.id } : null;
  }
  return followsRemote(region) ? gatewayRole(spec, regionById(spec, region.remote_hub), role, depth + 1) : null;
}
// The hybrid route of a region: the hub (its own, or its remote hub's) and the connection its on-premises traffic
// uses there (hybrid.js routeAt: the hub site's primary link, the preferred circuit first; with opts.fail, the
// first one not failed). Returns { role, owner, product, conn, failed: [connections skipped] }, or null (no
// connection, or every one failed).
function hybridOf(spec, region, opts = {}) {
  for (const role of Object.keys(GATEWAYS)) {
    const hit = gatewayRole(spec, region, role, 0);
    if (!hit) continue;
    const { conn, failed, site, fails } = routeAt(spec, hit.owner, opts.fail);
    const used = conn && GATEWAY_ROLE[conn.type];
    return conn && { role: used, owner: hit.owner, product: derivedProduct(spec, used), conn, failed, site, fails };
  }
  return null;
}
// Path steps for the hybrid tokens of rules.js: {hybrid} = gateway, edge = the peering location of the circuit's link
// in use (a Metro circuit: link 1, or link 2 when link 1's location is down), provider = that circuit's connectivity
// provider (none for ExpressRoute Direct), onprem = site. Each carries the connection id (conn: the
// diagram line it follows).
function hybridStep(spec, region, name, opts) {
  const h = hybridOf(spec, region, opts), site = h && siteById(spec, h.conn.site), conn = h && h.conn.id;
  if (!h) return null;
  const er = h.conn.type === 'expressroute' && h.conn, k = er ? linkInUse(er, h.fails) : 0;  // hybrid.js
  if (name === 'hybrid') return { id: `${h.owner}.${h.role}`, region: h.owner, label: CATALOG.products[h.product].label,
    product: h.product, conn };
  if (name === 'edge') return er && { id: edgeId(linkLocations(er)[k]), ref: 'learn-er-locations', conn, link: k,
    label: `${linkLocations(er)[k]} peering location (${er.name || 'circuit'}${isMetro(er) ? `, Metro link ${k + 1}` +
    ' of 2' : ''})` };
  const via = er && !isDirect(er) && `${providerName(er)} (${er.name || 'circuit'})`;
  if (name === 'provider') return via ? { id: providerId(er), label: via, conn } : null;
  const home = h.site && h.site.id !== site.id ? { home: h.site.id } : {};  // over another site's circuit
  return site ? { id: 'site.' + site.id, label: site.name, conn, site: site.id, ...home } : null;  // hybrid.js
}
const edgeId = location => 'edge.' + String(location || 'Unspecified').toLowerCase().replace(/[^a-z0-9]+/g, '-');
// Peering locations used by the spec's ExpressRoute circuits (a Metro circuit: both of its locations), in first-use
// order.
const peeringLocations = spec => [...new Set(circuitsOf(spec).flatMap(linkLocations))];
// Geopolitical region of a peering location or of a catalog.js id (null = not in catalog.js).
const geoOfLocation = name => (ER_LOCATIONS.geopolitical.find(g => g.locations.includes(name)) || {}).name || null;
const geoOfRegion = id => (ER_LOCATIONS.geopolitical.find(g => g.regions.includes(id)) || {}).name || null;
// Site sub-label: what terminates the connections on the customer side.
function siteEquipment(spec, site) {
  const types = new Set(hybridConnections(spec).filter(c => c.site === site.id).map(c => c.type));
  return [types.has('expressroute') && 'Customer edge routers', types.has('vpn') && 'VPN device']
    .filter(Boolean).join(' · ') || 'Not connected';
}
function connectionName(spec, c) {
  const site = siteById(spec, c.site), where = site ? site.name : c.site;
  if (c.type === 'expressroute') return `${c.name || 'ExpressRoute circuit'} (${where})`;
  return `VPN from ${where}`;
}
// Facts for rules.js hybridChecks (one connection) and estateChecks (the whole estate). All values are strings.
function connectionFacts(spec, c) {
  const targets = (c.connects_to || []).map(id => regionById(spec, id)).filter(Boolean);
  const geo = geoOfLocation(c.peering_location), named = c.peering_location && c.peering_location !== 'Unspecified';
  const crossGeo = targets.filter(r => geo && geoOfRegion(r.id) && geoOfRegion(r.id) !== geo).map(r => r.name);
  return {
    name: connectionName(spec, c), type: c.type, site: c.site || 'none', site_exists: yes(siteById(spec, c.site)),
    has_targets: yes(targets.length), peering_location: c.peering_location || 'Unspecified',
    location_named: yes(named), location_known: yes(geo), geo: geo || 'unknown',
    cross_geo: crossGeo.join(', ') || 'none',
    no_hub_targets: targets.filter(r => !hasHub(r)).map(r => r.name).join(', ') || 'none',
    minimal_targets: targets.filter(r => hasHub(r) && !canHostGateway(spec, r)).map(r => r.name).join(', ') || 'none'
  };
}
// Virtual WANs with hubs, when there are two or more: they are isolated from each other (topology.js).
function estateFacts(spec) {
  const hubs = spec.regions.filter(hasHub);
  const used = isVwan(spec) ? vwansOf(spec).filter(w => hubs.some(r => vwanOf(spec, r) === w)) : [];
  return { vwans_apart: used.length > 1 ? used.map(w => w.name).join(' and ') : 'none' };
}

/* ===== EXPRESSROUTE CIRCUITS: resiliency follows the peering location (a name ending in " Metro" is a Metro
   location); optional "connection" ("provider", default, or "direct") and "provider" (its name) ===== */
/* ===== RESILIENCY: standard (both links at one peering location) or Metro (two locations in one metro area) ===== */
const RESILIENCY = { standard: 'Standard', metro: 'Metro (high resiliency)' };
const isMetroLocation = location => / Metro$/.test(location || '');
const isMetro = c => isMetroLocation(c.peering_location);
const resiliencyOf = c => (isMetro(c) ? 'metro' : 'standard');
// The city of a peering location: "Amsterdam2" and "Amsterdam Metro" are both in Amsterdam.
const cityOf = location => String(location || '').replace(/ Metro$/, '').replace(/\d+$/, '');
const locationsFor = (geo, resiliency) => geo.locations.filter(l => isMetroLocation(l) === (resiliency === 'metro'));
// The location to switch to when the resiliency changes: the same city's match, else the first match in its region.
function matchingLocation(location, resiliency) {
  const geo = ER_LOCATIONS.geopolitical.find(g => g.locations.includes(location)) || ER_LOCATIONS.geopolitical[0];
  const list = locationsFor(geo, resiliency);
  return list.find(l => cityOf(l) === cityOf(location)) || list[0] || location;
}
// A circuit's two redundant links: both at its peering location (standard), or one at each of the Metro area's two
// peering locations, named "City" and "City2" by Learn's convention (else "<Metro> 1" and "<Metro> 2").
function linkLocations(c) {
  const loc = c.peering_location || 'Unspecified', city = loc.replace(/ Metro$/, '');
  if (!isMetroLocation(loc)) return [loc];
  const all = ER_LOCATIONS.geopolitical.flatMap(g => g.locations);
  return all.includes(city) && all.includes(city + '2') ? [city, city + '2'] : [loc + ' 1', loc + ' 2'];
}
// A hub's resulting level (null: no circuit): maximum with two circuits at different peering locations, high with a
// Metro circuit, else standard.
function hubResiliency(spec, hubId) {
  const ers = circuitsAt(spec, hubId), locs = ers.map(linkLocations);  // hybrid.js
  const apart = locs.some((a, i) => locs.slice(i + 1).some(b => !b.some(l => a.includes(l))));
  if (!ers.length) return null;
  return apart ? 'maximum' : ers.some(isMetro) ? 'high' : 'standard';
}

/* ===== CONNECTIVITY PROVIDER or EXPRESSROUTE DIRECT ===== */
const isDirect = c => c.connection === 'direct';
const providerId = c => 'prov.' + c.id;  // the diagram node of a circuit's provider
const providerName = c => String(c.provider || '').trim() || 'Connectivity provider';
// Circuits naming the same provider share it (a provider outage takes them all down); unnamed ones don't.
const providerKey = c => (isDirect(c) ? null : String(c.provider || '').trim().toLowerCase() || 'circuit:' + c.id);
const circuitsOf = spec => hybridConnections(spec).filter(c => c.type === 'expressroute');
const sameProvider = (spec, c) => circuitsOf(spec).filter(o => providerKey(c) && providerKey(o) === providerKey(c));

/* ===== CHECK FACTS of a hub: a single standard circuit, its level, circuits in one city ===== */
function hubResiliencyFacts(spec, region) {
  const ers = hubCircuits(spec, region), one = ers.length === 1 ? ers[0] : null;
  const name = c => `${c.name || 'Circuit'} (${c.peering_location})`;
  const pairs = ers.flatMap((c, i) => ers.slice(i + 1).filter(o => cityOf(o.peering_location) ===
    cityOf(c.peering_location)).map(o => `${name(c)} and ${name(o)}`));
  return { er_single: one ? resiliencyOf(one) : 'no', er_single_name: one ? name(one) : 'none',
    er_same_city: pairs.join('; ') || 'none', er_level: hubResiliency(spec, region.id) || 'none',
    er_names: ers.map(name).join(', ') || 'none' };
}

/* ===== VIRTUAL WANS: spec.vwans [{ id, name }], all Standard; a hub region's "vwan" (default: the first) ===== */
const isVwan = spec => spec.defaults.topology === 'vwan';
const topoKey = spec => (isVwan(spec) ? 'vwan' : 'hub-spoke');
const DEFAULT_VWAN = { id: 'vwan-1', name: 'Main' };
const vwansOf = spec => ((spec.vwans || []).length ? spec.vwans : [DEFAULT_VWAN]);
function ensureVwans(spec) {
  if (!(spec.vwans || []).length) spec.vwans = [{ ...DEFAULT_VWAN }];
  return spec.vwans;
}
// The virtual WAN of a region: its hub's (its own, or its remote hub's) "vwan", else the first one.
function vwanOf(spec, region) {
  const hub = region && hubOf(spec, region), list = vwansOf(spec);
  return list.find(w => hub && w.id === hub.vwan) || list[0];
}
// Two virtual hubs are linked (hub-to-hub) when they are in the same virtual WAN (Standard: a full mesh).
const vwanLinked = (spec, a, b) => vwanOf(spec, a) === vwanOf(spec, b);

/* ===== WHERE A ROLE IS DRAWN: hub-spoke: catalog.js roles.<id>.placement (the first entry is a hub's); Virtual WAN:
   the virtual hub allow-list (catalog.js "virtualHub"), every other hub role in the shared services VNet ===== */
const VHUB = CATALOG.virtualHub;
function placementOf(spec, role) {
  const hs = (CATALOG.roles[role].placement || {})['hub-spoke'] || [], spoke = hs.filter(p => p === 'spoke');
  if (!isVwan(spec)) return hs;
  if (VHUB.roles.includes(role)) return ['virtual-hub', ...spoke];
  return hs[0] === 'hub' || !hs.length ? ['shared-services', ...spoke] : hs;  // default: shared services VNet
}
// A product allowed in a virtual hub (allow-list; none: the role's place decides).
const inVirtualHub = product => !product || VHUB.products.includes(product);
// A role a region owns sits in its hub (hub VNet or virtual hub) or shared services VNet when its hub has it (a full
// hub; a minimal hub's local capability; gateways and the hub router: always), else in its spoke-level strip. In a
// virtual hub only allow-listed products: any other (e.g. a generic third-party firewall NVA) goes to the shared
// services VNet. product: the role's product here (default: as resolved).
function roleWhere(spec, region, role, product) {
  const place = placementOf(spec, role)[0], hub = patternOf(region).hub, derived = !!CATALOG.roles[role].derived;
  const local = hub === 'full' || (hub === 'partial' && (derived || roleState(spec, region, role) === 'local'));
  if (!['hub', 'virtual-hub', 'shared-services'].includes(place) || !local) return 'spoke';
  const id = product === undefined ? (resolveRole(spec, region, role) || {}).product : product;
  return place === 'virtual-hub' && !inVirtualHub(id) ? 'shared-services' : place;
}
// A product that can't sit where its role is drawn (catalog.js "where") is replaced by its "alt" there.
function placedProduct(spec, role, hit) {
  const product = hit && CATALOG.products[hit.product], owner = product && regionById(spec, hit.owner);
  const where = owner && roleWhere(spec, owner, role, hit.product), alt = where && (product.alt || {})[where];
  return alt && !(product.where || [where]).includes(where) ? { ...hit, product: alt } : hit;
}
// A product as shown in this topology: in Virtual WAN its "vwan" entry adds a sub-label and points first.
function productOf(spec, id) {
  const p = CATALOG.products[id], v = p && isVwan(spec) && p.vwan;
  return v ? { ...p, sub: v.sub || p.sub, points: [...(v.points || []), ...p.points] } : p;
}
// A role's name in this topology (Virtual WAN: "Hub security" for the firewall role).
const roleLabel = (spec, role) => (isVwan(spec) && (CATALOG.roles[role].vwan || {}).label) || CATALOG.roles[role].label;

/* ===== VIRTUAL HUBS: their security, router and state ===== */
// A role each virtual hub has on its own (catalog.js "perHub": the hub security), never borrowed from another hub:
// the region override, else the estate default, else the role's Virtual WAN default; 'none' = none. A minimal hub
// has it only when it is ticked as a local capability. undefined: not such a role here (resolveRole goes on).
function ownHubRole(spec, region, role) {
  const r = CATALOG.roles[role] || {};
  if (!(r.perHub || []).includes(topoKey(spec)) || !hasHub(region)) return undefined;
  if (roleState(spec, region, role) !== 'local') return null;
  const product = (allowsField(region, role) && region[role]) || spec.defaults[role] || (r.vwan || {}).default;
  return CATALOG.products[product] ? { product, owner: region.id } : null;
}
// The virtual hub router: built into every virtual hub of a Standard virtual WAN.
function vhubRole(spec, region, role, depth) {
  const product = (CATALOG.roles[role].products || {})[topoKey(spec)];
  if (!product || !region || depth > 3) return null;
  if (hasHub(region)) return { product, owner: region.id };
  return followsRemote(region) ? vhubRole(spec, regionById(spec, region.remote_hub), role, depth + 1) : null;
}
// Where the hub's own "firewall" role sits: 'virtual-hub' (a security solution in the hub), 'shared-services' (a
// generic firewall NVA in the shared services VNet), or null (none).
function securityAt(spec, hub) {
  const hit = resolveRole(spec, hub, 'firewall');
  return hit && hit.owner === hub.id ? roleWhere(spec, hub, 'firewall', hit.product) : null;
}
const hubSecurity = (spec, hub) => securityAt(spec, hub) === 'virtual-hub';
// The state of a virtual hub (path templates "byHub", checks): 'none' (no security solution), 'nva' (none in the
// hub, a firewall NVA in the shared services VNet), 'intent' (a security solution and routing intent) or 'secured'
// (no routing intent); null: no hub.
function vhubState(spec, hub) {
  if (!hub) return null;
  if (!hubSecurity(spec, hub)) return securityAt(spec, hub) === 'shared-services' ? 'nva' : 'none';
  return routingIntent(spec) ? 'intent' : 'secured';
}
// The "{vhub}" step: what carries private traffic through the region's virtual hub: its firewall with routing intent,
// else its router. "{vhubfw}" (onlyFirewall): the firewall with routing intent only.
function vhubStep(spec, region, onlyFirewall) {
  const hub = hubOf(spec, region), state = vhubState(spec, hub);
  if (!state || (onlyFirewall && state !== 'intent')) return null;
  return resolveToken(spec, hub, state === 'intent' ? '{firewall}' : '{hub_router}');
}

// "{via:<role>}": the region's own virtual hub ("{vhub}") when the role is served from another hub (a minimal
// virtual hub's on-premises traffic: hub-to-hub to its remote hub); "{viahost:<role>}": that other hub's.
function viaStep(spec, region, token) {
  const [kind, role] = token.split(':'), hub = hubOf(spec, region);
  const hit = role === 'hybrid' ? hybridOf(spec, region) : resolveRole(spec, region, role), owner = hit && hit.owner;
  if (!hub || !owner || owner === hub.id) return null;
  return vhubStep(spec, kind === 'via' ? region : regionById(spec, owner));
}

/* ===== PATHS: rules.js "vwanPaths" over the pattern's templates ===== */
// A "byHub" choice: 'local' when the template's role ("localRole") is in the region's own spoke (no hub on the way),
// else the state of the region's virtual hub ('*' without one).
function vwanChoice(spec, region, node) {
  const role = node.localRole, hit = role && resolveRole(spec, region, role);
  if (hit && hit.owner === region.id && roleWhere(spec, region, role) === 'spoke') return 'local';
  return vhubState(spec, hubOf(spec, region)) || '*';
}
// A key whose value is a choice or a template replaces the base one; a plain group (dns › centralized) merges.
function mergePaths(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const leaf = typeof v !== 'object' || ['steps', 'byHub', 'byRole'].some(x => x in v);
    out[k] = leaf || typeof base[k] !== 'object' ? v : mergePaths(base[k], v);
  }
  return out;
}
// East-west between two virtual hubs (topology.js): by how many of them inspect with routing intent; apart: in
// different virtual WANs; one shared hub: its firewall or its router.
function vwanLinkKey(spec, a, b) {
  return ['vwan-direct', 'vwan-partial', 'vwan-inspected'][[a, b].filter(h => vhubState(spec, h) === 'intent').length];
}
const vwanApartKey = (spec, a, b) => (vwanOf(spec, a) !== vwanOf(spec, b) ? 'vwan-different' : 'no-link');
const vwanSameHubKey = (spec, hub) => (vhubState(spec, hub) === 'intent' ? 'vwan-same-hub' : 'vwan-same-hub-direct');
// Names for the notes: the virtual WANs of both hubs, the hub that inspects and the one that doesn't.
function vwanNames(spec, a, b) {
  if (!isVwan(spec) || !a || !b) return {};
  const fw = [a, b].find(h => vhubState(spec, h) === 'intent');
  return { src_wan: vwanOf(spec, a), dst_wan: vwanOf(spec, b), fw_hub: fw, open_hub: [a, b].find(h => h !== fw) };
}
// The hub-to-hub lane's label: Virtual WAN <name> · hub-to-hub · A ↔ B · inspection.
function vwanLaneLabel(spec, a, b) {
  const key = vwanLinkKey(spec, a, b), labels = RULES.crossRegion.linkLabels, names = vwanNames(spec, a, b);
  const how = key !== 'vwan-direct' ? labels[key].replace('{hub}', (names.fw_hub || {}).name)
    : labels[routingIntent(spec) ? 'vwan-unsecured' : 'vwan-direct'];
  return `Virtual WAN ${vwanOf(spec, a).name} · hub-to-hub · ${a.name} ↔ ${b.name} · ${how}`;
}
// A bow-tie between two linked virtual hubs (unless both prefer AS path): a note on their east-west path.
function vwanBowtie(spec, a, b) {
  const circuits = sharedCircuits(spec, a.id, b.id);  // hybrid.js
  if (!isVwan(spec) || circuits === 'none' || vwanLinkFacts(spec, { from: a.id, to: b.id }).aspath_both === 'yes') {
    return null;
  }
  return { text: RULES.vwan.bowtie.replace('{circuits}', circuits), ref: 'learn-vwan-faq' };
}

/* ===== CHECK FACTS (rules.js vwanChecks, vwanLinkChecks). All values are strings. ===== */
function vwanFacts(spec, region) {
  const own = isVwan(spec) && hasHub(region), w = isVwan(spec) ? vwanOf(spec, region) : {};
  const sec = own && hubSecurity(spec, region) && CATALOG.products[resolveRole(spec, region, 'firewall').product];
  return { vwan_hub: yes(own), hub_security: sec ? sec.label : own ? 'none' : 'n/a',
    routing_intent: yes(isVwan(spec) && routingIntent(spec)), vwan_name: w.name || 'n/a',
    ...minimalVhubFacts(spec, region) };
}
// A minimal virtual hub: its firewall state, and what is wrong with its remote hub ('none': a full hub in the same
// virtual WAN).
const isMinimalVhub = (spec, region) => isVwan(spec) && !!region && patternOf(region).hub === 'partial';
function minimalVhubFacts(spec, region) {
  const on = isMinimalVhub(spec, region), remote = on && regionById(spec, region.remote_hub);
  const issue = !remote || remote === region ? 'none' : patternOf(remote).hub !== 'full'
    ? `a ${patternOf(remote).label.toLowerCase()} region, not a full hub`
    : vwanOf(spec, remote) !== vwanOf(spec, region) ? `in virtual WAN ${vwanOf(spec, remote).name}` : 'none';
  return { vwan_minimal: yes(on), fw_state: on ? capState(spec, region, 'firewall') : 'n/a',
    vwan_remote_issue: issue, remote_hub_name: remote ? remote.name : 'none' };
}
function vwanLinkFacts(spec, link) {
  const a = regionById(spec, link.from), b = regionById(spec, link.to), vwan = isVwan(spec) && !!a && !!b;
  const aspath = r => preferenceApplies(spec, r) && hubPreference(spec, r) === 'aspath';  // hybrid.js
  return { same_vwan: yes(!vwan || vwanOf(spec, a) === vwanOf(spec, b)),
    aspath_both: yes(vwan && aspath(a) && aspath(b)) };
}

/* ===== EDITS (no DOM; editor.js calls afterEdit after each field change) ===== */
// Switching to Virtual WAN creates the first virtual WAN.
function afterEdit(spec, path) {
  if (path === 'defaults.topology' && isVwan(spec)) ensureVwans(spec);
}

// In order: disconnected -> shared hub -> hub link (hub-spoke: both firewalls; Virtual WAN: the hubs' state,
// topology.js) -> no route (Virtual WAN: different virtual WANs).
function crossKey(spec, region, dest, hubs, link) {
  const [srcHub, dstHub] = hubs, vwan = isVwan(spec);
  let key = !srcHub || !dstHub ? 'no-hub' : 'no-link';
  if (srcHub && dstHub && srcHub !== dstHub && vwan) key = link ? vwanLinkKey(spec, srcHub, dstHub)
    : vwanApartKey(spec, srcHub, dstHub);
  else if (link) key = 'both';
  if (srcHub && srcHub === dstHub) key = vwan ? vwanSameHubKey(spec, srcHub) : 'same-hub';
  if ([region, dest].some(r => r.pattern === 'disconnected')) key = 'disconnected';
  return key;
}

/* ===== THE PATH ===== */
function crossRegionPath(spec, region, dest) {
  const srcHub = hubOf(spec, region), dstHub = hubOf(spec, dest);
  const link = srcHub && dstHub && srcHub !== dstHub && linkBetween(spec, srcHub.id, dstHub.id);
  const key = crossKey(spec, region, dest, [srcHub, dstHub], link);
  const ctx = { src: region, dst: dest, src_hub: srcHub, dst_hub: dstHub, ...vwanNames(spec, srcHub, dstHub) };
  const topo = topologyOf(spec), cross = topo.cross, via = topo.connection || cross;
  const t = RULES.vwanCross[key] || RULES.crossRegion.templates[key];  // rules.js, rules.js
  const { steps, missing } = resolveSteps(t.steps, token => {
    if (token === 'spoke') return resolveToken(spec, region, 'spoke');
    if (token === 'dst.spoke') return resolveToken(spec, dest, 'spoke');
    if (token === 'link') return { id: null, label: `${cross} to ${dstHub.name}` };
    if (token === 'dst.spoke2' || token === 'spoke2') return resolveToken(spec, token === 'spoke2' ? region : dest,
      'spoke2');
    if (token === 'peering:src_hub?') return region !== srcHub && { id: null, label: `${via} to ${srcHub.name}` };
    if (token === 'peering:dst?') return dest !== dstHub && { id: null, label: `${via} to ${dest.name}` };
    const [scope, role] = token.replace(/[{}]/g, '').split('.');  // e.g. {src_hub.firewall}, {dst_hub.vhub}
    return resolveToken(spec, ctx[scope], `{${role}}`);
  });
  const fill = s => s.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] ? ctx[k].name : k));
  const note = link && vwanBowtie(spec, srcHub, dstHub);
  const extra = note ? { text: fill(note.text), ref: note.ref } : null;
  return { type: 'east_west', dest: dest.id, key, steps, missing, na: !!missing || !steps.length,
    note: fill(t.note), ref: t.ref, matrix: fill(t.matrix), extra };
}

// A peering step wherever two consecutive steps sit in different regions (e.g. an Application Gateway in the remote
// hub, then the firewall or workload here): "… to <region>" away from the path's region, "… from <region>" back to it.
// A step repeating the one before (e.g. the same virtual hub firewall reached twice in a template) is left out.
// Between two hubs: the topology's hub link ("cross"); else its spoke connection (Virtual WAN: a VNet connection).
function withPeerings(spec, region, steps) {
  const topo = topologyOf(spec), name = id => (regionById(spec, id) || { name: id }).name, out = [];
  const hub = id => hasHub(regionById(spec, id));
  steps.forEach((step, i) => {
    if (step.id && out.length && out[out.length - 1].id === step.id) return;
    const prev = steps.slice(0, i).reverse().find(s => s.region);
    const both = prev && step.region && hub(prev.region) && hub(step.region);
    const cross = both ? topo.cross : topo.connection || topo.cross;
    if (prev && step.region && prev.region !== step.region) out.push({ id: null, label: step.region === region.id
      ? `${cross} from ${name(prev.region)}` : `${cross} to ${name(step.region)}` });
    out.push(step);
  });
  return out;
}
