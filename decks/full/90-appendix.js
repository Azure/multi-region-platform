const { C, F, IMG } = require('../lib');

module.exports = (pres, L) => {
  // Greedy word-wrap estimate, used only to size rows: cpl = characters per line.
  const wrapLines = (text, cpl) => {
    let n = 1, w = 0;
    String(text).split(/\s+/).forEach(word => {
      if (w && w + 1 + word.length > cpl) { n++; w = word.length; } else { w += (w ? 1 : 0) + word.length; }
    });
    return n;
  };
  // ───────────────────────── Appendix A opener (PDF p50)
  {
    const s = L.slide('appendix');
    L.header(s, '', 'Service behavior across regions', { eyebrow: 'Appendix A', ec: C.s600, tw: 7.5, lede: 'A multi-region platform creates qualified regional options. Whether a specific workload uses more than one of those regions, and how, is a workload design decision.', lx: 8.4, lw: 4.33 });
    L.box(s, 0.6, 1.6, 12.13, 0.85, { fill: C.b50, r: 0.12 });
    L.txt(s, [{ text: 'This appendix isn’t workload design guidance. ', options: { fontFace: F.semi, color: C.b800 } }, { text: 'The Azure Well-Architected Framework covers how to design a multi-region workload. This appendix covers the regional and service behaviors a platform team should understand when it qualifies regional combinations: region pairing is one input into resiliency design, not the definition of it, and cross-region behavior can differ significantly by service and regional combination.' }], 0.85, 1.6, 11.65, 0.85, { fontSize: 12, color: C.text, valign: 'middle' });
    L.txt(s, 'Where workload design guidance lives', 0.6, 2.58, 8, 0.3, { fontSize: 14, fontFace: F.semi, color: C.ink });
    const LK = [
      ['AZURE WELL-ARCHITECTED FRAMEWORK', ['Using availability zones', 'and regions'], 'How to choose a single-region, zonal, or multi-region design for a workload.', 'https://learn.microsoft.com/azure/well-architected/design-guides/regions-availability-zones'],
      ['AZURE WELL-ARCHITECTED FRAMEWORK', ['Architecture strategies', 'for designing for', 'redundancy'], 'Multi-region deployment models, including active-active and active-passive.', 'https://learn.microsoft.com/azure/well-architected/reliability/highly-available-multi-region-design'],
      ['AZURE WELL-ARCHITECTED FRAMEWORK', ['Design methodology', 'for mission-critical', 'workloads'], 'The full multi-region active design for the most demanding workloads.', 'https://learn.microsoft.com/azure/well-architected/mission-critical/mission-critical-design-methodology'],
      ['AZURE RELIABILITY', ['Multi-region solutions in', 'nonpaired regions'], 'Service-by-service guidance for regions without a pair.', 'https://learn.microsoft.com/azure/reliability/cross-region-replication-azure-no-pair'],
      ['AZURE RELIABILITY', ['Azure reliability', 'service guides'], 'Regional behavior for each Azure service.', 'https://learn.microsoft.com/azure/reliability/overview-reliability-guidance'],
    ];
    const lw = (12.13 - 4 * 0.14) / 5, ly = 2.95, lh = 2.05;
    LK.forEach(([src, t, d, u], i) => {
      const x = 0.6 + i * (lw + 0.14);
      L.box(s, x, ly, lw, lh, { fill: 'FFFFFF', line: C.b200, r: 0.1 });
      L.txt(s, src, x + 0.14, ly + 0.12, lw - 0.28, 0.32, { fontSize: 9.5, bold: true, color: C.b600, charSpacing: 0.5 });
      // Line breaks are set by hand, at spaces, so a link title never has to wrap inside a link run.
      const runs = t.map((line, k) => ({ text: line, options: { hyperlink: { url: u, tooltip: 'Open on Microsoft Learn' }, color: C.b600, underline: { style: 'sng', color: C.b600 }, breakLine: k < t.length - 1 } }));
      L.txt(s, runs, x + 0.14, ly + 0.5, lw - 0.28, 0.72, { fontSize: 11.5, fontFace: F.semi });
      L.txt(s, d, x + 0.14, ly + 1.22, lw - 0.28, 0.8, { fontSize: 11, color: C.text });
    });
    L.txt(s, 'In this appendix', 0.6, 5.12, 8, 0.3, { fontSize: 14, fontFace: F.semi, color: C.ink });
    const IN = [
      ['Paired and nonpaired regions', 'What pairing provides, what it doesn’t, and how region-of-choice designs shift responsibility for recovery.'],
      ['Storage, backup, and Key Vault', 'Paired-region and region-of-choice behavior for three services, and the recommended Key Vault pattern.'],
      ['Private DNS zones', 'Global and regional zones for multi-region private endpoints, failover, and policy.'],
      ['Resiliency scenarios', 'Three situations that show how service behavior changes a recovery design.'],
    ];
    IN.forEach(([t, d], i) => {
      const x = 0.6 + i * 3.08, y = 5.48, w = 2.89;
      L.box(s, x, y, w, 1.35, { fill: C.wash, r: 0.12 });
      L.txt(s, t, x + 0.2, y + 0.1, w - 0.4, 0.45, { fontSize: 12.5, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, d, x + 0.2, y + 0.58, w - 0.4, 0.7, { fontSize: 11, color: C.text });
    });
    s.addNotes('Region pairing is one input into resiliency design, not the definition of it, and cross-region behavior can differ significantly by service and regional combination. The pages that follow cover the dependencies that most often decide whether a regional combination works as built. Each of the five links opens the guidance on Microsoft Learn.');
  }

  // ───────────────────────── Paired and nonpaired regions (PDF p51)
  {
    const s = L.slide('appendix');
    L.header(s, '', 'Paired and nonpaired regions', { eyebrow: 'Appendix A · Region pairing', ec: C.s600, tw: 7.5, lede: 'Azure supports resilient architectures using paired regions, nonpaired regions, or both. The approach depends on workload requirements and the capabilities of the services involved.', lx: 8.4, lw: 4.33 });
    const P = [
      ['route', C.b600, 'F3F8FD', 'Azure paired regions', 'PLATFORM-ASSISTED REGIONAL RELATIONSHIP', [
        'Microsoft defines region pairs, usually within the same geography, with asymmetric and cross-geography exceptions.',
        'Some services use the pair for built-in geo-replication, such as GRS storage, Key Vault, and Backup Cross Region Restore.',
        'Pairs guide sequential platform updates and recovery prioritization.',
        'Deploying into both members of a pair does not automatically provide workload HA, DR, or failover.',
      ], 'Consider: built-in behavior can constrain the secondary region to the pair. Some paired regions have restricted access. Validate current service behavior before selecting a recovery architecture.'],
      ['pin', C.t600, C.t50, 'Nonpaired or region-of-choice designs', 'ARCHITECTURE-LED RECOVERY', [
        'Many newer regions are nonpaired and use availability zones as an important part of intra-region resiliency.',
        'Workloads can use a nonpaired or customer-selected secondary region where the services support it, through Azure or ISV-based DR.',
        'Flexibility for residency, sovereignty, latency, service availability, or business continuity.',
        'Recovery architecture, replication, dependencies, and failover must be designed and validated per workload.',
      ], 'Pairing can provide useful platform and service capabilities; it does not replace a tested workload recovery design.'],
    ];
    P.forEach(([ic, c, bg, t, k, bl, ft], i) => {
      const x = 0.6 + i * 6.12, y = 1.6, w = 6.0, h = 3.85;
      L.box(s, x, y, w, h, { fill: bg, r: 0.14 });
      L.badge(s, ic, x + 0.25, y + 0.18, 0.5, c);
      L.txt(s, t, x + 0.9, y + 0.18, w - 1.1, 0.5, { fontSize: 16, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, k, x + 0.25, y + 0.82, w - 0.5, 0.22, { fontSize: 10, bold: true, color: c, charSpacing: 1.5 });
      L.bullets(s, bl, x + 0.25, y + 1.1, w - 0.5, 1.85, { gap: 3 });
      L.box(s, x + 0.25, y + 2.98, w - 0.5, 0.008, { fill: C.line, r: 0 });
      L.txt(s, ft, x + 0.25, y + 3.06, w - 0.5, 0.7, { fontSize: 11, italic: true, color: C.muted });
    });
    L.box(s, 0.6, 5.58, 12.13, 1.27, { fill: C.wash, r: 0.12 });
    L.txt(s, 'WHAT TO RECORD DURING QUALIFICATION', 0.85, 5.66, 6, 0.22, { fontSize: 10, bold: true, color: C.b700, charSpacing: 1.5 });
    L.bullets(s, ['Whether each region is paired, with which region, and whether access to the pair is restricted.', 'For each service, whether its cross-region capability is tied to the pair or supports a region of choice.'], 0.85, 5.95, 5.6, 0.85, { gap: 2, indent: 12, opts: { color: C.ink } });
    L.bullets(s, ['Availability-zone support in each region.', 'The intended recovery region, and who validates the recovery path.'], 6.75, 5.95, 5.8, 0.85, { gap: 2, indent: 12, opts: { color: C.ink } });
    s.addNotes('Whether a particular regional combination works depends on the requirements of the workload and the capabilities of each service it uses. Microsoft Learn (Azure region pairs and nonpaired regions): “Deploying resources to a region in a pair doesn’t automatically make them more resilient, nor does it provide automatic high availability, disaster recovery capabilities, or failover.” Assess availability zones, region pairing, and service-specific cross-region behavior separately for each regional combination that workloads are expected to use.');
  }

  // ───────────────────────── Three services (PDF p52)
  {
    const s = L.slide('appendix');
    L.header(s, '', 'Storage, backup, and Key Vault across regions', { eyebrow: 'Appendix A · Three services that need special attention', ec: C.s600, tw: 8.4, lede: 'Regional qualification cannot stop at “the service exists in both regions.” Cross-region behavior differs by service and regional combination.', lx: 9.1, lw: 3.63 });
    const S = [
      ['data', 'Storage', ['GRS and GZRS replicate asynchronously to the service-defined secondary.', 'Evaluate built-in failover separately from workload recoverability.'], ['Object replication for block blobs only: not append or page blobs, not hierarchical namespace (Data Lake).', 'Requires change feed and versioning; at most two destination accounts.', 'Otherwise, application-level copy.'], 'Replicated data does not by itself make the workload recoverable.'],
      ['loop', 'Backup and restore', ['Cross Region Restore uses the paired region for supported data sources when configured.', 'Support differs by workload and configuration.'], ['Confirm which technologies and restore targets support the recovery region.', 'Azure Site Recovery supports VM DR between regions, subject to its support matrix.', 'Restricted-access regions can require approval.'], 'Demonstrate RTO and RPO through recovery testing, not configuration.'],
      ['lock', 'Key Vault', ['In most paired regions, contents replicate asynchronously to the pair.', 'Failover is Microsoft-initiated, best effort, and can be significantly delayed; read-only management afterward.'], ['Some paired regions and all nonpaired regions have no Microsoft-managed replication; see Reliability in Azure Key Vault.', 'Use separate regional vaults or another custom design; analyze keys, secrets, and certificates separately.', 'Managed HSM: optional two-region replication, for keys only.'], 'Often a runtime dependency: data can be recoverable while the app cannot start.'],
    ];
    S.forEach(([ic, t, pr, rc, tk], i) => {
      const x = 0.6 + i * 4.1, y = 1.6, w = 3.93, h = 5.25;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.box(s, x, y, w, 0.6, { fill: C.b50, r: 0.12 }); L.box(s, x, y + 0.35, w, 0.25, { fill: C.b50, r: 0 });
      L.badge(s, ic, x + 0.18, y + 0.1, 0.4, C.b600);
      L.txt(s, t, x + 0.7, y, w - 0.8, 0.6, { fontSize: 14, fontFace: F.semi, color: C.ink, valign: 'middle' });
      L.txt(s, 'PAIRED REGION', x + 0.2, y + 0.72, 2.5, 0.22, { fontSize: 10, bold: true, color: C.b600, charSpacing: 1.5 });
      L.bullets(s, pr, x + 0.2, y + 0.98, w - 0.4, 1.4, { gap: 3 });
      L.txt(s, 'REGION OF CHOICE', x + 0.2, y + 2.4, 2.5, 0.22, { fontSize: 10, bold: true, color: C.t600, charSpacing: 1.5 });
      if (i !== 2) {
        L.bullets(s, rc, x + 0.2, y + 2.66, w - 0.4, 1.7, { gap: 3 });
      } else {
        const link = 'Reliability in Azure Key Vault';
        L.txt(s, [
          { text: 'Some paired regions and all nonpaired regions have no Microsoft-managed replication; see ', options: { bullet: { indent: 14 }, paraSpaceAfter: 3 } },
          { text: link, options: { hyperlink: { url: 'https://learn.microsoft.com/azure/reliability/reliability-key-vault', tooltip: 'Open Reliability in Azure Key Vault' }, color: C.b600, bold: true, underline: { style: 'sng', color: C.b600 }, breakLine: true, paraSpaceAfter: 3 } },
          { text: 'Use separate regional vaults or another custom design; analyze keys, secrets, and certificates separately.', options: { bullet: { indent: 14 }, breakLine: true, paraSpaceAfter: 3 } },
          { text: 'Managed HSM: optional two-region replication, for keys only.', options: { bullet: { indent: 14 } } },
        ], x + 0.2, y + 2.66, w - 0.4, 1.7, { fontSize: 11, color: C.text });
      }
      L.box(s, x, y + h - 0.72, w, 0.72, { fill: C.wash, r: 0.12 }); L.box(s, x, y + h - 0.72, w, 0.25, { fill: C.wash, r: 0 });
      L.txt(s, tk, x + 0.2, y + h - 0.72, w - 0.4, 0.72, { fontSize: 11, bold: true, color: C.ink, valign: 'middle' });
    });
    s.addNotes('Service behavior differs by regional combination. Built-in replication for all three services targets the paired region; region-of-choice designs need explicit replication, restore, and secret-management patterns. Key Vault failover in most paired regions is Microsoft-initiated, best effort, and can occur only after significant delay. Managed HSM applies to keys, not ordinary secrets and certificates; not every region can be an extended region, and it has its own cost. Confirm current capabilities on Microsoft Learn at decision time.');
  }

  // ───────────────────────── Key Vault pattern (PDF p53)
  {
    const s = L.slide('appendix');
    L.header(s, '', 'Independent Key Vault per workload per region', { eyebrow: 'Appendix A · The recommended pattern', ec: C.s600, tw: 9 });
    L.txt(s, 'For controlled region-of-choice recovery, give each active or recovery region the Key Vault capability it needs before failover is required.', 0.6, 1.5, 6.0, 0.8, { fontSize: 13, fontFace: F.semi, color: C.ink });
    const B = [
      ['Independent regional vault', 'Each workload uses the vault in its local region, not a vault in another region at runtime.'],
      ['Deploy configuration consistently', 'IaC provisions vault configuration, access, private connectivity, monitoring, and policy. An approved secret-management process populates secrets and certificates; the IaC repository is not a store for secret values.'],
      ['Do not make failover the synchronization strategy', 'Populate and validate runtime dependencies before an outage, not by creating or restoring a vault after the primary region has failed.'],
      ['Design cryptographic keys separately', 'Choose a key-resiliency pattern: Key Vault backup/restore within its constraints, Managed HSM multi-region, or a workload-specific design.'],
    ];
    const rowH = 1.05;
    let by = 2.45;
    B.forEach(([t, d], i) => {
      L.box(s, 0.6, by - 0.06, 6.0, 0.008, { fill: C.soft, r: 0 });
      L.badge(s, 'check', 0.6, by + 0.08, 0.32, C.b600);
      L.txt(s, [{ text: t, options: { bold: true, color: C.ink, breakLine: true } }, { text: d, options: { color: C.muted } }], 1.05, by, 5.55, rowH - 0.08, { fontSize: 11, valign: 'top' });
      by += rowH;
    });
    L.box(s, 0.6, by - 0.06, 6.0, 0.008, { fill: C.soft, r: 0 });
    // diagram
    const X = 7.0, dy = 1.5, dh = 4.72;
    L.box(s, X, dy, 5.73, dh, { fill: 'FFFFFF', line: C.line, r: 0.14 });
    L.txt(s, 'Regional vaults populated before failover', X, dy + 0.1, 5.73, 0.3, { fontSize: 12.5, fontFace: F.semi, color: C.ink, align: 'center' });
    L.box(s, X + 1.5, dy + 0.5, 2.73, 0.66, { fill: C.b600, r: 0.33 });
    L.txt(s, [{ text: 'Approved deployment', options: { bold: true, fontSize: 11, breakLine: true } }, { text: 'IaC config + secret process', options: { fontSize: 10, color: C.b100 } }], X + 1.5, dy + 0.5, 2.73, 0.66, { color: 'FFFFFF', align: 'center', valign: 'middle' });
    [['Region A', 'workloads read only the local vault', ['App Svc', 'VMSS', 'SQL DB']], ['Region B', 'already populated and read-write', ['SQL DB', 'VMSS', 'App Svc']]].forEach(([r, n, apps], i) => {
      const x = X + 0.15 + i * 2.78, y = dy + 1.6, w = 2.65, h = 3.05;
      L.path(s, [[X + 2.865, dy + 1.16], [X + 2.865, dy + 1.38], [x + w / 2, dy + 1.38], [x + w / 2, y]], { color: C.b500 });
      L.box(s, x, y, w, h, { fill: 'F7FBFE', line: C.b300, dash: 'dash', r: 0.12 });
      L.icon(s, 'pin', x + 0.12, y + 0.1, 0.2, 'b'); L.txt(s, r, x + 0.38, y + 0.06, 1.5, 0.28, { fontSize: 11, bold: true, color: C.b700, valign: 'middle' });
      L.box(s, x + 0.2, y + 0.42, w - 0.4, 0.62, { fill: 'FFFFFF', line: C.b600, lw: 1.25, r: 0.1 });
      L.icon(s, 'lock', x + 0.3, y + 0.57, 0.32, 'b');
      L.txt(s, 'Regional\nKey Vault', x + 0.72, y + 0.42, 1.4, 0.62, { fontSize: 10.5, bold: true, color: C.b800, valign: 'middle' });
      L.txt(s, 'secrets / certificates', x, y + 1.08, w, 0.24, { fontSize: 10, color: C.muted, align: 'center', valign: 'middle' });
      apps.forEach((a, j) => {
        const ax = x + 0.12 + j * 0.83;
        L.line(s, x + w / 2, y + 1.34, ax + 0.36, y + 1.62, { color: C.b300, arrow: false });
        L.box(s, ax, y + 1.62, 0.76, 0.8, { fill: C.t50, line: C.t300, r: 0.1 });
        L.icon(s, a === 'SQL DB' ? 'data' : a === 'VMSS' ? 'layers' : 'app', ax + 0.23, y + 1.68, 0.3, 't');
        L.txt(s, a, ax, y + 2.07, 0.76, 0.3, { fontSize: 10, bold: true, color: C.t700, align: 'center', valign: 'middle' });
      });
      L.txt(s, n, x + 0.1, y + 2.5, w - 0.2, 0.5, { fontSize: 10, color: C.muted, align: 'center', valign: 'middle' });
    });
    L.caption(s, 'Figure', 'Pre-provisioned regional vaults. Applies to secrets and certificates. Design customer-managed keys (for example, SQL TDE) separately; see the customer-managed keys scenario.', X, dy + dh + 0.1, 5.73);
    s.addNotes('Applies to secrets and certificates. Design customer-managed keys (for example, SQL TDE) separately; see the customer-managed keys scenario in Resiliency scenarios. Microsoft Learn also documents backup and restore between vaults (Custom multi-region solutions for resiliency); backups can only be restored within the same subscription and Azure geography.');
  }

  require('./private-dns')(pres, L);

  // ───────────────────────── Resiliency scenarios (PDF p54)
  {
    const s = L.slide('appendix');
    L.header(s, '', 'Multi-region resiliency scenarios', { eyebrow: 'Appendix A · Resiliency scenarios', ec: C.s600, tw: 7, lede: 'How service-specific regional behavior changes workload recovery design. They complement the customer scenarios.', lx: 8.4, lw: 4.33 });
    const R = [
      ['A workload in a nonpaired region requires DR', [['Storage', 'Region-of-choice pattern such as object replication, or application-level replication.'], ['Compute', 'Azure Site Recovery for applicable VMs, or redeploy stateless compute from IaC.'], ['Key Vault', 'Pre-provision the regional vault; secrets, certificates, and key strategy ready before recovery.'], ['Backup', 'Place backup and restore deliberately for the recovery region.']], 'A nonpaired region can be part of a resilient design, but each layer needs an explicit recovery design.'],
      ['“We’re paired, so we have DR”', [['Symptom', 'Data is recoverable, but the application cannot operate in the secondary region.'], ['Possible causes', 'Key Vault or another runtime dependency unavailable; DNS or private endpoints incomplete; compute or shared services not recoverable.'], ['Correction', 'Treat data, identity, secrets and keys, DNS, networking, shared services, and compute as dependencies; validate end to end.']], 'Data recovery is not application recovery; pairing does not replace a tested plan.'],
      ['Customer-managed keys across two regions', [['Constraint', 'Key material cannot be assumed to be recreated by the pipeline.'], ['Options', 'Key Vault behavior for the regions; backup/restore within subscription and geography; Managed HSM multi-region; or a workload-specific design.'], ['Validate', 'Key availability, access, private connectivity, permissions, and app behavior in the secondary region.']], 'Key management can determine which recovery regions are viable.'],
    ];
    R.forEach(([t, rows, tk], i) => {
      const x = 0.6 + i * 4.1, y = 1.6, w = 3.93, h = 5.25;
      L.box(s, x, y, w, h, { fill: 'FFFFFF', line: C.line, r: 0.12 });
      L.box(s, x, y, w, 0.85, { fill: C.b50, r: 0.12 }); L.box(s, x, y + 0.5, w, 0.35, { fill: C.b50, r: 0 });
      L.txt(s, t, x + 0.2, y + 0.05, w - 0.4, 0.75, { fontSize: 13, fontFace: F.semi, color: C.ink, valign: 'middle' });
      let yy = y + 0.95;
      rows.forEach(([k, v], j) => {
        const nl = wrapLines(v, 46), hh = 0.42 + nl * 0.2;
        L.txt(s, k.toUpperCase(), x + 0.2, yy, w - 0.4, 0.22, { fontSize: 10, bold: true, color: C.b700, charSpacing: 1 });
        L.txt(s, v, x + 0.2, yy + 0.24, w - 0.4, nl * 0.2 + 0.08, { fontSize: 11, color: C.text });
        yy += hh;
        if (j < rows.length - 1) L.box(s, x + 0.2, yy - 0.06, w - 0.4, 0.006, { fill: C.soft, r: 0 });
      });
      L.box(s, x, y + h - 0.85, w, 0.85, { fill: C.s800, r: 0.12 }); L.box(s, x, y + h - 0.85, w, 0.3, { fill: C.s800, r: 0 });
      L.txt(s, [{ text: 'Takeaway. ', options: { bold: true, color: 'A6E7F5' } }, { text: tk }], x + 0.2, y + h - 0.85, w - 0.4, 0.85, { fontSize: 11, color: 'FFFFFF', valign: 'middle' });
    });
    s.addNotes('Representative situations, not drawn from a specific customer. In a nonpaired region, each workload layer needs its own recovery design. In the paired-region case the data is geo-replicated, but the complete application has never been failed over and tested. For customer-managed keys, key material has different recovery and replication characteristics from secrets and certificates. Confirm current service capabilities on Microsoft Learn at decision time.');
  }

  // ───────────────────────── Closing (PDF p57)
  {
    const s = L.slide('back', { bare: true });
    s.background = { path: IMG('bg_full.jpg', L.tone) };
    L.logo(s, 0.6, 0.6, 0.14, 'FFFFFF', 17);
    L.txt(s, 'Whitepaper briefing', 10.3, 0.57, 2.43, 0.35, { fontSize: 13, fontFace: F.semi, color: 'FFFFFF', align: 'right' });
    L.title(s, [{ text: 'The adaptable ', options: { fontFace: F.light } }, { text: 'multi-region', options: { fontFace: F.semi } }, { text: ' Azure platform', options: { fontFace: F.light } }], 0.6, 2.2, 7.2, 1.3, { fontSize: 34, color: 'FFFFFF', fontFace: F.light });
    L.txt(s, 'The complete framework, decision tools, and Microsoft Learn references are in the whitepaper on the website.', 0.6, 3.6, 6.6, 0.45, { fontSize: 14, color: C.b100 });
    // Links sit on white pills: PowerPoint colors hyperlinks with the theme link color, which needs a light background.
    const links = [['WEBSITE', 'azure.github.io/multi-region-platform', L.data.siteUrl, 4.08], ['PLANNING TOOL', 'Region planning workbook', L.data.workbookUrl, 4.66]];
    links.forEach(([lab, txt, url, y]) => {
      L.txt(s, lab, 0.6, y, 1.5, 0.46, { fontSize: 10, bold: true, color: C.b200, charSpacing: 2, valign: 'middle' });
      L.box(s, 2.25, y, 4.55, 0.46, { fill: 'FFFFFF', r: 0.23 });
      L.txt(s, [{ text: txt, options: { hyperlink: { url, tooltip: url }, color: C.b600, underline: { style: 'sng', color: C.b600 } } }], 2.25, y, 4.55, 0.46, { fontSize: 13, fontFace: F.semi, align: 'center', valign: 'middle' });
    });
    L.txt(s, L.brand + ' · ' + L.data.edition, 0.6, 5.84, 6.5, 0.22, { fontSize: 10.5, color: C.b100 });
    L.box(s, 0, 6.12, 13.333, 0.85, { fill: C.s800, r: 0 });
    L.txt(s, L.data.legal, 0.6, 6.26, 12.13, 0.56, { fontSize: 9, color: 'FFFFFF' });
  }
};
