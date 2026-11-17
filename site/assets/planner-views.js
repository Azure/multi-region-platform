// Multi-region planner — the views of step 2: Scope, Services, Latency, Pricing, and Checks. Each view returns HTML.
(function (global) {
  'use strict';
  const M = global.MRP, C = M.core, K = M.kit, { icon, status } = M, { esc } = K;
  const { O, CHECKS, TONE, OUTCOME_ICON, STARTER_SERVICES } = M;
  const ui = M.ui;
  const MAX_SERVICES = 100;
  const D = C.D;
  const TONE_KIND = { good: 'success', warn: 'warning', bad: 'error' };
  const outcomeBadge = (o, lg) => K.badge(OUTCOME_ICON[o] || 'neutral', o, { lg });
  const nameTip = text => `tabindex="0" data-tip="${esc(text)}"`;
  const snapshotDate = () => D.meta && D.meta.generated ? K.fmtDate(D.meta.generated) : '';
  const NO_SNAPSHOT = 'No Azure price snapshot is published with this site. Run site/tools/refresh_data.py to create it.';
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
    const p = C.priceSummary(r.id), a = C.availSummary(r.id);
    const priceV = !D.hasCatalog ? 'No price snapshot' : !C.named().length ? 'Add services to compare' : p.value !== null ? `<span class="pl-n">${C.fmtPct(p.value)}</span>` : 'No data';
    const svcV = !D.hasAvailability ? 'No availability catalog' : !a.total ? 'Add services to check' : a.none === a.total ? 'No data' : `<span class="pl-n">${a.ok} of ${a.total}</span>`;
    const started = Object.values(r.checks).some(Boolean) || r.outcome;
    return `<article class="pl-rc${C.ruledOut(r) ? ' is-excluded' : ''}"><div class="pl-rc-h"><div><h4>${esc(i.name)}</h4><p class="pl-cap">${esc([i.geo, i.loc].filter(Boolean).join(' · ') || 'Not in the reference data')}</p></div>` +
      `${outcomeBadge(C.outcome(r))}${K.iconBtn('rm-region', r.id, 'close', 'Remove ' + i.name)}</div>` +
      `<dl class="pl-facts">${fact('layers', 'Availability zones', z)}${fact('link', 'Paired region', pair)}${fact('key', 'Access', access)}` +
      `${latRows}${fact('tag', 'Price vs ' + (base || 'current region'), priceV)}${fact('list', 'Services available', svcV)}</dl>` +
      `${started && C.ruledOut(r) ? `<p class="pl-cap">${esc(C.suggest(r).why)}</p>` : ''}</article>`;
  }

  function vScope() {
    const S = C.S;
    const cur = S.current.map(x => { const i = C.info(x.id);
      return `<tr><th scope="row"><span class="pl-rn">${icon('region', { cls: 'pl-rn-ic' })}<span><b>${esc(i.name)}</b><span class="pl-cap">${esc(i.geo || 'Not in the reference data')}</span></span></span></th>` +
        `<td>${K.sel('current/' + x.id + '/profile', x.profile, M.PROFILES.map(p => p.id), { label: 'Platform Services profile of ' + i.name, empty: 'Select a profile' })}</td>` +
        `<td><input class="pl-radio" type="radio" name="pl-baseline" data-k="baseline" value="${esc(x.id)}" aria-label="Price baseline: ${esc(i.name)}"${S.baseline === x.id ? ' checked' : ''}></td>` +
        `<td class="pl-x">${K.iconBtn('rm-current', x.id, 'close', 'Remove ' + i.name)}</td></tr>`; }).join('');
    const curList = S.current.length
      ? K.scroll(`<table class="pl-dl"><thead><tr><th scope="col">Region</th><th scope="col">Platform Services profile</th><th scope="col">Price baseline</th><th scope="col" aria-label="Remove"></th></tr></thead><tbody>${cur}</tbody></table>`, { label: 'Current regions' })
      : '<p class="pl-muted">No current regions yet.</p>';
    const peers = [...new Set(S.sites.filter(s => s.kind === 'peering').map(s => s.peering))];
    return K.head('Scope', 'Your locations, your current platform, and the regions you are considering.') +
      K.section('Plan', '<div class="pl-plan-fields">' + K.row('Plan name', 'meta/name', id => K.inp('meta/name', S.meta.name, { id, ph: 'For example, Contoso Nordic expansion', label: 'Plan name' })) +
        K.row('Owner', 'meta/owner', id => K.inp('meta/owner', S.meta.owner, { id, ph: 'Team or person', label: 'Owner' })) +
        K.row('Assessment date', 'meta/date', id => K.inp('meta/date', S.meta.date, { id, type: 'date', label: 'Assessment date' })) + '</div>', { id: 'pl-scope-plan' }) +
      '<div class="pl-scope-locations">' + K.section('On-premises datacenters', scopeLocations('city'), {
        id: 'pl-scope-datacenters',
        desc: 'Optional. Leave empty for a cloud-only plan.',
      }) +
      K.section('ExpressRoute peering locations', scopeLocations('peering'), {
        id: 'pl-scope-peering',
        desc: 'Add the peering locations to assess and their round-trip latency targets. Selecting a location does not confirm an existing circuit.',
      }) + '</div>' +
      K.section('Current platform', `<div id="pl-scope-current">${curList}<div class="pl-add">${regionCombo('cur', 'Add a current region', id => {
        S.current.push({ id, profile: '', hub: false }); C.tidy(); C.loadPricing(S.baseline).then(ok => ok && K.hooks.render());
      })}</div></div>` +
        K.rowRaw('Hub topology', K.seg('estate/topology', S.estate.topology, O.estateTopology, { label: 'Hub topology' }), '', true) +
        K.row('Connectivity managed with', 'estate/managed', id => K.sel('estate/managed', S.estate.managed, O.managed, { id, label: 'Connectivity managed with' })) +
        K.row('Hybrid connectivity', 'estate/hybrid', id => K.sel('estate/hybrid', S.estate.hybrid, O.estateHybrid, { id, label: 'Hybrid connectivity' })) +
        `<div class="pl-circuit"><h4>${icon('peering')}Primary ExpressRoute circuit</h4>` +
        K.rowRaw('Peering location', K.seg('estate/circuit', S.estate.circuit, [['', 'None'], ...peers], { label: 'Primary ExpressRoute circuit peering location' })) +
        `${!peers.length ? '<p class="pl-hint">Add a peering location above to identify an existing circuit.</p>' : ''}</div>`,
        { id: 'pl-scope-platform', desc: 'Regions you already run in, and how they connect.' }) +
      K.section('Regions to qualify', `<div class="pl-add">${regionCombo('cand', 'Add a region to qualify', id => { S.regions.push(C.newRegion(id)); })}</div>` +
        (S.regions.length ? `<div class="pl-rcs">${S.regions.map(regionCard).join('')}</div>` : '<p class="pl-muted">No regions to qualify yet.</p>'),
        { id: 'pl-scope-candidates', desc: 'Candidate regions. Three to five keep the comparison readable.' });
  }

  // ───────────── Checks
  const ROLL_TEXT = { success: 'Met', warning: 'To validate', error: 'Not met', none: 'Open', skip: 'Not needed' };
  const ROLL_KIND = { success: 'success', warning: 'warning', error: 'error', none: 'candidate', skip: 'neutral' };
  const EV_ICON = { good: 'success', warn: 'warning', bad: 'error', '': 'info' };

  function evChip(kind, r) {
    const e = C.evidence(kind, r);
    if (!e.text) return '';
    const inner = `${status(EV_ICON[e.tone || ''])}<span>${esc(e.text)}</span>`;
    const label = e.label || (e.tab ? e.tab[0].toUpperCase() + e.tab.slice(1) : 'Source');
    const content = `${inner}<b>${esc(label)}${icon('arrowright')}</b>`;
    if (e.tab) return `<button type="button" class="pl-ev" data-act="tab" data-arg="${e.tab}">${content}</button>`;
    return e.href ? `<a class="pl-ev" href="${esc(e.href)}">${content}</a>` : `<span class="pl-ev">${inner}</span>`;
  }
  // The question cell's note area. Re-rendered on its own when a note is opened or closed.
  function noteCell(rowId) {
    const note = C.S.notes[rowId] || '';
    if (ui.noteEdit === rowId) return `<textarea class="pl-in pl-area pl-note-in" rows="2" data-k="note/${rowId}" data-note="${rowId}" placeholder="Evidence, source, or owner" aria-label="Note for ${rowId}">${esc(note)}</textarea>`;
    if (note) return `<p class="pl-note">${esc(note)}</p><button type="button" class="pl-btn subtle sm" data-act="note" data-arg="${rowId}">${icon('edit')}<span>Edit note</span></button>`;
    return `<button type="button" class="pl-btn subtle sm" data-act="note" data-arg="${rowId}" data-tip="Add note">${icon('note')}<span>Add note</span></button>`;
  }

  // Phones show one region at a time: a switcher above the grid, and cells marked with the region they belong to.
  function mRegion(rs) {
    if (!rs.some(r => r.id === ui.mregion)) ui.mregion = rs[0] ? rs[0].id : '';
    return ui.mregion;
  }
  function mSwitch(rs, mark) {
    if (rs.length < 2) return '';
    const on = mRegion(rs);
    return `<div class="pl-mreg" role="group" aria-label="Region shown">${rs.map(r => `<button type="button" class="pl-mreg-b${r.id === on ? ' on' : ''}" data-act="mregion" data-arg="${esc(r.id)}" aria-pressed="${r.id === on}">${mark ? status(mark(r)) : ''}<span>${esc(C.rname(r.id))}</span></button>`).join('')}</div>`;
  }
  const mAttr = r => ` data-rid="${esc(r.id)}"${r.id === ui.mregion ? ' data-m="1"' : ''}`;
  // Regions folded away because checks 1 to 3 ruled them out, with the switch that shows them.
  function foldNote() {
    const S = C.S, out = S.regions.filter(C.ruledOut);
    if (!out.length) return '';
    const names = C.list(out.map(r => `${C.rname(r.id)} (${C.outcome(r).toLowerCase()})`));
    return `<div class="pl-fold">${status('neutral')}<p>${S.ui.showOut ? `Showing ${out.length === 1 ? 'the region' : 'the regions'} ruled out by checks 1 to 3: ${esc(names)}.` : `Ruled out by checks 1 to 3 and folded here: ${esc(names)}. Still in the record and the export.`}</p>` +
      `${K.btn({ act: 'show-out', label: S.ui.showOut ? 'Hide' : 'Show', kind: 'subtle', cls: 'sm' })}</div>`;
  }

  function checksGrid(chs, rs, o = {}) {
    mRegion(rs);
    const ch = chs[0];
    const thead = `<thead><tr><th scope="col" class="pl-cg-q">Question</th>${rs.map(r => {
      const st = C.checkState(ch, r);
      return `<th scope="col" class="pl-cg-r"${mAttr(r)}><span class="pl-cg-name">${esc(C.rname(r.id))}</span>${K.badge(ROLL_KIND[st], ROLL_TEXT[st])}</th>`;
    }).join('')}</tr></thead>`;
    const choices = opts => opts.map(v => [v, { 'No (mandatory gap)': 'No', 'Gap accepted with a condition': 'Gap accepted', 'Not applicable': 'N/A' }[v] || v]);
    const cell = (row, r) => {
      if (C.checkSkipped(ch, r)) return `<td${mAttr(r)}><span class="pl-muted">Not needed</span></td>`;
      const v = r.checks[row.id] || '', label = `${row.id} ${row.label} ${C.rname(r.id)}`;
      const sug = o.suggest && !v ? C.suggestAnswer(row.id, r) : '';
      const ctl = row.id === '1.2' ? K.sel(`reg/${r.id}/check/${row.id}`, v, row.opts, { label })
        : K.seg(`reg/${r.id}/check/${row.id}`, v, choices(row.opts), { label, suggested: sug });
      return `<td data-r="${esc(C.rname(r.id))}"${mAttr(r)}>${ctl}${sug ? '<p class="pl-suggested">Suggested from evidence; not yet accepted</p>' : ''}${row.ev ? evChip(row.ev, r) : ''}</td>`;
    };
    const body = '<tbody>' + ch.rows.map(row => `<tr><th scope="row" class="pl-cg-q"><div class="pl-qt"><span class="pl-id">${row.id}</span><span>${esc(row.label)}</span></div><div class="pl-note-cell" data-note-cell="${row.id}">${noteCell(row.id)}</div></th>` +
      rs.map(r => cell(row, r)).join('') + '</tr>').join('') + '</tbody>';
    return `<div class="pl-cgw" style="--n:${rs.length};--cw:${ch.n === 4 ? 320 : 230}px"><table class="pl-cg">${thead}${body}</table></div>`;
  }

  function vWorkload(rs) {
    const rows = CHECKS[2].rows.map(row => {
      const w = C.S.workload[row.id], label = `${row.id} ${row.label} Shared answer for all regions`;
      const shared = row.id === '3.2' ? K.cards(`workload/${row.id}`, w.value, M.ARCHETYPES.map(a => ({
        id: a.id, text: a.text, meta: a.profiles.map(K.profileBadge).join(''),
      })), { label, cls: 'archetypes' }) : K.seg(`workload/${row.id}`, w.value, row.opts, { label });
      const regions = w.expanded ? `<div class="pl-workload-regions" id="pl-workload-${row.id.replace('.', '-')}">${rs.map(r => {
        if (C.checkSkipped(CHECKS[2], r)) return `<div${mAttr(r)}>${esc(C.rname(r.id))}<span class="pl-cap">Not needed</span></div>`;
        const override = Object.hasOwn(w.overrides, r.id), label = `${row.id} ${row.label} ${C.rname(r.id)}`;
        return `<label class="pl-workload-region"${mAttr(r)}><span class="pl-cap">${esc(C.rname(r.id))}</span>${K.sel(`workload/${row.id}/${r.id}`, override ? w.overrides[r.id] : '__shared__',
          [['__shared__', `Use shared answer (${w.value || 'not answered'})`], ...row.opts], { label, empty: 'Not answered', tone: row.neutral || !override ? '' : TONE[w.overrides[r.id]] })}</label>`;
      }).join('')}</div>` : '';
      return `<div class="pl-workload-question"><div class="pl-workload-label"><b><span class="pl-id">${row.id}</span> ${esc(row.label)}</b><div data-note-cell="${row.id}">${noteCell(row.id)}</div></div>` +
        `<div class="pl-workload-shared">${shared}${row.id === '3.2' && w.value && !O.archetype.includes(w.value) ? `<p class="pl-hint">Saved selection: ${esc(w.value)}. Choose the closest archetype and note any additional requirements.</p>` : ''}</div>${regions}</div>`;
    }).join('');
    const overrides = rs.map(r => {
      const values = CHECKS[2].rows.filter(row => Object.hasOwn(C.S.workload[row.id].overrides, r.id)).map(row => `${row.id} ${C.S.workload[row.id].overrides[r.id] || 'Not answered'}`);
      return values.length ? `${C.rname(r.id)}: ${values.join('; ')}` : '';
    }).filter(Boolean);
    const expanded = CHECKS[2].rows.some(row => C.S.workload[row.id].expanded);
    return rows + `<div id="pl-q-services"><h4><span class="pl-id">3.5</span> Which Azure services do the workloads require?</h4>${vServices(true)}</div>` +
      `<div class="pl-overrides"><span>${overrides.length ? '<b>Regional overrides</b> ' + esc(overrides.join(' · ')) : 'Applies to all regions'}</span>` +
      K.btn({ act: 'workload-overrides', label: expanded ? 'Hide overrides' : 'Edit overrides', kind: 'subtle', cls: 'sm' }) + '</div>';
  }

  function vChecks() {
    const S = C.S, rs = S.regions;
    const h = K.head('Checks 1 to 3', 'Business and geography, data and compliance, and workload requirements.');
    return h + (!rs.length ? K.mb('info', 'Add regions in Scope for checks 1 and 2. Shared workload requirements and services can be recorded now.') : '') +
      mSwitch(rs, r => OUTCOME_ICON[C.outcome(r)]) + CHECKS.slice(0, 3).filter(ch => rs.length || ch.n === 3).map(ch =>
      K.section(ch.title, ch.n === 3 ? vWorkload(rs) : checksGrid([ch], rs), {
        id: 'pl-check-' + ch.n, number: ch.n, desc: ch.q, link: [ch.href, 'Guidance'],
      })).join('');
  }

  // The outcome of each region as one table: a column for each region, a row for each decision.
  function outcomeTable(rs) {
    const body = rs.map(r => {
      const suggestion = C.suggest(r), name = C.rname(r.id), ok = C.selectable(r);
      return `<tr${C.ruledOut(r) ? ' class="is-excluded"' : ''}><th scope="row">${esc(name)}</th>` +
        CHECKS.map(ch => { const st = C.checkState(ch, r); return `<td>${status(ROLL_KIND[st], `Check ${ch.n}: ${ROLL_TEXT[st]}`)}</td>`; }).join('') +
        `<td>${outcomeBadge(suggestion.o)}<p class="pl-cap">${esc(suggestion.why)}</p></td>` +
        `<td>${K.sel(`reg/${r.id}/outcome`, r.outcome, O.outcome, { empty: 'As suggested', label: 'Outcome for ' + name })}</td>` +
        `<td>${K.area(`reg/${r.id}/conditions`, r.conditions, { rows: 2, ph: 'Conditions or constraints', label: 'Conditions and open validations for ' + name })}</td>` +
        `<td>${K.inp(`reg/${r.id}/owner`, r.owner, { ph: 'Team or person', label: 'Owner for ' + name })}${K.inp(`reg/${r.id}/review`, r.review, { type: 'date', label: 'Review date for ' + name })}</td>` +
        `<td>${K.toggle(`reg/${r.id}/selected`, r.selected && ok, 'Select ' + name + ' for regional design', !ok)}${!ok ? '<p class="pl-cap">Requires Qualified or Conditional</p>' : ''}</td></tr>`;
    }).join('');
    return K.scroll(`<table class="pl-dl pl-outcomes"><thead><tr><th scope="col">Region</th><th scope="col">1<br>Business</th><th scope="col">2<br>Data</th><th scope="col">3<br>Workload</th><th scope="col">4<br>Capability</th>` +
      '<th scope="col">Suggested outcome</th><th scope="col">Outcome</th><th scope="col">Conditions and open validations</th><th scope="col">Owner and review</th><th scope="col">Regional design</th></tr></thead>' +
      `<tbody>${body}</tbody></table>`, { label: 'Qualification outcomes', cls: 'pl-outcome-scroll' });
  }

  function vOutcome() {
    const rs = C.S.regions, h = K.head('Outcome', 'Each regional option is classified against defined workload requirements, with evidence, as of the assessment date.');
    if (!rs.length) return h + K.empty('checklist', 'Add the regions to qualify first.', 'scope', 'Go to Scope');
    const descriptions = {
      Excluded: 'A mandatory requirement cannot be satisfied, or there is no business need for Azure presence.',
      Candidate: 'Potentially viable; more discovery or validation first.',
      Conditional: 'Supported if documented conditions are resolved.',
      Qualified: 'As of the assessment date; onboarding revalidation still required.',
    };
    const legend = `<div class="pl-outcome-legend"><div><b>Qualification outcome</b><p class="pl-cap">Each regional option is classified against defined workload requirements, with evidence.</p></div>` +
      O.outcome.map(o => `<div>${outcomeBadge(o)}<p class="pl-cap">${esc(descriptions[o])}</p></div>`).join('') + '</div>';
    return h + outcomeTable(rs) + legend + K.mb('info', '<b>Regional design opens for Qualified and Conditional regions.</b> Candidate and Excluded regions remain in the record and export.');
  }

  function capabilityQuestions() {
    const S = C.S, rs = C.active();
    const h = '';
    if (!S.regions.length) return h + K.empty('checklist', 'Add the regions to qualify first.', 'scope', 'Go to Scope');
    if (!rs.length) return h + foldNote() + K.empty('checklist', 'Every region is ruled out by checks 1 to 3.', 'checks', 'Go to checks 1 to 3');
    const sug = C.suggestions(rs);
    const by = rs.map(r => [r, sug.filter(x => x.r === r).length]).filter(x => x[1]);
    const bar = sug.length ? K.mb('info', `<b>${K.plural(sug.length, 'answer')} can come from the evidence:</b> ${esc(C.list(by.map(([r, n]) => `${C.rname(r.id)} ${n}`)))}. Nothing is saved until you accept.`,
      K.btn({ act: 'accept-all', label: sug.length > 1 ? `Accept ${sug.length} suggestions` : 'Accept the suggestion', kind: 'primary', cls: 'sm' })) : '';
    return K.section(CHECKS[3].title, bar + mSwitch(rs, r => ROLL_KIND[C.checkState(CHECKS[3], r)]) + checksGrid([CHECKS[3]], rs, { suggest: true }), {
      id: 'pl-check-4', number: 4, desc: CHECKS[3].q, link: [CHECKS[3].href, 'Guidance'],
    }) + foldNote();
  }

  function vCapability() {
    const steps = [['latency', 'Latency'], ['pricing', 'Pricing'], ['questions', 'Check 4 questions']];
    const tabs = `<div class="pl-evidence-tabs" role="group" aria-label="Check 4 evidence and questions">${steps.map(([id, label], i) =>
      `<button type="button" data-act="evidence" data-arg="${id}" class="${ui.capability === id ? 'on' : ''}" aria-pressed="${ui.capability === id}"><span>${i + 1}</span>${label}</button>`).join('')}</div>`;
    return K.head('Check 4 · Regional capability and availability', CHECKS[3].q) + tabs +
      (ui.capability === 'pricing' ? vPricing(true) : ui.capability === 'questions' ? capabilityQuestions() : vLatency(true));
  }

  // One summary tile for every evidence tab: region, status word with its glyph, the headline number, one line of context.
  const ARROW = { lo: '▼', hi: '▲' };
  function tile(name, kind, word, value, unit, cap) {
    const g = ARROW[kind] ? `<span class="pl-arr" aria-hidden="true">${ARROW[kind]}</span>` : status(kind);
    return `<div class="pl-tile"><p class="pl-tile-h"><span class="pl-tile-l">${esc(name)}</span><span class="pl-tile-s k-${kind}">${g}<span>${esc(word)}</span></span></p>` +
      `<p class="pl-tile-v">${value}${unit ? ` <span>${esc(unit)}</span>` : ''}</p>${cap ? `<p class="pl-cap">${esc(cap)}</p>` : ''}</div>`;
  }

  // ───────────── Services
  const AV = { yes: ['success', 'Available'], no: ['error', 'Not available'], global: ['globe', 'Global'], none: ['neutral', 'No data'] };
  function avCell(s, rid, st) {
    const [k, text] = AV[st];
    const ic = k === 'globe' ? icon('globe', { cls: 'pl-av-globe' }) : status(k);
    const zones = C.zoneText(C.availabilityDetails(s, rid)), date = D.availabilityMeta && K.fmtDate(D.availabilityMeta.generated);
    const tipText = `${text}\n${[s.service, s.product, s.sku].filter(Boolean).join(' / ')} in ${C.rname(rid)}${date ? '. Imported ' + date + '.' : ''}${zones ? '\nReported zone counts across matching entries: ' + zones : ''}`;
    return `<span class="pl-av" ${nameTip(tipText)} aria-label="${esc(text + ': ' + s.service + ' in ' + C.rname(rid) + (zones ? ', ' + zones : ''))}">${ic}<span class="pl-av-t">${text}</span></span>${zones ? `<span class="pl-av-meta">${esc(zones)}</span>` : ''}`;
  }
  function productCell(s) {
    const prods = D.svc[s.service] && D.svc[s.service].products;
    const cb = K.combo('prod-' + s.id, { mode: 'value', clearable: true, ph: 'Any product', label: 'Product of ' + s.service, display: () => s.product || '',
      disabled: !D.hasAvailability || !prods || !Object.keys(prods).length,
      items: () => Object.keys(prods || {}).sort().map(p => ({ value: p, label: p })), onPick: it => { s.product = it.value; s.sku = ''; }, onClear: () => { s.product = ''; s.sku = ''; K.hooks.commit(); } });
    return s.product ? `<span class="pl-prtip" data-tip="${esc(s.product)}">${cb}</span>` : cb;
  }
  function skuCell(s) {
    const options = C.skuOptions(s);
    return K.combo('sku-' + s.id, { mode: 'value', clearable: true, ph: !s.product || options.length ? 'Any SKU' : 'No specific SKU information', label: 'SKU of ' + s.service,
      disabled: !options.length, display: () => s.sku || '',
      items: () => options.map(sku => ({ value: sku, label: sku })), onPick: it => { s.sku = it.value; },
      onClear: () => { s.sku = ''; K.hooks.commit(); } });
  }
  function selectionWarning(s) {
    if (!D.hasAvailability || C.serviceSelection(s)) return '';
    const service = D.svc[s.service], product = service && service.products[s.product], sku = product && product.skus[s.sku];
    const message = sku && sku.generic
      ? 'Generic availability entry, not a specific SKU. Clear the SKU to use all matching availability or select a specific SKU.'
      : 'Saved selection not in this catalog. Clear the product/SKU or remove and re-add the service.';
    return `<span class="pl-cap">${esc(message)}</span>`;
  }
  function svcTiles() {
    const rs = C.active();
    if (!D.hasAvailability || !C.named().length || !rs.length) return '';
    return `<div class="pl-tiles">${rs.map(r => { const a = C.availSummary(r.id);
      const miss = a.missing.length ? `Missing: ${a.missing.slice(0, 3).join(', ')}${a.missing.length > 3 ? ` +${a.missing.length - 3} more` : ''}` : a.none ? `${a.none} with no data` : '';
      const z = C.info(r.id).zones;
      const [kind, word] = a.ok === a.total ? ['success', 'All available'] : a.missing.length ? ['error', 'Gaps'] : ['warning', 'Check'];
      return tile(C.rname(r.id), kind, word, `${a.ok} of ${a.total}`, 'available', miss || (z === true ? 'Zones: yes' : z === false ? 'Zones: no' : '')); }).join('')}</div>`;
  }
  function vServices(embedded = false) {
    const S = C.S, cs = C.cols(), full = S.services.length >= MAX_SERVICES;
    const add = K.combo('svc', { mode: 'add', ph: 'Add a service', label: 'Add a service', disabled: full,
      items: () => (D.hasAvailability ? D.services.map(s => ({ value: s.name, label: s.name, group: s.family || 'Other' })).sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label))
        : STARTER_SERVICES.map(n => ({ value: n, label: n }))),
      onPick: it => { if (S.services.length < MAX_SERVICES) S.services.push({ id: C.uid('v'), service: it.value, product: '', sku: '', weight: '' }); },
      onFree: D.hasAvailability ? null : (t => { if (S.services.length < MAX_SERVICES) S.services.push({ id: C.uid('v'), service: t, product: '', sku: '', weight: '' }); }) });
    const rows = S.services.map((s, i) => `<tr><td class="pl-idx">${i + 1}</td><th scope="row" class="pl-sn">${esc(s.service)}${selectionWarning(s)}</th><td class="pl-pr">${productCell(s)}</td><td class="pl-pr pl-sku">${skuCell(s)}</td>` +
      cs.map(x => { const st = C.availability(s, x.id); return `<td class="${x.current ? 'is-cur ' : ''}av-${st}">${avCell(s, x.id, st)}</td>`; }).join('') + `<td class="pl-x">${K.iconBtn('rm-svc', s.id, 'close', 'Remove ' + s.service)}</td></tr>`).join('');
    const table = S.services.length ? K.scroll(`<table class="pl-dl pl-mx"><thead><tr><th scope="col" class="pl-idx">#</th><th scope="col">Service</th><th scope="col">Product</th><th scope="col">SKU</th>` +
      cs.map(x => `<th scope="col" class="${x.current ? 'is-cur' : ''}">${esc(C.rname(x.id))}${x.current ? '<span class="pl-cap">Current region</span>' : ''}</th>`).join('') + `<th scope="col" aria-label="Remove"></th></tr></thead><tbody>${rows}</tbody></table>`, { cls: 'pl-services-scroll', label: 'Service availability by region' })
      : K.empty('list', 'No services listed yet. Add the services the workloads expect to use.');
    const date = D.availabilityMeta && K.fmtDate(D.availabilityMeta.generated);
    const note = `<p class="pl-fn">${D.hasAvailability ? `CSV imported ${esc(date)}. Availability and AZ counts are indicative; ` : ''}confirm features, capacity, and access in your subscriptions. ` +
      '<a href="https://azure.microsoft.com/explore/global-infrastructure/products-by-region/table" target="_blank" rel="noopener">Products available by region</a></p>';
    return (embedded ? '' : K.head('Services', 'Add the same service again to compare different products or SKUs.')) + foldNote() +
      (!D.hasAvailability ? K.mb('warning', esc(D.asFile ? AS_FILE : D.availabilityError || 'No service availability catalog is published. Import the availability CSV first.')) : '') +
      `<div class="pl-bar">${add}${S.services.length ? '' : K.btn({ act: 'add-starter', label: 'Add common platform services', kind: 'secondary' })}<span class="pl-count">${S.services.length} of ${MAX_SERVICES}</span>${full ? '<span class="pl-cap">Remove one to add another.</span>' : ''}</div>` +
      (embedded ? '' : svcTiles()) + (cs.length ? '' : '<p class="pl-muted">Add regions in Scope to see a column for each one.</p>') + table + note;
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
    return C.active().map(r => { const p = C.priceSummary(r.id), v = p.value;
      const cap = !D.hasCatalog ? 'No price snapshot' : v === null ? (S.ui.weighted && p.avg !== null ? 'Enter spend shares to weight the average' : 'No comparable prices') : `${S.ui.weighted ? 'spend-weighted average' : 'average'} of ${K.plural(p.n, 'service')} vs ${base}`;
      const t = C.priceTone(v), [kind, word] = t === 'n' ? ['neutral', 'No data'] : t === 'z' ? ['neutral', 'Same'] : v < 0 ? ['lo', 'Lower'] : ['hi', 'Higher'];
      return tile(C.rname(r.id), kind, word, v === null ? K.EM : C.fmtPct(v), '', cap); }).join('');
  }
  function priceFoot() {
    const S = C.S, rows = C.priceRows();
    return `<tr><th scope="row">${S.ui.weighted ? 'Weighted average' : `Average`}</th>${S.ui.weighted ? '<td></td>' : ''}` +
      C.active().map(r => { const v = C.priceSummary(r.id).value; return `<td><div class="pl-pc"><span class="pl-pc-v">${v === null ? K.EM : C.fmtPct(v)}</span>${divBar(v)}</div></td>`; }).join('') + '</tr>';
  }
  function vPricing(embedded = false) {
    const S = C.S, rs = C.active(), rows = C.priceRows();
    const note = K.mb('warning', '<b>List prices only</b> — USD, pay-as-you-go. Negotiated discounts, reservations, savings plans, Azure Hybrid Benefit, and other incentives are not included.');
    const h = (embedded ? '' : K.head('Pricing', 'List-price difference between the current region and each region you are qualifying.')) + foldNote() + note +
      (D.mappingError ? K.mb('warning', esc(D.mappingError)) : '');
    if (!S.current.length) return h + K.empty('tag', 'Add a current region to compare prices with.', 'scope');
    if (!S.regions.length) return h + K.empty('tag', 'Add the regions to qualify first.', 'scope');
    if (!rs.length) return h + K.empty('tag', 'Every region is ruled out by checks 1 to 3.', 'checks', 'Go to checks 1 to 3');
    if (!rows.length) return h + snapshotBar() + K.empty('list', 'Add the services the workloads expect to use.', 'services', 'Go to Check 3.5');
    const base = C.rname(S.baseline), w = S.ui.weighted;
    const body = rows.map(s => `<tr><th scope="row">${esc(s.service)}${s.service !== s.availabilityService || s.pricingNote ? `<span class="pl-cap">${esc(s.pricingNote || 'Selected: ' + s.availabilityService)}</span>` : ''}</th>` +
      (w ? `<td><span class="pl-pct">${K.inp(`svc/${s.id}/weight`, s.weight, { type: 'number', min: 0, max: 100, step: 1, label: 'Spend share of ' + s.service + ' in percent' })}<i>%</i></span></td>` : '') +
      rs.map(r => { const d = C.priceDiff(s.retailService, r.id);
        const t = d ? `Median over ${d.n.toLocaleString('en-US')} meters that both regions have\n${s.service}: ${C.rname(r.id)} vs ${base}` : `No comparable meters\n${s.service}: ${C.rname(r.id)} vs ${base}`;
        return `<td><div class="pl-pc" ${nameTip(t)} aria-label="${esc(s.service + ' in ' + C.rname(r.id) + ': ' + (d ? C.fmtPct(d.p) || '0.0%' : 'no data'))}"><span class="pl-pc-v">${d ? (C.fmtPct(d.p) || '0.0%') : 'No data'}</span>${divBar(d ? d.p : null)}</div></td>`; }).join('') + '</tr>').join('');
    return h + snapshotBar() + '<section class="pl-sec"><div class="pl-price-summary">' +
      `<div class="pl-price-controls"><label class="pl-label-i" for="f-baseline">Compare with</label>${K.sel('baseline', S.baseline, S.current.map(x => [x.id, C.rname(x.id)]), { id: 'f-baseline', label: 'Compare with', empty: 'Select a region' })}` +
      `<div class="pl-inline">${K.toggle('ui/weighted', w, 'Weight by spend share')}<span class="pl-label-i">Weight by spend share</span></div></div>` +
      `<div class="pl-tiles" id="pl-ptiles">${priceTiles()}</div></div>` +
      K.scroll(`<table class="pl-dl pl-mx pl-pt"><thead><tr><th scope="col">Service</th>${w ? '<th scope="col">Spend share</th>' : ''}${rs.map(r => `<th scope="col">${esc(C.rname(r.id))}<span class="pl-cap">vs ${esc(base)}</span></th>`).join('')}</tr></thead>` +
        `<tbody>${body}</tbody><tfoot id="pl-pfoot">${priceFoot()}</tfoot></table>`, { label: 'Price difference by service and region' }) +
      priceLegend(base) + '</section>';
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

  function siteIdentity(s) {
    const city = s.city, isCity = s.kind === 'city';
    const sub = isCity ? [city && city.a && city.a !== city.n ? city.a : '', city ? city.c : '', city && KIND[city.k]].filter(Boolean).join(' · ') : 'Peering location';
    return `<span class="pl-rn">${icon(isCity ? 'building' : 'peering', { cls: 'pl-rn-ic' })}<span><b>${esc(C.siteName(s))}</b><span class="pl-cap">${esc(sub)}</span></span></span>`;
  }
  function sitePeeringControl(s) {
    if (!D.lat) return `<span class="pl-muted">${esc(s.peering || 'No peering data')}</span>`;
    return K.combo('pl-' + s.id, { mode: 'value', clearable: true,
      ph: C.sitePeering(s) ? `Nearest: ${C.sitePeering(s)} (estimated)` : 'Select a peering location',
      label: 'Peering location for ' + C.siteName(s), display: () => s.peering,
      items: () => C.peeringChoices(s.city).map(p => ({ value: p.name, label: p.name, sub: p.ms + ' ms (estimated)' })),
      onPick: it => { s.peering = it.value; },
      onClear: () => { s.peering = ''; K.hooks.commit(); } });
  }
  function scopeLocations(kind) {
    const S = C.S, L = D.lat, isCity = kind === 'city', sites = S.sites.filter(s => s.kind === kind);
    const usedCities = () => new Set(S.sites.filter(s => s.kind === 'city' && s.city).map(s => D.cities ? D.cities.key(s.city) : ''));
    const usedPeering = () => new Set(S.sites.filter(s => s.kind === 'peering').map(s => s.peering));
    const add = isCity ? K.combo('city', { mode: 'add',
      ph: D.citiesState === 'loading' ? 'Loading cities' : 'Add a datacenter city', label: 'Add a datacenter city',
      disabled: !!L && (D.citiesState === 'idle' || D.citiesState === 'loading'),
      items: () => D.cities ? D.cities.cities.filter(c => !usedCities().has(D.cities.key(c))).map(c => ({ value: D.cities.key(c), label: c.n, sub: `${c.a || c.n}, ${c.c}`, group: c.c, tag: KIND[c.k] || '', city: c })) : [],
      onPick: it => { S.sites.push({ id: C.uid('s'), kind: 'city', city: { ...it.city }, peering: '', target: '', edits: {} }); },
      onFree: !L || D.citiesState === 'none' ? (t => { S.sites.push({ id: C.uid('s'), kind: 'city', city: { n: t, a: t, c: '', cc: '', k: 'city' }, peering: '', target: '', edits: {} }); }) : null,
    }) : K.combo('peer', { mode: 'add', showAll: true, ph: 'Add a peering location', label: 'Add a peering location',
      items: () => L ? L.peering.filter(p => !usedPeering().has(p.name)).map(p => ({ value: p.name, label: p.name, sub: [p.city, p.country].filter(Boolean).join(', ') })) : [],
      onPick: it => { S.sites.push({ id: C.uid('s'), kind: 'peering', city: null, peering: it.value, target: '', edits: {} }); },
      onFree: L ? null : (t => { if (!usedPeering().has(t)) S.sites.push({ id: C.uid('s'), kind: 'peering', city: null, peering: t, target: '', edits: {} }); }),
    });
    const warning = !L ? K.mb('warning', esc(D.asFile ? AS_FILE : 'Location reference data is unavailable. You can record names, but latency estimates may be unavailable.'))
      : isCity && D.citiesState === 'none' ? K.mb('warning', 'The city catalog could not be loaded. You can record a location name, but automatic city-based latency estimates may be unavailable.') : '';
    const rows = sites.map(s => `<tr><th scope="row">${siteIdentity(s)}</th>${isCity ? `<td class="pl-pl">${sitePeeringControl(s)}</td>` : ''}` +
      `<td>${K.inp(`site/${s.id}/target`, s.target, { type: 'number', min: 0, label: 'Target in milliseconds for ' + C.siteName(s) })}</td>` +
      `<td class="pl-x">${K.iconBtn('rm-site', s.id, 'close', 'Remove ' + C.siteName(s))}</td></tr>`).join('');
    return warning + `<div class="pl-add">${add}</div>` + (sites.length
      ? K.scroll(`<table class="pl-dl pl-sites"><thead><tr><th scope="col">${isCity ? 'Datacenter location' : 'Peering location'}</th>${isCity ? '<th scope="col">Peering path</th>' : ''}<th scope="col">Target (ms)</th><th scope="col" aria-label="Remove"></th></tr></thead><tbody>${rows}</tbody></table>`, { label: isCity ? 'On-premises datacenters' : 'ExpressRoute peering locations' })
      : `<p class="pl-muted">${isCity ? 'No datacenters added. Leave this empty for a cloud-only plan.' : 'No peering locations added.'}</p>`) +
      (isCity && sites.length ? '<p class="pl-hint">Without an explicit peering path, Latency estimates the route through the nearest peering location. This is not a confirmed connection.</p>' : '');
  }

  function pathDiagram() {
    const node = (ic, label) => `<div class="pl-node"><span class="pl-node-ic">${icon(ic)}</span><span class="pl-node-l">${label}</span></div>`;
    const link = (label, sub) => `<div class="pl-leg"><span class="pl-leg-t"><span class="pl-leg-l">${label}</span><span class="pl-leg-n">${sub}</span></span><span class="pl-leg-line"></span></div>`;
    return `<div class="pl-path" role="img" aria-label="Your location, provider network (first leg), ExpressRoute peering location, Microsoft backbone (second leg), Azure region">${node('building', 'Your location')}${link('Provider network', 'First leg')}${node('peering', 'ExpressRoute peering location')}${link('Microsoft backbone', 'Second leg')}${node('cloud', 'Azure region')}</div>`;
  }
  // The bar reveals a gradient that is fixed to the scale, so the color at any point depends on the milliseconds there, not on the row.
  function latBar(ms, target = null) {
    const p = C.latPos(ms);
    return `<span class="pl-hbar" aria-hidden="true">${ms > 0 ? `<i style="--p:${p.toFixed(4)}"></i>` : ''}${target !== null ? `<u class="pl-lat-target" style="left:${C.latPos(target) * 100}%"></u>` : ''}</span>`;
  }
  // One legend for both tables. The graphic is decorative; the sentence carries the same information.
  function latLegend() {
    const m = C.latScale.marks;
    const ticks = m.map((v, i) => `<span class="pl-latlg-t" style="left:${(C.latPos(v) * 100).toFixed(1)}%"><span${i === 0 ? ' class="first"' : i === m.length - 1 ? ' class="last"' : ''}>${v}${i === m.length - 1 ? '+' : ''}</span></span>`).join('');
    return `<div class="pl-latlg"><span class="pl-latlg-l">Round-trip latency, in ms</span><div class="pl-latlg-m"><span class="pl-latlg-bar" aria-hidden="true"></span><span class="pl-latlg-ticks" aria-hidden="true">${ticks}</span></div>` +
      '<p class="pl-latlg-n">Equal-width scale steps; full at 250 ms. Green through 30, yellow at 60, red at 120, dark red from 200. The marker shows your target.</p></div>';
  }
  function vBetween() {
    const S = C.S;
    const rs = C.active();
    if (!S.current.length || !rs.length) return '<p class="pl-muted">Add current regions and regions to qualify in Scope to compare them.</p>';
    const grid = S.current.map(f => rs.map(t => C.regionLatency(f.id, t.id)));
    const rows = S.current.map((f, i) => `<tr><th scope="row"><b>${esc(C.rname(f.id))}</b></th>` + rs.map((t, j) => {
      const l = grid[i][j];
      if (!l) return `<td><span class="pl-muted">No data</span></td>`;
      const tipT = `${l.ms} ms, ${l.src === 'm' ? 'measured' : 'estimated'}\n${C.srcText(l.src)}\n${C.rname(f.id)} to ${C.rname(t.id)}`;
      return `<td><div class="pl-bc" ${nameTip(tipT)} aria-label="${esc(`${C.rname(f.id)} to ${C.rname(t.id)}: ${l.ms} milliseconds, ${l.src === 'm' ? 'measured' : 'estimated'}`)}"><span class="pl-bc-v pl-n">${l.ms} ms</span>${dot(l.src)}${latBar(l.ms)}</div></td>`; }).join('') + '</tr>').join('');
    return K.scroll(`<table class="pl-dl pl-mx"><thead><tr><th scope="col">From</th>${rs.map(r => `<th scope="col">${esc(C.rname(r.id))}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`, { label: 'Latency between regions' }) +
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
      const g = lat.legs, legsTip = legsT ? [`${legsT} = ${lat.ms} ms`, `${g[0].ms} ms from ${name} to the ${g[1].from} peering location (provider network)`, `${g[1].ms} ms from there to ${rn} (Microsoft backbone)`].join('\n') : '';
      return `${latBar(lat.ms, t)}${lat.edited ? `<span class="pl-lc-ed"><span class="pl-tag brand">Edited</span><button type="button" class="pl-btn subtle icon sm" data-act="reset-edit" data-arg="${esc(s.id)}|${esc(rid)}" aria-label="Restore the calculated value for ${esc(name)} to ${esc(rn)}" data-tip="${lat.calc === null ? 'Remove the typed value' : 'Restore ' + lat.calc + ' ms'}">${icon('reset')}</button></span>` : ''}` +
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
    const peer = C.sitePeering(s);
    return `<tr><th scope="row">${siteIdentity(s)}</th>` +
      `<td class="pl-pl"><span class="pl-pl-v">${esc(peer || K.EM)}</span>${s.kind === 'city' && !s.peering && peer ? '<span class="pl-cap">Nearest (estimated)</span>' : ''}</td>` +
      `<td class="pl-tg">${s.target === '' ? K.EM : esc(s.target)}</td>${cs.map(x => siteCell(s, x.id)).join('')}</tr>`;
  }
  function latTiles() {
    const S = C.S, rs = C.active();
    if (!S.sites.length || !rs.length || !S.sites.some(s => C.num(s.target) !== null)) return '';
    return `<div class="pl-tiles">${rs.map(r => { const l = C.latencySummary(r.id), w = C.latencyWorst(r.id);
      if (!l.total) return tile(C.rname(r.id), 'neutral', 'No data', K.EM, '', 'No values for the locations with a target');
      const ok = l.within === l.total;
      const cap = w ? `${ok ? 'closest margin' : 'worst'} ${w.name}, ${w.ms} of ${w.target} ms` : '';
      return tile(C.rname(r.id), ok ? 'success' : 'error', ok ? 'Within target' : 'Over target', `${l.within} of ${l.total}`, 'within target', cap); }).join('')}</div>`;
  }
  function vLatency(embedded = false) {
    const S = C.S, cs = C.cols();
    const h = embedded ? '' : K.head('Latency', 'Round-trip latency from your locations and current regions to each region, in milliseconds.');
    if (!cs.length) return h + K.empty('clock', 'Add your current regions and the regions to qualify first.', 'scope');
    const L = D.lat;
    const table = S.sites.length ? K.scroll(`<table class="pl-dl pl-mx pl-lt"><thead><tr><th scope="col">Location</th><th scope="col">Peering location</th><th scope="col">Target (ms)</th>` +
      cs.map(x => `<th scope="col" class="${x.current ? 'is-cur' : ''}">${esc(C.rname(x.id))}${x.current ? '<span class="pl-cap">Current region</span>' : ''}</th>`).join('') + `</tr></thead><tbody>${S.sites.map(s => siteRow(s, cs)).join('')}</tbody></table>`, { label: 'Latency from your locations' })
      : '<p class="pl-muted">No locations yet. Add datacenters or ExpressRoute peering locations in Scope.</p>';
    return h + foldNote() +
      `<div class="pl-bar">${K.btn({ act: 'tab', arg: 'scope', label: 'Edit locations in Scope', kind: 'subtle', icon: 'edit' })}</div>` +
      (L ? '' : K.mb('warning', esc(D.asFile ? AS_FILE : 'No latency data is published with this site. Run site/tools/refresh_latency.py to create it.'))) +
      pathDiagram() +
      K.section('From your locations', table + latLegend() +
        `<p class="pl-fn pl-legend"><span class="pl-lg">${dot('m')}Measured</span><span class="pl-lg">${dot('e')}Estimated</span><span class="pl-lg"><span class="pl-tag brand">Edited</span>A value you typed over the calculated one</span></p>` +
        K.mb('info', `Region-to-region values are Microsoft’s published medians${L && L.dataset ? ` (dataset of ${esc(L.dataset)})` : ''}. Values that involve a peering location or a city are estimates based on those medians and on distance. Measure on the real path before you commit. ` +
          '<a href="https://learn.microsoft.com/azure/networking/azure-network-latency" target="_blank" rel="noopener">Azure network round-trip latency statistics</a>'), { desc: 'Type over any RTT value to replace it. The two legs appear below each calculated value.' }) +
      K.section('Between regions', vBetween()) + M.latencyMap.view();
  }

  M.views = Object.assign(M.views || {}, { scope: vScope, checks: vChecks, capability: vCapability, outcome: vOutcome, services: vServices, pricing: vPricing, latency: vLatency });
  M.viewTools = { noteCell, patchPricing, patchLatency, MAX_SERVICES, mSwitch, mRegion, foldNote };
})(window);
