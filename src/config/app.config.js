/**
 * app.config.js
 * ------------------------------------------------------------------
 * Configuración general de la aplicación Coodetrans.
 *
 * USUARIO INICIAL DEL SISTEMA
 *   La aplicación se instala COMPLETAMENTE VACÍA (sin empleados, inventario,
 *   áreas, cargos ni movimientos). El único usuario predefinido es el
 *   usuario "Programador" (rol "Desarrollador", sin empleado vinculado).
 *
 *   La contraseña de este usuario es CONFIGURABLE:
 *     1. Mediante la variable de entorno  COODETRANS_DEV_PASSWORD
 *        (recomendado en producción / instalaciones).
 *     2. O modificando el valor por defecto `passwordPorDefecto` aquí abajo.
 *
 *   Ejemplo (Windows PowerShell):
 *     $env:COODETRANS_DEV_PASSWORD="MiClaveSegura"
 *   Ejemplo (Linux/macOS):
 *     export COODETRANS_DEV_PASSWORD="MiClaveSegura"
 * ------------------------------------------------------------------
 */

const USUARIO_INICIAL = {
  username: 'Programador',
  rol: 'Desarrollador',
  // Empleado vinculado: NULL (el usuario inicial no representa a un empleado).
  fk_id_empleado: null,
  estado: 'Activo',
  // 🔑 Cambie esta contraseña o defina COODETRANS_DEV_PASSWORD en el entorno.
  passwordPorDefecto: 'Coodetrans2026',
};

/** Devuelve la contraseña efectiva del usuario inicial. */
function getPasswordUsuarioInicial() {
  return process.env.COODETRANS_DEV_PASSWORD || USUARIO_INICIAL.passwordPorDefecto;
}

// Roles iniciales mínimos (administrables luego desde Configuración → Roles).
const ROLES_INICIALES = [
  { nombre: 'Desarrollador', descripcion: 'Acceso total al sistema (RickLabs).' },
  { nombre: 'Admin', descripcion: 'Gestión completa de la operación.' },
];

module.exports = {
  USUARIO_INICIAL,
  ROLES_INICIALES,
  getPasswordUsuarioInicial,
};
