const { C, F } = require('../lib');

// Part 3 · Select the regional design: three choices from short lists, written into one design record.
module.exports = (pres, L) => {
  const [CH1, CH2, CH3] = L.data.choices;
  const PROF = L.data.profiles;   // No Hub, Remote Hub, Selective Hub, Full Hub

  // The question each choice answers: blue line under the title.
  const question = (s, text, w = 10.6) => L.txt(s, text, 0.6, 1.17, w, 0.5, { fontSize: 14, color: C.b700 });
  // Bullet list whose items start with a bold lead: items are [lead, rest]; native bullets.
  // Both runs of a paragraph carry the same paragraph options, so the bullet survives wherever the run properties are read.
  const leadBullets = (s, items, x, y, w, h, o = {}) => {
    const runs = [];
    const para = { bullet: { indent: 14 }, paraSpaceAfter: o.gap === undefined ? 5 : o.gap };
    items.forEach(([lead, rest], i) => {
      const last = i === items.length - 1;
      runs.push({ text: lead, options: Object.assign({ bold: true, color: o.leadColor || C.ink }, para) });
      runs.push({ text: rest ? ' ' + rest : '', options: Object.assign({ breakLine: !last }, para) });
    });
    L.txt(s, runs, x, y, w, h, { fontSize: o.size || 11, color: C.text, align: 'left', lineSpacingMultiple: 1.03 });
  };

  // ───────────────────────── Opener: three choices on one path
  {
    const s = L.slide('part3');
    L.header(s, null, 'Select the regional design', { tw: 5.8, lede: 'Selecting the regional design is a set of decisions, not a deployment. For each qualified region, make three choices, each from a short list. Nothing is built yet.', lx: 6.4, lw: 6.33 });
    const cw = (12.13 - 0.4) / 3;
    L.data.choices.forEach((c, i) => {
      const x = 0.6 + i * (cw + 0.2), y = 1.72, h = 1.6;
      L.box(s, x, y, cw, h, { fill: C.wash, line: C.line, r: 0.12 });
      L.num(s, c.n, x + 0.2, y + 0.18, 0.4, C.b600, 'FFFFFF', 13);
      L.txt(s, c.name, x + 0.75, y + 0.18, cw - 0.95, 0.4, { fontSize: 15, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, c.select, x + 0.2, y + 0.75, cw - 0.4, 0.7, { fontSize: 12.5, color: C.b700 });
    });

    // The three decisions on one path (hybrid connectivity → shared services → regional connectivity profile)
    const gy = 3.66, by = 4.14, bh = 2.2;
    const groups = [[0.6, 4.25, 3, C.s600], [5.1, 3.69, 2, C.b600], [9.04, 3.69, 1, C.t600]];
    groups.forEach(([x, w, n, c]) => {
      L.num(s, n, x, gy, 0.27, c, 'FFFFFF', 10);
      L.txt(s, L.data.choices[n - 1].name.toUpperCase(), x + 0.37, gy, w - 0.4, 0.27, { fontSize: 10, bold: true, color: c, charSpacing: 1.5, valign: 'middle' });
      L.box(s, x, gy + 0.34, w, 0.03, { fill: c, r: 0 });
    });
    // group 1: on-premises → Azure backbone
    L.box(s, 0.6, by, 1.6, bh, { fill: C.s800, r: 0.1 });
    L.icon(s, 'building', 0.74, by + 0.13, 0.32, 'w');
    L.txt(s, [{ text: 'On-premises datacenters and users', options: { fontFace: F.semi, fontSize: 11.5, breakLine: true, paraSpaceAfter: 3 } }, { text: 'Locations, latency, bandwidth, and failure domains', options: { fontSize: 11, color: C.b200 } }], 0.74, by + 0.55, 1.36, bh - 0.6, { color: 'FFFFFF' });
    L.box(s, 3.25, by, 1.6, bh, { fill: C.b700, r: 0.1 });
    L.icon(s, 'network', 3.39, by + 0.13, 0.32, 'w');
    L.txt(s, [{ text: 'Azure backbone in the selected geography', options: { fontFace: F.semi, fontSize: 11.5, breakLine: true, paraSpaceAfter: 3 } }, { text: 'Existing or additional private paths', options: { fontSize: 11, color: C.b100 } }], 3.39, by + 0.55, 1.36, bh - 0.6, { color: 'FFFFFF' });
    L.line(s, 2.23, by + bh / 2 + 0.2, 3.22, by + bh / 2 + 0.2, { color: C.s600, both: true });
    L.txt(s, 'ExpressRoute\nor VPN', 2.2, by + bh / 2 - 0.3, 1.05, 0.4, { fontSize: 9.5, bold: true, color: C.s600, align: 'center', valign: 'bottom' });
    // group 2: hubs and shared services
    L.line(s, 4.87, by + bh / 2, 5.08, by + bh / 2, { color: C.b600 });
    L.box(s, 5.1, by, 3.69, bh, { fill: C.b50, line: C.b200, r: 0.1 });
    L.icon(s, 'hub', 5.28, by + 0.13, 0.32, 'b');
    L.txt(s, [{ text: 'Geographic hubs and shared services', options: { fontFace: F.semi, fontSize: 12, color: C.b800, breakLine: true, paraSpaceAfter: 3 } }, { text: 'Reused where they satisfy requirements; each service provided locally, remotely, or centrally', options: { fontSize: 11, color: C.muted } }], 5.28, by + 0.55, 3.35, bh - 0.6);
    // group 3: Workload Landing Zones
    L.line(s, 8.81, by + bh / 2, 9.02, by + bh / 2, { color: C.b600, both: true });
    L.box(s, 9.04, by, 3.69, bh, { fill: C.t50, line: C.t300, r: 0.1 });
    L.icon(s, 'spoke', 9.22, by + 0.13, 0.32, 't');
    L.txt(s, [{ text: 'Workload Landing Zones', options: { fontFace: F.semi, fontSize: 12, color: C.t700, breakLine: true, paraSpaceAfter: 3 } }, { text: 'Supported by the regional platform connectivity profile, selected by dependencies and requirements', options: { fontSize: 11, color: C.muted } }], 9.22, by + 0.55, 3.35, bh - 0.6);
    L.caption(s, 'Figure', 'The three decisions on one path. They are related, but each is a separate decision.', 0.6, 6.5, 12.13);
    s.addNotes('Selecting the regional design is a set of decisions, not a deployment. For each qualified region you make three choices, each from a short list: the connectivity profile, where each shared service is provided, and whether existing hybrid connectivity is reused. Each choice follows from the workloads you expect in the region, not from the footprint of an existing geographic hub. Nothing is built yet; deployment follows later, through the automation you already run. Connectivity that is specific to one application is not decided here. It is designed when the workload is placed.');
  }

  // ───────────────────────── The regional design record (after the three choices)
  const addDesignRecord = () => {
    const s = L.slide('part3');
    L.header(s, 'Design record', 'The regional design record', { lede: 'Keep one record per region. Update it when a reassessment trigger applies.', lx: 8.6, lw: 4.13 });
    // left: start from workload requirements
    L.box(s, 0.6, 1.6, 6.9, 2.0, { fill: C.wash, r: 0.12 });
    L.txt(s, 'Start from workload requirements', 0.8, 1.72, 6.5, 0.32, { fontSize: 14, fontFace: F.semi, color: C.ink });
    L.txt(s, 'Requirements and dependencies determine the regional connectivity profile, for existing and for new workloads.', 0.8, 2.1, 6.5, 0.5, { fontSize: 11.5, color: C.b700 });
    leadBullets(s, [
      ['Existing workloads:', 'use validated dependencies to decide whether existing geographic hubs still support them.'],
      ['New workloads:', 'derive needs from the intended architecture; a new region does not automatically need a new platform footprint.'],
    ], 0.8, 2.68, 6.5, 0.85);
    // right: what to record
    L.box(s, 7.7, 1.6, 5.03, 2.0, { fill: C.b50, r: 0.12 });
    L.txt(s, 'What to record', 7.9, 1.72, 4.6, 0.32, { fontSize: 14, fontFace: F.semi, color: C.ink });
    L.bullets(s, ['Selected connectivity profile', 'Placement of each shared service, and which hub provides the remote ones', 'Hybrid connectivity decision', 'Owner and date', 'Triggers that would reopen the decision'], 7.9, 2.12, 4.65, 1.4, { gap: 3 });
    // example record
    L.txt(s, 'Example record', 0.6, 3.76, 4, 0.3, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle' });
    const head = ['Region', 'Connectivity profile', 'Shared services', 'Hybrid connectivity', 'Open conditions'];
    const rows = [
      ['Region C', PROF[2], 'Local: selected capabilities. Remote from Region A: remaining shared services.', 'Reuse: existing foundation where required.', 'None'],
      ['Region D', PROF[1], 'Remote from a geographic hub.', 'Reuse: via the hub where required.', 'Latency test with representative traffic.'],
      ['Region E', PROF[0], 'None required.', 'Not required.', 'None'],
    ];
    const hOpt = { bold: true, fontSize: 10, color: C.muted, fill: { color: C.wash }, charSpacing: 1, valign: 'middle' };
    const tbl = [head.map(t => ({ text: t.toUpperCase(), options: hOpt }))].concat(rows.map(r => r.map((t, j) => ({ text: t, options: { fontSize: 11, color: j === 0 ? C.ink : C.text, bold: j === 0, fontFace: j === 0 ? F.semi : F.body, valign: 'middle' } }))));
    s.addTable(tbl, { x: 0.6, y: 4.14, w: 12.13, colW: [1.1, 2.3, 4.15, 2.4, 2.18], rowH: [0.34, 0.54, 0.54, 0.54], fontFace: F.body, fontSize: 11, margin: [0.03, 0.12, 0.03, 0.12], border: { type: 'solid', pt: 0.75, color: C.soft } });
    // closing strips
    L.box(s, 0.6, 6.3, 5.15, 0.55, { fill: C.b50, r: 0.1 });
    L.icon(s, 'doc', 0.8, 6.44, 0.26, 'b');
    L.txt(s, [{ text: 'A region with a complete record is ', options: {} }, { text: 'selected', options: { bold: true } }, { text: '.', options: {} }], 1.25, 6.3, 4.4, 0.55, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
    L.box(s, 5.95, 6.3, 6.78, 0.55, { fill: C.wash, r: 0.1 });
    L.txt(s, [{ text: 'The ', options: {} }, { text: L.data.plannerName, options: { bold: true, color: C.b700, hyperlink: { url: L.data.workbookUrl, tooltip: 'Open the Multi-region planner' } } }, { text: ' walks through the three choices for each selected region and produces the regional design record.', options: {} }], 6.15, 6.3, 6.4, 0.55, { fontSize: 11, color: C.ink, valign: 'middle' });
    s.addNotes('Use the workload requirements identified earlier to decide how workloads consume regional and centralized platform capabilities. Archetypes can inform the assessment, but the design follows each workload’s actual dependencies. Existing and new workloads follow the same rule: requirements and dependencies determine the regional connectivity profile. Keep one record per region. The record also names the open conditions of a conditional region, and it is updated when a reassessment trigger applies. The regions in the table are examples only.');
  };

  // ───────────────────────── Choice 1: principles and cost
  {
    const s = L.slide('part3');
    L.header(s, 'Choice 1', 'Select the connectivity profile');
    question(s, 'What is the most efficient regional platform design that supports the identified requirements?', 11.5);
    // principles
    L.txt(s, 'Profile selection principles', 0.6, 1.8, 5.8, 0.32, { fontSize: 14, fontFace: F.semi, color: C.b700 });
    const P = [
      ['Start with the workload requirements and dependencies', 'identified during qualification.'],
      ['Select the most efficient profile', 'that satisfies them, not the maximum possible one.'],
      ['Keep capabilities remote', 'when requirements permit. Adoption growth alone does not justify local ones.'],
      ['Consider direct spoke-to-spoke connectivity', 'where east-west traffic is significant and a hub transit path is unnecessary.'],
    ];
    const rowH = 0.92;
    P.forEach(([lead, rest], i) => {
      const y = 2.22 + i * rowH;
      L.box(s, 0.6, y, 5.8, 0.012, { fill: C.line, r: 0 });
      L.txt(s, String(i + 1).padStart(2, '0'), 0.6, y + 0.12, 0.5, 0.3, { fontSize: 14, bold: true, color: C.b600 });
      L.txt(s, [{ text: lead, options: { bold: true, color: C.ink } }, { text: ' ' + rest, options: {} }], 1.15, y + 0.12, 5.25, rowH - 0.18, { fontSize: 12, color: C.text, lineSpacingMultiple: 1.05 });
    });
    L.box(s, 0.6, 5.9, 5.8, 0.012, { fill: C.line, r: 0 });
    L.box(s, 0.6, 6.0, 5.8, 0.85, { fill: C.wash, r: 0.1 });
    L.txt(s, 'Each row of the matrix in Part 1 is a set of options, not an assignment. The profile follows dependencies, latency, traffic, resiliency, and independence requirements.', 0.8, 6.0, 5.4, 0.85, { fontSize: 11, color: C.ink, valign: 'middle' });

    // cost curve
    L.txt(s, 'What each step up costs', 7.1, 1.8, 5.6, 0.32, { fontSize: 14, fontFace: F.semi, color: C.b700 });
    const cx = 7.75, cy = 5.5, cw = 4.95, ch = 3.4;
    L.line(s, cx, cy, cx, cy - ch, { color: C.faint, w: 1 });
    L.line(s, cx, cy, cx + cw, cy, { color: C.faint, w: 1 });
    L.txt(s, 'Local capability and independence →', cx, cy + 0.1, cw, 0.28, { fontSize: 10.5, bold: true, color: C.s600, align: 'center' });
    L.txt(s, 'Fixed platform cost and operational scope →', cx - 0.5, cy - ch, 0.32, ch, { fontSize: 10.5, bold: true, color: C.s600, align: 'center', vert: 'vert270', valign: 'middle' });
    const pts = [[0.35, 0.45, C.t600], [1.6, 0.85, C.c600], [3.0, 1.7, C.b500], [4.5, 3.05, C.b700]];
    for (let i = 0; i < pts.length - 1; i++) L.line(s, cx + pts[i][0], cy - pts[i][1], cx + pts[i + 1][0], cy - pts[i + 1][1], { color: pts[i + 1][2], w: 2.5, arrow: false });
    pts.forEach(([x, y, c], i) => {
      L.oval(s, cx + x - 0.13, cy - y - 0.13, 0.26, { fill: c });
      const last = i === 3;
      L.txt(s, PROF[i], cx + x + (last ? -2.3 : 0.22), cy - y + (last ? -0.1 : 0.02), 2.1, 0.28, { fontSize: 11, bold: true, color: C.ink, align: last ? 'right' : 'left', valign: 'middle' });
    });
    L.caption(s, 'Figure', 'A qualitative trade-off, not a price list. More local capability usually adds fixed cost and scope, but can reduce cross-region dependency, latency exposure, and availability coupling.', 7.1, 6.05, 5.63);
    s.addNotes('Select the most efficient profile that satisfies the workload requirements and dependencies identified during regional qualification, not the maximum possible one. Keep capabilities remote when latency, dependency, data, security, resiliency, availability, and operational requirements permit, and add local capabilities only when a measurable requirement justifies the larger regional footprint. Greater local capability and independence usually increase fixed platform cost and operational scope, but they can reduce cross-region dependencies, latency exposure, and availability coupling. The matrix in Part 1 shows which profiles each archetype typically uses.');
  }

  // ───────────────────────── Choice 1: decision tree
  {
    const s = L.slide('part3');
    L.header(s, 'Choice 1 · Decision tool', 'Which connectivity profile should this region provide?', { tw: 8.2, lede: 'Stop at the first profile that satisfies the requirements. Two of the four profiles need no local hub.', lx: 9.1, lw: 3.63 });
    L.box(s, 1.85, 1.66, 4.3, 0.38, { fill: C.t600, r: 0.19 });
    L.txt(s, 'Workload scenarios expected in the region', 1.85, 1.66, 4.3, 0.38, { fontSize: 11, fontFace: F.semi, color: 'FFFFFF', align: 'center', valign: 'middle' });
    const Q = [
      'Do workloads need a geographic hub, on-premises access, centralized inspection, or private network paths beyond approved same-region spokes and Azure service endpoints?',
      'Can they tolerate the latency, availability coupling, data-transfer implications, and dependency on connectivity to another region?',
      'Do requirements justify a comprehensive local capability set: local hybrid connectivity, substantial shared services, strict latency or data-boundary controls, or independence from other hubs?',
    ];
    const R = [[0, 'No', C.faint, 'Confirm that no hidden dependency requires hub or on-premises connectivity.'], [1, 'Yes', C.b600, 'Measure with representative traffic; document behavior if the hub degrades.'], [2, 'No', C.faint, 'Only services that must be local; define clearly what stays remote.']];
    const qx = 0.6, qw = 6.3, qh = 0.78, rx = 7.85, rw = 4.88, y0 = 2.3, pitch = 1.08;
    L.line(s, qx + qw / 2, 2.04, qx + qw / 2, y0, { color: C.b600 });
    Q.forEach((q, i) => {
      const y = y0 + i * pitch;
      L.box(s, qx, y, qw, qh, { fill: 'FFFFFF', line: C.b500, lw: 1.25, r: 0.12 });
      L.num(s, i + 1, qx + 0.14, y + qh / 2 - 0.17, 0.34, C.b50, C.b700, 11);
      L.txt(s, q, qx + 0.6, y, qw - 0.72, qh, { fontSize: 11, fontFace: F.semi, color: C.ink, valign: 'middle' });
      const [k, lab, col, note] = R[i];
      L.box(s, rx, y, rw, qh, { fill: k < 2 ? C.t50 : C.b50, line: k < 2 ? C.t300 : C.b300, r: 0.12 });
      L.glyph(s, k, rx + 0.16, y + (qh - 0.46) / 2);
      L.txt(s, [{ text: PROF[k], options: { fontFace: F.semi, fontSize: 12, color: C.ink, breakLine: true } }, { text: note, options: { fontSize: 11, color: C.muted } }], rx + 1.02, y, rw - 1.12, qh, { valign: 'middle' });
      L.line(s, qx + qw, y + qh / 2, rx, y + qh / 2, { color: col });
      L.tag(s, lab, (qx + qw + rx) / 2, y + qh / 2, { color: col });
      if (i > 0) {
        L.line(s, qx + qw / 2, y - (pitch - qh), qx + qw / 2, y, { color: i === 2 ? C.faint : C.b600 });
        L.tag(s, i === 1 ? 'Yes' : 'No', qx + qw / 2, y - (pitch - qh) / 2, { color: i === 2 ? C.faint : C.b600 });
      }
    });
    const fy = y0 + 3 * pitch;
    L.line(s, qx + qw / 2, fy - (pitch - qh), qx + qw / 2, fy, { color: C.b600 });
    L.tag(s, 'Yes', qx + qw / 2, fy - (pitch - qh) / 2);
    L.box(s, qx, fy, qw, 0.72, { fill: C.b700, r: 0.12 });
    L.glyph(s, 3, qx + 0.16, fy + 0.13);
    L.txt(s, [{ text: PROF[3], options: { fontFace: F.semi, fontSize: 12, breakLine: true } }, { text: 'Confirm that the required independence justifies the cost and operational scope.', options: { fontSize: 11, color: C.b100 } }], qx + 1.02, fy, qw - 1.12, 0.72, { color: 'FFFFFF', valign: 'middle' });
    L.decision(s, 'Select the most efficient regional platform connectivity profile that satisfies the identified requirements and can evolve as regional adoption changes.', rx, fy - 0.05, rw, 1.32, 'b');
    L.caption(s, 'Figure', 'Questions escalate from dependency, to tolerance of remote consumption, to required independence. The outcome is a platform capability, not a workload design.', 0.6, fy + 0.85, 6.5);
    s.addNotes('Each question comes from the “fits when” criteria of the connectivity profiles. Stop at the first profile that satisfies the requirements identified in check 3. Two of the four profiles need no local hub, and only the Full Hub approaches the footprint of an existing geographic hub. The aim is the most efficient profile, not the maximum possible one: keep capabilities remote when the characteristics permit, and deploy locally only when a measurable requirement justifies it. Profiles can move in both directions, so revisit the selection when a reassessment trigger applies.');
  }

  // ───────────────────────── Choice 2: place shared services
  {
    const s = L.slide('part3');
    L.header(s, 'Choice 2', 'Place shared services');
    question(s, 'Where is each shared service that the workloads depend on provided?');
    // the three placements
    const PL = [['Local', 'Deployed in the region.', 'local'], ['Remote', 'Consumed from a hub or shared instance in another region. Record which one.', 'remote'], ['Global', 'Not tied to a region. There is nothing to deploy.', 'global']];
    // pill styles: [fill, line, text color]
    const ST = { local: [C.b600, null, 'FFFFFF'], remote: ['FFFFFF', C.b600, C.b700], either: [C.b100, C.b600, C.b700], global: [C.s100, null, C.s600] };
    const pill = (kind, label, x, y, w, h = 0.26) => {
      const [fill, line, color] = ST[kind];
      L.box(s, x, y, w, h, { fill, line, r: h / 2, lw: 1 });
      L.txt(s, label, x, y, w, h, { fontSize: 10.5, bold: true, color, align: 'center', valign: 'middle' });
    };
    const lw3 = (12.13 - 0.4) / 3;
    PL.forEach(([name, def, kind], i) => {
      const x = 0.6 + i * (lw3 + 0.2), y = 1.62;
      L.box(s, x, y, lw3, 0.68, { fill: C.wash, r: 0.1 });
      pill(kind, name, x + 0.15, y + 0.2, 0.85, 0.27);
      L.txt(s, def, x + 1.15, y, lw3 - 1.28, 0.68, { fontSize: 11, color: C.text, valign: 'middle' });
    });

    // default placement table
    const lx = 0.6, labW = 2.65, colW = 1.35, cx0 = lx + labW, tw = labW + 4 * colW, ty = 2.45;
    L.txt(s, 'Default placement by profile'.toUpperCase(), lx, ty, 3, 0.3, { fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.5, valign: 'bottom' });
    PROF.forEach((p, k) => {
      const x = cx0 + k * colW;
      L.glyph(s, k, x + (colW - 0.72) / 2, ty - 0.02);
      L.txt(s, p, x, ty + 0.48, colW, 0.32, { fontSize: 10, bold: true, color: C.b800, align: 'center', valign: 'top', lineSpacingMultiple: 0.95 });
    });
    const NR = 'nr';
    const T = [
      ['Management groups, access, policy', ['global']],
      ['Private DNS zones', ['global']],
      ['DNS resolution across premises', [NR, 'remote', 'either', 'local']],
      ['Traffic inspection and egress', [NR, 'remote', 'either', 'local']],
      ['Hybrid connectivity gateways', [NR, 'remote', 'either', 'local']],
      ['Directory services', [NR, 'remote', 'either', 'local']],
      ['Log workspace', ['logs']],
      ['Backup vaults', ['local']],
      ['Key Vault', ['local']],
    ];
    const NAME = { local: 'Local', remote: 'Remote', either: 'Local or remote', global: 'Global' };
    const ry0 = ty + 0.8, rp = 0.35;
    T.forEach(([label, cells], r) => {
      const y = ry0 + r * rp;
      L.box(s, lx, y, tw, 0.012, { fill: C.soft, r: 0 });
      L.txt(s, label, lx, y, labW - 0.1, rp, { fontSize: 11, fontFace: F.semi, color: C.ink, valign: 'middle' });
      if (cells.length === 1) {
        const k = cells[0];
        if (k === 'logs') pill('remote', 'Remote, or local for data residency', cx0 + 0.05, y + 0.05, 4 * colW - 0.1, 0.26);
        else pill(k, NAME[k], cx0 + 0.05, y + 0.05, 4 * colW - 0.1, 0.26);
      } else cells.forEach((k, j) => {
        const x = cx0 + j * colW;
        if (k === NR) L.txt(s, 'Not required', x, y, colW, rp, { fontSize: 10.5, color: C.faint, align: 'center', valign: 'middle' });
        else pill(k, NAME[k], x + 0.02, y + 0.05, colW - 0.04, 0.26);
      });
    });
    L.box(s, lx, ry0 + T.length * rp, tw, 0.012, { fill: C.soft, r: 0 });
    L.txt(s, 'Defaults, not rules: change a cell when a workload requirement calls for it, and record the reason.', lx, ry0 + T.length * rp + 0.1, tw, 0.3, { fontSize: 11, color: C.muted });

    // set by the service
    const sx = 8.95, sw = 3.78;
    L.box(s, sx - 0.2, 2.45, 0.012, 4.4, { fill: C.soft, r: 0 });
    L.txt(s, 'SET BY THE SERVICE, NOT BY THE PROFILE', sx, 2.45, sw, 0.3, { fontSize: 9.5, bold: true, color: C.b700, charSpacing: 1.5 });
    leadBullets(s, [
      ['Backup vaults are local.', 'Azure Backup works within a region.'],
      ['Key Vault is local.', 'Give each workload a vault in its own region.'],
      ['Private DNS zones are global.', 'Create them once; link networks to them.'],
      ['Start with one log workspace.', 'Add a regional one only for data residency or high transfer charges.'],
      ['Policy and access control are not tied to a region.', ''],
    ], sx, 2.85, sw, 2.5, { gap: 4 });
    L.decision(s, 'Define the most efficient platform capability set, where each capability will be provided, who will operate it, and what requirements would trigger future expansion.', sx, 5.3, sw, 1.55, 'b');
    s.addNotes('Each shared service has one of three placements: local, remote, or global. The table is a starting point for each profile; change a cell when a workload requirement calls for it and record the reason. For a Selective Hub, each row is a separate choice. Some placements are set by the service, not the profile: backup vaults and Key Vault are local in every profile, private DNS zones are global, and a single log workspace is the place to start. The one policy change for a new region is to allow it in any assignment that restricts locations. Also consider operational support, platform resiliency, ownership, and cost, and enable only the regional capabilities that expected workloads need.');
  }

  // ───────────────────────── Choice 3: confirm hybrid connectivity
  {
    const s = L.slide('part3');
    L.header(s, 'Choice 3', 'Confirm hybrid connectivity');
    question(s, 'Does the operating geography have resilient hybrid connectivity to Azure that satisfies the identified workload requirements?', 12.13);
    L.txt(s, 'Enabling an additional Azure region doesn’t by itself require another ExpressRoute circuit.', 0.6, 1.72, 12.13, 0.32, { fontSize: 15, fontFace: F.semi, color: C.ink });
    const O = [
      ['Not required', 'x', 'FFFFFF', C.line, C.s600, 'The region uses No Hub, or its workloads need no private path to on-premises locations.'],
      ['Reuse', 'loop', C.b50, C.b200, C.b600, 'Existing circuits, gateways, and peering locations meet the reachability, latency, bandwidth, routing, and resilience the new region’s workloads need.'],
      ['Change', 'route', C.w50, C.w100, C.w600, 'The existing foundation can’t meet a requirement: diversity, failure-domain isolation, latency, bandwidth, routing, or resiliency. Record the requirement and the change it justifies.'],
    ];
    const ow = (12.13 - 0.4) / 3;
    O.forEach(([t, ic, fill, line, c, d], i) => {
      const x = 0.6 + i * (ow + 0.2), y = 2.12, h = 1.83;
      L.box(s, x, y, ow, h, { fill, line, r: 0.12 });
      L.icon(s, ic, x + 0.2, y + 0.2, 0.3, ic === 'x' ? 's' : ic === 'loop' ? 'b' : 'o');
      L.txt(s, t, x + 0.62, y + 0.16, ow - 0.8, 0.38, { fontSize: 14, fontFace: F.semi, color: c === C.w600 ? C.w600 : C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.2, y + 0.66, ow - 0.4, h - 0.74, { fontSize: 12, color: C.text, lineSpacingMultiple: 1.03 });
    });
    // two lists
    L.txt(s, 'How a new region reuses what exists', 0.6, 4.18, 5.9, 0.3, { fontSize: 14, fontFace: F.semi, color: C.b700 });
    leadBullets(s, [
      ['A gateway in another region can serve the new region.', 'Global virtual network peering supports gateway transit.'],
      ['An existing circuit can connect to a gateway in the new region.', 'A new hub doesn’t need a circuit of its own.'],
      ['Azure Virtual WAN extends in the same way.', ''],
    ], 0.6, 4.55, 5.9, 1.3, { gap: 4 });
    L.decision(s, 'Confirm the hybrid connectivity foundation and identify any required changes to reachability, resiliency, diversity, scale, or ownership.', 0.6, 5.72, 5.9, 1.13, 'b');
    L.box(s, 6.75, 4.2, 0.012, 2.65, { fill: C.soft, r: 0 });
    L.txt(s, 'When a change is justified', 7.0, 4.18, 5.7, 0.3, { fontSize: 14, fontFace: F.semi, color: C.w600 });
    leadBullets(s, [
      ['The foundation doesn’t meet resiliency recommendations today.', 'Check this when adding a region; don’t add a circuit for each region.'],
      ['On-premises locations or users are far from the existing peering locations.', ''],
      ['Bandwidth or gateway capacity is exhausted.', ''],
      ['Workloads need a capability that doesn’t work across regions.', 'ExpressRoute FastPath, for example, doesn’t support global virtual network peering.'],
      ['Keep an independent path.', 'The region must retain its on-premises connectivity when another region is unavailable; this usually points to a Full Hub.'],
    ], 7.0, 4.55, 5.73, 2.3, { gap: 4, leadColor: C.ink });
    s.addNotes('Enabling an additional Azure region doesn’t by itself require another ExpressRoute circuit. Evaluate the existing ExpressRoute, VPN, SD-WAN, or other hybrid connectivity against datacenter and user locations, latency, bandwidth, and routing requirements. Add circuits, peering locations, gateways, or more connectivity paths only where the existing foundation can’t provide the required reachability, diversity, or resilience. Microsoft recommends ExpressRoute circuits from more than one peering location, and a new region is a reason to check this. Measure latency on the real path before you decide that locations are too far from the peering locations.');
  }

  addDesignRecord();
};
