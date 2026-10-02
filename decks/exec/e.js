const { C, F, IMG } = require('../lib');

module.exports = (pres, L) => {
  const glyph = (s, k, x, y) => {
    const bg = k < 2 ? C.t50 : C.b50, ln = k < 2 ? C.t300 : C.b300;
    if (k === 1) { L.box(s, x, y, 0.44, 0.46, { fill: bg, line: ln, dash: 'dash', r: 0.07 }); L.box(s, x + 0.12, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); L.line(s, x + 0.44, y + 0.23, x + 0.56, y + 0.23, { color: C.b500, arrow: false }); L.oval(s, x + 0.56, y + 0.15, 0.16, { fill: C.b600 }); return; }
    L.box(s, x, y, 0.72, 0.46, { fill: bg, line: ln, dash: 'dash', r: 0.07 });
    if (k === 0) { L.box(s, x + 0.12, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); L.box(s, x + 0.4, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
    if (k === 2) { L.oval(s, x + 0.11, y + 0.12, 0.22, { fill: 'FFFFFF', line: C.b500, lw: 1.5 }); L.box(s, x + 0.42, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
    if (k === 3) { L.oval(s, x + 0.1, y + 0.11, 0.24, { fill: C.b600 }); L.oval(s, x + 0.18, y + 0.19, 0.08, { fill: 'FFFFFF' }); L.box(s, x + 0.42, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
  };
  const PROF = ['Disconnected spokes', 'Remote-hub-connected spokes', 'Minimal regional hub', 'Full regional hub'];

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    s.addImage({ path: IMG('cover_panel.png'), x: 6.733, y: 0, w: 6.6, h: 7.5 });
    L.logo(s, 0.6, 0.55, 0.14, C.muted, 17);
    L.txt(s, 'Executive briefing', 10.6, 0.52, 2.2, 0.35, { fontSize: 13, fontFace: F.semi, color: 'FFFFFF', align: 'right' });
    let x = 0.6; x += L.chip(s, 'AZURE ARCHITECTURE', x, 1.85, { size: 9 }) + 0.12;
    L.chip(s, 'EXECUTIVE BRIEFING', x, 1.85, { size: 9, fill: C.t100, color: C.t700 });
    L.txt(s, [
      { text: 'The adaptable', options: { fontFace: F.light, color: C.ink, breakLine: true } },
      { text: 'multi-region', options: { fontFace: F.semi, color: C.b600, breakLine: true } },
      { text: 'Azure platform', options: { fontFace: F.light, color: C.ink } },
    ], 0.6, 2.3, 5.9, 2.2, { fontSize: 46, lineSpacingMultiple: 0.92 });
    L.txt(s, 'Evolve landing zones from fixed regional footprints into a governed operating model where regional placement is an adaptable, application-level decision.', 0.6, 4.55, 5.4, 0.9, { fontSize: 14, color: C.s600, lineSpacingMultiple: 1.1 });
    L.txt(s, 'THREE PLANNING CONSTRUCTS', 0.6, 5.65, 4, 0.22, { fontSize: 9, bold: true, color: C.faint, charSpacing: 3 });
    [['Regional Qualification and Enablement Framework', C.b600], ['Workload Landing Zone Archetypes', C.t600], ['Regional Platform Connectivity Profiles', C.v600]].forEach(([t, c], i) => {
      L.box(s, 0.6, 6.02 + i * 0.3, 0.26, 0.06, { fill: c, r: 0.03 });
      L.txt(s, t, 0.98, 5.93 + i * 0.3, 5, 0.25, { fontSize: 11.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    L.txt(s, 'October 2026', 0.6, 7.0, 3, 0.22, { fontSize: 9.5, color: C.muted });
    s.addNotes('Executive briefing based on the Multi-Region Platform Whitepaper. Sequence follows the executive talk track: reframe the objective, move from a region to a geography mindset, decouple connectivity, tier the regional footprint, classify workloads by archetype, explain the agility, and land on the strategic benefit.');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, 'Executive summary', 'Evolve landing zones from fixed regional footprints into a governed operating model', { tw: 7.6, ts: 23, lede: 'Adding an Azure region shouldn’t mean starting another landing-zone project. In a governed geographic operating model — for example, across Europe — regional placement becomes an adaptable, application-level decision instead of a permanent architectural dependency.', lx: 8.5, lw: 4.23, ls: 11.5, lh: 1.4 });
    L.txt(s, 'FIVE MOVES', 0.6, 1.72, 3, 0.22, { fontSize: 9, bold: true, color: C.muted, charSpacing: 3 });
    const K = [['shield', C.s800, 'Standardize governance', 'Policies, security controls, operational rigor, and compliance are the constants across the geography.'], ['route', C.b600, 'Decouple connectivity', 'Plan resilient hybrid connectivity to Azure geographically, not again for every region.'], ['hub', C.v600, 'Tier the regional footprint', 'A few strategic hubs carry the full stack; other regions use lighter patterns.'], ['app', C.t600, 'Classify workloads by archetype', 'Four archetypes describe what each workload needs from the platform.'], ['pin', C.b700, 'Preserve regional optionality', 'Qualified regions stay available for the next workload when capacity, services, or regulation change.']];
    K.forEach(([ic, c, t, d], i) => {
      const x = 0.6 + i * 2.46, y = 2.0, w = 2.33, h = 2.75;
      L.box(s, x, y, w, h, { fill: i === 3 ? C.t50 : C.wash, r: 0.12 });
      L.txt(s, String(i + 1).padStart(2, '0'), x + 0.2, y + 0.14, 0.8, 0.45, { fontSize: 22, fontFace: F.light, color: i === 3 ? C.t600 : C.b600 });
      L.badge(s, ic, x + w - 0.62, y + 0.18, 0.42, c);
      L.txt(s, t, x + 0.2, y + 0.75, w - 0.4, 0.55, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'top' });
      L.txt(s, d, x + 0.2, y + 1.35, w - 0.4, 1.3, { fontSize: 10.5, color: C.text });
    });
    L.box(s, 0.6, 4.95, 7.4, 0.75, { fill: C.b50, r: 0.12 });
    L.txt(s, [{ text: 'Adaptability becomes a deliberate architectural property ', options: { bold: true } }, { text: 'rather than a reaction to the next country-level power, regulatory, or supply-chain constraint.' }], 0.8, 4.95, 7.1, 0.75, { fontSize: 11.5, color: C.ink, valign: 'middle' });
    L.box(s, 8.2, 4.95, 0.05, 0.75, { fill: C.b600, r: 0 });
    L.txt(s, 'Standardize the operating model, not necessarily the regional footprint.', 8.45, 4.95, 4.28, 0.75, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'middle' });
    s.addImage({ path: IMG('band.jpg'), x: 0.6, y: 5.9, w: 12.13, h: 0.95, sizing: { type: 'cover', w: 12.13, h: 0.95 } });
    L.txt(s, [{ text: 'The goal is not to select the perfect two regions. ', options: { fontFace: F.light } }, { text: 'It is to make additional regions significantly easier to adopt when business and workload requirements justify them.', options: { fontFace: F.semi } }], 0.95, 5.9, 11.4, 0.95, { fontSize: 16, color: 'FFFFFF', valign: 'middle' });
    L.footer(s, 0, 'EXECUTIVE SUMMARY');
    s.addNotes('Executive one-liner: evolve Landing Zones from fixed regional infrastructure footprints into a governed European operating model where regional placement is an adaptable application-level decision. Key points: standardize governance, decouple connectivity, tier the regional footprint, classify workloads by archetype, and preserve regional optionality. This positions adaptability as a deliberate architectural property rather than as a reaction to the next country-level power, regulatory, or supply-chain constraint.');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '01 · Reframe the objective', 'An operating model that keeps working as the environment changes', { tw: 8.2, lede: 'Regulatory requirements and power availability can change across European countries, even as Microsoft continues to invest in and grow capacity across Europe.', lx: 8.9, lw: 3.83 });
    // left panel: fixed pair
    L.box(s, 0.6, 1.85, 4.3, 4.45, { fill: C.wash, r: 0.14 });
    L.txt(s, 'A fixed regional pair', 0.85, 2.02, 2.6, 0.3, { fontSize: 13, fontFace: F.semi, color: C.ink });
    L.txt(s, 'TRADITIONAL', 3.45, 2.06, 1.25, 0.25, { fontSize: 8.5, bold: true, color: C.faint, align: 'right', charSpacing: 2 });
    [['Primary region', 0.85], ['DR region', 2.85]].forEach(([n, x]) => {
      L.box(s, x, 2.5, 1.8, 2.0, { fill: 'FFFFFF', line: C.b300, dash: 'dash', r: 0.1 });
      L.icon(s, 'pin', x + 0.12, 2.6, 0.18, 'b');
      L.txt(s, n, x + 0.34, 2.58, 1.4, 0.24, { fontSize: 10, bold: true, color: C.b700 });
      [['Workloads', C.t600, 'FFFFFF'], ['Shared services', C.b100, C.b800], ['Hub & connectivity', C.b600, 'FFFFFF']].forEach(([t, f, c], j) => {
        L.box(s, x + 0.14, 3.02 + j * 0.47, 1.52, 0.38, { fill: f, r: 0.06 });
        L.txt(s, t, x + 0.14, 3.02 + j * 0.47, 1.52, 0.38, { fontSize: 9.5, bold: true, color: c, align: 'center', valign: 'middle' });
      });
    });
    L.line(s, 2.67, 3.5, 2.83, 3.5, { color: C.faint, both: true, w: 1 });
    L.txt(s, 'Mirrored infrastructure', 0.85, 4.58, 3.8, 0.22, { fontSize: 9.5, color: C.muted, align: 'center' });
    L.txt(s, 'EVOLVING REGIONAL CONDITIONS', 0.85, 4.95, 3.8, 0.22, { fontSize: 8.5, bold: true, color: C.w600, charSpacing: 2 });
    let cx = 0.85; ['Regulatory change', 'Power and energy'].forEach(t => { cx += L.chip(s, t, cx, 5.25, { fill: C.w100, color: C.w600, size: 9 }) + 0.08; });
    cx = 0.85; ['Service & AI availability', 'Growth'].forEach(t => { cx += L.chip(s, t, cx, 5.6, { fill: C.w100, color: C.w600, size: 9 }) + 0.08; });
    L.txt(s, 'Works while demand is predictable; less adaptable as conditions evolve.', 0.85, 5.92, 3.9, 0.3, { fontSize: 9.5, color: C.muted });
    // arrow
    L.line(s, 5.05, 4.05, 5.6, 4.05, { color: C.b600, w: 2 });
    L.txt(s, 'Extend,\nnot replicate', 4.95, 4.2, 0.8, 0.5, { fontSize: 9.5, bold: true, color: C.b700, align: 'center' });
    // right panel: adaptable platform
    L.box(s, 5.75, 1.85, 6.98, 4.45, { fill: C.b50, r: 0.14 });
    L.txt(s, 'An adaptable multi-region platform', 6.0, 2.02, 4, 0.3, { fontSize: 13, fontFace: F.semi, color: C.ink });
    L.txt(s, 'REGIONS AS QUALIFIED OPTIONS', 9.5, 2.06, 3.0, 0.25, { fontSize: 8.5, bold: true, color: C.b600, align: 'right', charSpacing: 2 });
    const regs = [
      ['Region A', 2.0, [['Workloads', C.t600, 'FFFFFF'], ['Shared', C.b100, C.b800], ['Full hub', C.b600, 'FFFFFF']], 'Strategic hub'],
      ['Region B', 2.0, [['Workloads', C.t600, 'FFFFFF'], ['Shared', C.b100, C.b800], ['Full hub', C.b600, 'FFFFFF']], 'Strategic hub'],
      ['Region C', 1.55, [['Workloads', C.t600, 'FFFFFF'], ['Minimal hub', 'FFFFFF', C.b700, C.b300]], 'Minimal hub'],
      ['Region D', 1.15, [['Spokes', C.t600, 'FFFFFF']], 'Remote hub', 'via remote hub'],
      ['Region E', 0.95, [['Isolated spokes', C.t100, C.t700]], 'Disconnected'],
      ['Region F', 0.72, [], 'Not enabled', 'Candidate'],
    ];
    const base = 5.12, rw = 1.02, gap = 0.1;
    regs.forEach(([n, h, blocks, lab, extra], i) => {
      const x = 6.0 + i * (rw + gap), y = base - h;
      L.box(s, x, y, rw, h, { fill: 'FFFFFF', line: i === 5 ? C.b500 : C.b300, dash: 'dash', r: 0.08 });
      L.icon(s, 'pin', x + 0.07, y + 0.09, 0.15, 'b');
      L.txt(s, n, x + 0.24, y + 0.06, 0.8, 0.22, { fontSize: 9, bold: true, color: C.b700 });
      blocks.slice().reverse().forEach(([t, f, c, ln], j) => {
        const by = base - 0.1 - (j + 1) * 0.34;
        L.box(s, x + 0.08, by, rw - 0.16, 0.28, { fill: f, line: ln, r: 0.05 });
        L.txt(s, t, x + 0.08, by, rw - 0.16, 0.28, { fontSize: 8.5, bold: true, color: c, align: 'center', valign: 'middle' });
      });
      if (extra) L.txt(s, extra, x, base - (blocks.length ? 0.1 + blocks.length * 0.34 + 0.26 : 0.4), rw, 0.22, { fontSize: 8.5, bold: true, color: C.b600, align: 'center' });
      L.txt(s, lab, x - 0.05, base + 0.06, rw + 0.1, 0.2, { fontSize: 8.5, color: C.muted, align: 'center' });
    });
    L.box(s, 6.0, 5.52, 6.48, 0.6, { fill: C.s800, r: 0.08 });
    L.txt(s, 'One consistent, governed Azure landing-zone foundation', 6.2, 5.55, 6.1, 0.3, { fontSize: 11.5, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    L.txt(s, 'Identity · Connectivity · Security · Management · Application delivery', 6.2, 5.82, 6.1, 0.25, { fontSize: 9.5, color: 'C9D4E2' });
    L.caption(s, 'Figure', 'Regional capability is a spectrum, not a copy: the platform extends one governed foundation and gives each region only what its workloads require.', 0.6, 6.45, 12.1);
    L.footer(s, 0, '01 · REFRAME THE OBJECTIVE');
    s.addNotes('Talk track — reframe the objective: "I think the opportunity is to evolve how we think about Landing Zones. Traditionally, we have tended to think about an Azure Landing Zone as something we establish in a particular region, with a fairly complete set of networking, security, management and shared services around it. That works well when the regions we want to use are relatively static. But the challenge we are trying to solve now is different. We want an operating model that can continue to work even as the external environment around us changes." Connect this need for flexibility to potential future regulatory and power constraints across European countries, while noting that Microsoft continues investing and growing capacity across Europe. For regulated customers, this begins the discussion on how to de-risk continued growth in an ever-changing, industry-wide dynamic.');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '02 · From a region mindset to a geography mindset', 'Define the landing zone by geography, not by region', { tw: 8.2, lede: 'Broaden the architectural boundary. The individual regions underneath become adaptable deployment locations.', lx: 8.9, lw: 3.83 });
    L.box(s, 0.6, 1.75, 12.13, 3.9, { fill: C.b50, line: C.b200, r: 0.16 });
    L.txt(s, 'Geographic landing zone · for example, Europe', 0.85, 1.88, 7, 0.35, { fontSize: 14, fontFace: F.semi, color: C.b800 });
    L.txt(s, 'ONE GOVERNED OPERATING MODEL', 8.5, 1.9, 4.0, 0.3, { fontSize: 9, bold: true, color: C.b600, charSpacing: 2, align: 'right' });
    L.box(s, 0.85, 2.35, 11.63, 0.75, { fill: C.s800, r: 0.1 });
    L.txt(s, 'CONSTANTS ACROSS\nTHE GEOGRAPHY', 1.05, 2.35, 2.0, 0.75, { fontSize: 8.5, bold: true, color: 'A9C7E8', charSpacing: 1.5, valign: 'middle' });
    [['doc', 'Policies'], ['shield', 'Security controls'], ['gear', 'Operational rigor'], ['lock', 'Compliance requirements']].forEach(([ic, t], i) => {
      const x = 3.2 + i * 2.35;
      L.icon(s, ic, x, 2.57, 0.3, 'w');
      L.txt(s, t, x + 0.4, 2.35, 1.9, 0.75, { fontSize: 12, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    });
    const R = [['Region A', 'Strategic hub', 'Full networking, security, management, shared services', 'hub'], ['Region B', 'Strategic hub', 'Full networking, security, management, shared services', 'hub'], ['Region C', 'Qualified', 'Minimal regional hub for a portfolio', 'q'], ['Region D', 'Qualified', 'Spokes connected to a strategic hub', 'q'], ['Region E', 'Qualified', 'Self-contained AI workloads', 'q'], ['Region F', 'Candidate', 'Assessed; not yet enabled', 'c']];
    R.forEach(([r, tag, d, k], i) => {
      const x = 0.85 + i * 1.955, y = 3.3, w = 1.83, h = 1.75;
      const hub = k === 'hub';
      L.box(s, x, y, w, h, { fill: hub ? (i ? C.b700 : C.b600) : k === 'c' ? C.b50 : 'FFFFFF', line: hub ? undefined : C.b300, dash: 'dash', r: 0.1 });
      L.icon(s, 'pin', x + 0.12, y + 0.14, 0.16, hub ? 'w' : 'b');
      L.txt(s, r, x + 0.32, y + 0.08, 1.4, 0.28, { fontSize: 10.5, bold: true, color: hub ? 'FFFFFF' : C.b700, valign: 'middle' });
      L.chip(s, tag, x + 0.12, y + 0.46, { fill: hub ? '3F86C9' : k === 'c' ? 'FFFFFF' : C.t100, color: hub ? 'FFFFFF' : k === 'c' ? C.b700 : C.t700, size: 8.5, line: k === 'c' ? C.b500 : undefined, dash: k === 'c' ? 'dash' : undefined });
      L.txt(s, d, x + 0.12, y + 0.85, w - 0.24, 0.85, { fontSize: 9.5, color: hub ? 'DDEBF9' : C.muted, valign: 'bottom' });
    });
    L.txt(s, 'CONSISTENT: GOVERNANCE, SECURITY, COMPLIANCE, OPERATIONS', 0.85, 5.18, 6, 0.3, { fontSize: 8.5, bold: true, color: C.s800, charSpacing: 1.5 });
    L.txt(s, 'ADAPTABLE: WHICH REGIONS EACH APPLICATION CONSUMES', 6.5, 5.18, 5.98, 0.3, { fontSize: 8.5, bold: true, color: C.t600, charSpacing: 1.5, align: 'right' });
    L.box(s, 0.6, 5.85, 12.13, 0.95, { fill: C.b700, r: 0.14 });
    L.icon(s, 'layers', 0.9, 6.13, 0.4, 'w');
    L.txt(s, [{ text: 'Standardize the operating model, ', options: { fontFace: F.semi } }, { text: 'not necessarily the regional footprint.', options: { fontFace: F.light } }], 1.5, 5.85, 11, 0.95, { fontSize: 22, color: 'FFFFFF', valign: 'middle' });
    L.footer(s, 0, '02 · GEOGRAPHY MINDSET');
    s.addNotes('Talk track: "Rather than defining our cloud architecture around a small number of permanently designated Azure regions, we can broaden the architectural boundary. For a European estate, we can think about the overarching Landing Zone in geographic terms. At that level, the things we want to make consistent are the policies, security controls, operational rigor and compliance requirements. Those are the constants. The individual Azure regions underneath that model become more adaptable deployment locations." Customers are broadening Landing Zones into a larger geography, such as the European data boundary, governed by common security, operational and compliance policies across multiple regions. "Standardize the operating model, not necessarily the regional footprint."');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '03 · Decouple connectivity from individual regions', 'Plan hybrid connectivity once, for the geography', { tw: 8.2, lede: 'Enabling an additional Azure region does not by itself require another ExpressRoute circuit.', lx: 8.9, lw: 3.83 });
    // on-prem
    L.box(s, 0.6, 1.75, 2.0, 3.6, { fill: C.wash, r: 0.12 });
    L.txt(s, 'ON-PREMISES', 0.78, 1.85, 1.7, 0.22, { fontSize: 8.5, bold: true, color: C.s600, charSpacing: 2 });
    [[2.2, 'Datacenter 1'], [3.95, 'Datacenter 2']].forEach(([y, t]) => { L.box(s, 0.75, y, 1.7, 0.95, { fill: C.s800, r: 0.1 }); L.icon(s, 'building', 0.88, y + 0.12, 0.26, 'w'); L.txt(s, [{ text: t, options: { bold: true, breakLine: true } }, { text: 'and connected sites', options: { fontSize: 8.5, color: 'C9D4E2' } }], 0.88, y + 0.42, 1.5, 0.5, { fontSize: 10.5, color: 'FFFFFF' }); });
    // peering locations
    [[2.25, 'Peering location 1'], [4.0, 'Peering location 2']].forEach(([y, t]) => { L.box(s, 3.45, y, 2.3, 0.85, { fill: 'FFFFFF', line: C.b600, lw: 1.5, r: 0.42 }); L.txt(s, [{ text: t, options: { bold: true, color: C.b700, breakLine: true } }, { text: 'ExpressRoute or ExpressRoute Direct', options: { fontSize: 8.5, color: C.muted } }], 3.45, y, 2.3, 0.85, { fontSize: 11, align: 'center', valign: 'middle' }); });
    L.line(s, 2.45, 2.55, 3.45, 2.6, { color: C.s600, arrow: false }); L.line(s, 2.45, 2.8, 3.45, 4.35, { color: C.s600, arrow: false });
    L.line(s, 2.45, 4.3, 3.45, 2.75, { color: C.s600, arrow: false }); L.line(s, 2.45, 4.55, 3.45, 4.45, { color: C.s600, arrow: false });
    L.txt(s, 'Redundant circuits · diverse paths', 2.8, 5.0, 3.3, 0.25, { fontSize: 9, bold: true, color: C.s600, align: 'center' });
    // backbone
    L.line(s, 5.75, 2.67, 6.35, 2.67, { color: C.b600, w: 2.5, arrow: false }); L.line(s, 5.75, 4.42, 6.35, 4.42, { color: C.b600, w: 2.5, arrow: false });
    L.box(s, 6.35, 1.75, 0.62, 3.6, { fill: C.b600, r: 0.12 });
    L.txt(s, 'Azure backbone', 6.35, 1.75, 0.62, 3.6, { fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', vert: 'vert270' });
    L.line(s, 6.97, 3.55, 7.35, 3.55, { color: C.b600, w: 2.5 });
    // geography
    L.box(s, 7.4, 1.75, 5.33, 3.6, { fill: C.b50, line: C.b300, dash: 'dash', r: 0.14 });
    L.txt(s, 'GEOGRAPHY · FOR EXAMPLE, EUROPE', 7.6, 1.85, 4, 0.22, { fontSize: 8.5, bold: true, color: C.b700, charSpacing: 2 });
    const G = [['Region A', 'Strategic hub · gateways', C.b600, 'FFFFFF', 'DDEBF9'], ['Region B', 'Strategic hub · gateways', C.b700, 'FFFFFF', 'DDEBF9'], ['Region C', 'Minimal hub · reuses circuits', 'FFFFFF', C.b700, C.muted], ['Region D', 'Spokes via a strategic hub', 'FFFFFF', C.b700, C.muted], ['Region E', 'Self-contained · no hybrid path', 'FFFFFF', C.t700, C.muted], ['Region F', 'Candidate · no new circuit assumed', C.b50, C.b700, C.muted]];
    G.forEach(([r, d, f, c1, c2], i) => {
      const x = 7.6 + (i % 2) * 2.5, y = 2.2 + Math.floor(i / 2) * 1.0, w = 2.4, h = 0.88;
      L.box(s, x, y, w, h, { fill: f, line: f === 'FFFFFF' ? (i === 4 ? C.t300 : C.b300) : i === 5 ? C.b500 : undefined, dash: i === 5 ? 'dash' : 'solid', r: 0.1 });
      L.icon(s, 'pin', x + 0.12, y + 0.14, 0.16, c1 === 'FFFFFF' ? 'w' : i === 4 ? 't' : 'b');
      L.txt(s, [{ text: r, options: { bold: true, color: c1, breakLine: true } }, { text: d, options: { fontSize: 8.5, color: c2 } }], x + 0.34, y + 0.06, w - 0.4, h - 0.12, { fontSize: 10.5, valign: 'middle' });
    });
    L.caption(s, 'Figure', 'Reachability depends on circuit type — for example, Standard circuits reach regions in the same geopolitical region, Premium extends globally. Locations and roles are illustrative.', 0.6, 5.45, 12.1);
    const T = [['route', C.b600, 'Route diversity', 'Redundant circuits across separate peering locations remove single points of failure for the geography.'], ['network', C.s800, 'Decoupled from each region', 'Hybrid connectivity, hub placement, and application connectivity are separate decisions.'], ['gauge', C.t600, 'Sustainable economics', 'A complete footprint in every region is expensive and hard to sustain; reuse what meets the requirements.']];
    T.forEach(([ic, c, t, d], i) => {
      const x = 0.6 + i * 4.1, y = 5.9, w = 3.93, h = 0.95;
      L.box(s, x, y, w, h, { fill: C.wash, r: 0.1 });
      L.badge(s, ic, x + 0.15, y + 0.2, 0.4, c);
      L.txt(s, [{ text: t, options: { bold: true, color: C.ink, breakLine: true } }, { text: d, options: { fontSize: 9, color: C.text } }], x + 0.68, y + 0.04, w - 0.8, h - 0.08, { fontSize: 11, valign: 'middle' });
    });
    L.footer(s, 0, '03 · DECOUPLE CONNECTIVITY');
    s.addNotes('Talk track: "The next architectural shift is connectivity. Instead of asking, how do I build the full networking stack again every time I enter another Azure region, we can think about connectivity strategically across Europe. We establish redundant connectivity into the Azure backbone through strategically located ExpressRoute or ExpressRoute Direct peering locations. That gives us route diversity and lets us think about connectivity geographically rather than designing it independently for every region." Describe strategically distributed peering locations as a way of providing route diversity and connectivity to Azure regions while decoupling ExpressRoute planning from individual regions. This is important economically as well as architecturally. From the whitepaper: add circuits, peering locations, gateways, or paths only where reachability, diversity, failure-domain isolation, latency, bandwidth, routing, or resiliency requirements justify them.');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '04 · Tier the regional footprint', 'Not every region needs a full landing zone', { tw: 8, lede: 'A small number of strategic geographic hubs — often two or three regions — carry the full footprint. Other regions use the lightest pattern that meets their requirements.', lx: 8.6, lw: 4.13 });
    L.line(s, 0.6, 1.95, 12.73, 1.95, { color: C.b500, w: 3 });
    L.txt(s, 'NO DEPENDENCY ON A GEOGRAPHIC HUB', 0.6, 2.03, 5, 0.22, { fontSize: 8.5, bold: true, color: C.t600, charSpacing: 1.5 });
    L.txt(s, 'GREATER LOCAL CAPABILITY AND INDEPENDENCE', 7.2, 2.03, 5.53, 0.22, { fontSize: 8.5, bold: true, color: C.b700, charSpacing: 1.5, align: 'right' });
    const P = [
      [C.t600, 'No private connectivity to an enterprise hub, other Azure regions, or on-premises.', 'No hub, no gateway, no private connectivity. Best for self-contained workloads.'],
      [C.c600, 'Spokes connect privately to an existing strategic hub in another region.', 'Centralized services used; local services not required.'],
      [C.b500, 'Selected local services and connectivity, based on workload requirements.', 'Local shared services with selective connectivity — right-sized without a full hub.'],
      [C.b700, 'Comprehensive local capabilities, with connectivity to spokes, on-premises, and other regions.', 'Full local capabilities when required by latency, traffic volume, compliance, or operations.'],
    ];
    P.forEach(([c, d, f], i) => {
      const x = 0.6 + i * 3.08, y = 2.4, w = 2.9, h = 3.9;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.num(s, i + 1, x + 0.18, y + 0.18, 0.38, c, 'FFFFFF', 13);
      L.txt(s, PROF[i], x + 0.66, y + 0.12, w - 0.75, 0.5, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.18, y + 0.7, w - 0.36, 0.6, { fontSize: 10, color: C.muted });
      // mini architecture
      const ax = x + 0.2, ay = y + 1.4, aw = w - 0.4;
      if (i === 0) {
        L.box(s, ax, ay, aw, 1.2, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.1 });
        L.icon(s, 'pin', ax + 0.08, ay + 0.06, 0.14, 'b'); L.txt(s, 'New Region', ax + 0.24, ay + 0.03, 1.2, 0.2, { fontSize: 7.5, bold: true, color: C.b700 });
        [0.35, 1.55].forEach(o => { L.box(s, ax + o, ay + 0.3, 0.6, 0.55, { fill: C.t50, line: C.t300, r: 0.08 }); L.box(s, ax + o + 0.18, ay + 0.46, 0.24, 0.24, { fill: C.t600, r: 0.05 }); });
        L.line(s, ax + 0.95, ay + 0.575, ax + 1.55, ay + 0.575, { color: C.t600, dash: 'dash', arrow: false });
        L.txt(s, 'peering', ax + 0.95, ay + 0.3, 0.6, 0.2, { fontSize: 8, color: C.t700, align: 'center' });
        L.txt(s, 'Azure platform services', ax, ay + 0.92, aw, 0.22, { fontSize: 8.5, color: C.s600, align: 'center' });
      }
      if (i === 1) {
        L.box(s, ax, ay, 1.1, 1.2, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.1 });
        L.txt(s, 'New Region', ax + 0.05, ay + 0.02, 1.0, 0.18, { fontSize: 7, bold: true, color: C.b700, align: 'center' });
        [0.24, 0.66].forEach(o => { L.box(s, ax + 0.25, ay + o, 0.6, 0.36, { fill: C.t50, line: C.t300, r: 0.06 }); L.box(s, ax + 0.45, ay + o + 0.08, 0.2, 0.2, { fill: C.t600, r: 0.04 }); });
        L.box(s, ax + 1.5, ay, aw - 1.5, 1.2, { fill: C.b600, r: 0.1 });
        L.txt(s, [{ text: 'Hub region', options: { bold: true, breakLine: true } }, { text: 'strategic hub', options: { fontSize: 7.5, color: 'BCD9F5', breakLine: true } }, { text: 'Hybrid · inspection · egress · routing · DNS · identity', options: { fontSize: 7.5, color: 'DDEBF9' } }], ax + 1.55, ay + 0.05, aw - 1.6, 1.1, { fontSize: 9, color: 'FFFFFF', align: 'center', valign: 'middle' });
        L.line(s, ax + 1.12, ay + 0.6, ax + 1.48, ay + 0.6, { color: C.b600, both: true });
      }
      if (i === 2) {
        L.box(s, ax, ay, 1.85, 1.2, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.1 });
        L.txt(s, 'New Region', ax + 0.08, ay + 0.02, 1.2, 0.16, { fontSize: 7, bold: true, color: C.b700 });
        L.box(s, ax + 0.1, ay + 0.18, 1.65, 0.42, { fill: 'FFFFFF', line: C.b500, lw: 1.5, r: 0.07 });
        L.txt(s, [{ text: 'Shared services (selected)', options: { bold: true, breakLine: true } }, { text: 'DNS · VNet Gateway · Azure Monitor', options: { fontSize: 6.5 } }], ax + 0.1, ay + 0.18, 1.65, 0.42, { fontSize: 7, color: C.b700, align: 'center', valign: 'middle' });
        [0.15, 0.97].forEach(o => { L.box(s, ax + o, ay + 0.7, 0.73, 0.4, { fill: C.t50, line: C.t300, r: 0.06 }); L.box(s, ax + o + 0.26, ay + 0.8, 0.2, 0.2, { fill: C.t600, r: 0.04 }); });
        L.line(s, ax + 1.87, ay + 0.32, ax + 2.1, ay + 0.32, { color: C.b500, dash: 'dash', arrow: false });
        L.oval(s, ax + 2.1, ay + 0.15, 0.34, { fill: C.b600 }); L.oval(s, ax + 2.21, ay + 0.26, 0.12, { fill: 'FFFFFF' });
        L.txt(s, 'strategic hub', ax + 1.9, ay + 0.55, 0.65, 0.4, { fontSize: 7.5, color: C.muted, align: 'center' });
      }
      if (i === 3) {
        L.box(s, ax, ay, aw, 1.2, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.1 });
        L.txt(s, 'New Region', ax + 0.08, ay + 0.02, 1.2, 0.16, { fontSize: 7, bold: true, color: C.b700 });
        L.box(s, ax + 0.12, ay + 0.18, aw - 0.24, 0.5, { fill: C.b700, r: 0.08 });
        L.txt(s, [{ text: 'Shared services (comprehensive)', options: { bold: true, color: 'FFFFFF', breakLine: true } }, { text: 'DNS · VNet Gateway · Azure Firewall · Azure Monitor', options: { color: 'DDEBF9' } }], ax + 0.18, ay + 0.18, aw - 0.36, 0.5, { fontSize: 7, align: 'center', valign: 'middle' });
        [0.35, 1.45].forEach(o => { L.box(s, ax + o, ay + 0.75, 0.7, 0.36, { fill: C.t50, line: C.t300, r: 0.06 }); L.box(s, ax + o + 0.25, ay + 0.83, 0.2, 0.2, { fill: C.t600, r: 0.04 }); });
      }
      L.box(s, x, y + h - 1.05, w, 1.05, { fill: C.wash, r: 0.12 }); L.box(s, x, y + h - 1.05, w, 0.3, { fill: C.wash, r: 0 });
      L.txt(s, f, x + 0.18, y + h - 1.0, w - 0.36, 0.95, { fontSize: 10.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    L.caption(s, 'Figure', 'Profiles are not maturity stages: adoption growth alone does not justify moving toward a Full Regional Hub. Services shown are examples.', 0.6, 6.5, 12.1);
    L.footer(s, 0, '04 · TIER THE REGIONAL FOOTPRINT');
    s.addNotes('Talk track — this is the core architectural pivot: "Once we have that geographic foundation, we do not have to copy and paste the same full Landing Zone into every Azure region. We can maintain a small number of strategic geographic hubs with the full networking, security, management and shared-service footprint, while allowing applications to consume additional regions using lighter-weight patterns appropriate to the workload." Describe customers using two or three regions for full geographic Landing Zone hubs, then evaluating application requirements individually rather than automatically recreating the entire platform footprint everywhere.');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '04 · Tier the regional footprint', 'A few strategic hubs; lighter patterns elsewhere', { tw: 6.2, ts: 23 });
    // cost curve (native)
    const cx = 0.95, cy = 5.4, cw = 4.9, ch = 3.4;
    L.line(s, cx, cy, cx, cy - ch, { color: C.faint, w: 1 }); L.line(s, cx, cy, cx + cw, cy, { color: C.faint, w: 1 });
    L.txt(s, 'Local capability and independence →', cx, cy + 0.08, cw, 0.25, { fontSize: 9.5, bold: true, color: C.s600, align: 'center' });
    L.txt(s, 'Fixed platform cost and operational scope →', cx - 0.45, cy - ch, 0.3, ch, { fontSize: 9.5, bold: true, color: C.s600, align: 'center', vert: 'vert270', valign: 'middle' });
    const pts = [[0.35, 0.25, C.t600, 'Disconnected spokes'], [1.55, 0.7, C.c600, 'Remote-hub-connected'], [2.95, 1.65, C.b500, 'Minimal regional hub'], [4.55, 3.25, C.b700, 'Full regional hub']];
    for (let i = 0; i < pts.length - 1; i++) L.line(s, cx + pts[i][0], cy - pts[i][1], cx + pts[i + 1][0], cy - pts[i + 1][1], { color: pts[i + 1][2], w: 2.5, arrow: false });
    pts.forEach(([x, y, c, t], i) => { L.oval(s, cx + x - 0.13, cy - y - 0.13, 0.26, { fill: c }); L.txt(s, t, cx + x + (i === 3 ? -2.0 : 0.2), cy - y + (i === 3 ? -0.45 : 0.02), 1.9, 0.26, { fontSize: 10, bold: true, color: C.ink, align: i === 3 ? 'right' : 'left' }); });
    
    L.box(s, 0.6, 5.85, 5.4, 0.9, { fill: C.wash, r: 0.1 });
    L.txt(s, [{ text: 'Pay for local capability only where justified. ', options: { bold: true } }, { text: 'A complete footprint in every region is expensive and hard to sustain; more local capability adds fixed cost but can reduce cross-region dependency.' }], 0.78, 5.85, 5.1, 0.9, { fontSize: 10, color: C.ink, valign: 'middle' });
    // estate diagram (right)
    const X = 6.4;
    const reg = (x, y, w, h, lab, t, sub, o = {}) => {
      L.box(s, x, y, w, h, { fill: o.fill || 'FFFFFF', line: o.line === undefined ? C.b300 : o.line, dash: o.solid ? 'solid' : 'dash', r: 0.1 });
      L.icon(s, 'pin', x + 0.1, y + 0.1, 0.16, o.ic || 'b');
      L.txt(s, lab, x + 0.3, y + 0.06, w - 0.35, 0.24, { fontSize: 9, bold: true, color: o.lc || C.b700, valign: 'middle' });
      L.txt(s, [{ text: t, options: { fontFace: F.semi, fontSize: 10.5, color: o.tc || C.ink, breakLine: !!sub } }].concat(sub ? [{ text: sub, options: { fontSize: 8.5, color: o.sc || C.muted } }] : []), x + 0.1, y + 0.32, w - 0.18, h - 0.36, { valign: 'top' });
    };
    reg(X, 3.55, 1.35, 1.0, '', 'On-premises', 'datacenters and user locations', { fill: C.s800, line: null, solid: true, ic: 'w', tc: 'FFFFFF', sc: 'C9D4E2' });
    reg(X + 1.85, 2.55, 1.75, 1.0, 'Region A', 'Strategic hub', 'Full hub · resilient hybrid', { fill: C.b600, line: null, solid: true, ic: 'w', lc: 'DDEBF9', tc: 'FFFFFF', sc: 'DDEBF9' });
    reg(X + 1.85, 4.75, 1.75, 1.0, 'Region B', 'Strategic hub', 'Full hub · resilient hybrid', { fill: C.b600, line: null, solid: true, ic: 'w', lc: 'DDEBF9', tc: 'FFFFFF', sc: 'DDEBF9' });
    const R = [['Region C', 'Minimal regional hub', 'Own on-premises path; rest from A'], ['Region D', 'Minimal regional hub', 'No on-premises path; rest from A'], ['Region E', 'Remote-hub spokes', 'Services from Region A'], ['Region F', 'Remote-hub spokes', 'Services from Region B'], ['Region G', 'Disconnected spokes', 'No private path'], ['Region H', 'Candidate', 'Not yet enabled']];
    const rx = X + 4.2, rw = 12.73 - rx;
    R.forEach(([l, t, sub], i) => {
      const y = 1.55 + i * 0.76;
      reg(rx, y, rw, 0.68, l, t, sub, i === 4 ? { line: C.t300, lc: C.t700, ic: 't' } : i === 5 ? { line: C.b500, tc: C.b700 } : {});
    });
    // connections
    const opx = X + 0.675;
    L.path(s, [[opx, 3.55], [opx, 3.05], [X + 1.85, 3.05]], { color: C.s600, both: true });
    L.path(s, [[opx, 4.55], [opx, 5.25], [X + 1.85, 5.25]], { color: C.s600, both: true });
    L.path(s, [[opx - 0.35, 3.55], [opx - 0.35, 1.72], [rx, 1.72]], { color: C.s600, both: true });
    L.tag(s, 'Existing ExpressRoute circuit', X + 2.75, 1.72, { color: C.s600, w: 1.95 });
    L.txt(s, 'Express-\nRoute', X + 0.72, 3.1, 0.7, 0.36, { fontSize: 7.5, bold: true, color: C.s600 });
    L.line(s, X + 3.2, 3.55, X + 3.2, 4.75, { color: C.b600, both: true });
    const ax = X + 3.6, mx = X + 3.9;
    L.path(s, [[rx, 1.55 + 0.5], [mx - 0.1, 2.05], [mx - 0.1, 2.75], [ax, 2.75]], { color: C.b600, dash: 'dash', both: true });
    L.path(s, [[rx, 2.31 + 0.34], [mx + 0.05, 2.65], [mx + 0.05, 3.05], [ax, 3.05]], { color: C.b600, dash: 'dash', both: true });
    L.path(s, [[rx, 3.07 + 0.34], [mx + 0.2, 3.41], [mx + 0.2, 3.35], [ax, 3.35]], { color: C.b600, both: true });
    L.path(s, [[rx, 3.83 + 0.34], [mx + 0.1, 4.17], [mx + 0.1, 5.25], [ax, 5.25]], { color: C.b600, both: true });
    L.box(s, X, 6.15, 12.73 - X, 0.42, { fill: C.wash, line: C.line, r: 0.08 });
    L.icon(s, 'shield', X + 0.12, 6.24, 0.22, 's');
    L.txt(s, [{ text: 'Consistent across every profile: ', options: { bold: true } }, { text: 'governance, security, compliance, automation, and operations' }], X + 0.42, 6.15, 5.8, 0.42, { fontSize: 9.5, color: C.ink, valign: 'middle' });
    L.caption(s, 'Figure', 'Illustrative estate. Names and placements are examples.', 6.4, 6.68, 6.3);
    L.footer(s, 0, '04 · TIER THE REGIONAL FOOTPRINT');
    s.addNotes('Talk track: this is important economically as well as architecturally, because customers raise concerns that establishing a complete footprint in every additional region becomes expensive and difficult to sustain. The estate shows two strategic hubs with full footprints; other regions use minimal hubs, remote-hub-connected spokes, or disconnected spokes, and a candidate region stays an option until needed.');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '05 · Classify workloads by archetype', 'Four Workload Landing Zone archetypes', { ec: C.t600, tw: 8, lede: 'Archetypes describe what applications require; connectivity profiles describe what the platform provides. The mapping is not one-to-one.', lx: 8.9, lw: 3.83 });
    const A = [
      ['building', C.b700, 'Hybrid-connected applications', 'Traditional line-of-business applications with tight dependencies on on-premises environments.', 'Deploy in strategic hub regions, where the complete geographic landing zone exists.', ['Full hub', 'Minimal hub', 'Remote hub'], 1],
      ['layers', C.t600, 'Isolated cloud-native or AI applications', 'Largely self-contained; only application endpoints need secure exposure back into the geographic landing zones.', 'Deploy where required services and capacity are available; expose endpoints through Private Endpoints.', ['Disconnected spokes', 'Connected, where justified'], 4],
      ['data', C.t700, 'Connected cloud-native or AI applications', 'Need more than endpoint exposure, but do not justify recreating a complete regional hub.', 'Private connectivity back to the geographic hubs — for example, Global VNet Peering.', ['Remote hub', 'Minimal hub', 'Full hub'], 3],
      ['network', C.v600, 'Interconnected application portfolios', 'A portfolio needing east-west connectivity between applications and north-south connectivity to the estate.', 'A minimally viable regional hub with only the dependencies and connectivity the portfolio needs.', ['Minimal hub', 'Remote hub', 'Full hub'], 2],
    ];
    A.forEach(([ic, c, t, d, p, chips, flex], i) => {
      const x = 0.6 + i * 3.08, y = 1.7, w = 2.93, h = 3.95;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.num(s, i + 1, x + 0.18, y + 0.2, 0.36, c, 'FFFFFF', 12);
      L.txt(s, t, x + 0.64, y + 0.12, w - 0.75, 0.52, { fontSize: 11.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.18, y + 0.75, w - 0.36, 0.85, { fontSize: 10, color: C.text });
      L.box(s, x + 0.18, y + 1.62, w - 0.36, 0.008, { fill: C.soft, r: 0 });
      L.txt(s, 'TYPICAL PATTERN', x + 0.18, y + 1.7, 2, 0.2, { fontSize: 8, bold: true, color: C.b600, charSpacing: 1.5 });
      L.txt(s, p, x + 0.18, y + 1.92, w - 0.36, 0.8, { fontSize: 10, color: C.ink });
      L.box(s, x, y + 2.85, w, 1.1, { fill: C.wash, r: 0.12 }); L.box(s, x, y + 2.85, w, 0.3, { fill: C.wash, r: 0 });
      let cx = x + 0.15, cy = y + 2.95;
      chips.forEach(ch => { const cw = ch.length * 0.066 + 0.28; if (cx + cw > x + w - 0.1) { cx = x + 0.15; cy += 0.3; } const dsh = ch.includes('justified'); L.chip(s, ch, cx, cy, { fill: dsh ? 'FFFFFF' : ch.startsWith('Disc') ? C.t100 : C.b100, color: ch.startsWith('Disc') ? C.t700 : C.b700, line: dsh ? C.b500 : undefined, dash: dsh ? 'dash' : undefined, size: 8.5 }); cx += cw + 0.06; });
      for (let k = 0; k < 4; k++) L.box(s, x + 0.15 + k * 0.2, y + 3.72, 0.15, 0.13, { fill: k < flex ? C.t600 : C.line, r: 0.02 });
      L.txt(s, 'Regional flexibility (indicative)', x + 1.0, y + 3.66, 1.9, 0.24, { fontSize: 8, color: C.muted, valign: 'middle' });
    });
    L.box(s, 0.6, 5.85, 4.1, 0.95, { fill: C.s800, r: 0.12 });
    L.txt(s, [{ text: 'Region-agnostic does not mean ', options: { color: 'FFFFFF' } }, { text: 'region-random.', options: { color: '50E6FF' } }], 0.8, 5.85, 3.8, 0.95, { fontSize: 17, fontFace: F.semi, valign: 'middle' });
    L.box(s, 4.8, 5.85, 7.93, 0.95, { fill: C.b50, r: 0.12 });
    L.txt(s, [{ text: 'Governance moves up a level. ', options: { bold: true, color: C.b700 } }, { text: 'Define a governed operating model and a small number of approved archetypes; each application selects the lightest-weight pattern that satisfies its connectivity, resiliency, data, security, and service requirements.' }], 5.0, 5.85, 7.6, 0.95, { fontSize: 10.5, color: C.ink, valign: 'middle' });
    L.footer(s, 0, '05 · ARCHETYPES');
    s.addNotes('Talk track — this is where we can make the model very concrete. Archetype 1, hybrid-connected: "For traditional applications with tight dependencies on on-premises environments, we continue deploying them into our strategic regions where the complete geographic Landing Zone exists." Archetype 2, isolated cloud-native or AI: "Some cloud-native or AI applications are largely self-contained. They may only need their application endpoints exposed securely back into the geographic Landing Zones. Those workloads give us much greater regional flexibility." Archetype 3, connected cloud-native or AI: "Some applications need more than endpoint exposure, but they still do not justify recreating a complete regional hub. For those workloads, Global VNet Peering can provide the private connectivity path back to the geographic hubs." Archetype 4, interconnected portfolios: "We introduce a minimally viable regional hub containing only the dependencies and connectivity capabilities that portfolio actually needs." Then: "Region-agnostic does not mean region-random. We are not eliminating architectural governance. We are actually moving governance up a level into policies that are not dependent on particular regions." The chips show the whitepaper’s typical profiles; actual dependencies decide.');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '05 · Governance moves up a level', 'Regions are qualified, not assumed', { tw: 8.2, lede: 'Five dimensions decide which regions are prepared for which workload requirements — with evidence, owners, and revalidation triggers.', lx: 9.1, lw: 3.63 });
    const dims = [
      ['Business and geography', 'Where do we need Azure presence?', ['Markets and users', 'Datacenter and partner locations', 'Planned launches or migrations', 'Growth, proximity, concentration risk'], 'Confirm sufficient business value to justify deeper assessment.', C.b300, 'b'],
      ['Data and compliance', 'Are we allowed to operate here?', ['Residency and sovereignty', 'Regulatory and industry rules', 'Company policy, customer commitments', 'Support access, encryption, data movement'], 'Exclude the region when it cannot satisfy a mandatory requirement.', C.b500, 'w'],
      ['Workload requirements and dependencies', 'What requirements and dependencies must the region support?', ['Existing and future workloads, incl. moves', 'Closest-fitting archetype', 'Data, connectivity, shared services', 'Security, resiliency, scale, services'], 'Identify the workload-driven platform requirements to validate.', C.t600, 't'],
      ['Regional capability and availability', 'Which regions can support the identified requirements?', ['Services, models, and SKUs', 'Zones and pairing', 'Latency, pricing, and scale', 'Access, quota, cross-region behavior'], 'Qualify candidates, documenting conditions, constraints, and unresolved validations.', C.b600, 'b'],
      ['Platform enablement and connectivity', 'What must the platform enable for the requirements?', ['Local, remote, or central services', 'Resilient hybrid connectivity', 'Regional platform connectivity', 'Ownership and expansion triggers'], 'Most efficient capability set and connectivity profile.', C.b800, 'b'],
    ];
    dims.forEach(([t, q, bl, d, c, tone], i) => {
      const x = 0.6 + i * 2.45, y = 1.85, w = 2.3, h = 3.95;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: tone === 't' ? C.t300 : C.line, r: 0.12 });
      L.num(s, i + 1, x + 0.16, y + 0.18, 0.4, c, 'FFFFFF', 14);
      L.txt(s, t, x + 0.66, y + 0.12, w - 0.75, 0.55, { fontSize: 11.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, q, x + 0.16, y + 0.75, w - 0.3, 0.6, { fontSize: 10.5, fontFace: F.semi, color: tone === 't' ? C.t700 : C.b700 });
      bl.forEach((b, j) => {
        L.oval(s, x + 0.19, y + 1.52 + j * 0.37, 0.06, { fill: tone === 't' ? C.t600 : C.b500 });
        L.txt(s, b, x + 0.33, y + 1.42 + j * 0.37, w - 0.45, 0.34, { fontSize: 9.5, color: C.text, valign: 'middle' });
      });
      const bg = { b: C.b50, w: C.w50, t: C.t50 }[tone], fg = { b: C.b600, w: C.w600, t: C.t600 }[tone];
      L.box(s, x + 0.06, y + h - 1.0, w - 0.12, 0.94, { fill: bg, r: 0.08 });
      L.txt(s, 'DECISION', x + 0.16, y + h - 0.93, 1.5, 0.18, { fontSize: 8, bold: true, color: fg, charSpacing: 2 });
      L.txt(s, d, x + 0.16, y + h - 0.72, w - 0.3, 0.64, { fontSize: 9.5, fontFace: F.semi, color: C.ink });
      if (i < 4) L.txt(s, '›', x + w - 0.02, y + 0.2, 0.2, 0.35, { fontSize: 20, color: C.b500, align: 'center', valign: 'middle' });
    });
    L.box(s, 0.6, 5.95, 12.13, 0.55, { fill: C.wash, r: 0.1 });
    L.txt(s, 'Framework output — against defined workload requirements', 0.82, 5.95, 4.3, 0.55, { fontSize: 11, fontFace: F.semi, color: C.ink, valign: 'middle' });
    [['x', 'o', 'Excluded', C.w600], ['clock', 'b', 'Candidate', C.b700], ['flag', 'o', 'Conditional', '8A5A00'], ['check', 'g', 'Qualified (dated)', C.g600]].forEach(([ic, c, t, col], i) => {
      const x = [5.3, 6.9, 8.5, 10.2][i];
      L.icon(s, ic, x, 6.1, 0.25, c);
      L.txt(s, t, x + 0.35, 5.95, 2.1, 0.55, { fontSize: 11, bold: true, color: col, valign: 'middle' });
    });
    L.caption(s, 'Figure', 'The recommended platform-adoption sequence. Outcomes are specific to defined workload requirements and evidence-dated, never a blanket certification.', 0.6, 6.63, 12.1);
    L.footer(s, 0, '05 · GOVERNANCE');
    s.addNotes("Governance does not disappear in this model — it moves up a level. The Regional Qualification Framework is how a region enters the governed operating model: business and geography, data and compliance, workload requirements and dependencies, regional capability and availability, and platform enablement and connectivity. Each option is recorded as excluded, candidate, conditional, or qualified as of the assessment date. Whether an individual workload uses multiple regions remains a workload-specific design decision.");
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '06 · Why this creates agility', 'Region becomes a deployment parameter', { tw: 8, lede: 'Strategic hubs remain deliberate choices. Workloads stop inheriting those choices automatically.', lx: 8.9, lw: 3.83 });
    L.box(s, 0.6, 1.7, 5.8, 1.9, { fill: C.w50, r: 0.12 });
    L.txt(s, 'TODAY', 0.85, 1.83, 2, 0.2, { fontSize: 8.5, bold: true, color: C.w600, charSpacing: 2 });
    L.txt(s, 'Region as a permanent architectural dependency', 0.85, 2.05, 5.4, 0.35, { fontSize: 14, fontFace: F.semi, color: C.ink });
    L.txt(s, 'Every workload inherits the same regional pair and its full platform footprint.', 0.85, 2.42, 5.4, 0.45, { fontSize: 10.5, color: C.text });
    L.box(s, 0.85, 2.95, 5.3, 0.45, { fill: 'FFFFFF', line: C.line, r: 0.06 });
    L.txt(s, [{ text: 'region', options: { color: C.b600, bold: true } }, { text: ' = ' }, { text: '"primary"', options: { color: C.w600 } }, { text: '   // fixed for every workload', options: { color: C.faint } }], 1.0, 2.95, 5.1, 0.45, { fontSize: 11, fontFace: 'Consolas', color: C.ink, valign: 'middle' });
    L.line(s, 6.5, 2.65, 6.83, 2.65, { color: C.b600, w: 2 });
    L.box(s, 6.93, 1.7, 5.8, 1.9, { fill: C.t50, r: 0.12 });
    L.txt(s, 'WITH THIS MODEL', 7.18, 1.83, 3, 0.2, { fontSize: 8.5, bold: true, color: C.t600, charSpacing: 2 });
    L.txt(s, 'Region as a deployment parameter', 7.18, 2.05, 5.4, 0.35, { fontSize: 14, fontFace: F.semi, color: C.ink });
    L.txt(s, 'Each workload selects a qualified option that fits its archetype and requirements, validated at decision time.', 7.18, 2.42, 5.4, 0.45, { fontSize: 10.5, color: C.text });
    L.box(s, 7.18, 2.95, 5.3, 0.45, { fill: 'FFFFFF', line: C.line, r: 0.06 });
    L.txt(s, [{ text: 'region', options: { color: C.b600, bold: true } }, { text: ' = ' }, { text: 'qualified_option(archetype, requirements)', options: { color: C.t700 } }], 7.33, 2.95, 5.1, 0.45, { fontSize: 11, fontFace: 'Consolas', color: C.ink, valign: 'middle' });
    L.txt(s, 'WHEN CIRCUMSTANCES CHANGE', 0.6, 3.85, 4, 0.22, { fontSize: 9, bold: true, color: C.muted, charSpacing: 2 });
    const T = [['gauge', C.v600, 'Capacity is available somewhere else', 'A qualified region with the required SKUs and quota can take the next deployment.'], ['layers', C.b600, 'A required service is stronger in another region', 'AI models, services, or zone support can favor a different qualified option.'], ['flag', C.w600, 'The regulatory or energy environment changes', 'Placement adapts within the governed geography instead of waiting for a redesign.']];
    T.forEach(([ic, c, t, d], i) => {
      const x = 0.6 + i * 2.72, y = 4.12, w = 2.6, h = 1.65;
      L.box(s, x, y, w, h, { fill: C.wash, r: 0.12 });
      L.badge(s, ic, x + 0.18, y + 0.16, 0.38, c);
      L.txt(s, t, x + 0.18, y + 0.6, w - 0.36, 0.45, { fontSize: 11, fontFace: F.semi, color: C.ink });
      L.txt(s, d, x + 0.18, y + 1.08, w - 0.36, 0.55, { fontSize: 9.5, color: C.text });
    });
    L.line(s, 8.8, 4.95, 9.1, 4.95, { color: C.t600, w: 2 });
    L.box(s, 9.15, 4.12, 3.58, 1.65, { fill: C.t600, r: 0.12 });
    L.txt(s, [{ text: 'More options for where the next workload can go', options: { fontFace: F.semi, fontSize: 13, breakLine: true } }, { text: 'Existing workloads can stay put; new and movable ones use the best qualified option available.', options: { fontSize: 9.5, color: 'D6F0EC' } }], 9.35, 4.12, 3.25, 1.65, { color: 'FFFFFF', valign: 'middle' });
    L.box(s, 0.6, 5.98, 6.0, 0.82, { fill: C.s800, r: 0.12 });
    L.txt(s, [{ text: 'Deliberate where it matters: ', options: { bold: true } }, { text: 'where the major strategic hubs live.' }], 0.85, 5.98, 5.6, 0.82, { fontSize: 12, color: 'FFFFFF', valign: 'middle' });
    L.box(s, 6.73, 5.98, 6.0, 0.82, { fill: C.t50, line: C.t300, r: 0.12 });
    L.txt(s, [{ text: 'Adaptable where it helps: ', options: { bold: true } }, { text: 'which regions individual applications consume.' }], 6.98, 5.98, 5.6, 0.82, { fontSize: 12, color: C.ink, valign: 'middle' });
    L.footer(s, 0, '06 · AGILITY');
    s.addNotes('Talk track: "The important outcome is that region becomes increasingly a deployment parameter rather than a permanent architectural dependency. We still make deliberate choices about where major strategic hubs exist. But we stop assuming that every workload must inherit those same regional choices. That gives us a much better ability to respond when circumstances change. If capacity is available somewhere else, if a required Azure service is stronger in another region, or if the regulatory or energy environment changes, we have more options for where the next workload can go." From the whitepaper: placement is revalidated at decision time for services, SKUs, AI models, regional access, and quota; capacity remains a deployment-time condition. Staying in the current region is always a valid outcome.');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '06 · Agility in practice', 'Four scenarios at a glance', { ec: C.t600, tw: 8, lede: 'From a business or technical driver to a governed regional and workload decision. Illustrative, not customer-specific.', lx: 8.9, lw: 3.83 });
    const S = [
      ['Regulated bank adopts a new in-country region', [['Qualification', 'Qualified for Hybrid-Connected requirements; other workloads remain candidates.'], ['Connectivity', 'Minimal Regional Hub; existing hybrid connectivity reused where it permits.'], ['Placement', 'In-scope workloads relocate selectively; others stay.']], 'Qualify for defined requirements without forcing portfolio-wide relocation.'],
      ['AI team requires a specific model or GPU SKU', [['Qualification', 'Qualified for the AI requirements; conditional where private connectivity is not yet designed.'], ['Connectivity', 'Disconnected Spokes; connected only where dependencies justify it.'], ['Placement', 'Net-new, revalidated at decision time.']], 'Do not add connectivity or platform capabilities before a requirement justifies them.'],
      ['Acquisition brings an estate in another geography', [['Qualification', 'Candidate until dependencies are understood; then qualified.'], ['Connectivity', 'Remote Hub Connected, or Minimal Regional Hub where east-west or independence justify it.'], ['Placement', 'Remain in place; relocate selectively with integration.']], 'Aggregate portfolio dependencies determine the profile.'],
      ['Datacenter exit accelerates migration', [['Qualification', 'Existing target region qualified; additional region a candidate.'], ['Connectivity', 'No new profile: the existing strategic hub is reused.'], ['Placement', 'Most workloads land in the existing qualified region.']], 'Staying put is valid; a new region can stay an option, not a project.'],
    ];
    S.forEach(([t, rows, tk], i) => {
      const x = 0.6 + (i % 2) * 6.12, y = 1.65 + Math.floor(i / 2) * 2.62, w = 6.0, h = 2.48;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.num(s, i + 1, x + 0.18, y + 0.16, 0.34, C.t600, 'FFFFFF', 12);
      L.txt(s, t, x + 0.62, y + 0.1, w - 0.8, 0.45, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      rows.forEach(([k, v], j) => {
        L.txt(s, k.toUpperCase(), x + 0.2, y + 0.66 + j * 0.44, 1.3, 0.4, { fontSize: 8, bold: true, color: C.b600, charSpacing: 1, valign: 'middle' });
        L.txt(s, v, x + 1.5, y + 0.66 + j * 0.44, w - 1.7, 0.4, { fontSize: 10, color: C.ink, valign: 'middle' });
      });
      L.box(s, x, y + h - 0.5, w, 0.5, { fill: C.t50, r: 0.12 }); L.box(s, x, y + h - 0.5, w, 0.2, { fill: C.t50, r: 0 });
      L.icon(s, 'flag', x + 0.2, y + h - 0.37, 0.22, 't');
      L.txt(s, tk, x + 0.52, y + h - 0.5, w - 0.7, 0.5, { fontSize: 10, color: C.ink, valign: 'middle' });
    });
    L.footer(s, 0, '06 · AGILITY IN PRACTICE');
    s.addNotes('Use one of these scenarios to make the agility point concrete for the audience. The full deck and whitepaper walk each scenario from driver through framework, qualification, archetype, connectivity profile, and placement.');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '07 · The strategic benefit', 'Architect so that perfect prediction is unnecessary', { tw: 9 });
    L.txt(s, [{ text: 'No one can predict which European regions will offer the best combination of capacity, service availability, energy supply, and regulatory environment three to five years from now. ', options: { fontFace: F.light } }, { text: 'Architect so that it does not need to be predicted perfectly.', options: { fontFace: F.semi, color: C.ink } }], 0.6, 1.6, 5.4, 1.9, { fontSize: 16, color: C.s600 });
    L.txt(s, 'That means separating what must stay consistent — governance, security, compliance, and the operating model — from what should stay adaptable: which regions individual applications consume.', 0.6, 3.55, 5.4, 0.9, { fontSize: 11.5, color: C.text });
    L.box(s, 0.6, 4.5, 5.4, 0.95, { fill: C.w50, r: 0.1 });
    L.txt(s, [{ text: 'For regulated organizations, ', options: { bold: true, color: C.w600 } }, { text: 'application-level, region-agnostic placement is a way to de-risk cloud growth if future power restrictions affect hyperscale expansion in a particular country.' }], 0.8, 4.5, 5.05, 0.95, { fontSize: 10.5, color: C.ink, valign: 'middle' });
    const T = [['app', 't', C.t50, C.t300, C.t700, 'Lightweight Workload Landing Zone archetypes', 'Applications select the lightest-weight pattern that meets their requirements.', 0.6], ['route', 'b', C.b50, C.b200, C.b700, 'Geographically resilient connectivity', 'Diverse peering locations into the Azure backbone, planned for the geography.', 0.4], ['hub', 'b', 'FFFFFF', C.b300, C.b800, 'A small number of strategic geographic hubs', 'The full footprint lives where it is justified, not in every region.', 0.2], ['shield', 'w', C.s800, null, 'FFFFFF', 'One governed operating model', 'Landing-zone guardrails and operating standards stay stable across the estate.', 0]];
    T.forEach(([ic, c, bg, ln, tc, t, d, inset], i) => {
      const y = 1.6 + i * 0.97, x = 6.4 + inset, w = 12.73 - x - inset;
      L.box(s, x, y, w, 0.85, { fill: bg, line: ln || undefined, r: 0.12 });
      L.icon(s, ic, x + 0.22, y + 0.25, 0.34, c);
      L.txt(s, [{ text: t, options: { fontFace: F.semi, fontSize: 12, color: tc, breakLine: true } }, { text: d, options: { fontSize: 9.5, color: i === 3 ? 'C9D4E2' : C.text } }], x + 0.75, y, w - 0.9, 0.85, { valign: 'middle' });
    });
    L.txt(s, 'Together: an architecture that can evolve as Europe evolves.', 6.4, 5.5, 6.33, 0.3, { fontSize: 10.5, italic: true, color: C.muted, align: 'right' });
    s.addImage({ path: IMG('band.jpg'), x: 0.6, y: 5.9, w: 12.13, h: 0.95, sizing: { type: 'cover', w: 12.13, h: 0.95 } });
    L.txt(s, [{ text: 'The goal is not to select the perfect two regions. ', options: { fontFace: F.light } }, { text: 'It is to make additional regions significantly easier to adopt when business and workload requirements justify them.', options: { fontFace: F.semi } }], 0.95, 5.9, 11.4, 0.95, { fontSize: 16, color: 'FFFFFF', valign: 'middle' });
    L.footer(s, 0, '07 · STRATEGIC BENEFIT');
    s.addNotes('Talk track — finish with this: "We should not try to predict perfectly which European regions will have the best combination of capacity, service availability, energy supply and regulatory environment three-to-five years from now. The external environment is inherently dynamic. Instead, we should architect so that we do not need to predict it perfectly. That means separating the things that must remain consistent, our governance, security, compliance and operating model, from the things that should remain adaptable, namely which regions individual applications consume. With a small number of strategic geographic hubs, geographically resilient connectivity, and a set of lightweight Workload Landing Zone archetypes, we create an architecture that can evolve as Europe evolves." For regulated customers, reinforce that this application-level, region-agnostic approach provides a way to de-risk cloud growth if future power restrictions affect the industry’s ability to continue hyperscale expansion in a particular country.');
  }

  {
    const s = pres.addSlide();
    s.background = { path: IMG('bg_full.jpg') };
    L.logo(s, 0.6, 0.6, 0.14, 'FFFFFF', 17);
    L.txt(s, 'Executive briefing', 10.3, 0.57, 2.43, 0.35, { fontSize: 13, fontFace: F.semi, color: 'FFFFFF', align: 'right' });
    L.txt(s, [{ text: 'The adaptable ', options: { fontFace: F.light } }, { text: 'multi-region', options: { fontFace: F.semi } }, { text: ' Azure platform', options: { fontFace: F.light } }], 0.6, 2.6, 7.2, 1.3, { fontSize: 34, color: 'FFFFFF' });
    L.txt(s, 'Read the full Multi-Region Platform Whitepaper for the complete framework, decision tools, and Microsoft Learn references.', 0.6, 3.95, 6.5, 0.8, { fontSize: 14, color: 'DDEBF9' });
    L.txt(s, '©2026 Microsoft Corporation. All rights reserved. This document is provided “as-is.” Information and views expressed in this document, including URL and other Internet website references, may change without notice. You bear the risk of using it. This document does not provide you with any legal rights to any intellectual property in any Microsoft product. You may copy and use this document for your internal, reference purposes.', 0.6, 6.55, 12.13, 0.55, { fontSize: 8, color: 'E3EEF9' });
  }
};
