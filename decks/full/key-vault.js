const path = require('path');
const fs = require('fs');
const { C, F } = require('../lib');

module.exports = (pres, L) => {
  const media = name => path.join(__dirname, '..', '..', 'content', 'media', 'key-vault-' + name + '.png');
  const imageRatio = name => {
    const png = fs.readFileSync(media(name));
    return png.readUInt32BE(16) / png.readUInt32BE(20);
  };
  const reference = L.data.siteUrl + 'key-vault-across-regions.html';
  const article = fs.readFileSync(path.join(__dirname, '..', '..', 'content', 'key-vault-across-regions.md'), 'utf8').replace(/\r\n/g, '\n');
  {
    const s = L.slide('services');
    L.header(s, '', 'Key Vault: regional behavior, then product', { eyebrow: 'Service guides · Key Vault', tw: 11.8 });
    L.txt(s, 'Paired: eligible vaults use Microsoft-managed recovery; initiation can take hours or longer. Nonpaired: design regional recovery explicitly.', 0.6, 1.42, 12.13, 0.45, { fontSize: 12, color: C.ink });
    const rows = [
      ['Product', 'Protection and contents', 'Regional behavior', 'SLA'],
      ['Key Vault Standard', 'Multi-tenant; software, FIPS 140 Level 1. Asymmetric keys, secrets, certificates.', 'Automatic zones in zone regions; same-geography paired replication where supported; Microsoft failover, read-only afterward.', '99.99%'],
      ['Key Vault Premium', 'Multi-tenant; HSM-backed keys, FIPS 140-3 Level 3. Asymmetric and symmetric keys (preview), secrets, certificates.', 'Same regional model as Standard. BYOK into supported HSM-backed keys.', '99.99%'],
      ['Managed HSM', 'Single-tenant, FIPS 140-3 Level 3. Asymmetric and symmetric keys.', 'Not zone-based; separate servers and racks. Replicate to one extended region, paired or not; both regions active.', '99.9% single region; 99.99% replicated'],
      ['Managed HSM + EKM', 'External key references. Physical key custody stays in your HSM outside Microsoft. No secrets or certificates.', 'No geo-replication or failover target. Recovery depends on Managed HSM, proxy, HSM, or region.', 'No end-to-end SLA'],
    ];
    s.addTable(rows.map((row, i) => row.map(text => ({ text, options: i ? {} : { bold: true, fill: C.b50, color: C.ink } }))), {
      x: 0.6, y: 2.0, w: 12.13, colW: [2, 3.7, 4.33, 2.1], rowH: [0.38, 0.84, 0.94, 0.84, 0.84],
      fontFace: F.body, fontSize: 11, color: C.text, margin: 0.1, border: { type: 'solid', pt: 0.75, color: C.soft }, autoPage: false,
    });
    L.txt(s, 'Once initiated, endpoint convergence takes minutes; Private Link can add 20 minutes. Read-only afterward. These are not total recovery times.', 0.6, 6.05, 12.13, 0.3, { fontSize: 11, color: C.ink });
    L.box(s, 0.6, 6.4, 12.13, 0.5, { fill: C.b50 });
    L.txt(s, 'Microsoft-managed failover is not supported for non-paired regions, regions with asymmetric pairing or paired regions across two different geographies.', 0.75, 6.46, 11.83, 0.35, { fontSize: 11, italic: true, color: C.ink });
    s.addNotes('Microsoft-managed failover is best effort. Initiation can take hours or longer after the outage; endpoint convergence is not the application RTO. Key Vault can be a runtime dependency even when data is recoverable. Microsoft-managed failover is not supported for non-paired regions, regions with asymmetric pairing or paired regions across two different geographies. Use independent vaults or supported Managed HSM replication. Regional eligibility: https://learn.microsoft.com/azure/reliability/reliability-key-vault#microsoft-managed-failover-to-a-paired-region . HSM cryptographic boundaries and backup/restore geography requirements: https://learn.microsoft.com/azure/key-vault/general/overview-security-worlds . ' + reference);
    s.addNotes(article.split('### Failover guidance\n')[1].split('\n## Choose the product')[0] + '\n' + reference + '#failover-guidance');
  }

  const groups = [
    {
      title: 'Secrets and certificates: two patterns',
      guidance: 'Use Standard or Premium vaults. Roll out one region at a time; IaC is not a secret store. Fallback needs private-endpoint and identity design.',
      patterns: [
        ['1', 'Standard or Premium vault in each region', 'secrets-per-region',
          'An approved pipeline loads each vault; IaC configures the resources.',
          'Full read and write in each region.',
          'Mission-critical; short recovery time.',
          'Keep vaults synchronized through the pipeline.'],
        ['2', 'Standard or Premium vault in a paired region', 'secrets-paired-region',
          'One vault; Microsoft replicates and fails it over.',
          'Read-only: no create, update, or rotation.',
          'Less critical; accepts Microsoft failover timing.',
          'Requires an eligible same-geography pair; check exclusions.'],
      ],
    },
    {
      title: 'Keys: Microsoft-managed paired-region replication',
      guidance: 'An eligible pair is required. Premium changes key protection, not regional recovery control. Validate the consuming service.',
      patterns: [
        ['1', 'Standard or Premium vault + paired-region copy', 'keys-paired-region',
          'Generate in the primary vault: Standard for software protection; Premium for HSM protection.',
          'Read-only after Microsoft-managed failover; no creation or rotation.',
          'Services accepting Microsoft-managed recovery timing; choose the tier for key protection.',
          'Best-effort failover can start hours after the outage. Premium does not improve recovery control.'],
      ],
    },
    {
      title: 'Keys: independent regional vaults',
      guidance: 'Standard supports software-key import. HSM-to-HSM BYOK transfer uses Premium or Managed HSM. Import does not establish service support.',
      patterns: [
        ['2', 'Standard or Premium vault in each region', 'keys-vault-per-region',
          'Standard or Premium; one vault per workload per region, with different keys.',
          'Full read and write on each local vault.',
          'Services can use separate regional keys.',
          'Services must support independent keys; a GRS account cannot use a separate vault/key per replica.'],
        ['3', 'Premium vault per region + BYOK', 'keys-byok-per-region',
          'Import the same key from your external HSM into each Premium vault.',
          'Full read and write on each local vault.',
          'Own and hold the master key or meet BYOK rules; control recovery time.',
          'Same service limits as Pattern 2, plus coordinated import and rotation.'],
      ],
    },
    {
      title: 'Keys: Managed HSM patterns',
      guidance: 'Enable replication; respect DNS TTL for Traffic Manager routing. EKM adds proxy/HSM round trips; recreate external key references, not backups.',
      patterns: [
        ['4', 'Managed HSM geo-replication', 'keys-managed-hsm-geo',
          'Managed HSM; replicate to one extended region.',
          'Read and write in the healthy region.',
          'Supported shared-key dependencies; choose an extended region.',
          'Cost; keys and roles replicate within 6 minutes. Last changes can be lost.'],
        ['5', 'Managed HSM replication + BYOK', 'keys-managed-hsm-geo-byok',
          'Import from your external HSM, then replicate.',
          'Read and write in the healthy region.',
          'Pattern 4, with a customer-owned external HSM as origin.',
          'Cost, import lifecycle, and the same replication window as Pattern 4.'],
        ['6', 'Managed HSM + EKM, no replication', 'keys-managed-hsm-ekm',
          'The key never leaves your own HSM.',
          'No failover target; wait for failing part to restore.',
          'Key must stay outside Microsoft.',
          'No end-to-end SLA or Secure Key Release. Verify each integration and external dependency.'],
      ],
    },
  ];

  groups.forEach(({ title, guidance, patterns }, groupIndex) => {
    const s = L.slide('services');
    L.header(s, '', title, { eyebrow: 'Service guides · Key Vault', tw: 11.8 });
    const width = (12.13 - 0.2 * (patterns.length - 1)) / patterns.length;
    patterns.forEach(([number, name, image, created, outage, best, limits], i) => {
      const x = 0.6 + i * (width + 0.2);
      L.box(s, x, 1.55, width, 4.78, { fill: C.wash });
      L.txt(s, 'Pattern ' + number + ' · ' + name, x + 0.15, 1.7, width - 0.3, 0.4, { fontSize: 12.5, bold: true, color: C.ink });
      const text = `Created in: ${created}\nOutage: ${outage}\nBest for: ${best}\nWatch for: ${limits}`;
      L.txt(s, text, x + 0.15, 2.15, width - 0.3, 1.5, { fontSize: 11, color: C.text });
      const imageHeight = 2.45;
      const imageWidth = imageHeight * imageRatio(image);
      L.image(s, media(image), { x: x + (width - imageWidth) / 2, y: 6.3 - imageHeight, w: imageWidth, h: imageHeight }, name + ': deployment and recovery behavior.');
      s.addNotes(`Pattern ${number}: ${name}. ${text} ` + reference);
    });
    L.txt(s, guidance, 0.6, 6.5, 12.13, 0.4, { fontSize: 11, color: C.muted });
    if (groupIndex === 3) {
      s.addNotes('Managed HSM changes to keys, role definitions, and role assignments replicate asynchronously within 6 minutes. The last changes can be lost if the primary cannot be recovered. Both regions remain active. EKM recovery depends on Managed HSM, EKM proxy, customer HSM, or region; EKM does not support geo-replication. Managed HSM does not support backup and restore of external keys.');
    }
  });
  const scenarioSection = article.split('## Common key-management scenarios\n')[1].split('\n## Decision tree')[0];
  const scenarios = scenarioSection.split('\n### ').slice(1).map(section => {
    const [title, ...lines] = section.split('\n');
    const body = lines.join('\n').trim();
    const summary = body.split('\n\n').filter(block => block.startsWith('**') || block.startsWith('- ')).join('\n\n');
    return { title: title.replace(/ \{#[^}]+\}$/, ''), body, summary };
  });
  const linkedText = text => {
    const runs = [];
    for (const line of text.split('\n').filter(line => line.trim())) {
      const paragraph = line.replace(/^- /, '').replace(/\*\*/g, '');
      let start = 0;
      for (const match of paragraph.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
        if (match.index > start) runs.push({ text: paragraph.slice(start, match.index) });
        runs.push({ text: match[1], options: { color: C.b600, hyperlink: { url: match[2].startsWith('#') ? reference + match[2] : match[2] } } });
        start = match.index + match[0].length;
      }
      if (start < paragraph.length) runs.push({ text: paragraph.slice(start) });
      runs[runs.length - 1].options = { ...runs[runs.length - 1].options, breakLine: true };
    }
    return runs;
  };
  for (let offset = 0; offset < scenarios.length; offset += 3) {
    const s = L.slide('services');
    L.header(s, '', `Common key-management scenarios (${offset / 3 + 1} of 3)`, { eyebrow: 'Service guides · Key Vault · Keys patterns', tw: 11.8 });
    scenarios.slice(offset, offset + 3).forEach(({ title, summary }, i) => {
      const x = 0.6 + i * 4.11;
      L.box(s, x, 1.5, 3.91, 5.2, { fill: C.wash });
      const longTitle = title.length > 60;
      L.txt(s, title, x + 0.16, 1.67, 3.59, longTitle ? 0.95 : 0.55, { fontSize: 14, bold: true, color: C.ink });
      L.txt(s, linkedText(summary), x + 0.16, longTitle ? 2.7 : 2.3, 3.59, longTitle ? 3.8 : 4.2, { fontSize: 11, color: C.text, paraSpaceAfter: 6 });
    });
    L.txt(s, 'Select a linked pattern name for deployment details. Conditional options require feature-specific validation; full caveats are in the guide and notes.', 0.6, 6.85, 12.13, 0.2, { fontSize: 10.5, color: C.muted });
    s.addNotes(scenarios.slice(offset, offset + 3).map(({ title, body }) => title + '\n' + body).join('\n\n').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') + '\n' + reference);
  }
  {
    const s = L.slide('services');
    L.header(s, '', 'Which Key Vault pattern fits?', { eyebrow: 'Service guides · Key Vault', tw: 11.8 });
    const treeWidth = 4.95 * imageRatio('decision-tree');
    L.image(s, media('decision-tree'), { x: (13.33 - treeWidth) / 2, y: 1.55, w: treeWidth, h: 4.95 }, 'Decision tree for secrets, certificates, and keys: recovery needs, regional pairing, external key ownership, and BYOK.');
    L.txt(s, 'Validate current service behavior, supported regions, consumer-service constraints, and recovery objectives before you commit.', 0.6, 6.55, 12.13, 0.3, { fontSize: 11, color: C.muted });
    s.addNotes('Secrets and certificates: Standard or Premium vault in each region for independent regional read-write needs; Standard or Premium vault in a paired region for eligible same-geography read-only recovery. Keys: Managed HSM with external key management for external custody; Managed HSM with geo-replication or Managed HSM geo-replication with external HSM and BYOK for a shared replicated store; Standard or Premium vault in each region or Premium vault per region with external HSM and BYOK for supported independent vaults; Standard or Premium vault with paired-region replication for eligible Microsoft-managed recovery. No matching candidate: revisit design. Validate consuming-service support first. ' + reference);
  }
};
