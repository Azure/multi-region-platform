const { C, F, IMG } = require('../lib');
const SEC = '03 · REGIONAL QUALIFICATION';

module.exports = (pres, L) => {
  const dimnav = (s, on) => {
    ['Business and geography', 'Data and compliance', 'Workload requirements', 'Regional capability', 'Platform and connectivity'].forEach((t, i) => {
      const x = 0.6 + i * 2.448, w = 2.33, act = i + 1 === on, done = i + 1 < on;
      L.box(s, x, 0.38, w, 0.34, { fill: act ? C.b600 : done ? C.b50 : C.wash, r: 0.06 });
      L.num(s, i + 1, x + 0.08, 0.435, 0.23, act ? 'FFFFFF' : 'FFFFFF', act ? C.b600 : done ? C.b600 : C.faint, 9);
      L.txt(s, t, x + 0.38, 0.38, w - 0.42, 0.34, { fontSize: 9.5, bold: true, color: act ? 'FFFFFF' : done ? C.b700 : C.faint, valign: 'middle' });
    });
  };
  const dimTitle = (s, n, t, q, fill = C.b600, y = 0.95, qw = 6.8) => {
    L.num(s, n, 0.6, y, 0.46, fill, 'FFFFFF', 17);
    L.txt(s, t, 1.2, y - 0.02, 7, 0.5, { fontSize: 22, fontFace: F.semi, color: C.ink, valign: 'middle' });
    if (q) L.txt(s, q, 0.6, y + 0.58, qw, 0.6, { fontSize: 14, color: fill === C.t600 ? C.t700 : C.b700 });
  };
  const decision = (s, text, x, y, w, h, tone = 'b') => {
    const bg = { b: C.b50, w: C.w50, t: C.t50 }[tone], fg = { b: C.b600, w: C.w600, t: C.t600 }[tone];
    L.box(s, x, y, w, h, { fill: bg, r: 0.1 });
    L.icon(s, tone === 'w' ? 'x' : 'check', x + 0.18, y + 0.18, 0.26, tone === 'w' ? 'o' : tone === 't' ? 't' : 'b');
    L.txt(s, 'DECISION', x + 0.56, y + 0.14, 2, 0.2, { fontSize: 8.5, bold: true, color: fg, charSpacing: 2 });
    L.txt(s, text, x + 0.56, y + 0.36, w - 0.75, h - 0.45, { fontSize: 12, color: C.ink, fontFace: F.semi });
  };

  // ───────────────────────── 9 · Section opener: five dimensions
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '03 · Multi-region platform', 'Regional Qualification Framework', { tw: 8.2, lede: 'Which Azure regions should be prepared to support workload requirements — not whether an individual workload should use multiple regions.', lx: 9.1, lw: 3.63 });
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
    L.footer(s, 0, SEC);
    s.addNotes('This framework determines which Azure regions should be prepared to support workload requirements. It does not determine whether an individual workload should use multiple regions or define its multi-region architecture — those are workload-specific design decisions. Use the five dimensions to evaluate candidate regions consistently.');
  }

  // ───────────────────────── Assessment outcome
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '03 · Regional assessment outcome', 'Classify every regional option, with evidence', { tw: 9 });
    L.txt(s, 'Consolidate the workload requirements and platform needs identified through the five dimensions. Assess each candidate region against the same criteria and document the result, key tradeoffs, and outstanding validation.', 0.6, 1.45, 5.7, 0.9, { fontSize: 11.5, color: C.text });
    [['x', 'o', C.w50, C.w600, 'Excluded', 'A mandatory requirement cannot be satisfied.'], ['clock', 'b', C.b50, C.b700, 'Candidate', 'Potentially viable; additional discovery or platform enablement is required before qualification.'], ['flag', 'o', 'FFF8E6', '8A5A00', 'Conditional', 'Current evidence supports the defined requirements if one or more documented conditions are resolved.'], ['check', 'g', C.g100, C.g600, 'Qualified as of the assessment date', 'Evidence supports the requirements, platform ownership is established, onboarding revalidation still required.']].forEach(([ic, c, bg, fg, t, d], i) => {
      const y = 2.4 + i * 0.86;
      L.box(s, 0.6, y, 5.7, 0.78, { fill: bg, r: 0.1 });
      L.oval(s, 0.75, y + 0.15, 0.48, { fill: 'FFFFFF' });
      L.icon(s, ic, 0.87, y + 0.27, 0.24, c);
      L.txt(s, [{ text: t, options: { fontFace: F.semi, fontSize: 12, color: fg, breakLine: true } }, { text: d, options: { fontSize: 9.5, color: C.text } }], 1.38, y, 4.8, 0.78, { valign: 'middle' });
    });
    L.txt(s, 'Record the evidence date, review date, workload requirements in scope, required connectivity profile, key constraints, outstanding validations, owner, and revalidation triggers.', 0.6, 5.88, 5.7, 0.6, { fontSize: 9.5, color: C.muted });
    // example grid
    const gx = 6.75, gy = 1.45;
    L.txt(s, 'Illustrative: one portfolio, classified per archetype', gx, gy, 6, 0.3, { fontSize: 12.5, fontFace: F.semi, color: C.ink });
    L.box(s, gx, gy + 0.4, 5.98, 4.0, { fill: 'FFFFFF', line: C.line, r: 0.12 });
    const cols = ['Hybrid-\nconnected', 'Isolated\ncloud-native/AI', 'Connected\ncloud-native/AI', 'Interconnected\nportfolio'];
    cols.forEach((c, j) => L.txt(s, c.toUpperCase(), gx + 1.7 + j * 1.07, gy + 0.5, 1.07, 0.45, { fontSize: 7.5, bold: true, color: C.t700, align: 'center', valign: 'bottom', charSpacing: 0.5 }));
    const rows = [['Region A', 'strategic hub region', 'qqqq'], ['Region B', 'strategic hub region', 'qqqa'], ['Region C', 'in-country, new', 'qqka'], ['Region D', 'AI model and SKU', 'xqkx'], ['Region E', 'other geography', 'xxxx']];
    const mk = { q: ['check', 'w', C.g600, null], a: ['clock', 'b', 'FFFFFF', C.b600], k: ['flag', 'o', 'FFF1CC', 'C98A00'], x: ['x', 'o', C.w100, null] };
    rows.forEach(([r, sub, m], i) => {
      const y = gy + 1.05 + i * 0.6;
      L.box(s, gx + 0.15, y - 0.04, 5.68, 0.008, { fill: C.soft, r: 0 });
      L.txt(s, [{ text: r, options: { bold: true, color: C.ink, fontSize: 10.5, breakLine: true } }, { text: sub, options: { fontSize: 8.5, color: C.muted } }], gx + 0.2, y, 1.5, 0.52, { valign: 'middle' });
      m.split('').forEach((v, j) => {
        const [ic, c, f, ln] = mk[v], cx = gx + 1.7 + j * 1.07 + 0.535;
        L.oval(s, cx - 0.17, y + 0.09, 0.34, { fill: f, line: ln, dash: v === 'a' ? 'dash' : 'solid', lw: 1.25 });
        L.icon(s, ic, cx - 0.09, y + 0.17, 0.18, c);
      });
    });
    [['Qualified', C.g600, null], ['Conditional', 'FFF1CC', 'C98A00'], ['Candidate', 'FFFFFF', C.b600], ['Excluded', C.w100, null]].forEach(([t, f, ln], i) => {
      const x = gx + 0.2 + i * 1.4; L.oval(s, x, gy + 4.07, 0.16, { fill: f, line: ln, dash: t === 'Candidate' ? 'dash' : 'solid' }); L.txt(s, t, x + 0.22, gy + 4.02, 1.1, 0.26, { fontSize: 9, color: C.muted, valign: 'middle' });
    });
    L.box(s, gx, 6.0, 5.98, 0.72, { fill: C.b50, r: 0.1 });
    L.txt(s, 'The same region can be qualified for one set of requirements, conditional or a candidate for another, and excluded for a third. Qualification is a dated planning input, not permanent approval.', gx + 0.18, 6.0, 5.65, 0.72, { fontSize: 10, color: C.ink, valign: 'middle' });
    L.footer(s, 0, SEC);
    s.addNotes('The purpose is not to certify a region for every possible workload, but to know which options are excluded, which remain candidates or conditional, and which are ready for defined workload requirements. Reuse the assessment in architecture reviews and regional planning; decision-time validation at onboarding remains authoritative. Regions and statuses shown are illustrative.');
  }

  // ───────────────────────── 10 · Dimensions 1 and 2
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    dimnav(s, 2);
    dimTitle(s, 1, 'Business and geography', 'Where do we need Azure presence?', C.b600, 1.0);
    L.txt(s, 'Start with the business reason for another region. Evaluate expected markets and users, datacenter and partner locations, planned launches or migrations, anticipated growth, proximity requirements, and geographic concentration risk.', 0.6, 2.2, 5.75, 1.1, { fontSize: 12, color: C.text });
    decision(s, 'Confirm that the region has sufficient business value to justify deeper assessment.', 0.6, 3.3, 5.75, 0.85, 'b');
    L.box(s, 6.65, 1.05, 0.012, 3.1, { fill: C.soft, r: 0 });
    L.num(s, 2, 6.95, 1.0, 0.46, C.b600, 'FFFFFF', 17);
    L.txt(s, 'Data and compliance', 7.55, 0.98, 5, 0.5, { fontSize: 22, fontFace: F.semi, color: C.ink, valign: 'middle' });
    L.txt(s, 'Are we allowed to operate here?', 6.95, 1.58, 5.7, 0.5, { fontSize: 14, color: C.b700 });
    L.txt(s, 'Can anticipated workloads and their data operate here? Consider residency and sovereignty, regulatory and industry requirements, company policy, customer commitments, support access, encryption, and restrictions on data movement or operational control.', 6.95, 2.2, 5.78, 1.1, { fontSize: 12, color: C.text });
    decision(s, 'Exclude a region when it cannot satisfy a mandatory data, compliance, or policy requirement.', 6.95, 3.3, 5.78, 0.85, 'w');
    // funnel
    const y0 = 4.55;
    L.txt(s, 'CANDIDATE REGIONS UNDER CONSIDERATION', 0.6, y0 - 0.1, 5, 0.2, { fontSize: 8.5, bold: true, color: C.muted, charSpacing: 2 });
    L.box(s, 0.6, y0 + 0.2, 3.5, 1.3, { fill: C.b50, r: 0.12 });
    for (let k = 0; k < 18; k++) L.oval(s, 0.8 + (k % 6) * 0.55 + (Math.floor(k / 6) % 2) * 0.2, y0 + 0.38 + Math.floor(k / 6) * 0.36, 0.14, { fill: C.b500 });
    L.box(s, 4.1, y0 + 0.62, 1.5, 0.46, { fill: 'FFFFFF', line: C.b600, r: 0.23 });
    L.txt(s, [{ text: 'DIMENSION 1', options: { bold: true, fontSize: 8, breakLine: true } }, { text: 'Business value?', options: { fontSize: 9 } }], 4.1, y0 + 0.62, 1.5, 0.46, { color: C.b700, align: 'center', valign: 'middle' });
    L.box(s, 5.6, y0 + 0.35, 2.8, 1.0, { fill: C.b100, r: 0.12 });
    for (let k = 0; k < 9; k++) L.oval(s, 5.8 + (k % 5) * 0.5 + (Math.floor(k / 5)) * 0.25, y0 + 0.52 + Math.floor(k / 5) * 0.4, 0.14, { fill: C.b600 });
    L.box(s, 8.4, y0 + 0.62, 1.5, 0.46, { fill: 'FFFFFF', line: C.w600, r: 0.23 });
    L.txt(s, [{ text: 'DIMENSION 2', options: { bold: true, fontSize: 8, breakLine: true } }, { text: 'Allowed here?', options: { fontSize: 9 } }], 8.4, y0 + 0.62, 1.5, 0.46, { color: C.w600, align: 'center', valign: 'middle' });
    L.box(s, 9.9, y0 + 0.5, 2.83, 0.7, { fill: C.b600, r: 0.12 });
    L.txt(s, [{ text: 'Proceed to dimensions 3–5', options: { fontFace: F.semi, fontSize: 12, breakLine: true } }, { text: 'Workload requirements · capability · platform', options: { fontSize: 9, color: 'DDEBF9' } }], 10.1, y0 + 0.5, 2.6, 0.7, { color: 'FFFFFF', valign: 'middle' });
    L.path(s, [[4.85, y0 + 1.08], [4.85, y0 + 1.72], [5.1, y0 + 1.72]], { color: C.faint, dash: 'dash' });
    L.txt(s, 'No deeper assessment — value does not justify it', 5.15, y0 + 1.6, 3.5, 0.25, { fontSize: 9.5, color: C.muted });
    L.path(s, [[9.15, y0 + 1.08], [9.15, y0 + 1.72], [9.4, y0 + 1.72]], { color: C.w600 });
    L.chip(s, 'Excluded', 9.45, y0 + 1.6, { fill: C.w100, color: C.w600, size: 9 });
    L.txt(s, 'mandatory requirement not met', 10.45, y0 + 1.6, 2.3, 0.25, { fontSize: 9.5, color: C.muted });
    L.caption(s, 'Figure', 'The first two dimensions filter the portfolio; only regions that pass both proceed to workload, capability, and platform analysis.', 0.6, 6.55, 12.1);
    L.footer(s, 0, SEC);
    s.addNotes('References — Dimension 1: Select Azure regions (Cloud Adoption Framework); Azure geographies. Dimension 2: Data residency in Azure; Azure compliance documentation; Reliability and sovereignty in Azure, which connects sovereignty requirements to regional selection, backup and replication destinations, encryption, and operational control.');
  }

  // ───────────────────────── Dimension 3
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    dimnav(s, 3);
    dimTitle(s, 3, 'Workload requirements and dependencies', null, C.t600, 1.0);
    L.txt(s, 'What workload requirements and dependencies must the region support?', 0.6, 1.58, 7.4, 0.45, { fontSize: 14, color: C.t700 });
    decision(s, 'Identify the workload-driven platform requirements that must be validated as part of regional qualification.', 8.3, 0.98, 4.43, 1.2, 't');
    const pops = [['app', 'Existing workloads', 'In Azure, on-premises, or another cloud. Inventory and architecture; validate important dependencies with owners, first for critical or representative applications.', 'solid', 2.4, 1.95], ['flag', 'Future workloads', 'Known requirements, workload patterns, intended architecture, expected dependencies; defer implementation detail to onboarding.', 'dash', 4.55, 1.3]];
    pops.forEach(([ic, t, d, dash, y, h], i) => {
      L.box(s, 0.6, y, 3.6, h, { fill: 'FFFFFF', line: C.line, dash, r: 0.1 });
      L.icon(s, ic, 0.78, y + 0.14, 0.28, 't');
      L.txt(s, t, 1.16, y + 0.1, 2.9, 0.34, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, 0.78, y + 0.46, 3.3, i === 0 ? 0.78 : 0.75, { fontSize: 9.5, color: C.muted, valign: 'top' });
      L.path(s, [[4.2, y + h / 2], [4.45, y + h / 2], [4.45, 3.9], [4.7, 3.9]], { color: C.t600, dash: dash === 'dash' ? 'dash' : 'solid', arrow: i === 0 });
    });
    L.line(s, 0.78, 3.62, 4.02, 3.62, { color: C.line, dash: 'dash', arrow: false });
    L.txt(s, [{ text: 'Moving into the region? ', options: { bold: true, color: C.t700 } }, { text: 'Also capture what must move together, what can stay, and how it behaves while split across locations.', options: { color: C.t700 } }], 0.78, 3.68, 3.3, 0.62, { fontSize: 9.5, valign: 'top' });
    L.box(s, 4.7, 2.4, 3.5, 3.45, { fill: C.t50, line: C.t300, r: 0.12 });
    L.txt(s, 'REVIEW AND CAPTURE', 4.9, 2.55, 3, 0.2, { fontSize: 8.5, bold: true, color: C.t600, charSpacing: 2 });
    L.txt(s, 'Workload requirements and dependencies', 4.9, 2.8, 3.1, 0.6, { fontSize: 13, fontFace: F.semi, color: C.t700 });
    ['Architecture, data, and connectivity', 'Shared services and security', 'Resiliency, scale, and operations', 'Required Azure services'].forEach((t, j) => {
      L.oval(s, 4.95, 3.6 + j * 0.4, 0.06, { fill: C.t600 });
      L.txt(s, t, 5.1, 3.49 + j * 0.4, 2.95, 0.38, { fontSize: 10, color: C.text, valign: 'middle' });
    });
    L.txt(s, 'Map to the closest-fitting archetype where useful; record requirements beyond it as explicit additions.', 4.9, 5.2, 3.15, 0.6, { fontSize: 9.5, color: C.t700, italic: true });
    const outs = [['WORKLOAD-DRIVEN', 'Platform requirements', 'The regional and platform capabilities workloads require.', C.b600, 'FFFFFF', 'DDEBF9'], ['AFFECTS SUITABILITY', 'Validated in Dimension 4', 'Requirements that could materially change regional suitability.', C.b50, C.b800, C.muted], ['IMPLEMENTATION DETAIL', 'Deferred to onboarding', 'Evaluated during workload onboarding or reassessment.', 'FFFFFF', C.b800, C.muted]];
    outs.forEach(([k, t, d, f, c1, c2], i) => {
      const y = 2.4 + i * 1.2;
      L.path(s, [[8.2, 3.9], [8.45, 3.9], [8.45, y + 0.5], [8.7, y + 0.5]], { color: C.b600, dash: i === 2 ? 'dash' : 'solid' });
      L.box(s, 8.7, y, 4.03, 1.05, { fill: f, line: i === 2 ? C.b500 : i === 1 ? C.b200 : undefined, dash: i === 2 ? 'dash' : 'solid', r: 0.1 });
      L.txt(s, k, 8.88, y + 0.1, 3, 0.2, { fontSize: 8, bold: true, color: i === 0 ? 'BCD9F5' : C.b600, charSpacing: 2 });
      L.txt(s, t, 8.88, y + 0.3, 3.7, 0.3, { fontSize: 12, fontFace: F.semi, color: c1 });
      L.txt(s, d, 8.88, y + 0.6, 3.7, 0.4, { fontSize: 9.5, color: c2 });
    });
    L.box(s, 0.6, 6.05, 12.13, 0.6, { fill: C.w50, r: 0.1 });
    L.txt(s, [{ text: 'SCOPE BOUNDARY   ', options: { bold: true, color: C.w600, fontSize: 9, charSpacing: 2 } }, { text: 'This phase identifies the regional and platform capabilities workloads require. It does not approve relocation or define migration execution; relocation readiness, sequencing, recovery design, and multi-region operation remain workload-specific.', options: { color: C.ink, fontSize: 10.5 } }], 0.8, 6.05, 11.8, 0.6, { valign: 'middle' });
    L.footer(s, 0, SEC);
    s.addNotes('Regional qualification should reflect the requirements of workloads expected to consume the region — existing workloads in Azure, on-premises, or another cloud (including those that would move into the region), and future workloads. Review architecture, connectivity, data, shared-service, security, resiliency, scale, and operational requirements and dependencies. Where useful, map each workload to the closest-fitting Workload Landing Zone archetype; record requirements beyond it as explicit additions rather than forcing multiple classifications.');
  }

  // ───────────────────────── Dimension 3 · terminology
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    dimnav(s, 3);
    L.txt(s, 'DIMENSION 3 · ORGANIZING WORKLOAD REQUIREMENTS', 0.6, 0.98, 8, 0.25, { fontSize: 10, bold: true, color: C.t600, charSpacing: 3 });
    L.txt(s, 'Four architecture concepts — related, but not interchangeable', 0.6, 1.25, 8.4, 0.5, { fontSize: 22, fontFace: F.semi, color: C.ink });
    L.txt(s, 'They describe different aspects of a workload and should not be used interchangeably.', 9.2, 1.02, 3.53, 0.75, { fontSize: 11.5, color: C.muted });
    const H = { fontFace: F.body, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.5, valign: 'middle', margin: [4, 8, 4, 8], border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', pt: 1, color: C.line }, { type: 'none' }] };
    const cell = (t, o = {}) => ({ text: t, options: Object.assign({ fontFace: F.body, fontSize: 11, color: C.text, valign: 'middle', margin: [6, 8, 6, 8], border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', pt: 1, color: C.soft }, { type: 'none' }] }, o) });
    const rows = [
      ['Architecture style', 'The fundamental structural organization of an application', 'Microservices, N-tier, event-driven, web-queue-worker, big compute', 'Application architecture'],
      ['Architecture / design pattern', 'A reusable solution to a recurring technical problem', 'Circuit Breaker, Retry, CQRS, Strangler Fig, Competing Consumers', 'Design technique'],
      ['Workload pattern', 'A recurring workload behavior or set of operational characteristics that can influence platform requirements', 'Latency-sensitive, data-intensive, batch-oriented, globally distributed, hybrid-dependent', 'Workload characteristics'],
      ['Workload Landing Zone archetype', 'A classification of a workload based on the platform connectivity and dependency capabilities it requires', 'Hybrid-Connected, Connected Cloud-Native or AI, Isolated Cloud-Native or AI, Interconnected Application Portfolios', 'Platform-consumption model'],
    ];
    const data = [[cell('TERM', H), cell('WHAT IT DESCRIBES', H), cell('EXAMPLES', H), cell('LEVEL', H)]];
    rows.forEach((r, i) => { const hi = i === 3; data.push([cell(r[0], { bold: true, color: hi ? C.t700 : C.ink, fill: hi ? { color: C.t50 } : undefined }), cell(r[1], { fill: hi ? { color: C.t50 } : undefined }), cell(r[2], { color: C.muted, fill: hi ? { color: C.t50 } : undefined }), cell(r[3], { bold: true, fontSize: 10, color: hi ? C.t700 : C.b700, fill: hi ? { color: C.t50 } : undefined })]); });
    s.addTable(data, { x: 0.6, y: 2.0, w: 12.13, colW: [2.6, 3.9, 3.8, 1.83], rowH: [0.4, 0.62, 0.62, 0.75, 0.75] });
    L.card(s, 0.6, 5.35, 5.95, 1.35, { icon: 'layers', ic: C.s600, title: 'Not the built-in landing-zone archetypes', body: 'The Azure landing zones reference architecture uses archetypes to define what must be true for a landing zone at a given scope. Workload Landing Zone archetypes describe what a workload requires from the platform.', bs: 10 });
    L.card(s, 6.78, 5.35, 5.95, 1.35, { icon: 'check', ic: C.t600, fill: C.t50, title: 'One archetype per workload', body: 'Classify each workload by its closest-fitting archetype. Record requirements beyond it as explicit additions rather than forcing multiple classifications.', bs: 10 });
    L.footer(s, 0, SEC);
    s.addNotes('Only the Workload Landing Zone archetype describes what a workload needs from the platform; it is the concept used in regional qualification. References: Architecture styles; Built-in Azure landing zone archetypes; Evaluate a cloud workload for relocation; Relocate cloud workloads.');
  }

  // ───────────────────────── 12 · Dimension 4
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    dimnav(s, 4);
    dimTitle(s, 4, 'Regional capability and availability', 'Which regions can support the identified workload requirements?', C.b600, 1.0, 5.9);
    L.txt(s, 'Evaluate each candidate region against the workload requirements identified in the previous phase: required Azure services, deployment models and SKUs, availability-zone support, regional service dependencies, latency, pricing, expected scale, regional access, and quota.', 0.6, 2.3, 5.9, 1.05, { fontSize: 11.5, color: C.text });
    L.txt(s, 'Assess availability-zone support and region pairing separately. Prefer zone-enabled regions when zone resiliency is required, but do not assume pairing alone provides workload recovery or that a nonpaired region cannot be a recovery destination.', 0.6, 3.35, 5.9, 1.05, { fontSize: 11.5, color: C.text });
    L.txt(s, 'For requirements that depend on multiple regions, validate the intended combination at the service level — built-in paired-region behavior such as Storage GRS and region-of-choice capabilities such as Azure SQL replication.', 0.6, 4.4, 5.9, 1.05, { fontSize: 11.5, color: C.text });
    L.txt(s, 'Continued: regional access, quota, programmatic evaluation, and the decision.', 0.6, 5.6, 5.9, 0.3, { fontSize: 10, italic: true, color: C.muted });
    // right: zones vs pairing
    const cardA = (x, t, sub) => { L.box(s, x, 1.05, 2.85, 2.35, { fill: 'FFFFFF', line: C.line, r: 0.12 }); L.txt(s, t, x + 0.2, 1.18, 2.5, 0.3, { fontSize: 12.5, fontFace: F.semi, color: C.ink }); L.txt(s, sub, x + 0.2, 2.75, 2.5, 0.55, { fontSize: 10, color: C.text }); };
    cardA(6.9, 'Availability-zone support', 'Prefer zone-enabled regions where they meet workload requirements.');
    L.box(s, 7.1, 1.6, 2.45, 0.95, { fill: C.b50, line: C.b300, dash: 'dash', r: 0.1 });
    [0, 1, 2].forEach(k => { L.box(s, 7.22 + k * 0.78, 1.8, 0.66, 0.55, { fill: 'FFFFFF', line: C.b500, r: 0.07 }); L.txt(s, `Zone ${k + 1}`, 7.22 + k * 0.78, 1.8, 0.66, 0.55, { fontSize: 8.5, bold: true, color: C.b700, align: 'center', valign: 'middle' }); });
    cardA(9.88, 'Region pairing', 'Consider both paired and nonpaired options.');
    [10.08, 11.75].forEach(x => { L.box(s, x, 1.65, 0.8, 0.85, { fill: C.b50, line: C.b300, dash: 'dash', r: 0.1 }); L.icon(s, 'pin', x + 0.23, 1.85, 0.34, 'b'); });
    L.line(s, 10.9, 2.08, 11.73, 2.08, { color: C.b500, dash: 'dash', arrow: false });
    L.txt(s, 'paired or\nnonpaired', 10.9, 1.68, 0.83, 0.4, { fontSize: 8, bold: true, color: C.muted, align: 'center' });
    L.txt(s, 'DO NOT ASSUME', 6.9, 3.55, 3, 0.2, { fontSize: 8.5, bold: true, color: C.w600, charSpacing: 2 });
    [['…that a paired region provides workload recovery.'], ['…that a nonpaired region cannot support it.']].forEach(([t], i) => {
      L.box(s, 6.9 + i * 2.98, 3.82, 2.85, 0.5, { fill: C.w50, r: 0.1 });
      L.icon(s, 'x', 7.02 + i * 2.98, 3.95, 0.22, 'o');
      L.txt(s, t, 7.32 + i * 2.98, 3.82, 2.4, 0.5, { fontSize: 10, color: C.ink, valign: 'middle' });
    });
    L.box(s, 6.9, 4.47, 5.83, 1.9, { fill: C.wash, r: 0.12 });
    L.txt(s, 'VALIDATE REGIONAL DEPENDENCIES', 7.1, 4.6, 4, 0.2, { fontSize: 8.5, bold: true, color: C.b700, charSpacing: 2 });
    ['Storage GRS', 'Azure SQL replication', 'Backup and restore', 'Key Vault'].forEach((t, i) => { L.box(s, 7.1 + i * 1.37, 4.88, 1.28, 0.42, { fill: 'FFFFFF', line: C.b200, r: 0.08 }); L.txt(s, t, 7.1 + i * 1.37, 4.88, 1.28, 0.42, { fontSize: 9, bold: true, color: C.b800, align: 'center', valign: 'middle' }); });
    L.path(s, [[8.0, 5.3], [8.0, 5.5]], { color: C.b600 }); L.path(s, [[11.6, 5.3], [11.6, 5.5]], { color: C.t600 });
    L.box(s, 7.1, 5.5, 2.65, 0.75, { fill: 'FFFFFF', line: C.b200, r: 0.08 });
    L.txt(s, [{ text: 'Built-in capabilities', options: { bold: true } }, { text: ' support the required outcome' }], 7.22, 5.5, 2.45, 0.75, { fontSize: 10, color: C.b800, valign: 'middle' });
    L.box(s, 9.88, 5.5, 2.65, 0.75, { fill: 'FFFFFF', line: C.t300, r: 0.08 });
    L.txt(s, [{ text: 'Additional workload design', options: { bold: true } }, { text: ' — record gaps, changes, and owners' }], 10.0, 5.5, 2.45, 0.75, { fontSize: 10, color: C.t700, valign: 'middle' });
    L.caption(s, 'Figure', 'Zones and pairing are independent questions. Neither guarantees nor rules out workload recovery. Service-level detail is in Appendix A.', 0.6, 6.55, 12.1);
    L.footer(s, 0, SEC);
    s.addNotes('Validate service-specific capabilities such as replication, backup and restore, and other regional dependencies against the resiliency requirements identified for the workload. Record material gaps, required changes, and owners for unresolved validation; use the resiliency guidance in Appendix A for detailed design. References: ');
  }

  // ───────────────────────── Dimension 4 · continued
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    dimnav(s, 4);
    L.txt(s, 'DIMENSION 4 · CONTINUED', 0.6, 0.98, 8, 0.25, { fontSize: 10, bold: true, color: C.b600, charSpacing: 3 });
    L.txt(s, 'Access, quota, and evidence-based evaluation', 0.6, 1.25, 8.4, 0.5, { fontSize: 22, fontFace: F.semi, color: C.ink });
    L.txt(s, 'Validate whether the intended subscription and offer types can deploy in the region, and identify any regional access restrictions or approvals to resolve before deployment. Assess required quota based on expected workload scale and identify increases that may be required.', 0.6, 1.85, 7.6, 0.95, { fontSize: 11.5, color: C.text });
    L.box(s, 8.5, 1.8, 4.23, 1.0, { fill: C.w50, r: 0.12 });
    L.icon(s, 'gauge', 8.7, 1.98, 0.3, 'o');
    L.txt(s, [{ text: 'Quota is not capacity', options: { fontFace: F.semi, fontSize: 12.5, color: C.w600, breakLine: true } }, { text: 'Quota is not an indication or guarantee of Azure capacity, which remains subject to availability at deployment time.', options: { fontSize: 9.5, color: C.ink } }], 9.12, 1.82, 3.5, 0.96, { valign: 'middle' });
    L.txt(s, 'EVALUATE OBJECTIVE REGIONAL CHARACTERISTICS PROGRAMMATICALLY, WHERE POSSIBLE', 0.6, 3.0, 9, 0.22, { fontSize: 8.5, bold: true, color: C.b600, charSpacing: 1.5 });
    L.box(s, 0.6, 3.3, 3.0, 2.2, { fill: C.wash, r: 0.12 });
    L.txt(s, 'INPUTS', 0.8, 3.42, 2, 0.2, { fontSize: 8.5, bold: true, color: C.muted, charSpacing: 2 });
    L.bullets(s, ['Required services and SKUs', 'Zone requirements', 'Latency targets', 'Pricing considerations', 'Expected scale', 'Access eligibility and quota'], 0.8, 3.68, 2.7, 1.8, { gap: 2, opts: { fontSize: 10 } });
    L.line(s, 3.62, 4.4, 4.05, 4.4, { color: C.b600, w: 1.5 });
    L.box(s, 4.08, 3.65, 2.7, 1.5, { fill: C.b600, r: 0.12 });
    L.txt(s, [{ text: 'Regional assessment', options: { fontFace: F.semi, fontSize: 13, breakLine: true } }, { text: 'Candidate regions compared against workload requirements', options: { fontSize: 9.5, color: 'DDEBF9' } }], 4.25, 3.65, 2.4, 1.5, { color: 'FFFFFF', valign: 'middle' });
    L.box(s, 4.08, 5.25, 2.7, 0.35, { fill: 'FFFFFF', line: C.b300, dash: 'dash', r: 0.08 });
    L.txt(s, '+ manual review where data is unreliable', 4.08, 5.25, 2.7, 0.35, { fontSize: 8.5, color: C.b700, align: 'center', valign: 'middle' });
    const O = [['check', 'g', 'Candidate regions', 'Regions that meet the identified requirements'], ['x', 'o', 'Unmet requirements', 'Gaps that exclude a region or need workload design'], ['flag', 'o', 'Conditional constraints', 'Conditions under which a region can be used'], ['search', 'b', 'Items requiring validation', 'Open questions, owners, and follow-up']];
    O.forEach(([ic, c, t, d], i) => {
      const y = 3.3 + i * 0.57;
      L.line(s, 6.8, 4.4, 7.15, y + 0.25, { color: C.b300, arrow: false });
      L.box(s, 7.15, y, 5.58, 0.5, { fill: 'FFFFFF', line: C.line, r: 0.08 });
      L.icon(s, ic, 7.28, y + 0.13, 0.24, c);
      L.txt(s, [{ text: t + '  ', options: { bold: true, color: C.ink } }, { text: d, options: { color: C.muted } }], 7.62, y, 5.0, 0.5, { fontSize: 10, valign: 'middle' });
    });
    L.box(s, 0.6, 5.8, 5.9, 0.9, { fill: C.wash, r: 0.1 });
    L.txt(s, [{ text: 'Unresolved? ', options: { bold: true, color: '8A5A00' } }, { text: 'If a requirement that could materially affect regional suitability is unresolved, retain the region as a conditional candidate until it is validated.' }], 0.8, 5.8, 5.55, 0.9, { fontSize: 10.5, color: C.ink, valign: 'middle' });
    decision(s, 'Qualify candidates against identified requirements, documenting conditions, constraints, and unresolved validations.', 6.75, 5.8, 5.98, 0.9, 'b');
    L.footer(s, 0, SEC);
    s.addNotes('Use manual review for considerations that cannot be determined reliably from published or programmatically available information. Evaluate requirements that do not affect regional qualification later during workload onboarding or reassessment. References: Azure region pairs and nonpaired regions; Azure services that support multiple regions; Azure services that support availability zones; Zonal resources and zone resiliency; Enable zone resiliency for Azure workloads.');
  }

  // ───────────────────────── 13 · Dimension 5 — platform enablement + three layers
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    dimnav(s, 5);
    dimTitle(s, 5, 'Platform enablement and connectivity', 'What platform capabilities must be enabled to support the identified workload requirements?', C.b800, 1.0);
    L.txt(s, 'Determine which shared services and operational capabilities must be provided in the region, consumed from another region, or remain centralized: identity and access, policy and security controls, deployment automation, monitoring and logging, backup and recovery, key and secret management, operational support, platform resiliency, ownership, and cost. Qualifying a region does not require recreating the full platform footprint used elsewhere.', 0.6, 2.15, 7.1, 1.2, { fontSize: 10.5, color: C.text });
    decision(s, 'Define the most efficient capability set, where each capability is provided, who operates it, and what would trigger future expansion.', 7.95, 1.95, 4.78, 1.2, 'b');
    const lay = [['1 · RESILIENT HYBRID CONNECTIVITY', C.s600, 0.6, 4.0], ['2 · GEOGRAPHIC HUBS AND SHARED SERVICES', C.b600, 4.85, 3.85], ['3 · APPLICATION-SPECIFIC REQUIREMENTS', C.t600, 8.88, 3.85]];
    lay.forEach(([t, c, x, w]) => { L.txt(s, t, x, 3.45, w, 0.22, { fontSize: 8.5, bold: true, color: c, charSpacing: 1.5 }); L.box(s, x, 3.7, w, 0.03, { fill: c, r: 0 }); });
    L.box(s, 0.6, 3.9, 1.6, 1.45, { fill: C.s800, r: 0.1 });
    L.icon(s, 'building', 0.75, 4.02, 0.3, 'w');
    L.txt(s, [{ text: 'On-premises datacenters and users', options: { fontFace: F.semi, fontSize: 10, breakLine: true } }, { text: 'Latency, bandwidth, failure domains', options: { fontSize: 8.5, color: 'C9D4E2' } }], 0.72, 4.37, 1.4, 0.95, { color: 'FFFFFF' });
    L.box(s, 3.0, 3.9, 1.6, 1.45, { fill: C.b700, r: 0.1 });
    L.icon(s, 'network', 3.12, 4.02, 0.3, 'w');
    L.txt(s, [{ text: 'Azure backbone in the geography', options: { fontFace: F.semi, fontSize: 10, breakLine: true } }, { text: 'Existing or additional private paths', options: { fontSize: 8.5, color: 'DDEBF9' } }], 3.12, 4.37, 1.4, 0.95, { color: 'FFFFFF' });
    L.line(s, 2.22, 4.62, 2.98, 4.62, { color: C.s600, both: true });
    L.txt(s, 'Express-\nRoute / VPN', 2.2, 4.2, 0.8, 0.36, { fontSize: 7.5, bold: true, color: C.s600, align: 'center' });
    L.line(s, 4.62, 4.62, 4.83, 4.62, { color: C.b600 });
    L.box(s, 4.85, 3.9, 3.85, 1.45, { fill: C.b50, line: C.b200, r: 0.1 });
    L.icon(s, 'hub', 5.02, 4.02, 0.3, 'b');
    L.txt(s, [{ text: 'Strategic geographic hubs and shared services', options: { fontFace: F.semi, fontSize: 11.5, color: C.b800, breakLine: true } }, { text: 'Reused where they satisfy requirements; placement assessed from validated dependencies', options: { fontSize: 9.5, color: C.muted } }], 5.02, 4.4, 3.55, 0.9);
    L.line(s, 8.72, 4.62, 8.86, 4.62, { color: C.b600, both: true });
    L.box(s, 8.88, 3.9, 3.85, 1.45, { fill: C.t50, line: C.t300, r: 0.1 });
    L.icon(s, 'spoke', 9.05, 4.02, 0.3, 't');
    L.txt(s, [{ text: 'Workload Landing Zones', options: { fontFace: F.semi, fontSize: 11.5, color: C.t700, breakLine: true } }, { text: 'Supported by the regional connectivity profile — selected by dependencies and requirements', options: { fontSize: 9.5, color: C.muted } }], 9.05, 4.4, 3.55, 0.9);
    L.box(s, 0.6, 5.55, 4.0, 0.85, { fill: C.wash, r: 0.1 });
    L.txt(s, [{ text: 'Principle: ', options: { bold: true, color: C.b700 } }, { text: 'existing and new workloads follow the same rule — requirements and dependencies determine the regional connectivity profile.' }], 0.78, 5.55, 3.7, 0.85, { fontSize: 10, color: C.ink, valign: 'middle' });
    [[4.85, 'Existing workloads', 'Validated dependencies show whether existing hubs still suffice.'], [8.88, 'New workloads', 'Derive needs from intended architecture; a new region needs no new footprint by default.']].forEach(([x, t, d]) => {
      L.line(s, x + 1.92, 5.55, x + 1.92, 5.37, { color: C.t600, dash: 'dash' });
      L.box(s, x, 5.55, 3.85, 0.85, { fill: 'FFFFFF', line: C.t300, dash: 'dash', r: 0.1 });
      L.txt(s, [{ text: t, options: { fontFace: F.semi, fontSize: 10.5, color: C.t700, breakLine: true } }, { text: d, options: { fontSize: 9.5, color: C.muted } }], x + 0.17, 5.55, 3.55, 0.85, { valign: 'middle' });
    });
    L.caption(s, 'Figure', 'Three connectivity planning decisions — they influence one another, but each has different requirements and tradeoffs.', 0.6, 6.55, 12.1);
    L.footer(s, 0, SEC);
    s.addNotes('Connectivity planning separates three decisions: resilient hybrid connectivity to Azure, placement of geographic hubs and shared services, and application-specific connectivity. Archetypes can inform the assessment, but the design should follow each workload’s actual dependencies. Known requirements can shape platform planning in advance; validate workload-specific fit during onboarding and add regional capabilities only when justified. Reference: Azure landing zone design areas and conceptual architecture.');
  }

  // ───────────────────────── 14 · Hybrid connectivity + regional connectivity
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '03 · Dimension 5 · Connectivity', 'Hybrid connectivity and regional connectivity are separate decisions', { tw: 9 });
    // left
    L.chip(s, 'LAYER 1', 0.6, 1.7, { fill: C.s100, color: C.s800, size: 9 });
    L.txt(s, 'Resilient hybrid connectivity', 0.6, 2.05, 5.8, 0.4, { fontSize: 18, fontFace: F.semi, color: C.ink });
    L.txt(s, 'Evaluate existing hybrid connectivity against datacenter and user locations, data boundaries, provider and peering-location diversity, latency, bandwidth, routing, and failure-domain requirements. Enabling an additional Azure region does not inherently require another ExpressRoute circuit.', 0.6, 2.5, 5.8, 1.2, { fontSize: 11.5, color: C.text });
    L.box(s, 0.6, 3.8, 5.8, 0.85, { fill: C.b50, line: C.b200, r: 0.1 });
    L.txt(s, [{ text: 'THE DECIDING FACTOR', options: { bold: true, fontSize: 8.5, color: C.b600, charSpacing: 2, breakLine: true } }, { text: 'Are additional circuits, peering locations, gateways, or paths needed for diversity, failure-domain isolation, latency, bandwidth, routing, or resiliency?', options: { fontSize: 11, fontFace: F.semi, color: C.ink } }], 0.8, 3.8, 5.45, 0.85, { valign: 'middle' });
    L.path(s, [[2.0, 4.65], [2.0, 4.95]], { color: C.s600 }); L.tag(s, 'No', 2.0, 4.8, { color: C.s600 });
    L.path(s, [[5.0, 4.65], [5.0, 4.95]], { color: C.b600 }); L.tag(s, 'Yes', 5.0, 4.8);
    L.box(s, 0.6, 4.95, 2.8, 0.75, { fill: 'FFFFFF', line: C.line, r: 0.1 });
    L.txt(s, [{ text: 'Existing connectivity can remain sufficient', options: { bold: true } }, { text: ' — reuse the current hybrid foundation' }], 0.75, 4.95, 2.55, 0.75, { fontSize: 10, color: C.ink, valign: 'middle' });
    L.box(s, 3.6, 4.95, 2.8, 0.75, { fill: C.b600, r: 0.1 });
    L.txt(s, [{ text: 'Change the foundation', options: { bold: true } }, { text: ' — reachability, resiliency, diversity, scale, or ownership' }], 3.75, 4.95, 2.55, 0.75, { fontSize: 10, color: 'FFFFFF', valign: 'middle' });
    // right
    L.box(s, 6.85, 1.7, 0.012, 4.0, { fill: C.soft, r: 0 });
    L.chip(s, 'LAYERS 2–3', 7.15, 1.7, { fill: C.b50, color: C.b700, size: 9 });
    L.txt(s, 'Regional platform connectivity', 7.15, 2.05, 5.6, 0.4, { fontSize: 18, fontFace: F.semi, color: C.ink });
    L.txt(s, 'How will workloads in the region reach geographic hubs, shared services, dependencies, other regions, and hybrid environments? Adoption growth alone does not justify moving toward a Full Regional Hub.', 7.15, 2.5, 5.58, 0.95, { fontSize: 11.5, color: C.text });
    const prof = [['Disconnected spokes', C.t50, C.t600, 0], ['Remote-hub-connected spokes', C.t50, C.t600, 1], ['Minimal regional hub', C.b50, C.b500, 2], ['Full regional hub', C.b50, C.b600, 3]];
    prof.forEach(([t, bg, c, k], i) => {
      const x = 7.15 + i * 1.42;
      L.box(s, x, 3.6, 1.32, 1.35, { fill: 'FFFFFF', line: C.line, r: 0.1 });
      L.box(s, x + 0.3, 3.75, 0.72, 0.46, { fill: bg, line: c, dash: 'dash', r: 0.08 });
      if (k === 0) { L.box(s, x + 0.4, 3.87, 0.2, 0.2, { fill: C.t600, r: 0.04 }); L.box(s, x + 0.72, 3.87, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
      if (k === 1) { L.box(s, x + 0.4, 3.87, 0.2, 0.2, { fill: C.t600, r: 0.04 }); L.line(s, x + 0.62, 3.97, x + 0.8, 3.97, { color: C.b500, arrow: false }); L.oval(s, x + 0.8, 3.9, 0.15, { fill: C.b600 }); }
      if (k === 2) { L.oval(s, x + 0.4, 3.87, 0.2, { fill: 'FFFFFF', line: C.b500, lw: 1.5 }); L.box(s, x + 0.72, 3.87, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
      if (k === 3) { L.oval(s, x + 0.38, 3.85, 0.24, { fill: C.b600 }); L.box(s, x + 0.72, 3.87, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
      L.txt(s, t, x + 0.08, 4.28, 1.16, 0.6, { fontSize: 9.5, bold: true, color: C.b800, align: 'center', valign: 'middle' });
    });
    L.box(s, 7.15, 5.1, 5.58, 0.6, { fill: C.b50, r: 0.1 });
    L.txt(s, [{ text: 'Decision: ', options: { bold: true, color: C.b600 } }, { text: 'the most efficient profile that satisfies the identified requirements.' }], 7.3, 5.1, 5.3, 0.6, { fontSize: 10.5, color: C.ink, valign: 'middle' });
    s.addImage({ path: IMG('band.jpg'), x: 0.6, y: 5.95, w: 12.13, h: 0.85, sizing: { type: 'cover', w: 12.13, h: 0.85 } });
    L.txt(s, 'Geographic hybrid connectivity and workload connectivity remain related but distinct decisions. Enabling another region does not automatically require duplicating the existing connectivity platform.', 0.9, 5.95, 11.6, 0.85, { fontSize: 13.5, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    L.footer(s, 0, SEC);
    s.addNotes('Hybrid decision: confirm the hybrid connectivity foundation and identify any required changes to reachability, resiliency, diversity, scale, or ownership. Regional decision: select the most efficient regional platform connectivity profile that satisfies the identified requirements and can evolve as regional adoption changes; expand local capabilities when shared-service placement, resiliency, scale, connectivity, or operational requirements change. Reference: Designing for disaster recovery with ExpressRoute private peering. Regional decision references: Network topology and connectivity; Define an Azure network topology.');
  }

  // ───────────────────────── Readiness checklist
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '03 · Dimension 5 · Before workloads arrive', 'Platform readiness checklist for a new region', { tw: 7.6, lede: 'The platform items that most often stall a new region after it has been qualified. Cheap to plan early, expensive to retrofit. Apply only what the profile and workload requirements call for.', lx: 8.5, lw: 4.23 });
    const G = [
      ['network', C.b600, 'Network foundation', [['IP address planning', 'Non-overlapping space for future regions and profiles. The most common blocker.', 1], ['Private DNS across regions', 'Private endpoints and hybrid names resolve wherever the workload runs.'], ['Routing and inspection paths', 'Reach hubs and firewalls without asymmetric paths.'], ['Hybrid connectivity', 'Reuse existing circuits or add paths, per Dimension 5.']]],
      ['shield', C.s800, 'Governance and automation', [['Region settings in policy', 'Allowed locations admit the region only for its qualified requirements.', 1], ['Region-aware infrastructure as code', 'Modules, naming, tagging parameterized by region.'], ['Landing-zone provisioning', 'Subscription vending can place workloads in the region.']]],
      ['monitor', C.t600, 'Operations and data', [['Where logs and telemetry live', 'Workspace location and residency for monitoring and security data.', 1], ['Backup placement', 'Vaults and valid restore targets — see Appendix A.'], ['Runbooks and support', 'Incident, on-call, and support procedures include the region.']]],
      ['gauge', C.v600, 'Capacity and security', [['Quota and specific capacity', 'Quota for required SKUs and models requested ahead; reservations where justified.', 1], ['Key Vault placement', 'Workload vaults per region — see Appendix A.'], ['Security coverage', 'Posture, threat detection, privileged access extend to the region.']]],
    ];
    G.forEach(([ic, c, t, items], i) => {
      const x = 0.6 + i * 3.08, y = 1.85, w = 2.93, h = 4.2;
      L.box(s, x, y, w, h, { fill: C.wash, r: 0.12 });
      L.badge(s, ic, x + 0.18, y + 0.18, 0.42, c);
      L.txt(s, t, x + 0.7, y + 0.16, w - 0.8, 0.46, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      items.forEach(([n, d, key], j) => {
        const yy = y + 0.8 + j * 0.84;
        L.box(s, x + 0.18, yy, w - 0.36, 0.008, { fill: C.line, r: 0 });
        L.box(s, x + 0.2, yy + 0.12, 0.18, 0.18, { fill: 'FFFFFF', line: key ? C.w600 : C.b500, lw: 1.5, r: 0.04 });
        L.txt(s, n, x + 0.48, yy + 0.07, w - 0.62, 0.28, { fontSize: 10.5, bold: true, color: C.ink, valign: 'middle' });
        L.txt(s, d, x + 0.48, yy + 0.35, w - 0.62, 0.46, { fontSize: 9, color: C.muted });
      });
    });
    L.box(s, 0.6, 6.12, 0.16, 0.16, { fill: 'FFFFFF', line: C.w600, lw: 1.5, r: 0.04 });
    L.txt(s, 'Most common blockers — plan before qualification completes', 0.85, 6.07, 4.5, 0.26, { fontSize: 9.5, color: C.muted, valign: 'middle' });
    L.box(s, 5.3, 6.12, 0.16, 0.16, { fill: 'FFFFFF', line: C.b500, lw: 1.5, r: 0.04 });
    L.txt(s, 'Confirm as the capability set is enabled', 5.55, 6.07, 4, 0.26, { fontSize: 9.5, color: C.muted, valign: 'middle' });
    L.box(s, 0.6, 6.42, 12.13, 0.45, { fill: C.g100, r: 0.1 });
    L.txt(s, [{ text: 'Ready for workloads ', options: { bold: true, color: C.g600 } }, { text: 'means the region is qualified for its workload requirements, the required capability set is in place through standard automation, and workloads can onboard without platform exceptions.' }], 0.8, 6.42, 11.8, 0.45, { fontSize: 10.5, color: C.ink, valign: 'middle' });
    L.footer(s, 0, SEC);
    s.addNotes('Hub and shared-service implementations differ between organizations; the checklist names what must be true, not how a specific hub is built. IP address planning is the most common blocker: reserve non-overlapping address space for future regions and profiles before you need it.');
  }

  // ───────────────────────── 16 · Decision tree: qualification
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, 'Decision tool · Regional qualification', 'Should this region be qualified?', { tw: 8, lede: 'Apply per candidate region and set of defined workload requirements. Each question is a framework dimension; each branch ends in one of four classifications.', lx: 9.1, lw: 3.63 });
    L.box(s, 3.15, 1.55, 3.3, 0.38, { fill: C.s800, r: 0.19 });
    L.txt(s, 'Candidate region + defined requirements', 3.15, 1.55, 3.3, 0.38, { fontSize: 11, fontFace: F.semi, color: 'FFFFFF', align: 'center', valign: 'middle' });
    const Q = [
      ['Dimension 1', 'Business value sufficient to justify deeper assessment?', 'No', 'No deeper assessment', 'Business value does not justify further assessment.', 'st'],
      ['Dimension 2', 'Can it satisfy all mandatory data, compliance, and policy requirements?', 'No', 'Excluded', 'A mandatory requirement cannot be satisfied.', 'ex'],
      ['Dimension 3', 'Are the workload requirements, archetypes, and dependencies known and validated?', 'Not yet', 'Candidate', 'Complete discovery or relocation assessment — or set guardrails and assess at onboarding.', 'ca'],
      ['Dimension 4', 'Do services, models, SKUs, zones, access, and quota meet the requirements, including recovery?', 'Unresolved', 'Conditional — or Excluded if a mandatory gap', 'Record gaps, required changes, and validation owners.', 'co'],
      ['Dimension 5', 'Is the hybrid connectivity foundation sufficient for the geography?', 'No', 'Candidate', 'Identify changes to backbone access, diversity, scale, or ownership.', 'ca'],
      ['Dimension 5', 'Capability set and connectivity profile defined, with platform ownership established?', 'No', 'Candidate', 'Platform enablement required before the requirements are supported.', 'ca'],
    ];
    const qx = 2.2, qw = 5.2, ox = 8.35, ow = 4.38, qh = 0.56, pitch = 0.7, y0 = 2.13;
    Q.forEach(([d, q, no, ot, od, k], i) => {
      const y = y0 + i * pitch;
      L.txt(s, d.toUpperCase(), 0.6, y, 1.45, qh, { fontSize: 8.5, bold: true, color: i === 2 ? C.t600 : C.b600, charSpacing: 1.5, valign: 'middle' });
      L.box(s, qx, y, qw, qh, { fill: 'FFFFFF', line: i === 2 ? C.t600 : C.b500, lw: 1.25, r: 0.12 });
      L.num(s, i + 1, qx + 0.1, y + 0.13, 0.3, i === 2 ? C.t50 : C.b50, i === 2 ? C.t700 : C.b700, 10);
      L.txt(s, q, qx + 0.5, y, qw - 0.6, qh, { fontSize: 10.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      const bg = { st: C.wash, ex: C.w50, ca: 'FFFFFF', co: 'FFF8E6' }[k], fg = { st: C.s600, ex: C.w600, ca: C.b700, co: '8A5A00' }[k];
      L.box(s, ox, y, ow, qh, { fill: bg, line: k === 'ca' ? C.b500 : k === 'co' ? 'E2B04A' : undefined, dash: k === 'co' ? 'solid' : 'dash', r: 0.1 });
      L.txt(s, [{ text: ot, options: { bold: true, color: fg, fontSize: 10.5, breakLine: true } }, { text: od, options: { color: C.muted, fontSize: 9 } }], ox + 0.14, y, ow - 0.2, qh, { valign: 'middle' });
      const col = k === 'ex' ? C.w600 : k === 'st' ? C.faint : k === 'co' ? 'C98A00' : C.b600;
      L.line(s, qx + qw, y + qh / 2, ox, y + qh / 2, { color: col, dash: k === 'ca' || k === 'co' ? 'dash' : 'solid' });
      L.tag(s, no, (qx + qw + ox) / 2, y + qh / 2, { color: col });
      if (i < 5) { L.line(s, qx + qw / 2, y + qh, qx + qw / 2, y + pitch, { color: C.b600 }); }
    });
    L.line(s, 4.8, 1.93, 4.8, y0, { color: C.b600 });
    const yq = y0 + 6 * pitch - 0.02;
    L.line(s, qx + qw / 2, y0 + 5 * pitch + qh, qx + qw / 2, yq + 0.02, { color: C.g600 });
    L.box(s, qx, yq + 0.02, 10.53, 0.62, { fill: C.g600, r: 0.12 });
    L.oval(s, qx + 0.14, yq + 0.13, 0.4, { fill: 'FFFFFF' }); L.icon(s, 'check', qx + 0.22, yq + 0.21, 0.24, 'g');
    L.txt(s, [{ text: 'Qualified as of the assessment date', options: { fontFace: F.semi, fontSize: 12.5, breakLine: true } }, { text: 'Current evidence supports the defined requirements, with connectivity profile, constraints, and ownership established.', options: { fontSize: 9, color: 'D5EEDD' } }], qx + 0.7, yq + 0.02, 6.6, 0.62, { color: 'FFFFFF', valign: 'middle' });
    L.txt(s, [{ text: 'Not a placement decision. ', options: { bold: true } }, { text: 'Onboarding revalidation still required.' }], 9.8, yq + 0.02, 2.85, 0.62, { fontSize: 9.5, color: 'FFFFFF', valign: 'middle' });
    L.footer(s, 0, SEC);
    s.addNotes('Every Yes continues down the spine; the first failing question determines the classification. Filters come first, then technical fit, then platform readiness. Candidate and conditional options return to the tree when validation or enablement is complete, or conditions change.');
  }
};
