/* layout.js: diagram geometry, hybrid/circuit layout and route segment helpers. */
/* ===== LAYOUT: bands (users & internet, global services, areas, Microsoft backbone, on-premises) around one column
   per region: header strip, hub (or a compact "no hub" note),
     spoke container with spokes on a common baseline. ===== */
// A column: frame L.col wide (COL, wider for 3+ gateway lines); hub and spoke container HUB_W wide, PAD in from the
// left. Its left gutter, the right gutter (path lane, gateway lines 8 apart) and the gaps between columns (hub link
// lanes) keep routes 8+ px from edges.
const COL = 300, GAP = 28, M = 16, PAD = 20, HUB_W = 240, ROW = 42, ITEM = 36, SPOKE_H = 48, LANE = 20;
const RTOP = 232, HUB_TOP = 288;
// Bands and lanes above the regions: path lanes 22 px below the users and global nodes (room for an arrowhead), DNS
// zone links in their own lane above the global path lane.
const TOP_LANE = 106, GLOBAL_Y = 116, ZONE_LANE = 186, GLOBAL_LANE = 196, AREA_Y = 206;
const centre = n => [n.x + n.w / 2, n.y + n.h / 2];
const patternId = region => (RULES.patterns[region.pattern] ? region.pattern : 'full-hub');
// Every diagram label is placed here, so its box is known to the drawing code and the overlap test.
const LABEL_SIZE = { rname: 14, plabel: 11, title: 12, ph: 11.5, grp: 9.5, 'band-l': 10.5, lbl: 11,
  mg: 10.5, cap: 10.5, otag: 10.5 };
// Lines of at most n characters: a new line for each " · " part, long parts broken after a comma or space.
function wrapText(text, n) {
  return text.split(' · ').filter(Boolean).flatMap(part => {
    const lines = [''];
    for (const word of part.split(' ')) {
      if (lines.at(-1) && (lines.at(-1) + ' ' + word).length > n) lines.push(word);
      else lines[lines.length - 1] = (lines.at(-1) + ' ' + word).trim();
    }
    return lines;
  });
}
const labelWidth = (text, cls) => text.length * LABEL_SIZE[cls] * (/grp|band/.test(cls) ? 0.72 : 0.6) + 2;
function addLabel(L, text, x, y, cls, extra = {}) {
  const size = LABEL_SIZE[cls], w = labelWidth(text, cls);
  const left = { middle: x - w / 2, end: x - w }[extra.anchor] ?? x - (extra.group ? 10 : 0);
  L.labels.push({ text, x, y, cls, ...extra,
    box: { x: left, y: y - size, w: w + (extra.group ? 10 : 0), h: size * 1.3 } });
}
// A vertical stack of product nodes under small group labels; returns the y below the stack.
// Badges are coloured by group for Microsoft products; third-party products show the vendor name instead.
function placeStack(L, region, groups, x, y, hub) {
  for (const [group, roles] of groups) {
    addLabel(L, CATALOG.groups[group].label.toUpperCase(), x + 11, y + 10, 'grp', { group });
    y += 15;
    for (const role of roles) {
      const p = CATALOG.roles[role] ? productOf(spec, resolveRole(spec, region, role).product)  // topology.js
        : { vendor: 'Microsoft', points: [], ...CATALOG.generic[role] },
          ms = p.vendor === 'Microsoft';  // e.g. own_zones
      const r = CATALOG.roles[role] || {};
      L.nodes[`${region.id}.${role}`] = { x, y, w: HUB_W - 20, h: ITEM, region: region.id, hub, group, ms,
        layer: r.layer, label: p.short || p.label, sub: ms ? p.sub || r.label : p.vendor, badge: p.badge,
          title: [p.short && p.label + '.', ...p.points.map(t => t.text || t)].filter(Boolean).join(' ') };
      y += ROW;
    }
  }
  return y;
}
function placeHub(L, col) {
  const { region, x } = col, box = { x: x + PAD, y: HUB_TOP, w: HUB_W };
  addLabel(L, cut(region.name, 30), x + 12, RTOP + 20, 'rname');
  const geo = azureRegion(region);  // sub-label: geography (e.g. Germany) and pattern
  addLabel(L, (geo ? geo.geography + ' · ' : '') + patternOf(region).label, x + 12, RTOP + 37, 'plabel');
  if (patternOf(region).hub === 'none') {
    const remote = regionById(spec, region.remote_hub);
    addLabel(L, remote ? 'No local hub' : region.remote_hub ? 'No hub · remote hub missing' : 'No hub · isolated',
      box.x + 10, HUB_TOP + 19, 'ph');
    if (remote) addLabel(L, `→ ${cut(remote.name, 24)} hub`, box.x + 10, HUB_TOP + 35, 'ph', { layer: 'remote' });
    col.hub = { ...box, h: remote ? 46 : 30, none: true };
    return;
  }
  addLabel(L, topologyOf(spec).hub, box.x + 10, HUB_TOP + 18, 'title');
  if (isVwan(spec) && vwansOf(spec).length > 1) {  // several virtual WANs: which one this virtual hub is in
    addLabel(L, 'vWAN ' + cut(vwanOf(spec, region).name, 16), box.x + HUB_W - 10, HUB_TOP + 18, 'plabel',
      { anchor: 'end' });
  }
  const open = isVwan(spec) && !hubSecurity(spec, region);  // topology.js: a virtual hub without security says so
  const nva = open && vhubState(spec, region) === 'nva';
  const notes = [...wrapText(capabilityLine(spec, region), 34), ...(!open ? [] : [nva ? 'Firewall NVA: shared services'
    : 'No hub security · not inspected'])];
  notes.forEach((t, k) => addLabel(L, t, box.x + 10, HUB_TOP + 34 + k * 14, 'cap'));
  const bottom = placeStack(L, region, groupRoles(ownedRoles(spec, region).hub), box.x + 10,
    HUB_TOP + 28 + notes.length * 14, true);
  col.hub = { ...box, h: Math.max(40, bottom - HUB_TOP + 2) };
}
const stripHeight = col => (col.strip.length ? 19 + col.strip.length * ROW : 0);
// Virtual WAN: the region's shared services VNet, a spoke connected to the virtual hub, at the top of the spokes.
const sharedHeight = col => (col.shared.length ? 34 + groupRoles(col.shared).length * 15 + col.shared.length * ROW
  : 0);
function placeShared(L, col, x, y) {
  col.sharedBox = { x, y, w: HUB_W - 12, h: sharedHeight(col) - 8 };
  addLabel(L, 'Shared services VNet', x + 4, y + 16, 'title');
  placeStack(L, col.region, groupRoles(col.shared), x + 4, y + 22, false);
  return y + sharedHeight(col);
}
function placeSpokes(L, col, spokeY) {
  const { region, x } = col, left = x + PAD, w = HUB_W, top = spokeY - 24 - stripHeight(col) - sharedHeight(col);
  col.box = { x: left, y: top, w, h: spokeY + SPOKE_H + 10 - top };
  addLabel(L, 'SPOKES', left + 10, top + 15, 'grp');
  const y = col.shared.length ? placeShared(L, col, left + 6, top + 22) : top + 22;
  placeStack(L, region, col.strip.length ? [['spoke', col.strip]] : [], left + 10, y, false);
  for (const [key, dx] of [['spoke', 10], ['spoke2', w / 2 + 2]]) {  // 22 px from the left / right path lane
    L.nodes[`${region.id}.${key}`] = { x: left + dx, y: spokeY, w: w / 2 - 12, h: SPOKE_H, region: region.id,
      spoke: key, ...CATALOG.generic[key] };
  }
}
// text: one label or lines, right of the entry lanes (clearLabels may move it); layer: see panels.js
function addBand(L, text, y, h, layer) {
  const band = L.bands.push({ x: M - 8, y, w: L.width - 2 * (M - 8), h, layer }) - 1;
  [].concat(text).forEach((t, i) => addLabel(L, t.toUpperCase(), L.left + 2, y + 17 + i * 14, 'band-l',
    { band, layer }));
  return y + h;
}
// Backbone lanes (connections from topology.js): one lane and one label per connection. Hub links leave the left
// hub to the right, down the gap after its column (exit lanes 10, 18 … px right of the frame), and come up the gap
// before the right column (18, 26 … px left of its frame; the path entry lane is 10 px left). See gutters().
// Labels carry the connection key: app.js shows a label (and remote-hub lines) only when the
// selected path uses that connection. clearLabels later moves a label off any line that crosses it.
function planLanes(L, lane0) {
  const col = id => L.regions.find(c => c.region.id === id), conns = [];
  for (const c of backboneConnections(spec)) {
    const p = col(c.from), q = col(c.to), swap = c.kind !== 'remote' && p && q && p.x > q.x;
    if (p && q && p !== q) conns.push({ ...c, a: swap ? q : p, b: swap ? p : q });
  }
  const spokeX = (c, key) => centre(L.nodes[`${c.region.id}.${key}`])[0];
  conns.forEach((c, k) => {
    const { a, b } = c, laneY = lane0 + k * LANE;
    const into = conns.filter(o => o.b === b), j = into.indexOf(c);  // attach slot on b's hub
    const out = conns.filter(o => o.a === a && o.kind === 'hub').indexOf(c);  // exit slot on a's hub
    const srcX = c.kind === 'hub' ? a.x + L.col + 10 + out * 8 : spokeX(a, 'spoke');
    const dstX = b.x - 18 - j * 8;
    const own = L.nodes[a.region.id + '.firewall'], fw = own && own.hub ? own : L.nodes[a.region.id + '.hub_router'];
    // level with the hub firewall (or its port slots); a virtual hub without one: with its router
    const y0 = (fw ? centre(fw)[1] : a.hub.y + a.hub.h - 12) + out * 10, dstY = b.hub.y + 10 + j * 8;
    const start = c.kind === 'hub' ? [[a.hub.x + a.hub.w, y0], [srcX, y0]] : [[srcX, a.box.y + a.box.h]];
    const end = [[dstX, dstY], [b.hub.x, dstY]];
    const key = `${c.kind}:${a.region.id}:${b.region.id}`, text = connectionLabel(spec, c);
    L.peers.push({ key, text, from: a.region.id, to: b.region.id, kind: c.kind, laneY, srcX, dstX,
      pts: [...start, [srcX, laneY], [dstX, laneY], ...end] });
    const half = text.length * 3.3 + 4, wide = Math.abs(dstX - srcX) > 2 * half + 24;  // else right of the U
    const mid = wide ? (srcX + dstX) / 2 : Math.max(srcX, dstX) + 12 + half;
    const sel = peerSel({ kind: c.kind, from: a.region.id, to: b.region.id });  // editor-actions.js: click to edit
    addLabel(L, text, Math.min(Math.max(mid, M + half), L.width - M - half), laneY - 5, 'lbl',
      { anchor: 'middle', peer: key, layer: c.kind, sel });  // connection kinds are layer ids (panels.js)
  });
}
// The Microsoft Azure ownership boundary: the global services row (Azure-provided DNS, the global private DNS zones,
// an Azure global entry service) and every region column below it, so no Azure component sits outside it. Virtual
// network links run from the zones to every hub VNet that hosts a resolver.
function placeGlobal(L) {
  addBand(L, 'Microsoft Azure · Global services', GLOBAL_Y, L.bottom + 6 - GLOBAL_Y);
  L.bands.at(-1).owner = 'azure';
  ['azure_dns', 'dns_zones'].forEach((id, i) => { L.nodes[id] = { x: L.left + PAD + i * (L.col + L.gap),
    y: GLOBAL_Y + 22, w: HUB_W, h: ITEM, global: true, ms: true, group: 'shared', layer: 'dns',
    ...CATALOG.generic[id], sub: CATALOG.generic[id][isVwan(spec) ? 'vwanSub' : 'sub'] || CATALOG.generic[id].sub }; });
  const z = L.nodes.dns_zones, zx = centre(z)[0], up = L.nodes.azure_dns;
  // Virtual WAN: zones are linked to the shared services VNets (not to virtual hubs): no line, see the zones' sub-label
  L.zoneLinks = [[[up.x + up.w, centre(up)[1]], [z.x, centre(z)[1]]], ...L.regions
    .filter(c => !c.hub.none && !isVwan(spec) && (resolveRole(spec, c.region, 'dns') || {}).owner === c.region.id)
    .map(c => [[zx, z.y + z.h], [zx, ZONE_LANE], [c.hub.x + c.hub.w - 24, ZONE_LANE],
      [c.hub.x + c.hub.w - 24, c.hub.y]])];
  placeGlobalEntry(L);
}
// Global entry. Front Door and Traffic Manager are Azure global services: in the global services row, centred under
// Internet (a straight drop). A third-party global load balancer/CDN is not Azure: in the Users & internet band,
// left of Internet. diagramWidth() reserves the room for either. Origins are tagged in their region headers.
const THIRD_PARTY_W = 1080, THIRD_PARTY_GAP = 32;  // the gap holds a full arrow from Internet
function globalEntryWidth(L) {
  const type = globalEntry(spec).type;
  if (type === 'none') return 0;
  if (type === 'third-party') return THIRD_PARTY_W;
  const zonesRight = L.left + PAD + L.col + L.gap + HUB_W;  // the node must stay 24+ px right of the zones
  return Math.max(900, zonesRight + 24 + HUB_W / 2 + 136);
}
function placeGlobalEntry(L) {
  L.globalLinks = [];
  if (!globalEntryOn(spec)) return;
  const rule = globalEntryRule(spec), net = L.nodes.internet, count = role => globalOrigins(spec)
    .filter(o => o.role === role && o.region).length;
  const roles = `${count('active')} active · ${count('backup')} backup`;
  if (globalEntry(spec).type === 'third-party') {
    L.nodes.global_entry = { x: net.x - THIRD_PARTY_GAP - net.w, y: net.y, w: net.w, h: net.h, ext: true,
      layer: 'users', label: rule.short, sub: `${rule.kind} · ${roles}`, title: rule.label };
    return;
  }
  L.nodes.global_entry = { x: centre(net)[0] - HUB_W / 2, y: GLOBAL_Y + 22, w: HUB_W, h: ITEM, global: true,
    ms: true, group: 'connectivity', badge: rule.badge, label: rule.label,
    sub: `${rule.kind} · ${roles}`, title: rule.points[0].text };
  // Traffic Manager answers the DNS query only: a dotted line from Internet, beside the path's own drop.
  if (!rule.inPath) {
    const x = centre(net)[0] + 60;
    L.globalLinks.push({ kind: 'dns', title: 'DNS query to Traffic Manager', pts: [[x, net.y + net.h],
      [x, L.nodes.global_entry.y]] });
  }
}
// "Active origin" / "Backup endpoint" in the region header's second line, right-aligned; on the first line when
// the second has no room.
function placeOriginTags(L) {
  for (const col of L.regions) {
    const text = globalEntryOn(spec) && originTag(spec, col.region.id);
    if (!text) continue;
    const x = col.x + col.w - 12, w = labelWidth(text, 'otag');
    const busy = y => L.labels.some(l => l.box.y < y + 2 && l.box.y + l.box.h > y - 12 &&
      l.box.x + l.box.w > x - w - 8 && l.box.x < x);
    const y = [RTOP + 37, RTOP + 20].find(t => !busy(t));
    if (y) addLabel(L, text, x, y, 'otag', { anchor: 'end' });
  }
}
function placeBands(L) {
  const access = CATALOG.products[spec.defaults.private_user_access];  // optional private user access (ZTNA)
  addBand(L, 'Users & internet', 10, 86, 'users');
  L.bands.at(-1).owner = 'internet';  // outside every ownership boundary
  const wide = L.width >= 900, w = wide ? 220 : 170;  // the narrowest diagram (one region) still fits all three
  L.nodes.users = { x: M + 10, y: 36, w: wide ? 300 : 230, h: 48, ext: true, layer: 'users',
    label: CATALOG.generic.users.label, sub: access ? access.label : CATALOG.generic.users.sub };
  L.nodes.admins = { x: L.nodes.users.x + L.nodes.users.w + 16, y: 36, w, h: 48, ext: true, layer: 'users',
    ...CATALOG.generic.admins };  // Bastion users: the "Admin access (Bastion)" ingress path starts here
  L.nodes.internet = { x: L.width - M - w - 10, y: 36, w, h: 48, ext: true, layer: 'users',
    ...CATALOG.generic.internet };
  placeGlobal(L);
  planLanes(L, L.bottom + 52);
  const y = addBand(L, 'Microsoft global network', L.bottom + 14, Math.max(34, 26 + L.peers.length * LANE));
  L.bands.at(-1).owner = 'network';
  // Two passes: the first finds the turn lanes each hybrid band uses (the horizontal placement doesn't depend on
  // them), the second reserves only those, so lines that run straight down take no space.
  const keep = { nodes: new Set(Object.keys(L.nodes)), bands: L.bands.length, labels: L.labels.length };
  placeHybrid(L, y);
  const use = L.laneUse;
  Object.keys(L.nodes).filter(k => !keep.nodes.has(k)).forEach(k => delete L.nodes[k]);
  L.bands.length = keep.bands;
  L.labels.length = keep.labels;
  L.height = placeHybrid(L, y, use) + 10;
}

// One labelled band above each run of columns in the same area (e.g. "EUROPE", "AMERICAS").
function placeAreas(L) {
  for (const col of L.regions) {
    const area = areaOf(col.region), last = L.areas[L.areas.length - 1];
    if (last && last.area === area) last.w = col.x + L.col - last.x;
    else L.areas.push({ area, x: col.x, y: AREA_Y, w: L.col, h: 20 });
  }
  L.areas.forEach(a => addLabel(L, a.area.toUpperCase(), a.x + 14, AREA_Y + 14, 'band-l'));
}
/* ===== LAYOUT: label clearance (band titles and backbone lane labels never sit on a line) ===== */
// Vertical pieces [x, top, bottom] of the lines that cross bands: backbone lanes, hybrid lines, DNS zone links, and
// the drop from a remote-hub region's peer workload to its lane (the east-west hairpin path).
function verticalLines(L) {
  const drops = L.peers.filter(p => p.kind === 'remote').map(p => [L.nodes[p.from + '.spoke2'], p.laneY])
    .map(([n, y]) => [[centre(n)[0], n.y + n.h], [centre(n)[0], y]]);
  const lines = [...L.peers.map(p => p.pts), ...L.wires.map(w => w.pts), ...L.zoneLinks, ...drops];
  return lines.flatMap(pts => pts.slice(1).map((q, i) => [pts[i], q])).filter(([p, q]) => p[0] === q[0])
    .map(([p, q]) => [p[0], Math.min(p[1], q[1]), Math.max(p[1], q[1])]);
}
// Left x nearest to `want` for a box (w wide, from y0 to y1) that no vertical line crosses (6 px clear) inside the
// diagram; null when there is no such spot.
function freeX(L, want, w, [y0, y1]) {
  const blocks = verticalLines(L).filter(([, a, b]) => b > y0 && a < y1).map(([x]) => [x - 6, x + 6]);
  const free = x => x >= M && x + w <= L.width - M && !blocks.some(([a, b]) => x < b && x + w > a);
  const tries = [want, ...blocks.flatMap(([a, b]) => [b, a - w])].filter(free);
  return tries.sort((p, q) => Math.abs(p - want) - Math.abs(q - want))[0] ?? null;
}
// Band titles move sideways (their lines together) to the nearest spot no line crosses. A lane label does the same,
// and in a narrow diagram falls back to a shorter text: from the regions on (without "Global VNet peering"), then
// without a note in brackets, then the regions only. The lane's tooltip keeps the full text.
function clearLabels(L) {
  for (const title of L.bands.map((b, i) => L.labels.filter(l => l.band === i)).filter(t => t.length)) {
    const x = title[0].box.x, w = Math.max(...title.map(l => l.box.w)), y = title[0].box.y;
    const dx = (freeX(L, x, w, [y, title.at(-1).box.y + title.at(-1).box.h]) ?? x) - x;
    title.forEach(l => { l.x += dx; l.box.x += dx; });
  }
  for (const l of L.labels.filter(x => x.peer)) {
    const all = l.text.split(' · '), k = Math.max(1, all.findIndex(p => /[↔→]/.test(p)));  // from the regions on
    const parts = all.slice(k - 1), rest = parts.slice(1).join(' · ');
    const texts = [l.text, rest, rest.replace(/ \([^)]*\)/g, ''), parts[1]].filter(Boolean);
    for (const text of texts) {
      const w = labelWidth(text, l.cls), x = freeX(L, l.x - w / 2, w, [l.box.y, l.box.y + l.box.h]);
      if (x === null) continue;
      Object.assign(l, { text, x: x + w / 2 }); Object.assign(l.box, { x, w });
      break;
    }
  }
}
// Width of the gaps between columns and left of the first one: room for its hub link lanes (8 apart, 10+ px from
// the frames) and the path entry lane 10 px left of the column.
function gutters(order) {
  const index = id => order.findIndex(r => r.id === id), out = order.map(() => 0), into = order.map(() => 0);
  for (const c of backboneConnections(spec)) {
    const i = index(c.from), j = index(c.to);
    if (i < 0 || j < 0 || i === j) continue;
    if (c.kind === 'hub') out[Math.min(i, j)]++;
    into[c.kind === 'hub' ? Math.max(i, j) : j]++;
  }
  const gap = Math.max(GAP, ...order.slice(1).map((r, i) => 24 + 8 * (out[i] + into[i + 1])));  // 12+ px U-turn
  return { gap, left: Math.max(M + 12, 26 + 8 * into[0]) };
}
// Column width: a hub with 3+ gateway lines widens every column's right gutter by 8 px per extra line.
function columnWidth() {
  const lines = {};
  hybridConnections(spec).forEach(c => (c.connects_to || []).forEach(id => {
    lines[id] = (lines[id] || 0) + (c.type === 'expressroute' ? linkLocations(c).length : 1);
  }));
  return COL + 8 * Math.max(0, ...Object.values(lines).map(n => n - 2));
}
function layoutDiagram() {
  const L = { nodes: {}, labels: [], peers: [], bands: [], areas: [], interconnects: [],
    globalLinks: [] };
  const order = regionOrder(spec);
  const { gap, left } = gutters(order), n = order.length;
  Object.assign(L, { gap, left, col: columnWidth() });
  L.width = Math.max(660, left + n * L.col + Math.max(0, n - 1) * gap + M, globalEntryWidth(L));
  L.regions = order.map((region, i) => ({ region, x: left + i * (L.col + gap), w: L.col, shared: ownedRoles(spec,
    region).shared, strip: [...ownedRoles(spec, region).spoke, ...(patternOf(region).spokeExtras || [])] }));
  L.regions.forEach(col => placeHub(L, col));
  placeOriginTags(L);
  const spokeY = Math.max(HUB_TOP + 100, ...L.regions.map(c => c.hub.y + c.hub.h + 54 + stripHeight(c) +
    sharedHeight(c)));
  L.regions.forEach(col => placeSpokes(L, col, spokeY));
  L.bottom = spokeY + SPOKE_H + 30;
  placeBands(L); placeAreas(L); clearLabels(L);
  for (const [key, n] of Object.entries(L.nodes)) n.key = key;  // routes look up wires by node key
  return L;
}

/* ===== LAYOUT: hybrid connectivity (topology.js) below the backbone ===== */
// Left x of boxes (item.w wide), each centred as close as possible to its wanted x, never overlapping (gap apart) and
// inside the diagram. Boxes that would collide form a run centred on the mean of their wants (a stable nudge: ties
// keep the given order). Too many boxes for the width: spread evenly instead.
function spread(items, width, gap = 24) {
  const size = list => list.reduce((sum, it) => sum + it.w + gap, -gap), room = width - 2 * M;
  if (size(items) > room) {
    const step = room / Math.max(1, items.length);
    return items.map((it, i) => ({ ...it, x: M + step * i + (step - it.w) / 2 }));
  }
  const place = list => {
    const mean = list.reduce((sum, it) => sum + it.want, 0) / list.length;
    return { list, x: Math.max(M, Math.min(width - M - size(list), mean - size(list) / 2)) };
  };
  const runs = [];
  for (const it of [...items].sort((a, b) => a.want - b.want)) {  // Array sort is stable: ties keep their order
    runs.push(place([it]));
    while (runs.length > 1 && runs.at(-2).x + size(runs.at(-2).list) + gap > runs.at(-1).x) {
      const right = runs.pop(), left = runs.pop();
      runs.push(place([...left.list, ...right.list]));
    }
  }
  const before = (list, k) => list.slice(0, k).reduce((sum, it) => sum + it.w + gap, 0);
  return runs.flatMap(run => run.list.map((it, k) => ({ ...it, x: run.x + before(run.list, k) })));
}
// Centre of the span of some region columns (null for none): where a site or peering location wants to sit.
function underColumns(cols) {
  const xs = cols.map(c => c.x + c.w / 2);
  return xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : null;
}
// Gateway lines: one per connection, hub and link (a Metro circuit has two, one to each of its peering locations),
// from the gateway (ExpressRoute gateway, VPN Gateway) to its peering location, or site (VPN).
// A line leaves the gateway into the region's right gutter (from 22 px right of the hub, 8 apart: layout.js
// widens the gutter for 3+ lines; the path lane is 10 px left) and runs straight down. `first`: the first hub its
// connection lists (that line carries the connection's tag).
function hybridLines(L) {
  const lines = [], perCol = {};
  for (const c of hybridConnections(spec)) {
    (c.connects_to || []).forEach((id, j) => {
      const col = L.regions.find(x => x.region.id === id), gw = `${id}.${GATEWAY_ROLE[c.type]}`;
      if (!col || !L.nodes[gw]) return;
      const er = c.type === 'expressroute', locs = er ? linkLocations(c) : [null];
      locs.forEach((loc, k) => {
        perCol[id] = (perCol[id] || 0) + 1;
        lines.push({ c, col, gw, er, link: er ? k : undefined, first: j === 0 && !k, k: perCol[id] - 1,
          backup: isBackup(spec, c, id), to: er ? edgeId(loc) : 'site.' + c.site });
      });
    });
  }
  return lines.map(l => ({ ...l, gx: l.col.x + PAD + HUB_W + 22 + l.k * 8 }));
}
const SITE_W = 220;
// x where a line comes down towards its target: its gutter, or right of a peering location in its way (VPN).
const dropX = (L, l, lines) => vpnDetour(L, l, lines) ?? l.gx;
// Arrival slots: every line reaching a node (gateway line, or circuit at a site) gets its own slot on the node's top
// edge, up to 24 px apart and centred, in the left-to-right order of the x it comes down at, so the lines arriving
// at one node never cross. Returns a Map line/circuit -> offset from the node's centre.
function arrivalSlots(L, lines, drops) {
  const into = {}, slots = new Map();
  const add = (key, item, x) => (into[key] = into[key] || []).push({ item, x });
  lines.forEach(l => add(l.to, l, dropX(L, l, lines)));
  drops.forEach(d => add(d.to, d.item, d.x));
  for (const [key, list] of Object.entries(into)) {
    const n = list.length, w = key.startsWith('site.') ? SITE_W : EDGE_W;
    const step = n > 1 ? Math.min(24, (w - 40) / (n - 1)) : 0;
    list.sort((a, b) => a.x - b.x).forEach((a, k) => slots.set(a.item, (k - (n - 1) / 2) * step));
  }
  return slots;
}
// Bands "ExpressRoute peering locations" (when a circuit exists), "Connectivity provider" (when a circuit has one,
// layout.js) and "On-premises". Lines that turn towards their peering location do so in lanes (8 apart)
// inside the first band, below its title: only the straight gateway lines (in the column gutters, right of the
// title) pass the title's row. VPN lines (internet) pass beside the provider boxes. use: the lanes each band needs
// ({ upper, mid, lower }, from a first pass); without it, one lane per line that could turn there.
function placeHybrid(L, y, use) {
  const lines = hybridLines(L), toEdge = lines.filter(l => l.er);
  const edges = peeringLocations(spec).length > 0, upper = edges ? y + 40 : y + 10;
  let top = upper + (use ? use.upper : lines.length) * 8 + (edges ? 12 : 2), circuits = [], mid = null;
  L.metroGroups = [];
  if (edges) {
    const bottom = placeEdges(L, lines, top);
    top = addBand(L, 'ExpressRoute peering locations', y + 12, bottom + 10 - (y + 12), 'hybrid');
    L.bands.at(-1).owner = 'network';  // the Microsoft global network's edge (MSEE)
    const links = circuitLines(L);
    ({ bottom: top, mid, circuits } = placeProviders(L, links, top + 8, use ? use.mid : links.length));
  }
  const drops = circuitDrops(L, circuits);
  const tags = [...drops.filter(d => isDirect(d.item.c || d.item))  // a provider's line to the site: no tag
    .map(d => lineTag(d.x, d.item.c || d.item, circuitText(d.item.c || d.item)))
    .filter((t, i, all) => all.findIndex(o => o.conn === t.conn) === i), ...lines.filter(l => !l.er && l.first)
    .map(l => lineTag(dropX(L, l, lines), l.c, CATALOG.roles[GATEWAY_ROLE[l.c.type]].line, l.col.region.id))];
  const laneY = top + 12 + placeTags(L, tags, top + 16) * 15;
  const lower = use ? use.lower : drops.length + lines.length - toEdge.length;
  const sitesTop = laneY + 4 + lower * 8, sites = spec.onprem || [], slots = arrivalSlots(L, lines, drops);
  const ics = interconnectPairs(spec).length, bandH = 84 + (ics ? 30 + 8 * (ics - 1) : 0);  // interconnect lanes
  if (sites.length) {
    addBand(L, 'Customer on-premises', sitesTop, bandH);
    L.bands.at(-1).owner = 'customer';
  }
  placeSites(L, lines, drops, slots, sitesTop + 28);
  hybridWires(L, lines, circuitWires(L, circuits, drops, slots), slots, { upper, mid, lower: laneY });
  placeInterconnects(L, sitesTop + 76 + 26);
  return sites.length ? sitesTop + bandH : top;
}
// On-premises interconnects (hybrid.js): one line per pair of interconnected sites, from the bottom edges of
// both sites (slots 24 px apart, in the order of the partner's x) down to its own lane below the sites (8 apart,
// shorter spans higher), so it stays in the On-premises band clear of the circuit and gateway lines above the sites.
function placeInterconnects(L, laneY) {
  const ids = ([a, b]) => ['site.' + a.id, 'site.' + b.id], cx = id => centre(L.nodes[id])[0];
  const pairs = interconnectPairs(spec).map(ids).filter(p => p.every(id => L.nodes[id]))
    .sort((p, q) => Math.abs(cx(p[0]) - cx(p[1])) - Math.abs(cx(q[0]) - cx(q[1])));
  const slot = (id, other) => {
    const partners = pairs.filter(p => p.includes(id)).map(p => p.find(x => x !== id)).sort((u, v) => cx(u) - cx(v));
    return cx(id) + (partners.indexOf(other) - (partners.length - 1) / 2) * 24;
  };
  L.interconnects = pairs.map(([a, b], k) => {
    const [na, nb] = [L.nodes[a], L.nodes[b]], [xa, xb] = [slot(a, b), slot(b, a)], y = laneY + 8 * k;
    return { a, b, conn: icConn(a.slice(5), b.slice(5)), title: `${na.label} ↔ ${nb.label}: on-premises interconnect`,
      pts: [[xa, na.y + na.h], [xa, y], [xb, y], [xb, nb.y + nb.h]] };
  });
}
// Sites sit where their arriving lines come straight down into their slots: circuits first (under their peering
// locations), else the VPN lines; ties (and sites connected nowhere) follow spec.onprem order. Same spacing as the
// peering locations, so circuit lines stay straight.
function placeSites(L, lines, drops, slots, y) {
  const want = site => {
    const into = list => list.filter(o => o.to === 'site.' + site.id);
    const ers = into(drops), vpns = into(lines), mean = xs => xs.reduce((sum, x) => sum + x, 0) / xs.length;
    if (ers.length) return mean(ers.map(d => d.x - slots.get(d.item)));
    return vpns.length ? mean(vpns.map(l => dropX(L, l, lines) - slots.get(l))) : L.width / 2;
  };
  const sites = (spec.onprem || []).map(s => ({ s, want: want(s), w: SITE_W }));
  for (const { s, x } of spread(sites, L.width)) {
    const sub = siteEquipment(spec, s);  // the tooltip keeps a combined sub-label that doesn't fit
    L.nodes['site.' + s.id] = { x, y, w: SITE_W, h: 48, ext: true, site: true, label: s.name, sub,
      title: `${s.name} · ${sub}` };
  }
}
// A line's label: its text (e.g. "Site-to-site VPN (IPsec) over internet"), or for a backup line a short one
// ("Site-to-site VPN backup", "Circuit A · backup"); hubId: the hub of a gateway line (none: a circuit's line).
function lineTag(x, c, text, hubId) {
  const backup = isBackup(spec, c, hubId);
  const what = c.type === 'expressroute' ? `${c.name || 'Circuit'} ·` : CONNECTION_TYPES[c.type];
  return { x, backup, conn: c.id, text: backup ? `${what} backup` : text };
}
// Line labels next to their vertical line: right of it, or left when another tagged line would cross the label;
// then on the first row (15 apart) where they don't collide. A backup line's label (e.g. "Site-to-site VPN backup") is
// part of the "Backup links" layer. Returns the number of rows.
function placeTags(L, tags, y) {
  const rows = [];
  for (const t of tags) {
    const w = t.text.length * 6.6, clear = x => !tags.some(o => o !== t && o.x > x - 4 && o.x < x + w + 4);
    const fits = x => x >= M && x + w <= L.width - M && clear(x);  // never pushed back over its own line
    const x = [t.x + 6, t.x - 6 - w].find(fits) ?? Math.min(t.x + 6, L.width - M - w);
    let r = rows.findIndex(row => row.every(o => x > o.x + o.w + 8 || x + w + 8 < o.x));
    if (r < 0) r = rows.push([]) - 1;
    rows[r].push({ x, w });
    addLabel(L, t.text, x, y + r * 15, 'lbl', { layer: t.backup ? 'backup' : 'hybrid', sel: 'conn:' + t.conn });
  }
  return Math.max(1, rows.length);
}
// A VPN line passes right of a peering location or provider standing in its way (and of the boxes next to
// it): returns that x (or null when no detour). Lines passing the same box take their own lanes, 8+ apart, in the
// order of their gutters (so they never cross), and 8+ px from the straight gateway lines (their gutters).
function vpnDetour(L, l, lines = [l]) {
  const boxes = Object.values(L.nodes).filter(n => n.edge || n.prov);
  const block = m => !m.er && boxes.find(n => m.gx > n.x - 9 && m.gx < n.x + n.w + 9);
  const rightOf = m => {  // past every box that starts before the detour lanes end
    const b = block(m);
    let right = b && b.x + b.w, next;
    const near = n => n.x - 9 < right + 10 + 8 * lines.length && n.x + n.w > right;
    while (b && (next = boxes.find(near))) right = next.x + next.w;
    return right || null;
  };
  const r = rightOf(l), straight = lines.filter(o => !block(o)).map(o => o.gx);
  if (r === null) return null;
  let x = r + 2;
  for (const o of lines.filter(m => rightOf(m) === r).sort((p, q) => p.gx - q.gx)) {
    x = Math.max(x + 8, o.gx + 14);  // 8 apart, and a turn of at least two corner radii (layout.js)
    while (straight.some(g => Math.abs(g - x) < 8)) x++;
    if (o === l) return x;
  }
  return x;
}
// Wires: gateway → peering location or site (VPN), and the circuit lines (layout.js).
// A wire runs down its verticals (gutter, detour, arrival slot) and turns between them in lanes: the upper lanes
// (above the peering locations) for gateway lines to a peering location and VPN detours, the mid ones (above the
// providers) for circuit lines towards their provider, the lower ones (above the sites) for lines to a site.
// A wire whose slot is within 12 px of its vertical goes straight down (no tiny jogs).
function hybridWires(L, lines, circuitWireList, slots, lanes) {
  const wires = [];
  for (const l of lines) {
    const gw = L.nodes[l.gw], t = L.nodes[l.to], gy = centre(gw)[1], bx = vpnDetour(L, l, lines);
    if (!t) continue;
    wires.push({ a: l.gw, b: l.to, type: l.c.type, conn: l.c.id, hub: l.col.region.id, backup: l.backup, link: l.link,
      title: `${connectionName(spec, l.c)} → ${l.col.region.name}${l.backup ? ' (backup)' : ''}`,
      head: [[gw.x + gw.w, gy], [l.gx, gy]], xs: bx ? [l.gx, bx] : [l.gx], bands: bx ? ['upper'] : [],
      end: [t.x + t.w / 2 + slots.get(l), t.y], band: t.site ? 'lower' : 'upper' });
  }
  wires.push(...circuitWireList);  // layout.js
  L.wires = wires.map(w => {
    const [ex, ey] = w.end, straight = Math.abs(ex - w.xs.at(-1)) <= 12;
    return { ...w, xs: straight ? w.xs : [...w.xs, ex], bands: straight ? w.bands : [...w.bands, w.band], ey };
  });
  L.laneUse = assignLanes(L.wires, lanes);
  L.wires = L.wires.map(({ a, b, type, conn, hub, backup, title, head, xs, ey, turns, link, provnet }) => ({ a, b,
    type, conn, hub, backup, title, link, provnet,
    pts: [...head, ...turns.flatMap((y, i) => [[xs[i], y], [xs[i + 1], y]]), [xs.at(-1), ey]] }));
}
// Every turn gets its own lane in its band, 8 apart. A turn goes above another when its incoming vertical lies within
// the other's span, below it when its outgoing vertical does: then the two lines never cross (lines arriving at one
// node, a detour next to a gateway line). Free choices (and unavoidable crossings): the shorter turn higher.
// Returns the number of lanes used in each band (placeBands reserves only those on its second pass).
function assignLanes(wires, lanes) {
  const turns = wires.flatMap(w => (w.turns = w.bands.map(() => 0), w.bands.map((band, i) =>
    ({ w, i, band, from: w.xs[i], to: w.xs[i + 1], len: Math.abs(w.xs[i + 1] - w.xs[i]) }))));
  const within = (x, t) => x > Math.min(t.from, t.to) && x < Math.max(t.from, t.to);
  const above = (p, q) => (within(p.from, q) || within(q.to, p)) && !(within(p.to, q) || within(q.from, p));
  const used = {};
  for (const band of ['upper', 'mid', 'lower']) {
    const left = turns.filter(t => t.band === band).sort((p, q) => p.len - q.len);
    used[band] = left.length;
    for (let k = 0; left.length; k++) {
      const next = left.find(t => !left.some(o => o !== t && above(o, t))) || left[0];
      next.w.turns[next.i] = lanes[band] + 8 * k;
      left.splice(left.indexOf(next), 1);
    }
  }
  return used;
}

const EDGE_W = 200, EDGE_H = 44, PROV_W = 170, METRO_GAP = 16;

/* ===== PEERING LOCATIONS (band "ExpressRoute peering locations") ===== */
// Location groups: a Metro area's two locations side by side (with a standard circuit's location in that city), or
// one standard location. Groups sit under the hub columns their lines come from; ties follow the order of the sites
// that use them (spec.onprem). A hub with circuits at two different locations gets a "Maximum resiliency" tag on its
// ExpressRoute gateway. Returns the bottom of the boxes.
function locationGroups() {
  const groups = [];
  for (const c of circuitsOf(spec)) {
    const members = linkLocations(c), g = groups.find(x => x.members.some(m => members.includes(m)));
    if (!g) groups.push({ members: [...members], metro: isMetro(c) ? c.peering_location : null, circuits: [c] });
    else Object.assign(g, { members: [...new Set([...g.members, ...members])], metro: g.metro ||
      (isMetro(c) ? c.peering_location : null), circuits: [...g.circuits, c] });
  }
  return groups;
}
function placeEdges(L, lines, y) {
  const sites = spec.onprem || [], top = y + 18;
  const rank = g => (k => (k < 0 ? sites.length : k))(sites.findIndex(s => g.circuits.some(c => c.site === s.id)));
  const items = locationGroups().map(g => ({ g, rank: rank(g), w: g.members.length * (EDGE_W + METRO_GAP) - METRO_GAP,
    want: underColumns(lines.filter(l => g.members.some(m => l.to === edgeId(m))).map(l => l.col)) ?? L.width / 2 }));
  L.metroGroups = [];
  for (const { g, x, w } of spread(items.sort((a, b) => a.rank - b.rank), L.width, 44)) {
    g.members.forEach((loc, k) => { L.nodes[edgeId(loc)] = { x: x + k * (EDGE_W + METRO_GAP), y: top, w: EDGE_W,
      h: EDGE_H, ext: true, edge: true, layer: 'hybrid', label: loc, ...edgeText(loc) }; });
    if (g.metro) {
      L.metroGroups.push({ x: x - 6, y: y + 2, w: w + 12, h: EDGE_H + 24, title: `${g.metro}: one link through each` +
        ' of its two peering locations' });
      addLabel(L, g.metro, x + w / 2, y + 14, 'mg', { anchor: 'middle', layer: 'hybrid' });
    }
  }
  tagMaximum(L);
  return top + EDGE_H;
}
// A location's sub-label: "Standard · 2 links, 1 location", or "Metro · link 1 of 2" (its circuits' links there).
function edgeText(loc) {
  const at = circuitsOf(spec).filter(c => linkLocations(c).includes(loc));
  const metro = at.filter(isMetro).map(c => linkLocations(c).indexOf(loc) + 1), std = at.some(c => !isMetro(c));
  const sub = [std && 'Standard · 2 links, 1 location', metro.length && `Metro · link ${metro[0]} of 2`]
    .filter(Boolean).join(' + ');
  const names = at.map(c => c.name || 'Circuit').join(', ');
  return { sub, title: `${loc} peering location · ${names}: ${std ? 'a standard circuit\'s two links both land' +
    ' here' : 'one link of a Metro circuit, whose other link lands at the other location of its metro area'}` };
}
function tagMaximum(L) {
  for (const r of spec.regions) {
    const gw = L.nodes[`${r.id}.${GATEWAY_ROLE.expressroute}`];
    if (!gw || hubResiliency(spec, r.id) !== 'maximum') continue;
    const ers = circuitsAt(spec, r.id).map(c => `${c.name || 'Circuit'} (${c.peering_location})`);
    Object.assign(gw, { tag: 'Maximum resiliency', title: `Maximum resiliency: ${ers.join(', ')} · circuits at two ` +
      `different peering locations. ${gw.title || gw.label}` });
  }
}

/* ===== CIRCUIT LINES below the peering locations: one per link, each below its location (slots 8 apart) ===== */
const slotX = (n, k) => (k - (n - 1) / 2) * 8;
function circuitLines(L) {
  const links = circuitsOf(spec).flatMap(c => linkLocations(c).map((loc, k) => ({ c, k, loc, to: 'site.' + c.site })))
    .filter(o => L.nodes[edgeId(o.loc)]);
  return links.map(o => {
    const same = links.filter(x => x.loc === o.loc), n = L.nodes[edgeId(o.loc)];
    return { ...o, x: n.x + n.w / 2 + slotX(same.length, same.indexOf(o)) };
  });
}

/* ===== CONNECTIVITY PROVIDERS (a box per circuit that uses one; no band around them) ===== */
// One provider box per circuit, under its links (ExpressRoute Direct: no box, but its place in the row is kept).
// Each link turns towards its slot on the provider's top edge (px, 16 apart) in lanes 8 apart from `mid`, just
// below the peering locations; the circuit continues from the provider's bottom centre (cx). The box is the
// provider's ownership boundary (draw.js). Returns { bottom, mid, circuits }.
function placeProviders(L, links, y, lanes) {
  const circuits = circuitsOf(spec).map(c => ({ c, links: links.filter(o => o.c === c) })).filter(o => o.links.length);
  const any = circuits.some(o => !isDirect(o.c)), mid = y + 6, top = mid + lanes * 8 + 16;
  const items = circuits.map(o => ({ o, w: PROV_W, want: o.links.reduce((s, l) => s + l.x, 0) / o.links.length }));
  for (const { o, x } of spread(items, L.width)) {
    o.cx = x + PROV_W / 2;
    o.links.forEach((l, k) => { l.px = any ? o.cx + (k - (o.links.length - 1) / 2) * 16 : l.x; });
    if (any && !isDirect(o.c)) L.nodes[providerId(o.c)] = { x, y: top, w: PROV_W, h: 40, ext: true, prov: true,
      layer: 'hybrid', label: providerName(o.c), sub: o.c.name || 'Circuit',
      title: `${providerName(o.c)} · ${connectionName(spec, o.c)} · ownership boundary: the connectivity provider` };
  }
  return any ? { bottom: top + 40 + 10, mid, circuits } : { bottom: y - 8, mid: null, circuits };
}
// The tag of an ExpressRoute Direct circuit, on its line to the site (the customer's own ports). A provider's line
// from its edge to the site carries no tag: the provider box names the circuit (Learn: two connections to two MSEEs
// "from the connectivity provider or your network edge").
const circuitText = c => `${c.name || 'Circuit'} · ExpressRoute Direct (customer-owned ports)`;

/* ===== CIRCUIT WIRES: location → provider → site, or location → site (Direct) ===== */
// Wire drafts for hybridWires (layout.js): head points, verticals (xs), the bands of their turns, end point.
// The circuit runs from the peering location to the provider's edge (or, Direct, to the site); provider → site is
// the provider's network (provnet: its own line style, draw.js). drops: what arrives at a site ({ to, x, item }).
function circuitWires(L, circuits, drops, slots) {
  const wires = [];
  for (const { c, links, cx } of circuits) {
    const site = L.nodes['site.' + c.site], prov = L.nodes[providerId(c)], name = connectionName(spec, c);
    const base = { type: 'circuit', conn: c.id, hub: null, backup: isBackup(spec, c), title: name };
    const toSite = item => site && { b: 'site.' + c.site, end: [site.x + site.w / 2 + slots.get(item), site.y],
      band: 'lower' };
    for (const o of links) {
      const loc = L.nodes[edgeId(o.loc)], turn = Math.abs(o.px - o.x) > 0.5, head = [[o.x, loc.y + loc.h]];
      const edge = { ...base, a: edgeId(o.loc), link: o.k, head, xs: [o.x], bands: [] };
      if (prov) wires.push({ ...edge, b: providerId(c), end: [o.px, prov.y], band: 'mid', title: `${name}: the` +
        ` circuit, between the Microsoft edge routers (MSEEs) at ${o.loc} and the provider's edge` });
      else if (site) wires.push({ ...edge, ...toSite(o), xs: turn ? [o.x, o.px] : [o.x], bands: turn ? ['mid'] : [] });
    }
    if (prov && site) wires.push({ ...base, ...toSite(c), a: providerId(c), head: [[cx, prov.y + prov.h]], xs: [cx],
      bands: [], provnet: true, title: `${name}: the provider's network from its edge to ${site.label} (IPVPN,` +
        ' point-to-point Ethernet or a cloud exchange cross-connect, depending on the provider)' });
  }
  return wires;
}
// What arrives at the sites from the circuits: the provider's line, or each link of an ExpressRoute Direct circuit.
const circuitDrops = (L, circuits) => circuits.flatMap(({ c, links, cx }) => (L.nodes[providerId(c)]
  ? [{ to: 'site.' + c.site, x: cx, item: c }] : links.map(o => ({ to: 'site.' + c.site, x: o.px, item: o }))));

/* ===== DIAGRAM: routes (orthogonal lines with rounded corners) used by links and the path overlay ===== */
// Path overlay geometry. A hop leaves its first node and enters its last one perpendicular to an edge, through a
// port slot (the centre, or `slot` px above or below it), with a straight run of at least `run` px. The line stops
// `gap` px short of the target edge; the arrowhead (`arrow` px long, drawn by app.js) reaches `tip` px past the line
// end, so its tip sits about 3 px outside the box and its base on the straight run.
const ROUTE = { radius: 6, arrow: 10.5, tip: 2.1, gap: 5.5, run: 14, slot: 10 };
function roundPath(pts, r = 8) {
  pts = pts.filter((p, i) => !i || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  const pt = ([x, y]) => `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`;
  const toward = (c, p, len = Math.hypot(p[0] - c[0], p[1] - c[1])) =>  // point r before corner c, towards p
    [c[0] + (p[0] - c[0]) * Math.min(r, len / 2) / len, c[1] + (p[1] - c[1]) * Math.min(r, len / 2) / len];
  let d = 'M' + pt(pts[0]);
  for (let i = 1; i < pts.length - 1; i++) d += ` L${pt(toward(pts[i], pts[i - 1]))} Q${pt(pts[i])}` +
    ` ${pt(toward(pts[i], pts[i + 1]))}`;
  return d + ' L' + pt(pts[pts.length - 1]);
}
const colOf = id => layout.regions.find(c => c.region.id === id);
const flip = r => ({ ...r, pts: [...r.pts].reverse() });
// Path lanes of a column: left gutter (to and from the spokes), right gutter (between stacked nodes, and to the
// right spoke) and the entry lane in the gap left of the column (from the bands above).
const laneL = col => col.x + 8, laneR = col => col.x + PAD + HUB_W + 12, laneIn = col => col.x - 10;
// Side port of node n for a lane towards node `to`: the slot above the centre when `to` is higher, else below.
const portY = (n, to) => centre(n)[1] + (centre(to)[1] < centre(n)[1] ? -ROUTE.slot : ROUTE.slot);
const isGateway = n => layout.wires.some(w => w.a === n.key);
// Users/internet or a global service to a region node: along a lane above the regions, down the entry lane left of
// the region's column, then across into the node's upper slot.
function topRoute(a, b) {
  if (a.region) return flip(topRoute(b, a));
  const x = laneIn(colOf(b.region)), y = centre(b)[1] - ROUTE.slot;
  const ax = Math.abs(centre(a)[0] - x) < 2 * ROUTE.radius ? x : centre(a)[0];  // nearly above the lane: straight
  const lane = a.global ? GLOBAL_LANE : TOP_LANE;
  return { pts: [[ax, a.y + a.h], [ax, lane], [x, lane], [x, y], [b.x, y]] };
}
// Between regions: along the connection's backbone lane (or a generic one). Hub nodes reach its gap lanes from the
// side (centre slot; a gateway's upper slot, its line leaves from the centre); spokes from their bottom centre.
function crossRoute(a, b) {
  const lanes = layout.peers;
  const p = lanes.find(q => q.from === a.region && q.to === b.region);
  if (!p && lanes.some(q => q.from === b.region && q.to === a.region)) return flip(crossRoute(b, a));
  const ca = colOf(a.region), cb = colOf(b.region), right = cb.x > ca.x;
  const lane = p || { srcX: right ? ca.x + ca.w + 10 : laneIn(ca) - 8, dstX: right ? laneIn(cb) - 8 : cb.x + cb.w + 10,
    laneY: layout.bottom + 26 };
  const reach = (n, x) => {  // from node n across to the vertical lane at x (or from its bottom centre)
    if (n.spoke && n === a) return [[centre(n)[0], n.y + n.h]];
    if (!n.hub && !n.spoke) return [[n.x + n.w, centre(n)[1]], [laneR(colOf(n.region)), centre(n)[1]]];  // spoke-level
    const out = x > n.x + n.w, y = centre(n)[1] - (out && isGateway(n) ? ROUTE.slot : 0);
    return [[out ? n.x + n.w : n.x, y], [x, y]];
  };
  const start = reach(a, lane.srcX), end = reach(b, lane.dstX).reverse(), [x0, y0] = start[start.length - 1];
  return { pts: [...start, [x0, lane.laneY], [end[0][0], lane.laneY], ...end],
    mid: [x0, (y0 + lane.laneY) / 2], peer: p && p.key };
}
// Inside one region. Stacked nodes (hub, spoke-level services) pass each other in the right gutter; the left spoke
// is reached through the left gutter, the right spoke through the right one; the two spokes meet below them.
function localRoute(a, b) {
  const col = colOf(a.region), ya = portY(a, b), yb = portY(b, a);
  if (a.spoke && b.spoke) {
    const y = a.y + a.h + 22, [ax] = centre(a), [bx] = centre(b);
    return { pts: [[ax, a.y + a.h], [ax, y], [bx, y], [bx, b.y + b.h]] };
  }
  const left = (a.spoke || b.spoke) === 'spoke', x = left ? laneL(col) : laneR(col), edge = n => left ? n.x : n.x + n.w;
  return { pts: [[edge(a), ya], [x, ya], [x, yb], [edge(b), yb]] };
}
// Hybrid hops follow their wire (gateway, peering location, site), in either direction; with several wires between
// two nodes, the one of connection `conn` (the path step's).
function wireRoute(a, b, conn) {
  const ends = x => (x.a === a.key && x.b === b.key) || (x.a === b.key && x.b === a.key);
  const w = layout.wires.find(x => ends(x) && x.conn === conn) || layout.wires.find(ends);
  if (w) return { pts: w.a === a.key ? w.pts : [...w.pts].reverse() };
  return { pts: [centre(a), centre(b)] };  // not drawn as a wire (should not happen)
}
// Between two sites: the on-premises interconnect line (layout.js placeInterconnects), in either direction.
function interconnectRoute(a, b) {
  const w = layout.interconnects.find(x => (x.a === a.key && x.b === b.key) || (x.a === b.key && x.b === a.key));
  return w ? { pts: w.a === a.key ? w.pts : [...w.pts].reverse() } : { pts: [centre(a), centre(b)] };
}
// The line stops ROUTE.gap px before the target edge, so the arrowhead tip lands just outside it.
function shorten(pts) {
  pts = pts.filter((p, i) => !i || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  const [p, q] = pts.slice(-2), k = ROUTE.gap / Math.hypot(q[0] - p[0], q[1] - p[1]);
  return [...pts.slice(0, -1), [q[0] - (q[0] - p[0]) * k, q[1] - (q[1] - p[1]) * k]];
}
// Between two nodes outside the regions (Internet → global entry): straight down when one sits under the other,
// else side by side, from the facing edges.
function outsideRoute(a, b) {
  const lo = Math.max(a.x, b.x), hi = Math.min(a.x + a.w, b.x + b.w);
  if (hi - lo > 2 * ROUTE.slot && (b.y >= a.y + a.h || a.y >= b.y + b.h)) {
    const x = (lo + hi) / 2, down = b.y >= a.y + a.h;
    return { pts: [[x, down ? a.y + a.h : a.y], [x, down ? b.y : b.y + b.h]] };
  }
  const right = b.x >= a.x + a.w, y = centre(a)[1];
  return { pts: [[right ? a.x + a.w : a.x, y], [right ? b.x : b.x + b.w, y]] };
}
// One hop of a path. mid: where to mark a hop without its own node (a peering, a ruleset); peer: backbone lane used.
// conn: the hybrid connection of the hop (path step), to pick its wire.
function segment(a, b, conn) {
  const hybrid = a.site || b.site || a.edge || b.edge || a.prov || b.prov;
  const r = a.site && b.site ? interconnectRoute(a, b) : hybrid ? wireRoute(a, b, conn) : !a.region && !b.region ?
    outsideRoute(a, b)
    : !a.region || !b.region ? topRoute(a, b) : a.region !== b.region ? crossRoute(a, b) : localRoute(a, b);
  const pts = shorten(r.pts);
  return { d: roundPath(pts, ROUTE.radius), pts, mid: r.mid || r.pts[Math.floor(r.pts.length / 2)], peer: r.peer };
}
