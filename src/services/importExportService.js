/**
 * importExportService.js
 * ------------------------------------------------------------------
 * Servicio de IMPORTACIÓN y EXPORTACIÓN de empleados (carpetas físicas)
 * desde/hacia Excel (.xlsx) y CSV (.csv), usando la librería `xlsx`.
 *
 * IMPORTACIÓN — soporta dos formatos de archivo:
 *
 *   FORMATO TIPO 1:
 *     Codigo · Nombre del Empleado · Novedad · Ubicacion · Area · Cargo
 *
 *   FORMATO TIPO 2:
 *     Codigo · Nombre Empleado · Documento ID · Sueldo · F/Novedad ·
 *     Fecha Retiro · Novedad · Ubicacion · Area · Cargo
 *     (Documento ID y Sueldo se IGNORAN. F/Novedad = Fecha de Ingreso.)
 *
 * Campos OBLIGATORIOS: Código/Cédula, Nombre, Área.
 * Campos OPCIONALES:   Cargo, Ubicación, Fecha Ingreso, Fecha Retiro, Estado.
 * ------------------------------------------------------------------
 */

const XLSX = require('xlsx');
const { getDb } = require('../database/database');
const { actividadRepo } = require('../repositories/repositories');

/* ── Utilidades de texto ── */
function normalizar(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── Conversión de fechas ── */
const MESES = {
  ene: '01', jan: '01', feb: '02', mar: '03', abr: '04', apr: '04',
  may: '05', jun: '06', jul: '07', ago: '08', aug: '08', sep: '09', set: '09',
  oct: '10', nov: '11', dic: '12', dec: '12',
};

/**
 * Convierte cadenas de fecha a formato ISO (yyyy-mm-dd). Soporta:
 *   - "JUN 12/2026", "MAY 01/2025", "JAN 03/2024"  (MON DD/YYYY)
 *   - "12/06/2026"  (dd/mm/yyyy)
 *   - "2026-06-12"  (ya ISO)
 * Devuelve null si no se puede interpretar.
 */
function convertirFecha(valor) {
  if (!valor) return null;
  const v = String(valor).trim();
  if (!v) return null;

  // Ya ISO
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  // MON DD/YYYY  (ej. "JUN 12/2026")
  m = v.match(/^([A-Za-zÁ-úñÑ]{3,})\s+(\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const mes = MESES[normalizar(m[1]).slice(0, 3)];
    if (mes) return `${m[3]}-${mes}-${String(m[2]).padStart(2, '0')}`;
  }

  // dd/mm/yyyy  (ej. "30/05/2026")
  m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  }

  // dd MON yyyy
  m = v.match(/^(\d{1,2})\s+([A-Za-zÁ-úñÑ]{3,})\s+(\d{4})$/);
  if (m) {
    const mes = MESES[normalizar(m[2]).slice(0, 3)];
    if (mes) return `${m[3]}-${mes}-${String(m[1]).padStart(2, '0')}`;
  }

  return null;
}

/** Normaliza el estado/novedad a 'Activo' | 'Retirado'. */
function normalizarEstado(valor) {
  const n = normalizar(valor);
  if (!n) return 'Activo';
  if (n.includes('retir')) return 'Retirado';
  return 'Activo';
}

/* ── Mapeo de encabezados a campos canónicos ── */
function detectarColumnas(headers) {
  const mapa = {}; // campoCanonico -> indice de columna
  headers.forEach((h, i) => {
    const n = normalizar(h);
    if (['codigo', 'cedula', 'documento', 'cc'].includes(n) || n === 'codigo') {
      if (mapa.codigo == null) mapa.codigo = i;
    }
    if (['nombre del empleado', 'nombre empleado', 'nombre completo', 'nombre', 'empleado'].includes(n)) {
      if (mapa.nombre == null) mapa.nombre = i;
    }
    if (n === 'novedad' || n === 'estado') { if (mapa.novedad == null) mapa.novedad = i; }
    if (['ubicacion', 'ubicacion fisica', 'ubicación'].includes(n)) { if (mapa.ubicacion == null) mapa.ubicacion = i; }
    if (n === 'area' || n === 'área') { if (mapa.area == null) mapa.area = i; }
    if (n === 'cargo') { if (mapa.cargo == null) mapa.cargo = i; }
    if (['f/novedad', 'f novedad', 'fecha ingreso', 'fecha de ingreso', 'fecha_ingreso'].includes(n)) {
      if (mapa.fecha_ingreso == null) mapa.fecha_ingreso = i;
    }
    if (['fecha retiro', 'fecha de retiro', 'f/retiro', 'fecha_retiro'].includes(n)) {
      if (mapa.fecha_retiro == null) mapa.fecha_retiro = i;
    }
  });
  return mapa;
}

/**
 * Lee el archivo y devuelve una vista previa con filas válidas e inválidas.
 * @returns {{ ok, formato, columnas, filasValidas, filasInvalidas, total }}
 */
function parsearArchivo(rutaArchivo) {
  try {
    const wb = XLSX.readFile(rutaArchivo, { cellDates: false, raw: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false, raw: false });
    if (!filas.length) {
      return { ok: false, error: 'El archivo está vacío o no tiene datos.' };
    }

    const headers = filas[0].map((h) => String(h).trim());
    const headersNorm = headers.map(normalizar);
    const mapa = detectarColumnas(headers);

    // Detección de formato: el Tipo 2 trae columnas adicionales
    const esTipo2 = headersNorm.some((h) =>
      ['f/novedad', 'f novedad', 'documento id', 'sueldo', 'fecha retiro'].includes(h));
    const formato = esTipo2 ? 'Tipo 2' : 'Tipo 1';

    const filasValidas = [];
    const filasInvalidas = [];

    for (let r = 1; r < filas.length; r++) {
      const fila = filas[r];
      const get = (campo) => (mapa[campo] != null ? String(fila[mapa[campo]] ?? '').trim() : '');

      const cedula = get('codigo');
      const nombre = get('nombre');
      const area = get('area');
      const cargo = get('cargo');
      const ubicacion = get('ubicacion');
      const novedad = get('novedad');
      const fIngreso = get('fecha_ingreso');
      const fRetiro = get('fecha_retiro');

      // Validación de campos OBLIGATORIOS
      const faltantes = [];
      if (!cedula) faltantes.push('Código/Cédula');
      if (!nombre) faltantes.push('Nombre');
      if (!area) faltantes.push('Área');

      const registro = {
        fila: r + 1,
        cedula,
        nombre_completo: nombre,
        area,
        cargo: cargo || null,
        ubicacion_fisica: ubicacion || null,
        estado: normalizarEstado(novedad),
        fecha_ingreso: convertirFecha(fIngreso),
        fecha_retiro: convertirFecha(fRetiro),
      };

      if (faltantes.length) {
        filasInvalidas.push({ ...registro, motivo: `Faltan campos obligatorios: ${faltantes.join(', ')}.` });
      } else {
        filasValidas.push(registro);
      }
    }

    return {
      ok: true,
      formato,
      columnas: headers,
      filasValidas,
      filasInvalidas,
      total: filas.length - 1,
    };
  } catch (err) {
    return { ok: false, error: `No se pudo leer el archivo: ${err.message}` };
  }
}

/* ── Helpers de persistencia (buscar o crear catálogos) ── */
function buscarOCrearArea(db, nombre) {
  if (!nombre) return null;
  const row = db.prepare('SELECT id_area FROM area WHERE LOWER(nom_area) = LOWER(?)').get(nombre.trim());
  if (row) return row.id_area;
  const r = db.prepare('INSERT INTO area (nom_area) VALUES (?)').run(nombre.trim());
  return r.lastInsertRowid;
}

function buscarOCrearCargo(db, nombre, idArea) {
  if (!nombre || !idArea) return null;
  const row = db.prepare(
    'SELECT id_cargo FROM cargo WHERE LOWER(nom_cargo) = LOWER(?) AND fk_id_area = ?'
  ).get(nombre.trim(), idArea);
  if (row) return row.id_cargo;
  const r = db.prepare('INSERT INTO cargo (nom_cargo, fk_id_area) VALUES (?, ?)').run(nombre.trim(), idArea);
  return r.lastInsertRowid;
}

/**
 * Importa las filas válidas a la base de datos (upsert por cédula).
 * Crea el área y el cargo si no existen.
 * @returns {{ ok, data: { insertados, actualizados, errores } }}
 */
function importarEmpleados(filasValidas, idUsuario = null) {
  const db = getDb();
  let insertados = 0;
  let actualizados = 0;
  const errores = [];

  const tx = db.transaction(() => {
    for (const fila of filasValidas) {
      try {
        const idArea = buscarOCrearArea(db, fila.area);
        const idCargo = buscarOCrearCargo(db, fila.cargo, idArea);
        const existente = db.prepare('SELECT id_empleado FROM empleado WHERE cedula = ?').get(fila.cedula);

        if (existente) {
          db.prepare(`
            UPDATE empleado SET
              nombre_completo = ?, estado = ?, ubicacion_fisica = ?,
              fk_id_area = ?, fk_id_cargo = ?,
              fecha_ingreso = COALESCE(?, fecha_ingreso),
              fecha_retiro = ?, updatedAt = datetime('now','localtime')
            WHERE id_empleado = ?`)
            .run(
              fila.nombre_completo, fila.estado, fila.ubicacion_fisica,
              idArea, idCargo, fila.fecha_ingreso, fila.fecha_retiro,
              existente.id_empleado
            );
          actualizados++;
        } else {
          db.prepare(`
            INSERT INTO empleado
              (cedula, nombre_completo, estado, ubicacion_fisica, fk_id_area,
               fk_id_cargo, fecha_ingreso, fecha_retiro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(
              fila.cedula, fila.nombre_completo, fila.estado, fila.ubicacion_fisica,
              idArea, idCargo, fila.fecha_ingreso, fila.fecha_retiro
            );
          insertados++;
        }
      } catch (e) {
        errores.push({ cedula: fila.cedula, motivo: e.message });
      }
    }
  });

  try {
    tx();
    actividadRepo.registrar({
      accion: 'importacion',
      detalle: `Importación de empleados: ${insertados} nuevos, ${actualizados} actualizados`,
      entidad: 'empleado', fk_id_usuario: idUsuario,
    });
    return { ok: true, data: { insertados, actualizados, errores } };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Exporta los empleados a un archivo Excel o CSV.
 * @param {'activos'|'retirados'|'todos'} filtro
 * @param {'xlsx'|'csv'} formato
 * @param {string} rutaDestino
 */
function exportarEmpleados(filtro, formato, rutaDestino) {
  try {
    const db = getDb();
    let where = '';
    if (filtro === 'activos') where = "WHERE e.estado = 'Activo'";
    else if (filtro === 'retirados') where = "WHERE e.estado = 'Retirado'";

    const filas = db.prepare(`
      SELECT e.cedula AS "Cédula",
             e.nombre_completo AS "Nombre",
             COALESCE(a.nom_area, a2.nom_area, '') AS "Área",
             COALESCE(c.nom_cargo, '') AS "Cargo",
             COALESCE(e.genero, '') AS "Género",
             COALESCE(t.camisa, '') AS "Talla Camisa",
             COALESCE(t.pantalon, '') AS "Talla Pantalón",
             COALESCE(t.calzado, '') AS "Talla Zapato",
             COALESCE(e.fecha_ingreso, '') AS "Fecha Ingreso",
             COALESCE(e.fecha_retiro, '') AS "Fecha Retiro",
             e.estado AS "Estado",
             COALESCE(e.ubicacion_fisica, '') AS "Ubicación Física"
      FROM empleado e
      LEFT JOIN area a   ON a.id_area = e.fk_id_area
      LEFT JOIN cargo c  ON c.id_cargo = e.fk_id_cargo
      LEFT JOIN area a2  ON a2.id_area = c.fk_id_area
      LEFT JOIN talla t  ON t.id_talla = e.fk_id_talla
      ${where}
      ORDER BY e.nombre_completo ASC`).all();

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empleados');

    if (formato === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      require('fs').writeFileSync(rutaDestino, '\ufeff' + csv, 'utf-8'); // BOM para tildes
    } else {
      XLSX.writeFile(wb, rutaDestino, { bookType: 'xlsx' });
    }

    return { ok: true, data: { total: filas.length, ruta: rutaDestino } };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  parsearArchivo,
  importarEmpleados,
  exportarEmpleados,
  convertirFecha, // exportado para pruebas
};
