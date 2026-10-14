// Region planning workbook — Excel export. Builds the sheet definitions that xlsx-lite.js turns into a file.
// With nothing entered, the export is a blank template with the same questions and drop-down lists.
(function (global) {
  'use strict';
  const M = global.MRP, C = M.core, { O, TONE, CHECKS, PROFILES, PROFILE_QUESTIONS, SHARED, HYBRID_PATHS } = M;
  const OUTCOME_TONE = { 'Qualified': 'good', 'Conditional': 'warn', 'Candidate': 'warn', 'Excluded': 'bad', 'No deeper assessment': 'bad' };
  const col = i => global.XlsxLite.colName(i);
  const tone = v => TONE[v] || OUTCOME_TONE[v] || 'cell';
  const c = (v, s) => ({ v: v === null || v === undefined ? '' : v, s: s || 'cell' });
  const pad = (row, n, s) => { while (row.length < n) row.push(c('', s || 'cell')); return row; };

  function workbook() {
    const S = C.S, D = C.D;
    const regs = S.regions.length ? S.regions.map(r => ({ r, name: C.rname(r.id) })) : [1, 2, 3].map(i => ({ r: null, name: 'Region ' + i }));
    const picked = C.selected();
    const des = picked.length ? picked.map(r => ({ r, name: C.rname(r.id), e: C.effective(r), d: C.design(r) })) : [1, 2].map(i => ({ r: null, name: 'Selected region ' + i }));
    const snapshot = D.meta && D.meta.generated ? `Azure data snapshot: ${D.meta.generated.slice(0, 10)} (Azure Retail Prices API, list prices in USD)` : 'No Azure data snapshot was published, so availability and prices are blank';
    const title = S.meta.name || 'Region planning workbook';
    const sub = [`Date: ${S.meta.date}`, S.meta.owner && `Owner: ${S.meta.owner}`, S.current.length && `Current regions: ${S.current.map(x => C.rname(x.id)).join(', ')}`].filter(Boolean).join('  ·  ');
    const frame = (width, extra = []) => [`A1:${col(width - 1)}1`, `A2:${col(width - 1)}2`, `A3:${col(width - 1)}3`, ...extra];

    // ── Scope
    const scRows = [[c('Scope', 'title')], [c('Workbook context, current platform, and the regions being assessed.', 'muted')], [c(snapshot, 'muted')], []];
    const scMerges = frame(7);
    const scGroup = text => { scRows.push(pad([c(text, 'group')], 7, 'group')); scMerges.push(`A${scRows.length}:G${scRows.length}`); };
    const scField = (label, value) => scRows.push([c(label, 'label'), c(value, 'input')]);
    scGroup('Workbook details');
    scField('Workbook name', title);
    scField('Owner', S.meta.owner);
    scField('Assessment date', S.meta.date);
    scRows.push([]);
    scGroup('Current platform');
    scField('Hub topology', S.estate.topology);
    scField('Connectivity managed with', S.estate.managed);
    scField('Hybrid connectivity', S.estate.hybrid);
    scRows.push([]);
    scGroup('Current regions');
    scRows.push([c('Region', 'head'), c('Geographic hub', 'head'), c('Price baseline', 'head')]);
    (S.current.length ? S.current : [{ id: null, hub: false }]).forEach(x =>
      scRows.push([c(x.id ? C.rname(x.id) : 'Add a current region', 'input'),
        c(x.hub ? 'Yes' : x.id ? 'No' : '', 'input'), c(x.id === S.baseline ? 'Yes' : x.id ? 'No' : '', 'input')]));
    scRows.push([]);
    scGroup('Regions to qualify');
    scRows.push([c('Region', 'head'), c('Outcome', 'head'), c('Selected for design', 'head'), c('Connectivity profile', 'head'),
      c('Owner', 'head'), c('Review date', 'head'), c('Open conditions', 'head')]);
    (S.regions.length ? S.regions : [{ id: null }]).forEach(r => {
      const selected = r.id && r.selected && C.selectable(r);
      scRows.push([c(r.id ? C.rname(r.id) : 'Add a region to qualify', 'input'), c(r.id ? C.outcome(r) : '', 'input'),
        c(selected ? 'Yes' : 'No', 'input'), c(selected ? C.effective(r).profile : '', 'input'),
        c(r.id ? r.owner : '', 'input'), c(r.id ? r.review : '', 'input'), c(r.id ? r.conditions : '', 'input')]);
    });
    const scope = { name: 'Scope', tabColor: '0F6CBD', cols: [34, 28, 24, 30, 22, 16, 48], freeze: { x: 1, y: 3 }, rows: scRows, merges: scMerges };

    // ── Review
    const oHead = ['Region', 'Outcome', 'Selected', 'Connectivity profile', 'Hub implementation', 'Regional connectivity', 'Hybrid connectivity', 'Local shared services', 'Remote shared services', 'Global services', 'Open conditions', 'Owner', 'Review date'];
    const oRows = [[c('Review + export', 'title')], [c(sub, 'muted')], [c(snapshot, 'muted')], [], oHead.map(h => c(h, 'head'))];
    S.regions.slice().sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0)).forEach(r => {
      const out = C.outcome(r), sel = r.selected && C.selectable(r);
      const rec = sel ? Object.fromEntries(C.record(r).map(([k, v]) => [k.replace(/ \(from .*\)$/, ''), v])) : {};
      const remote = sel ? C.record(r).filter(([k]) => k.startsWith('Remote shared services')).map(([k, v]) => (k.match(/from (.*)\)$/) ? k.match(/from (.*)\)$/)[1] + ': ' : '') + v).join('\n') : '';
      oRows.push([c(C.rname(r.id), 'label'), c(out, 'input'), c(sel ? 'Yes' : 'No', 'input'), c(rec['Connectivity profile'], 'input'), c(rec['Hub implementation']), c(rec['Regional connectivity']),
        c(rec['Hybrid connectivity']), c(rec['Local shared services']), c(remote), c(rec['Global services']), c(r.conditions, 'input'), c(sel ? C.design(r).owner || r.owner : r.owner, 'input'), c(r.review, 'input')]);
    });
    if (!S.regions.length) oRows.push(pad([c('Region 1', 'label')], oHead.length));
    const outcome = { name: 'Review', tabColor: '12324A', cols: [24, 16, 16, 24, 34, 44, 44, 44, 38, 34, 40, 18, 13], freeze: { x: 1, y: 5 }, rows: oRows, merges: frame(oHead.length),
      lists: [{ ref: `B6:B${oRows.length}`, items: O.outcome }, { ref: `C6:C${oRows.length}`, items: ['Yes', 'No'] }, { ref: `D6:D${oRows.length}`, items: PROFILES.map(p => p.id) }] };

    // ── Step 2: checks
    const n = regs.length, width = n + 3, last = col(width - 1);
    const kRows = [[c('Step 1: Qualify regions', 'title')], [c('Answer checks 1 and 2 for every region first. Each answer cell has a drop-down list.', 'muted')], [],
      [c('#', 'head'), c('Check', 'head'), ...regs.map(x => c(x.name, 'head')), c('Evidence and notes', 'head')]];
    const kLists = [], kMerges = [];
    const group = (rows, merges, text) => { rows.push(pad([c(text, 'group')], width, 'group')); merges.push(`A${rows.length}:${last}${rows.length}`); };
    CHECKS.forEach(ch => {
      group(kRows, kMerges, `Check ${ch.n} · ${ch.title} — ${ch.q}`);
      ch.rows.forEach(row => {
        kRows.push([c(row.id, 'label'), c(row.label, 'label'), ...regs.map(x => { const v = x.r ? x.r.checks[row.id] || '' : ''; return c(v, 'input'); }), c(S.notes[row.id], 'input')]);
        kLists.push({ ref: `C${kRows.length}:${col(n + 1)}${kRows.length}`, items: row.opts });
        const ev = row.ev && S.regions.length ? regs.map(x => C.evidence(row.ev, x.r).text) : [];
        if (ev.some(Boolean)) kRows.push([c('', 'soft'), c('Evidence from the tables', 'soft'), ...ev.map(t => c(t, 'soft')), c('', 'soft')]);
      });
    });
    group(kRows, kMerges, 'Qualification outcome');
    const line = (label, fn, items, style) => {
      kRows.push([c('', 'label'), c(label, 'label'), ...regs.map(x => { const v = x.r ? fn(x.r) : ''; return c(v, items ? 'input' : style ? style(v) : 'cell'); }), c('')]);
      if (items) kLists.push({ ref: `C${kRows.length}:${col(n + 1)}${kRows.length}`, items });
    };
    line('Suggested outcome', r => C.suggest(r).o, null, tone);
    line('Reason', r => C.suggest(r).why);
    line('Outcome', r => C.outcome(r), O.outcome, tone);
    line('Conditions and open validations', r => r.conditions);
    line('Owner', r => r.owner);
    line('Review date', r => r.review);
    line('Selected for step 3', r => r.selected && C.selectable(r) ? 'Yes' : 'No', ['Yes', 'No']);
    const checks = { name: 'Checks', tabColor: '5B5FC7', cols: [6, 58, ...regs.map(() => 26), 46], freeze: { x: 2, y: 4 }, rows: kRows, lists: kLists, merges: [...frame(width), ...kMerges] };

    // ── Services (read-only results of the snapshot)
    const cs = C.cols().length ? C.cols().map(x => ({ id: x.id, name: C.rname(x.id) + (x.current ? ' (current)' : '') })) : regs.map(x => ({ id: null, name: x.name }));
    const AV = { yes: ['Available', 'good'], no: ['Not available', 'bad'], global: ['Global service', 'good'], none: ['No data', 'cell'] };
    const sRows = [[c('Service availability', 'title')], [c('The services you expect to use, and whether each one is available in each region. ' + snapshot + '. Available means the Azure Retail Prices API lists a consumption meter for the service or product in the region. Confirm SKUs, features, and preview status on "Products available by region".', 'muted')], [],
      [c('#', 'head'), c('Service', 'head'), c('Product or SKU family', 'head'), ...cs.map(x => c(x.name, 'head'))]];
    const svc = C.named();
    (svc.length ? svc : Array.from({ length: 20 }, () => null)).forEach((s, i) => sRows.push([c(i + 1, 'int'), c(s && s.service, 'label'), c(s && s.product),
      ...cs.map(x => { const v = s && x.id ? AV[C.availability(s, x.id)] : ['', 'cell']; return c(v[0], v[1]); })]));
    if (svc.length) sRows.push([c('', 'soft'), c('Available', 'soft'), c('', 'soft'), ...cs.map(x => { const a = x.id ? C.availSummary(x.id) : { ok: 0, total: 0 }; return c(`${a.ok} of ${a.total}`, 'soft'); })]);
    const services = { name: 'Services', tabColor: '008272', cols: [5, 34, 38, ...cs.map(() => 22)], freeze: { x: 3, y: 4 }, rows: sRows, merges: frame(3 + cs.length) };

    // ── Pricing (read-only results of the snapshot)
    const base = S.baseline ? C.rname(S.baseline) : 'the current region';
    const pRegs = regs, weighted = !!S.ui.weighted;
    const pRows = [[c('Price comparison', 'title')],
      [c(`Percent difference from ${base}. Azure retail pay-as-you-go list prices in USD: they don't include negotiated discounts, reservations, savings plans, Azure Hybrid Benefit, or other incentives. Each value is the median over the consumption meters that both regions have.`, 'muted')], [],
      [c('Service', 'head'), c('Spend share', 'head'), ...pRegs.map(x => c(x.name, 'head'))]];
    const prs = C.priceRows();
    (prs.length ? prs : Array.from({ length: 10 }, () => null)).forEach(s => {
      pRows.push([c(s && s.service, 'label'), c(s && C.num(s.weight) !== null ? C.num(s.weight) / 100 : '', 'share'),
        ...pRegs.map(x => { const d = s && x.r ? C.priceDiff(s.service, x.r.id) : null; return c(d ? d.p / 100 : '', 'pct'); })]);
    });
    if (prs.length) {
      pRows.push([c('Average of the listed services', 'soft'), c('', 'soft'), ...pRegs.map(x => { const p = x.r ? C.priceSummary(x.r.id).avg : null; return c(p === null ? '' : p / 100, 'pctb'); })]);
      if (weighted) pRows.push([c('Weighted by spend share', 'soft'), c('', 'soft'), ...pRegs.map(x => { const p = x.r ? C.priceSummary(x.r.id).weighted : null; return c(p === null ? '' : p / 100, 'pctb'); })]);
    }
    const pricing = { name: 'Pricing', tabColor: '008272', cols: [40, 13, ...pRegs.map(() => 22)], freeze: { x: 1, y: 4 }, rows: pRows, merges: frame(2 + pRegs.length) };

    // ── Latency: between regions, then from your locations
    const srcOf = l => !l ? '' : l.edited ? 'edited' : l.legs.some(g => g.src === 'd') ? 'estimated' : 'derived from measured';
    const lRows = [[c('Latency', 'title')], [c('Round-trip latency in milliseconds. Region-to-region values are the published medians' + (D.lat && D.lat.dataset ? ` (dataset of ${D.lat.dataset})` : '') + '. Values that involve a peering location or a city are estimates based on those medians and on distance. Measure on the real path before you commit.', 'muted')], [],
      [c('Between regions', 'group'), ...pad([], regs.length + 1, 'group')], [c('From', 'head'), ...regs.map(x => c(x.name, 'head')), c('Source', 'head')]];
    (S.current.length ? S.current : []).forEach(f => {
      const cells = regs.map(x => x.r ? C.regionLatency(f.id, x.r.id) : null);
      lRows.push([c(C.rname(f.id), 'label'), ...cells.map(l => c(l ? l.ms : '', 'num')), c(regs.map((x, i) => cells[i] ? `${x.name}: ${cells[i].src === 'm' ? 'measured' : 'estimated'}` : '').filter(Boolean).join('; '))]);
    });
    if (!S.current.length) lRows.push([c('Current region', 'label'), ...regs.map(() => c('', 'num')), c('')]);
    lRows.push([]);
    lRows.push([c('From your locations', 'group'), ...pad([], cs.length + 4, 'group')]);
    lRows.push([c('Type', 'head'), c('Location', 'head'), c('Peering location', 'head'), c('Target (ms)', 'head'), ...cs.map(x => c(x.name, 'head')), c('Source', 'head')]);
    (S.sites.length ? S.sites : Array.from({ length: 4 }, () => null)).forEach(s => {
      const t = s ? C.num(s.target) : null, ls = cs.map(x => s && x.id ? C.siteLatency(s, x.id) : null);
      lRows.push([c(s ? (s.kind === 'city' ? 'City' : 'Peering location') : ''), c(s && C.siteName(s), 'label'), c(s ? C.sitePeering(s) : ''), c(t === null ? '' : t, 'num'),
        ...ls.map(l => c(l ? l.ms : '', !l || t === null ? 'num' : l.ms <= t ? 'numgood' : 'numbad')),
        c(cs.map((x, i) => ls[i] ? `${x.name.replace(' (current)', '')}: ${srcOf(ls[i])}` : '').filter(Boolean).join('; '))]);
    });
    const latencyWidth = 5 + cs.length;
    const latency = { name: 'Latency', tabColor: '008272', cols: [24, 30, 24, 12, ...cs.map(() => 20), 60], freeze: { x: 2, y: 5 }, rows: lRows,
      merges: frame(latencyWidth, [`A4:${col(latencyWidth - 1)}4`, `A${lRows.findIndex(r => r[0] && r[0].v === 'From your locations') + 1}:${col(latencyWidth - 1)}${lRows.findIndex(r => r[0] && r[0].v === 'From your locations') + 1}`]) };

    // ── Step 3: regional design
    const m = des.length, dWidth = m + 1, dLast = col(dWidth - 1);
    const dRows = [[c('Step 2: Select the regional design', 'title')], [c('One column for each selected region. A region with a complete record is ready to be prepared in step 3.', 'muted')], [],
      [c('Question or decision', 'head'), ...des.map(x => c(x.name, 'head'))]];
    const dLists = [], dMerges = [];
    const dLine = (label, fn, items, style) => {
      dRows.push([c(label, 'label'), ...des.map(x => { const v = x.r ? fn(x) : ''; return c(v, style ? style(v) : 'input'); })]);
      if (items) dLists.push({ ref: `B${dRows.length}:${dLast}${dRows.length}`, items });
    };
    group2('Choice 1 · Connectivity profile');
    PROFILE_QUESTIONS.forEach(q => dLine(q.label, x => x.d[q.id], ['Yes', 'No']));
    dLine('Connectivity profile', x => x.e.profile, PROFILES.map(p => p.id));
    group2('Hub implementation and regional connectivity');
    dLine('Geographic hub the region uses', x => x.e.hub ? C.rname(x.e.hub) : '');
    dLine('Hub topology', x => x.e.topology, O.topology);
    dLine('Connectivity managed with', x => x.e.none ? '' : x.e.managed, O.managed);
    dLine('Connection to the geographic hub', x => x.e.link);
    dLine('Traffic between spokes in the region', x => x.e.eastWest);
    group2('Choice 2 · Shared-service placement');
    const place = s => !s ? '' : s.p === 'Remote' && s.from ? `Remote (from ${C.rname(s.from)})` : s.p;
    SHARED.forEach(sh => dLine(sh.name, x => place(x.e.ss.find(s => s.id === sh.id)), O.placement));
    [...new Set(des.flatMap(x => x.r ? x.e.ss.filter(s => s.custom && s.name).map(s => s.name) : []))]
      .forEach(name => dLine(name, x => place(x.e.ss.find(s => s.custom && s.name === name)), O.placement));
    group2('Choice 3 · Hybrid connectivity');
    dLine('Decision', x => x.e.hybrid, O.hybrid);
    dLine('Existing connectivity used', x => x.e.hybrid === 'Not required' ? '' : x.d.hybridUse);
    dLine('How the region reaches on-premises locations', x => x.e.hybrid === 'Not required' ? '' : x.e.hybridPath, HYBRID_PATHS.map(p => p.id));
    dLine('Change', x => x.e.hybrid === 'Change' ? x.d.hybridChange : '');
    dLine('Requirement that justifies the change', x => x.e.hybrid === 'Change' ? x.d.hybridReason : '', O.hybridReason);
    group2('Record');
    dLine('Open conditions', x => x.r.conditions);
    dLine('Owner', x => x.d.owner);
    dLine('Decision date', x => x.e.date);
    dLine('Reassess when', x => x.e.reassess);
    dLine('Record complete', x => x.e.complete ? 'Yes' : 'No: ' + x.e.missing.join(', '), null, v => v === 'Yes' ? 'good' : 'warn');
    function group2(text) { dRows.push(pad([c(text, 'group')], dWidth, 'group')); if (dWidth > 1) dMerges.push(`A${dRows.length}:${dLast}${dRows.length}`); }
    const designSheet = { name: 'Regional design', tabColor: '8661C5', cols: [62, ...des.map(() => 46)], freeze: { x: 1, y: 4 }, rows: dRows, lists: dLists, merges: [...frame(dWidth), ...dMerges] };

    return { sheets: [scope, services, latency, pricing, checks, designSheet, outcome] };
  }

  M.workbook = workbook;
  M.fileName = ext => `Region-planning-${(C.S.meta.name || 'workbook').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'workbook'}-${C.S.meta.date}.${ext}`;
})(window);
