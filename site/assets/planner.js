// Region planning workbook — the frame (command bar, Essentials, step tabs, footer), events, save, open, and export.
// State and logic live in planner-core.js, the views in planner-views.js and planner-design.js.
//
// Rendering rule: text, number, and date fields only update the state and patch the parts that depend on them.
// Selections re-render the page and put focus (and the caret) back. Messages, confirmations, and the popup never re-render.
(function () {
  'use strict';
  const root = document.getElementById('planner');
  if (!root) return;
  const M = window.MRP, C = M.core, K = M.kit, { icon, status } = M, { esc } = K, ui = M.ui, T = M.viewTools;
  const TABS = [
    { id: 'scope', label: 'Scope', step: 1 }, { id: 'services', label: 'Services', step: 1 }, { id: 'latency', label: 'Latency', step: 1 },
    { id: 'pricing', label: 'Pricing', step: 1 }, { id: 'checks', label: 'Checks', step: 1 },
    { id: 'design', label: 'Regional design', step: 2 }, { id: 'review', label: 'Review + export', step: 2 },
  ];   // the order of this list is the order of the tab strip, of Previous and Next, and of the arrow keys
  const STEPS = { 1: 'Qualify regions', 2: 'Select the regional design' };
  const tabFromHash = () => { const h = location.hash.slice(1), id = h === 'record' ? 'review' : h; return TABS.some(t => t.id === id) ? id : ''; };
  ui.tab = tabFromHash() || 'scope';
  const GLYPH = { done: ['success', 'complete'], half: ['half', 'in progress'], none: ['none', 'not started'], lock: ['lock', 'needs a selected region'] };

  // ───────────── skeleton
  root.innerHTML =
    '<div class="pl-app">' +
    `<div class="pl-cmd" role="toolbar" aria-label="Workbook actions">${K.btn({ act: 'export', label: 'Export to Excel', icon: 'export', kind: 'subtle' })}${K.btn({ act: 'save', label: 'Save', icon: 'save', kind: 'subtle' })}${K.btn({ act: 'open', label: 'Open', icon: 'open', kind: 'subtle' })}` +
    `<span class="pl-sep" role="separator" aria-orientation="vertical"></span>${K.btn({ act: 'example', label: 'Load example', icon: 'sample', kind: 'subtle', id: 'pl-b-example' })}${K.btn({ act: 'reset', label: 'Clear', icon: 'delete', kind: 'subtle', id: 'pl-b-reset' })}</div>` +
    '<div class="pl-msgslot" id="pl-msg"></div><section class="pl-ess" id="pl-ess" aria-label="Essentials"></section><div class="pl-tabswrap" id="pl-tabs"></div>' +
    '<div class="pl-panel" id="pl-panel" role="tabpanel" tabindex="-1"><p class="pl-muted">Loading the workbook</p></div><div class="pl-foot-bar" id="pl-foot"></div></div>' +
    '<div class="pl-layer"><div class="pl-pop" id="pl-pop" role="listbox" hidden></div><div class="pl-tip" role="tooltip" hidden></div></div><input type="file" id="pl-file" accept=".json,application/json" hidden>';
  const el = id => document.getElementById(id);
  const ess = el('pl-ess'), tabsEl = el('pl-tabs'), panel = el('pl-panel'), foot = el('pl-foot'), msgEl = el('pl-msg');

  // ───────────── frame views
  function vEssentials() {
    const S = C.S, D = C.D, open = S.ui.essentials;
    const names = S.current.map(c => `${esc(C.rname(c.id))}${c.id === S.baseline && S.current.length > 1 ? ' <span class="pl-tag">Price baseline</span>' : ''}${c.hub ? ' <span class="pl-tag">Hub</span>' : ''}`);
    const counts = {};
    S.regions.forEach(r => { const o = C.outcome(r); counts[o] = (counts[o] || 0) + 1; });
    const breakdown = M.O.outcome.filter(o => counts[o]).map(o => `<span class="pl-it">${status(M.OUTCOME_ICON[o])}<span>${counts[o]} ${esc(o.toLowerCase())}</span></span>`).join('');
    const picked = C.selected();
    const prices = D.hasCatalog ? `${D.meta.partial ? 'Partial test snapshot' : 'Snapshot'} of ${esc(K.fmtDate(D.meta.generated))}` : D.asFile ? 'Not loaded' : 'Not published';
    const lat = D.lat ? `Dataset of ${esc(D.lat.dataset || K.fmtDate(D.lat.generated))}` : D.asFile ? 'Not loaded' : 'Not published';
    const v = x => x || K.EM;
    const kv = (a, b) => `<div class="pl-kv-r"><dt>${a}</dt><dd>${b}</dd></div>`;
    return `<div class="pl-ess-h"><button type="button" class="pl-ess-t" data-act="essentials" aria-expanded="${open}" aria-controls="pl-ess-b">${icon(open ? 'down' : 'right')}<span>Essentials</span></button></div>` +
      `<div class="pl-ess-b" id="pl-ess-b"${open ? '' : ' hidden'}><dl>${kv('Workbook', esc(v(S.meta.name)))}${kv('Owner', esc(v(S.meta.owner)))}${kv('Assessment date', esc(v(S.meta.date)))}</dl>` +
      `<dl>${kv('Current regions', names.length ? names.join(', ') : K.EM)}${kv('Regions to qualify', S.regions.length ? `${S.regions.length}${breakdown ? `<span class="pl-brk">${breakdown}</span>` : ''}` : K.EM)}` +
      `${kv('Selected for regional design', picked.length ? esc(picked.map(r => C.rname(r.id)).join(', ')) : 'None yet')}${kv('Azure data', `<span class="pl-blk">Prices: ${prices}</span><span class="pl-blk">Latency: ${lat}</span>`)}</dl></div>`;
  }
  function vTabs() {
    const prog = C.progress();
    const tab = t => { const [g, word] = GLYPH[prog[t.id]];
      return `<button type="button" role="tab" id="tab-${t.id}" class="pl-tab${ui.tab === t.id ? ' on' : ''}" aria-label="${esc(t.label)}, ${word}" aria-selected="${ui.tab === t.id}" aria-controls="pl-panel" tabindex="${ui.tab === t.id ? 0 : -1}" data-act="tab" data-arg="${t.id}">${status(g)}<span>${esc(t.label)}</span></button>`; };
    const group = n => `<div class="pl-tabgrp" data-step="${n}" role="none"><span class="pl-tabgrp-l" aria-hidden="true">${STEPS[n]}</span><div class="pl-tabrow" role="none">${TABS.filter(t => t.step === n).map(tab).join('')}</div></div>`;
    return `<div class="pl-tabs" role="tablist" aria-label="Workbook steps">${group(1)}${group(2)}</div>`;
  }
  function vFoot() {
    const i = TABS.findIndex(t => t.id === ui.tab), prev = TABS[i - 1], next = TABS[i + 1], n = C.selected().length;
    return `<div class="pl-foot-in"><div class="pl-foot-l">${prev ? K.btn({ act: 'tab', arg: prev.id, label: 'Previous', icon: 'arrowleft' }) : ''}` +
      `${next ? K.btn({ act: 'tab', arg: next.id, label: 'Next: ' + next.label, kind: 'primary' }) : K.btn({ act: 'export', label: 'Export to Excel', icon: 'export', kind: 'primary' })}</div>` +
      `<p class="pl-foot-r" role="status">${n ? `${K.plural(n, 'region')} selected for regional design` : 'No region selected for regional design yet'}</p></div>`;
  }
  // Replace a part of the frame only when its markup changed, so typing never disturbs it.
  function put(node, html) { if (node._h !== html) { node.innerHTML = html; node._h = html; return true; } return false; }

  // ───────────── focus: remember what had it, put it back after the markup was replaced
  const q = s => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  function sigOf(a) {
    if (!a || !root.contains(a) || a === document.body) return null;
    const d = a.dataset;
    if (d.cb) return `[data-cb="${q(d.cb)}"]`;
    if (d.k && d.v !== undefined) return `[data-k="${q(d.k)}"][data-v="${q(d.v)}"]`;
    if (d.k && a.type === 'radio') return `[data-k="${q(d.k)}"][value="${q(a.value)}"]`;
    if (d.k) return `[data-k="${q(d.k)}"]`;
    if (d.act && d.arg !== undefined) return `[data-act="${q(d.act)}"][data-arg="${q(d.arg)}"]`;
    if (d.act) return `[data-act="${q(d.act)}"]`;
    if (a.id) return '#' + CSS.escape(a.id);
    return null;
  }
  const textual = a => a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && ['text', 'search', ''].includes(a.type)));
  function render() {
    const a = document.activeElement, sig = sigOf(a), caret = sig && textual(a) ? [a.selectionStart, a.selectionEnd] : null;
    const scrolls = [...panel.querySelectorAll('.pl-scroll')].map(x => x.scrollLeft), same = panel.dataset.tab === ui.tab;
    K.closePop(); K.hideTip();
    put(ess, vEssentials()); put(tabsEl, vTabs()); put(foot, vFoot());
    if (!same) revealTab();
    panel.innerHTML = M.views[ui.tab](); panel.dataset.tab = ui.tab;
    panel.dataset.step = String(TABS.find(t => t.id === ui.tab).step);   // the step group's hue, see "accents" in planner.css
    panel.setAttribute('aria-labelledby', 'tab-' + ui.tab);
    if (same) panel.querySelectorAll('.pl-scroll').forEach((x, i) => { if (scrolls[i]) x.scrollLeft = scrolls[i]; });
    fitGrid();
    if (sig) {
      const t = root.querySelector(sig);
      if (t) { K.setQuiet(true); t.focus({ preventScroll: true }); K.setQuiet(false); if (caret && textual(t)) { try { t.setSelectionRange(caret[0], caret[1]); } catch (e) { /* not a text field */ } } }
    }
    root.dataset.ready = '1';
  }
  // On narrow screens the tab strip scrolls; keep the selected tab in view.
  function revealTab() {
    const on = tabsEl.querySelector('.pl-tab.on');
    if (on && tabsEl.scrollWidth > tabsEl.clientWidth) tabsEl.scrollLeft = Math.max(0, on.offsetLeft - 24);
  }
  function patch() {
    put(ess, vEssentials()); put(tabsEl, vTabs()); put(foot, vFoot());
    if (ui.tab === 'pricing') T.patchPricing(panel);
    if (ui.tab === 'latency') T.patchLatency(panel);
  }
  // The checks grid sticks its header to the page when it fits, and scrolls inside its own frame when it doesn't.
  function fitGrid() {
    const w = document.getElementById('pl-cgw');
    if (w) w.classList.toggle('fit', panel.clientWidth - 64 >= (window.matchMedia('(max-width: 960px)').matches ? 260 : 320) + (parseInt(w.style.getPropertyValue('--n'), 10) || 1) * 190);
  }
  try { new ResizeObserver(fitGrid).observe(panel); } catch (e) { window.addEventListener('resize', fitGrid); }
  // Loads that finish later (prices, products, cities) must not close a popup the person has opened or drop what they typed in it.
  const lazyRender = () => { if (K.popOpen()) { dirty = true; return; } render(); };
  let dirty = false;
  const commit = () => { dirty = false; C.tidy(); C.save(); render(); };
  K.hooks.commit = commit; K.hooks.render = lazyRender;

  // ───────────── messages and confirmations (patched in place; no render)
  let msgTimer = 0;
  function say(kind, text) {
    clearTimeout(msgTimer);
    msgEl.innerHTML = K.mb(kind, esc(text));
    msgEl.classList.remove('fade');
    msgTimer = setTimeout(() => { msgEl.classList.add('fade'); msgTimer = setTimeout(() => { msgEl.innerHTML = ''; msgEl.classList.remove('fade'); }, 400); }, 5000);
  }
  const confirms = {};
  function confirmThen(what, id, ask, fn) {
    const b = el(id), c = confirms[what];
    if (c && c.on) { clearTimeout(c.t); revert(what); fn(); return; }
    const label = b.querySelector('span');
    confirms[what] = { on: true, id, text: label.textContent, t: setTimeout(() => revert(what), 4000) };
    label.textContent = ask; b.classList.add('danger'); b.classList.remove('subtle');
  }
  function revert(what) {
    const c = confirms[what]; if (!c || !c.on) return;
    c.on = false;
    const b = el(c.id); if (!b) return;
    b.querySelector('span').textContent = c.text; b.classList.remove('danger'); b.classList.add('subtle');
  }
  const isEmpty = () => { const S = C.S; return !S.regions.length && !S.current.length && !S.services.length && !S.sites.length && !S.meta.name && !S.meta.owner; };
  function download(blob, name) {
    const a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ───────────── state changes
  function setK(key, v) {
    const S = C.S, p = key.split('/'), numeric = x => x === '' ? '' : Number(x);
    if (p[0] === 'meta') S.meta[p[1]] = v;
    else if (p[0] === 'estate') S.estate[p[1]] = v;
    else if (p[0] === 'baseline') { S.baseline = v; C.loadPricing(v).then(ok => ok && lazyRender()); }
    else if (p[0] === 'hub') { const x = S.current.find(c => c.id === p[1]); if (x) x.hub = !!v; }
    else if (p[0] === 'ui') S.ui[p[1]] = !!v;
    else if (p[0] === 'note') S.notes[p[1]] = v;
    else if (p[0] === 'reg') { const r = C.reg(p[1]); if (!r) return; if (p[2] === 'check') r.checks[p[3]] = v; else r[p[2]] = v; }
    else if (p[0] === 'svc') { const s = S.services.find(x => x.id === p[1]); if (s) s[p[2]] = numeric(v); }
    else if (p[0] === 'site') {
      const s = S.sites.find(x => x.id === p[1]); if (!s) return;
      if (p[2] === 'edit') { if (v === '' || !isFinite(Number(v))) delete s.edits[p[3]]; else s.edits[p[3]] = Number(v); }
      else s[p[2]] = p[2] === 'target' ? numeric(v) : v;
    } else if (p[0] === 'des') {
      const r = C.reg(p[1]); if (!r) return; const d = C.design(r);
      if (p[2] === 'ss') {
        const x = d.ss[p[3]] = d.ss[p[3]] || {};
        if (p[4] === 'p') { const sh = C.effective(r).ss.find(s => s.id === p[3]); if (sh && v === sh.def) delete x.p; else x.p = v; }
        else x[p[4]] = v;
      } else if (p[2] === 'custom') { const x = d.custom.find(c => c.id === p[3]); if (x) x[p[4]] = v; }
      else { d[p[2]] = v; if (p[2] === 'q1' && v !== 'Yes') d.q2 = d.q3 = ''; if (p[2] === 'q2' && v !== 'No') d.q3 = ''; }
    }
  }
  function openTab(id) {
    ui.tab = id; history.replaceState(null, '', '#' + id);
    if (id === 'services' || id === 'pricing') C.loadProducts().then(ok => ok && ui.tab === 'services' && lazyRender());
    if (id === 'latency') C.loadCities().then(ok => ok && ui.tab === 'latency' && lazyRender());
    if (id === 'pricing') C.loadPricing(C.S.baseline).then(ok => ok && ui.tab === 'pricing' && lazyRender());
    const top = (tabsEl.getBoundingClientRect().top), head = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--top-h'), 10) || 56;
    if (top < head + 8) window.scrollBy({ top: top - head - 8 });
  }
  function patchNote(rowId) { const c = root.querySelector(`[data-note-cell="${rowId}"]`); if (c) c.innerHTML = T.noteCell(rowId); }

  function act(name, arg, src) {
    const S = C.S;
    switch (name) {
      case 'tab': openTab(arg); break;
      case 'region': ui.region = arg; break;
      case 'goto-design': ui.region = arg; openTab('design'); break;
      case 'essentials': S.ui.essentials = !S.ui.essentials; break;
      case 'rm-current': S.current = S.current.filter(x => x.id !== arg); break;
      case 'rm-region': S.regions = S.regions.filter(r => r.id !== arg); break;
      case 'rm-svc': S.services = S.services.filter(x => x.id !== arg); break;
      case 'add-starter': {
        const have = new Set(S.services.map(s => s.service));
        M.STARTER_SERVICES.filter(n => (!C.D.hasCatalog || C.D.svc[n]) && !have.has(n)).slice(0, T.MAX_SERVICES - S.services.length).forEach(n => S.services.push({ id: C.uid('v'), service: n, product: '', weight: '' }));
        break; }
      case 'rm-site': S.sites = S.sites.filter(x => x.id !== arg); break;
      case 'reset-edit': { const [sid, rid] = arg.split('|'), s = S.sites.find(x => x.id === sid); if (s) delete s.edits[rid]; break; }
      case 'add-custom': C.design(C.reg(ui.region)).custom.push({ id: C.uid('c'), name: '', p: '', from: '', note: '' }); break;
      case 'rm-custom': { const d = C.design(C.reg(ui.region)); d.custom = d.custom.filter(x => x.id !== arg); break; }
      case 'ss-reset': C.design(C.reg(ui.region)).ss = {}; break;
      case 'cb-clear': K.comboClear(arg); return;
      case 'note': {
        const prev = ui.noteEdit; ui.noteEdit = arg;
        if (prev && prev !== arg) patchNote(prev);
        patchNote(arg);
        const t = root.querySelector(`[data-note="${arg}"]`); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
        return; }
      case 'export': download(window.XlsxLite.build(M.workbook()), M.fileName('xlsx')); say('success', 'The Excel workbook was downloaded.'); return;
      case 'save': download(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), M.fileName('json')); say('success', 'Saved. Use Open to load the file again, here or in another browser.'); return;
      case 'open': el('pl-file').click(); return;
      case 'copy': { const t = C.recordText();
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => say('success', 'The record was copied.'), () => say('error', 'Copying isn’t available in this browser. Use Export to Excel or Print.')); return; }
      case 'print': window.print(); return;
      case 'example': {
        const go = () => { const ex = JSON.parse(JSON.stringify(M.EXAMPLE)); ex.meta.date = C.today(); C.replace(ex); ui.tab = 'checks'; ui.region = ''; ui.noteEdit = ''; history.replaceState(null, '', '#checks');
          C.loadPricing(C.S.baseline).then(ok => ok && lazyRender()); if (C.D.lat) C.loadCities().then(ok => ok && lazyRender()); render(); say('info', 'The example is loaded. Every value in it is illustrative.'); };
        if (isEmpty()) go(); else confirmThen('example', 'pl-b-example', 'Replace with the example?', go);
        return; }
      case 'reset': confirmThen('reset', 'pl-b-reset', 'Clear everything?', () => { C.replace(C.blank()); ui.tab = 'scope'; ui.region = ''; ui.noteEdit = ''; history.replaceState(null, '', '#scope'); render(); say('info', 'The workbook is cleared.'); }); return;
      default: return;
    }
    commit();
  }

  // ───────────── events
  const valueOf = e => e.type === 'checkbox' ? e.checked : e.value;
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled) { act(b.dataset.act, b.dataset.arg, b); return; }
    const c = e.target.closest('button[data-k][data-v]');
    if (c && !c.disabled) { if (c.getAttribute('aria-checked') === 'true' && c.getAttribute('role') === 'radio') return; setK(c.dataset.k, c.dataset.v); commit(); }
  });
  root.addEventListener('input', e => {
    const t = e.target.closest('[data-k]');
    if (!t || t.matches('select, input[type=checkbox], input[type=radio], button')) return;
    setK(t.dataset.k, valueOf(t)); C.save(); patch();
  });
  root.addEventListener('change', e => {
    if (e.target.id === 'pl-file') {
      const f = e.target.files[0];
      if (f) f.text().then(t => { const raw = JSON.parse(t); if (!raw || typeof raw !== 'object' || !Array.isArray(raw.regions)) throw new Error('not a workbook'); C.replace(raw); ui.region = ''; ui.noteEdit = ''; C.loadPricing(C.S.baseline).then(ok => ok && lazyRender()); if (C.D.lat) C.loadCities().then(ok => ok && lazyRender()); render(); say('success', `Opened ${f.name}.`); })
        .catch(() => say('error', 'That file isn’t a workbook saved from this page.')).finally(() => { e.target.value = ''; });
      return;
    }
    const t = e.target.closest('[data-k]');
    if (!t || !t.matches('select, input[type=checkbox], input[type=radio]')) return;
    setK(t.dataset.k, valueOf(t)); commit();
  });
  let down = false;
  root.addEventListener('pointerdown', () => { down = true; });
  document.addEventListener('pointerup', () => { down = false; }, true);
  // Leaving a field: a cleared latency value shows the calculated one again, and a note editor closes after the click that left it has finished.
  root.addEventListener('focusout', e => {
    const t = e.target;
    if (t.matches && t.matches('.pl-lc-num') && t.value === '') {
      const [, sid, , rid] = t.dataset.k.split('/'), s = C.S.sites.find(x => x.id === sid), l = s && C.siteLatency(s, rid);
      t.value = l ? l.ms : '';
    }
    // An emptied date field shows the default date again once the person has left it (the rule is in planner-core.js).
    if (t.type === 'date' && t.dataset.k && t.value === '') { C.tidy(); C.save(); t.value = C.today(); patch(); }
    if (t.dataset && t.dataset.note) {
      const id = t.dataset.note, close = () => { if (ui.noteEdit === id) { ui.noteEdit = ''; patchNote(id); } };
      if (down) document.addEventListener('pointerup', () => setTimeout(close, 0), { once: true, capture: true }); else close();
    }
  });
  root.addEventListener('keydown', e => {
    const t = e.target;
    if (t.dataset && t.dataset.note && (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey))) { e.preventDefault(); t.blur(); return; }
    const arrows = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (t.getAttribute('role') === 'tab' && (arrows[e.key] || e.key === 'Home' || e.key === 'End')) {
      const all = [...root.querySelectorAll('[role=tab]')], i = all.indexOf(t);
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (i + arrows[e.key] + all.length) % all.length;
      e.preventDefault(); all[n].focus(); all[n].click(); return;
    }
    if (t.getAttribute('role') === 'radio' && arrows[e.key]) {
      const g = t.closest('[role=radiogroup]'), all = g ? [...g.querySelectorAll('[role=radio]:not(:disabled)')] : [], i = all.indexOf(t);
      if (i < 0) return;
      e.preventDefault(); const nx = all[(i + arrows[e.key] + all.length) % all.length]; nx.focus(); nx.click();
    }
  });
  K.bindPop(root); K.bindTips(root);
  window.addEventListener('hashchange', () => { const id = tabFromHash(); if (id && id !== ui.tab) { openTab(id); render(); } });
  window.addEventListener('beforeprint', () => { K.closePop(); K.hideTip(); });

  // ───────────── start
  C.load(); C.tidy();
  C.loadData().then(async () => {
    await C.loadPricing(C.S.baseline);
    if (C.D.lat && C.S.sites.some(s => s.kind === 'city')) await C.loadCities();
    C.tidy(); render();
    if (ui.tab === 'services') C.loadProducts().then(ok => ok && lazyRender());
    if (ui.tab === 'latency') C.loadCities().then(ok => ok && lazyRender());
  });
})();
