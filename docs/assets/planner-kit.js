// Region planning workbook — shared interface pieces: escaping, buttons, form controls, message bars, the combobox, and tooltips.
// Builders return HTML strings. The combobox and the tooltip live in a layer outside the re-rendered page, so a render never closes them by accident.
(function (global) {
  'use strict';
  const M = global.MRP, { icon, status } = M;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const slug = s => String(s).replace(/[^\w-]+/g, '-');
  const fold = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const lower = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : '';
  const fmtDate = iso => { try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
  const EM = '—';

  const hooks = { commit: () => {} };   // set by planner.js: tidy, save, render
  let quiet = false;                    // true while the page puts focus back after a render, so the popup doesn't open by itself
  const setQuiet = v => { quiet = v; };
  // View state that isn't part of the saved workbook.
  const ui = { tab: 'scope', region: '', noteEdit: '' };

  // ───────────── buttons
  function btn(o) {
    const cls = ['pl-btn', o.kind || 'secondary', o.cls || ''].filter(Boolean).join(' ');
    const a = [`type="button"`, `class="${cls}"`];
    if (o.act) a.push(`data-act="${o.act}"`);
    if (o.arg !== undefined) a.push(`data-arg="${esc(o.arg)}"`);
    if (o.id) a.push(`id="${o.id}"`);
    if (o.disabled) a.push('disabled');
    if (o.aria) a.push(`aria-label="${esc(o.aria)}"`);
    if (o.tip) a.push(`data-tip="${esc(o.tip)}"`);
    if (o.pressed !== undefined) a.push(`aria-pressed="${o.pressed}"`);
    return `<button ${a.join(' ')}>${o.icon ? icon(o.icon) : ''}${o.label ? `<span>${esc(o.label)}</span>` : ''}</button>`;
  }
  const iconBtn = (act, arg, ic, label, cls) => `<button type="button" class="pl-btn subtle icon${cls ? ' ' + cls : ''}" data-act="${act}" data-arg="${esc(arg)}" aria-label="${esc(label)}" data-tip="${esc(label)}">${icon(ic)}</button>`;

  // ───────────── controls
  // A native drop-down, so the keyboard and screen reader behavior come with it. `tone` puts a status icon at the left of the value.
  function sel(k, value, opts, o = {}) {
    value = value || '';
    const items = opts.map(x => Array.isArray(x) ? x : [x, x]);
    const extra = value && !items.some(x => x[0] === value) ? `<option value="${esc(value)}" selected>${esc(value)}</option>` : '';
    const kind = o.tone ? { good: 'success', warn: 'warning', bad: 'error' }[o.tone] : '';
    const options = items.map(x => `<option value="${esc(x[0])}"${x[0] === value ? ' selected' : ''}>${esc(x[1])}</option>`).join('');
    return `<span class="pl-sel-wrap${kind ? ' has-ic' : ''}${value ? '' : ' is-empty'}${o.cls ? ' ' + o.cls : ''}">${kind ? `<span class="pl-sel-ic">${status(kind)}</span>` : ''}` +
      `<select class="pl-sel" data-k="${esc(k)}"${o.id ? ` id="${o.id}"` : ''} aria-label="${esc(o.label || '')}"${o.disabled ? ' disabled' : ''}${value ? ` title="${esc(value)}"` : ''}>` +
      `<option value="">${esc(o.empty || 'Select')}</option>${options}${extra}</select>${icon('down', { cls: 'pl-sel-caret' })}</span>`;
  }
  const inp = (k, value, o = {}) => `<input class="pl-in${o.cls ? ' ' + o.cls : ''}" type="${o.type || 'text'}" data-k="${esc(k)}"${o.id ? ` id="${o.id}"` : ''} value="${esc(value ?? '')}" placeholder="${esc(o.ph || '')}" aria-label="${esc(o.label || o.ph || '')}"` +
    `${o.list ? ` list="${o.list}"` : ''}${o.type === 'number' ? ` step="${o.step || 'any'}"${o.min !== undefined ? ` min="${o.min}"` : ''}${o.max !== undefined ? ` max="${o.max}"` : ''} inputmode="decimal"` : ''}${o.disabled ? ' disabled' : ''}>`;
  const area = (k, value, o = {}) => `<textarea class="pl-in pl-area" data-k="${esc(k)}"${o.id ? ` id="${o.id}"` : ''} rows="${o.rows || 2}" placeholder="${esc(o.ph || '')}" aria-label="${esc(o.label || o.ph || '')}">${esc(value || '')}</textarea>`;

  // A labeled row in a sectioned form: label at the left, control at the right.
  function row(label, k, control, hint) {
    const id = 'f-' + slug(k);
    return `<div class="pl-row"><label class="pl-label" for="${id}">${esc(label)}</label><div class="pl-ctl">${control(id)}${hint ? `<p class="pl-hint">${esc(hint)}</p>` : ''}</div></div>`;
  }
  const rowRaw = (label, controlHtml, hint, wide) => `<div class="pl-row"><span class="pl-label">${esc(label)}</span><div class="pl-ctl${wide ? ' wide' : ''}">${controlHtml}${hint ? `<p class="pl-hint">${esc(hint)}</p>` : ''}</div></div>`;

  // Two or more exclusive choices as one control (radio semantics, arrow keys move the choice).
  function seg(k, value, opts, o = {}) {
    const items = opts.map(x => Array.isArray(x) ? x : [x, x]);
    const anyOn = items.some(x => x[0] === value);
    return `<div class="pl-seg${o.cls ? ' ' + o.cls : ''}" role="radiogroup" aria-label="${esc(o.label || '')}">` + items.map((x, i) => {
      const on = x[0] === value, tab = on || (!anyOn && i === 0);
      return `<button type="button" class="pl-seg-b${on ? ' on' : ''}" role="radio" aria-checked="${on}" tabindex="${tab && !o.disabled ? 0 : -1}" data-k="${esc(k)}" data-v="${esc(x[0])}"${o.disabled ? ' disabled' : ''}>${esc(x[1])}</button>`;
    }).join('') + '</div>';
  }
  // Choice cards: a radio group where each choice has a picture, a title, and text.
  function cards(k, value, items, o = {}) {
    const anyOn = items.some(x => x.id === value);
    return `<div class="pl-cards${o.cls ? ' ' + o.cls : ''}" role="radiogroup" aria-label="${esc(o.label || '')}">` + items.map((x, i) => {
      const on = x.id === value, tab = on || (!anyOn && i === 0), dis = x.disabled || o.disabled;
      return `<button type="button" class="pl-choice${on ? ' on' : ''}" role="radio" aria-checked="${on}" tabindex="${tab && !dis ? 0 : -1}" data-k="${esc(k)}" data-v="${esc(x.id)}"${dis ? ' disabled' : ''}>` +
        `${x.art ? `<span class="pl-choice-art">${x.art}</span>` : ''}<span class="pl-choice-t">${x.tag ? `<span class="pl-tag brand">${esc(x.tag)}</span>` : ''}${esc(x.title || x.id)}</span>${x.text ? `<span class="pl-choice-x">${esc(x.text)}</span>` : ''}` +
        `<span class="pl-choice-mark">${on ? status('success') : ''}</span></button>`;
    }).join('') + '</div>';
  }
  const toggle = (k, on, label) => `<button type="button" class="pl-switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-k="${esc(k)}" data-v="${on ? '' : '1'}"><span class="pl-switch-knob"></span></button>`;

  // ───────────── status pieces
  const badge = (kind, text, o = {}) => `<span class="pl-badge ${kind}${o.lg ? ' lg' : ''}">${status(kind)}<span>${esc(text)}</span></span>`;
  const tag = (text, kind) => `<span class="pl-tag${kind ? ' ' + kind : ''}">${esc(text)}</span>`;
  // kinds: info, warning, success, error. `html` is trusted markup (escape user text before passing it).
  function mb(kind, html, action, o = {}) {
    return `<div class="pl-mb ${kind}${o.cls ? ' ' + o.cls : ''}" role="${kind === 'error' ? 'alert' : 'status'}">${status(kind === 'error' ? 'error' : kind)}<div class="pl-mb-t">${html}</div>${action || ''}</div>`;
  }
  function empty(ic, text, tab, label) {
    return `<div class="pl-empty"><span class="pl-empty-ic">${icon(ic)}</span><p>${esc(text)}</p>${tab ? btn({ act: 'tab', arg: tab, label: label || 'Go to Scope', kind: 'primary' }) : ''}</div>`;
  }
  // A page title for a tab, then its sections.
  const head = (title, text) => `<header class="pl-head"><h2 class="pl-title">${esc(title)}</h2><p class="pl-sub">${esc(text)}</p></header>`;
  const section = (title, body, o = {}) => `<section class="pl-sec"${o.id ? ` id="${o.id}"` : ''}><div class="pl-sec-h"><h3>${esc(title)}</h3>${o.link ? `<a class="pl-link" href="${o.link[0]}">${esc(o.link[1])}${icon('arrowright')}</a>` : ''}</div>${o.desc ? `<p class="pl-sec-d">${esc(o.desc)}</p>` : ''}${body}</section>`;
  const tip = text => `data-tip="${esc(text)}"`;
  const scroll = (html, o = {}) => `<div class="pl-scroll${o.cls ? ' ' + o.cls : ''}" tabindex="0" role="region" aria-label="${esc(o.label || 'Table')}">${html}</div>`;

  // ───────────── combobox
  // cfg: { items(): [{ value, label, sub, group, tag }], mode: 'add' | 'value' | 'text', display, onPick(item), onFree(text), onClear, ph, label, disabled, clearable }
  // 'text' is a plain text field that suggests values: the text is the value, whatever is typed is kept, and a suggestion only fills it in.
  // It also takes { key, inputId, describedBy, value() }: the input carries data-k, so typing goes through the same path as any other text field.
  const CB = {};
  let pop = null;   // { id, q, touched, active, shown }
  const layer = () => document.querySelector('#planner .pl-layer');
  const popEl = () => layer().querySelector('.pl-pop');

  function combo(id, cfg) {
    CB[id] = cfg;
    const val = cfg.mode === 'value', txt = cfg.mode === 'text', value = val ? (cfg.display ? cfg.display() : '') : txt ? (cfg.value ? cfg.value() : '') : '', clear = val && cfg.clearable && value;
    return `<div class="pl-cb${val ? ' val' : ''}${txt ? ' txt' : ''}${cfg.disabled ? ' off' : ''}">${val || txt ? '' : icon('search', { cls: 'pl-cb-ic' })}` +
      `<input class="pl-cb-in" type="text" role="combobox" aria-expanded="false" aria-controls="pl-pop" aria-autocomplete="list" aria-haspopup="listbox" autocomplete="off" spellcheck="false" ` +
      `data-cb="${esc(id)}"${txt ? ` data-k="${esc(cfg.key)}"${cfg.inputId ? ` id="${cfg.inputId}"` : ''}${cfg.describedBy ? ` aria-describedby="${cfg.describedBy}"` : ''}` : ''} placeholder="${esc(cfg.ph || '')}" aria-label="${esc(cfg.label || cfg.ph || '')}" value="${esc(value)}"${cfg.disabled ? ' disabled' : ''}>` +
      (clear ? `<button type="button" class="pl-cb-x" data-act="cb-clear" data-arg="${esc(id)}" aria-label="Clear ${esc(cfg.label || 'value')}">${icon('close')}</button>` : val || (txt && cfg.items().length) ? icon('down', { cls: 'pl-cb-caret' }) : '') + '</div>';
  }
  function filtered() {
    const cfg = CB[pop.id];
    const q = fold(pop.touched ? pop.q : '').trim(), words = q.split(/\s+/).filter(Boolean);
    const all = cfg.items().filter(it => !words.length || words.every(w => fold(it.label + ' ' + (it.sub || '')).includes(w)));
    return { rows: all.slice(0, 50), more: Math.max(0, all.length - 50), total: all.length };
  }
  function drawPop() {
    const el = popEl(), input = document.querySelector(`#planner [data-cb="${CSS.escape(pop.id)}"]`);
    if (!input) { closePop(); return; }
    const cfg = CB[pop.id], f = filtered(), txt = cfg.mode === 'text';
    pop.shown = f.rows;
    if (pop.active >= f.rows.length) pop.active = txt ? f.rows.length - 1 : Math.max(0, f.rows.length - 1);
    // a text field with nothing to suggest stays a plain text field
    if (txt && !f.rows.length) { el.hidden = true; el.innerHTML = ''; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); return; }
    let html = '', last = null;
    f.rows.forEach((it, i) => {
      if (it.group && it.group !== last) { html += `<div class="pl-pop-g" role="presentation">${esc(it.group)}</div>`; last = it.group; }
      html += `<div class="pl-pop-o${i === pop.active ? ' on' : ''}" role="option" id="pl-opt-${i}" aria-selected="${i === pop.active}" data-i="${i}"><span class="pl-pop-l">${esc(it.label)}</span>${it.sub ? `<span class="pl-pop-s">${esc(it.sub)}</span>` : ''}${it.tag ? `<span class="pl-tag">${esc(it.tag)}</span>` : ''}</div>`;
    });
    if (!f.rows.length) html = `<div class="pl-pop-n">${cfg.onFree && pop.q.trim() ? `Press Enter to add “${esc(pop.q.trim())}”` : 'No matches'}</div>`;
    else if (f.more) html += `<div class="pl-pop-n">Keep typing to narrow. ${f.more} more.</div>`;
    el.innerHTML = html;
    el.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    if (f.rows.length && pop.active >= 0) input.setAttribute('aria-activedescendant', 'pl-opt-' + pop.active); else input.removeAttribute('aria-activedescendant');
    placePop(input);
    const on = el.querySelector('.pl-pop-o.on');
    if (on) on.scrollIntoView({ block: 'nearest' });
  }
  function placePop(input) {
    const el = popEl(), r = input.closest('.pl-cb').getBoundingClientRect();
    const w = Math.max(r.width, 300), left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    el.style.width = Math.min(w, window.innerWidth - 16) + 'px';
    el.style.left = left + 'px';
    const below = window.innerHeight - r.bottom - 12, above = r.top - 12, h = Math.min(el.scrollHeight, 320);
    if (below >= Math.min(h, 200) || below >= above) { el.style.top = r.bottom + 4 + 'px'; el.style.bottom = 'auto'; el.style.maxHeight = Math.max(120, Math.min(320, below)) + 'px'; }
    else { el.style.bottom = window.innerHeight - r.top + 4 + 'px'; el.style.top = 'auto'; el.style.maxHeight = Math.max(120, Math.min(320, above)) + 'px'; }
  }
  function openPop(input) {
    if (input.disabled) return;
    const id = input.dataset.cb, txt = CB[id] && CB[id].mode === 'text';
    if (txt && !CB[id].items().length) return;
    if (!pop || pop.id !== id) pop = { id, q: '', touched: false, active: txt ? -1 : 0, shown: [] };
    drawPop();
  }
  function closePop() {
    if (!pop) return;
    const el = layer() && popEl(), input = document.querySelector(`#planner [data-cb="${CSS.escape(pop.id)}"]`);
    if (el) { el.hidden = true; el.innerHTML = ''; }
    if (input) {
      input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant');
      const cfg = CB[pop.id];
      if (cfg && cfg.mode === 'value') input.value = cfg.display ? cfg.display() : '';
      else if (cfg && cfg.mode !== 'text') input.value = '';
    }
    pop = null;
  }
  function pick(i) {
    const it = pop && pop.shown[i], cfg = pop && CB[pop.id];
    if (!it || !cfg) return;
    const id = pop.id, input = cfg.mode === 'text' && document.querySelector(`#planner [data-cb="${CSS.escape(id)}"]`);
    closePop();
    if (input) input.value = it.value;   // the caret goes to the end of the text that was filled in
    cfg.onPick(it);
    hooks.commit(id);
  }
  function onInput(input) {
    if (!pop || pop.id !== input.dataset.cb) openPop(input);
    if (!pop) return;
    pop.q = input.value; pop.touched = true; pop.active = CB[input.dataset.cb].mode === 'text' ? -1 : 0;
    drawPop();
  }
  function onKey(e, input) {
    const id = input.dataset.cb, cfg = CB[id];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!pop) openPop(input);
      else { const n = pop.shown.length; if (n) { pop.active = pop.active < 0 ? (e.key === 'ArrowDown' ? 0 : n - 1) : (pop.active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; drawPop(); } }
    } else if (e.key === 'Enter') {
      if (pop && pop.shown.length && pop.active >= 0) { e.preventDefault(); pick(pop.active); }
      else if (cfg.onFree && input.value.trim()) { e.preventDefault(); const t = input.value.trim(); closePop(); cfg.onFree(t); hooks.commit(id); }
    } else if (e.key === 'Escape') {
      if (pop) { e.preventDefault(); e.stopPropagation(); closePop(); }
    } else if (e.key === 'Tab') closePop();
  }
  function bindPop(root) {
    root.addEventListener('focusin', e => { const i = e.target.closest && e.target.closest('[data-cb]'); if (i && i.matches('input') && !quiet) openPop(i); });
    root.addEventListener('click', e => { const i = e.target.closest && e.target.closest('input[data-cb]'); if (i && (!pop || pop.id !== i.dataset.cb)) openPop(i); });
    root.addEventListener('focusout', e => { const i = e.target.closest && e.target.closest('input[data-cb]'); if (i) setTimeout(() => { if (pop && pop.id === i.dataset.cb && document.activeElement !== i) closePop(); }, 0); });
    root.addEventListener('keydown', e => { const i = e.target.closest && e.target.closest('input[data-cb]'); if (i) onKey(e, i); });
    root.addEventListener('input', e => { const i = e.target.closest && e.target.closest('input[data-cb]'); if (i) onInput(i); });
    layer().addEventListener('mousedown', e => { const o = e.target.closest('.pl-pop-o'); if (o) { e.preventDefault(); pick(+o.dataset.i); } else if (e.target.closest('.pl-pop')) e.preventDefault(); });
    window.addEventListener('resize', () => { if (pop) { const i = document.querySelector(`#planner [data-cb="${CSS.escape(pop.id)}"]`); if (i) placePop(i); } });
    window.addEventListener('scroll', () => { if (pop) { const i = document.querySelector(`#planner [data-cb="${CSS.escape(pop.id)}"]`); if (i) placePop(i); } }, { passive: true });
    document.addEventListener('mousedown', e => { if (pop && !e.target.closest('.pl-pop') && !e.target.closest('.pl-cb')) closePop(); });
  }
  const comboClear = id => { const cfg = CB[id]; if (cfg && cfg.onClear) cfg.onClear(); };

  // ───────────── tooltip: the first line is the value, the rest is secondary
  let tipFor = null;
  function showTip(el) {
    const text = el.getAttribute('data-tip');
    if (!text) return;
    const t = layer().querySelector('.pl-tip'), lines = text.split('\n');
    t.textContent = '';
    lines.forEach((l, i) => { const s = document.createElement('span'); s.className = i ? 'pl-tip-s' : 'pl-tip-v'; s.textContent = l; t.appendChild(s); });
    t.hidden = false;
    tipFor = el;
    const r = el.getBoundingClientRect(), tw = t.offsetWidth, th = t.offsetHeight;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - tw / 2), window.innerWidth - tw - 8);
    const top = r.top - th - 8 >= 8 ? r.top - th - 8 : r.bottom + 8;
    t.style.left = left + 'px'; t.style.top = top + 'px';
  }
  function hideTip() { if (!tipFor) return; const t = layer().querySelector('.pl-tip'); if (t) t.hidden = true; tipFor = null; }
  function bindTips(root) {
    root.addEventListener('pointerover', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el && el !== tipFor) showTip(el); else if (!el) hideTip(); });
    root.addEventListener('pointerleave', hideTip);
    root.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) showTip(el); });
    root.addEventListener('focusout', hideTip);
    root.addEventListener('pointerdown', hideTip);
    window.addEventListener('scroll', hideTip, { passive: true });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); });
  }

  M.ui = ui;
  M.kit = { setQuiet, ui, esc, slug, fold, lower, fmtDate, plural, EM, hooks, btn, iconBtn, sel, inp, area, row, rowRaw, seg, cards, toggle, badge, tag, mb, empty, head, section, tip, scroll,
    combo, closePop, bindPop, comboClear, bindTips, hideTip, popOpen: () => !!pop };
})(window);
