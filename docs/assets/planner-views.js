// Region planning workbook — the views of step 2: Scope, Services, Latency, Pricing, and Checks. Each view returns HTML.
(function (global) {
  'use strict';
  const M = global.MRP, C = M.core, K = M.kit, { icon, status } = M, { esc } = K;
  const { O, CHECKS, TONE, OUTCOME_ICON, STARTER_SERVICES } = M;
  const ui = M.ui;
  const MAX_SERVICES = 20;
  const D = C.D;
  const TONE_KIND = { good: 'success', warn: 'warning', bad: 'error' };
  const outcomeBadge = (o, lg) => K.badge(OUTCOME_ICON[o] || 'neutral', o, { lg });
  const nameTip = text => `tabindex="0" data-tip="${esc(text)}"`;
  const snapshotDate = () => D.meta && D.meta.generated ? K.fmtDate(D.meta.generated) : '';
  const NO_SNAPSHOT = 'No Azure price snapshot is published with this site, so availability can’t be shown. Run site/tools/refresh_data.py to create it.';
  const AS_FILE = 'The Azure data can’t be read while this page is open as a file. From the repository folder, run python -m http.server 8000 --directory docs, and then open http://localhost:8000/region-planner.html.';
  const PARTIAL_SNAPSHOT = 'The price snapshot is a partial test run, so most services and prices are missing. Run site/tools/refresh_data.py without --max-pages to complete it.';
  // A missing or partial snapshot changes what every result on the Services and Pricing tabs means, so it is said first.
  const snapshotBar = () => !D.hasCatalog ? K.mb('warning', esc(D.asFile ? AS_FILE : NO_SNAPSHOT)) : D.meta && D.meta.partial ? K.mb('warning', esc(PARTIAL_SNAPSHOT)) : '';
  const sortRegions = (a, b) => (a.group || '').localeCompare(b.group || '') || a.label.localeCompare(b.label);

  function regionCombo(id, ph, onPick) {
    const S = C.S;
    return K.combo(id, { mode: 'add', ph, label: ph,
      items: () => { const used = new Set([...S.current.map(x => x.id), ...S.regions.map(r => r.id)]);
        return D.regions.filter(r => !used.has(r.id)).map(r => ({ value: r.id, label: r.name, sub: r.geo, group: r.group || 'Other', tag: r.access === 'restricted' ? 'Access request' : '' })).sort(sortRegions); },
      onPick: it => onPick(it.value) });
  }

  // ───────────── Scope
  const fact = (ic, label, value) => `<div class="pl-fact">${icon(ic, { cls: 'pl-fact-ic' })}<dt>${esc(label)}</dt><dd>${value}</dd></div>`;
  const iconText = (kind, text) => `<span class="pl-it">${status(kind)}<span>${esc(text)}</span></span>`;

  function regionCard(r) {
    const S = C.S, i = C.info(r.id), base = S.baseline ? C.rname(S.baseline) : '';
    const z = i.zones === true ? iconText('success', 'Yes') : i.zones === false ? iconText('neutral', 'No') : iconText('warning', 'Verify');
    const pair = !i.known ? iconText('warning', 'Verify') : i.pair ? esc(C.rname(i.pair)) : 'Nonpaired';
    const access = i.access === 'restricted' ? iconText('warning', 'Access request needed') : i.known ? iconText('success', 'Open') : iconText('warning', 'Verify');
    // One row for every current region, in the order of the current regions list.
    const latRows = S.current.length ? S.current.map(cur => {
      const lat = C.regionLatency(cur.id, r.id);
      return fact('clock', 'Latency to ' + C.rname(cur.id), lat ? `<span class="pl-n">${lat.ms} ms</span> <span class="pl-tag" ${nameTip(C.srcText(lat.src))}>${lat.src === 'm' ? 'measured' : 'estimated'}</span>` : 'No data');
    }).join('') : fact('clock', 'Latency to current region', 'Add a current region');
    let priceV, svcV;
    if (!D.hasCatalog) priceV = svcV = 'No price snapshot';
    else {
      const p = C.priceSummary(r.id), a = C.availSummary(r.id);
      priceV = !C.named().length ? 'Add services to compare' : p.value !== null ? `<span class="pl-n">${C.fmtPct(p.value)}</span>` : 'No data';
      svcV = !a.total ? 'Add services to check' : a.none === a.total ? 'No data' : `<span class="pl-n">${a.ok} of ${a.total}</span>`;
    }
    const started = Object.values(r.checks).some(Boolean) || r.outcome;
    return `<article class="pl-rc"><div class="pl-rc-h"><div><h4>${esc(i.name)}</h4><p class="pl-cap">${esc([i.geo, i.loc].filter(Boolean).join(' · ') || 'Not in the reference data')}</p></div>` +
      `${K.iconBtn('rm-region', r.id, 'close', 'Remove ' + i.name)}</div>` +
      `<dl class="pl-facts">${fact('layers', 'Availability zones', z)}${fact('link', 'Paired region', pair)}${fact('key', 'Access', access)}` +
      `${latRows}${fact('tag', 'Price vs ' + (base || 'current region'), priceV)}${fact('list', 'Services available', svcV)}</dl>` +
      `${started ? `<div class="pl-rc-f">${outcomeBadge(C.outcome(r))}</div>` : ''}</article>`;
  }

  function vScope() {
    const S = C.S;
    const topo = M.O.estateTopology.map(id => ({ id, title: id, art: M.diagram.topology(id) }));
    const cur = S.current.map(x => { const i = C.info(x.id);
      return `<tr><th scope="row"><span class="pl-rn">${icon('region', { cls: 'pl-rn-ic' })}<span><b>${esc(i.name)}</b><span class="pl-cap">${esc(i.geo || 'Not in the reference data')}</span></span></span></th>` +
        `<td>${K.toggle('hub/' + x.id, x.hub, 'Geographic hub: ' + i.name)}</td>` +
        `<td><input class="pl-radio" type="radio" name="pl-baseline" data-k="baseline" value="${esc(x.id)}" aria-label="Price baseline: ${esc(i.name)}"${S.baseline === x.id ? ' checked' : ''}></td>` +
        `<td class="pl-x">${K.iconBtn('rm-current', x.id, 'close', 'Remove ' + i.name)}</td></tr>`; }).join('');
    const curList = S.current.length
      ? K.scroll(`<table class="pl-dl"><thead><tr><th scope="col">Region</th><th scope="col">Geographic hub</th><th scope="col">Price baseline</th><th scope="col" aria-label="Remove"></th></tr></thead><tbody>${cur}</tbody></table>`, { label: 'Current regions' })
      : '<p class="pl-muted">No current regions yet.</p>';
    return K.head('Scope', 'The platform you run today and the regions you are considering.') +
      K.section('Workbook', K.row('Workbook name', 'meta/name', id => K.inp('meta/name', S.meta.name, { id, ph: 'For example, Contoso Nordic expansion', label: 'Workbook name' })) +
        K.row('Owner', 'meta/owner', id => K.inp('meta/owner', S.meta.owner, { id, ph: 'Team or person', label: 'Owner' })) +
        K.row('Assessment date', 'meta/date', id => K.inp('meta/date', S.meta.date, { id, type: 'date', label: 'Assessment date' }))) +
      K.section('Current platform', K.rowRaw('Hub topology', K.cards('estate/topology', S.estate.topology, topo, { label: 'Hub topology', cls: 'sm' }), '', true) +
        K.row('Connectivity managed with', 'estate/managed', id => K.sel('estate/managed', S.estate.managed, O.managed, { id, label: 'Connectivity managed with' })) +
        K.row('Hybrid connectivity', 'estate/hybrid', id => K.sel('estate/hybrid', S.estate.hybrid, O.estateHybrid, { id, label: 'Hybrid connectivity' }))) +
      K.section('Current regions', `<div class="pl-add">${regionCombo('cur', 'Add a current region', id => {
        S.current.push({ id, hub: !S.current.length }); C.tidy(); C.loadPricing(S.baseline).then(ok => ok && K.hooks.render());
      })}</div>${curList}`, { desc: 'Regions you already run in.' }) +
      K.section('Regions to qualify', `<div class="pl-add">${regionCombo('cand', 'Add a region to qualify', id => { S.regions.push(C.newRegion(id)); })}</div>` +
        (S.regions.length ? `<div class="pl-rcs">${S.regions.map(regionCard).join('')}</div>` : '<p class="pl-muted">No regions to qualify yet.</p>'),
        { desc: 'Candidate regions. Three to five keep the comparison readable.' });
  }

  // ───────────── Checks
  const ROLL_TEXT = { success: 'all answered, nothing open', warning: 'needs attention', error: 'a gap or an exclusion', none: 'not started' };
  const ROLL_KIND = { success: 'success', warning: 'warning', error: 'error', none: 'none' };
  const EV_ICON = { good: 'success', warn: 'warning', bad: 'error', '': 'info' };

  function evChip(kind, r) {
    const e = C.evidence(kind, r);
    if (!e.text) return '';
    const inner = `${status(EV_ICON[e.tone || ''])}<span>${esc(e.text)}</span>`;
    return e.tab ? `<button type="button" class="pl-ev" data-act="tab" data-arg="${e.tab}" data-tip="${esc('Open ' + e.tab[0].toUpperCase() + e.tab.slice(1))}">${inner}</button>` : `<span class="pl-ev">${inner}</span>`;
  }
  // The question cell's note area. Re-rendered on its own when a note is opened or closed.
  function noteCell(rowId) {
    const note = C.S.notes[rowId] || '';
    if (ui.noteEdit === rowId) return `<textarea class="pl-in pl-area pl-note-in" rows="2" data-k="note/${rowId}" data-note="${rowId}" placeholder="Evidence, source, or owner" aria-label="Note for ${rowId}">${esc(note)}</textarea>`;
    if (note) return `<p class="pl-note">${esc(note)}</p><button type="button" class="pl-btn subtle sm" data-act="note" data-arg="${rowId}">${icon('edit')}<span>Edit note</span></button>`;
    return `<button type="button" class="pl-btn subtle sm" data-act="note" data-arg="${rowId}" data-tip="Add note">${icon('note')}<span>Add note</span></button>`;
  }

  function vChecks() {
    const S = C.S, rs = S.regions;
    if (!rs.length) return K.head('Checks', 'Four checks for each region.') + K.empty('checklist', 'Add the regions to qualify first.', 'scope', 'Go to Scope');
    const thead = `<thead><tr><th scope="col" class="pl-cg-q">Question</th>${rs.map(r => `<th scope="col" class="pl-cg-r"><span class="pl-cg-name">${esc(C.rname(r.id))}</span>${outcomeBadge(C.outcome(r))}</th>`).join('')}</tr></thead>`;
    const body = CHECKS.map(ch => `<tbody class="pl-cg-b"><tr class="pl-band"><th scope="row" class="pl-cg-q"><div class="pl-band-q"><span class="pl-band-n">${ch.n}</span><span class="pl-band-t"><b>${esc(ch.title)}</b><span>${esc(ch.q)}</span><a class="pl-link" href="${ch.href}">Guidance${icon('arrowright')}</a></span></div></th>` +
      rs.map(r => { const st = C.checkState(ch, r), name = `Check ${ch.n} for ${C.rname(r.id)}: ${ROLL_TEXT[st]}`;
        return `<td class="pl-roll" data-r="${esc(C.rname(r.id))}"><span ${nameTip(name)} aria-label="${esc(name)}" role="img">${status(ROLL_KIND[st])}</span></td>`; }).join('') + '</tr>' +
      ch.rows.map(row => `<tr><th scope="row" class="pl-cg-q"><div class="pl-qt"><span class="pl-id">${row.id}</span><span>${esc(row.label)}</span></div><div class="pl-note-cell" data-note-cell="${row.id}">${noteCell(row.id)}</div></th>` +
        rs.map(r => { const v = r.checks[row.id] || '';
          return `<td data-r="${esc(C.rname(r.id))}">${K.sel(`reg/${r.id}/check/${row.id}`, v, row.opts, { tone: row.neutral ? '' : TONE[v], label: `${row.id} ${row.label} ${C.rname(r.id)}` })}${row.ev ? evChip(row.ev, r) : ''}</td>`; }).join('') + '</tr>').join('') + '</tbody>').join('');
    const grid = `<div class="pl-cgw" id="pl-cgw" style="--n:${rs.length}"><table class="pl-cg">${thead}${body}</table></div>`;

    const cards = rs.map(r => { const s = C.suggest(r), ok = C.selectable(r), id = 'o-' + K.slug(r.id), o = C.outcome(r);
      return `<article class="pl-oc k-${OUTCOME_ICON[o] || 'neutral'}${r.selected && ok ? ' sel' : ''}"><h4>${esc(C.rname(r.id))}</h4>${outcomeBadge(s.o, true)}<p class="pl-oc-why">${esc(s.why)}</p>` +
        `<div class="pl-fld"><label for="${id}-o">Outcome</label>${K.sel(`reg/${r.id}/outcome`, r.outcome, O.outcome, { id: id + '-o', empty: 'As suggested', label: 'Outcome for ' + C.rname(r.id) })}${r.outcome && r.outcome !== s.o ? `<p class="pl-hint">Set by hand. The suggestion is ${esc(s.o)}.</p>` : ''}</div>` +
        `<div class="pl-fld"><label for="${id}-c">Conditions and open validations</label>${K.area(`reg/${r.id}/conditions`, r.conditions, { id: id + '-c', ph: 'What must be resolved, and by whom', rows: 3 })}</div>` +
        `<div class="pl-fld2"><div class="pl-fld"><label for="${id}-w">Owner</label>${K.inp(`reg/${r.id}/owner`, r.owner, { id: id + '-w', ph: 'Team or person' })}</div>` +
        `<div class="pl-fld"><label for="${id}-r">Review date</label>${K.inp(`reg/${r.id}/review`, r.review, { id: id + '-r', type: 'date' })}</div></div>` +
        `<label class="pl-pick${ok ? '' : ' off'}${r.selected && ok ? ' on' : ''}"><input type="checkbox" data-k="reg/${esc(r.id)}/selected"${r.selected && ok ? ' checked' : ''}${ok ? '' : ' disabled'}>` +
        `<span class="pl-pick-t"><b>Select for regional design</b><span>${ok ? 'Records the regional design in the next step.' : `Needs a Qualified or Conditional outcome. Now: ${esc(o)}.`}</span></span></label></article>`; }).join('');
    const picked = C.selected();
    const msg = picked.length ? K.mb('success', `${esc(C.list(picked.map(r => C.rname(r.id))))} ${picked.length > 1 ? 'are' : 'is'} selected for regional design.`)
      : K.mb('info', 'Select at least one qualified or conditional region to continue to the regional design.');
    return K.head('Checks', 'Four checks for each region. Checks 1 and 2 need no technical work, so answer them first.') + grid +
      K.section('Outcome', `<div class="pl-ocs">${cards}</div><div class="pl-after">${msg}</div>`, { desc: 'For the defined workload requirements, as of the assessment date.', link: ['regional-qualification.html#assessment-outcome', 'Guidance'] });
  }

  // ───────────── Services
  const AV = { yes: ['success', 'Available'], no: ['error', 'Not available'], global: ['globe', 'Global'], none: ['neutral', 'No data'] };
  function avCell(s, rid, st) {
    const [k, text] = AV[st];
    const ic = k === 'globe' ? icon('globe', { cls: 'pl-av-globe' }) : status(k);
    const tipText = `${text}\n${s.service}${s.product ? ' (' + s.product + ')' : ''} in ${C.rname(rid)}${snapshotDate() ? '. Snapshot of ' + snapshotDate() + '.' : ''}`;
    return `<span class="pl-av" ${nameTip(tipText)} aria-label="${esc(text + ': ' + s.service + ' in ' + C.rname(rid))}">${ic}<span class="pl-av-t">${text}</span></span>`;
  }
  function productCell(s) {
    const prods = D.products && D.products.services[s.service];
    if (!D.hasCatalog || !prods) return `<span class="pl-muted">All products</span>`;
    return K.combo('prod-' + s.id, { mode: 'value', clearable: true, ph: 'All products', label: 'Product or SKU family of ' + s.service, display: () => s.product || '',
      items: () => Object.keys(prods).sort().map(p => ({ value: p, label: p })), onPick: it => { s.product = it.value; }, onClear: () => { s.product = ''; K.hooks.commit(); } });
  }
  const TILE_ICON = { ok: 'success', warn: 'warning', bad: 'error' };
  function svcTiles() {
    const S = C.S;
    if (!D.hasCatalog || !C.named().length || !S.regions.length) return '';
    return `<div class="pl-tiles">${S.regions.map(r => { const a = C.availSummary(r.id), pct = a.total ? Math.round(a.ok / a.total * 100) : 0;
      const miss = a.missing.length ? `Missing: ${a.missing.slice(0, 3).join(', ')}${a.missing.length > 3 ? ` +${a.missing.length - 3} more` : ''}` : '';
      // The tile takes the worst state in its column: any service that is not available makes it red, an unknown one makes it amber.
      const tone = a.ok === a.total ? 'ok' : a.missing.length ? 'bad' : 'warn';
      return `<div class="pl-tile pl-tn s-${tone}"><p class="pl-tile-l pl-tile-s">${status(TILE_ICON[tone])}<span>${esc(C.rname(r.id))}</span></p><p class="pl-tile-v">${a.ok} of ${a.total} <span>available</span></p>` +
        `<span class="pl-meter" role="img" aria-label="${a.ok} of ${a.total} services available in ${esc(C.rname(r.id))}"><i style="width:${pct}%"></i></span>${miss ? `<p class="pl-cap">${esc(miss)}</p>` : a.none ? `<p class="pl-cap">${a.none} with no data</p>` : ''}</div>`; }).join('')}</div>`;
  }
  function vServices() {
    const S = C.S, cs = C.cols(), full = S.services.length >= MAX_SERVICES;
    const used = () => new Set(S.services.map(s => s.service));
    const add = K.combo('svc', { mode: 'add', ph: 'Add a service', label: 'Add a service', disabled: full,
      items: () => (D.hasCatalog ? D.services.map(s => ({ value: s.name, label: s.name, group: s.family || 'Other' })).sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label))
        : STARTER_SERVICES.map(n => ({ value: n, label: n }))).filter(x => !used().has(x.value)),
      onPick: it => { if (S.services.length < MAX_SERVICES) S.services.push({ id: C.uid('v'), service: it.value, product: '', weight: '' }); },
      onFree: D.hasCatalog ? null : (t => { if (S.services.length < MAX_SERVICES && !used().has(t)) S.services.push({ id: C.uid('v'), service: t, product: '', weight: '' }); }) });
    const rows = S.services.map((s, i) => `<tr><td class="pl-idx">${i + 1}</td><th scope="row" class="pl-sn">${esc(s.service)}</th><td class="pl-pr">${productCell(s)}</td>` +
      cs.map(x => { const st = C.availability(s, x.id); return `<td class="${x.current ? 'is-cur ' : ''}av-${st}">${avCell(s, x.id, st)}</td>`; }).join('') + `<td class="pl-x">${K.iconBtn('rm-svc', s.id, 'close', 'Remove ' + s.service)}</td></tr>`).join('');
    const table = S.services.length ? K.scroll(`<table class="pl-dl pl-mx"><thead><tr><th scope="col" class="pl-idx">#</th><th scope="col">Service</th><th scope="col">Product or SKU family</th>` +
      cs.map(x => `<th scope="col" class="${x.current ? 'is-cur' : ''}">${esc(C.rname(x.id))}${x.current ? '<span class="pl-cap">Current region</span>' : ''}</th>`).join('') + `<th scope="col" aria-label="Remove"></th></tr></thead><tbody>${rows}</tbody></table>`, { label: 'Service availability by region' })
      : K.empty('list', 'No services listed yet. Add the services the workloads expect to use.');
    const date = snapshotDate();
    return K.head('Services', 'The services the workloads expect to use, and where each one is available.') +
      snapshotBar() +
      `<div class="pl-bar">${add}${S.services.length ? '' : K.btn({ act: 'add-starter', label: 'Add common platform services', kind: 'secondary' })}<span class="pl-count">${S.services.length} of ${MAX_SERVICES}</span>${full ? '<span class="pl-cap">20 of 20. Remove one to add another.</span>' : ''}</div>` +
      svcTiles() + (cs.length ? '' : '<p class="pl-muted">Add regions in Scope to see a column for each one.</p>') + table +
      `<p class="pl-fn">${D.hasCatalog ? `Available means the Azure Retail Prices API lists a consumption meter for the service or product in the region (snapshot of ${esc(date)}). ` : ''}Confirm SKUs, features, and preview status on <a href="https://azure.microsoft.com/explore/global-infrastructure/products-by-region/table" target="_blank" rel="noopener">Products available by region</a>.</p>`;
  }

  // ───────────── Pricing
  const SCALE = 20;
  // A thin bar from a center line: left and green when cheaper, right and red when dearer. The same length scale for the whole table;
  // the shade says how large the difference is (see C.priceTone), so the length and the shade agree.
  function divBar(v) {
    const t = C.priceTone(v);
    if (t === 'n') return '<span class="pl-div"></span>';
    if (t === 'z') return '<span class="pl-div"><i class="z"></i></span>';
    const w = Math.min(Math.abs(v), SCALE) / SCALE * 50;
    return `<span class="pl-div"><i class="${v < 0 ? 'lo' : 'hi'} ${t}" style="width:${w.toFixed(1)}%"></i></span>`;
  }
  function priceTiles() {
    const S = C.S, base = C.rname(S.baseline);
    return S.regions.map(r => { const p = C.priceSummary(r.id), v = p.value;
      const cap = !D.hasCatalog ? 'No price snapshot' : v === null ? (S.ui.weighted && p.avg !== null ? 'Enter spend shares to weight the average' : 'No comparable prices') : `${S.ui.weighted ? 'spend-weighted average' : 'average'} of ${K.plural(p.n, 'service')} vs ${base}`;
      return `<div class="pl-tile pl-tn ${C.priceTone(v)}"><p class="pl-tile-l">${esc(C.rname(r.id))}</p><p class="pl-tile-v">${v === null ? K.EM : C.fmtPct(v)}</p>${divBar(v)}<p class="pl-cap">${esc(cap)}</p></div>`; }).join('');
  }
  function priceFoot() {
    const S = C.S, rows = C.priceRows();
    return `<tr><th scope="row">${S.ui.weighted ? 'Weighted average' : `Average`}</th>${S.ui.weighted ? '<td></td>' : ''}` +
      S.regions.map(r => { const v = C.priceSummary(r.id).value; return `<td><div class="pl-pc"><span class="pl-pc-v">${v === null ? K.EM : C.fmtPct(v)}</span>${divBar(v)}</div></td>`; }).join('') + '</tr>';
  }
  function vPricing() {
    const S = C.S, rs = S.regions, rows = C.priceRows();
    const note = K.mb('info', 'These are Azure retail pay-as-you-go list prices in USD. They don’t include your negotiated discounts, reservations, savings plans, Azure Hybrid Benefit, or other incentives, so the prices you pay can differ.');
    const h = K.head('Pricing', 'List-price difference between the current region and each region you are qualifying.') + note;
    if (!S.current.length) return h + K.empty('tag', 'Add a current region to compare prices with.', 'scope');
    if (!rs.length) return h + K.empty('tag', 'Add the regions to qualify first.', 'scope');
    if (!rows.length) return h + snapshotBar() + K.empty('list', 'Add the services the workloads expect to use.', 'services', 'Go to Services');
    const base = C.rname(S.baseline), w = S.ui.weighted;
    const body = rows.map(s => `<tr><th scope="row">${esc(s.service)}</th>` +
      (w ? `<td><span class="pl-pct">${K.inp(`svc/${s.id}/weight`, s.weight, { type: 'number', min: 0, max: 100, step: 1, label: 'Spend share of ' + s.service + ' in percent' })}<i>%</i></span></td>` : '') +
      rs.map(r => { const d = C.priceDiff(s.service, r.id);
        const t = d ? `Median over ${d.n.toLocaleString('en-US')} meters that both regions have\n${s.service}: ${C.rname(r.id)} vs ${base}` : `No comparable meters\n${s.service}: ${C.rname(r.id)} vs ${base}`;
        return `<td><div class="pl-pc" ${nameTip(t)} aria-label="${esc(s.service + ' in ' + C.rname(r.id) + ': ' + (d ? C.fmtPct(d.p) || '0.0%' : 'no data'))}"><span class="pl-pc-v">${d ? (C.fmtPct(d.p) || '0.0%') : 'No data'}</span>${divBar(d ? d.p : null)}</div></td>`; }).join('') + '</tr>').join('');
    return h + snapshotBar() +
      `<div class="pl-bar"><div class="pl-inline"><label class="pl-label-i" for="f-baseline">Compare with</label>${K.sel('baseline', S.baseline, S.current.map(x => [x.id, C.rname(x.id)]), { id: 'f-baseline', label: 'Compare with', empty: 'Select a region' })}</div>` +
      `<div class="pl-inline">${K.toggle('ui/weighted', w, 'Weight by spend share')}<span class="pl-label-i">Weight by spend share</span></div></div>` +
      `<div class="pl-tiles" id="pl-ptiles">${priceTiles()}</div>` +
      K.scroll(`<table class="pl-dl pl-mx pl-pt"><thead><tr><th scope="col">Service</th>${w ? '<th scope="col">Spend share</th>' : ''}${rs.map(r => `<th scope="col">${esc(C.rname(r.id))}<span class="pl-cap">vs ${esc(base)}</span></th>`).join('')}</tr></thead>` +
        `<tbody>${body}</tbody><tfoot id="pl-pfoot">${priceFoot()}</tfoot></table>`, { label: 'Price difference by service and region' }) +
      priceLegend(base);
  }
  const RAMP = ['under 2%', '2 to under 5%', '5 to under 10%', '10% or more'];
  function priceLegend(base) {
    const ramp = (title, pre) => `<span class="pl-ramp"><span class="pl-ramp-t">${title}</span>${RAMP.map((t, i) => `<span class="pl-lg"><span class="pl-key ${pre}${i + 1}"></span>${t}</span>`).join('')}</span>`;
    return `<div class="pl-fn pl-ramps" role="group" aria-label="Legend for the price bars">${ramp(`Cheaper than ${esc(base)}`, 'c')}${ramp('More expensive', 'd')}` +
      `<span class="pl-ramp"><span class="pl-lg"><span class="pl-key z"></span>No difference, or no comparable prices</span></span>` +
      `<span class="pl-ramp-n">The shade shows the size of the difference. Bar length is on one scale for the whole table, full at ±${SCALE}%.</span></div>`;
  }
  function patchPricing(root) {
    const t = root.querySelector('#pl-ptiles'), f = root.querySelector('#pl-pfoot');
    if (t) t.innerHTML = priceTiles();
    if (f) f.innerHTML = priceFoot();
  }

  // ───────────── Latency
  const KIND = { capital: 'Capital', state: 'State capital', city: 'City' };
  const dot = src => `<span class="pl-src ${src === 'm' ? 'm' : 'e'}" role="img" aria-label="${src === 'm' ? 'Measured' : 'Estimated'}"></span>`;

  function pathDiagram() {
    const node = (ic, label) => `<div class="pl-node"><span class="pl-node-ic">${icon(ic)}</span><span class="pl-node-l">${label}</span></div>`;
    // The numbers under a latency value read "first + second": the first leg is the provider network, the second the Microsoft backbone.
    const link = (label, sub) => `<div class="pl-leg"><span class="pl-leg-t"><span class="pl-leg-l">${label}</span><span class="pl-leg-n">${sub}</span></span><span class="pl-leg-line"></span></div>`;
    return `<div class="pl-path" role="img" aria-label="Your location, then the provider network (the first number under a latency value), the ExpressRoute peering location, the Microsoft backbone (the second number), and the Azure region">${node('building', 'Your location')}${link('Provider network', 'First number (<b>3</b> + 17)')}${node('peering', 'ExpressRoute peering location')}${link('Microsoft backbone', 'Second number (3 + <b>17</b>)')}${node('cloud', 'Azure region')}</div>` +
      '<p class="pl-cap">A location’s latency is the sum of the two legs. Under each value in the table below, the two legs are shown as “first + second”.</p>';
  }
  // The bar reveals a gradient that is fixed to the scale, so the color at any point depends on the milliseconds there, not on the row.
  function latBar(ms) {
    const p = Math.max(0.02, C.latPos(ms));
    return `<span class="pl-hbar" aria-hidden="true">${ms > 0 ? `<i style="--p:${p.toFixed(3)}"></i>` : ''}</span>`;
  }
  // One legend for both tables. The graphic is decorative; the sentence carries the same information.
  function latLegend() {
    const m = C.latScale.marks;
    const ticks = m.map((v, i) => `<span class="pl-latlg-t" style="left:${(C.latPos(v) * 100).toFixed(1)}%"><span${i === 0 ? ' class="first"' : ''}>${v}</span></span>`).join('');
    return `<div class="pl-latlg"><span class="pl-latlg-l">Round-trip latency, in ms</span><div class="pl-latlg-m"><span class="pl-latlg-bar" aria-hidden="true"></span><span class="pl-latlg-ticks" aria-hidden="true">${ticks}</span></div>` +
      '<p class="pl-latlg-n">Green up to 30 ms, yellow at 60, red at 120, dark red from 200. Bars are full at 250 ms and are not drawn to a linear scale: short hops are stretched so that they stay visible.</p></div>';
  }
  function vBetween() {
    const S = C.S;
    if (!S.current.length || !S.regions.length) return '<p class="pl-muted">Add current regions and regions to qualify in Scope to compare them.</p>';
    const grid = S.current.map(f => S.regions.map(t => C.regionLatency(f.id, t.id)));
    const rows = S.current.map((f, i) => `<tr><th scope="row"><b>${esc(C.rname(f.id))}</b></th>` + S.regions.map((t, j) => {
      const l = grid[i][j];
      if (!l) return `<td><span class="pl-muted">No data</span></td>`;
      const tipT = `${l.ms} ms, ${l.src === 'm' ? 'measured' : 'estimated'}\n${C.srcText(l.src)}\n${C.rname(f.id)} to ${C.rname(t.id)}`;
      return `<td><div class="pl-bc" ${nameTip(tipT)} aria-label="${esc(`${C.rname(f.id)} to ${C.rname(t.id)}: ${l.ms} milliseconds, ${l.src === 'm' ? 'measured' : 'estimated'}`)}"><span class="pl-bc-v pl-n">${l.ms} ms</span>${dot(l.src)}${latBar(l.ms)}</div></td>`; }).join('') + '</tr>').join('');
    return K.scroll(`<table class="pl-dl pl-mx"><thead><tr><th scope="col">From</th>${S.regions.map(r => `<th scope="col">${esc(C.rname(r.id))}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`, { label: 'Latency between regions' }) + latLegend() +
      `<p class="pl-fn pl-legend"><span class="pl-lg">${dot('m')}Measured: Microsoft published median${D.lat && D.lat.dataset ? ', dataset of ' + esc(D.lat.dataset) : ''}</span><span class="pl-lg">${dot('e')}Estimated from distance</span></p>`;
  }

  function siteCell(s, rid) {
    const l = C.siteLatency(s, rid), t = C.num(s.target), name = C.siteName(s) || 'location', rn = C.rname(rid);
    const shown = l ? l.ms : '';
    const inner = lat => {
      if (!lat) return '';
      let st = '';
      if (t !== null) st = lat.ms <= t ? `<span class="pl-lc-st ok">${status('success')}<span>Within target</span></span>` : `<span class="pl-lc-st over">${status('error')}<span>Over by ${Math.round((lat.ms - t) * 10) / 10} ms</span></span>`;
      const legsT = lat.legs.length === 2 ? `${lat.legs[0].ms} + ${lat.legs[1].ms}` : '';
      // Spells out which leg is which, with the names, for the "3 + 17" caption.
      const g = lat.legs, legsTip = legsT ? [`${legsT} = ${lat.ms} ms`, `${g[0].ms} ms from ${name} to the ${g[1].from} peering location (provider network)`, `${g[1].ms} ms from there to ${rn} (Microsoft backbone)`].join('\n') : '';
      return `${latBar(lat.ms)}${lat.edited ? `<span class="pl-lc-ed"><span class="pl-tag brand">Edited</span><button type="button" class="pl-btn subtle icon sm" data-act="reset-edit" data-arg="${esc(s.id)}|${esc(rid)}" aria-label="Restore the calculated value for ${esc(name)} to ${esc(rn)}" data-tip="${lat.calc === null ? 'Remove the typed value' : 'Restore ' + lat.calc + ' ms'}">${icon('reset')}</button></span>` : ''}` +
        `${legsT && !lat.edited ? `<span class="pl-lc-cap" ${nameTip(legsTip)}>${legsT}</span>` : ''}${st}`;
    };
    const tipLines = l ? [`${l.ms} ms${l.edited ? ', edited' : ''}`, ...l.legs.map(g => `${g.from} to ${g.to}: ${g.ms} ms, ${C.srcText(g.src).toLowerCase()}`), ...(l.edited && l.calc !== null ? [`Calculated: ${l.calc} ms`] : [])].join('\n') : '';
    return `<td class="pl-lc${rid && C.S.current.some(c => c.id === rid) ? ' is-cur' : ''}" data-lat="${esc(s.id)}|${esc(rid)}"><div class="pl-lc-in" ${tipLines ? `data-tip="${esc(tipLines)}"` : ''}>` +
      `<input class="pl-lc-num" type="number" min="0" step="any" inputmode="decimal" data-k="site/${esc(s.id)}/edit/${esc(rid)}" value="${shown}" aria-label="Latency from ${esc(name)} to ${esc(rn)} in milliseconds"><span class="pl-lc-u">ms</span>${icon('edit', { cls: 'pl-lc-pen' })}</div>` +
      `<div class="pl-lc-meta">${inner(l)}</div></td>`;
  }
  function patchLatency(root) {
    const S = C.S;
    root.querySelectorAll('[data-lat]').forEach(td => {
      const [sid, rid] = td.dataset.lat.split('|'), s = S.sites.find(x => x.id === sid);
      if (!s) return;
      const fresh = document.createElement('table'); fresh.innerHTML = `<tr>${siteCell(s, rid)}</tr>`;
      const nw = fresh.querySelector('td'), input = td.querySelector('.pl-lc-num'), focused = document.activeElement === input;
      td.querySelector('.pl-lc-meta').innerHTML = nw.querySelector('.pl-lc-meta').innerHTML;
      const wrap = td.querySelector('.pl-lc-in'), t = nw.querySelector('.pl-lc-in').getAttribute('data-tip');
      if (t) wrap.setAttribute('data-tip', t); else wrap.removeAttribute('data-tip');
      if (!focused) input.value = nw.querySelector('.pl-lc-num').value;
    });
    M.latencyMap.patch(root);
  }
  function siteRow(s, cs) {
    const city = s.city, name = C.siteName(s), isCity = s.kind === 'city';
    const sub = isCity ? [city && city.a && city.a !== city.n ? city.a : '', city ? city.c : ''].filter(Boolean).join(', ') : 'Peering location';
    let peer;
    if (!isCity) peer = `<span class="pl-pl-v">${esc(s.peering)}</span>`;
    else if (!D.lat) peer = `<span class="pl-muted">${K.EM}</span>`;
    else peer = K.combo('pl-' + s.id, { mode: 'value', ph: 'Select a peering location', label: 'Peering location for ' + name, display: () => C.sitePeering(s),
      items: () => C.peeringChoices(city).map(p => ({ value: p.name, label: p.name, sub: p.ms + ' ms' })), onPick: it => { s.peering = it.value; } });
    return `<tr><th scope="row"><span class="pl-rn">${icon(isCity ? 'building' : 'peering', { cls: 'pl-rn-ic' })}<span><b>${esc(name)}</b><span class="pl-cap">${esc(sub)}${isCity && city && KIND[city.k] ? ` · ${KIND[city.k]}` : ''}</span></span></span></th>` +
      `<td class="pl-pl">${peer}</td><td class="pl-tg">${K.inp(`site/${s.id}/target`, s.target, { type: 'number', min: 0, label: 'Target in milliseconds for ' + name })}</td>` +
      cs.map(x => siteCell(s, x.id)).join('') + `<td class="pl-x">${K.iconBtn('rm-site', s.id, 'close', 'Remove ' + name)}</td></tr>`;
  }
  function vLatency() {
    const S = C.S, cs = C.cols();
    if (!cs.length) return K.head('Latency', 'Round-trip latency from your locations and current regions to each region, in milliseconds.') + K.empty('clock', 'Add your current regions and the regions to qualify first.', 'scope');
    const L = D.lat;
    const usedCities = () => new Set(S.sites.filter(s => s.kind === 'city' && s.city).map(s => D.cities ? D.cities.key(s.city) : ''));
    const usedPeering = () => new Set(S.sites.filter(s => s.kind === 'peering').map(s => s.peering));
    const addCity = K.combo('city', { mode: 'add', ph: !L ? 'Add a location' : D.citiesState === 'ready' ? 'Add a city' : D.citiesState === 'loading' ? 'Loading cities' : 'Add a city', label: 'Add a city',
      items: () => D.cities ? D.cities.cities.filter(c => !usedCities().has(D.cities.key(c))).map(c => ({ value: D.cities.key(c), label: c.n, sub: `${c.a || c.n}, ${c.c}`, group: c.c, tag: KIND[c.k] || '', city: c })) : [],
      onPick: it => { S.sites.push({ id: C.uid('s'), kind: 'city', city: { ...it.city }, peering: '', target: '', edits: {} }); },
      onFree: L && D.citiesState === 'ready' ? null : (t => { S.sites.push({ id: C.uid('s'), kind: 'city', city: { n: t, a: t, c: '', cc: '', k: 'city' }, peering: '', target: '', edits: {} }); }) });
    const addPeer = K.combo('peer', { mode: 'add', ph: 'Add a peering location', label: 'Add a peering location',
      items: () => L ? L.peering.filter(p => !usedPeering().has(p.name)).map(p => ({ value: p.name, label: p.name, sub: [p.city, p.country].filter(Boolean).join(', ') })) : [],
      onPick: it => { S.sites.push({ id: C.uid('s'), kind: 'peering', city: null, peering: it.value, target: '', edits: {} }); },
      onFree: L ? null : (t => { if (!usedPeering().has(t)) S.sites.push({ id: C.uid('s'), kind: 'peering', city: null, peering: t, target: '', edits: {} }); }) });
    const table = S.sites.length ? K.scroll(`<table class="pl-dl pl-mx pl-lt"><thead><tr><th scope="col">Location</th><th scope="col">Peering location</th><th scope="col">Target (ms)</th>` +
      cs.map(x => `<th scope="col" class="${x.current ? 'is-cur' : ''}">${esc(C.rname(x.id))}${x.current ? '<span class="pl-cap">Current region</span>' : ''}</th>`).join('') + `<th scope="col" aria-label="Remove"></th></tr></thead><tbody>${S.sites.map(s => siteRow(s, cs)).join('')}</tbody></table>`, { label: 'Latency from your locations' })
      : '<p class="pl-muted">No locations yet. Add a city, or a peering location where your circuit lands.</p>';
    return K.head('Latency', 'Round-trip latency from your locations and current regions to each region, in milliseconds.') +
      (L ? '' : K.mb('warning', esc(D.asFile ? AS_FILE : 'No latency data is published with this site. Run site/tools/refresh_latency.py to create it.'))) +
      K.section('How the path is built', pathDiagram()) +
      K.section('Between regions', vBetween()) +
      K.section('From your locations', `<div class="pl-bar">${addCity}${addPeer}</div>${table}` +
        (S.sites.length ? latLegend() : '') +
        `<p class="pl-fn pl-legend"><span class="pl-lg">${dot('m')}Measured</span><span class="pl-lg">${dot('e')}Estimated</span><span class="pl-lg"><span class="pl-tag brand">Edited</span>A value you typed over the calculated one</span></p>` +
        (S.sites.some(x => x.kind === 'city') && L ? '<p class="pl-fn">Under a value, “3 + 17” shows the two legs it adds up to: the first number is from your location to its ExpressRoute peering location (provider network), the second is from the peering location to the Azure region (Microsoft backbone). Hover over it to see both legs named.</p>' : '') +
        K.mb('info', `Region-to-region values are Microsoft’s published medians${L && L.dataset ? ` (dataset of ${esc(L.dataset)})` : ''}. Values that involve a peering location or a city are estimates based on those medians and on distance. Measure on the real path before you commit. ` +
          '<a href="https://learn.microsoft.com/azure/networking/azure-network-latency" target="_blank" rel="noopener">Azure network round-trip latency statistics</a>'), { desc: 'Type over any value to replace it. The target marks each value as within or over.' }) +
      M.latencyMap.view();
  }

  M.views = Object.assign(M.views || {}, { scope: vScope, checks: vChecks, services: vServices, pricing: vPricing, latency: vLatency });
  M.viewTools = { noteCell, patchPricing, patchLatency, MAX_SERVICES };
})(window);
