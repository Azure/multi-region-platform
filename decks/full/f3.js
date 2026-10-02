const { C, F, IMG } = require('../lib');

module.exports = (pres, L) => {
  // mini profile glyph (native shapes), 0.72 x 0.46
  const glyph = (s, k, x, y) => {
    const bg = k < 2 ? C.t50 : C.b50, ln = k < 2 ? C.t300 : C.b300;
    if (k === 1) { L.box(s, x, y, 0.44, 0.46, { fill: bg, line: ln, dash: 'dash', r: 0.07 }); L.box(s, x + 0.12, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); L.line(s, x + 0.44, y + 0.23, x + 0.56, y + 0.23, { color: C.b500, arrow: false }); L.oval(s, x + 0.56, y + 0.15, 0.16, { fill: C.b600 }); return; }
    L.box(s, x, y, 0.72, 0.46, { fill: bg, line: ln, dash: 'dash', r: 0.07 });
    if (k === 0) { L.box(s, x + 0.12, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); L.box(s, x + 0.4, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
    if (k === 2) { L.oval(s, x + 0.11, y + 0.12, 0.22, { fill: 'FFFFFF', line: C.b500, lw: 1.5 }); L.box(s, x + 0.42, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
    if (k === 3) { L.oval(s, x + 0.1, y + 0.11, 0.24, { fill: C.b600 }); L.oval(s, x + 0.18, y + 0.19, 0.08, { fill: 'FFFFFF' }); L.box(s, x + 0.42, y + 0.13, 0.2, 0.2, { fill: C.t600, r: 0.04 }); }
  };
  const PROF = ['Disconnected spokes', 'Remote-hub-connected spokes', 'Minimal regional hub', 'Full regional hub'];

  // ───────────────────────── 17 · Archetypes
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '04 · What applications require', 'Workload Landing Zone Archetypes', { ec: C.t600, tw: 8, lede: 'A planning abstraction that groups recurring application connectivity and dependency requirements. It doesn’t replace the Azure landing-zone hierarchy.', lx: 8.6, lw: 4.13 });
    const A = [
      ['building', 'Hybrid-Connected Applications', 'Significant dependencies on on-premises environments, enterprise networks, or centralized shared services that require persistent private connectivity.', ['Remote hub', 'Minimal hub', 'Full hub'], 'Profile set by dependency latency, resiliency, regulation, and operations. Common in migrations.'],
      ['layers', 'Isolated Cloud-Native or AI Applications', 'Self-contained workloads that can operate without persistent private connectivity to enterprise or centralized dependencies.', ['Disconnected spokes', 'Connected, where justified'], 'Flexible placement across regions; connected only where platform requirements justify it.'],
      ['data', 'Connected Cloud-Native or AI Applications', 'Mostly self-contained applications that need private connectivity to selected enterprise services, data sources, APIs, or Azure environments.', ['Remote hub', 'Minimal hub', 'Full hub'], 'Profile set by latency, traffic, resiliency, and security. Common for data, analytics, and AI.'],
      ['network', 'Interconnected Application Portfolios', 'Groups of applications with meaningful dependencies on each other — shared data, common services, east-west communication.', ['Remote hub', 'Minimal hub', 'Full hub'], 'Aggregate requirements set the profile; direct spoke-to-spoke or a regional hub for east-west traffic.'],
    ];
    A.forEach(([ic, t, d, chips, drv], i) => {
      const x = 0.6 + i * 3.08, y = 1.95, w = 2.9, h = 4.4;
      L.box(s, x, y, w, h, { fill: C.t50, line: C.t100, r: 0.12 });
      L.num(s, i + 1, x + 0.2, y + 0.22, 0.4, C.t600, 'FFFFFF', 14);
      L.txt(s, t, x + 0.72, y + 0.14, w - 0.85, 0.58, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.badge(s, ic, x + w / 2 - 0.3, y + 0.82, 0.6, 'FFFFFF', 't', 0.14);
      L.txt(s, d, x + 0.2, y + 1.55, w - 0.4, 1.0, { fontSize: 11, color: C.ink });
      L.box(s, x + 0.2, y + 2.6, w - 0.4, 0.008, { fill: C.t300, r: 0 });
      L.txt(s, 'TYPICAL CONNECTIVITY PROFILES', x + 0.2, y + 2.7, w - 0.3, 0.2, { fontSize: 8, bold: true, color: C.b600, charSpacing: 1.5 });
      let cx = x + 0.2, cy = y + 2.97;
      chips.forEach(c => { const cw = c.length * 0.066 + 0.28; if (cx + cw > x + w - 0.15) { cx = x + 0.2; cy += 0.32; } const dashed = c.includes('where justified') || c.startsWith('→'); L.chip(s, c, cx, cy, { fill: dashed ? 'FFFFFF' : c.startsWith('Disc') ? C.t100 : C.b100, color: c.startsWith('Disc') ? C.t700 : C.b700, line: dashed ? C.b500 : undefined, dash: dashed ? 'dash' : undefined, size: 8.5 }); cx += cw + 0.06; });
      L.txt(s, drv, x + 0.2, y + 3.37 + (cy - (y + 2.97)), w - 0.4, 0.75, { fontSize: 9.5, color: C.muted });
    });
    L.caption(s, 'Figure', 'Grouped by the platform connectivity and dependency capabilities each requires. Assign the closest-fitting archetype and record material requirements that fall outside it.', 0.6, 6.5, 12.1);
    L.footer(s, 0, '04 · Workload Landing Zone ARCHETYPES');
    s.addNotes('Use known workload requirements and application portfolios to anticipate the capabilities that candidate regions may need to support. Where future requirements are not yet sufficiently defined, use the archetypes to establish planning guardrails without unnecessarily constraining future placement decisions. Archetypes describe what applications require; connectivity profiles describe what the platform provides. The mapping is not one-to-one. Use archetypes during regional qualification to surface recurring requirements; placement happens later.');
  }

  // ───────────────────────── 18 · Matrix
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.txt(s, 'ARCHETYPES AND PROFILES', 0.6, 0.42, 8, 0.25, { fontSize: 10, bold: true, color: C.t600, charSpacing: 3 });
    L.txt(s, [{ text: 'Archetypes describe what applications require.', options: { color: C.t700, breakLine: true } }, { text: 'Profiles describe what the platform provides.', options: { color: C.b700 } }], 0.6, 0.7, 8.6, 0.95, { fontSize: 24, fontFace: F.semi });
    L.txt(s, 'An archetype doesn’t dictate a profile: one archetype can use different profiles, and one profile can serve several archetypes. Choose the lightest profile that meets the needs.', 9.4, 0.72, 3.33, 0.9, { fontSize: 12, color: C.muted });
    const x0 = 0.6, aw = 2.75, pw = 1.55, dx = x0 + aw + 4 * pw, dw = 12.73 - dx, top = 2.8, rh = 0.74;
    L.txt(s, 'REGIONAL PLATFORM CONNECTIVITY PROFILES · WHAT THE PLATFORM PROVIDES', x0 + aw, 1.75, 4 * pw, 0.22, { fontSize: 8.5, bold: true, color: C.b600, charSpacing: 1 });
    L.box(s, x0 + aw, 1.98, 4 * pw, 0.03, { fill: C.b600, r: 0 });
    PROF.forEach((p, j) => { glyph(s, j, x0 + aw + j * pw + 0.415, 2.08); L.txt(s, p, x0 + aw + j * pw + 0.05, 2.56, pw - 0.1, 0.42, { fontSize: 10, fontFace: F.semi, color: C.ink, align: 'center', valign: 'middle' }); });
    L.txt(s, 'ARCHETYPES\nWHAT APPLICATIONS REQUIRE', x0, 2.48, aw, 0.5, { fontSize: 8.5, bold: true, color: C.t600, charSpacing: 1.5, valign: 'bottom' });
    L.txt(s, 'WHAT DRIVES THE CHOICE', dx + 0.2, 2.48, dw, 0.5, { fontSize: 8.5, bold: true, color: C.muted, charSpacing: 1.5, valign: 'bottom' });
    const rows = [
      ['Hybrid-Connected Applications', ['-', 'T', 'T', 'T'], 'Dependency latency, resiliency, regulatory, operational, and shared-service requirements.'],
      ['Isolated Cloud-Native or AI Applications', ['O', 'R', 'R', 'R'], 'Often disconnected spokes. Connected where private management, security, data access, or centralized services justify it.'],
      ['Connected Cloud-Native or AI Applications', ['-', 'T', 'T', 'T'], 'Private connectivity to selected dependencies; latency, traffic, resiliency, security, and operations decide which profile.'],
      ['Interconnected Application Portfolios', ['P', 'A', 'J', 'J'], 'Aggregate portfolio connectivity, shared-service, resiliency, scale, and operational requirements.'],
    ];
    const lab = { T: 'Typical', O: 'Often', S: 'Starting point', R: 'Where justified', J: 'When justified', P: 'Spoke-to-spoke', A: 'Where acceptable' };
    rows.forEach(([a, m, d], i) => {
      const y = top + 0.25 + i * rh;
      L.box(s, x0, y, aw - 0.05, rh - 0.05, { fill: C.t50, r: 0 });
      L.num(s, i + 1, x0 + 0.15, y + (rh - 0.05) / 2 - 0.15, 0.3, C.t600, 'FFFFFF', 10);
      L.txt(s, a, x0 + 0.55, y, aw - 0.65, rh - 0.05, { fontSize: 11.5, fontFace: F.semi, color: C.t700, valign: 'middle' });
      m.forEach((v, j) => {
        const cx = x0 + aw + j * pw;
        L.box(s, cx, y, pw, rh - 0.05, { fill: j % 2 ? 'F4F8FD' : 'FBFDFF', r: 0 });
        if (v === '-') { L.box(s, cx + pw / 2 - 0.12, y + rh / 2 - 0.03, 0.24, 0.015, { fill: C.line, r: 0 }); return; }
        const full = 'TOSP'.includes(v);
        L.oval(s, cx + pw / 2 - 0.11, y + 0.13, 0.22, full ? { fill: C.b600 } : { fill: 'FFFFFF', line: C.b500, lw: 2 });
        L.txt(s, lab[v], cx, y + 0.4, pw, 0.24, { fontSize: 9, bold: true, color: C.b700, align: 'center' });
      });
      L.txt(s, d, dx + 0.2, y, dw - 0.2, rh - 0.05, { fontSize: 10, color: C.text, valign: 'middle' });
      L.box(s, x0, y + rh - 0.05, 12.13, 0.01, { fill: C.soft, r: 0 });
    });
    const ly = top + 0.25 + 4 * rh + 0.05;
    L.oval(s, x0, ly + 0.04, 0.16, { fill: C.b600 }); L.txt(s, 'Typical fit', x0 + 0.24, ly, 1.3, 0.24, { fontSize: 9.5, bold: true, color: C.muted, valign: 'middle' });
    L.oval(s, x0 + 1.5, ly + 0.04, 0.16, { fill: 'FFFFFF', line: C.b500, lw: 1.75 }); L.txt(s, 'When specific requirements justify it', x0 + 1.74, ly, 3, 0.24, { fontSize: 9.5, bold: true, color: C.muted, valign: 'middle' });
    L.box(s, x0 + 4.55, ly + 0.115, 0.2, 0.015, { fill: C.line, r: 0 }); L.txt(s, 'Not indicated as typical', x0 + 4.85, ly, 2.5, 0.24, { fontSize: 9.5, color: C.muted, valign: 'middle' });
    L.caption(s, 'Figure', 'Many-to-many. Where significant east-west traffic exists, evaluate direct spoke-to-spoke connectivity or a regional hub rather than routing through a remote hub.', 0.6, 6.55, 12.1);
    L.footer(s, 0, '04 · Workload Landing Zone ARCHETYPES');
    s.addNotes('Each row is a set of options, not an assignment. Interconnected portfolios: direct spoke-to-spoke connectivity may suit a few tightly coupled workloads; a Minimal or Full Regional Hub fits broader routing, inspection, resiliency, or operational needs. Because a portfolio’s combined dependencies can require capabilities beyond any single application, select its profile from aggregate requirements — not from a single workload.');
  }

  // ───────────────────────── 19 · Profiles spectrum
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '05 · What the platform provides', 'Regional Platform Connectivity Profiles', { tw: 8, lede: 'Enabling another region doesn’t require duplicating an existing geographic hub. Choose the most efficient profile that supports the workloads expected to use the region.', lx: 8.6, lw: 4.13 });
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
    L.caption(s, 'Figure', 'Profiles are not maturity stages. Services shown are examples; each hub includes only what its workloads require. Any profile can be the right long-term target.', 0.6, 6.5, 12.1);
    L.footer(s, 0, '05 · CONNECTIVITY PROFILES');
    s.addNotes('Connectivity profiles describe platform capabilities, not workload designs. An organization can maintain a small number of strategic geographic hubs that provide resilient hybrid connectivity and common enterprise services; other regions use different profiles and consume capabilities from those hubs when workload requirements permit. Regional enablement is a spectrum; a profile can remain the target as long as it continues to satisfy workload and platform requirements.');
  }

  // ───────────────────────── 20 · Profile details
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '05 · Connectivity profiles', 'When to choose each profile — and when to reassess', { tw: 12 });
    const D = [
      ['Workloads operate without private connectivity to a hub, another region, or on-premises, and consume platform services locally or through approved Azure service connectivity.', 'Workload resources plus the controls to deploy, secure, monitor, and operate them, using the estate’s standard practices.', 'Validate administration, identity, DNS, secrets, telemetry, data movement, private endpoints. For east-west needs, evaluate direct spoke-to-spoke first.', 'Workloads require private access to enterprise services, inspection, on-premises systems, another portfolio, or hub capabilities.'],
      ['Private access to selected enterprise or on-premises services, with tolerable latency, availability coupling, data transfer, and dependency on another region.', 'Workload spokes plus what must stay close; gateways, firewalls, hybrid connectivity, and routing can remain in the geographic hub.', 'Measure latency and bandwidth with representative traffic; transfer cost, routing, inspection paths, hub scale, dependency criticality, degraded behavior.', 'Cross-region traffic, latency, east-west communication, criticality, regulation, scale, or coupling justify local capabilities.'],
      ['Some local shared services, application-to-application connectivity, lower-latency paths, regional security controls, or more independence than a remote hub gives.', 'Only the connectivity and shared services that must operate locally; other services remain in a strategic hub.', 'Define what is local vs remote; avoid ambiguous routing. Reuse existing ExpressRoute circuits where they provide reachability — do not assume one circuit per region.', 'Growth adds local requirements, portfolios need broader capabilities, stricter independence, or significant local hybrid connectivity.'],
      ['Requirements justify a comprehensive local set — local hybrid connectivity, substantial shared services, strict latency or data-boundary controls, or independence from other hubs.', 'The approved local connectivity, shared services, operations, and independent critical paths — same operating model, not an identical copy.', 'Confirm the level of independence justifies cost and scope; validate automation, observability, ownership, lifecycle. Check existing circuits first.', 'Demand or requirements decrease, services can be centralized, dependencies change, or the footprint no longer justifies its cost.'],
    ];
    const heads = ['Choose when', 'Regional footprint', 'Key considerations', 'Reassess when'];
    const x0 = 0.6, lw = 2.2, cw = (12.13 - lw) / 4, y0 = 1.55;
    PROF.forEach((p, j) => {
      const x = x0 + lw + j * cw;
      L.box(s, x + 0.04, y0, cw - 0.08, 0.72, { fill: j < 2 ? C.t50 : C.b50, r: 0.1 });
      glyph(s, j, x + 0.14, y0 + 0.13);
      L.txt(s, p, x + 0.95, y0, cw - 1.05, 0.72, { fontSize: 11, fontFace: F.semi, color: C.ink, valign: 'middle' });
    });
    const rhs = [1.0, 0.86, 0.95, 0.9];
    let y = y0 + 0.85;
    heads.forEach((h, i) => {
      if (i === 0) L.box(s, x0, y - 0.04, 12.13, rhs[i] + 0.04, { fill: C.b50, r: 0.08 });
      L.txt(s, h.toUpperCase(), x0 + 0.12, y, lw - 0.2, rhs[i], { fontSize: 9, bold: true, color: i === 3 ? C.w600 : C.b600, charSpacing: 1.5, valign: 'middle' });
      D.forEach((row, j) => L.txt(s, row[i], x0 + lw + j * cw + 0.1, y, cw - 0.2, rhs[i], { fontSize: 9.5, color: i === 0 ? C.ink : C.text, valign: 'middle' }));
      y += rhs[i];
      if (i < 3) L.box(s, x0, y + 0.02, 12.13, 0.01, { fill: C.soft, r: 0 });
      y += 0.06;
    });
    L.caption(s, 'Table 2', 'Condensed from the whitepaper. Enabling another region does not by itself require another ExpressRoute circuit.', 0.6, 6.58, 12.1);
    L.footer(s, 0, '05 · CONNECTIVITY PROFILES');
    s.addNotes('Full wording for each profile is in Section 05 of the whitepaper. Remote Hub Connected: cross-region connectivity can be implemented through appropriate Azure networking capabilities based on the required topology and routing model; public ingress can remain local through Azure Front Door or Application Gateway when appropriate. Minimal Regional Hub may include east-west routing, DNS, monitoring, backup, security inspection, egress, private connectivity, selected identity or directory services, or on-premises connectivity. A Full Regional Hub uses the same operating model and control baselines as other strategic hubs but does not have to be an identical copy.');
  }

  // ───────────────────────── Cost, independence, hub implementations
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '05 · Profiles in practice', 'Cost, independence, and how hubs are built', { tw: 7.5, lede: 'Profiles describe capability, not a specific network build. Each step up in local capability has a cost, and the same profile can be implemented in different ways.', lx: 8.4, lw: 4.33 });
    // cost curve (native)
    const cx = 0.9, cy = 5.7, cw = 5.1, ch = 3.6;
    L.line(s, cx, cy, cx, cy - ch, { color: C.faint, w: 1 }); L.line(s, cx, cy, cx + cw, cy, { color: C.faint, w: 1 });
    L.txt(s, 'Local capability and independence →', cx, cy + 0.08, cw, 0.25, { fontSize: 9.5, bold: true, color: C.s600, align: 'center' });
    L.txt(s, 'Fixed platform cost and operational scope →', cx - 0.45, cy - ch, 0.3, ch, { fontSize: 9.5, bold: true, color: C.s600, align: 'center', vert: 'vert270', valign: 'middle' });
    const pts = [[0.35, 0.25, C.t600, 'Disconnected spokes'], [1.55, 0.7, C.c600, 'Remote-hub-connected'], [2.95, 1.65, C.b500, 'Minimal regional hub'], [4.55, 3.25, C.b700, 'Full regional hub']];
    for (let i = 0; i < pts.length - 1; i++) L.line(s, cx + pts[i][0], cy - pts[i][1], cx + pts[i + 1][0], cy - pts[i + 1][1], { color: pts[i + 1][2], w: 2.5, arrow: false });
    pts.forEach(([x, y, c, t], i) => { L.oval(s, cx + x - 0.13, cy - y - 0.13, 0.26, { fill: c }); L.txt(s, t, cx + x + (i === 3 ? -2.0 : 0.2), cy - y + (i === 3 ? -0.45 : 0.02), 1.9, 0.26, { fontSize: 10, bold: true, color: C.ink, align: i === 3 ? 'right' : 'left' }); });
    L.caption(s, 'Figure', 'A qualitative trade-off, not a price list. More local capability usually adds fixed cost and scope, but can reduce cross-region dependency, latency exposure, and availability coupling.', 0.6, 6.15, 5.6);
    // hub implementations
    L.txt(s, 'Hub implementations vary between organizations', 6.75, 1.7, 6, 0.3, { fontSize: 13, fontFace: F.semi, color: C.ink });
    const H = [['Azure Firewall hub', 'Platform-native routing, inspection, and egress with Azure Firewall and related Azure networking.', [['Hub · Azure Firewall', C.b600]]], ['NVA firewall hub', 'Third-party network virtual appliances provide routing, inspection, or security functions.', [['Hub · NVA firewalls', C.b700]]], ['SD-WAN-integrated hub', 'Branch, datacenter, and cloud connectivity integrated through the organization’s SD-WAN.', [['Hub · SD-WAN + inspection', C.b600]]], ['Separate transit and security', 'Separated where scale, ownership, or architecture requirements justify it.', [['Security · inspection', C.s800], ['Transit · hybrid, routing', C.b600]]]];
    H.forEach(([t, d, stk], i) => {
      const x = 6.75 + (i % 2) * 3.02, y = 2.1 + Math.floor(i / 2) * 2.05, w = 2.93, h = 1.92;
      L.box(s, x, y, w, h, { fill: i === 3 ? C.b50 : 'FFFFFF', line: i === 3 ? C.b300 : C.line, r: 0.1 });
      L.txt(s, t, x + 0.15, y + 0.1, w - 0.3, 0.3, { fontSize: 11.5, fontFace: F.semi, color: C.ink });
      L.txt(s, d, x + 0.15, y + 0.42, w - 0.3, 0.6, { fontSize: 9, color: C.muted });
      const rows = [['Workload spokes', C.t100, C.t700]].concat(stk.map(([a, c]) => [a, c, 'FFFFFF']));
      rows.forEach(([a, f, c], j) => { const yy = y + h - 0.12 - (rows.length - j) * 0.3; L.box(s, x + 0.15, yy, w - 0.3, 0.26, { fill: f, r: 0.05 }); L.txt(s, a, x + 0.15, yy, w - 0.3, 0.26, { fontSize: 8.5, bold: true, color: c, align: 'center', valign: 'middle' }); });
    });
    L.box(s, 6.75, 6.25, 5.98, 0.55, { fill: C.wash, r: 0.1 });
    L.txt(s, [{ text: 'Topology: ', options: { bold: true } }, { text: 'hub-and-spoke, Azure Virtual WAN, or other approved Azure networking patterns. Topology decides how, requirements decide which profile.' }], 6.9, 6.25, 5.7, 0.55, { fontSize: 9.5, color: C.ink, valign: 'middle' });
    L.footer(s, 0, '05 · CONNECTIVITY PROFILES');
    s.addNotes('There is no required progression between profiles. Select the most efficient profile for current requirements and add local capabilities only when a measurable need justifies them. The profiles are implementation-neutral: any of these hub designs can sit behind a strategic, minimal, or full regional hub.');
  }

  // ───────────────────────── 21 · Profile selection tree
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, 'Decision tool · Connectivity profile', 'Which profile should this region provide?', { tw: 8, lede: 'Start from the workload requirements and dependencies expected in the region. Stop at the first profile that satisfies them. Two of the four profiles need no local hub.', lx: 9.1, lw: 3.63 });
    L.box(s, 1.35, 1.6, 4.2, 0.4, { fill: C.t600, r: 0.2 });
    L.txt(s, 'Workload scenarios expected in the region', 1.35, 1.6, 4.2, 0.4, { fontSize: 11, fontFace: F.semi, color: 'FFFFFF', align: 'center', valign: 'middle' });
    const Q = [
      'Do the workloads require private access to enterprise services, on-premises systems, centralized inspection, another portfolio, or hub capabilities?',
      'Can they tolerate the latency, availability coupling, data-transfer implications, and dependency on connectivity to another region?',
      'Do requirements justify a comprehensive local set — local hybrid connectivity, substantial shared services, strict latency or data-boundary controls, or independence from other hubs?',
    ];
    const R = [[0, 'No', C.faint, 'Confirm that no hidden dependency requires hub or on-premises connectivity.'], [1, 'Yes', C.b600, 'Measure with representative traffic; document behavior if the hub degrades.'], [2, 'No', C.faint, 'Only services that must be local; define clearly what stays remote.']];
    const qx = 0.6, qw = 5.7, qh = 0.82, rx = 7.55, rw = 5.18;
    Q.forEach((q, i) => {
      const y = 2.3 + i * 1.12;
      L.box(s, qx, y, qw, qh, { fill: 'FFFFFF', line: C.b500, lw: 1.25, r: 0.12 });
      L.num(s, i + 1, qx + 0.14, y + qh / 2 - 0.17, 0.34, C.b50, C.b700, 11);
      L.txt(s, q, qx + 0.6, y, qw - 0.72, qh, { fontSize: 11, fontFace: F.semi, color: C.ink, valign: 'middle' });
      const [k, lab, col, note] = R[i];
      L.box(s, rx, y, rw, qh, { fill: k < 2 ? C.t50 : C.b50, line: k < 2 ? C.t300 : C.b300, r: 0.12 });
      glyph(s, k, rx + 0.16, y + 0.18);
      L.txt(s, [{ text: PROF[k], options: { fontFace: F.semi, fontSize: 12, color: C.ink, breakLine: true } }, { text: note, options: { fontSize: 9.5, color: C.muted } }], rx + 1.02, y, rw - 1.12, qh, { valign: 'middle' });
      L.line(s, qx + qw, y + qh / 2, rx, y + qh / 2, { color: col });
      L.tag(s, lab, (qx + qw + rx) / 2, y + qh / 2, { color: col });
      L.line(s, qx + qw / 2, y - (i ? 0.3 : 0.3), qx + qw / 2, y, { color: i === 2 ? C.faint : C.b600 });
      if (i === 1) L.tag(s, 'Yes', qx + qw / 2, y - 0.15);
      if (i === 2) L.tag(s, 'No', qx + qw / 2, y - 0.15, { color: C.faint });
    });
    const fy = 2.3 + 3 * 1.12;
    L.line(s, qx + qw / 2, fy - 0.3, qx + qw / 2, fy, { color: C.b600 }); L.tag(s, 'Yes', qx + qw / 2, fy - 0.15);
    L.box(s, qx, fy, qw, 0.72, { fill: C.b700, r: 0.12 });
    glyph(s, 3, qx + 0.16, fy + 0.13);
    L.txt(s, [{ text: 'Full regional hub', options: { fontFace: F.semi, fontSize: 12, breakLine: true } }, { text: 'Confirm the required level of independence justifies the cost and operational scope.', options: { fontSize: 9.5, color: 'DDEBF9' } }], qx + 1.02, fy, qw - 1.12, 0.72, { color: 'FFFFFF', valign: 'middle' });
    L.box(s, rx, fy, rw, 0.72, { fill: C.wash, r: 0.12 });
    L.txt(s, [{ text: 'Most efficient, not maximum possible. ', options: { bold: true, color: C.b700 } }, { text: 'Keep capabilities remote when characteristics permit; deploy locally only when a measurable requirement justifies it.' }], rx + 0.18, fy, rw - 0.3, 0.72, { fontSize: 10, color: C.ink, valign: 'middle' });
    L.caption(s, 'Figure', 'Questions escalate from dependency, to tolerance of remote consumption, to required independence. The outcome is a platform capability — not a workload design.', 0.6, 6.5, 12.1);
    L.footer(s, 0, '05 · CONNECTIVITY PROFILES');
    s.addNotes('Each question is derived from the "choose when" criteria of the four profiles. Profiles evolve in both directions — see the "reassess when" triggers on the previous slide.');
  }

  // ───────────────────────── 22 · Estate + principles
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '05 · Profile selection', 'Different profiles coexist across one governed estate', { tw: 6.2 });
    const P = ['Start with the workload requirements and dependencies from regional qualification.', 'Use archetypes to spot recurring needs; validate against the actual workloads.', 'Select the most efficient profile that satisfies those requirements.', 'Keep capabilities remote when characteristics permit; go local only when measurably justified.', 'Consider direct spoke-to-spoke for significant east-west traffic before a regional hub.', 'Profiles coexist; a region’s profile changes only when requirements change — no maturity path.'];
    P.forEach((t, i) => {
      const y = 1.62 + i * 0.58;
      L.txt(s, String(i + 1).padStart(2, '0'), 0.6, y, 0.45, 0.55, { fontSize: 12, bold: true, color: C.b600, valign: 'middle' });
      L.txt(s, t, 1.05, y, 4.85, 0.52, { fontSize: 10.5, color: C.text, valign: 'middle' });
      L.box(s, 0.6, y + 0.54, 5.3, 0.008, { fill: C.soft, r: 0 });
    });
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
    L.caption(s, 'Figure', 'Illustrative estate. Region C’s minimal hub reuses an existing ExpressRoute circuit; Region D’s does not — both are valid.', 0.6, 6.68, 12.1);
    L.footer(s, 0, '05 · CONNECTIVITY PROFILES');
    s.addNotes('A connectivity profile defines the platform capabilities available in a region. Workload placement, profile evolution, and future qualification remain separate decisions. Region names and placements are examples only.');
  }
};
