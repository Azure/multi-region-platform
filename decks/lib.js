// Shared design system for the multi-region platform deck (pptxgenjs, LAYOUT_WIDE 13.333 x 7.5 in)
const path = require('path');

const C = {
  ink: '0A2340', text: '28323E', muted: '5B6778', faint: '8A95A5', line: 'D3DBE4', soft: 'E4E9EF', wash: 'F5F8FB', white: 'FFFFFF',
  b800: '0B3A63', b700: '0F548C', b600: '0F6CBD', b500: '2B88D8', b300: '8CC0EE', b200: 'BCD9F5', b100: 'DDEBF9', b50: 'EEF5FC',
  c600: '0A8BB0', t700: '03615F', t600: '04807A', t300: '7CC9C3', t100: 'D6EFEC', t50: 'EDF8F6',
  s800: '243A57', s600: '4A5B72', s300: 'A9B6C6', s100: 'E8EDF3',
  w600: 'A84E1F', w100: 'F8E8DD', w50: 'FBF4EE', g600: '107C41', g100: 'DFF1E6', v600: '8661C5', v50: 'F3EFFA',
};
const F = { body: 'Segoe UI', semi: 'Segoe UI Semibold', light: 'Segoe UI Light' };
const IMG = (n) => path.join(__dirname, 'img', n);
const ICON = (name, c = 'b') => path.join(__dirname, 'img', 'ic', `${name}-${c}.png`);

function makeLib(pres, opts = {}) {
  const L = { n: 0, fig: 0, brand: opts.brand || 'Multi-Region Platform Whitepaper' };
  const _add = pres.addSlide.bind(pres);
  pres.addSlide = (...a) => { L.n++; return _add(...a); };

  L.txt = (s, text, x, y, w, h, o = {}) => {
    const opts = Object.assign({ x, y, w, h, fontFace: F.body, fontSize: 12, color: C.text, margin: 0, valign: 'top', isTextBox: true, paraSpaceAfter: 0 }, o);
    s.addText(text, opts);
  };

  L.box = (s, x, y, w, h, o = {}) => {
    const r = o.r === undefined ? 0.1 : o.r;
    const shape = r ? pres.shapes.ROUNDED_RECTANGLE : pres.shapes.RECTANGLE;
    const opt = { x, y, w, h, fill: o.fill ? { color: o.fill, transparency: o.ft || 0 } : { type: 'none' } };
    if (r) opt.rectRadius = r;
    opt.line = o.line ? { color: o.line, width: o.lw || 1, dashType: o.dash || 'solid' } : { type: 'none' };
    if (o.shadow) opt.shadow = { type: 'outer', color: '0B3A63', opacity: 0.12, blur: 8, offset: 2, angle: 90 };
    s.addShape(shape, opt);
  };

  L.oval = (s, x, y, d, o = {}) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: o.fill ? { color: o.fill } : { type: 'none' }, line: o.line ? { color: o.line, width: o.lw || 1, dashType: o.dash || 'solid' } : { type: 'none' } });
  };

  // straight line; arrow at end by default
  L.line = (s, x1, y1, x2, y2, o = {}) => {
    const lo = { color: o.color || C.b600, width: o.w || 1.25, dashType: o.dash || 'solid' };
    if (o.arrow !== false) lo.endArrowType = 'triangle';
    if (o.both) lo.beginArrowType = 'triangle';
    s.addShape(pres.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.0001), h: Math.max(Math.abs(y2 - y1), 0.0001), flipH: x2 < x1, flipV: y2 < y1, line: lo });
  };
  // orthogonal polyline through points; arrow on last segment
  L.path = (s, pts, o = {}) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const last = i === pts.length - 2;
      L.line(s, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], Object.assign({}, o, { arrow: last && o.arrow !== false, both: i === 0 && o.both }));
    }
  };
  // small pill label on a connector
  L.tag = (s, text, cx, cy, o = {}) => {
    const w = o.w || Math.max(0.42, text.length * 0.075 + 0.2), h = 0.24;
    L.box(s, cx - w / 2, cy - h / 2, w, h, { fill: 'FFFFFF', line: o.color || C.b600, r: 0.12, lw: 0.75 });
    L.txt(s, text, cx - w / 2, cy - h / 2, w, h, { fontSize: 9, bold: true, color: o.color || C.b600, align: 'center', valign: 'middle' });
  };

  L.chip = (s, text, x, y, o = {}) => {
    const w = o.w || text.length * 0.068 + 0.28, h = o.h || 0.26;
    L.box(s, x, y, w, h, { fill: o.fill || C.b100, line: o.line, dash: o.dash, r: h / 2 });
    L.txt(s, text, x, y, w, h, { fontSize: o.size || 9.5, bold: true, color: o.color || C.b700, align: 'center', valign: 'middle' });
    return w;
  };

  L.icon = (s, name, x, y, d, c = 'b') => s.addImage({ path: ICON(name, c), x, y, w: d, h: d });
  // icon in a filled circle/rounded square
  L.badge = (s, name, x, y, d, fill, c = 'w', r) => {
    L.box(s, x, y, d, d, { fill, r: r === undefined ? d * 0.28 : r });
    L.icon(s, name, x + d * 0.22, y + d * 0.22, d * 0.56, c);
  };
  L.num = (s, n, x, y, d, fill, color = 'FFFFFF', size) => {
    L.oval(s, x, y, d, { fill });
    L.txt(s, String(n), x, y, d, d, { fontSize: size || d * 30, bold: true, color, align: 'center', valign: 'middle' });
  };

  L.logo = (s, x, y, sq = 0.13, word = C.muted, size = 15) => {
    const g = sq * 0.16, cols = ['F25022', '7FBA00', '00A4EF', 'FFB900'];
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j], k) => s.addShape(pres.shapes.RECTANGLE, { x: x + i * (sq + g), y: y + j * (sq + g), w: sq, h: sq, fill: { color: cols[k] }, line: { type: 'none' } }));
    if (word) L.txt(s, 'Microsoft', x + 2 * sq + g + sq * 0.7, y - 0.05, 1.6, 2 * sq + g + 0.1, { fontSize: size, fontFace: F.semi, color: word, valign: 'middle' });
  };

  // standard content-slide chrome
  L.header = (s, eyebrow, title, o = {}) => {
    L.txt(s, eyebrow.toUpperCase(), 0.6, 0.42, 8, 0.25, { fontSize: 10, bold: true, color: o.ec || C.b600, charSpacing: 3 });
    L.txt(s, title, 0.6, 0.7, o.tw || 8.6, o.th || 0.9, { fontSize: o.ts || 26, fontFace: F.semi, color: C.ink, valign: 'top', lineSpacingMultiple: 0.95 });
    if (o.lede) L.txt(s, o.lede, o.lx || 9.5, 0.46, o.lw || 3.23, o.lh || 1.2, { fontSize: o.ls || 12, color: C.muted, lineSpacingMultiple: 1.1 });
  };
  L.footer = (s, _n, section) => {
    const n = L.n;
    L.txt(s, L.brand, 0.6, 7.08, 4, 0.22, { fontSize: 8.5, color: C.faint });
    if (section) L.txt(s, section, 4.6, 7.08, 6.5, 0.22, { fontSize: 8.5, color: C.b600, bold: true, align: 'right', charSpacing: 1 });
    L.txt(s, String(n).padStart(2, '0'), 11.93, 7.08, 0.8, 0.22, { fontSize: 9, bold: true, color: C.ink, align: 'right' });
  };
  L.caption = (s, label, text, x, y, w) => {
    if (label === 'Figure') label = 'Figure ' + (++L.fig);
    L.txt(s, [{ text: label.toUpperCase() + '   ', options: { bold: true, color: C.b600, charSpacing: 2, fontSize: 8.5 } }, { text, options: { color: C.muted, fontSize: 10 } }], x, y, w, 0.42, { lineSpacingMultiple: 1.05 });
  };

  // bullet list (native bullets)
  L.bullets = (s, items, x, y, w, h, o = {}) => {
    const arr = items.map((t, i) => ({ text: t, options: { bullet: { indent: o.indent || 14 }, breakLine: i < items.length - 1, paraSpaceAfter: o.gap === undefined ? 4 : o.gap } }));
    L.txt(s, arr, x, y, w, h, Object.assign({ fontSize: 11, color: C.text }, o.opts || {}));
  };
  // card with badge icon, title, body
  L.card = (s, x, y, w, h, o) => {
    L.box(s, x, y, w, h, { fill: o.fill || C.wash, line: o.line, r: 0.12, shadow: o.shadow });
    let ty = y + 0.2;
    if (o.icon) { L.badge(s, o.icon, x + 0.2, y + 0.2, 0.42, o.ic || C.b600); }
    L.txt(s, o.title, x + (o.icon ? 0.75 : 0.2), y + 0.16, w - (o.icon ? 0.95 : 0.4), 0.5, { fontSize: o.ts || 12.5, fontFace: F.semi, color: o.tc || C.ink, valign: 'middle' });
    if (o.body) L.txt(s, o.body, x + 0.2, y + 0.78, w - 0.4, h - 0.9, { fontSize: o.bs || 10.5, color: o.bc || C.text, lineSpacingMultiple: 1.05 });
  };
  return L;
}

module.exports = { C, F, IMG, ICON, makeLib };
