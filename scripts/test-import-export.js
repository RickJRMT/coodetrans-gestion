/**
 * Pruebas automatizadas de importación/exportación Excel.
 * Ejecutar: npm run test:import
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const XLSX = require('xlsx');
const {
  parsearArchivo,
  detectarFilaEncabezado,
  detectarColumnas,
  esCedulaValida,
  convertirFecha,
  resolverFechasEmpleado,
  formatearFechaExport,
  COLUMNAS_EXPORT,
} = require('../src/services/importExportService');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coodetrans-test-'));
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

function crearXlsx(nombre, hojas) {
  const ruta = path.join(tmpDir, nombre);
  const wb = XLSX.utils.book_new();
  for (const [nombreHoja, filas] of hojas) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas), nombreHoja);
  }
  XLSX.writeFile(wb, ruta);
  return ruta;
}

console.log('\n=== Pruebas de importación Excel ===\n');

// 1) No usar columna ID como cédula
const filasConId = [
  ['Listado de empleados'],
  ['ID', 'Codigo', 'Nombre del Empleado', 'Area', 'Novedad'],
  ['1', '1234567890', 'Juan Pérez', 'Administración', 'Activo'],
  ['2', '9876543210', 'María López', 'Operaciones', 'Activo'],
];
const idxId = detectarFilaEncabezado(filasConId);
const mapaId = detectarColumnas(filasConId[idxId].map(String), filasConId, idxId);
assert(mapaId.codigo === 1, 'Columna Codigo (índice 1) se elige sobre ID (índice 0)');

const rutaId = crearXlsx('con-columna-id.xlsx', [['Hoja1', filasConId]]);
const resId = parsearArchivo(rutaId);
assert(resId.filasValidas.length === 2, 'Dos registros válidos con columna ID presente');
assert(resId.filasValidas[0].cedula === '1234567890', 'Cédula real importada, no ID interno');

// 2) Rechazar cédulas tipo consecutivo 1,2,3
assert(!esCedulaValida('1'), 'Cédula "1" rechazada');
assert(!esCedulaValida('123'), 'Cédula "123" rechazada');
assert(esCedulaValida('1234567890'), 'Cédula de 10 dígitos aceptada');

const filasSoloId = [
  ['ID', 'Nombre del Empleado', 'Area'],
  ['1', 'Empleado Uno', 'RRHH'],
];
const rutaSoloId = crearXlsx('solo-id.xlsx', [['Hoja1', filasSoloId]]);
const resSoloId = parsearArchivo(rutaSoloId);
assert(resSoloId.ok === false || resSoloId.filasValidas.length === 0, 'Archivo sin columna de documento no importa filas');

// 3) Multi-hoja — importar todas
const rutaMulti = crearXlsx('multi.xlsx', [
  ['Activos', [
    ['Codigo', 'Nombre del Empleado', 'Area', 'Ubicacion', 'Novedad'],
    ['1111111111', 'Ana Test', 'RRHH', 'Estante A', 'Activo'],
    ['2222222222', 'Luis Test', 'RRHH', 'Estante B', 'Activo'],
  ]],
  ['Retirados', [
    ['Codigo', 'Nombre Empleado', 'Area', 'Novedad'],
    ['3333333333', 'Pedro Ret', 'Operaciones', 'Retirado'],
    ['4444444444', 'Laura Ret', 'Administración', 'Retirado'],
  ]],
  ['OtraArea', [
    ['Codigo', 'Nombre del Empleado', 'Area', 'Novedad'],
    ['5555555555', 'Carlos EDS', 'EDS', 'Activo'],
  ]],
]);

const resTodas = parsearArchivo(rutaMulti, { todasLasHojas: true });
assert(resTodas.ok, 'Importación multi-hoja OK');
assert(resTodas.resumenMultiHoja.hojasProcesadas === 3, 'Tres hojas procesadas');
assert(resTodas.resumenMultiHoja.registrosValidosEncontrados === 5, 'Cinco registros válidos en total');
assert(resTodas.filasValidas.length === 5, 'Cinco registros únicos a importar');
assert(
  resTodas.resumenMultiHoja.detalleHojas.every((h) => h.validas >= 1),
  'Cada hoja aporta al menos un registro válido'
);

// 4) Encabezados desplazados
const filasTitulo = [
  ['COODETRANS'],
  [],
  ['Codigo', 'Nombre del Empleado', 'Area', 'Ubicacion', 'Observaciones', 'Novedad'],
  ['1234567890', 'Juan Pérez', 'Administración', 'Archivo 3', 'Urgente', 'Activo'],
];
assert(detectarFilaEncabezado(filasTitulo) === 2, 'Encabezado en fila 3 detectado');

// 5) Formato cédula visual
function formatCedula(c) {
  const d = String(c).replace(/\D/g, '');
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
assert(formatCedula('1234567890') === '1.234.567.890', 'Formato visual de cédula');

// 6) Fechas: serial Excel, formato regional y F/Novedad para retirados
assert(convertirFecha(44927) === '2023-01-01', 'Serial Excel 44927 → 2023-01-01');
assert(convertirFecha('15/03/2020') === '2020-03-15', 'DD/MM/YYYY colombiano');
assert(formatearFechaExport('2020-03-15') === '15/03/2020', 'Exportación DD/MM/YYYY');

const fechasRet = resolverFechasEmpleado({
  estado: 'Retirado',
  fechaIngreso: null,
  fechaRetiro: null,
  fNovedad: '2024-06-10',
  tieneColIngreso: false,
  tieneColRetiro: false,
});
assert(fechasRet.fecha_retiro === '2024-06-10' && !fechasRet.fecha_ingreso,
  'F/Novedad de retirado va a fecha_retiro, no a fecha_ingreso');

const fechasIng = resolverFechasEmpleado({
  estado: 'Activo',
  fechaIngreso: null,
  fechaRetiro: null,
  fNovedad: '2019-01-15',
  tieneColIngreso: false,
  tieneColRetiro: false,
});
assert(fechasIng.fecha_ingreso === '2019-01-15', 'F/Novedad de activo puede usarse como ingreso');

const filasRetirados = [
  ['Codigo', 'Nombre del Empleado', 'Area', 'Novedad', 'F/Novedad'],
  ['1234567890', 'Pedro Retirado', 'Operaciones', 'Retirado', '30/12/2025'],
];
const idxRet = detectarFilaEncabezado(filasRetirados);
const mapaRet = detectarColumnas(filasRetirados[idxRet].map(String), filasRetirados, idxRet);
assert(mapaRet.f_novedad != null && mapaRet.fecha_ingreso == null,
  'F/Novedad ya no se mapea directamente a fecha_ingreso');

const rutaRet = crearXlsx('retirados-fnovedad.xlsx', [['Hoja1', filasRetirados]]);
const resRet = parsearArchivo(rutaRet);
assert(resRet.filasValidas[0].fecha_retiro === '2025-12-30', 'Importación: F/Novedad → fecha_retiro');
assert(!resRet.filasValidas[0].fecha_ingreso, 'Importación: fecha_ingreso vacía si no hay columna dedicada');

// 7) Orden fijo de columnas de exportación
const idxIng = COLUMNAS_EXPORT.findIndex((c) => c.encabezado === 'Fecha Ingreso');
const idxRetiro = COLUMNAS_EXPORT.findIndex((c) => c.encabezado === 'Fecha Retiro');
assert(idxIng >= 0 && idxRetiro === idxIng + 1, 'Fecha Retiro inmediatamente después de Fecha Ingreso');

console.log(`\n=== Resultado: ${passed} OK, ${failed} fallos ===\n`);
fs.rmSync(tmpDir, { recursive: true, force: true });
process.exit(failed > 0 ? 1 : 0);
