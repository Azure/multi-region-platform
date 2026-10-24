// Shared design system for the multi-region platform decks (pptxgenjs, LAYOUT_WIDE 13.333 x 7.5 in).
//
// Rules every slide module follows:
//   const s = L.slide('part2');                 // section key from the deck's sections table; draws the footer
//   L.header(s, 'Check 3', 'Slide title', {…}); // eyebrow = section label + kicker; the title becomes the slide's title placeholder
//   L.title(s, 'Slide title', x, y, w, h, {…}); // for slides that place the title themselves (exactly one per slide)
//   L.icon / L.image always carry alt text.
//   Type: body text 11 pt or more; labels, chips, captions and footers 9 pt or more. `node qa.js` enforces the floor.
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');

const SUMMARY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'shared', 'summary.json'), 'utf8'));

// Color tokens: same values as whitepaper/styles.css (site/tools/check_tokens.py compares them with shared/summary.json).
const C = {
  ink: '0A2340', text: '28323E', muted: '5B6778', faint: '667182', line: 'D3DBE4', soft: 'E4E9EF', wash: 'F5F8FB', white: 'FFFFFF',
  b800: '0B3A63', b700: '0F548C', b600: '0F6CBD', b500: '2B88D8', b300: '8CC0EE', b200: 'BCD9F5', b100: 'DDEBF9', b50: 'EEF5FC',
  c600: '0A8BB0', t700: '03615F', t600: '04807A', t300: '7CC9C3', t100: 'D6EFEC', t50: 'EDF8F6',
  s800: '243A57', s600: '4A5B72', s300: 'A9B6C6', s100: 'E8EDF3',
  w600: 'A84E1F', w100: 'F8E8DD', w50: 'FBF4EE', g700: '0B6B38', g600: '107C41', g100: 'DFF1E6', v700: '5C3D9C', v600: '8661C5', v100: 'EBE5F7', v50: 'F3EFFA',
  a700: '8A5A00', a500: 'C98A00', a100: 'FFF1CC',
};
const F = { body: 'Segoe UI', semi: 'Segoe UI Semibold', light: 'Segoe UI Light' };
const MIN = { body: 11, label: 9 };
const TITLE_NAME = 'Title';   // shape name that save() turns into the slide's title placeholder
// Artwork: img/<name> is the blue set (full deck); img/teal/<name> is the executive set. Regenerate both with render_art.py.
const IMG = (n, tone = 'blue') => path.join(__dirname, 'img', tone === 'teal' ? 'teal' : '', n);
const ICON = (name, c = 'b') => path.join(__dirname, 'img', 'ic', `${name}-${c}.png`);
const ICON_ALT = { pin: 'Location', shield: 'Security', id: 'Identity', monitor: 'Monitoring', network: 'Network', gear: 'Automation', gauge: 'Capacity', building: 'Datacenter', users: 'Users', data: 'Data', app: 'Application', hub: 'Hub', spoke: 'Spoke', check: 'Yes', x: 'No', clock: 'Pending', doc: 'Record', lock: 'Compliance', layers: 'Layers', route: 'Route', search: 'Assessment', flag: 'Takeaway', loop: 'Feedback' };

function makeLib(pres, opts = {}) {
  const sections = opts.sections || [];
  const byKey = Object.fromEntries(sections.map(sec => [sec.key, sec]));
  const L = { n: 0, fig: 0, brand: opts.brand || 'Multi-Region Platform Whitepaper', tone: opts.tone || 'blue', sections, data: SUMMARY, C, F, MIN };

  pres.theme = { headFontFace: F.semi, bodyFontFace: F.body };
  // Content slides carry slide numbers; covers and closing slides use the default layout.
  pres.defineSlideMaster({
    title: 'CONTENT', background: { color: 'FFFFFF' },
    objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.7, w: 8.6, h: 0.9, fontFace: F.semi, fontSize: 26, color: C.ink, valign: 'top', align: 'left', margin: 0 }, text: '' } }],
    slideNumber: { x: 11.93, y: 7.06, w: 0.8, h: 0.26, fontFace: F.body, fontSize: 9, bold: true, color: C.ink, align: 'right' },
  });
  sections.filter(sec => sec.section !== false).forEach(sec => pres.addSection({ title: sec.label }));

  // A slide in a section. Content slides get the brand, the section label and a live slide number in the footer.
  // { bare: true } for covers and closing slides: no footer, no number.
  L.slide = (key, o = {}) => {
    const sec = byKey[key];
    if (!sec) throw new Error(`Unknown section "${key}". Known: ${sections.map(x => x.key).join(', ')}`);
    const s = pres.addSlide({ masterName: o.bare ? undefined : 'CONTENT', sectionTitle: sec.section === false ? undefined : sec.label });
    L.n++;
    s._sec = sec; s._hasTitle = false;
    if (!o.bare) {
      s.background = { color: 'FFFFFF' };
      L.txt(s, L.brand, 0.6, 7.06, 4, 0.26, { fontSize: MIN.label, color: C.faint, valign: 'middle' });
      L.txt(s, (sec.footer || sec.label).toUpperCase(), 4.6, 7.06, 7.2, 0.26, { fontSize: MIN.label, color: sec.color || C.b600, bold: true, align: 'right', charSpacing: 1, valign: 'middle' });
    }
    return s;
  };

  L.txt = (s, text, x, y, w, h, o = {}) => {
    const opts = Object.assign({ x, y, w, h, fontFace: F.body, fontSize: 12, color: C.text, margin: 0, valign: 'top', isTextBox: true, paraSpaceAfter: 0 }, o);
    s.addText(text, opts);
  };
  // The slide title. Exactly one per slide; save() marks it as the title placeholder so outline view,
  // slide-sorter names and the accessibility checker see it.
  L.title = (s, text, x, y, w, h, o = {}) => {
    if (s._hasTitle) throw new Error('A slide can have only one L.title / L.header');
    s._hasTitle = true;
    L.txt(s, text, x, y, w, h, Object.assign({ fontSize: 26, fontFace: F.semi, color: C.ink, align: 'left', objectName: TITLE_NAME }, o));
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

  // Pictures always carry alt text: pptxgenjs writes the file path into the picture description when none is given.
  L.image = (s, file, box, alt, o = {}) => {
    if (!alt) throw new Error('L.image needs alt text: ' + file);
    s.addImage(Object.assign({ path: file, altText: alt }, box, o));
  };
  L.icon = (s, name, x, y, d, c = 'b', alt) => s.addImage({ path: ICON(name, c), x, y, w: d, h: d, altText: alt || (ICON_ALT[name] || name) + ' icon' });
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

  // Standard content-slide chrome. The eyebrow is the section label, then the optional kicker.
  //   o.eyebrow  replaces the whole eyebrow text;  o.ec  eyebrow color (defaults to the section color)
  L.header = (s, kicker, title, o = {}) => {
    const sec = s._sec || {};
    const eyebrow = o.eyebrow !== undefined ? o.eyebrow : [sec.eyebrow !== undefined ? sec.eyebrow : sec.label, kicker].filter(Boolean).join(' · ');
    L.txt(s, eyebrow.toUpperCase(), 0.6, 0.42, 8.6, 0.25, { fontSize: 10, bold: true, color: o.ec || sec.color || C.b600, charSpacing: 3 });
    L.title(s, title, 0.6, 0.7, o.tw || 8.6, o.th || 0.9, { fontSize: o.ts || 26, valign: 'top', lineSpacingMultiple: 0.95 });
    if (o.lede) {
      const normalizeFullDeckLede = L.n >= 28 && L.n <= 52;
      L.txt(s, o.lede, normalizeFullDeckLede ? 9.1 : o.lx || 9.5, 0.46,
        normalizeFullDeckLede ? 3.63 : o.lw || 3.23, o.lh || 1.2,
        { fontSize: normalizeFullDeckLede ? 12 : o.ls || 12, color: C.muted, lineSpacingMultiple: 1.1 });
    }
  };
  L.caption = (s, label, text, x, y, w) => {
    if (label === 'Figure') label = 'Figure ' + (++L.fig);
    L.txt(s, [{ text: label.toUpperCase() + '   ', options: { bold: true, color: C.b600, charSpacing: 2, fontSize: 9 } }, { text, options: { color: C.muted, fontSize: 10 } }], x, y, w, 0.42, { lineSpacingMultiple: 1.05 });
  };

  // bullet list (native bullets)
  L.bullets = (s, items, x, y, w, h, o = {}) => {
    const arr = items.map((t, i) => ({ text: t, options: { bullet: { indent: o.indent || 14 }, breakLine: i < items.length - 1, paraSpaceAfter: o.gap === undefined ? 4 : o.gap } }));
    L.txt(s, arr, x, y, w, h, Object.assign({ fontSize: 11, color: C.text }, o.opts || {}));
  };
  // card with badge icon, title, body
  L.card = (s, x, y, w, h, o) => {
    L.box(s, x, y, w, h, { fill: o.fill || C.wash, line: o.line, r: 0.12, shadow: o.shadow });
    if (o.icon) { L.badge(s, o.icon, x + 0.2, y + 0.2, 0.42, o.ic || C.b600); }
    L.txt(s, o.title, x + (o.icon ? 0.75 : 0.2), y + 0.16, w - (o.icon ? 0.95 : 0.4), 0.5, { fontSize: o.ts || 12.5, fontFace: F.semi, color: o.tc || C.ink, valign: 'middle' });
    if (o.body) L.txt(s, o.body, x + 0.2, y + 0.78, w - 0.4, h - 0.9, { fontSize: o.bs || 11, color: o.bc || C.text, lineSpacingMultiple: 1.05 });
  };

  // Decision callout used by the check and choice slides. tone: b (blue), w (warm, exclusion), t (teal)
  L.decision = (s, text, x, y, w, h, tone = 'b', label = 'DECISION') => {
    const bg = { b: C.b50, w: C.w50, t: C.t50 }[tone], fg = { b: C.b700, w: C.w600, t: C.t700 }[tone];
    L.box(s, x, y, w, h, { fill: bg, r: 0.1 });
    L.icon(s, tone === 'w' ? 'x' : 'check', x + 0.18, y + 0.18, 0.26, tone === 'w' ? 'o' : tone === 't' ? 't' : 'b');
    L.txt(s, label, x + 0.56, y + 0.14, 2, 0.2, { fontSize: 9, bold: true, color: fg, charSpacing: 2 });
    L.txt(s, text, x + 0.56, y + 0.36, w - 0.75, h - 0.45, { fontSize: 12, color: C.ink, fontFace: F.semi });
  };

  // Mini connectivity-profile glyph (native shapes), 0.72 x 0.46 in. k = 0 No Hub … 3 Full Hub
  L.PROFILES = SUMMARY.profiles;
  L.glyph = (s, k, x, y) => {
    const bg = k < 2 ? C.t50 : C.b50, ln = k < 2 ? C.t300 : C.b300;
    if (k === 1) { L.box(s, x, y, 0.44, 0.46, { fill: bg, line: ln, dash: 'dash', r: 0.07 }); L.box(s, x + 0.12, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); L.line(s, x + 0.44, y + 0.23, x + 0.56, y + 0.23, { color: C.b500, arrow: false }); L.oval(s, x + 0.56, y + 0.15, 0.16, { fill: C.b600 }); return; }
    L.box(s, x, y, 0.72, 0.46, { fill: bg, line: ln, dash: 'dash', r: 0.07 });
    if (k === 0) { L.box(s, x + 0.12, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); L.box(s, x + 0.4, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
    if (k === 2) { L.oval(s, x + 0.11, y + 0.12, 0.22, { fill: 'FFFFFF', line: C.b500, lw: 1.5 }); L.box(s, x + 0.42, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
    if (k === 3) { L.oval(s, x + 0.1, y + 0.11, 0.24, { fill: C.b600 }); L.oval(s, x + 0.18, y + 0.19, 0.08, { fill: 'FFFFFF' }); L.box(s, x + 0.42, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
  };

  // Write the file, then mark each slide's title box as its title placeholder.
  // pptxgenjs ignores position and size on placeholder text, so titles are written as text boxes and tagged here.
  L.save = async (fileName) => {
    const buf = await pres.write({ outputType: 'nodebuffer' });
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    let titleIndex;
    for (const n of Object.keys(zip.files).filter(n => /^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(n))) {
      const layout = await zip.file(n).async('string');
      if (!layout.includes('name="CONTENT"')) continue;
      const placeholder = layout.match(/<p:ph\b[^>]*\btype="title"[^>]*\/>/);
      titleIndex = placeholder && (placeholder[0].match(/\bidx="(\d+)"/) || [null, '0'])[1];
    }
    if (typeof titleIndex !== 'string') throw new Error('CONTENT layout has no title placeholder');
    const untitled = [];
    for (const n of names) {
      let xml = await zip.file(n).async('string');
      // Replace the empty layout copy, rather than leaving a second title for PowerPoint to inherit.
      xml = xml.replace(/<p:sp>(?:(?!<\/p:sp>).)*<\/p:sp>/gs, shape => {
        if (!/<p:ph\b[^>]*\btype="title"/.test(shape)) return shape;
        if (/<a:t>[^<\s]/.test(shape)) throw new Error(`Unexpected populated layout title in ${n}`);
        return '';
      });
      const re = new RegExp(`(<p:cNvPr id="\\d+" name="${TITLE_NAME}"[^>]*>(?:</p:cNvPr>)?)<p:cNvSpPr[^>]*/>\\s*<p:nvPr>\\s*</p:nvPr>`);
      if (!re.test(xml)) { untitled.push(n.match(/slide(\d+)/)[1]); continue; }
      xml = xml.replace(re, `$1<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title" idx="${titleIndex}"/></p:nvPr>`);
      zip.file(n, xml);
    }
    if (untitled.length) throw new Error('Slides without a title (use L.header or L.title): ' + untitled.join(', '));
    fs.mkdirSync(path.dirname(fileName), { recursive: true });
    fs.writeFileSync(fileName, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
    return fileName;
  };
  return L;
}

module.exports = { C, F, MIN, IMG, ICON, SUMMARY, makeLib };
