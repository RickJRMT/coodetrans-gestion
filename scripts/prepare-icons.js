/**
 * Genera icon.ico para Windows/NSIS a partir del logo PNG.
 */
const fs = require('fs');
const path = require('path');

async function main() {
  const src = path.join(__dirname, '../build/icon.png');
  const dest = path.join(__dirname, '../build/icon.ico');
  if (!fs.existsSync(src)) {
    fs.copyFileSync(
      path.join(__dirname, '../src/renderer/assets/coodetransLogo.png'),
      src
    );
  }
  const mod = await import('png-to-ico');
  const pngToIco = mod.default || mod;
  const buf = await pngToIco(src);
  fs.writeFileSync(dest, buf);
  console.log('[icons] icon.ico generado correctamente.');
}

main().catch((err) => {
  console.error('[icons] Error:', err.message);
  process.exit(1);
});
