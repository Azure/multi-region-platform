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
    L.txt(s, 'Check 3+0 (no pair), asymmetric 3+1, and cross-geography 3+1. Some pairs and all nonpaired regions lack this failover model.', 0.6, 6.3, 12.13, 0.4, { fontSize: 11, color: C.muted });
    s.addNotes('Microsoft-managed failover is best effort. Initiation can take hours or longer after the outage; endpoint convergence is not the application RTO. Key Vault can be a runtime dependency even when data is recoverable. Constraints: no pair, asymmetric pairing, and cross-geography pairing. Exclusions include Brazil South, Brazil Southeast, West US 3, and nonpaired regions. https://learn.microsoft.com/azure/reliability/reliability-key-vault . ' + reference);
  }

  const groups = [
    {
      title: 'Secrets and certificates: two patterns',
      guidance: 'Use Standard or Premium. Roll out one region at a time; IaC is not a secret store. Fallback needs private-endpoint and identity design.',
      patterns: [
        ['1', 'Key Vault in each region', 'secrets-per-region',
          'An approved pipeline loads each vault; IaC configures the resources.',
          'Full read and write in each region.',
          'Mission-critical; short recovery time.',
          'Keep vaults synchronized through the pipeline.'],
        ['2', 'Key Vault in a paired region', 'secrets-paired-region',
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
        ['1', 'Standard vault + paired-region copy', 'keys-standard-paired-region',
          'Software-protected key generated in the primary Standard vault.',
          'Read-only after Microsoft-managed failover; no creation or rotation.',
          'Software protection; accepts Microsoft-managed recovery timing.',
          'Failover is best effort and can start hours after the outage.'],
        ['2', 'Premium vault + paired-region copy', 'keys-premium-paired-region',
          'HSM-protected key generated in the primary Premium vault.',
          'Read-only after Microsoft-managed failover; no creation or rotation.',
          'HSM protection; accepts Microsoft-managed recovery timing.',
          'Same regional recovery model as Standard.'],
      ],
    },
    {
      title: 'Keys: independent regional vaults',
      guidance: 'Standard supports software-key import. HSM-to-HSM BYOK transfer uses Premium or Managed HSM. Import does not establish service support.',
      patterns: [
        ['3', 'One Key Vault per region', 'keys-vault-per-region',
          'Standard or Premium; one vault per workload per region, with different keys.',
          'Full read and write on each local vault.',
          'Services can use separate regional keys.',
          'Services must support independent keys; a GRS account cannot use a separate vault/key per replica.'],
        ['4', 'Premium vault per region + BYOK', 'keys-byok-per-region',
          'Import the same key from your external HSM into each Premium vault.',
          'Full read and write on each local vault.',
          'Own and hold the master key or meet BYOK rules; control recovery time.',
          'Same service limits as Pattern 3, plus coordinated import and rotation.'],
      ],
    },
    {
      title: 'Keys: Managed HSM patterns',
      guidance: 'Enable replication; respect DNS TTL for Traffic Manager routing. EKM adds proxy/HSM round trips; recreate external key references, not backups.',
      patterns: [
        ['5', 'Managed HSM geo-replication', 'keys-managed-hsm-geo',
          'Managed HSM; replicate to one extended region.',
          'Read and write in the healthy region.',
          'Supported shared-key dependencies; choose an extended region.',
          'Cost; keys and roles replicate within 6 minutes. Last changes can be lost.'],
        ['6', 'Managed HSM replication + BYOK', 'keys-managed-hsm-geo-byok',
          'Import from your external HSM, then replicate.',
          'Read and write in the healthy region.',
          'Pattern 5, with a customer-owned external HSM as origin.',
          'Cost, import lifecycle, and the same replication window as Pattern 5.'],
        ['7', 'Managed HSM + EKM, no replication', 'keys-managed-hsm-ekm',
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
  const matrix = scenarioSection.split('\n').filter(line => line.startsWith('|'));
  const plain = text => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/<br>/g, '\n').trim();
  const headers = matrix[0].split('|').slice(1, -1).map(plain);
  const matrixRows = matrix.slice(2).map(line => line.split('|').slice(1, -1).map(plain));
  for (let offset = 0; offset < matrixRows.length; offset += 3) {
    const s = L.slide('services');
    L.header(s, '', `Common key-management scenarios (${offset / 3 + 1} of 3)`, { eyebrow: 'Service guides · Key Vault · Keys patterns', tw: 11.8 });
    const rows = [headers, ...matrixRows.slice(offset, offset + 3)];
    s.addTable(rows.map((row, i) => row.map(text => ({ text, options: i ? {} : { bold: true, fill: C.b50, color: C.ink } }))), {
      x: 0.6, y: 1.5, w: 12.13, colW: [2.05, 1.44, 1.44, 1.44, 1.44, 1.44, 1.44, 1.44],
      rowH: [0.75, 1.42, 1.42, 1.42], fontFace: F.body, fontSize: 10.5, color: C.text, margin: 0.08,
      border: { type: 'solid', pt: 0.75, color: C.soft }, autoPage: false,
    });
    L.txt(s, 'Conditional: validate the exact feature, topology, and key operations. See the guide and speaker notes for details and references.', 0.6, 6.85, 12.13, 0.2, { fontSize: 10.5, color: C.muted });
    s.addNotes(scenarioSection.slice(scenarioSection.indexOf('### Application-level encryption')).replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') + '\n' + reference);
  }
  {
    const s = L.slide('services');
    L.header(s, '', 'Which Key Vault pattern fits?', { eyebrow: 'Service guides · Key Vault', tw: 11.8 });
    const treeWidth = 4.95 * imageRatio('decision-tree');
    L.image(s, media('decision-tree'), { x: (13.33 - treeWidth) / 2, y: 1.55, w: treeWidth, h: 4.95 }, 'Decision tree for secrets, certificates, and keys: recovery needs, regional pairing, external key ownership, and BYOK.');
    L.txt(s, 'Validate current service behavior, supported regions, consumer-service constraints, and recovery objectives before you commit.', 0.6, 6.55, 12.13, 0.3, { fontSize: 11, color: C.muted });
    s.addNotes('Secrets and certificates - Pattern 1: independent regional read-write needs. Pattern 2: eligible same-geography paired recovery, accepting timing and read-only access. Keys - Pattern 7: external custody; Pattern 5 or 6 with BYOK: shared replicated store; Pattern 3 or 4 with BYOK: supported independent vaults; Pattern 1 or 2 for HSM protection: eligible paired recovery. No matching candidate: revisit design. Validate consuming-service support first. ' + reference);
  }
};
