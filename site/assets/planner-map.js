// Geographic view of the workbook's existing latency evidence. No independent latency model.
(function (global) {
  'use strict';
  const M = global.MRP, C = M.core, K = M.kit, { esc } = K;
  const layers = [
    ['regions', 'Current to candidate regions', true],
    ['peering', 'Peering to current regions', true],
    ['newPeering', 'Peering to candidate regions', false],
    ['other', 'Other region pairs', false],
    ['cities', 'Cities to peering locations', false],
  ];
  const state = { layers: Object.fromEntries(layers.map(([id, , on]) => [id, on])), focus: '', zoom: 1 };
  let geometry = null, loading = false, failure = '';
  const valid = p => p && typeof p.lat === 'number' && typeof p.lon === 'number' &&
    Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;
  const n = v => Number(v.toFixed(2));

  function model() {
    const points = [], missing = [], links = [], peers = new Map();
    const add = (id, name, kind, source, extra = {}) => {
      if (!valid(source)) { missing.push(name); return null; }
      const point = { id, name, kind, lat: source.lat, lon: source.lon, ...extra };
      points.push(point); return point;
    };
    C.S.current.forEach(r => add('r:' + r.id, C.rname(r.id), 'current', C.info(r.id), { region: r.id }));
    C.S.regions.forEach(r => add('r:' + r.id, C.rname(r.id), 'candidate', C.info(r.id), { region: r.id }));
    C.S.sites.forEach(s => {
      const name = C.sitePeering(s);
      if (name && !peers.has(name)) {
        const p = C.D.lat && C.D.lat.peering.find(x => x.name === name);
        peers.set(name, add('p:' + name, name, 'peering', p, { peering: name }));
      }
      if (s.kind === 'city') add('s:' + s.id, C.siteName(s), 'city', s.city, { site: s });
    });
    const connect = (a, b, layer, value) => {
      if (!a || !b) return;
      const known = value && typeof value.ms === 'number' && Number.isFinite(value.ms) && value.ms >= 0;
      links.push({ a, b, layer, value: known ? value : null, distance: Math.round(C.km(a, b)) });
    };
    const regions = points.filter(p => p.region);
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        let a = regions[i], b = regions[j];
        const mixed = a.kind !== b.kind;
        if (mixed && a.kind === 'candidate') [a, b] = [b, a];
        connect(a, b, mixed ? 'regions' : 'other', C.regionLatency(a.region, b.region));
      }
    }
    for (const peer of peers.values()) {
      if (!peer) continue;
      const site = C.S.sites.find(s => s.kind === 'peering' && s.peering === peer.peering);
      for (const region of regions) {
        connect(peer, region, region.kind === 'current' ? 'peering' : 'newPeering',
          site ? C.siteLatency(site, region.region) : C.peeringLatency(peer.peering, region.region));
      }
    }
    points.filter(p => p.kind === 'city').forEach(p =>
      connect(p, peers.get(C.sitePeering(p.site)), 'cities', C.cityLatency(p.site.city, C.sitePeering(p.site))));
    if (!points.some(p => p.id === state.focus)) state.focus = '';
    return { points, links, missing: [...new Set(missing)] };
  }

  // Cut at the largest empty longitude gap, so selections either side of the date line stay together.
  function projection(points) {
    const longitudes = points.map(p => (p.lon + 360) % 360).sort((a, b) => a - b);
    let gap = -1, start = longitudes[0];
    longitudes.forEach((v, i) => {
      const next = longitudes[(i + 1) % longitudes.length] + (i === longitudes.length - 1 ? 360 : 0);
      if (next - v > gap) { gap = next - v; start = next % 360; }
    });
    const wrap = lon => { const v = (lon + 360) % 360; return v < start ? v + 360 : v; };
    const xs = points.map(p => wrap(p.lon)), ys = points.map(p => -p.lat);
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2, midY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const correction = Math.max(0.35, Math.cos(midY * Math.PI / 180));
    // Fit the locations, not a padded box around them: a fixed margin in map units leaves room for the labels,
    // and a minimum span keeps one or two nearby locations from zooming in to street level.
    const width = Math.max(8, Math.max(...xs) - Math.min(...xs));
    const height = Math.max(5, Math.max(...ys) - Math.min(...ys));
    const scale = Math.min(680 / (width * correction), 400 / height) * state.zoom;
    const xy = (lon, lat) => [n(500 + (wrap(lon) - midX) * correction * scale), n(270 + (-lat - midY) * scale)];
    return { xy, wrap, scale, correction, midX };
  }

  function basemap(project) {
    if (!geometry) return '';
    const path = (rings, close) => rings.map(ring => {
      // Repeat at the longitude seam to keep adjacent countries aligned with the selected points.
      const unwrapped = [];
      ring.forEach(([lon, lat], i) => {
        let x = project.wrap(lon);
        if (i) x += Math.round((unwrapped[i - 1][0] - x) / 360) * 360;
        unwrapped.push([x, lat]);
      });
      return [-360, 0, 360].map(offset => {
        const coords = unwrapped.map(([x, y]) => [n(500 + (x + offset - project.midX) * project.correction * project.scale),
          project.xy(0, y)[1]]);
        if (Math.max(...coords.map(p => p[0])) < 0 || Math.min(...coords.map(p => p[0])) > 1000 ||
            Math.max(...coords.map(p => p[1])) < 0 || Math.min(...coords.map(p => p[1])) > 540) return '';
        return 'M' + coords.map(p => p.join(',')).join('L') + (close ? 'Z' : '');
      }).join('');
    }).join('');
    return `<g aria-hidden="true"><path class="pl-map-land" fill-rule="evenodd" d="${path(geometry.countries, true)}"/>` +
      `<path class="pl-map-admin" d="${path(geometry.administrative, false)}"/></g>`;
  }

  // Label widths from the real font, so long names never spill out of their box. Falls back to an estimate.
  let ctx = null, family = '';
  function textWidth(text, size) {
    try {
      if (!ctx) { ctx = document.createElement('canvas').getContext('2d'); const host = document.getElementById('planner'); family = host ? getComputedStyle(host).fontFamily : 'sans-serif'; }
      ctx.font = `600 ${size}px ${family}`;
      const w = ctx.measureText(text).width;
      if (w > 0) return w;
    } catch (e) { /* no canvas: estimate */ }
    return text.length * size * 0.6;
  }

  // Layout, in viewBox units. Labels are placed in order of importance, each where it collides least:
  // names first (beside their marker), then latency values (on their own line, never far from it).
  // A value that finds no free spot on or right beside its line becomes a small dot that shows the value on hover or focus.
  function mapBody(data) {
    if (!data.points.length) return '<p class="pl-muted">No selected locations have coordinates. Add reference regions in Scope or locations above.</p>';
    const project = projection(data.points), boxes = [], marks = [];
    const W = 1000, H = 540, PAD = 2;
    const hit = (a, b) => a.x < b.x + b.w + PAD && a.x + a.w + PAD > b.x && a.y < b.y + b.h + PAD && a.y + a.h + PAD > b.y;
    const inside = b => b.x >= 4 && b.y >= 4 && b.x + b.w <= W - 4 && b.y + b.h <= H - 4;
    const hard = b => boxes.reduce((s, a) => s + (hit(a, b) ? 1 : 0), 0);
    const soft = b => marks.reduce((s, m) => s + (m[0] > b.x - 1 && m[0] < b.x + b.w + 1 && m[1] > b.y - 1 && m[1] < b.y + b.h + 1 ? 1 : 0), 0);

    // Locations in one metro are fanned out around their shared centre; a thin tether keeps each tied to its real spot.
    const points = data.points.map(p => ({ ...p, at: project.xy(p.lon, p.lat) }));
    const groups = [];
    points.forEach(p => { const g = groups.find(g => Math.hypot(g.c[0] - p.at[0], g.c[1] - p.at[1]) < 26); if (g) { g.m.push(p); g.c = [g.m.reduce((s, q) => s + q.at[0], 0) / g.m.length, g.m.reduce((s, q) => s + q.at[1], 0) / g.m.length]; } else groups.push({ c: p.at.slice(), m: [p] }); });
    groups.forEach(g => {
      if (g.m.length === 1) { g.m[0].xy = g.m[0].at; return; }
      const r = Math.max(16, 7 * g.m.length), rank = { current: 0, candidate: 1, peering: 2, city: 3 };
      const order = g.m.map((p, i) => ({ p, a: Math.hypot(p.at[0] - g.c[0], p.at[1] - g.c[1]) > 3 ? Math.atan2(p.at[1] - g.c[1], p.at[0] - g.c[0]) : -Math.PI / 2 + i, k: rank[p.kind] }))
        .sort((x, y) => x.a - y.a || x.k - y.k);
      const start = order[0].a;
      order.forEach(({ p }, i) => { const t = start + i * 2 * Math.PI / order.length; p.xy = [n(g.c[0] + r * Math.cos(t)), n(g.c[1] + r * Math.sin(t))]; });
    });
    points.forEach(p => boxes.push({ x: p.xy[0] - 8, y: p.xy[1] - 8, w: 16, h: 16 }));
    const byId = new Map(points.map(p => [p.id, p]));
    const cx0 = points.reduce((s, p) => s + p.xy[0], 0) / points.length, cy0 = points.reduce((s, p) => s + p.xy[1], 0) / points.length;

    // Lines bow away from the middle of the selection, so they fan out instead of crossing in the centre.
    const visible = data.links.filter(l => state.layers[l.layer] && (!state.focus || l.a.id === state.focus || l.b.id === state.focus));
    const curves = visible.map(l => {
      const a = byId.get(l.a.id).xy, b = byId.get(l.b.id).xy;
      const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.max(1, Math.hypot(dx, dy)), nx = -dy / length, ny = dx / length;
      const side = ((a[0] + b[0]) / 2 - cx0) * nx + ((a[1] + b[1]) / 2 - cy0) * ny >= 0 ? 1 : -1;
      const bend = Math.min(30, length * 0.14) * side;
      const c = [(a[0] + b[0]) / 2 + nx * bend, (a[1] + b[1]) / 2 + ny * bend];
      const at = t => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
      for (let s = 1, k = Math.max(4, Math.round(length / 10)); s < k; s++) marks.push(at(s / k));
      return { l, a, b, c, at, length, nx, ny };
    });

    const markers = points.map(p => {
      const [x, y] = p.xy, w = n(Math.min(240, textWidth(p.name, 11) + 14)), h = 20;
      // Right, left, above, below, then the four corners; each ring a step further from the marker.
      const ring = g => [[g, -h / 2], [-w - g, -h / 2], [-w / 2, -h - g], [-w / 2, g], [g * 0.7, -h - g * 0.7], [-w - g * 0.7, -h - g * 0.7], [g * 0.7, g * 0.7], [-w - g * 0.7, g * 0.7]];
      const choices = [1, 2, 3].flatMap(f => ring(11 * f).map(([dx, dy]) => ({ x: n(x + dx), y: n(y + dy), w, h, f })));
      const score = b => (inside(b) ? 0 : 5000) + hard(b) * 1000 + soft(b) * 6 + (b.f - 1) * 12;
      const box = choices.reduce((best, b) => (b.s = score(b)) < best.s ? b : best, { s: Infinity });
      boxes.push(box);
      const moved = Math.hypot(p.at[0] - x, p.at[1] - y) > 3;
      const location = p.region ? C.info(p.region).geo + ' geography' : p.kind === 'peering' ? 'ExpressRoute peering location' : 'Customer city';
      const lx = Math.max(box.x, Math.min(box.x + w, x)), ly = Math.max(box.y, Math.min(box.y + h, y));
      return `<g class="pl-map-node ${p.kind}${state.focus && state.focus !== p.id ? ' dim' : ''}" role="button" tabindex="0" data-map-act="focus" data-map-arg="${esc(p.id)}" aria-pressed="${state.focus === p.id}" aria-label="${esc(p.name + ', ' + location + '. Focus connections.')}">` +
        `<title>${esc(p.name + ' · ' + location + ' · approximate metro')}</title>` +
        (moved ? `<line class="pl-map-tether" x1="${p.at[0]}" y1="${p.at[1]}" x2="${x}" y2="${y}"/><circle class="pl-map-true" cx="${p.at[0]}" cy="${p.at[1]}" r="2"/>` : '') +
        (Math.hypot(lx - x, ly - y) > 12 ? `<line class="pl-map-leader" x1="${x}" y1="${y}" x2="${n(lx)}" y2="${n(ly)}"/>` : '') +
        (p.kind === 'peering' ? `<rect class="pl-map-pin" x="${x - 5}" y="${y - 5}" width="10" height="10" transform="rotate(45 ${x} ${y})"/>` :
          `<circle class="pl-map-pin" cx="${x}" cy="${y}" r="6"/>`) +
        `<rect class="pl-map-name" x="${box.x}" y="${box.y}" width="${w}" height="${h}" rx="4"/>` +
        `<text x="${n(box.x + 7)}" y="${n(box.y + 13.5)}">${esc(p.name)}</text></g>`;
    });

    // Values: the comparisons with current regions first, then the rest; within a layer, short lines (least room) first.
    const rank = { regions: 0, peering: 1, cities: 2, newPeering: 3, other: 4 };
    const values = new Array(curves.length);
    let dots = 0;
    curves.map((k, i) => ({ k, i })).sort((x, y) => rank[x.k.l.layer] - rank[y.k.l.layer] || x.k.length - y.k.length).forEach(({ k, i }) => {
      const { l } = k, value = l.value;
      const caption = value ? `${value.ms} ms${value.edited ? '*' : value.src !== 'm' ? '~' : ''}` : 'No data';
      const source = value ? value.edited ? 'Edited in the table above' : C.srcText(value.src || 'd') : 'No latency data';
      const title = `${l.a.name} → ${l.b.name}: ${value ? value.ms + ' ms' : 'No data'} · ${source} · ${l.distance.toLocaleString()} km great-circle distance`;
      const w = n(Math.max(34, textWidth(caption, 10) + 12)), h = 17;
      const on = [0.5, 0.42, 0.58, 0.34, 0.66, 0.27, 0.73, 0.2, 0.8].map(t => { const [x, y] = k.at(t); return { x: n(x - w / 2), y: n(y - h / 2), w, h, px: x, py: y, near: Math.abs(t - 0.5) }; });
      const off = [0.5, 0.4, 0.6, 0.3, 0.7].flatMap(t => [16, -16, 26, -26, 36, -36].map(d => { const [x, y] = k.at(t); return { x: n(x + k.nx * d - w / 2), y: n(y + k.ny * d - h / 2), w, h, px: x, py: y, near: 1 + Math.abs(d) / 24 + Math.abs(t - 0.5), lead: 1 }; }));
      const box = [...on, ...off].filter(b => inside(b) && !hard(b)).sort((a, b) => a.near - b.near)[0];
      const head = `<g class="pl-map-value ${l.layer}${box ? '' : ' dot'}" tabindex="0" aria-label="${esc(title)}"><title>${esc(title)}</title>`;
      if (!box) {
        const [x, y] = k.at(0.5); dots++;
        values[i] = head + `<circle cx="${n(x)}" cy="${n(y)}" r="4.5"/></g>`;
        return;
      }
      boxes.push(box);
      values[i] = head + (box.lead ? `<line class="pl-map-leader" x1="${n(box.px)}" y1="${n(box.py)}" x2="${n(box.x + w / 2)}" y2="${n(box.y + h / 2)}"/>` : '') +
        `<rect x="${box.x}" y="${box.y}" width="${w}" height="${h}" rx="4"/>` +
        `<text x="${n(box.x + w / 2)}" y="${n(box.y + 12)}" text-anchor="middle">${esc(caption)}</text></g>`;
    });
    const connections = curves.map(({ l, a, b, c }) => {
      const value = l.value;
      const title = `${l.a.name} → ${l.b.name}: ${value ? value.ms + ' ms' : 'No data'}`;
      return `<path class="pl-map-link ${l.layer}${value ? '' : ' unknown'}" d="M${a}Q${n(c[0])},${n(c[1])} ${b}"><title>${esc(title)}</title></path>`;
    }).join('');
    const tip = dots ? ` ${dots} value${dots === 1 ? ' is' : 's are'} shown as a dot where the map is crowded: hover or focus a dot, focus a location, or zoom in.` : '';
    return `<svg class="pl-map-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="Selected regions, peering locations and latency connections">` +
      basemap(project) + connections + values.join('') + markers.join('') + '</svg>' +
      `<p class="pl-cap pl-map-count" role="status">${points.length} locations · ${visible.length} visible comparisons. Select a marker to focus; select it again to clear.${tip}</p>`;
  }

  function view() {
    const data = model();
    return K.section('Geographic view', `<div class="pl-map" id="pl-latency-map"><div class="pl-map-tools">` +
      `<label for="pl-map-focus">Focus location</label><select class="pl-sel" id="pl-map-focus"><option value="">All selected locations</option>` +
      data.points.map(p => `<option value="${esc(p.id)}"${state.focus === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('') + '</select>' +
      `<button class="pl-btn" type="button" data-map-act="zoom-in" aria-label="Zoom map in">+</button>` +
      `<button class="pl-btn" type="button" data-map-act="zoom-out" aria-label="Zoom map out">−</button>` +
      `<button class="pl-btn" type="button" data-map-act="fit">Fit selections</button>` +
      `<button class="pl-btn" type="button" data-map-act="reset">Reset map</button></div>` +
      `<div class="pl-map-layers" role="group" aria-label="Map connection layers">${layers.map(([id, label]) =>
        `<label class="pl-map-layer ${id}"><input type="checkbox" data-map-layer="${id}"${state.layers[id] ? ' checked' : ''}><span>${label}</span></label>`).join('')}</div>` +
      `<div class="pl-map-key">${[['current', 'Current region'], ['candidate', 'Candidate region'], ['peering', 'ExpressRoute peering'], ['city', 'Customer city']].map(([kind, label]) =>
        `<span class="${kind}"><i aria-hidden="true"></i>${label}</span>`).join('')}</div>` +
      (failure ? K.mb('warning', esc(failure)) : !geometry ? '<p class="pl-cap" role="status">Loading geographic boundaries…</p>' : '') +
      `<div class="pl-map-stage">${mapBody(data)}</div>` +
      (data.missing.length ? K.mb('warning', 'Not plotted: ' + esc(data.missing.join(', ')) + '. These locations have no reference coordinates; their table entries are unchanged.') : '') +
      `<p class="pl-fn">Values use the same evidence as the Latency tables: ~ estimated or derived, * edited. Hover or focus a latency badge for the source, direction and distance. City links show only the provider-network leg, not edited end-to-end totals. Lines are comparisons, not circuits or physical routes; shared metros are visually offset. Boundaries: Natural Earth (public domain), generalized and not legal boundaries. No capital labels.</p></div>`,
      { desc: 'Your Scope regions and Latency locations, mapped without another comparison table. Region tooltips identify the Azure geography.' });
  }

  async function mount() {
    if (geometry || loading || failure) return;
    loading = true;
    try {
      const response = await fetch('assets/planner-map.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data.countries) || !Array.isArray(data.administrative)) throw new Error('Invalid boundary data');
      geometry = data;
    } catch (error) {
      failure = 'Geographic boundaries could not be loaded (' + error.message + '). Locations and latency comparisons remain available. Serve the published docs folder over HTTP and reload to retry.';
    } finally {
      loading = false;
      if (M.ui.tab === 'latency' || M.ui.tab === 'design') K.hooks.render();
    }
  }
  function patch(root) {
    const stage = root.querySelector('.pl-map-stage');
    if (stage) stage.innerHTML = mapBody(model());
  }
  function refresh() {
    const root = document.getElementById('pl-latency-map');
    if (!root) return;
    const active = document.activeElement;
    const layer = active.dataset.mapLayer, action = active.dataset.mapAct, arg = active.dataset.mapArg;
    root.outerHTML = (() => { const wrapper = document.createElement('div'); wrapper.innerHTML = view(); return wrapper.querySelector('#pl-latency-map').outerHTML; })();
    const updated = document.getElementById('pl-latency-map');
    const focus = active.id ? document.getElementById(active.id) : [...updated.querySelectorAll('[data-map-act], [data-map-layer]')].find(e =>
      layer ? e.dataset.mapLayer === layer : e.dataset.mapAct === action && e.dataset.mapArg === arg);
    if (focus) focus.focus({ preventScroll: true });
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('#pl-latency-map [data-map-act]');
    if (!button) return;
    switch (button.dataset.mapAct) {
      case 'focus': state.focus = state.focus === button.dataset.mapArg ? '' : button.dataset.mapArg; break;
      case 'zoom-in': state.zoom = Math.min(3, state.zoom * 1.25); break;
      case 'zoom-out': state.zoom = Math.max(0.5, state.zoom / 1.25); break;
      case 'fit': state.zoom = 1; break;
      case 'reset': state.focus = ''; state.zoom = 1; layers.forEach(([id, , on]) => { state.layers[id] = on; }); break;
    }
    refresh();
  });
  document.addEventListener('change', event => {
    const target = event.target;
    if (target.id === 'pl-map-focus') state.focus = target.value;
    else if (target.dataset.mapLayer && target.closest('#pl-latency-map')) state.layers[target.dataset.mapLayer] = target.checked;
    else return;
    refresh();
  });
  document.addEventListener('keydown', event => {
    const marker = event.target.closest('#pl-latency-map g[data-map-act]');
    if (marker && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); marker.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  M.latencyMap = { view, mount, patch };
})(window);
