const { C, F, IMG } = require('../lib');

module.exports = (pres, L) => {
  // ───────────────────────── 23 · Placement flow
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '06 · From options to placement', 'Workload placement using qualified options', { ec: C.t600, tw: 8, lede: 'Previous regional qualification is a planning input; decision-time validation is authoritative.', lx: 9.1, lw: 3.63, ls: 13 });
    const groups = [['UNDERSTAND THE WORKLOAD', C.t600, 0, 3], ['MATCH TO QUALIFIED REGIONAL OPTIONS', C.b600, 3, 6], ['DECIDE AND GOVERN', C.s800, 6, 8]];
    const sw = 1.36, gap = 0.17, x0 = 0.6, y = 2.05, sh = 1.95;
    const X = i => x0 + i * (sw + gap) + (i >= 3 ? 0.08 : 0) + (i >= 6 ? 0.08 : 0);
    groups.forEach(([t, c, a, b]) => { const xa = X(a), xb = X(b - 1) + sw; L.txt(s, t, xa, 1.6, xb - xa, 0.22, { fontSize: 8.5, bold: true, color: c, charSpacing: 1.5 }); L.box(s, xa, 1.86, xb - xa, 0.03, { fill: c, r: 0 }); });
    const S = [
      ['Define the placement objective', 'Net-new, remain in place, or relocate'],
      ['Identify the landing zone archetype', 'Closest fit; record requirements beyond it'],
      ['Establish mandatory requirements', 'Location, services, zones, latency, scale, resiliency'],
      ['Review the qualified regional options', 'Regions assessed for the relevant requirements'],
      ['Validate current regional suitability', 'Service, SKU, AI model, access, quota'],
      ['Confirm the connectivity profile', 'The region’s profile must support it'],
      ['Determine the resiliency role', 'Primary, recovery, or active location'],
      ['Record and govern the decision', 'Region, archetype, profile, owners, triggers'],
    ];
    S.forEach(([t, d], i) => {
      const x = X(i), grp = i < 3 ? 0 : i < 6 ? 1 : 2;
      const [bg, ln, nf] = [[C.t50, C.t300, C.t600], [C.b50, C.b200, C.b600], [C.s100, C.s300, C.s800]][grp];
      L.box(s, x, y, sw, sh, { fill: bg, line: ln, r: 0.1 });
      L.num(s, i + 1, x + 0.12, y + 0.12, 0.32, nf, 'FFFFFF', 11);
      L.txt(s, t, x + 0.12, y + 0.52, sw - 0.2, 0.8, { fontSize: 10, fontFace: F.semi, color: C.ink });
      L.txt(s, d, x + 0.12, y + 1.36, sw - 0.2, 0.55, { fontSize: 9, color: C.muted });
      if (i < 7) L.line(s, x + sw, y + sh / 2, X(i + 1), y + sh / 2, { color: [C.t600, C.b600, C.s600][grp] });
    });
    // side outcomes
    const oy = 4.35;
    const sx5 = X(4) + sw / 2, sx6 = X(5) + sw / 2, sx8 = X(7) + sw / 2;
    L.line(s, sx5, y + sh, sx5, oy, { color: C.b300, dash: 'dash' });
    L.box(s, X(3) + 0.6, oy, 2.2, 0.95, { fill: 'FFFFFF', line: C.b300, dash: 'dash', r: 0.1 });
    L.txt(s, [{ text: 'Guaranteed capacity? ', options: { bold: true } }, { text: 'Quota isn’t capacity; decide here whether to reserve it.' }], X(3) + 0.7, oy, 2.02, 0.95, { fontSize: 9, color: C.b800, valign: 'middle' });
    L.line(s, sx6 + 0.2, y + sh, sx6 + 0.2, oy, { color: C.w600 }); L.tag(s, 'Gap', sx6 + 0.2, (y + sh + oy) / 2, { color: C.w600 });
    L.box(s, X(5) + 0.0, oy, 2.35, 0.95, { fill: C.w50, r: 0.1 });
    L.txt(s, [{ text: 'Additional capabilities needed? ', options: { bold: true, color: C.w600 } }, { text: 'A separate governed platform decision — not a profile redefined by the workload team.' }], X(5) + 0.1, oy, 2.17, 0.95, { fontSize: 9, color: C.ink, valign: 'middle' });
    L.line(s, sx8, y + sh, sx8, oy, { color: C.s600 });
    L.box(s, X(7) - 0.48, oy, 1.84, 0.95, { fill: C.wash, r: 0.1 });
    L.txt(s, [{ text: 'Valid outcomes ', options: { bold: true } }, { text: 'include retaining the current region, or no qualified option today.' }], X(7) - 0.38, oy, 1.66, 0.95, { fontSize: 9, color: C.ink, valign: 'middle' });
    // loop back
    const ry = 5.62;
    L.box(s, 0.6, ry, 4.3, 0.72, { fill: C.b600, r: 0.1 });
    L.icon(s, 'doc', 0.78, ry + 0.2, 0.32, 'w');
    L.txt(s, [{ text: 'Regional qualification', options: { fontFace: F.semi, fontSize: 11.5, breakLine: true } }, { text: 'Remain qualified, become conditional, add platform capabilities, or remove.', options: { fontSize: 9, color: 'DDEBF9' } }], 1.22, ry, 3.6, 0.72, { color: 'FFFFFF', valign: 'middle' });
    L.path(s, [[sx8, oy + 0.95], [sx8, ry + 0.36], [4.9, ry + 0.36]], { color: C.b600, dash: 'dash' });
    L.tag(s, 'New requirements, constraints, or platform gaps', 8.1, ry + 0.36, { w: 3.3 });
    L.path(s, [[2.75, ry], [2.75, 5.45], [X(3) + 0.3, 5.45], [X(3) + 0.3, y + sh]], { color: C.b600, dash: 'dash' });
    L.caption(s, 'Figure', 'Teal steps describe the workload, blue steps match it to regional options, slate steps decide and govern. Onboarding findings return to regional qualification.', 0.6, 6.5, 12.1);
    L.footer(s, 0, '06 · WORKLOAD PLACEMENT');
    s.addNotes('Place a workload only after its requirements are understood well enough to make a decision. Regional qualification narrows the choices; it does not permanently approve a region for every application. Revalidate service and SKU availability, AI models where applicable, regional access, and other time-sensitive requirements during onboarding. Step 7: decide whether the region hosts the workload as a primary location, recovery location, or active region, applying workload-specific availability, RTO, RPO, replication, and failover requirements. Step 8: document region, archetype, connectivity profile, placement and resiliency outcomes, assumptions, constraints, owners, and revalidation triggers.');
  }

  // ───────────────────────── Eight placement steps
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '06 · The eight placement steps', 'For each workload or related application portfolio', { ec: C.t600, tw: 9 });
    const S = [
      ['Define the placement objective', 'Is the workload new, staying where it is, or moving or expanding to another region?', 0],
      ['Identify the archetype', 'Assess connectivity, shared-service, data, security, operational, and dependency characteristics; pick the closest fit; record requirements it doesn’t cover as explicit additions.', 0],
      ['Establish mandatory requirements', 'Data location, required services and features, zones, latency, expected scale, connectivity, resiliency, critical dependencies.', 0],
      ['Review the qualified regional options', 'Regions previously assessed against the relevant requirements: capabilities, profiles, constraints, when each was last assessed, open validations.', 1],
      ['Validate current regional suitability', 'Re-check before onboarding: services, SKUs, AI models, access, quota, dependencies. Quota isn’t capacity; decide whether to reserve it.', 1],
      ['Confirm the region’s connectivity profile', 'Check that the region’s profile supports the workload. Additional capabilities are a separate governed platform decision.', 1],
      ['Determine the workload’s resiliency role', 'Primary, recovery, or part of a multi-region active deployment; availability, RTO, RPO, replication, consistency, failover.', 2],
      ['Record and govern the decision', 'Region, archetype, profile, placement and resiliency outcomes, assumptions, constraints, owners, revalidation triggers.', 2],
    ];
    S.forEach(([t, d, g], i) => {
      const x = 0.6 + (i % 4) * 3.08, y = 1.55 + Math.floor(i / 4) * 2.02, w = 2.93, h = 1.86;
      const c = [C.t600, C.b600, C.s800][g];
      L.box(s, x, y, w, 0.04, { fill: c, r: 0 });
      L.txt(s, String(i + 1).padStart(2, '0'), x, y + 0.12, 0.55, 0.4, { fontSize: 20, fontFace: F.light, color: c });
      L.txt(s, t, x + 0.55, y + 0.14, w - 0.55, 0.52, { fontSize: 11.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x, y + 0.72, w, 1.1, { fontSize: 10, color: C.text });
    });
    L.box(s, 0.6, 5.72, 7.9, 1.05, { fill: C.wash, r: 0.12 });
    L.txt(s, 'Outcomes: place in a qualified region, keep it where it is, relocate, extend for recovery or active use, or no qualified option yet. Onboarding findings update regional qualification: an option can remain qualified, become conditional, require additional platform capabilities, or be removed for the affected requirements.', 0.8, 5.72, 7.55, 1.05, { fontSize: 10.5, color: C.ink, valign: 'middle' });
    L.box(s, 8.7, 5.72, 4.03, 1.05, { fill: C.t600, r: 0.12 });
    L.txt(s, 'Regional adaptability does not mean arbitrary placement.', 8.9, 5.72, 3.7, 1.05, { fontSize: 15, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    L.footer(s, 0, '06 · WORKLOAD PLACEMENT');
    s.addNotes('Qualification versus placement: the platform qualifies regions against defined requirements; each workload decides where and how it actually runs. Each informs the other. Regional adaptability still operates within the established landing-zone guardrails and qualified regional options.');
  }

  // ───────────────────────── 25 · Operating model
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '07 · Operating model', 'A consistent operating model, adaptable by region', { tw: 8.4, ts: 23, lede: 'Not a different operating model for every region — one model, with governed room to adapt.', lx: 9.1, lw: 3.63, ls: 13 });
    const A = [['pin', 'Application regional placement'], ['lock', 'Controls for regional or data-boundary requirements'], ['hub', 'Regional platform connectivity profile'], ['gear', 'Regional service, SKU, and configuration parameters'], ['layers', 'Local shared-services footprint'], ['gauge', 'Workload scale, latency, dependency, and resiliency decisions']];
    const K = [['shield', 'Governance guardrails and policy intent'], ['id', 'Identity, security, and compliance baselines'], ['network', 'Architecture principles and approved patterns'], ['gear', 'Deployment automation and infrastructure as code'], ['monitor', 'Monitoring, support, and operational standards'], ['users', 'Ownership, approval, and lifecycle processes']];
    const E = ['Same policy set everywhere; the allowed-locations setting differs per landing zone', 'Same baseline; an added data-residency control only where a regulation requires it', 'Same approved hub design; one region is a Full Regional Hub, another is Remote Hub Connected', 'Same modules and pipelines; region and SKU are passed in as parameters', 'Same alerting and runbooks; local DNS or firewall only where needed', 'Same approval path; each workload team decides its own recovery design'];
    const cw = 1.94, g = 0.098;
    L.txt(s, 'ALLOW TO ADAPT BY REGION AND WORKLOAD', 0.6, 1.6, 6, 0.22, { fontSize: 9, bold: true, color: C.t600, charSpacing: 2 });
    A.forEach(([ic, t], i) => {
      const x = 0.6 + i * (cw + g);
      L.box(s, x, 1.86, cw, 0.92, { fill: 'FFFFFF', line: C.t300, r: 0.1 });
      L.icon(s, ic, x + 0.12, 1.95, 0.24, 't');
      L.txt(s, t, x + 0.44, 1.9, cw - 0.54, 0.84, { fontSize: 10, fontFace: F.semi, color: C.t700, valign: 'middle' });
      L.txt(s, [{ text: 'EXAMPLE', options: { fontSize: 6.5, bold: true, color: C.faint, charSpacing: 1.5, breakLine: true } }, { text: E[i], options: { fontSize: 8.4, color: C.text } }], x + 0.04, 2.82, cw - 0.08, 0.74, { align: 'center', valign: 'middle' });
    });
    L.box(s, 0.6, 3.6, 12.13, 0.95, { fill: C.s800, r: 0.12 });
    K.forEach(([ic, t], i) => {
      const x = 0.6 + i * (cw + g);
      if (i) L.box(s, x - g / 2, 3.72, 0.01, 0.71, { fill: '3A5070', r: 0 });
      L.icon(s, ic, x + 0.12, 3.74, 0.24, 'w');
      L.txt(s, t, x + 0.44, 3.64, cw - 0.54, 0.87, { fontSize: 10, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    });
    L.txt(s, 'KEEP CONSISTENT ACROSS THE AZURE ESTATE', 0.6, 4.62, 6, 0.22, { fontSize: 9, bold: true, color: C.s800, charSpacing: 2 });
    // who decides what
    L.txt(s, 'Who decides what', 0.6, 5.0, 2.2, 0.3, { fontSize: 14, fontFace: F.semi, color: C.ink });
    L.txt(s, 'Each qualified option has a named owner, an assessment date, and revalidation triggers.', 0.6, 5.32, 2.2, 0.7, { fontSize: 9, color: C.muted });
    const W = [['The platform team', 'Owns regional qualification, the connectivity profile for each region, and the decision register. Adding platform capability to a region is a platform decision, not something a workload team changes on its own.', 4.3], ['Security and compliance', 'Own the mandatory gates: data residency, sovereignty, and policy requirements.', 2.5], ['Workload teams', 'Own placement and resiliency decisions for their workloads, within the qualified options.', 2.5]];
    let wx = 3.05;
    W.forEach(([t, d, w]) => {
      L.box(s, wx, 5.0, w, 0.025, { fill: C.b300, r: 0 });
      L.txt(s, t, wx, 5.08, w, 0.26, { fontSize: 10.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, wx, 5.36, w, 0.7, { fontSize: 9.2, color: C.text });
      wx += w + 0.19;
    });
    L.box(s, 0.6, 6.22, 0.04, 0.6, { fill: C.b600, r: 0 });
    L.txt(s, 'Region-agnostic does not mean region-random.', 0.78, 6.22, 3.4, 0.6, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle' });
    L.txt(s, 'Regional adaptability operates within a governed framework. Workloads select from qualified regional options based on their requirements, their archetype, and each region’s current capabilities and qualification status. Reassess qualification as workload requirements and Azure capabilities change.', 4.4, 6.22, 8.33, 0.6, { fontSize: 9.6, color: C.text, valign: 'middle' });
    L.footer(s, 0, '07 · OPERATING MODEL');
    s.addNotes('A multi-region platform should use one operating model across the estate. Keep governance and architecture standards stable, while regional implementation and workload placement adapt to business, application, and regulatory requirements. The platform team owns regional qualification, the connectivity profile for each region, and the decision register. Security and compliance own the mandatory gates. Workload teams own placement and resiliency decisions for their workloads, within the qualified options.');
  }

  // ───────────────────────── Scenarios
  const SC = [
    ['Regulated bank adopts a new in-country region', 'A new Azure region opens in-country while regulation requires certain data or services to remain there.', 'Residency · nonpaired region', [['Driver', 'Data residency and regulation; new in-country region.', C.w600, C.w50], ['Deciding dimensions', 'D2 mandatory location; D3 affected workloads; D4 services, zones, access.', C.b600, C.b50], ['Qualification', 'Qualified for Hybrid-Connected requirements; other workloads candidates.', C.g600, C.g100], ['Archetype', 'Hybrid-Connected Applications.', C.t600, C.t50], ['Connectivity profile', 'Minimal Regional Hub; reuse existing hybrid connectivity where it permits.', C.b600, C.b50], ['Placement', 'In-scope workloads relocate selectively; recovery stays workload-specific.', C.t600, C.t50]], 'Qualify for defined requirements without forcing portfolio-wide relocation; if the new region is nonpaired, design the recovery path explicitly (Appendix A).'],
    ['AI team requires a specific model or GPU SKU', 'The model, SKU, or service is unavailable in existing regions or constrained by quota.', 'Specific capacity · net-new', [['Driver', 'AI model, service, SKU, or quota availability.', C.v600, C.v50], ['Deciding dimensions', 'D1 business need; D2 data constraints; D4 model, SKU, zone, access, quota.', C.b600, C.b50], ['Qualification', 'Qualified for the AI requirements; conditional where private connectivity is not yet designed.', C.g600, C.g100], ['Archetype', 'Isolated Cloud-Native or AI; Connected where private dependencies exist.', C.t600, C.t50], ['Connectivity profile', 'Disconnected Spokes; connected only where dependencies justify it.', C.b600, C.b50], ['Placement', 'Net-new; revalidate model, SKU, access, quota at decision time.', C.t600, C.t50]], 'Do not introduce enterprise connectivity or regional platform capabilities before a workload requirement justifies them.'],
    ['Acquisition brings an estate in another geography', 'Interdependent applications, shared data, and local users where there is little Azure presence.', 'Portfolio · integration', [['Driver', 'Business expansion through acquisition.', C.b600, C.b50], ['Deciding dimensions', 'D1 business need; D2 local data obligations; D3 portfolio dependencies.', C.b600, C.b50], ['Qualification', 'Candidate until dependencies are known; then qualified.', C.g600, C.g100], ['Archetype', 'Interconnected Application Portfolios.', C.t600, C.t50], ['Connectivity profile', 'Remote Hub Connected; Minimal Regional Hub where east-west or independence justify it.', C.b600, C.b50], ['Placement', 'Remain in place initially; relocate selectively with integration.', C.t600, C.t50]], 'Aggregate portfolio dependencies determine the profile; application count or acquisition status does not.'],
    ['Datacenter exit accelerates migration', 'Hybrid-connected applications must leave a colocation facility; is another region now required?', 'Datacenter event · relocation', [['Driver', 'Datacenter and connectivity event.', C.s800, C.s100], ['Deciding dimensions', 'D3 what moves together; D5 hybrid connectivity, reachability, resiliency.', C.b600, C.b50], ['Qualification', 'Existing target region qualified; additional region a candidate.', C.g600, C.g100], ['Archetype', 'Hybrid-Connected Applications.', C.t600, C.t50], ['Connectivity profile', 'No new profile: the existing strategic hub is reused.', C.b600, C.b50], ['Placement', 'Most workloads land in the existing qualified region.', C.t600, C.t50]], 'Remaining in an existing qualified region is a valid outcome; an additional region can stay an option, not a project.'],
  ];
  [[0, 1], [2, 3]].forEach((pair, pi) => {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, pi ? '08 · Customer scenarios · continued' : '08 · Customer scenarios', 'From a driver to a governed regional and workload decision', { ec: C.t600, tw: 8.6, ts: 21, lede: 'Illustrative scenarios, not customer-specific recommendations.', lx: 9.3, lw: 3.43 });
    pair.forEach((k, j) => {
      const [t, d, tag, steps, take] = SC[k], y = 1.6 + j * 2.62, h = 2.48;
      L.box(s, 0.6, y, 12.13, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.num(s, k + 1, 0.8, y + 0.18, 0.4, C.t600, 'FFFFFF', 14);
      L.txt(s, t, 1.35, y + 0.12, 8, 0.32, { fontSize: 14, fontFace: F.semi, color: C.ink });
      L.txt(s, d, 1.35, y + 0.44, 9, 0.28, { fontSize: 10.5, color: C.text });
      L.chip(s, tag, 12.5 - (tag.length * 0.068 + 0.28), y + 0.16, { fill: C.s100, color: C.s800, size: 9 });
      const cw = 1.85, g = 0.12;
      steps.forEach(([k2, v, fg, bg], i) => {
        const x = 0.8 + i * (cw + g);
        L.box(s, x, y + 0.85, cw, 1.02, { fill: bg, r: 0.08 });
        L.txt(s, k2.toUpperCase(), x + 0.1, y + 0.9, cw - 0.2, 0.2, { fontSize: 7.5, bold: true, color: fg, charSpacing: 1 });
        L.txt(s, v, x + 0.1, y + 1.1, cw - 0.2, 0.74, { fontSize: 9, color: C.ink });
      });
      L.icon(s, 'flag', 0.82, y + 2.02, 0.2, 't');
      L.txt(s, [{ text: 'Takeaway. ', options: { bold: true } }, { text: take }], 1.12, y + 1.96, 11.4, 0.36, { fontSize: 10.5, color: C.ink, valign: 'middle' });
    });
    L.footer(s, 0, '08 · CUSTOMER SCENARIOS');
    s.addNotes(pair.map(k => SC[k][0] + ': ' + SC[k][3].map(r => r[0] + ' — ' + r[1]).join(' ')).join('\n\n'));
  });

  // ───────────────────────── Misconceptions
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '09 · Putting it into practice', 'Common misconceptions', { tw: 7, lede: 'Multi-region programs often become more complex than necessary when teams start from assumptions instead of workload and platform requirements. The corrections follow the order of the framework.', lx: 8.3, lw: 4.43 });
    const M = [
      ['Adding a region means another landing-zone project.', 'The landing zone you already run is reused: governance, identity, policy, and automation stay the same. A new region adds regional configuration and only the profile its workloads need.'],
      ['We must choose the perfect regions up front.', 'Requirements and Azure capabilities change. Design so new qualified options can be added without a redesign.'],
      ['Qualified means approved for any workload.', 'Qualification is scoped to defined requirements and dated evidence. Each workload revalidates at onboarding.'],
      ['Every new region needs a Full Regional Hub.', 'Select the most efficient profile that satisfies the requirements. Any profile can remain the long-term target.'],
      ['Another Azure region requires another ExpressRoute circuit.', 'Not by itself. Add connectivity where reachability, diversity, failure domain, latency, routing, or bandwidth justify it.'],
      ['Each region needs its own governance model.', 'Reuse the existing landing-zone governance and operating model; vary implementation only where required.'],
      ['Enabling a region means migrating workloads.', 'Qualification and readiness are not placement. Remaining in the existing region can be the right outcome.'],
      ['A paired region is our disaster recovery.', 'Pairing supports specific platform and service behaviors; workload recovery must still be designed and validated.'],
      ['A multi-region platform means active-active.', 'The platform creates options. Single-region, primary/recovery, or active-active is a workload decision.'],
    ];
    M.forEach(([q, a], i) => {
      const x = 0.6 + (i % 3) * 4.1, y = 1.75 + Math.floor(i / 3) * 1.72, w = 3.93;
      L.box(s, x, y, w, 0.5, { fill: C.w50, r: 0.1 });
      L.icon(s, 'x', x + 0.14, y + 0.15, 0.2, 'o');
      L.txt(s, '“' + q + '”', x + 0.42, y, w - 0.52, 0.5, { fontSize: 10.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.box(s, x, y + 0.55, w, 1.05, { fill: 'FFFFFF', line: C.line, r: 0.1 });
      L.icon(s, 'check', x + 0.14, y + 0.68, 0.2, 'g');
      L.txt(s, a, x + 0.42, y + 0.6, w - 0.52, 0.95, { fontSize: 9.8, color: C.text, valign: 'middle' });
    });
    L.footer(s, 0, '09 · PUTTING IT INTO PRACTICE');
    s.addNotes('Each correction maps to the framework: profiles (Section 05), zones and pairing (Dimension 4 and Appendix A), qualification and placement (Sections 03 and 06), hybrid connectivity (Dimension 5), and the operating model (Section 07).');
  }

  // ───────────────────────── Getting started
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '09 · Putting it into practice', 'Get started with a multi-region platform', { tw: 7.4, lede: 'Start with one candidate region and the workloads that need it. The same process scales to a broader portfolio, and later regions reuse the decisions made for the first.', lx: 8.3, lw: 4.43 });
    const G = [
      ['Name the drivers', 'Business growth, regulation, service or SKU availability, resiliency, a datacenter or connectivity event, cost, or another measurable requirement.'],
      ['Shortlist candidate regions', 'Apply business, geographic, and mandatory data and compliance constraints before deeper technical assessment.'],
      ['Identify workload requirements and archetypes', 'Start with known workloads and portfolios; validate representative dependencies; set guardrails where requirements are unknown.'],
      ['Qualify candidates against workload requirements', 'Services, models, SKUs, zones, dependencies, latency, pricing, access, quota. Record excluded, candidate, conditional, or qualified.'],
      ['Enable the most efficient platform', 'Select the profile, confirm hybrid connectivity, decide local vs remote shared services, close readiness gaps, and agree who decides what.'],
      ['Onboard the first workload', 'Apply the placement process with current evidence; govern placement and resiliency; feed findings back into qualification.'],
    ];
    G.forEach(([t, d], i) => {
      const x = 0.6 + (i % 3) * 4.1, y = 1.7 + Math.floor(i / 3) * 1.95, w = 3.93, h = 1.8;
      L.box(s, x, y, w, h, { fill: (i === 2 || i === 5) ? C.t50 : C.wash, r: 0.12 });
      L.txt(s, String(i + 1).padStart(2, '0'), x + 0.22, y + 0.12, 0.8, 0.5, { fontSize: 26, fontFace: F.light, color: (i === 2 || i === 5) ? C.t600 : C.b600 });
      L.txt(s, t, x + 0.22, y + 0.6, w - 0.44, 0.45, { fontSize: 11.5, fontFace: F.semi, color: C.ink, valign: 'top' });
      L.txt(s, d, x + 0.22, y + 1.07, w - 0.44, 0.7, { fontSize: 9.5, color: C.text });
    });
    s.addImage({ path: IMG('band.jpg'), x: 0.6, y: 5.75, w: 12.13, h: 1.0, sizing: { type: 'cover', w: 12.13, h: 1.0 } });
    L.txt(s, 'WHAT SUCCESS LOOKS LIKE', 0.9, 5.75, 2.4, 1.0, { fontSize: 9, bold: true, color: 'BCD9F5', charSpacing: 2, valign: 'middle' });
    L.txt(s, 'Being able to qualify a regional option, enable only the platform capabilities it requires, and onboard workloads through a repeatable governed process.', 3.3, 5.75, 9.2, 1.0, { fontSize: 14, fontFace: F.semi, color: 'FFFFFF', valign: 'middle' });
    L.footer(s, 0, '09 · PUTTING IT INTO PRACTICE');
    s.addNotes('Step 04 records each option as excluded, candidate, conditional, or qualified for the defined requirements, with evidence and revalidation triggers.');
  }

};
