/**
 * Genera icon.ico (multi-resolución), icon.png y license.txt.
 * Windows requiere ICO con varios tamaños para exe, accesos directos y barra de tareas.
 */

const fs = require('fs');
const path = require('path');

const SIZES_ICO = [16, 24, 32, 48, 64, 128, 256];

const LICENSE_CONTENT = `
      COODETRANS GESTIÓN

      Licencia de Uso Interno

      Copyright © 2026 RickLabs.

      Este software fue desarrollado por RickLabs como parte de las actividades realizadas para Coodetrans.

      La aplicación está destinada exclusivamente al uso interno de Coodetrans y no podrá ser distribuida, comercializada o cedida a terceros sin autorización expresa.

      Todos los derechos de autor sobre el código fuente, documentación técnica y recursos asociados permanecen protegidos por la legislación aplicable sobre propiedad intelectual.

      El software se proporciona "tal cual", sin garantías expresas o implícitas.

      RickLabs
      2026
`;

async function main() {
  const logoSrc = path.join(
    __dirname,
    '../src/renderer/assets/coodetransLogo.png'
  );

  const buildDir = path.join(__dirname, '../build');

  const pngDest = path.join(buildDir, 'icon.png');
  const icoDest = path.join(buildDir, 'icon.ico');
  const licenseDest = path.join(buildDir, 'license.txt');

  if (!fs.existsSync(logoSrc)) {
    console.error('[icons] No se encontró el logo en:', logoSrc);
    process.exit(1);
  }

  // Crear carpeta build si no existe
  fs.mkdirSync(buildDir, { recursive: true });

  // Copiar PNG principal
  fs.copyFileSync(logoSrc, pngDest);

  // Crear licencia si no existe
  if (!fs.existsSync(licenseDest)) {
    fs.writeFileSync(
      licenseDest,
      LICENSE_CONTENT,
      'utf8'
    );

    console.log('[build] license.txt generado.');
  }

  let sharp;

  try {
    sharp = require('sharp');
  } catch {
    console.warn(
      '[icons] sharp no instalado; generando ICO de resolución única.'
    );

    const mod = await import('png-to-ico');
    const pngToIco = mod.default || mod;

    fs.writeFileSync(
      icoDest,
      await pngToIco(pngDest)
    );

    console.log(
      '[icons] icon.png e icon.ico generados (resolución única).'
    );

    return;
  }

  const pngBuffers = await Promise.all(
    SIZES_ICO.map((size) =>
      sharp(logoSrc)
        .resize(size, size, {
          fit: 'contain',
          background: {
            r: 0,
            g: 0,
            b: 0,
            alpha: 0,
          },
        })
        .png()
        .toBuffer()
    )
  );

  const mod = await import('png-to-ico');
  const pngToIco = mod.default || mod;

  fs.writeFileSync(
    icoDest,
    await pngToIco(pngBuffers)
  );

  console.log(
    `[icons] icon.png e icon.ico generados (${SIZES_ICO.length} tamaños).`
  );
}

main().catch((err) => {
  console.error('[icons] Error:', err.message);
  process.exit(1);
});