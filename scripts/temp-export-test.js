const path = require('path');
const fs = require('fs');
const { initDatabase, closeDatabase } = require('../src/database/database');
const { exportarEmpleados } = require('../src/services/importExportService');

const tmp = path.join(__dirname, 'tmp-test-db');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

initDatabase(tmp);

(async () => {
  try {
    const dest = path.join(tmp, 'out-test.xlsx');
    const res = await exportarEmpleados('activos', 'xlsx', dest, null, null, [
      'cedula',
      'nombre_completo',
      'nom_area',
      'nom_cargo',
    ]);
    console.log('RESULTADO:', JSON.stringify(res, null, 2));
    console.log('FILE EXISTS:', fs.existsSync(dest));
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error(err.stack);
  } finally {
    closeDatabase();
  }
})();
