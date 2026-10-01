const pptxgen = require('pptxgenjs');
const { makeLib } = require('./lib');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'The Adaptable Multi-Region Azure Platform';
pres.company = 'Microsoft';
pres.subject = 'Multi-Region Platform Whitepaper — full briefing deck';
const L = makeLib(pres, { brand: 'Multi-Region Platform Whitepaper' });
for (const m of ['./full/f1', './full/f2', './full/f3', './full/f4', './full/f5']) { try { require(m)(pres, L); } catch (e) { if (e.code === 'MODULE_NOT_FOUND' && e.message.includes(m.slice(2))) continue; throw e; } }
pres.writeFile({ fileName: 'out/Adaptable-Multi-Region-Azure-Platform-Full.pptx' }).then(f => console.log('wrote', f, L.n, 'slides'));
