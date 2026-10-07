// Region planning workbook — icons, status glyphs, and the small diagrams.
// Drawn for this page on a 16px grid with 1.5px strokes. Colors come from CSS (currentColor and the diagram classes in planner.css).
(function (global) {
  'use strict';
  const M = global.MRP || (global.MRP = {});

  const P = {
    save: '<path d="M3.25 2.75h7.9l1.6 1.6v8.9h-9.5z"/><path d="M5.25 2.75v3h4.5v-3M5.25 13.25v-4h5.5v4"/>',
    open: '<path d="M1.75 12.75v-9h4l1.5 1.5h5.5v2"/><path d="M1.75 12.75l1.75-5.5h11l-1.75 5.5z"/>',
    export: '<path d="M9.25 1.75H4a1 1 0 0 0-1 1v10.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5z"/><path d="M9.25 1.75V5.5H13"/><path d="M8 12V8M6 9.75l2-2 2 2"/>',
    sample: '<path d="M8.5 1.75H4a1 1 0 0 0-1 1v10.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7"/><path d="M12 1.5v4M10 3.5h4"/><path d="M5.5 8.75h5M5.5 11.5h3"/>',
    delete: '<path d="M2.75 4.25h10.5M6.25 4.25v-1.5h3.5v1.5M4.25 4.25l.6 8.6a1 1 0 0 0 1 .9h4.3a1 1 0 0 0 1-.9l.6-8.6M6.75 7v4M9.25 7v4"/>',
    add: '<path d="M8 3v10M3 8h10"/>',
    close: '<path d="M3.75 3.75l8.5 8.5M12.25 3.75l-8.5 8.5"/>',
    search: '<circle cx="7" cy="7" r="4.25"/><path d="M10.25 10.25l3.5 3.5"/>',
    down: '<path d="M3.75 6l4.25 4.25L12.25 6"/>',
    up: '<path d="M3.75 10l4.25-4.25L12.25 10"/>',
    right: '<path d="M6 3.75l4.25 4.25L6 12.25"/>',
    left: '<path d="M10 3.75L5.75 8 10 12.25"/>',
    arrowright: '<path d="M2.75 8h10M9 4l4 4-4 4"/>',
    arrowleft: '<path d="M13.25 8h-10M7 4L3 8l4 4"/>',
    info: '<circle cx="8" cy="8" r="6.25"/><path d="M8 7.25v3.5M8 5.1v.01"/>',
    globe: '<circle cx="8" cy="8" r="6.25"/><path d="M1.75 8h12.5M8 1.75c1.8 1.7 2.7 3.8 2.7 6.25S9.8 12.55 8 14.25C6.2 12.55 5.3 10.45 5.3 8S6.2 3.45 8 1.75z"/>',
    region: '<path d="M8 14.25s4.5-3.9 4.5-7.5a4.5 4.5 0 0 0-9 0c0 3.6 4.5 7.5 4.5 7.5z"/><circle cx="8" cy="6.75" r="1.6"/>',
    hub: '<path d="M8 1.75l5.4 3.12v6.26L8 14.25l-5.4-3.12V4.87z"/><circle cx="8" cy="8" r="1.75"/>',
    spoke: '<path d="M5 4.5L1.75 8 5 11.5M11 4.5L14.25 8 11 11.5"/><path d="M8 8h.01"/>',
    gateway: '<path d="M2.5 5.5h9M9 3l2.5 2.5L9 8M13.5 10.5h-9M7 8l-2.5 2.5L7 13"/>',
    firewall: '<path d="M8 1.75l5 1.75v4.2c0 3-2.1 5.2-5 6.55-2.9-1.35-5-3.55-5-6.55V3.5z"/><path d="M5.75 8l1.6 1.6 3-3.2"/>',
    dns: '<rect x="2.25" y="2.75" width="11.5" height="4" rx="1"/><rect x="2.25" y="9.25" width="11.5" height="4" rx="1"/><path d="M4.75 4.75h.01M4.75 11.25h.01M8 4.75h4M8 11.25h4"/>',
    people: '<circle cx="6" cy="5.25" r="2.25"/><path d="M1.75 13.25c0-2.4 1.9-4 4.25-4s4.25 1.6 4.25 4"/><circle cx="11.5" cy="5.75" r="1.75"/><path d="M11.5 9.5c1.7 0 2.75 1.2 2.75 3.5"/>',
    logs: '<path d="M2.75 4h.01M5.5 4h7.75M2.75 8h.01M5.5 8h7.75M2.75 12h.01M5.5 12h5"/>',
    backup: '<path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.75M2.75 2.75v3h3"/><path d="M8 5.25V8l1.75 1.25"/>',
    key: '<circle cx="5.25" cy="10.75" r="2.75"/><path d="M7.25 8.75l6-6M10.75 5.25l1.75 1.75M12.25 3.75l1.5 1.5"/>',
    building: '<rect x="3.25" y="2.25" width="9.5" height="11.5" rx="1"/><path d="M6 5.25h.01M10 5.25h.01M6 8h.01M10 8h.01M6.75 13.75v-2.5h2.5v2.5"/>',
    cloud: '<path d="M4.5 12.75a3 3 0 0 1-.4-5.97 4.25 4.25 0 0 1 8.2 1.1 2.45 2.45 0 0 1-.6 4.87z"/>',
    peering: '<path d="M5.5 1.75v3M10.5 1.75v3M3.75 4.75h8.5v2.5a4.25 4.25 0 0 1-8.5 0zM8 11.5v2.75"/>',
    clock: '<circle cx="8" cy="8" r="6.25"/><path d="M8 4.5V8l2.5 1.5"/>',
    tag: '<path d="M2.25 8.4V2.75h5.65l6 6a1 1 0 0 1 0 1.4l-4.1 4.1a1 1 0 0 1-1.4 0z"/><path d="M5.25 5.25h.01"/>',
    list: '<path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01"/>',
    checklist: '<path d="M2.25 4.25l1.25 1.25 2-2.25M2.25 9l1.25 1.25 2-2.25M8 4.5h5.5M8 9.25h5.5M8 13.5h5.5M2.5 13.5h.01"/>',
    edit: '<path d="M10.5 2.75l2.75 2.75L5.5 13.25l-3.5.75.75-3.5z"/><path d="M9 4.25l2.75 2.75"/>',
    reset: '<path d="M3 8a5 5 0 1 0 1.6-3.65M3 2.75v3.1h3.1"/>',
    copy: '<rect x="5.25" y="5.25" width="8" height="8" rx="1.25"/><path d="M10.75 5.25V3.5a1.25 1.25 0 0 0-1.25-1.25H3.75A1.25 1.25 0 0 0 2.5 3.5v5.75a1.25 1.25 0 0 0 1.25 1.25h1.5"/>',
    print: '<path d="M4.25 5.25v-3h7.5v3M4.25 11.25h-1.5a1 1 0 0 1-1-1v-3.5a1 1 0 0 1 1-1h10.5a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-1.5"/><rect x="4.25" y="8.75" width="7.5" height="4.75"/>',
    lock: '<rect x="3.25" y="7" width="9.5" height="6.75" rx="1.25"/><path d="M5.25 7V5a2.75 2.75 0 0 1 5.5 0v2"/>',
    external: '<path d="M9 3h4v4M13 3L7.5 8.5M11 9.5V13H3V5h3.5"/>',
    note: '<path d="M3 2.75h10v8.5H8.5L5.5 14v-2.75H3z"/><path d="M5.75 6h4.5M5.75 8.5h3"/>',
    layers: '<path d="M8 2l6 3.25L8 8.5 2 5.25z"/><path d="M2 8.25l6 3.25 6-3.25M2 11l6 3.25L14 11"/>',
    link: '<path d="M6.75 9.25a2.75 2.75 0 0 0 3.9 0l2-2a2.75 2.75 0 0 0-3.9-3.9l-.6.6M9.25 6.75a2.75 2.75 0 0 0-3.9 0l-2 2a2.75 2.75 0 0 0 3.9 3.9l.6-.6"/>',
    user: '<circle cx="8" cy="5.25" r="2.5"/><path d="M3 13.5c0-2.6 2.2-4.25 5-4.25s5 1.65 5 4.25"/>',
    calendar: '<rect x="2.25" y="3.25" width="11.5" height="10.5" rx="1.25"/><path d="M2.25 6.5h11.5M5.5 1.75v3M10.5 1.75v3"/>',
    pin: '<path d="M8 14.25v-4M5 10.25h6l-.75-3.5 1.5-1.5v-1.5h-7.5v1.5l1.5 1.5z"/>',
    circle: '<circle cx="8" cy="8" r="6.25"/>',
  };

  // `label` makes the icon meaningful to assistive technology; without it the icon is decorative.
  function icon(name, o) {
    o = o || {};
    const a = o.label ? `role="img" aria-label="${String(o.label).replace(/"/g, '&quot;')}"` : 'aria-hidden="true" focusable="false"';
    return `<svg class="pl-i${o.cls ? ' ' + o.cls : ''}" viewBox="0 0 16 16" ${a}>${P[name] || ''}</svg>`;
  }

  // Status glyphs: a filled shape with a white (dark in the dark theme) mark. Color comes from the class.
  const S = {
    success: '<circle class="bg" cx="8" cy="8" r="6.5"/><path class="g" d="M5.2 8.2l2 2 3.6-4.1"/>',
    error: '<circle class="bg" cx="8" cy="8" r="6.5"/><path class="g" d="M5.7 5.7l4.6 4.6M10.3 5.7l-4.6 4.6"/>',
    warning: '<path class="bg" d="M8 1.9l6.4 11.4a.5.5 0 0 1-.44.74H2.04a.5.5 0 0 1-.44-.74z"/><path class="g" d="M8 6.2v3.1M8 11.2v.01"/>',
    info: '<circle class="bg" cx="8" cy="8" r="6.5"/><path class="g" d="M8 7.3v3.4M8 5.2v.01"/>',
    neutral: '<circle class="ring" cx="8" cy="8" r="6.25"/><path class="ring" d="M5.5 8h5"/>',
    none: '<circle class="ring" cx="8" cy="8" r="6.25"/>',
    half: '<circle class="ring" cx="8" cy="8" r="6.25"/><path class="bg" d="M8 2.9a5.1 5.1 0 0 0 0 10.2z"/>',
    lock: '<rect class="ring" x="3.25" y="7" width="9.5" height="6.75" rx="1.25"/><path class="ring" d="M5.25 7V5a2.75 2.75 0 0 1 5.5 0v2"/>',
  };
  function status(kind, label) {
    const a = label ? `role="img" aria-label="${String(label).replace(/"/g, '&quot;')}"` : 'aria-hidden="true" focusable="false"';
    return `<svg class="pl-st ${kind}" viewBox="0 0 16 16" ${a}>${S[kind] || S.none}</svg>`;
  }

  // ───────── diagrams. One visual grammar: dashed rounded rectangle = region, square = workload spoke, hexagon = hub, building = on-premises.
  const hex = (cx, cy, r, cls) => {
    const pts = [0, 1, 2, 3, 4, 5].map(i => `${(cx + r * Math.cos(i * Math.PI / 3)).toFixed(1)},${(cy + r * Math.sin(i * Math.PI / 3)).toFixed(1)}`);
    return `<polygon class="${cls}" points="${pts.join(' ')}"/>`;
  };
  const spoke = (cx, cy) => `<rect class="dg-spoke" x="${cx - 6}" y="${cy - 6}" width="12" height="12" rx="2"/>`;
  const ln = (d, cls) => `<path class="dg-line${cls ? ' ' + cls : ''}" d="${d}"/>`;
  const svg = (w, h, body, label) => `<svg class="pl-dg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" focusable="false">${body}</svg>`;
  const building = (x, y) => `<g class="dg-bldg"><rect x="${x}" y="${y}" width="22" height="32" rx="2"/><path d="M${x + 6} ${y + 8}h.01M${x + 16} ${y + 8}h.01M${x + 6} ${y + 16}h.01M${x + 16} ${y + 16}h.01M${x + 8} ${y + 32}v-7h6v7"/></g>`;

  const TOPO = {
    'Hub-and-spoke virtual networks': svg(120, 68, ln('M60 34L26 14M60 34L94 14M60 34L26 54M60 34L94 54') + hex(60, 34, 12, 'dg-hub') + [[26, 14], [94, 14], [26, 54], [94, 54]].map(p => spoke(...p)).join(''), 'A hub virtual network with four spoke virtual networks'),
    'Azure Virtual WAN': svg(120, 68, ln('M60 34L26 14M60 34L94 14M60 34L26 54M60 34L94 54') + '<circle class="dg-ring" cx="60" cy="34" r="19"/>' + hex(60, 34, 11, 'dg-hub dg-fill') + [[26, 14], [94, 14], [26, 54], [94, 54]].map(p => spoke(...p)).join(''), 'A Virtual WAN hub with four connected virtual networks'),
    'Both': svg(120, 68, ln('M38 34H82') + ln('M38 34L14 14M38 34L14 54', '') + ln('M82 34L106 14M82 34L106 54') + hex(38, 34, 11, 'dg-hub') + '<circle class="dg-ring" cx="82" cy="34" r="17"/>' + hex(82, 34, 10, 'dg-hub dg-fill') + [[14, 14], [14, 54], [106, 14], [106, 54]].map(p => spoke(...p)).join(''), 'A hub virtual network and a Virtual WAN hub, linked'),
    'No hub yet': svg(120, 68, hex(60, 34, 12, 'dg-hub dg-ghost') + [[26, 14], [94, 14], [26, 54], [94, 54]].map(p => spoke(...p)).join('') + ln('M60 34L32 17M60 34L88 17M60 34L32 51M60 34L88 51', 'dg-ghost'), 'Four spoke virtual networks with no hub'),
  };

  // Geographic hub region on the left, the new region on the right, on-premises at the far left.
  const GEO = (dim) => `<g class="${dim ? 'dg-dim' : ''}"><rect class="dg-region dg-small" x="48" y="20" width="56" height="70" rx="8"/>${hex(76, 55, 13, 'dg-hub dg-fill')}${building(6, 39)}${ln('M63 55H28')}</g>`;
  const NEW = '<rect class="dg-region" x="124" y="8" width="108" height="94" rx="10"/>';
  const SPOKES = (x, ys) => ys.map(y => spoke(x, y)).join('');
  const PROFILE = {
    'Disconnected Spokes': svg(240, 112, GEO(true) + NEW + [[158, 36], [198, 36], [158, 74], [198, 74]].map(p => spoke(...p)).join(''), 'Disconnected Spokes: workload spokes in the region, with no link to a hub or to on-premises'),
    'Remote Hub Connected': svg(240, 112, GEO(false) + NEW + SPOKES(212, [28, 55, 82]) + ln('M184 28V82M184 28H206M184 55H206M184 82H206') + ln('M184 55H89'), 'Remote Hub Connected: spokes in the region link across to the hub in the geographic hub region, which links to on-premises'),
    'Minimal Regional Hub': svg(240, 112, GEO(false) + NEW + SPOKES(212, [28, 55, 82]) + ln('M160 55H188M188 28V82M188 28H206M188 55H206M188 82H206') + ln('M140 55H89') + hex(150, 55, 11, 'dg-hub dg-open'), 'Minimal Regional Hub: a small hub in the region with spokes on it, linked to the geographic hub, which links to on-premises'),
    'Full Regional Hub': svg(240, 112, GEO(false) + NEW + SPOKES(212, [28, 55, 82]) + ln('M165 55H188M188 28V82M188 28H206M188 55H206M188 82H206') + ln('M139 55H89', 'dg-peer') + ln('M17 71V107H152V68') + hex(152, 55, 13, 'dg-hub dg-solid'), 'Full Regional Hub: a full hub in the region with spokes on it, its own link to on-premises, and a peer link to the other hub'),
  };

  M.icon = icon; M.status = status; M.icons = P;
  M.diagram = { topology: id => TOPO[id] || '', profile: id => PROFILE[id] || '' };
})(window);
