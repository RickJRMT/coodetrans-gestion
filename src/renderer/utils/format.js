/**
 * Utilidades de formato y sanitización para campos de empleados.
 */

/** Elimina todo excepto dígitos (valor almacenado en BD). */
export function sanitizeCedula(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/** Formato visual con separadores de miles (solo presentación). */
export function formatCedula(cedula) {
  const digits = sanitizeCedula(cedula);
  if (!digits) return '—';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Convierte tallas a MAYÚSCULAS. */
export function formatTalla(value) {
  return String(value ?? '').toUpperCase();
}

/**
 * Capitaliza nombres: primera letra mayúscula, resto minúscula.
 * Ej: "PEREZ JUAN" -> "Perez Juan"
 */
export function capitalizarNombre(nombre) {
  if (!nombre) return '';
  return String(nombre)
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Capitaliza un nombre sin modificar el valor en la BD.
 * Se usa para presentación en tablas, tarjetas, etc.
 */
export function formatNombre(nombre) {
  return capitalizarNombre(nombre) || '—';
}

/** Normaliza texto para búsqueda insensible a acentos. */
export function normalizarBusqueda(txt) {
  return String(txt ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** 
 * Comprueba si un empleado coincide con la consulta en todos los campos buscables.
 * Normaliza acentos, mayúsculas y espacios para búsquedas robustas.
 * 
 * @param {Object} empleado - Objeto empleado con campos de búsqueda
 * @param {string} query - Texto a buscar
 * @returns {boolean} true si coincide con algún campo
 */
export function empleadoCoincideBusqueda(empleado, query) {
  if (!query || !query.trim()) return true;
  const q = normalizarBusqueda(query);

  // Campos en los que buscar, incluyendo variantes
  const campos = [
    empleado.nombre_completo,
    empleado.cedula,
    sanitizeCedula(empleado.cedula),
    empleado.ubicacion_fisica,
    empleado.observaciones,
    empleado.nom_area,
    empleado.nom_cargo,
    empleado.genero,
    empleado.estado,
  ];

  // Retornar true si la búsqueda coincide con ALGÚN campo
  return campos.some((c) => {
    if (!c) return false;
    return normalizarBusqueda(c).includes(q);
  });
}

/**
 * Búsqueda simple para entregas: texto normalizado con soporte para múltiples campos.
 * Usada en tablas de entregas y listas donde se necesita búsqueda rápida.
 * 
 * @param {Object} item - Objeto con campos de búsqueda
 * @param {string} query - Texto a buscar (ya normalizado)
 * @param {Array<string>} campos - Campos del objeto donde buscar
 * @returns {boolean} true si coincide
 */
export function coincideBusqueda(item, query, campos = []) {
  if (!query || !query.trim()) return true;
  if (campos.length === 0) return false;

  const q = normalizarBusqueda(query);
  return campos.some((field) => {
    const valor = item[field];
    if (!valor) return false;
    return normalizarBusqueda(String(valor)).includes(q);
  });
}
