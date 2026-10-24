const { C, F, IMG } = require('../lib');

module.exports = (pres, L) => {
  const PROF = L.data.profiles;   // No Hub, Remote Hub, Selective Hub, Full Hub

  // ───────────── helpers
  // Small uppercase label (9 pt).
  const label = (s, t, x, y, w, color) => L.txt(s, t.toUpperCase(), x, y, w || 4, 0.2, { fontSize: 9, bold: true, color: color || C.b700, charSpacing: 2, valign: 'middle' });
  // One paragraph per item, built from a bold lead-in run and a body run. Items are [lead, rest, leadColor].
  // Only the first run of a bulleted paragraph carries the bullet, so the lead-in and its sentence stay in one bullet.
  const leadList = (s, items, x, y, w, h, o = {}) => {
    const gap = o.gap === undefined ? 5 : o.gap, runs = [];
    items.forEach(([lead, rest, col], i) => {
      const last = i === items.length - 1;
      // Both runs carry the same paragraph options and align:'left'; with an explicit align, pptxgenjs starts a new
      // paragraph only on breakLine, so the bullet does not split the lead-in from its sentence.
      const po = { align: 'left', paraSpaceAfter: gap };
      if (o.bullet) po.bullet = { indent: 14 };
      runs.push({ text: lead + ' ', options: Object.assign({ bold: true, color: col || C.ink }, po) });
      runs.push({ text: rest, options: Object.assign({ breakLine: !last }, po) });
    });
    L.txt(s, runs, x, y, w, h, { fontSize: o.fs || 11, color: o.color || C.text, lineSpacingMultiple: 1.0 });
  };
  const leadBullets = (s, items, x, y, w, h, o = {}) => leadList(s, items, x, y, w, h, Object.assign({}, o, { bullet: true }));
  const leadParas = (s, items, x, y, w, h, o = {}) => leadList(s, items, x, y, w, h, o);

  // Header shared by the four profile slides: eyebrow + profile name + glyph + one-sentence statement.
  const profileHeader = (s, k, kicker, title, statement) => {
    L.header(s, kicker, title, { tw: 5.0 });
    L.glyph(s, k, 5.85, 0.8);
    L.txt(s, statement, 6.85, 0.72, 5.88, 0.8, { fontSize: 13, color: C.muted, lineSpacingMultiple: 1.05 });
  };

  // Profile slide zones (same on every profile slide):
  //   top zone    y 1.75 – 5.1   the content that belongs to the profile
  //   bottom band y 5.2  – 6.85  Consider (left) and Reassess when (right)
  const TY = 1.75, TB = 5.1, TH = TB - TY, BY = 5.2, BH = 6.85 - BY;
  const CX = 0.6, CW = 7.3, RX = 8.1, RW = 12.73 - RX;
  const zone = (s, x, w, fill, lab, labColor, y, h) => {
    L.box(s, x, y === undefined ? TY : y, w, h === undefined ? TH : h, { fill, r: 0.12 });
    label(s, lab, x + 0.2, (y === undefined ? TY : y) + 0.16, w - 0.4, labColor);
  };
  const reassess = (s, text, x = RX, w = RW, y = BY, h = BH) => {
    L.box(s, x, y, w, h, { fill: C.w50, r: 0.12 });
    label(s, 'Reassess when', x + 0.2, y + 0.16, w - 0.4, C.w600);
    L.txt(s, text, x + 0.2, y + 0.44, w - 0.4, h - 0.5, { fontSize: 11, color: C.ink, lineSpacingMultiple: 1.0 });
  };
  const consider = (s, items, x = CX, w = CW, y = BY, h = BH) => {
    label(s, 'Consider', x, y + 0.02, w);
    L.box(s, x, y + 0.27, w, 0.012, { fill: C.line, r: 0 });
    leadBullets(s, items, x, y + 0.36, w, h - 0.36, { gap: 4 });
  };

  // ───────────────────────── 1 · Prepare the region
  {
    const s = L.slide('part4');
    L.header(s, '', 'Prepare the region', { tw: 5.2 });
    L.txt(s, 'Preparing a region is a targeted change to the platform you already run, not a new landing zone. Build only what the selected connectivity profile and shared-service placement call for, through your existing landing-zone automation. For two of the four profiles there is no hub to build.', 5.9, 0.46, 6.83, 1.1, { fontSize: 13, color: C.muted, lineSpacingMultiple: 1.05 });

    const cards = [
      ['The region in policy and landing-zone provisioning. Workload spokes with their own internet ingress and egress. No hub, no gateway, no peering.', 'Governance, identity, policy, monitoring, and automation.'],
      ['The same, plus a cross-region connection from each spoke to an existing geographic hub, with routing and DNS settings. No hub.', 'An existing geographic hub: its gateways, firewall, DNS, and shared services.'],
      ['The same, plus a hub in the region with only the components you selected.', 'The geographic hub, for everything you didn’t make local.'],
      ['The same, plus a full local hub.', 'The landing-zone foundation and, where they meet requirements, the existing ExpressRoute circuits.'],
    ];
    const gap = 0.17, cw = (12.13 - 3 * gap) / 4, cy = 1.7, ch = 3.25;
    cards.forEach(([add, reuse], k) => {
      const x = 0.6 + k * (cw + gap);
      L.box(s, x, cy, cw, ch, { fill: C.wash, r: 0.12 });
      L.glyph(s, k, x + 0.2, cy + 0.2);
      L.txt(s, PROF[k], x + 1.07, cy + 0.14, cw - 1.2, 0.58, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle', lineSpacingMultiple: 0.95 });
      label(s, 'What you add', x + 0.2, cy + 0.9, cw - 0.4);
      L.txt(s, add, x + 0.2, cy + 1.15, cw - 0.4, 1.05, { fontSize: 11, color: C.text, lineSpacingMultiple: 1.0 });
      label(s, 'What you reuse', x + 0.2, cy + 2.25, cw - 0.4);
      L.txt(s, reuse, x + 0.2, cy + 2.5, cw - 0.4, 0.7, { fontSize: 11, color: C.text, lineSpacingMultiple: 1.02 });
    });

    L.txt(s, 'What stays global and what to update', 0.6, 5.1, 6, 0.3, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle' });
    L.txt(s, 'Most of the landing zone isn’t tied to a region.', 6.7, 5.1, 6.03, 0.3, { fontSize: 11, color: C.muted, align: 'right', valign: 'middle' });
    const G = [
      ['Management groups, subscriptions, and access control', 'No action. Don’t create management groups to model regions.'],
      ['Policy', 'Update only the assignments that restrict allowed locations, so that they admit the new region.'],
      ['Private DNS zones', 'They are global. Create them once and link virtual networks to them.'],
      ['Platform subscriptions', 'Use the existing connectivity and identity subscriptions, with a new resource group for the region.'],
    ];
    G.forEach(([t, d], i) => {
      const x = 0.6 + i * (cw + gap);
      L.box(s, x, 5.5, cw, 0.03, { fill: C.s300, r: 0 });
      L.txt(s, t, x, 5.62, cw, 0.45, { fontSize: 11.5, fontFace: F.semi, color: C.ink, lineSpacingMultiple: 0.98 });
      L.txt(s, d, x, 6.08, cw, 0.78, { fontSize: 11, color: C.text, lineSpacingMultiple: 1.02 });
    });
    s.addNotes('Preparing a region is a targeted change to the platform you already run, not a new landing zone. You build only what the selected connectivity profile and shared-service placement call for, through your existing landing-zone automation, so for No Hub and Remote Hub there is no hub to build. The Cloud Adoption Framework already describes how to add a new region to an existing landing zone, including a new hub in the region; that path is the Full Hub, and the other three profiles do part of it for regions whose workloads need less. Management groups, subscriptions, and access control need no action, policy needs only the allowed-locations assignments updated, private DNS zones are created once, and the existing connectivity and identity subscriptions get a new resource group for the region.');
  }

  // ───────────────────────── 2 · Order of work, estate, ready
  {
    const s = L.slide('part4');
    L.header(s, '', 'Order of work', { tw: 8.2, lede: 'The order is the same for every profile. The profile decides how much each item contains.', lx: 9.1, lw: 3.63 });
    const W = [
      ['Allow the region in policy,', ' for the workload requirements it is qualified for.', 2],
      ['Reserve address space', ' that doesn’t overlap the rest of the estate, even for No Hub.', 2],
      ['Build the network part', ' that the profile calls for: nothing, connections to an existing geographic hub, or a local hub.', 2],
      ['Extend the shared services', ' that must be local, such as DNS forwarding or domain controllers.', 2],
      ['Turn on landing-zone provisioning', ' for the region, so that workload teams receive spokes that match the profile.', 2],
      ['Extend operations:', ' monitoring, security coverage, backup, and runbooks.', 2],
      ['Run the platform readiness checklist.', '', 1],
    ];
    let y = 1.75;
    W.forEach(([lead, rest, n], i) => {
      const h = n === 1 ? 0.4 : 0.54;
      L.box(s, 0.6, y, 5.4, 0.01, { fill: C.soft, r: 0 });
      L.num(s, i + 1, 0.6, y + (h - 0.3) / 2 + 0.01, 0.3, C.b100, C.b700, 10.5);
      L.txt(s, [{ text: lead, options: { bold: true, color: C.ink } }, { text: rest }], 1.05, y + 0.02, 4.95, h - 0.02, { fontSize: 11, color: C.text, valign: 'middle', lineSpacingMultiple: 1.0 });
      y += h;
    });
    L.box(s, 0.6, y, 5.4, 0.01, { fill: C.soft, r: 0 });
    // ready definition
    const ry = y + 0.2;
    L.box(s, 0.6, ry, 5.4, 6.85 - ry - 0.0, { fill: C.g100, r: 0.12 });
    L.icon(s, 'check', 0.8, ry + 0.2, 0.26, 'b', 'Check icon');
    label(s, 'When the region is ready', 1.2, ry + 0.2, 4.5, C.g600);
    L.txt(s, 'A region is ready for workloads when the required capability set is in place through standard automation, its open conditions are resolved, and every applicable item on the platform readiness checklist is true. Workloads can then onboard without platform exceptions.', 0.8, ry + 0.52, 5.0, 6.85 - ry - 0.6, { fontSize: 11, color: C.ink, lineSpacingMultiple: 1.02 });

    // estate diagram (right)
    const X = 6.4, bh = 0.66, pitch = 0.72, y0 = 1.75;
    const reg = (x, yy, w, h, lab, t, sub, o = {}) => {
      L.box(s, x, yy, w, h, { fill: o.fill || 'FFFFFF', line: o.line === undefined ? C.b300 : o.line, dash: o.solid ? 'solid' : 'dash', r: 0.1 });
      if (lab) {
        L.icon(s, 'pin', x + 0.1, yy + 0.08, 0.16, o.ic || 'b', 'Region icon');
        L.txt(s, lab.toUpperCase(), x + 0.3, yy + 0.05, w - 0.35, 0.22, { fontSize: 9, bold: true, color: o.lc || C.b700, valign: 'middle', charSpacing: 1 });
      }
      L.txt(s, [{ text: t, options: { fontFace: F.semi, fontSize: 11, color: o.tc || C.ink, breakLine: !!sub } }].concat(sub ? [{ text: sub, options: { fontSize: 9, color: o.sc || C.muted } }] : []), x + 0.1, yy + (lab ? 0.27 : 0.1), w - 0.18, h - (lab ? 0.3 : 0.15), { valign: 'top', lineSpacingMultiple: 0.98 });
    };
    const hubA = 2.35, hubB = 4.4, hubH = 0.95, hubW = 1.7, hx = X + 1.75;
    reg(X, 3.43, 1.3, 0.9, '', 'On-premises', 'datacenters and user locations', { fill: C.s800, line: null, solid: true, tc: 'FFFFFF', sc: 'C9D4E2' });
    reg(hx, hubA, hubW, hubH, 'Region A', 'Geographic hub', 'Full Hub', { fill: C.b600, line: null, solid: true, ic: 'w', lc: 'DDEBF9', tc: 'FFFFFF', sc: 'DDEBF9' });
    reg(hx, hubB, hubW, hubH, 'Region B', 'Geographic hub', 'Full Hub', { fill: C.b600, line: null, solid: true, ic: 'w', lc: 'DDEBF9', tc: 'FFFFFF', sc: 'DDEBF9' });
    const R = [['Region C', 'Selective Hub', 'On-premises path; rest from A'], ['Region D', 'Selective Hub', 'No on-premises path; rest from A'], ['Region E', 'Remote Hub', 'Services from Region A'], ['Region F', 'Remote Hub', 'Services from Region B'], ['Region G', 'No Hub', 'No private path'], ['Region H', 'Candidate', 'Not yet enabled']];
    const rx = X + 3.95, rw = 12.73 - rx;
    R.forEach(([l, t, sub], i) => reg(rx, y0 + i * pitch, rw, bh, l, t, sub, i === 4 ? { line: C.t300, lc: C.t700, ic: 't' } : i === 5 ? { line: C.b500, tc: C.b700 } : {}));
    const cy = i => y0 + i * pitch + bh / 2, ax = hx + hubW, opx = X + 0.65;
    // on-premises to the two geographic hubs, and the existing ExpressRoute circuit that reaches Region C
    L.path(s, [[opx, 3.43], [opx, 2.82], [hx, 2.82]], { color: C.s600, both: true });
    L.path(s, [[opx, 4.33], [opx, 4.87], [hx, 4.87]], { color: C.s600, both: true });
    L.txt(s, 'ExpressRoute', opx + 0.1, 2.58, 1.0, 0.2, { fontSize: 9, bold: true, color: C.s600 });
    L.txt(s, 'ExpressRoute', opx + 0.1, 4.63, 1.0, 0.2, { fontSize: 9, bold: true, color: C.s600 });
    L.path(s, [[X + 0.25, 3.43], [X + 0.25, 1.95], [rx, 1.95]], { color: C.s600, both: true });
    L.tag(s, 'Existing ExpressRoute circuit', X + 2.45, 1.95, { color: C.s600, w: 2.05 });
    L.line(s, hx + hubW / 2, hubA + hubH, hx + hubW / 2, hubB, { color: C.b600, both: true });
    // minimal and remote-hub regions to their geographic hub (dashed = takes selected services)
    L.path(s, [[rx, 2.25], [ax + 0.3, 2.25], [ax + 0.3, 2.58], [ax, 2.58]], { color: C.b600, dash: 'dash', both: true });
    L.path(s, [[rx, cy(1)], [ax, cy(1)]], { color: C.b600, dash: 'dash', both: true });
    L.path(s, [[rx, cy(2)], [ax + 0.2, cy(2)], [ax + 0.2, 3.1], [ax, 3.1]], { color: C.b600, both: true });
    L.path(s, [[rx, cy(3)], [ax + 0.3, cy(3)], [ax + 0.3, 4.65], [ax, 4.65]], { color: C.b600, both: true });
    L.caption(s, 'Figure', 'Profiles coexisting across one estate. Two geographic hubs provide resilient hybrid connectivity; other regions consume what they need. Region C’s Selective Hub reaches on-premises by reusing an existing ExpressRoute circuit; Region D’s does not. Both are valid. Names and placements are examples only.', X, 6.2, 12.73 - X);
    s.addNotes('The order is the same for every profile; the profile decides how much each item contains. Item 3 is nothing for No Hub, connections to an existing geographic hub for Remote Hub, and a local hub for the two hub profiles. Different profiles can coexist across the estate: a region’s profile changes only when workload and platform requirements change, not because regions are expected to progress along a maturity path. Governance, security, compliance, automation, and operational standards are consistent across every profile. A region is ready for workloads when the required capability set is in place through standard automation, its open conditions are resolved, and every applicable readiness item is true; workloads can then onboard without platform exceptions.');
  }

  // ───────────────────────── 3 · No Hub
  {
    const s = L.slide('part4');
    profileHeader(s, 0, 'Profile 1 of 4', PROF[0], 'There is no hub to build. Preparing the region means letting the landing zone you already run accept it.');
    const AX = 0.6, AW = 3.75, BX = 4.55, BW = 4.5, DX = 9.25, DW = 12.73 - DX;
    zone(s, AX, AW, C.b50, 'Same on every profile', C.b700);
    leadParas(s, [
      ['Policy.', 'Add the region to the assignments that restrict allowed locations.'],
      ['Address space.', 'Assign space that doesn’t overlap the rest of the estate.'],
      ['Monitoring and security.', 'Send logs to the existing workspace, or to one in the region when data must stay there. Extend security posture and threat detection.'],
      ['Backup and keys.', 'Create backup vaults and Key Vaults in the region.'],
    ], AX + 0.2, TY + 0.5, AW - 0.4, TH - 0.6, { gap: 9, fs: 12 });
    zone(s, BX, BW, C.t50, 'Specific to No Hub', C.t700);
    leadParas(s, [
      ['Management groups.', 'Put subscriptions under the landing-zone management group for regions without corporate connectivity.'],
      ['Landing-zone provisioning.', 'Offer the region through subscription vending, with an unpeered spoke or no virtual network.'],
      ['Internet egress and ingress.', 'Give each spoke explicit outbound access, such as a NAT gateway. Protect inbound HTTP and HTTPS with a web application firewall.'],
      ['Name resolution.', 'Use Azure DNS; link private zones required by each spoke’s private endpoints.'],
    ], BX + 0.2, TY + 0.5, BW - 0.4, TH - 0.6, { gap: 9, fs: 12 });
    zone(s, DX, DW, C.wash, 'Where shared services sit', C.s600);
    leadParas(s, [
      ['Global:', 'management groups, access control, policy, and private DNS zones.', C.s600],
      ['Remote:', 'the log workspace, unless data residency requires one in the region.', C.b600],
      ['Local:', 'backup vaults, Key Vaults, and each spoke’s own egress and ingress.', C.t700],
      ['Not used:', 'a hub firewall, hybrid connectivity gateways, DNS forwarders, and domain controllers.', C.faint],
    ], DX + 0.2, TY + 0.5, DW - 0.4, TH - 0.6, { gap: 9, fs: 12 });
    consider(s, [
      ['Keep address space unique.', 'A spoke that isn’t peered today can move to a connected profile later only if its address space doesn’t overlap.'],
      ['Plan operator access.', 'Without a hub there is no shared management path. Decide how operators reach workloads, for example with Azure Bastion in the spoke.'],
      ['Look for hidden dependencies.', 'Confirm that nothing requires connectivity to a geographic hub or an on-premises environment.'],
    ]);
    reassess(s, 'Workloads require a geographic hub, on-premises connectivity, centralized inspection, or private network paths beyond approved same-region spokes and Azure service endpoints.');
    s.addNotes('Workload spokes run in the region with no private network path to a geographic hub, another region’s networks, or an on-premises environment; in the Azure landing zone architecture these are online landing zones. The four items on the left are what every other profile also needs, so the other profile slides show only what they add. New virtual networks default to private subnets without default outbound access, and a NAT gateway is the recommended method for most workloads that don’t need a firewall. A spoke using No Hub can’t use a DNS resolver in a hub, so decide who owns the private DNS zones, and check identity: a workload that needs domain controllers doesn’t fit this profile. Where applications in the region need east-west communication, evaluate direct spoke-to-spoke connectivity without assuming that a local hub is required, limited to spokes of the same environment and workload. Validate administration, identity, DNS, secrets, telemetry, data movement, software distribution, private endpoints, incident response, and support procedures.');
  }

  // ───────────────────────── 4 · Remote Hub
  {
    const s = L.slide('part4');
    profileHeader(s, 1, 'Profile 2 of 4', PROF[1], 'No hub is built in the region. Preparing the region means connecting its spokes to the hub you already operate.');
    const AX = 0.6, AW = 3.95, MX = 4.75, MW = 4.45, LX2 = 9.4, LW2 = 12.73 - LX2;
    zone(s, AX, AW, C.wash, 'What you add', C.b700);
    leadBullets(s, [
      ['A connection', 'from each spoke to the geographic hub in another region.'],
      ['Route tables', 'that send traffic to the hub firewall, as for spokes in the hub’s own region.'],
      ['DNS settings', 'that point the spokes at the resolver or forwarders in the hub.'],
    ], AX + 0.2, TY + 0.48, AW - 0.4, 1.7, { gap: 5 });
    label(s, 'Where shared services sit', AX + 0.2, TY + 2.12, AW - 0.4, C.s600);
    leadParas(s, [
      ['Remote:', 'gateways, firewall and egress, DNS, domain controllers, and the log workspace.', C.s600],
      ['Local:', 'backup vaults, Key Vaults, and public application ingress.', C.t700],
    ], AX + 0.2, TY + 2.38, AW - 0.4, 0.95, { gap: 4 });
    // two ways to connect
    label(s, 'Two ways to connect to the hub', MX, TY + 0.02, MW);
    const ways = [
      ['Hub-and-spoke virtual networks', 'Global peering', 'Hub virtual network', 'Global virtual network peering from each spoke to the hub, with gateway transit when the spokes use the hub’s gateways.'],
      ['Azure Virtual WAN', 'Connection', 'Virtual hub', 'Connect each spoke virtual network to the existing virtual hub, including a hub in another region.'],
    ];
    const wh = (TH - 0.3 - 0.12) / 2;
    ways.forEach(([t, tag, hub, d], i) => {
      const y = TY + 0.3 + i * (wh + 0.12), x = MX, w = MW;
      L.box(s, x, y, w, wh, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.txt(s, t, x + 0.15, y + 0.08, w - 0.3, 0.26, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
      const by = y + 0.4, hw = 1.5;
      L.box(s, x + 0.15, by, 0.78, 0.32, { fill: C.t50, line: C.t300, r: 0.06 });
      L.txt(s, 'Spoke', x + 0.15, by, 0.78, 0.32, { fontSize: 9.5, bold: true, color: C.t700, align: 'center', valign: 'middle' });
      L.line(s, x + 0.93, by + 0.16, x + w - hw - 0.15, by + 0.16, { color: C.b600, both: true });
      L.tag(s, tag, x + 0.93 + (w - hw - 0.15 - 0.93) / 2, by + 0.16, { color: C.b600, w: tag.length * 0.075 + 0.2 });
      L.box(s, x + w - hw - 0.15, by, hw, 0.32, { fill: C.b600, r: 0.06 });
      L.txt(s, hub, x + w - hw - 0.15, by, hw, 0.32, { fontSize: 9.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
      L.txt(s, d, x + 0.15, y + 0.8, w - 0.3, wh - 0.85, { fontSize: 11, color: C.text, lineSpacingMultiple: 1.0 });
    });
    // limits
    label(s, 'Check these limits', LX2, TY + 0.02, LW2, C.w600);
    const lim = ['A spoke on remote gateways can’t have its own gateway, and uses the gateways of one peering only.', 'ExpressRoute FastPath doesn’t support global virtual network peering.', 'Resources can’t reach the front end of a basic load balancer across global peering.', 'Peering isn’t transitive: spokes reach each other through the hub firewall or directly.'];
    const lh = (TH - 0.3 - 3 * 0.08) / 4;
    lim.forEach((t, i) => {
      const y = TY + 0.3 + i * (lh + 0.08);
      L.box(s, LX2, y, LW2, lh, { fill: C.w50, r: 0.1 });
      L.icon(s, 'flag', LX2 + 0.12, y + (lh - 0.24) / 2, 0.24, 'o', 'Limit icon');
      L.txt(s, t, LX2 + 0.45, y, LW2 - 0.55, lh, { fontSize: 11, color: C.ink, valign: 'middle', lineSpacingMultiple: 1.0 });
    });
    consider(s, [
      ['Accept the dependency knowingly.', 'Document how workloads behave if the geographic hub or the connection to it is degraded.'],
      ['Measure before you commit.', 'Test latency and bandwidth with representative traffic.'],
      ['Count the cross-region cost.', 'Global peering carries traffic charges. Also evaluate routing, inspection paths, and hub capacity.'],
    ]);
    reassess(s, 'Cross-region traffic, latency, east-west communication, dependency criticality, regulatory requirements, scale, or availability coupling justify deploying selected connectivity or shared-service capabilities locally.');
    s.addNotes('Workload spokes in the region connect across regions to an existing geographic hub and use its gateways, firewall, DNS, and shared services. Policy, address space, monitoring, backup, and keys are the same as for No Hub, and address space must not overlap the hub or the other spokes. How you connect depends on the topology of the hub you already run: global virtual network peering with gateway transit, or a connection to the existing virtual hub in Azure Virtual WAN, which describes this as a good option when the footprint is mostly in one region with a few remote spokes. Microsoft’s hub-spoke guidance recommends at least one hub per region so that a failure in one region’s hub doesn’t affect other regions; this profile trades that isolation for speed and cost, so use it for workloads that can tolerate the dependency. Also agree who operates the connection, routes, and DNS settings, and for spokes that exchange a lot of traffic consider direct connectivity between them.');
  }

  // ───────────────────────── 5 · Selective Hub
  {
    const s = L.slide('part4');
    profileHeader(s, 2, 'Profile 3 of 4', PROF[2], 'A hub that holds only what its workloads need locally. Everything else comes from a geographic hub.');
    const AX = 0.6, AW = 3.55, TX = 4.35, TW = 12.73 - TX;
    zone(s, AX, AW, C.wash, 'The base', C.b700);
    leadBullets(s, [
      ['A hub in the region:', 'a hub virtual network, or a virtual hub in your Virtual WAN.'],
      ['A connection', 'to the geographic hub.'],
      ['Connections', 'from the region’s spokes to the local hub.'],
      ['Routing', 'that sends traffic to the right hub.'],
    ], AX + 0.2, TY + 0.48, AW - 0.4, 1.9, { gap: 4 });
    L.txt(s, [{ text: 'Same as No Hub: ', options: { bold: true, color: C.ink } }, { text: 'policy, address space, provisioning, monitoring, backup, and keys.' }], AX + 0.2, TY + 2.5, AW - 0.4, 0.75, { fontSize: 11, color: C.text, lineSpacingMultiple: 1.0 });
    // optional components table
    label(s, 'Optional components', TX, TY + 0.02, 2.4);
    L.txt(s, 'Add one only when a workload requirement calls for it in the region.', TX + 2.4, TY, TW - 2.4, 0.24, { fontSize: 11, color: C.muted, valign: 'middle', align: 'right' });
    const cx = [TX, TX + 1.95, TX + 5.35], cwid = [1.85, 3.3, TW - 5.35];
    const hy = TY + 0.34;
    ['Component', 'Make it local when', 'Keep it remote when'].forEach((h, i) => label(s, h, cx[i], hy, cwid[i], C.faint));
    L.box(s, TX, hy + 0.25, TW, 0.012, { fill: C.s300, r: 0 });
    const T = [
      ['ExpressRoute or VPN gateway', 'Workloads need an on-premises path for latency, bandwidth, or independence.', 'On-premises traffic is light or tolerates the path through the geographic hub.', 0.56],
      ['Azure Firewall or network virtual appliance', 'Traffic between spokes is heavy, egress must leave the region, or data must be inspected inside a boundary.', 'Inspection in the geographic hub meets latency, cost, and data requirements.', 0.7],
      ['DNS private resolver or forwarders', 'Name resolution must not depend on the link to another region.', 'Spokes can use the resolver in the geographic hub.', 0.56],
      ['Domain controllers', 'Applications authenticate often, or must keep working when the other region is unavailable.', 'Authentication traffic is light and tolerates the dependency.', 0.68],
    ];
    let ty = hy + 0.3;
    T.forEach(([c, a, b, h]) => {
      L.txt(s, c, cx[0], ty, cwid[0], h, { fontSize: 11, bold: true, color: C.ink, valign: 'middle', lineSpacingMultiple: 1.0 });
      L.txt(s, a, cx[1], ty, cwid[1], h, { fontSize: 11, color: C.text, valign: 'middle', lineSpacingMultiple: 1.0 });
      L.txt(s, b, cx[2], ty, cwid[2], h, { fontSize: 11, color: C.text, valign: 'middle', lineSpacingMultiple: 1.0 });
      ty += h;
      L.box(s, TX, ty, TW, 0.008, { fill: C.soft, r: 0 });
    });
    consider(s, [
      ['Write down the split.', 'Define which capabilities operate locally and which stay remote, so routing and responsibilities don’t overlap.'],
      ['Plan the on-premises path when the hub has no gateway.', 'Peering isn’t transitive: connect the local hub to an existing circuit, also peer the spokes to the geographic hub, or use Virtual WAN.'],
      ['Know which profile you have.', 'When the region can keep operating without the other hubs, it is a Full Hub; plan its cost and scope as one.'],
    ]);
    reassess(s, 'Workload growth adds local connectivity or shared-service requirements, interconnected application portfolios need broader regional capabilities, independence requirements tighten, or significant local hybrid connectivity is required.');
    s.addNotes('A Selective Hub isn’t a fixed design: which components are local is a choice for each region, and the fewer you make local, the faster the region is ready and the less it costs to run. Every one has the same base, in the connectivity subscription you already use with a new resource group for the region. Deploy the components that must be local in the same order as for a Full Hub: inspection, gateways, name resolution, then identity. Example compositions, none of them a design to copy: a local on-premises path, a hub with a gateway on an existing circuit; local inspection and egress, a hub with a firewall and DNS forwarding; and local shared services only, a hub virtual network with DNS forwarding and connections to domain controllers. A requirement for latency, residency, or independence can also make another shared service local. When on-premises connectivity is required, check whether existing ExpressRoute circuits and gateway topology can provide it before adding circuits, and do not assume each Azure region needs a dedicated circuit. Test both failure directions, and plan route tables so that traffic between regions is inspected where it must be when hubs share circuits.');
  }

  // ───────────────────────── 6 · Full Hub: build order
  {
    const s = L.slide('part4');
    profileHeader(s, 3, 'Profile 4 of 4', PROF[3], 'A full local hub that can keep operating when other hubs are unavailable. It is the path the Cloud Adoption Framework describes.');
    label(s, 'Build the hub in this order', 0.6, TY + 0.02, 4);
    L.txt(s, 'Start with what every profile needs, then follow the steps for your topology.', 4.6, TY, 12.73 - 4.6, 0.24, { fontSize: 11, color: C.muted, valign: 'middle', align: 'right' });
    const cx = [0.6, 3.25, 8.0], cwid = [2.55, 4.6, 12.73 - 8.0];
    const hy = TY + 0.34;
    ['Step', 'Hub-and-spoke virtual networks', 'Azure Virtual WAN'].forEach((h, i) => label(s, h, cx[i], hy, cwid[i], C.faint));
    L.box(s, 0.6, hy + 0.25, 12.13, 0.012, { fill: C.s300, r: 0 });
    const B = [
      ['1', 'Hub', 'Hub virtual network in the existing connectivity subscription.', 'Virtual hub in the existing Virtual WAN.', 0.31],
      ['2', 'Inspection', 'Azure Firewall or network virtual appliances in the hub.', 'Azure Firewall or a supported appliance, with routing intent.', 0.31],
      ['3', 'Hybrid connectivity', 'VPN or ExpressRoute gateways; reuse existing circuits.', 'Gateways in the virtual hub.', 0.31],
      ['4', 'Connection to other hubs', 'Peer the new hub with the other hub virtual networks.', 'Automatic between hubs of the same Virtual WAN.', 0.31],
      ['5', 'Routing', 'Azure Route Server or user-defined routes.', 'Any static routes the virtual hub needs.', 0.31],
      ['6', 'Name resolution', 'DNS forwarders for the region, linked to the private DNS zones.', 'Forwarders in a spoke connected to the virtual hub.', 0.31],
      ['7', 'Identity', 'A peered virtual network in the identity subscription, with domain controllers if needed.', 'The same.', 0.4],
      ['8', 'Spokes', 'Peer the region’s workload spokes to the new hub.', 'Connect them to the new virtual hub.', 0.31],
    ];
    let ty = hy + 0.31;
    B.forEach(([n, c, a, b, h]) => {
      L.num(s, n, cx[0], ty + (h - 0.26) / 2, 0.26, C.b100, C.b700, 10);
      L.txt(s, c, cx[0] + 0.38, ty, cwid[0] - 0.38, h, { fontSize: 11, bold: true, color: C.ink, valign: 'middle', lineSpacingMultiple: 1.0 });
      L.txt(s, a, cx[1], ty, cwid[1], h, { fontSize: 11, color: C.text, valign: 'middle', lineSpacingMultiple: 1.0 });
      L.txt(s, b, cx[2], ty, cwid[2], h, { fontSize: 11, color: C.text, valign: 'middle', lineSpacingMultiple: 1.0 });
      ty += h;
      L.box(s, 0.6, ty, 12.13, 0.008, { fill: C.soft, r: 0 });
    });
    // connect to the rest of the estate
    consider(s, [
      ['Connect hubs across two regions.', 'Use global virtual network peering.'],
      ['Use shared circuits or Virtual WAN for more regions.', 'Directly peer workload virtual networks when only a few workloads need cross-region traffic.'],
      ['Plan inspection between regions.', 'When hubs share circuits, route inter-region traffic through the firewall.'],
    ], CX, CW, BY, BH);
    reassess(s, 'Workload demand or requirements decrease, services can be safely centralized, dependencies change, or the full regional footprint no longer provides sufficient value relative to its cost and operational complexity.', RX, RW, BY, BH);
    s.addNotes('The region gets a full local hub that can keep operating when other hubs are unavailable. This is the path the Cloud Adoption Framework describes for adding a region to an existing landing zone, so most of the work is documented there, including the detail of each step. Start with what every profile needs, then build the hub in this order for hub-and-spoke virtual networks or for Azure Virtual WAN. The resource group and hub virtual network go in the existing connectivity subscription; for identity, create a virtual network in the identity subscription, peer it to the hub, and deploy domain controllers if workloads need them. To connect the hub to the rest of the estate, use global peering for two regions, shared ExpressRoute circuits or Virtual WAN transit for more, and direct global peering between landing-zone virtual networks for a few workloads across regions. Gateways, firewall and egress, DNS, domain controllers, backup vaults, and Key Vaults are local; the log workspace is local or remote, and you start with the existing workspace unless data must stay in the region. A Full Hub uses the same operating model and control baselines as your other hubs. It doesn’t have to be an identical copy.');
  }

  // ───────────────────────── 7 · Full Hub: design options, considerations, reassess
  {
    const s = L.slide('part4');
    profileHeader(s, 3, 'Local hub options', 'Hub design options', 'These implementations can sit behind a Selective Hub or Full Hub. The profile describes capability, not a specific network build.');
    const H = [
      ['Azure Firewall hub', 'Platform-native routing, inspection, and egress with Azure Firewall.', [['Hub · Azure Firewall', C.b600]]],
      ['NVA firewall hub', 'Third-party network virtual appliances provide routing, inspection, or security.', [['Hub · NVA firewalls', C.b700]]],
      ['SD-WAN-integrated hub', 'Branch, datacenter, and cloud connectivity through the organization’s SD-WAN.', [['Hub · SD-WAN + inspection', C.b600]]],
      ['Separate transit and security', 'Separated where scale, ownership, or architecture requirements justify it.', [['Security · inspection', C.s800], ['Transit · hybrid, routing', C.b600]]],
    ];
    const gap = 0.17, w = (12.13 - 3 * gap) / 4, h = 2.3, y = TY;
    H.forEach(([t, d, stk], i) => {
      const x = 0.6 + i * (w + gap);
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.1 });
      L.txt(s, t, x + 0.16, y + 0.12, w - 0.32, 0.3, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.16, y + 0.5, w - 0.32, 0.6, { fontSize: 11, color: C.text, lineSpacingMultiple: 1.0 });
      const rows = [['Workload spokes', C.t100, C.t700]].concat(stk.map(([a, c]) => [a, c, 'FFFFFF']));
      rows.forEach(([a, f, c], j) => {
        const yy = y + h - 0.14 - (rows.length - j) * 0.33;
        L.box(s, x + 0.16, yy, w - 0.32, 0.29, { fill: f, r: 0.05 });
        L.txt(s, a, x + 0.16, yy, w - 0.32, 0.29, { fontSize: 9.5, bold: true, color: c, align: 'center', valign: 'middle' });
      });
    });
    L.box(s, 0.6, 4.17, 12.13, 0.75, { fill: C.b50, r: 0.1 });
    L.txt(s, [{ text: 'Any of these designs can sit behind a Selective Hub or Full Hub. ', options: { bold: true, color: C.ink } }, { text: 'Profiles can be implemented using hub-and-spoke virtual networks, Azure Virtual WAN, or other approved Azure networking patterns. Topology determines how the capability is implemented; workload and platform requirements determine which profile is appropriate.' }], 0.82, 4.17, 11.7, 0.75, { fontSize: 11, color: C.text, valign: 'middle', lineSpacingMultiple: 1.0 });
    s.addNotes('Profiles describe capability, not a specific network build, and these four implementations show how the same profile can be built differently. Any of them can sit behind a Selective Hub or Full Hub; topology determines how the capability is implemented, while workload and platform requirements determine which profile is appropriate. Where on-premises connectivity is required, check whether existing ExpressRoute circuits can provide the reachability and resiliency before adding connectivity, and build hybrid connectivity to the resiliency recommendations: circuits from more than one peering location and zone-redundant gateways where the region supports them. Operate the hub like the other hubs by validating automation, observability, support ownership, security operations, configuration consistency, dependency behavior, and lifecycle management.');
  }

  // ───────────────────────── 8 · Platform readiness checklist
  {
    const s = L.slide('part4');
    L.header(s, 'Before workloads arrive', 'Platform readiness checklist for a new region', { tw: 8.3, lede: 'Plan early for the capabilities that the region’s connectivity profile and workload requirements call for.', lx: 9.1, lw: 3.63, ls: 12 });
    const G = [
      ['network', C.b600, 'Network foundation', [
        ['IP address planning', 'Non-overlapping address space for future regions and profiles.', 1],
        ['Private DNS across regions', 'Private endpoints and hybrid names resolve wherever the workload runs.'],
        ['Routing and inspection paths', 'Traffic reaches hubs and firewalls without asymmetric paths.'],
        ['Hybrid connectivity', 'Existing circuits are reused, or paths are added.'],
        ['Firewall and partner allow-lists', 'Include the new region’s address ranges.'],
        ['Identity services', 'Reachable from the region by the workloads that depend on them.']]],
      ['shield', C.s800, 'Governance and automation', [
        ['Region settings in policy', 'Allowed locations admit the region only for its qualified requirements.', 1],
        ['Region-aware infrastructure as code', 'Modules, naming, and tagging are parameterized by region.'],
        ['Landing-zone provisioning', 'Vending can place workloads in the region.'],
        ['Regional access', 'Subscriptions have access where the region is restricted.']]],
      ['monitor', C.t600, 'Operations and data', [
        ['Where logs and telemetry live', 'Workspace location and residency are decided.', 1],
        ['Backup placement', 'Vaults and valid restore targets exist for the region.'],
        ['Runbooks and support', 'Incident, on-call, and support procedures include the region.']]],
      ['gauge', C.v600, 'Capacity and security', [
        ['Quota and specific capacity', 'Quota for required SKUs and models is requested ahead of onboarding.', 1],
        ['Key Vault placement', 'Workload vaults exist per region, not as a cross-region dependency.'],
        ['Security coverage', 'Posture, threat detection, and privileged access extend to the region.']]],
    ];
    const key = (x, y, k) => L.box(s, x, y, 0.17, 0.17, { fill: 'FFFFFF', line: k ? C.w600 : C.b500, lw: 1.5, r: 0.04 });
    const rowH = 0.58, top = 1.55;
    const item = (x, y, w, n, d, k) => {
      key(x, y + 0.03, k);
      L.txt(s, n, x + 0.27, y, w - 0.27, 0.22, { fontSize: 11, bold: true, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.27, y + 0.22, w - 0.27, rowH - 0.24, { fontSize: 11, color: C.text, lineSpacingMultiple: 0.98 });
    };
    // Network foundation: full width, heading row with the note on connected profiles, then two rows of three
    const nh = 0.5 + 2 * rowH + 0.1;
    L.box(s, 0.6, top, 12.13, nh, { fill: C.wash, r: 0.1 });
    L.badge(s, G[0][0], 0.75, top + 0.1, 0.36, G[0][1]);
    L.txt(s, G[0][2], 1.22, top + 0.1, 2.1, 0.36, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
    L.txt(s, 'Private DNS, routing and inspection paths, and hybrid connectivity apply only to connected profiles. Everything else applies to every profile, including No Hub.', 3.5, top + 0.06, 9.1, 0.44, { fontSize: 11, color: C.muted, valign: 'middle', lineSpacingMultiple: 1.0 });
    const nw = (12.13 - 0.3 - 2 * 0.2) / 3;
    G[0][3].forEach(([n, d, k], j) => item(0.75 + (j % 3) * (nw + 0.2), top + 0.55 + Math.floor(j / 3) * rowH, nw, n, d, k));
    // the other three groups side by side
    const by0 = top + nh + 0.09, gw = (12.13 - 2 * 0.12) / 3, gh = 0.48 + 4 * rowH + 0.04;
    G.slice(1).forEach(([ic, c, t, items], gi) => {
      const x = 0.6 + gi * (gw + 0.12);
      L.box(s, x, by0, gw, gh, { fill: C.wash, r: 0.1 });
      L.badge(s, ic, x + 0.15, by0 + 0.09, 0.36, c);
      L.txt(s, t, x + 0.62, by0 + 0.09, gw - 0.75, 0.36, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
      items.forEach(([n, d, k], j) => item(x + 0.15, by0 + 0.5 + j * rowH, gw - 0.3, n, d, k));
    });
    const legendY = by0 + gh + 0.02;
    key(2.1, legendY + 0.01, 1);
    L.txt(s, 'Common blockers: plan early, during qualification', 2.37, legendY, 3.55, 0.22, { fontSize: 10, color: C.muted, valign: 'middle' });
    key(6.3, legendY + 0.01, 0);
    L.txt(s, 'Confirm as the capability set is put in place', 6.57, legendY, 3.55, 0.22, { fontSize: 10, color: C.muted, valign: 'middle' });
    const ry = legendY + 0.24;
    L.box(s, 0.6, ry, 12.13, 6.85 - ry, { fill: C.g100, r: 0.1 });
    L.icon(s, 'check', 0.78, ry + (6.85 - ry - 0.26) / 2, 0.26, 'b', 'Check icon');
    L.txt(s, 'A region is ready for workloads when the required capability set is in place through standard automation, its open conditions are resolved, and every applicable item on the platform readiness checklist is true. Workloads can then onboard without platform exceptions.', 1.2, ry, 11.4, 6.85 - ry, { fontSize: 11, color: C.ink, valign: 'middle', lineSpacingMultiple: 1.0 });
    s.addNotes('The checklist names what must be true, not how a specific hub is built. Plan common blockers during qualification. Private DNS across regions, routing and inspection, and hybrid connectivity apply only to connected profiles; the other items apply to every profile, including No Hub. Request quota before onboarding and reserve capacity where justified. Follow the Backup and restore and Key Vault service guides, designing keys separately from secrets and certificates. Later regions reuse this foundation instead of starting new projects.');
  }
};
