const { C, F, IMG } = require('../lib');

// "plain **bold** plain" -> text runs with emphasis on the starred parts
const rich = (str, o = {}) => str.split('**').map((t, i) => ({ text: t, options: Object.assign({}, o, i % 2 ? { bold: true, color: C.ink } : {}) })).filter(r => r.text);

module.exports = (pres, L) => {
  const D = L.data;

  // ───────────────────────── 1 · Cover
  {
    const s = L.slide('front', { bare: true });
    L.image(s, IMG('cover_panel.png', L.tone), { x: 6.733, y: 0, w: 6.6, h: 7.5 }, 'Illustration: regions of different sizes standing on one shared platform foundation');
    L.logo(s, 0.6, 0.55, 0.14, C.muted, 17);
    L.txt(s, 'Whitepaper briefing', 10.4, 0.52, 2.4, 0.35, { fontSize: 14, fontFace: F.semi, color: 'FFFFFF', align: 'right' });
    let x = 0.6; x += L.chip(s, 'AZURE ARCHITECTURE', x, 1.4, { size: 10, w: 2.05, h: 0.3 }) + 0.12;
    L.chip(s, 'PLATFORM STRATEGY', x, 1.4, { size: 10, w: 1.95, h: 0.3, fill: C.t100, color: C.t700 });
    L.title(s, [
      { text: 'The adaptable', options: { fontFace: F.light, color: C.ink, breakLine: true } },
      { text: 'multi-region', options: { fontFace: F.semi, color: C.b600, breakLine: true } },
      { text: 'Azure platform', options: { fontFace: F.light, color: C.ink } },
    ], 0.6, 1.9, 5.9, 2.15, { fontSize: 46, lineSpacingMultiple: 0.92 });
    L.txt(s, 'Extending Azure landing zones for adaptable regional placement — qualifying regions, planning by workload archetype, and selecting the most efficient regional platform connectivity.', 0.6, 4.2, 5.8, 1.3, { fontSize: 15, color: C.s600, lineSpacingMultiple: 1.1 });
    L.txt(s, 'THREE PLANNING CONSTRUCTS', 0.6, 5.62, 4, 0.24, { fontSize: 10.5, bold: true, color: C.faint, charSpacing: 3 });
    const tone = [C.v600, C.t600, C.b600];
    D.constructs.forEach((t, i) => {
      L.box(s, 0.6, 6.06 + i * 0.32, 0.26, 0.06, { fill: tone[i], r: 0.03 });
      L.txt(s, t, 0.98, 5.95 + i * 0.32, 5.4, 0.28, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    L.txt(s, D.edition, 0.6, 7.03, 3, 0.26, { fontSize: 11, color: C.muted, valign: 'middle' });
    s.addNotes('Opening. This briefing summarizes the Multi-Region Platform Whitepaper: how to extend Azure landing zones so that additional Azure regions become governed, qualified options, without separate governance structures or identical infrastructure in every region. The artwork shows the model: two strategic hubs, a minimal hub, workload spokes, and an empty candidate footprint, all standing on one shared foundation.');
  }

  // ───────────────────────── 2 · Agenda (generated from the sections table)
  {
    const s = L.slide('front');
    L.title(s, 'Agenda', 0.6, 0.45, 6, 0.8, { fontSize: 36, fontFace: F.light, color: C.b600 });
    const items = L.sections.filter(sec => sec.agenda);
    const per = Math.ceil(items.length / 2), cw = 3.95, pitch = 0.9;
    items.forEach((sec, i) => {
      const [mark, title, desc] = sec.agenda;
      const col = Math.floor(i / per), row = i % per;
      const x = 0.6 + col * (cw + 0.2), y = 1.45 + row * pitch;
      L.box(s, x, y, cw, 0.012, { fill: C.soft, r: 0 });
      if (mark) L.txt(s, mark, x, y + 0.08, 0.55, 0.44, { fontSize: 22, fontFace: F.light, color: sec.color || C.b600 });
      else L.box(s, x + 0.04, y + 0.25, 0.22, 0.03, { fill: C.s300, r: 0.015 });
      L.txt(s, title, x + 0.55, y + 0.1, cw - 0.55, 0.3, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'top' });
      L.txt(s, desc, x + 0.55, y + 0.4, cw - 0.55, 0.45, { fontSize: 11, color: C.muted, lineSpacingMultiple: 0.95 });
    });
    L.image(s, IMG('panel_tall.jpg', L.tone), { x: 8.93, y: 0.45, w: 3.8, h: 6.4 }, 'Decorative panel: concentric rounded squares around a central point', { sizing: { type: 'cover', w: 3.8, h: 6.4 } });
    L.txt(s, 'MULTI-REGION PLATFORM WHITEPAPER', 9.2, 0.72, 3.4, 0.24, { fontSize: 10, bold: true, color: C.b100, charSpacing: 1 });
    L.box(s, 9.15, 3.95, 3.36, 2.75, { fill: 'FFFFFF', r: 0.14 });
    L.txt(s, 'DECISION TOOLS IN THIS DECK', 9.37, 4.12, 3, 0.24, { fontSize: 10, bold: true, color: C.b700, charSpacing: 2 });
    [['search', 'b', 'Regional qualification decision tree'], ['hub', 'b', 'Connectivity profile selection tree'], ['route', 't', 'Workload placement flow'], ['check', 'b', 'Platform readiness checklist']].forEach(([ic, c, t], i) => {
      const y = 4.5 + i * 0.54;
      L.box(s, 9.37, y, 2.92, 0.008, { fill: C.soft, r: 0 });
      L.icon(s, ic, 9.37, y + 0.13, 0.26, c);
      L.txt(s, t, 9.76, y + 0.03, 2.6, 0.48, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    s.addNotes('The agenda follows the website: understand concepts, qualify regions, select the regional design, prepare the region, and place workloads. Service Guides for Multi Region follows, then Resources: getting started, customer scenarios, misconceptions, pairing, and resiliency. The conclusion closes the story. Four decision tools: regional qualification tree, connectivity profile tree, workload placement flow, and platform readiness checklist.');
  }

  // ───────────────────────── 3 · Executive summary — the approach at a glance
  {
    const s = L.slide('summary');
    L.header(s, '', 'Make regional choice a governed platform capability — not a one-time prediction', { tw: 7.4, ts: 24, lede: 'Adding an Azure region shouldn’t mean starting another landing-zone project. If you already run Azure landing zones, most of what a new region needs already exists: the governance, identity, policy, automation, and operating model. Reuse that foundation so additional regions become qualified options that workloads can use selectively.', lh: 1.5, lx: 8.2, lw: 4.53, ls: 12 });
    L.box(s, 0.6, 2.1, 12.13, 0.85, { fill: C.b50, r: 0.12 });
    L.box(s, 0.6, 2.1, 0.07, 0.85, { fill: C.b600, r: 0 });
    L.txt(s, 'The objective is not to prebuild every capability everywhere. It is to keep one operating model, qualify regional options against known business and workload requirements, and enable only the platform capabilities that each region needs.', 0.9, 2.1, 11.6, 0.85, { fontSize: 14, fontFace: F.semi, color: C.b800, valign: 'middle' });
    L.txt(s, 'The approach at a glance', 0.6, 3.1, 6, 0.3, { fontSize: 15, fontFace: F.semi, color: C.ink, valign: 'middle' });
    const cards = [
      ['layers', C.b600, C.wash, 'Extend, do not replicate', 'The landing-zone operating model stays consistent across the Azure estate. New regions add only the **most efficient platform capabilities** required by the workloads expected to use them, rather than replicating an existing regional footprint.'],
      ['search', C.b700, C.wash, 'Qualify regions against defined requirements', 'Four checks: business and geography, data and compliance, workload requirements and dependencies, and regional capability and availability. Qualification creates a **governed regional option**; it does not permanently approve the region for every workload.'],
      ['app', C.t600, C.t50, 'Plan by workload requirements, not individual applications', 'Workload Landing Zone archetypes provide a planning abstraction for recurring connectivity and dependency requirements. Archetypes describe **what applications require**; connectivity profiles describe **what the platform provides**.'],
    ];
    cards.forEach(([ic, c, bg, t, d], i) => {
      const x = 0.6 + i * 4.1, y = 3.5, w = 3.93, h = 3.3;
      L.box(s, x, y, w, h, { fill: bg, r: 0.12 });
      L.badge(s, ic, x + 0.22, y + 0.2, 0.46, c);
      L.txt(s, t, x + 0.22, y + 0.82, w - 0.44, 0.52, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'top', lineSpacingMultiple: 0.95 });
      L.txt(s, rich(d), x + 0.22, y + 1.42, w - 0.44, h - 1.52, { fontSize: 12, color: C.text, lineSpacingMultiple: 1.05 });
    });
    s.addNotes('Many Azure estates are designed around a fixed primary and disaster-recovery region pair. This approach extends Azure landing-zone principles so additional regions become qualified options that workloads can use selectively. Regional qualification applies four checks: business and geography, data and compliance, workload requirements and dependencies, and regional capability and availability. A region can remain excluded, conditional, or qualified based on documented evidence, constraints, owners, and revalidation triggers. Archetypes describe what applications require; connectivity profiles describe what the platform provides; the relationship is intentionally not one-to-one.');
  }

  // ───────────────────────── 4 · What adding a region involves
  {
    const s = L.slide('summary');
    L.header(s, '', 'What adding a region involves', { tw: 7.3, ts: 24, lede: 'A new region is often assumed to be a large project. With this approach, it is a short series of decisions and a targeted change to the platform you already run.', lx: 8.3, lw: 4.43, ls: 12 });
    const R = [
      ['A new region needs its own landing-zone design.', 'Reuse the existing landing zone. The region is added to the policies, automation, and monitoring you already run.'],
      ['Every region needs a full hub.', 'Start with the most efficient connectivity profile that meets the requirements. Two of the four profiles need no local hub.'],
      ['Every region needs another ExpressRoute circuit.', 'Reuse existing hybrid connectivity where reachability and resiliency requirements allow. Add circuits only when a requirement justifies them.'],
      ['Enabling a region means migrating workloads.', 'Nothing has to move. Workloads use the region when their own requirements call for it.'],
      ['Qualification is a long assessment.', 'It is four checks, each with one question, answered from what your teams already know. Unknowns are recorded and revisited, not treated as blockers.'],
    ];
    const tx = 0.6, tw = 12.13, qw = 4.5, ty = 1.75, rh = 0.72, pitch = 0.78;
    L.txt(s, 'COMMON ASSUMPTION', tx + 0.2, ty, qw, 0.26, { fontSize: 10, bold: true, color: C.muted, charSpacing: 2, valign: 'middle' });
    L.txt(s, 'WITH THIS APPROACH', tx + qw + 0.3, ty, 4, 0.26, { fontSize: 10, bold: true, color: C.muted, charSpacing: 2, valign: 'middle' });
    R.forEach(([q, a], i) => {
      const y = ty + 0.34 + i * pitch;
      L.box(s, tx, y, qw, rh, { fill: C.w50, r: 0.08 });
      L.icon(s, 'x', tx + 0.18, y + rh / 2 - 0.1, 0.2, 'o');
      L.txt(s, q, tx + 0.52, y, qw - 0.65, rh, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.box(s, tx + qw + 0.08, y, tw - qw - 0.08, rh, { fill: 'FFFFFF', line: C.line, r: 0.08 });
      L.icon(s, 'check', tx + qw + 0.28, y + rh / 2 - 0.1, 0.2, 'g');
      L.txt(s, a, tx + qw + 0.64, y, tw - qw - 0.84, rh, { fontSize: 12.5, color: C.text, valign: 'middle' });
    });
    L.box(s, 0.6, 6.1, 12.13, 0.7, { fill: C.s800, r: 0.12 });
    L.txt(s, [{ text: 'The first additional region takes the most thought, ', options: { fontFace: F.semi } }, { text: 'because the decisions are made for the first time. Later regions reuse those decisions and become mostly configuration.' }], 0.85, 6.1, 11.6, 0.7, { fontSize: 14, color: 'FFFFFF', valign: 'middle' });
    s.addNotes('Adding an Azure region should not mean starting another landing-zone project. The table contrasts five common assumptions with this approach: reuse the existing landing zone, start with the most efficient connectivity profile, reuse hybrid connectivity where requirements allow, move nothing until a workload calls for the region, and treat qualification as four checks answered from what teams already know. The first additional region takes the most thought because the decisions are made for the first time; later regions reuse them.');
  }

  // ───────────────────────── 5 · How it works — the five parts
  {
    const s = L.slide('summary');
    L.header(s, '', 'How it works', { tw: 7, lede: 'The framework has five parts. Each part answers one question.', lx: 8.3, lw: 4.43, ls: 14, lh: 0.8 });
    const cols = { num: 0.75, name: 1.4, q: 3.85, sum: 6.85, st: 10.95 };
    L.txt(s, 'PART', cols.name, 1.55, 2, 0.24, { fontSize: 10, bold: true, color: C.muted, charSpacing: 2, valign: 'middle' });
    L.txt(s, 'QUESTION', cols.q, 1.55, 2.8, 0.24, { fontSize: 10, bold: true, color: C.muted, charSpacing: 2, valign: 'middle' });
    L.txt(s, 'WHAT IT COVERS', cols.sum, 1.55, 3.9, 0.24, { fontSize: 10, bold: true, color: C.muted, charSpacing: 2, valign: 'middle' });
    L.txt(s, 'REGION IS THEN', cols.st, 1.55, 1.78, 0.24, { fontSize: 10, bold: true, color: C.muted, charSpacing: 2, valign: 'middle' });
    const stateTone = { qualified: [C.g100, C.g600], selected: [C.b100, C.b700], 'ready for workloads': [C.b100, C.b700], 'in use': [C.t100, C.t700] };
    const rh = 0.9, pitch = 0.97, y0 = 1.9;
    D.parts.forEach((p, i) => {
      const y = y0 + i * pitch;
      L.box(s, 0.6, y, 12.13, rh, { fill: i % 2 ? C.wash : C.b50, r: 0.1 });
      L.num(s, p.n, cols.num, y + rh / 2 - 0.23, 0.46, i === 4 ? C.t600 : C.b600, 'FFFFFF', 15);
      L.txt(s, p.name, cols.name, y, 2.3, rh, { fontSize: 16, fontFace: F.semi, color: C.ink, valign: 'middle', lineSpacingMultiple: 0.95 });
      L.txt(s, p.question, cols.q, y, 2.85, rh, { fontSize: 12.5, fontFace: F.semi, color: i === 4 ? C.t700 : C.b700, valign: 'middle', lineSpacingMultiple: 0.95 });
      L.txt(s, p.summary, cols.sum, y, 3.95, rh, { fontSize: 12, color: C.text, valign: 'middle', lineSpacingMultiple: 0.95 });
      if (p.state) { const [f, c] = stateTone[p.state] || [C.b100, C.b700]; L.chip(s, p.state, cols.st, y + rh / 2 - 0.16, { w: 1.66, h: 0.32, size: 10.5, fill: f, color: c }); }
    });
    s.addNotes('The framework has five parts, and each part answers one question. Part 1 explains the concepts: four connectivity profiles describe the platform options and four archetypes describe what applications require. Part 2 qualifies regions with four checks that lead to one of four outcomes. Part 3 selects the regional design through three choices; the region is then selected. Part 4 prepares the region by building only what the selected design calls for; the region is then ready for workloads. Part 5 places workloads one at a time, with current evidence; the region is then in use.');
  }

  // ───────────────────────── 6 · Executive summary, continued
  {
    const s = L.slide('summary');
    L.header(s, 'Continued', 'Choose efficient connectivity, keep readiness and placement separate, keep one operating model', { tw: 11, ts: 24 });
    const cards = [
      ['hub', C.v600, C.wash, 'Choose the most efficient regional connectivity', 'Profiles range from **Disconnected Spokes** through **Remote Hub Connected** and **Minimal Regional Hub** to a **Full Regional Hub**. They are not maturity stages. Select the **most efficient profile** for current requirements, and add local capabilities only when a measurable need justifies them.'],
      ['route', C.t700, C.t50, 'Keep platform readiness and workload placement separate', 'Qualification determines whether a region can become a viable platform option. Placement happens later, when a specific workload and its current requirements are known. Placement, relocation, recovery, and multi-region operation remain **workload-specific decisions**.'],
      ['shield', C.s800, C.wash, 'Keep the operating model consistent while allowing regional adaptation', 'The operating model stays consistent across regions; implementation can vary where business, workload, or regulatory requirements call for it. **Region-agnostic does not mean region-random.** Choice operates within qualified options, documented constraints, and current evidence.'],
    ];
    cards.forEach(([ic, c, bg, t, d], i) => {
      const x = 0.6 + i * 4.1, y = 1.75, w = 3.93, h = 3.85;
      L.box(s, x, y, w, h, { fill: bg, r: 0.12 });
      L.badge(s, ic, x + 0.22, y + 0.2, 0.46, c);
      L.txt(s, t, x + 0.22, y + 0.82, w - 0.44, 0.7, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'top', lineSpacingMultiple: 0.95 });
      L.txt(s, rich(d), x + 0.22, y + 1.6, w - 0.44, h - 1.7, { fontSize: 12.5, color: C.text, lineSpacingMultiple: 1.05 });
    });
    L.image(s, IMG('band.jpg', L.tone), { x: 0.6, y: 5.8, w: 12.13, h: 1.0 }, 'Decorative gradient band behind the goal statement', { sizing: { type: 'cover', w: 12.13, h: 1.0 } });
    L.txt(s, 'THE GOAL', 0.85, 5.8, 1.3, 1.0, { fontSize: 10.5, bold: true, color: 'FFFFFF', charSpacing: 2, valign: 'middle' });
    L.txt(s, [{ text: 'The goal is not to select the perfect two regions. ', options: { fontFace: F.light } }, { text: 'It is to make additional regions significantly easier to adopt when business and workload requirements justify them.', options: { fontFace: F.semi } }], 2.2, 5.8, 10.3, 1.0, { fontSize: 18, color: 'FFFFFF', valign: 'middle' });
    s.addNotes('Connectivity profiles are not maturity stages: select the most efficient profile for current requirements and add local capabilities only when a measurable need justifies them. Strategic geographic hubs and shared services can continue to support other regions where dependencies and service characteristics permit. Qualification makes a region a viable option; placement is decided later for each workload, and new workload findings can feed back into qualification. The operating model stays consistent while placement, profiles, shared-service footprints, services and SKUs, and resiliency choices adapt to current requirements.');
  }
};
