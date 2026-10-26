const { C, F, IMG } = require('../lib');

// Part 1 · Understand concepts. Eight slides: the two layers (2), the city analogy, the four connectivity profiles
// and when each fits (2), the four archetypes, the archetype-to-profile matrix, and the architecture terms.
module.exports = (pres, L) => {
  const PROF = L.data.profiles;
  const NAMES = L.data.profiles;                                                                                     // proper names for headings and running text
  const ARCH = L.data.archetypes;

  // ───────────────────────── 1 · Platform and workload layers  (PDF p10)
  {
    const s = L.slide('part1');
    L.header(s, 'Two layers, two decisions', 'Multi-region platform and multi-region workload operate at different layers', { tw: 8.4, lede: 'The platform creates governed regional choices for the estate; the workload applies one or more of those choices to a specific application.', lx: 9.3, lw: 3.43 });
    const py = 1.8, ph = 3.8;
    // platform panel
    L.box(s, 0.6, py, 5.3, ph, { fill: C.b50, line: C.b100, r: 0.14 });
    L.txt(s, 'Multi-region platform', 0.85, py + 0.15, 4.4, 0.34, { fontSize: 16, fontFace: F.semi, color: C.b700 });
    L.txt(s, 'Creates governed regional choices', 0.85, py + 0.52, 4.4, 0.26, { fontSize: 11, color: C.b700 });
    [[1.25, 2.95], [2.9, 2.75], [4.5, 3.0]].forEach(([x, y]) => { L.icon(s, 'pin', x, y, 0.5, 'b'); L.txt(s, 'Region', x - 0.2, y + 0.54, 0.9, 0.22, { fontSize: 10.5, bold: true, color: C.b800, align: 'center' }); });
    L.line(s, 1.8, 3.15, 2.85, 3.05, { color: C.b300, dash: 'dash', arrow: false }); L.line(s, 3.45, 3.05, 4.45, 3.2, { color: C.b300, dash: 'dash', arrow: false });
    [['shield', 'Governance'], ['id', 'Identity & security'], ['monitor', 'Monitoring'], ['network', 'Connectivity patterns'], ['gear', 'Deployment automation'], ['gauge', 'Quota planning']].forEach(([ic, t], i) => {
      const x = 0.85 + (i % 3) * 1.65, y = 4.15 + Math.floor(i / 3) * 0.7;
      L.icon(s, ic, x, y + 0.07, 0.36, 'b');
      L.txt(s, t, x + 0.46, y, 1.12, 0.5, { fontSize: 10.5, bold: true, color: C.b800, valign: 'middle' });
    });
    // center arrow
    L.box(s, 6.02, py + 1.865, 1.25, 0.85, { fill: C.b100, r: 0.1 });
    L.txt(s, 'Qualified regional options', 6.02, py + 1.865, 1.25, 0.85, { fontSize: 10.5, bold: true, color: C.ink, align: 'center', valign: 'middle' });
    L.line(s, 5.92, py + 2.29, 6.0, py + 2.29, { color: C.b600 }); L.line(s, 7.28, py + 2.29, 7.4, py + 2.29, { color: C.t600 });
    // workload panel
    L.box(s, 7.43, py, 5.3, ph, { fill: C.t50, line: C.t100, r: 0.14 });
    L.txt(s, 'Multi-region workload', 7.68, py + 0.15, 4.8, 0.34, { fontSize: 16, fontFace: F.semi, color: C.t700 });
    L.txt(s, 'Selects one or more qualified regions for a specific outcome', 7.68, py + 0.52, 4.9, 0.26, { fontSize: 11, color: C.t700 });
    const outs = [['pin', 'Net-new placement'], ['route', 'Selective relocation'], ['shield', 'Active/passive recovery'], ['layers', 'Active-active distribution'], ['pin', 'Continued single-region operation']];
    const r0 = py + 1.0, pitch = 0.54, mid = r0 + 2 * pitch + 0.21;
    L.box(s, 7.68, mid - 0.27, 1.2, 0.54, { fill: C.t600, r: 0.1 });
    L.txt(s, 'Workload', 7.68, mid - 0.27, 1.2, 0.54, { fontSize: 11.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
    L.line(s, 8.88, mid, 9.15, mid, { color: C.t600, arrow: false });
    L.line(s, 9.15, r0 + 0.21, 9.15, r0 + 4 * pitch + 0.21, { color: C.t600, arrow: false });
    outs.forEach(([ic, t], i) => {
      const cy = r0 + i * pitch + 0.21;
      L.line(s, 9.15, cy, 9.38, cy, { color: C.t600 });
      L.box(s, 9.4, cy - 0.21, 0.42, 0.42, { fill: 'FFFFFF', line: C.t300, dash: i === 4 ? 'dash' : 'solid', r: 0.09 });
      L.icon(s, ic, 9.5, cy - 0.11, 0.22, 't');
      L.txt(s, t, 9.95, cy - 0.21, 2.7, 0.42, { fontSize: 11, fontFace: F.semi, color: C.t700, valign: 'middle' });
    });
    // does not imply
    L.box(s, 0.6, 5.78, 12.13, 0.58, { fill: C.w50, r: 0.1 });
    L.txt(s, 'PLATFORM READINESS DOES NOT IMPLY', 0.82, 5.78, 3.4, 0.58, { fontSize: 9.5, bold: true, color: C.w600, charSpacing: 1, valign: 'middle' });
    ['A new landing zone', 'Workload migration', 'Active-active HA', 'Active/passive DR'].forEach((t, i) => L.txt(s, [{ text: '×  ', options: { color: C.w600, bold: true } }, { text: t }], 4.4 + i * 2.1, 5.78, 2.05, 0.58, { fontSize: 11.5, fontFace: F.semi, color: C.ink, valign: 'middle' }));
    L.caption(s, 'Figure', 'Platform capabilities make regions available as qualified options; each workload then selects its own outcome.', 0.6, 6.5, 12.1);
    s.addNotes('A multi-region platform and a multi-region workload operate at different layers. The platform creates governed regional choices for the customer estate; the workload applies one or more of those choices to a specific workload. Keeping the two separate prevents multi-region strategy from being treated as an automatic requirement for a new landing zone, workload migration, active-active high availability, or active/passive disaster recovery.');
  }

  // ───────────────────────── 2 · Two layers compared  (PDF p11)
  {
    const s = L.slide('part1');
    L.header(s, 'Two layers, two decisions', 'Two layers compared', { tw: 8 });
    const hdr = { fontFace: F.body, fontSize: 10, bold: true, charSpacing: 1.5, valign: 'middle' };
    const rows = [
      ['Purpose', 'Enable placement flexibility across qualified Azure regions', 'Meet workload-specific objectives and requirements such as availability, disaster recovery, user proximity, or regulatory requirements'],
      ['Focus', 'Regional readiness and consistency of shared platform capabilities', 'Application architecture, data, dependencies, traffic, availability, and recovery'],
      ['Design driven by', 'The needs of the portfolio of workloads the platform is expected to support', 'The specific workload’s requirements, such as availability, resiliency, RTO/RPO, latency, or data requirements'],
      ['Outcome', 'Additional regions qualified through the existing landing-zone operating model, approved connectivity patterns, deployment automation, and quota planning', 'Net-new placement in another region, selective relocation, active/passive recovery, active-active distribution, or continued operation in one region'],
    ];
    const none = [{ type: 'none' }, { type: 'none' }, { type: 'none' }, { type: 'none' }];
    const cell = (t, o = {}) => ({ text: t, options: Object.assign({ fontFace: F.body, fontSize: 12, color: C.text, valign: 'middle', margin: [4, 10, 4, 10], border: [{ type: 'solid', pt: 1, color: C.soft }, { type: 'none' }, { type: 'none' }, { type: 'none' }] }, o) });
    const data = [[cell('', { border: none }), cell('MULTI-REGION PLATFORM', Object.assign({ fill: { color: C.b50 }, color: C.b700 }, hdr, { border: none })), cell('MULTI-REGION WORKLOAD', Object.assign({ fill: { color: C.t50 }, color: C.t700 }, hdr, { border: none }))]];
    rows.forEach(r => data.push([cell(r[0], { bold: true, color: C.ink, fontSize: 12 }), cell(r[1], { fill: { color: 'FAFCFE' } }), cell(r[2], { fill: { color: 'FAFDFC' } })]));
    s.addTable(data, { x: 0.6, y: 1.6, w: 12.13, colW: [2.2, 4.965, 4.965], rowH: [0.4, 0.85, 0.7, 0.7, 0.95] });
    L.image(s, IMG('band.jpg', L.tone), { x: 0.6, y: 5.38, w: 7.6, h: 1.47 }, 'Blue gradient band behind the default posture statement', { sizing: { type: 'cover', w: 7.6, h: 1.47 } });
    L.txt(s, 'DEFAULT POSTURE', 0.9, 5.5, 3, 0.2, { fontSize: 9.5, bold: true, color: C.b200, charSpacing: 2 });
    L.txt(s, 'Reuse the existing Azure landing-zone operating model by default. Extend regional policy parameters, connectivity, shared services, automation, and operations only where documented workload requirements justify them.', 0.9, 5.76, 7.1, 1.0, { fontSize: 12, fontFace: F.semi, color: 'FFFFFF' });
    L.txt(s, [{ text: 'A multi-region platform doesn’t require a separate connectivity landing zone or identical shared services in every region; ' }, { text: 'workload requirements determine the cross-region design.', options: { bold: true, color: C.ink } }], 8.55, 5.38, 4.18, 1.47, { fontSize: 12, color: C.text, valign: 'middle' });
    s.addNotes('Reuse the existing Azure landing-zone operating model by default. Extend regional policy parameters, connectivity, shared services, automation, and operations only where documented workload requirements justify them. A multi-region platform does not require a separate connectivity landing zone or identical shared services in every region; workload requirements determine the cross-region design.');
  }

  // ───────────────────────── 3 · The city analogy  (PDF p12, art/city_analogy.py)
  {
    const s = L.slide('part1');
    L.header(s, 'An everyday analogy', 'The platform is the city. Workloads are the people and businesses that live in it.', { tw: 8.3, lede: 'The city builds neighborhoods, services, roads, transit, and laws once. A family settles in one neighborhood; a bank spreads across several. Neither builds a new city.', lx: 9.1, lw: 3.63 });
    const ih = 5.25, iw = ih * 2144 / 1672;
    L.image(s, IMG('city-analogy.png'), { x: 0.6, y: 1.6, w: iw, h: ih }, 'Isometric city used as an analogy for a multi-region platform. An office campus outside the city connects to Downtown through express toll lanes with two interchanges. Downtown has every service locally. Riverside has a fire station and a clinic. Hillcrest and Midtown have homes only and reach Downtown’s services by transit. Lakeside is an off-grid island with no roads or transit. A new plot is zoned but not yet built. Numbered pins mark where four families live, and bank badges mark two branches and a backup operations center.');
    const x = 0.6 + iw + 0.3, w = 12.73 - x;
    // six mappings
    L.txt(s, 'IN THE CITY', x, 1.62, 2.6, 0.2, { fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.5 });
    L.txt(s, 'IN AZURE', x + 2.85, 1.62, 2.4, 0.2, { fontSize: 9.5, bold: true, color: C.b600, charSpacing: 1.5 });
    const map = [['Neighborhoods', 'Azure regions'], ['Transit between neighborhoods', 'Connectivity between regions'], ['Express toll lanes', 'ExpressRoute'], ['Office campus outside the city', 'On-premises'], ['Police, fire, hospitals, utilities', 'Shared services'], ['Laws, codes, zoning', 'Governance and policy']];
    map.forEach(([a, b], i) => {
      const y = 1.88 + i * 0.33;
      L.box(s, x, y, w, 0.008, { fill: C.soft, r: 0 });
      L.txt(s, a, x, y + 0.03, 2.75, 0.3, { fontSize: 11, color: C.text, valign: 'middle' });
      L.txt(s, '→', x + 2.62, y + 0.03, 0.25, 0.3, { fontSize: 11, color: C.b500, bold: true, valign: 'middle' });
      L.txt(s, b, x + 2.85, y + 0.03, w - 2.85, 0.3, { fontSize: 11, fontFace: F.semi, color: C.b700, valign: 'middle' });
    });
    // household
    L.txt(s, 'The household: a single-region workload', x, 4.05, w, 0.3, { fontSize: 12.5, fontFace: F.semi, color: C.t700, valign: 'middle' });
    L.data.archetypeLabels.map((label, i) => [label, ['Lakeside', 'Midtown', 'Hillcrest', 'Riverside'][i]]).forEach(([a, b], i) => {
      const y = 4.42 + i * 0.33;
      L.num(s, i + 1, x, y + 0.03, 0.24, C.t600, 'FFFFFF', 10);
      L.txt(s, [{ text: a, options: { bold: true, color: C.ink } }, { text: '  →  ' + b, options: { color: C.t700 } }], x + 0.36, y, w - 0.36, 0.3, { fontSize: 11, valign: 'middle' });
    });
    // bank
    L.txt(s, 'The bank: a multi-region workload', x, 5.85, w, 0.3, { fontSize: 12.5, fontFace: F.semi, color: C.t700, valign: 'middle' });
    L.txt(s, [{ text: 'Branches in ' }, { text: 'Riverside', options: { bold: true, color: C.ink } }, { text: ' and ' }, { text: 'Midtown', options: { bold: true, color: C.ink } }, { text: ' serve customers together. A backup operations center in ' }, { text: 'Hillcrest', options: { bold: true, color: C.ink } }, { text: ' stands by.' }], x, 6.2, w, 0.62, { fontSize: 11, color: C.text });
    s.addNotes('Think of the platform as a city and workloads as the people and businesses that live in it. Each neighborhood is an Azure region with its own connectivity profile; the office campus is on-premises. A household is a single-region workload and picks the neighborhood that fits how it lives: Lakeside for a self-contained family, Midtown for a selectively connected one, Hillcrest for a hybrid-dependent one, Riverside for an interdependent group. The bank is a multi-region workload: branches in Riverside and Midtown serve customers together, and a backup operations center in Hillcrest stands by.');
  }

  // ───────────────────────── 4 · Connectivity profile spectrum  (PDF p13)
  {
    const s = L.slide('part1');
    L.header(s, 'What the platform provides', 'Regional Platform Connectivity Profiles', { tw: 8, lede: 'Enabling another region doesn’t require duplicating an existing geographic hub. Choose the most efficient profile that supports the workloads expected to use the region.', lx: 8.6, lw: 4.13 });
    L.line(s, 0.6, 1.8, 12.73, 1.8, { color: C.b500, w: 3 });
    L.txt(s, 'NO DEPENDENCY ON A GEOGRAPHIC HUB', 0.6, 1.88, 5, 0.22, { fontSize: 9.5, bold: true, color: C.t600, charSpacing: 1.5 });
    L.txt(s, 'GREATER LOCAL CAPABILITY AND INDEPENDENCE', 7.2, 1.88, 5.53, 0.22, { fontSize: 9.5, bold: true, color: C.b700, charSpacing: 1.5, align: 'right' });
    const P = [
      [C.t600, 'No private network path to a geographic hub, another region’s networks, or on-premises.', 'No hub or hybrid gateway. Approved local peering and Azure service endpoints only.'],
      [C.c600, 'Spokes connect privately to an existing geographic hub in another region.', 'Centralized services used; local services not required.'],
      [C.b500, 'Selected local services and connectivity, based on workload requirements.', 'Local shared services with selective connectivity, without a Full Hub.'],
      [C.b700, 'Comprehensive local capabilities, with connectivity to spokes, on-premises, and other regions as needed.', 'Full local capabilities, when required by latency, traffic volume, compliance, or operational needs.'],
    ];
    const lab = (t, x, y, w, o = {}) => L.txt(s, t, x, y, w, o.h || 0.2, Object.assign({ fontSize: 9, bold: true, color: C.b700 }, o));
    P.forEach(([c, d, f], i) => {
      const x = 0.6 + i * 3.08, y = 2.2, w = 2.9, h = 4.18;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.num(s, i + 1, x + 0.18, y + 0.16, 0.38, c, 'FFFFFF', 13);
      L.txt(s, PROF[i], x + 0.66, y + 0.1, w - 0.75, 0.5, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.2, y + 0.68, w - 0.4, 0.82, { fontSize: 11, color: C.muted });
      // mini architecture
      const ax = x + 0.2, ay = y + 1.58, aw = w - 0.4, ah = 1.3;
      const spoke = (sx, sy, sw, sh) => { L.box(s, sx, sy, sw, sh, { fill: C.t50, line: C.t300, r: 0.07 }); L.box(s, sx + sw / 2 - 0.1, sy + sh / 2 - 0.1, 0.2, 0.2, { fill: C.t600, r: 0.04 }); };
      if (i === 0) {
        L.box(s, ax, ay, aw, ah, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.1 });
        L.icon(s, 'pin', ax + 0.1, ay + 0.06, 0.15, 'b'); lab('New Region', ax + 0.3, ay + 0.04, 1.4);
        spoke(ax + 0.3, ay + 0.32, 0.6, 0.5); spoke(ax + 1.6, ay + 0.32, 0.6, 0.5);
        L.line(s, ax + 0.9, ay + 0.6, ax + 1.6, ay + 0.6, { color: C.t600, dash: 'dash', arrow: false });
        lab('peering', ax + 0.9, ay + 0.34, 0.7, { color: C.t700, align: 'center', bold: false });
        L.box(s, ax + 0.3, ay + 0.9, aw - 0.6, 0.3, { fill: 'FFFFFF', line: C.s300, r: 0.15 });
        lab('Azure platform services', ax + 0.3, ay + 0.9, aw - 0.6, { h: 0.3, color: C.s600, align: 'center', valign: 'middle', bold: false });
      }
      if (i === 1) {
        L.box(s, ax, ay, 1.0, ah, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.1 });
        lab('New Region', ax, ay + 0.05, 1.0, { align: 'center' });
        spoke(ax + 0.2, ay + 0.35, 0.6, 0.38); spoke(ax + 0.2, ay + 0.82, 0.6, 0.38);
        L.box(s, ax + 1.25, ay, aw - 1.25, ah, { fill: C.b600, r: 0.1 });
        L.txt(s, [{ text: 'Other region', options: { bold: true, fontSize: 10, breakLine: true } }, { text: 'geographic hub', options: { color: C.b200, breakLine: true } }, { text: 'Hybrid · inspection · egress · routing · DNS', options: { color: C.b100 } }], ax + 1.3, ay + 0.04, aw - 1.35, ah - 0.08, { fontSize: 9, color: 'FFFFFF', align: 'center', valign: 'middle' });
        L.line(s, ax + 1.03, ay + 0.65, ax + 1.22, ay + 0.65, { color: C.b600, both: true });
      }
      if (i === 2) {
        L.box(s, ax, ay, 1.85, ah, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.1 });
        lab('New Region', ax + 0.1, ay + 0.04, 1.4);
        L.box(s, ax + 0.1, ay + 0.26, 1.65, 0.5, { fill: 'FFFFFF', line: C.b500, lw: 1.5, r: 0.07 });
        L.txt(s, [{ text: 'Shared services', options: { bold: true, breakLine: true } }, { text: 'DNS · Gateway · Monitor' }], ax + 0.1, ay + 0.26, 1.65, 0.5, { fontSize: 9, color: C.b700, align: 'center', valign: 'middle' });
        spoke(ax + 0.15, ay + 0.86, 0.7, 0.34); spoke(ax + 1.0, ay + 0.86, 0.7, 0.34);
        L.line(s, ax + 1.75, ay + 0.5, ax + 2.0, ay + 0.5, { color: C.b500, dash: 'dash', arrow: false });
        L.oval(s, ax + 2.0, ay + 0.33, 0.34, { fill: C.b600 }); L.oval(s, ax + 2.11, ay + 0.44, 0.12, { fill: 'FFFFFF' });
        lab('strategic\nhub', ax + 1.92, ay + 0.74, 0.5, { h: 0.4, color: C.muted, align: 'center', bold: false });
      }
      if (i === 3) {
        L.box(s, ax, ay, aw, ah, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.1 });
        lab('New Region', ax + 0.1, ay + 0.04, 1.4);
        L.box(s, ax + 0.1, ay + 0.26, aw - 0.2, 0.58, { fill: C.b700, r: 0.08 });
        L.txt(s, [{ text: 'Shared services', options: { bold: true, color: 'FFFFFF', breakLine: true } }, { text: 'DNS · Gateway · Firewall · Monitor', options: { color: C.b100 } }], ax + 0.15, ay + 0.26, aw - 0.3, 0.58, { fontSize: 9, align: 'center', valign: 'middle' });
        spoke(ax + 0.3, ay + 0.92, 0.7, 0.3); spoke(ax + 1.5, ay + 0.92, 0.7, 0.3);
      }
      L.box(s, x, y + h - 1.0, w, 1.0, { fill: C.wash, r: 0.12 }); L.box(s, x, y + h - 1.0, w, 0.3, { fill: C.wash, r: 0 });
      L.txt(s, f, x + 0.2, y + h - 0.97, w - 0.4, 0.94, { fontSize: 11, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    L.caption(s, 'Figure', 'Moving right adds local capability, independence, cost, and operational scope. Services shown are examples. Profiles are not maturity stages.', 0.6, 6.5, 12.1);
    s.addNotes('Enabling another region does not require changing or duplicating the full platform footprint of an existing geographic hub. An organization can maintain a small number of strategic geographic hubs, which provide resilient hybrid connectivity and common enterprise services to other regions; other regions use a more efficient profile and consume capabilities from those hubs when workload requirements permit. The four profiles form a spectrum from No Hub to Full Hub. They are not maturity stages. A profile can remain the right target for a region as long as it satisfies workload and platform requirements. Profiles describe platform capabilities, not workload designs.');
  }

  // ───────────────────────── 5 · When each profile fits  (PDF p14–15, Fits when and Regional footprint only)
  {
    const s = L.slide('part1');
    L.header(s, 'Connectivity profiles', 'When each profile fits', { tw: 8 });
    const D = [
      ['Workloads need no private network path to a geographic hub, another region’s networks, or on-premises. Approved same-region peering and Azure service endpoints can meet their requirements.', 'Workload resources plus the controls to deploy, secure, monitor, and operate them, using the estate’s standard identity, policy, security, and deployment practices.'],
      ['Workloads need private access to selected enterprise or on-premises services and can tolerate the latency, availability coupling, data-transfer implications, and dependency on another region.', 'Workload spokes and what must stay close. Gateways, firewalls, hybrid connectivity, routing, and selected shared services can remain in the geographic hub.'],
      ['Workloads need some local shared services, application-to-application connectivity, lower-latency paths, regional security controls, or more independence than Remote Hub gives.', 'Only the connectivity and shared services that must operate locally. Hybrid connectivity, specialized networking, and central management can remain in a geographic hub.'],
      ['Requirements justify a comprehensive local capability set: local hybrid connectivity, substantial shared services, strict latency or data-boundary controls, or independence when another region or hub is unavailable.', 'The approved set of local connectivity, shared services, operational capabilities, and independent critical paths that the region’s workload portfolio requires.'],
    ];
    const heads = ['Fits when', 'Regional footprint'];
    const x0 = 0.6, lw = 1.45, cw = (12.13 - lw) / 4, y0 = 1.75;
    NAMES.forEach((p, j) => {
      const x = x0 + lw + j * cw;
      L.box(s, x + 0.04, y0, cw - 0.08, 0.72, { fill: j < 2 ? C.t50 : C.b50, r: 0.1 });
      L.glyph(s, j, x + 0.14, y0 + 0.13);
      L.txt(s, p, x + 0.95, y0, cw - 1.05, 0.72, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    const rh = [1.9, 1.7];
    let y = y0 + 0.9;
    heads.forEach((h, i) => {
      if (i === 0) L.box(s, x0, y - 0.06, 12.13, rh[i] + 0.06, { fill: C.b50, r: 0.08 });
      L.txt(s, h.toUpperCase(), x0 + 0.14, y + 0.08, lw - 0.2, 0.5, { fontSize: 9.5, bold: true, color: C.b600, charSpacing: 1.5 });
      D.forEach((row, j) => L.txt(s, row[i], x0 + lw + j * cw + 0.12, y + 0.06, cw - 0.24, rh[i] - 0.1, { fontSize: 12, color: i === 0 ? C.ink : C.text, lineSpacingMultiple: 1.03 }));
      y += rh[i] + 0.12;
    });
    s.addNotes('No Hub can include self-contained cloud-native, AI, development, test, batch, HPC, VDI, or internet-facing workloads where the conditions are met. Remote Hub: cross-region connectivity can be implemented through appropriate Azure networking capabilities based on the required topology and routing model, and public ingress can remain local through Azure Front Door or Application Gateway. A Minimal Hub provides only the local capabilities its workloads need, such as east-west routing, DNS, monitoring, backup, security inspection, egress, private connectivity, selected identity or directory services, or on-premises connectivity. A Full Hub uses the same operating model and control baselines as other geographic hubs but does not have to be an identical copy. Enabling another region does not by itself require another ExpressRoute circuit.');
  }

  // ───────────────────────── 6 · Archetypes  (PDF p16)
  {
    const s = L.slide('part1');
    L.header(s, 'What applications require', 'Workload Landing Zone Archetypes', { ec: C.t600, tw: 8, lede: 'A planning abstraction that groups recurring application connectivity and dependency requirements. Each workload or group gets one archetype.', lx: 8.6, lw: 4.13 });
    const A = [
      [ARCH[0], "Self-contained workloads with no persistent private dependency outside the workload.", L.data.archetypeProfileOrder[0].map(j => L.data.profiles[j]), "No persistent private dependencies. Can often use No Hub. Flexible placement across regions."],
      [ARCH[1], "Workloads that reach selected services through private endpoints or specific private APIs, without routed access to the enterprise network.", L.data.archetypeProfileOrder[1].map(j => L.data.profiles[j]), "Private access to selected dependencies. Profile set by latency, traffic, resiliency, security. Common for data, analytics, and AI platforms."],
      [ARCH[2], "Workloads that need routed access to on-premises environments or the enterprise network, including shared services hosted in a hub.", L.data.archetypeProfileOrder[2].map(j => L.data.profiles[j]), "Profile set by dependency latency, resiliency, regulation, operations. Common in migrations and hybrid scenarios."],
      [ARCH[3], "Groups of workloads with material east-west dependencies: shared data, synchronous calls, or private east-west traffic. Combine members' requirements.", L.data.archetypeProfileOrder[3].map(j => L.data.profiles[j]), "Classified at group level. Aggregate requirements set the profile. Direct spoke-to-spoke or a regional hub for east-west traffic."]
    ];
    A.forEach(([t, d, chips, drv], i) => {
      const x = 0.6 + i * 3.08, y = 1.75, w = 2.9, h = 4.5;
      L.box(s, x, y, w, h, { fill: C.t50, line: C.t100, r: 0.12 });
      L.num(s, i + 1, x + 0.2, y + 0.2, 0.4, C.t600, 'FFFFFF', 14);
      L.txt(s, t, x + 0.72, y + 0.12, w - 0.85, 0.62, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.2, y + 0.92, w - 0.4, 1.3, { fontSize: 11.5, color: C.ink });
      L.box(s, x + 0.2, y + 2.35, w - 0.4, 0.008, { fill: C.t300, r: 0 });
      L.txt(s, 'TYPICAL CONNECTIVITY PROFILES', x + 0.2, y + 2.45, w - 0.3, 0.2, { fontSize: 9, bold: true, color: C.b600, charSpacing: 0.6 });
      let cx = x + 0.2, cy = y + 2.74;
      chips.forEach(c => { const cw = c.length * 0.07 + 0.3; if (cx + cw > x + w - 0.15) { cx = x + 0.2; cy += 0.32; } const dashed = c.includes('where justified'); L.chip(s, c, cx, cy, { w: cw, fill: dashed ? 'FFFFFF' : c === 'No Hub' ? C.t100 : C.b100, color: c === 'No Hub' ? C.t700 : C.b700, line: dashed ? C.b500 : undefined, dash: dashed ? 'dash' : undefined, size: 10.5 }); cx += cw + 0.06; });
      L.txt(s, drv, x + 0.2, y + 3.5, w - 0.4, 1.05, { fontSize: 11, color: C.muted });
    });
    L.caption(s, 'Figure', 'Each workload or group gets one archetype. Traffic between its regional instances does not change it.', 0.6, 6.4, 12.1);
    s.addNotes("Classify each workload on its own. When workloads have material east-west dependencies on each other, classify the group as an Interdependent Workload Group and combine its members' requirements. Each workload or group gets exactly one archetype. Traffic between instances of the same workload in different regions does not change its archetype. These archetypes describe what a workload depends on. They are separate from the Internal (Corp), Online, and Local management groups of an Azure landing zone, which set the policies a subscription inherits, and a workload has one of each.");
  }

  // ───────────────────────── 7 · Archetype-to-profile matrix  (PDF p17)
  {
    const s = L.slide('part1');
    L.header(s, 'Archetypes and profiles', [{ text: 'Archetypes describe what applications require.', options: { color: C.t700, breakLine: true } }, { text: 'Profiles describe what the platform provides.', options: { color: C.b700 } }], { ec: C.t600, tw: 8.2, th: 0.95, ts: 24, lede: 'An archetype doesn’t dictate a profile: one archetype can use different profiles, and one profile can serve several archetypes. Choose the most efficient profile that meets the needs.', lx: 8.95, lw: 3.78, lh: 1.3 });
    const x0 = 0.6, aw = 2.5, pw = 1.45, dx = x0 + aw + 4 * pw, dw = 12.73 - dx, top = 3.2, rh = 0.76;
    L.txt(s, 'CONNECTIVITY PROFILES · WHAT THE PLATFORM PROVIDES', x0 + aw, 1.85, 4 * pw, 0.22, { fontSize: 9, bold: true, color: C.b600, charSpacing: 1 });
    L.box(s, x0 + aw, 2.09, 4 * pw, 0.03, { fill: C.b600, r: 0 });
    PROF.forEach((p, j) => { L.glyph(s, j, x0 + aw + j * pw + (pw - 0.72) / 2, 2.2); L.txt(s, p, x0 + aw + j * pw + 0.04, 2.68, pw - 0.08, 0.46, { fontSize: 10.5, fontFace: F.semi, color: C.ink, align: 'center', valign: 'top' }); });
    L.txt(s, 'ARCHETYPES\nWHAT APPLICATIONS REQUIRE', x0, 2.65, aw, 0.48, { fontSize: 9, bold: true, color: C.t600, charSpacing: 1.5, valign: 'bottom' });
    L.txt(s, 'WHAT DRIVES THE CHOICE', dx + 0.2, 2.65, dw, 0.48, { fontSize: 9, bold: true, color: C.muted, charSpacing: 1.5, valign: 'bottom' });
    const rows = [
      [ARCH[0], ['O', 'R', 'R', 'R'], 'Often No Hub; other profiles where management, security, data access, or central services justify it.'],
      [ARCH[1], ['H', 'T', 'T', 'T'], 'No Hub only where approved local peering or Azure service endpoints meet all requirements.'],
      [ARCH[2], ['-', 'T', 'T', 'T'], 'Dependency latency, resiliency, regulation, operations, and shared services. No Hub has no hybrid path.'],
      [ARCH[3], ['P', 'A', 'J', 'J'], 'No Hub only for approved same-region connectivity without hub or on-premises dependencies.'],
    ];
    const lab = { T: 'Typical', O: 'Often', H: 'Where hub-free', R: 'Where justified', J: 'When justified', P: 'Spoke-to-spoke', A: 'Where acceptable' };
    rows.forEach(([a, m, d], i) => {
      const y = top + i * rh;
      L.box(s, x0, y, aw - 0.05, rh - 0.05, { fill: C.t50, r: 0 });
      L.num(s, i + 1, x0 + 0.12, y + (rh - 0.05) / 2 - 0.14, 0.28, C.t600, 'FFFFFF', 10);
      L.txt(s, a, x0 + 0.5, y, aw - 0.58, rh - 0.05, { fontSize: 11, fontFace: F.semi, color: C.t700, valign: 'middle' });
      m.forEach((v, j) => {
        const cx = x0 + aw + j * pw;
        L.box(s, cx, y, pw, rh - 0.05, { fill: j % 2 ? 'F4F8FD' : 'FBFDFF', r: 0 });
        if (v === '-') { L.box(s, cx + pw / 2 - 0.12, y + rh / 2 - 0.03, 0.24, 0.015, { fill: C.line, r: 0 }); return; }
        const full = 'TO'.includes(v);
        L.oval(s, cx + pw / 2 - 0.11, y + 0.1, 0.22, full ? { fill: C.b600 } : { fill: 'FFFFFF', line: C.b500, lw: 2 });
        L.txt(s, lab[v], cx, y + 0.38, pw, 0.24, { fontSize: 9.5, bold: true, color: C.b700, align: 'center' });
      });
      L.txt(s, d, dx + 0.2, y, dw - 0.2, rh - 0.05, { fontSize: 11, color: C.text, valign: 'middle' });
      L.box(s, x0, y + rh - 0.05, 12.13, 0.01, { fill: C.soft, r: 0 });
    });
    const ly = top + 4 * rh + 0.04;
    L.oval(s, x0, ly + 0.04, 0.16, { fill: C.b600 }); L.txt(s, 'Typical fit', x0 + 0.24, ly, 1.3, 0.24, { fontSize: 10, bold: true, color: C.muted, valign: 'middle' });
    L.oval(s, x0 + 1.5, ly + 0.04, 0.16, { fill: 'FFFFFF', line: C.b500, lw: 1.75 }); L.txt(s, 'When specific requirements justify it', x0 + 1.74, ly, 3, 0.24, { fontSize: 10, bold: true, color: C.muted, valign: 'middle' });
    L.box(s, x0 + 4.75, ly + 0.115, 0.2, 0.015, { fill: C.line, r: 0 }); L.txt(s, 'Not indicated as typical', x0 + 5.05, ly, 2.5, 0.24, { fontSize: 10, color: C.muted, valign: 'middle' });
    L.caption(s, 'Figure', 'Many-to-many. Each row is a set of options, not an assignment.', 0.6, 6.6, 12.1);
    s.addNotes('Each row is a set of options, not an assignment. Use the archetypes expected in a region to understand what it needs, then choose the most efficient profile that meets those needs. For example, a hybrid-dependent workload might run well on Remote Hub in one region and need a Minimal Hub in another, depending on latency, traffic, and resiliency requirements. Where significant east-west traffic exists within a region, evaluate whether direct spoke-to-spoke connectivity or a local hub is a better path than routing through a geographic hub in another region. Direct connectivity may suit a few tightly coupled workloads; a Minimal Hub or Full Hub fits broader routing, inspection, resiliency, or operational needs. Because a portfolio’s combined dependencies can require capabilities beyond any single application, select its profile from aggregate requirements, not from a single workload.');
  }

  // ───────────────────────── 8 · Architecture terms  (PDF p18)
  {
    const s = L.slide('part1');
    L.header(s, 'Architecture terms', 'Four architecture concepts — related, but not interchangeable', { ec: C.t600, tw: 8.3, lede: 'They describe different aspects of a workload and should not be used interchangeably. Only the archetype describes what a workload requires from the platform.', lx: 9.1, lw: 3.63 });
    const H = { fontFace: F.body, fontSize: 10, bold: true, color: C.muted, charSpacing: 1.5, valign: 'middle', margin: [4, 8, 4, 8], border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', pt: 1, color: C.line }, { type: 'none' }] };
    const cell = (t, o = {}) => ({ text: t, options: Object.assign({ fontFace: F.body, fontSize: 11.5, color: C.text, valign: 'middle', margin: [5, 8, 5, 8], border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', pt: 1, color: C.soft }, { type: 'none' }] }, o) });
    const rows = [
      ['Architecture style', 'The fundamental structural organization of an application', 'Microservices, N-tier, event-driven, web-queue-worker, big compute', 'Application architecture'],
      ['Architecture / design pattern', 'A reusable solution to a recurring technical problem', 'Circuit Breaker, Retry, CQRS, Strangler Fig, Competing Consumers', 'Design technique'],
      ['Workload pattern', 'A recurring workload behavior or set of operational characteristics that can influence platform requirements', 'Latency-sensitive, data-intensive, batch-oriented, globally distributed, hybrid-dependent', 'Workload characteristics'],
      ['Workload Landing Zone archetype', 'A classification of a workload based on the platform connectivity and dependency capabilities it requires', ARCH.join(', '), 'Platform-consumption model'],
    ];
    const data = [[cell('TERM', H), cell('WHAT IT DESCRIBES', H), cell('EXAMPLES', H), cell('LEVEL', H)]];
    rows.forEach((r, i) => { const hi = i === 3, f = hi ? { color: C.t50 } : undefined; data.push([cell(r[0], { bold: true, color: hi ? C.t700 : C.ink, fill: f }), cell(r[1], { fill: f }), cell(r[2], { color: hi ? C.text : C.muted, fill: f }), cell(r[3], { bold: true, fontSize: 11, color: hi ? C.t700 : C.b700, fill: f })]); });
    s.addTable(data, { x: 0.6, y: 1.75, w: 12.13, colW: [2.4, 3.75, 3.75, 2.23], rowH: [0.4, 0.7, 0.7, 0.9, 0.95] });
    const cards = [
      [0.6, C.wash, C.s600, 'Not the built-in landing-zone archetypes', 'The Azure landing zones reference architecture uses archetypes to define what must be true for a landing zone at a given scope. Workload Landing Zone archetypes describe what a workload requires from the platform.'],
      [6.78, C.t50, C.t700, 'One archetype per workload', 'Classify each workload by its closest-fitting archetype. Record requirements beyond it as explicit additions rather than forcing multiple classifications.'],
    ];
    cards.forEach(([x, fill, tc, t, b]) => {
      L.box(s, x, 5.65, 5.95, 1.2, { fill, r: 0.12 });
      L.txt(s, t.toUpperCase(), x + 0.22, 5.77, 5.5, 0.24, { fontSize: 10, bold: true, color: tc, charSpacing: 1.5 });
      L.txt(s, b, x + 0.22, 6.07, 5.5, 0.75, { fontSize: 11 });
    });
    s.addNotes('Only the Workload Landing Zone archetype describes what a workload needs from the platform; it is the concept used in regional qualification. Classify each workload by its closest-fitting archetype and record any requirements beyond it as explicit additions. The built-in archetypes of the Azure landing zones reference architecture are a different concept. References: Architecture styles; Built-in Azure landing zone archetypes.');
  }
};
