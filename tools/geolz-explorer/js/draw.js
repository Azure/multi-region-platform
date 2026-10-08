/* draw.js: SVG rendering for the diagram, path overlay and failure marks. */
/* ===== DIAGRAM: static base (bands, regions, hubs, links, nodes, labels) ===== */
const layerAttr = layer => (layer ? ` data-layer="${layer}"` : '');  // the Layers switch (panels.js) can hide it
function nodeSvg(id, n) {
  const tx = n.badge ? n.x + 40 : n.x + 10, room = n.w - (tx - n.x) - 6;
  const fill = n.ms ? ` fill="${CATALOG.groups[n.group].color}"` : '';
  const badge = !n.badge ? '' : `<rect class="bd${n.ms ? '' : ' other'}" x="${n.x + 6}" y="${n.y + n.h / 2 - 9}"
    width="28" height="18" rx="3"${fill}/><text class="bdt${n.ms ? ' white' : ''}" x="${n.x + 20}"
    y="${n.y + n.h / 2 + 3.5}">${esc(n.badge)}</text>`;
  const sel = selAttr(selOfNode(id, n));  // editor-actions.js: click to edit
  const ty = n.y + n.h / 2 - 2, sy = n.y + n.h / 2 + 12;
  const sub = n.tag ? tagSvg(n, tx, sy)
    : `<text class="s" x="${tx}" y="${sy}">${esc(cut(n.sub || '', room / 5.6))}</text>`;
  return `<g class="node${n.ext ? ' ext' : ''}" data-id="${esc(id)}"${layerAttr(n.layer)}${sel}>
    <title>${esc(n.title || n.label)}</title>
    <rect class="b" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="4"/>${badge}
    <text class="t" x="${tx}" y="${ty}">${esc(cut(n.label, room / 7))}</text>${sub}</g>`;
}
// A tag in place of the sub-label (a hub's ExpressRoute gateway at maximum resiliency).
const tagSvg = (n, x, y) => `<g class="rtag"><rect x="${x - 3}" y="${y - 9}" width="${n.tag.length * 5.4 + 8}"
  height="12" rx="6"/><text x="${x + 1}" y="${y}">${esc(n.tag)}</text></g>`;
function labelSvg(l) {
  const bullet = l.group ? `<rect class="gb" x="${l.x - 10}" y="${l.y - 7.5}" width="7" height="7" rx="1.5"
    fill="${CATALOG.groups[l.group].color}"/>` : '';
  const anchor = l.anchor ? ` text-anchor="${l.anchor}"` : '';
  const peer = (l.peer ? ` data-peer="${l.peer}"` : '') + layerAttr(l.layer) + selAttr(l.sel);
  const pill = !l.peer ? '' : `<rect class="pill"${peer} x="${l.box.x - 4}" y="${l.box.y}" width="${l.box.w + 8}"
    height="${l.box.h}" rx="${l.box.h / 2}"/>`;  // a lane label's background, shown with it
  return `${bullet}${pill}<text class="${l.cls}" x="${l.x}" y="${l.y}"${anchor}${peer}>${esc(l.text)}</text>`;
}
// Region frame and header strip are tinted with the pattern colour (CSS variables from rules.js); in Virtual WAN the
// shared services VNet is a dashed box at the top of the spokes.
function regionSvg({ region, x, w, hub, box, sharedBox: sb }) {
  const id = patternId(region), top = RTOP, h = layout.bottom - RTOP, sel = selAttr('region:' + region.id);
  const dashed = RULES.patterns[id].dashed ? ' dashed' : '';
  let s = `<rect data-region="${region.id}" class="region pat-${id}${dashed}" x="${x}" y="${top}" width="${w}"
    height="${h}" rx="7"${sel}><title>${esc(azureFacts(region))}</title></rect>
    <path class="rhead pat-${id}"${sel} d="M${x} ${top + 44}V${top + 7}Q${x} ${top} ${x + 7} ${top}H${x + w - 7}
    Q${x + w} ${top} ${x + w} ${top + 7}V${top + 44}Z"/>
    <rect class="${hub.none ? 'ph-box' : 'hubbox'}" x="${hub.x}" y="${hub.y}" width="${hub.w}" height="${hub.h}"
    rx="5"/>
    <rect class="spokes" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="5"/>` + (!sb ? ''
    : `<rect class="svcnet" x="${sb.x}" y="${sb.y}" width="${sb.w}" height="${sb.h}" rx="4"/>`);
  return hub.none ? s : s + ['spoke', 'spoke2'].map(key => centre(layout.nodes[`${region.id}.${key}`])[0])
    .map(sx => `<path class="lnk" d="M${sx} ${hub.y + hub.h}V${box.y}"/>`).join('');
}
// Static links. Backbone lanes carry their connection key (data-peer): hub links are thin and unlabelled (tooltip);
// remote-hub peerings and lane labels appear only when the selected path uses them (drawPath). Then DNS zone links
// and hybrid wires.
function peerSvg(p) {  // connection kinds (hub, remote) are also the layer ids
  const cls = { remote: 'lnk x', hub: 'lnk hl' }[p.kind], d = roundPath(p.pts);
  const layer = layerAttr(p.kind);
  return `<g${selAttr(peerSel(p))}><title>${esc(p.text)}</title><path class="hit"${layer} d="${d}"/>` +
    `<path class="${cls}" data-peer="${p.key}"${layer} d="${d}"/></g>`;
}
function linksSvg() {
  const zones = layout.zoneLinks.map(pts => `<path class="lnk z" data-layer="dns" d="${roundPath(pts)}"/>`).join('');
  const wires = layout.wires.map(w => {  // data-conn / data-hub: a simulated link failure marks the failed lines
    const cls = `lnk ${w.provnet ? 'pn' : w.type === 'vpn' ? 'vpn' : 'er'}${w.backup ? ' bk' : ''}`;
    return `<g data-layer="${w.backup ? 'backup' : 'hybrid'}"${selAttr('conn:' + w.conn)}><title>${esc(w.title)}</title>
      <path class="hit" d="${roundPath(w.pts)}"/><path class="${cls}" data-conn="${esc(w.conn)}"
      data-hub="${w.hub || ''}" data-link="${w.link ?? ''}" d="${roundPath(w.pts)}"/></g>`;
  });
  // On-premises interconnects (layout.js): a click selects the first site, which holds the setting
  const ics = layout.interconnects.map(w => `<g data-layer="hybrid"${selAttr('site:' + w.a.slice(5))}>
    <title>${esc(w.title)}</title><path class="hit" d="${roundPath(w.pts)}"/><path class="lnk ic"
    data-ic="${w.conn}" d="${roundPath(w.pts)}"/></g>`).join('');
  const globals = layout.globalLinks.map(link => `<g data-layer="users"><title>${esc(link.title)}</title>
    <path class="lnk global ${link.kind}" d="${roundPath(link.pts)}"/></g>`).join('');
  return layout.peers.map(peerSvg).join('') + zones + globals + wires.join('') + ics;
}
// Ownership boundaries are the bands themselves (layout.js "owner"): one frame per owner, no second outline.
const OWNERS = { internet: 'Internet and users', azure: 'Microsoft Azure', network: 'Microsoft global network',
  provider: 'Connectivity provider', customer: 'Customer on-premises' };
function bandSvg(b) {
  const cls = b.area ? 'area' : b.owner ? `band owner ${b.owner}` : 'band';
  const tip = !b.owner ? '' : b.owner === 'internet' ? '<title>Outside every ownership boundary</title>'
    : `<title>Ownership boundary: ${OWNERS[b.owner]}</title>`;
  return `<rect class="${cls}"${layerAttr(b.layer)} x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"
    rx="${b.area ? 4 : 8}">${tip}</rect>`;
}
function drawBase() {
  const L = layout;  // shorthand
  // Arrowheads: 3.1 × the 3.4 px flow stroke = ROUTE.arrow long, tip 2/10 of it (ROUTE.tip) past the line end
  let s = '<defs>' + Object.entries(RULES.pathTypes).map(([id, t]) => `<marker id="arrow-${id}" viewBox="0 0 10 10"
    refX="8" refY="5" markerWidth="3.1" markerHeight="3.1" orient="auto">
    <path d="M0 0L10 5L0 10z" fill="${t.color}"/></marker>`).join('') + '</defs>';
  s += [...L.bands, ...L.areas].map(bandSvg).join('');
  s += L.regions.map(regionSvg).join('') + L.metroGroups.map(g => `<rect class="metrogrp" data-layer="hybrid"
    x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="6"><title>${esc(g.title)}</title></rect>`).join('');
  s += linksSvg();
  s += Object.entries(L.nodes).map(([id, n]) => nodeSvg(id, n)).join('') + L.labels.map(labelSvg).join('');
  $('diagram').innerHTML = s + '<g id="pathLayer"></g>';
}
// Where a hop goes from one owner to another (Users & internet, Microsoft Azure, the Microsoft global network, a
// connectivity provider, the customer): a short tick where the line crosses the band edge of the owner it leaves
// (or, leaving a provider box, of the owner it enters), named in its tooltip. VPN hops run over the
// internet, so their line passing the Microsoft bands is not a crossing.
const ownerOf = n => (n.region || (n.global && !n.ext) ? 'azure' : n.edge ? 'network' : n.prov ? 'provider'
  : n.site ? 'customer' : 'internet');
function crossings(a, b, pts, conn) {
  const type = conn && (hybridConnections(spec).find(c => c.id === conn) || {}).type;
  const from = ownerOf(a), to = ownerOf(b);
  if ((type && type !== 'expressroute') || from === to) return [];
  const inBand = n => layout.bands.find(x => x.owner && centre(n)[0] > x.x && centre(n)[0] < x.x + x.w &&
    centre(n)[1] > x.y && centre(n)[1] < x.y + x.h);
  const band = inBand(a) || inBand(b);
  if (!band) return [];
  for (const [p, q] of pts.slice(1).map((pt, i) => [pts[i], pt])) {
    const y = [band.y, band.y + band.h].find(e => p[0] === q[0] && (e - p[1]) * (q[1] - e) > 0);
    if (y !== undefined) return [{ x: p[0], y, text: `${OWNERS[from]} → ${OWNERS[to]}` }];
  }
  return [];
}
const crossingSvg = c => `<g class="xing"><title>Boundary crossing: ${esc(c.text)}</title>
  <path d="M${c.x - 7} ${c.y}H${c.x + 7}"/></g>`;

/* ===== DIAGRAM: path overlay (flows with dash pattern per type, numbered step markers) ===== */
function drawPath(path = currentPath()) {
  const svg = $('diagram'), shown = path || { steps: [] }, type = RULES.pathTypes[ui.type] || {};
  const mark = (i, x, y) => `<g class="mk${i === ui.step ? ' cur' : ''}"><circle cx="${x}" cy="${y}" r="9"/>
    <text x="${x}" y="${y}">${i + 1}</text></g>`;
  let segs = '', marks = '', ticks = [], prev = null, prevStep = null, pending = [];
  const used = new Set();  // backbone lanes on this path: drawn in full with their label
  shown.steps.forEach((step, i) => {
    const n = layout.nodes[step.id];
    if (!n) { pending.push(i); return; }  // e.g. the peering hop: marked on the next segment's lane
    if (prev) {
      const r = segment(prev, n, step.conn || prevStep.conn), later = ui.step >= 0 && i > ui.step ? ' later'
        : shown.globalStandby ? ' standby' : '';  // a backup origin on standby: drawn faint (engine.js)
      if (r.peer) used.add(r.peer);
      if (!later) ticks.push(...crossings(prev, n, r.pts, step.conn || prevStep.conn));
      segs += `<g class="seg${later}" stroke="${type.color}"><path class="casing" d="${r.d}"/>
        <path class="under" d="${r.d}"/>
        <path class="flow" d="${r.d}" stroke-dasharray="${type.dash}" marker-end="url(#arrow-${ui.type})"/></g>`;
      marks += pending.map(k => mark(k, ...r.mid)).join('');
    }
    marks += mark(i, n.x + 12, n.y);  // clear of an arrow into the node's upper left slot
    [pending, prev, prevStep] = [[], n, step];
  });
  // Steps after the last node (e.g. the DNS answer) are marked on that node's top-right corner
  if (prev) marks += pending.map((k, j) => mark(k, prev.x + prev.w - 22 * j, prev.y)).join('');
  $('pathLayer').innerHTML = segs + ticks.map(crossingSvg).join('') + failSvg(shown) + marks;
  if (type.color) svg.style.setProperty('--path', type.color);
  svg.classList.toggle('focus', !!prev);
  const ids = new Set(shown.steps.map(s => s.id)), cur = (shown.steps[ui.step] || {}).id;
  const selected = !ui.type && currentRegion().id;  // Overview: subtle frame on the selected region
  for (const r of svg.querySelectorAll('.region')) r.classList.toggle('sel', r.dataset.region === selected);
  for (const el of svg.querySelectorAll('[data-peer]')) el.classList.toggle('used', used.has(el.dataset.peer));
  for (const g of svg.querySelectorAll('.node')) {
    g.classList.toggle('on', ids.has(g.dataset.id)); g.classList.toggle('cur', g.dataset.id === cur);
  }
}

// Simulated failure (hybrid.js): the failed lines are marked; the ones at this hub (and the circuit lines below the
// peering locations) get a crossed marker, as do a failed peering location (a Metro area: both) and a failed provider.
function failSvg(path) {
  const st = path.failure, fails = st ? st.fails : [];
  const down = layout.wires.filter(w => fails.length && wireDown(spec, w, fails));
  for (const el of $('diagram').querySelectorAll('[data-conn]')) {
    el.classList.toggle('failed', down.some(w => w.conn === el.dataset.conn && (w.hub || '') === el.dataset.hub &&
      String(w.link ?? '') === el.dataset.link));
  }
  const circuit = id => hybridConnections(spec).find(c => c.id === id) || {};
  const locs = fails.filter(f => f.location).flatMap(f => (isMetroLocation(f.location)
    ? linkLocations({ peering_location: f.location }) : [f.location]));
  const boxes = [...locs.map(edgeId), ...fails.filter(f => f.provider).flatMap(f => sameProvider(spec,
    circuit(f.provider)).map(providerId))].map(id => layout.nodes[id]).filter(Boolean);
  for (const g of $('diagram').querySelectorAll('.node')) g.classList.toggle('down', boxes.some(n => n.key ===
    g.dataset.id));
  const crossed = down.filter(w => (!w.hub && !w.b.startsWith('prov.')) || w.hub === st.hub);
  const at = crossed.map(w => {
    const [p, q] = w.pts.slice(1).map((pt, i) => [w.pts[i], pt]).filter(([a, b]) => a[0] === b[0])
      .sort(([a, b], [c, d]) => Math.abs(d[1] - c[1]) - Math.abs(b[1] - a[1]))[0];  // the longest vertical piece
    return [p[0], (p[1] + q[1]) / 2];
  });
  const marks = [...at, ...boxes.map(n => [n.x + n.w - 14, n.y + n.h / 2])];
  return marks.map(([x, y]) => `<g class="xfail"><title>Failed
    (simulated)</title><circle cx="${x}" cy="${y}" r="8"/><path d="M${x - 4} ${y - 4}l8 8m0 -8l-8 8"/></g>`).join('');
}
