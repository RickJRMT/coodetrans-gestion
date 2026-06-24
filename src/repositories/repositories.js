/**
 * repositories.js
 * Capa de acceso a datos (Repository). Encapsula TODAS las consultas SQL
 * nativas hacia SQLite usando prepared statements de better-sqlite3.
 *
 * Esta capa NO contiene lógica de negocio; solo operaciones CRUD y consultas.
 * Es consumida por la capa de controladores.
 */

const { getDb } = require('../database/database');

/* ──────────────────────────────────────────────────────────────────────
   REPOSITORIO: USUARIO
─────────────────────────────────────────────────────────────────────── */
const usuarioRepo = {
  buscarPorUsername(username) {
    return getDb()
      .prepare(`
        SELECT u.*, e.nombre_completo
        FROM usuario u
        LEFT JOIN empleado e ON e.id_empleado = u.fk_id_empleado
        WHERE u.username = ?`)
      .get(username);
  },

  registrarAcceso(id_usuario) {
    return getDb()
      .prepare(`
        UPDATE usuario
        SET ultimo_acceso = datetime('now','localtime'),
            intentos_fallidos = 0,
            updatedAt = datetime('now','localtime')
        WHERE id_usuario = ?`)
      .run(id_usuario);
  },

  incrementarFallidos(id_usuario) {
    return getDb()
      .prepare(`
        UPDATE usuario
        SET intentos_fallidos = intentos_fallidos + 1,
            updatedAt = datetime('now','localtime')
        WHERE id_usuario = ?`)
      .run(id_usuario);
  },

  listar() {
    return getDb()
      .prepare(`
        SELECT u.id_usuario, u.username, u.rol, u.estado, u.intentos_fallidos,
               u.ultimo_acceso, u.fk_id_empleado, e.nombre_completo
        FROM usuario u
        LEFT JOIN empleado e ON e.id_empleado = u.fk_id_empleado
        ORDER BY u.username ASC`)
      .all();
  },

  existeUsername(username, idExcluir = 0) {
    return getDb()
      .prepare('SELECT COUNT(*) AS n FROM usuario WHERE username = ? AND id_usuario <> ?')
      .get(username, idExcluir).n > 0;
  },

  crear({ username, rol, password, fk_id_empleado, estado = 'Activo' }) {
    return getDb()
      .prepare(`
        INSERT INTO usuario (username, rol, password, estado, fk_id_empleado)
        VALUES (?, ?, ?, ?, ?)`)
      .run(username, rol, password, estado, fk_id_empleado);
  },

  /** Actualiza datos del usuario. Si password es null/undefined no se modifica. */
  actualizar(id_usuario, { username, rol, fk_id_empleado, estado, password }) {
    const db = getDb();
    if (password) {
      return db
        .prepare(`
          UPDATE usuario
          SET username = ?, rol = ?, fk_id_empleado = ?, estado = ?, password = ?,
              updatedAt = datetime('now','localtime')
          WHERE id_usuario = ?`)
        .run(username, rol, fk_id_empleado, estado, password, id_usuario);
    }
    return db
      .prepare(`
        UPDATE usuario
        SET username = ?, rol = ?, fk_id_empleado = ?, estado = ?,
            updatedAt = datetime('now','localtime')
        WHERE id_usuario = ?`)
      .run(username, rol, fk_id_empleado, estado, id_usuario);
  },

  cambiarEstado(id_usuario, estado) {
    return getDb()
      .prepare(`
        UPDATE usuario SET estado = ?, updatedAt = datetime('now','localtime')
        WHERE id_usuario = ?`)
      .run(estado, id_usuario);
  },
};

/* ──────────────────────────────────────────────────────────────────────
   REPOSITORIO: ÁREA Y CARGO
─────────────────────────────────────────────────────────────────────── */
const areaRepo = {
  listar() {
    return getDb().prepare('SELECT * FROM area ORDER BY nom_area ASC').all();
  },
  listarActivas() {
    return getDb()
      .prepare("SELECT * FROM area WHERE estado = 'Activo' ORDER BY nom_area ASC")
      .all();
  },
  contarCargos(id_area) {
    return getDb()
      .prepare('SELECT COUNT(*) AS n FROM cargo WHERE fk_id_area = ?')
      .get(id_area).n;
  },
  crear({ nom_area }) {
    return getDb()
      .prepare('INSERT INTO area (nom_area) VALUES (?)')
      .run(nom_area);
  },
  actualizar(id_area, { nom_area }) {
    return getDb()
      .prepare(`
        UPDATE area SET nom_area = ?, updatedAt = datetime('now','localtime')
        WHERE id_area = ?`)
      .run(nom_area, id_area);
  },
  cambiarEstado(id_area, estado) {
    return getDb()
      .prepare(`
        UPDATE area SET estado = ?, updatedAt = datetime('now','localtime')
        WHERE id_area = ?`)
      .run(estado, id_area);
  },
};

const cargoRepo = {
  listar() {
    return getDb()
      .prepare(`
        SELECT c.*, a.nom_area
        FROM cargo c
        JOIN area a ON a.id_area = c.fk_id_area
        ORDER BY a.nom_area ASC, c.nom_cargo ASC`)
      .all();
  },
  listarActivos() {
    return getDb()
      .prepare(`
        SELECT c.*, a.nom_area
        FROM cargo c
        JOIN area a ON a.id_area = c.fk_id_area
        WHERE c.estado = 'Activo'
        ORDER BY a.nom_area ASC, c.nom_cargo ASC`)
      .all();
  },
  listarPorArea(id_area) {
    return getDb()
      .prepare('SELECT * FROM cargo WHERE fk_id_area = ? ORDER BY nom_cargo ASC')
      .all(id_area);
  },
  crear({ nom_cargo, fk_id_area }) {
    return getDb()
      .prepare('INSERT INTO cargo (nom_cargo, fk_id_area) VALUES (?, ?)')
      .run(nom_cargo, fk_id_area);
  },
  actualizar(id_cargo, { nom_cargo, fk_id_area }) {
    return getDb()
      .prepare(`
        UPDATE cargo SET nom_cargo = ?, fk_id_area = ?, updatedAt = datetime('now','localtime')
        WHERE id_cargo = ?`)
      .run(nom_cargo, fk_id_area, id_cargo);
  },
  cambiarEstado(id_cargo, estado) {
    return getDb()
      .prepare(`
        UPDATE cargo SET estado = ?, updatedAt = datetime('now','localtime')
        WHERE id_cargo = ?`)
      .run(estado, id_cargo);
  },
};

/* ──────────────────────────────────────────────────────────────────────
   REPOSITORIO: UBICACIÓN FÍSICA
─────────────────────────────────────────────────────────────────────── */
const ubicacionRepo = {
  listar() {
    return getDb()
      .prepare('SELECT * FROM ubicacion_fisica ORDER BY ubicacion_fisica ASC')
      .all();
  },
};

/* ──────────────────────────────────────────────────────────────────────
   REPOSITORIO: EMPLEADO
─────────────────────────────────────────────────────────────────────── */
const empleadoRepo = {
  listar() {
    return getDb()
      .prepare(`
        SELECT e.*, c.nom_cargo, a.id_area, a.nom_area, uf.ubicacion_fisica,
               t.camisa, t.pantalon, t.calzado
        FROM empleado e
        LEFT JOIN cargo c            ON c.id_cargo = e.fk_id_cargo
        LEFT JOIN area a             ON a.id_area = c.fk_id_area
        LEFT JOIN ubicacion_fisica uf ON uf.id_ubicacion = e.fk_id_ubicacion
        LEFT JOIN talla t            ON t.id_talla = e.fk_id_talla
        ORDER BY e.nombre_completo ASC`)
      .all();
  },

  obtener(id_empleado) {
    return getDb()
      .prepare(`
        SELECT e.*, c.nom_cargo, a.id_area, a.nom_area, uf.ubicacion_fisica,
               t.camisa, t.pantalon, t.calzado
        FROM empleado e
        LEFT JOIN cargo c            ON c.id_cargo = e.fk_id_cargo
        LEFT JOIN area a             ON a.id_area = c.fk_id_area
        LEFT JOIN ubicacion_fisica uf ON uf.id_ubicacion = e.fk_id_ubicacion
        LEFT JOIN talla t            ON t.id_talla = e.fk_id_talla
        WHERE e.id_empleado = ?`)
      .get(id_empleado);
  },

  existeCedula(cedula, idExcluir = 0) {
    return getDb()
      .prepare('SELECT COUNT(*) AS n FROM empleado WHERE cedula = ? AND id_empleado <> ?')
      .get(cedula, idExcluir).n > 0;
  },

  /**
   * Crea un empleado. Si se reciben tallas (camisa/pantalon/calzado), crea
   * primero el registro en `talla` y lo enlaza. Operación transaccional.
   */
  crear(data) {
    const db = getDb();
    const tx = db.transaction((d) => {
      let fk_id_talla = null;
      if (d.camisa || d.pantalon || d.calzado) {
        const r = db
          .prepare('INSERT INTO talla (camisa, pantalon, calzado) VALUES (?, ?, ?)')
          .run(d.camisa || null, d.pantalon || null, d.calzado || null);
        fk_id_talla = r.lastInsertRowid;
      }
      const res = db
        .prepare(`
          INSERT INTO empleado
            (cedula, nombre_completo, genero, fecha_ingreso, fecha_retiro, estado,
             observaciones, fk_id_cargo, fk_id_ubicacion, fk_id_talla)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(
          d.cedula, d.nombre_completo, d.genero || null, d.fecha_ingreso || null,
          d.fecha_retiro || null, d.estado, d.observaciones || null,
          d.fk_id_cargo || null, d.fk_id_ubicacion, fk_id_talla
        );
      return res.lastInsertRowid;
    });
    return tx(data);
  },

  /**
   * Actualiza un empleado y sus tallas (crea/actualiza el registro `talla`
   * enlazado). Operación transaccional.
   */
  actualizar(id_empleado, data) {
    const db = getDb();
    const tx = db.transaction((id, d) => {
      const actual = db.prepare('SELECT fk_id_talla FROM empleado WHERE id_empleado = ?').get(id);
      let fk_id_talla = actual ? actual.fk_id_talla : null;

      if (d.camisa || d.pantalon || d.calzado) {
        if (fk_id_talla) {
          db.prepare(`
            UPDATE talla SET camisa = ?, pantalon = ?, calzado = ?,
              updatedAt = datetime('now','localtime')
            WHERE id_talla = ?`)
            .run(d.camisa || null, d.pantalon || null, d.calzado || null, fk_id_talla);
        } else {
          const r = db
            .prepare('INSERT INTO talla (camisa, pantalon, calzado) VALUES (?, ?, ?)')
            .run(d.camisa || null, d.pantalon || null, d.calzado || null);
          fk_id_talla = r.lastInsertRowid;
        }
      }

      db.prepare(`
        UPDATE empleado SET
          cedula = ?, nombre_completo = ?, genero = ?, fecha_ingreso = ?,
          fecha_retiro = ?, estado = ?, observaciones = ?, fk_id_cargo = ?,
          fk_id_ubicacion = ?, fk_id_talla = ?, updatedAt = datetime('now','localtime')
        WHERE id_empleado = ?`)
        .run(
          d.cedula, d.nombre_completo, d.genero || null, d.fecha_ingreso || null,
          d.fecha_retiro || null, d.estado, d.observaciones || null,
          d.fk_id_cargo || null, d.fk_id_ubicacion, fk_id_talla, id
        );
    });
    tx(id_empleado, data);
    return this.obtener(id_empleado);
  },

  /** Historial de entregas de dotación de un empleado, con su detalle. */
  historialDotaciones(id_empleado) {
    return getDb()
      .prepare(`
        SELECT ed.id_entrega, ed.fecha_entrega, ed.periodo,
               de.id_detalle, de.cantidad, de.talla_entregada,
               ar.nombre_item, u.username AS usuario
        FROM entrega_dotacion ed
        LEFT JOIN usuario u ON u.id_usuario = ed.fk_id_usuario
        LEFT JOIN detalle_entrega de ON de.fk_id_entrega = ed.id_entrega
        LEFT JOIN articulo_talla_stock ats ON ats.id_stock_variante = de.fk_id_stock_variante
        LEFT JOIN articulo ar ON ar.id_articulo = ats.fk_id_articulo
        WHERE ed.fk_id_empleado = ?
        ORDER BY ed.fecha_entrega DESC, ed.id_entrega DESC, de.id_detalle ASC`)
      .all(id_empleado);
  },

  contarPorEstado(estado) {
    return getDb()
      .prepare('SELECT COUNT(*) AS n FROM empleado WHERE estado = ?')
      .get(estado).n;
  },

  /** Cantidad de empleados activos agrupados por área. */
  contarActivosPorArea() {
    return getDb()
      .prepare(`
        SELECT a.id_area, a.nom_area, COUNT(e.id_empleado) AS total
        FROM area a
        LEFT JOIN cargo c    ON c.fk_id_area = a.id_area
        LEFT JOIN empleado e ON e.fk_id_cargo = c.id_cargo AND e.estado = 'Activo'
        GROUP BY a.id_area, a.nom_area
        ORDER BY a.id_area ASC`)
      .all();
  },
};

/* ──────────────────────────────────────────────────────────────────────
   REPOSITORIO: ARTÍCULO / STOCK
─────────────────────────────────────────────────────────────────────── */
const articuloRepo = {
  /**
   * Devuelve cada artículo con su stock total (suma de variantes) y su
   * área. Útil para calcular estados de stock por área.
   */
  listarConStock() {
    return getDb()
      .prepare(`
        SELECT ar.id_articulo, ar.nombre_item, ar.stock_minimo, ar.vencimiento,
               ar.fk_id_area, a.nom_area,
               COALESCE(SUM(ats.stock_actual), 0) AS stock_total
        FROM articulo ar
        LEFT JOIN area a ON a.id_area = ar.fk_id_area
        LEFT JOIN articulo_talla_stock ats ON ats.fk_id_articulo = ar.id_articulo
        GROUP BY ar.id_articulo
        ORDER BY ar.nombre_item ASC`)
      .all();
  },

  /**
   * Lista el stock detallado por variante de talla. Cada fila representa
   * la combinación artículo + talla con su stock actual.
   */
  listarVariantes() {
    return getDb()
      .prepare(`
        SELECT ats.id_stock_variante, ar.id_articulo, ar.nombre_item,
               ar.stock_minimo, ar.vencimiento, ar.fk_id_area, a.nom_area,
               t.camisa, t.pantalon, t.calzado,
               ats.stock_actual, ats.updatedAt
        FROM articulo_talla_stock ats
        JOIN articulo ar ON ar.id_articulo = ats.fk_id_articulo
        LEFT JOIN area a ON a.id_area = ar.fk_id_area
        JOIN talla t ON t.id_talla = ats.fk_id_talla
        ORDER BY ar.nombre_item ASC, ats.id_stock_variante ASC`)
      .all();
  },

  descontarStock(id_stock_variante, cantidad) {
    return getDb()
      .prepare(`
        UPDATE articulo_talla_stock
        SET stock_actual = MAX(0, stock_actual - ?),
            updatedAt = datetime('now','localtime')
        WHERE id_stock_variante = ?`)
      .run(cantidad, id_stock_variante);
  },
};

/* ──────────────────────────────────────────────────────────────────────
   REPOSITORIO: ENTREGAS DE DOTACIÓN
─────────────────────────────────────────────────────────────────────── */
const entregaRepo = {
  contar() {
    return getDb().prepare('SELECT COUNT(*) AS n FROM entrega_dotacion').get().n;
  },

  /** Entregas agrupadas por mes (período) — para el gráfico de barras. */
  contarPorPeriodo() {
    return getDb()
      .prepare(`
        SELECT periodo, COUNT(*) AS total
        FROM entrega_dotacion
        GROUP BY periodo`)
      .all();
  },

  /**
   * Lista las entregas de dotación con datos del empleado, usuario y un
   * resumen de ítems entregados. Admite filtros opcionales por período y
   * texto (cédula o nombre del empleado).
   */
  listar({ periodo = '', texto = '' } = {}) {
    const condiciones = [];
    const params = [];
    if (periodo) { condiciones.push('ed.periodo = ?'); params.push(periodo); }
    if (texto) {
      condiciones.push('(e.nombre_completo LIKE ? OR e.cedula LIKE ?)');
      params.push(`%${texto}%`, `%${texto}%`);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    return getDb()
      .prepare(`
        SELECT ed.id_entrega, ed.fecha_entrega, ed.periodo,
               e.id_empleado, e.nombre_completo AS empleado, e.cedula,
               u.username AS usuario,
               COUNT(de.id_detalle) AS items,
               COALESCE(SUM(de.cantidad), 0) AS total_unidades
        FROM entrega_dotacion ed
        JOIN empleado e ON e.id_empleado = ed.fk_id_empleado
        LEFT JOIN usuario u ON u.id_usuario = ed.fk_id_usuario
        LEFT JOIN detalle_entrega de ON de.fk_id_entrega = ed.id_entrega
        ${where}
        GROUP BY ed.id_entrega
        ORDER BY ed.fecha_entrega DESC, ed.id_entrega DESC`)
      .all(...params);
  },

  /** Detalle (artículos) de una entrega específica. */
  detalle(id_entrega) {
    return getDb()
      .prepare(`
        SELECT de.id_detalle, de.cantidad, de.talla_entregada, ar.nombre_item
        FROM detalle_entrega de
        LEFT JOIN articulo_talla_stock ats ON ats.id_stock_variante = de.fk_id_stock_variante
        LEFT JOIN articulo ar ON ar.id_articulo = ats.fk_id_articulo
        WHERE de.fk_id_entrega = ?
        ORDER BY de.id_detalle ASC`)
      .all(id_entrega);
  },

  /**
   * Registra una entrega de dotación con su detalle, descontando el stock
   * de cada variante entregada. Operación transaccional.
   * @returns {number} id de la entrega creada
   */
  crear({ fecha_entrega, periodo, fk_id_empleado, fk_id_usuario, detalles }) {
    const db = getDb();
    const tx = db.transaction(() => {
      const r = db
        .prepare(`
          INSERT INTO entrega_dotacion (fecha_entrega, periodo, fk_id_empleado, fk_id_usuario)
          VALUES (?, ?, ?, ?)`)
        .run(fecha_entrega, periodo, fk_id_empleado, fk_id_usuario);
      const id_entrega = r.lastInsertRowid;

      const stmtDet = db.prepare(`
        INSERT INTO detalle_entrega (cantidad, talla_entregada, fk_id_entrega, fk_id_stock_variante)
        VALUES (?, ?, ?, ?)`);
      const stmtStock = db.prepare(`
        UPDATE articulo_talla_stock
        SET stock_actual = MAX(0, stock_actual - ?), updatedAt = datetime('now','localtime')
        WHERE id_stock_variante = ?`);

      for (const d of detalles) {
        stmtDet.run(d.cantidad, d.talla_entregada, id_entrega, d.fk_id_stock_variante);
        stmtStock.run(d.cantidad, d.fk_id_stock_variante);
      }
      return id_entrega;
    });
    return tx();
  },
};

/* ──────────────────────────────────────────────────────────────────────
   REPOSITORIO: ACTIVIDAD RECIENTE
─────────────────────────────────────────────────────────────────────── */
const actividadRepo = {
  recientes(limite = 8) {
    return getDb()
      .prepare(`
        SELECT ac.*, e.nombre_completo AS empleado, u.username AS usuario
        FROM actividad_reciente ac
        LEFT JOIN empleado e ON e.id_empleado = ac.fk_id_empleado
        LEFT JOIN usuario u  ON u.id_usuario = ac.fk_id_usuario
        ORDER BY ac.fecha DESC, ac.id_actividad DESC
        LIMIT ?`)
      .all(limite);
  },

  registrar({ accion, detalle, entidad = null, fk_id_empleado = null, fk_id_usuario = null }) {
    return getDb()
      .prepare(`
        INSERT INTO actividad_reciente (accion, detalle, entidad, fk_id_empleado, fk_id_usuario)
        VALUES (?, ?, ?, ?, ?)`)
      .run(accion, detalle, entidad, fk_id_empleado, fk_id_usuario);
  },
};

module.exports = {
  usuarioRepo,
  areaRepo,
  cargoRepo,
  ubicacionRepo,
  empleadoRepo,
  articuloRepo,
  entregaRepo,
  actividadRepo,
};
