/**
 * api.js
 * Capa de acceso del renderer hacia el proceso principal.
 *
 * - En la app de escritorio (Electron) usa `window.api` expuesta por preload.js,
 *   que se comunica por IPC con los controladores y SQLite.
 * - En el navegador (Vite sin Electron) usa datos simulados (mockData) para
 *   poder previsualizar la interfaz. Esto NO afecta a la app empaquetada.
 */

import {
  MOCK_USUARIOS, MOCK_DASHBOARD, MOCK_AREAS, MOCK_CARGOS, MOCK_UBICACIONES,
  MOCK_EMPLEADOS, MOCK_INVENTARIO, MOCK_VARIANTES, MOCK_ENTREGAS,
  MOCK_DETALLE_ENTREGA, MOCK_HISTORIAL, MOCK_DB_INFO,
} from './mockData';

const enElectron = typeof window !== 'undefined' && !!window.api;

// Roles simulados para la vista previa en navegador
const MOCK_ROLES = [
  { id_rol: 1, nombre: 'Desarrollador', descripcion: 'Acceso total al sistema', estado: 'Activo' },
  { id_rol: 2, nombre: 'Administrador', descripcion: 'Gestión de operaciones y catálogos', estado: 'Activo' },
  { id_rol: 3, nombre: 'Operador', descripcion: 'Registro de entregas y consultas', estado: 'Activo' },
];

// Simula la latencia de IPC para el modo navegador
const demora = (data, ms = 180) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

/* ─── Implementación simulada (modo navegador) ─────────────────────── */
const mockApi = {
  auth: {
    async login({ username, password }) {
      const u = MOCK_USUARIOS.find((x) => x.username === username);
      const okPass =
        (username === 'admin' && password === 'admin123') ||
        (username === 'pcastillo' && password === 'coodetrans');
      if (u && okPass) {
        const { password: _p, ...safe } = u;
        return demora({ ok: true, data: safe });
      }
      return demora({ ok: false, error: 'Usuario o contraseña incorrectos.' });
    },
  },
  dashboard: {
    obtenerResumen: () => demora({ ok: true, data: MOCK_DASHBOARD }),
  },
  catalogos: {
    areas: () => demora({ ok: true, data: MOCK_AREAS }),
    areasActivas: () => demora({ ok: true, data: MOCK_AREAS }),
    cargos: () => demora({ ok: true, data: MOCK_CARGOS }),
    cargosActivos: () => demora({ ok: true, data: MOCK_CARGOS.filter((c) => c.estado === 'Activo') }),
    ubicaciones: () => demora({ ok: true, data: MOCK_UBICACIONES }),
    crearArea: () => demora({ ok: true, data: { id_area: 99 } }),
    actualizarArea: () => demora({ ok: true }),
    cambiarEstadoArea: () => demora({ ok: true }),
    crearCargo: () => demora({ ok: true, data: { id_cargo: 99 } }),
    actualizarCargo: () => demora({ ok: true }),
    cambiarEstadoCargo: () => demora({ ok: true }),
  },
  empleados: {
    listar: () => demora({ ok: true, data: MOCK_EMPLEADOS }),
    obtener: (id) => demora({ ok: true, data: MOCK_EMPLEADOS.find((e) => e.id_empleado === id) || null }),
    crear: () => demora({ ok: true, data: { id_empleado: 99 } }),
    actualizar: () => demora({ ok: true }),
    historial: () => demora({ ok: true, data: MOCK_HISTORIAL }),
  },
  inventario: {
    listar: () => demora({ ok: true, data: MOCK_INVENTARIO }),
    resumen: () => demora({ ok: true, data: MOCK_DASHBOARD.stockPorArea }),
    variantes: () => demora({ ok: true, data: MOCK_VARIANTES }),
    crearArticulo: () => demora({ ok: true, data: { id_articulo: 99 } }),
    actualizarArticulo: () => demora({ ok: true }),
    eliminarArticulo: () => demora({ ok: true }),
    crearVariante: () => demora({ ok: true, data: { id_stock_variante: 99 } }),
    ajustarStock: () => demora({ ok: true }),
    eliminarVariante: () => demora({ ok: true }),
  },
  roles: {
    listar: () => demora({ ok: true, data: MOCK_ROLES }),
    listarActivos: () => demora({ ok: true, data: MOCK_ROLES.filter((r) => r.estado === 'Activo') }),
    crear: () => demora({ ok: true, data: { id_rol: 99 } }),
    actualizar: () => demora({ ok: true }),
    cambiarEstado: () => demora({ ok: true }),
  },
  importExport: {
    seleccionarArchivo: () => demora({ ok: false, error: 'La importación solo está disponible en la app de escritorio.' }),
    previsualizar: () => demora({ ok: false, error: 'La importación solo está disponible en la app de escritorio.' }),
    confirmar: () => demora({ ok: false, error: 'La importación solo está disponible en la app de escritorio.' }),
    exportar: () => demora({ ok: false, error: 'La exportación solo está disponible en la app de escritorio.' }),
    descargarPlantilla: () => demora({ ok: false, error: 'La descarga de plantilla solo está disponible en la app de escritorio.' }),
  },
  movimientos: {
    listar: () => demora({ ok: true, data: MOCK_DASHBOARD.actividades }),
    listarEntregas: () => demora({ ok: true, data: MOCK_ENTREGAS }),
    detalleEntrega: () => demora({ ok: true, data: MOCK_DETALLE_ENTREGA }),
    crearEntrega: () => demora({ ok: true, data: { id_entrega: 99 } }),
  },
  usuarios: {
    listar: () => demora({ ok: true, data: MOCK_USUARIOS }),
    crear: () => demora({ ok: true, data: { id_usuario: 99 } }),
    actualizar: () => demora({ ok: true }),
    cambiarEstado: () => demora({ ok: true }),
  },
  bd: {
    info: () => demora({ ok: true, data: MOCK_DB_INFO }),
    backup: () => demora({ ok: false, error: 'La copia de seguridad solo está disponible en la app de escritorio.' }),
    restore: () => demora({ ok: false, error: 'La restauración solo está disponible en la app de escritorio.' }),
  },
};

// API unificada: real si hay Electron, simulada en caso contrario
export const api = enElectron ? window.api : mockApi;
export const ES_ELECTRON = enElectron;
