const path = require('path');
const { C, F } = require('../lib');

module.exports = (pres, L) => {
  const media = name => path.join(__dirname, '..', '..', 'content', 'media', name + '.png');
  const header = (s, title) => L.header(s, '', title, { eyebrow: 'Appendix A · Private DNS zones', ec: C.s600, tw: 11.8 });
  const tableOptions = {
    x: 0.6, y: 1.6, w: 12.13, fontFace: F.body, fontSize: 11, color: C.text,
    margin: [0.1, 0.14, 0.1, 0.14], border: { type: 'solid', pt: 0.75, color: C.soft },
    valign: 'middle', autoPage: false,
  };
  const heading = text => ({ text, options: { bold: true, fill: C.b50, color: C.ink } });

  {
    const s = L.slide('appendix');
    header(s, 'Private DNS zones for multi-region private endpoints');
    L.txt(s, 'Private DNS zones are global resources. Adding a region does not require new zones; most workloads can keep centrally managed privatelink.* zones.', 0.6, 1.6, 5.3, 0.95, { fontSize: 13 });
    L.bullets(s, [
      'A private endpoint belongs to its virtual network’s region. Other regions need routing to reach it.',
      'Disaster recovery: a recovery-region endpoint avoids dependence on the primary region.',
      'Active/active: each region uses a local endpoint to keep traffic local.',
      'When the same FQDN registers in a shared zone, the last registered endpoint determines the address returned to both regions.',
      'If that endpoint’s region fails, update the record to the surviving endpoint, even if the service is healthy.',
    ], 0.6, 2.75, 5.3, 3.4, { gap: 9 });
    L.image(s, media('private-dns-global-zone'), { x: 6.2, y: 1.7, w: 6.53, h: 4.02 },
      'Both regions resolve one storage account to its private endpoint in Region A through a shared global private DNS zone. Region B uses cross-region connectivity.');
    L.caption(s, 'Figure', 'Region B receives the same address; its local private endpoint is not used.', 6.2, 5.85, 6.53);
    L.decision(s, 'The deciding factor is whether the same FQDN maps to private endpoints in multiple regions, not the number of service instances.', 0.6, 6.25, 12.13, 0.6);
    s.addNotes('Scope: centralized DNS designs sharing private DNS zones across regions, not isolated spokes with their own zones. Different instance names can share a global zone if each instance has a private endpoint only in its own region. If both instances also have endpoints in the other region, each name has competing registrations.');
  }

  {
    const s = L.slide('appendix');
    header(s, 'Choose global zones or regional zones');
    L.card(s, 0.6, 1.6, 5.3, 1.85, {
      title: 'Global zone: update the record during failover',
      body: 'Point the A record at the primary region’s private endpoint. During failover, update it to the secondary endpoint manually or through the disaster recovery runbook.',
    });
    L.card(s, 0.6, 3.6, 5.3, 2.35, {
      title: 'Regional zones: resolve to the local endpoint',
      body: 'Create one zone per region for each required privatelink.* name and link it only to that region’s virtual networks. These are still global Azure resources; “regional” describes their use and links. No DNS record change is needed during failover.',
      fill: C.t50,
    });
    L.image(s, media('private-dns-regional-zones'), { x: 6.2, y: 1.7, w: 6.53, h: 4.02 },
      'Separate private DNS zones with the same name, each linked only to its region’s virtual networks, resolve the storage account to each region’s local private endpoint.');
    L.caption(s, 'Figure', 'Clients query their region’s zone, receive the local private endpoint address, and access the resource locally.', 6.2, 5.85, 6.53);
    s.addNotes('For example, create a privatelink.blob.core.windows.net zone per region. Each zone resolves the FQDN to the local private endpoint. The zones do not become regional Azure resources; their virtual network links and records provide regional resolution.');
  }

  {
    const s = L.slide('appendix');
    header(s, 'Compare global and regional DNS zones');
    const rows = [
      ['Consideration', 'Global zones', 'Regional zones'].map(heading),
      ['Design', 'One zone per required privatelink.* name, shared across regions.', 'Separate zones with the same name, each linked only to its region.'],
      ['A records per FQDN', 'One.', 'One per region.'],
      ['Private endpoints in two regions', 'Clients use one endpoint. Failover requires a record update.', 'Each region uses its local endpoint. No DNS record update during failover.'],
      ['Operations', 'One set of zones. Landing zone DeployIfNotExists policies work unchanged.', 'Manage records and policy assignments separately for each region.'],
      ['Cross-region access', 'All regions sharing the zone can resolve the resource.', 'Each region resolves only the records in its zone.'],
      ['On-premises', 'Resolvers using the shared zone return the same answer.', 'The answer depends on which regional resolver receives the query.'],
    ];
    s.addTable(rows, { ...tableOptions, colW: [2.2, 4.965, 4.965], rowH: [0.4, 0.65, 0.45, 0.7, 0.7, 0.6, 0.6] });
    L.decision(s, 'Use regional zones for local endpoints in DR or active/active. A global zone is an alternative if cross-region routing, latency, and record-update time meet the RTO.', 0.6, 6.15, 12.13, 0.7);
    s.addNotes('DNS design must account for every resource under the chosen zone name. Regional zones require deliberate cross-region record availability and policy targeting. A global-zone design requires DNS updates during both failover and failback.');
  }

  {
    const s = L.slide('appendix');
    header(s, 'Disaster recovery examples by service');
    const rows = [
      ['Service', 'Disaster recovery model', 'Private endpoints for disaster recovery', 'Zone'].map(heading),
      ['Azure Storage (GRS/GZRS)', 'Account failover; the account name stays the same.', 'One endpoint per region so clients use a local endpoint after failover.', 'privatelink.blob.core.windows.net; other subresource zones as needed.'],
      ['Service Bus Premium and Event Hubs', 'Geo-Replication: a single namespace.\nGeo-Disaster Recovery: two namespaces, one in each region.', 'Each namespace needs an endpoint in both regions: one per region for Geo-Replication, two per region for Geo-Disaster Recovery.', 'privatelink.servicebus.windows.net'],
      ['Azure SQL Database', 'Primary and secondary logical servers in different regions. The failover-group listener follows the primary.', 'One endpoint for each server in its own region. Both servers can share one private DNS zone.', 'privatelink.database.windows.net'],
    ];
    s.addTable(rows, { ...tableOptions, colW: [1.85, 3.15, 4.13, 3], rowH: [0.6, 1.1, 1.5, 1.3] });
    L.decision(s, 'Different resource names can share a global zone without this conflict. Check each service’s current DNS behavior and private endpoint requirements.', 0.6, 6.25, 12.13, 0.6);
    s.addNotes('References: https://learn.microsoft.com/azure/storage/common/storage-failover-private-endpoints ; https://learn.microsoft.com/azure/service-bus-messaging/service-bus-geo-replication#private-endpoints ; https://learn.microsoft.com/azure/service-bus-messaging/service-bus-geo-dr#private-endpoints ; https://learn.microsoft.com/azure/event-hubs/geo-replication#private-endpoints ; https://learn.microsoft.com/azure/event-hubs/event-hubs-geo-dr#private-endpoints ; https://learn.microsoft.com/azure/azure-sql/database/failover-group-configure-sql-db#use-private-link');
  }

  {
    const s = L.slide('appendix');
    header(s, 'Make DNS part of regional operations and recovery');
    L.card(s, 0.6, 1.6, 6.0, 4.65, { title: 'Regional zones: records, policy, and forwarding', fill: C.t50 });
    L.bullets(s, [
      'Choose the pattern per zone name, not per resource: a virtual network can link to only one zone with a given name.',
      'Include every record clients need. For Region A resources, add records plus routing in Region B, or deploy and register local endpoints.',
      'Assign DeployIfNotExists policies per region using the corresponding private DNS zone ID.',
      'Use separate resource groups: one group cannot contain two zones with the same name.',
      'Verify on-premises forwarding and resolution in normal operation and failover; answers depend on the resolver queried.',
    ], 0.85, 2.45, 5.5, 3.5, { gap: 10 });
    L.card(s, 6.75, 1.6, 5.98, 4.65, { title: 'Global zones: tested failover and failback' });
    L.bullets(s, [
      'The RTO must allow for a manual or automated DNS update.',
      'Provide cross-region routing to the active endpoint, with acceptable latency in normal operation.',
      'Document and test DNS updates for both failover and failback; automate them where possible.',
      'Account for DNS caching: clients can use the old address until TTL expiry. Choose a TTL that supports the RTO.',
    ], 7.0, 2.45, 5.48, 3.5, { gap: 12 });
    const url = L.data.siteUrl.replace(/\/$/, '') + '/private-dns-multi-region.html';
    L.txt(s, [{ text: 'Read the DNS guidance and reference links', options: { hyperlink: { url }, color: C.b600, underline: { style: 'sng', color: C.b600 } } }], 0.6, 6.5, 12.13, 0.3, { fontSize: 11 });
    s.addNotes('Further reading: https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/private-link-and-dns-integration-at-scale and https://github.com/adstuart/azure-privatelink-multiregion . Regional zones are global Azure resources with region-specific virtual network links, records, and policy assignments.');
  }
};
