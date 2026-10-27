// Multi-region planner — state, Azure reference data, and everything derived from them. No DOM in this file.
(function (global) {
  'use strict';
  const M = global.MRP, { CHECKS, CAPABILITY_IDS, PROFILES, SHARED, HUB_SERVICES, HYBRID_PATHS } = M;
  const KEY = 'mrp-planner', OLD_KEY = 'mrp-planner-v1';
  const VERSION = 3;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const uid = p => p + Math.random().toString(36).slice(2, 8);
  const num = v => v === '' || v === null || v === undefined || !isFinite(Number(v)) ? null : Number(v);

  // ───────────── state
  const blank = () => ({ v: VERSION, meta: { name: '', owner: '', date: today() }, estate: { topology: '', managed: '', hybrid: '' },
    current: [], baseline: '', regions: [], notes: {}, sites: [], services: [], ui: { details: false, weighted: false, showOut: false } });
  const newRegion = id => ({ id, checks: {}, outcome: '', selected: false, conditions: '', owner: '', review: '', design: null });
  const newDesign = () => ({ q1: '', q2: '', q3: '', profile: '', hub: '', hubConnections: null, topology: '', managed: '', link: '', eastWest: '', ss: {}, custom: [],
    hybrid: '', hybridUse: '', hybridPath: '', hybridReason: '', hybridChange: '', owner: '', date: '', reassess: '' });

  // A workbook saved by version 1 keeps its answers where the question still exists. Manual availability, price and latency entries are dropped.
  const V1_CAPABILITY = { 'Met': 'Yes', 'Gap (mandatory)': 'No (mandatory gap)', 'Gap (accepted with a condition)': 'Gap accepted with a condition' };
  const LEGACY_PROFILES = {
    'No Hub': 'No platform',
    'Remote Hub': 'Remote platform',
    'Minimal Hub': 'Minimal platform',
    'Full Hub': 'Full platform',
    'Disconnected Spokes': 'No platform',
    'Remote Hub Connected': 'Remote platform',
    'Minimal Regional Hub': 'Minimal platform',
    'Selective Hub': 'Minimal platform',
    'Full Regional Hub': 'Full platform',
  };
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
        if (Object.hasOwn(LEGACY_PROFILES, o.design.profile)) o.design.profile = LEGACY_PROFILES[o.design.profile];
        ['link', 'eastWest', 'hybridPath'].forEach(key => {
          if (typeof o.design[key] === 'string') o.design[key] = o.design[key]
            .replace(/\bthe remote hub\b/g, 'the Full-Platform region')
            .replace(/\bgeographic[ -]hubs?\b/gi, match => /s$/i.test(match) ? 'Full-Platform regions' : 'Full-Platform region');
        });
        o.design.hubConnections = Array.isArray(o.design.hubConnections) ? [...new Set(o.design.hubConnections.filter(id => typeof id === 'string' && id))] : null;
        if (!HYBRID_PATHS.some(p => p.id === o.design.hybridPath)) o.design.hybridPath = '';
      }
      return o;
    });
    s.notes = { ...(s.notes || {}) };
    s.sites = (Array.isArray(s.sites) ? s.sites : []).filter(x => x && (x.kind === 'city' || x.kind === 'peering')).map(x =>
      ({ id: x.id || uid('s'), kind: x.kind, city: x.kind === 'city' && x.city ? { ...x.city } : null, peering: x.peering || '', target: num(x.target) ?? '', edits: Object.fromEntries(Object.entries(x.edits || {}).filter(([, v]) => num(v) !== null).map(([k, v]) => [k, Number(v)])) }));
    const seen = new Set();
    s.services = (Array.isArray(s.services) ? s.services : []).filter(x => x && x.service && !seen.has(x.service) && seen.add(x.service))
      .map(x => ({ id: x.id || uid('v'), service: x.service, product: x.product || '', sku: x.sku || '', weight: num(x.weight) ?? '',
        source: x.source || (raw.v >= 3 ? 'availability' : 'retail') }));
    migrateServices(s);
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
  // The build supplies placeholders for missing snapshots. Only latest data is loaded; archives are for maintainer use.
  const D = { meta: null, regions: [], byId: {}, ridx: {}, services: [], svc: {}, pricing: {}, hasCatalog: false,
    availabilityMeta: null, availabilityRegions: {}, hasAvailability: false, availabilityError: '', priceMapping: null, mappingError: '',
    lat: null, cities: null, citiesState: 'idle',
    // a browser doesn't let a page that was opened as a file read the data files next to it
    asFile: global.location.protocol === 'file:' };
  const bit = (hex, i) => i >= 0 && ((parseInt((hex || '')[i >> 2] || '0', 16) >> (i & 3)) & 1) === 1;
  const getJson = async url => { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); };

  // Restricted regions (access limited to specific customer scenarios) are not offered, and a region paired only with one of them counts as nonpaired.
  function useRegions(all) {
    const hidden = new Set([...(D.hidden || []), ...all.filter(r => r.access === 'restricted').map(r => r.id)]);
    const list = all.filter(r => !hidden.has(r.id)).map(r => ({ ...r, pair: hidden.has(r.pair) ? null : r.pair,
      name: r.preview && !/\(Preview\)$/.test(r.name) ? r.name + ' (Preview)' : r.name }));
    D.hidden = new Set([...(D.hidden || []), ...hidden]);
    D.regions = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    D.byId = Object.fromEntries(list.map(r => [r.id, r]));
  }
  async function loadData() {
    if (global.MRP_SEED) useRegions(global.MRP_SEED.regions.map(r => ({ access: '', known: true, ...r })));
    try { D.meta = await getJson('data/retail-latest/meta.json'); } catch (e) { D.meta = null; }
    if (D.meta && D.meta.generated) {
      try {
        const c = await getJson('data/retail-latest/catalog.json');
        D.ridx = Object.fromEntries(c.regions.map((r, i) => [r.id, i]));
        // keep reference regions that the snapshot doesn't list, so a saved workbook never loses a name
        const seedOnly = D.regions.filter(r => !(r.id in D.ridx));
        // Retail catalog entries omit metro coordinates; retain the reference seed for the map.
        useRegions([...c.regions.map(r => ({ ...D.byId[r.id], ...r })), ...seedOnly]);
        D.hasCatalog = true;
      } catch (e) { D.hasCatalog = false; }
    }
    await Promise.all([
      (async () => {
        try {
          const c = await getJson('data/availability-catalog-latest.json');
          if (!c.generated || !Array.isArray(c.regions) || !Array.isArray(c.services)) throw new Error('Invalid availability catalog');
          D.availabilityMeta = c;
          D.availabilityRegions = Object.fromEntries(c.regions.map(r => [r.id, r]));
          D.services = c.services;
          D.svc = Object.fromEntries(c.services.map(s => [s.name, s]));
          useRegions([...D.regions.filter(r => !D.availabilityRegions[r.id]),
            ...c.regions.map(r => ({ ...D.byId[r.id], ...r }))]);
          D.hasAvailability = true;
        } catch (e) {
          D.availabilityError = 'The service availability catalog could not be loaded. Import the availability CSV and publish docs/data/availability-catalog-latest.json.';
          console.error(D.availabilityError, e);
        }
      })(),
      (async () => {
        try { D.priceMapping = await getJson('data/service-pricing-map.json'); }
        catch (e) {
          D.mappingError = 'The service-to-pricing mapping could not be loaded. Pricing cannot match the selected availability services.';
          console.error(D.mappingError, e);
        }
      })(),
    ]);
    migrateServices(S);
    save();
    if (D.hidden && D.hidden.size) {
      S.current = S.current.filter(c => !D.hidden.has(c.id));
      S.regions = S.regions.filter(r => !D.hidden.has(r.id));
      if (D.hidden.has(S.baseline)) S.baseline = S.current[0] ? S.current[0].id : '';
    }
    await loadLatency();
  }
  async function loadPricing(id) {
    if (!D.hasCatalog || !(id in D.ridx) || D.pricing[id]) return false;
    try {
      const p = await getJson(`data/retail-latest/pricing/${id}.json`);
      p.idx = Object.fromEntries(p.regions.map((r, i) => [r, i]));
      D.pricing[id] = p;
      return true;
    } catch (e) { D.pricing[id] = { services: {}, idx: {} }; return false; }
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
  const cols = () => [...S.current.map(c => ({ id: c.id, current: true })), ...active().map(r => ({ id: r.id, current: false }))];

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
  // A region ruled out by checks 1 to 3 (or set by hand to Excluded or No deeper assessment) is folded in the evidence tabs and in check 4.
  // A region excluded for a check 4 gap stays visible, because the evidence is the reason.
  function ruledOut(r) {
    const o = outcome(r);
    if (o !== 'Excluded' && o !== 'No deeper assessment') return false;
    return !!r.outcome || !/^Check 4/.test(suggest(r).why);
  }
  const active = () => S.ui.showOut ? S.regions : S.regions.filter(r => !ruledOut(r));
  const folded = () => S.ui.showOut ? [] : S.regions.filter(ruledOut);

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

  function migrateServices(state) {
    if (!D.hasAvailability || !D.priceMapping) return;
    state.services.forEach(s => {
      if (s.source !== 'retail') return;
      const matches = Object.keys(D.priceMapping).filter(name => D.priceMapping[name].service === s.service);
      if (!D.svc[s.service] && matches.length === 1) s.service = matches[0];
      // Ambiguous names and obsolete product choices stay visible for the user to correct.
      s.source = 'availability';
    });
  }

  // ───────────── services and pricing (independent read-only catalogs)
  const named = () => S.services.filter(s => s.service);
  function serviceSelection(s) {
    let entry = D.svc[s.service];
    if (s.product) entry = entry && entry.products[s.product];
    if (s.sku) entry = s.product && entry && entry.skus[s.sku];
    return entry && !entry.generic ? entry : null;
  }
  function skuOptions(s) {
    const service = D.svc[s.service], product = service && service.products[s.product];
    return Object.keys(product && product.skus || {}).filter(name => !product.skus[name].generic).sort();
  }
  function availabilityDetails(s, rid) {
    const selection = serviceSelection(s);
    if (!D.hasAvailability || !selection || !D.availabilityRegions[rid]) return { state: 'none', zoneCounts: [] };
    const entry = selection.regions[rid];
    return { state: entry && entry.available ? 'yes' : 'no', zoneCounts: entry && entry.available ? entry.zoneCounts : [] };
  }
  const availability = (s, rid) => availabilityDetails(s, rid).state;
  const zoneText = details => details.zoneCounts.length ? details.zoneCounts.join('/') + (details.zoneCounts.length === 1 && details.zoneCounts[0] === 1 ? ' AZ' : ' AZs') : '';
  function availSummary(rid) {
    const rows = named(), st = rows.map(s => availability(s, rid));
    return { total: rows.length, ok: st.filter(x => x === 'yes' || x === 'global').length, none: st.filter(x => x === 'none').length,
      missing: rows.filter((s, i) => st[i] === 'no').map(s => s.service) };
  }

  function priceRows() {
    return named().map(s => {
      const mapping = D.priceMapping && D.priceMapping[s.service];
      return { ...s, service: mapping && mapping.service || s.service, availabilityService: s.service,
        retailService: mapping && mapping.service || null,
        pricingNote: mapping ? mapping.note || '' : 'No service-pricing mapping' };
    });
  }
  // { p: percent difference of rid against the baseline, n: meters compared } or null
  function priceDiff(service, rid) {
    const p = D.pricing[S.baseline], row = p && p.services[service], i = p && p.idx[rid];
    if (!row || i === undefined || row.p[i] === null || row.p[i] === undefined) return null;
    return { p: row.p[i], n: row.n[i] };
  }
  function priceSummary(rid) {
    const rows = priceRows().map(s => { const d = priceDiff(s.retailService, rid); return { p: d ? d.p : null, w: num(s.weight) || 0 }; }).filter(x => x.p !== null && isFinite(x.p));
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

  // The location with the least margin to its target: { name, ms, target, over } or null.
  function latencyWorst(rid) {
    let w = null;
    S.sites.forEach(s => {
      const l = siteLatency(s, rid), t = num(s.target);
      if (!l || t === null) return;
      if (!w || l.ms - t > w.ms - w.target) w = { name: siteName(s), ms: l.ms, target: t };
    });
    if (w) w.over = w.ms > w.target;
    return w;
  }
  // The answer that the evidence supports for a check 4 question, or ''. Only where the workbook has the data:
  // services, zones against check 3.4, and latency against the targets. Over-target latency is "To validate", because
  // the values that involve a location are estimates. Judgment calls (pairing, price, access, quota) get no suggestion.
  function suggestAnswer(rowId, r) {
    if (rowId === '4.1') {
      const a = availSummary(r.id);
      if (!a.total || a.none) return '';
      return a.ok === a.total ? 'Yes' : 'To validate';
    }
    if (rowId === '4.2') {
      const z = info(r.id).zones, need = r.checks['3.4'];
      if (z === true) return 'Yes';
      if (z === false && need === 'No') return 'Not applicable';
      if (z === false && need === 'Yes') return 'No (mandatory gap)';
      return '';
    }
    if (rowId === '4.4') {
      const l = latencySummary(r.id);
      if (!l.total) return '';
      return l.within === l.total ? 'Yes' : 'To validate';
    }
    return '';
  }
  // Open check 4 questions that the evidence can answer: [{ r, id, v }]
  const suggestions = rs => rs.flatMap(r => CAPABILITY_IDS.filter(id => !r.checks[id]).map(id => ({ r, id, v: suggestAnswer(id, r) })).filter(x => x.v));

  // ───────────── step 3: the regional design of one region
  const hubRegions = exceptId => {
    const cur = S.current.filter(c => c.id !== exceptId).sort((a, b) => (b.hub ? 1 : 0) - (a.hub ? 1 : 0)).map(c => c.id);
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
    if (d.q1 === 'No') return 'No platform';
    if (d.q1 !== 'Yes') return '';
    if (d.q2 === 'Yes') return 'Remote platform';
    if (d.q2 !== 'No') return '';
    return d.q3 === 'No' ? 'Minimal platform' : d.q3 === 'Yes' ? 'Full platform' : '';
  }
  // The design with every default applied: what the page shows and what the record and the export use.
  function effective(r) {
    const d = design(r), suggested = suggestProfile(d), profile = d.profile || suggested, pi = PROFILES.findIndex(p => p.id === profile);
    const hubs = hubRegions(r.id);
    const estateTopo = M.O.topology.includes(S.estate.topology) ? S.estate.topology : '';
    const none = profile === 'No platform';
    const connections = Array.isArray(d.hubConnections) ? d.hubConnections.filter(id => hubs.includes(id))
      : [hubs.includes(d.hub) ? d.hub : hubs[0]].filter(Boolean);
    const hubConnections = none ? [] : [...new Set(connections)], defHub = hubConnections[0] || '';
    const e = { profile, pi, suggested, none, hubs, hubConnections, hub: defHub,
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
    if (profile === 'Remote platform' && hubLocal.length) e.hints.push('A hub service is placed locally. With a hub in the region, the profile is a Minimal platform.');
    if (profile === 'Full platform' && hubRemote.length) e.hints.push('A hub service is still remote. A region that depends on a Full-Platform region for something is a Minimal platform.');
    if (none && e.ss.some(s => s.p === 'Remote' && s.id !== 'logs')) e.hints.push('The No platform profile has no private path to another region. Check the services placed as remote.');
    if (profile === 'Minimal platform' && e.ss.filter(s => HUB_SERVICES.includes(s.id) && s.p).length === 4 && !hubLocal.length) e.hints.push('No hub service is local. Without a hub in the region, the profile is Remote platform.');
    if (e.hybrid === 'Not required' && gw && gw.p === 'Local') e.hints.push('A local gateway is planned, but hybrid connectivity is set to not required.');
    const missing = [];
    if (!profile) missing.push('Platform Services profile');
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
    const gateway = e.ss.find(s => s.id === 'gateway');
    const provider = gateway && gateway.p === 'Remote' ? gateway.from : '';
    const hubNames = provider ? rname(provider) : list(e.hubConnections.map(rname));
    if (say && hubNames) say = say.replace('the Full-Platform region', hubNames).replace('another region', hubNames);
    if (e.hybrid === 'Reuse') return `Reuse the existing ${d.hybridUse || 'connectivity'}${say ? ', ' + say : ''}`;
    return `Change: ${d.hybridChange || 'to be defined'}${d.hybridReason ? ` (${d.hybridReason.charAt(0).toLowerCase() + d.hybridReason.slice(1)})` : ''}${say ? ', ' + say : ''}`;
  }
  // The regional design record of a selected region, as label and text pairs.
  function record(r) {
    const e = effective(r), d = design(r), out = [];
    const at = p => e.ss.filter(s => s.p === p && (s.short || s.name));
    out.push(['Selected region', `${rname(r.id)} (${outcome(r)} as of ${S.meta.date})`]);
    out.push(['Platform Services profile', e.profile || 'Not selected yet']);
    if (!e.none && e.profile) {
      out.push(['Hub implementation', [e.profile === 'Remote platform' ? 'No local hub' : e.topology === 'Azure Virtual WAN' ? 'Virtual hub in the region (Azure Virtual WAN)' : e.topology ? 'Hub virtual network in the region' : 'Hub in the region',
        e.managed ? 'managed with ' + e.managed : ''].filter(Boolean).join(', ')]);
      out.push(['Hub Connections', list(e.hubConnections.map(rname)) || 'None']);
      out.push(['Regional connectivity', [e.hubConnections.length ? `${e.profile === 'Full platform' ? 'Connected to' : 'Depends on'} ${list(e.hubConnections.map(rname))}` : '', e.link, e.eastWest ? 'spoke to spoke: ' + e.eastWest.charAt(0).toLowerCase() + e.eastWest.slice(1) : ''].filter(Boolean).join('; ')]);
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
    const head = [S.meta.name || 'Multi-region planner', `Date: ${S.meta.date}` + (S.meta.owner ? ` · Owner: ${S.meta.owner}` : ''), ''];
    const body = selected().map(r => record(r).filter(x => x[1]).map(([k, v]) => `${k}: ${v}`).join('\n'));
    return head.concat(body.join('\n\n')).join('\n');
  }

  // ───────────── progress of each tab, for the step indicators
  // Checks 1 to 3 are complete for a region when every question is answered, or when check 1 or 2 already rules it out.
  const FIT_IDS = CHECKS.slice(0, 3).flatMap(ch => ch.rows.map(row => row.id));
  const fitDone = r => ruledOut(r) || FIT_IDS.every(id => r.checks[id]);
  function progress() {
    const picked = selected(), rs = S.regions, live = rs.filter(r => !ruledOut(r));
    const fitAny = rs.some(r => FIT_IDS.some(id => r.checks[id]));
    const capAny = rs.some(r => CAPABILITY_IDS.some(id => r.checks[id]) || r.outcome);
    const decided = live.filter(r => outcome(r) !== 'Candidate').length;
    const allDone = picked.length && picked.every(r => effective(r).complete);
    return {
      scope: S.current.length && rs.length ? 'done' : S.current.length || rs.length || S.meta.name ? 'half' : 'none',
      checks: rs.length && rs.every(fitDone) ? 'done' : fitAny ? 'half' : 'none',
      services: named().length ? 'done' : 'none',
      pricing: S.baseline && named().length && D.hasCatalog ? 'done' : S.baseline || named().length ? 'half' : 'none',
      latency: S.sites.length ? 'done' : 'none',
      capability: live.length && picked.length && decided === live.length ? 'done' : capAny || picked.length ? 'half' : 'none',
      design: !picked.length ? 'lock' : allDone ? 'done' : 'half',
      review: !picked.length ? 'lock' : allDone ? 'done' : 'half',
      // the counts shown beside a tab that is in progress
      counts: { checks: [rs.filter(fitDone).length, rs.length, 'answered'], capability: [decided, live.length, 'decided'] },
    };
  }

  M.core = { get S() { return S; }, D, VERSION, load, save, replace, blank, normalize, tidy, newRegion, uid, today, loadData, loadPricing, loadCities, bit,
    info, rname, reg, cols, suggest, outcome, selectable, selected, ruledOut, active, folded, fitDone, checkState, named, serviceSelection, skuOptions, availability, availabilityDetails, zoneText, availSummary, priceRows, priceDiff, priceSummary,
    regionLatency, peeringLatency, cityLatency, peeringChoices, nearestPeering, sitePeering, siteName, siteLatency, latencySummary, srcText, km, estimate, latScale, latPos,
    num, fmtPct, priceTone, evidence, latencyWorst, suggestAnswer, suggestions, hubRegions, design, suggestProfile, effective, hybridText, record, recordText, list, progress };
})(window);
