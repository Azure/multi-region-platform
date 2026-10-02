const { C, F, IMG } = require('../lib');

module.exports = (pres, L) => {
  // ───────────────────────── 26 · Conclusion
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, '10 · Conclusion', 'Design for continuing regional choice', { tw: 8 });
    L.txt(s, [{ text: 'No organization can predict which Azure regions will offer the best mix of services, regulatory fit, business proximity, and workload suitability several years from now. ', options: { fontFace: F.light } }, { text: 'Design the platform so that perfect prediction is unnecessary.', options: { fontFace: F.semi, color: C.ink } }], 0.6, 1.65, 5.0, 2.0, { fontSize: 17, color: C.s600 });
    L.txt(s, 'This framework extends Azure landing-zone principles rather than replacing them. Regional adoption, workload placement, platform expansion, and resiliency can evolve without redesigning the broader platform for every new region.', 0.6, 3.75, 5.0, 1.0, { fontSize: 12, color: C.text });
    const T = [['app', 't', C.t50, C.t300, C.t700, 'Workload-led placement', 'Qualified regional options, archetypes, and current workload requirements let applications use the regional and platform capabilities they need.', 0.6], ['hub', 'b', C.b50, C.b200, C.b700, 'Adaptable regional platform', 'Strategic geographic hubs, resilient hybrid connectivity, and regional profiles distribute capabilities without an identical footprint everywhere.', 0.3], ['shield', 'w', C.s800, null, 'FFFFFF', 'Consistent operating model', 'Keep the landing-zone guardrails and operating standards stable across the Azure estate.', 0]];
    T.forEach(([ic, c, bg, ln, tc, t, d, inset], i) => {
      const y = 1.7 + i * 1.05, x = 6.1 + inset, w = 12.73 - x - inset;
      L.box(s, x, y, w, 0.92, { fill: bg, line: ln || undefined, r: 0.12 });
      L.icon(s, ic, x + 0.25, y + 0.28, 0.36, c);
      L.txt(s, [{ text: t, options: { fontFace: F.semi, fontSize: 13, color: tc, breakLine: true } }, { text: d, options: { fontSize: 10, color: i === 2 ? 'C9D4E2' : C.text } }], x + 0.85, y, w - 1.0, 0.92, { valign: 'middle' });
    });
    s.addImage({ path: IMG('band.jpg'), x: 0.6, y: 5.1, w: 12.13, h: 1.55, sizing: { type: 'cover', w: 12.13, h: 1.55 } });
    L.txt(s, [{ text: 'The goal is not to select the perfect two regions. ', options: { fontFace: F.light } }, { text: 'It is to make additional regions significantly easier to adopt when business and workload requirements justify them.', options: { fontFace: F.semi } }], 1.0, 5.1, 11.3, 1.55, { fontSize: 21, color: 'FFFFFF', valign: 'middle' });
    L.footer(s, 0, '10 · CONCLUSION');
    s.addNotes('Close on the central idea. Three commitments: a consistent operating model; an adaptable regional platform; workload-led placement.');
  }

  // ───────────────────────── Appendix A · paired vs nonpaired
  const SA = 'APPENDIX A · REGIONAL DEPENDENCIES';
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, 'Appendix A', 'Regional dependencies and resiliency', { ec: C.s600, tw: 7.5, lede: 'A multi-region platform creates qualified regional options. Whether a specific workload uses more than one of those regions, and how, is a workload design decision.', lx: 8.4, lw: 4.33 });
    L.box(s, 0.6, 1.75, 12.13, 0.95, { fill: C.b50, r: 0.12 });
    L.txt(s, [{ text: 'This appendix isn’t workload design guidance. ', options: { fontFace: F.semi, color: C.b800 } }, { text: 'The Azure Well-Architected Framework covers how to design a multi-region workload. This appendix covers the regional and service behaviors a platform team should understand when it qualifies regional combinations.' }], 0.85, 1.75, 11.6, 0.95, { fontSize: 12.5, color: C.text, valign: 'middle' });
    L.txt(s, 'Where workload design guidance lives', 0.6, 2.9, 8, 0.3, { fontSize: 14, fontFace: F.semi, color: C.ink });
    const LK = [
      ['AZURE WELL-ARCHITECTED FRAMEWORK', 'Using availability zones and regions', 'How to choose a single-region, zonal, or multi-region design for a workload.', 'https://learn.microsoft.com/azure/well-architected/design-guides/regions-availability-zones'],
      ['AZURE WELL-ARCHITECTED FRAMEWORK', 'Architecture strategies for designing for redundancy', 'Multi-region deployment models, including active-active and active-passive.', 'https://learn.microsoft.com/azure/well-architected/reliability/highly-available-multi-region-design'],
      ['AZURE WELL-ARCHITECTED FRAMEWORK', 'Design methodology for mission-critical workloads', 'The full multi-region active design for the most demanding workloads.', 'https://learn.microsoft.com/azure/well-architected/mission-critical/mission-critical-design-methodology'],
      ['AZURE RELIABILITY', 'Multi-region solutions in nonpaired regions', 'Service-by-service guidance for regions without a pair.', 'https://learn.microsoft.com/azure/reliability/cross-region-replication-azure-no-pair'],
      ['AZURE RELIABILITY', 'Azure reliability service guides', 'Regional behavior for each Azure service.', 'https://learn.microsoft.com/azure/reliability/overview-reliability-guidance'],
    ];
    const lw = (12.13 - 4 * 0.14) / 5;
    LK.forEach(([src, t, d, u], i) => {
      const x = 0.6 + i * (lw + 0.14), y = 3.3;
      L.box(s, x, y, lw, 1.55, { fill: 'FFFFFF', line: C.b100, r: 0.1 });
      L.txt(s, src, x + 0.14, y + 0.1, lw - 0.28, 0.3, { fontSize: 6.8, bold: true, color: C.b600, charSpacing: 1 });
      L.txt(s, t, x + 0.14, y + 0.36, lw - 0.28, 0.5, { fontSize: 10.5, fontFace: F.semi, color: C.b700 });
      L.txt(s, d, x + 0.14, y + 0.86, lw - 0.28, 0.42, { fontSize: 9, color: C.text });
      L.txt(s, [{ text: 'Open on Microsoft Learn', options: { hyperlink: { url: u }, color: C.b600 } }], x + 0.14, y + 1.27, lw - 0.28, 0.2, { fontSize: 8, valign: 'middle' });
    });
    L.txt(s, 'In this appendix', 0.6, 5.05, 8, 0.3, { fontSize: 14, fontFace: F.semi, color: C.ink });
    const IN = [['Paired and nonpaired regions', 'What pairing provides, what it doesn’t, and how region-of-choice designs shift responsibility for recovery.'], ['Storage, backup, and Key Vault', 'Paired-region and region-of-choice behavior for three services that need special attention, and the recommended Key Vault pattern.'], ['Resiliency scenarios', 'Three situations that show how service behavior changes a recovery design.']];
    IN.forEach(([t, d], i) => {
      const x = 0.6 + i * 4.1, y = 5.42, w = 3.93;
      L.box(s, x, y, w, 1.35, { fill: C.wash, r: 0.12 });
      L.txt(s, t, x + 0.2, y + 0.12, w - 0.4, 0.3, { fontSize: 12, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.2, y + 0.46, w - 0.4, 0.82, { fontSize: 10, color: C.text });
    });
    L.footer(s, 0, SA);
    s.addNotes('Region pairing is one input into resiliency design, not the definition of it, and cross-region behavior can differ significantly by service and regional combination. The slides that follow cover the dependencies that most often decide whether a regional combination works as built.');
  }

  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, 'Appendix A · Region pairing', 'Paired and nonpaired regions', { ec: C.s600, tw: 7.5, lede: 'Region pairing is one input into resiliency design, not the definition of it. Azure supports resilient architectures using paired regions, nonpaired regions, or combinations of both.', lx: 8.4, lw: 4.33 });
    const P = [
      ['route', C.b600, 'F3F8FD', 'Azure paired regions', 'PLATFORM-ASSISTED REGIONAL RELATIONSHIP', ['Microsoft defines region pairs, usually within the same geography, with asymmetric and cross-geography exceptions.', 'Some services use the pair for built-in geo-replication — for example, GRS storage, Key Vault, Azure Backup Cross Region Restore.', 'Pairs guide sequential platform updates and recovery prioritization.', 'Deploying into both members does not automatically provide HA, DR, or failover.'], 'Consider: built-in behavior can constrain the secondary to the pair. Some paired regions have restricted access. Validate current service behavior before selecting a recovery architecture.'],
      ['pin', C.t600, C.t50, 'Nonpaired or region-of-choice designs', 'ARCHITECTURE-LED RECOVERY', ['Many newer regions are nonpaired and rely on availability zones for intra-region resiliency.', 'A multi-region workload can use a nonpaired or customer-selected secondary where the services support that combination — through Azure service-based or ISV-based DR.', 'Flexibility for residency, sovereignty, latency, service availability, or continuity.', 'Recovery architecture, replication, dependencies, and failover must be designed and validated per workload.'], 'Pairing can provide useful platform and service capabilities; it does not replace a tested workload recovery design.'],
    ];
    P.forEach(([ic, c, bg, t, k, bl, ft], i) => {
      const x = 0.6 + i * 6.12, y = 1.75, w = 6.0, h = 3.95;
      L.box(s, x, y, w, h, { fill: bg, r: 0.14 });
      L.badge(s, ic, x + 0.25, y + 0.22, 0.5, c);
      L.txt(s, t, x + 0.9, y + 0.22, w - 1.1, 0.5, { fontSize: 16, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, k, x + 0.25, y + 0.85, w - 0.5, 0.22, { fontSize: 8.5, bold: true, color: c, charSpacing: 1.5 });
      L.bullets(s, bl, x + 0.25, y + 1.12, w - 0.5, 1.95, { gap: 3, opts: { fontSize: 10.5 } });
      L.box(s, x + 0.25, y + 3.08, w - 0.5, 0.008, { fill: C.line, r: 0 });
      L.txt(s, ft, x + 0.25, y + 3.14, w - 0.5, 0.75, { fontSize: 9.5, italic: true, color: C.muted });
    });
    L.box(s, 0.6, 5.88, 4.55, 0.9, { fill: C.s800, r: 0.12 });
    L.txt(s, [{ text: '“Deploying resources to a region in a pair doesn’t automatically make them more resilient, nor does it provide automatic high availability, disaster recovery capabilities, or failover.”', options: { fontSize: 9.6, color: 'FFFFFF', breakLine: true } }, { text: 'MICROSOFT LEARN · AZURE REGION PAIRS AND NONPAIRED REGIONS', options: { fontSize: 8, bold: true, color: 'A9B6C6', charSpacing: 1 } }], 0.78, 5.88, 4.2, 0.9, { valign: 'middle' });
    L.box(s, 5.3, 5.88, 7.43, 0.9, { fill: C.wash, r: 0.12 });
    L.txt(s, 'WHAT TO RECORD DURING QUALIFICATION', 5.45, 5.92, 3.2, 0.2, { fontSize: 7.5, bold: true, color: C.b700, charSpacing: 1.5 });
    L.bullets(s, ['Whether each region is paired, with which region, and whether access to the pair is restricted.', 'Availability-zone support in each region.'], 5.45, 6.13, 3.5, 0.62, { gap: 1, indent: 10, opts: { fontSize: 8.4, color: C.ink } });
    L.bullets(s, ['For each service, whether its cross-region capability is tied to the pair or supports a region of choice.', 'The intended recovery region, and who validates the recovery path.'], 9.05, 6.13, 3.55, 0.62, { gap: 1, indent: 10, opts: { fontSize: 8.4, color: C.ink } });
    L.footer(s, 0, SA);
    s.addNotes('Whether a particular regional combination works depends on the requirements of the workload and the capabilities of each service it uses.');
  }

  // ───────────────────────── Three services
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, 'Appendix A · Three services that need special attention', 'Storage, backup, and Key Vault across regions', { ec: C.s600, tw: 8.2, ts: 23, lede: 'Regional qualification cannot stop at “the service exists in both regions.” Cross-region behavior differs by service and regional combination.', lx: 8.4, lw: 4.33 });
    const S = [
      ['data', 'Storage', ['GRS and GZRS replicate asynchronously to the service-defined secondary.', 'Evaluate built-in failover separately from workload recoverability.'], ['Object replication for block blobs only — not append or page blobs, not hierarchical namespace (Data Lake).', 'Requires change feed and versioning; at most two destination accounts.', 'Otherwise, application-level copy.'], 'Replicated data does not by itself make the workload recoverable.'],
      ['loop', 'Backup and restore', ['Cross Region Restore uses the paired region for supported data sources when configured.', 'Support differs by workload and configuration.'], ['Confirm which technologies and restore targets support the recovery region.', 'Azure Site Recovery supports VM DR between regions, subject to its support matrix.', 'Restricted-access regions can require approval.'], 'Demonstrate RTO and RPO through recovery testing, not configuration.'],
      ['lock', 'Key Vault', ['In most paired regions, contents replicate asynchronously to the pair.', 'Failover is Microsoft-initiated, best effort, and can be significantly delayed; restricted (read-only) afterward.'], ['Some paired regions and all nonpaired regions have no Microsoft-managed replication; see Reliability in Azure Key Vault.', 'Separate regional vaults or another custom design; keys, secrets, certificates analyzed separately.', 'Managed HSM: optional two-region replication, for keys only.'], 'Often a runtime dependency: data can be recoverable while the app cannot start.'],
    ];
    S.forEach(([ic, t, pr, rc, tk], i) => {
      const x = 0.6 + i * 4.1, y = 1.72, w = 3.93, h = 5.1;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.box(s, x, y, w, 0.6, { fill: C.b50, r: 0.12 }); L.box(s, x, y + 0.35, w, 0.25, { fill: C.b50, r: 0 });
      L.badge(s, ic, x + 0.18, y + 0.1, 0.4, C.b600);
      L.txt(s, t, x + 0.7, y, w - 0.8, 0.6, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, 'PAIRED REGION', x + 0.2, y + 0.72, 2, 0.2, { fontSize: 8, bold: true, color: C.b600, charSpacing: 1.5 });
      L.bullets(s, pr, x + 0.2, y + 0.95, w - 0.4, 1.3, { gap: 2, opts: { fontSize: 10 } });
      L.txt(s, 'REGION OF CHOICE', x + 0.2, y + 2.3, 2, 0.2, { fontSize: 8, bold: true, color: C.t600, charSpacing: 1.5 });
      L.bullets(s, rc, x + 0.2, y + 2.53, w - 0.4, 1.75, { gap: 2, opts: { fontSize: 10 } });
      L.box(s, x, y + h - 0.72, w, 0.72, { fill: C.wash, r: 0.12 }); L.box(s, x, y + h - 0.72, w, 0.25, { fill: C.wash, r: 0 });
      L.txt(s, tk, x + 0.2, y + h - 0.72, w - 0.4, 0.72, { fontSize: 10, bold: true, color: C.ink, valign: 'middle' });
    });
    L.footer(s, 0, SA);
    s.addNotes('Built-in replication for all three services targets the paired region; region-of-choice designs need explicit replication, restore, and secret-management patterns. Confirm current capabilities on Microsoft Learn at decision time.');
  }

  // ───────────────────────── Key Vault pattern
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, 'Appendix A · The recommended pattern', 'Independent Key Vault per workload per region', { ec: C.s600, tw: 9 });
    L.txt(s, 'For controlled region-of-choice recovery, give each active or recovery region the Key Vault capability it needs before failover is required.', 0.6, 1.5, 6.0, 0.7, { fontSize: 13, fontFace: F.semi, color: C.ink });
    const B = [['Independent regional vault', 'Each workload uses the vault in its local region — no runtime dependency on another region.'], ['Deploy configuration consistently', 'IaC provisions vault configuration, access, private connectivity, monitoring, and policy. An approved secret-management process populates secrets; the IaC repository is not a store for secret values.'], ['Do not make failover the synchronization strategy', 'Populate and validate runtime dependencies before an outage — not by creating or restoring a vault after the primary fails.'], ['Design cryptographic keys separately', 'Customer-managed keys cannot always be reproduced like secrets: Key Vault backup/restore within its constraints, Managed HSM multi-region, or a workload-specific design.']];
    B.forEach(([t, d], i) => {
      const y = 2.3 + i * 0.92;
      L.box(s, 0.6, y - 0.05, 6.0, 0.008, { fill: C.soft, r: 0 });
      L.badge(s, 'check', 0.6, y + 0.08, 0.32, C.b600);
      L.txt(s, [{ text: t, options: { bold: true, color: C.ink, breakLine: true } }, { text: d, options: { color: C.muted } }], 1.05, y, 5.55, 0.85, { fontSize: 10, valign: 'middle' });
    });
    // diagram
    const X = 7.0;
    L.box(s, X, 1.5, 5.73, 5.27, { fill: 'FFFFFF', line: C.line, r: 0.14 });
    L.txt(s, 'Regional vaults populated before failover', X, 1.62, 5.73, 0.3, { fontSize: 12, fontFace: F.semi, color: C.ink, align: 'center' });
    L.box(s, X + 1.72, 2.05, 2.3, 0.62, { fill: C.b600, r: 0.31 });
    L.txt(s, [{ text: 'Approved deployment', options: { bold: true, breakLine: true } }, { text: 'IaC config + secret process', options: { fontSize: 8.5, color: 'DDEBF9' } }], X + 1.72, 2.05, 2.3, 0.62, { fontSize: 10.5, color: 'FFFFFF', align: 'center', valign: 'middle' });
    [['Region A', 'workloads read only the local vault', ['App Svc', 'VMSS', 'SQL DB']], ['Region B', 'already populated and read-write', ['SQL DB', 'VMSS', 'App Svc']]].forEach(([r, n, apps], i) => {
      const x = X + 0.2 + i * 2.75, y = 3.15, w = 2.58;
      L.path(s, [[X + 2.87, 2.67], [X + 2.87, 2.9], [x + w / 2, 2.9], [x + w / 2, y]], { color: C.b500 });
      L.box(s, x, y, w, 3.4, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.12 });
      L.icon(s, 'pin', x + 0.12, y + 0.12, 0.16, 'b'); L.txt(s, r, x + 0.32, y + 0.08, 1.5, 0.24, { fontSize: 10, bold: true, color: C.b700 });
      L.box(s, x + 0.5, y + 0.5, w - 1.0, 0.62, { fill: 'FFFFFF', line: C.b600, lw: 1.25, r: 0.1 });
      L.icon(s, 'lock', x + 0.6, y + 0.64, 0.32, 'b');
      L.txt(s, 'Regional\nKey Vault', x + 1.0, y + 0.5, 1.0, 0.62, { fontSize: 9.5, bold: true, color: C.b800, valign: 'middle' });
      L.txt(s, 'secrets / certificates', x, y + 1.2, w, 0.22, { fontSize: 8.5, color: C.muted, align: 'center' });
      apps.forEach((a, j) => {
        const ax = x + 0.12 + j * 0.8;
        L.line(s, x + w / 2, y + 1.45, ax + 0.36, y + 1.75, { color: C.b300, arrow: false });
        L.box(s, ax, y + 1.75, 0.72, 0.72, { fill: C.t50, line: C.t300, r: 0.1 });
        L.icon(s, a === 'SQL DB' ? 'data' : a === 'VMSS' ? 'layers' : 'app', ax + 0.23, y + 1.83, 0.26, 't');
        L.txt(s, a, ax, y + 2.15, 0.72, 0.25, { fontSize: 8, bold: true, color: C.t700, align: 'center' });
      });
      L.txt(s, n, x, y + 2.7, w, 0.4, { fontSize: 8.5, color: C.muted, align: 'center' });
    });
    L.footer(s, 0, SA);
    s.addNotes('Applies to secrets and certificates. Design customer-managed keys (for example, SQL TDE) separately; see the customer-managed keys scenario. Microsoft Learn also documents backup and restore between vaults; backups can only be restored within the same subscription and Azure geography.');
  }

  // ───────────────────────── Resiliency scenarios
  {
    const s = pres.addSlide(); s.background = { color: 'FFFFFF' };
    L.header(s, 'Appendix A · Resiliency scenarios', 'Multi-region resiliency scenarios', { ec: C.s600, tw: 7, lede: 'How service-specific regional behavior changes workload recovery design. They complement the customer scenarios in Section 08.', lx: 8.4, lw: 4.33 });
    const R = [
      ['R1', 'A workload in a nonpaired region requires DR', [['Storage', 'Region-of-choice pattern such as object replication, or application-level replication.'], ['Compute', 'Azure Site Recovery for applicable VMs, or redeploy stateless compute from IaC.'], ['Key Vault', 'Pre-provision the regional vault; secrets, certificates, key strategy ready before recovery.'], ['Backup', 'Place backup and restore deliberately for the recovery region.']], 'A nonpaired region can be part of a resilient design, but each layer needs an explicit recovery design.'],
      ['R2', '“We’re paired, so we have DR”', [['Symptom', 'Data is recoverable, but the application cannot operate in the secondary.'], ['Possible causes', 'Key Vault or another runtime dependency unavailable; DNS or private endpoints incomplete; compute or shared services not recoverable.'], ['Correction', 'Treat data, identity, secrets and keys, DNS, networking, shared services, compute as dependencies; validate end to end.']], 'Data recovery is not application recovery; pairing does not replace a tested plan.'],
      ['R3', 'Customer-managed keys across two regions', [['Constraint', 'Key material cannot be assumed to be recreated by the pipeline.'], ['Options', 'Key Vault behavior for the regions; backup/restore within subscription and geography; Managed HSM multi-region; or a workload-specific design.'], ['Validate', 'Key availability, access, private connectivity, permissions, and app behavior in the secondary.']], 'Key management can determine which recovery regions are viable.'],
    ];
    R.forEach(([n, t, rows, tk], i) => {
      const x = 0.6 + i * 4.1, y = 1.72, w = 3.93, h = 5.1;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.box(s, x, y, w, 0.95, { fill: C.b50, r: 0.12 }); L.box(s, x, y + 0.6, w, 0.35, { fill: C.b50, r: 0 });
      L.txt(s, t, x + 0.2, y + 0.12, w - 0.4, 0.72, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      let yy = y + 1.05;
      rows.forEach(([k, v]) => {
        const hh = rows.length === 4 ? 0.74 : 0.95;
        L.txt(s, k.toUpperCase(), x + 0.2, yy + 0.02, 1.0, 0.4, { fontSize: 7.5, bold: true, color: C.b700, charSpacing: 1 });
        L.txt(s, v, x + 1.2, yy, w - 1.35, hh, { fontSize: 9.8, color: C.text });
        yy += hh; L.box(s, x + 0.2, yy - 0.04, w - 0.4, 0.006, { fill: C.soft, r: 0 });
      });
      L.box(s, x, y + h - 0.85, w, 0.85, { fill: C.s800, r: 0.12 }); L.box(s, x, y + h - 0.85, w, 0.3, { fill: C.s800, r: 0 });
      L.txt(s, [{ text: 'Takeaway. ', options: { bold: true, color: '50E6FF' } }, { text: tk }], x + 0.2, y + h - 0.85, w - 0.4, 0.85, { fontSize: 9.8, color: 'FFFFFF', valign: 'middle' });
    });
    L.footer(s, 0, SA);
    s.addNotes('Representative situations, not drawn from a specific customer. Confirm current service capabilities on Microsoft Learn at decision time.');
  }

  // ───────────────────────── 27 · Closing
  {
    const s = pres.addSlide();
    s.background = { path: IMG('bg_full.jpg') };
    L.logo(s, 0.6, 0.6, 0.14, 'FFFFFF', 17);
    L.txt(s, 'Briefing deck', 10.3, 0.57, 2.43, 0.35, { fontSize: 13, fontFace: F.semi, color: 'FFFFFF', align: 'right' });
    L.txt(s, [{ text: 'The adaptable ', options: { fontFace: F.light } }, { text: 'multi-region', options: { fontFace: F.semi } }, { text: ' Azure platform', options: { fontFace: F.light } }], 0.6, 2.6, 7.2, 1.3, { fontSize: 34, color: 'FFFFFF' });
    L.txt(s, 'Read the full Multi-Region Platform Whitepaper for the complete framework, decision tools, and Microsoft Learn references.', 0.6, 3.95, 6.5, 0.8, { fontSize: 14, color: 'DDEBF9' });
    L.txt(s, '©2026 Microsoft Corporation. All rights reserved. This document is provided “as-is.” Information and views expressed in this document, including URL and other Internet website references, may change without notice. You bear the risk of using it. This document does not provide you with any legal rights to any intellectual property in any Microsoft product. You may copy and use this document for your internal, reference purposes.', 0.6, 6.55, 12.13, 0.55, { fontSize: 8, color: 'E3EEF9' });
  }
};
