/**
 * preload.js
 * Puente seguro (contextBridge) entre el proceso de renderizado (React) y
 * el proceso principal (Node.js). Expone una API mínima y controlada bajo
 * `window.api`. El renderer NUNCA accede directamente a Node ni a la BD.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Helper para invocar canales IPC de forma uniforme
const invoke = (canal, payload) => ipcRenderer.invoke(canal, payload);

contextBridge.exposeInMainWorld('api', {
  // Autenticación
  auth: {
    login: (credenciales) => invoke('auth:login', credenciales),
  },

  // Dashboard
  dashboard: {
    obtenerResumen: () => invoke('dashboard:resumen'),
  },

  // Catálogos / datos maestros
  catalogos: {
    areas: () => invoke('catalogo:areas'),
    areasActivas: () => invoke('catalogo:areasActivas'),
    cargos: () => invoke('catalogo:cargos'),
    cargosActivos: () => invoke('catalogo:cargosActivos'),
    ubicaciones: () => invoke('catalogo:ubicaciones'),
    crearArea: (datos, idUsuario) => invoke('area:crear', { datos, idUsuario }),
    actualizarArea: (id, datos, idUsuario) => invoke('area:actualizar', { id, datos, idUsuario }),
    cambiarEstadoArea: (id, estado, idUsuario) => invoke('area:estado', { id, estado, idUsuario }),
    crearCargo: (datos, idUsuario) => invoke('cargo:crear', { datos, idUsuario }),
    actualizarCargo: (id, datos, idUsuario) => invoke('cargo:actualizar', { id, datos, idUsuario }),
    cambiarEstadoCargo: (id, estado, idUsuario) => invoke('cargo:estado', { id, estado, idUsuario }),
  },

  // Empleados (carpetas)
  empleados: {
    listar: () => invoke('empleado:listar'),
    obtener: (id) => invoke('empleado:obtener', id),
    crear: (datos, idUsuario) => invoke('empleado:crear', { datos, idUsuario }),
    actualizar: (id, datos, idUsuario) => invoke('empleado:actualizar', { id, datos, idUsuario }),
    historial: (id) => invoke('empleado:historial', id),
  },

  // Inventario (consulta + administración CRUD de dotaciones)
  inventario: {
    listar: () => invoke('inventario:listar'),
    resumen: () => invoke('inventario:resumen'),
    variantes: () => invoke('inventario:variantes'),
    crearArticulo: (datos, idUsuario) => invoke('inventario:crearArticulo', { datos, idUsuario }),
    actualizarArticulo: (id, datos, idUsuario) => invoke('inventario:actualizarArticulo', { id, datos, idUsuario }),
    eliminarArticulo: (id, idUsuario) => invoke('inventario:eliminarArticulo', { id, idUsuario }),
    crearVariante: (datos, idUsuario) => invoke('inventario:crearVariante', { datos, idUsuario }),
    ajustarStock: (datos, idUsuario) => invoke('inventario:ajustarStock', { datos, idUsuario }),
    eliminarVariante: (id, idUsuario) => invoke('inventario:eliminarVariante', { id, idUsuario }),
  },

  // Movimientos / entregas
  movimientos: {
    listar: (limite) => invoke('movimiento:listar', limite),
    listarEntregas: (filtros) => invoke('entrega:listar', filtros),
    detalleEntrega: (id) => invoke('entrega:detalle', id),
    crearEntrega: (datos, idUsuario) => invoke('entrega:crear', { datos, idUsuario }),
  },

  // Usuarios (configuración)
  usuarios: {
    listar: () => invoke('usuario:listar'),
    crear: (datos, idUsuario) => invoke('usuario:crear', { datos, idUsuario }),
    actualizar: (id, datos, idUsuario) => invoke('usuario:actualizar', { id, datos, idUsuario }),
    cambiarEstado: (id, estado, idUsuario) => invoke('usuario:estado', { id, estado, idUsuario }),
  },

  // Roles dinámicos
  roles: {
    listar: () => invoke('rol:listar'),
    listarActivos: () => invoke('rol:listarActivos'),
    crear: (datos, idUsuario) => invoke('rol:crear', { datos, idUsuario }),
    actualizar: (id, datos, idUsuario) => invoke('rol:actualizar', { id, datos, idUsuario }),
    cambiarEstado: (id, estado, idUsuario) => invoke('rol:estado', { id, estado, idUsuario }),
  },

  // Importación / Exportación de empleados (Excel / CSV)
  importExport: {
    seleccionarArchivo: () => invoke('import:seleccionar'),
    previsualizar: (ruta, opciones = {}) => invoke('import:previsualizar', { ruta, ...opciones }),
    confirmar: (filasValidas, idUsuario) => invoke('import:confirmar', { filasValidas, idUsuario }),
    exportar: (filtro, formato, area, cargo, columnas) => invoke('export:empleados', { filtro, formato, area, cargo, columnas }),
    descargarPlantilla: () => invoke('template:download'),
  },

  // Base de datos (copia de seguridad / restauración)
  bd: {
    info: () => invoke('db:info'),
    backup: () => invoke('db:backup'),
    restore: () => invoke('db:restore'),
    onRestored: (callback) => {
      const listener = (_event) => callback();
      ipcRenderer.on('db:restored', listener);
      return () => ipcRenderer.removeListener('db:restored', listener);
    },
  },

  // Se aplica para version global (hace que en todo el aplicativo se actualice en version actualizada)
  app: {
    version: () => invoke('app:get-version'),
  },

  // Actualizaciones por parte del repositorio de github
  update: {
    disponible: (callback) => {
      const listener = (_, data) => callback(data);

      ipcRenderer.on('update:available', listener);

      return () => {
        ipcRenderer.removeListener(
          'update:available',
          listener
        );
      };
    },

    descargada: (callback) => {
      const listener = (_, data) => callback(data);

      ipcRenderer.on('update:downloaded', listener);

      return () => {
        ipcRenderer.removeListener(
          'update:downloaded',
          listener
        );
      };
    },

    progreso: (callback) => {
      const listener = (_, data) => callback(data);

      ipcRenderer.on('update:download-progress', listener);

      return () => {
        ipcRenderer.removeListener(
          'update:download-progress',
          listener
        );
      };
    },

    error: (callback) => {
      const listener = (_, data) => callback(data);

      ipcRenderer.on('update:error', listener);

      return () => {
        ipcRenderer.removeListener(
          'update:error',
          listener
        );
      };
    },

    instalar: () => invoke('update:install'),
  },
});
