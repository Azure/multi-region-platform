const { C, F, IMG } = require('../lib');

module.exports = (pres, L) => {
  // ───────────────────────── Customer scenarios (PDF p45–46)
  const TONE = { w: [C.w600, C.w50], b: [C.b600, C.b50], g: [C.g600, C.g100], t: [C.t600, C.t50], v: [C.v600, C.v50], s: [C.s800, C.s100] };
  [[0, 1], [2, 3]].forEach((pair, pi) => {
    const s = L.slide('scenarios');
    L.header(s, pi ? 'Continued' : 'The framework in use', pi ? 'Customer scenarios 3 and 4' : 'Customer scenarios 1 and 2', { ec: C.t600, tw: 8.6, lede: 'Illustrative scenarios, not customer-specific recommendations.', lx: 9.3, lw: 3.43 });
    pair.forEach((k, j) => {
      const sc = L.data.scenarios[k], y = 1.3 + j * 2.83, h = 2.72;
      L.box(s, 0.6, y, 12.13, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.num(s, sc.n, 0.8, y + 0.14, 0.38, C.t600, 'FFFFFF', 14);
      L.txt(s, sc.title, 1.35, y + 0.12, 8.2, 0.34, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle' });
      const cw0 = sc.tag.length * 0.07 + 0.3;
      L.chip(s, sc.tag, 12.53 - cw0, y + 0.16, { w: cw0, fill: C.s100, color: C.s800, size: 10 });
      L.txt(s, sc.short.situation, 1.35, y + 0.5, 11.2, 0.28, { fontSize: 11, color: C.text });
      // six cells; widths follow the text length so every cell wraps to about the same number of lines
      const gap = 0.08, total = 11.73 - gap * 5, wt = sc.short.steps.map(t => t.length + 14), sum = wt.reduce((a, b) => a + b, 0);
      const mins = sc.steps.map(st => Math.max(1.5, st.label.length * 0.085 + 0.3));
      let ws = wt.map((v, i) => Math.max(mins[i], total * v / sum));
      for (let it = 0; it < 6; it++) {   // take the surplus from the cells that are wider than their minimum
        const over = ws.reduce((a, b) => a + b, 0) - total, free = ws.reduce((a, b, i) => a + (b > mins[i] + 0.01 ? b - mins[i] : 0), 0);
        if (Math.abs(over) < 0.005 || free <= 0) break;
        ws = ws.map((v, i) => (v > mins[i] + 0.01 ? v - over * (v - mins[i]) / free : v));
      }
      let x = 0.8;
      sc.short.steps.forEach((txt, i) => {
        const st = sc.steps[i], [fg, bg] = TONE[st.tone], w = ws[i], cy = y + 0.88, ch = 1.3;
        L.box(s, x, cy, w, ch, { fill: bg, r: 0.08 });
        L.txt(s, st.label.toUpperCase(), x + 0.1, cy + 0.08, w - 0.15, 0.2, { fontSize: 9.5, bold: true, color: fg, charSpacing: 0.5 });
        L.txt(s, txt, x + 0.1, cy + 0.32, w - 0.2, ch - 0.36, { fontSize: 11, color: C.ink });
        x += w + gap;
      });
      L.icon(s, 'flag', 0.82, y + 2.3, 0.22, 't');
      L.txt(s, [{ text: 'Takeaway. ', options: { bold: true } }, { text: sc.short.takeaway }], 1.15, y + 2.2, 11.4, 0.42, { fontSize: 11, color: C.ink, valign: 'middle' });
    });
    s.addNotes(pair.map(k => { const sc = L.data.scenarios[k]; return `Scenario ${sc.n}, ${sc.title}. ${sc.situation} Deciding checks: ${sc.steps[1].text} Placement: ${sc.steps[5].text} ${sc.takeaway}`; }).join('\n\n'));
  });

  // ───────────────────────── Common misconceptions (PDF p47)
  // Four of the eight are covered by the executive summary slide "What adding a region involves"
  // (own landing-zone project, Full Regional Hub, another ExpressRoute circuit, migrating workloads); this slide keeps the other four.
  {
    const s = L.slide('practice');
    L.header(s, '', 'Common misconceptions', { tw: 7, lede: 'Teams often add complexity by starting from assumptions instead of workload and platform requirements.', lx: 8.3, lw: 4.43 });
    const KEEP = ['We must choose the perfect regions up front.', 'Qualified means approved for any workload.', 'A paired region is our disaster recovery.', 'A multi-region platform means active-active.'];
    const M = KEEP.map(claim => { const m = L.data.misconceptions.find(x => x.claim === claim); if (!m) throw new Error('Misconception not found: ' + claim); return m; });
    const cw = (12.13 - 0.2) / 2, qh = 0.92, ah = 1.2, rh = qh + 0.06 + ah, y0 = 1.85;
    M.forEach((m, i) => {
      const x = 0.6 + (i % 2) * (cw + 0.2), y = y0 + Math.floor(i / 2) * (rh + 0.3);
      L.box(s, x, y, cw, qh, { fill: C.w50, r: 0.1 });
      L.icon(s, 'x', x + 0.2, y + 0.16, 0.24, 'o');
      L.txt(s, 'MISCONCEPTION', x + 0.62, y + 0.14, cw - 0.8, 0.2, { fontSize: 9.5, bold: true, color: C.w600, charSpacing: 1.5 });
      L.txt(s, '“' + m.claim + '”', x + 0.62, y + 0.38, cw - 0.8, 0.5, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'top' });
      L.box(s, x, y + qh + 0.06, cw, ah, { fill: 'FFFFFF', line: C.line, r: 0.1 });
      L.icon(s, 'check', x + 0.2, y + qh + 0.22, 0.24, 'g');
      L.txt(s, 'CORRECTION', x + 0.62, y + qh + 0.2, cw - 0.8, 0.2, { fontSize: 9.5, bold: true, color: C.g600, charSpacing: 1.5 });
      L.txt(s, m.correction, x + 0.62, y + qh + 0.44, cw - 0.82, ah - 0.5, { fontSize: 12, color: C.text, lineSpacingMultiple: 1.03 });
    });
    s.addNotes(M.map((m, i) => (i + 1) + '. ' + m.claim + ' ' + m.correction).join(' ') + ' The other four misconceptions, about a new landing-zone project, a Full Regional Hub, another ExpressRoute circuit, and migrating workloads, are covered in the executive summary.');
  }

  // ───────────────────────── Get started (PDF p48)
  {
    const s = L.slide('practice');
    L.header(s, '', 'Get started with a multi-region platform', { tw: 7.4, lede: 'Start with one candidate region and the workloads that need it. The same process scales to a broader portfolio, and later regions reuse the decisions made for the first.', lx: 8.3, lw: 4.43 });
    const cw = 3.93, ch = 1.85;
    L.data.gettingStarted.forEach((g, i) => {
      const x = 0.6 + (i % 3) * 4.1, y = 1.7 + Math.floor(i / 3) * (ch + 0.15);
      const tealCard = i === 2 || i === 5;
      L.box(s, x, y, cw, ch, { fill: tealCard ? C.t50 : C.wash, r: 0.12 });
      L.txt(s, String(i + 1).padStart(2, '0'), x + 0.2, y + 0.12, 0.7, 0.5, { fontSize: 26, fontFace: F.light, color: tealCard ? C.t600 : C.b600 });
      L.txt(s, g.title, x + 0.95, y + 0.14, cw - 1.1, 0.5, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, g.short, x + 0.2, y + 0.75, cw - 0.4, ch - 0.82, { fontSize: 11, color: C.text });
    });
    L.image(s, IMG('band.jpg', L.tone), { x: 0.6, y: 5.75, w: 12.13, h: 1.1 }, 'Blue gradient band behind the success statement', { sizing: { type: 'cover', w: 12.13, h: 1.1 } });
    L.txt(s, 'WHAT SUCCESS\nLOOKS LIKE', 0.9, 5.75, 2.2, 1.1, { fontSize: 10, bold: true, color: C.b200, charSpacing: 2, valign: 'middle' });
    L.txt(s, 'Being able to qualify a regional option, enable only the platform capabilities it requires, and onboard workloads through a repeatable governed process.', 3.3, 5.75, 9.2, 1.1, { fontSize: 15, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    s.addNotes(L.data.gettingStarted.map((g, i) => (i + 1) + '. ' + g.title + '. ' + g.text).join(' '));
  }

  // ───────────────────────── Conclusion (PDF p49)
  {
    const s = L.slide('conclusion');
    L.header(s, '', 'Design for continuing regional choice', { tw: 8 });
    L.txt(s, [{ text: 'No organization can predict which Azure regions will offer the best mix of services, regulatory fit, business proximity, and workload suitability several years from now. ', options: { fontFace: F.light } }, { text: 'Design the platform so that perfect prediction is unnecessary.', options: { fontFace: F.semi, color: C.ink } }], 0.6, 1.6, 5.0, 2.3, { fontSize: 17, color: C.s600 });
    L.txt(s, 'This framework extends Azure landing-zone principles rather than replacing them. Regional adoption, workload placement, platform expansion, and resiliency can evolve without redesigning the broader platform for every new region.', 0.6, 3.7, 5.0, 1.3, { fontSize: 12, color: C.text });
    const T = [
      ['app', 't', C.t50, C.t300, C.t700, 'Workload-led placement', 'Qualified regional options, Workload Landing Zone archetypes, and current workload requirements allow applications to use the regional and platform capabilities appropriate to their needs.', 0.6],
      ['hub', 'b', C.b50, C.b200, C.b700, 'Adaptable regional platform', 'Strategic geographic hubs, resilient hybrid connectivity, and regional connectivity profiles distribute capabilities according to workload requirements, without an identical footprint in every region.', 0.3],
      ['shield', 'w', C.s800, null, 'FFFFFF', 'Consistent operating model', 'Keep the landing-zone guardrails and operating standards stable across the Azure estate.', 0],
    ];
    T.forEach(([ic, c, bg, ln, tc, t, d, inset], i) => {
      const y = 1.6 + i * 1.25, x = 6.1 + inset, w = 12.73 - x - inset, h = 1.15;
      L.box(s, x, y, w, h, { fill: bg, line: ln || undefined, r: 0.12 });
      L.icon(s, ic, x + 0.25, y + h / 2 - 0.18, 0.36, c);
      L.txt(s, [{ text: t, options: { fontFace: F.semi, fontSize: 13, color: tc, breakLine: true, paraSpaceAfter: 2 } }, { text: d, options: { fontSize: 11, color: i === 2 ? C.s100 : C.text } }], x + 0.85, y, w - 1.05, h, { valign: 'middle' });
    });
    L.image(s, IMG('band.jpg', L.tone), { x: 0.6, y: 5.5, w: 12.13, h: 1.35 }, 'Blue gradient band behind the closing statement', { sizing: { type: 'cover', w: 12.13, h: 1.35 } });
    L.txt(s, [{ text: 'The goal is not to select the perfect two regions. ', options: { fontFace: F.light } }, { text: 'It is to make additional regions significantly easier to adopt when business and workload requirements justify them.', options: { fontFace: F.semi } }], 1.0, 5.5, 11.3, 1.35, { fontSize: 20, color: 'FFFFFF', valign: 'middle' });
    s.addNotes('Close on the central idea: no organization can predict which Azure regions will serve it best several years from now, so design the platform so that perfect prediction is unnecessary. Three commitments: workload-led placement, an adaptable regional platform, and a consistent operating model. The goal is not to select the perfect two regions; it is to make additional regions significantly easier to adopt when business and workload requirements justify them.');
  }
};
