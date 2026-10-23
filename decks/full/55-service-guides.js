const { C, F } = require('../lib');

module.exports = (pres, L) => {
  {
    const s = L.slide('services');
    L.header(s, '', L.data.serviceGuidesTitle, { tw: 11.8, lede: '' });
    L.txt(s, 'A multi-region platform creates qualified regional options. Whether a workload uses more than one region, and how, is a workload design decision.', 0.6, 1.6, 11.9, 0.65, { fontSize: 16 });
    const guides = [
      ['data', 'Storage', 'Paired-region replication and region-of-choice object replication.', 'storage-across-regions'],
      ['loop', 'Backup and restore', 'Cross Region Restore, Azure Site Recovery, and recovery testing.', 'restore-across-regions'],
      ['lock', 'Key Vault', 'Choose the product, then separate secrets and certificates from key patterns.', 'key-vault-across-regions'],
      ['network', 'Private DNS zones', 'Global and regional zone designs, private endpoints, failover, and policy.', 'private-dns-multi-region'],
    ];
    guides.forEach(([icon, title, body, article], i) => {
      const x = 0.6 + (i % 2) * 6.16, y = 2.55 + Math.floor(i / 2) * 1.6;
      L.box(s, x, y, 5.97, 1.4, { fill: C.wash });
      L.badge(s, icon, x + 0.2, y + 0.2, 0.48, C.b600);
      L.txt(s, [{ text: title, options: { hyperlink: { url: L.data.siteUrl + article + '.html' }, bold: true, color: C.b600 } }], x + 0.85, y + 0.18, 4.9, 0.35, { fontSize: 16 });
      L.txt(s, body, x + 0.85, y + 0.65, 4.85, 0.6, { fontSize: 12 });
    });
    L.txt(s, 'Workload architecture remains in the Azure Well-Architected Framework. Paired and nonpaired regions and Resiliency scenarios are in Resources.', 0.6, 6.1, 12.1, 0.6, { fontSize: 12, color: C.muted });
    s.addNotes('This section is not workload design guidance. The Azure Well-Architected Framework covers using availability zones and regions, redundancy, and mission-critical design. Service-specific regional behavior must be validated for the intended regional combination. Website reading order: Storage, Backup and restore, Key Vault, Private DNS zones. Region pairing and resiliency scenarios are Resources, not service guides.');
  }
  const services = [
    ['Storage across regions', 'data', [
      'GRS and GZRS replicate asynchronously to the service-defined secondary region.',
      'Evaluate built-in geo-redundancy and failover separately from workload recoverability.',
    ], [
      'Object replication supports block blobs between selected accounts and regions.',
      'Requires source change feed and versioning on both accounts.',
      'Not append blobs, page blobs, or hierarchical namespace accounts.',
      'At most two destination accounts per source.',
    ], 'Replicated data does not by itself make the workload recoverable. Validate the application recovery path end to end.', 'https://learn.microsoft.com/azure/storage/blobs/object-replication-overview'],
    ['Backup and restore across regions', 'loop', [
      'Cross Region Restore uses the paired region for supported data sources when vault replication and configuration are enabled.',
      'Support and behavior differ by workload and configuration.',
    ], [
      'Confirm supported technologies and restore targets for the intended recovery region.',
      'Azure Site Recovery supports Azure VM disaster recovery subject to its support matrix and regional restrictions.',
      'Restricted-access regions can require explicit access approval.',
    ], 'Demonstrate RTO and RPO through recovery testing, not configuration alone.', 'https://learn.microsoft.com/azure/site-recovery/azure-to-azure-support-matrix'],
  ];
  services.forEach(([title, icon, paired, choice, takeaway, url]) => {
    const s = L.slide('services');
    L.header(s, '', title, { tw: 11.8 });
    [[paired, 'Paired-region capabilities', C.b50], [choice, 'Region-of-choice capabilities', C.t50]].forEach(([items, label, fill], i) => {
      const x = 0.6 + i * 6.16;
      L.box(s, x, 1.6, 5.97, 4.2, { fill });
      L.badge(s, icon, x + 0.25, 1.85, 0.5, i ? C.t600 : C.b600);
      L.txt(s, label, x + 0.95, 1.9, 4.8, 0.45, { fontSize: 17, fontFace: F.semi });
      L.bullets(s, items, x + 0.3, 2.65, 5.3, 2.85, { gap: 14, size: 14 });
    });
    L.decision(s, takeaway, 0.6, 6.05, 12.13, 0.7);
    s.addNotes(title + '. ' + paired.join(' ') + ' ' + choice.join(' ') + ' ' + takeaway + ' Validate current service capabilities: ' + url);
  });
  require('./key-vault')(pres, L);
  require('./private-dns')(pres, L);
};
