// Sections of the executive deck, in order. Slide modules name a section by key (L.slide('x3')); the eyebrow,
// the footer label and the PowerPoint sections are generated from this table. The deck keeps the executive brief's own numbering.
//   label    eyebrow, footer and PowerPoint section name (the brief's section heading)
//   footer   shorter footer label where the label is long
//   eyebrow  replaces the label in the eyebrow
//   color    eyebrow and footer color (default blue)
const { C } = require('../lib');

module.exports = [
  { key: 'front', label: 'Opening' },
  { key: 'summary', label: 'Executive summary' },
  { key: 'x1', label: '01 · Reframe the objective' },
  { key: 'x2', label: '02 · From a region mindset to a geography mindset', footer: '02 · Geography mindset' },
  { key: 'x3', label: '03 · Decouple connectivity from individual regions', footer: '03 · Decouple connectivity' },
  { key: 'x4', label: '04 · Tier the regional footprint' },
  { key: 'x5', label: '05 · Classify workloads by archetype', footer: '05 · Workload Landing Zone archetypes', color: C.t600 },
  { key: 'city', label: 'An everyday analogy', eyebrow: 'The model as a city' },
  { key: 'x6', label: '06 · Qualify regions' },
  { key: 'x7', label: '07 · Why this creates agility' },
  { key: 'x8', label: '08 · Agility in practice', color: C.t600 },
  { key: 'x9', label: '09 · The strategic benefit' },
  { key: 'back', label: 'Closing' },
];
