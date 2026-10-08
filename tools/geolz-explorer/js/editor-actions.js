/* editor-actions.js: editor shell/events, selected-item panel, undo/redo and the new-estate wizard. */
/* ===== TABS ===== */
const EDITOR_TABS = [['estate', 'Estate', () => estateTab()], ['regions', 'Regions', () => regionsTab()],
  ['links', 'Region links', () => linksTab()], ['hybrid', 'Hybrid', () => hybridTab()]];
function tablist() {
  return '<div class="tabs" role="tablist" aria-label="Editor sections">' + EDITOR_TABS.map(([id, label]) => {
    const on = id === editorState.tab;
    return `<button role="tab" id="etab-${id}" aria-selected="${on}" aria-controls="epanel-${id}"
      tabindex="${on ? 0 : -1}" data-act="tab" data-key="${id}" data-focus="tab:${id}">${label}</button>`;
  }).join('') + '</div>';
}
function tabPanels() {
  return EDITOR_TABS.map(([id, , body]) => {
    editorState.rendering = id;
    const html = body();
    return `<div role="tabpanel" id="epanel-${id}" aria-labelledby="etab-${id}" class="tabpanel"
      ${id === editorState.tab ? '' : 'hidden'}>${html}</div>`;
  }).join('');
}
// Arrow keys (and Home / End) move between the tabs; the new tab is shown and focused.
function onEditorKey(e) {
  if (e.key === 'Escape' && editorState.sel) return clearSelection();  // editor-actions.js
  const tab = e.target.closest && e.target.closest('[role="tab"]');
  const ids = EDITOR_TABS.map(([id]) => id), k = ids.indexOf(editorState.tab);
  const next = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: ids.length - 1 }[e.key];
  if (!tab || next === undefined) return;
  e.preventDefault();
  switchTab(ids[(next + ids.length) % ids.length]);
  $('etab-' + editorState.tab).focus();
}
function switchTab(id) {
  if (!EDITOR_TABS.some(([t]) => t === id)) return;
  syncFolds();
  editorState.tab = id;
  renderEditor();
}

/* ===== RENDER ===== */
function renderEditor() {
  foldKeys = [];
  const panels = tabPanels(), all = allOpen() ? 'Collapse all' : 'Expand all';
  const none = tabFolds().length ? '' : ' disabled';  // a tab without sections (Region links)
  const h = `<div class="row edhead"><h2 class="grow">Estate settings</h2>${historyButtons()}
    <button id="btnFolds" data-act="folds"${none}
    aria-label="Expand or collapse all sections of this tab">${all}</button></div>` + startPanel() + tablist() +
    selectedPanel() + panels;  // editor-actions.js
  const active = (document.activeElement || {}).dataset || {};  // keep focus across the re-render
  const focused = active.path ? `[data-path="${active.path}"]` : active.focus && `[data-focus="${active.focus}"]`;
  $('editor').innerHTML = h;
  const el = focused && $('editor').querySelector(focused);  // a move button now at the end: focus its partner
  (el && el.disabled ? el.parentNode.querySelector('[data-focus]:not([disabled])') : el)?.focus();
}

/* ===== EVENTS: buttons (data-act) ===== */
// View-only actions re-render the editor; every other action edits the spec and re-renders everything.
const VIEW_ACTIONS = { tab: ({ key }) => switchTab(key), folds: () => { toggleFolds(); renderEditor(); } };
function onEditorClick(e) {
  const b = e.target.closest('[data-act]'), selected = currentRegion();
  if (!b) return;
  syncFolds();
  if (VIEW_ACTIONS[b.dataset.act]) return VIEW_ACTIONS[b.dataset.act](b.dataset);
  const before = editSpec(() => editorAction(b.dataset));  // editor-actions.js
  ui.region = Math.max(0, spec.regions.findIndex(r => r.id === (selected || {}).id));  // stays selected
  onSpecChange(true);
  pulseChanges(before);
}

/* ===== EVENTS: fields (data-path and friends) ===== */
const FIELD_KEYS = ['path', 'rename', 'link', 'flag', 'list', 'resiliency', 'addconn', 'ic'];
function onEditorChange(e) {
  const el = e.target;
  syncFolds();
  if (el.dataset.draft) onDraftChange(el);  // the guided start (editor-actions.js)
  if (!FIELD_KEYS.some(k => k in el.dataset)) return;
  const before = editSpec(() => applyField(el));  // editor-actions.js
  onSpecChange(false);
  pulseChanges(before);
}
function applyField(el) {
  const d = el.dataset, pattern = /^regions\.(\d+)\.pattern$/.exec(d.path || '');
  const remote = /^regions\.(\d+)\.remote_hub$/.exec(d.path || '');
  const before = remote && spec.regions[+remote[1]].remote_hub;  // the previous remote hub (its link may go)
  if (d.addconn && el.value) gridAdd(d.addconn, el.value);  // editor.js: a grid cell's "+"
  if (d.ic) setInterconnect(spec, d.ic, el.value, el.checked);  // hybrid.js
  if (d.resiliency) setCircuitResiliency(spec, +d.resiliency, el.value);  // spec.js
  if (pattern) patternChange(+pattern[1], el.value);
  else if (d.path) setPath(spec, d.path, el.value);
  if (remote) remoteHubChange(+remote[1], before);  // editor.js: a minimal hub is linked to its remote hub
  afterEdit(spec, d.path);  // topology.js: the first virtual WAN
  if (d.rename) renameRegion(spec, +d.rename, el.value);
  if (d.link) setLink(spec, ...d.link.split('|'), el.checked);
  if (d.flag) setPath(spec, d.flag, el.checked);
  if (d.list) {
    const list = getPath(spec, d.list) || [];
    setPath(spec, d.list, el.checked ? [...list, el.value] : list.filter(v => v !== el.value));
  }
  pruneDnsModels(spec);  // spec.js: a DNS model override that no longer applies (the field says why)
}

/* ===== SELECTION KEYS of diagram elements ===== */
const selAttr = sel => (sel ? ` data-sel="${esc(sel)}"` : '');
function selOfNode(id, n) {
  if (n.site) return 'site:' + id.slice(5);
  if (n.edge) return 'edge:' + n.label;
  if (n.prov) return 'prov:' + id.slice(5);
  if (!n.region) return null;  // users, internet, admins, global DNS services
  return n.spoke ? 'region:' + n.region : 'role:' + id;
}
const peerSel = p => ({ hub: 'link:', remote: 'remote:' }[p.kind] +
  (p.kind === 'remote' ? p.from : `${p.from}|${p.to}`));
const parseSel = text => (([kind, ...rest]) => (rest.length ? { kind, key: rest.join(':') } : null))(
  String(text || '').split(':'));

/* ===== THE ITEMS: tab, section to expand, title and settings (built with the tab modules' field builders) ===== */
const regionAt = id => [regionById(spec, id), spec.regions.findIndex(r => r.id === id)];
const connAt = id => (list => [list.find(c => c.id === id), list.findIndex(c => c.id === id)])(hybridConnections(spec));
const pairOf = key => key.split('|');
const SELECT_KINDS = {
  region: { tab: 'regions', fold: k => 'region:' + k, find: k => regionAt(k)[0],
    title: k => 'Region · ' + nameOf(k), body: k => regionPanel(...regionAt(k)) },
  role: { tab: k => (CATALOG.roles[k.split('.')[1]] || {}).derived ? 'hybrid' : 'regions',
    fold: k => ((CATALOG.roles[k.split('.')[1]] || {}).derived ? 'hub:' : 'region:') + k.split('.')[0],
    find: k => regionById(spec, k.split('.')[0]), title: roleTitle, body: rolePanel },
  hub: { tab: 'hybrid', fold: k => 'hub:' + k, find: k => regionById(spec, k), mark: k => 'region:' + k,
    title: k => `${nameOf(k)} hub`, body: k => rolePanel(k + '.er_gateway') },
  conn: { tab: 'hybrid', fold: () => null, find: k => connAt(k)[0],
    title: k => `${CONNECTION_TYPES[connAt(k)[0].type]} · ${connectionName(spec, connAt(k)[0])}`,
    body: k => connectionFields(...connAt(k)) },
  edge: { tab: 'hybrid', fold: () => null, find: k => circuitsOf(spec).some(c => linkLocations(c).includes(k)),
    title: k => 'Peering location · ' + k, body: edgePanel },
  prov: { tab: 'hybrid', fold: () => null, find: k => connAt(k)[0],
    title: k => 'Connectivity provider · ' + (connAt(k)[0].name || 'Circuit'), body: providerPanel },
  site: { tab: 'hybrid', fold: k => 'site:' + k, find: k => siteById(spec, k),
    title: k => 'On-premises site · ' + nameOfSite(k), body: sitePanel },
  link: { tab: 'links', fold: () => null, find: k => pairOf(k).every(id => regionById(spec, id)),
    title: k => `Hub link · ${pairOf(k).map(nameOf).join(' ↔ ')}`, body: linkPanel },
  remote: { tab: 'regions', fold: k => 'region:' + k, find: k => regionById(spec, k),
    title: k => `Remote-hub peering · ${nameOf(k)}`,
    body: k => remoteHubField(regionAt(k)[0], `regions.${regionAt(k)[1]}`) }
};
const pick = (v, k) => (typeof v === 'function' ? v(k) : v);

/* ===== PANELS ===== */
function regionPanel(region, i) {
  const base = ['remote_hub', 'capabilities'].filter(f => allowsField(region, f));
  const patterns = patternPairs();  // editor.js
  return `<div class="hint left">${esc(regionLine(region))}</div>` +
    selectField('Pattern', `regions.${i}.pattern`, patterns, region.pattern) + editStatus('p:' + region.id) +
    base.map(f => regionField(region, i, f)).join('');
}
function roleTitle(k) {
  const [id, role] = k.split('.'), hit = resolveRole(spec, regionById(spec, id), role);
  return `${(CATALOG.products[hit && hit.product] || CATALOG.roles[role] || { label: role }).label} · ${nameOf(id)}`;
}
function rolePanel(k) {
  const [id, role] = k.split('.'), [region, i] = regionAt(id);
  if ((CATALOG.roles[role] || {}).derived) {
    return `<div class="hint left">${esc(hubLine(region))}</div>` + circuitField(region, i) +
      erRemoteField(region, i) + routingOverride(region, i) + itemButtons(connectionsTo(spec, id));
  }
  return allowsField(region, role) ? regionField(region, i, role)
    : '<div class="hint left">Set in the Estate tab (Default products and settings).</div>';
}
// Buttons that select each listed connection (a hub's or a site's connections): edit chips (editor.js).
const itemButtons = conns => (conns.length ? '<div class="row">' + conns.map(c => editChip('conn:' + c.id,
  `Edit ${connectionName(spec, c)} (${TYPE_NAMES[c.type]})`, esc(connectionName(spec, c)))).join('') + '</div>' : '');
function edgePanel(loc) {
  return circuitsOf(spec).filter(c => linkLocations(c).includes(loc)).map(c => {
    const i = hybridConnections(spec).indexOf(c);
    return `<div class="sub">${esc(c.name || 'Circuit')}</div>` +
      locationField(`hybrid_connections.${i}`, c.peering_location, resiliencyOf(c)) + itemButtons([c]);
  }).join('');
}
function providerPanel(k) {
  const [c, i] = connAt(k);
  return providerFields(c, `hybrid_connections.${i}`) + itemButtons([c]);
}
function sitePanel(k) {
  const i = spec.onprem.findIndex(s => s.id === k), site = spec.onprem[i];
  return textField('Name', `onprem.${i}.name`, site.name) + siteRoutingHint(site) +
    interconnectField(site) +
    itemButtons(hybridConnections(spec).filter(c => c.site === k));
}
function linkPanel(k) {
  const [a, b] = pairOf(k), on = linkBetween(spec, a, b) ? ' checked' : '';
  if (isVwan(spec)) return `<label>Hub link<input type="checkbox" data-link="${esc(a)}|${esc(b)}"${on} disabled>
    </label><div class="hint left">${esc(vwanCellReason(regionById(spec, a), regionById(spec, b)))}.</div>`;
  return `<label>Hub link<input type="checkbox" data-link="${esc(a)}|${esc(b)}"${on}></label>
    <div class="hint left">Inspected by both hub firewalls (peering is not transitive).</div>`;
}
// The "Selected item" panel at the top of the editor ('' when nothing, or nothing that still exists, is selected).
function selectedPanel() {
  const sel = editorState.sel, kind = sel && SELECT_KINDS[sel.kind];
  if (!kind || !kind.find(sel.key)) { editorState.sel = null; return ''; }
  return `<section class="selpanel" id="selPanel" tabindex="-1" aria-label="Selected item"><div class="row">
    <b class="grow">Selected item</b><button class="link" data-act="sel-clear" aria-label="Clear the selection (Esc)">
    Close</button></div><div class="seltitle">${esc(kind.title(sel.key))}</div>${kind.body(sel.key)}</section>`;
}

/* ===== SELECT, CLEAR, HIGHLIGHT ===== */
function selectItem(text, focus = true) {
  const sel = parseSel(text), kind = sel && SELECT_KINDS[sel.kind];
  if (!kind || !kind.find(sel.key) || document.body.classList.contains('present')) return;
  syncFolds();
  editorState.sel = sel;
  editorState.tab = pick(kind.tab, sel.key);
  const key = kind.fold(sel.key);
  if (key) openFolds.add(key);
  showEditor(true);
  renderEditor();
  applySelection();
  $('editor').scrollTop = 0;
  if (focus && $('selPanel')) $('selPanel').focus();
}
function clearSelection() {
  editorState.sel = null;
  renderEditor();
  applySelection();
}
// The selected item's diagram elements get the class "picked" (styles.css).
function applySelection() {
  const sel = editorState.sel, kind = sel && SELECT_KINDS[sel.kind];
  const text = sel ? (kind.mark ? kind.mark(sel.key) : `${sel.kind}:${sel.key}`) : null;  // a hub: its region
  for (const el of $('diagram').querySelectorAll('[data-sel]')) el.classList.toggle('picked', el.dataset.sel === text);
}
Object.assign(VIEW_ACTIONS, { sel: ({ key }) => selectItem(key), 'sel-clear': clearSelection });

/* ===== UNDO / REDO ===== */
const HISTORY_CAP = 50, edits = { past: [], future: [] };  // JSON snapshots of the spec
// Remember a spec state (JSON text) as the step before the current one; a new edit drops the Redo steps.
function rememberSpec(before) {
  if (before === JSON.stringify(spec) || edits.past.at(-1) === before) return;
  edits.past.push(before);
  if (edits.past.length > HISTORY_CAP) edits.past.shift();
  edits.future = [];
}
// Run one edit of the spec and remember the state before it; returns the diagram before it (for pulseChanges).
function editSpec(change) {
  const before = JSON.stringify(spec), sig = layout && diagramSignature();
  change();
  rememberSpec(before);
  return sig;
}
// One step back (-1) or forward (+1). A pattern change or "Connect / Disconnect all hubs" message says it was undone.
function stepHistory(dir) {
  const [from, to] = dir < 0 ? [edits.past, edits.future] : [edits.future, edits.past], last = ui.shown;
  if (!from.length) return false;
  const sig = layout && diagramSignature();
  to.push(JSON.stringify(spec));
  spec = validSpec(JSON.parse(from.pop()));
  if (dir < 0 && last && last.undone) ui.status = { key: last.key, text: last.undone };
  onSpecChange(false);
  pulseChanges(sig);
  return true;
}
// Ctrl+Z (Cmd+Z) undo, Ctrl+Y or Shift+Ctrl+Z redo; a text field keeps its own text undo.
function historyKey(e) {
  const k = (e.key || '').toLowerCase();
  if (!(e.ctrlKey || e.metaKey) || e.altKey || !['z', 'y'].includes(k)) return false;
  if (e.target.closest && e.target.closest('input[type="text"], textarea')) return false;
  e.preventDefault();
  stepHistory(k === 'y' || e.shiftKey ? 1 : -1);
  return true;
}
function historyButtons() {
  const n = edits.past.length, m = edits.future.length, steps = k => `${k} step${k === 1 ? '' : 's'}`;
  return `<button class="icon" data-act="undo" title="Undo (Ctrl+Z) · ${steps(n)}" aria-label="Undo (${steps(n)})"${n
    ? '' : ' disabled'}>↶</button><button class="icon" data-act="redo" title="Redo (Ctrl+Y) · ${steps(m)}"
    aria-label="Redo (${steps(m)})"${m ? '' : ' disabled'}>↷</button>`;
}

/* ===== WHAT CHANGED: a signature per diagram element, compared before and after an edit ===== */
function diagramSignature() {
  const sig = {}, L = layout;
  for (const [id, n] of Object.entries(L.nodes)) sig['n:' + id] = [n.label, n.sub, n.badge].join('|');
  for (const w of L.wires) sig['w:' + w.conn] = [sig['w:' + w.conn], w.type, w.backup, w.a, w.b].join();
  for (const p of L.peers) sig['p:' + p.key] = p.text;
  for (const c of L.regions) sig['r:' + c.region.id] = c.region.pattern;
  for (const w of L.interconnects) sig['i:' + w.conn] = w.a + w.b;
  return sig;
}
// The elements whose signature changed (or that are new) pulse for a moment; a new estate (many changes) doesn't.
function pulseChanges(before) {
  if (!before || !layout) return;
  const after = diagramSignature(), changed = new Set(Object.keys(after).filter(k => after[k] !== before[k]));
  ui.pulse = [...changed];  // for tests and screen readers: what the last edit changed on the diagram
  if (!changed.size || changed.size > 40) return;
  const pick = (query, key) => [...$('diagram').querySelectorAll(query)].filter(el => changed.has(key(el)));
  const els = [...pick('.node', g => 'n:' + g.dataset.id), ...pick('rect.region', r => 'r:' + r.dataset.region),
    ...pick('[data-conn]', p => 'w:' + p.dataset.conn).map(p => p.parentNode),
    ...pick('path[data-peer]', p => 'p:' + p.dataset.peer).map(p => p.parentNode),
    ...pick('[data-ic]', p => 'i:' + p.dataset.ic).map(p => p.parentNode)];
  els.forEach(el => el.classList.add('pulse'));
  setTimeout(() => els.forEach(el => el.classList.remove('pulse')), 1600);
}
Object.assign(VIEW_ACTIONS, { undo: () => stepHistory(-1), redo: () => stepHistory(1) });

/* ===== NEW MENU: a blank estate or an example ===== */
const EXAMPLE_LABELS = { 'contoso-estate': 'Contoso estate', 'minimal-gsa': 'Virtual WAN + ExpressRoute' };
const BLANK_DEFAULTS = { firewall: 'azure-firewall', ingress: 'appgw-waf', dns: 'private-resolver',
  dns_model: 'centralized', bastion: 'bastion', private_user_access: 'entra-private-access' };
const START_STEPS = ['Title and topology', 'First region', 'More regions', 'On-premises', 'Done'];
const startState = { open: false, step: 1, draft: {}, error: '', before: '', created: false };
function newMenuOptions() {
  return '<option value="">New…</option><option value="blank">Blank estate</option>' + Object.keys(EXAMPLES)
    .map(k => `<option value="example:${k}">Example: ${esc(EXAMPLE_LABELS[k] || k)}</option>`).join('');
}
// The select works as a menu: it acts on the choice and then shows "New…" again.
function onNewMenu(e) {
  const value = e.target.value, example = value.startsWith('example:') && value.slice(8);
  e.target.value = '';
  if (value === 'blank') openStartPanel();
  if (EXAMPLES[example]) replaceSpec(clone(EXAMPLES[example]), `Loaded example: ${EXAMPLE_LABELS[example] || example}`);
}
function openStartPanel() {
  const draft = { title: 'Geo Landing Zone', customer: '', topology: 'hub-spoke', region: '', pattern: 'remote-hub',
    type: 'expressroute', site: 'Primary DC' };
  Object.assign(startState, { open: true, step: 1, error: '', draft, before: JSON.stringify(spec), created: false });
  editorState.tab = 'estate';
  showEditor(true);
  renderEditor();
  $('editor').scrollTop = 0;
  $('newTitle').focus();
}

/* ===== THE PANEL: step list, the step's fields, Back / Next / Skip / Cancel ===== */
// Fields carry data-draft (not data-path): the editor keeps their values in startState.draft without an edit.
function startPanel() {
  if (!startState.open) return '';
  const k = startState.step, error = startState.error ? `<div class="hint left warn" role="alert">${esc(startState
    .error)}</div>` : '';
  const steps = START_STEPS.map((t, i) => `<li${i + 1 === k ? ' aria-current="step"' : ''}>${i + 1} ${esc(t)}</li>`)
    .join('');
  const nav = (k > 1 && k < 5 ? '<button data-act="wiz-back">Back</button>' : '') + (k < 5 ? '<button' +
    ' data-act="wiz-next">Next</button><button data-act="wiz-skip">Skip</button>' : '<button data-act="wiz-finish">' +
    'Finish</button>') + '<button data-act="wiz-cancel">Cancel</button>';
  return `<fieldset class="start" aria-label="Start a new architecture"><legend>New architecture · step ${k} of 5:
    ${esc(START_STEPS[k - 1])}</legend><ol class="wizsteps">${steps}</ol>${STEP_FIELDS[k]()}${error}
    <div class="row">${nav}</div></fieldset>`;
}
const draftSelect = (id, key, label, options) => `<label>${label}<select id="${id}" data-draft="${key}">${options}
  </select></label>`;
const opts = (pairs, current) => pairs.map(([v, l]) => `<option value="${esc(v)}"${v === current ? ' selected' : ''}>${
  esc(l)}`).join('');
const STEP_FIELDS = {
  1: () => { const d = startState.draft, topologies = Object.entries(RULES.topologies).map(([k, v]) => [k, v.label]);
    return `<label>Title<input type="text" id="newTitle" data-draft="title" value="${esc(d.title)}"></label>
      <label>Customer (optional)<input type="text" id="newCustomer" data-draft="customer" value="${esc(d.customer)}">
      </label>` + draftSelect('newTopology', 'topology', 'Topology', opts(topologies, d.topology)); },
  2: () => draftSelect('newRegion', 'region', 'First region', '<option value="">Choose a region…</option>' +
    regionGroups(r => (r.id === startState.draft.region ? ' selected' : ''))) + '<div class="hint left">Pattern: Full' +
    ' hub · Azure Firewall, Application Gateway WAF, DNS Private Resolver (centralized), Azure Bastion, Entra Private' +
    ' Access.</div>',
  3: () => regionStep(),
  4: () => onpremStep(),
  5: () => `<div class="hint left">${esc(spec.regions.length)} region(s), ${esc((spec.onprem || []).length)} site(s),
    ${esc(hybridConnections(spec).length)} connection(s). Finish shows the Overview; the tabs below hold every
    setting.</div>`
};
// Step 3: the regions so far, and one more: region, pattern and (for a remote or minimal hub) its remote hub.
function regionStep() {
  const d = startState.draft, used = new Set(spec.regions.map(r => r.id)), hubs = spec.regions.filter(hasHub);
  const patterns = patternPairs();  // editor.js
  const remote = allowsField({ pattern: d.pattern }, 'remote_hub') ? draftSelect('guideRemote', 'remote', 'Remote hub',
    opts(hubs.map(r => [r.id, r.name]), d.remote)) : '';
  return `<div class="hint left">Regions: ${esc(spec.regions.map(r => `${r.name} (${patternOf(r).label})`)
    .join(', '))}</div>` + draftSelect('guideRegion', 'next', 'Region', '<option value="">Choose a region…</option>' +
    regionGroups(r => (used.has(r.id) ? ' disabled' : r.id === d.next ? ' selected' : ''))) +
    draftSelect('guidePattern', 'pattern', 'Pattern', opts(patterns, d.pattern)) + remote +
    '<div class="row"><button data-act="wiz-add-region">+ Add region</button></div>';
}
// Step 4: sites (name) and connections (site, type, hub, peering location for ExpressRoute).
function onpremStep() {
  const d = startState.draft, sites = spec.onprem || [], hubs = spec.regions.filter(r => canHostGateway(spec, r));
  const list = `<div class="hint left">Sites: ${esc(sites.map(s => s.name).join(', ') || 'none')} · connections:
    ${esc(hybridConnections(spec).map(c => connectionName(spec, c)).join(', ') || 'none')}</div>`;
  const site = `<label>Site name<input type="text" id="guideSite" data-draft="site" value="${esc(d.site)}"></label>
    <div class="row"><button data-act="wiz-add-site">+ Add site</button></div>`;
  if (!sites.length || !hubs.length) return list + site;
  const locs = ER_LOCATIONS.geopolitical.map(g => `<optgroup label="${esc(g.name)}">` + opts(g.locations
    .map(l => [l, l]), d.location) + '</optgroup>').join('');
  return list + site + draftSelect('guideConnSite', 'connSite', 'Connection from', opts(sites.map(s => [s.id, s.name]),
    d.connSite)) + draftSelect('guideConnType', 'type', 'Type', opts(Object.entries(CONNECTION_TYPES), d.type)) +
    draftSelect('guideConnHub', 'hub', 'To hub', opts(hubs.map(r => [r.id, r.name]), d.hub)) +
    (d.type === 'expressroute' ? draftSelect('guideLocation', 'location', 'Peering location', '<option value="">' +
      'Suggested (Metro near the hub)</option>' + locs) : '') +
    '<div class="row"><button data-act="wiz-add-conn">+ Add connection</button></div>';
}
// A draft field changed: kept in the draft; a choice that changes the step's fields re-renders it.
function onDraftChange(el) {
  startState.draft[el.dataset.draft] = el.value;
  if (['pattern', 'type'].includes(el.dataset.draft)) renderEditor();
}

/* ===== STEPS: Next applies the step's fields, Skip moves on without them, Cancel undoes every step ===== */
// A field's value from the page, else from the draft.
const startField = (id, key) => (($(id) && $(id).value !== undefined ? $(id).value : startState.draft[key]) || '');
function startNext(skip) {
  const k = startState.step, d = startState.draft;
  startState.error = '';
  if (k === 1 && !skip) Object.assign(d, { title: startField('newTitle', 'title'),
    customer: startField('newCustomer', 'customer'), topology: startField('newTopology', 'topology') || 'hub-spoke' });
  if (k === 1 && startState.created && !skip) {  // back on step 1 after the estate exists: update it
    Object.assign(spec, { title: d.title.trim() || spec.title, customer: d.customer.trim() });
    spec.defaults.topology = d.topology;
    afterEdit(spec, 'defaults.topology');  // topology.js: Virtual WAN needs its first virtual WAN
  }
  if (k === 2 && !createFirst(skip ? d.region || 'westeurope' : startField('newRegion', 'region'))) return;
  startState.step = Math.min(5, k + 1);
  editorState.tab = STEP_TABS[startState.step];
}
// The editor tab each step's settings live in: step 1 is the Estate tab.
const STEP_TABS = { 1: 'estate', 2: 'regions', 3: 'regions', 4: 'hybrid', 5: 'estate' };
// The estate itself, at step 2: a one-region estate (full hub) with the Microsoft defaults; again: a new first region.
function createFirst(region) {
  if (!AZURE_REGIONS.regions.some(r => r.id === region)) { startState.error = 'Pick the first region.'; return false; }
  startState.draft.region = region;
  if (startState.created) renameRegion(spec, 0, region);
  else replaceSpec(blankSpec(startState.draft), `New estate created: ${startState.draft.title.trim() ||
    'Geo Landing Zone'}`);
  startState.created = true;
  return true;
}
function blankSpec({ title, customer, topology, region }) {
  const r = AZURE_REGIONS.regions.find(x => x.id === region);
  return { title: title.trim() || 'Geo Landing Zone', customer: customer.trim(),
    format: SPEC_FORMAT, global_entry: { type: 'none', origins: [] },
    defaults: { topology, ...BLANK_DEFAULTS }, onprem: [], hybrid_connections: [],
    regions: [{ id: r.id, name: r.name, pattern: 'full-hub' }], region_links: [] };
}
// Cancel: Undo back to the state before the guided start (Redo can bring its steps back).
function startCancel() {
  startState.open = false;
  if (!startState.created) return renderEditor();
  while (JSON.stringify(spec) !== startState.before && stepHistory(-1));
  if (JSON.stringify(spec) !== startState.before) loadSpec(JSON.parse(startState.before));  // beyond HISTORY_CAP
  session.undo = null;  // io.js: nothing left to "Undo load"
  setStatus('Guided start cancelled: the previous estate is back (Redo brings the new one back)');
}
function startFinish() {
  startState.open = false;
  overview();
  renderEditor();
}
Object.assign(VIEW_ACTIONS, { 'wiz-back': () => {
  startState.step = Math.max(1, startState.step - 1);
  editorState.tab = STEP_TABS[startState.step];
  renderEditor();
},
  'wiz-cancel': startCancel, 'wiz-finish': startFinish });
Object.assign(EDITOR_ACTIONS, { 'wiz-next': () => startNext(false), 'wiz-skip': () => startNext(true),
  'wiz-add-region': startAddRegion, 'wiz-add-site': startAddSite, 'wiz-add-conn': startAddConnection });

/* ===== ADDING regions, sites and connections (steps 3 and 4) ===== */
function startAddRegion() {
  const d = startState.draft, r = AZURE_REGIONS.regions.find(x => x.id === startField('guideRegion', 'next'));
  if (!r || regionById(spec, r.id)) { startState.error = 'Pick a region that is not in the estate yet.'; return; }
  const region = { id: r.id, name: r.name, pattern: startField('guidePattern', 'pattern') || 'remote-hub' };
  const hub = regionById(spec, startField('guideRemote', 'remote')) || spec.regions.find(hasHub);
  if (allowsField(region, 'remote_hub') && hub) region.remote_hub = hub.id;
  spec.regions.push(region);
  if (region.pattern === 'minimal-hub' && hub) setLink(spec, hub.id, region.id, true);  // it borrows from that hub
  d.next = '';
}
function startAddSite() {
  const name = startField('guideSite', 'site').trim() || 'New site';
  (spec.onprem = spec.onprem || []).push({ id: 's' + Date.now().toString(36) + spec.onprem.length, name });
  startState.draft.site = '';
}
function startAddConnection() {
  const d = startState.draft, site = startField('guideConnSite', 'connSite') || spec.onprem[0].id;
  const conn = addConnection(spec, startField('guideConnType', 'type') || 'expressroute', site,
    startField('guideConnHub', 'hub'));  // spec.js
  const loc = conn.type === 'expressroute' && startField('guideLocation', 'location');
  if (loc) conn.peering_location = loc;
  Object.assign(d, { connSite: site });
}
// ?new=1 in the URL opens the guided start after the normal start-up.
function startFromUrl() {
  if (new URLSearchParams(location.search).get('new') === '1') openStartPanel();
}
