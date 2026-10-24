const { C, F } = require('../lib');

module.exports = (pres, L) => {
  const s = L.slide('part2');
  L.header(s, '', L.data.plannerName, { eyebrow: 'Planning tool · Steps 2 and 3', tw: 11.8 });
  const columns = [
    ['search', 'Compare and qualify', 'Scope current and candidate regions. Compare Services, Latency, and Pricing; record evidence in Checks.', 'Availability comes from an imported CSV with Service, Product, and SKU selectors. Retail pricing is a separate snapshot.'],
    ['hub', 'Record the regional design', 'Choose the connectivity profile, shared-service placement, and hybrid connectivity. Hub Connections can name multiple regions.', 'The optional Advanced Networking Design Tool inherits the plan. Diagram-only refinements do not change its authoritative decisions.'],
    ['doc', 'Review and export', 'Review + export supports Excel, printing, and saving or reopening JSON planning records.', 'Planning data stays in the browser. Full-width tabs keep the workspace open; Table of contents returns to the guidance.'],
  ];
  columns.forEach(([icon, title, body, detail], i) => {
    const x = 0.6 + i * 4.1;
    L.box(s, x, 1.6, 3.93, 4.3, { fill: i === 1 ? C.t50 : C.wash });
    L.badge(s, icon, x + 0.25, 1.85, 0.5, i === 1 ? C.t600 : C.b600);
    L.txt(s, title, x + 0.25, 2.65, 3.43, 0.7, { fontSize: 18, fontFace: F.semi });
    L.txt(s, body, x + 0.25, 3.55, 3.43, 0.95, { fontSize: 13 });
    L.txt(s, detail, x + 0.25, 4.65, 3.43, 1.0, { fontSize: 12, color: C.muted });
  });
  L.decision(s, 'Planning inputs are not deployment guarantees. Revalidate service support, access, quota, capacity, latency, and recovery.', 0.6, 6.15, 12.13, 0.7);
  s.addNotes('Open ' + L.data.workbookUrl + '. Latency geography maps compare current and candidate regions, ExpressRoute peering locations, and customer cities. Suggestions are not evidence of customer-owned circuits. The explorer supports a single topology and one remote traffic hub for Remote Hub, with limitations shown in Plan definitions. JSON Export from the explorer preserves diagram refinements separately from the planner’s JSON and Excel records.');
};
