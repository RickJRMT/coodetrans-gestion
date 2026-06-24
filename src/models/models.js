/**
 * models.js
 * Definiciones de entidades del dominio y utilidades de transformación.
 *
 * En esta arquitectura, los repositorios ejecutan el SQL y los modelos
 * describen la forma de las entidades y aportan helpers de mapeo/derivación
 * (por ejemplo, calcular el estado de stock de un artículo).
 */

/* ──────────────────────────────────────────────────────────────────────
   DEFINICIÓN DE ENTIDADES (referencia de campos)
─────────────────────────────────────────────────────────────────────── */
const Entidades = {
  Area: ['id_area', 'nom_area'],
  Cargo: ['id_cargo', 'nom_cargo', 'fk_id_area'],
  UbicacionFisica: ['id_ubicacion', 'ubicacion_fisica'],
  Talla: ['id_talla', 'camisa', 'pantalon', 'calzado'],
  Empleado: [
    'id_empleado', 'cedula', 'nombre_completo', 'genero', 'fecha_ingreso',
    'fecha_retiro', 'estado', 'observaciones', 'fk_id_cargo',
    'fk_id_ubicacion', 'fk_id_talla',
  ],
  Usuario: ['id_usuario', 'username', 'rol', 'password', 'intentos_fallidos', 'ultimo_acceso', 'fk_id_empleado'],
  Articulo: ['id_articulo', 'nombre_item', 'stock_minimo', 'vencimiento', 'fk_id_area'],
  ArticuloTallaStock: ['id_stock_variante', 'fk_id_articulo', 'fk_id_talla', 'stock_actual'],
  EntregaDotacion: ['id_entrega', 'fecha_entrega', 'periodo', 'fk_id_empleado', 'fk_id_usuario'],
  DetalleEntrega: ['id_detalle', 'cantidad', 'talla_entregada', 'fk_id_entrega', 'fk_id_stock_variante'],
  ActividadReciente: ['id_actividad', 'accion', 'detalle', 'entidad', 'fk_id_empleado', 'fk_id_usuario', 'fecha'],
};

/* ──────────────────────────────────────────────────────────────────────
   HELPERS DE DOMINIO
─────────────────────────────────────────────────────────────────────── */

/**
 * Determina el estado de stock de un artículo según su stock total y mínimo.
 *  - 'critico': stock total por debajo del 50% del mínimo
 *  - 'bajo':    stock total por debajo del mínimo
 *  - 'normal':  stock total igual o superior al mínimo
 */
function estadoStock(stockTotal, stockMinimo) {
  if (stockMinimo <= 0) return 'normal';
  if (stockTotal < stockMinimo * 0.5) return 'critico';
  if (stockTotal < stockMinimo) return 'bajo';
  return 'normal';
}

/**
 * Agrupa una lista de artículos (con stock_total y stock_minimo) por área,
 * contabilizando cuántos están en estado normal / bajo / crítico.
 * Devuelve un objeto keyed por nombre de área.
 */
function resumenStockPorArea(articulos) {
  const resumen = {};
  for (const art of articulos) {
    const area = art.nom_area || 'Uso General';
    if (!resumen[area]) {
      resumen[area] = { area, normal: 0, bajo: 0, critico: 0, total: 0 };
    }
    const estado = estadoStock(art.stock_total, art.stock_minimo);
    resumen[area][estado] += 1;
    resumen[area].total += 1;
  }
  return resumen;
}

/**
 * Construye una etiqueta legible de la variante de talla a partir de los
 * campos camisa / pantalon / calzado. Omite valores vacíos o 'N/A'.
 *  - Ej.: { camisa:'M', pantalon:'32', calzado:'42' } -> 'C: M · P: 32 · Z: 42'
 *  - Ej.: { camisa:'Única' } -> 'Única'
 */
function varianteLabel({ camisa, pantalon, calzado } = {}) {
  const partes = [];
  const valido = (v) => v && v !== 'N/A';
  if (valido(camisa)) partes.push(`C: ${camisa}`);
  if (valido(pantalon)) partes.push(`P: ${pantalon}`);
  if (valido(calzado)) partes.push(`Z: ${calzado}`);
  if (partes.length === 0) return 'Única';
  // Si solo hay una talla "Única", mostrarla limpia
  if (partes.length === 1 && /Única/i.test(partes[0])) return 'Única';
  return partes.join(' · ');
}

module.exports = {
  Entidades,
  estadoStock,
  resumenStockPorArea,
  varianteLabel,
};
