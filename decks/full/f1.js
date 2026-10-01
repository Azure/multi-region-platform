const { C, F, IMG } = require('../lib');

module.exports = (pres, L) => {
  // ───────────────────────── 1 · Cover
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    s.addImage({ path: IMG('cover_panel.png'), x: 6.733, y: 0, w: 6.6, h: 7.5 });
    L.logo(s, 0.6, 0.55, 0.14, C.muted, 17);
    L.txt(s, 'White paper briefing', 10.6, 0.52, 2.2, 0.35, { fontSize: 13, fontFace: F.semi, color: 'FFFFFF', align: 'right' });
    let x = 0.6; x += L.chip(s, 'AZURE ARCHITECTURE', x, 1.85, { size: 9 }) + 0.12;
    L.chip(s, 'PLATFORM STRATEGY', x, 1.85, { size: 9, fill: C.t100, color: C.t700 });
    L.txt(s, [
      { text: 'The adaptable', options: { fontFace: F.light, color: C.ink, breakLine: true } },
      { text: 'multi-region', options: { fontFace: F.semi, color: C.b600, breakLine: true } },
      { text: 'Azure platform', options: { fontFace: F.light, color: C.ink } },
    ], 0.6, 2.3, 5.9, 2.2, { fontSize: 46, lineSpacingMultiple: 0.92 });
    L.txt(s, 'Extending Azure landing zones for adaptable regional placement — qualifying regions, planning by workload archetype, and right-sizing regional platform connectivity.', 0.6, 4.55, 5.4, 0.9, { fontSize: 14, color: C.s600, lineSpacingMultiple: 1.1 });
    L.txt(s, 'THREE PLANNING CONSTRUCTS', 0.6, 5.65, 4, 0.22, { fontSize: 9, bold: true, color: C.faint, charSpacing: 3 });
    [['Regional Qualification and Enablement Framework', C.b600], ['Application Landing Zone Archetypes', C.t600], ['Regional Platform Connectivity Profiles', C.v600]].forEach(([t, c], i) => {
      L.box(s, 0.6, 6.02 + i * 0.3, 0.26, 0.06, { fill: c, r: 0.03 });
      L.txt(s, t, 0.98, 5.93 + i * 0.3, 5, 0.25, { fontSize: 11.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    L.txt(s, 'September 2026', 0.6, 7.0, 3, 0.22, { fontSize: 9.5, color: C.muted });
    s.addNotes('Opening. This briefing summarizes the Multi-Region Platform Whitepaper: how to extend Azure landing zones so that additional Azure regions become governed, qualified options — without separate governance structures or identical infrastructure in every region. The artwork shows the model: two strategic hubs, a minimal hub, workload spokes, and an empty candidate footprint, all standing on one shared foundation.');
  }

  // ───────────────────────── 2 · Agenda
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.txt(s, 'Agenda', 0.6, 0.45, 6, 0.8, { fontSize: 36, fontFace: F.light, color: C.b600 });
    const items = [
      ['01', 'Introduction', 'Drivers, constructs, and the adoption journey'],
      ['02', 'Multi-region platform and workload', 'Two layers, two decisions'],
      ['03', 'Regional Qualification Framework', 'Five dimensions, readiness, and a decision tree'],
      ['04', 'Application Landing Zone Archetypes', 'What applications require'],
      ['05', 'Regional Platform Connectivity Profiles', 'What the platform provides'],
      ['06', 'Workload placement', 'Eight steps from option to placement'],
      ['07', 'A consistent operating model', 'What stays consistent and what adapts'],
      ['08', 'Customer scenarios', 'From driver to governed decision'],
      ['09', 'Putting it into practice', 'Misconceptions and getting started'],
      ['10', 'Conclusion', 'Design for continuing regional choice'],
      ['A', 'Appendix · Regional dependencies', 'Pairing, storage, backup, Key Vault'],
    ];
    items.forEach(([n, t, d], i) => {
      const col = i < 6 ? 0 : 1, row = i % 6;
      const x = 0.6 + col * 4.05, y = 1.45 + row * 0.9;
      L.box(s, x, y, 3.75, 0.012, { fill: C.soft, r: 0 });
      L.txt(s, n, x, y + 0.1, 0.7, 0.45, { fontSize: 20, fontFace: F.light, color: [3, 5, 7].includes(i) ? C.t600 : n === 'A' ? C.s600 : C.b600 });
      L.txt(s, t, x + 0.7, y + 0.1, 3.15, 0.42, { fontSize: 11.5, fontFace: F.semi, color: C.ink, valign: 'top', lineSpacingMultiple: 0.9 });
      L.txt(s, d, x + 0.7, y + (t.length > 30 ? 0.55 : 0.4), 3.15, 0.28, { fontSize: 9.5, color: C.muted });
    });
    s.addImage({ path: IMG('panel_tall.jpg'), x: 8.93, y: 0.45, w: 3.8, h: 6.4, sizing: { type: 'cover', w: 3.8, h: 6.4 } });
    L.txt(s, 'MULTI-REGION PLATFORM WHITEPAPER', 9.2, 0.72, 3.3, 0.22, { fontSize: 8.5, bold: true, color: 'DDEBF9', charSpacing: 2 });
    L.box(s, 9.15, 4.25, 3.36, 2.38, { fill: 'FFFFFF', r: 0.14 });
    L.txt(s, 'DECISION TOOLS IN THIS DECK', 9.37, 4.42, 3, 0.22, { fontSize: 8.5, bold: true, color: C.b700, charSpacing: 2 });
    [['search', 'b', 'Regional qualification decision tree'], ['check', 'b', 'Platform readiness checklist'], ['hub', 'b', 'Connectivity profile selection tree'], ['route', 't', 'Workload placement flow']].forEach(([ic, c, t], i) => {
      const y = 4.78 + i * 0.44;
      L.box(s, 9.37, y - 0.06, 2.92, 0.008, { fill: C.soft, r: 0 });
      L.icon(s, ic, 9.37, y + 0.05, 0.24, c);
      L.txt(s, t, 9.72, y, 2.6, 0.36, { fontSize: 10.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    L.footer(s, 0, 'AGENDA');
  }

  // ───────────────────────── Executive summary (1/2)
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, 'Executive summary', 'Make regional choice a governed platform capability — not a one-time prediction', { tw: 7.3, ts: 23, lede: 'Extend Azure landing-zone principles so that additional regions become qualified options that workloads can use selectively — without separate governance models or an identical platform footprint in every region.', lx: 8.2, lw: 4.53, ls: 12 });
    L.box(s, 0.6, 1.95, 12.13, 0.95, { fill: C.b50, r: 0.12 });
    L.txt(s, 'The objective is not to prebuild every capability everywhere. It is to establish a consistent operating model, qualify regional options against known business and workload requirements, and enable only the platform capabilities that each region needs.', 0.85, 1.95, 11.6, 0.95, { fontSize: 14, fontFace: F.semi, color: C.b800, valign: 'middle' });
    const cards = [
      ['layers', C.b600, C.wash, 'Extend, do not replicate', 'The landing-zone operating model stays consistent across the Azure estate. New regions add only the most efficient platform capabilities required by the workloads expected to use them, rather than replicating an existing regional footprint.'],
      ['search', C.b700, C.wash, 'Qualify regions against defined requirements', 'Business and geography, data and compliance, workload requirements and dependencies, regional capabilities, and platform enablement. Qualification creates a governed regional option; it does not permanently approve the region for every workload.'],
      ['app', C.t600, C.t50, 'Plan by workload requirements, not individual applications', 'Application Landing Zone archetypes anticipate recurring connectivity and dependency requirements. Archetypes describe what applications require; connectivity profiles describe what the platform provides.'],
    ];
    cards.forEach(([ic, c, bg, t, d], i) => {
      const x = 0.6 + i * 4.1, y = 3.1, w = 3.93, h = 2.75;
      L.box(s, x, y, w, h, { fill: bg, r: 0.12 });
      L.badge(s, ic, x + 0.22, y + 0.22, 0.46, c);
      L.txt(s, t, x + 0.82, y + 0.16, w - 1.0, 0.6, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.22, y + 0.92, w - 0.44, 1.75, { fontSize: 12, color: C.text, lineSpacingMultiple: 1.08 });
    });
    L.box(s, 0.6, 6.05, 12.13, 0.7, { fill: C.s800, r: 0.12 });
    L.txt(s, [{ text: 'Qualification creates a governed regional option; ', options: { fontFace: F.semi } }, { text: 'it does not permanently approve the region for every workload.' }], 0.85, 6.05, 11.6, 0.7, { fontSize: 14, color: 'FFFFFF', valign: 'middle' });
    L.footer(s, 0, 'EXECUTIVE SUMMARY');
    s.addNotes('Many Azure estates are designed around a fixed primary and disaster-recovery region pair. This approach extends Azure landing-zone principles so additional regions become qualified options that workloads can use selectively. Regional qualification evaluates business and geographic needs, data and compliance constraints, workload requirements and dependencies, regional capabilities, and platform enablement. A region can remain excluded, conditional, or qualified based on documented evidence, constraints, owners, and revalidation triggers. Archetypes describe what applications require; connectivity profiles describe what the platform provides; the relationship is intentionally not one-to-one.');
  }

  // ───────────────────────── Executive summary (2/2)
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, 'Executive summary · continued', 'Right-size connectivity, keep readiness and placement separate, keep one operating model', { tw: 9.5, ts: 22 });
    const cards = [
      ['hub', C.v600, C.wash, 'Right-size regional connectivity', 'Profiles range from Disconnected Spokes through Remote Hub Connected and Minimal Regional Hub to a Full Regional Hub. They are not maturity stages: select the most efficient profile for current requirements and add local capabilities only when a measurable need justifies them.'],
      ['route', C.t700, C.t50, 'Keep platform readiness and workload placement separate', 'Qualification determines whether a region can become a viable option. Placement happens later, when a workload and its current requirements are known, with service, SKU, access, quota, dependency, connectivity, and resiliency revalidated.'],
      ['shield', C.s800, C.wash, 'One operating model, regional adaptation', 'The operating model stays consistent across regions; implementation can vary where business, workload, or regulatory requirements call for it. Region-agnostic does not mean region-random.'],
    ];
    cards.forEach(([ic, c, bg, t, d], i) => {
      const x = 0.6 + i * 4.1, y = 1.75, w = 3.93, h = 3.6;
      L.box(s, x, y, w, h, { fill: bg, r: 0.12 });
      L.badge(s, ic, x + 0.22, y + 0.22, 0.46, c);
      L.txt(s, t, x + 0.82, y + 0.16, w - 1.0, 0.6, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.22, y + 0.92, w - 0.44, 2.55, { fontSize: 12.5, color: C.text, lineSpacingMultiple: 1.1 });
    });
    s.addImage({ path: IMG('band.jpg'), x: 0.6, y: 5.6, w: 12.13, h: 1.2, sizing: { type: 'cover', w: 12.13, h: 1.2 } });
    L.txt(s, [{ text: 'The goal is not to select the perfect two regions. ', options: { fontFace: F.light } }, { text: 'It is to make additional regions significantly easier to adopt when business and workload requirements justify them.', options: { fontFace: F.semi } }], 0.95, 5.6, 11.4, 1.2, { fontSize: 18, color: 'FFFFFF', valign: 'middle' });
    L.footer(s, 0, 'EXECUTIVE SUMMARY');
    s.addNotes('Strategic geographic hubs and shared services can continue to support other regions where dependencies and service characteristics permit, avoiding unnecessary duplication. New workload findings can feed back into regional qualification and trigger platform expansion, additional validation, or reassessment. Workload placement, connectivity profiles, local shared-service footprints, Azure services and SKUs, resiliency choices, and other regional parameters can adapt to current requirements.');
  }

  // ───────────────────────── Drivers
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '01 · What starts the conversation', 'Common drivers of multi-region platform discussions', { tw: 7.4, lede: 'Multi-region platform work rarely starts as an architecture initiative. It usually starts with a change in the business, regulation, workload requirements, service availability, or risk.', lx: 8.4, lw: 4.33 });
    const D = [
      ['users', C.b600, 'Business growth and proximity', 'Expansion into new markets or geographies; acquisitions or divestitures that introduce estates in other regions; digital products that must be closer to customers; user-latency requirements.'],
      ['lock', C.w600, 'Data residency, sovereignty, and regulation', 'New or changing data-residency laws; industry requirements for operational resilience or concentration risk; customer contracts; public-sector requirements.'],
      ['gauge', C.v600, 'Service, AI model, SKU, and quota availability', 'AI models, GPU SKUs, or Azure services available only in selected regions; quota constraints; availability-zone requirements.'],
      ['shield', C.b800, 'Resiliency and concentration risk', 'RTO or RPO the existing regional design cannot satisfy; concentration-risk concerns; paired or nonpaired-region considerations; audit or regulatory findings; lessons from incidents.'],
      ['building', C.s800, 'Datacenter and connectivity events', 'Datacenter or colocation exits; migration waves; office or datacenter moves; network-provider changes; a new Azure region opening within the required geography.'],
      ['layers', C.t600, 'Cost and operating model', 'Regional price differences and cross-region transfer cost; landing-zone redesigns or platform refreshes; reducing unnecessary regional infrastructure; sustainability objectives.'],
    ];
    D.forEach(([ic, c, t, d], i) => {
      const x = 0.6 + (i % 2) * 6.12, y = 1.85 + Math.floor(i / 2) * 1.32, w = 6.0, h = 1.2;
      L.box(s, x, y, w, h, { fill: C.wash, r: 0.12 });
      L.badge(s, ic, x + 0.2, y + 0.22, 0.46, c);
      L.txt(s, t, x + 0.8, y + 0.12, w - 1.0, 0.36, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.8, y + 0.48, w - 1.0, 0.68, { fontSize: 10.5, color: C.text });
    });
    L.box(s, 0.6, 5.9, 8.2, 0.75, { fill: C.b600, r: 0.12 });
    L.txt(s, 'Drivers open the discussion; they do not determine the regional architecture or the workload-placement outcome.', 0.85, 5.9, 7.8, 0.75, { fontSize: 13.5, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    L.box(s, 9.0, 5.9, 3.73, 0.75, { fill: C.wash, r: 0.12 });
    L.txt(s, [{ text: 'Scope: ', options: { bold: true } }, { text: 'Azure public-cloud regions. Sovereign cloud offerings and Azure Local are not covered.' }], 9.15, 5.9, 3.5, 0.75, { fontSize: 9.5, color: C.ink, valign: 'middle' });
    L.footer(s, 0, '01 · INTRODUCTION');
    s.addNotes('These drivers are typical patterns observed across enterprise estates. They open the discussion; they do not determine the regional architecture or the workload-placement outcome. The same qualification logic can inform sovereign cloud offerings and Azure Local, but those have their own constraints and are not covered here.');
  }

  // ───────────────────────── 4 · The case: fixed pair vs governed options
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '01 · Introduction', 'Extend Azure landing zones for adaptable regional placement', { tw: 8, lede: 'The same operating model applies across the estate, while each region is qualified against the workloads it may need to support.', lx: 8.9, lw: 3.83 });
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
    let cx = 0.85; ['Business expansion', 'Data boundaries'].forEach(t => { cx += L.chip(s, t, cx, 5.25, { fill: C.w100, color: C.w600, size: 9 }) + 0.08; });
    cx = 0.85; ['Service & AI availability', 'Latency'].forEach(t => { cx += L.chip(s, t, cx, 5.6, { fill: C.w100, color: C.w600, size: 9 }) + 0.08; });
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
    L.footer(s, 0, '01 · INTRODUCTION');
    s.addNotes('Azure landing zones provide a governed foundation for identity, connectivity, security, management, and application delivery. Many organizations establish it around a fixed primary and disaster-recovery region, reflecting datacenter and colocation design. That works while demand and placement requirements remain predictable, but becomes less adaptable as business expansion, data boundaries, service and AI availability, latency requirements, and other regional conditions evolve. An adaptable multi-region platform extends Azure landing zones without creating separate governance structures or identical infrastructure in every region. The same operating model applies across the estate, while each region is qualified against the workloads it may need to support. Because platform teams cannot predict every future workload, this paper uses three planning constructs.');
  }

  // ───────────────────────── 5 · Three constructs
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '01 · Introduction', 'Three constructs balance advance planning with flexibility', { tw: 8.2, lede: 'Platform teams cannot predict every future workload. Plan for what is known, stay flexible for what is not.', lx: 9.2, lw: 3.53 });
    L.txt(s, 'PLATFORM READINESS · ADVANCE PLANNING', 0.6, 1.72, 6, 0.22, { fontSize: 9, bold: true, color: C.b600, charSpacing: 2 });
    const cards = [
      ['search', C.b600, 'Regional Qualification and Enablement Framework', 'Evaluates candidate regions against five dimensions for defined workload requirements.', [['Excluded', C.w100, C.w600], ['Candidate', 'FFFFFF', C.b700, C.b500], ['Conditional', 'FFF1CC', '8A5A00'], ['Qualified', C.g100, C.g600]]],
      ['app', C.t600, 'Application Landing Zone Archetypes', 'Describe what applications require — recurring dependency and connectivity characteristics.', [['Hybrid', C.t100, C.t700], ['Isolated', C.t100, C.t700], ['Connected', C.t100, C.t700], ['Portfolios', C.t100, C.t700]]],
      ['hub', C.v600, 'Regional Platform Connectivity Profiles', 'Describe what the platform provides to support those archetypes in a region.', [['Disconnected', C.b100, C.b700], ['Remote hub', C.b100, C.b700], ['Minimal', C.b100, C.b700], ['Full', C.b100, C.b700]]],
    ];
    cards.forEach(([ic, c, t, d, chips], i) => {
      const x = 0.6 + i * 4.1, y = 2.1, w = 3.93, h = 2.3;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: i === 1 ? C.t300 : C.line, r: 0.12, shadow: true });
      L.badge(s, ic, x + 0.22, y + 0.22, 0.46, c);
      L.txt(s, t, x + 0.82, y + 0.18, w - 1.0, 0.56, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.22, y + 0.85, w - 0.44, 0.7, { fontSize: 11, color: C.text });
      let cx = x + 0.22, cyy = y + (chips.length > 3 ? 1.62 : 1.8); chips.forEach(([ct, f, cc, ln]) => { const cw = ct.length * 0.068 + 0.28; if (cx + cw > x + w - 0.1) { cx = x + 0.22; cyy += 0.32; } cx += L.chip(s, ct, cx, cyy, { fill: f, color: cc, line: ln, dash: ln ? 'dash' : undefined, size: 8.5 }) + 0.06; });
    });
    L.line(s, 2.56, 4.4, 2.56, 4.72, { color: C.b600 }); L.line(s, 10.77, 4.4, 10.77, 4.72, { color: C.b600 });
    L.box(s, 0.6, 4.72, 12.13, 0.6, { fill: C.b600, r: 0.1 });
    L.icon(s, 'pin', 0.82, 4.87, 0.3, 'w');
    L.txt(s, [{ text: 'Governed regional options   ', options: { fontFace: F.semi, fontSize: 13, color: 'FFFFFF' } }, { text: 'Qualified regions with a known profile, documented constraints, ownership, and review triggers — not predetermined placement', options: { fontSize: 10.5, color: 'DDEBF9' } }], 1.25, 4.72, 11.3, 0.6, { valign: 'middle' });
    L.line(s, 6.66, 5.32, 6.66, 5.64, { color: C.t600 });
    L.txt(s, 'WORKLOAD ADOPTION · AT ONBOARDING', 0.6, 5.4, 6, 0.22, { fontSize: 9, bold: true, color: C.t600, charSpacing: 2 });
    L.box(s, 0.6, 5.66, 12.13, 0.62, { fill: C.t50, line: C.t300, r: 0.1 });
    L.icon(s, 'app', 0.82, 5.82, 0.3, 't');
    L.txt(s, 'Revalidate against the application', 1.25, 5.66, 3.2, 0.62, { fontSize: 12, fontFace: F.semi, color: C.t700, valign: 'middle' });
    let cx = 4.35; ['Remain in place', 'Net-new in another region', 'Relocate', 'Recover elsewhere', 'Operate across active regions'].forEach(t => { cx += L.chip(s, t, cx, 5.84, { fill: 'FFFFFF', color: C.t700, line: C.t300, size: 9 }) + 0.1; });
    L.caption(s, 'Figure', 'Archetypes (application requirements) and profiles (platform capability) stay distinct. Migration and resiliency remain workload-specific decisions.', 0.6, 6.5, 12.1);
    L.footer(s, 0, '01 · INTRODUCTION');
    s.addNotes('Regional Qualification and Enablement Framework: a repeatable way to assess candidate regions — business and geographic need, data and compliance boundaries, workload requirements and dependencies, regional capabilities, and required platform enablement. The result is an excluded, candidate, conditional, or qualified regional option, backed by current evidence, known constraints, ownership, and review triggers. Application Landing Zone Archetypes group workloads by recurring dependency and connectivity characteristics. Regional Platform Connectivity Profiles describe what the platform provides: Disconnected Spokes, Remote Hub Connected, Minimal Regional Hub, or Full Regional Hub. The most efficient profile can remain the target as long as it continues to satisfy requirements. Hybrid connectivity and regional workload connectivity are related but separate decisions. During onboarding, teams revalidate options against the application and decide whether it remains in place, uses another region for net-new deployment, relocates, recovers elsewhere, or operates across active regions.');
  }

  // ───────────────────────── 6 · Progressive adoption journey
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '01 · Introduction', 'Create regional options first — then use and expand them as workload needs justify', { tw: 8.4, lede: 'Recommended sequence, not a mandatory maturity path. Platform capabilities and workload use evolve only when business and application requirements justify them.', lx: 9.3, lw: 3.43 });
    const steps = [
      ['1', 'Extend the platform', 'Qualify additional regions and establish the lightest required platform capabilities.', ['Assess regional suitability', 'Establish connectivity options', 'Enable foundational services'], 'Create regional options', 'layers'],
      ['2', 'Place net-new growth', 'Direct suitable new workloads and deployment waves to qualified regions.', ['Prioritize new workloads', 'Use qualified regions', 'Deploy in waves'], 'Grow with intent', 'app'],
      ['3', 'Selectively rebalance', 'Redeploy movable workloads when doing so creates a clear portfolio benefit.', ['Identify eligible workloads', 'Migrate or relocate selectively', 'Optimize cost, performance, or compliance'], 'Optimize where it makes sense', 'route'],
      ['4', 'Improve workload resiliency', 'Use the regional foundation for active/passive recovery and, where justified, active-active.', ['Implement recovery deployments', 'Adopt active-active where needed', 'Leverage regional capabilities'], 'Add resiliency when required', 'shield'],
    ];
    steps.forEach(([n, t, d, bl, foot, ic], i) => {
      const x = 0.6 + i * 3.1, y = 1.9, w = 2.85, h = 4.1;
      L.box(s, x, y, w, h, { fill: C.wash, r: 0.12 });
      L.num(s, n, x + 0.22, y + 0.22, 0.42, C.b100, C.b700, 14);
      L.txt(s, t, x + 0.75, y + 0.22, w - 0.9, 0.42, { fontSize: 13.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.22, y + 0.8, w - 0.44, 0.85, { fontSize: 11, color: C.text });
      L.badge(s, ic, x + w / 2 - 0.36, y + 1.72, 0.72, i === 3 ? C.t600 : C.b600, 'w', 0.36);
      bl.forEach((b, j) => {
        L.oval(s, x + 0.25, y + 2.73 + j * 0.34, 0.07, { fill: C.b600 });
        L.txt(s, b, x + 0.42, y + 2.62 + j * 0.34, w - 0.55, 0.3, { fontSize: 9.5, color: C.text, valign: 'middle' });
      });
      L.box(s, x, y + h - 0.45, w, 0.45, { fill: C.b100, r: 0.12 });
      L.box(s, x, y + h - 0.45, w, 0.2, { fill: C.b100, r: 0 });
      L.txt(s, foot.toUpperCase(), x + 0.22, y + h - 0.45, w - 0.3, 0.45, { fontSize: 8, bold: true, color: C.b700, charSpacing: 0.8, valign: 'middle' });
      if (i < 3) L.line(s, x + w + 0.03, y + 2.08, x + 3.07, y + 2.08, { color: C.b300, w: 1.5 });
    });
    L.line(s, 0.6, 6.2, 12.73, 6.2, { color: C.b500, w: 2.5 });
    L.txt(s, 'PLATFORM READINESS', 0.6, 6.28, 4, 0.22, { fontSize: 9, bold: true, color: C.b600, charSpacing: 2 });
    L.txt(s, 'SELECTIVE WORKLOAD USE', 8.7, 6.28, 4.03, 0.22, { fontSize: 9, bold: true, color: C.t600, charSpacing: 2, align: 'right' });
    L.caption(s, 'Figure', 'A progressive journey: regional options are created first and consumed selectively. A platform can stop at any step that continues to meet requirements.', 0.6, 6.58, 12.1);
    L.footer(s, 0, '01 · INTRODUCTION');
    s.addNotes('Together, the constructs create governed regional options without predetermining workload placement. During onboarding, teams revalidate the region against the workload’s current dependencies and requirements, then decide whether to stay put, deploy net-new, relocate, recover elsewhere, or operate across regions. Migration and resiliency remain workload-specific. The framework makes later regional adoption easier without trying to predict the final estate up front.');
  }

  // ───────────────────────── 7 · Platform vs workload
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '02 · Two layers, two decisions', 'Multi-region platform and multi-region workload operate at different layers', { tw: 8.4, lede: 'The platform creates governed regional choices for the estate; the workload applies one or more of those choices to a specific application.', lx: 9.3, lw: 3.43 });
    // platform panel
    L.box(s, 0.6, 1.95, 5.3, 3.65, { fill: C.b50, line: C.b100, r: 0.14 });
    L.txt(s, 'Multi-region platform', 0.85, 2.1, 4, 0.34, { fontSize: 16, fontFace: F.semi, color: C.b700 });
    L.txt(s, 'Creates governed regional choices', 0.85, 2.45, 4, 0.25, { fontSize: 11, color: C.b700 });
    [[1.3, 3.1], [2.95, 2.9], [4.55, 3.15]].forEach(([x, y]) => { L.icon(s, 'pin', x, y, 0.5, 'b'); L.txt(s, 'Region', x - 0.2, y + 0.52, 0.9, 0.2, { fontSize: 9, bold: true, color: C.b800, align: 'center' }); });
    L.line(s, 1.85, 3.3, 2.9, 3.2, { color: C.b300, dash: 'dash', arrow: false }); L.line(s, 3.5, 3.2, 4.5, 3.35, { color: C.b300, dash: 'dash', arrow: false });
    [['shield', 'Governance'], ['id', 'Identity & security'], ['monitor', 'Monitoring'], ['network', 'Connectivity patterns'], ['gear', 'Automation'], ['gauge', 'Quota planning']].forEach(([ic, t], i) => {
      const x = 0.8 + i * 0.83;
      L.icon(s, ic, x + 0.22, 4.35, 0.36, 'b');
      L.txt(s, t, x - 0.05, 4.78, 0.9, 0.5, { fontSize: 8.5, bold: true, color: C.b800, align: 'center' });
    });
    // center arrow
    L.box(s, 6.02, 3.35, 1.25, 0.85, { fill: C.b100, r: 0.1 });
    L.txt(s, 'Qualified regional options', 6.02, 3.35, 1.25, 0.85, { fontSize: 10, bold: true, color: C.ink, align: 'center', valign: 'middle' });
    L.line(s, 5.92, 3.78, 6.0, 3.78, { color: C.b600 }); L.line(s, 7.28, 3.78, 7.4, 3.78, { color: C.t600 });
    // workload panel
    L.box(s, 7.43, 1.95, 5.3, 3.65, { fill: C.t50, line: C.t100, r: 0.14 });
    L.txt(s, 'Multi-region workload', 7.68, 2.1, 4, 0.34, { fontSize: 16, fontFace: F.semi, color: C.t700 });
    L.txt(s, 'Selects one or more qualified regions for a specific outcome', 7.68, 2.45, 4.8, 0.25, { fontSize: 11, color: C.t700 });
    L.box(s, 9.48, 2.95, 1.2, 0.5, { fill: C.t600, r: 0.1 });
    L.txt(s, 'Workload', 9.48, 2.95, 1.2, 0.5, { fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
    const outs = [['pin', 'Net-new placement'], ['route', 'Selective relocation'], ['shield', 'Active/passive recovery'], ['layers', 'Active-active distribution'], ['pin', 'Continued single-region']];
    L.line(s, 10.08, 3.45, 10.08, 3.75, { color: C.t600, arrow: false });
    L.line(s, 8.15, 3.75, 12.0, 3.75, { color: C.t600, arrow: false });
    outs.forEach(([ic, t], i) => {
      const cx = 8.15 + i * 0.9625;
      L.line(s, cx, 3.75, cx, 4.02, { color: C.t600 });
      L.box(s, cx - 0.27, 4.05, 0.54, 0.54, { fill: 'FFFFFF', line: C.t300, dash: i === 4 ? 'dash' : 'solid', r: 0.1 });
      L.icon(s, ic, cx - 0.16, 4.16, 0.32, 't');
      L.txt(s, t, cx - 0.47, 4.66, 0.94, 0.5, { fontSize: 8.5, bold: true, color: C.t700, align: 'center' });
    });
    // does not imply
    L.box(s, 0.6, 5.78, 12.13, 0.55, { fill: C.w50, r: 0.1 });
    L.txt(s, 'PLATFORM READINESS DOES NOT IMPLY', 0.82, 5.78, 3.4, 0.55, { fontSize: 9, bold: true, color: C.w600, charSpacing: 1, valign: 'middle' });
    ['A new landing zone', 'Workload migration', 'Active-active HA', 'Active/passive DR'].forEach((t, i) => L.txt(s, [{ text: '×  ', options: { color: C.w600, bold: true } }, { text: t }], 4.4 + i * 2.08, 5.78, 2.05, 0.55, { fontSize: 11, fontFace: F.semi, color: C.ink, valign: 'middle' }));
    L.caption(s, 'Figure', 'Platform capabilities make regions available as qualified options; each workload selects its own outcome — which can legitimately be continued operation in a single region.', 0.6, 6.5, 12.1);
    L.footer(s, 0, '02 · PLATFORM AND WORKLOAD');
    s.addNotes('Keeping these concepts separate prevents multi-region strategy from being treated as an automatic requirement for a new landing zone, workload migration, active-active high availability, or active/passive disaster recovery. A multi-region platform qualifies additional regions through the existing landing-zone operating model, approved connectivity patterns, deployment automation, and quota planning. It does not require a separate connectivity landing zone or identical shared services in every region; workload requirements determine the cross-region design.');
  }

  // ───────────────────────── 8 · Two layers compared
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '02 · Two layers, two decisions', 'Two layers compared', { tw: 8 });
    const hdr = { fontFace: F.body, fontSize: 10, bold: true, charSpacing: 1.5, valign: 'middle' };
    const rows = [
      ['Purpose', 'Enable placement flexibility across qualified Azure regions', 'Meet workload-specific objectives and requirements such as availability, disaster recovery, user proximity, or regulatory requirements'],
      ['Focus', 'Regional readiness and consistency of shared platform capabilities', 'Application architecture, data, dependencies, traffic, availability, and recovery'],
      ['Design driven by', 'The needs of the portfolio of workloads the platform is expected to support', 'The specific workload’s requirements, such as availability, resiliency, RTO/RPO, latency, or data requirements'],
      ['Typical outcome', 'Additional regions become qualified options with known profiles and constraints', 'Net-new placement, selective relocation, active/passive recovery, active-active distribution, or continued single-region operation'],
    ];
    const cell = (t, o = {}) => ({ text: t, options: Object.assign({ fontFace: F.body, fontSize: 11, color: C.text, valign: 'middle', margin: [4, 10, 4, 10], border: [{ type: 'solid', pt: 1, color: C.soft }, { type: 'none' }, { type: 'none' }, { type: 'none' }] }, o) });
    const data = [[cell('', { border: [{ type: 'none' }, { type: 'none' }, { type: 'none' }, { type: 'none' }] }), cell('MULTI-REGION PLATFORM', Object.assign({ fill: { color: C.b50 }, color: C.b700 }, hdr, { border: [{ type: 'none' }, { type: 'none' }, { type: 'none' }, { type: 'none' }] })), cell('MULTI-REGION WORKLOAD', Object.assign({ fill: { color: C.t50 }, color: C.t700 }, hdr, { border: [{ type: 'none' }, { type: 'none' }, { type: 'none' }, { type: 'none' }] }))]];
    rows.forEach(r => data.push([cell(r[0], { bold: true, color: C.ink, fontSize: 11.5 }), cell(r[1], { fill: { color: 'FAFCFE' } }), cell(r[2], { fill: { color: 'FAFDFC' } })]));
    s.addTable(data, { x: 0.6, y: 1.5, w: 12.13, colW: [2.2, 4.965, 4.965], rowH: [0.4, 0.7, 0.55, 0.62, 0.7] });
    s.addImage({ path: IMG('band.jpg'), x: 0.6, y: 5.35, w: 7.6, h: 1.4, sizing: { type: 'cover', w: 7.6, h: 1.4 } });
    L.txt(s, 'DEFAULT POSTURE', 0.9, 5.48, 3, 0.2, { fontSize: 8.5, bold: true, color: 'BCD9F5', charSpacing: 2 });
    L.txt(s, 'Reuse the existing Azure landing-zone operating model by default. Extend regional policy parameters, connectivity, shared services, automation, and operations only where documented workload requirements justify them.', 0.9, 5.72, 7.1, 0.95, { fontSize: 12.5, fontFace: F.semi, color: 'FFFFFF' });
    L.txt(s, 'Multi-region platform readiness establishes the shared capabilities needed to support workloads across selected Azure regions.\n\nRegional suitability depends on service and SKU fit, dependencies, quota, latency, cost, and data constraints; actual capacity remains a deployment-time condition.', 8.5, 5.35, 4.23, 1.4, { fontSize: 10.5, color: C.text, valign: 'middle' });
    L.footer(s, 0, '02 · PLATFORM AND WORKLOAD');
    s.addNotes('Table 1 from the whitepaper. Default posture: reuse the existing Azure landing-zone operating model by default; extend regional policy parameters, connectivity, shared services, automation, and operations only where documented workload requirements justify them. Actual capacity remains a deployment-time condition.');
  }
};
