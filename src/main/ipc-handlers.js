/**
 * ipc-handlers.js
 * Registra todos los manejadores IPC (ipcMain.handle) que conectan la API
 * expuesta en preload.js con la capa de controladores (lógica de negocio).
 *
 * Cada handler delega en el controlador correspondiente y devuelve el
 * resultado en el formato { ok, data?, error? }.
 */

const { ipcMain, dialog, BrowserWindow, app } = require('electron');
const path = require('path');
const {
  authController,
  dashboardController,
  catalogoController,
  empleadoController,
  inventarioController,
  movimientoController,
  usuarioController,
  rolController,
  importExportController,
  dbController,
} = require('../controllers/controllers');

function registrarHandlersIPC({ reiniciarTrasRestauracionBD } = {}) {
  /* ── Autenticación ── */
  ipcMain.handle('auth:login', (_e, credenciales) => authController.login(credenciales));

  /* ── Dashboard ── */
  ipcMain.handle('dashboard:resumen', () => dashboardController.obtenerResumen());

  /* ── Catálogos / datos maestros ── */
  ipcMain.handle('catalogo:areas', () => catalogoController.listarAreas());
  ipcMain.handle('catalogo:areasActivas', () => catalogoController.listarAreasActivas());
  ipcMain.handle('catalogo:cargos', () => catalogoController.listarCargos());
  ipcMain.handle('catalogo:cargosActivos', () => catalogoController.listarCargosActivos());
  ipcMain.handle('catalogo:ubicaciones', () => catalogoController.listarUbicaciones());

  // Áreas (CRUD)
  ipcMain.handle('area:crear', (_e, { datos, idUsuario }) => catalogoController.crearArea(datos, idUsuario));
  ipcMain.handle('area:actualizar', (_e, { id, datos, idUsuario }) => catalogoController.actualizarArea(id, datos, idUsuario));
  ipcMain.handle('area:estado', (_e, { id, estado, idUsuario }) => catalogoController.cambiarEstadoArea(id, estado, idUsuario));

  // Cargos (CRUD)
  ipcMain.handle('cargo:crear', (_e, { datos, idUsuario }) => catalogoController.crearCargo(datos, idUsuario));
  ipcMain.handle('cargo:actualizar', (_e, { id, datos, idUsuario }) => catalogoController.actualizarCargo(id, datos, idUsuario));
  ipcMain.handle('cargo:estado', (_e, { id, estado, idUsuario }) => catalogoController.cambiarEstadoCargo(id, estado, idUsuario));

  /* ── Empleados (carpetas) ── */
  ipcMain.handle('empleado:listar', () => empleadoController.listar());
  ipcMain.handle('empleado:obtener', (_e, id) => empleadoController.obtener(id));
  ipcMain.handle('empleado:crear', (_e, { datos, idUsuario }) => empleadoController.crear(datos, idUsuario));
  ipcMain.handle('empleado:actualizar', (_e, { id, datos, idUsuario }) => empleadoController.actualizar(id, datos, idUsuario));
  ipcMain.handle('empleado:historial', (_e, id) => empleadoController.historial(id));

  /* ── Inventario (consulta) ── */
  ipcMain.handle('inventario:listar', () => inventarioController.listar());
  ipcMain.handle('inventario:resumen', () => inventarioController.resumenPorArea());
  ipcMain.handle('inventario:variantes', () => inventarioController.listarVariantes());

  /* ── Inventario (administración / CRUD de dotaciones) ── */
  ipcMain.handle('inventario:crearArticulo', (_e, { datos, idUsuario }) => inventarioController.crearArticulo(datos, idUsuario));
  ipcMain.handle('inventario:actualizarArticulo', (_e, { id, datos, idUsuario }) => inventarioController.actualizarArticulo(id, datos, idUsuario));
  ipcMain.handle('inventario:eliminarArticulo', (_e, { id, idUsuario }) => inventarioController.eliminarArticulo(id, idUsuario));
  ipcMain.handle('inventario:crearVariante', (_e, { datos, idUsuario }) => inventarioController.crearVariante(datos, idUsuario));
  ipcMain.handle('inventario:ajustarStock', (_e, { datos, idUsuario }) => inventarioController.ajustarStock(datos, idUsuario));
  ipcMain.handle('inventario:eliminarVariante', (_e, { id, idUsuario }) => inventarioController.eliminarVariante(id, idUsuario));

  /* ── Roles dinámicos ── */
  ipcMain.handle('rol:listar', () => rolController.listar());
  ipcMain.handle('rol:listarActivos', () => rolController.listarActivos());
  ipcMain.handle('rol:crear', (_e, { datos, idUsuario }) => rolController.crear(datos, idUsuario));
  ipcMain.handle('rol:actualizar', (_e, { id, datos, idUsuario }) => rolController.actualizar(id, datos, idUsuario));
  ipcMain.handle('rol:estado', (_e, { id, estado, idUsuario }) => rolController.cambiarEstado(id, estado, idUsuario));

  /* ── Importación / Exportación de empleados (Excel / CSV) ── */
  ipcMain.handle('import:seleccionar', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Seleccionar archivo de empleados',
      properties: ['openFile'],
      filters: [{ name: 'Excel / CSV', extensions: ['xlsx', 'xls', 'csv'] }],
    });
    if (canceled || !filePaths || !filePaths.length) return { ok: false, error: 'Operación cancelada.' };
    return importExportController.previsualizar(filePaths[0]);
  });

  ipcMain.handle('import:previsualizar', (_e, { ruta, hoja, todasLasHojas } = {}) =>
    importExportController.previsualizar(ruta, { hoja, todasLasHojas }));

  ipcMain.handle('import:confirmar', (_e, { filasValidas, idUsuario }) =>
    importExportController.confirmar(filasValidas, idUsuario));

  ipcMain.handle('export:empleados', async (_e, { filtro = 'todos', formato = 'xlsx' } = {}) => {
    const win = BrowserWindow.getFocusedWindow();
    const fecha = new Date().toISOString().slice(0, 10);
    const ext = formato === 'csv' ? 'csv' : 'xlsx';
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Exportar empleados',
      defaultPath: path.join(app.getPath('documents'), `empleados-${filtro}-${fecha}.${ext}`),
      filters: [{ name: ext === 'csv' ? 'CSV' : 'Excel', extensions: [ext] }],
    });
    if (canceled || !filePath) return { ok: false, error: 'Operación cancelada.' };
    return importExportController.exportar({ filtro, formato: ext, rutaDestino: filePath });
  });

  /* ── Movimientos / entregas ── */
  ipcMain.handle('movimiento:listar', (_e, limite) => movimientoController.listar(limite));
  ipcMain.handle('entrega:listar', (_e, filtros) => movimientoController.listarEntregas(filtros));
  ipcMain.handle('entrega:detalle', (_e, id) => movimientoController.detalleEntrega(id));
  ipcMain.handle('entrega:crear', (_e, { datos, idUsuario }) => movimientoController.crearEntrega(datos, idUsuario));

  /* ── Usuarios (configuración) ── */
  ipcMain.handle('usuario:listar', () => usuarioController.listar());
  ipcMain.handle('usuario:crear', (_e, { datos, idUsuario }) => usuarioController.crear(datos, idUsuario));
  ipcMain.handle('usuario:actualizar', (_e, { id, datos, idUsuario }) => usuarioController.actualizar(id, datos, idUsuario));
  ipcMain.handle('usuario:estado', (_e, { id, estado, idUsuario }) => usuarioController.cambiarEstado(id, estado, idUsuario));

  /* ── Base de datos (copia de seguridad / restauración / info) ── */
  ipcMain.handle('db:info', () => dbController.info());

  ipcMain.handle('db:backup', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const fecha = new Date().toISOString().slice(0, 10);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Guardar copia de seguridad',
      defaultPath: path.join(app.getPath('documents'), `coodetrans-backup-${fecha}.db`),
      filters: [{ name: 'Base de datos SQLite', extensions: ['db'] }],
    });
    if (canceled || !filePath) return { ok: false, error: 'Operación cancelada.' };
    return dbController.backup(filePath);
  });

  ipcMain.handle('db:restore', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Restaurar base de datos',
      properties: ['openFile'],
      filters: [{ name: 'Base de datos SQLite', extensions: ['db'] }],
    });
    if (canceled || !filePaths || !filePaths.length) return { ok: false, error: 'Operación cancelada.' };

    const confirm = await dialog.showMessageBox(win, {
      type: 'warning',
      buttons: ['Cancelar', 'Restaurar y reiniciar'],
      defaultId: 0,
      cancelId: 0,
      title: 'Confirmar restauración',
      message: '¿Está seguro de restaurar la base de datos?',
      detail: 'Se reemplazarán todos los datos actuales por los del archivo seleccionado. La aplicación se reiniciará al finalizar.',
    });
    if (confirm.response !== 1) return { ok: false, error: 'Operación cancelada.' };

    const res = dbController.restore(filePaths[0]);
    if (res.ok && typeof reiniciarTrasRestauracionBD === 'function') {
      reiniciarTrasRestauracionBD();
      return { ...res, data: { ...res.data, reinicio: 'ok' } };
    }
    return res;
  });

  console.log('[IPC] Manejadores registrados correctamente.');
}

module.exports = { registrarHandlersIPC };
