// Sections of the full deck, in order. Slide modules name a section by key (L.slide('part2')); the eyebrow,
// the footer label, the PowerPoint sections and the agenda slide are all generated from this table.
//   label    eyebrow, footer and PowerPoint section name
//   agenda   [number or letter, title, description] for the agenda slide; omit to leave the section off the agenda
//   color    eyebrow and footer color (default blue)
const { C } = require('../lib');
const { serviceGuidesTitle } = require('../../shared/summary.json');

module.exports = [
  { key: 'front', label: 'Opening', footer: 'Agenda' },
  { key: 'summary', label: 'Executive summary', agenda: ['', 'Executive summary', 'The model on one page'] },
  { key: 'overview', label: 'Framework overview', agenda: ['', 'Framework overview', 'Drivers, constructs, and the adoption journey'] },
  { key: 'part1', label: 'Part 1 · Understand concepts', agenda: ['1', 'Understand concepts', 'Two layers, four Platform Services profiles, four archetypes'] },
  { key: 'part2', label: 'Part 2 · Qualify regions', agenda: ['2', 'Qualify regions', 'Four checks, the assessment outcome, and a decision tree'] },
  { key: 'part3', label: 'Part 3 · Select the regional design', agenda: ['3', 'Select the regional design', 'Three choices from short lists, and one design record'] },
  { key: 'part4', label: 'Part 4 · Prepare the region', agenda: ['4', 'Prepare the region', 'What to deploy for each profile, and a readiness checklist'] },
  { key: 'part5', label: 'Part 5 · Place workloads', color: C.t600, agenda: ['5', 'Place workloads', 'Eight steps from option to placement'] },
  { key: 'services', label: serviceGuidesTitle, color: C.s600, agenda: ['', serviceGuidesTitle, 'Storage, Backup and restore, Key Vault, private DNS'] },
  { key: 'getting-started', label: 'Resources · Getting started', agenda: ['', 'Resources', 'Getting started, scenarios, misconceptions, pairing, resiliency'] },
  { key: 'scenarios', label: 'Resources · Customer scenarios', color: C.t600 },
  { key: 'misconceptions', label: 'Resources · Common misconceptions' },
  { key: 'pairing', label: 'Resources · Paired and nonpaired regions', color: C.s600 },
  { key: 'resiliency', label: 'Resources · Resiliency scenarios', color: C.s600 },
  { key: 'conclusion', label: 'Conclusion', agenda: ['', 'Conclusion', 'Design for continuing regional choice'] },
  { key: 'back', label: 'Closing' },
];
