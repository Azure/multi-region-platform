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
    const width = Math.max(12, Math.max(...xs) - Math.min(...xs) + 12);
    const height = Math.max(10, Math.max(...ys) - Math.min(...ys) + 10);
    const scale = Math.min(850 / (width * correction), 430 / height) * state.zoom;
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

  function mapBody(data) {
    if (!data.points.length) return '<p class="pl-muted">No selected locations have coordinates. Add reference regions in Scope or locations above.</p>';
    const project = projection(data.points), boxes = [], labels = [];
    const overlap = (a, b) => a.x < b.x + b.w + 3 && a.x + a.w + 3 > b.x && a.y < b.y + b.h + 3 && a.y + a.h + 3 > b.y;
    const place = (x, y, w, h, offsets) => {
      const choices = offsets.map(([dx, dy]) => ({ x: Math.max(6, Math.min(994 - w, x + dx)),
        y: Math.max(6, Math.min(534 - h, y + dy)), w, h }));
      const box = choices.find(b => !boxes.some(a => overlap(a, b))) ||
        choices.sort((a, b) => boxes.filter(c => overlap(c, a)).length - boxes.filter(c => overlap(c, b)).length)[0];
      boxes.push(box); return box;
    };
    const points = data.points.map(p => ({ ...p, xy: project.xy(p.lon, p.lat) }));
    // Separate co-located region/peering markers without changing their metric coordinates.
    points.forEach((p, i) => {
      const nearby = points.slice(0, i).filter(q => Math.hypot(q.xy[0] - p.xy[0], q.xy[1] - p.xy[1]) < 28);
      if (nearby.length) p.xy = [p.xy[0] - 18, p.xy[1] + 24];
      boxes.push({ x: p.xy[0] - 7, y: p.xy[1] - 7, w: 14, h: 14 });
    });
    const byId = new Map(points.map(p => [p.id, p]));
    const markers = points.map(p => {
      const [x, y] = p.xy, w = Math.min(220, p.name.length * 5.6 + 14);
      const b = place(x, y, w, 20, [[12, -10], [-w - 12, -10], [12, 14], [-w - 12, -34], [12, -34], [-w / 2, 24]]);
      const location = p.region ? C.info(p.region).geo + ' geography' : p.kind === 'peering' ? 'ExpressRoute peering location' : 'Customer city';
      return `<g class="pl-map-node ${p.kind}${state.focus && state.focus !== p.id ? ' dim' : ''}" role="button" tabindex="0" data-map-act="focus" data-map-arg="${esc(p.id)}" aria-pressed="${state.focus === p.id}" aria-label="${esc(p.name + ', ' + location + '. Focus connections.')}">` +
        `<title>${esc(p.name + ' · ' + location + ' · approximate metro')}</title>` +
        `<line class="pl-map-leader" x1="${x}" y1="${y}" x2="${b.x + b.w / 2}" y2="${b.y + 10}"/>` +
        (p.kind === 'peering' ? `<rect class="pl-map-pin" x="${x - 5}" y="${y - 5}" width="10" height="10" transform="rotate(45 ${x} ${y})"/>` :
          `<circle class="pl-map-pin" cx="${x}" cy="${y}" r="6"/>`) +
        `<rect class="pl-map-name" x="${b.x}" y="${b.y}" width="${w}" height="20" rx="4"/>` +
        `<text x="${b.x + 7}" y="${b.y + 13.5}">${esc(p.name)}</text></g>`;
    }).join('');
    const visible = data.links.filter(l => state.layers[l.layer] && (!state.focus || l.a.id === state.focus || l.b.id === state.focus));
    const connections = visible.map((l, i) => {
      const a = byId.get(l.a.id).xy, b = byId.get(l.b.id).xy;
      const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.max(1, Math.hypot(dx, dy));
      const bend = Math.min(35, length * 0.16) * (i % 2 ? -1 : 1);
      const cx = (a[0] + b[0]) / 2 - dy / length * bend, cy = (a[1] + b[1]) / 2 + dx / length * bend;
      const x = (a[0] + 2 * cx + b[0]) / 4, y = (a[1] + 2 * cy + b[1]) / 4;
      const value = l.value;
      const caption = value ? `${value.ms} ms${value.edited ? '*' : value.src !== 'm' ? '~' : ''}` : 'No data';
      const source = value ? value.edited ? 'Edited in the table above' : C.srcText(value.src || 'd') : 'No latency data';
      const title = `${l.a.name} → ${l.b.name}: ${value ? value.ms + ' ms' : 'No data'} · ${source} · ${l.distance.toLocaleString()} km great-circle distance`;
      const w = Math.max(42, caption.length * 5.4 + 10);
      const offsets = Array.from({ length: 13 }, (_, j) => [-w / 2 + (j % 3 - 1) * 20, -8 + (Math.ceil(j / 2) * 22 * (j % 2 ? 1 : -1))]);
      const box = place(x, y, w, 17, offsets);
      labels.push(`<g class="pl-map-value ${l.layer}" tabindex="0" aria-label="${esc(title)}"><title>${esc(title)}</title>` +
        `<line class="pl-map-leader" x1="${n(x)}" y1="${n(y)}" x2="${n(box.x + w / 2)}" y2="${n(box.y + 8.5)}"/>` +
        `<rect x="${n(box.x)}" y="${n(box.y)}" width="${w}" height="17" rx="4"/>` +
        `<text x="${n(box.x + w / 2)}" y="${n(box.y + 12)}" text-anchor="middle">${esc(caption)}</text></g>`);
      return `<path class="pl-map-link ${l.layer}${value ? '' : ' unknown'}" d="M${a}Q${n(cx)},${n(cy)} ${b}"><title>${esc(title)}</title></path>`;
    }).join('');
    return `<svg class="pl-map-svg" viewBox="0 0 1000 540" role="group" aria-label="Selected regions, peering locations and latency connections">` +
      basemap(project) + connections + labels.join('') + markers + '</svg>' +
      `<p class="pl-cap pl-map-count" role="status">${points.length} locations · ${visible.length} visible comparisons. Select a marker to focus; select it again to clear.</p>`;
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
