/**
 * seed.js
 * Datos semilla iniciales para la base de datos Coodetrans.
 * Solo se insertan si las tablas correspondientes están vacías, de modo
 * que no se sobrescriban datos del usuario en arranques posteriores.
 *
 * NOTA DE SEGURIDAD (Fase 1):
 *   Las contraseñas se almacenan con un hash simple (no productivo).
 *   En una fase posterior se reemplazará por BCrypt real.
 */

const crypto = require('crypto');

// Hash simple SHA-256 (placeholder para la Fase 1).
function hashPassword(plain) {
  return 'sha256$' + crypto.createHash('sha256').update(plain).digest('hex');
}

// 3 áreas reales de Coodetrans
const AREAS = [
  { id: 1, nom: 'Administración' },
  { id: 2, nom: 'EDS (Estaciones de Servicio)' },
  { id: 3, nom: 'Operativo' },
];

// 38 cargos reales (areaCargoEmpresa.sql)
const CARGOS = [
  // Área 1 — Administración
  ['Auditora Interna', 1], ['Secretario(a)', 1], ['Coordinador de Compras', 1],
  ['Alumno Aprendiz', 1], ['Auxiliar Contable I', 1], ['Auxiliar Jurídico', 1],
  ['Auxiliar de Cartera', 1], ['Director Contable', 1], ['Auxiliar Gestión Humana', 1],
  ['Coordinador de Sistemas', 1], ['Servicios Generales', 1], ['Director(a) Gestión Humana', 1],
  ['Coordinador(a) SGSI', 1], ['Auxiliar de Tesorería', 1], ['Psicólogo(a)', 1],
  ['Auxiliar Contable II', 1], ['Auxiliar Contable III', 1], ['Coordinadora de Tesorería', 1],
  ['Recepcionista', 1], ['Asistente Dirección General', 1], ['Director General', 1],
  // Área 2 — EDS (Estaciones de Servicio)
  ['Lubricador', 2], ['Almacenista', 2], ['Islero', 2],
  ['Cajero', 2], ['Supervisor de Patios', 2], ['Oficios Varios', 2],
  // Área 3 — Operativo
  ['Operador', 3], ['Control Despachador', 3], ['Coordinador Sala Monitoreo', 3],
  ['Analista', 3], ['Inspector de Rutas', 3], ['Aforista', 3],
  ['Monitoreo', 3], ['Secretario(a) Operativo', 3], ['Auxiliar de Transporte', 3],
  ['Auxiliar Seguridad Vial', 3], ['Director Operativo', 3],
];

// Ubicaciones físicas de ejemplo (archivo alfabético)
const UBICACIONES = [
  'Armario Oficina — Cajón 1 A-C',
  'Armario Izq — Cajón 2 D-G',
  'Archivador Central — Piso 2',
  'Armario Oficina — Cajón 3 H-L',
  'Armario Fondo — Sección B',
];

// Tallas base
const TALLAS = [
  ['M', '32', '42'], ['S', '28', '36'], ['XL', '34', '43'],
  ['S', '28', '35'], ['L', '34', '44'], ['M', '32', '41'],
  ['Única', 'N/A', 'N/A'],
];

// Empleados de ejemplo: [cedula, nombre, genero, ingreso, retiro, estado, id_cargo, id_ubicacion, id_talla, obs]
const EMPLEADOS = [
  ['1.013.456.789', 'Carlos Gómez', 'Masculino', '2022-03-12', null, 'Activo', 22, 1, 1, 'Carpeta revisada, documentación completa.'],
  ['1.115.789.123', 'Teresa Bermúdez', 'Femenino', '2024-05-06', null, 'Activo', 9, 2, 2, 'Pendiente por firmar actualización de contrato.'],
  ['31.890.456', 'Patricia Castillo', 'Femenino', '2020-01-15', null, 'Activo', 2, 3, 2, 'Sin novedades en su hoja de vida física.'],
  ['1.020.334.512', 'Andrés Morales', 'Masculino', '2023-08-20', null, 'Activo', 22, 4, 3, 'Documentación de ingreso completa.'],
  ['52.110.789', 'Sandra Herrera', 'Femenino', '2021-03-01', null, 'Activo', 19, 2, 4, 'Revisión periódica de fólder física realizada.'],
  ['1.122.456.001', 'Diego Ramírez', 'Masculino', '2023-02-10', null, 'Activo', 28, 1, 5, 'Operador con licencia vigente.'],
  ['1.098.222.333', 'Laura Peña', 'Femenino', '2022-11-05', null, 'Activo', 31, 3, 6, 'Analista de turno diurno.'],
  ['16.745.890', 'Luis Martínez', 'Masculino', null, '2026-05-30', 'Retirado', null, 5, null, 'Migración de Excel: sin fechas de ingreso, cargo ni tallas.'],
  ['79.540.231', 'Jorge Quintero', 'Masculino', '2019-07-14', '2026-01-12', 'Retirado', 22, 5, null, 'Empleado retirado cargado sin perfil de tallas.'],
];

// Artículos de inventario de ejemplo: [nombre, stock_minimo, vencimiento, id_area]
const ARTICULOS = [
  ['Camisa Manga Larga — Hombre', 10, 0, 2],
  ['Pantalón Jean — Hombre', 10, 0, 1],
  ['Bota de Seguridad (Par)', 10, 0, 3],
  ['Camisa Manga Corta — Mujer', 8, 0, 2],
  ['Casco de Seguridad', 5, 0, 3],
  ['Chaleco Reflectivo', 8, 0, 3],
  ['Guantes de Trabajo (Par)', 10, 1, 3],
  ['Gorra Institucional Coodetrans', 5, 0, null],
];

// Variantes de stock: [id_articulo, id_talla, stock_actual]
const STOCK = [
  [1, 1, 14], [1, 3, 10], [2, 1, 10], [2, 3, 8], [3, 1, 7],
  [4, 4, 3], [5, 7, 15], [6, 7, 11], [7, 7, 4], [8, 7, 30],
];

// Actividades recientes de ejemplo para el dashboard
const ACTIVIDADES = [
  ['creacion', 'Se registró la hoja de vida de Carlos Gómez', 'empleado', 1, 1],
  ['entrega', 'Entrega de dotación período Abril a Carlos Gómez', 'entrega', 1, 1],
  ['actualizacion', 'Actualización de stock: Camisa Manga Larga (Talla M)', 'articulo', null, 1],
  ['creacion', 'Se registró la hoja de vida de Andrés Morales', 'empleado', 4, 1],
  ['entrega', 'Entrega de dotación período Diciembre a Andrés Morales', 'entrega', 4, 1],
  ['actualizacion', 'Empleado Luis Martínez marcado como Retirado', 'empleado', 8, 1],
  ['sistema', 'Inicio de sesión del administrador', 'usuario', null, 1],
];

function runSeed(db) {
  const insertIfEmpty = (table, fn) => {
    const count = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
    if (count === 0) fn();
  };

  const tx = db.transaction(() => {
    // Áreas
    insertIfEmpty('area', () => {
      const stmt = db.prepare('INSERT INTO area (id_area, nom_area) VALUES (?, ?)');
      AREAS.forEach((a) => stmt.run(a.id, a.nom));
    });

    // Cargos
    insertIfEmpty('cargo', () => {
      const stmt = db.prepare('INSERT INTO cargo (nom_cargo, fk_id_area) VALUES (?, ?)');
      CARGOS.forEach(([nom, area]) => stmt.run(nom, area));
    });

    // Ubicaciones
    insertIfEmpty('ubicacion_fisica', () => {
      const stmt = db.prepare('INSERT INTO ubicacion_fisica (ubicacion_fisica) VALUES (?)');
      UBICACIONES.forEach((u) => stmt.run(u));
    });

    // Tallas
    insertIfEmpty('talla', () => {
      const stmt = db.prepare('INSERT INTO talla (camisa, pantalon, calzado) VALUES (?, ?, ?)');
      TALLAS.forEach(([c, p, z]) => stmt.run(c, p, z));
    });

    // Empleados
    insertIfEmpty('empleado', () => {
      const stmt = db.prepare(`
        INSERT INTO empleado
          (cedula, nombre_completo, genero, fecha_ingreso, fecha_retiro, estado,
           fk_id_cargo, fk_id_ubicacion, fk_id_talla, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      EMPLEADOS.forEach((e) => stmt.run(...e));
    });

    // Usuarios (admin por defecto + auxiliar de ejemplo)
    insertIfEmpty('usuario', () => {
      const stmt = db.prepare(`
        INSERT INTO usuario (username, rol, password, fk_id_empleado)
        VALUES (?, ?, ?, ?)`);
      // admin / admin123  — vinculado a Teresa Bermúdez (empleado 2)
      stmt.run('admin', 'Administrador', hashPassword('admin123'), 2);
      // pcastillo / coodetrans — vinculado a Patricia Castillo (empleado 3)
      stmt.run('pcastillo', 'Auxiliar', hashPassword('coodetrans'), 3);
    });

    // Artículos
    insertIfEmpty('articulo', () => {
      const stmt = db.prepare(`
        INSERT INTO articulo (nombre_item, stock_minimo, vencimiento, fk_id_area)
        VALUES (?, ?, ?, ?)`);
      ARTICULOS.forEach((a) => stmt.run(...a));
    });

    // Stock por variante
    insertIfEmpty('articulo_talla_stock', () => {
      const stmt = db.prepare(`
        INSERT INTO articulo_talla_stock (fk_id_articulo, fk_id_talla, stock_actual)
        VALUES (?, ?, ?)`);
      STOCK.forEach(([art, talla, stock]) => stmt.run(art, talla, stock));
    });

    // Entregas de dotación de ejemplo
    insertIfEmpty('entrega_dotacion', () => {
      const stmt = db.prepare(`
        INSERT INTO entrega_dotacion (fecha_entrega, periodo, fk_id_empleado, fk_id_usuario)
        VALUES (?, ?, ?, ?)`);
      stmt.run('2025-04-15', 'Abril', 1, 1);
      stmt.run('2025-12-05', 'Diciembre', 1, 1);
      stmt.run('2025-08-18', 'Agosto', 4, 1);
      stmt.run('2025-12-12', 'Diciembre', 4, 1);
      stmt.run('2025-04-22', 'Abril', 5, 2);
    });

    // Detalle de entregas de ejemplo (artículos entregados por cada entrega)
    // [cantidad, talla_entregada, id_entrega, id_stock_variante]
    insertIfEmpty('detalle_entrega', () => {
      const stmt = db.prepare(`
        INSERT INTO detalle_entrega
          (cantidad, talla_entregada, fk_id_entrega, fk_id_stock_variante)
        VALUES (?, ?, ?, ?)`);
      const DETALLES = [
        [1, 'M', 1, 1],   // Entrega 1: Camisa Manga Larga (M)
        [1, 'M', 1, 3],   // Entrega 1: Pantalón Jean (M)
        [1, '42', 1, 5],  // Entrega 1: Bota de Seguridad
        [1, 'M', 2, 1],   // Entrega 2: Camisa Manga Larga (M)
        [1, 'XL', 3, 2],  // Entrega 3: Camisa Manga Larga (XL)
        [1, 'XL', 3, 4],  // Entrega 3: Pantalón Jean (XL)
        [1, 'S', 5, 6],   // Entrega 5: Camisa Manga Corta Mujer (S)
      ];
      DETALLES.forEach((d) => stmt.run(...d));
    });

    // Actividad reciente
    insertIfEmpty('actividad_reciente', () => {
      const stmt = db.prepare(`
        INSERT INTO actividad_reciente (accion, detalle, entidad, fk_id_empleado, fk_id_usuario)
        VALUES (?, ?, ?, ?, ?)`);
      ACTIVIDADES.forEach((a) => stmt.run(...a));
    });
  });

  tx();
  console.log('[BD] Datos semilla verificados/cargados.');
}

module.exports = { runSeed, hashPassword };
