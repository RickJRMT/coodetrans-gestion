/**
 * mockData.js
 * Datos simulados que reflejan la salida real de los controladores.
 * Solo se utilizan cuando la app corre en el navegador (Vite) SIN Electron,
 * para poder previsualizar la interfaz. En la app de escritorio real,
 * los datos provienen de SQLite mediante window.api (IPC).
 */

export const MOCK_USUARIOS = [
  { id_usuario: 1, username: 'admin', rol: 'Administrador', password: 'sha256$admin', intentos_fallidos: 0, ultimo_acceso: '2026-06-16 09:12:00', nombre_completo: 'Teresa Bermúdez', fk_id_empleado: 2 },
  { id_usuario: 2, username: 'pcastillo', rol: 'Auxiliar', password: 'sha256$pcastillo', intentos_fallidos: 0, ultimo_acceso: '2026-06-15 14:30:00', nombre_completo: 'Patricia Castillo', fk_id_empleado: 3 },
];

export const MOCK_DASHBOARD = {
  kpis: {
    empleadosActivos: 7,
    empleadosRetirados: 2,
    totalEmpleados: 9,
    carpetasArchivadas: 9,
    alertasStock: 4,
    totalEntregas: 5,
  },
  stockPorArea: {
    'Administración': { area: 'Administración', normal: 1, bajo: 0, critico: 0, total: 1 },
    'EDS (Estaciones de Servicio)': { area: 'EDS (Estaciones de Servicio)', normal: 1, bajo: 1, critico: 0, total: 2 },
    'Operativo': { area: 'Operativo', normal: 2, bajo: 1, critico: 1, total: 4 },
    'Uso General': { area: 'Uso General', normal: 1, bajo: 0, critico: 0, total: 1 },
  },
  activosPorArea: [
    { id_area: 1, nom_area: 'Administración', total: 3 },
    { id_area: 2, nom_area: 'EDS (Estaciones de Servicio)', total: 1 },
    { id_area: 3, nom_area: 'Operativo', total: 3 },
  ],
  entregasPorPeriodo: [
    { periodo: 'Abril', total: 2 },
    { periodo: 'Agosto', total: 1 },
    { periodo: 'Diciembre', total: 2 },
  ],
  actividades: [
    { id_actividad: 7, accion: 'sistema', detalle: 'Inicio de sesión del administrador', entidad: 'usuario', empleado: null, usuario: 'admin', fecha: '2026-06-16 09:12:00' },
    { id_actividad: 6, accion: 'actualizacion', detalle: 'Empleado Luis Martínez marcado como Retirado', entidad: 'empleado', empleado: 'Luis Martínez', usuario: 'admin', fecha: '2026-06-15 16:40:00' },
    { id_actividad: 5, accion: 'entrega', detalle: 'Entrega de dotación período Diciembre a Andrés Morales', entidad: 'entrega', empleado: 'Andrés Morales', usuario: 'admin', fecha: '2026-06-14 11:05:00' },
    { id_actividad: 4, accion: 'creacion', detalle: 'Se registró la hoja de vida de Andrés Morales', entidad: 'empleado', empleado: 'Andrés Morales', usuario: 'admin', fecha: '2026-06-13 10:20:00' },
    { id_actividad: 3, accion: 'actualizacion', detalle: 'Actualización de stock: Camisa Manga Larga (Talla M)', entidad: 'articulo', empleado: null, usuario: 'admin', fecha: '2026-06-12 15:33:00' },
    { id_actividad: 2, accion: 'entrega', detalle: 'Entrega de dotación período Abril a Carlos Gómez', entidad: 'entrega', empleado: 'Carlos Gómez', usuario: 'admin', fecha: '2026-06-11 09:48:00' },
    { id_actividad: 1, accion: 'creacion', detalle: 'Se registró la hoja de vida de Carlos Gómez', entidad: 'empleado', empleado: 'Carlos Gómez', usuario: 'admin', fecha: '2026-06-10 08:15:00' },
  ],
};

export const MOCK_AREAS = [
  { id_area: 1, nom_area: 'Administración', cargos: 21 },
  { id_area: 2, nom_area: 'EDS (Estaciones de Servicio)', cargos: 6 },
  { id_area: 3, nom_area: 'Operativo', cargos: 11 },
];


export const MOCK_CARGOS = [
  { id_cargo: 1, nom_cargo: 'Gerente General', fk_id_area: 1, nom_area: 'Administración', estado: 'Activo' },
  { id_cargo: 2, nom_cargo: 'Auxiliar Administrativo', fk_id_area: 1, nom_area: 'Administración', estado: 'Activo' },
  { id_cargo: 3, nom_cargo: 'Isleros', fk_id_area: 2, nom_area: 'EDS (Estaciones de Servicio)', estado: 'Activo' },
  { id_cargo: 4, nom_cargo: 'Conductor', fk_id_area: 3, nom_area: 'Operativo', estado: 'Activo' },
  { id_cargo: 5, nom_cargo: 'Mecánico', fk_id_area: 3, nom_area: 'Operativo', estado: 'Inactivo' },
];

export const MOCK_UBICACIONES = [
  { id_ubicacion: 1, ubicacion_fisica: 'Archivador A - Cajón 1' },
  { id_ubicacion: 2, ubicacion_fisica: 'Archivador A - Cajón 2' },
  { id_ubicacion: 3, ubicacion_fisica: 'Archivador B - Cajón 1' },
];

export const MOCK_EMPLEADOS = [
  { id_empleado: 1, cedula: '79456123', nombre_completo: 'Carlos Gómez', genero: 'Masculino', estado: 'Activo', fecha_ingreso: '2021-03-01', fecha_retiro: null, observaciones: '', fk_id_cargo: 4, nom_cargo: 'Conductor', id_area: 3, nom_area: 'Operativo', fk_id_ubicacion: 1, ubicacion_fisica: 'Archivador A - Cajón 1', fk_id_talla: 1, camisa: 'M', pantalon: '34', calzado: '42' },
  { id_empleado: 2, cedula: '52123987', nombre_completo: 'Teresa Bermúdez', genero: 'Femenino', estado: 'Activo', fecha_ingreso: '2019-07-15', fecha_retiro: null, observaciones: 'Jefe de área', fk_id_cargo: 1, nom_cargo: 'Gerente General', id_area: 1, nom_area: 'Administración', fk_id_ubicacion: 2, ubicacion_fisica: 'Archivador A - Cajón 2', fk_id_talla: 2, camisa: 'S', pantalon: '30', calzado: '37' },
  { id_empleado: 3, cedula: '63987456', nombre_completo: 'Patricia Castillo', genero: 'Femenino', estado: 'Activo', fecha_ingreso: '2020-01-10', fecha_retiro: null, observaciones: '', fk_id_cargo: 2, nom_cargo: 'Auxiliar Administrativo', id_area: 1, nom_area: 'Administración', fk_id_ubicacion: 2, ubicacion_fisica: 'Archivador A - Cajón 2', fk_id_talla: 3, camisa: 'M', pantalon: '32', calzado: '38' },
  { id_empleado: 4, cedula: '80741258', nombre_completo: 'Andrés Morales', genero: 'Masculino', estado: 'Activo', fecha_ingreso: '2022-09-05', fecha_retiro: null, observaciones: '', fk_id_cargo: 3, nom_cargo: 'Isleros', id_area: 2, nom_area: 'EDS (Estaciones de Servicio)', fk_id_ubicacion: 3, ubicacion_fisica: 'Archivador B - Cajón 1', fk_id_talla: 4, camisa: 'L', pantalon: '36', calzado: '43' },
  { id_empleado: 5, cedula: '71456852', nombre_completo: 'Luis Martínez', genero: 'Masculino', estado: 'Retirado', fecha_ingreso: '2018-02-20', fecha_retiro: '2025-12-30', observaciones: 'Retiro voluntario', fk_id_cargo: 4, nom_cargo: 'Conductor', id_area: 3, nom_area: 'Operativo', fk_id_ubicacion: 1, ubicacion_fisica: 'Archivador A - Cajón 1', fk_id_talla: 5, camisa: 'XL', pantalon: '38', calzado: '44' },
];

export const MOCK_INVENTARIO = [
  { id_articulo: 1, nombre_item: 'Camisa Manga Larga', stock_minimo: 20, stock_total: 45, fk_id_area: 3, nom_area: 'Operativo', estado: 'normal', vencimiento: null },
  { id_articulo: 2, nombre_item: 'Pantalón de Dotación', stock_minimo: 20, stock_total: 12, fk_id_area: 3, nom_area: 'Operativo', estado: 'bajo', vencimiento: null },
  { id_articulo: 3, nombre_item: 'Botas de Seguridad', stock_minimo: 15, stock_total: 5, fk_id_area: 3, nom_area: 'Operativo', estado: 'critico', vencimiento: null },
  { id_articulo: 4, nombre_item: 'Camisa Tipo Polo', stock_minimo: 10, stock_total: 30, fk_id_area: 2, nom_area: 'EDS (Estaciones de Servicio)', estado: 'normal', vencimiento: null },
  { id_articulo: 5, nombre_item: 'Chaleco Reflectivo', stock_minimo: 10, stock_total: 8, fk_id_area: 2, nom_area: 'EDS (Estaciones de Servicio)', estado: 'bajo', vencimiento: null },
];

export const MOCK_VARIANTES = [
  { id_stock_variante: 1, id_articulo: 1, nombre_item: 'Camisa Manga Larga', stock_minimo: 20, fk_id_area: 3, nom_area: 'Operativo', camisa: 'M', pantalon: null, calzado: null, variante: 'Camisa M', stock_actual: 25, estado: 'normal', updatedAt: '2026-06-12 15:33:00' },
  { id_stock_variante: 2, id_articulo: 1, nombre_item: 'Camisa Manga Larga', stock_minimo: 20, fk_id_area: 3, nom_area: 'Operativo', camisa: 'L', pantalon: null, calzado: null, variante: 'Camisa L', stock_actual: 20, estado: 'normal', updatedAt: '2026-06-12 15:33:00' },
  { id_stock_variante: 3, id_articulo: 2, nombre_item: 'Pantalón de Dotación', stock_minimo: 20, fk_id_area: 3, nom_area: 'Operativo', camisa: null, pantalon: '34', calzado: null, variante: 'Pantalón 34', stock_actual: 7, estado: 'bajo', updatedAt: '2026-06-10 09:00:00' },
  { id_stock_variante: 4, id_articulo: 3, nombre_item: 'Botas de Seguridad', stock_minimo: 15, fk_id_area: 3, nom_area: 'Operativo', camisa: null, pantalon: null, calzado: '42', variante: 'Calzado 42', stock_actual: 3, estado: 'critico', updatedAt: '2026-06-09 10:30:00' },
  { id_stock_variante: 5, id_articulo: 4, nombre_item: 'Camisa Tipo Polo', stock_minimo: 10, fk_id_area: 2, nom_area: 'EDS (Estaciones de Servicio)', camisa: 'M', pantalon: null, calzado: null, variante: 'Camisa M', stock_actual: 18, estado: 'normal', updatedAt: '2026-06-11 12:00:00' },
];

export const MOCK_ENTREGAS = [
  { id_entrega: 1, fecha_entrega: '2026-04-15', periodo: 'Abril', id_empleado: 1, empleado: 'Carlos Gómez', cedula: '79456123', usuario: 'admin', items: 2, total_unidades: 3 },
  { id_entrega: 2, fecha_entrega: '2026-08-10', periodo: 'Agosto', id_empleado: 4, empleado: 'Andrés Morales', cedula: '80741258', usuario: 'admin', items: 1, total_unidades: 1 },
  { id_entrega: 3, fecha_entrega: '2025-12-20', periodo: 'Diciembre', id_empleado: 4, empleado: 'Andrés Morales', cedula: '80741258', usuario: 'pcastillo', items: 3, total_unidades: 5 },
];

export const MOCK_DETALLE_ENTREGA = [
  { id_detalle: 1, cantidad: 2, talla_entregada: 'M', nombre_item: 'Camisa Manga Larga' },
  { id_detalle: 2, cantidad: 1, talla_entregada: '34', nombre_item: 'Pantalón de Dotación' },
];

export const MOCK_HISTORIAL = [
  { id_entrega: 1, fecha_entrega: '2026-04-15', periodo: 'Abril', usuario: 'admin', items: [
    { id_detalle: 1, cantidad: 2, talla_entregada: 'M', nombre_item: 'Camisa Manga Larga' },
    { id_detalle: 2, cantidad: 1, talla_entregada: '34', nombre_item: 'Pantalón de Dotación' },
  ] },
];

export const MOCK_DB_INFO = { ruta: 'C:\\Users\\Usuario\\AppData\\Roaming\\coodetrans\\coodetrans.db', tamano: 98304, modificado: '2026-06-16T09:12:00.000Z' };
