const sharp = require('sharp'); const fs = require('fs');
const syms = JSON.parse(fs.readFileSync('icons.json'));
const colors = { w:'#FFFFFF', b:'#0F6CBD', t:'#04807A', s:'#243A57', o:'#A84E1F', g:'#107C41', v:'#8661C5', m:'#5B6778' };
fs.mkdirSync('img/ic', {recursive:true});
(async () => {
  for (const [k, body] of Object.entries(syms)) for (const [c, hex] of Object.entries(colors)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24" style="color:${hex}"><g color="${hex}">${body.replace(/currentColor/g, hex)}</g></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(`img/ic/${k}-${c}.png`);
  }
  console.log('icons done');
})();
