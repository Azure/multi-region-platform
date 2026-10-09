// Full briefing deck. Slide modules run in file-name order; a module that fails to load stops the build.
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const { makeLib } = require('./lib');

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'The Adaptable Multi-Region Azure Platform';
pres.company = 'Microsoft';
pres.author = 'Microsoft';
pres.subject = 'Multi-Region Platform Whitepaper — full briefing deck';
const L = makeLib(pres, { brand: 'Multi-Region Platform Whitepaper', sections: require('./full/sections'), tone: 'blue' });
// DECK_ONLY=30-part3,40-part4 node build_full.js   builds only those modules, for a quick look while editing them
const only = (process.env.DECK_ONLY || '').split(',').filter(Boolean);
fs.readdirSync(path.join(__dirname, 'full')).filter(f => /^\d\d-.*\.js$/.test(f)).sort()
  .filter(f => !only.length || only.some(k => f.startsWith(k)))
  .forEach(f => require('./full/' + f)(pres, L));
L.save(path.join(__dirname, 'out', 'Adaptable-Multi-Region-Azure-Platform-Full.pptx')).then(f => console.log('wrote', f, L.n, 'slides'));
