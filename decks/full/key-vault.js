const path = require('path');
const { C, F } = require('../lib');

module.exports = (pres, L) => {
  const media = name => path.join(__dirname, '..', '..', 'content', 'media', 'key-vault-' + name + '.png');
  const reference = L.data.siteUrl + 'key-vault-across-regions.html';
  {
    const s = L.slide('services');
    L.header(s, '', 'Key Vault: choose the product first', { eyebrow: 'Service guides · Key Vault · 1 of 5', tw: 11.8 });
    const rows = [
      ['Product', 'Protection and contents', 'Regional behavior', 'SLA'],
      ['Key Vault Standard', 'Multi-tenant; software, FIPS 140 Level 1. Asymmetric keys, secrets, certificates.', 'Automatic zones in zone regions; same-geography paired replication where supported; Microsoft failover, read-only afterward.', '99.99%'],
      ['Key Vault Premium', 'Multi-tenant; HSM-backed keys, FIPS 140-3 Level 3. Asymmetric and symmetric keys (preview), secrets, certificates.', 'Same regional model as Standard. BYOK into supported HSM-backed keys.', '99.99%'],
      ['Managed HSM', 'Single-tenant, FIPS 140-3 Level 3. Asymmetric and symmetric keys.', 'Not zone-based; separate servers and racks. Replicate to one extended region, paired or not; both regions active.', '99.9% single region; 99.99% replicated'],
      ['Managed HSM + EKM', 'Asymmetric and symmetric keys stay in your HSM outside Microsoft. No secrets or certificates.', 'No geo-replication or failover target. Recovery depends on Managed HSM, proxy, HSM, or region.', 'No end-to-end SLA; Managed HSM service only'],
    ];
    s.addTable(rows.map((row, i) => row.map(text => ({ text, options: i ? {} : { bold: true, fill: C.b50, color: C.ink } }))), {
      x: 0.6, y: 1.5, w: 12.13, colW: [2, 3.7, 4.33, 2.1], rowH: [0.38, 0.94, 1.08, 0.94, 0.94],
      fontFace: F.body, fontSize: 11, color: C.text, margin: 0.1, border: { type: 'solid', pt: 0.75, color: C.soft }, autoPage: false,
    });
    L.txt(s, 'Paired failover: public endpoints in a few minutes; private endpoints up to +20 minutes. Read-only afterward.', 0.6, 5.92, 12.13, 0.3, { fontSize: 11, color: C.ink });
    L.txt(s, 'Check 3+0 (no pair), asymmetric 3+1, and cross-geography 3+1. Some pairs and all nonpaired regions lack this failover model.', 0.6, 6.3, 12.13, 0.4, { fontSize: 11, color: C.muted });
    s.addNotes('Key Vault is often a runtime dependency: data can be recoverable while the application cannot initialize without keys, secrets, or certificates. Most paired regions replicate asynchronously. Microsoft runs a tested failover; read-only until failover ends. Constraints: 3+0 (Qatar Central, Belgium Central, Spain Central); asymmetric 3+1 (West US 3 to East US); cross-geography 3+1 (Brazil South and South Central US). Current exceptions: https://learn.microsoft.com/azure/reliability/reliability-key-vault . ' + reference);
  }

  const groups = [
    {
      title: 'Secrets and certificates: two patterns',
      guidance: 'Use Standard or Premium. Roll out one region at a time; IaC is not a secret store. Fallback needs private-endpoint and identity design.',
      patterns: [
        ['1', 'Key Vault in each region', 'secrets-per-region',
          'Each vault; CI/CD and IaC load the same secrets and certificates.',
          'Full read and write in each region.',
          'Mission-critical; short recovery time.',
          'Keep vaults synchronized through the pipeline.'],
        ['2', 'Key Vault in a paired region', 'secrets-paired-region',
          'One vault; Microsoft replicates and fails it over.',
          'Read-only: no create, update, or rotation.',
          'Less critical; accepts Microsoft failover timing.',
          'Requires a same-geography pair, paired in both directions.'],
      ],
    },
    {
      title: 'Keys: vault-based patterns',
      guidance: 'Validate every consuming service. Standard does not support BYOK; check supported HSMs for Premium. Design keys separately from secrets.',
      patterns: [
        ['1', 'One Key Vault per region', 'keys-vault-per-region',
          'Standard or Premium; one vault per workload per region, with different keys.',
          'Full read and write on each local vault.',
          'Services can use separate regional keys.',
          'Geo-replicating services cannot use two vaults. Storage GRS uses one vault/key for both copies.'],
        ['2', 'Premium vault per region + BYOK', 'keys-byok-per-region',
          'Import the same key from your external HSM into each Premium vault.',
          'Full read and write on each local vault.',
          'Own and hold the master key or meet BYOK rules; control recovery time.',
          'Same service limits as pattern 1, plus cost.'],
      ],
    },
    {
      title: 'Keys: Managed HSM patterns',
      guidance: 'Enable replication; respect DNS TTL for Traffic Manager routing. EKM adds proxy/HSM round trips; recreate external key references, not backups.',
      patterns: [
        ['3', 'Managed HSM geo-replication', 'keys-managed-hsm-geo',
          'Managed HSM; replicate to one extended region.',
          'Read and write in the healthy region.',
          'Own/hold master key; mission-critical recovery.',
          'Cost; keys and roles replicate within 6 minutes. Last changes can be lost.'],
        ['4', 'Managed HSM replication + BYOK', 'keys-managed-hsm-geo-byok',
          'Import from your external HSM, then replicate.',
          'Read and write in the healthy region.',
          'Pattern 3, with your HSM as key origin.',
          'Cost and the same replication window as pattern 3.'],
        ['5', 'Managed HSM + EKM, no replication', 'keys-managed-hsm-ekm',
          'The key never leaves your own HSM.',
          'No failover target; wait for failing part to restore.',
          'Key must stay outside Microsoft.',
          'No end-to-end SLA. Proxy/HSM failures interrupt workloads and are excluded from their SLAs.'],
      ],
    },
  ];

  groups.forEach(({ title, guidance, patterns }, groupIndex) => {
    const s = L.slide('services');
    L.header(s, '', title, { eyebrow: `Service guides · Key Vault · ${groupIndex + 2} of 5`, tw: 11.8 });
    const width = (12.13 - 0.2 * (patterns.length - 1)) / patterns.length;
    patterns.forEach(([number, name, image, created, outage, best, limits], i) => {
      const x = 0.6 + i * (width + 0.2);
      L.box(s, x, 1.55, width, 4.78, { fill: C.wash });
      L.txt(s, number + ' · ' + name, x + 0.15, 1.7, width - 0.3, 0.4, { fontSize: 12.5, bold: true, color: C.ink });
      const text = `Created in: ${created}\nOutage: ${outage}\nBest for: ${best}\nWatch for: ${limits}`;
      L.txt(s, text, x + 0.15, 2.15, width - 0.3, 1.5, { fontSize: 11, color: C.text });
      const imageHeight = patterns.length === 2 ? 2.8 : 2.6;
      const imageWidth = imageHeight * 380 / 273;
      L.image(s, media(image), { x: x + (width - imageWidth) / 2, y: 6.3 - imageHeight, w: imageWidth, h: imageHeight }, name + ': deployment and recovery behavior.');
      s.addNotes(`Pattern ${number}: ${name}. ${text} ` + reference);
    });
    L.txt(s, guidance, 0.6, 6.5, 12.13, 0.4, { fontSize: 11, color: C.muted });
    if (groupIndex === 2) {
      s.addNotes('Managed HSM changes to keys, role definitions, and role assignments replicate asynchronously within 6 minutes. The last changes can be lost if the primary cannot be recovered. Both regions remain active. EKM recovery depends on Managed HSM, EKM proxy, customer HSM, or region; EKM does not support geo-replication. Managed HSM does not support backup and restore of external keys.');
    }
  });
  {
    const s = L.slide('services');
    L.header(s, '', 'Which Key Vault pattern fits?', { eyebrow: 'Service guides · Key Vault · 5 of 5', tw: 11.8 });
    const treeWidth = 4.95 * 940 / 492;
    L.image(s, media('decision-tree'), { x: (13.33 - treeWidth) / 2, y: 1.55, w: treeWidth, h: 4.95 }, 'Decision tree for secrets, certificates, and keys: recovery needs, regional pairing, external key ownership, and BYOK.');
    L.txt(s, 'Validate current service behavior, supported regions, consumer-service constraints, and recovery objectives before you commit.', 0.6, 6.55, 12.13, 0.3, { fontSize: 11, color: C.muted });
    s.addNotes('Secrets: full read-write in surviving region? Pattern 1. Otherwise same-geography bidirectional pair? Pattern 2; if not, pattern 1. Keys must stay outside Microsoft? Pattern 5. Otherwise mission-critical read-write recovery uses Managed HSM replication: pattern 3 or pattern 4 with BYOK. Other cases use regional vaults: pattern 1 or pattern 2 with BYOK. References: ' + reference);
  }
};
