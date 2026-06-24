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

/** Normaliza texto para búsqueda insensible a acentos. */
export function normalizarBusqueda(txt) {
  return String(txt ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Comprueba si un empleado coincide con la consulta en todos los campos buscables. */
export function empleadoCoincideBusqueda(empleado, query) {
  if (!query) return true;
  const q = normalizarBusqueda(query);
  const campos = [
    empleado.nombre_completo,
    empleado.cedula,
    sanitizeCedula(empleado.cedula),
    empleado.ubicacion_fisica,
    empleado.observaciones,
    empleado.nom_area,
    empleado.nom_cargo,
  ];
  return campos.some((c) => normalizarBusqueda(c).includes(q));
}
