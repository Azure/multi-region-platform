const { C, F } = require('../lib');

module.exports = (pres, L) => {
  // ───────────────────────── Placement flow (PDF p43)
  {
    const s = L.slide('part5');
    L.header(s, 'From options to placement', 'Place workloads using qualified options', { ec: C.t600, tw: 8, lede: 'Previous regional qualification is a planning input; decision-time validation is authoritative.', lx: 9.1, lw: 3.63, ls: 13 });
    const groups = [['Understand the workload', C.t600, 0, 3], ['Match to qualified regional options', C.b600, 3, 6], ['Decide and govern', C.s800, 6, 8]];
    const sw = 1.369, gap = 0.14, x0 = 0.6, y = 2.05, sh = 1.5;
    const X = i => x0 + i * (sw + gap) + (i >= 3 ? 0.1 : 0) + (i >= 6 ? 0.1 : 0);
    groups.forEach(([t, c, a, b]) => {
      const xa = X(a), xb = X(b - 1) + sw;
      L.txt(s, t.toUpperCase(), xa, 1.66, xb - xa, 0.24, { fontSize: 10, bold: true, color: c, charSpacing: 1.5 });
      L.box(s, xa, 1.93, xb - xa, 0.03, { fill: c, r: 0 });
    });
    const S = ['Define the placement objective', 'Identify the landing zone archetype', 'Establish mandatory requirements', 'Review the qualified regional options', 'Validate current regional suitability', 'Confirm the connectivity profile', 'Determine the resiliency role', 'Record and govern the decision'];
    S.forEach((t, i) => {
      const x = X(i), grp = i < 3 ? 0 : i < 6 ? 1 : 2;
      const [bg, ln, nf] = [[C.t50, C.t300, C.t600], [C.b50, C.b200, C.b600], [C.s100, C.s300, C.s800]][grp];
      L.box(s, x, y, sw, sh, { fill: bg, line: ln, r: 0.1 });
      L.num(s, i + 1, x + 0.12, y + 0.12, 0.34, nf, 'FFFFFF', 11);
      L.txt(s, t, x + 0.12, y + 0.56, sw - 0.2, 0.9, { fontSize: 11, fontFace: F.semi, color: C.ink });
      if (i < 7) L.line(s, x + sw, y + sh / 2, X(i + 1), y + sh / 2, { color: [C.t600, C.b600, C.s600][grp] });
    });
    // side outcomes
    const oy = 3.95, oh = 1.3, bot = y + sh;
    const sx5 = X(4) + sw / 2, sx6 = X(5) + sw / 2, sx8 = X(7) + sw / 2;
    L.line(s, sx5, bot, sx5, oy, { color: C.b300, dash: 'dash' });
    L.box(s, 5.95, oy, 2.25, oh, { fill: 'FFFFFF', line: C.b300, dash: 'dash', r: 0.1 });
    L.txt(s, [{ text: 'Guaranteed capacity? ', options: { bold: true } }, { text: 'Quota isn’t capacity; decide here whether to reserve it.' }], 6.08, oy, 2.0, oh, { fontSize: 11, color: C.b800, valign: 'middle' });
    L.line(s, sx6, bot, sx6, oy, { color: C.w600 }); L.tag(s, 'Gap', sx6, (bot + oy) / 2, { color: C.w600 });
    L.box(s, 8.35, oy, 2.4, oh, { fill: C.w50, r: 0.1 });
    L.txt(s, [{ text: 'Additional capabilities needed? ', options: { bold: true, color: C.w600 } }, { text: 'A separate governed platform decision, not a profile redefined by the workload team.' }], 8.48, oy, 2.15, oh, { fontSize: 11, color: C.ink, valign: 'middle' });
    L.line(s, sx8, bot, sx8, oy, { color: C.s600 });
    L.box(s, 10.9, oy, 1.83, oh, { fill: C.wash, r: 0.1 });
    L.txt(s, [{ text: 'Valid outcomes ', options: { bold: true } }, { text: 'include retaining the current region, or no qualified option today.' }], 11.0, oy, 1.65, oh, { fontSize: 11, color: C.ink, valign: 'middle' });
    // feedback loop into regional qualification
    const ry = 5.5, rh = 0.85, rw = 4.6;
    L.box(s, 0.6, ry, rw, rh, { fill: C.b600, r: 0.1 });
    L.icon(s, 'doc', 0.8, ry + 0.27, 0.32, 'w');
    L.txt(s, [{ text: 'Regional qualification', options: { fontFace: F.semi, fontSize: 12, breakLine: true } }, { text: 'Remain qualified, become conditional, add platform capabilities, or remove.', options: { fontSize: 11, color: C.b100 } }], 1.3, ry, rw - 0.8, rh, { color: 'FFFFFF', valign: 'middle' });
    L.path(s, [[sx8, oy + oh], [sx8, ry + rh / 2], [0.6 + rw, ry + rh / 2]], { color: C.b600, dash: 'dash' });
    L.tag(s, 'New requirements, constraints, or platform gaps', 8.6, ry + rh / 2, { w: 3.5 });
    L.path(s, [[2.9, ry], [2.9, 5.42], [X(3) + 0.3, 5.42], [X(3) + 0.3, bot]], { color: C.b600, dash: 'dash' });
    L.caption(s, 'Figure', 'Teal steps describe the workload, blue steps match it to regional options, slate steps decide and govern. Onboarding findings return to regional qualification.', 0.6, 6.5, 12.13);
    s.addNotes('Place a workload only after its requirements are understood well enough to make a decision. Regional qualification narrows the choices; it does not permanently approve a region for every application. Previous regional qualification is a planning input, and decision-time validation is authoritative. Findings from onboarding flow back into regional qualification: an option can remain qualified, become conditional, require additional platform capabilities, or be removed for the affected requirements.');
  }

  // ───────────────────────── The eight placement steps (PDF p44)
  {
    const s = L.slide('part5');
    L.header(s, 'Each workload', 'The eight placement steps', { ec: C.t600, tw: 8, lede: 'Placement ends in one of these outcomes: a qualified region, keeping the workload where it is, relocating it, extending it for recovery or active use, or no qualified option yet.', lx: 8.6, lw: 4.13 });
    const S = [
      ['Define the placement objective', 'Is the workload new, staying where it is, or moving or expanding to another region?', 0],
      ['Identify the Workload Landing Zone archetype', 'Assess connectivity, shared-service, data, security, operational, and dependency characteristics. Pick the closest fit; record requirements it doesn’t cover.', 0],
      ['Establish mandatory requirements', 'Confirm data-location restrictions, required services and features, zones, latency thresholds, expected scale, connectivity, resiliency, and critical dependencies.', 0],
      ['Review the qualified regional options', 'Consider regions previously assessed against the relevant requirements: capabilities, profiles, readiness, constraints, last assessment date, and open validations.', 1],
      ['Validate current regional suitability', 'Qualification was an earlier planning assessment. Re-check the target region before onboarding: services, SKUs, AI models, access, quota, and dependencies.', 1],
      ['Confirm the region’s connectivity profile', 'Check that the region’s connectivity profile satisfies the workload’s requirements.', 1],
      ['Determine the workload’s resiliency role', 'Primary, recovery, or part of a multi-region active deployment, applying availability, RTO, RPO, replication, consistency, and failover requirements. See Appendix A.', 2],
      ['Record and govern the decision', 'Document the region, archetype, connectivity profile, placement and resiliency outcomes, assumptions, constraints, owners, and revalidation triggers.', 2],
    ];
    const cw = 2.92, cg = 0.15, ch = 1.78;
    S.forEach(([t, d, g], i) => {
      const x = 0.6 + (i % 4) * (cw + cg), y = 1.75 + Math.floor(i / 4) * (ch + 0.12);
      const c = [C.t600, C.b600, C.s800][g];
      L.box(s, x, y, cw, 0.04, { fill: c, r: 0 });
      L.txt(s, String(i + 1).padStart(2, '0'), x, y + 0.1, 0.55, 0.4, { fontSize: 20, fontFace: F.light, color: c });
      L.txt(s, t, x + 0.55, y + 0.1, cw - 0.55, 0.5, { fontSize: 12, fontFace: F.semi, color: C.ink });
      L.txt(s, d, x, y + 0.66, cw, 1.1, { fontSize: 11, color: C.text });
    });
    // qualification versus placement
    const qy = 5.5, qh = 1.35;
    L.box(s, 0.6, qy, 4.1, qh, { fill: C.b50, r: 0.12 });
    L.txt(s, 'PLATFORM · QUALIFICATION', 0.8, qy + 0.12, 3.7, 0.2, { fontSize: 10, bold: true, color: C.b700, charSpacing: 1.5 });
    L.txt(s, 'Is this region a viable option for these requirements?', 0.8, qy + 0.36, 3.75, 0.45, { fontSize: 12, fontFace: F.semi, color: C.ink });
    L.txt(s, 'Answered in advance, from current evidence, for defined requirements.', 0.8, qy + 0.86, 3.75, 0.42, { fontSize: 11, color: C.text });
    L.txt(s, 'qualified options', 4.78, qy + 0.2, 1.3, 0.3, { fontSize: 10, bold: true, color: C.b700, align: 'center', valign: 'middle' });
    L.line(s, 4.8, qy + 0.62, 6.05, qy + 0.62, { color: C.b600, w: 1.5 });
    L.line(s, 6.05, qy + 0.82, 4.8, qy + 0.82, { color: C.b600, w: 1.5, dash: 'dash' });
    L.txt(s, 'new findings', 4.78, qy + 0.94, 1.3, 0.3, { fontSize: 10, bold: true, color: C.b700, align: 'center', valign: 'middle' });
    L.box(s, 6.15, qy, 4.1, qh, { fill: C.t50, r: 0.12 });
    L.txt(s, 'WORKLOAD · PLACEMENT', 6.35, qy + 0.12, 3.7, 0.2, { fontSize: 10, bold: true, color: C.t700, charSpacing: 1.5 });
    L.txt(s, 'Where, and in what role, does this workload run?', 6.35, qy + 0.36, 3.75, 0.45, { fontSize: 12, fontFace: F.semi, color: C.ink });
    L.txt(s, 'Decided once the workload is understood, with decision-time validation.', 6.35, qy + 0.86, 3.75, 0.42, { fontSize: 11, color: C.text });
    L.box(s, 10.4, qy, 2.33, qh, { fill: C.t600, r: 0.12 });
    L.txt(s, 'PRINCIPLE', 10.58, qy + 0.12, 2.0, 0.2, { fontSize: 10, bold: true, color: C.t100, charSpacing: 2 });
    L.txt(s, 'Regional adaptability does not mean arbitrary placement.', 10.58, qy + 0.34, 2.0, 0.95, { fontSize: 13, fontFace: F.semi, color: 'FFFFFF' });
    s.addNotes('Qualification versus placement: the platform qualifies regions against defined requirements and dates the evidence; each workload decides where and in what role it runs, when the workload is sufficiently understood and with decision-time validation. Each informs the other. Step 5: qualification was an earlier planning assessment, so re-check the target region before onboarding, whether the workload is new or moving; quota allows deployment but does not guarantee capacity. Step 6: if additional platform capabilities are required, treat their introduction as a separate governed platform decision rather than allowing the workload team to redefine the regional profile independently. Step 7: apply workload-specific availability, RTO, RPO, replication, data-consistency, and failover requirements. Regional adaptability still operates within the established landing-zone guardrails and qualified regional options.');
  }
};
