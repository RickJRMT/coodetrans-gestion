/**
 * importExportService.js
 * Importación y exportación de empleados (Excel / CSV) con detección robusta
 * de tablas, encabezados desplazados y soporte multi-hoja.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { getDb } = require('../database/database');
const { actividadRepo } = require('../repositories/repositories');

const MAX_FILAS_ESCANEO = 80;
const CEDULA_MIN_DIGITOS = 5;

function normalizar(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MESES = {
  ene: '01', jan: '01', feb: '02', mar: '03', abr: '04', apr: '04',
  may: '05', jun: '06', jul: '07', ago: '08', aug: '08', sep: '09', set: '09',
  oct: '10', nov: '11', dic: '12', dec: '12',
};

/** Convierte serial numérico de Excel (días desde 1899-12-30) a ISO YYYY-MM-DD. */
function serialExcelAFecha(serial) {
  const n = Number(serial);
  if (!Number.isFinite(n) || n < 1 || n > 500000) return null;
  const epoch = Date.UTC(1899, 11, 30);
  const ms = epoch + Math.round(n * 86400000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function convertirFecha(valor) {
  if (valor == null || valor === '') return null;

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, '0');
    const d = String(valor.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  }

  const v = String(valor).trim();
  if (!v) return null;

  if (/^\d+(\.\d+)?$/.test(v)) {
    const desdeSerial = serialExcelAFecha(v);
    if (desdeSerial) return desdeSerial;
  }

  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  m = v.match(/^([A-Za-zÁ-úñÑ]{3,})\s+(\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const mes = MESES[normalizar(m[1]).slice(0, 3)];
    if (mes) {
      return `${m[3]}-${mes}-${String(m[2]).padStart(2, '0')}`;
    }
  }

  m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  }

  m = v.match(/^(\d{1,2})\s+([A-Za-zÁ-úñÑ]{3,})\s+(\d{4})$/);
  if (m) {
    const mes = MESES[normalizar(m[2]).slice(0, 3)];
    if (mes) {
      return `${m[3]}-${mes}-${String(m[1]).padStart(2, '0')}`;
    }
  }

  // MM/DD/YY o MM/DD/YYYY
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);

  if (m) {
    let anio = Number(m[3]);

    if (anio < 100) {
      anio += anio < 50 ? 2000 : 1900;
    }

    const mes = String(m[1]).padStart(2, '0');
    const dia = String(m[2]).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  return null;
}

/** Formato legible para exportación (DD/MM/YYYY). La BD conserva ISO. */
function formatearFechaExport(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * Resuelve fechas de ingreso/retiro sin cruzar columnas.
 * F/Novedad en plantillas Tipo 2 suele ser la fecha del cambio de estado (retiro),
 * no la fecha de ingreso del empleado.
 */
function resolverFechasEmpleado({ estado, fechaIngreso, fechaRetiro, fNovedad, tieneColIngreso, tieneColRetiro }) {
  let ingreso = fechaIngreso;
  let retiro = fechaRetiro;

  if (estado === 'Retirado') {
    if (!retiro && fNovedad) retiro = fNovedad;
    if (!tieneColIngreso && ingreso === fNovedad) ingreso = null;
  } else if (!ingreso && fNovedad && !tieneColRetiro) {
    ingreso = fNovedad;
  }

  if (ingreso && retiro && ingreso === retiro && !tieneColIngreso && tieneColRetiro) {
    ingreso = null;
  }

  return { fecha_ingreso: ingreso, fecha_retiro: retiro };
}

function normalizarEstado(valor) {
  const n = normalizar(valor);
  if (!n) return 'Activo';
  if (n.includes('retir')) return 'Retirado';
  return 'Activo';
}

function sanitizeCedula(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

/** Encabezados que NUNCA deben mapearse a cédula (ID interno / consecutivo). */
const ENCABEZADOS_EXCLUIDOS_CODIGO = new Set([
  'id', 'no', 'num', 'numero', 'nro', 'n', '#', 'item', 'items',
  'consecutivo', 'secuencia', 'row', 'fila', 'index', 'indice',
]);

/** Puntúa qué tan probable es que un encabezado sea la columna de cédula/documento. */
function puntuarEncabezadoCodigo(headerNorm) {
  if (!headerNorm || ENCABEZADOS_EXCLUIDOS_CODIGO.has(headerNorm)) return -100;
  if (headerNorm === 'codigo' || headerNorm === 'cedula') return 100;
  if (headerNorm === 'documento id' || headerNorm === 'documento') return 95;
  if (headerNorm === 'cc' || headerNorm === 'c c') return 90;
  if (headerNorm === 'nit') return 85;
  if (headerNorm.includes('cedula') || headerNorm.includes('codigo')) return 80;
  if (headerNorm.includes('documento')) return 75;
  if (headerNorm.includes('identificacion') || headerNorm.includes('identificación')) return 70;
  return -50;
}

/** Puntúa una columna según el contenido de sus primeras filas de datos. */
function puntuarColumnaPorDatos(filas, indiceCol, filaInicio) {
  let score = 0;
  let muestras = 0;
  for (let r = filaInicio; r < Math.min(filas.length, filaInicio + 15); r++) {
    const val = sanitizeCedula(filas[r]?.[indiceCol]);
    if (!val) continue;
    muestras++;
    if (val.length >= 6) score += 10;
    else if (val.length >= CEDULA_MIN_DIGITOS) score += 5;
    else if (val.length <= 3) score -= 15;
  }
  return muestras ? score / muestras : 0;
}

function detectarColumnaCodigo(headers, filas, indiceEncabezado) {
  let mejor = { idx: null, score: -Infinity };
  headers.forEach((h, i) => {
    const n = normalizar(h);
    const scoreHdr = puntuarEncabezadoCodigo(n);
    if (scoreHdr < 0) return;
    const scoreDatos = puntuarColumnaPorDatos(filas, i, indiceEncabezado + 1);
    const total = scoreHdr + scoreDatos;
    if (total > mejor.score) mejor = { idx: i, score: total };
  });
  return mejor.idx;
}

function detectarColumnas(headers, filas = [], indiceEncabezado = 0) {
  const mapa = {};

  const idxCodigo = detectarColumnaCodigo(headers, filas, indiceEncabezado);
  if (idxCodigo != null) mapa.codigo = idxCodigo;

  headers.forEach((h, i) => {
    const n = normalizar(h);
    if (!n) return;

    // Nombre
    if (
      [
        'nombre del empleado',
        'nombre empleado',
        'nombre completo',
        'nombre',
        'empleado'
      ].includes(n) ||
      n.includes('nombre')
    ) {
      if (mapa.nombre == null) mapa.nombre = i;
    }

    // Estado / Novedad
    if (n === 'novedad') {
      if (mapa.novedad == null) mapa.novedad = i;
    }

    if (n === 'estado') {
      if (mapa.estado == null) mapa.estado = i;
    }

    // Ubicación
    if (
      [
        'ubicacion',
        'ubicacion fisica',
        'ubicación',
        'ubicación fisica'
      ].includes(n) ||
      n.includes('ubicacion')
    ) {
      if (mapa.ubicacion == null) mapa.ubicacion = i;
    }

    // Área
    if (
      n === 'area' ||
      n === 'área' ||
      (n.includes('area') && !n.includes('subarea'))
    ) {
      if (mapa.area == null) mapa.area = i;
    }

    // Cargo
    if (n === 'cargo' || n.includes('cargo')) {
      if (mapa.cargo == null) mapa.cargo = i;
    }

    // Género / Sexo
    if (
      n === 'genero' ||
      n === 'género' ||
      n === 'sexo' ||
      n.includes('sexo') ||
      n.includes('genero')
    ) {
      if (mapa.genero == null) mapa.genero = i;
    }

    // Observaciones
    if (
      ['observaciones', 'observacion', 'notas', 'comentarios', 'nota'].includes(n) ||
      n.includes('observacion')
    ) {
      if (mapa.observaciones == null) mapa.observaciones = i;
    }

    // Fecha Ingreso
    if (
      [
        'fecha ingreso',
        'fecha de ingreso',
        'f/ingreso',
        'f ingreso',
        'fecha_ingreso'
      ].includes(n)
    ) {
      if (mapa.fecha_ingreso == null) mapa.fecha_ingreso = i;
    }

    // Fecha Retiro
    if (
      [
        'fecha retiro',
        'fecha de retiro',
        'f/retiro',
        'f retiro',
        'fecha_retiro'
      ].includes(n)
    ) {
      if (mapa.fecha_retiro == null) mapa.fecha_retiro = i;
    }

    // F/Novedad
    if (
      [
        'f/novedad',
        'f novedad',
        'fecha novedad'
      ].includes(n)
    ) {
      if (mapa.f_novedad == null) mapa.f_novedad = i;
    }

    // Código / Cédula / Documento ID
    if (
      [
        'codigo',
        'código',
        'cedula',
        'cédula',
        'codigo/cedula',
        'codigo cedula',
        'documento id',
        'documento'
      ].includes(n)
    ) {
      if (mapa.codigo == null) mapa.codigo = i;
    }
  });

  return mapa;
}

function esCedulaValida(cedula) {
  if (!cedula) return false;
  if (cedula.length < CEDULA_MIN_DIGITOS) return false;
  if (/^[1-9]\d{0,2}$/.test(cedula)) return false;
  return true;
}

function filaTieneDatos(fila) {
  return Array.isArray(fila) && fila.some((c) => String(c ?? '').trim() !== '');
}

function puntuarFilaEncabezado(fila) {
  if (!filaTieneDatos(fila)) return 0;
  const headers = fila.map((h) => String(h).trim());
  const mapa = detectarColumnas(headers, [fila], 0);
  let score = 0;
  if (mapa.codigo != null) score += 3;
  if (mapa.nombre != null) score += 3;
  if (mapa.area != null) score += 2;
  if (mapa.cargo != null) score += 1;
  if (mapa.ubicacion != null) score += 1;
  if (mapa.observaciones != null) score += 1;
  if (mapa.novedad != null) score += 1;
  return score;
}

function detectarFilaEncabezado(filas) {
  let mejor = { idx: -1, score: 0 };
  const limite = Math.min(filas.length, MAX_FILAS_ESCANEO);
  for (let i = 0; i < limite; i++) {
    const score = puntuarFilaEncabezado(filas[i]);
    if (score >= 4 && score > mejor.score) {
      mejor = { idx: i, score };
    }
  }
  return mejor.idx;
}

function leerFilasDesdeHoja(ws) {
  return XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false,
  });
}

function leerWorkbook(rutaArchivo) {
  const ext = path.extname(rutaArchivo).toLowerCase();
  const opts = { cellDates: true, raw: true, sheetStubs: true };
  if (ext === '.csv') {
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8').replace(/^\ufeff/, '');
    return XLSX.read(contenido, { ...opts, type: 'string' });
  }
  return XLSX.readFile(rutaArchivo, opts);
}

function parsearFilasConEncabezado(filas, indiceEncabezado, nombreHoja) {
  if (indiceEncabezado < 0 || !filas[indiceEncabezado]) {
    return {
      ok: false,
      nombreHoja,
      error: 'No se detectaron encabezados válidos en esta hoja.',
      filasValidas: [],
      filasInvalidas: [],
      total: 0,
    };
  }

  const headers = filas[indiceEncabezado].map((h) => String(h).trim());
  const headersNorm = headers.map(normalizar);
  const mapa = detectarColumnas(headers, filas, indiceEncabezado);

  const faltanCols = [];
  if (mapa.codigo == null) faltanCols.push('Código/Cédula');
  if (mapa.nombre == null) faltanCols.push('Nombre');
  if (mapa.area == null) faltanCols.push('Área');

  if (faltanCols.length) {
    return {
      ok: false,
      nombreHoja,
      error: `Columnas obligatorias no encontradas: ${faltanCols.join(', ')}.`,
      columnas: headers,
      filasValidas: [],
      filasInvalidas: [],
      total: 0,
      filaEncabezado: indiceEncabezado + 1,
    };
  }

  const esTipo2 = headersNorm.some((h) =>
    ['f/novedad', 'f novedad', 'documento id', 'sueldo', 'fecha retiro'].includes(h));
  const formato = esTipo2 ? 'Tipo 2' : 'Tipo 1';

  const filasValidas = [];
  const filasInvalidas = [];

  for (let r = indiceEncabezado + 1; r < filas.length; r++) {
    const fila = filas[r];
    if (!filaTieneDatos(fila)) continue;

    const get = (campo) => (mapa[campo] != null ? String(fila[mapa[campo]] ?? '').trim() : '');

    const cedula = sanitizeCedula(get('codigo'));
    const nombre = get('nombre');
    const genero = mapa.genero != null ? get('genero') : undefined;
    const area = get('area');
    const cargo = get('cargo');
    const ubicacion = get('ubicacion');
    const observaciones = get('observaciones');
    const novedad = get('novedad');

    const estadoExcel =
      mapa.estado != null
        ? String(fila[mapa.estado] ?? '').trim()
        : '';

    const fIngresoRaw =
      mapa.fecha_ingreso != null
        ? get('fecha_ingreso')
        : '';

    const fRetiroRaw =
      mapa.fecha_retiro != null
        ? get('fecha_retiro')
        : '';

    const fNovedadRaw =
      mapa.f_novedad != null
        ? get('f_novedad')
        : '';

    const estado = normalizarEstado(
      estadoExcel || novedad
    );

    // console.log('====================================');
    // console.log('Empleado:', nombre);
    // console.log('Estado:', estado);

    // console.log('Fecha Retiro RAW:', fRetiroRaw);
    // console.log('Fecha Retiro Convertida:', convertirFecha(fRetiroRaw));

    // console.log('F/Novedad RAW:', fNovedadRaw);
    // console.log('F/Novedad Convertida:', convertirFecha(fNovedadRaw));

    // console.log('Mapa columnas:', mapa);
    // console.log('====================================');

    const fechas = resolverFechasEmpleado({
      estado,
      fechaIngreso: convertirFecha(fIngresoRaw),
      fechaRetiro: convertirFecha(fRetiroRaw),
      fNovedad: convertirFecha(fNovedadRaw),
      tieneColIngreso: mapa.fecha_ingreso != null,
      tieneColRetiro: mapa.fecha_retiro != null,
    });
    // console.log('Resultado final fechas:', fechas);

    const faltantes = [];
    if (!cedula) faltantes.push('Código/Cédula');
    else if (!esCedulaValida(cedula)) {
      faltantes.push(`Código/Cédula inválido (${cedula}) — posible columna ID/consecutivo en lugar de documento`);
    }
    if (!nombre) faltantes.push('Nombre');
    if (!area) faltantes.push('Área');

    const registro = {
      fila: r + 1,
      hojaOrigen: nombreHoja,
      cedula,
      nombre_completo: nombre,
      genero: genero || null,
      area,
      cargo: cargo || null,
      ubicacion_fisica: ubicacion || null,
      observaciones: observaciones || null,
      estado,
      fecha_ingreso: fechas.fecha_ingreso,
      fecha_retiro: fechas.fecha_retiro,
    };

    if (faltantes.length) {
      filasInvalidas.push({ ...registro, motivo: `Faltan o son inválidos: ${faltantes.join(', ')}.` });
    } else {
      filasValidas.push(registro);
    }
  }

  return {
    ok: true,
    nombreHoja,
    formato,
    columnas: headers,
    filaEncabezado: indiceEncabezado + 1,
    filasValidas,
    filasInvalidas,
    total: filasValidas.length + filasInvalidas.length,
  };
}

function parsearHoja(wb, nombreHoja) {
  const ws = wb.Sheets[nombreHoja];
  if (!ws) {
    return { ok: false, nombreHoja, error: 'La hoja no existe.', filasValidas: [], filasInvalidas: [], total: 0 };
  }
  const filas = leerFilasDesdeHoja(ws);
  if (!filas.length) {
    return { ok: false, nombreHoja, error: 'La hoja está vacía.', filasValidas: [], filasInvalidas: [], total: 0 };
  }
  const idx = detectarFilaEncabezado(filas);
  return parsearFilasConEncabezado(filas, idx, nombreHoja);
}

function resumirHoja(wb, nombreHoja) {
  const res = parsearHoja(wb, nombreHoja);
  return {
    nombre: nombreHoja,
    valida: (res.filasValidas?.length || 0) > 0 || (res.filasInvalidas?.length || 0) > 0,
    formato: res.formato || null,
    filaEncabezado: res.filaEncabezado || null,
    totalValidas: res.filasValidas?.length || 0,
    totalInvalidas: res.filasInvalidas?.length || 0,
    totalEncontrados: (res.filasValidas?.length || 0) + (res.filasInvalidas?.length || 0),
    error: res.error || null,
  };
}

/** Procesa TODAS las hojas del libro y consolida resultados con trazabilidad. */
function parsearTodasLasHojas(wb) {
  const detalleHojas = [];
  const filasValidasBrutas = [];
  const filasInvalidas = [];
  const duplicados = [];

  for (const nombreHoja of wb.SheetNames) {
    const res = parsearHoja(wb, nombreHoja);
    const resumenHoja = {
      nombre: nombreHoja,
      procesada: Boolean(res.filasValidas?.length || res.filasInvalidas?.length),
      validas: res.filasValidas?.length || 0,
      invalidas: res.filasInvalidas?.length || 0,
      encontrados: (res.filasValidas?.length || 0) + (res.filasInvalidas?.length || 0),
      error: res.error || null,
      filaEncabezado: res.filaEncabezado || null,
    };
    detalleHojas.push(resumenHoja);

    if (res.filasValidas?.length) filasValidasBrutas.push(...res.filasValidas);
    if (res.filasInvalidas?.length) {
      filasInvalidas.push(...res.filasInvalidas.map((f) => ({
        ...f,
        motivo: f.motivo?.startsWith('[') ? f.motivo : `[${nombreHoja}] ${f.motivo}`,
      })));
    }
  }

  const mapaUnicos = new Map();
  for (const f of filasValidasBrutas) {
    if (mapaUnicos.has(f.cedula)) {
      duplicados.push({
        cedula: f.cedula,
        hoja: f.hojaOrigen,
        reemplazaHoja: mapaUnicos.get(f.cedula).hojaOrigen,
      });
    }
    mapaUnicos.set(f.cedula, f);
  }

  const filasValidas = Array.from(mapaUnicos.values());

  return {
    filasValidas,
    filasInvalidas,
    resumenMultiHoja: {
      totalHojasArchivo: wb.SheetNames.length,
      hojasProcesadas: detalleHojas.filter((h) => h.procesada).length,
      hojasConRegistrosValidos: detalleHojas.filter((h) => h.validas > 0).length,
      registrosEncontrados: filasValidasBrutas.length + filasInvalidas.length,
      registrosValidosEncontrados: filasValidasBrutas.length,
      registrosUnicosAImportar: filasValidas.length,
      duplicadosConsolidados: duplicados.length,
      detalleHojas,
      duplicados,
    },
  };
}

function listarHojasValidas(wb) {
  return wb.SheetNames.map((nombre) => resumirHoja(wb, nombre)).filter((h) => h.valida);
}

function parsearArchivo(rutaArchivo, opciones = {}) {
  try {
    const wb = leerWorkbook(rutaArchivo);
    const hojasDisponibles = listarHojasValidas(wb);

    if (!hojasDisponibles.length) {
      return { ok: false, error: 'No se encontraron hojas con tablas de empleados válidas.' };
    }

    if (opciones.todasLasHojas) {
      const { filasValidas, filasInvalidas, resumenMultiHoja } = parsearTodasLasHojas(wb);
      const formatos = new Set();
      resumenMultiHoja.detalleHojas.forEach((h) => {
        const res = parsearHoja(wb, h.nombre);
        if (res.formato) formatos.add(res.formato);
      });

      if (!filasValidas.length && !filasInvalidas.length) {
        return { ok: false, error: 'Ninguna hoja contenía registros procesables.' };
      }

      return {
        ok: true,
        rutaArchivo,
        multiHoja: wb.SheetNames.length > 1,
        hojas: hojasDisponibles,
        hojaActiva: 'Todas las hojas',
        formato: formatos.size === 1 ? [...formatos][0] : 'Mixto',
        columnas: filasValidas[0] ? [] : [],
        filasValidas,
        filasInvalidas,
        total: filasValidas.length + filasInvalidas.length,
        resumenMultiHoja,
      };
    }

    const hojaActiva = opciones.hoja && wb.SheetNames.includes(opciones.hoja)
      ? opciones.hoja
      : hojasDisponibles[0].nombre;

    const resultado = parsearHoja(wb, hojaActiva);
    if (!resultado.ok && !resultado.filasValidas?.length) {
      return { ok: false, error: resultado.error || 'No se pudo procesar la hoja seleccionada.' };
    }

    return {
      ok: true,
      rutaArchivo,
      multiHoja: wb.SheetNames.length > 1,
      hojas: hojasDisponibles,
      hojaActiva,
      formato: resultado.formato,
      columnas: resultado.columnas,
      filaEncabezado: resultado.filaEncabezado,
      filasValidas: resultado.filasValidas,
      filasInvalidas: resultado.filasInvalidas,
      total: resultado.total,
    };
  } catch (err) {
    return { ok: false, error: `No se pudo leer el archivo: ${err.message}` };
  }
}

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

function normalizarValorImport(valor) {
  return valor == null ? '' : String(valor).trim();
}

function actualizarEmpleadoSiCambia(db, idEmpleado, fila, idArea, idCargo) {
  const actual = db.prepare(`
    SELECT nombre_completo, genero, estado, ubicacion_fisica, observaciones,
           fk_id_area, fk_id_cargo, fecha_ingreso, fecha_retiro
      FROM empleado WHERE id_empleado = ?
  `).get(idEmpleado);

  if (!actual) return { cambiado: false };

  const campos = [];
  const params = [];

  const nombreActual = normalizarValorImport(actual.nombre_completo);
  const nombreNuevo = normalizarValorImport(fila.nombre_completo);
  if (nombreActual !== nombreNuevo) {
    campos.push('nombre_completo = ?');
    params.push(nombreNuevo);
  }

  const estadoActual = normalizarValorImport(actual.estado);
  const estadoNuevo = normalizarValorImport(fila.estado);
  if (estadoActual !== estadoNuevo) {
    campos.push('estado = ?');
    params.push(estadoNuevo);
  }

  const generoActual = normalizarValorImport(actual.genero) || null;
  const generoNuevo = fila.genero === undefined ? undefined : normalizarValorImport(fila.genero) || null;
  if (generoNuevo !== undefined && generoActual !== generoNuevo) {
    campos.push('genero = ?');
    params.push(generoNuevo);
  }

  const ubicActual = normalizarValorImport(actual.ubicacion_fisica) || null;
  const ubicNueva = normalizarValorImport(fila.ubicacion_fisica) || null;
  if (ubicActual !== ubicNueva) {
    campos.push('ubicacion_fisica = ?');
    params.push(ubicNueva);
  }

  const obsActual = normalizarValorImport(actual.observaciones) || null;
  const obsNueva = normalizarValorImport(fila.observaciones) || null;
  if (obsActual !== obsNueva) {
    campos.push('observaciones = ?');
    params.push(obsNueva);
  }

  const areaActual = actual.fk_id_area == null ? null : actual.fk_id_area;
  if (areaActual !== idArea) {
    campos.push('fk_id_area = ?');
    params.push(idArea);
  }

  const cargoActual = actual.fk_id_cargo == null ? null : actual.fk_id_cargo;
  if (cargoActual !== idCargo) {
    campos.push('fk_id_cargo = ?');
    params.push(idCargo);
  }

  const ingresoActual = actual.fecha_ingreso || null;
  const ingresoNuevo = fila.fecha_ingreso || null;
  if (ingresoActual !== ingresoNuevo) {
    campos.push('fecha_ingreso = ?');
    params.push(ingresoNuevo);
  }

  const retiroActual = actual.fecha_retiro || null;
  const retiroNuevo = fila.fecha_retiro || null;
  if (retiroActual !== retiroNuevo) {
    campos.push('fecha_retiro = ?');
    params.push(retiroNuevo);
  }

  if (!campos.length) {
    return { cambiado: false };
  }

  campos.push("updatedAt = datetime('now','localtime')");
  const sql = `UPDATE empleado SET ${campos.join(', ')} WHERE id_empleado = ?`;
  params.push(idEmpleado);
  db.prepare(sql).run(...params);

  return { cambiado: true };
}

function importarEmpleados(filasValidas, idUsuario = null) {
  const db = getDb();
  let insertados = 0;
  let actualizados = 0;
  const errores = [];
  const omitidos = [];
  const actualizadosDetalle = [];
  const insertadosDetalle = [];

  const tx = db.transaction(() => {
    for (const fila of filasValidas) {
      try {
        if (!esCedulaValida(fila.cedula)) {
          omitidos.push({
            cedula: fila.cedula,
            nombre: fila.nombre_completo,
            hoja: fila.hojaOrigen,
            motivo: 'Cédula inválida o demasiado corta (posible ID de fila).',
          });
          continue;
        }

        const idArea = buscarOCrearArea(db, fila.area);
        const idCargo = buscarOCrearCargo(db, fila.cargo, idArea);
        const existente = db.prepare('SELECT id_empleado FROM empleado WHERE cedula = ?').get(fila.cedula);

        if (existente) {
          const resultado = actualizarEmpleadoSiCambia(db, existente.id_empleado, fila, idArea, idCargo);
          if (!resultado.cambiado) {
            omitidos.push({
              cedula: fila.cedula,
              nombre: fila.nombre_completo,
              hoja: fila.hojaOrigen,
              motivo: 'Registro existente sin cambios.',
            });
            continue;
          }
          actualizados++;
          actualizadosDetalle.push({ cedula: fila.cedula, nombre: fila.nombre_completo, hoja: fila.hojaOrigen });
        } else {
          db.prepare(`
            INSERT INTO empleado
              (cedula, nombre_completo, genero, estado, ubicacion_fisica, observaciones, fk_id_area,
               fk_id_cargo, fecha_ingreso, fecha_retiro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(
              fila.cedula,
              fila.nombre_completo,
              fila.genero || null,
              fila.estado,
              fila.ubicacion_fisica || null,
              fila.observaciones || null,
              idArea,
              idCargo,
              fila.fecha_ingreso,
              fila.fecha_retiro,
            );
          insertados++;
          insertadosDetalle.push({ cedula: fila.cedula, nombre: fila.nombre_completo, hoja: fila.hojaOrigen });
        }
      } catch (e) {
        errores.push({ cedula: fila.cedula, nombre: fila.nombre_completo, hoja: fila.hojaOrigen, motivo: e.message });
      }
    }
  });

  try {
    tx();
    const exitosos = insertados + actualizados;
    actividadRepo.registrar({
      accion: 'importacion',
      detalle: `Importación: ${insertados} nuevos, ${actualizados} actualizados, ${omitidos.length} omitidos`,
      entidad: 'empleado', fk_id_usuario: idUsuario,
    });
    return {
      ok: true,
      data: {
        registrosProcesados: filasValidas.length,
        insertados,
        actualizados,
        omitidos,
        errores,
        insertadosDetalle,
        actualizadosDetalle,
        resumen: {
          registrosRecibidos: filasValidas.length,
          registrosProcesados: filasValidas.length,
          registrosImportados: exitosos,
          insertados,
          actualizados,
          omitidos: omitidos.length,
          errores: errores.length,
        },
      },
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** Columnas de exportación en orden fijo (evita desalineación en Excel/CSV). */
const COLUMNAS_EXPORT = [
  { clave: 'cedula', encabezado: 'Cédula' },
  { clave: 'nombre_completo', encabezado: 'Nombre' },
  { clave: 'nom_area', encabezado: 'Área' },
  { clave: 'nom_cargo', encabezado: 'Cargo' },
  { clave: 'genero', encabezado: 'Género' },
  { clave: 'camisa', encabezado: 'Talla Camisa' },
  { clave: 'pantalon', encabezado: 'Talla Pantalón' },
  { clave: 'calzado', encabezado: 'Talla Zapato' },
  { clave: 'fecha_ingreso', encabezado: 'Fecha Ingreso' },
  { clave: 'fecha_retiro', encabezado: 'Fecha Retiro' },
  { clave: 'estado', encabezado: 'Estado' },
  { clave: 'ubicacion_fisica', encabezado: 'Ubicación Física' },
  { clave: 'observaciones', encabezado: 'Observaciones' },
];

function exportarEmpleados(filtro, formato, rutaDestino, area = null, cargo = null, columnas = []) {
  try {
    const db = getDb();
    const columnasPermitidas = new Set(COLUMNAS_EXPORT.map((col) => col.clave));
    const columnasValidas = Array.isArray(columnas)
      ? columnas
          .map((c) => String(c || '').trim())
          .filter((c) => c && columnasPermitidas.has(c))
      : [];
    const columnasFinales = Array.from(new Set(['cedula', 'nombre_completo', ...columnasValidas]));
    const columnasSeleccionadas = COLUMNAS_EXPORT.filter((c) => columnasFinales.includes(c.clave));

    const COLUMNAS_QUERY = {
      nom_area: "COALESCE(ad.nom_area, ac.nom_area, '') AS nom_area",
      nom_cargo: "COALESCE(c.nom_cargo, '') AS nom_cargo",
      genero: "COALESCE(e.genero, '') AS genero",
      camisa: "COALESCE(t.camisa, '') AS camisa",
      pantalon: "COALESCE(t.pantalon, '') AS pantalon",
      calzado: "COALESCE(t.calzado, '') AS calzado",
      estado: 'e.estado',
      ubicacion_fisica: "COALESCE(e.ubicacion_fisica, '') AS ubicacion_fisica",
      observaciones: "COALESCE(e.observaciones, '') AS observaciones",
      cedula: 'e.cedula',
      nombre_completo: 'e.nombre_completo',
      fecha_ingreso: 'e.fecha_ingreso',
      fecha_retiro: 'e.fecha_retiro',
    };

    const columnasQuery = columnasSeleccionadas
      .map((col) => COLUMNAS_QUERY[col.clave])
      .filter(Boolean);

    if (!columnasQuery.length) {
      return { ok: false, error: 'No hay columnas válidas para exportar.' };
    }

    let whereClauses = [];
    if (filtro === 'activos') whereClauses.push("e.estado = 'Activo'");
    else if (filtro === 'retirados') whereClauses.push("e.estado = 'Retirado'");
    if (area) whereClauses.push('e.fk_id_area = ?');
    if (cargo) whereClauses.push('e.fk_id_cargo = ?');

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const params = [];
    if (area) params.push(area);
    if (cargo) params.push(cargo);

    const filas = db.prepare(`
      SELECT ${columnasQuery.join(', ')}
      FROM empleado e
      LEFT JOIN cargo c  ON c.id_cargo = e.fk_id_cargo
      LEFT JOIN area ad  ON ad.id_area = e.fk_id_area
      LEFT JOIN area ac  ON ac.id_area = c.fk_id_area
      LEFT JOIN talla t  ON t.id_talla = e.fk_id_talla
      ${where}
      ORDER BY COALESCE(ad.nom_area, ac.nom_area, ''), e.nombre_completo ASC`
    ).all(...params);

    const encabezados = columnasSeleccionadas.map((c) => c.encabezado);
    const datos = filas.map((fila) => columnasSeleccionadas.map(({ clave }) => {
      if (clave === 'fecha_ingreso') return formatearFechaExport(fila.fecha_ingreso);
      if (clave === 'fecha_retiro') return formatearFechaExport(fila.fecha_retiro);
      return fila[clave] ?? '';
    }));

    const ws = XLSX.utils.aoa_to_sheet([encabezados, ...datos]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empleados');

    if (formato === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      fs.writeFileSync(rutaDestino, '\ufeff' + csv, 'utf8');
    } else {
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      fs.writeFileSync(rutaDestino, buffer);
    }

    return { ok: true, data: { total: filas.length, ruta: rutaDestino, filtro, area, cargo, columnas: columnasValidas } };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  parsearArchivo,
  importarEmpleados,
  exportarEmpleados,
  convertirFecha,
  formatearFechaExport,
  resolverFechasEmpleado,
  detectarFilaEncabezado,
  detectarColumnas,
  esCedulaValida,
  COLUMNAS_EXPORT,
};
