// Multi-region planner — the views of step 3: Regional design, and Review + export.
(function (global) {
  'use strict';
  const M = global.MRP, C = M.core, K = M.kit, { icon, status } = M, { esc } = K;
  const { O, PROFILES, PROFILE_QUESTIONS, HYBRID_DECISIONS, OUTCOME_ICON } = M;
  const ui = M.ui;
  const outcomeBadge = (o, lg) => K.badge(OUTCOME_ICON[o] || 'neutral', o, { lg });
  const yesNo = (ok, yes, no) => `<span class="pl-it">${status(ok ? 'success' : 'neutral')}<span>${ok ? yes : no}</span></span>`;

  function vDesign() {
    const picked = C.selected();
    const h = K.head('Regional design', 'Three choices for each selected region: connectivity profile, shared services, and hybrid connectivity.');
    if (!picked.length) return h + K.empty('lock', 'No region is selected yet.', 'capability', 'Go to the outcome');
    if (!picked.some(r => r.id === ui.region)) ui.region = picked[0].id;
    const r = C.reg(ui.region), d = C.design(r), e = C.effective(r), k = f => `des/${r.id}/${f}`, name = C.rname(r.id);
    const hubOpts = e.hubs.map(id => [id, C.rname(id)]);
    const switcher = picked.length ? `<div class="pl-pills" role="group" aria-label="Selected regions">${picked.map(x => { const done = C.effective(x).complete;
      return `<button type="button" class="pl-pill${x.id === r.id ? ' on' : ''}" data-act="region" data-arg="${esc(x.id)}" aria-pressed="${x.id === r.id}" aria-label="${esc(C.rname(x.id))}${done ? ', record complete' : ', record incomplete'}">${status(done ? 'success' : 'half')}<span>${esc(C.rname(x.id))}</span></button>`; }).join('')}</div>` : '';
    const state = e.complete ? K.mb('success', `The record for ${esc(name)} is complete.`) : K.mb('warning', `Still to decide: ${esc(C.list(e.missing))}.`);

    // choice 1
    const qs = PROFILE_QUESTIONS.map((q, i) => { const off = (i === 1 && d.q1 !== 'Yes') || (i === 2 && (d.q1 !== 'Yes' || d.q2 !== 'No'));
      return `<div class="pl-pq${off ? ' off' : ''}"><span class="pl-pq-n">${i + 1}</span><p>${esc(q.label)}</p>${K.seg(k(q.id), off ? '' : d[q.id], ['Yes', 'No'], { label: q.label, disabled: off })}</div>`; }).join('');
    const prof = PROFILES[e.pi];
    const cards = K.cards(k('profile'), e.profile, PROFILES.map(p => ({ id: p.id, title: p.id, text: p.gets, art: M.diagram.profile(p.id), tag: e.suggested === p.id ? 'Suggested' : '' })), { label: 'Connectivity profile', cls: 'profiles' });
    const differs = e.suggested && e.profile && e.profile !== e.suggested ? `<p class="pl-hint">The answers point to ${esc(e.suggested)}.</p>` : '';
    const secProfile = K.section('Connectivity profile', `<div class="pl-pqs">${qs}</div>${cards}${differs}${prof ? `<p class="pl-after"><a class="pl-link" href="${prof.href}">What to deploy for the ${esc(prof.id)} profile${icon('arrowright')}</a></p>` : ''}`,
      { id: 'pl-d-profile', link: ['profile-selection.html', 'Guidance'] });

    // hub and regional connectivity
    let secHub = '';
    const traffic = K.row('Traffic between spokes in the region', k('eastWest'), id => K.sel(k('eastWest'), e.eastWest, e.eastWestOptions, { id, label: 'Traffic between spokes in the region' }));
    if (e.profile && e.none) secHub = K.section('Hub and regional connectivity', traffic, { id: 'pl-d-hub' });
    else if (e.profile) {
      const topo = O.topology.map(id => ({ id, title: id, art: M.diagram.topology(id) }));
      secHub = K.section('Hub and regional connectivity',
        K.row('Hub Connections', k('hubConnections'), id => hubOpts.length ? K.combo('hubs-' + r.id, {
          mode: 'multi', inputId: id, ph: 'Select one or more regions', label: 'Hub Connections',
          display: () => C.effective(r).hubConnections.map(C.rname).join(', '),
          items: () => hubOpts.map(([value, label]) => ({ value, label })),
          selected: () => C.effective(r).hubConnections,
          onPick: it => { const chosen = C.effective(r).hubConnections; d.hubConnections = chosen.includes(it.value) ? chosen.filter(x => x !== it.value) : [...chosen, it.value]; }
        }) : '<span class="pl-muted">Add current regions in Scope.</span>',
          'Select one or more regions whose hubs this region connects to.') +
        K.rowRaw('Hub topology', K.cards(k('topology'), e.topology, topo, { label: 'Hub topology', cls: 'sm two' }), '', true) +
        K.row('Connectivity managed with', k('managed'), id => K.sel(k('managed'), e.managed, O.managed, { id, label: 'Connectivity managed with' })) +
        K.row('Connection to the hubs', k('link'), id => K.sel(k('link'), e.link, e.linkOptions, { id, label: 'Connection to the hubs', empty: e.linkOptions.length ? 'Select' : 'Select the hub topology first' })) + traffic, { id: 'pl-d-hub' });
    }

    // shared services: the ones the profile places by default fold into one line; the ones decided for this region are rows.
    let secSs = '';
    const fromProfile = e.ss.filter(x => x.isDefault && !x.custom), decided = e.ss.filter(x => !(x.isDefault && !x.custom));
    if (e.profile) {
      const ssRow = s => { const base = s.custom ? `custom/${s.id}` : `ss/${s.id}`, nm = s.name || 'new service';
        const mark = !s.p ? K.tag('Choose', 'warn') : s.isDefault ? K.tag('Default') : s.def && s.p !== s.def ? K.tag('Profile: ' + s.def) : '';
        const extra = (s.p === 'Remote' ? (hubOpts.length ? K.sel(k(base + '/from'), s.from, hubOpts, { label: 'Provided from', cls: 'sm' }) : '<span class="pl-muted">Add current regions in Scope</span>') : '') +
          (s.p && !s.isDefault ? K.inp(k(base + '/note'), s.note, { ph: 'Reason', label: 'Reason for the placement of ' + nm }) : '');
        return `<div class="pl-ssr"><div class="pl-ss-n"><span class="pl-ss-ic">${icon(s.icon || 'cloud')}</span><span>${s.custom ? K.inp(k(base + '/name'), s.name, { ph: 'Service name', label: 'Service name' }) : `<b>${esc(s.name)}</b>${s.hint ? `<span class="pl-cap">${esc(s.hint)}</span>` : ''}`}</span></div>` +
          `<div class="pl-ss-p">${K.seg(k(base + '/p'), s.p, O.placement, { label: 'Placement of ' + nm })}${mark}</div><div class="pl-ss-x">${extra}</div>` +
          `<div class="pl-ss-r">${s.custom ? K.iconBtn('rm-custom', s.id, 'close', 'Remove ' + nm) : ''}</div></div>`; };
      const showAll = ui.ssAll || !fromProfile.length;
      const group = fromProfile.length ? `<div class="pl-ssg"><div class="pl-ssg-h"><b>Set by the ${esc(e.profile)} profile</b>${K.btn({ act: 'ss-all', label: ui.ssAll ? 'Fold' : 'Change any', kind: 'subtle', cls: 'sm', pressed: !!ui.ssAll })}</div>` +
        (ui.ssAll ? '' : `<ul class="pl-chips">${fromProfile.map(x => `<li class="pl-chip">${esc(x.short || x.name)} <b>${esc(x.p === 'Remote' && x.from ? `Remote, ${C.rname(x.from)}` : x.p)}</b></li>`).join('')}</ul>`) + '</div>' : '';
      const rows = (showAll ? e.ss : decided).map(ssRow).join('');
      const reasons = decided.filter(x => x.p && x.note).length;
      secSs = K.section('Shared services', (e.hints.length ? K.mb('warning', e.hints.map(x => `<span class="pl-blk">${esc(x)}</span>`).join('')) : '') + group +
        (rows ? `${showAll ? '' : `<p class="pl-ssg-d"><b>Decided for this region</b><span>Reasons ${reasons} of ${decided.length}, optional</span></p>`}<div class="pl-ssl" role="group" aria-label="Shared services">${rows}</div>` : '') +
        `<div class="pl-bar">${K.btn({ act: 'add-custom', label: 'Add a shared service', icon: 'add' })}${K.btn({ act: 'ss-reset', label: 'Reset to profile defaults', icon: 'reset', kind: 'subtle' })}</div>`,
        { id: 'pl-d-ss', desc: 'Local is deployed in the region, remote is consumed from another hub, and global isn’t tied to a region.', link: ['platform-enablement-connectivity.html', 'Guidance'] });
    }

    // choice 3
    let secHy = '';
    if (e.profile) {
      const none = e.none;
      const dec = K.cards(k('hybrid'), e.hybrid, HYBRID_DECISIONS.map(x => ({ id: x.id, title: x.id, text: x.text, disabled: none && x.id !== 'Not required' })), { label: 'Hybrid connectivity decision', cls: 'plain' });
      let more = '';
      if (e.hybrid === 'Reuse' || e.hybrid === 'Change') {
        const circuits = [...new Map((C.D.lat ? C.D.lat.peering : []).map(p => [p.name, p])).values()]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(p => ({ value: `ExpressRoute circuit in ${p.name}`, label: `ExpressRoute circuit in ${p.name}`, sub: [p.city, p.country].filter(Boolean).join(', ') }));
        more += K.row('Existing connectivity', k('hybridUse'), id => K.combo('use-' + r.id, { mode: 'text', key: k('hybridUse'), inputId: id, describedBy: id + '-h', ph: 'For example, ExpressRoute circuit in Frankfurt', label: 'Existing connectivity',
          value: () => d.hybridUse || '', items: () => circuits, onPick: it => { d.hybridUse = it.value; } }) +
          `<p class="pl-hint" id="${id}-h">${circuits.length ? 'Suggestions are Azure ExpressRoute peering locations, not confirmation of an existing circuit. Latency-test cities do not create circuits.' : 'The Azure peering-location catalog is unavailable; no ExpressRoute locations are suggested.'} You can also type your existing connectivity.</p>`);
        more += K.row('How the region reaches on-premises locations', k('hybridPath'), id => K.sel(k('hybridPath'), e.hybridPath, e.pathOptions, { id, label: 'How the region reaches on-premises locations', empty: e.pathOptions.length ? 'Select' : 'No path is offered' }),
          e.pathOptions.length ? '' : 'Place the gateway as Local or Remote in Shared services to see the paths.');
      }
      if (e.hybrid === 'Change') {
        more += K.row('Requirement that justifies the change', k('hybridReason'), id => K.sel(k('hybridReason'), d.hybridReason, O.hybridReason, { id, label: 'Requirement that justifies the change' }));
        more += K.row('Change', k('hybridChange'), id => K.inp(k('hybridChange'), d.hybridChange, { id, ph: 'For example, a second circuit at another peering location', label: 'Change' }));
      }
      secHy = K.section('Hybrid connectivity', `${dec}${none ? '<p class="pl-hint">The No Hub profile has no private path to on-premises locations.</p>' : ''}${more ? `<div class="pl-subform">${more}</div>` : ''}`, { id: 'pl-d-hybrid', link: ['hybrid-connectivity.html', 'Guidance'] });
    }

    const secRec = K.section('Record',
      K.row('Owner', k('owner'), id => K.inp(k('owner'), d.owner, { id, ph: 'Team or person', label: 'Owner' })) +
      K.row('Decision date', k('date'), id => K.inp(k('date'), e.date, { id, type: 'date', label: 'Decision date' })) +
      K.row('Open conditions', `reg/${r.id}/conditions`, id => K.area(`reg/${r.id}/conditions`, r.conditions, { id, ph: 'None', rows: 3, label: 'Open conditions' }), 'The region isn’t ready for workloads until they are resolved.') +
      K.row('Reassess when', k('reassess'), id => K.area(k('reassess'), e.reassess, { id, rows: 6, label: 'Reassess when' })), { id: 'pl-d-record' });

    // The map is the one on the Latency tab, so here it waits behind a button.
    const secMap = ui.desMap ? `<div id="pl-d-map" class="pl-d-map">${M.latencyMap.view()}<div class="pl-bar">${K.btn({ act: 'des-map', label: 'Hide the map', kind: 'subtle' })}</div></div>`
      : `<div id="pl-d-map" class="pl-mapcard"><span class="pl-mapcard-ic">${icon('pin')}</span><div><b>Geographic view</b><p class="pl-cap">The Latency tab’s map of your regions and locations.</p></div>${K.btn({ act: 'des-map', label: 'Show the map' })}</div>`;

    // The outline: the parts of the record and their state, and the optional views.
    const hy = e.missing.filter(x => /hybrid|on-premises/.test(x)).length;
    const ol = [
      ['pl-d-profile', 'Connectivity profile', e.profile ? 'success' : 'none', e.profile ? e.profile + (e.profile === e.suggested ? ' (suggested)' : '') : 'Answer the three questions'],
      e.profile ? ['pl-d-hub', 'Hub and regional connectivity', 'success', e.none ? 'No hub' : [e.topology, e.managed].filter(Boolean).join(' · ') || 'Hub in the region'] : null,
      e.profile ? ['pl-d-ss', 'Shared services', e.ss.some(x => !x.p) ? 'half' : 'success', `${fromProfile.length} from the profile · ${decided.length} decided here`] : null,
      e.profile ? ['pl-d-hybrid', 'Hybrid connectivity', !e.hybrid ? 'none' : hy ? 'half' : 'success', e.hybrid || 'Not decided yet'] : null,
      ['pl-d-record', 'Owner, date, reassess when', 'success', [d.owner, e.date].filter(Boolean).join(' · ')],
    ].filter(Boolean);
    const olItem = ([id, t, st, sub]) => `<li><button type="button" class="pl-ol" data-act="jump" data-arg="${id}">${status(st)}<span><span class="pl-ol-t">${esc(t)}</span><span class="pl-ol-s">${esc(sub)}</span></span></button></li>`;
    const nav = `<nav class="pl-dz-nav" aria-label="Regional design outline"><p class="pl-ol-h">${picked.length > 1 ? 'Regions' : 'Region'}</p>${switcher}` +
      `<p class="pl-ol-h">Record</p><ul class="pl-ols">${ol.map(olItem).join('')}</ul>` +
      `<p class="pl-ol-h">Optional</p><ul class="pl-ols">${olItem(['pl-d-map', 'Geographic view', 'none', 'Map of regions and locations'])}${olItem(['pl-network', 'Advanced networking design', 'none', 'Hub-spoke or Virtual WAN diagram'])}</ul></nav>`;
    return h + `<div class="pl-dz">${nav}<div class="pl-dz-main">${state}${secProfile}${secHub}${secSs}${secHy}${secRec}${secMap}</div></div>`;
  }

  function vReview() {
    const S = C.S, picked = C.selected();
    const h = K.head('Review + export', 'The regional design record of each selected region.');
    if (!picked.length) return h + K.empty('lock', 'No region is selected yet.', 'capability', 'Go to the outcome');
    const bad = picked.map(r => ({ r, e: C.effective(r) })).filter(x => !x.e.complete);
    const valid = bad.length ? K.mb('warning', `<b class="pl-blk">${K.plural(bad.length, 'record')} still to complete.</b><ul class="pl-miss">${bad.map(x => `<li><button type="button" class="pl-linkbtn" data-act="goto-design" data-arg="${esc(x.r.id)}">${esc(C.rname(x.r.id))}</button>: ${esc(C.list(x.e.missing))}</li>`).join('')}</ul>`)
      : K.mb('success', 'All records are complete.');
    const reportMeta = [
      S.meta.name && `<span><b>Plan</b>${esc(S.meta.name)}</span>`,
      S.meta.owner && `<span><b>Owner</b>${esc(S.meta.owner)}</span>`,
      S.meta.date && `<span><b>Assessment date</b>${esc(S.meta.date)}</span>`,
    ].filter(Boolean).join('');
    const blocks = picked.map(r => { const e = C.effective(r), p = PROFILES[e.pi];
      return `<section class="pl-rec"><div class="pl-rec-h"><h3>${esc(C.rname(r.id))}</h3>${outcomeBadge(C.outcome(r))}${K.badge(e.complete ? 'success' : 'warning', e.complete ? 'Record complete' : 'Record incomplete')}</div>` +
        `<div class="pl-rec-b">${p ? `<div class="pl-rec-art">${M.diagram.profile(p.id)}</div>` : ''}<dl class="pl-kv">${C.record(r).slice(1).map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl></div>` +
        `${p ? `<p class="pl-after"><a class="pl-link" href="${p.href}">Prepare the region: ${esc(p.id)}${icon('arrowright')}</a></p>` : ''}</section>`; }).join('');
    const all = S.regions.map(r => { const sel = picked.includes(r), e = sel ? C.effective(r) : null;
      return `<tr><th scope="row">${esc(C.rname(r.id))}</th><td>${outcomeBadge(C.outcome(r))}</td><td>${yesNo(sel, 'Yes', 'No')}</td><td>${e && e.profile ? esc(e.profile) : K.EM}</td></tr>`; }).join('');
    return h + `<header class="pl-print-head"><p class="pl-print-kicker">Regional platform planning</p><h1>Multi-region planner report</h1>` +
      `${reportMeta ? `<div class="pl-print-meta">${reportMeta}</div>` : ''}<p class="pl-print-count">${K.plural(picked.length, 'region')} included · ${bad.length ? `${bad.length} record${bad.length === 1 ? '' : 's'} incomplete` : 'All records complete'}</p></header>` +
      valid + `<div class="pl-bar pl-noprint">${K.btn({ act: 'export', label: 'Export to Excel', icon: 'export' })}${K.btn({ act: 'copy', label: 'Copy as text', icon: 'copy' })}${K.btn({ act: 'print', label: 'Print', icon: 'print' })}</div>` +
      blocks + K.section('All regions in this plan', K.scroll(`<table class="pl-dl"><thead><tr><th scope="col">Region</th><th scope="col">Outcome</th><th scope="col">Selected</th><th scope="col">Connectivity profile</th></tr></thead><tbody>${all}</tbody></table>`, { label: 'All regions' }));
  }

  M.views.design = vDesign;
  M.views.review = vReview;
})(window);
