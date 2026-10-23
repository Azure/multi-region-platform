// Executive briefing deck: one slide per page of the executive brief (cover = page 1 … closing = page 14).
// Type: body text 11–12 pt, labels 9 pt or more. Sections come from sections.js; pictures go through L.image / L.icon.
const { C, F, IMG } = require('../lib');

module.exports = (pres, L) => {
  const D = L.data;
  // The four connectivity profiles as the executive brief spells them
  const PROF = ['Disconnected spokes', 'Remote-hub-connected spokes', 'Minimal regional hub', 'Full regional hub'];
  const chipW = (t, size = 10) => t.length * (size * 0.0078) + 0.28;
  const cap = (s, t, x, y, o = {}) => L.txt(s, t.toUpperCase(), x, y, o.w || 4, 0.22, Object.assign({ fontSize: 9.5, bold: true, color: C.muted, charSpacing: 2 }, o));
  const header = L.header;
  L.header = (s, kicker, title, o = {}) => header(s, kicker, title, Object.assign({}, o, { ec: C.t600 }));

  // ───────────────────────── 1 · Cover (brief page 1)
  {
    const s = L.slide('front', { bare: true });
    L.image(s, IMG('cover_panel.png', L.tone), { x: 6.733, y: 0, w: 6.6, h: 7.5 }, 'Illustration: two tall strategic hubs, a minimal hub, workload spokes and an empty candidate plot standing on one shared foundation');
    L.logo(s, 0.6, 0.55, 0.14, C.muted, 17);
    L.txt(s, 'Executive briefing', 10.3, 0.52, 2.43, 0.35, { fontSize: 13, fontFace: F.semi, color: 'FFFFFF', align: 'right' });
    let x = 0.6; x += L.chip(s, 'AZURE ARCHITECTURE', x, 1.6, { size: 9.5, w: chipW('AZURE ARCHITECTURE', 9.5) }) + 0.12;
    L.chip(s, 'EXECUTIVE BRIEFING', x, 1.6, { size: 9.5, w: chipW('EXECUTIVE BRIEFING', 9.5), fill: C.t100, color: C.t700 });
    L.title(s, [
      { text: 'The adaptable', options: { fontFace: F.light, color: C.ink, breakLine: true } },
      { text: 'multi-region', options: { fontFace: F.semi, color: C.b600, breakLine: true } },
      { text: 'Azure platform', options: { fontFace: F.light, color: C.ink } },
    ], 0.6, 2.05, 5.9, 2.15, { fontSize: 46, lineSpacingMultiple: 0.92 });
    L.txt(s, 'A leadership summary: how to make additional Azure regions governed options — adopted when business and workload requirements justify them, without duplicating the platform in every region.', 0.6, 4.5, 5.8, 1.1, { fontSize: 14, color: C.s600, lineSpacingMultiple: 1.08 });
    cap(s, 'Three planning constructs', 0.6, 5.72, { color: C.faint, charSpacing: 3 });
    [C.v600, C.t600, C.b600].forEach((c, i) => {
      L.box(s, 0.6, 6.12 + i * 0.3, 0.26, 0.06, { fill: c, r: 0.03 });
      L.txt(s, D.constructs[i], 0.98, 6.03 + i * 0.3, 5.2, 0.25, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    L.txt(s, D.edition, 0.6, 7.0, 3, 0.25, { fontSize: 11, color: C.muted });
    s.addNotes('Executive briefing based on the Multi-Region Platform Whitepaper. Sequence follows the executive talk track: reframe the objective, move from a region mindset to a geography mindset, decouple connectivity, tier the regional footprint, classify workloads by archetype, explain the agility, and land on the strategic benefit.');
  }

  // ───────────────────────── 2 · Executive summary (brief page 2)
  {
    const s = L.slide('summary');
    L.header(s, '', 'Evolve landing zones from fixed regional footprints into a governed operating model', {
      tw: 7.9, ts: 24, th: 1.25, lx: 8.8, lw: 3.93, lh: 1.6,
      lede: [{ text: 'Adding an Azure region shouldn’t mean starting another landing-zone project. ', options: { bold: true, color: C.ink } }, { text: 'In a governed geographic operating model — for example, across Europe — ' }, { text: 'regional placement becomes an adaptable, application-level decision', options: { bold: true, color: C.ink } }, { text: ' instead of a permanent architectural dependency.' }],
    });
    cap(s, 'Five moves', 0.6, 2.0);
    const K = [['shield', C.s800, 'Standardize governance', 'Policies, security controls, operational rigor, and compliance are the constants across the geography.'], ['route', C.b600, 'Decouple connectivity', 'Plan resilient hybrid connectivity to Azure geographically, not again for every region.'], ['hub', C.v600, 'Tier the regional footprint', 'A small number of strategic hubs carry the full stack; other regions use more efficient patterns.'], ['app', C.t600, 'Classify workloads by archetype', 'Four Workload Landing Zone archetypes describe what each workload needs from the platform.'], ['pin', C.b700, 'Preserve regional optionality', 'Qualified regions stay available for the next workload when capacity, services, or regulation change.']];
    K.forEach(([ic, c, t, d], i) => {
      const x = 0.6 + i * 2.46, y = 2.3, w = 2.33, h = 2.5;
      L.box(s, x, y, w, h, { fill: i === 3 ? C.t50 : C.wash, r: 0.12 });
      L.txt(s, String(i + 1).padStart(2, '0'), x + 0.2, y + 0.12, 0.8, 0.45, { fontSize: 22, fontFace: F.light, color: i === 3 ? C.t600 : C.b600 });
      L.badge(s, ic, x + w - 0.62, y + 0.16, 0.42, c);
      L.txt(s, t, x + 0.2, y + 0.68, w - 0.4, 0.55, { fontSize: 13, fontFace: F.semi, color: C.ink });
      L.txt(s, d, x + 0.2, y + 1.25, w - 0.4, 1.2, { fontSize: 12, color: C.text });
    });
    L.box(s, 0.6, 4.95, 7.4, 0.8, { fill: C.b50, r: 0.12 });
    L.txt(s, [{ text: 'Adaptability becomes a ' }, { text: 'deliberate architectural property', options: { bold: true } }, { text: ' rather than a reaction to the next country-level power, regulatory, or supply-chain constraint.' }], 0.8, 4.95, 7.0, 0.8, { fontSize: 12.5, color: C.ink, valign: 'middle' });
    L.box(s, 8.2, 4.95, 0.05, 0.8, { fill: C.b600, r: 0 });
    L.txt(s, 'Standardize the operating model, not necessarily the regional footprint.', 8.45, 4.95, 4.28, 0.8, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle' });
    L.image(s, IMG('band.jpg', L.tone), { x: 0.6, y: 5.95, w: 12.13, h: 0.9 }, 'Decorative gradient band', { sizing: { type: 'cover', w: 12.13, h: 0.9 } });
    cap(s, 'The goal', 0.95, 6.28, { color: 'D6F0EC', w: 1.1 });
    L.txt(s, [{ text: 'The goal is not to select the perfect two regions. ', options: { fontFace: F.light } }, { text: 'It is to make additional regions significantly easier to adopt when business and workload requirements justify them.', options: { fontFace: F.semi } }], 2.2, 5.95, 10.3, 0.9, { fontSize: 16, color: 'FFFFFF', valign: 'middle' });
    s.addNotes('Executive one-liner: evolve Landing Zones from fixed regional infrastructure footprints into a governed European operating model where regional placement is an adaptable application-level decision. Key points: standardize governance, decouple connectivity, tier the regional footprint, classify workloads by archetype, and preserve regional optionality. This positions adaptability as a deliberate architectural property rather than as a reaction to the next country-level power, regulatory, or supply-chain constraint.');
  }

  // ───────────────────────── 3 · 01 Reframe the objective (brief page 3)
  {
    const s = L.slide('x1');
    L.header(s, '', 'An operating model that keeps working as the environment changes', { tw: 8.2, lede: 'The architecture should not depend on the regions we pick today staying the right answer.', lx: 8.9, lw: 3.83 });
    const y0 = 1.75;
    // left: a fixed regional pair
    L.box(s, 0.6, y0, 4.6, 4.35, { fill: C.wash, r: 0.14 });
    L.txt(s, 'A fixed regional pair', 0.85, y0 + 0.14, 2.4, 0.3, { fontSize: 13, fontFace: F.semi, color: C.ink });
    L.txt(s, 'TRADITIONAL MODEL', 3.2, y0 + 0.18, 1.78, 0.25, { fontSize: 9, bold: true, color: C.faint, align: 'right', charSpacing: 1.5 });
    [['Primary region', 0.85], ['DR region', 3.1]].forEach(([n, x]) => {
      L.box(s, x, y0 + 0.55, 1.85, 1.8, { fill: 'FFFFFF', line: C.b300, dash: 'dash', r: 0.1 });
      L.icon(s, 'pin', x + 0.12, y0 + 0.65, 0.18, 'b');
      L.txt(s, n, x + 0.36, y0 + 0.62, 1.4, 0.24, { fontSize: 10.5, bold: true, color: C.b700 });
      [['Workloads', C.t600, 'FFFFFF'], ['Shared services', C.b100, C.b800], ['Hub & connectivity', C.b600, 'FFFFFF']].forEach(([t, f, c], j) => {
        L.box(s, x + 0.12, y0 + 0.95 + j * 0.43, 1.61, 0.36, { fill: f, r: 0.06 });
        L.txt(s, t, x + 0.12, y0 + 0.95 + j * 0.43, 1.61, 0.36, { fontSize: 10, bold: true, color: c, align: 'center', valign: 'middle' });
      });
    });
    L.line(s, 2.72, y0 + 1.45, 3.08, y0 + 1.45, { color: C.faint, both: true, w: 1 });
    L.txt(s, 'MIRRORED INFRASTRUCTURE', 0.85, y0 + 2.38, 3.9, 0.2, { fontSize: 9, bold: true, color: C.muted, align: 'center', charSpacing: 1 });
    L.txt(s, 'EVOLVING REGIONAL CONDITIONS', 0.85, y0 + 2.7, 3.9, 0.22, { fontSize: 9.5, bold: true, color: C.w600, charSpacing: 2 });
    let cx = 0.85;
    ['Regulatory change', 'Power and energy supply'].forEach(t => { const w = chipW(t, 10.5); L.chip(s, t, cx, y0 + 2.97, { fill: C.w100, color: C.w600, size: 10.5, w }); cx += w + 0.08; });
    cx = 0.85;
    ['Service & AI availability', 'Business expansion'].forEach(t => { const w = chipW(t, 10.5); L.chip(s, t, cx, y0 + 3.3, { fill: C.w100, color: C.w600, size: 10.5, w }); cx += w + 0.08; });
    L.txt(s, 'Works while demand and placement remain predictable; becomes less adaptable as conditions evolve.', 0.85, y0 + 3.62, 4.1, 0.6, { fontSize: 12, color: C.muted });
    // arrow
    L.line(s, 5.3, y0 + 1.7, 5.9, y0 + 1.7, { color: C.b600, w: 2 });
    L.txt(s, 'Extend,\nnot\nreplicate', 5.2, y0 + 1.82, 0.8, 0.6, { fontSize: 10, bold: true, color: C.b700, align: 'center' });
    // right: adaptable platform
    L.box(s, 6.0, y0, 6.73, 4.35, { fill: C.b50, r: 0.14 });
    L.txt(s, 'An adaptable multi-region platform', 6.2, y0 + 0.14, 3.6, 0.3, { fontSize: 13, fontFace: F.semi, color: C.ink });
    L.txt(s, 'REGIONS AS QUALIFIED OPTIONS', 9.75, y0 + 0.18, 2.78, 0.25, { fontSize: 9, bold: true, color: C.b600, align: 'right', charSpacing: 1.5 });
    const regs = [
      ['Region A', 1.95, [['Workloads', C.t600, 'FFFFFF'], ['Shared', C.b100, C.b800], ['Full hub', C.b600, 'FFFFFF']], 'Strategic hub'],
      ['Region B', 1.95, [['Workloads', C.t600, 'FFFFFF'], ['Shared', C.b100, C.b800], ['Full hub', C.b600, 'FFFFFF']], 'Strategic hub'],
      ['Region C', 1.55, [['Workloads', C.t600, 'FFFFFF'], ['Minimal hub', 'FFFFFF', C.b700, C.b300]], 'Minimal hub'],
      ['Region D', 1.2, [['Spokes', C.t600, 'FFFFFF']], 'Remote hub', 'via hub'],
      ['Region E', 0.98, [['Disconnected spokes', C.t100, C.t700]], 'Disconnected'],
      ['Region F', 0.8, [], 'Not enabled', 'Candidate'],
    ];
    const base = y0 + 3.0, rw = 1.04, gap = 0.04;
    regs.forEach(([n, h, blocks, lab, extra], i) => {
      const x = 6.2 + i * (rw + gap), y = base - h;
      L.box(s, x, y, rw, h, { fill: 'FFFFFF', line: i === 5 ? C.b500 : C.b300, dash: 'dash', r: 0.08 });
      L.icon(s, 'pin', x + 0.06, y + 0.08, 0.15, 'b');
      L.txt(s, n, x + 0.24, y + 0.05, 0.74, 0.22, { fontSize: 9.5, bold: true, color: C.b700, valign: 'middle' });
      blocks.slice().reverse().forEach(([t, f, c, ln], j) => {
        const by = base - 0.1 - (j + 1) * 0.38 + 0.06;
        L.box(s, x + 0.03, by, rw - 0.06, 0.32, { fill: f, line: ln, r: 0.05 });
        L.txt(s, t, x + 0.03, by, rw - 0.06, 0.32, { fontSize: 9.5, bold: true, color: c, align: 'center', valign: 'middle' });
      });
      if (extra) L.txt(s, extra, x, base - (blocks.length ? 0.1 + blocks.length * 0.38 + 0.26 : 0.46), rw, 0.22, { fontSize: 9.5, bold: true, color: C.b600, align: 'center', valign: 'middle' });
      L.txt(s, lab, x - 0.04, base + 0.07, rw + 0.08, 0.22, { fontSize: 10, color: C.muted, align: 'center' });
    });
    L.box(s, 6.2, y0 + 3.45, 6.33, 0.7, { fill: C.s800, r: 0.08 });
    L.txt(s, 'One consistent, governed Azure landing-zone foundation', 6.4, y0 + 3.49, 6.0, 0.3, { fontSize: 12, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    L.txt(s, 'Identity · Connectivity · Security · Management · Application delivery', 6.4, y0 + 3.79, 6.0, 0.3, { fontSize: 10.5, color: 'C9D4E2', valign: 'middle' });
    L.caption(s, 'Figure 1', 'From a fixed regional pair to governed regional options. The platform extends one governed foundation and gives each region only the capability its workloads require. Regional capability is a spectrum, not a copy.', 0.6, 6.3, 12.1);
    s.addNotes('Talk track — reframe the objective: "I think the opportunity is to evolve how we think about Landing Zones. Traditionally, we have tended to think about an Azure Landing Zone as something we establish in a particular region, with a fairly complete set of networking, security, management and shared services around it. That works well when the regions we want to use are relatively static. But the challenge we are trying to solve now is different. We want an operating model that can continue to work even as the external environment around us changes." Connect this need for flexibility to potential future regulatory and power constraints across European countries, while noting that Microsoft continues investing and growing capacity across Europe. For regulated customers, this begins the discussion on how to de-risk continued growth in an ever-changing, industry-wide dynamic.');
  }

  // ───────────────────────── 4 · 02 Geography mindset (brief page 4)
  {
    const s = L.slide('x2');
    L.header(s, '', 'Define the landing zone by geography, not by region', { tw: 8.5, ts: 23, lede: 'Broaden the architectural boundary. The individual regions underneath become adaptable deployment locations.', lx: 8.9, lw: 3.83 });
    L.box(s, 0.6, 1.7, 12.13, 3.75, { fill: C.b50, line: C.b200, r: 0.16 });
    L.txt(s, 'Geographic landing zone · for example, Europe', 0.85, 1.82, 7, 0.35, { fontSize: 14, fontFace: F.semi, color: C.b800 });
    L.txt(s, 'ONE GOVERNED OPERATING MODEL', 8.5, 1.88, 4.0, 0.3, { fontSize: 9.5, bold: true, color: C.b600, charSpacing: 2, align: 'right' });
    L.box(s, 0.85, 2.3, 11.63, 0.8, { fill: C.s800, r: 0.1 });
    L.txt(s, 'CONSTANTS ACROSS\nTHE GEOGRAPHY', 1.05, 2.3, 2.0, 0.8, { fontSize: 9.5, bold: true, color: 'A9C7E8', charSpacing: 1.5, valign: 'middle' });
    [['doc', 'Policies'], ['shield', 'Security controls'], ['gear', 'Operational rigor'], ['lock', 'Compliance requirements']].forEach(([ic, t], i) => {
      const x = 3.2 + i * 2.35;
      L.icon(s, ic, x, 2.55, 0.3, 'w');
      L.txt(s, t, x + 0.4, 2.3, 1.9, 0.8, { fontSize: 12, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    });
    const R = [['Region A', 'Strategic hub', 'Full networking, security, management, and shared services', 'hub'], ['Region B', 'Strategic hub', 'Full networking, security, management, and shared services', 'hub'], ['Region C', 'Qualified', 'Minimal regional hub for a portfolio', 'q'], ['Region D', 'Qualified', 'Spokes connected to a strategic hub', 'q'], ['Region E', 'Qualified', 'Self-contained AI workloads', 'q'], ['Region F', 'Candidate', 'Assessed; not yet enabled', 'c']];
    R.forEach(([r, tag, d, k], i) => {
      const x = 0.85 + i * 1.955, y = 3.28, w = 1.83, h = 1.78;
      const hub = k === 'hub';
      L.box(s, x, y, w, h, { fill: hub ? (i ? C.b700 : C.b600) : k === 'c' ? C.b50 : 'FFFFFF', line: hub ? undefined : C.b300, dash: 'dash', r: 0.1 });
      L.icon(s, 'pin', x + 0.12, y + 0.14, 0.17, hub ? 'w' : 'b');
      L.txt(s, r, x + 0.34, y + 0.08, 1.4, 0.28, { fontSize: 11, bold: true, color: hub ? 'FFFFFF' : C.b700, valign: 'middle' });
      L.chip(s, tag, x + 0.12, y + 0.44, { fill: hub ? '3F86C9' : k === 'c' ? 'FFFFFF' : C.t100, color: hub ? 'FFFFFF' : k === 'c' ? C.b700 : C.t700, size: 9.5, w: chipW(tag, 9.5), line: k === 'c' ? C.b500 : undefined, dash: k === 'c' ? 'dash' : undefined });
      L.txt(s, d, x + 0.12, y + 0.84, w - 0.24, 0.82, { fontSize: 12, color: hub ? 'DDEBF9' : C.muted, valign: 'bottom' });
    });
    L.txt(s, 'CONSISTENT: GOVERNANCE, SECURITY, COMPLIANCE, OPERATIONS', 0.85, 5.16, 6, 0.25, { fontSize: 9.5, bold: true, color: C.s800, charSpacing: 1.5 });
    L.txt(s, 'ADAPTABLE: WHICH REGIONS EACH APPLICATION CONSUMES', 6.5, 5.16, 5.98, 0.25, { fontSize: 9.5, bold: true, color: C.t600, charSpacing: 1.5, align: 'right' });
    L.caption(s, 'Figure 2', 'A geographic landing zone. The operating model is standardized across the geography; regions underneath are adaptable deployment locations. Region names and roles are illustrative.', 0.6, 5.58, 12.1);
    L.box(s, 0.6, 6.05, 12.13, 0.85, { fill: C.b700, r: 0.14 });
    L.icon(s, 'layers', 0.9, 6.28, 0.4, 'w');
    L.txt(s, [{ text: 'Standardize the operating model, ', options: { fontFace: F.semi } }, { text: 'not necessarily the regional footprint.', options: { fontFace: F.light } }], 1.5, 6.05, 11, 0.85, { fontSize: 22, color: 'FFFFFF', valign: 'middle' });
    s.addNotes('Talk track: "Rather than defining our cloud architecture around a small number of permanently designated Azure regions, we can broaden the architectural boundary. For a European estate, we can think about the overarching Landing Zone in geographic terms. At that level, the things we want to make consistent are the policies, security controls, operational rigor and compliance requirements. Those are the constants. The individual Azure regions underneath that model become more adaptable deployment locations." Customers are broadening Landing Zones into a larger geography, such as the European data boundary, governed by common security, operational and compliance policies across multiple regions. "Standardize the operating model, not necessarily the regional footprint."');
  }

  // ───────────────────────── 5 · 03 Decouple connectivity (brief page 5)
  {
    const s = L.slide('x3');
    L.header(s, '', 'Plan hybrid connectivity once, for the geography', { tw: 8.5, ts: 23, lede: [{ text: 'Enabling an additional Azure region does not by itself require another ExpressRoute circuit.', options: { bold: true, color: C.ink } }], lx: 8.9, lw: 3.83 });
    const top = 1.75, hh = 3.2;
    // on-premises
    L.box(s, 0.6, top, 2.0, hh, { fill: C.wash, r: 0.12 });
    L.txt(s, 'ON-PREMISES', 0.78, top + 0.1, 1.7, 0.22, { fontSize: 9.5, bold: true, color: C.s600, charSpacing: 2 });
    [[top + 0.45, 'Datacenter 1'], [top + 1.95, 'Datacenter 2']].forEach(([y, t]) => {
      L.box(s, 0.75, y, 1.7, 1.0, { fill: C.s800, r: 0.1 });
      L.icon(s, 'building', 0.88, y + 0.12, 0.26, 'w');
      L.txt(s, [{ text: t, options: { bold: true, breakLine: true } }, { text: 'and connected sites', options: { fontSize: 10, color: 'C9D4E2' } }], 0.88, y + 0.42, 1.5, 0.52, { fontSize: 11.5, color: 'FFFFFF' });
    });
    // peering locations
    [[top + 0.45, 'Peering location 1'], [top + 1.95, 'Peering location 2']].forEach(([y, t]) => {
      L.box(s, 3.1, y, 3.0, 1.0, { fill: 'FFFFFF', line: C.b600, lw: 1.5, r: 0.5 });
      L.txt(s, [{ text: t, options: { bold: true, color: C.b700, fontSize: 12, breakLine: true } }, { text: 'ExpressRoute or ExpressRoute Direct', options: { fontSize: 10, color: C.muted } }], 3.1, y, 3.0, 1.0, { align: 'center', valign: 'middle' });
    });
    const m1 = top + 0.95, m2 = top + 2.45;
    L.line(s, 2.45, m1 - 0.1, 3.1, m1 - 0.05, { color: C.s600, arrow: false }); L.line(s, 2.45, m1 + 0.15, 3.1, m2 - 0.05, { color: C.s600, arrow: false });
    L.line(s, 2.45, m2 - 0.1, 3.1, m1 + 0.1, { color: C.s600, arrow: false }); L.line(s, 2.45, m2 + 0.15, 3.1, m2 + 0.05, { color: C.s600, arrow: false });
    L.txt(s, 'Redundant circuits · diverse paths', 3.1, top + 3.0, 3.0, 0.22, { fontSize: 10, bold: true, color: C.s600, align: 'center' });
    // backbone
    L.line(s, 6.1, m1, 6.55, m1, { color: C.b600, w: 2.5, arrow: false }); L.line(s, 6.1, m2, 6.55, m2, { color: C.b600, w: 2.5, arrow: false });
    L.box(s, 6.55, top, 0.62, hh, { fill: C.b600, r: 0.12 });
    L.txt(s, 'Azure backbone', 6.55, top, 0.62, hh, { fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', vert: 'vert270' });
    L.line(s, 7.17, top + 1.6, 7.55, top + 1.6, { color: C.b600, w: 2.5 });
    // geography
    L.box(s, 7.6, top, 5.13, hh, { fill: C.b50, line: C.b300, dash: 'dash', r: 0.14 });
    L.txt(s, 'GEOGRAPHY · FOR EXAMPLE, EUROPE', 7.8, top + 0.1, 4.5, 0.22, { fontSize: 9.5, bold: true, color: C.b700, charSpacing: 2 });
    const G = [['Region A', 'Strategic hub · gateways', C.b600, 'FFFFFF', 'DDEBF9'], ['Region B', 'Strategic hub · gateways', C.b700, 'FFFFFF', 'DDEBF9'], ['Region C', 'Minimal hub · reuses existing circuits', 'FFFFFF', C.b700, C.muted], ['Region D', 'Spokes reach on-premises via a hub', 'FFFFFF', C.b700, C.muted], ['Region E', 'Self-contained · no hybrid path', 'FFFFFF', C.t700, C.muted], ['Region F', 'Candidate · no new circuit assumed', C.b50, C.b700, C.muted]];
    G.forEach(([r, d, f, c1, c2], i) => {
      const x = 7.8 + (i % 2) * 2.42, y = top + 0.45 + Math.floor(i / 2) * 0.9, w = 2.32, h = 0.82;
      L.box(s, x, y, w, h, { fill: f, line: f === 'FFFFFF' ? (i === 4 ? C.t300 : C.b300) : i === 5 ? C.b500 : undefined, dash: i === 5 ? 'dash' : 'solid', r: 0.1 });
      L.icon(s, 'pin', x + 0.1, y + 0.1, 0.16, c1 === 'FFFFFF' ? 'w' : i === 4 ? 't' : 'b');
      L.txt(s, [{ text: r, options: { bold: true, color: c1, fontSize: 11, breakLine: true } }, { text: d, options: { fontSize: 10, color: c2 } }], x + 0.32, y + 0.04, w - 0.38, h - 0.08, { valign: 'middle' });
    });
    L.caption(s, 'Figure 3', 'Geographic hybrid connectivity. Reachability depends on circuit type — for example, Standard circuits reach regions in the same geopolitical region, Premium extends globally — so validate it per design. Locations and roles are illustrative.', 0.6, 5.05, 12.1);
    const T = [['route', C.b600, 'Route diversity', 'Redundant circuits across separate peering locations remove single points of failure for the geography.'], ['network', C.s800, 'Decoupled from each region', 'Hybrid connectivity, hub placement, and application connectivity are separate decisions.'], ['gauge', C.t600, 'Sustainable economics', 'A complete footprint in every region is expensive and hard to sustain; reuse what meets the requirements.']];
    T.forEach(([ic, c, t, d], i) => {
      const x = 0.6 + i * 4.1, y = 5.6, w = 3.93, h = 1.25;
      L.box(s, x, y, w, h, { fill: C.wash, r: 0.1 });
      L.badge(s, ic, x + 0.15, y + 0.15, 0.4, c);
      L.txt(s, t, x + 0.68, y + 0.12, w - 0.8, 0.3, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.68, y + 0.46, w - 0.8, 0.75, { fontSize: 12, color: C.text });
    });
    s.addNotes('Talk track: "The next architectural shift is connectivity. Instead of asking, how do I build the full networking stack again every time I enter another Azure region, we can think about connectivity strategically across Europe. We establish redundant connectivity into the Azure backbone through strategically located ExpressRoute or ExpressRoute Direct peering locations. That gives us route diversity and lets us think about connectivity geographically rather than designing it independently for every region." Describe strategically distributed peering locations as a way of providing route diversity and connectivity to Azure regions while decoupling ExpressRoute planning from individual regions. This is important economically as well as architecturally. From the whitepaper: add circuits, peering locations, gateways, or paths only where reachability, diversity, failure-domain isolation, latency, bandwidth, routing, or resiliency requirements justify them.');
  }

  // ───────────────────────── 6 · 04 Tier the regional footprint: the four profiles (brief page 6)
  {
    const s = L.slide('x4');
    L.header(s, '', 'Not every region needs a full landing zone', { tw: 8, lede: 'A small number of strategic geographic hubs — often two or three regions — carry the full footprint. Other regions use the most efficient pattern that meets their requirements.', lx: 8.6, lw: 4.13 });
    L.line(s, 0.6, 1.88, 12.73, 1.88, { color: C.b500, w: 3 });
    L.txt(s, 'NO DEPENDENCY ON A GEOGRAPHIC HUB', 0.6, 1.97, 5, 0.22, { fontSize: 9.5, bold: true, color: C.t600, charSpacing: 1.5 });
    L.txt(s, 'GREATER LOCAL CAPABILITY AND INDEPENDENCE', 7.2, 1.97, 5.53, 0.22, { fontSize: 9.5, bold: true, color: C.b700, charSpacing: 1.5, align: 'right' });
    const P = [
      [C.t600, 'No private connectivity to an enterprise hub, other Azure regions, or on-premises.', 'No hub, no gateway, no private connectivity. Best for self-contained workloads.'],
      [C.c600, 'Spokes connect privately to an existing strategic hub in another region.', 'Centralized services used; local services not required.'],
      [C.b500, 'Selected local services and connectivity, based on workload requirements.', 'Local shared services with selective connectivity, without a full hub.'],
      [C.b700, 'Comprehensive local capabilities, with connectivity to spokes, on-premises, and other regions.', 'Full local capabilities when required by latency, traffic volume, compliance, or operations.'],
    ];
    P.forEach(([c, d, f], i) => {
      const x = 0.6 + i * 3.08, y = 2.32, w = 2.9, h = 3.95;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.num(s, i + 1, x + 0.18, y + 0.18, 0.38, c, 'FFFFFF', 13);
      L.txt(s, PROF[i], x + 0.66, y + 0.12, w - 0.75, 0.5, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.18, y + 0.7, w - 0.36, 0.75, { fontSize: 12, color: C.muted });
      const ax = x + 0.2, ay = y + 1.5, aw = w - 0.4, mh = 1.55;
      const mini = (w2, label) => { L.box(s, ax, ay, w2, mh, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.1 }); L.txt(s, label || 'New Region', ax + 0.08, ay + 0.03, w2 - 0.16, 0.22, { fontSize: 10.5, bold: true, color: C.b700 }); };
      const spoke = (sx, sy, sw, sh) => { L.box(s, sx, sy, sw, sh, { fill: C.t50, line: C.t300, r: 0.07 }); L.box(s, sx + sw / 2 - 0.1, sy + sh / 2 - 0.1, 0.2, 0.2, { fill: C.t600, r: 0.04 }); };
      if (i === 0) {
        mini(aw);
        spoke(ax + 0.3, ay + 0.38, 0.72, 0.62); spoke(ax + 1.55, ay + 0.38, 0.72, 0.62);
        L.line(s, ax + 1.02, ay + 0.69, ax + 1.55, ay + 0.69, { color: C.t600, dash: 'dash', arrow: false });
        L.txt(s, 'peering', ax + 1.0, ay + 0.44, 0.58, 0.2, { fontSize: 10.5, color: C.t700, align: 'center' });
        L.txt(s, 'Azure platform services', ax, ay + 1.22, aw, 0.22, { fontSize: 10.5, color: C.s700, align: 'center' });
      }
      if (i === 1) {
        mini(1.1);
        spoke(ax + 0.25, ay + 0.34, 0.6, 0.48); spoke(ax + 0.25, ay + 0.91, 0.6, 0.48);
        L.box(s, ax + 1.45, ay, aw - 1.45, mh, { fill: C.b600, r: 0.1 });
        L.txt(s, [{ text: 'Hub region', options: { bold: true, fontSize: 11, breakLine: true } }, { text: 'Strategic hub', options: { fontSize: 10.5, color: 'FFFFFF', breakLine: true } }, { text: 'Hybrid · egress · DNS', options: { fontSize: 10, color: 'DDEBF9' } }], ax + 1.48, ay + 0.08, aw - 1.5, 1.35, { color: 'FFFFFF', align: 'center', valign: 'middle' });
        L.line(s, ax + 1.12, ay + 0.78, ax + 1.43, ay + 0.78, { color: C.b600, both: true });
      }
      if (i === 2) {
        mini(2.0);
        L.box(s, ax + 0.08, ay + 0.28, 1.84, 0.55, { fill: 'FFFFFF', line: C.b500, lw: 1.5, r: 0.07 });
        L.txt(s, [{ text: 'Shared services (selected)', options: { bold: true, breakLine: true } }, { text: 'DNS · Gateway · Monitor', options: { fontSize: 10 } }], ax + 0.08, ay + 0.28, 1.84, 0.55, { fontSize: 10.5, color: C.b700, align: 'center', valign: 'middle' });
        spoke(ax + 0.2, ay + 0.98, 0.72, 0.46); spoke(ax + 1.08, ay + 0.98, 0.72, 0.46);
        L.line(s, ax + 2.0, ay + 0.47, ax + 2.1, ay + 0.47, { color: C.b500, dash: 'dash', arrow: false });
        L.oval(s, ax + 2.1, ay + 0.36, 0.34, { fill: C.b600 }); L.oval(s, ax + 2.21, ay + 0.47, 0.12, { fill: 'FFFFFF' });
        L.txt(s, 'strategic\nhub', ax + 1.98, ay + 0.78, 0.62, 0.46, { fontSize: 10.5, color: C.s700, align: 'center' });
      }
      if (i === 3) {
        mini(aw);
        L.box(s, ax + 0.1, ay + 0.28, aw - 0.2, 0.58, { fill: C.b700, r: 0.08 });
        L.txt(s, [{ text: 'Shared services (comprehensive)', options: { bold: true, color: 'FFFFFF', breakLine: true } }, { text: 'DNS · Gateway · Firewall · Monitor', options: { color: 'DDEBF9' } }], ax + 0.1, ay + 0.28, aw - 0.2, 0.58, { fontSize: 10, align: 'center', valign: 'middle' });
        spoke(ax + 0.35, ay + 0.98, 0.7, 0.46); spoke(ax + 1.45, ay + 0.98, 0.7, 0.46);
      }
    });
    L.caption(s, 'Figure 4', 'The spectrum of regional platform connectivity profiles. Moving right adds local capability and independence — and cost and operational scope. Services shown are examples; each hub includes only what its workloads require. Any profile can be the right long-term target.', 0.6, 6.4, 12.1);
    s.addNotes('Talk track — this is the core architectural pivot: "Once we have that geographic foundation, we do not have to copy and paste the same full Landing Zone into every Azure region. We can maintain a small number of strategic geographic hubs with the full networking, security, management and shared-service footprint, while allowing applications to consume additional regions using lighter-weight patterns appropriate to the workload." Describe customers using two or three regions for full geographic Landing Zone hubs, then evaluating application requirements individually rather than automatically recreating the entire platform footprint everywhere.');
  }

  // ───────────────────────── 7 · 04 Tier the regional footprint: trade-off and estate (brief page 7)
  {
    const s = L.slide('x4');
    L.header(s, '', 'Pay for local capability only where it is justified', { tw: 8.6 });
    L.txt(s, 'Profiles coexist under one governed landing-zone foundation', 0.6, 1.5, 12.13, 0.3, { fontSize: 14, fontFace: F.semi, color: C.ink });
    const X = 0.6, rx = 8.7, rw = 12.73 - rx, hx = 3.65, hw = 2.2, hr = hx + hw;
    // A region or node box: pin + label on the first line, title on the second, sub-label on the third (each line has its own height)
    const reg = (x, y, w, h, lab, t, sub, o = {}) => {
      L.box(s, x, y, w, h, { fill: o.fill || 'FFFFFF', line: o.line === undefined ? C.b300 : o.line, dash: 'dash', r: 0.1 });
      if (lab) {
        L.icon(s, 'pin', x + 0.1, y + 0.06, 0.16, o.ic || 'b');
        L.txt(s, lab, x + 0.32, y + 0.04, w - 0.38, 0.2, { fontSize: 10.5, bold: true, color: o.lc || C.b700, valign: 'middle' });
      }
      const ty = y + (lab ? 0.25 : 0.1);
      L.txt(s, t, x + 0.1, ty, w - 0.16, 0.24, { fontSize: 12, fontFace: F.semi, color: o.tc || C.ink, valign: 'middle' });
      if (sub) L.txt(s, sub, x + 0.1, ty + 0.24, w - 0.16, o.subH || 0.24, { fontSize: 12, color: o.sc || C.muted, valign: 'top' });
    };
    const top = 1.9, pitch = 0.75, bh = 0.72;
    const R = [['Region C', 'Minimal regional hub', 'Own on-premises path; rest from A'], ['Region D', 'Minimal regional hub', 'No on-premises path; rest from A'], ['Region E', 'Remote-hub-connected spokes', 'Services from Region A'], ['Region F', 'Remote-hub-connected spokes', 'Services from Region B'], ['Region G', 'Disconnected spokes', 'No private path to hubs'], ['Region H', 'Candidate — not yet enabled', '']];
    R.forEach(([l, t, sub], i) => reg(rx, top + i * pitch, rw, bh, l, t, sub, i === 4 ? { line: C.t300, lc: C.t700, ic: 't' } : i === 5 ? { line: C.b500, tc: C.b700 } : {}));
    const ay = 2.4, by = 4.15, hh = 1.15;
    reg(X, 3.25, 1.7, 1.15, '', 'On-premises', 'datacenters and user locations', { fill: C.s800, line: null, tc: 'FFFFFF', sc: 'C9D4E2', subH: 0.5 });
    reg(hx, ay, hw, hh, 'Region A', 'Strategic hub', 'Full hub · resilient hybrid connectivity', { fill: C.b600, line: null, ic: 'w', lc: 'DDEBF9', tc: 'FFFFFF', sc: 'DDEBF9', subH: 0.5 });
    reg(hx, by, hw, hh, 'Region B', 'Strategic hub', 'Full hub · resilient hybrid connectivity', { fill: C.b600, line: null, ic: 'w', lc: 'DDEBF9', tc: 'FFFFFF', sc: 'DDEBF9', subH: 0.5 });
    const opx = X + 1.05, mid = i => top + i * pitch + bh / 2, erY = top + 0.28;
    L.path(s, [[opx, 3.25], [opx, 2.95], [hx, 2.95]], { color: C.s600, both: true });
    L.path(s, [[opx, 4.4], [opx, 4.72], [hx, 4.72]], { color: C.s600, both: true });
    L.path(s, [[opx - 0.45, 3.25], [opx - 0.45, erY], [rx, erY]], { color: C.s600, both: true });
    L.tag(s, 'Existing ExpressRoute circuit', 6.25, 1.86, { color: C.s600, w: 2.3 });
    L.txt(s, 'ExpressRoute', opx + 0.1, 2.66, 1.0, 0.24, { fontSize: 10, bold: true, color: C.s600 });
    L.line(s, hx + 1.1, ay + hh, hx + 1.1, by, { color: C.b600, both: true });
    L.path(s, [[rx, mid(0)], [6.2, mid(0)], [6.2, 2.95], [hr, 2.95]], { color: C.b600, dash: 'dash', both: true });
    L.path(s, [[rx, mid(1)], [hr, mid(1)]], { color: C.b600, dash: 'dash', both: true });
    L.path(s, [[rx, mid(2)], [6.2, mid(2)], [6.2, 3.4], [hr, 3.4]], { color: C.b600, both: true });
    L.path(s, [[rx, mid(3)], [hr, mid(3)]], { color: C.b600, both: true });
    L.box(s, X, 5.8, 7.35, 0.62, { fill: C.wash, line: C.line, r: 0.08 });
    L.icon(s, 'shield', X + 0.15, 5.98, 0.26, 's');
    L.txt(s, [{ text: 'Every profile shares one governed foundation: ', options: { bold: true } }, { text: 'governance, security, compliance, automation, and operations' }], X + 0.55, 5.8, 6.6, 0.62, { fontSize: 12, color: C.ink, valign: 'middle' });
    L.caption(s, 'Figure 6', 'An illustrative estate. Names and placements are examples only.', 0.6, 6.58, 12.13);
    s.addNotes('Talk track: this is important economically as well as architecturally, because customers raise concerns that establishing a complete footprint in every additional region becomes expensive and difficult to sustain. The estate shows two strategic hubs with full footprints; other regions use minimal hubs, remote-hub-connected spokes, or disconnected spokes, and a candidate region stays an option until needed.');
  }

  // ───────────────────────── 8 · 05 Workload Landing Zone archetypes (brief page 8)
  {
    const s = L.slide('x5');
    L.header(s, '', 'Four Workload Landing Zone archetypes', { ec: C.t600, tw: 8, lede: [{ text: 'Archetypes describe ' }, { text: 'what applications require', options: { bold: true, color: C.ink } }, { text: '; connectivity profiles describe what the platform provides. The mapping is not one-to-one.' }], lx: 8.9, lw: 3.83 });
    const A = [
      [C.b700, 'Hybrid-connected applications', 'Traditional line-of-business applications with tight dependencies on on-premises environments.', 'Deploy in strategic hub regions, where the complete geographic landing zone exists.', ['Full hub', 'Minimal hub', 'Remote hub'], 1],
      [C.t600, 'Isolated cloud-native or AI applications', 'Largely self-contained; only application endpoints need secure exposure back into the geographic landing zones.', 'Deploy where required services and capacity are available; expose endpoints through Private Endpoints.', ['Disconnected spokes', 'Connected, where justified'], 4],
      [C.t700, 'Connected cloud-native or AI applications', 'Need more than endpoint exposure, but do not justify recreating a complete regional hub.', 'Private connectivity back to the geographic hubs — for example, Global VNet Peering.', ['Remote hub', 'Minimal hub', 'Full hub'], 3],
      [C.v600, 'Interconnected application portfolios', 'A portfolio in another region needing east-west connectivity between applications and north-south connectivity to the rest of the estate.', 'A minimally viable regional hub with only the dependencies and connectivity the portfolio needs.', ['Minimal hub', 'Remote hub', 'Full hub'], 2],
    ];
    A.forEach(([c, t, d, p, chips, flex], i) => {
      const x = 0.6 + i * 3.067, y = 1.7, w = 2.93, h = 3.9;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.num(s, i + 1, x + 0.18, y + 0.2, 0.36, c, 'FFFFFF', 12);
      L.txt(s, t, x + 0.64, y + 0.12, w - 0.75, 0.52, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.18, y + 0.76, w - 0.36, 1.0, { fontSize: 12, color: C.text });
      L.box(s, x + 0.18, y + 1.8, w - 0.36, 0.008, { fill: C.soft, r: 0 });
      L.txt(s, 'TYPICAL PATTERN', x + 0.18, y + 1.88, 2, 0.2, { fontSize: 9, bold: true, color: C.b600, charSpacing: 1.5 });
      L.txt(s, p, x + 0.18, y + 2.1, w - 0.36, 0.8, { fontSize: 12, color: C.ink });
      L.box(s, x, y + 2.95, w, 0.95, { fill: C.wash, r: 0.12 }); L.box(s, x, y + 2.95, w, 0.3, { fill: C.wash, r: 0 });
      let cx = x + 0.15, cy = y + 3.02;
      chips.forEach(ch => { const cw = chipW(ch, 10.5); if (cx + cw > x + w - 0.1) { cx = x + 0.15; cy += 0.3; } const dsh = ch.includes('justified'); L.chip(s, ch, cx, cy, { w: cw, fill: dsh ? 'FFFFFF' : ch.startsWith('Disc') ? C.t100 : C.b100, color: ch.startsWith('Disc') ? C.t700 : C.b700, line: dsh ? C.b500 : undefined, dash: dsh ? 'dash' : undefined, size: 10.5 }); cx += cw + 0.06; });
      for (let k = 0; k < 4; k++) L.box(s, x + w - 0.95 + k * 0.2, y + 3.68, 0.15, 0.13, { fill: k < flex ? C.t600 : C.line, r: 0.02 });
    });
    L.txt(s, 'Regional flexibility', 0.78, 5.34, 1.7, 0.2, { fontSize: 9.5, color: C.muted, valign: 'middle' });
    L.box(s, 0.6, 6.0, 4.1, 0.85, { fill: C.s800, r: 0.12 });
    L.txt(s, [{ text: 'Region-agnostic does not mean ', options: { color: 'FFFFFF' } }, { text: 'region-random.', options: { color: '50E6FF' } }], 0.8, 6.0, 3.8, 0.85, { fontSize: 17, fontFace: F.semi, valign: 'middle' });
    L.box(s, 4.8, 6.0, 7.93, 0.85, { fill: C.b50, r: 0.12 });
    L.txt(s, [{ text: 'Governance moves up a level. ', options: { bold: true, color: C.b700 } }, { text: 'Define a governed operating model and a small number of approved archetypes; each application selects the most efficient pattern that satisfies its connectivity, resiliency, data, security, and service requirements.' }], 5.0, 6.0, 7.55, 0.85, { fontSize: 12, color: C.ink, valign: 'middle' });
    s.addNotes('Talk track — this is where we can make the model very concrete. Archetype 1, hybrid-connected: "For traditional applications with tight dependencies on on-premises environments, we continue deploying them into our strategic regions where the complete geographic Landing Zone exists." Archetype 2, isolated cloud-native or AI: "Some cloud-native or AI applications are largely self-contained. They may only need their application endpoints exposed securely back into the geographic Landing Zones. Those workloads give us much greater regional flexibility." Archetype 3, connected cloud-native or AI: "Some applications need more than endpoint exposure, but they still do not justify recreating a complete regional hub. For those workloads, Global VNet Peering can provide the private connectivity path back to the geographic hubs." Archetype 4, interconnected portfolios: "We introduce a minimally viable regional hub containing only the dependencies and connectivity capabilities that portfolio actually needs." Then: "Region-agnostic does not mean region-random. We are not eliminating architectural governance. We are actually moving governance up a level into policies that are not dependent on particular regions." The chips show the whitepaper’s typical profiles; actual dependencies decide.');
  }

  // ───────────────────────── 9 · An everyday analogy: the city (brief page 9)
  {
    const s = L.slide('city');
    L.header(s, '', 'The platform is the city. Workloads are the people and businesses that live in it.', { tw: 8.5, ts: 23, lede: 'The city builds neighborhoods, services, roads, transit, and laws once. A family settles in one neighborhood; a bank spreads across several. Neither builds a new city.', lx: 9.3, lw: 3.43, lh: 1.3 });
    const pw = 6.55, ph = pw * 1672 / 2144;
    L.image(s, IMG('city-analogy.png', 'blue').replace(/img\/(teal\/)?/, 'img/'), { x: 0.6, y: 1.8, w: pw, h: ph }, 'Isometric city used as an analogy for a multi-region platform. An office campus outside the city connects to Downtown through express toll lanes with two interchanges. Downtown has every service locally. Riverside has a fire station and a clinic. Hillcrest and Midtown have homes only and reach Downtown\'s services by transit. Lakeside is an off-grid island with no roads or transit. A new plot is zoned but not yet built. Numbered pins mark where four families live, and bank badges mark two branches and a backup operations center.');
    const rx = 7.35, rw = 5.38;
    cap(s, 'In the city', rx, 1.8, { w: 1.8, color: C.b600 });
    cap(s, 'In Azure', rx + 2.8, 1.8, { w: 2.4, color: C.b600 });
    const M = [['Neighborhoods', 'Azure regions'], ['Transit', 'Connectivity between regions'], ['Express toll lanes', 'ExpressRoute'], ['Office campus', 'On-premises'], ['Downtown', 'Full Regional Hub'], ['Riverside', 'Minimal Regional Hub'], ['Hillcrest and Midtown', 'Remote Hub Connected'], ['Lakeside', 'Disconnected Spokes'], ['New plot', 'Candidate region']];
    M.forEach(([a, b], i) => {
      const y = 2.08 + i * 0.48;
      L.box(s, rx, y - 0.03, rw, 0.008, { fill: C.soft, r: 0 });
      L.txt(s, a, rx, y, 2.5, 0.4, { fontSize: 12, color: C.text, valign: 'middle' });
      L.txt(s, '→', rx + 2.55, y, 0.18, 0.4, { fontSize: 12, bold: true, color: C.b600, valign: 'middle' });
      L.txt(s, b, rx + 2.8, y, 2.58, 0.4, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    s.addNotes('Think of the platform as a city, and workloads as the people and businesses that live in it. The city builds neighborhoods, services, roads, transit, and laws once. A family settles in one neighborhood; a bank spreads across several. Neither builds a new city. Each neighborhood is a region with a different connectivity profile; the office campus is on-premises. The four households map to the four archetypes: hybrid-connected picks Hillcrest, isolated picks Lakeside, connected picks Midtown, and an interconnected portfolio picks Riverside. The bank is a multi-region workload: branches in Riverside and Midtown serve customers together, and a backup operations center in Hillcrest stands by.');
  }

  // ───────────────────────── 10 · 06 Regional qualification (brief page 10)
  {
    const s = L.slide('x6');
    L.header(s, 'Governance moves up a level', 'Regional qualification', {
      tw: 5.8, lx: 7.1, lw: 5.63, lh: 1.15,
      lede: 'Assess each region for defined workload requirements; record evidence, owners, and revalidation triggers.',
    });
    const CK = D.checks;
    const outcomes = ['Excluded', 'Candidate', 'Conditional', 'Qualified'];
    const decisions = [
      'Confirm the region merits deeper assessment.',
      'Exclude it if any mandatory requirement fails.',
      'Record platform requirements from workload needs.',
      'Qualify candidates with evidence and resolved conditions.',
    ];
    const x0 = 0.6, y = 1.2, h = 3.85, gap = 0.15, w = (12.13 - gap * 3) / 4;
    CK.forEach((ck, i) => {
      const x = x0 + i * (w + gap);
      const tone = i === 2 ? C.t600 : C.b600;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: i === 2 ? C.t300 : C.line, r: 0.12 });
      L.num(s, ck.n, x + 0.18, y + 0.2, 0.4, tone, 'FFFFFF', 13);
      L.txt(s, ck.name, x + 0.18, y + 0.78, w - 0.36, 0.66, { fontSize: 14, fontFace: F.semi, color: C.ink });
      L.txt(s, ck.question, x + 0.18, y + 1.58, w - 0.36, 0.92, { fontSize: 12, fontFace: F.semi, color: tone });
      L.box(s, x + 0.12, y + 2.72, w - 0.24, 0.94, { fill: i === 2 ? C.t50 : C.b50, r: 0.08 });
      L.txt(s, 'DECISION', x + 0.2, y + 2.82, w - 0.4, 0.2, { fontSize: 9, bold: true, color: tone, charSpacing: 1.5 });
      L.txt(s, decisions[i], x + 0.2, y + 3.06, w - 0.4, 0.54, { fontSize: 12, fontFace: F.semi, color: C.ink });
    });
    const oy = 5.35, oh = 0.75, outcomeW = 2.38;
    L.txt(s, 'Possible outcomes', 0.62, oy, 2.12, oh, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
    outcomes.forEach((name, i) => {
      const x = 2.75 + i * outcomeW;
      L.box(s, x, oy, outcomeW, oh, { fill: C.wash, r: 0.08 });
      L.txt(s, name, x + 0.1, oy, outcomeW - 0.2, oh, { fontSize: 13, fontFace: F.semi, color: [C.w600, C.b700, C.a700, C.g600][i], align: 'center', valign: 'middle' });
    });
    s.addNotes('Governance does not disappear in this model — it moves up a level. Regional qualification is how a region enters the governed operating model. Four checks decide which Azure regions should be prepared for which workload requirements: business and geography, data and compliance, workload requirements and dependencies, and regional capability and availability. Check 3 records what the workloads need from the platform: platform enablement (services needed locally, remotely, or centrally), resilient hybrid connectivity (reachability and resilience to Azure), and regional platform connectivity (access to hubs, shared services, and other regions). Each regional option is recorded as excluded, candidate, conditional, or qualified as of the assessment date. The connectivity profile, shared-service placement, and hybrid connectivity are selected next and are not a qualification check. Whether an individual workload uses multiple regions remains a workload-specific design decision.');
  }

  // ───────────────────────── 11 · 07 Why this creates agility (brief page 11)
  {
    const s = L.slide('x7');
    L.header(s, '', 'Region becomes a deployment parameter', { tw: 8, lede: 'Strategic hubs remain deliberate choices. Workloads stop inheriting those choices automatically.', lx: 8.9, lw: 3.83 });
    L.box(s, 0.6, 1.7, 5.8, 1.95, { fill: C.w50, r: 0.12 });
    cap(s, 'Today', 0.85, 1.83, { w: 2, color: C.w600 });
    L.txt(s, 'Region as a permanent architectural dependency', 0.85, 2.07, 5.4, 0.35, { fontSize: 14, fontFace: F.semi, color: C.ink });
    L.txt(s, 'Every workload inherits the same regional pair and its full platform footprint, whether or not its requirements need it.', 0.85, 2.45, 5.4, 0.5, { fontSize: 12, color: C.text });
    L.box(s, 0.85, 3.05, 5.3, 0.45, { fill: 'FFFFFF', line: C.line, r: 0.06 });
    L.txt(s, [{ text: 'region', options: { color: C.b600, bold: true } }, { text: ' = ' }, { text: '"primary"', options: { color: C.w600 } }, { text: '   // fixed for every workload', options: { color: C.faint } }], 1.0, 3.05, 5.1, 0.45, { fontSize: 12, fontFace: 'Consolas', color: C.ink, valign: 'middle' });
    L.line(s, 6.5, 2.65, 6.83, 2.65, { color: C.b600, w: 2 });
    L.box(s, 6.93, 1.7, 5.8, 1.95, { fill: C.t50, r: 0.12 });
    cap(s, 'With this model', 7.18, 1.83, { w: 3, color: C.t600 });
    L.txt(s, 'Region as a deployment parameter', 7.18, 2.07, 5.4, 0.35, { fontSize: 14, fontFace: F.semi, color: C.ink });
    L.txt(s, 'Each workload selects from qualified regional options that fit its archetype and requirements, validated at decision time.', 7.18, 2.45, 5.4, 0.5, { fontSize: 12, color: C.text });
    L.box(s, 7.18, 3.05, 5.3, 0.45, { fill: 'FFFFFF', line: C.line, r: 0.06 });
    L.txt(s, [{ text: 'region', options: { color: C.b600, bold: true } }, { text: ' = ' }, { text: 'qualified_option(archetype, requirements)', options: { color: C.t700 } }], 7.33, 3.05, 5.1, 0.45, { fontSize: 12, fontFace: 'Consolas', color: C.ink, valign: 'middle' });
    cap(s, 'When circumstances change', 0.6, 3.82, { w: 5 });
    const T = [['gauge', C.v600, 'Capacity is available somewhere else', 'A qualified region with the required SKUs and quota can take the next deployment.'], ['layers', C.b600, 'A required service is stronger in another region', 'AI models, services, or zone support can favor a different qualified option.'], ['flag', C.w600, 'The regulatory or energy environment changes', 'Placement can adapt within the governed geography instead of waiting for a redesign.']];
    T.forEach(([ic, c, t, d], i) => {
      const x = 0.6 + i * 2.72, y = 4.05, w = 2.6, h = 1.95;
      L.box(s, x, y, w, h, { fill: C.wash, r: 0.12 });
      L.badge(s, ic, x + 0.18, y + 0.14, 0.36, c);
      L.txt(s, t, x + 0.18, y + 0.56, w - 0.36, 0.5, { fontSize: 12, fontFace: F.semi, color: C.ink });
      L.txt(s, d, x + 0.18, y + 1.08, w - 0.36, 0.75, { fontSize: 12, color: C.text });
    });
    L.line(s, 8.8, 5.03, 9.1, 5.03, { color: C.t600, w: 2 });
    L.box(s, 9.15, 4.05, 3.58, 1.95, { fill: C.t600, r: 0.12 });
    L.txt(s, [{ text: 'More options for where the next workload can go', options: { fontFace: F.semi, fontSize: 14, breakLine: true, paraSpaceAfter: 6 } }, { text: 'Existing workloads can stay put; new and movable ones use the best qualified option available.', options: { fontSize: 12, color: 'D6F0EC' } }], 9.35, 4.05, 3.25, 1.95, { color: 'FFFFFF', valign: 'middle' });
    L.box(s, 0.6, 6.1, 6.0, 0.75, { fill: C.s800, r: 0.12 });
    L.txt(s, [{ text: 'Deliberate where it matters: ', options: { bold: true } }, { text: 'where the major strategic hubs live.' }], 0.85, 6.1, 5.6, 0.75, { fontSize: 12.5, color: 'FFFFFF', valign: 'middle' });
    L.box(s, 6.73, 6.1, 6.0, 0.75, { fill: C.t50, line: C.t300, r: 0.12 });
    L.txt(s, [{ text: 'Adaptable where it helps: ', options: { bold: true } }, { text: 'which regions individual applications consume.' }], 6.98, 6.1, 5.6, 0.75, { fontSize: 12.5, color: C.ink, valign: 'middle' });
    s.addNotes('Talk track: "The important outcome is that region becomes increasingly a deployment parameter rather than a permanent architectural dependency. We still make deliberate choices about where major strategic hubs exist. But we stop assuming that every workload must inherit those same regional choices. That gives us a much better ability to respond when circumstances change. If capacity is available somewhere else, if a required Azure service is stronger in another region, or if the regulatory or energy environment changes, we have more options for where the next workload can go." From the whitepaper: placement is revalidated at decision time for services, SKUs, AI models, regional access, and quota; capacity remains a deployment-time condition. Staying in the current region is always a valid outcome.');
  }

  // ───────────────────────── 12 · 08 Agility in practice (brief page 12)
  {
    const s = L.slide('x8');
    L.header(s, '', 'Four scenarios at a glance', { ec: C.t600, tw: 8, lede: 'From a business or technical driver to a governed regional and workload decision. Illustrative, not customer-specific recommendations.', lx: 8.9, lw: 3.83 });
    const outcomes = [
      'Qualify for defined requirements, not the full portfolio; explicitly design recovery for a nonpaired region.',
      'Use the region for the required model or SKU; add connectivity only when the workload needs it.',
      'Understand portfolio dependencies before choosing the regional profile or planning relocation.',
      'Reuse the existing qualified region; keep the additional region an option, not a project.',
    ];
    outcomes.forEach((outcome, i) => {
      const x = 0.6 + (i % 2) * 6.12, y = 1.8 + Math.floor(i / 2) * 2.35, w = 6.0, h = 2.1;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.num(s, i + 1, x + 0.18, y + 0.14, 0.34, C.t600, 'FFFFFF', 12);
      L.txt(s, D.scenarios[i].title, x + 0.62, y + 0.1, w - 0.8, 0.55, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.box(s, x + 0.18, y + 0.82, w - 0.36, 1.08, { fill: C.t50, r: 0.1 });
      L.icon(s, 'flag', x + 0.35, y + 1.17, 0.28, 't');
      L.txt(s, outcome, x + 0.78, y + 0.87, w - 1.15, 0.98, { fontSize: 12, color: C.ink, valign: 'middle' });
    });
    s.addNotes('Use one of these scenarios to make the agility point concrete for the audience. The full deck and whitepaper walk each scenario from driver through the deciding checks, qualification, archetype, connectivity profile, and placement.');
  }

  // ───────────────────────── 13 · 09 The strategic benefit (brief page 13)
  {
    const s = L.slide('x9');
    L.header(s, '', 'Architect so that perfect prediction is unnecessary', { tw: 11.5 });
    L.txt(s, [{ text: 'No one can predict which European regions will offer the best combination of capacity, service availability, energy supply, and regulatory environment three to five years from now. ', options: { fontFace: F.light } }, { text: 'Architect so that it does not need to be predicted perfectly.', options: { fontFace: F.semi, color: C.ink } }], 0.6, 1.45, 5.4, 2.0, { fontSize: 16, color: C.s600 });
    L.txt(s, 'That means separating what must stay consistent — governance, security, compliance, and the operating model — from what should stay adaptable: which regions individual applications consume.', 0.6, 3.5, 5.4, 1.0, { fontSize: 12, color: C.text });
    L.box(s, 0.6, 4.55, 5.4, 1.2, { fill: C.w50, r: 0.1 });
    L.box(s, 0.6, 4.55, 0.05, 1.2, { fill: C.w600, r: 0 });
    L.txt(s, [{ text: 'For regulated organizations, ', options: { bold: true, color: C.w600 } }, { text: 'application-level, region-agnostic placement is a way to de-risk cloud growth if future power restrictions affect hyperscale expansion in a particular country.' }], 0.85, 4.55, 5.0, 1.2, { fontSize: 12, color: C.ink, valign: 'middle' });
    const T = [['app', 't', C.t50, C.t300, C.t700, 'Workload Landing Zone archetypes', 'Applications select the most efficient pattern that meets their requirements.', 0.6], ['route', 'b', C.b50, C.b200, C.b700, 'Geographically resilient connectivity', 'Diverse peering locations into the Azure backbone, planned for the geography.', 0.4], ['hub', 'b', 'FFFFFF', C.b300, C.b800, 'A small number of strategic geographic hubs', 'The full footprint lives where it is justified, not in every region.', 0.2], ['shield', 'w', C.s800, null, 'FFFFFF', 'One governed operating model', 'Landing-zone guardrails and operating standards stay stable across the estate.', 0]];
    T.forEach(([ic, c, bg, ln, tc, t, d, inset], i) => {
      const y = 1.5 + i * 1.0, x = 6.4 + inset, w = 12.73 - x - inset;
      L.box(s, x, y, w, 0.9, { fill: bg, line: ln || undefined, r: 0.12 });
      L.icon(s, ic, x + 0.22, y + 0.28, 0.34, c);
      L.txt(s, [{ text: t, options: { fontFace: F.semi, fontSize: 12.5, color: tc, breakLine: true } }, { text: d, options: { fontSize: 12, color: i === 3 ? 'C9D4E2' : C.text } }], x + 0.75, y, w - 0.9, 0.9, { valign: 'middle' });
    });
    L.txt(s, 'Together: an architecture that can evolve as Europe evolves.', 6.4, 5.5, 6.33, 0.3, { fontSize: 12, italic: true, color: C.muted, align: 'right' });
    L.image(s, IMG('band.jpg', L.tone), { x: 0.6, y: 5.95, w: 12.13, h: 0.9 }, 'Decorative gradient band', { sizing: { type: 'cover', w: 12.13, h: 0.9 } });
    L.txt(s, [{ text: 'The goal is not to select the perfect two regions. ', options: { fontFace: F.light } }, { text: 'It is to make additional regions significantly easier to adopt when business and workload requirements justify them.', options: { fontFace: F.semi } }], 0.95, 5.95, 11.4, 0.9, { fontSize: 16, color: 'FFFFFF', valign: 'middle' });
    s.addNotes('Talk track — finish with this: "We should not try to predict perfectly which European regions will have the best combination of capacity, service availability, energy supply and regulatory environment three-to-five years from now. The external environment is inherently dynamic. Instead, we should architect so that we do not need to predict it perfectly. That means separating the things that must remain consistent, our governance, security, compliance and operating model, from the things that should remain adaptable, namely which regions individual applications consume. With a small number of strategic geographic hubs, geographically resilient connectivity, and a set of lightweight Workload Landing Zone archetypes, we create an architecture that can evolve as Europe evolves." For regulated customers, reinforce that this application-level, region-agnostic approach provides a way to de-risk cloud growth if future power restrictions affect the industry’s ability to continue hyperscale expansion in a particular country.');
  }

  // ───────────────────────── 14 · Closing (brief page 14)
  {
    const s = L.slide('back', { bare: true });
    s.background = { path: IMG('bg_full.jpg', L.tone) };
    L.logo(s, 0.6, 0.6, 0.14, 'FFFFFF', 17);
    L.txt(s, 'Executive briefing', 10.3, 0.57, 2.43, 0.35, { fontSize: 13, fontFace: F.semi, color: 'FFFFFF', align: 'right' });
    L.title(s, [{ text: 'The adaptable ', options: { fontFace: F.light } }, { text: 'multi-region', options: { fontFace: F.semi } }, { text: ' Azure platform', options: { fontFace: F.light } }], 0.6, 1.9, 7.4, 1.3, { fontSize: 34, color: 'FFFFFF' });
    L.txt(s, 'The full whitepaper follows the five framework steps, then ' + D.serviceGuidesTitle + '. Resources cover getting started, customer scenarios, misconceptions, region pairing, and resiliency.', 0.6, 3.15, 6.6, 0.68, { fontSize: 12.5, color: 'DDEBF9' });
    L.txt(s, 'Multi-Region Platform · Executive Briefing · ' + D.edition, 0.6, 3.86, 6.6, 0.2, { fontSize: 11, color: 'BCD9F5' });
    L.txt(s, 'Start with one candidate region and the workloads that need it.', 0.6, 4.1, 9.0, 0.25, { fontSize: 12, fontFace: F.semi, color: 'FFFFFF' });
    const link = (label, text, url, x) => {
      L.txt(s, label.toUpperCase(), x, 4.42, 5.85, 0.22, { fontSize: 10, bold: true, color: 'BCD9F5', charSpacing: 2 });
      L.txt(s, [{ text, options: { hyperlink: { url, tooltip: label }, color: 'FFFFFF', underline: { style: 'sng', color: 'FFFFFF' } } }], x, 4.66, 5.85, 0.3, { fontSize: 13, fontFace: F.semi, color: 'FFFFFF' });
    };
    link('Website', D.siteUrl.replace(/^https:\/\//, '').replace(/\/$/, ''), D.siteUrl, 0.6);
    link(D.plannerName, D.workbookUrl.replace(/^https:\/\//, ''), D.workbookUrl, 6.75);
    L.txt(s, 'Compare regional options, record evidence and regional designs, export Excel, or save and reopen JSON planning records.', 0.6, 5.2, 9.2, 0.55, { fontSize: 12, color: 'DDEBF9' });
    L.txt(s, D.legal, 0.6, 6.5, 12.13, 0.7, { fontSize: 9.5, color: 'E3EEF9' });
    s.addNotes('Close with the website and Multi-region planner. The full paper follows the website’s five steps, then Service Guides for Multi Region: Storage, Backup and restore, Key Vault, and Private DNS zones. Resources includes pairing and resiliency scenarios. The planner supports qualification and regional design, Excel export, JSON planning records, and optional advanced networking visualization. Snapshot availability and prices and estimated latency are planning inputs, not capacity guarantees.');
  }
};
