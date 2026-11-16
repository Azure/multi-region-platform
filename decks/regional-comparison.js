const { C, F } = require('./lib');

module.exports = (s, L, drivers) => {
  const platformServices = 'Security\nIdentity\nManagement\nNetworking';
  const selectedServices = 'Selected\nLanding\nZones\nPlatform\nShared\nServices';
  const base = 4.25;
  const panels = [
    { x: 0.6, w: 4.3, title: 'A fixed regional pair', cap: 'TRADITIONAL MODEL', fill: C.wash },
    { x: 5.75, w: 6.98, title: 'An adaptable multi-region platform', cap: 'REGIONS AS QUALIFIED OPTIONS', fill: C.b50 },
  ];
  panels.forEach((p, i) => {
    L.box(s, p.x, 1.72, p.w, 4.92, { fill: p.fill, r: 0.14 });
    L.txt(s, p.title, p.x + 0.2, 1.85, i ? 3.6 : 2.2, 0.28, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'middle' });
    const capWidth = i ? 2.78 : 1.65;
    L.txt(s, p.cap, p.x + p.w - capWidth - 0.2, 1.89, capWidth, 0.2, { fontSize: 9, bold: true, color: i ? C.b600 : C.faint, align: 'right', charSpacing: 1 });
    L.box(s, p.x + 0.2, 4.64, p.w - 0.4, 0.74, { fill: C.s800, r: 0.08 });
    L.txt(s, 'One consistent, governed\nAzure landing-zone foundation', p.x + 0.32, 4.7, p.w - 0.64, 0.32, { fontSize: 9.5, bold: true, color: 'FFFFFF' });
    L.txt(s, 'Identity · Connectivity · Security\nManagement · Application delivery', p.x + 0.32, 5.02, p.w - 0.64, 0.3, { fontSize: 9, color: 'C9D4E2' });
    L.txt(s, i ? 'GOVERNED RESPONSE TO CHANGE' : 'EVOLVING REGIONAL CONDITIONS', p.x + 0.2, 5.48, p.w - 0.4, 0.2, { fontSize: 9.5, bold: true, color: C.w600, charSpacing: 1 });
    const chips = i ? ['Qualified regional options', 'Selective platform services', 'Workload-led placement', 'Continuous revalidation'] : drivers;
    const widths = chips.map(t => Math.min(t.length * 9.5 * 0.0078 + 0.28, (p.w - 0.48) / 2));
    const column = Math.max(widths[0], widths[2]) + 0.08;
    chips.forEach((text, j) => {
      L.chip(s, text, p.x + 0.2 + (j % 2) * column, 5.7 + Math.floor(j / 2) * 0.28, { w: widths[j], h: 0.24, size: 9.5, fill: C.w100, color: C.w600 });
    });
    const note = i
      ? 'Qualify additional regions and adopt only the platform capabilities each workload needs, while keeping one governed operating model.'
      : 'Works while demand and placement remain predictable; becomes less adaptable as conditions evolve.';
    L.txt(s, note, p.x + 0.2, 6.28, p.w - 0.4, 0.32, { fontSize: 9.5, color: C.muted });
  });

  const full = [['Workloads', C.t600, 'FFFFFF', 0.3], [platformServices, C.b600, 'FFFFFF', 1.2]];
  const region = (x, w, name, h, blocks, label, extra) => {
    const y = base - h;
    L.box(s, x, y, w, h, { fill: 'FFFFFF', line: extra === 'Candidate' ? C.b500 : C.b300, dash: 'dash', r: 0.08 });
    L.icon(s, 'pin', x + 0.07, y + 0.08, 0.16, 'b');
    L.txt(s, name, x + 0.26, y + 0.05, w - 0.3, name.includes('\n') ? 0.34 : 0.22, { fontSize: 9.5, bold: true, color: C.b700 });
    let by = base - 0.1 - (extra && blocks.length ? 0.44 : 0);
    blocks.slice().reverse().forEach(([text, fill, color, height, line]) => {
      by -= height;
      L.box(s, x + 0.07, by, w - 0.14, height, { fill, line, r: 0.05 });
      L.txt(s, text, x + 0.07, by, w - 0.14, height, { fontSize: 9.5, bold: true, color, align: 'center', valign: 'middle' });
      by -= 0.05;
    });
    if (extra) L.txt(s, extra, x + 0.04, base - 0.43, w - 0.08, 0.33, { fontSize: 9.5, bold: true, color: C.b700, align: 'center', valign: 'middle' });
    L.txt(s, label, x - 0.02, 4.3, w + 0.04, 0.32, { fontSize: 9.5, color: C.muted, align: 'center', valign: 'middle' });
  };
  region(0.8, 1.76, 'Region A\n(Primary)', 2.1, full, 'Full-Platform\nregion');
  region(2.94, 1.76, 'Region B\n(DR)', 2.1, full, 'Full-Platform\nregion');
  L.line(s, 2.58, 3.2, 2.92, 3.2, { color: C.faint, both: true, w: 1 });
  const options = [
    ['Region C', 2.1, full, 'Full-Platform\nregion'],
    ['Region D', 2.1, full, 'Full-Platform\nregion'],
    ['Region E', 1.85, [['Workloads', C.t600, 'FFFFFF', 0.3], [selectedServices, 'FFFFFF', C.b700, 0.95, C.b300]], 'Minimal platform'],
    ['Region F', 1.2, [['Workloads', C.t600, 'FFFFFF', 0.3]], 'Remote platform', '↔ Remote\nplatform'],
    ['Region G', 0.98, [['Governance-Only', C.t100, C.t700, 0.46]], 'Governance-Only'],
    ['Region H', 0.8, [], 'Not enabled', 'Candidate'],
  ];
  const width = 1.055, gap = 0.06;
  options.forEach(([name, height, blocks, label, extra], i) => region(5.95 + i * (width + gap), width, name, height, blocks, label, extra));
  L.line(s, 5.0, 3.05, 5.6, 3.05, { color: C.b600, w: 2 });
  L.txt(s, 'Extend,\nnot\nreplicate', 4.9, 3.17, 0.85, 0.7, { fontSize: 10, bold: true, color: C.b700, align: 'center' });
};
