const { C, F } = require('../lib');

module.exports = (pres, L) => {
  {
    const s = L.slide('pairing');
    L.header(s, '', 'Paired and nonpaired regions', { tw: 11.8 });
    const options = [
      ['Azure paired regions', C.b50, [
        'Microsoft defines region pairs, usually within a geography, with asymmetric and cross-geography exceptions.',
        'Some services use the pair for built-in geo-replication, such as GRS storage, Key Vault, and Backup Cross Region Restore.',
        'Pairs guide sequential platform updates and recovery prioritization.',
        'Using both regions does not automatically provide workload HA, DR, or failover.',
      ]],
      ['Nonpaired or region-of-choice designs', C.t50, [
        'Many newer regions are nonpaired and use availability zones for intra-region resiliency.',
        'Use a customer-selected secondary region only where each service supports it.',
        'Account for residency, sovereignty, latency, service availability, and business continuity.',
        'Design and validate replication, dependencies, and failover per workload.',
      ]],
    ];
    options.forEach(([title, fill, items], i) => {
      const x = 0.6 + i * 6.16;
      L.box(s, x, 1.6, 5.97, 4.2, { fill });
      L.badge(s, i ? 'pin' : 'route', x + 0.25, 1.85, 0.5, i ? C.t600 : C.b600);
      L.txt(s, title, x + 0.95, 1.82, 4.75, 0.85, { fontSize: 17, fontFace: F.semi });
      L.bullets(s, items, x + 0.3, 2.85, 5.3, 2.7, { gap: 10 });
    });
    L.decision(s, 'Record pairing, access restrictions, zone support, each service’s supported secondary region, and who validates the recovery path.', 0.6, 6.05, 12.13, 0.7);
    s.addNotes('Resources: Paired and nonpaired regions. Pairing can constrain service-defined replication targets. It is one input, not a recovery architecture. Validate the intended combination per service. https://learn.microsoft.com/azure/reliability/regions-paired');
  }
  {
    const s = L.slide('resiliency');
    L.header(s, '', 'Multi-region resiliency scenarios', { tw: 11.8 });
    const scenarios = [
      ['A nonpaired region requires DR', 'Each workload layer needs an explicit recovery design.', 'Use supported object or application-level replication, Azure Site Recovery for applicable VMs or IaC for stateless compute, pre-provisioned vault dependencies, and deliberate backup placement.'],
      ['“We’re paired, so we have DR”', 'Data recovery is not application recovery.', 'Validate keys, identity, DNS, private endpoints, networking, compute, and shared services together. Pairing does not replace an end-to-end recovery test against RTO and RPO.'],
      ['Customer-managed keys across two regions', 'Key management can determine viable recovery regions.', 'Key material is not assumed to be recreated by a pipeline. Evaluate regional vaults, BYOK, Managed HSM replication, or supported backup/restore; validate consumer-service constraints, access, and private connectivity.'],
    ];
    scenarios.forEach(([title, takeaway, body], i) => {
      const x = 0.6 + i * 4.1;
      L.box(s, x, 1.6, 3.93, 5.2, { fill: C.wash });
      L.num(s, i + 1, x + 0.25, 1.85, 0.45, C.b600, 'FFFFFF', 17);
      L.txt(s, title, x + 0.25, 2.55, 3.43, 0.95, { fontSize: 18, fontFace: F.semi });
      L.txt(s, body, x + 0.25, 3.65, 3.43, 1.95, { fontSize: 13 });
      L.txt(s, takeaway, x + 0.25, 5.95, 3.43, 0.65, { fontSize: 12, bold: true, color: C.b700 });
    });
    s.addNotes('Representative situations, not customer-specific recommendations. Confirm current service behavior in the service guides and Microsoft Learn before committing to a recovery design.');
  }
};
