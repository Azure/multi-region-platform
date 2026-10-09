// Icon PNGs for the decks: img/ic/<name>-<color>.png.
//
//   node icons.js                # parse the sprite and write all PNGs
//   node icons.js --parse-only   # only parse and list the icon names
//
// The icons are the <symbol id="i-NAME"> entries of the SPRITE string in whitepaper/build.py, so the PDFs, the website
// and the decks draw the same set. There is no separate icon list to maintain.
// Needs the optional dependency `sharp`.
const fs = require('fs');
const path = require('path');

const BUILD_PY = path.join(__dirname, '..', 'whitepaper', 'build.py');
const OUT_DIR = path.join(__dirname, 'img', 'ic');
const COLORS = { w: '#FFFFFF', b: '#0F6CBD', t: '#04807A', s: '#243A57', o: '#A84E1F', g: '#107C41', v: '#8661C5', m: '#5B6778' };

// { name: inner SVG markup } in the order of the sprite
function parseSprite(source) {
  const sprite = source.match(/SPRITE\s*=\s*"""([\s\S]*?)"""/);
  if (!sprite) throw new Error('SPRITE string not found in ' + BUILD_PY);
  const icons = {};
  for (const m of sprite[1].matchAll(/<symbol\s+id="i-([\w-]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) icons[m[1]] = m[2].trim();
  if (!Object.keys(icons).length) throw new Error('No <symbol id="i-…"> entries in SPRITE');
  return icons;
}

const icons = parseSprite(fs.readFileSync(BUILD_PY, 'utf8'));
console.log(Object.keys(icons).length + ' icons parsed from whitepaper/build.py');

if (process.argv.includes('--parse-only')) console.log(Object.keys(icons).join(' '));
else if (require.main === module) {
  let sharp;
  try { sharp = require('sharp'); } catch (e) {
    console.error('icons.js needs the optional dependency "sharp" to write the PNG files (run "npm install" in decks/, or use --parse-only to only list the icons).');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  (async () => {
    for (const [name, body] of Object.entries(icons)) {
      for (const [c, hex] of Object.entries(COLORS)) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24" style="color:${hex}"><g color="${hex}">${body.replace(/currentColor/g, hex)}</g></svg>`;
        await sharp(Buffer.from(svg)).png().toFile(path.join(OUT_DIR, `${name}-${c}.png`));
      }
    }
    console.log('icons done');
  })();
}
module.exports = { parseSprite };
