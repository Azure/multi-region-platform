const { C, F, IMG } = require('../lib');

module.exports = (pres, L) => {
  const s = L.slide('back', { bare: true });
  s.background = { path: IMG('bg_full.jpg', L.tone) };
  L.logo(s, 0.6, 0.6, 0.14, 'FFFFFF', 17);
  L.txt(s, 'Whitepaper briefing', 10.3, 0.57, 2.43, 0.35, { fontSize: 13, fontFace: F.semi, color: 'FFFFFF', align: 'right' });
  L.title(s, [{ text: 'The adaptable ', options: { fontFace: F.light } }, { text: 'multi-region', options: { fontFace: F.semi } }, { text: ' Azure platform', options: { fontFace: F.light } }], 0.6, 2.2, 7.2, 1.3, { fontSize: 34, color: 'FFFFFF', fontFace: F.light });
  L.txt(s, 'The framework, service guides, Resources, and current planning tool are on the website.', 0.6, 3.6, 6.6, 0.45, { fontSize: 14, color: C.b100 });
  const links = [['WEBSITE', 'azure.github.io/multi-region-platform', L.data.siteUrl, 4.08], ['PLANNING TOOL', L.data.plannerName, L.data.workbookUrl, 4.66]];
  links.forEach(([label, text, url, y]) => {
    L.txt(s, label, 0.6, y, 1.5, 0.46, { fontSize: 10, bold: true, color: C.b200, charSpacing: 2, valign: 'middle' });
    L.box(s, 2.25, y, 4.55, 0.46, { fill: 'FFFFFF', r: 0.23 });
    L.txt(s, [{ text, options: { hyperlink: { url }, color: C.b600, underline: { style: 'sng', color: C.b600 } } }], 2.25, y, 4.55, 0.46, { fontSize: 13, fontFace: F.semi, align: 'center', valign: 'middle' });
  });
  L.txt(s, L.brand + ' · ' + L.data.edition, 0.6, 5.84, 6.5, 0.22, { fontSize: 10.5, color: C.b100 });
  L.box(s, 0, 6.12, 13.333, 0.85, { fill: C.s800, r: 0 });
  L.txt(s, L.data.legal, 0.6, 6.26, 12.13, 0.56, { fontSize: 9, color: 'FFFFFF' });
};
