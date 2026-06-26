/**
 * controllers.js
 * Capa de controladores (lógica de negocio y validaciones).
 * Orquesta los repositorios y los modelos, y expone funciones de alto nivel
 * que serán invocadas desde los manejadores IPC del proceso principal.
 *
 * Convención de retorno: { ok: boolean, data?: any, error?: string }
 */

const {
  usuarioRepo, rolRepo, areaRepo, cargoRepo, ubicacionRepo,
  empleadoRepo, articuloRepo, entregaRepo, actividadRepo,
} = require('../repositories/repositories');

const { resumenStockPorArea, estadoStock, varianteLabel } = require('../models/models');
const { hashPassword } = require('../database/seed');
const { getDbPath, getDb } = require('../database/database');
const importExportService = require('../services/importExportService');

/* ──────────────────────────────────────────────────────────────────────
   CONTROLADOR: AUTENTICACIÓN
─────────────────────────────────────────────────────────────────────── */
const authController = {
  /**
   * Valida las credenciales contra la tabla usuario.
   * Devuelve los datos del usuario (sin la contraseña) si son correctas.
   */
  login({ username, password }) {
    if (!username || !password) {
      return { ok: false, error: 'Usuario y contraseña son obligatorios.' };
    }

    const user = usuarioRepo.buscarPorUsername(username.trim());
    if (!user) {
      return { ok: false, error: 'Usuario o contraseña incorrectos.' };
    }

    const hash = hashPassword(password);
    if (hash !== user.password) {
      usuarioRepo.incrementarFallidos(user.id_usuario);
      return { ok: false, error: 'Usuario o contraseña incorrectos.' };
    }

    // Bloquear usuarios desactivados
    if (user.estado && user.estado !== 'Activo') {
      return { ok: false, error: 'Este usuario está desactivado. Contacte al administrador.' };
    }

    usuarioRepo.registrarAcceso(user.id_usuario);
    actividadRepo.registrar({
      accion: 'sistema',
      detalle: `Inicio de sesión del usuario ${user.username}`,
      entidad: 'usuario',
      fk_id_empleado: user.fk_id_empleado,
      fk_id_usuario: user.id_usuario,
    });

    // Nunca devolver el hash de la contraseña al renderer
    const { password: _omit, ...safe } = user;
    return { ok: true, data: safe };
  },
};

/* ──────────────────────────────────────────────────────────────────────
   CONTROLADOR: DASHBOARD
─────────────────────────────────────────────────────────────────────── */
const dashboardController = {
  /** Reúne todos los datos necesarios para el panel principal. */
  obtenerResumen() {
    try {
      const empleadosActivos = empleadoRepo.contarPorEstado('Activo');
      const empleadosRetirados = empleadoRepo.contarPorEstado('Retirado');

      // "Carpetas archivadas" = total de hojas de vida físicas (empleados)
      const totalEmpleados = empleadosActivos + empleadosRetirados;

      // Stock por área (Administración / Operativo / EDS) normal/bajo/crítico
      const articulos = articuloRepo.listarConStock();
      const stockPorArea = resumenStockPorArea(articulos);

      // Alertas de stock bajo o crítico (total de artículos)
      const alertasStock = articulos.filter(
        (a) => estadoStock(a.stock_total, a.stock_minimo) !== 'normal'
      ).length;

      // Datos para el gráfico de barras (empleados activos por área)
      const activosPorArea = empleadoRepo.contarActivosPorArea();

      // Entregas por período (complementa el gráfico)
      const entregasPorPeriodo = entregaRepo.contarPorPeriodo();
      const totalEntregas = entregaRepo.contar();

      // Actividades recientes reales
      const actividades = actividadRepo.recientes(8);

      return {
        ok: true,
        data: {
          kpis: {
            empleadosActivos,
            empleadosRetirados,
            totalEmpleados,
            carpetasArchivadas: totalEmpleados,
            alertasStock,
            totalEntregas,
          },
          stockPorArea,
          activosPorArea,
          entregasPorPeriodo,
          actividades,
        },
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
};

/* ──────────────────────────────────────────────────────────────────────
   CONTROLADOR: CATÁLOGOS (datos maestros)
─────────────────────────────────────────────────────────────────────── */
const catalogoController = {
  listarAreas() {
    try {
      const areas = areaRepo.listar().map((a) => ({
        ...a,
        cargos: areaRepo.contarCargos(a.id_area),
      }));
      return { ok: true, data: areas };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  listarAreasActivas() {
    try {
      return { ok: true, data: areaRepo.listarActivas() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  listarCargos() {
    try {
      return { ok: true, data: cargoRepo.listar() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  listarCargosActivos() {
    try {
      return { ok: true, data: cargoRepo.listarActivos() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  listarUbicaciones() {
    try {
      return { ok: true, data: ubicacionRepo.listar() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /* ── ÁREAS (CRUD) ── */
  crearArea({ nom_area }, idUsuario) {
    try {
      if (!nom_area || !nom_area.trim()) {
        return { ok: false, error: 'El nombre del área es obligatorio.' };
      }
      const r = areaRepo.crear({ nom_area: nom_area.trim() });
      actividadRepo.registrar({
        accion: 'creacion', detalle: `Se creó el área "${nom_area.trim()}"`,
        entidad: 'area', fk_id_usuario: idUsuario || null,
      });
      return { ok: true, data: { id_area: r.lastInsertRowid } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  actualizarArea(id_area, { nom_area }, idUsuario) {
    try {
      if (!nom_area || !nom_area.trim()) {
        return { ok: false, error: 'El nombre del área es obligatorio.' };
      }
      areaRepo.actualizar(id_area, { nom_area: nom_area.trim() });
      actividadRepo.registrar({
        accion: 'actualizacion', detalle: `Se actualizó el área "${nom_area.trim()}"`,
        entidad: 'area', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  cambiarEstadoArea(id_area, estado, idUsuario) {
    try {
      areaRepo.cambiarEstado(id_area, estado);
      actividadRepo.registrar({
        accion: 'actualizacion',
        detalle: `Área ${estado === 'Activo' ? 'activada' : 'desactivada'} (#${id_area})`,
        entidad: 'area', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /* ── CARGOS (CRUD) ── */
  crearCargo({ nom_cargo, fk_id_area }, idUsuario) {
    try {
      if (!nom_cargo || !nom_cargo.trim()) {
        return { ok: false, error: 'El nombre del cargo es obligatorio.' };
      }
      if (!fk_id_area) return { ok: false, error: 'Debe seleccionar un área.' };
      const r = cargoRepo.crear({ nom_cargo: nom_cargo.trim(), fk_id_area });
      actividadRepo.registrar({
        accion: 'creacion', detalle: `Se creó el cargo "${nom_cargo.trim()}"`,
        entidad: 'cargo', fk_id_usuario: idUsuario || null,
      });
      return { ok: true, data: { id_cargo: r.lastInsertRowid } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  actualizarCargo(id_cargo, { nom_cargo, fk_id_area }, idUsuario) {
    try {
      if (!nom_cargo || !nom_cargo.trim()) {
        return { ok: false, error: 'El nombre del cargo es obligatorio.' };
      }
      if (!fk_id_area) return { ok: false, error: 'Debe seleccionar un área.' };
      cargoRepo.actualizar(id_cargo, { nom_cargo: nom_cargo.trim(), fk_id_area });
      actividadRepo.registrar({
        accion: 'actualizacion', detalle: `Se actualizó el cargo "${nom_cargo.trim()}"`,
        entidad: 'cargo', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  cambiarEstadoCargo(id_cargo, estado, idUsuario) {
    try {
      cargoRepo.cambiarEstado(id_cargo, estado);
      actividadRepo.registrar({
        accion: 'actualizacion',
        detalle: `Cargo ${estado === 'Activo' ? 'activado' : 'desactivado'} (#${id_cargo})`,
        entidad: 'cargo', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
};

/* ──────────────────────────────────────────────────────────────────────
   CONTROLADOR: EMPLEADOS
─────────────────────────────────────────────────────────────────────── */
const empleadoController = {
  listar() {
    try {
      return { ok: true, data: empleadoRepo.listar() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  obtener(id_empleado) {
    try {
      const emp = empleadoRepo.obtener(id_empleado);
      if (!emp) return { ok: false, error: 'Empleado no encontrado.' };
      return { ok: true, data: emp };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Normaliza fechas para evitar cruces entre ingreso y retiro. */
  _normalizarFechas(d) {
    const fecha_ingreso = d.fecha_ingreso || null;
    let fecha_retiro = d.fecha_retiro || null;
    if (d.estado === 'Activo') fecha_retiro = null;
    return { ...d, fecha_ingreso, fecha_retiro };
  },

  /** Valida y normaliza los datos del empleado antes de persistir. */
  _validar(d) {
    if (!d.cedula || !d.cedula.trim()) return 'La cédula es obligatoria.';
    if (!/^\d+$/.test(d.cedula.trim())) return 'La cédula solo puede contener números.';
    if (!d.nombre_completo || !d.nombre_completo.trim()) return 'El nombre completo es obligatorio.';
    // El área es obligatoria (puede provenir del área directa o de un cargo).
    if (!d.fk_id_area && !d.fk_id_cargo) return 'Debe seleccionar un área para el empleado.';
    // La ubicación física es ahora texto libre y es opcional.
    if (!['Activo', 'Retirado'].includes(d.estado)) return 'El estado debe ser Activo o Retirado.';
    if (d.estado === 'Retirado' && !d.fecha_retiro) {
      return 'Debe indicar la fecha de retiro para un empleado retirado.';
    }
    return null;
  },

  crear(data, idUsuario) {
    try {
      const error = this._validar(data);
      if (error) return { ok: false, error };
      if (empleadoRepo.existeCedula(data.cedula.trim())) {
        return { ok: false, error: 'Ya existe un empleado con esa cédula.' };
      }
      const id = empleadoRepo.crear(this._normalizarFechas({ ...data, cedula: data.cedula.trim() }));
      actividadRepo.registrar({
        accion: 'creacion',
        detalle: `Se registró la hoja de vida de ${data.nombre_completo.trim()}`,
        entidad: 'empleado', fk_id_empleado: id, fk_id_usuario: idUsuario || null,
      });
      return { ok: true, data: { id_empleado: id } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  actualizar(id_empleado, data, idUsuario) {
    try {
      const error = this._validar(data);
      if (error) return { ok: false, error };
      if (empleadoRepo.existeCedula(data.cedula.trim(), id_empleado)) {
        return { ok: false, error: 'Ya existe otro empleado con esa cédula.' };
      }
      const emp = empleadoRepo.actualizar(id_empleado, this._normalizarFechas({ ...data, cedula: data.cedula.trim() }));
      actividadRepo.registrar({
        accion: 'actualizacion',
        detalle: `Se actualizó la hoja de vida de ${data.nombre_completo.trim()}`,
        entidad: 'empleado', fk_id_empleado: id_empleado, fk_id_usuario: idUsuario || null,
      });
      return { ok: true, data: emp };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Devuelve el historial de dotaciones agrupado por entrega. */
  historial(id_empleado) {
    try {
      const filas = empleadoRepo.historialDotaciones(id_empleado);
      // Agrupar por entrega
      const mapa = new Map();
      for (const f of filas) {
        if (!mapa.has(f.id_entrega)) {
          mapa.set(f.id_entrega, {
            id_entrega: f.id_entrega,
            fecha_entrega: f.fecha_entrega,
            periodo: f.periodo,
            usuario: f.usuario,
            items: [],
          });
        }
        if (f.id_detalle) {
          mapa.get(f.id_entrega).items.push({
            id_detalle: f.id_detalle,
            cantidad: f.cantidad,
            talla_entregada: f.talla_entregada,
            nombre_item: f.nombre_item,
          });
        }
      }
      return { ok: true, data: Array.from(mapa.values()) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
};

/* ──────────────────────────────────────────────────────────────────────
   CONTROLADOR: INVENTARIO
─────────────────────────────────────────────────────────────────────── */
const inventarioController = {
  /** Artículos con stock total agregado y su estado (normal/bajo/crítico). */
  listar() {
    try {
      const articulos = articuloRepo.listarConStock().map((a) => ({
        ...a,
        estado: estadoStock(a.stock_total, a.stock_minimo),
      }));
      return { ok: true, data: articulos };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Resumen de stock por área (normal/bajo/crítico) para tarjetas. */
  resumenPorArea() {
    try {
      return { ok: true, data: resumenStockPorArea(articuloRepo.listarConStock()) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /**
   * Stock detallado por variante de talla. Cada fila incluye una etiqueta
   * legible de la variante y el estado de stock calculado a nivel variante.
   */
  listarVariantes() {
    try {
      const variantes = articuloRepo.listarVariantes().map((v) => ({
        ...v,
        variante: varianteLabel(v),
        estado: estadoStock(v.stock_actual, v.stock_minimo),
      }));
      return { ok: true, data: variantes };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /* ── ADMINISTRACIÓN DE DOTACIONES (CRUD) ─────────────────────────────── */

  /** Valida que un valor sea un entero positivo (>= 0 opcional). */
  _validarEntero(valor, { minimo = 1, etiqueta = 'La cantidad' } = {}) {
    const n = Number(valor);
    if (!Number.isInteger(n) || n < minimo) {
      return `${etiqueta} debe ser un número entero ${minimo === 0 ? 'mayor o igual a 0' : 'positivo'}.`;
    }
    return null;
  },

  crearArticulo(data, idUsuario) {
    try {
      if (!data.nombre_item || !data.nombre_item.trim()) {
        return { ok: false, error: 'El nombre de la dotación es obligatorio.' };
      }
      const errMin = this._validarEntero(data.stock_minimo, { minimo: 0, etiqueta: 'El stock mínimo' });
      if (errMin) return { ok: false, error: errMin };
      const r = articuloRepo.crearArticulo({
        nombre_item: data.nombre_item.trim(),
        stock_minimo: Number(data.stock_minimo),
        vencimiento: data.vencimiento ? 1 : 0,
        fk_id_area: data.fk_id_area || null,
      });
      actividadRepo.registrar({
        accion: 'creacion', detalle: `Se creó la dotación "${data.nombre_item.trim()}"`,
        entidad: 'articulo', fk_id_usuario: idUsuario || null,
      });
      return { ok: true, data: { id_articulo: r.lastInsertRowid } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  actualizarArticulo(id_articulo, data, idUsuario) {
    try {
      if (!data.nombre_item || !data.nombre_item.trim()) {
        return { ok: false, error: 'El nombre de la dotación es obligatorio.' };
      }
      const errMin = this._validarEntero(data.stock_minimo, { minimo: 0, etiqueta: 'El stock mínimo' });
      if (errMin) return { ok: false, error: errMin };
      articuloRepo.actualizarArticulo(id_articulo, {
        nombre_item: data.nombre_item.trim(),
        stock_minimo: Number(data.stock_minimo),
        vencimiento: data.vencimiento ? 1 : 0,
        fk_id_area: data.fk_id_area || null,
      });
      actividadRepo.registrar({
        accion: 'actualizacion', detalle: `Se actualizó la dotación "${data.nombre_item.trim()}"`,
        entidad: 'articulo', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  eliminarArticulo(id_articulo, idUsuario) {
    try {
      articuloRepo.eliminarArticulo(id_articulo);
      actividadRepo.registrar({
        accion: 'eliminacion', detalle: `Se eliminó una dotación (#${id_articulo})`,
        entidad: 'articulo', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /**
   * Crea o suma stock a una variante de talla de un artículo.
   * data: { fk_id_articulo, camisa, pantalon, calzado, stock_actual }
   */
  crearVariante(data, idUsuario) {
    try {
      if (!data.fk_id_articulo) return { ok: false, error: 'Debe seleccionar una dotación.' };
      if (!data.camisa && !data.pantalon && !data.calzado) {
        return { ok: false, error: 'Debe indicar una talla para la variante.' };
      }
      const errStock = this._validarEntero(data.stock_actual, { minimo: 0, etiqueta: 'El stock' });
      if (errStock) return { ok: false, error: errStock };
      const id = articuloRepo.crearVariante({
        fk_id_articulo: data.fk_id_articulo,
        camisa: data.camisa || null,
        pantalon: data.pantalon || null,
        calzado: data.calzado || null,
        stock_actual: Number(data.stock_actual),
      });
      actividadRepo.registrar({
        accion: 'actualizacion', detalle: 'Se agregó/actualizó una variante de talla de dotación',
        entidad: 'articulo', fk_id_usuario: idUsuario || null,
      });
      return { ok: true, data: { id_stock_variante: id } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Ajusta (fija) el stock de una variante a un valor entero >= 0. */
  ajustarStock({ id_stock_variante, stock_actual }, idUsuario) {
    try {
      if (!id_stock_variante) return { ok: false, error: 'Variante no válida.' };
      const errStock = this._validarEntero(stock_actual, { minimo: 0, etiqueta: 'El stock' });
      if (errStock) return { ok: false, error: errStock };
      articuloRepo.ajustarStock(id_stock_variante, Number(stock_actual));
      actividadRepo.registrar({
        accion: 'actualizacion', detalle: `Ajuste de stock de variante (#${id_stock_variante}) a ${stock_actual}`,
        entidad: 'articulo', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  eliminarVariante(id_stock_variante, idUsuario) {
    try {
      articuloRepo.eliminarVariante(id_stock_variante);
      actividadRepo.registrar({
        accion: 'eliminacion', detalle: `Se eliminó una variante de talla (#${id_stock_variante})`,
        entidad: 'articulo', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
};

/* ──────────────────────────────────────────────────────────────────────
   CONTROLADOR: MOVIMIENTOS / ACTIVIDAD
─────────────────────────────────────────────────────────────────────── */
const movimientoController = {
  /** Actividad reciente del sistema (registro de movimientos). */
  listar(limite = 50) {
    try {
      return { ok: true, data: actividadRepo.recientes(limite) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Lista de entregas de dotación con filtros opcionales. */
  listarEntregas(filtros = {}) {
    try {
      return { ok: true, data: entregaRepo.listar(filtros) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Detalle (artículos) de una entrega específica. */
  detalleEntrega(id_entrega) {
    try {
      return { ok: true, data: entregaRepo.detalle(id_entrega) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /**
   * Registra una nueva entrega de dotación. Valida empleado, período y que
   * exista al menos un ítem con cantidad válida; descuenta el stock.
   */
  crearEntrega(data, idUsuario) {
    try {
      if (!data.fk_id_empleado) return { ok: false, error: 'Debe seleccionar un empleado.' };
      if (!data.periodo) return { ok: false, error: 'Debe seleccionar un período.' };
      if (!data.fecha_entrega) return { ok: false, error: 'Debe indicar la fecha de entrega.' };
      const detalles = (data.detalles || []).filter(
        (d) => d.fk_id_stock_variante && Number(d.cantidad) > 0
      );
      if (!detalles.length) {
        return { ok: false, error: 'Debe agregar al menos un artículo con cantidad.' };
      }

      const id_entrega = entregaRepo.crear({
        fecha_entrega: data.fecha_entrega,
        periodo: data.periodo,
        fk_id_empleado: data.fk_id_empleado,
        fk_id_usuario: idUsuario || null,
        detalles: detalles.map((d) => ({
          cantidad: Number(d.cantidad),
          talla_entregada: d.talla_entregada || null,
          fk_id_stock_variante: d.fk_id_stock_variante,
        })),
      });

      actividadRepo.registrar({
        accion: 'entrega',
        detalle: `Entrega de dotación registrada (${detalles.length} artículo(s))`,
        entidad: 'entrega', fk_id_empleado: data.fk_id_empleado,
        fk_id_usuario: idUsuario || null,
      });
      return { ok: true, data: { id_entrega } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
};

/* ──────────────────────────────────────────────────────────────────────
   CONTROLADOR: USUARIOS (configuración)
─────────────────────────────────────────────────────────────────────── */
const usuarioController = {
  listar() {
    try {
      return { ok: true, data: usuarioRepo.listar() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  _validar(d, esNuevo) {
    if (!d.username || !d.username.trim()) return 'El nombre de usuario es obligatorio.';
    // El rol se valida contra los roles dinámicos ACTIVOS de la tabla `rol`.
    if (!d.rol || !d.rol.trim()) return 'Debe seleccionar un rol.';
    const rolesValidos = rolRepo.listarActivos().map((r) => r.nombre);
    if (!rolesValidos.includes(d.rol)) {
      return 'El rol seleccionado no es válido o está desactivado.';
    }
    // La vinculación a un empleado es OPCIONAL (p. ej. el usuario "Programador").
    if (esNuevo && (!d.password || d.password.length < 4)) {
      return 'La contraseña es obligatoria (mínimo 4 caracteres).';
    }
    if (!esNuevo && d.password && d.password.length < 4) {
      return 'La nueva contraseña debe tener al menos 4 caracteres.';
    }
    return null;
  },

  crear(data, idUsuario) {
    try {
      const error = this._validar(data, true);
      if (error) return { ok: false, error };
      if (usuarioRepo.existeUsername(data.username.trim())) {
        return { ok: false, error: 'Ya existe un usuario con ese nombre.' };
      }
      const r = usuarioRepo.crear({
        username: data.username.trim(),
        rol: data.rol,
        password: hashPassword(data.password),
        fk_id_empleado: data.fk_id_empleado || null,
        estado: data.estado || 'Activo',
      });
      actividadRepo.registrar({
        accion: 'creacion', detalle: `Se creó el usuario "${data.username.trim()}"`,
        entidad: 'usuario', fk_id_usuario: idUsuario || null,
      });
      return { ok: true, data: { id_usuario: r.lastInsertRowid } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  actualizar(id_usuario, data, idUsuario) {
    try {
      const error = this._validar(data, false);
      if (error) return { ok: false, error };
      if (usuarioRepo.existeUsername(data.username.trim(), id_usuario)) {
        return { ok: false, error: 'Ya existe otro usuario con ese nombre.' };
      }
      usuarioRepo.actualizar(id_usuario, {
        username: data.username.trim(),
        rol: data.rol,
        fk_id_empleado: data.fk_id_empleado || null,
        estado: data.estado || 'Activo',
        password: data.password ? hashPassword(data.password) : null,
      });
      actividadRepo.registrar({
        accion: 'actualizacion', detalle: `Se actualizó el usuario "${data.username.trim()}"`,
        entidad: 'usuario', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  cambiarEstado(id_usuario, estado, idUsuario) {
    try {
      usuarioRepo.cambiarEstado(id_usuario, estado);
      actividadRepo.registrar({
        accion: 'actualizacion',
        detalle: `Usuario ${estado === 'Activo' ? 'activado' : 'desactivado'} (#${id_usuario})`,
        entidad: 'usuario', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
};

/* ──────────────────────────────────────────────────────────────────────
   CONTROLADOR: BASE DE DATOS (copia de seguridad / restauración)
   El acceso a diálogos del SO se gestiona en los manejadores IPC; aquí
   solo se realizan las operaciones de archivo con rutas ya resueltas.
─────────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const dbController = {
  /** Información del archivo de base de datos actual. */
  info() {
    try {
      const ruta = getDbPath();
      let tamano = 0;
      let modificado = null;
      if (fs.existsSync(ruta)) {
        const st = fs.statSync(ruta);
        tamano = st.size;
        modificado = st.mtime.toISOString();
      }
      return { ok: true, data: { ruta, tamano, modificado } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Copia el archivo de base de datos al destino indicado. */
  backup(destino) {
    try {
      if (!destino) return { ok: false, error: 'Operación cancelada.' };
      const db = getDb();
      db.pragma('wal_checkpoint(TRUNCATE)');
      fs.copyFileSync(getDbPath(), destino);
      return { ok: true, data: { destino } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Restaura la base de datos desde el archivo de origen indicado. */
  restore(origen) {
    try {
      if (!origen) return { ok: false, error: 'Operación cancelada.' };
      if (!fs.existsSync(origen)) return { ok: false, error: 'El archivo seleccionado no existe.' };

      const { prepareForFileOperation } = require('../database/database');
      const destino = prepareForFileOperation();
      if (!destino) return { ok: false, error: 'No se pudo determinar la ruta de la base de datos.' };

      fs.copyFileSync(origen, destino);
      return { ok: true, data: { origen, destino } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
};

/* ──────────────────────────────────────────────────────────────────────
   CONTROLADOR: ROLES (administración dinámica de roles)
─────────────────────────────────────────────────────────────────────── */
const rolController = {
  listar() {
    try {
      return { ok: true, data: rolRepo.listar() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  listarActivos() {
    try {
      return { ok: true, data: rolRepo.listarActivos() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  crear({ nombre, descripcion }, idUsuario) {
    try {
      if (!nombre || !nombre.trim()) return { ok: false, error: 'El nombre del rol es obligatorio.' };
      const limpio = nombre.trim();
      if (rolRepo.existeNombre(limpio)) {
        return { ok: false, error: 'Ya existe un rol con ese nombre.' };
      }
      const r = rolRepo.crear({ nombre: limpio, descripcion: (descripcion || '').trim() || null });
      actividadRepo.registrar({
        accion: 'creacion', detalle: `Se creó el rol "${limpio}"`,
        entidad: 'rol', fk_id_usuario: idUsuario || null,
      });
      return { ok: true, data: { id_rol: r.lastInsertRowid } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  actualizar(id_rol, { nombre, descripcion }, idUsuario) {
    try {
      if (!nombre || !nombre.trim()) return { ok: false, error: 'El nombre del rol es obligatorio.' };
      const limpio = nombre.trim();
      if (rolRepo.existeNombre(limpio, id_rol)) {
        return { ok: false, error: 'Ya existe otro rol con ese nombre.' };
      }
      rolRepo.actualizar(id_rol, { nombre: limpio, descripcion: (descripcion || '').trim() || null });
      actividadRepo.registrar({
        accion: 'actualizacion', detalle: `Se actualizó el rol "${limpio}"`,
        entidad: 'rol', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  cambiarEstado(id_rol, estado, idUsuario) {
    try {
      rolRepo.cambiarEstado(id_rol, estado);
      actividadRepo.registrar({
        accion: 'actualizacion',
        detalle: `Rol ${estado === 'Activo' ? 'activado' : 'desactivado'} (#${id_rol})`,
        entidad: 'rol', fk_id_usuario: idUsuario || null,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
};

/* ──────────────────────────────────────────────────────────────────────
   CONTROLADOR: IMPORTACIÓN / EXPORTACIÓN DE EMPLEADOS (Excel / CSV)
   El acceso a diálogos del SO se gestiona en los manejadores IPC; aquí solo
   se procesan rutas ya resueltas.
─────────────────────────────────────────────────────────────────────── */
const importExportController = {
  /** Lee y valida un archivo (paso de previsualización, NO persiste nada). */
  previsualizar(ruta, opciones = {}) {
    try {
      if (!ruta) return { ok: false, error: 'Operación cancelada.' };
      return importExportService.parsearArchivo(ruta, opciones);
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Confirma la importación de las filas válidas previamente revisadas. */
  confirmar(filasValidas, idUsuario) {
    try {
      if (!Array.isArray(filasValidas) || !filasValidas.length) {
        return { ok: false, error: 'No hay registros válidos para importar.' };
      }
      return importExportService.importarEmpleados(filasValidas, idUsuario || null);
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Exporta empleados (activos/retirados/todos) a Excel o CSV. */
  exportar({ filtro = 'todos', formato = 'xlsx', rutaDestino }) {
    try {
      if (!rutaDestino) return { ok: false, error: 'Operación cancelada.' };
      return importExportService.exportarEmpleados(filtro, formato, rutaDestino);
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
};

module.exports = {
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
};
