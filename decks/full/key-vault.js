const path = require('path');
const { C, F } = require('../lib');

module.exports = (pres, L) => {
  const media = name => path.join(__dirname, '..', '..', 'content', 'media', 'key-vault-' + name + '.png');
  {
    const s = L.slide('services');
    L.header(s, '', 'Key Vault: choose the product first', { eyebrow: 'Service guides · Key Vault', tw: 11.8 });
    const rows = [
      ['Product', 'Protection and contents', 'Regional behavior', 'SLA'],
      ['Key Vault Standard', 'Multi-tenant; software, FIPS 140 Level 1. Asymmetric keys, secrets, certificates.', 'Automatic zones where supported; paired-region replication where supported; Microsoft failover, read-only afterward.', '99.99%'],
      ['Key Vault Premium', 'Multi-tenant; HSM-backed keys, FIPS 140-3 Level 3. Asymmetric and symmetric keys (preview), secrets, certificates.', 'Same regional model as Standard. BYOK into supported HSM-backed keys.', '99.99%'],
      ['Managed HSM', 'Single-tenant, FIPS 140-3 Level 3. Asymmetric and symmetric keys only.', 'Not zone-based. Optional replication to one extended region; both regions active.', '99.9% single region; 99.99% replicated'],
      ['Managed HSM + EKM', 'The key stays in your HSM outside Microsoft. No secrets or certificates.', 'No geo-replication or failover target. Recovery depends on Managed HSM, proxy, external HSM, and region.', 'No end-to-end SLA'],
    ];
    s.addTable(rows.map((row, i) => row.map(text => ({ text, options: i ? {} : { bold: true, fill: C.b50, color: C.ink } }))), {
      x: 0.6, y: 1.6, w: 12.13, colW: [2, 3.7, 4.33, 2.1], rowH: [0.4, 1.0, 1.15, 1.0, 1.0],
      fontFace: F.body, fontSize: 12, color: C.text, margin: 0.12, border: { type: 'solid', pt: 0.75, color: C.soft }, autoPage: false,
    });
    L.decision(s, 'Treat Key Vault as a runtime dependency. Design key recovery separately from secrets and certificates.', 0.6, 6.2, 12.13, 0.65);
    s.addNotes('Follow the website product comparison. Most paired regions replicate vault contents asynchronously. Microsoft runs tested failover: public endpoints fail over in a few minutes; private endpoints take up to an additional 20 minutes. Some pairs and all nonpaired regions do not use that model. Constraints include 3+0 (no pair), asymmetric 3+1 (West US 3 to East US), and cross-geography 3+1 (Brazil South and South Central US). Validate current behavior: https://learn.microsoft.com/azure/reliability/reliability-key-vault');
  }
  const patterns = [
    ['Secrets and certificates · Pattern 1', 'Key Vault in each region', 'secrets-per-region',
      'CI/CD and IaC load the same secrets and certificates into each regional vault.',
      'Full read and write in each region; suitable for mission-critical workloads with short recovery times.',
      'Keep vaults synchronized. Roll changes out one region at a time. The IaC repository is not a secret store. App-level fallback needs explicit identity and private-endpoint design.'],
    ['Secrets and certificates · Pattern 2', 'Key Vault in a paired region', 'secrets-paired-region',
      'One vault, replicated and failed over by Microsoft.',
      'Read-only until failover ends: no create, update, or rotation.',
      'For workloads that accept Microsoft’s failover timing and read-only access. Requires a pair in the same geography, paired in both directions. Managed HSM and EKM do not hold secrets or certificates.'],
    ['Keys · Pattern 1', 'One Key Vault per region', 'keys-vault-per-region',
      'A separate key in each regional Standard or Premium vault, per workload.',
      'Each region retains full read and write on its own vault.',
      'Every consuming service must support separate regional keys. Storage GRS uses one key from one vault for both copies, so a vault outage affects both.'],
    ['Keys · Pattern 2', 'Premium vaults with an external HSM', 'keys-byok-per-region',
      'Import the key from your external HSM (BYOK) into a Premium vault in each region.',
      'Each region retains full read and write on its own vault.',
      'For key ownership or BYOK requirements and customer-controlled recovery. Same service constraints as pattern 1, plus cost. Standard does not support BYOK.'],
    ['Keys · Pattern 3', 'Managed HSM with geo-replication', 'keys-managed-hsm-geo',
      'Create keys in Managed HSM and replicate to one extended region.',
      'Both regions remain active; reads and writes continue in the healthy region.',
      'For mission-critical key dependencies and customer-controlled recovery. Changes to keys, roles, and permissions replicate asynchronously within 6 minutes; the latest changes may be lost if the primary cannot be recovered.'],
    ['Keys · Pattern 4', 'Managed HSM geo-replication with BYOK', 'keys-managed-hsm-geo-byok',
      'Import from your external HSM, then replicate to the extended region.',
      'Both regions remain active for reads and writes.',
      'Same recovery model, cost considerations, and replication window as pattern 3, with your HSM as the key origin. Traffic Manager routes to the closest healthy region; respect DNS TTL.'],
    ['Keys · Pattern 5', 'Managed HSM without geo-replication + EKM', 'keys-managed-hsm-ekm',
      'The key never leaves your external HSM.',
      'No failover target. Recovery depends on the failing component; wait for restore.',
      'No end-to-end SLA and no geo-replication. Each key operation adds round trips to your proxy and HSM. External keys do not support backup/restore: recreate the external key reference.'],
  ];
  patterns.forEach(([eyebrow, title, image, created, outage, limits]) => {
    const s = L.slide('services');
    L.header(s, '', title, { eyebrow: 'Service guides · Key Vault · ' + eyebrow, tw: 11.8 });
    [['Created in', created], ['During an outage', outage], ['Watch for', limits]].forEach(([label, text], i) => {
      const y = 1.65 + i * 1.6;
      L.box(s, 0.6, y, 5.2, 1.4, { fill: i === 2 ? C.w50 : C.wash });
      L.txt(s, label.toUpperCase(), 0.85, y + 0.15, 4.7, 0.25, { fontSize: 10, bold: true, color: C.b700, charSpacing: 1 });
      L.txt(s, text, 0.85, y + 0.5, 4.7, 0.8, { fontSize: 12 });
    });
    L.image(s, media(image), { x: 6.15, y: 1.65, w: 6.58, h: 5.1 }, title + ': regional deployment and recovery behavior.');
    s.addNotes(eyebrow + '. ' + created + ' ' + outage + ' ' + limits + ' Validate consuming-service support before committing. ' + L.data.siteUrl + 'key-vault-across-regions.html');
  });
  {
    const s = L.slide('services');
    L.header(s, '', 'Which Key Vault pattern fits?', { eyebrow: 'Service guides · Key Vault · Decision tree', tw: 11.8 });
    L.image(s, media('decision-tree'), { x: 0.6, y: 1.55, w: 12.13, h: 4.95 }, 'Decision tree separates secrets and certificates from keys, then checks read-write recovery needs, regional pairing, external key ownership, and BYOK.');
    L.txt(s, 'Validate current service behavior, supported regions, consumer-service constraints, and recovery objectives before you commit.', 0.6, 6.55, 12.13, 0.3, { fontSize: 11, color: C.muted });
    s.addNotes('Secrets: need full read-write in the surviving region? Pattern 1. Otherwise, if a same-geography, bidirectional pair exists, pattern 2; if not, pattern 1. Keys: must stay outside Microsoft? Pattern 5 (EKM). Otherwise mission-critical read-write recovery uses Managed HSM replication, pattern 3 or pattern 4 with BYOK. Other cases use a vault per region, pattern 1 or pattern 2 with BYOK. Validate service support independently.');
  }
};
