// Region planning workbook — state, Azure reference data, and everything derived from them. No DOM in this file.
(function (global) {
  'use strict';
  const M = global.MRP, { CHECKS, CAPABILITY_IDS, PROFILES, SHARED, HUB_SERVICES, HYBRID_PATHS } = M;
  const KEY = 'mrp-planner', OLD_KEY = 'mrp-planner-v1';
  const VERSION = 2;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const uid = p => p + Math.random().toString(36).slice(2, 8);
  const num = v => v === '' || v === null || v === undefined || !isFinite(Number(v)) ? null : Number(v);

  // ───────────── state
  const blank = () => ({ v: VERSION, meta: { name: '', owner: '', date: today() }, estate: { topology: '', managed: '', hybrid: '' },
    current: [], baseline: '', regions: [], notes: {}, sites: [], services: [], ui: { essentials: true, weighted: false } });
  const newRegion = id => ({ id, checks: {}, outcome: '', selected: false, conditions: '', owner: '', review: '', design: null });
  const newDesign = () => ({ q1: '', q2: '', q3: '', profile: '', hub: '', topology: '', managed: '', link: '', eastWest: '', ss: {}, custom: [],
    hybrid: '', hybridUse: '', hybridPath: '', hybridReason: '', hybridChange: '', owner: '', date: '', reassess: '' });

  // A workbook saved by version 1 keeps its answers where the question still exists. Manual availability, price and latency entries are dropped.
  const V1_CAPABILITY = { 'Met': 'Yes', 'Gap (mandatory)': 'No (mandatory gap)', 'Gap (accepted with a condition)': 'Gap accepted with a condition' };
  function fromV1(raw) {
    const o = { ...raw };
    o.regions = (Array.isArray(raw.regions) ? raw.regions : []).map(r => {
      const c = r.checks || {}, n = {};
      if (c['1.2']) n['1.1'] = c['1.2'];
      ['2.1', '2.2', '3.1', '3.3', '3.4'].forEach(k => { if (c[k]) n[k] = c[k]; });
      if (c['3.2']) n['3.2'] = c['3.2'] === 'Several (see notes)' ? 'Several (see note)' : c['3.2'];
      M.CAPABILITY_IDS.forEach(k => { if (c[k]) n[k] = V1_CAPABILITY[c[k]] || c[k]; });
      return { ...r, checks: n };
    });
    const notes = {};
    Object.entries(raw.notes || {}).forEach(([k, v]) => { if (k === '1.2') notes['1.1'] = v; else if (k !== '1.1') notes[k] = v; });
    o.notes = notes;
    o.sites = [];
    o.services = (Array.isArray(raw.services) ? raw.services : []).map(s => ({ id: s.id, service: s.service, product: s.product, weight: s.weight }));
    return o;
  }

  // Date defaults. The rule: a date field that is empty gets today's date (local, YYYY-MM-DD), and a date that is set is never changed.
  // It covers the assessment date, the review date of every region's outcome, and the decision date of the record of every region that is
  // selected for regional design. It runs when a workbook is created, opened, or replaced (normalize), and after every committed change (tidy),
  // so a region that was just added or just selected gets its date, and so does a field the person emptied once they leave it.
  // Typing never reaches this code, so a half-typed date is left alone, and an untouched workbook still counts as empty.
  function fillDates(s) {
    const t = today();
    if (!s.meta.date) s.meta.date = t;
    s.regions.forEach(r => {
      if (!r.review) r.review = t;
      if (r.selected && r.design && !r.design.date) r.design.date = t;
    });
  }

  // Accept anything that was saved by this page (or edited by hand) and fill what is missing.
  function normalize(input) {
    let raw = input && typeof input === 'object' ? input : {};
    if (!(raw.v >= 2)) raw = fromV1(raw);
    const s = { ...blank(), ...raw, v: VERSION };
    s.meta = { ...blank().meta, ...(s.meta || {}) };
    s.estate = { ...blank().estate, ...(s.estate || {}) };
    s.ui = { ...blank().ui, ...(s.ui || {}) };
    s.current = (Array.isArray(s.current) ? s.current : []).map(c => typeof c === 'string' ? { id: c, hub: false } : c).filter(c => c && c.id);
    s.regions = (Array.isArray(s.regions) ? s.regions : []).filter(r => r && r.id).map(r => {
      const o = { ...newRegion(r.id), ...r, checks: { ...(r.checks || {}) } };
      if (o.design) {
        o.design = { ...newDesign(), ...o.design, ss: { ...(o.design.ss || {}) }, custom: [...(o.design.custom || [])] };
        if (!HYBRID_PATHS.some(p => p.id === o.design.hybridPath)) o.design.hybridPath = '';
      }
      return o;
    });
    s.notes = { ...(s.notes || {}) };
    s.sites = (Array.isArray(s.sites) ? s.sites : []).filter(x => x && (x.kind === 'city' || x.kind === 'peering')).map(x =>
      ({ id: x.id || uid('s'), kind: x.kind, city: x.kind === 'city' && x.city ? { ...x.city } : null, peering: x.peering || '', target: num(x.target) ?? '', edits: Object.fromEntries(Object.entries(x.edits || {}).filter(([, v]) => num(v) !== null).map(([k, v]) => [k, Number(v)])) }));
    const seen = new Set();
    s.services = (Array.isArray(s.services) ? s.services : []).filter(x => x && x.service && !seen.has(x.service) && seen.add(x.service))
      .map(x => ({ id: x.id || uid('v'), service: x.service, product: x.product || '', weight: num(x.weight) ?? '' }));
    if (!s.current.some(c => c.id === s.baseline)) s.baseline = s.current[0] ? s.current[0].id : '';
    fillDates(s);
    return s;
  }

  let S = blank();
  function load() {
    try { const t = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY); if (t) S = normalize(JSON.parse(t)); } catch (e) { S = blank(); }
    return S;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage can be blocked */ } }
  function replace(raw) { S = normalize(raw); tidy(); save(); return S; }

  // ───────────── Azure reference data
  // meta.json, latency.json and latency-cities.json always exist: the build writes a placeholder ({"generated":null}) when a file is missing,
  // and the data scripts overwrite it under the same name. Nothing else is requested until a placeholder says there is real data.
  const D = { meta: null, regions: [], byId: {}, ridx: {}, services: [], svc: {}, products: null, pricing: {}, hasCatalog: false, lat: null, cities: null, citiesState: 'idle',
    // a browser doesn't let a page that was opened as a file read the data files next to it
    asFile: global.location.protocol === 'file:' };
  const bit = (hex, i) => i >= 0 && ((parseInt((hex || '')[i >> 2] || '0', 16) >> (i & 3)) & 1) === 1;
  const getJson = async url => { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); };

  function useRegions(list) {
    D.regions = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    D.byId = Object.fromEntries(list.map(r => [r.id, r]));
  }
  async function loadData() {
    if (global.MRP_SEED) useRegions(global.MRP_SEED.regions.map(r => ({ access: '', known: true, ...r })));
    try { D.meta = await getJson('data/meta.json'); } catch (e) { D.meta = null; }
    if (D.meta && D.meta.generated) {
      try {
        const c = await getJson('data/catalog.json');
        D.ridx = Object.fromEntries(c.regions.map((r, i) => [r.id, i]));
        // keep reference regions that the snapshot doesn't list, so a saved workbook never loses a name
        const seedOnly = D.regions.filter(r => !(r.id in D.ridx));
        // Retail catalog entries omit metro coordinates; retain the reference seed for the map.
        useRegions([...c.regions.map(r => ({ ...D.byId[r.id], ...r })), ...seedOnly]);
        D.services = c.services;
        D.svc = Object.fromEntries(c.services.map(s => [s.name, s]));
        D.hasCatalog = true;
      } catch (e) { D.hasCatalog = false; }
    }
    await loadLatency();
  }
  async function loadPricing(id) {
    if (!D.hasCatalog || !(id in D.ridx) || D.pricing[id]) return false;
    try {
      const p = await getJson(`data/pricing/${id}.json`);
      p.idx = Object.fromEntries(p.regions.map((r, i) => [r, i]));
      D.pricing[id] = p;
      return true;
    } catch (e) { D.pricing[id] = { services: {}, idx: {} }; return false; }
  }
  async function loadProducts() {
    if (!D.hasCatalog || D.products) return false;
    D.products = { services: {}, idx: {} };
    try {
      const p = await getJson('data/products.json');
      p.idx = Object.fromEntries(p.regions.map((r, i) => [r, i]));
      D.products = p;
      return true;
    } catch (e) { return false; }
  }
  async function loadLatency() {
    D.lat = null;
    try {
      const j = await getJson('data/latency.json');
      if (!j || !j.generated || !Array.isArray(j.regions) || !Array.isArray(j.peering)) return false;
      D.lat = { ...j, ridx: Object.fromEntries(j.regions.map((r, i) => [r, i])), pidx: Object.fromEntries(j.peering.map((p, i) => [p.name, i])) };
      return true;
    } catch (e) { return false; }
  }
  // The city list is large, so it is requested when the Latency tab first needs it (or a saved city location needs its estimates).
  async function loadCities() {
    if (!D.lat || D.citiesState !== 'idle') return false;
    D.citiesState = 'loading';
    try {
      const j = await getJson('data/latency-cities.json');
      if (!j || !Array.isArray(j.cities) || !Array.isArray(j.cp)) throw new Error('empty');
      const key = c => `${c.n}|${c.cc}|${c.lat}|${c.lon}`;
      D.cities = { ...j, byKey: new Map(j.cities.map((c, i) => [key(c), i])), pidx: Object.fromEntries((j.peering || []).map((p, i) => [p, i])), key };
      D.citiesState = 'ready';
      return true;
    } catch (e) { D.cities = null; D.citiesState = 'none'; return false; }
  }

  const info = id => D.byId[id] || { id, name: id, geo: '', group: 'Other', zones: null, pair: null, access: '', known: false };
  const rname = id => info(id).name;
  const reg = id => S.regions.find(r => r.id === id);
  // columns of the evidence tables: current regions first, then the regions being qualified
  const cols = () => [...S.current.map(c => ({ id: c.id, current: true })), ...S.regions.map(r => ({ id: r.id, current: false }))];

  // ───────────── step 2: outcome
  function suggest(r) {
    const c = r.checks, cap = CAPABILITY_IDS;
    if (c['1.1'] === 'No') return { o: 'No deeper assessment', why: 'Check 1: Azure presence in this region isn’t needed.' };
    if (c['2.1'] === 'No (mandatory gap)' || c['2.2'] === 'No (mandatory gap)') return { o: 'Excluded', why: 'Check 2: a mandatory data, compliance, or policy requirement can’t be met.' };
    if (cap.some(k => c[k] === 'No (mandatory gap)')) return { o: 'Excluded', why: 'Check 4: a mandatory capability gap.' };
    if (!c['1.1'] || c['1.1'] === 'To confirm') return { o: 'Candidate', why: 'Check 1: the need for Azure presence isn’t confirmed yet.' };
    if (['2.1', '2.2'].some(k => !c[k] || c[k] === 'To validate')) return { o: 'Candidate', why: 'Check 2: data and compliance still need validation.' };
    if (!c['3.1'] || c['3.1'] === 'Not known') return { o: 'Candidate', why: 'Check 3: workload requirements aren’t known yet.' };
    const open = cap.filter(k => !c[k]);
    if (open.length) return { o: 'Candidate', why: `Check 4: ${open.length} of ${cap.length} questions not answered yet.` };
    const cond = cap.filter(k => c[k] === 'To validate' || c[k] === 'Gap accepted with a condition');
    if (cond.length) return { o: 'Conditional', why: `Check 4: ${cond.join(', ')} ${cond.length > 1 ? 'are' : 'is'} open. Record the conditions.` };
    return { o: 'Qualified', why: 'All four checks are met as of the assessment date.' };
  }
  const outcome = r => r.outcome || suggest(r).o;
  const selectable = r => ['Qualified', 'Conditional'].includes(outcome(r));
  const selected = () => S.regions.filter(r => r.selected && selectable(r));

  // The answer-by-answer state of one check in one region: success, warning, error, or none.
  function checkState(ch, r) {
    const vals = ch.rows.map(row => r.checks[row.id] || '');
    if (!vals.some(Boolean)) return 'none';
    if (ch.rows.some((row, i) => !row.neutral && TONE_OF(vals[i]) === 'bad')) return 'error';
    if (vals.some(v => !v) || ch.rows.some((row, i) => !row.neutral && TONE_OF(vals[i]) === 'warn')) return 'warning';
    return 'success';
  }
  const TONE_OF = v => M.TONE[v] || '';

  // Keep the state consistent after any change.
  function tidy() {
    if (!S.current.some(c => c.id === S.baseline)) S.baseline = S.current[0] ? S.current[0].id : '';
    S.regions.forEach(r => {
      if (r.selected && !selectable(r)) r.selected = false;
      if (r.selected) {
        const d = design(r), e = effective(r);
        // a path that the profile, topology or gateway placement no longer offers is cleared
        if (d.hybridPath && e.profile && !e.pathOptions.includes(d.hybridPath)) d.hybridPath = '';
      }
    });
    fillDates(S);
  }

  // ───────────── services and pricing (read-only results of the snapshot)
  const named = () => S.services.filter(s => s.service);
  // 'yes', 'no', 'global', or 'none' when the snapshot can't say
  function availability(s, rid) {
    const svc = D.svc[s.service], i = D.ridx[rid];
    if (!D.hasCatalog || !svc || i === undefined) return 'none';
    const prods = s.product && D.products && D.products.services[s.service];
    if (prods && typeof prods[s.product] === 'string') return bit(prods[s.product], D.products.idx[rid] ?? -1) ? 'yes' : 'no';
    if (bit(svc.r, i)) return 'yes';
    return /^0*$/.test(svc.r) && svc.global ? 'global' : 'no';
  }
  function availSummary(rid) {
    const rows = named(), st = rows.map(s => availability(s, rid));
    return { total: rows.length, ok: st.filter(x => x === 'yes' || x === 'global').length, none: st.filter(x => x === 'none').length,
      missing: rows.filter((s, i) => st[i] === 'no').map(s => s.service) };
  }

  function priceRows() { return named(); }
  // { p: percent difference of rid against the baseline, n: meters compared } or null
  function priceDiff(service, rid) {
    const p = D.pricing[S.baseline], row = p && p.services[service], i = p && p.idx[rid];
    if (!row || i === undefined || row.p[i] === null || row.p[i] === undefined) return null;
    return { p: row.p[i], n: row.n[i] };
  }
  function priceSummary(rid) {
    const rows = priceRows().map(s => { const d = priceDiff(s.service, rid); return { p: d ? d.p : null, w: num(s.weight) || 0 }; }).filter(x => x.p !== null && isFinite(x.p));
    if (!rows.length) return { avg: null, weighted: null, value: null, n: 0 };
    const wsum = rows.reduce((t, x) => t + x.w, 0);
    const avg = rows.reduce((t, x) => t + x.p, 0) / rows.length;
    const weighted = wsum ? rows.reduce((t, x) => t + x.p * x.w, 0) / wsum : null;
    return { avg, weighted, value: S.ui.weighted ? weighted : avg, n: rows.length };
  }
  // The tone of a price difference, shared by the bars and tiles: 'c1'..'c4' cheaper, 'd1'..'d4' dearer by under 2, 2 to under 5, 5 to under 10, and 10 percent or more,
  // 'z' for no difference and 'n' when there is nothing to compare. It works on the figure as printed (one decimal), so "2.0%" never takes the tone of "under 2%".
  function priceTone(v) {
    if (v === null || v === undefined || !isFinite(v)) return 'n';
    const a = Math.abs(v);
    if (a <= 0.05) return 'z';
    const r = Math.round(a * 10) / 10;
    return (v < 0 ? 'c' : 'd') + (r < 2 ? 1 : r < 5 ? 2 : r < 10 ? 3 : 4);
  }
  const fmtPct = v => v === null || v === undefined || !isFinite(v) ? '' : (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + Math.abs(v).toFixed(1) + '%';

  // ───────────── latency
  const rad = d => d * Math.PI / 180;
  const km = (a, b) => {
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  const estimate = distance => Math.max(1, Math.round(D.lat.model.a + D.lat.model.b * distance));

  // The scale every latency bar and the legend share. The color stops are in milliseconds (green up to 30, yellow at 60, red at 120,
  // dark red from 200) and the length is the square root of the value, so a 10 ms European hop is still visible while a 250 ms route
  // fits. Values past `max` fill the bar. The gradient in planner.css (.pl-hbar) uses the same square-root positions.
  const latScale = { max: 250, marks: [0, 30, 60, 120, 200] };
  const latPos = ms => Math.sqrt(Math.min(Math.max(ms, 0), latScale.max) / latScale.max);

  const SRC_TEXT = {
    m: d => `Microsoft published median${d.lat && d.lat.dataset ? ', dataset of ' + d.lat.dataset : ''}`,
    l: () => 'Derived: short hop to the local Azure region plus the published median',
    d: () => 'Estimated from distance',
  };
  const srcText = code => (SRC_TEXT[code] || SRC_TEXT.d)(D);

  // From one region to another: { ms, src: 'm' | 'd' } or null.
  function regionLatency(fromId, toId) {
    const L = D.lat;
    if (!L || fromId === toId) return null;
    const i = L.ridx[fromId], j = L.ridx[toId];
    if (i === undefined || j === undefined) return null;
    const ms = L.rr[i] && L.rr[i][j];
    if (ms === undefined || ms === null) return null;
    return { ms, src: (L.rrSrc[i] || '')[j] === 'm' ? 'm' : 'd' };
  }
  // From a peering location to a region: { ms, src: 'l' | 'd' } or null.
  function peeringLatency(name, rid) {
    const L = D.lat;
    if (!L) return null;
    const p = L.pidx[name], j = L.ridx[rid];
    if (p === undefined || j === undefined || !L.pr[p]) return null;
    return { ms: L.pr[p][j], src: (L.prSrc[p] || '')[j] === 'l' ? 'l' : 'd' };
  }
  // From a city to a peering location (always an estimate). The file has the value for the cities it lists; a saved city falls back to the model.
  function cityLatency(city, name) {
    const L = D.lat, p = L && L.pidx[name];
    if (p === undefined || p === null || !city || !isFinite(city.lat) || !isFinite(city.lon)) return null;
    const C = D.cities;
    if (C) {
      const ci = C.byKey.get(C.key(city)), pi = C.pidx[name];
      if (ci !== undefined && pi !== undefined && C.cp[ci] && C.cp[ci][pi] !== undefined) return { ms: C.cp[ci][pi], src: 'd' };
    }
    return { ms: estimate(km(city, L.peering[p])), src: 'd' };
  }
  function peeringChoices(city) {
    if (!D.lat || !city) return [];
    return D.lat.peering.map(p => ({ name: p.name, ms: (cityLatency(city, p.name) || { ms: Infinity }).ms })).filter(x => isFinite(x.ms)).sort((a, b) => a.ms - b.ms || a.name.localeCompare(b.name));
  }
  const nearestPeering = city => { const c = peeringChoices(city); return c.length ? c[0].name : ''; };
  const sitePeering = s => s.peering || (s.kind === 'city' ? nearestPeering(s.city) : '');
  const siteName = s => s.kind === 'city' ? (s.city ? s.city.n : '') : s.peering;

  // The latency from a location to a region: the calculated value, the legs it is made of, and any value the user typed over it.
  function siteLatency(s, rid) {
    const edit = num(s.edits[rid]);
    let calc = null, legs = [];
    if (D.lat && D.lat.ridx[rid] !== undefined) {
      const pn = sitePeering(s), leg2 = pn ? peeringLatency(pn, rid) : null;
      if (leg2) {
        if (s.kind === 'peering') { legs = [{ from: pn, to: rname(rid), ...leg2 }]; calc = leg2.ms; }
        else {
          const leg1 = cityLatency(s.city, pn);
          if (leg1) { legs = [{ from: s.city.n, to: `${pn} (peering location)`, ...leg1 }, { from: pn, to: rname(rid), ...leg2 }]; calc = leg1.ms + leg2.ms; }
        }
      }
    }
    if (edit !== null) return { ms: edit, legs, edited: true, calc };
    return calc === null ? null : { ms: calc, legs, edited: false, calc };
  }
  function latencySummary(rid) {
    let within = 0, total = 0, max = null, count = 0;
    S.sites.forEach(s => {
      const l = siteLatency(s, rid), t = num(s.target);
      if (!l) return;
      count++;
      max = max === null ? l.ms : Math.max(max, l.ms);
      if (t !== null) { total++; if (l.ms <= t) within++; }
    });
    return { within, total, max, count };
  }

  // Evidence shown under the check 4 answers. tone: good, warn, bad, or ''. `tab` is the tab it comes from.
  function evidence(kind, r) {
    const i = info(r.id);
    if (kind === 'services') {
      const a = availSummary(r.id);
      if (!a.total) return { text: 'No services listed', tone: '', tab: 'services' };
      if (a.none === a.total) return { text: `${a.total} services, no data`, tone: '', tab: 'services' };
      return { text: `${a.ok} of ${a.total} services available`, tone: a.ok === a.total ? 'good' : 'warn', tab: 'services' };
    }
    if (kind === 'zones') {
      const need = r.checks['3.4'];
      const z = i.zones === true ? 'Zones: yes' : i.zones === false ? 'Zones: no' : 'Zones: verify';
      return { text: need === 'No' ? z + ' (not required)' : z, tone: i.zones === true ? 'good' : i.zones === false && need === 'Yes' ? 'bad' : i.zones === null || i.zones === undefined ? 'warn' : '' };
    }
    if (kind === 'pair') return { text: !i.known ? 'Pairing: verify' : i.pair ? `Paired with ${rname(i.pair)}` : 'Nonpaired region', tone: !i.known ? 'warn' : '' };
    if (kind === 'latency') {
      const l = latencySummary(r.id);
      if (l.max === null) return { text: S.sites.length ? 'No latency values' : 'No locations added', tone: '', tab: 'latency' };
      if (!l.total) return { text: `Up to ${l.max} ms, no targets set`, tone: '', tab: 'latency' };
      return { text: `${l.within} of ${l.total} locations within target`, tone: l.within === l.total ? 'good' : 'bad', tab: 'latency' };
    }
    if (kind === 'pricing') {
      const p = priceSummary(r.id);
      if (!p.n || p.value === null) return { text: 'No price comparison', tone: '', tab: 'pricing' };
      return { text: `${fmtPct(p.value)} vs ${rname(S.baseline)}`, tone: '', tab: 'pricing' };
    }
    if (kind === 'access') return i.access === 'restricted' ? { text: 'Access request needed', tone: 'warn' } : { text: '', tone: '' };
    return { text: '', tone: '' };
  }

  // ───────────── step 3: the regional design of one region
  const hubRegions = exceptId => {
    const cur = S.current.slice().sort((a, b) => (b.hub ? 1 : 0) - (a.hub ? 1 : 0)).map(c => c.id);
    return [...cur, ...selected().map(r => r.id).filter(id => id !== exceptId && !cur.includes(id))];
  };
  function design(r) {
    if (!r.design) {
      r.design = newDesign();
      const need = r.checks['3.3'];
      if (need === 'Yes' || need === 'No') r.design.q1 = need;
    }
    return r.design;
  }
  function suggestProfile(d) {
    if (d.q1 === 'No') return 'Disconnected Spokes';
    if (d.q1 !== 'Yes') return '';
    if (d.q2 === 'Yes') return 'Remote Hub Connected';
    if (d.q2 !== 'No') return '';
    return d.q3 === 'No' ? 'Minimal Regional Hub' : d.q3 === 'Yes' ? 'Full Regional Hub' : '';
  }
  // The design with every default applied: what the page shows and what the record and the export use.
  function effective(r) {
    const d = design(r), suggested = suggestProfile(d), profile = d.profile || suggested, pi = PROFILES.findIndex(p => p.id === profile);
    const hubs = hubRegions(r.id);
    const estateTopo = M.O.topology.includes(S.estate.topology) ? S.estate.topology : '';
    const none = profile === 'Disconnected Spokes';
    const defHub = hubs.includes(d.hub) ? d.hub : hubs[0] || '';
    const e = { profile, pi, suggested, none, hubs, hub: none ? '' : defHub,
      topology: none ? '' : (d.topology || estateTopo), managed: d.managed || S.estate.managed || '' };
    const links = M.linkOptions(profile, e.topology), ew = M.eastWestOptions(profile);
    e.linkOptions = links; e.eastWestOptions = ew;
    e.link = links.includes(d.link) ? d.link : links[0] || '';
    e.eastWest = ew.includes(d.eastWest) ? d.eastWest : ew[0] || '';
    e.ss = SHARED.map(s => {
      const x = d.ss[s.id] || {}, def = pi >= 0 ? s.d[pi] : '';
      const p = x.p || def;
      return { ...s, p, isDefault: !x.p && !!def, def, from: p === 'Remote' ? (hubs.includes(x.from) ? x.from : defHub) : '', note: x.note || '' };
    }).concat(d.custom.map(c => ({ id: c.id, name: c.name, short: c.name, icon: 'cloud', custom: true, p: c.p || '', def: '', isDefault: false, from: c.p === 'Remote' ? (hubs.includes(c.from) ? c.from : defHub) : '', note: c.note || '' })));
    e.hybrid = none ? 'Not required' : d.hybrid;
    const gw = e.ss.find(s => s.id === 'gateway');
    e.pathOptions = none ? [] : M.hybridPathOptions(profile, e.topology, gw ? gw.p : '');
    e.hybridPath = e.pathOptions.includes(d.hybridPath) ? d.hybridPath : '';
    e.reassess = d.reassess || (pi >= 0 ? PROFILES[pi].reassess : '');
    e.date = d.date || S.meta.date;
    // things that don't add up, in the words of the profile selection article
    const hubLocal = e.ss.filter(s => HUB_SERVICES.includes(s.id) && s.p === 'Local'), hubRemote = e.ss.filter(s => HUB_SERVICES.includes(s.id) && s.p === 'Remote');
    e.hints = [];
    if (profile === 'Remote Hub Connected' && hubLocal.length) e.hints.push('A hub service is placed locally. With a hub in the region, the profile is a Minimal Regional Hub.');
    if (profile === 'Full Regional Hub' && hubRemote.length) e.hints.push('A hub service is still remote. A region that depends on a geographic hub for something is a Minimal Regional Hub.');
    if (none && e.ss.some(s => s.p === 'Remote' && s.id !== 'logs')) e.hints.push('Disconnected Spokes have no private path to another region. Check the services placed as remote.');
    if (profile === 'Minimal Regional Hub' && e.ss.filter(s => HUB_SERVICES.includes(s.id) && s.p).length === 4 && !hubLocal.length) e.hints.push('No hub service is local. Without a hub in the region, the profile is Remote Hub Connected.');
    if (e.hybrid === 'Not required' && gw && gw.p === 'Local') e.hints.push('A local gateway is planned, but hybrid connectivity is set to not required.');
    const missing = [];
    if (!profile) missing.push('connectivity profile');
    const unplaced = e.ss.filter(s => !s.p || (s.custom && !s.name)).length;
    if (profile && unplaced) missing.push(`${unplaced} shared service${unplaced > 1 ? 's' : ''} to place`);
    if (profile && !e.hybrid) missing.push('hybrid connectivity');
    if (e.hybrid === 'Reuse' || e.hybrid === 'Change') {
      if (e.pathOptions.length && !e.hybridPath) missing.push('how the region reaches on-premises locations');
      if (e.hybrid === 'Change' && !d.hybridChange) missing.push('the hybrid connectivity change');
    }
    e.missing = missing; e.complete = !missing.length;
    return e;
  }

  // "a, b, and c"; with semicolons when an item has a comma of its own
  const list = a => a.some(x => x.includes(',')) ? a.join('; ') : a.length < 3 ? a.join(' and ') : a.slice(0, -1).join(', ') + ', and ' + a[a.length - 1];
  function hybridText(r, e) {
    const d = design(r);
    if (!e.hybrid) return '';
    if (e.hybrid === 'Not required') return 'Not required';
    const path = HYBRID_PATHS.find(p => p.id === e.hybridPath);
    let say = path ? path.say : '';
    if (say && e.hub) say = say.replace('the geographic hub', rname(e.hub)).replace('another region', rname(e.hub));
    if (e.hybrid === 'Reuse') return `Reuse the existing ${d.hybridUse || 'connectivity'}${say ? ', ' + say : ''}`;
    return `Change: ${d.hybridChange || 'to be defined'}${d.hybridReason ? ` (${d.hybridReason.charAt(0).toLowerCase() + d.hybridReason.slice(1)})` : ''}${say ? ', ' + say : ''}`;
  }
  // The regional design record of a selected region, as label and text pairs.
  function record(r) {
    const e = effective(r), d = design(r), out = [];
    const at = p => e.ss.filter(s => s.p === p && (s.short || s.name));
    out.push(['Selected region', `${rname(r.id)} (${outcome(r)} as of ${S.meta.date})`]);
    out.push(['Connectivity profile', e.profile || 'Not selected yet']);
    if (!e.none && e.profile) {
      out.push(['Hub implementation', [e.profile === 'Remote Hub Connected' ? 'No local hub' : e.topology === 'Azure Virtual WAN' ? 'Virtual hub in the region (Azure Virtual WAN)' : e.topology ? 'Hub virtual network in the region' : 'Hub in the region',
        e.managed ? 'managed with ' + e.managed : ''].filter(Boolean).join(', ')]);
      out.push(['Regional connectivity', [e.hub ? `${e.profile === 'Full Regional Hub' ? 'Connected to' : 'Depends on'} ${rname(e.hub)}` : '', e.link, e.eastWest ? 'spoke to spoke: ' + e.eastWest.charAt(0).toLowerCase() + e.eastWest.slice(1) : ''].filter(Boolean).join('; ')]);
    } else if (e.none && e.eastWest) out.push(['Regional connectivity', 'No hub. Spoke to spoke: ' + e.eastWest.charAt(0).toLowerCase() + e.eastWest.slice(1)]);
    out.push(['Hybrid connectivity', hybridText(r, e) || 'Not decided yet']);
    out.push(['Local shared services', list(at('Local').map(s => s.short)) || 'None']);
    const byHub = {};
    at('Remote').forEach(s => (byHub[s.from || ''] = byHub[s.from || ''] || []).push(s.short));
    Object.entries(byHub).forEach(([hub, names]) => out.push([hub ? `Remote shared services (from ${rname(hub)})` : 'Remote shared services', list(names)]));
    if (at('Global').length) out.push(['Global services', list(at('Global').map(s => s.short))]);
    const unplaced = e.ss.filter(s => !s.p);
    if (e.profile && unplaced.length) out.push(['Still to place', list(unplaced.map(s => s.short || s.name || 'Unnamed service'))]);
    out.push(['Open conditions', r.conditions || 'None']);
    if (d.owner) out.push(['Owner', d.owner]);
    out.push(['Decision date', e.date]);
    out.push(['Reassess when', e.reassess || '']);
    return out;
  }
  function recordText() {
    const head = [S.meta.name || 'Region planning workbook', `Date: ${S.meta.date}` + (S.meta.owner ? ` · Owner: ${S.meta.owner}` : ''), ''];
    const body = selected().map(r => record(r).filter(x => x[1]).map(([k, v]) => `${k}: ${v}`).join('\n'));
    return head.concat(body.join('\n\n')).join('\n');
  }

  // ───────────── progress of each tab, for the step indicators
  function progress() {
    const picked = selected(), rs = S.regions;
    const checkAnswers = rs.some(r => Object.values(r.checks).some(Boolean));
    return {
      scope: S.current.length && rs.length ? 'done' : S.current.length || rs.length || S.meta.name ? 'half' : 'none',
      checks: rs.length && picked.length && rs.every(r => outcome(r) !== 'Candidate') ? 'done' : checkAnswers ? 'half' : 'none',
      services: named().length ? 'done' : 'none',
      pricing: S.baseline && named().length && D.hasCatalog ? 'done' : S.baseline || named().length ? 'half' : 'none',
      latency: S.sites.length ? 'done' : 'none',
      design: !picked.length ? 'lock' : picked.every(r => effective(r).complete) ? 'done' : 'half',
      review: picked.length ? 'none' : 'lock',
    };
  }

  M.core = { get S() { return S; }, D, VERSION, load, save, replace, blank, normalize, tidy, newRegion, uid, today, loadData, loadPricing, loadProducts, loadCities, bit,
    info, rname, reg, cols, suggest, outcome, selectable, selected, checkState, named, availability, availSummary, priceRows, priceDiff, priceSummary,
    regionLatency, peeringLatency, cityLatency, peeringChoices, nearestPeering, sitePeering, siteName, siteLatency, latencySummary, srcText, km, estimate, latScale, latPos,
    num, fmtPct, priceTone, evidence, hubRegions, design, suggestProfile, effective, hybridText, record, recordText, list, progress };
})(window);
