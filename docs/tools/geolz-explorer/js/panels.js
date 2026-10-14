/* panels.js: layers, header and legend, path navigation, side panels, checks, references and compare. */
/* ===== LAYERS: ids, labels and the hidden set ===== */
const LAYERS = [['hub', 'Hub links'], ['remote', 'Remote-hub peering'],
  ['hybrid', 'Hybrid connections (ExpressRoute / VPN, peering locations, providers)'],
  ['backup', 'Backup links (hidden with Hybrid connections too)'],
  ['dns', 'DNS (global services + zone links)'], ['users', 'Admins / Users band']];
const LAYERS_KEY = 'geolz-explorer.layers';
let hiddenLayers = new Set(savedLayers());
function savedLayers() {  // the hidden layer ids saved in this browser; unknown ids and unreadable data are ignored
  try {
    const ids = JSON.parse(window.localStorage.getItem(LAYERS_KEY) || '[]');
    return Array.isArray(ids) ? ids.filter(id => LAYERS.some(([k]) => k === id)) : [];
  } catch { return []; }
}
function saveLayers() {
  if (PLANNER_MODE === 'presentation') return;
  try { window.localStorage.setItem(LAYERS_KEY, JSON.stringify([...hiddenLayers])); } catch { /* not remembered */ }
}
function forgetLayers() {  // "Clear saved data": every layer shown again
  try { window.localStorage.removeItem(LAYERS_KEY); } catch { /* nothing to forget */ }
  hiddenLayers = new Set();
  applyLayers();
}

/* ===== LAYERS: panel, diagram classes, note and legend ===== */
function renderLayersPanel() {
  $('layersPanel').innerHTML = '<b>Layers</b>' + LAYERS.map(([id, label]) => `<label><input type="checkbox"
    data-layer-toggle="${id}"${hiddenLayers.has(id) ? '' : ' checked'}>${esc(label)}</label>`).join('');
}
// The diagram gets one class per hidden layer (no-<id>); the legend greys the line styles of hidden layers.
function applyLayers() {
  for (const [id] of LAYERS) $('diagram').classList.toggle('no-' + id, hiddenLayers.has(id));
  $('layerNote').hidden = !hiddenLayers.size;
  renderLayersPanel();
  renderHeader();
}
function setLayer(id, on) {
  if (on) hiddenLayers.delete(id); else hiddenLayers.add(id);
  saveLayers();
  applyLayers();
  if (window.GeoLZPlanner) window.GeoLZPlanner.syncPresentation();
}
function toggleLayersPanel(open = $('btnLayers').getAttribute('aria-expanded') !== 'true') {
  $('layersPanel').hidden = !open;
  $('btnLayers').setAttribute('aria-expanded', String(open));
}

/* ===== HEADER AND NAVIGATION ===== */
// Pattern colours (rules.js) become CSS variables --pat-<id> / --tint-<id> (dark set follows the theme switch), and
// classes .pat-<id> / .pt-<path type> expose them as --pc / --tc / --ptc, so markup needs no style attributes.
function patternCss() {
  const vars = dark => Object.entries(RULES.patterns).map(([id, p]) =>
    `--pat-${id}:${(dark ? p.dark : p).color};--tint-${id}:${(dark ? p.dark : p).tint};`).join('');
  const classes = Object.keys(RULES.patterns).map(id => `.pat-${id}{--pc:var(--pat-${id});--tc:var(--tint-${id})}`)
    .concat(Object.entries(RULES.pathTypes).map(([id, t]) => `.pt-${id}{--ptc:${t.color}}`)).join('\n');
  return `:root{${vars(false)}}\n:root[data-theme="dark"]{${vars(true)}}\n` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme]){${vars(true)}}}\n${classes}`;
}
// Applied as a constructable stylesheet: CSSOM, so the CSP needs no 'unsafe-inline' for styles.
function applyPatternCss() {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(patternCss());
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}
function patternChip(id, p = RULES.patterns[id]) {
  return `<span class="chip pat-${id}${p.dashed ? ' dashed' : ''}"
    title="${esc(p.description)}">${esc(p.label)}</span>`;
}
const dashSwatch = t => `<svg class="sw" width="28" height="8" aria-hidden="true"><line x1="3" y1="4" x2="25" y2="4"
  stroke="${t.color}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${t.dash}"/></svg>`;
const LINE_STYLES = [['hl', 'Hub link', 'hub'], ['x', 'Remote-hub peering', 'remote'],
  ['er', 'ExpressRoute', 'hybrid'], ['pn', 'Provider network', 'hybrid'], ['vpn', 'VPN', 'hybrid'],
  ['ic', 'On-prem interconnect', 'hybrid'],
  ['vpn bk', 'Backup link', 'backup']];  // [class, text, layer]
const layerHidden = layer => hiddenLayers.has(layer) || (layer === 'backup' && hiddenLayers.has('hybrid'));
function renderHeader() {
  $('title').textContent = spec.title || 'Geo Landing Zone Connectivity Explorer';
  $('subtitle').textContent = [spec.customer, topologyOf(spec).label].filter(Boolean).join(' · ');
  const paths = Object.values(RULES.pathTypes).map(t => `<span>${dashSwatch(t)}${esc(t.label)}</span>`);
  const patterns = [...new Set(spec.regions.map(patternId))];
  const lines = LINE_STYLES.filter(([cls, , layer]) => lineStyleUsed(cls, layer));
  $('legend').innerHTML = '<span>Patterns</span>' + patterns.map(id => patternChip(id)).join('') +
    '<span class="sep"></span><span>Paths</span>' + paths.join('') + '<span class="sep"></span><span>Lines</span>' +
    lines.map(([cls, text, layer]) => `<span${layerHidden(layer) ? ' class="off" title="Hidden (Layers)"'
      : ''}><svg class="sw" width="28" height="8" aria-hidden="true"><path class="lnk ${cls} used"
      d="M3 4H25"/></svg>${text}</span>`).join('');
  $('selNew').innerHTML = newMenuOptions();
}
function lineStyleUsed(cls, layer) {
  const links = backboneConnections(spec), conns = hybridConnections(spec);
  if (layer === 'hub') return links.some(l => l.kind === 'hub');
  if (layer === 'remote') return links.some(l => l.kind === 'remote');
  if (cls === 'er') return conns.some(c => c.type === 'expressroute');
  if (cls === 'pn') return conns.some(c => c.type === 'expressroute' && !isDirect(c));
  if (cls === 'vpn') return conns.some(c => c.type === 'vpn');
  if (cls === 'ic') return interconnectPairs(spec).length > 0;
  if (layer === 'hybrid') return conns.length > 0;
  if (layer === 'backup') return !!layout && layout.wires.some(w => w.backup);
  return true;
}
function renderNav(path = currentPath()) {
  const tabs = layout.regions.map(c => [c.region, spec.regions.indexOf(c.region)]);  // same order as the diagram
  $('regionTabs').innerHTML = tabs.map(([r, i]) => `<button role="tab" aria-selected="${i === ui.region}"
    data-region="${i}"><span class="sw pat-${patternId(r)}"></span>${esc(r.name)}</button>`).join('');
  $('pathButtons').innerHTML = `<button aria-pressed="${!ui.type}" data-type=""
    title="Overview: no path (O)">Overview</button>` +
    Object.entries(RULES.pathTypes).map(([id, t]) => `<button
    aria-pressed="${id === ui.type}" data-type="${id}">${dashSwatch(t)}${esc(t.label)}</button>`).join('');
  $('pathOptions').innerHTML = currentRegion() && ui.type ? pathOptions(currentRegion(), path) : '';
}
// Path options (also in presentation mode): east-west destination region, DNS query direction, ingress source.
// An option the region can't use stays visible but disabled (aria-disabled keeps its tooltip readable).
function pathOptions(region, path = currentPath()) {
  if (ui.type === 'east_west') return `<label>East-west <select id="selDest"><option value="">Within region</option>` +
    spec.regions.filter(r => r !== region).map(r => `<option value="${r.id}"${r.id === ui.dest ? ' selected' : ''}>
    To: ${esc(r.name)}`).join('') + '</select></label>';
  const sub = path.sub;
  return Object.entries(RULES.pathTypes[ui.type].subOptions || {}).map(([id, label]) => {
    const off = subOffered(spec, region, ui.type, id) ? '' : ` aria-disabled="true" title="${esc(subWhy(spec, region,
      ui.type, id))}"`;
    return `<button data-sub="${id}" aria-pressed="${sub === id}"${off}>${esc(label)}</button>`;
  }).join('') + failControls(region, path);
}
// Simulated failure on a path over a hybrid connection (hybrid.js): "Fail primary", then "Fail next" down the
// failover chain, "Restore" and "Other failure scenarios" (peering locations, Metro area, provider).
const NO_BACKUP = "Nothing to fail over to: this region's hub has one connection to on-premises (add a second circuit" +
  ' or a backup link).';
function failControls(region, path = currentPath()) {
  const global = globalFailControls(region, path);
  if (global) return global;
  if (!failApplies()) return '';  // app.js: not on DNS queries
  const next = nextToFail(spec, region, ui.fail);
  if (!path.steps.some(s => s.conn) && !path.failure) return '';
  const off = !failoverOffered(spec, region) ? ` disabled title="${esc(NO_BACKUP)}"` : next ? '' : ' disabled';
  const opts = failureOptions(spec, region, ui.fail);
  return `<button data-fail-act="next"${off}>${ui.fail.length ? 'Fail next' : 'Fail primary'}</button>` +
    (ui.fail.length ? '<button data-fail-act="restore">Restore</button>' : '') + (!opts.length ? '' : '<select ' +
    'id="selFail" data-fail="1" aria-label="Other failure scenarios"><option value="">Other failure scenarios…' +
    opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}`).join('') + '</select>');
}
// Fail origin (engine.js): on an origin that takes traffic now; a backup on standby says what would activate it.
function globalFailControls(region, path) {
  const o = ui.type === 'ingress' && path.sub === 'internet' && globalEntryOn(spec) && originOf(spec, region.id);
  if (!o) return '';
  const word = originWord(spec);
  if (ui.globalFail) return `<button data-global-fail="restore">Restore ${word}</button>`;
  if (path.globalStandby) return `<button disabled title="A backup takes traffic only when every active ${word} is` +
    ` unavailable: fail an active ${word} to see it take over">Fail ${word}</button>`;
  if (!globalFailoverOffered(spec, region.id)) return `<button disabled title="Add another ${word} (active or` +
    ` backup) to show which region takes over">Fail ${word}</button>`;
  return `<button data-global-fail="fail">Fail ${esc(region.name)} ${word}</button>`;
}

/* ===== DETAILS PANEL: steps, notes, talking points, sources ===== */
// A talking point or product note: its text, with a small "source" link when it names its own reference.
const pointItem = (t, lead = '') => `<li>${lead}${esc(t.text || t)}${t.ref ? pointSource(RULES.references[t.ref])
  : ''}</li>`;
const pointSource = ref => ` <a class="src" href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer"
  title="${esc(ref.title)}">source</a>`;
function refLink(id) {
  const ref = RULES.references[id], tier = { aac: 'Architecture Center', learn: 'Learn' }[ref.tier];
  return `<li><span class="tier ${ref.tier}">${tier}</span>
    <a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.title)}</a></li>`;
}
function stepLabel(step, region) {
  const away = step.region && step.region !== region.id && regionById(spec, step.region).name;
  return esc(step.label) + (away ? ` <span class="muted">· ${esc(away)}</span>` : '');
}
function renderDetails(path = currentPath()) {
  const region = currentRegion();
  if (!region) { $('details').innerHTML = '<p class="muted">Add a region in the editor to start.</p>'; return; }
  if (!ui.type) return renderOverview(region);
  const type = RULES.pathTypes[ui.type], pattern = patternOf(region);
  const pos = ui.step < 0 ? 'All steps' : `Step ${ui.step + 1} / ${path.steps.length}`;
  let h = `<h2>${dashSwatch(type)}${esc(type.label)} · ${esc(region.name)}</h2>
    <p class="muted">${patternChip(patternId(region))}
    ${esc(path.dest ? `To ${nameOf(path.dest)}: ${path.matrix}` : path.variant || '')}
    ${path.failover ? '<b class="failnote">Simulated failure</b>' : ''}
    ${path.globalStandby ? '<b class="failnote">Standby</b>' : ''}</p>${path.failure ? breadcrumb(region) : ''}
    <div class="row"><button id="btnPrev" aria-label="Previous step">←</button>
    <button id="btnNext" aria-label="Next step">→</button><button id="btnAll">Show all</button>
    <span class="muted">${pos}</span></div><ol class="steps">`;
  h += path.steps.map((s, i) => `<li data-step="${i}" class="${i === ui.step ? 'cur' : ''}"><span class="n
    pt-${ui.type}">${i + 1}</span><span>${stepLabel(s, region)}</span></li>`).join('') + '</ol>';
  const gap = hybridGap(region, path.missing);
  if (path.missing) h += gap ? `<div class="callout">${esc(HYBRID_GAP)}</div>`
    : `<div class="callout warning">Cannot draw: nothing resolves ${esc(path.missing)}.</div>`;
  const cls = path.na && !gap ? 'callout warning' : 'callout';  // e.g. "No route" for a cross-region path
  const hy = !path.dest && path.steps.some(s => s.conn) && hybridOf(spec, region);
  const pref = hy && preferenceNote(spec, regionById(spec, hy.owner));  // hybrid.js: the default, named
  const notes = [path.failover, path.globalNote, { text: path.note }, path.extra, path.fallback, pref]
    .map(n => n && n.text).filter(Boolean);
  h += notes.map(note => `<div class="${cls}">${esc(note)}</div>`).join('');
  if (ui.type === 'dns') h += dnsBlock(region);
  const points = ui.type === 'dns' ? RULES.dnsTalkingPoints : ui.type === 'onprem' ? RULES.hybridTalkingPoints
    : path.dest ? (isVwan(spec) ? RULES.vwan.cross_points : RULES.crossRegion.talking_points) : topologyPoints(pattern);
  const ingressPoints = ui.type === 'ingress' && path.sub in (RULES.ingressPoints || {}) &&
    !(isVwan(spec) && pattern.vwanPaths) ? RULES.ingressPoints[path.sub] : [];
  h += talkingBlock([...points, ...(path.globalPoints || []), ...ingressPoints]);  // engine.js: global entry
  const refs = new Set([...(isVwan(spec) ? [topologyOf(spec).ref] : []), ...pathRefs(path, region, spec),  // vWAN first
    ...(pref ? [pref.ref] : [])]);
  h += '<h3>Based on</h3><ul class="plain">' + [...refs].map(refLink).join('') + '</ul>';
  $('details').innerHTML = h;
  const step = path.steps[ui.step];  // compact note for presentation mode
  const failed = path.failover ? ' · simulated failure' : '';
  $('stepNote').innerHTML = `<b>${esc(type.label)} · ${esc(region.name)}${failed} · ${step ? `Step ${ui.step + 1}/${
    path.steps.length}: ${stepLabel(step, region)}` : pos}</b>${esc(path.note || '')}`;
}
// A path that can't be drawn because no hybrid connection exists yet: normal for a new estate, so info, not a warning.
const HYBRID_GAP = 'No hybrid connection reaches this region yet. Add an on-premises site in the editor, then an' +
  ' ExpressRoute circuit or a VPN.';
const hybridGap = (region, missing) => /hybrid|onprem|edge/.test(missing || '') && !hybridOf(spec, region);
// Overview (no path selected): a summary of the selected region instead of step notes; step controls disabled.
function renderOverview(region) {
  const pattern = patternOf(region), sum = regionSummary(spec, region), none = '<li class="muted">None</li>';
  const items = list => list.map(t => `<li>${esc(t)}</li>`).join('');
  const block = (title, list, cls = 'plain') => `<h3>${title}</h3><ul class="${cls}">${items(list) || none}</ul>`;
  $('details').innerHTML = `<h2>Overview · ${esc(region.name)}</h2>
    <p class="muted">${patternChip(patternId(region))} ${esc(describe(pattern))}</p>
    <p class="muted">${esc(azureFacts(region))}</p>
    <div class="row"><button id="btnPrev" disabled aria-label="Previous step">←</button>
    <button id="btnNext" disabled aria-label="Next step">→</button>
    <span class="muted">Pick a path to step through it</span></div>` +
    (hasHub(region) ? block(isVwan(spec) ? 'Virtual hub hosts' : 'Hub hosts', sum.hosts) : '') +
    (sum.shared.length ? block('Shared services VNet hosts', sum.shared) : '') +
    (sum.spokeLevel.length || !hasHub(region) ? block('Spoke-level services', sum.spokeLevel) : '') +
    block('Consumes from another region', sum.consumes) +
    block('Ingress options', ingressOptions(spec, region).filter(o => o.offered).map(o => [o.label,
      o.sub === 'internet' && globalEntryVia(spec, region), o.where, o.design].filter(Boolean).join(' · '))) +
    block('Region links', sum.links) +
    block('Hybrid connections', hybridSummary(region)) + block('Primary / backup links', linkSummary(spec, region)) +
    dnsBlock(region) +
    block('Admin access', [adminAccess(spec, region)]) +
    talkingBlock(topologyPoints(pattern)) +
    `<h3>Based on</h3><ul class="plain">${[...new Set([topologyOf(spec).ref, ...pattern.refs])].map(refLink)
      .join('')}</ul>`;
  $('stepNote').innerHTML = `<b>Overview · ${esc(region.name)} · ${esc(pattern.label)}</b>
    ${esc(describe(pattern))}`;
}
// A pattern's description and talking points; in Virtual WAN its "vwanDescription", and (not for an isolated region)
// the virtual hub's talking points first (rules.js), then the pattern's own ("vwan_talking_points" there).
const describe = pattern => (isVwan(spec) && pattern.vwanDescription) || pattern.description;
const topologyPoints = pattern => (isVwan(spec) && pattern.vwanPaths ? RULES.vwan.talking_points : [])
  .concat((isVwan(spec) && pattern.vwan_talking_points) || pattern.talking_points);
/* ===== TALKING POINTS: collapsed; only the key ones ("key": true in the rules, else the first three). The open
   state is kept across re-renders (app.js: 'toggle' in the capture phase). ===== */
const pointsOpen = { main: false };
function talkingBlock(points) {
  const key = points.filter(t => t.key), shown = key.length ? key : points.slice(0, 3);
  if (!shown.length) return '';
  return `<details class="points" data-points="main"${pointsOpen.main ? ' open' : ''}><summary><h3>Talking points
    (${shown.length})</h3></summary><ul class="tp">${shown.map(t => pointItem(t)).join('')}</ul></details>`;
}
function onPointsToggle(e) {
  const k = e.target.dataset && e.target.dataset.points;
  if (k) pointsOpen[k] = e.target.open;
}
// Hybrid connections that serve the region (its own gateway or its hub's).
function hybridSummary(region) {
  const h = hybridOf(spec, region), over = { vpn: 'over the internet' };
  const at = c => over[c.type] || `at ${linkLocations(c).join(' and ')}`;
  return !h ? [] : connectionsTo(spec, h.owner).map(c => `${connectionName(spec, c)} ${at(c)} → ${c.connects_to
    .map(nameOf).join(', ')}`);
}
// DNS context for the region: what the spokes use as DNS servers, where the zones are linked, what resolves.
function dnsBlock(region) {
  const c = dnsContext(spec, region), li = (mark, t) => `<li>${mark} ${esc(t)}</li>`;
  return `<h3>DNS context</h3><ul class="plain"><li><b>Spoke DNS servers:</b> ${esc(c.servers)}</li><li><b>Private DNS
    zones:</b> ${esc(c.zones)}</li>${c.can.map(t => li('✔', t)).join('')}
    ${c.cannot.map(t => li('✖', t)).join('')}</ul><ul class="plain">${c.refs.map(refLink).join('')}</ul>`;
}

/* ===== CHECKS, NOT MODELLED, COMPARE ===== */
let compareDirty = true;
function safeChecks() {
  try { return runChecks(spec); } catch (err) { return [{ severity: 'error', text: err.message }]; }
}
const nameOf = id => (regionById(spec, id) || { name: id }).name;
function renderChecks(results) {
  const source = c => (!c.ref ? '' : ` <a href="${esc(RULES.references[c.ref].url)}" target="_blank"
    rel="noopener noreferrer">source</a>`);
  const text = c => (c.target ? `<button class="link chk" data-sel="${esc(c.target)}" title="Show this setting in the
    editor">${esc(c.text)}</button>` : esc(c.text));  // editor-actions.js: opens and highlights the item
  const items = results.map(c => `<div class="callout ${c.severity}">
    <b>${{ error: '✖', warning: '⚠' }[c.severity] || 'ℹ'}</b> ${text(c)}${source(c)}</div>`);
  $('checks').innerHTML = items.join('') || '<p class="muted">✔ No issues found.</p>';
}
function renderNotModelled() {
  $('notModelled').innerHTML = RULES.notModelled.map(t => `<li>${esc(t)}</li>`).join('');
}
// "Primary: Circuit A ✕ → Backup: Circuit B ✓ (via Secondary DC)" while a failure is simulated (hybrid.js).
function breadcrumb(region) {
  const chain = failChain(spec, region, ui.fail);
  if (!chain.length) return '';
  const steps = chain.map(c => `${c.role}: ${c.name} ${c.up ? '✓' : '✕'}${c.via ? ` (via ${c.via})` : ''}`);
  return `<p class="crumb">${esc([...steps, ...(chain.at(-1).up ? [] : ['No route'])].join(' → '))}</p>`;
}
function renderCompare() {
  const types = Object.keys(RULES.pathTypes);
  let h = '<table><thead><tr><th>Region</th>' + types.map(t => `<th>${esc(RULES.pathTypes[t].label)}</th>`).join('') +
    '</tr></thead><tbody>';
  spec.regions.forEach((region, i) => {
    h += `<tr><th>${esc(region.name)}<br>${patternChip(patternId(region))}</th>` + types.map(t => `<td class="cell"
      tabindex="0" data-region="${i}" data-type="${t}">${compareCell(region, t)}</td>`).join('') + '</tr>';
  });
  $('compareTable').innerHTML = h + '</tbody></table>' + matrixHtml();
  compareDirty = false;
}
// One path as text; a path with no steps shows why, in short (e.g. "Isolated by design", "No route by design").
function pathText(region, p) {
  if (p.missing) return `<span class="muted">n/a · nothing resolves ${esc(p.missing)}</span>`;
  if (p.na) return `<span class="muted">${esc((p.note || 'None').split(/[:.]/)[0])}</span>`;
  return p.steps.map(s => stepLabel(s, region)).join(' → ');
}
// Compare cell: the path (with its variant); for ingress, every option the region offers.
function compareCell(region, t) {
  if (t === 'ingress') {
    const offered = ingressOptions(spec, region).filter(o => o.offered);
    return offered.map(o => `<b>${esc(o.label)}</b><br>${pathText(region, buildPath(spec, region, t, null,
      { sub: o.sub }))}`).join('<br>') || pathText(region, buildPath(spec, region, t));
  }
  const p = buildPath(spec, region, t);
  return (p.variant ? `<b>${esc(p.variant)}</b><br>` : '') + pathText(region, p);
}
// Connectivity matrix: east-west from each region (rows) to each region (columns); a cell plays that path.
function matrixHtml() {
  return '<h3>Connectivity matrix (east-west)</h3><table class="matrix"><thead><tr><th>From \\ To</th>' +
    spec.regions.map(r => `<th>${esc(r.name)}</th>`).join('') + '</tr></thead><tbody>' + spec.regions.map((src, i) =>
    `<tr><th>${esc(src.name)}</th>` + spec.regions.map(dst => `<td class="cell" tabindex="0" data-region="${i}"
    data-type="east_west" data-dest="${src === dst ? '' : dst.id}">${esc(connectivity(spec, src, dst))}</td>`)
    .join('') + '</tr>')
    .join('') + '</tbody></table>';
}
