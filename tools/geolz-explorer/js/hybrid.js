/* hybrid.js: primary/backup hybrid routing at each hub, preferred circuits, failover and interconnects. */
const CONNECTION_TYPES = { expressroute: 'ExpressRoute', vpn: 'Site-to-site VPN' };
const LINK_ORDER = Object.keys(CONNECTION_TYPES);
const typeLabel = t => CONNECTION_TYPES[t] || t || 'none';

/* ===== PRIMARY / BACKUP at a hub: Azure's pick among the site's connection types there ===== */
function siteTypes(spec, site) {
  return LINK_ORDER.filter(t => hybridConnections(spec).some(c => c.site === site.id && c.type === t));
}
// The site's connections reaching one hub, by type (the one listing that hub first, when there are several).
function siteLinksAt(spec, siteId, hubId) {
  const conns = connectionsTo(spec, hubId).filter(c => c.site === siteId), at = {};
  for (const t of LINK_ORDER) {
    const list = conns.filter(c => c.type === t);
    if (list.length) at[t] = list.find(c => c.connects_to[0] === hubId) || list[0];
  }
  return at;
}
// The connection that carries the site's traffic to a hub (Azure's pick among its types there), and whether the other
// type reaches the hub too (the backup link).
function linkAt(spec, site, hubId) {
  const at = siteLinksAt(spec, site.id, hubId), pick = azurePick(spec, regionById(spec, hubId), Object.keys(at));
  return { conn: at[pick] };
}
const hasBackupAt = (spec, site, hubId) => Object.keys(siteLinksAt(spec, site.id, hubId)).length > 1;
// Hubs (region ids) that a site reaches over two or more connection types.
function pairHubs(spec, site) {
  const hubs = [...new Set(hybridConnections(spec).filter(c => c.site === site.id).flatMap(c => c.connects_to || []))];
  return hubs.filter(id => Object.keys(siteLinksAt(spec, site.id, id)).length > 1);
}

/* ===== ROUTING PREFERENCE: Virtual WAN hub routing preference (estate default, per-hub override) ===== */
// Which routes a hub prefers when a site advertises the same prefixes over two connection types (after the longest
// prefix match). A hub-spoke hub has the fixed default: ExpressRoute (rules.js fixedPreference).
const HUB_PREFERENCES = { expressroute: 'ExpressRoute', vpn: 'VPN', aspath: 'AS path' };
function hubPreference(spec, hub) {
  const value = isVwan(spec) && setting(spec, hub, 'hub_routing_preference');
  return HUB_PREFERENCES[value] ? value : 'expressroute';
}
const preferenceApplies = (spec, hub) => isVwan(spec) && hasHub(hub);
// The type Azure picks at a hub among a site's connection types (after the longest prefix match): ExpressRoute,
// unless a Virtual WAN hub prefers VPN. AS path: the shortest AS path wins and, when equal, ExpressRoute (the note
// says on-premises can change that by prepending).
function azurePick(spec, hub, types) {
  if (types.length < 2) return types[0] || null;
  return hub && preferenceApplies(spec, hub) && hubPreference(spec, hub) === 'vpn' ? 'vpn' : 'expressroute';
}
// The routing note of a hub's on-premises paths: the preference and whether it is the default.
function preferenceNote(spec, hub) {
  if (!isVwan(spec)) return RULES.fixedPreference['hub-spoke'];
  const own = hub.hub_routing_preference || spec.defaults.hub_routing_preference, pref = hubPreference(spec, hub);
  return { text: RULES.vwan.preferenceDefault.replace('{pref}', HUB_PREFERENCES[pref])
    .replace('{how}', own ? 'set' : 'default') + (pref === 'aspath' ? ' ' + RULES.vwan.preferenceAsPath : ''),
  ref: 'learn-vwan-hub-pref' };
}

// Country of a peering location (catalog.js "countries", by city: "Amsterdam Metro" → Netherlands).
function countryOf(location) {
  const city = cityOf(location);
  return (Object.entries(ER_LOCATIONS.countries || {}).find(([, cities]) => cities.includes(city)) || [])[0] || null;
}
// Is a circuit local to a region: its peering location in the region's geography or physical location?
const localCircuit = (region, c) => !!azureRegion(region) &&
  [azureRegion(region).geography, azureRegion(region).location].includes(countryOf(c.peering_location));
// The circuits reaching a hub, preferred first: the hub's er_preferred, else the first local one, else the first that
// lists the hub first, else spec order. The others are its backup circuits.
function circuitsAt(spec, hubId) {
  const list = connectionsTo(spec, hubId, 'expressroute'), hub = regionById(spec, hubId) || {};
  const pick = list.find(c => c.id === hub.er_preferred) || list.find(c => localCircuit(hub, c)) ||
    list.find(c => c.connects_to[0] === hubId) || list[0];
  return pick ? [pick, ...list.filter(c => c !== pick)] : [];
}
// The same, for a region that can host a gateway (else none).
const hubCircuits = (spec, region) => (canHostGateway(spec, region) ? circuitsAt(spec, region.id) : []);

/* ===== THE FAILOVER CHAIN of a hub, and simulated failures ===== */
// The hub's site (that of its preferred circuit, else of its first connection) and the connections its on-premises
// traffic tries in order: Azure's pick among the site's types at the hub (hybrid.js), then the other type;
// "ExpressRoute" means every circuit at the hub, preferred first, whose site is the hub's site or interconnected.
function candidatesAt(spec, hubId) {
  const ers = circuitsAt(spec, hubId), first = t => (list => list.find(c => c.connects_to[0] === hubId) || list[0])(
    connectionsTo(spec, hubId, t)), base = ers[0] || LINK_ORDER.map(first).find(Boolean);
  const site = base && siteById(spec, base.site);
  if (!site) return { site: null, list: base ? [base] : [] };
  const at = siteLinksAt(spec, site.id, hubId), types = Object.keys(at);
  const mine = ers.filter(c => interconnected(spec, c.site, site.id));
  const main = azurePick(spec, regionById(spec, hubId), types), backup = types.find(t => t !== main);
  const of = t => (t === 'expressroute' ? mine : [at[t]]);
  return { site, list: [...of(main), ...(backup ? of(backup) : [])] };
}
const locationDown = (c, k, fails) => fails.some(f => f.location === linkLocations(c)[k] ||
  f.location === c.peering_location);
// The link of a circuit in use: the first whose peering location is up (-1: none).
const linkInUse = (c, fails = []) => linkLocations(c).findIndex((l, k) => !locationDown(c, k, fails));
const providerOf = (spec, id) => providerKey(hybridConnections(spec).find(o => o.id === id) || {});
// Is a connection down: it failed, its provider failed, or (a circuit) every link's peering location is down?
function isDown(spec, c, fails) {
  return fails.some(f => f.conn === c.id || (c.type === 'expressroute' && !!f.provider &&
    providerKey(c) === providerOf(spec, f.provider))) || (c.type === 'expressroute' && linkInUse(c, fails) < 0);
}
// The connection a hub's on-premises traffic uses: the first in order that is not down. Returns { site, conn (null:
// no route), failed (the connections skipped), fails, list (the whole chain) }.
function routeAt(spec, hubId, fail) {
  const { site, list } = candidatesAt(spec, hubId), fails = [].concat(fail || []).filter(Boolean);
  const k = list.findIndex(c => !isDown(spec, c, fails));
  return { site, conn: k < 0 ? null : list[k], failed: k < 0 ? list : list.slice(0, k), fails, list };
}
// A drawn line (layout.wires) of a failed connection, or of a Metro link whose peering location is down.
function wireDown(spec, w, fails) {
  const c = hybridConnections(spec).find(o => o.id === w.conn);
  return !!c && (isDown(spec, c, fails) || (w.link !== undefined && locationDown(c, w.link, fails)));
}
// "Other failure scenarios" on the path's circuit, in plain words: its peering locations, its whole Metro area and
// its connectivity provider.
function failureOptions(spec, region, fails = []) {
  const h = hybridOf(spec, region, { fail: fails }), c = h && h.conn;
  if (!c || c.type !== 'expressroute') return [];
  const name = c.name || 'Circuit', opt = (f, text) => [JSON.stringify(f), text];
  const locs = isMetro(c) ? linkLocations(c).map(l => opt({ location: l }, `One Metro location down: ${l} ` +
    '(circuit stays up on the other link)')).concat([opt({ location: c.peering_location }, 'Whole Metro area down')])
    : [opt({ location: c.peering_location }, `Peering location down: ${c.peering_location} (Standard circuit fails)`)];
  return [...locs, ...(isDirect(c) ? [] : [opt({ provider: c.id }, `Connectivity provider of ${name} down`)])];
}
// Is a failure worth simulating: the region's hub has a second connection to try, or a Metro circuit?
function failoverOffered(spec, region) {
  const h = hybridOf(spec, region);
  return !!h && (candidatesAt(spec, h.owner).list.length > 1 || circuitsAt(spec, h.owner).some(isMetro));
}
// "Fail primary" / "Fail next": the connection to fail next on this region's path (null: nothing left).
function nextToFail(spec, region, fails) {
  const h = hybridOf(spec, region, { fail: fails });
  return h ? { conn: h.conn.id } : null;
}
// The breadcrumb: "Primary: Circuit A ✕ → Backup: Circuit B ✓ (via Secondary DC)".
function failChain(spec, region, fails) {
  const h = hybridOf(spec, region), state = h && routeAt(spec, h.owner, fails);
  if (!state || !fails.length) return [];
  const seen = state.conn ? state.list.slice(0, state.list.indexOf(state.conn) + 1) : state.list;
  return seen.map((c, k) => ({ role: !k ? 'Primary' : c.type === 'expressroute' ? 'Backup' : 'Backup link',
    name: c.type === 'expressroute' ? c.name || 'Circuit' : 'VPN',
    up: c === state.conn,
    via: state.site && c.site !== state.site.id ? siteById(spec, c.site).name : null }));
}

/* ===== FAILURE NOTES (buildPath, opts.fail): rerouted, no route, or not affected (rules.js "failover") ===== */
function failureState(spec, region, fail) {
  const h = [].concat(fail || []).length && hybridOf(spec, region);
  return h ? { hub: h.owner, normal: h.conn, ...routeAt(spec, h.owner, fail) } : null;
}
// What failed, in words: "Circuit A", "the VPN from Primary DC", "the Amsterdam peering location" …
function failureWhat(spec, f) {
  const c = hybridConnections(spec).find(o => o.id === (f.conn || f.provider));
  if (f.conn) return c && c.type !== 'expressroute' ? connectionName(spec, c) : (c || {}).name || 'the circuit';
  if (f.provider) return `the connectivity provider of ${(c || {}).name || 'the circuit'}`;
  return isMetroLocation(f.location) ? `the ${f.location} area (both of its peering locations)`
    : `the ${f.location} peering location`;
}
function failoverNote(spec, state) {
  if (!state) return null;
  const F = RULES.failover, f = state.fails.at(-1) || {}, hub = regionById(spec, state.hub).name, c = state.conn;
  const site = s => (siteById(spec, s) || { name: s }).name, before = siteById(spec, state.normal.site);
  const k = c && c.type === 'expressroute' ? linkInUse(c, state.fails) : 0, half = k > 0 || (c && isMetro(c) &&
    state.fails.some(x => linkLocations(c).includes(x.location)));
  const key = !c ? 'none' : half && c === state.normal ? 'metro_link' : c === state.normal ? 'unaffected'
    : c.type === 'expressroute' ? 'circuit' : 'link';
  const values = { what: failureWhat(spec, f), hub, circuit: c && (c.name || 'circuit'), location: c &&
    (c.type === 'expressroute' ? linkLocations(c)[k] : ''), backup: c && typeLabel(c.type), site: c && site(c.site),
    home: before.name };
  const cut = isolatedCircuits(spec, state.hub);  // other sites' circuits that can't take over
  Object.assign(values, { circuits: cut.map(o => o.name || 'Circuit').join(' and '),
    sites: [...new Set(cut.map(o => site(o.site)))].join(' and ') });
  const shared = f.provider ? sameProvider(spec, hybridConnections(spec).find(o => o.id === f.provider) || {}) : [];
  values.shared = shared.map(o => o.name || 'Circuit').join(' and ');
  const fill = t => t.replace(/\{(\w+)\}/g, (_, x) => values[x]);
  const moved = c && c.site !== before.id ? ' ' + fill(F.other_site) : '';
  const both = shared.length > 1 ? ' ' + fill(F.shared_provider) : '';
  const skipped = cut.length && ['link', 'none'].includes(key) ? ' ' + fill(F.not_interconnected) : '';
  return { text: fill(F[key].text) + moved + skipped + both, ref: F[key].ref };
}

/* ===== DIAGRAM AND OVERVIEW: backup lines, the per-hub summary ===== */
// A connection is a backup at a hub when it isn't the hub's preferred circuit, or isn't the type Azure picks there
// for its site. Without hubId: a backup at every hub it connects to.
function isBackup(spec, c, hubId) {
  const at = id => {
    const site = siteById(spec, c.site), ers = c.type === 'expressroute' ? circuitsAt(spec, id) : [];
    return (ers.length > 1 && ers[0] !== c) ||
      (!!site && hasBackupAt(spec, site, id) && linkAt(spec, site, id).conn.type !== c.type);
  };
  return hubId ? at(hubId) : (c.connects_to || []).length > 0 && c.connects_to.every(at);
}
// Overview: the routing preference, the preferred / backup circuits and backup link, each site's links.
function linkSummary(spec, region) {
  const h = hybridOf(spec, region);
  if (!h) return [];
  const hub = regionById(spec, h.owner), { list } = candidatesAt(spec, h.owner), ers = circuitsAt(spec, h.owner);
  const name = c => `${c.name || 'Circuit'} (${c.peering_location}, ${resiliencyOf(c)})`, siteName = c =>
    siteById(spec, c.site).name, other = c => (interconnected(spec, c.site, ers[0].site) ? ` via ${siteName(c)} over` +
    ' the on-premises interconnect' : `, ${siteName(c)}: not interconnected, no backup`);
  const backups = ers.slice(1).map(c => name(c) + (c.site === ers[0].site ? '' : other(c)));
  const link = list.find(c => c.type !== 'expressroute');
  const circuits = ers.length && list[0].type === 'expressroute' ? [`${hub.name}: preferred circuit ${name(ers[0])}` +
    (ers[1] ? ` · backup circuit ${backups.join(', ')}` : '') +
    (link ? ` · backup link ${typeLabel(link.type)} (${siteById(spec, link.site).name})` : '')] : [];
  const sites = (spec.onprem || []).filter(s => connectionsTo(spec, h.owner).some(c => c.site === s.id));
  return [preferenceNote(spec, hub).text, ...circuits, ...sites.map(s => {
    const at = siteLinksAt(spec, s.id, h.owner), used = linkAt(spec, s, h.owner).conn.type;
    const spare = Object.keys(at).find(t => t !== used);
    const ic = (spec.onprem || []).filter(o => o !== s && interconnected(spec, s.id, o.id)).map(o => o.name);
    return `${s.name}: ${typeLabel(used)} primary` + (spare ? ` · ${typeLabel(spare)} backup` : ' · no backup link') +
      (ic.length ? ` · interconnected with ${ic.join(', ')} (on-premises)` : '');
  })];
}

/* ===== CHECK FACTS: circuits at a hub (region checks) and circuits shared by two linked hubs (link checks) ===== */
const circuitFacts = (spec, region) => hubResiliencyFacts(spec, region);
const sharedCircuits = (spec, a, b) => connectionsTo(spec, a, 'expressroute')
  .filter(c => (c.connects_to || []).includes(b)).map(c => c.name || 'circuit').join(', ') || 'none';

/* ===== DATACENTER INTERCONNECT: a site's "interconnect" lists the sites it reaches on-premises (both ways);
   a hub may then reroute a site's traffic over another site's circuit (rules.js "interconnect") ===== */
const interconnected = (spec, a, b) => a === b || [[a, b], [b, a]].some(([x, y]) =>
  ((siteById(spec, x) || {}).interconnect || []).includes(y));
const icConn = (a, b) => 'ic:' + [a, b].sort().join('|');  // the path steps' "conn" over the interconnect line
// Every interconnected pair of existing sites once, in spec.onprem order: [[siteA, siteB], ...].
function interconnectPairs(spec) {
  const sites = spec.onprem || [];
  return sites.flatMap((a, i) => sites.slice(i + 1).filter(b => interconnected(spec, a.id, b.id)).map(b => [a, b]));
}
// Tick or untick "Interconnected with" (editor): on adds the other site to this site's list; off removes it from
// both lists.
function setInterconnect(spec, siteId, otherId, on) {
  const site = siteById(spec, siteId), other = siteById(spec, otherId);
  if (!site || !other || site === other) return;
  const drop = (s, id) => { s.interconnect = (s.interconnect || []).filter(x => x !== id); };
  drop(site, otherId); drop(other, siteId);
  if (on) site.interconnect.push(otherId);
  for (const s of [site, other]) if (!s.interconnect.length) delete s.interconnect;
}

/* ===== PATHS: the site step of a route over another site's circuit becomes "other site → original site" ===== */
// hybridStep (topology.js) marks such a site step with "home" (the original site); outbound paths end there, inbound
// paths start there (the on-premises token is the first step).
function withInterconnect(spec, steps) {
  const k = steps.findIndex(s => s.home);
  if (k < 0) return steps;
  const step = steps[k], via = siteById(spec, step.site), home = siteById(spec, step.home);
  const note = step.label.slice(via.name.length).replace(/^ \((.*)\)$/, '$1');  // e.g. "DNS servers"
  const homeStep = { id: 'site.' + home.id, label: `${home.name} (${note ? note + ', ' : ''}over the on-premises ` +
    'interconnect)', conn: icConn(home.id, via.id) };
  const viaStep = { ...step, label: via.name, home: undefined };
  return k === 0 ? [homeStep, viaStep, ...steps.slice(1)] : [...steps.slice(0, k), viaStep, homeStep,
    ...steps.slice(k + 1)];
}

/* ===== INTERCONNECT FACTS ===== */
// The circuits at a hub that can't back up the preferred circuit's site (their site isn't interconnected with it).
function isolatedCircuits(spec, hubId) {
  const [pick, ...rest] = circuitsAt(spec, hubId);
  return pick ? rest.filter(c => !interconnected(spec, c.site, pick.site)) : [];
}
function interconnectFacts(spec, region) {
  const pick = canHostGateway(spec, region) && circuitsAt(spec, region.id)[0];
  const cut = pick ? isolatedCircuits(spec, region.id) : [];
  const site = id => (siteById(spec, id) || { name: id }).name;
  return { er_isolated: cut.map(c => `${c.name || 'Circuit'} (${site(c.site)})`).join(', ') || 'none',
    er_isolated_sites: [...new Set(cut.map(c => site(c.site)))].join(', ') || 'none',
    er_preferred_site: pick ? site(pick.site) : 'none', er_preferred: pick ? pick.name || 'Circuit' : 'none' };
}
