/* engine.js: paths, checks, global entry, DNS/admin/access summaries and matrix helpers. */
const RULES = window.RULES, CATALOG = window.CATALOG, AZURE_REGIONS = window.AZURE_REGIONS ||
  { areas: [], regions: [] };

/* ===== LOOKUPS ===== */
function regionById(spec, id) { return spec.regions.find(r => r.id === id); }
function patternOf(region) { return RULES.patterns[region.pattern] || RULES.patterns['full-hub']; }
// A pattern's path templates; in Virtual WAN, rules.js "vwanPaths" replace some of them (topology.js).
function pathsOf(spec, pattern) {
  const base = pattern.paths || RULES.patterns[pattern.sameAs].paths;
  return isVwan(spec) && pattern.vwanPaths ? mergePaths(base, RULES.vwanPaths) : base;
}
function topologyOf(spec) { return RULES.topologies[spec.defaults.topology] || RULES.topologies['hub-spoke']; }
function hasHub(region) { return !!region && patternOf(region).hub !== 'none'; }
// The catalog.js record for a spec region: by programmatic id, else by display name (imported specs).
function azureRegion(region) {
  const list = AZURE_REGIONS.regions;
  return list.find(r => r.id === region.id) || list.find(r => r.name === region.name) || null;
}
// Effective setting (only the DNS model is a setting): region override first, then the default.
function setting(spec, region, key) { return region[key] || spec.defaults[key]; }
// What a pattern lets a region set (rules.js "fields"; a disconnected region's "spoke_roles" are role fields too).
const patternFields = region => [...(patternOf(region).fields || []), ...(patternOf(region).spoke_roles || [])];
const allowsField = (region, field) => patternFields(region).includes(field);
// A minimal hub's capability (catalog.js "capabilities" of the topology): 'local', 'remote' (from its remote hub) or
// 'none' (not needed; DNS: Azure-provided DNS). Unset: the firewall local; the rest from the remote hub, or not
// needed when no remote hub is set (a remote hub that is set but missing stays "remote": Checks reports it). A full
// hub has all of them locally.
const CAP_STATES = ['local', 'remote', 'none'];
const capKeys = spec => Object.keys(CATALOG.capabilities[topoKey(spec)]);
const remoteHubOf = (spec, region) => (r => (r && r !== region && hasHub(r) ? r : null))(regionById(spec,
  region.remote_hub));
function capState(spec, region, key) {
  const hub = patternOf(region).hub, value = (region.capabilities || {})[key];
  if (hub !== 'partial') return hub === 'full' ? 'local' : 'remote';
  if (CAP_STATES.includes(value)) return value;
  return key === 'firewall' ? 'local' : region.remote_hub ? 'remote' : 'none';
}
// The capability a role belongs to: a gateway is "hybrid"; in Virtual WAN every role of the shared services VNet is
// "shared" (topology.js placementOf).
function capOf(spec, role) {
  const r = CATALOG.roles[role] || {};
  if (r.derived === 'hybrid') return 'hybrid';
  if (!isVwan(spec) || role === 'firewall') return role;
  return placementOf(spec, role)[0] === 'shared-services' ? 'shared' : role;
}
const roleState = (spec, region, role) => capState(spec, region, capOf(spec, role));
// A minimal hub's capabilities set to Local whose role has no product (no region override, estate default none):
// the region has none of it.
const localMissing = (spec, region) => patternOf(region).hub !== 'partial' ? [] : capKeys(spec).filter(k =>
  CATALOG.roles[k] && !CATALOG.roles[k].derived && capState(spec, region, k) === 'local' &&
  !resolveRole(spec, region, k));
// "Local: firewall · From West Europe: Bastion · Azure-provided DNS · Not needed: on-premises"; a full hub: "All
// capabilities local". A capability whose "Not needed" has its own name (rules.js notNeeded.as) is named alone; a
// Local one with nothing configured says so.
function capabilityLine(spec, region) {
  const hub = patternOf(region).hub, names = CATALOG.capabilities[topoKey(spec)], as = RULES.notNeeded.as || {};
  const missing = localMissing(spec, region);
  const remote = regionById(spec, region.remote_hub), keys = st => capKeys(spec)
    .filter(k => capState(spec, region, k) === st), of = st => keys(st).filter(k => st !== 'none' || !as[k])
    .map(k => names[k][1] + (missing.includes(k) ? ' (none configured)' : ''));
  if (hub !== 'partial') return hub === 'full' ? 'All capabilities local' : '';
  return [['Local', of('local')], [`From ${remote ? remote.name : 'the remote hub (none set)'}`, of('remote')],
    ...keys('none').filter(k => as[k]).map(k => [as[k], []]), ['Not needed', of('none')]]
    .filter(([t, l]) => l.length || Object.values(as).includes(t))
    .map(([t, l]) => (l.length ? `${t}: ${l.join(', ')}` : t)).join(' · ');
}
// Which product fills a role for a region, and which region hosts it (owner). Order: region override ('none': none)
// -> local default (a full hub, or a minimal hub's local capability) -> remote hub (a capability not needed: none).
// Gateways follow the hybrid connections (topology.js); the hub security and the virtual hub router of a virtual
// hub come from topology.js. The product is the one for where the role is drawn (catalog.js "alt"). An override the
// pattern doesn't allow is ignored (a Checks warning says so).
function resolveRole(spec, region, role, depth = 0) {
  return placedProduct(spec, role, findRole(spec, region, role, depth));
}
function findRole(spec, region, role, depth) {
  if (!region || depth > 3) return null;
  const derived = CATALOG.roles[role] && CATALOG.roles[role].derived, own = ownHubRole(spec, region, role);
  if (derived) return (derived === 'vhub' ? vhubRole : gatewayRole)(spec, region, role, depth);
  if (own !== undefined) return own;
  const state = roleState(spec, region, role);
  if (state === 'none' || (region[role] === 'none' && allowsField(region, role))) return null;
  if (region[role] && allowsField(region, role)) return { product: region[role], owner: region.id };
  if (state === 'local') return spec.defaults[role] ? { product: spec.defaults[role], owner: region.id } : null;
  return followsRemote(region) ? resolveRole(spec, regionById(spec, region.remote_hub), role, depth + 1) : null;
}
const followsRemote = region => !!region.remote_hub && allowsField(region, 'remote_hub');

/* ===== PATHS ===== */
// Turn one template token into a step { id (diagram node), label, region, product } or null.
// "token@note" appends a note to the step label, e.g. "{dns}@inbound endpoint".
function resolveToken(spec, region, token, opts) {
  const [raw, note] = token.split('@'), step = baseStep(spec, region, raw.replace(/[{}?]/g, ''), opts);
  return step && note ? { ...step, label: `${step.label} (${note})` } : step;
}
const GLOBAL_NODES = ['internet', 'users', 'admins', 'azure_dns', 'dns_zones'];  // diagram nodes outside the regions
function baseStep(spec, region, name, opts) {  // opts: buildPath's (fail: simulated link failure)
  const generic = CATALOG.generic[name];
  if (GLOBAL_NODES.includes(name)) return { id: name, label: generic.label };
  if (generic && generic.step) return { id: null, label: generic.label };  // e.g. a ruleset: no diagram node
  if (name.startsWith('spoke') || name === 'own_zones') return { id: `${region.id}.${name}`, region: region.id,
    ...generic };
  if (name.startsWith('peering:')) return peeringStep(spec, region, name.slice(8));
  const [scope, role] = name.includes('.') ? name.split('.') : ['', name];
  const from = scopeRegion(spec, region, scope);
  if (!from) return null;
  if (/^vhub/.test(role)) return vhubStep(spec, from, role === 'vhubfw');  // topology.js: hub firewall or router
  if (/^via(host)?:/.test(role)) return viaStep(spec, from, role);  // topology.js: the hubs on a hub-to-hub detour
  if (['hybrid', 'edge', 'provider', 'onprem'].includes(role)) return hybridStep(spec, from, role, opts);
  const hit = resolveRole(spec, from, role), product = hit && CATALOG.products[hit.product];
  return product ? { id: hit.owner + '.' + role, region: hit.owner, label: product.label, product: hit.product } : null;
}
// Token scopes: "" = the region, "remote_hub" = its remote hub, "host:<role>" = the region that hosts that role for
// it (e.g. the hub of its connector or gateway), only when that region has a hub.
function scopeRegion(spec, region, scope) {
  if (!scope) return region;
  if (scope === 'remote_hub') return regionById(spec, region.remote_hub);
  const host = regionById(spec, hostOf(spec, region, scope.replace('host:', '')));
  return hasHub(host) ? host : null;
}
// The id of the region hosting a role for this region, or null; 'hybrid' = the hub of its gateway.
function hostOf(spec, region, role) {
  const hit = role === 'hybrid' ? hybridOf(spec, region) : resolveRole(spec, region, role);
  return hit ? hit.owner : null;
}
// "peering:remote_hub": to the remote hub. "peering:host:<role>": from the region hosting the role, only when that
// is another region (use it with '?'); "peering:to:host:<role>": the same hop towards that region.
function peeringStep(spec, region, target) {
  const cross = topologyOf(spec).cross, hub = regionById(spec, region.remote_hub), to = target.startsWith('to:');
  if (target === 'remote_hub') return hub && { id: null, label: `${cross} to ${hub.name}` };
  const host = hostOf(spec, region, target.replace(/^(to:)?host:/, ''));
  const label = `${cross} ${to ? 'to' : 'from'} ${host && regionById(spec, host).name}`;
  return host && host !== region.id ? { id: null, label } : null;
}
// Resolve a token list; a token without '?' that resolves to nothing makes the whole path unavailable.
function resolveSteps(tokens, resolve) {
  const steps = [];
  let missing = null;
  for (const token of tokens) {
    const step = resolve(token);
    if (step) steps.push(step);
    else if (!token.includes('?')) missing = missing || token.split('@')[0];
  }
  return { steps: missing ? [] : steps, missing };
}
// A template without "steps" is a choice, resolved level by level: by role ("byRole": the first role the region
// has, else "*"), by sub-option (the type's subOptions: the one asked for if offered, else the first offered),
// by the virtual hub's state ("byHub", topology.js: routing intent, no security) or by variant (the one asked for,
// else the spec setting; "*" = any variant).
function pickTemplate(spec, region, type, asked, opts) {
  const pathType = RULES.pathTypes[type], subs = pathType.subOptions || {};
  let node = pathsOf(spec, patternOf(region))[type], variant = null, sub = null;
  while (node && !node.steps) {
    if (typeof node === 'string') { node = RULES.sharedPaths[node]; continue; }  // a template shared by patterns
    const keys = Object.keys(node).filter(k => !['byRole', 'variantBy', 'byHub'].includes(k));
    let key;
    if (node.byRole) key = node.byRole.find(role => resolveRole(spec, region, role)) || '*';
    else if (node.byHub) {
      key = vwanChoice(spec, region, node);
      variant = variant || RULES.vwan.stateLabels[key] || null;
      if (!node[key]) key = node[RULES.vwan.fallback[key]] ? RULES.vwan.fallback[key] : '*';  // e.g. 'nva' -> 'none'
    } else if (keys.every(k => k in subs)) {
      const offered = keys.filter(k => subOffered(spec, region, type, k));
      key = sub = offered.includes(opts.sub) ? opts.sub : offered[0] || keys[0];
    } else {
      const by = node.variantBy || pathType.variantBy;
      key = asked || (by === 'dns_model' ? dnsModelOf(spec, region) : setting(spec, region, by));  // engine.js
      if (!node[key] && node['*']) key = '*';
      variant = key === '*' ? null : key;
    }
    node = node[key];
  }
  return { template: node, variant, sub };
}
// Is a sub-option offered for this region? rules.js "subNeeds": the role that must resolve (hybrid = a gateway).
function subOffered(spec, region, type, sub) {
  const need = (RULES.pathTypes[type].subNeeds || {})[sub];
  return !need || !!hostOf(spec, region, need.role);
}
// Why a sub-option isn't offered: its capability is not needed in this minimal hub, or nothing provides it.
function subWhy(spec, region, type, sub) {
  const need = RULES.pathTypes[type].subNeeds[sub], cap = need.role === 'hybrid' ? 'hybrid' : capOf(spec, need.role);
  return capState(spec, region, cap) === 'none' ? notNeededText(spec, cap) : need.why;
}

/* ===== NOT NEEDED: a minimal hub's capability set to "Not needed" (rules.js notNeeded) ===== */
const notNeededText = (spec, cap) => (RULES.notNeeded.texts || {})[cap] || RULES.notNeeded.text.replace('{what}',
  RULES.notNeeded.what[cap] || CATALOG.capabilities[topoKey(spec)][cap][1]);
// The capability of a template token that resolved to nothing ({dns}, {remote_hub.hybrid}, edge, onprem …).
function tokenCap(spec, token) {
  const role = token.replace(/[{}?]/g, '').split('@')[0].split('.').pop();
  if (['hybrid', 'edge', 'provider', 'onprem'].includes(role)) return 'hybrid';
  return CATALOG.roles[role] ? capOf(spec, role) : null;
}
// A DNS path of a region with no resolver (engine.js dnsModelOf 'none'): Azure-provided DNS answers its own queries
// (rules.js notNeeded.dns); on-premises names and queries from on-premises have no resolver to go through.
const noResolver = (spec, region, type) => type === 'dns' && region.pattern !== 'disconnected' &&
  dnsModelOf(spec, region) === 'none';
// Build the path of one type for one region. variant overrides the spec setting (DNS: centralized / distributed);
// opts.sub picks a sub-option (DNS query direction, ingress source); opts.dest makes east-west a cross-region path.
// A template's "awayNote" (Virtual WAN: RULES.vwan.away) is added when a step lives in another region (e.g. a
// connector in the remote hub).
function buildPath(spec, region, type, variant, opts = {}) {
  const regional = buildRegionalPath(spec, region, type, variant, opts);
  return type === 'ingress' ? composeGlobalIngress(spec, region, regional, opts, buildRegionalPath) : regional;
}
function buildRegionalPath(spec, region, type, variant, opts = {}) {
  const dest = opts.dest && regionById(spec, opts.dest);
  if (type === 'east_west' && dest && dest !== region) return crossRegionPath(spec, region, dest);
  let { template, ...picked } = pickTemplate(spec, region, type, variant, opts), pattern = patternOf(region);
  picked.sub = picked.sub || Object.keys(RULES.pathTypes[type].subOptions || {})[0] || null;
  const none = noResolver(spec, region, type);
  if (none) picked.sub = opts.sub in (RULES.pathTypes.dns.subOptions || {}) ? opts.sub : 'azure';
  if (none && picked.sub === 'azure') [template, picked.variant] = [RULES.notNeeded.dns, null];
  else if (none) return { type, ...picked, variant: null, steps: [], na: true, notNeeded: 'dns',
    note: notNeededText(spec, 'dns'), ref: RULES.notNeeded.dns.ref };
  if (!template) return { type, ...picked, steps: [], na: true,
    note: `No ${RULES.pathTypes[type].label.toLowerCase()} path for a ${pattern.label} region.` };
  const resolved = resolveSteps(template.steps, token => resolveToken(spec, region, token, opts));
  const { missing } = resolved, steps = withInterconnect(spec, template.autoPeering  // hybrid.js, topology.js
    ? withPeerings(spec, region, resolved.steps) : resolved.steps);
  const cap = missing && tokenCap(spec, missing);
  if (cap && pattern.hub === 'partial' && capState(spec, region, cap) === 'none') return { type, ...picked,
    steps: [], na: true, missing, notNeeded: cap, note: notNeededText(spec, cap), ref: template.ref };
  const failure = failureState(spec, region, opts.fail);  // hybrid.js: a simulated failure on this path's hub
  if (missing && failure && !failure.conn) return { type, ...picked, steps: [], na: true, missing, failure,
    note: RULES.failover.cut, failover: failoverNote(spec, failure) };
  const awayNote = template.awayNote ? { text: template.awayNote, ref: template.awayRef || template.ref }
    : isVwan(spec) && RULES.vwan.away;  // Virtual WAN: one note for every template (rules.js)
  const extra = awayNote && steps.some(s => s.region && s.region !== region.id) ? awayNote
    : (topologyOf(spec).notes || {})[type];
  return { type, ...picked, steps, na: !!missing || !steps.length, missing, note: template.note, ref: template.ref,
    extra, failure: steps.some(s => s.conn) ? failure : null,
    failover: steps.some(s => s.conn) ? failoverNote(spec, failure) : null };
}
// All reference ids behind a path: template, topology note, pattern and products on the path.
function pathRefs(path, region, specForPath) {
  const products = path.steps.filter(s => s.product).map(s => CATALOG.products[s.product].ref);
  const ingress = path.type === 'ingress' && path.sub in (RULES.ingressPoints || {}) &&
    !(specForPath && isVwan(specForPath) && patternOf(region).vwanPaths)
    ? RULES.ingressPoints[path.sub].map(t => t.ref) : [];
  const ids = [path.ref, ...[path.extra, path.failover].map(n => n && n.ref), ...patternOf(region).refs, ...ingress,
    ...products,
    ...(path.globalRefs || []), ...path.steps.map(s => s.ref)];
  return [...new Set(ids.filter(Boolean))];
}

/* ===== CHECKS ===== */
const yes = b => (b ? 'yes' : 'no');
// Facts about a region that check expressions can test. All values are strings.
function regionFacts(spec, region) {
  const target = regionById(spec, region.remote_hub), minimal = patternOf(region).hub === 'partial';
  const links = (spec.region_links || []).filter(l => l.from === region.id || l.to === region.id);
  const uses = minimal ? capKeys(spec).some(k => capState(spec, region, k) === 'remote')
    : region.pattern === 'remote-hub';
  return {
    id: region.id, name: region.name || region.id, pattern: region.pattern, uses_remote: yes(uses),
    remote_hub: region.remote_hub || 'none',
    remote_hub_pattern: !region.remote_hub ? 'none' : target && target !== region ? target.pattern : 'missing',
    dns_state: roleState(spec, region, 'dns'), hybrid_state: capState(spec, region, 'hybrid'),
    dns_model: dnsModelOf(spec, region), topology: topoKey(spec),
    local_missing: localMissing(spec, region).map(k => CATALOG.capabilities[topoKey(spec)][k][0]).join(', ') || 'none',
    known_region: yes(azureRegion(region)), has_links: yes(links.length),
    linked_to_remote_hub: yes(region.remote_hub && linkBetween(spec, region.id, region.remote_hub)),
    pattern_label: patternOf(region).label, ignored_overrides: ignoredOverrides(region).join(', ') || 'none',
    ...circuitFacts(spec, region), ...interconnectFacts(spec, region), ...vwanFacts(spec, region)  // hybrid.js, ...
  };
}
// Role overrides the region's pattern doesn't allow (resolveRole ignores them), as role labels.
const ignoredOverrides = region => Object.keys(CATALOG.roles).filter(role => region[role] &&
  !CATALOG.roles[role].derived && !allowsField(region, role)).map(role => CATALOG.roles[role].label);
// Facts about one hub link.
function linkFacts(spec, link) {
  const a = regionById(spec, link.from), b = regionById(spec, link.to);
  const ownFirewall = r => r && (resolveRole(spec, r, 'firewall') || {}).owner === r.id;  // in the region's own hub
  const without = [a, b].filter(r => r && hasHub(r) && !ownFirewall(r)).map(r => r.name);
  return {
    name: `${a ? a.name : link.from} ↔ ${b ? b.name : link.to}`, kind: link.kind || 'hub',
    topology: topoKey(spec), implicit: yes(link.implicit),
    ends_exist: yes(a && b && a !== b), ends_have_hubs: yes(hasHub(a) && hasHub(b)),
    ends_connected: yes(a && b && a.pattern !== 'disconnected' && b.pattern !== 'disconnected'),
    both_firewalls: yes(!without.length), without_firewall: without.join(' and ') || 'none',
    shared_circuits: sharedCircuits(spec, link.from, link.to),  // hybrid.js: a bow-tie
    ...vwanLinkFacts(spec, link)  // topology.js
  };
}
// Tiny expression language: field == 'x', field != 'x', field in ['a','b'], joined with &&.
function evalExpr(expr, facts) {
  return expr.split('&&').every(clause => {
    const m = clause.trim().match(/^(\w+)\s*(==|!=|in)\s*(.+)$/);
    if (!m || !(m[1] in facts)) throw new Error('Cannot evaluate rule clause: ' + clause.trim());
    const value = facts[m[1]];
    const literals = [...m[3].matchAll(/'([^']*)'/g)].map(x => x[1]);
    if (m[2] === 'in') return literals.includes(value);
    return m[2] === '==' ? value === literals[0] : value !== literals[0];
  });
}
// target: the editor item the check is about ("region:<id>", "hub:<id>", "link:<a>|<b>", "conn:<id>", "site:<id>"),
// for the editor's badges and the Checks panel's links (editor-actions.js); a region check about hybrid routing
// targets its hub (the hub's section in the Hybrid tab).
const HUB_CHECK = /^er-/;
function applyChecks(checks, facts, region, results, target) {
  for (const check of checks) {
    if (evalExpr(check.when, facts) && !evalExpr(check.require, facts)) {
      const text = check.message.replace(/\{(\w+)\}/g, (_, key) => facts[key] ?? key);
      const on = target && HUB_CHECK.test(check.id) ? target.replace('region:', 'hub:') : target;
      results.push({ id: check.id, severity: check.severity, text, ref: check.ref, region, target: on });
    }
  }
}
// Run region, link, hybrid connection and estate checks. Returns [{ id, severity, text, ref, region, target }].
function runChecks(spec) {
  const results = (spec.notes || []).map(text => ({ severity: 'warning', text, target: 'estate' }));  // spec.js
  for (const region of spec.regions) {
    const facts = RULES.patterns[region.pattern] && regionFacts(spec, region);
    if (facts) applyChecks([...RULES.checks, ...RULES.vwanChecks], facts, region.id, results, 'region:' + region.id);
    else results.push({ severity: 'error', region: region.id,
      text: `${region.name}: unknown pattern '${region.pattern}'` });
  }
  for (const link of regionLinks(spec, true)) {
    applyChecks([...RULES.linkChecks, ...RULES.vwanLinkChecks], linkFacts(spec, link), link.from, results,
      `link:${link.from}|${link.to}`);
  }
  for (const c of hybridConnections(spec)) {
    applyChecks(RULES.hybridChecks, connectionFacts(spec, c), c.site, results, 'conn:' + c.id);
  }
  applyChecks(RULES.estateChecks, estateFacts(spec), 'estate', results);
  return [...results, ...globalEntryChecks(spec)];
}

const GLOBAL_NONE = { type: 'none', origins: [] };
const GLOBAL_ROLES = ['active', 'backup'];
function globalEntry(spec) {
  const raw = spec.global_entry || GLOBAL_NONE;
  return { ...GLOBAL_NONE, ...raw, origins: Array.isArray(raw.origins) ? raw.origins : [] };
}
const globalEntryRule = spec => RULES.globalEntry.types[globalEntry(spec).type] || RULES.globalEntry.types.none;
const globalEntryOn = spec => globalEntry(spec).type !== 'none';
const globalEntryLabel = spec => globalEntryRule(spec).label;
// Valid origins in spec order: { region (spec region), role }; unknown regions are left to the checks.
const globalOrigins = spec => globalEntry(spec).origins.map(o => ({ id: o.region, region: regionById(spec, o.region),
  role: GLOBAL_ROLES.includes(o.role) ? o.role : 'active' }));
const originOf = (spec, regionId) => globalOrigins(spec).find(o => o.region && o.region.id === regionId) || null;
// The origins that take traffic: every healthy active origin; when none is left, every healthy backup.
function servingOrigins(spec, failed = []) {
  const healthy = globalOrigins(spec).filter(o => o.region && !failed.includes(o.region.id));
  const active = healthy.filter(o => o.role === 'active');
  return active.length ? active : healthy.filter(o => o.role === 'backup');
}
const ORIGIN_WORD = { 'traffic-manager': 'endpoint' };
const originWord = spec => ORIGIN_WORD[globalEntry(spec).type] || 'origin';
// Region header tag: "Active origin", "Backup endpoint".
function originTag(spec, regionId) {
  const o = originOf(spec, regionId);
  return o ? `${RULES.globalEntry.roles[o.role]} ${originWord(spec)}` : '';
}
// Fail origin: offered on an origin that takes traffic now, when another origin can take over.
const globalFailoverOffered = (spec, regionId) => globalOrigins(spec).filter(o => o.region).length > 1 &&
  servingOrigins(spec).some(o => o.region.id === regionId);
const nameList = list => list.map(o => o.region.name).join(', ');
// Overview wording for a region's internet ingress: "via Azure Front Door (active origin)" or "direct (not behind
// Azure Front Door)"; empty without global entry.
function globalEntryVia(spec, region) {
  if (!globalEntryOn(spec)) return '';
  const o = originOf(spec, region.id), label = globalEntryLabel(spec);
  return o ? `via ${label} (${o.role} ${originWord(spec)})` : `direct (not behind ${label})`;
}

/* ===== PATH: the internet ingress of an origin region, behind the global entry service ===== */
// Internet → service → the serving origin's own regional ingress (Traffic Manager: a DNS answer, then the client
// connects to the region directly). opts.globalFail: the region whose origin is simulated as down.
function composeGlobalIngress(spec, requested, regionalPath, opts, buildRegional) {
  if (!globalEntryOn(spec) || regionalPath.sub !== 'internet') return regionalPath;
  const rule = globalEntryRule(spec), word = originWord(spec), own = originOf(spec, requested.id);
  if (!own) return { ...regionalPath, globalNote: { text: `${requested.name} is not an ${word} of ${rule.label}:` +
    ' internet traffic reaches this region\'s own public ingress directly.', ref: rule.refs[0] } };
  const failed = opts.globalFail ? [opts.globalFail] : [], serving = servingOrigins(spec, failed);
  const down = failed.includes(requested.id), standby = !down && !serving.some(o => o.region === requested);
  const target = down ? serving[0] : own;
  if (!target) return { ...regionalPath, steps: [], na: true, missing: 'global origin', globalEntry: true,
    note: `No healthy ${word} is left: ${rule.label} has nowhere to send internet traffic.` };
  const regional = target.region === requested ? regionalPath
    : buildRegional(spec, target.region, 'ingress', null, { ...opts, globalFail: null });
  const rest = regional.steps[0] && regional.steps[0].id === 'internet' ? regional.steps.slice(1) : regional.steps;
  const hop = rule.inPath ? { id: 'global_entry', label: rule.label, ref: rule.refs[0] }
    : { id: null, label: `${rule.label} (DNS answer: ${target.region.name})`, ref: rule.refs[0] };
  const others = serving.filter(o => o.region !== target.region);
  const text = standby ? `Backup ${word}: ${rule.label} sends traffic here only when every active ${word} ` +
      `(${nameList(globalOrigins(spec).filter(o => o.role === 'active' && o.region))}) is unavailable.`
    : down ? `${requested.name} ${word} unavailable (simulated): ${rule.label} sends its traffic to ` +
      `${target.region.name}${target.role === 'backup' ? ` (backup ${word})` : ''}.`
    : `Active ${word}: ${rule.label} sends internet traffic here` + (others.length ? `, and to ${nameList(others)};` +
      ' how it chooses between active origins is not modelled.' : '.');
  const steps = [regional.steps[0] || { id: 'internet', label: 'Internet' }, hop, ...rest];
  return { ...regional, steps, region: target.region.id, globalEntry: true, globalStandby: standby,
    globalRefs: rule.refs, globalPoints: rule.points, globalNote: down ? null : { text, ref: rule.refs[0] },
    failover: down ? { text, ref: rule.refs[0] } : regional.failover };
}

/* ===== GLOBAL ENTRY CHECKS: origins that exist, can take internet traffic, and at least one active ===== */
function globalEntryChecks(spec) {
  if (!globalEntryOn(spec)) return [];
  const rule = globalEntryRule(spec), word = originWord(spec), origins = globalOrigins(spec), out = [];
  const add = (id, severity, text) => out.push({ id, severity, text, ref: rule.refs[0], target: 'estate' });
  if (!origins.length) add('global-no-origins', 'error', `${rule.label} has no ${word}s: add a region.`);
  else if (!origins.some(o => o.role === 'active')) add('global-no-active', 'error',
    `${rule.label} has no active ${word}: set at least one ${word} to Active.`);
  if (origins.length === 1) add('global-one-origin', 'info',
    `${rule.label} has one ${word}: no other region can take over if it fails.`);
  const seen = new Set();
  for (const o of origins) {
    if (!o.region) add('global-unknown-origin', 'error', `Global entry ${word} "${o.id}" is not in this estate.`);
    else if (seen.has(o.region.id)) add('global-duplicate-origin', 'error',
      `${o.region.name} is listed more than once as a ${word}.`);
    else {
      seen.add(o.region.id);
      if (!subOffered(spec, o.region, 'ingress', 'internet')) add('global-no-ingress', 'error',
        `${o.region.name} is a ${word} but has no public ingress (WAF) for internet traffic.`);
    }
  }
  return out;
}

/* ===== DNS CONTEXT: what the spokes use, where the zones are linked, what they can resolve ===== */
// The DNS model a region uses. The setting applies only where the region hosts its own resolver: without one the
// spokes use Azure-provided DNS ('none'); with the resolver in another region it is centralized, because a
// forwarding ruleset can't be linked to a VNet in another region.
function dnsModelOf(spec, region) {
  const resolver = resolveRole(spec, region, 'dns');
  if (!resolver) return 'none';
  return resolver.owner !== region.id ? 'centralized' : setting(spec, region, 'dns_model');
}
// Why the region's DNS model is fixed (rules.js dnsModelFixed), or null when its own setting applies.
function dnsModelFixed(spec, region) {
  if (region.pattern === 'disconnected') return null;
  const resolver = resolveRole(spec, region, 'dns'), F = RULES.dnsModelFixed;
  if (!resolver) return F.none;
  return resolver.owner !== region.id ? F.remote.replace('{hub}', regionById(spec, resolver.owner).name) : null;
}
function dnsContext(spec, region) {
  const resolver = resolveRole(spec, region, 'dns'), hybrid = hybridOf(spec, region);
  const key = region.pattern === 'disconnected' ? 'disconnected' : dnsModelOf(spec, region);
  const D = RULES.dnsContext[key], onprem = !!hybrid;
  const linked = spec.regions.filter(r => hasHub(r) &&
    (resolveRole(spec, r, 'dns') || {}).owner === r.id).map(r => r.name);
  const fill = s => s.replace('{dns_hub}', resolver ? regionById(spec, resolver.owner).name : '')
    .replace('{zones_linked}', linked.join(', ') || 'none')
    .replace('hub VNets', isVwan(spec) ? VWAN_ZONES : 'hub VNets');
  const usable = item => !item.needs || onprem;
  return { refs: D.refs || [], servers: fill(D.servers), zones: fill(D.zones),
    can: D.can.filter(usable).map(i => fill(i.text)),
    cannot: [...D.cannot, ...D.can.filter(i => !usable(i)).map(i => i.text + ' (no hybrid connection)')].map(fill) };
}

const VWAN_ZONES = 'shared services VNets (a private DNS zone can\'t be linked to a virtual hub)';

/* ===== REGION SUMMARY, ADMIN ACCESS, MATRIX ===== */
// Where a role of a region lives, in words: "this hub", "West Europe hub", "this shared services VNet" (Virtual
// WAN), "this spoke".
function placeText(spec, region, role) {
  const hit = resolveRole(spec, region, role), owner = hit && regionById(spec, hit.owner);
  if (!owner) return '';
  const where = roleWhere(spec, owner, role), mine = owner === region;  // topology.js
  const box = where === 'shared-services' ? 'shared services VNet' : where === 'spoke' ? 'spoke' : 'hub';
  return mine ? `this ${box}` : `${owner.name} ${box}`;
}
// Where admins reach VMs from: the Bastion that resolveRole finds for this region (own hub, remote hub or spoke).
function adminAccess(spec, region) {
  const hit = resolveRole(spec, region, 'bastion'), product = hit && CATALOG.products[hit.product];
  const where = placeText(spec, region, 'bastion').replace(/^this hub$/, "this region's hub");
  const across = isVwan(spec) ? 'through the virtual WAN' : 'over cross-region peering';
  if (product && hit.owner !== region.id) return `${product.label} in ${where} (reached ${across})`;
  if (product) return `${product.label} in ${where}`;
  if (hasHub(region) || followsRemote(region)) return 'No central admin access configured';
  return 'No Bastion deployed — options: add Azure Bastion in the spoke, or use Microsoft Defender for Cloud' +
    ' just-in-time VM access';
}
// Overview of one region (side panel when no path is selected): what it hosts, borrows and connects to.
function regionSummary(spec, region) {
  const product = role => CATALOG.products[resolveRole(spec, region, role).product];
  const label = role => { const p = product(role).label, r = roleLabel(spec, role);
    return p === r ? p : `${r}: ${p}`; };
  const owned = ownedRoles(spec, region), borrowed = Object.keys(CATALOG.roles)
    .map(role => [role, resolveRole(spec, region, role)])
    .filter(([, hit]) => hit && hit.owner !== region.id && CATALOG.products[hit.product]);
  return { hosts: owned.hub.map(label), shared: owned.shared.map(label), spokeLevel: owned.spoke.map(label),
    consumes: borrowed.map(([role]) => `${label(role)} · ${placeText(spec, region, role)}`),
    links: backboneConnections(spec).filter(c => [c.from, c.to].includes(region.id))
      .map(c => connectionLabel(spec, c)) };
}
// Connectivity matrix cell: east-west from src to dst (same region: inspected where a firewall is on the path).
function connectivity(spec, src, dst) {
  if (src !== dst) return crossRegionPath(spec, src, dst).matrix;
  const p = buildPath(spec, src, 'east_west'), fw = p.steps.find(s => /\.firewall$/.test(s.id || ''));
  if (p.na) return src.pattern === 'disconnected' ? 'Within region: no route by design' : 'Within region: no route';
  if (!fw) return isVwan(spec) ? 'Within region: not inspected (virtual hub router)' : 'Within region: direct';
  return 'Within region: inspected' + (fw.region !== src.id ? ` (${regionById(spec, fw.region).name} firewall)` : '');
}

/* ===== INGRESS OPTIONS (rules.js ingress subOptions / subNeeds) ===== */
// Each option of a region: offered or not (why), and where the service that carries it lives.
function ingressOptions(spec, region) {
  const type = RULES.pathTypes.ingress, needs = type.subNeeds || {};
  return Object.entries(type.subOptions).map(([sub, label]) => {
    const need = needs[sub] || {}, host = need.role && hostOf(spec, region, need.role);
    const where = !host ? '' : need.role === 'hybrid' ? (host === region.id ? 'this hub'
      : `${regionById(spec, host).name} hub`) : placeText(spec, region, need.role);
    const offered = subOffered(spec, region, 'ingress', sub);
    return { sub, label, offered, why: offered ? '' : subWhy(spec, region, 'ingress', sub), where };
  });
}

/* ===== ESTATE HELPERS for the UI (still no DOM) ===== */
// Roles a hub hosts (in either topology): hub-spoke placement "hub", or the virtual hub allow-list (catalog.js).
const HUB_ROLES = Object.keys(CATALOG.roles).filter(role => CATALOG.virtualHub.roles.includes(role) ||
  ((CATALOG.roles[role].placement || {})['hub-spoke'] || [])[0] === 'hub');
// Roles a region hosts itself, by where they are drawn (topology.js roleWhere): its hub (hub VNet or virtual hub), its
// shared services VNet (Virtual WAN) or its spoke-level strip.
function ownedRoles(spec, region) {
  const owned = Object.keys(CATALOG.roles).filter(role => {
    const hit = resolveRole(spec, region, role);
    return hit && hit.owner === region.id && CATALOG.products[hit.product];
  });
  const where = role => roleWhere(spec, region, role, resolveRole(spec, region, role).product);  // topology.js
  const at = place => owned.filter(role => where(role) === place);
  return { hub: [...at('hub'), ...at('virtual-hub')], shared: at('shared-services'), spoke: at('spoke') };
}
// Hub roles grouped by function (catalog.js "groups" and each role's "group"); empty groups are omitted.
function groupRoles(roles) {
  return Object.keys(CATALOG.groups).map(g => [g, roles.filter(r => CATALOG.roles[r].group === g)])
    .filter(([, list]) => list.length);
}
// Diagram column order: areas in order of first appearance in spec.regions, regions in spec order within an area.
const areaOf = region => (azureRegion(region) || { area: 'Other' }).area;  // unknown regions: area "Other"
function areaGroups(spec) {
  const areas = [...new Set(spec.regions.map(areaOf))];
  return areas.map(area => ({ area, regions: spec.regions.filter(r => areaOf(r) === area) }));
}
function regionOrder(spec) { return areaGroups(spec).flatMap(group => group.regions); }
// Small facts from catalog.js (editor hint and region tooltip).
function azureFacts(region) {
  const r = azureRegion(region), zones = r && (r.zones ? r.zones + ' availability zones' : 'no availability zones');
  return r ? `${r.location} · ${zones} · paired: ${r.paired || 'none'}` : 'Not in the Azure region list';
}
