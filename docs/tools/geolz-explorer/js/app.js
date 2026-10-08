/* app.js: local storage/import/export, app state, startup, render cycle and global events. */
/* ===== LOCAL SESSION: the spec is auto-saved in this browser's localStorage (never sent anywhere) ===== */
const STORE_KEY = 'geolz-explorer.spec.v1', STORE_VERSION = 2, DEFAULT_EXAMPLE = 'contoso-estate';
const OLD_MODE_KEY = 'geolz-explorer.mode';
const UNAVAILABLE = 'Not saved: browser storage unavailable — use Export';
const session = { lastSaved: null, timer: null, undo: null };  // undo: the spec replaced by the last load (this view)
const hhmm = time => new Date(time).toTimeString().slice(0, 5);
function storage() {  // null when storage is blocked (private mode, some file:// setups) or throws
  try { const store = window.localStorage; store.getItem(STORE_KEY); return store; } catch { return null; }
}
function setStatus(text) {
  $('status').innerHTML = esc(text) + (session.undo ? ' <button class="link" id="btnUndo">Undo load</button>' : '');
}
// Save ~500 ms after the last change; nothing is written while the spec equals the last saved or restored one.
function scheduleSave() {
  if (PLANNER_MODE === 'presentation') return;
  clearTimeout(session.timer);
  session.timer = setTimeout(saveNow, 500);
}
function saveNow() {
  const text = JSON.stringify(spec), store = storage(), savedAt = Date.now();
  if (text === session.lastSaved) return;
  try {
    store.setItem(STORE_KEY, JSON.stringify({ version: STORE_VERSION, savedAt, spec }));
    session.lastSaved = text;
    setStatus(`Saved in this browser · ${hhmm(savedAt)}`);
  } catch { setStatus(UNAVAILABLE); }  // no storage, or quota exceeded
}
// Start-up precedence: ?example=<id> > saved session > default example. Returns { spec, status }.
function startSpec() {
  const wanted = new URLSearchParams(location.search).get('example'), store = storage();
  if (EXAMPLES[wanted]) return { spec: clone(EXAMPLES[wanted]), status: `Example ${wanted} (from the link)` };
  const fallback = status => ({ spec: clone(EXAMPLES[DEFAULT_EXAMPLE]), status });
  const raw = store && store.getItem(STORE_KEY);
  if (!store) return fallback(UNAVAILABLE);
  if (!raw) return fallback('');
  try {
    const saved = JSON.parse(raw);
    if (saved.version !== STORE_VERSION) {
      store.removeItem(STORE_KEY);
      return fallback('Saved data from another version was cleared');
    }
    return { spec: validSpec(saved.spec), status: `Restored your last session · saved ${hhmm(saved.savedAt)}` };
  } catch {
    store.removeItem(STORE_KEY);
    return fallback('Saved data was unreadable and was cleared');
  }
}
// Loading an example or a file replaces the session; the previous spec stays available as "Undo load".
function replaceSpec(newSpec, label) {
  const previous = spec;
  loadSpec(newSpec);
  rememberSpec(JSON.stringify(previous));  // editor.js: Undo (Ctrl+Z) brings it back too
  session.undo = previous;
  setStatus(label);
}
function undoLoad() {
  const previous = session.undo;
  session.undo = null;
  const current = JSON.stringify(spec);
  loadSpec(previous);
  rememberSpec(current);
  setStatus('Previous session restored');
}
function clearSaved() {
  const store = storage();
  if (store) store.removeItem(STORE_KEY);
  forgetTheme();  // theme.js: the saved theme goes too (a ?theme= in the URL still applies)
  setTheme(PLANNER_MODE === 'embedded' ? document.documentElement.dataset.theme || 'auto' : startTheme());
  prefSet(OLD_MODE_KEY, null);
  forgetLayers();  // panels.js: every layer shown again
  session.undo = null;
  loadSpec(clone(EXAMPLES[DEFAULT_EXAMPLE]));
  session.lastSaved = JSON.stringify(spec);
  setStatus(store ? 'Saved data cleared' : UNAVAILABLE);
}
function startUp() {
  const start = startSpec();
  try {
    spec = validSpec(start.spec); session.lastSaved = JSON.stringify(spec);
    onSpecChange(true); setStatus(start.status);
  } catch {  // a restored spec that passes the shape check but can't be drawn
    (storage() || { removeItem() {} }).removeItem(STORE_KEY);
    spec = clone(EXAMPLES[DEFAULT_EXAMPLE]); session.lastSaved = JSON.stringify(spec);
    onSpecChange(true); setStatus('Saved data could not be shown and was cleared');
  }
}
/* ===== EXPORT AND IMPORT: the browser's save / open dialogs where available, else a download and a file input ===== */
const FILE_TYPES = [{ description: 'JSON file', accept: { 'application/json': ['.json'] } }];
const slug = text => String(text || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
// geo-lz-<customer, else title>-<yyyy-mm-dd>.json (local date); the middle part is left out when both are empty.
function exportName(s, now = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return ['geo-lz', slug(s.customer) || slug(s.title), day].filter(Boolean).join('-') + '.json';
}
const specText = () => JSON.stringify(spec, null, 2);
// Save dialog (File System Access API) when the browser has one; cancelling it (AbortError) is not an error.
async function exportSpec() {
  if (typeof window.showSaveFilePicker !== 'function') return openExportPanel();
  try {
    const handle = await window.showSaveFilePicker({ suggestedName: exportName(spec), types: FILE_TYPES });
    const file = await handle.createWritable();
    await file.write(specText());
    await file.close();
    setStatus(`Exported ${handle.name}`);
  } catch (err) {
    if (err.name !== 'AbortError') setStatus('Could not export: ' + err.message);
  }
}
// No save dialog: an inline file-name field and a Download button (the browser saves to its download folder).
function openExportPanel() {
  $('exportName').value = exportName(spec);
  $('exportPanel').hidden = false;
  $('exportName').focus();
}
function closeExportPanel() { $('exportPanel').hidden = true; }
function downloadSpec() {
  const name = ($('exportName').value.trim() || exportName(spec)).replace(/(\.json)?$/i, '.json');
  const blob = new Blob([specText()], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
  a.click(); URL.revokeObjectURL(a.href);
  closeExportPanel();
  setStatus(`Downloaded ${name}`);
}
// Open dialog when available, else the hidden file input (its change event calls importFile).
async function importSpec() {
  if (typeof window.showOpenFilePicker !== 'function') return $('fileInput').click();
  try {
    const [handle] = await window.showOpenFilePicker({ types: FILE_TYPES, multiple: false });
    await importFile(await handle.getFile());
  } catch (err) {
    if (err.name !== 'AbortError') setStatus('Could not import: ' + err.message);
  }
}
async function importFile(file) {
  try { replaceSpec(JSON.parse(await file.text()), `Imported ${file.name}`); }
  catch (err) { setStatus('Could not import: ' + err.message); }
}

/* ===== STATE ===== */
const EXAMPLES = window.EXAMPLES;
const $ = id => document.getElementById(id);
const clone = obj => JSON.parse(JSON.stringify(obj));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const cut = (s = '', n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const ui = { region: 0, type: null, sub: null, dest: null, step: -1, status: null, shown: null, fail: [],
  globalFail: null };
let spec = clone(EXAMPLES['contoso-estate']), layout = null, view = null;
function currentRegion() { return spec.regions[ui.region]; }
// A simulated hybrid failure applies to the on-premises paths only, not to DNS queries (they keep the failure for
// when the user goes back).
const failApplies = () => ui.type !== 'dns';
function currentPath() {
  return ui.type && buildPath(spec, currentRegion(), ui.type, null, { sub: ui.sub, dest: ui.dest,
    fail: failApplies() ? ui.fail : [], globalFail: ui.globalFail });
}
// A role's products for a dropdown: those that can sit at `place` (catalog.js "where": e.g. third-party security only
// in a virtual hub); in a virtual hub, the product's Virtual WAN "option" text.
const productsFor = (role, place, keep) => Object.entries(CATALOG.products)
  .filter(([, p]) => p.role === role && (!place || !p.where || p.where.includes(place)))
  .map(([id, p]) => [id, (place === 'virtual-hub' && (p.vwan || {}).option) || p.label]);

/* ===== ZOOM AND PAN (by changing the SVG viewBox) ===== */
function setView(v) { view = v; $('diagram').setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`); }
// Fit the whole diagram, centred; in presentation mode keep it clear of the floating controls at the bottom.
let reserved = 0;  // px kept free below the diagram for the floating controls
function fit() {
  const svg = $('diagram'), box = svg.getBoundingClientRect ? svg.getBoundingClientRect() : { width: 0, height: 0 };
  const reserve = reserved = document.body.classList.contains('present') ? ($('controls').offsetHeight || 0) + 36 : 0;
  const W = layout.width, H = layout.height;
  if (!box.width || box.height <= reserve) return setView({ x: 0, y: 0, w: W, h: H });
  const s = Math.min(box.width / W, (box.height - reserve) / H), w = box.width / s, h = box.height / s;
  setView({ x: (W - w) / 2, y: (H - (box.height - reserve) / s) / 2, w, h });
}
function zoom(f, cx = view.x + view.w / 2, cy = view.y + view.h / 2) {
  setView({ x: cx - (cx - view.x) * f, y: cy - (cy - view.y) * f, w: view.w * f, h: view.h * f });
}
const toSvgPoint = e => new DOMPoint(e.clientX, e.clientY).matrixTransform($('diagram').getScreenCTM().inverse());
// Presentation mode: when the floating controls grow (a longer step note, the east-west picker), refit so they
// never cover the diagram. Shrinking keeps the current view (and any zoom).
function watchControls() {
  if (typeof ResizeObserver === 'undefined') return;
  new ResizeObserver(() => {
    if (document.body.classList.contains('present') && $('controls').offsetHeight + 36 > reserved) fit();
  }).observe($('controls'));
}
// Drag pans; a press and release on a node without moving counts as a click on that node (onNodeClick).
function initPanZoom() {
  const svg = $('diagram');
  let drag = null, press = null;
  svg.addEventListener('wheel', e => {
    const p = toSvgPoint(e);
    e.preventDefault(); zoom(e.deltaY > 0 ? 1.1 : 0.9, p.x, p.y);
  }, { passive: false });
  svg.addEventListener('pointerdown', e => {
    drag = toSvgPoint(e); svg.setPointerCapture(e.pointerId);
    press = { x: e.clientX, y: e.clientY, node: e.target.closest('.node'), sel: e.target.closest('[data-sel]') };
  });
  svg.addEventListener('pointermove', e => {
    if (drag) { const p = toSvgPoint(e); setView({ ...view, x: view.x + drag.x - p.x, y: view.y + drag.y - p.y }); } });
  svg.addEventListener('pointerup', e => {
    const still = press && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 5;
    if (still && press.node) onNodeClick(press.node.dataset.id);
    if (still && press.sel) selectItem(press.sel.dataset.sel, false);  // editor-actions.js: click to edit
    drag = press = null;
  });
}

/* ===== SIDE PANELS: editor (left) and details (right), shown or hidden in memory only ===== */
// Details starts open on wide screens and closed below WIDE px. An automatic close is undone when a path, a node or
// a matrix cell is opened; a close by the user (button or D) is kept. Every change refits the diagram.
const WIDE = 1500, panels = { autoClosed: false };
function showDetails(on, byUser) {
  if (on && PLANNER_MODE === 'embedded') showEditor(false);
  document.body.classList.toggle('nodetails', !on);
  $('btnDetails').setAttribute('aria-pressed', String(on));
  panels.autoClosed = !on && !byUser;
  if (layout) fit();
}
const toggleDetails = () => showDetails(document.body.classList.contains('nodetails'), true);
function reopenDetails() { if (panels.autoClosed) showDetails(true, false); }
function showEditor(on) {
  if (on && PLANNER_MODE === 'embedded') showDetails(false, true);
  document.body.classList.toggle('noeditor', !on);
  $('btnEditor').setAttribute('aria-pressed', String(on));
  if (layout) fit();
}
// A click on a node opens the details; in Overview it also selects the node's region.
function onNodeClick(id) {
  const n = layout.nodes[id], i = n ? spec.regions.findIndex(r => r.id === n.region) : -1;
  reopenDetails();
  if (!ui.type && i >= 0 && i !== ui.region) choose(i);
}

/* ===== RENDER CYCLE AND NAVIGATION ===== */
function onSpecChange(refit) {
  ui.region = Math.min(ui.region, Math.max(0, spec.regions.length - 1));
  layout = layoutDiagram(); drawBase();
  if (refit || !view) fit();
  const checks = editorState.checks = safeChecks();  // the editor shows them as badges
  renderHeader(); renderEditor(); renderChecks(checks); renderNotModelled();
  compareDirty = true;
  if ($('compare').classList.contains('show')) renderCompare();
  ui.shown = ui.status;  // an editor message ("Apply to all", pattern change + Undo) shows until the next edit
  ui.status = null;
  update();
  scheduleSave();
}
function update(path = currentPath()) {
  renderNav(path);
  if (currentRegion()) drawPath(path);
  applySelection();
  renderDetails(path);
  if (window.GeoLZPlanner) window.GeoLZPlanner.syncPresentation();
}
function choose(region, type, dest = null) {  // dest: east-west destination region id (null = within region)
  if (type && type !== ui.type) ui.sub = null;  // sub-options belong to one path type
  if ((region ?? ui.region) !== ui.region || type !== ui.type) ui.globalFail = null;  // a fresh walk-through
  Object.assign(ui, { region: region ?? ui.region, type: type ?? ui.type, step: -1, dest });
  if (ui.type) reopenDetails();
  update();
}
function stepBy(delta) {
  const path = currentPath(), n = path ? path.steps.length : 0; if (!n) return;
  ui.step = ui.step < 0 ? (delta > 0 ? 0 : n - 1) : Math.max(0, Math.min(n - 1, ui.step + delta));
  update(path);
}
function showAll() { ui.step = -1; update(); }
function overview() {  // no path selected: full diagram at normal opacity, fitted
  Object.assign(ui, { type: null, step: -1, dest: null });
  update(); fit();
}
function toggleCompare(show) {
  const on = $('compare').classList.toggle('show', show);
  if (on && compareDirty) renderCompare();
}
// Presentation mode (button, F; Esc or F exits): diagram only. Entering remembers the side panels; leaving restores
// them and refits. Meanwhile the Present button reads "Exit presentation", pinned top-right of the canvas (CSS).
const PRESENT_BUTTON = { false: ['Present', 'Presentation mode (F, Esc exits)'],
  true: ['Exit presentation', 'Exit presentation (Esc or F)'] };
let beforePresent = null;  // { editor, details, autoClosed } when presentation mode started
function togglePresent(on = !document.body.classList.contains('present')) {
  if (PLANNER_MODE === 'embedded') return window.GeoLZPlanner.openPresentation();
  if (PLANNER_MODE === 'presentation' && !on) return window.close();
  const cls = document.body.classList, was = cls.contains('present');
  if (on && !was) beforePresent = { editor: !cls.contains('noeditor'), details: !cls.contains('nodetails'),
    autoClosed: panels.autoClosed };
  cls.toggle('present', on);
  const [text, title] = PRESENT_BUTTON[on];
  buttonLabel($('btnPresent'), text, title).setAttribute('aria-pressed', String(on));
  if (!on && beforePresent) {
    showEditor(beforePresent.editor); showDetails(beforePresent.details, !beforePresent.autoClosed);
    beforePresent = null;
  }
  fit();
}
// A command bar button's text (its label span, next to the icon) and tooltip.
function buttonLabel(button, text, title) {
  (button.querySelector('.lb') || button).textContent = text;
  button.title = title;
  return button;
}
// Theme: Auto (no data-theme: follow prefers-color-scheme) → Light → Dark. theme.js applied the start theme in <head>;
// a click (or T) also remembers the choice in this browser.
function setTheme(theme) {
  const text = 'Theme: ' + theme[0].toUpperCase() + theme.slice(1);
  applyTheme(theme);
  buttonLabel($('btnTheme'), text, text + ' (T to change)').setAttribute('aria-label', text);
}
function cycleTheme() {
  if (PLANNER_MODE) return;
  const current = document.documentElement.getAttribute('data-theme') || 'auto';
  const next = { auto: 'light', light: 'dark', dark: 'auto' }[current];
  setTheme(next);
  saveTheme(next);
}
function onEscape() {
  if ($('btnLayers').getAttribute('aria-expanded') === 'true') toggleLayersPanel(false);
  else if ($('compare').classList.contains('show')) toggleCompare(false);
  else if (document.body.classList.contains('present')) togglePresent(false);
  else if (editorState.sel) clearSelection();  // editor-actions.js
  else overview();
}
function loadSpec(newSpec) {
  spec = validSpec(newSpec);
  Object.assign(ui, { region: 0, type: null, step: -1, dest: null, globalFail: null });
  onSpecChange(true);
}

/* ===== EVENTS ===== */
function onDetailsClick(e) {
  const t = e.target.closest('button, li[data-step]'); if (!t) return;
  if (t.dataset.step) { ui.step = +t.dataset.step; update(); }
  const buttons = { btnPrev: () => stepBy(-1), btnNext: () => stepBy(1), btnAll: showAll };
  if (buttons[t.id]) buttons[t.id]();
}
function onKey(e) {
  if (historyKey(e)) return;  // editor.js: Ctrl+Z, Ctrl+Y, Shift+Ctrl+Z
  if (e.target.closest('input, select, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
  const actions = { ArrowRight: () => stepBy(1), ArrowLeft: () => stepBy(-1), a: showAll, o: overview,
    c: () => toggleCompare(), d: toggleDetails, f: () => togglePresent(), l: () => toggleLayersPanel(), t: cycleTheme,
    0: fit, Escape: onEscape };
  const action = actions[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (action) { e.preventDefault(); action(); }
}
function initEvents() {
  $('regionTabs').onclick = e => { const b = e.target.closest('[data-region]'); if (b) choose(+b.dataset.region); };
  $('pathButtons').onclick = e => {  // the Overview button, or clicking the active path again, returns to Overview
    const b = e.target.closest('[data-type]'), type = b && b.dataset.type;
    if (b) (type && type !== ui.type ? choose(null, type) : overview());
  };
  $('details').onclick = onDetailsClick;
  $('details').addEventListener('toggle', onPointsToggle, true);  // panels.js: talking points open state
  $('checks').onclick = e => { const b = e.target.closest('[data-sel]'); if (b) selectItem(b.dataset.sel); };
  $('compareTable').onclick = e => {
    const c = e.target.closest('td.cell');
    if (c) { toggleCompare(false); choose(+c.dataset.region, c.dataset.type, c.dataset.dest); }
  };
  $('pathOptions').onclick = e => {
    const b = e.target.closest('[data-sub], [data-fail-act], [data-global-fail]'), act = b && b.dataset.failAct;
    if (b && b.dataset.globalFail) ui.globalFail = b.dataset.globalFail === 'restore' ? null : currentRegion().id;
    const next = act === 'next' && nextToFail(spec, currentRegion(), ui.fail);  // hybrid.js
    if (act) ui.fail = next ? [...ui.fail, next] : [];
    else if (b && subOffered(spec, currentRegion(), ui.type, b.dataset.sub)) ui.sub = b.dataset.sub;
    if (b) showAll();
  };
  $('pathOptions').onchange = e => {
    if ((e.target.dataset || {}).fail) ui.fail = e.target.value ? [JSON.parse(e.target.value)] : [];
    else ui.dest = e.target.value || null;
    showAll();
  };
  $('editor').addEventListener('change', onEditorChange);
  $('editor').addEventListener('toggle', onFoldToggle, true);
  $('editor').addEventListener('click', onEditorClick);
  $('editor').addEventListener('keydown', onEditorKey);
  $('btnEditor').onclick = () => showEditor(document.body.classList.contains('noeditor'));
  $('selNew').onchange = onNewMenu;
  $('layersPanel').onchange = e => { const id = e.target.dataset.layerToggle; if (id) setLayer(id, e.target.checked); };
  $('fileInput').onchange = async e => {
    const file = e.target.files[0];
    if (file) await importFile(file);
    e.target.value = '';
  };
  $('exportName').onkeydown = e => {
    if (e.key === 'Enter') downloadSpec();
    if (e.key === 'Escape') closeExportPanel();
  };
  const clicks = { btnImport: importSpec, btnExport: exportSpec, btnDownload: downloadSpec,
    btnCancelExport: closeExportPanel, btnCompare: () => toggleCompare(),
    btnCloseCompare: () => toggleCompare(false), btnPresent: () => togglePresent(), zoomIn: () => zoom(0.8),
    zoomOut: () => zoom(1.25), zoomFit: fit, btnTheme: cycleTheme, btnClearSaved: clearSaved,
    btnDetails: toggleDetails, btnLayers: () => toggleLayersPanel() };
  for (const [id, fn] of Object.entries(clicks)) $(id).onclick = fn;
  $('status').onclick = e => { if (e.target.id === 'btnUndo') undoLoad(); };
  document.addEventListener('keydown', onKey);
}
applyPatternCss();
setTheme(startTheme());
showDetails((window.innerWidth || 0) >= WIDE, false);
initPanZoom();
watchControls();
initEvents();
startUp();
applyLayers();
startFromUrl();
