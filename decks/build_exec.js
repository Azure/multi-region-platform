// Executive briefing deck. One module (exec/e.js) holds the slides.
const path = require('path');
const pptxgen = require('pptxgenjs');
const { makeLib } = require('./lib');

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'The Adaptable Multi-Region Azure Platform — Executive Briefing';
pres.company = 'Microsoft';
pres.author = 'Microsoft';
pres.subject = 'Multi-Region Platform — executive briefing deck';
const L = makeLib(pres, { brand: 'Multi-Region Platform · Executive Briefing', sections: require('./exec/sections'), tone: 'teal' });
require('./exec/e')(pres, L);
L.save(path.join(__dirname, 'out', 'Adaptable-Multi-Region-Azure-Platform-Executive.pptx')).then(f => console.log('wrote', f, L.n, 'slides'));
