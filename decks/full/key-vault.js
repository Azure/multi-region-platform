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
    L.txt(s, 'Standard/Premium: keep the vault URI; Microsoft reroutes requests. Best-effort failover can take hours or longer, independently of other services.', 0.6, 1.42, 12.13, 0.45, { fontSize: 12, color: C.ink });
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
    L.txt(s, 'Once initiated, public routing is designed to take minutes; private endpoints can add 20 more. These are not total outage durations.', 0.6, 6.05, 12.13, 0.3, { fontSize: 11, color: C.ink });
    L.box(s, 0.6, 6.4, 12.13, 0.5, { fill: C.b50 });
    L.txt(s, 'Microsoft-managed failover is not supported for non-paired regions, regions with asymmetric pairing or paired regions across two different geographies.', 0.75, 6.46, 11.83, 0.35, { fontSize: 11, italic: true, color: C.ink });
    s.addNotes('Microsoft-managed failover is best effort. Initiation can take hours or longer after the outage; endpoint convergence is not the application RTO. Key Vault can be a runtime dependency even when data is recoverable. Microsoft-managed failover is not supported for non-paired regions, regions with asymmetric pairing or paired regions across two different geographies. Use independent vaults or supported Managed HSM replication. Regional eligibility: https://learn.microsoft.com/azure/reliability/reliability-key-vault#microsoft-managed-failover-to-a-paired-region . HSM cryptographic boundaries and backup/restore geography requirements: https://learn.microsoft.com/azure/key-vault/general/overview-security-worlds . ' + reference);
    s.addNotes('Managed HSM regional resiliency and replication: https://learn.microsoft.com/azure/reliability/reliability-managed-hsm');
    const failoverHeading = '## Microsoft-managed failover\n';
    s.addNotes(failoverHeading + article.split(failoverHeading)[1].split('\n## Secrets and certificates scenarios')[0] + '\n' + reference + '#failover-guidance');
  }

  const groups = [
    {
      title: 'Secrets and certificates: two patterns',
      guidance: 'Use regional vaults for customer-managed recovery, or an eligible paired-region vault if Microsoft-managed recovery timing and read-only access are acceptable.',
      patterns: [
        ['1', 'Standard or Premium vault in each region', 'secrets-per-region',
          'An approved pipeline loads each vault; IaC configures the resources.',
          'Full read and write in each region.',
          'Mission-critical; short recovery time.',
          'Keep vaults synchronized through the pipeline.'],
        ['2', 'Standard or Premium vault in a paired region', 'secrets-paired-region',
          'Pipeline populates the primary vault; Microsoft asynchronously replicates.',
          'Read-only after Microsoft-managed failover; no create, update, renewal, or rotation.',
          'Workloads accepting Microsoft-managed recovery timing and read-only access.',
          'Eligible same-geography pair and service exclusions; best-effort failover can take hours or longer.'],
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
      guidance: 'Replication required; extended-region support varies, with no pairing requirement. DNS TTL: 5 seconds; caching can delay failover. EKM failover is unsupported.',
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
      s.addNotes('With multiregion replication configured, reads and writes remain available if either region fails. Any Managed HSM region can be primary; extended-region support varies and does not depend on region pairings. DNS routes to the closest available region with a 5-second TTL; client caching can delay failover. Key, role definition, and role assignment changes can take up to 6 minutes to replicate; cross-region consistency is not guaranteed during this window. Microsoft-managed regional failover is unsupported without replication, with an unsupported extended region, or with external keys (EKM). EKM recovery depends on Managed HSM, EKM proxy, customer HSM, or region; Managed HSM does not support backup and restore of external keys. https://learn.microsoft.com/azure/key-vault/managed-hsm/multi-region-replication');
    }
  });
  const scenarioSections = [
    article.split('## Single KEK (key encryption key) scenarios\n')[1].split('\n## Dual KEK (key encryption key) scenarios')[0],
    article.split('## Dual KEK (key encryption key) scenarios\n')[1].split('\n## Secrets and certificates patterns')[0],
  ];
  const tablePatternSummary = text => text.split('\n').filter(line => line.startsWith('| [')).map(line => {
    const [, pattern, , recovery] = line.split('|').map(cell => cell.trim());
    return '- ' + pattern + ': ' + recovery;
  });
  const sharedPatternSummaries = scenarioSections.map(section =>
    tablePatternSummary(section.split('\n### ')[0].split('**Patterns you can use:**')[1]));
  const scenarios = scenarioSections.flatMap((section, sectionIndex) => section.split('\n### ').slice(1).map(scenario => {
    const [heading, ...lines] = scenario.split('\n');
    const title = heading.replace(/ \{#[^}]+\}$/, '');
    const body = lines.join('\n').trim();
    const localPatternIds = Array.from(body.matchAll(/\]\((#keys-pattern-\d)\)/g), match => match[1]);
    const patterns = sharedPatternSummaries[sectionIndex].filter(pattern =>
      localPatternIds.length === 0 || localPatternIds.some(id => pattern.includes('(' + id + ')')));
    if (patterns.length === 0) throw new Error('No key patterns found for ' + title);
    const summary = '**Patterns you can use:**\n\n' + patterns.join('\n');
    return { title, body: body + '\n\n' + summary, summary };
  })).filter((scenario, index, scenarios) => scenarios.findIndex(other => other.title === scenario.title) === index);
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
    L.header(s, '', `Key-management scenarios (${offset / 3 + 1} of 3)`, { eyebrow: 'Service guides · Key Vault · Keys patterns', tw: 11.8 });
    scenarios.slice(offset, offset + 3).forEach(({ title, summary }, i) => {
      const x = 0.6 + i * 4.11;
      L.box(s, x, 1.5, 3.91, 5.2, { fill: C.wash });
      const longTitle = title.length > 60;
      const detailed = title === 'Purview Information Protection';
      L.txt(s, title, x + 0.16, 1.67, 3.59, longTitle ? 0.95 : 0.55, { fontSize: 14, bold: true, color: C.ink });
      L.txt(s, linkedText(summary), x + 0.16, longTitle ? 2.7 : 2.3, 3.59, longTitle ? 3.8 : 4.2, { fontSize: detailed ? 10 : 11, color: C.text, paraSpaceAfter: detailed ? 4 : 6 });
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
    s.addNotes('Secrets and certificates: Standard or Premium vault in each region for customer-managed application failover, or Standard or Premium vault in a paired region when eligible and Microsoft-managed recovery timing and read-only access are acceptable. Keys: Managed HSM with external key management for external custody; Managed HSM with geo-replication or Managed HSM geo-replication with external HSM and BYOK for a shared replicated store; Standard or Premium vault in each region or Premium vault per region with external HSM and BYOK for supported independent vaults; Standard or Premium vault with paired-region replication for eligible Microsoft-managed recovery. No matching candidate: revisit design. Validate consuming-service support first. ' + reference);
  }
};
