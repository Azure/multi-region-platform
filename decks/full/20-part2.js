const { C, F, IMG } = require('../lib');

// Part 2 · Qualify regions: four checks, the assessment outcome, the decision tree, then each check once.
module.exports = (pres, L) => {
  const D = L.data;
  const CHECKS = ['Business and geography', 'Data and compliance', 'Workload requirements', 'Regional capability'];

  // Check navigation strip: four tabs. `on` is the active check (a number) or a list of active checks;
  // checks before the first active one show as done.
  const checknav = (s, on) => {
    const act = [].concat(on), first = Math.min(...act);
    const gap = 0.12, w = (12.13 - gap * (CHECKS.length - 1)) / CHECKS.length;
    CHECKS.forEach((t, i) => {
      const x = 0.6 + i * (w + gap), a = act.includes(i + 1), done = !a && i + 1 < first;
      L.box(s, x, 0.38, w, 0.34, { fill: a ? C.b600 : done ? C.b50 : C.wash, r: 0.06 });
      L.num(s, i + 1, x + 0.08, 0.435, 0.23, 'FFFFFF', a || done ? C.b600 : C.faint, 9);
      L.txt(s, t, x + 0.38, 0.38, w - 0.42, 0.34, { fontSize: 10, bold: true, color: a ? 'FFFFFF' : done ? C.b700 : C.muted, valign: 'middle' });
    });
  };
  // Eyebrow under the navigation strip: section label, then the kicker.
  const eyebrow = (s, kicker) => L.txt(s, [s._sec.label, kicker].join(' · ').toUpperCase(), 0.6, 0.86, 9, 0.22, { fontSize: 10, bold: true, color: s._sec.color || C.b600, charSpacing: 3 });
  // Check title (the slide's title placeholder) with its number, and the check's question underneath.
  const checkTitle = (s, n, t, q, fill = C.b600, y = 1.1, o = {}) => {
    L.num(s, n, 0.6, y, 0.46, fill, 'FFFFFF', 17);
    L.title(s, t, 1.2, y - 0.02, o.tw || 7.2, 0.5, { fontSize: 24, valign: 'middle' });
    if (q) L.txt(s, q, 0.6, y + 0.6, o.qw || 7.4, 0.35, { fontSize: 14, color: fill === C.t600 ? C.t700 : C.b700 });
  };

  // ───────────────────────── 1 · Regional qualification (PDF p19)
  {
    const s = L.slide('part2');
    L.header(s, null, 'Regional qualification', { tw: 6, lede: 'Which Azure regions should be prepared to support workload requirements — not whether an individual workload should use multiple regions.', lx: 7.2, lw: 5.53 });
    const gap = 0.14, w3 = 4.5, wn = (12.13 - w3 - 3 * gap) / 3, cy = 1.4, ch = 4.25;
    const xs = [0.6, 0.6 + wn + gap, 0.6 + 2 * (wn + gap), 0.6 + 2 * (wn + gap) + w3 + gap];
    const cards = [
      { x: xs[0], w: wn, accent: C.b300, badge: C.b600, name: 'Business and geography', dec: 'Confirm sufficient business value to justify deeper assessment.', tone: 'b',
        bullets: ['Markets and users', 'Datacenter and partner locations', 'Planned launches or migrations', 'Growth, proximity, concentration risk'] },
      { x: xs[1], w: wn, accent: C.b500, badge: C.b600, name: 'Data and compliance', dec: 'Exclude the region when it cannot satisfy a mandatory requirement.', tone: 'w',
        bullets: ['Residency and sovereignty', 'Regulatory and industry requirements', 'Policy and customer commitments', 'Support access and encryption'] },
      { x: xs[2], w: w3, accent: C.t600, badge: C.t600, name: 'Workload requirements and dependencies', dec: 'Identify and record the workload-driven platform requirements.', tone: 't' },
      { x: xs[3], w: wn, accent: C.b800, badge: C.b800, name: 'Regional capability and availability', dec: 'Qualify candidates, documenting conditions and unresolved validations.', tone: 'b',
        bullets: ['Services, models, and SKUs', 'Zones and pairing', 'Latency, pricing, and scale', 'Regional access and quota'] },
    ];
    const dh = 0.96, dTop = cy + ch - dh - 0.06;
    cards.forEach((c, i) => {
      const { x, w } = c, t = c.tone === 't', ck = D.checks[i];
      L.box(s, x, cy, w, ch, { fill: C.white, line: t ? C.t300 : C.line, r: 0.12 });
      L.box(s, x + 0.14, cy, w - 0.28, 0.06, { fill: c.accent, r: 0 });
      L.num(s, i + 1, x + 0.18, cy + 0.26, 0.42, c.badge, 'FFFFFF', 14);
      L.txt(s, c.name, x + 0.7, cy + 0.14, w - 0.85, 0.66, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, ck.question, x + 0.18, cy + 0.88, w - 0.36, 0.64, { fontSize: 12, color: t ? C.t700 : C.b700 });
      // decision footer
      const bg = { b: C.b50, w: C.w50, t: C.t50 }[c.tone], fg = { b: C.b700, w: C.w600, t: C.t700 }[c.tone];
      L.box(s, x + 0.06, dTop, w - 0.12, dh, { fill: bg, r: 0.08 });
      L.txt(s, 'DECISION', x + 0.18, dTop + 0.1, 1.5, 0.18, { fontSize: 9, bold: true, color: fg, charSpacing: 2 });
      L.txt(s, c.dec, x + 0.18, dTop + 0.3, w - 0.36, dh - 0.34, { fontSize: 11, fontFace: F.semi, color: C.ink });
      if (c.bullets) L.bullets(s, c.bullets, x + 0.18, cy + 1.56, w - 0.3, dTop - cy - 1.64, { gap: 3, indent: 12 });
    });
    // card 3: two columns
    {
      const x = xs[2], lw = 1.95, rx = x + 0.18 + lw + 0.2, rw = w3 - 0.36 - lw - 0.2, y0 = cy + 1.4;
      L.txt(s, 'FROM THE WORKLOADS', x + 0.18, y0, lw, 0.2, { fontSize: 9, bold: true, color: C.t600, charSpacing: 1 });
      L.bullets(s, ['Existing and future workloads', 'Closest-fitting archetype', 'Data, connectivity, shared services', 'Security, resiliency, scale'], x + 0.18, y0 + 0.3, lw, dTop - y0 - 0.4, { gap: 3, indent: 12 });
      L.line(s, rx - 0.1, y0, rx - 0.1, dTop - 0.1, { color: C.t300, dash: 'dash', arrow: false });
      L.txt(s, 'PLATFORM REQUIREMENTS', rx, y0, rw, 0.2, { fontSize: 9, bold: true, color: C.t600, charSpacing: 1 });
      let yy = y0 + 0.32;
      [['Platform enablement', 0.24], ['Resilient hybrid connectivity', 0.44], ['Regional platform connectivity', 0.44]].forEach(([t, h], j) => {
        if (j) { L.line(s, rx, yy - 0.08, rx + rw, yy - 0.08, { color: C.t300, dash: 'dash', arrow: false }); }
        L.txt(s, t, rx, yy, rw, h, { fontSize: 11, fontFace: F.semi, color: C.t700 });
        yy += h + 0.16;
      });
    }
    // qualification outcome strip
    const sy = cy + ch + 0.1, sh = 0.8;
    L.box(s, 0.6, sy, 12.13, sh, { fill: C.wash, r: 0.1 });
    L.txt(s, 'Qualification outcome', 0.8, sy, 1.55, sh, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
    const O = [
      ['x', 'o', C.w50, C.w600, 'Excluded', 'A mandatory requirement cannot be met.'],
      ['clock', 'b', C.b50, C.b700, 'Candidate', 'Viable; discovery or validation needed.'],
      ['flag', 'o', C.a100, C.a700, 'Conditional', 'Supported if conditions are resolved.'],
      ['check', 'g', C.g100, C.g600, 'Qualified', 'Dated; onboarding revalidation remains.'],
    ];
    const tx0 = 2.45, tw = (12.73 - 0.1 - tx0 - 3 * 0.1) / 4;
    O.forEach(([ic, c, bg, fg, n, d], i) => {
      const x = tx0 + i * (tw + 0.1);
      L.box(s, x, sy + 0.08, tw, sh - 0.16, { fill: bg, r: 0.08 });
      L.oval(s, x + 0.1, sy + 0.08 + (sh - 0.16 - 0.3) / 2, 0.3, { fill: C.white });
      L.icon(s, ic, x + 0.16, sy + 0.08 + (sh - 0.16 - 0.3) / 2 + 0.06, 0.18, c);
      L.txt(s, [{ text: n, options: { fontFace: F.semi, fontSize: 12, color: fg, breakLine: true } }, { text: d, options: { fontSize: 11, color: C.text } }], x + 0.5, sy + 0.08, tw - 0.56, sh - 0.16, { valign: 'middle' });
    });
    // workbook pointer, once, on its own line
    L.icon(s, 'doc', 0.6, sy + sh + 0.1, 0.24, 'b');
    L.txt(s, [
      { text: 'Use the ' }, { text: D.plannerName, options: { bold: true, color: C.b600, hyperlink: { url: D.workbookUrl, tooltip: 'Open the Multi-region planner' } } },
      { text: ' to answer the four checks, compare availability, prices, and latency, and export to Excel.' }],
    0.95, sy + sh + 0.08, 11.78, 0.28, { fontSize: 11, color: C.text, valign: 'middle' });
    s.addNotes('Regional qualification determines which Azure regions should be prepared to support workload requirements. It does not decide an individual workload’s multi-region architecture. Four checks evaluate each candidate: business and geography, data and compliance, workload requirements and dependencies, and regional capability and availability. Check 3 records platform enablement, resilient hybrid connectivity, and regional platform connectivity requirements for Part 3. Outcomes apply to defined requirements and current evidence, never blanket certification. The Multi-region planner compares service availability, prices, and latency, records the checks, and exports Excel or saves a JSON planning record.');
  }

  // ───────────────────────── 2 · Assessment outcome (PDF p20)
  {
    const s = L.slide('part2');
    L.header(s, 'Assessment outcome', 'Classify every regional option, with evidence', { tw: 11.5 });
    L.txt(s, 'Consolidate the workload requirements and platform needs identified through the four checks. Assess each candidate region against the same criteria and document the result, key tradeoffs, and outstanding validation.', 0.6, 1.4, 5.85, 0.8, { fontSize: 11, color: C.text });
    const tones = [['x', 'o', C.w50, C.w600], ['clock', 'b', C.b50, C.b700], ['flag', 'o', C.a100, C.a700], ['check', 'g', C.g100, C.g600]];
    const hs = [0.62, 0.84, 0.84, 1.04];
    let y = 2.3;
    D.outcomes.forEach((o, i) => {
      const [ic, c, bg, fg] = tones[i], h = hs[i];
      L.box(s, 0.6, y, 5.85, h, { fill: bg, r: 0.1 });
      L.oval(s, 0.76, y + (h - 0.44) / 2, 0.44, { fill: C.white });
      L.icon(s, ic, 0.76 + 0.11, y + (h - 0.44) / 2 + 0.11, 0.22, c);
      L.txt(s, [{ text: o.name, options: { fontFace: F.semi, fontSize: 12.5, color: fg, breakLine: true } }, { text: o.text, options: { fontSize: 11, color: C.text } }], 1.36, y, 4.95, h, { valign: 'middle' });
      y += h + 0.1;
    });
    L.txt(s, 'Record the evidence date, review date, requirements in scope, key constraints, outstanding validations, owner, and revalidation triggers.', 0.6, y + 0.04, 5.85, 0.6, { fontSize: 11, color: C.muted });

    // illustrative portfolio grid
    const gx = 6.85, gy = 1.4, gw = 5.88;
    L.txt(s, 'Illustrative: one portfolio, classified per archetype', gx, gy, gw, 0.3, { fontSize: 12.5, fontFace: F.semi, color: C.ink });
    L.box(s, gx, gy + 0.4, gw, 3.72, { fill: C.white, line: C.line, r: 0.12 });
    const cols = L.data.archetypeLabels;
    const c0 = gx + 1.62, cw = 1.06;
    L.txt(s, 'CANDIDATE REGION', gx + 0.2, gy + 0.5, 1.4, 0.55, { fontSize: 9, bold: true, color: C.t700, valign: 'bottom', charSpacing: 1 });
    cols.forEach((c, j) => L.txt(s, c, c0 + j * cw, gy + 0.5, cw, 0.55, { fontSize: 9, bold: true, color: C.t700, align: 'center', valign: 'bottom' }));
    const rows = [['Region A', 'geographic hub', 'qqqq'], ['Region B', 'geographic hub', 'qqqa'], ['Region C', 'in-country, new', 'qkqa'], ['Region D', 'AI model and SKU', 'qkxx'], ['Region E', 'other geography', 'xxxx']];
    const mk = { q: ['check', 'w', C.g600, null], a: ['clock', 'b', C.white, C.b600], k: ['flag', 'o', C.a100, C.a500], x: ['x', 'o', C.w100, null] };
    rows.forEach(([r, sub, m], i) => {
      const yy = gy + 1.12 + i * 0.5;
      L.box(s, gx + 0.15, yy - 0.03, gw - 0.3, 0.008, { fill: C.soft, r: 0 });
      L.txt(s, [{ text: r, options: { bold: true, color: C.ink, fontSize: 11, breakLine: true } }, { text: sub, options: { fontSize: 10, color: C.muted } }], gx + 0.2, yy, 1.45, 0.46, { valign: 'middle' });
      m.split('').forEach((v, j) => {
        const [ic, c, f, ln] = mk[v], cx = c0 + j * cw + cw / 2;
        L.oval(s, cx - 0.17, yy + 0.06, 0.34, { fill: f, line: ln, dash: v === 'a' ? 'dash' : 'solid', lw: 1.25 });
        L.icon(s, ic, cx - 0.09, yy + 0.14, 0.18, c);
      });
    });
    [['Qualified', C.g600, null], ['Conditional', C.a100, C.a500], ['Candidate', C.white, C.b600], ['Excluded', C.w100, null]].forEach(([t, f, ln], i) => {
      const x = gx + 0.2 + i * 1.4;
      L.oval(s, x, gy + 3.78, 0.16, { fill: f, line: ln, dash: t === 'Candidate' ? 'dash' : 'solid' });
      L.txt(s, t, x + 0.22, gy + 3.73, 1.1, 0.26, { fontSize: 10, color: C.muted, valign: 'middle' });
    });
    // the point of the example
    L.box(s, gx, 5.68, 0.05, 0.72, { fill: C.b600, r: 0 });
    L.txt(s, 'The same region can be qualified for one set of requirements, conditional or a candidate for another, and excluded for a third.', gx + 0.22, 5.68, gw - 0.22, 0.72, { fontSize: 13, color: C.ink, valign: 'middle' });
    L.caption(s, 'Note', 'Qualification is a dated planning input, not permanent approval. Regions and statuses are illustrative.', gx, 6.5, gw);
    s.addNotes('The purpose is not to certify a region for every possible workload. It is to know which options are excluded, which remain candidates or conditional, and which are qualified for defined workload requirements. Assess each candidate region against the same criteria and reuse the assessment in architecture reviews and regional planning. Add the platform connectivity profile to the record when you select it in Part 3. Decision-time validation at onboarding remains authoritative, and onboarding feeds new findings back into the assessment. The regions and statuses in the grid are illustrative.');
  }

  // ───────────────────────── 3 · Decision tree (PDF p21)
  {
    const s = L.slide('part2');
    L.header(s, 'Decision tool', 'Should this region be qualified?', { tw: 6.4 });
    L.txt(s, [
      { text: 'Apply per candidate region and set of defined workload requirements. Each question is one of the four checks. Use the tree to structure the conversation, not as a gate. ' },
      { text: 'Questions 1 and 2 need no technical assessment.', options: { bold: true, color: C.ink } },
      { text: ' Answer them for every candidate region first.' }], 7.2, 0.46, 5.53, 1.0, { fontSize: 12, color: C.muted, lineSpacingMultiple: 1.05 });
    L.box(s, 4.0, 1.5, 3.3, 0.38, { fill: C.s800, r: 0.19 });
    L.txt(s, 'Candidate region + defined requirements', 4.0, 1.5, 3.3, 0.38, { fontSize: 11, fontFace: F.semi, color: C.white, align: 'center', valign: 'middle' });
    const Q = [
      ['Does the region have sufficient business value to justify deeper assessment?', 'No', [['No deeper assessment', {}]], 'Business value does not justify further assessment.', 'st'],
      ['Can it satisfy all mandatory data, compliance, and policy requirements?', 'No', [['Excluded', {}]], 'A mandatory requirement cannot be satisfied.', 'ex'],
      ['Are the workload requirements, dependencies, archetypes, and platform needs known and validated?', 'Not yet', [['Candidate', {}]], 'Complete discovery or relocation assessment, or set guardrails and assess at onboarding.', 'ca'],
      ['Do services, models, SKUs, zones, access, and quota meet the requirements, including recovery?', 'Unresolved', [['Conditional', {}], [' or excluded if the gap is mandatory', { fontFace: F.body, bold: false }]], 'Record material gaps, required changes, and validation owners.', 'co'],
    ];
    const qx = 2.55, qw = 4.8, ox = 8.45, ow = 4.28, qh = 0.78, pitch = 1.03, y0 = 2.02;
    Q.forEach(([q, no, name, desc, k], i) => {
      const y = y0 + i * pitch, ck = D.checks[i], t = i === 2;
      L.txt(s, [{ text: 'CHECK ' + (i + 1), options: { bold: true, fontSize: 10, color: t ? C.t600 : C.b600, charSpacing: 2, breakLine: true } }, { text: ck.name, options: { fontFace: F.semi, fontSize: 11, color: C.ink } }], 0.6, y, 1.8, qh, { valign: 'middle' });
      L.box(s, qx, y, qw, qh, { fill: C.white, line: t ? C.t600 : C.b500, lw: 1.25, r: 0.12 });
      L.num(s, i + 1, qx + 0.12, y + (qh - 0.32) / 2, 0.32, t ? C.t50 : C.b50, t ? C.t700 : C.b700, 11);
      L.txt(s, q, qx + 0.56, y, qw - 0.68, qh, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
      const bg = { st: C.wash, ex: C.w50, ca: C.white, co: C.a100 }[k], fg = { st: C.s600, ex: C.w600, ca: C.b700, co: C.a700 }[k];
      L.box(s, ox, y, ow, qh, { fill: bg, line: k === 'ca' ? C.b500 : k === 'co' ? C.a500 : undefined, dash: k === 'ca' ? 'dash' : 'solid', r: 0.1 });
      const runs = name.map(([tx, o], j) => ({ text: tx, options: Object.assign({ bold: true, color: fg, fontSize: 12 }, o, j === name.length - 1 ? { breakLine: true } : {}) }));
      L.txt(s, runs.concat([{ text: desc, options: { color: C.muted, fontSize: 11 } }]), ox + 0.16, y, ow - 0.28, qh, { valign: 'middle' });
      const col = k === 'ex' ? C.w600 : k === 'st' ? C.faint : k === 'co' ? C.a500 : C.b600;
      L.line(s, qx + qw, y + qh / 2, ox, y + qh / 2, { color: col, dash: k === 'ca' || k === 'co' ? 'dash' : 'solid' });
      L.tag(s, no, (qx + qw + ox) / 2, y + qh / 2, { color: k === 'co' ? C.a700 : col, w: no.length * 0.085 + 0.28 });
      L.line(s, qx + qw / 2, y + qh, qx + qw / 2, y + pitch, { color: i === 3 ? C.g600 : C.b600 });
      L.tag(s, 'Yes', qx + qw / 2, y + qh + (pitch - qh) / 2, { color: i === 3 ? C.g600 : C.b600, w: 0.5 });
    });
    L.line(s, qx + qw / 2, 1.88, qx + qw / 2, y0, { color: C.b600 });
    L.line(s, 5.95, 1.88, 5.95, y0, { color: C.b600 });   // spine from the start node
    const yq = y0 + 4 * pitch;
    L.box(s, qx, yq, 10.18, 0.7, { fill: C.g600, r: 0.12 });
    L.oval(s, qx + 0.16, yq + 0.15, 0.4, { fill: C.white }); L.icon(s, 'check', qx + 0.24, yq + 0.23, 0.24, 'g');
    L.txt(s, [{ text: 'Qualified as of the assessment date', options: { fontFace: F.semi, fontSize: 13, breakLine: true } }, { text: 'Current evidence supports the defined workload requirements, with constraints and ownership recorded.', options: { fontSize: 11, color: C.g100 } }], qx + 0.72, yq, 6.1, 0.7, { color: C.white, valign: 'middle' });
    L.line(s, 9.6, yq + 0.12, 9.6, yq + 0.58, { color: C.g100, arrow: false, w: 0.75 });
    L.txt(s, [{ text: 'Not a placement decision. ', options: { bold: true } }, { text: 'Onboarding revalidation is still required.' }], 9.75, yq, 2.85, 0.7, { fontSize: 11, color: C.white, valign: 'middle' });
    s.addNotes('Apply the tree to each candidate region and set of defined workload requirements. Each question is one of the four checks, and every yes continues down the spine. The first failing question sets the classification: no deeper assessment, excluded, candidate, or conditional (or excluded if the gap is mandatory). Filters come first, then requirements, then technical fit. Questions 1 and 2 need no technical assessment, so answer them for every candidate region first and spend deeper work only on the regions that pass. Candidate and conditional options return to the tree when validation is complete or conditions change.');
  }

  // ───────────────────────── 4 · Checks 1 and 2 (PDF p22)
  {
    const s = L.slide('part2');
    checknav(s, [1, 2]);
    eyebrow(s, 'Check 1 and 2');
    L.title(s, 'Business and geography, and data and compliance', 0.6, 1.08, 12.1, 0.5, { fontSize: 24, valign: 'middle' });
    const cols = [
      { x: 0.6, n: 1, ck: D.checks[0], text: 'Start with the business reason for considering another region. Evaluate expected markets and users, datacenter and partner locations, planned launches or migrations, anticipated growth, proximity requirements, and geographic concentration risk.', tone: 'b' },
      { x: 6.95, n: 2, ck: D.checks[1], text: 'Determine whether anticipated workloads and their data can operate in the region. Consider data residency and sovereignty, regulatory and industry requirements, company policy, customer commitments, support access, encryption, and restrictions on data movement or operational control.', tone: 'w' },
    ];
    cols.forEach(c => {
      L.num(s, c.n, c.x, 1.78, 0.4, C.b600, 'FFFFFF', 15);
      L.txt(s, c.ck.question, c.x + 0.55, 1.78, 5.2, 0.4, { fontSize: 15, color: C.b700, valign: 'middle' });
      L.txt(s, c.text, c.x, 2.35, 5.78, 1.05, { fontSize: 12, color: C.text });
      L.decision(s, c.ck.decision, c.x, 3.5, 5.78, 0.85, c.tone);
    });
    L.box(s, 6.65, 1.8, 0.012, 2.55, { fill: C.soft, r: 0 });
    // funnel
    const y0 = 4.7;
    L.txt(s, 'CANDIDATE REGIONS UNDER CONSIDERATION', 0.6, y0 - 0.12, 6, 0.2, { fontSize: 9, bold: true, color: C.muted, charSpacing: 2 });
    L.box(s, 0.6, y0 + 0.15, 3.5, 1.3, { fill: C.b50, r: 0.12 });
    for (let k = 0; k < 18; k++) L.oval(s, 0.8 + (k % 6) * 0.55 + (Math.floor(k / 6) % 2) * 0.2, y0 + 0.33 + Math.floor(k / 6) * 0.36, 0.14, { fill: C.b500 });
    L.box(s, 4.1, y0 + 0.57, 1.5, 0.46, { fill: C.white, line: C.b600, r: 0.23 });
    L.txt(s, [{ text: 'CHECK 1', options: { bold: true, fontSize: 9, breakLine: true } }, { text: 'Business value?', options: { fontSize: 10 } }], 4.1, y0 + 0.57, 1.5, 0.46, { color: C.b700, align: 'center', valign: 'middle' });
    L.box(s, 5.6, y0 + 0.3, 2.8, 1.0, { fill: C.b100, r: 0.12 });
    for (let k = 0; k < 9; k++) L.oval(s, 5.8 + (k % 5) * 0.5 + Math.floor(k / 5) * 0.25, y0 + 0.47 + Math.floor(k / 5) * 0.4, 0.14, { fill: C.b600 });
    L.box(s, 8.4, y0 + 0.57, 1.5, 0.46, { fill: C.white, line: C.w600, r: 0.23 });
    L.txt(s, [{ text: 'CHECK 2', options: { bold: true, fontSize: 9, breakLine: true } }, { text: 'Allowed here?', options: { fontSize: 10 } }], 8.4, y0 + 0.57, 1.5, 0.46, { color: C.w600, align: 'center', valign: 'middle' });
    L.box(s, 9.9, y0 + 0.45, 2.83, 0.7, { fill: C.b600, r: 0.12 });
    L.txt(s, [{ text: 'Proceed to checks 3 and 4', options: { fontFace: F.semi, fontSize: 12, breakLine: true } }, { text: 'Workloads · capability · platform', options: { fontSize: 10, color: C.b100 } }], 10.1, y0 + 0.45, 2.6, 0.7, { color: C.white, valign: 'middle' });
    L.path(s, [[4.85, y0 + 1.03], [4.85, y0 + 1.6], [5.1, y0 + 1.6]], { color: C.faint, dash: 'dash' });
    L.txt(s, 'No deeper assessment: value does not justify it', 5.15, y0 + 1.47, 3.6, 0.26, { fontSize: 11, color: C.muted, valign: 'middle' });
    L.path(s, [[8.75, y0 + 1.03], [8.75, y0 + 1.6], [9.0, y0 + 1.6]], { color: C.w600 });
    L.chip(s, 'Excluded', 9.05, y0 + 1.47, { fill: C.w100, color: C.w600, size: 10 });
    L.txt(s, 'mandatory requirement not met', 10.1, y0 + 1.47, 2.63, 0.26, { fontSize: 11, color: C.muted, valign: 'middle' });
    L.caption(s, 'Figure', 'The first two checks filter the portfolio before deeper technical assessment. Only regions that pass both proceed to workload and capability analysis.', 0.6, 6.5, 12.1);
    s.addNotes('Check 1 asks where Azure presence is needed. Business value decides whether a region merits deeper assessment; regions that do not pass need no further work. Check 2 asks whether workloads and their data are allowed to operate in the region; a region that cannot satisfy a mandatory data, compliance, or policy requirement is excluded. Only regions that pass both proceed to workload and capability analysis. References for check 1: Select Azure regions (Cloud Adoption Framework) and Azure geographies. References for check 2: Data residency in Azure, Azure compliance documentation, and Reliability and sovereignty in Azure, which connects sovereignty requirements to regional selection, backup and replication destinations, encryption, and operational control.');
  }

  // ───────────────────────── 5 · Check 3 (PDF p23)
  {
    const s = L.slide('part2');
    checknav(s, 3);
    eyebrow(s, 'Check 3');
    const ck = D.checks[2];
    checkTitle(s, 3, ck.name, ck.question, C.t600, 1.1, { tw: 7.3, qw: 7.5 });
    L.decision(s, ck.decision, 8.45, 0.9, 4.28, 1.0, 't');
    const top = 2.15, pops = [
      ['app', 'Existing workloads', 'In Azure, on-premises, or another cloud. Start with inventory and architecture; validate important dependencies with owners.', 'solid', 2.08],
      ['flag', 'Future workloads', 'Known requirements, workload patterns, intended architecture, and expected dependencies. Defer implementation detail to onboarding.', 'dash', 1.5],
    ];
    const rbH = 3.7;
    let py = top;
    pops.forEach(([ic, t, d, dash, h], i) => {
      L.box(s, 0.6, py, 3.7, h, { fill: C.white, line: C.line, dash, r: 0.1 });
      L.icon(s, ic, 0.78, py + 0.14, 0.28, 't');
      L.txt(s, t, 1.16, py + 0.1, 3.0, 0.36, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, 0.78, py + 0.52, 3.35, 0.78, { fontSize: 11, color: C.muted });
      if (i === 0) {
        L.line(s, 0.78, py + 1.28, 4.12, py + 1.28, { color: C.line, dash: 'dash', arrow: false });
        L.txt(s, [{ text: 'Moving into the region? ', options: { bold: true } }, { text: 'Also capture what must move together and how it behaves while split.' }], 0.78, py + 1.34, 3.35, 0.5, { fontSize: 11, color: C.t700 });
      }
      L.path(s, [[4.3, py + h / 2], [4.5, py + h / 2], [4.5, top + rbH / 2], [4.75, top + rbH / 2]], { color: C.t600, dash: dash === 'dash' ? 'dash' : 'solid', arrow: i === 0 });
      py += h + 0.12;
    });
    L.box(s, 4.75, top, 3.5, rbH, { fill: C.t50, line: C.t300, r: 0.12 });
    L.txt(s, 'REVIEW AND CAPTURE', 4.95, top + 0.14, 3, 0.2, { fontSize: 9, bold: true, color: C.t600, charSpacing: 2 });
    L.txt(s, 'Workload requirements and dependencies', 4.95, top + 0.38, 3.1, 0.6, { fontSize: 13, fontFace: F.semi, color: C.t700 });
    L.bullets(s, ['Architecture, data, and connectivity', 'Shared services and security', 'Resiliency, scale, and operations', 'Required Azure services'], 4.95, top + 1.1, 3.1, 1.2, { gap: 4, indent: 12 });
    L.line(s, 4.95, top + 2.42, 8.05, top + 2.42, { color: C.t300, dash: 'dash', arrow: false });
    L.txt(s, 'Map to the closest-fitting archetype where useful; record requirements beyond it as explicit additions.', 4.95, top + 2.5, 3.1, 0.95, { fontSize: 11, color: C.t700, italic: true });
    const outs = [
      ['WORKLOAD-DRIVEN', 'Platform requirements', 'The regional and platform capabilities workloads require.', C.b600, C.white, C.b100, C.b200],
      ['AFFECTS SUITABILITY', 'Validated in check 4', 'Requirements that could materially change regional suitability.', C.b50, C.b800, C.muted, C.b600],
      ['IMPLEMENTATION DETAIL', 'Deferred to onboarding', 'Evaluated during workload onboarding or reassessment.', C.white, C.b800, C.muted, C.b600],
    ];
    outs.forEach(([k, t, d, f, c1, c2, c3], i) => {
      const y = top + i * ((rbH - 1.1) / 2);
      L.path(s, [[8.25, top + rbH / 2], [8.5, top + rbH / 2], [8.5, y + 0.55], [8.75, y + 0.55]], { color: C.b600, dash: i === 2 ? 'dash' : 'solid' });
      L.box(s, 8.75, y, 3.98, 1.1, { fill: f, line: i === 2 ? C.b500 : i === 1 ? C.b200 : undefined, dash: i === 2 ? 'dash' : 'solid', r: 0.1 });
      L.txt(s, k, 8.93, y + 0.1, 3.6, 0.2, { fontSize: 9, bold: true, color: i === 0 ? C.b200 : C.b600, charSpacing: 2 });
      L.txt(s, t, 8.93, y + 0.3, 3.6, 0.28, { fontSize: 12.5, fontFace: F.semi, color: c1 });
      L.txt(s, d, 8.93, y + 0.6, 3.6, 0.45, { fontSize: 11, color: c2 });
    });
    L.box(s, 0.6, 6.0, 12.13, 0.72, { fill: C.w50, r: 0.1 });
    L.txt(s, [{ text: 'SCOPE BOUNDARY   ', options: { bold: true, color: C.w600, fontSize: 9, charSpacing: 2 } }, { text: "This check doesn't approve relocation or define migration execution. Relocation readiness, sequencing, recovery design, and multi-region operation remain workload-specific.", options: { color: C.ink, fontSize: 11 } }], 0.8, 6.0, 11.75, 0.72, { valign: 'middle' });
    s.addNotes('Regional qualification should reflect the requirements of the workloads expected to use the region: existing workloads in Azure, on-premises, or another cloud, including any that would move into the region, and future workloads that are planned but not yet built. Review architecture, connectivity, data, shared-service, security, resiliency, scale, and operational requirements and dependencies. Where useful, map the key workloads to the closest-fitting Workload Landing Zone archetype; if a workload has requirements beyond that archetype, record them as explicit additions rather than forcing multiple classifications. For a workload moving into the region, also identify what must move together, what can stay where it is, and how it behaves while split across locations: latency, data movement, application changes, acceptable disruption, and temporary operation. Requirements that could materially affect regional suitability are validated in check 4; implementation-specific decisions wait for onboarding. References: Evaluate a cloud workload for relocation; Relocate cloud workloads.');
  }

  // ───────────────────────── 6 · Platform and connectivity requirements (PDF p24)
  {
    const s = L.slide('part2');
    checknav(s, 3);
    eyebrow(s, 'Check 3 · Continued');
    L.title(s, 'Platform and connectivity requirements', 0.6, 1.08, 7.4, 0.5, { fontSize: 24, valign: 'middle' });
    L.txt(s, 'Workload requirements also define what the platform must provide in the region. Capture them in three areas.', 8.3, 1.0, 4.43, 0.7, { fontSize: 12, color: C.muted });
    const cards = [
      ['layers', 'Platform enablement', 'The shared services and operational capabilities the workloads depend on, such as identity, security controls, monitoring, backup, and key management, and which of them must be close to the workloads.', 'Place shared services'],
      ['network', 'Resilient hybrid connectivity', 'The datacenters and users the workloads must reach, and the latency, bandwidth, routing, and resilience they need on that path.', 'Confirm hybrid connectivity'],
      ['route', 'Regional platform connectivity', 'How the workloads must reach geographic hubs, shared platform services, application dependencies, other Azure regions, and hybrid environments.', 'Select the connectivity profile'],
    ];
    const cw = (12.13 - 2 * 0.2) / 3, cy = 2.05, chh = 3.55;
    cards.forEach(([ic, t, d, dec], i) => {
      const x = 0.6 + i * (cw + 0.2);
      L.box(s, x, cy, cw, chh, { fill: C.white, line: C.t300, r: 0.12 });
      L.box(s, x + 0.14, cy, cw - 0.28, 0.06, { fill: C.t600, r: 0 });
      L.badge(s, ic, x + 0.22, cy + 0.26, 0.46, C.t600);
      L.txt(s, t, x + 0.84, cy + 0.2, cw - 1.0, 0.58, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, 'WHAT TO IDENTIFY', x + 0.22, cy + 0.98, 3, 0.2, { fontSize: 9, bold: true, color: C.t600, charSpacing: 2 });
      L.txt(s, d, x + 0.22, cy + 1.26, cw - 0.44, 1.5, { fontSize: 12.5, color: C.text });
      L.box(s, x + 0.06, cy + chh - 0.86, cw - 0.12, 0.8, { fill: C.b50, r: 0.08 });
      L.icon(s, 'route', x + 0.22, cy + chh - 0.6, 0.28, 'b', 'Arrow icon');
      L.txt(s, [{ text: 'DECIDED IN PART 3', options: { bold: true, fontSize: 9, color: C.b700, charSpacing: 2, breakLine: true } }, { text: dec, options: { fontFace: F.semi, fontSize: 12.5, color: C.ink } }], x + 0.64, cy + chh - 0.86, cw - 0.8, 0.8, { valign: 'middle' });
    });
    L.box(s, 0.6, 5.95, 0.06, 0.6, { fill: C.t600, r: 0 });
    L.txt(s, "This check gathers requirements. It doesn't decide how they are met, and it doesn't disqualify a region directly.", 0.88, 5.95, 11.8, 0.6, { fontSize: 15, color: C.ink, valign: 'middle' });
    s.addNotes('Workload requirements also define what the platform must provide in the region, so check 3 records them in three areas. Platform enablement covers the shared services and operational capabilities the workloads depend on, such as identity, security controls, monitoring, backup, and key management, and which of them must be close to the workloads. Resilient hybrid connectivity covers the datacenters and users the workloads must reach and the latency, bandwidth, routing, and resilience they need on that path. Regional platform connectivity covers how the workloads must reach geographic hubs, shared platform services, application dependencies, other Azure regions, and hybrid environments. Each area is decided in Part 3: place shared services, confirm hybrid connectivity, and select the connectivity profile. This check gathers requirements. It does not decide how they are met, and it does not disqualify a region directly.');
  }

  // ───────────────────────── 7 · Check 4 (PDF p25)
  {
    const s = L.slide('part2');
    checknav(s, 4);
    eyebrow(s, 'Check 4');
    const ck = D.checks[3];
    checkTitle(s, 4, ck.name, ck.question, C.b600, 1.1, { tw: 8.5, qw: 8.5 });
    const paras = [
      'Evaluate each candidate region against the workload requirements identified in check 3: required Azure services, deployment models and SKUs, zone support, regional service dependencies, latency, pricing, expected scale, access, and quota.',
      'Assess availability-zone support and region pairing separately. Validate service-specific capabilities such as replication, backup and restore, and other regional dependencies against the resiliency requirements.',
      'For requirements that depend on multiple regions, validate the intended combination at the service level. Record material gaps, required changes, and owners for unresolved validation.',
    ];
    paras.forEach((p, i) => L.txt(s, p, 0.6, 2.2 + [0, 1.15, 2.3][i], 5.9, 1.05, { fontSize: 12, color: C.text }));
    L.caption(s, 'Figure', 'Zones and pairing are independent questions. Neither guarantees nor rules out workload recovery. See the service guides and Resources.', 0.6, 6.3, 5.9);
    // right: zones and pairing
    const rx = 6.9, rw = 5.83, cw = (rw - 0.13) / 2;
    L.txt(s, 'ASSESS SEPARATELY', rx, 2.12, 3, 0.2, { fontSize: 9, bold: true, color: C.muted, charSpacing: 2 });
    const cardTop = 2.4, cardH = 2.0;
    [['Availability-zone support', 'Prefer zone-enabled regions where they meet workload requirements.'], ['Region pairing', 'Consider both paired and nonpaired options.']].forEach(([t, d], i) => {
      const x = rx + i * (cw + 0.13);
      L.box(s, x, cardTop, cw, cardH, { fill: C.white, line: C.line, r: 0.12 });
      L.txt(s, t, x + 0.2, cardTop + 0.12, cw - 0.4, 0.3, { fontSize: 12.5, fontFace: F.semi, color: C.ink });
      if (i === 0) {
        L.box(s, x + 0.2, cardTop + 0.52, cw - 0.4, 0.68, { fill: C.b50, line: C.b300, dash: 'dash', r: 0.1 });
        [0, 1, 2].forEach(k => { const zx = x + 0.32 + k * 0.78; L.box(s, zx, cardTop + 0.62, 0.7, 0.48, { fill: C.white, line: C.b500, r: 0.07 }); L.txt(s, `Zone ${k + 1}`, zx, cardTop + 0.62, 0.7, 0.48, { fontSize: 10, bold: true, color: C.b700, align: 'center', valign: 'middle' }); });
      } else {
        [x + 0.2, x + cw - 1.0].forEach(px => { L.box(s, px, cardTop + 0.52, 0.8, 0.68, { fill: C.b50, line: C.b300, dash: 'dash', r: 0.1 }); L.icon(s, 'pin', px + 0.23, cardTop + 0.72, 0.34, 'b'); });
        L.line(s, x + 1.0, cardTop + 0.86, x + cw - 1.0, cardTop + 0.86, { color: C.b500, dash: 'dash', arrow: false });
        L.txt(s, 'paired or nonpaired', x + 1.0, cardTop + 0.52, cw - 2.0, 0.3, { fontSize: 9, bold: true, color: C.muted, align: 'center', valign: 'bottom' });
      }
      L.txt(s, d, x + 0.2, cardTop + 1.32, cw - 0.4, 0.62, { fontSize: 11, color: C.text });
    });
    L.txt(s, 'DO NOT ASSUME', rx, 4.55, 3, 0.2, { fontSize: 9, bold: true, color: C.w600, charSpacing: 2 });
    [['…that a paired region provides workload recovery.'], ['…that a nonpaired region cannot support it.']].forEach(([t], i) => {
      const x = rx + i * (cw + 0.13);
      L.box(s, x, 4.8, cw, 0.58, { fill: C.w50, r: 0.1 });
      L.icon(s, 'x', x + 0.12, 4.8 + 0.18, 0.22, 'o');
      L.txt(s, t, x + 0.46, 4.8, cw - 0.56, 0.58, { fontSize: 11, color: C.ink, valign: 'middle' });
    });
    L.box(s, rx, 5.5, rw, 1.36, { fill: C.wash, r: 0.12 });
    L.txt(s, 'VALIDATE REGIONAL DEPENDENCIES', rx + 0.2, 5.58, 4, 0.2, { fontSize: 9, bold: true, color: C.b700, charSpacing: 2 });
    let cx = rx + 0.2;
    [['Storage GRS', 1.1], ['Azure SQL replication', 1.75], ['Backup and restore', 1.45], ['Key Vault', 0.95]].forEach(([t, w]) => {
      L.box(s, cx, 5.82, w, 0.32, { fill: C.white, line: C.b200, r: 0.08 });
      L.txt(s, t, cx, 5.82, w, 0.32, { fontSize: 10, bold: true, color: C.b800, align: 'center', valign: 'middle' });
      cx += w + 0.1;
    });
    const bw = (rw - 0.4 - 0.1) / 2;
    L.line(s, rx + 0.2 + bw / 2, 6.14, rx + 0.2 + bw / 2, 6.26, { color: C.b600 });
    L.line(s, rx + 0.3 + bw * 1.5, 6.14, rx + 0.3 + bw * 1.5, 6.26, { color: C.t600 });
    L.box(s, rx + 0.2, 6.28, bw, 0.5, { fill: C.white, line: C.b200, r: 0.08 });
    L.txt(s, [{ text: 'Built-in capabilities', options: { bold: true } }, { text: ' support the outcome' }], rx + 0.32, 6.28, bw - 0.24, 0.5, { fontSize: 11, color: C.b800, valign: 'middle' });
    L.box(s, rx + 0.3 + bw, 6.28, bw, 0.5, { fill: C.white, line: C.t300, r: 0.08 });
    L.txt(s, [{ text: 'Additional workload design', options: { bold: true } }, { text: ' is required' }], rx + 0.42 + bw, 6.28, bw - 0.24, 0.5, { fontSize: 11, color: C.t700, valign: 'middle' });
    s.addNotes('Evaluate each candidate against check 3 requirements. Assess zones and pairing independently. Pairing alone does not provide workload recovery; nonpaired regions can be recovery destinations where services support them. Validate replication, backup and restore, and other regional dependencies for the intended combination, including Storage GRS and Azure SQL replication. Record gaps, changes, and validation owners. Detailed design is in Service Guides for Multi Region; pairing and resiliency scenarios are in Resources.');
  }

  // ───────────────────────── 8 · Check 4, continued (PDF p26)
  {
    const s = L.slide('part2');
    checknav(s, 4);
    eyebrow(s, 'Check 4 · Continued');
    L.title(s, 'Access, quota, and evidence-based evaluation', 0.6, 1.08, 10, 0.5, { fontSize: 24, valign: 'middle' });
    L.txt(s, 'Validate whether the intended subscription and offer types can deploy in the region, and identify any regional access restrictions or approvals to resolve before deployment. Assess required quota based on expected workload scale and identify any quota increases that may be required.', 0.6, 1.75, 7.4, 1.1, { fontSize: 12, color: C.text });
    L.box(s, 8.43, 1.75, 4.3, 1.1, { fill: C.w50, r: 0.12 });
    L.icon(s, 'gauge', 8.63, 1.92, 0.3, 'o');
    L.txt(s, [{ text: 'Quota is not capacity', options: { fontFace: F.semi, fontSize: 12.5, color: C.w600, breakLine: true } }, { text: 'Quota is not an indication or guarantee of Azure capacity, which remains subject to availability at deployment time.', options: { fontSize: 11, color: C.ink } }], 9.05, 1.84, 3.5, 0.95, { valign: 'top' });
    L.txt(s, 'Evaluate objective regional characteristics programmatically, where possible', 0.6, 3.05, 9, 0.3, { fontSize: 13, fontFace: F.semi, color: C.ink });
    const fy = 3.45;
    L.box(s, 0.6, fy, 3.0, 2.32, { fill: C.wash, r: 0.12 });
    L.txt(s, 'INPUTS', 0.8, fy + 0.12, 2, 0.2, { fontSize: 9, bold: true, color: C.muted, charSpacing: 2 });
    L.bullets(s, ['Required services and SKUs', 'Zone requirements', 'Latency targets', 'Pricing considerations', 'Expected scale', 'Access eligibility and quota'], 0.8, fy + 0.4, 2.7, 1.85, { gap: 3, indent: 12 });
    L.line(s, 3.62, fy + 0.85, 4.1, fy + 0.85, { color: C.b600, w: 1.5 });
    L.box(s, 4.1, fy, 2.6, 1.5, { fill: C.b600, r: 0.12 });
    L.txt(s, [{ text: 'REGIONAL ASSESSMENT', options: { bold: true, fontSize: 9, color: C.b100, charSpacing: 2, breakLine: true } }, { text: 'Candidate regions compared against workload requirements', options: { fontFace: F.semi, fontSize: 13 } }], 4.26, fy, 2.3, 1.5, { color: C.white, valign: 'middle' });
    L.line(s, 5.4, fy + 1.72, 5.4, fy + 1.5, { color: C.faint, dash: 'dash' });
    L.box(s, 4.1, fy + 1.72, 2.6, 0.58, { fill: C.white, line: C.s300, dash: 'dash', r: 0.08 });
    L.txt(s, "Manual review for what can't be determined reliably", 4.18, fy + 1.72, 2.44, 0.58, { fontSize: 11, color: C.s600, align: 'center', valign: 'middle' });
    const O = [
      ['Qualified regions', 'Meet the identified requirements as of the assessment date', C.g100, C.g600, C.g600, 'solid'],
      ['Unmet requirements', 'Gaps that exclude a region or need workload design', C.w50, C.w600, C.w600, 'solid'],
      ['Conditional constraints', 'Conditions under which a region can be used', C.b50, C.b700, C.b600, 'solid'],
      ['Items requiring validation', 'Open questions, owners, and follow-up', C.white, C.b700, C.b600, 'dash'],
    ];
    O.forEach(([t, d, bg, fg, ln, dash], i) => {
      const y = fy + i * 0.6;
      L.line(s, 6.7, fy + 0.75, 7.15, y + 0.26, { color: ln, dash, arrow: true });
      L.box(s, 7.15, y, 5.58, 0.52, { fill: bg, line: dash === 'dash' ? C.b500 : undefined, dash, r: 0.08 });
      L.txt(s, [{ text: t, options: { fontFace: F.semi, fontSize: 12, color: fg, breakLine: true } }, { text: d, options: { fontSize: 11, color: C.muted } }], 7.32, y, 5.3, 0.52, { valign: 'middle' });
    });
    L.txt(s, [{ text: 'If a requirement that could materially affect regional suitability is unresolved, keep the region ' }, { text: 'conditional', options: { bold: true, color: C.a700 } }, { text: ' until it is validated.' }], 0.6, 6.12, 5.9, 0.7, { fontSize: 11.5, color: C.ink, valign: 'middle' });
    L.decision(s, D.checks[3].decision, 6.85, 6.0, 5.88, 0.85, 'b');
    s.addNotes('Validate whether the intended subscription and offer types can deploy in the region, and identify any regional access restrictions or approvals that must be resolved before deployment. Assess required quota from expected workload scale and identify any increases that may be required. Quota is not an indication or guarantee of Azure capacity, which remains subject to availability at deployment time. Where possible, evaluate objective regional characteristics programmatically, using the requirements as inputs. The assessment should identify candidate regions, unmet requirements, conditional constraints, and items that need more validation; use manual review for what cannot be determined reliably from published or programmatic information. Evaluate requirements that do not affect regional qualification later, during workload onboarding or reassessment. References: Azure region pairs and nonpaired regions; Azure services that support multiple regions; Azure services that support availability zones; Zonal resources and zone resiliency; Enable zone resiliency for Azure workloads.');
  }
};
