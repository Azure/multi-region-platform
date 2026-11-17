const { C, F } = require('./lib');

module.exports = (s, L, drivers) => {
  const platformServices = 'Security\nIdentity\nManagement\nNetworking';
  const base = 4.05;
  const panels = [
    { x: 0.6, w: 4.3, title: 'A fixed regional pair', cap: 'TRADITIONAL MODEL', fill: C.wash },
    { x: 5.75, w: 6.98, title: 'An adaptable multi-region platform', cap: 'REGIONS AS QUALIFIED OPTIONS', fill: C.b50 },
  ];
  panels.forEach((p, i) => {
    L.box(s, p.x, 1.72, p.w, 4.14, { fill: p.fill, r: 0.14 });
    L.txt(s, p.title, p.x + 0.2, 1.85, i ? 3.6 : 2.2, 0.28, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'middle' });
    const capWidth = i ? 2.78 : 1.65;
    L.txt(s, p.cap, p.x + p.w - capWidth - 0.2, 1.89, capWidth, 0.2, { fontSize: 9, bold: true, color: i ? C.b600 : C.faint, align: 'right', charSpacing: 1 });
    L.box(s, p.x + 0.2, 4.44, p.w - 0.4, 0.3, { fill: C.s800, r: 0.08 });
    L.txt(s, 'Consistent governance and operating practices', p.x + 0.32, 4.44, p.w - 0.64, 0.3, { fontSize: 9.5, bold: true, color: 'FFFFFF', valign: 'middle' });
    L.txt(s, i ? 'Governed response to change' : 'Evolving regional conditions', p.x + 0.2, 4.84, p.w - 0.4, 0.18, { fontSize: 9, bold: true, color: i ? C.t700 : C.w600 });
    const items = i ? ['Qualified regional options', 'Selective platform services', 'Workload-led placement', 'Continuous revalidation'] : drivers;
    const column = (p.w - 0.4) / 2;
    items.forEach((text, j) => {
      const x = p.x + 0.2 + (j % 2) * column, y = 5.06 + Math.floor(j / 2) * 0.22;
      L.box(s, x, y + 0.055, 0.035, 0.035, { fill: i ? C.t600 : C.w600, r: 0 });
      L.txt(s, text, x + 0.09, y, column - 0.17, 0.18, { fontSize: 9, color: C.text });
    });
    const note = i
      ? 'Qualify additional regions and adopt only the platform capabilities each workload needs, while keeping one governed operating model.'
      : 'Works while demand and placement remain predictable;\nbecomes less adaptable as conditions evolve.';
    L.txt(s, note, p.x + 0.2, 5.52, p.w - 0.4, 0.3, { fontSize: 9, color: C.muted });
  });

  const full = [['Workloads', C.t600, 'FFFFFF', 0.3], [platformServices, C.b600, 'FFFFFF', 1.0]];
  const region = (x, w, name, h, blocks, label, extra) => {
    const y = base - h;
    L.box(s, x, y, w, h, { fill: 'FFFFFF', line: extra === 'Candidate' ? C.b500 : C.b300, dash: 'dash', r: 0.08 });
    L.icon(s, 'pin', x + 0.07, y + 0.08, 0.16, 'b');
    L.txt(s, name, x + 0.26, y + 0.05, w - 0.3, name.includes('\n') ? 0.34 : 0.22, { fontSize: 9.5, bold: true, color: C.b700 });
    let by = base - 0.1;
    blocks.slice().reverse().forEach(([text, fill, color, height, line]) => {
      by -= height;
      L.box(s, x + 0.07, by, w - 0.14, height, { fill, line, r: 0.05 });
      L.txt(s, text, x + 0.07, by, w - 0.14, height, { fontSize: 9.5, bold: true, color, align: 'center', valign: 'middle' });
      by -= 0.05;
    });
    if (extra) L.txt(s, extra, x + 0.04, base - 0.43, w - 0.08, 0.33, { fontSize: 9.5, bold: true, color: C.b700, align: 'center', valign: 'middle' });
    L.txt(s, label, x - 0.02, 4.1, w + 0.04, 0.32, { fontSize: 9.5, color: C.muted, align: 'center', valign: 'middle' });
  };
  region(0.8, 1.76, 'Region A\n(Primary)', 1.9, full, 'Full-Platform\nregion');
  region(2.94, 1.76, 'Region B\n(DR)', 1.9, full, 'Full-Platform\nregion');
  L.line(s, 2.58, 3.2, 2.92, 3.2, { color: C.faint, both: true, w: 1 });
  const options = [
    ['Region A', 1.9, full, 'Full-Platform\nregion'],
    ['Region B', 1.9, full, 'Full-Platform\nregion'],
    ['Region C', 1.72, [['Workloads', C.t600, 'FFFFFF', 0.3], ['Security\nNetworking', 'FFFFFF', C.b700, 0.7, C.b300]], 'Minimal platform'],
    ['Region D', 1.58, [['Workloads', C.t600, 'FFFFFF', 0.3], ['Consumes\nShared Services\nfrom other\nregions', 'FFFFFF', C.b700, 0.8, C.b300]], 'Remote platform'],
    ['Region E', 1.3, [['Workloads', C.t600, 'FFFFFF', 0.3], ['No access to\nShared Services', C.t100, C.t700, 0.48]], 'Governance-Only'],
    ['Region F', 0.8, [], 'Not enabled', 'Candidate'],
  ];
  const width = 1.055, gap = 0.06;
  options.forEach(([name, height, blocks, label, extra], i) => region(5.95 + i * (width + gap), width, name, height, blocks, label, extra));
  L.line(s, 5.0, 3.05, 5.6, 3.05, { color: C.b600, w: 2 });
  L.txt(s, 'Extend,\nnot\nreplicate', 4.9, 3.17, 0.85, 0.7, { fontSize: 10, bold: true, color: C.b700, align: 'center' });
};
