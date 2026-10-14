const path = require('path');
const { C, F, IMG } = require('../lib');

const rich = (str, o = {}) => str.split('**').map((t, i) => ({ text: t, options: Object.assign({}, o, i % 2 ? { bold: true, color: C.ink } : {}) })).filter(r => r.text);
// Advance widths of printable ASCII (from space) in the preview font's bold weight, per 1000 em; sizes chips to their text
const BOLD_EM = [260, 286, 472, 646, 572, 901, 750, 266, 339, 339, 545, 572, 285, 322, 285, 413, 572, 572, 572, 572, 572, 572, 572, 572, 572, 572, 285, 285, 572, 572, 572, 477, 897, 690, 672, 637, 740, 560, 549, 724, 765, 331, 331, 664, 565, 943, 813, 796, 628, 796, 660, 551, 579, 756, 650, 967, 667, 624, 579, 331, 413, 331, 572, 411, 362, 604, 633, 514, 633, 591, 387, 565, 657, 305, 305, 620, 305, 982, 657, 619, 633, 633, 454, 497, 434, 657, 569, 856, 578, 569, 488, 394, 551, 394, 572];
const boldIn = (t, pt) => [...t].reduce((w, ch) => w + (BOLD_EM[ch.charCodeAt(0) - 32] || 600), 0) / 1000 * pt / 72;
// pill width at a given label size (Segoe UI bold, with the preview font's extra width)
const cw = (t, size = 10.5) => t.length * (size * 0.0072) + 0.3;

module.exports = (pres, L) => {
  // ───────────────────────── Drivers (the published figure, drawn with native shapes)
  {
    const s = L.slide('overview');
    const D = L.data, FIG = D.driversFigure;
    L.header(s, 'What starts the conversation', FIG.title, { tw: 12.1 });
    L.txt(s, FIG.captionRight.toUpperCase(), 6.5, 0.42, 6.23, 0.25, { fontSize: 9.5, bold: true, color: C.faint, charSpacing: 2, align: 'right' });

    // tone -> tile, connector, chip fill, chip text (violet text uses v700 on v100; v600 on v50 is only 4.1:1)
    const TONE = {
      b: [C.b600, C.b500, C.b100, C.b700], w: [C.w600, C.w600, C.w100, C.w600], v: [C.v600, C.v600, C.v100, C.v700],
      n: [C.b800, C.b800, C.s100, C.b800], s: [C.s800, C.s600, C.s100, C.s800], t: [C.t600, C.t600, C.t100, C.t700],
    };
    const chipW = t => boldIn(t, 9.5) + 0.26;                  // text width in the preview font (wider than Segoe UI) plus padding
    const top = 1.4, ch = 1.34, gapY = 0.07, cw = 4.75, inner = 0.12;
    const hx = 6.667, hy = top + (3 * ch + 2 * gapY) / 2, haloR = 0.78, discR = 0.68;

    // hub
    L.oval(s, hx - haloR, hy - haloR, haloR * 2, { fill: C.b50, line: C.b200 });
    L.oval(s, hx - discR, hy - discR, discR * 2, { fill: C.b700 });
    L.icon(s, 'network', hx - 0.14, hy - 0.5, 0.28, 'w');
    L.txt(s, FIG.hub.join('\n'), hx - 0.6, hy - 0.2, 1.2, 0.72, { fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', valign: 'top', lineSpacingMultiple: 0.95 });

    // six driver cards and the connector from each to the hub
    D.drivers.forEach((d, i) => {
      const left = i < 3, row = i % 3, [tile, line, cbg, cfg] = TONE[d.tone];
      const x0 = left ? 0.6 : 12.73 - cw, y0 = top + row * (ch + gapY), cy = y0 + ch / 2;
      const px = left ? x0 + cw : x0, sgn = left ? 1 : -1;
      // connector: from the card edge to the halo, arriving radially (top card from above, bottom card from below)
      const ang = (1 - row) * 44 * Math.PI / 180, ux = sgn * Math.cos(ang), uy = Math.sin(ang);
      const tx = hx - ux * (haloR + 0.03), ty = hy - uy * (haloR + 0.03);
      L.line(s, px, cy, tx, ty, { color: line, w: 1.4 });
      // card
      L.box(s, x0, y0, cw, ch, { fill: 'FFFFFF', line: C.line, r: 0.1 });
      L.oval(s, px - 0.05, cy - 0.05, 0.1, { fill: line, line: 'FFFFFF', lw: 1 });
      L.badge(s, d.icon, x0 + inner, y0 + 0.1, 0.34, tile, 'w', 0.09);
      L.txt(s, d.name, x0 + inner + 0.44, y0 + 0.07, cw - inner - 0.54, 0.4, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle', lineSpacingMultiple: 0.9 });
      d.triggers.forEach((row2, r) => {
        let cx = x0 + inner;
        row2.forEach(t => { const w = chipW(t); L.chip(s, t, cx, y0 + 0.52 + r * 0.26, { w, h: 0.22, size: 9.5, fill: cbg, color: cfg }); cx += w + 0.05; });
      });
    });

    // hub -> "Drivers open the discussion" -> "What decides the outcome"
    const yo = top + 3 * ch + 2 * gapY + 0.1, bh = 0.34, yn = yo + bh + 0.1;
    L.line(s, hx, hy + haloR + 0.03, hx, yo - 0.02, { color: C.b600, w: 1.4 });
    L.box(s, 0.6, yo, 12.13, bh, { fill: C.b600, r: 0.09 });
    L.icon(s, 'flag', 0.78, yo + 0.07, 0.2, 'w');
    L.txt(s, [{ text: FIG.openTitle, options: { fontFace: F.semi, fontSize: 12, color: 'FFFFFF' } }, { text: '   ' + FIG.openText, options: { fontSize: 11, color: C.b100 } }], 1.12, yo, 11.4, bh, { valign: 'middle' });
    L.line(s, hx, yo + bh + 0.01, hx, yn - 0.01, { color: C.b600, w: 1.4 });
    L.box(s, 0.6, yn, 12.13, bh, { fill: C.b50, line: C.b200, r: 0.09 });
    L.icon(s, 'route', 0.78, yn + 0.07, 0.2, 'b');
    L.txt(s, FIG.nextTitle, 1.12, yn, 3, bh, { fontSize: 12, fontFace: F.semi, color: C.b700, valign: 'middle' });
    const steps = D.parts.slice(1).map(p => p.name), sw = steps.map(t => boldIn(t, 10) + 0.34), sg = 0.34;
    let sx = 12.73 - 0.1 - sw.reduce((a, b) => a + b, 0) - sg * (steps.length - 1);
    steps.forEach((t, k) => {
      if (k) { L.line(s, sx - sg + 0.07, yn + bh / 2, sx - 0.05, yn + bh / 2, { color: C.b500, w: 1.4 }); }
      L.chip(s, t, sx, yn + (bh - 0.24) / 2, { w: sw[k], h: 0.24, size: 10, fill: 'FFFFFF', line: k === steps.length - 1 ? C.t300 : C.b200, color: k === steps.length - 1 ? C.t700 : C.b700 });
      sx += sw[k] + sg;
    });

    // scope note
    L.txt(s, [{ text: 'SCOPE   ', options: { bold: true, color: C.b700, charSpacing: 2, fontSize: 9 } }, { text: 'Azure public-cloud regions. Sovereign cloud offerings and Azure Local are not covered. They have their own constraints, although the same qualification logic can inform them.', options: { color: C.muted } }], 0.6, yn + bh + 0.1, 12.13, 0.34, { fontSize: 10 });
    s.addNotes('Multi-region platform work rarely starts as an architecture initiative. It usually starts with a change in the business, regulation, workload requirements, service availability, or risk. These drivers are typical patterns observed across enterprise estates: business growth and proximity; data residency, sovereignty, and regulation; service, AI model, SKU, and quota availability; resiliency and concentration risk; datacenter and connectivity events; and cost and operating model. They open the discussion; they do not determine the regional architecture or the workload-placement outcome. The outcome is decided by qualifying regions, selecting the regional design, preparing the region, and placing workloads. The same qualification logic can inform sovereign cloud offerings and Azure Local, but those have their own constraints and are not covered here.');
  }

  // ───────────────────────── Fixed pair vs governed options
  {
    const s = L.slide('overview');
    L.header(s, '', 'Extend Azure landing zones for adaptable regional placement', { tw: 8, lede: 'The same operating model applies across the estate, while each region is qualified against the workloads it may need to support.', lx: 8.9, lw: 3.83 });
    // left panel: fixed pair
    L.box(s, 0.6, 1.85, 4.3, 4.45, { fill: C.wash, r: 0.14 });
    L.txt(s, 'A fixed regional pair', 0.85, 2.0, 2.6, 0.32, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle' });
    L.txt(s, 'TRADITIONAL', 3.45, 2.04, 1.25, 0.25, { fontSize: 10, bold: true, color: C.faint, align: 'right', charSpacing: 2 });
    [['Primary region', 0.85], ['DR region', 2.85]].forEach(([n, x]) => {
      L.box(s, x, 2.45, 1.8, 1.85, { fill: 'FFFFFF', line: C.b300, dash: 'dash', r: 0.1 });
      L.icon(s, 'pin', x + 0.12, 2.55, 0.2, 'b');
      L.txt(s, n, x + 0.38, 2.52, 1.4, 0.26, { fontSize: 10.5, bold: true, color: C.b700, valign: 'middle' });
      [['Workloads', C.t600, 'FFFFFF'], ['Shared services', C.b100, C.b800], ['Hub & connectivity', C.b600, 'FFFFFF']].forEach(([t, f, c], j) => {
        L.box(s, x + 0.12, 2.95 + j * 0.45, 1.56, 0.37, { fill: f, r: 0.06 });
        L.txt(s, t, x + 0.12, 2.95 + j * 0.45, 1.56, 0.37, { fontSize: 10, bold: true, color: c, align: 'center', valign: 'middle' });
      });
    });
    L.line(s, 2.67, 3.6, 2.83, 3.6, { color: C.faint, both: true, w: 1 });
    L.txt(s, 'Mirrored infrastructure', 0.85, 4.38, 3.8, 0.26, { fontSize: 11, color: C.muted, align: 'center', valign: 'middle' });
    L.txt(s, 'EVOLVING REGIONAL CONDITIONS', 0.85, 4.75, 3.8, 0.24, { fontSize: 10, bold: true, color: C.w600, charSpacing: 2 });
    let cx = 0.85; ['Business expansion', 'Data boundaries'].forEach(t => { const w = cw(t); L.chip(s, t, cx, 5.04, { fill: C.w100, color: C.w600, size: 10.5, w, h: 0.28 }); cx += w + 0.08; });
    cx = 0.85; ['Service & AI availability', 'Latency'].forEach(t => { const w = cw(t); L.chip(s, t, cx, 5.38, { fill: C.w100, color: C.w600, size: 10.5, w, h: 0.28 }); cx += w + 0.08; });
    L.txt(s, 'Works while demand is predictable; less adaptable as conditions evolve.', 0.85, 5.74, 3.85, 0.45, { fontSize: 11, color: C.muted });
    // arrow
    L.line(s, 5.0, 3.85, 5.6, 3.85, { color: C.b600, w: 2 });
    L.txt(s, 'Extend,\nnot\nreplicate', 4.9, 3.95, 0.85, 0.7, { fontSize: 10.5, bold: true, color: C.b700, align: 'center' });
    // right panel: adaptable platform
    L.box(s, 5.75, 1.85, 6.98, 4.45, { fill: C.b50, r: 0.14 });
    L.txt(s, 'An adaptable multi-region platform', 6.0, 2.0, 4, 0.32, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle' });
    L.txt(s, 'REGIONS AS QUALIFIED OPTIONS', 9.6, 2.04, 2.95, 0.25, { fontSize: 10, bold: true, color: C.b600, align: 'right', charSpacing: 1 });
    const regs = [
      ['Region A', 2.0, [['Workloads', C.t600, 'FFFFFF'], ['Shared', C.b100, C.b800], ['Full hub', C.b600, 'FFFFFF']], 'Strategic hub'],
      ['Region B', 2.0, [['Workloads', C.t600, 'FFFFFF'], ['Shared', C.b100, C.b800], ['Full hub', C.b600, 'FFFFFF']], 'Strategic hub'],
      ['Region C', 1.55, [['Workloads', C.t600, 'FFFFFF'], ['Minimal hub', 'FFFFFF', C.b700, C.b300]], 'Minimal hub'],
      ['Region D', 1.2, [['Spokes', C.t600, 'FFFFFF']], 'Remote hub', 'via remote hub'],
      ['Region E', 1.0, [['Disconnected spokes', C.t100, C.t700]], 'Disconnected spokes'],
      ['Region F', 0.75, [], 'Not enabled', 'Candidate'],
    ];
    const base = 5.12, rw = 1.07, gap = 0.06;
    regs.forEach(([n, h, blocks, lab, extra], i) => {
      const x = 5.92 + i * (rw + gap), y = base - h;
      L.box(s, x, y, rw, h, { fill: 'FFFFFF', line: i === 5 ? C.b500 : C.b300, dash: 'dash', r: 0.08 });
      L.icon(s, 'pin', x + 0.07, y + 0.08, 0.16, 'b');
      L.txt(s, n, x + 0.26, y + 0.05, 0.8, 0.22, { fontSize: 10, bold: true, color: C.b700, valign: 'middle' });
      let by = base - 0.1;
      blocks.slice().reverse().forEach(([t, f, c, ln]) => {
        const bh = t.length > 12 && t !== 'Minimal hub' ? 0.46 : 0.3;
        by -= bh;
        L.box(s, x + 0.07, by, rw - 0.14, bh, { fill: f, line: ln, r: 0.05 });
        L.txt(s, t, x + 0.07, by, rw - 0.14, bh, { fontSize: 9.5, bold: true, color: c, align: 'center', valign: 'middle' });
        by -= 0.06;
      });
      if (extra) L.txt(s, extra, x, blocks.length ? by - 0.2 : base - 0.42, rw, 0.22, { fontSize: 9.5, bold: true, color: C.b600, align: 'center', valign: 'middle' });
      L.txt(s, lab, x - 0.04, base + 0.07, rw + 0.08, 0.22, { fontSize: 10, color: C.muted, align: 'center', valign: 'middle' });
    });
    L.box(s, 5.92, 5.5, 6.72, 0.66, { fill: C.s800, r: 0.08 });
    L.txt(s, 'One consistent, governed Azure landing-zone foundation', 6.12, 5.53, 6.4, 0.3, { fontSize: 12.5, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    L.txt(s, 'Identity · Connectivity · Security · Management · Application delivery', 6.12, 5.83, 6.4, 0.25, { fontSize: 10.5, color: 'C9D4E2', valign: 'middle' });
    L.caption(s, 'Figure', 'Regional capability is a spectrum, not a copy: the platform extends one governed foundation and gives each region only what its workloads require.', 0.6, 6.42, 12.1);
    s.addNotes('Azure landing zones provide a governed foundation for identity, connectivity, security, management, and application delivery. Many organizations establish it around a fixed primary and disaster-recovery region, reflecting datacenter and colocation design. That works while demand and placement requirements remain predictable, but becomes less adaptable as business expansion, data boundaries, service and AI availability, latency requirements, and other regional conditions evolve. An adaptable multi-region platform extends Azure landing zones without creating separate governance structures or identical infrastructure in every region. The same operating model applies across the estate, while each region is qualified against the workloads it may need to support. Because platform teams cannot predict every future workload, the guidance uses three planning constructs.');
  }

  // ───────────────────────── Three planning constructs
  {
    const s = L.slide('overview');
    L.header(s, '', 'Three constructs balance advance planning with flexibility', { tw: 8.2, lede: 'Platform teams cannot predict every future workload. Plan for what is known, stay flexible for what is not.', lx: 9.2, lw: 3.53 });
    L.txt(s, 'PLATFORM READINESS · ADVANCE PLANNING', 0.6, 1.72, 6, 0.24, { fontSize: 10.5, bold: true, color: C.b600, charSpacing: 2 });
    const cards = [
      ['hub', C.v600, 'Regional Platform Connectivity Profiles', 'Describe **what the platform provides** to support those archetypes in a region.', [['Disconnected spokes', C.b100, C.b700], ['Remote hub', C.b100, C.b700], ['Minimal hub', C.b100, C.b700], ['Full hub', C.b100, C.b700]], C.line],
      ['app', C.t600, 'Workload Landing Zone Archetypes', 'Describe **what applications require**: recurring dependency and connectivity characteristics.', [['Hybrid-connected', C.t100, C.t700], ['Isolated', C.t100, C.t700], ['Connected', C.t100, C.t700], ['Portfolios', C.t100, C.t700]], C.t300],
      ['search', C.b600, 'Regional Qualification', 'Evaluates candidate regions against four checks for defined workload requirements.', [['Excluded', C.w100, C.w600], ['Candidate', 'FFFFFF', C.b700, C.b500], ['Conditional', C.a100, C.a700], ['Qualified', C.g100, C.g600]], C.line],
    ];
    cards.forEach(([ic, c, t, d, chips, ln], i) => {
      const x = 0.6 + i * 4.1, y = 2.04, w = 3.93, h = 2.4;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: ln, r: 0.12, shadow: true });
      L.badge(s, ic, x + 0.22, y + 0.2, 0.46, c);
      L.txt(s, t, x + 0.82, y + 0.16, w - 1.0, 0.54, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle', lineSpacingMultiple: 0.95 });
      L.txt(s, rich(d), x + 0.22, y + 0.82, w - 0.44, 0.75, { fontSize: 12, color: C.text, lineSpacingMultiple: 1.05 });
      let px = x + 0.22, py = y + 1.65;
      chips.forEach(([ct, f, cc, ch]) => {
        const pw = cw(ct);
        if (px + pw > x + w - 0.15) { px = x + 0.22; py += 0.34; }
        L.chip(s, ct, px, py, { fill: f, color: cc, line: ch, dash: ch ? 'dash' : undefined, size: 10.5, w: pw, h: 0.28 });
        px += pw + 0.07;
      });
    });
    L.line(s, 2.56, 4.44, 2.56, 4.7, { color: C.b600 }); L.line(s, 6.66, 4.44, 6.66, 4.7, { color: C.t600 }); L.line(s, 10.77, 4.44, 10.77, 4.7, { color: C.b600 });
    L.box(s, 0.6, 4.7, 12.13, 0.74, { fill: C.b600, r: 0.1 });
    L.icon(s, 'pin', 0.85, 4.92, 0.3, 'w');
    L.txt(s, 'Governed regional options', 1.35, 4.74, 11, 0.3, { fontSize: 14, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    L.txt(s, 'Qualified regions with a known connectivity profile, documented constraints, ownership, and review triggers — not predetermined placement', 1.35, 5.04, 11.2, 0.34, { fontSize: 12, color: C.b100, valign: 'middle' });
    L.line(s, 6.66, 5.44, 6.66, 5.82, { color: C.t600 });
    L.txt(s, 'WORKLOAD ADOPTION · AT ONBOARDING', 0.6, 5.52, 5, 0.24, { fontSize: 10.5, bold: true, color: C.t600, charSpacing: 2 });
    L.box(s, 0.6, 5.82, 12.13, 0.72, { fill: C.t50, line: C.t300, r: 0.1 });
    L.icon(s, 'app', 0.85, 6.03, 0.3, 't');
    L.txt(s, 'Revalidate against the application', 1.35, 5.82, 2.5, 0.72, { fontSize: 13, fontFace: F.semi, color: C.t700, valign: 'middle', lineSpacingMultiple: 0.95 });
    let qx = 4.0, qy = 5.88;
    ['Remain in place', 'Net-new in another region', 'Relocate', 'Recover elsewhere', 'Operate across active regions'].forEach((t, i) => {
      const w = cw(t);
      if (i === 3) { qx = 4.0; qy = 6.18; }
      L.chip(s, t, qx, qy, { fill: 'FFFFFF', color: C.t700, line: C.t300, size: 10.5, w, h: 0.28 }); qx += w + 0.1;
    });
    L.caption(s, 'Figure', 'Archetypes (application requirements) and profiles (platform capability) stay distinct. Migration and resiliency remain workload-specific decisions.', 0.6, 6.62, 12.1);
    s.addNotes('Regional Platform Connectivity Profiles describe what the platform provides in a region: Disconnected Spokes, Remote Hub Connected, Minimal Regional Hub, or Full Regional Hub. The most efficient profile can remain the target as long as it continues to satisfy requirements. Workload Landing Zone Archetypes group workloads by recurring dependency and connectivity characteristics. Regional Qualification is a repeatable way to assess candidate regions through four checks: business and geography, data and compliance, workload requirements and dependencies, and regional capability and availability. The result is an excluded, candidate, conditional, or qualified regional option, backed by current evidence, known constraints, ownership, and review triggers. During onboarding, teams revalidate options against the application and decide whether it remains in place, uses another region for net-new deployment, relocates, recovers elsewhere, or operates across active regions.');
  }

  // ───────────────────────── Progressive adoption journey
  {
    const s = L.slide('overview');
    L.header(s, '', 'Establish regional options first — then use and expand them as workload needs justify', { tw: 8.4, lede: 'Recommended sequence, not a mandatory maturity path. Platform capabilities and workload use evolve only when business and application requirements justify them.', lx: 9.3, lw: 3.43 });
    const steps = [
      ['1', 'Extend the platform', 'Qualify additional regions and establish the most efficient platform capabilities required.', ['Assess regional suitability', 'Establish connectivity options', 'Enable foundational services'], 'Create regional options', 'layers'],
      ['2', 'Place net-new growth', 'Direct suitable new workloads and deployment waves to qualified regions.', ['Prioritize new workloads', 'Use qualified regions', 'Deploy in waves'], 'Grow with intent', 'app'],
      ['3', 'Selectively rebalance', 'Redeploy movable workloads when doing so creates a clear portfolio benefit.', ['Identify eligible workloads', 'Migrate or relocate selectively', 'Optimize cost, performance, or compliance'], 'Optimize where it makes sense', 'route'],
      ['4', 'Improve workload resiliency', 'Use the regional foundation for active/passive recovery and, where justified, active-active.', ['Implement recovery deployments', 'Adopt active-active where needed', 'Leverage regional capabilities'], 'Add resiliency when required', 'shield'],
    ];
    steps.forEach(([n, t, d, bl, foot, ic], i) => {
      const x = 0.6 + i * 3.1, y = 1.9, w = 2.85, h = 4.1;
      L.box(s, x, y, w, h, { fill: C.wash, r: 0.12 });
      L.num(s, n, x + 0.2, y + 0.2, 0.44, C.b100, C.b700, 15);
      L.txt(s, t, x + 0.75, y + 0.18, w - 0.9, 0.5, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle', lineSpacingMultiple: 0.95 });
      L.txt(s, d, x + 0.2, y + 0.82, w - 0.4, 1.0, { fontSize: 12, color: C.text, lineSpacingMultiple: 1.02 });
      L.badge(s, ic, x + w / 2 - 0.3, y + 1.62, 0.6, i === 3 ? C.t600 : C.b600, 'w', 0.3);
      L.bullets(s, bl, x + 0.2, y + 2.4, w - 0.4, 1.15, { gap: 3, opts: { fontSize: 11, lineSpacingMultiple: 1.0 } });
      L.box(s, x, y + h - 0.42, w, 0.42, { fill: C.b100, r: 0.12 });
      L.box(s, x, y + h - 0.42, w, 0.2, { fill: C.b100, r: 0 });
      L.txt(s, foot.toUpperCase(), x + 0.2, y + h - 0.42, w - 0.25, 0.42, { fontSize: 10.5, bold: true, color: C.b700, charSpacing: 0, valign: 'middle' });
      if (i < 3) L.line(s, x + w + 0.03, y + 1.92, x + 3.07, y + 1.92, { color: C.b300, w: 1.5 });
    });
    L.line(s, 0.6, 6.17, 12.73, 6.17, { color: C.b500, w: 2.5 });
    L.txt(s, 'PLATFORM READINESS', 0.6, 6.24, 4, 0.24, { fontSize: 10.5, bold: true, color: C.b600, charSpacing: 2 });
    L.txt(s, 'SELECTIVE WORKLOAD USE', 8.7, 6.24, 4.03, 0.24, { fontSize: 10.5, bold: true, color: C.t600, charSpacing: 2, align: 'right' });
    L.caption(s, 'Figure', 'A progressive journey: regional options are created first and consumed selectively. A platform can stop at any step that continues to meet requirements.', 0.6, 6.56, 12.1);
    s.addNotes('Together, the constructs create governed regional options without predetermining workload placement. During onboarding, teams revalidate the region against the workload’s current dependencies and requirements, then decide whether to stay put, deploy net-new, relocate, recover elsewhere, or operate across regions. Migration and resiliency remain workload-specific. The journey is a recommended sequence, not a mandatory maturity path, and a platform can stop at any step that continues to meet requirements.');
  }
};
