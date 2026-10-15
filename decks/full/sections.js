// Sections of the full deck, in order. Slide modules name a section by key (L.slide('part2')); the eyebrow,
// the footer label, the PowerPoint sections and the agenda slide are all generated from this table.
//   label    eyebrow, footer and PowerPoint section name
//   agenda   [number or letter, title, description] for the agenda slide; omit to leave the section off the agenda
//   color    eyebrow and footer color (default blue)
const { C } = require('../lib');

module.exports = [
  { key: 'front', label: 'Opening', footer: 'Agenda' },
  { key: 'summary', label: 'Executive summary', agenda: ['', 'Executive summary', 'The model on one page'] },
  { key: 'overview', label: 'Framework overview', agenda: ['', 'Framework overview', 'Drivers, constructs, and the adoption journey'] },
  { key: 'part1', label: 'Part 1 · Understand concepts', agenda: ['1', 'Understand concepts', 'Two layers, four connectivity profiles, four archetypes'] },
  { key: 'part2', label: 'Part 2 · Qualify regions', agenda: ['2', 'Qualify regions', 'Four checks, the assessment outcome, and a decision tree'] },
  { key: 'part3', label: 'Part 3 · Select the regional design', agenda: ['3', 'Select the regional design', 'Three choices from short lists, and one design record'] },
  { key: 'part4', label: 'Part 4 · Prepare the region', agenda: ['4', 'Prepare the region', 'What to deploy for each profile, and a readiness checklist'] },
  { key: 'part5', label: 'Part 5 · Place workloads', color: C.t600, agenda: ['5', 'Place workloads', 'Eight steps from option to placement'] },
  { key: 'scenarios', label: 'Customer scenarios', color: C.t600, agenda: ['', 'Customer scenarios', 'Four scenarios from driver to placement'] },
  { key: 'practice', label: 'Putting it into practice', agenda: ['', 'Putting it into practice', 'Misconceptions and getting started'] },
  { key: 'conclusion', label: 'Conclusion', agenda: ['', 'Conclusion', 'Design for continuing regional choice'] },
  { key: 'appendix', label: 'Appendix A · Service behavior across regions', color: C.s600, agenda: ['A', 'Service behavior across regions', 'Paired and nonpaired regions, Storage, Backup, Key Vault, private DNS'] },
  { key: 'back', label: 'Closing' },
];
