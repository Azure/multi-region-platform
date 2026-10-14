/* editor.js: editor field helpers and the Estate, Regions, Region links and Hybrid tabs. */
/* ===== FIELD BUILDERS ===== */
const asPairs = values => values.map(v => [v, v]), DNS_MODELS = asPairs(['centralized', 'distributed']);
const patternPairs = () => Object.entries(RULES.patterns).map(([k, v]) => [k, v.label]);
// "Circuit A preferred" for a hub with circuits (hybrid.js), as a list to spread into a summary line.
const preferredCircuit = region => hubCircuits(spec, region).slice(0, 1).map(c => `${c.name || 'Circuit'} preferred`);
function selectField(label, path, pairs, current, blank) {
  const list = blank ? [['', blank], ...pairs] : pairs;
  const opts = list.map(([v, l]) => `<option value="${esc(v)}" ${v === (current || '') ? 'selected' : ''}>${esc(l)}`);
  return `<label>${label}<select data-path="${path}">${opts.join('')}</select></label>`;
}
const wide = html => html.replace('<label>', '<label class="wide">');  // a long label or long options: stacked
const textField = (label, path, value) => `<label>${label}<input type="text" data-path="${path}"
  value="${esc(value)}"></label>`;
function checkboxes(listPath, pairs, selected, locked = []) {  // locked: shown ticked and disabled
  return '<div class="checks">' + pairs.map(([v, l]) => `<label><input type="checkbox" data-list="${listPath}"
    value="${esc(v)}" ${selected.includes(v) || locked.includes(v) ? 'checked' : ''}${locked.includes(v) ? ' disabled'
    : ''}>${esc(l)}</label>`).join('') + '</div>';
}
// Region <option>s grouped by area and sorted by name; flags(r) adds ' selected' / ' disabled'.
function regionGroups(flags) {
  const opt = r => `<option value="${r.id}"${flags(r)}>${esc(r.name)}`;
  return AZURE_REGIONS.areas.map(area => `<optgroup label="${area}">` + AZURE_REGIONS.regions
    .filter(r => r.area === area).sort((a, b) => a.name.localeCompare(b.name)).map(opt).join('') + '</optgroup>')
    .join('');
}
// "Move left / right" buttons, disabled at the ends; data-focus keeps the keyboard focus across the re-render.
function moveButtons(act, key, index, count, what) {
  const button = (delta, text, side) => `<button data-act="${act}" data-key="${esc(key)}" data-delta="${delta}"
    data-focus="${act}:${esc(key)}:${delta}" title="Move ${esc(what)} ${side}" aria-label="Move ${esc(what)} ${side}"
    ${index + delta < 0 || index + delta >= count ? 'disabled' : ''}>${text}</button>`;
  return button(-1, '◀ Left', 'left') + button(1, 'Right ▶', 'right');
}
const nameOfSite = id => (siteById(spec, id) || { name: id }).name;
// A button that opens an item in the Selected item panel (editor-actions.js): a pill with a pencil (styles.css .chip).
const editChip = (key, label, text = '', cls = 'chip') => `<button class="${cls}" data-act="sel" data-key="${esc(key)}"
  title="${esc(label)}" aria-label="${esc(label)}">${text}</button>`;
const TYPE_NAMES = { expressroute: 'ExpressRoute', vpn: 'site-to-site VPN' };
// A role's dropdown: Virtual WAN "Hub security" (catalog.js role "vwan": its products in a virtual hub, and None) for
// a role each virtual hub has on its own; else the products that can sit at `place`. Returns [label, pairs].
// Hub security offers what can sit in the virtual hub (allow-list) and a firewall NVA for the shared services VNet.
function roleChoices(role, place, keep) {
  const r = CATALOG.roles[role], v = isVwan(spec) && (r.perHub || []).includes('vwan') && place === 'virtual-hub';
  if (!v) return [r.label, productsFor(role, place, keep)];
  const pairs = productsFor(role, place, keep).concat(productsFor(role, 'shared-services', keep)
    .filter(([id]) => !inVirtualHub(id)).map(([id]) => [id, CATALOG.products[id].vwan.option]));
  return [r.vwan.label, [...new Map(pairs).entries(), ['none', r.vwan.none]]];
}

/* ===== COLLAPSIBLE SECTIONS (native <details>; open state kept in memory across re-renders) ===== */
const editorState = { tab: 'estate', rendering: null };  // the active tab; the tab being rendered
const openFolds = new Set();
let foldKeys = [];  // the sections of the last render: { key, tab }, for "Expand all / Collapse all" of a tab
function fold(key, summary, body, extra = '') {
  foldKeys.push({ key, tab: editorState.rendering });
  return `<details class="fold" data-fold="${esc(key)}"${openFolds.has(key) ? ' open' : ''}${extra}><summary>${summary}
    </summary>${body}</details>`;
}
const tabFolds = () => foldKeys.filter(f => f.tab === editorState.tab).map(f => f.key);
const allOpen = () => tabFolds().length > 0 && tabFolds().every(k => openFolds.has(k));
function onFoldToggle(e) {  // 'toggle' doesn't bubble: app.js listens in the capture phase
  const key = e.target.dataset && e.target.dataset.fold;
  if (!key) return;
  if (e.target.open) openFolds.add(key); else openFolds.delete(key);
  const button = $('btnFolds');
  if (button) button.textContent = allOpen() ? 'Collapse all' : 'Expand all';
}
// The 'toggle' event arrives a task later: before an edit re-renders the editor, take the open sections from the page.
function syncFolds() {
  for (const d of $('editor').querySelectorAll('details.fold')) openFolds[d.open ? 'add' : 'delete'](d.dataset.fold);
}
function toggleFolds() {
  const all = allOpen();
  tabFolds().forEach(k => (all ? openFolds.delete(k) : openFolds.add(k)));
}

/* ===== STATUS MESSAGES (pattern change, all hub links, Apply to all) ===== */
// The message of the last edit, shown next to its setting until the next edit; "Undo" steps back (editor.js).
function editStatus(key) {
  const status = ui.status && ui.status.key === key && ui.status;
  if (!status) return '';
  const undo = status.undo ? '<button class="link" data-act="undo">Undo</button>' : '';
  return `<div class="${status.error ? 'hint left warn' : 'hint left'}" role="status">${esc(status.text)}${undo}</div>`;
}

/* ===== INLINE CHECKS: a badge next to the setting a check is about (engine.js check "target") ===== */
// ✕ error, ⚠ warning, and for info an "i" that styles.css draws circled (ⓘ is missing from many fonts)
const SEVERITY = { error: '✕', warning: '⚠', info: 'i' }, RANK = ['error', 'warning', 'info'];
function badge(target) {
  const list = (editorState.checks || []).filter(c => c.target === target);
  if (!list.length) return '';
  const worst = RANK.find(s => list.some(c => c.severity === s)) || 'info', n = list.length;
  return `<span class="badge ${worst}" role="img" aria-label="${n} check${n > 1 ? 's' : ''} (${worst})"
    title="${esc(list.map(c => c.text).join('\n\n'))}">${SEVERITY[worst]}${n > 1 ? n : ''}</span>`;
}

/* ===== ACTIONS: data-act buttons; each tab module registers its own ===== */
const EDITOR_ACTIONS = {};
function editorAction(data) {
  const run = EDITOR_ACTIONS[data.act];
  if (run) run(data);
}

/* ===== TAB ===== */
function estateTab() {
  const topologies = Object.entries(RULES.topologies).map(([k, v]) => [k, v.label]);
  return textField('Title', 'title', spec.title) + textField('Customer', 'customer', spec.customer) +
    wide(selectField('Topology', 'defaults.topology', topologies, spec.defaults.topology)) +
    globalEntryEditor() +
    (isVwan(spec) ? '<h3>Virtual WAN</h3>' + vwansEditor() + vwanRouting() : '') +
    fold('defaults', `<b>Default products and settings</b><span class="line">${esc(defaultsLine())}</span>`,
      defaultsBody());
}
// Global entry: the service, and the regions behind it as active or backup origins. How a service picks between
// several active origins (routing methods, weights) and Front Door Private Link are not modelled.
function globalEntryEditor() {
  const entry = globalEntry(spec), typePairs = Object.entries(RULES.globalEntry.types).map(([id, r]) =>
    [id, r.label]);
  let body = wide(selectField('Service', 'global_entry.type', typePairs, entry.type));
  if (entry.type === 'none') return fold('global-entry', '<b>Global entry</b><span class="line">None</span>', body);
  const word = originWord(spec), hint = globalEntryRule(spec).inPath ? 'Clients connect to the service, which' +
    ' forwards to an origin.' : 'DNS only: the client connects to the region it is given.';
  body += `<div class="hint left">${esc(hint)} Active ${word}s take internet traffic; a backup takes it only when` +
    ` every active ${word} is unavailable.</div><h3>Regional ${word}s</h3>` + globalOriginRows(entry);
  const count = role => globalOrigins(spec).filter(o => o.role === role).length;
  const summary = `${globalEntryLabel(spec)} · ${count('active')} active, ${count('backup')} backup`;
  return fold('global-entry', `<b>Global entry</b><span class="line">${esc(summary)}</span>`, body);
}
function globalOriginRows(entry) {
  const pairs = spec.regions.map(r => [r.id, r.name]), roles = Object.entries(RULES.globalEntry.roles);
  const rows = entry.origins.map((origin, k) => `<div class="row origin" data-item="origin:${esc(origin.region)}">
    ${selectField('Region', `global_entry.origins.${k}.region`, pairs, origin.region)}
    ${selectField('Role', `global_entry.origins.${k}.role`, roles, origin.role || 'active')}
    <button data-act="del-origin" data-i="${k}" aria-label="Remove ${esc(nameOf(origin.region))}">✕</button></div>`)
    .join('');
  const add = entry.origins.length >= spec.regions.length ? ''
    : `<button data-act="add-origin">+ Add ${originWord(spec)}</button>`;
  return rows + add + editStatus('global-entry');
}
/* ===== VIRTUAL WANS: names (all Standard), add/remove and the virtual WAN of each hub ===== */
function vwansEditor() {
  const list = vwansOf(spec), hubs = spec.regions.filter(hasHub);
  const rows = list.map((w, k) => {
    const n = hubs.filter(r => vwanOf(spec, r) === w).length;
    const del = `<button data-act="del-vwan" data-i="${k}" aria-label="Remove virtual WAN ${esc(w.name)}"${
      list.length < 2 ? ' disabled' : ''}>✕</button>`;
    return `<div class="row" data-item="vwan:${esc(w.id)}">${textField('Name', `vwans.${k}.name`, w.name)}${del}` +
      `</div><div class="hint left">${n} virtual hub${n === 1 ? '' : 's'}</div>`;
  }).join('');
  const assign = list.length < 2 ? '' : hubs.map(r => selectField(`${esc(r.name)} hub`,
    `regions.${spec.regions.indexOf(r)}.vwan`, list.map(w => [w.id, w.name]), vwanOf(spec, r).id)).join('');
  return rows + `<button data-act="add-vwan">+ Add virtual WAN</button>${editStatus('vwans')}` + assign +
    '<div class="hint left">Standard virtual WAN: its hubs are connected in full mesh (hub-to-hub).</div>';
}
function vwanRouting() {
  const pref = selectField('Hub routing preference (default)', 'defaults.hub_routing_preference',
    Object.entries(HUB_PREFERENCES), hubPreference(spec, {})) + '<div class="hint left">Which routes a virtual hub' +
    ' prefers when one on-premises prefix is learned over both ExpressRoute and VPN connections (after the longest' +
    ' prefix match). It decides each site\'s primary link at the hub; the other link is the backup. Override per hub' +
    ' under Hybrid.</div>';
  return `<label>Routing intent (inspect in the hubs)<input type="checkbox" data-flag="defaults.routing_intent"
    ${routingIntent(spec) ? 'checked' : ''}></label><div class="hint left">Routing intent needs a security solution
    in each virtual hub (Hub security).</div>` + pref;
}
// Why a hub × hub cell of the link grid is (not) linked, in Virtual WAN: its tooltip.
function vwanCellReason(a, b) {
  const w = vwanOf(spec, a);
  if (w !== vwanOf(spec, b)) return 'Different virtual WANs: virtual hubs in different virtual WANs don\'t communicate';
  return `Virtual WAN ${w.name} links these hubs (full mesh); routing intent decides inspection`;
}

/* ===== DEFAULT PRODUCTS AND SETTINGS: every hub uses them unless a region overrides them ===== */
function defaultsBody() {
  let h = '';
  for (const role of HUB_ROLES.filter(r => !CATALOG.roles[r].derived)) {  // gateways follow the hybrid connections
    const place = placementOf(spec, role)[0], [label, pairs] = roleChoices(role, place, spec.defaults[role]);
    const fixed = place === 'virtual-hub' && (CATALOG.roles[role].vwan || {}).default;  // Hub security: Azure Firewall
    h += defaultField(label, role, pairs, fixed ? '' : '(none)', fixed);
  }
  h += defaultField('DNS model', 'dns_model', DNS_MODELS);
  return h;
}
// The main values in one line: firewall, public ingress and DNS model.
function defaultsLine() {
  const d = spec.defaults, none = role => 'no ' + CATALOG.roles[role].label.toLowerCase();
  const own = role => d[role] || (isVwan(spec) && (CATALOG.roles[role].vwan || {}).default);  // Hub security default
  const label = role => (CATALOG.products[own(role)] || { label: none(role) }).label;
  return [label('firewall'), label('ingress'), 'DNS ' + d.dns_model].filter(Boolean).join(' · ');
}
// A default dropdown with an "Apply to all" button that removes the matching override from every region.
function defaultField(label, key, pairs, blank, fallback) {  // fallback: shown when the estate sets no value
  const status = ui.status && ui.status.key === key ? ' ' + esc(ui.status.text) : '';
  return selectField(label, `defaults.${key}`, pairs, getPath(spec.defaults, key) || fallback, blank) +
    `<div class="hint" role="status">${status}<button class="link" data-act="apply-all" data-key="${key}"
    data-label="${esc(label)}" title="Remove this override from every region">Apply to all</button></div>`;
}

/* ===== ACTIONS ===== */
function applyToAll(key, label) {
  const regions = spec.regions.filter(r => getPath(r, key) !== undefined);
  regions.forEach(r => setPath(r, key, ''));
  const n = regions.length;
  ui.status = { key, text: `${label} override removed from ${n} region${n === 1 ? '' : 's'}.` };
}
function addVwan() {
  const list = ensureVwans(spec), ids = new Set(list.map(w => w.id));
  const k = [...Array(list.length + 2).keys()].map(i => i + list.length + 1).find(i => !ids.has('vwan-' + i));
  list.push({ id: 'vwan-' + k, name: 'WAN ' + k });
  ui.status = { key: 'vwans', text: `Virtual WAN "WAN ${k}" added: pick its hubs below.` };
}
// Removing a virtual WAN moves its hubs to the first remaining one.
function delVwan(k) {
  const list = ensureVwans(spec), [gone] = list.length > 1 ? list.splice(+k, 1) : [];
  if (!gone) return;
  spec.regions.filter(r => r.vwan === gone.id).forEach(r => { delete r.vwan; });
  ui.status = { key: 'vwans', text: `Virtual WAN "${gone.name}" removed: its hubs are now in ${list[0].name}.`,
    undo: true, undone: 'Virtual WAN removal undone.' };
}
Object.assign(EDITOR_ACTIONS, { 'apply-all': ({ key, label }) => applyToAll(key, label), 'add-vwan': addVwan,
  'del-vwan': ({ i }) => delVwan(i), 'add-origin': addGlobalOrigin, 'del-origin': ({ i }) => delGlobalOrigin(+i) });
// A new origin is the first region not yet listed: active when there is none yet, else backup.
function addGlobalOrigin() {
  const entry = spec.global_entry || (spec.global_entry = { type: 'none', origins: [] });
  entry.origins = entry.origins || [];
  const used = new Set(entry.origins.map(o => o.region)), region = spec.regions.find(r => !used.has(r.id));
  if (!region) return;
  const role = entry.origins.some(o => (o.role || 'active') === 'active') ? 'backup' : 'active';
  entry.origins.push({ region: region.id, role });
  ui.status = { key: 'global-entry', text: `${region.name} added as a ${role} ${originWord(spec)}.` };
}
function delGlobalOrigin(k) {
  const [gone] = (spec.global_entry.origins || []).splice(k, 1);
  if (gone) ui.status = { key: 'global-entry', text: `${nameOf(gone.region)} removed.`, undo: true,
    undone: 'Removal undone.' };
}

/* ===== TAB ===== */
function regionsTab() {
  const groups = areaGroups(spec);
  return groups.map((g, k) => `<div class="areahead"><b>${esc(g.area)}</b>
    ${moveButtons('move-area', g.area, k, groups.length, 'area ' + g.area)}</div>` +
    g.regions.map((r, j) => regionEditor(r, spec.regions.indexOf(r), j, g.regions.length)).join('')).join('') +
    '<button data-act="add-region">+ Add region</button>';
}
// One region: a section whose summary names it and describes it in one line (regionLine).
function regionEditor(region, i, place, count) {
  const patterns = patternPairs();
  const notes = (patternOf(region).editor_notes || []).map(t => `<div class="hint left">${esc(t)}</div>`).join('');
  const base = ['remote_hub', 'capabilities'], fields = patternFields(region);
  const extra = fields.filter(f => !base.includes(f) && (patternOf(region).hub !== 'partial' || !CATALOG.roles[f] ||
    roleState(spec, region, f) === 'local'));  // a minimal hub: overrides of its local capabilities
  const title = patternOf(region).spoke_roles ? 'Spoke services' : 'Overrides';
  const body = `<div class="row">${moveButtons('move-region', region.id, place, count, region.name)}
    <button data-act="del-region" data-i="${i}">✕ Remove region</button></div>` +
    regionPicker(region, i) + selectField('Pattern', `regions.${i}.pattern`, patterns, region.pattern) +
    editStatus('p:' + region.id) + fields.filter(f => base.includes(f)).map(f => regionField(region, i, f)).join('') +
    (extra.length ? `<div class="sub">${title}</div>` + notes + extra.map(f => regionField(region, i, f)).join('')
      : '');
  const summary = `<b>${esc(region.name)}</b> <span class="muted">(${esc(region.id)})</span>
    ${badge('region:' + region.id)}<span class="line">${esc(regionLine(region))}</span>`;
  return fold('region:' + region.id, summary, body, ` data-item="region:${esc(region.id)}"`);
}
// Region dropdown grouped by area, sorted by name; used regions disabled; an unknown imported name stays selectable.
function regionPicker(region, i) {
  const used = new Set(spec.regions.filter(r => r !== region).map(r => r.id)), known = azureRegion(region);
  const flags = r => (r === known ? ' selected' : '') + (used.has(r.id) ? ' disabled' : '');
  const unknown = known ? '' : `<option value="" selected>${esc(region.name)} (not in list)`;
  return `<label>Region<select data-rename="${i}">${unknown}${regionGroups(flags)}</select></label>
    <div class="hint">${esc(azureFacts(region))}</div>`;
}

/* ===== ONE-LINE SUMMARY: pattern · firewall (or spoke services) · remote hub · preferred circuit · overrides ===== */
function regionLine(region) {
  const product = role => { const hit = resolveRole(spec, region, role); return hit && CATALOG.products[hit.product]; };
  const pattern = patternOf(region), parts = [pattern.label];
  if (pattern.hub === 'partial') return [pattern.label, capabilityLine(spec, region)].join(' · ');
  if (followsRemote(region)) parts.push('→ ' + nameOf(region.remote_hub));
  if (pattern.spoke_roles) {
    const set = pattern.spoke_roles.filter(r => region[r]).map(r => (CATALOG.products[region[r]] || {}).label);
    parts.push(set.filter(Boolean).join(', ') || 'no spoke services');
  } else {
    parts.push(product('firewall') ? product('firewall').label : isVwan(spec) ? 'no hub security' : 'no firewall');
  }
  parts.push(...preferredCircuit(region));
  const n = pattern.spoke_roles ? 0 : patternFields(region).filter(f => !['remote_hub', 'capabilities'].includes(f) &&
    region[f]).length;
  if (n) parts.push(`${n} override${n === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

/* ===== FIELDS of a region ===== */
function regionField(region, i, field) {
  const p = `regions.${i}`, spokeRole = (patternOf(region).spoke_roles || []).includes(field);
  if (field === 'remote_hub') return remoteHubField(region, p);
  if (field === 'capabilities') return capabilityFields(region, p);
  if (field === 'dns_model') {
    const fixed = dnsModelFixed(spec, region);  // engine.js: no resolver, or the resolver in another region
    return fixed ? `<div class="hint left"><b>DNS model</b> · ${esc(fixed)}</div>`
      : overrideField('DNS model', region, i, field, DNS_MODELS);
  }
  const first = placementOf(spec, field)[0];
  const place = hasHub(region) && first !== 'spoke' ? first : 'spoke';  // topology.js
  const [label, pairs] = roleChoices(field, place, region[field]);  // editor.js: Virtual WAN "Hub security"
  return overrideField(label, region, i, field, pairs, spokeRole ? '(none)' : '');
}
// A minimal hub's capabilities (catalog.js): each Local, From the remote hub or Not needed (DNS: Azure-provided DNS,
// rules.js notNeeded.as); "From …" only with a remote hub (or when already chosen); a virtual hub can't use another
// hub's firewall (Local or Not needed only).
function capabilityFields(region, p) {
  const names = CATALOG.capabilities[topoKey(spec)], hub = remoteHubOf(spec, region);  // engine.js
  const from = hub ? `From ${hub.name}` : region.remote_hub ? `From ${region.remote_hub} (missing)`
    : 'From the remote hub (none set)', as = RULES.notNeeded.as || {};
  const states = key => [['local', 'Local'], ...(isVwan(spec) && key === 'firewall' ? [] : region.remote_hub ||
    (region.capabilities || {})[key] === 'remote' ? [['remote', from]] : []), ['none', as[key] || 'Not needed']];
  return '<div class="sub">Capabilities</div><div class="caps">' + capKeys(spec).map(key => selectField(
    names[key][0], `${p}.capabilities.${key}`, states(key), capState(spec, region, key))).join('') +
    `</div><div class="hint left">${esc(capabilityLine(spec, region))}</div>`;
}
// The remote hub: needed only when a capability comes from it; a minimal virtual hub's is a full hub (named with its
// virtual WAN when there are several).
function remoteHubField(region, p) {
  const full = isVwan(spec) && patternOf(region).hub === 'partial', many = vwansOf(spec).length > 1;
  const hubs = spec.regions.filter(r => r !== region && hasHub(r) && (!full || patternOf(r).hub === 'full'));
  const pairs = hubs.map(r => [r.id, r.name + (full && many ? ` (virtual WAN ${vwanOf(spec, r).name})` : '')]);
  if (region.remote_hub && !hubs.some(r => r.id === region.remote_hub)) pairs.push([region.remote_hub, '(invalid)']);
  return selectField('Remote hub', `${p}.remote_hub`, pairs, region.remote_hub, '—');
}
// A region override dropdown, plus a hint saying where the effective value comes from. A spoke role of an isolated
// region has no default: its blank entry is "(none)" and there is no "use default".
function overrideField(label, region, i, key, pairs, blank = '') {
  const path = `regions.${i}.${key}`, own = getPath(region, key);
  const hint = CATALOG.roles[key] ? roleSource(spec, region, key) : settingSource(spec, region, key);
  const reset = own && !blank ? `<button class="link" data-act="use-default" data-key="${path}">use default</button>`
    : '';
  return selectField(label, path, pairs, own, blank || '(default)') + `<div class="hint">${esc(hint)}${reset}</div>`;
}

/* ===== PATTERN CHANGE (spec.js): what was removed, with Undo (editor.js) ===== */
function patternChange(i, next) {
  const region = spec.regions[i], removed = changePattern(spec, region, next), added = linkRemoteHub(spec, region);
  const text = `${region.name} is now ${patternOf(region).label}` +
    (removed.length ? ` — removed: ${removed.join(', ')}` : added.length ? '' : ' — nothing to remove') +
    (added.length ? ` — added: ${added.join(', ')}` : '');
  ui.status = { key: 'p:' + region.id, text: text + '.', undo: true, undone: 'Pattern change undone.' };
}
// A minimal hub's remote hub changed: the hub link to the previous one goes, the new one is linked (a cleared
// remote hub stays cleared). Undo brings a removed link back.
function remoteHubChange(i, previous) {
  const region = spec.regions[i], removed = unlinkRemoteHub(spec, region, previous);
  const added = linkRemoteHub(spec, region, false);
  const parts = [removed.length && `removed: ${removed.join(', ')}`, added.length && `added: ${added.join(', ')}`];
  if (removed.length || added.length) ui.status = { key: 'p:' + region.id, text: `${region.name} — ` +
    `${parts.filter(Boolean).join(' — ')}.`, undo: true, undone: 'Remote hub change undone.' };
}

/* ===== ACTIONS ===== */
Object.assign(EDITOR_ACTIONS, {
  'move-area': ({ key, delta }) => moveArea(spec, key, +delta),
  'move-region': ({ key, delta }) => moveRegion(spec, key, +delta),
  'use-default': ({ key }) => setPath(spec, key, ''),
  'add-region': addRegion,
  'del-region': ({ i }) => {
    const id = spec.regions.splice(+i, 1)[0].id;
    spec.region_links = (spec.region_links || []).filter(l => l.from !== id && l.to !== id);
    hybridConnections(spec).forEach(c => { c.connects_to = (c.connects_to || []).filter(t => t !== id); });
  }
});
// The first unused region in the hub's area, as a remote hub of it (a full hub when there is no hub yet).
function addRegion() {
  const list = spec.regions, hub = list.find(r => r.pattern === 'full-hub');
  const area = hub && (azureRegion(hub) || {}).area;
  const free = AZURE_REGIONS.regions.filter(r => !list.some(x => x.id === r.id));
  const pick = free.find(r => r.area === area) || free[0];
  list.push(hub ? { id: pick.id, name: pick.name, pattern: 'remote-hub', remote_hub: hub.id }
    : { id: pick.id, name: pick.name, pattern: 'full-hub' });
}

/* ===== TAB ===== */
function linksTab() {
  const vwan = isVwan(spec);
  const off = vwan ? ' disabled title="Virtual WAN links the hubs of each Standard virtual WAN"' : '';
  const label = allHubsLinked(spec) ? 'Disconnect all hubs' : 'Connect all hubs';
  return `<h3>Hub links</h3><button data-act="connect-all"${off}>${label}</button>${editStatus('links')}` +
    linkGrid(vwan);
}
// Hub × hub grid: a tick box per pair in the upper triangle (rows: full names; columns: short names, full name as
// tooltip). Scrolls sideways when wide; the first column stays put (styles.css).
const shortName = name => name.split(/\s+/).map(w => w[0]).join('').toUpperCase();
// Virtual WAN: every cell is disabled; its tooltip says why the hubs are (not) linked.
function linkGrid(vwan) {
  const hubs = spec.regions.filter(hasHub);
  if (hubs.length < 2) return '<div class="hint left">Hub links need two hubs (full or minimal hub).</div>';
  const head = '<tr><th scope="col">Hub</th>' + hubs.slice(1).map(h => `<th scope="col" title="${esc(h.name)}">
    <abbr title="${esc(h.name)}">${esc(shortName(h.name))}</abbr></th>`).join('') + '</tr>';
  const off = (a, b) => (vwan ? ` disabled title="${esc(vwanCellReason(a, b))}"` : '');
  const cell = (a, b, i, j) => (j < i ? '<td class="off"></td>' : `<td><input type="checkbox"
    data-link="${a.id}|${b.id}"${linkBetween(spec, a.id, b.id) ? ' checked' : ''}${off(a, b)}
    aria-label="Hub link ${esc(a.name)} ↔ ${esc(b.name)}" data-item="link:${a.id}|${b.id}">${linkBadge(a, b)}` +
    editChip(`link:${a.id}|${b.id}`, `Edit hub link ${a.name} ↔ ${b.name}`, '', 'chip mini') + '</td>');
  const rows = hubs.slice(0, -1).map((a, i) => `<tr><th scope="row">${esc(a.name)}</th>` +
    hubs.slice(1).map((b, j) => cell(a, b, i, j)).join('') + '</tr>').join('');
  return `<div class="gridwrap"><table class="grid linkgrid"><thead>${head}</thead><tbody>${rows}</tbody></table>
    </div>`;
}

const linkBadge = (a, b) => badge(`link:${a.id}|${b.id}`) || badge(`link:${b.id}|${a.id}`);  // either direction

/* ===== ACTIONS ===== */
Object.assign(EDITOR_ACTIONS, {
  'connect-all': () => { ui.status = toggleHubLinks(spec); }
});

/* ===== TAB ===== */
function hybridTab() {
  const sites = spec.onprem || [];
  const none = sites.length ? '' : '<div class="hint left">No on-premises site yet: add one, then an' +
    ' ExpressRoute circuit or a VPN.</div>';
  return '<h3>On-premises sites</h3>' + none + sites.map(siteEditor).join('') +
    '<button data-act="add-site">+ Add site</button>' +
    '<h3>Connections</h3>' + connectionGrid() + '<h3>Hubs</h3>' + hubsEditor();
}

/* ===== CONNECTION GRID: sites (rows) × hubs that can host a gateway (columns) ===== */
// Each cell lists the connections from that site to that hub, with a primary (P) or backup (B) marker; a click opens
// the connection in the Selected item panel (editor-actions.js); "+" adds one (a new circuit or VPN, or one
// of the site's existing connections extended to this hub). Connections outside the grid are listed below it.
function connectionGrid() {
  const sites = spec.onprem || [], conns = hybridConnections(spec);
  const hubs = spec.regions.filter(r => canHostGateway(spec, r) ||
    conns.some(c => (c.connects_to || []).includes(r.id)));
  if (!sites.length || !hubs.length) return '<div class="hint left">Add a site and a hub (full hub, or a minimal hub' +
    ' with Hybrid gateway) to connect them.</div>';
  const head = '<tr><th scope="col">Site \\ hub</th>' + hubs.map(h => `<th scope="col" title="${esc(h.name)}">` +
    `${esc(h.name)}${hubLevel(h)}</th>`).join('') + '</tr>';
  const rows = sites.map(s => `<tr><th scope="row">${esc(s.name)}</th>` + hubs.map(h => `<td>${gridCell(s, h)}</td>`)
    .join('') + '</tr>').join('');
  const inGrid = c => siteById(spec, c.site) && (c.connects_to || []).some(id => hubs.some(h => h.id === id));
  const loose = conns.filter(c => !inGrid(c));
  return '<div class="hint left">Select a connection to edit it, or + to add one.</div>' +
    `<div class="gridwrap"><table class="grid hybridgrid"><thead>${head}</thead><tbody>${rows}</tbody></table>
    </div><div class="hint left">P primary · B backup at that hub.</div>` +
    (loose.length ? '<div class="hint left warn">Not in the grid (no site or no hub):</div>' + itemButtons(loose)
      : '') + connectionList(conns);
}
// A hub's resulting ExpressRoute resiliency, under its name in the grid header.
const LEVEL_WORD = { standard: 'Standard', high: 'High', maximum: 'Maximum' };
const hubLevel = h => (lvl => (lvl ? `<span class="lvl" data-level="${lvl}">Resiliency: ${LEVEL_WORD[lvl]}</span>`
  : ''))(hubResiliency(spec, h.id));
// Every connection in one line each, with an explicit Edit button.
function connectionList(conns) {
  const what = c => `${connectionName(spec, c)} · ${TYPE_NAMES[c.type]} → ${(c.connects_to || []).map(nameOf)
    .join(', ') || 'no hub'}`;
  return '<ul class="connlist">' + conns.map(c => `<li data-item="conn:${esc(c.id)}">${esc(what(c))} ` +
    editChip('conn:' + c.id, `Edit ${connectionName(spec, c)} (${TYPE_NAMES[c.type]})`, 'Edit') + '</li>').join('') +
    '</ul>';
}
function gridCell(site, hub) {
  const here = hybridConnections(spec).filter(c => c.site === site.id && (c.connects_to || []).includes(hub.id));
  const items = here.map(c => {
    const backup = isBackup(spec, c, hub.id), short = { expressroute: 'Circuit', vpn: 'VPN' };
    const what = c.name || short[c.type];
    const label = `Edit ${what} (${TYPE_NAMES[c.type]}) · ${site.name} → ${hub.name}, ${backup ? 'backup' : 'primary'}`;
    return `<button class="conn chip" data-act="sel" data-key="conn:${esc(c.id)}" data-item="conn:${esc(c.id)}"
      title="${esc(label)}" aria-label="${esc(label)}">${esc(what)}
      ${badge('conn:' + c.id)}<span class="pb">${backup ? 'B' : 'P'}</span></button>`;
  });
  return items.join('') + (canHostGateway(spec, hub) ? addSelect(site, hub, here) : '');
}
// The "+" menu of a cell: the site's other connections (extended to this hub), or a new one of each type.
function addSelect(site, hub, here) {
  const others = hybridConnections(spec).filter(c => c.site === site.id && !here.includes(c))
    .map(c => [`link:${c.id}`, `Connect ${connectionName(spec, c)} here`]);
  const opts = [['', '+'], ...others, ['new:expressroute', 'New ExpressRoute circuit'], ['new:vpn', 'New VPN']];
  return `<select class="add" data-addconn="${esc(site.id)}|${esc(hub.id)}" aria-label="Add a connection from
    ${esc(site.name)} to ${esc(hub.name)}">${opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}`).join('')}
    </select>`;
}
// A cell's "+" choice: extend a connection to the hub, or add a new one; the result is selected for editing.
function gridAdd(cell, choice) {
  const [siteId, hubId] = cell.split('|'), [what, value] = choice.split(':');
  let conn = what === 'link' && hybridConnections(spec).find(c => c.id === value);
  if (conn) conn.connects_to = [...new Set([...(conn.connects_to || []), hubId])];
  if (what === 'new') conn = addConnection(spec, value, siteId, hubId);  // spec.js
  if (conn) editorState.sel = { kind: 'conn', key: conn.id };
}

/* ===== SITES: name, primary and backup link (read-only), interconnect ===== */
function siteEditor(site, i, sites) {
  const body = textField('Name', `onprem.${i}.name`, site.name) + siteRoutingHint(site) +
    interconnectField(site) +
    `<div class="row">${moveButtons('move-site', i, i, sites.length, site.name)}
    <button data-act="del-site" data-i="${i}">Remove site</button></div>`;
  return fold('site:' + site.id, `<b>${esc(site.name)}</b> ${badge('site:' + site.id)}<span class="line">` +
    `${esc(siteLine(site))}</span>`, body,
    ` data-item="site:${esc(site.id)}"`);
}
function siteLine(site) {
  const types = siteTypes(spec, site);
  const ic = (spec.onprem || []).filter(o => o !== site && interconnected(spec, site.id, o.id)).map(o => o.name);
  const with_ = ic.length ? ` · interconnected with ${ic.join(', ')}` : '';
  if (!types.length) return 'not connected' + with_;
  return sitePrimaryText(site) + with_;
}
// Primary and backup at the site's hubs: Azure's pick (hybrid.js), the same at every hub or per hub.
function sitePrimaryText(site) {
  const picks = [...new Set(pairHubs(spec, site).map(id => linkAt(spec, site, id).conn.type))];
  const types = siteTypes(spec, site), other = t => types.find(x => x !== t);
  if (picks.length === 1) return `${typeLabel(picks[0])} primary · ${typeLabel(other(picks[0]))} backup`;
  if (picks.length > 1) return 'primary per hub (hub routing preference)';
  return types.map(typeLabel).join(' and ') + (types.length > 1 ? ' (to different hubs: no backup link)' : '');
}
// "Interconnected with" (hybrid.js): the other sites whose on-premises networks this one reaches.
function interconnectField(site) {
  const others = (spec.onprem || []).filter(o => o !== site);
  if (!others.length) return '';
  const on = o => (interconnected(spec, site.id, o.id) ? ' checked' : '');
  return '<span class="muted">Interconnected with</span><div class="checks">' + others.map(o => `<label><input
    type="checkbox" data-ic="${esc(site.id)}" value="${esc(o.id)}"${on(o)}>${esc(o.name)}</label>`).join('') +
    '</div><div class="hint">A hub may then reroute this site\'s traffic over the' +
    ' other site\'s circuit (a design assumption: confirm the interconnect and route advertisement).</div>';
}
// Primary and backup link (read-only): Azure's routing decides them; only for a site with both connection types.
function siteRoutingHint(site) {
  if (siteTypes(spec, site).length < 2) return '';
  const how = isVwan(spec) ? 'the hub routing preference (estate default or the hub\'s section)'
    : 'Azure, which prefers ExpressRoute routes for the same prefix';
  return `<div class="hint left">${esc(sitePrimaryText(site))}. The primary link is chosen by ${esc(how)}; the` +
    ' other link is the backup, drawn lighter. Configure the on-premises routers to match.</div>';
}

/* ===== CONNECTIONS: site, name, resiliency, peering location, provider or Direct, transport, hubs ===== */
// Hub tick boxes list the regions that can host a gateway, plus any invalid target already in the spec.
function connectionFields(c, i) {
  const p = `hybrid_connections.${i}`, er = c.type === 'expressroute';
  const hosts = spec.regions.filter(r => canHostGateway(spec, r) || (c.connects_to || []).includes(r.id))
    .map(r => [r.id, r.name + (canHostGateway(spec, r) ? '' : ' (no gateway)')]);
  return selectField('Site', `${p}.site`, (spec.onprem || []).map(s => [s.id, s.name]), c.site) +
    (er ? circuitFields(c, i) : '') +
    '<span class="muted">Connects to</span>' + checkboxes(`${p}.connects_to`, hosts, c.connects_to || []) +
    `<button data-act="del-conn" data-i="${i}">Remove connection</button>`;
}
function circuitFields(c, i) {
  const p = `hybrid_connections.${i}`, shown = resiliencyOf(c);
  const opts = Object.entries(RESILIENCY).map(([k, v]) => `<option value="${k}"${k === shown ? ' selected' : ''}>${v}`);
  return textField('Circuit name', `${p}.name`, c.name || '') +
    `<label>Resiliency<select data-resiliency="${i}">${opts.join('')}</select></label>` + resiliencyCompare(c, shown) +
    locationField(p, c.peering_location, shown) + providerFields(c, p);
}
function providerFields(c, p) {
  return selectField('Connection', `${p}.connection`, [['direct', 'ExpressRoute Direct (customer-owned ports)']],
    isDirect(c) ? 'direct' : '', 'Connectivity provider') +
    (isDirect(c) ? '' : textField('Provider name (optional)', `${p}.provider`, c.provider || ''));
}
// Standard, Metro (high) and Maximum side by side (rules.js "resiliencyLevels"): what each is, what fails it
// and Learn's note; the circuit's choice is highlighted, and each hub it connects to shows its resulting level.
function resiliencyCompare(c, shown) {
  const pick = shown === 'metro' ? 'high' : 'standard', hubs = (c.connects_to || []).filter(id => regionById(spec, id));
  const result = hubs.map(id => `${nameOf(id)}: ${LEVEL_WORD[hubResiliency(spec, id) || 'standard']}`);
  const row = l => `<li class="${l.id === pick ? 'cur' : ''}" data-level="${l.id}"><b>${esc(l.label)}</b> · ` +
    `${esc(l.what)}. ${esc(l.fails)} <i>${esc(l.note)}</i>${l.refs.map(id => pointSource(RULES.references[id]))
      .join('')}</li>`;
  return `<ul class="rescmp">${RULES.resiliencyLevels.map(row).join('')}</ul>` + (result.length ? `<div ` +
    `class="hint left">${result.length > 1 ? 'These hubs' : 'This hub'}: ${esc(result.join(' · '))}</div>` : '');
}
// Peering location dropdown grouped by geopolitical region (catalog.js), only the locations matching the
// resiliency (Metro: names ending in " Metro"); an unknown or mismatched current name stays selected.
function locationField(p, current = 'Unspecified', resiliency) {
  const groups = ER_LOCATIONS.geopolitical.map(g => [g.name, locationsFor(g, resiliency)]).filter(([, l]) => l.length);
  const known = groups.some(([, list]) => list.includes(current));
  const html = groups.map(([name, list]) => `<optgroup label="${esc(name)}">` + list.map(l =>
    `<option value="${esc(l)}"${l === current ? ' selected' : ''}>${esc(l)}`).join('') + '</optgroup>');
  const own = known ? '' : `<option value="${esc(current)}" selected>${esc(current)}`;
  return `<label>Peering location<select data-path="${p}.peering_location">${own}${html.join('')}</select></label>`;
}
/* ===== ACTIONS ===== */
const newSite = () => ({ id: 's' + Date.now().toString(36), name: 'New site' });
Object.assign(EDITOR_ACTIONS, {
  'move-site': ({ key, delta }) => moveSite(spec, +key, +delta),
  'add-site': () => (spec.onprem = spec.onprem || []).push(newSite()),
  'del-site': ({ i }) => {
    const id = spec.onprem.splice(+i, 1)[0].id;
    spec.hybrid_connections = hybridConnections(spec).filter(c => c.site !== id);
  },
  'del-conn': ({ i }) => spec.hybrid_connections.splice(+i, 1)
});

/* ===== HUBS: preferred circuit, routing preference (Virtual WAN); one section per hub ===== */
function hubsEditor() {
  const hubs = spec.regions.filter(hasHub);
  return hubs.map(hubEditor).join('') || '<div class="hint left">No hub yet.</div>';
}
function hubEditor(region) {
  const i = spec.regions.indexOf(region);
  const body = circuitField(region, i) + routingOverride(region, i);
  const summary = `<b>${esc(region.name)} hub</b> ${badge('hub:' + region.id)}<span class="line">` +
    `${esc(hubLine(region))}</span>`;
  return fold('hub:' + region.id, summary, body || '<div class="hint left">No setting: one circuit or none reaches' +
    ' this hub.</div>', ` data-item="hub:${esc(region.id)}"`);
}
// One line: the preferred circuit, which routes the hub prefers.
function hubLine(region) {
  const parts = preferredCircuit(region);
  if (!connectionsTo(spec, region.id).length) parts.push(canHostGateway(spec, region) ? 'no connection' : 'no gateway');
  if (preferenceApplies(spec, region)) parts.push(`${HUB_PREFERENCES[hubPreference(spec, region)]} preferred`);
  return parts.join(' · ') || 'no hybrid settings';
}

/* ===== PREFERRED CIRCUIT (hybrid.js), when two or more ExpressRoute circuits reach the hub ===== */
function circuitField(region, i) {
  const ers = hubCircuits(spec, region);
  if (ers.length < 2) return '';
  const own = ers.some(c => c.id === region.er_preferred), plain = { ...region, er_preferred: undefined };
  const auto = circuitsAt({ ...spec, regions: spec.regions.map(r => (r === region ? plain : r)) }, region.id)[0];
  const pairs = ers.map(c => [c.id, `${c.name || 'Circuit'} (${c.peering_location})`]);
  return selectField('Preferred circuit', `regions.${i}.er_preferred`, pairs, own ? region.er_preferred : '',
    `Default (${auto.name || 'Circuit'})`) + '<div class="hint">The others are backups. Azure: a higher routing' +
    ' weight on its gateway connection; on-premises: prefer the same circuit (BGP local preference).</div>';
}

/* ===== HUB ROUTING PREFERENCE (Virtual WAN): per-hub override of the estate default (Estate tab) ===== */
function routingOverride(region, i) {
  if (!preferenceApplies(spec, region)) return '';
  const own = region.hub_routing_preference, value = HUB_PREFERENCES[hubPreference(spec, region)];
  return selectField('Hub routing preference', `regions.${i}.hub_routing_preference`, Object.entries(HUB_PREFERENCES),
    own, '(default)') + `<div class="hint">${esc(value)} preferred · ${own ? 'set here' : 'default'}</div>`;
}
