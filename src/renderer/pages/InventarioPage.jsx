import { useEffect, useMemo, useState } from 'react';
import {
  Search, AlertTriangle, RefreshCw, Boxes, PackageCheck, Layers,
  Plus, Pencil, Trash2, SlidersHorizontal, Tag, Package,
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import VariantesTable from '../components/VariantesTable';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatTalla } from '../utils/format';

const TONO_ESTADO = { normal: 'ok', bajo: 'bajo', critico: 'critico' };
const ETIQUETA_ESTADO = { normal: 'Normal', bajo: 'Bajo', critico: 'Crítico' };

/** Categorías de talla (campo libre en mayúsculas). */
const CATEGORIAS_TALLA = {
  Camisa: { campo: 'camisa', placeholder: 'S, M, L, XL, XXL...' },
  Pantalón: { campo: 'pantalon', placeholder: '28, 30, 32, 34...' },
  Zapato: { campo: 'calzado', placeholder: '37, 38, 39, 40...' },
  General: { campo: 'general', placeholder: 'Única, Estándar, Personalizado...' },
};

const ART_VACIO = { nombre_item: '', fk_id_area: '', stock_minimo: '10', vencimiento: false };
const VAR_VACIA = { fk_id_articulo: '', categoria: 'Camisa', talla: '', nombre_general: '', stock_actual: '0' };

function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T'));
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* Solo permite enteros (positivos) en los inputs de cantidad */
function soloEnteros(valor) {
  return valor.replace(/[^\d]/g, '');
}

/* ─── Tarjeta de stock por área ─────────────────────────────────────── */
function StockAreaCard({ area, normal, bajo, critico, total }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-ink-dark truncate" title={area}>{area}</h4>
        <Badge tone="info">{total} ítems</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center py-2 rounded-lg bg-ok-light">
          <p className="text-xl font-bold text-ok-dark">{normal}</p>
          <p className="text-[10px] font-medium text-ok-dark/80 uppercase tracking-wide">Normal</p>
        </div>
        <div className="text-center py-2 rounded-lg bg-warn-light">
          <p className="text-xl font-bold text-warn">{bajo}</p>
          <p className="text-[10px] font-medium text-warn/80 uppercase tracking-wide">Bajo</p>
        </div>
        <div className="text-center py-2 rounded-lg bg-danger-light">
          <p className="text-xl font-bold text-danger">{critico}</p>
          <p className="text-[10px] font-medium text-danger/80 uppercase tracking-wide">Crítico</p>
        </div>
      </div>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4"><div className="animate-pulse h-24 bg-canvas rounded-lg" /></Card>
        ))}
      </div>
      <Card className="p-4"><div className="animate-pulse space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-canvas rounded-lg" />)}
      </div></Card>
    </div>
  );
}

export default function InventarioPage() {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id_usuario;

  const [resumen, setResumen] = useState({});
  const [articulos, setArticulos] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 180);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Modal artículo (crear / editar dotación)
  const [artAbierto, setArtAbierto] = useState(false);
  const [artEditando, setArtEditando] = useState(null);
  const [artForm, setArtForm] = useState(ART_VACIO);
  const [artError, setArtError] = useState('');
  const [artGuardando, setArtGuardando] = useState(false);

  // Modal variante (crear variante de talla)
  const [varAbierto, setVarAbierto] = useState(false);
  const [varForm, setVarForm] = useState(VAR_VACIA);
  const [varError, setVarError] = useState('');
  const [varGuardando, setVarGuardando] = useState(false);

  // Modal ajustar stock
  const [stockAbierto, setStockAbierto] = useState(false);
  const [stockVariante, setStockVariante] = useState(null);
  const [cantidadMovimiento, setCantidadMovimiento] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('sumar');
  const [stockError, setStockError] = useState('');
  const [stockGuardando, setStockGuardando] = useState(false);

  // Modal confirmación de borrado
  const [confirmar, setConfirmar] = useState(null); // { tipo, id, nombre }
  const [borrando, setBorrando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [res, arts, vars, ar] = await Promise.all([
        api.inventario.resumen(),
        api.inventario.listar(),
        api.inventario.variantes(),
        api.catalogos.areasActivas(),
      ]);
      if (res.ok) setResumen(res.data);
      if (arts.ok) setArticulos(arts.data); else setError(arts.error);
      if (vars.ok) setVariantes(vars.data); else setError(vars.error);
      if (ar.ok) setAreas(ar.data);
    } catch {
      setError('Error de comunicación con la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // Áreas para el filtro (a partir de las variantes con stock)
  const areasFiltro = useMemo(() => {
    const set = new Map();
    variantes.forEach((v) => { if (v.nom_area) set.set(v.fk_id_area, v.nom_area); });
    return Array.from(set, ([id, nom]) => ({ id, nom }));
  }, [variantes]);

  const filtrados = useMemo(() => {
    const q = busquedaDebounced.trim().toLowerCase();

    return variantes.filter((v) => {
      if (filtroArea && String(v.fk_id_area) !== String(filtroArea)) return false;
      if (filtroEstado && v.estado !== filtroEstado) return false;
      const nombreVisual = v.general && v.nombre_general
        ? v.nombre_general
        : v.variante;
      if (
        q &&
        !(`${v.nombre_item} ${nombreVisual}`.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [variantes, busquedaDebounced, filtroArea, filtroEstado]);

  /* ── Artículo: crear / editar ── */
  const abrirArtNuevo = () => {
    setArtEditando(null);
    setArtForm(ART_VACIO);
    setArtError('');
    setArtAbierto(true);
  };
  const abrirArtEditar = (a) => {
    setArtEditando(a.id_articulo);
    setArtForm({
      nombre_item: a.nombre_item || '',
      fk_id_area: a.fk_id_area || '',
      stock_minimo: String(a.stock_minimo ?? '10'),
      vencimiento: !!a.vencimiento,
    });
    setArtError('');
    setArtAbierto(true);
  };
  const guardarArt = async () => {
    setArtError('');
    if (!artForm.nombre_item.trim()) return setArtError('El nombre de la dotación es obligatorio.');
    if (artForm.stock_minimo === '' || Number(artForm.stock_minimo) < 0) {
      return setArtError('El stock mínimo debe ser un entero mayor o igual a 0.');
    }
    setArtGuardando(true);
    try {
      const datos = {
        nombre_item: artForm.nombre_item.trim(),
        fk_id_area: artForm.fk_id_area || null,
        stock_minimo: Number(artForm.stock_minimo),
        vencimiento: artForm.vencimiento,
      };
      const res = artEditando
        ? await api.inventario.actualizarArticulo(artEditando, datos, idUsuario)
        : await api.inventario.crearArticulo(datos, idUsuario);
      if (!res.ok) { setArtError(res.error); return; }
      setArtAbierto(false);
      await cargarDatos();
    } catch {
      setArtError('No fue posible guardar la dotación.');
    } finally {
      setArtGuardando(false);
    }
  };

  /* ── Variante: crear ── */
  const abrirVarNueva = (idArticulo = '') => {
    setVarForm({ ...VAR_VACIA, fk_id_articulo: idArticulo });
    setVarError('');
    setVarAbierto(true);
  };
  const guardarVar = async () => {
    setVarError('');
    if (varForm.categoria === "General" && !varForm.nombre_general.trim()) {
      return setVarError("Debe indicar el nombre de la prenda.");
    }
    if (!varForm.fk_id_articulo) return setVarError('Debe seleccionar una dotación.');
    if (!varForm.talla.trim()) return setVarError('Debe indicar una talla.');
    if (varForm.stock_actual === '' || Number(varForm.stock_actual) < 0) {
      return setVarError('El stock debe ser un entero mayor o igual a 0.');
    }
    setVarGuardando(true);
    try {
      const campo = CATEGORIAS_TALLA[varForm.categoria].campo;
      const tallaNorm = formatTalla(varForm.talla.trim());
      const datos = {
        fk_id_articulo: Number(varForm.fk_id_articulo),
        camisa: null, pantalon: null, calzado: null,
        nombre_general:
          varForm.categoria === "General"
            ? varForm.nombre_general.trim()
            : null,
        [campo]: tallaNorm,
        stock_actual: Number(varForm.stock_actual),
      };
      const res = await api.inventario.crearVariante(datos, idUsuario);
      if (!res.ok) { setVarError(res.error); return; }
      setVarAbierto(false);
      await cargarDatos();
    } catch {
      setVarError('No fue posible guardar la variante.');
    } finally {
      setVarGuardando(false);
    }
  };

  /* ── Ajustar stock de una variante ── */
  const abrirAjuste = (v) => {
    setStockVariante(v);
    setCantidadMovimiento('');
    setTipoMovimiento('sumar');
    setStockError('');
    setStockAbierto(true);
  };
  const guardarStock = async () => {
    setStockError('');
    if (cantidadMovimiento === '' || Number(cantidadMovimiento) <= 0) {
      return setStockError(
        'La cantidad debe ser un número entero mayor que 0.'
      );
    }
    const cantidad = Number(cantidadMovimiento);

    const nuevoStock =
      tipoMovimiento === 'sumar'
        ? Number(stockVariante.stock_actual) + cantidad
        : Number(stockVariante.stock_actual) - cantidad;

    if (nuevoStock < 0) {
      return setStockError(
        'No es posible descontar más unidades de las disponibles.'
      );
    }

    setStockGuardando(true);

    try {
      const res = await api.inventario.ajustarStock({
        id_stock_variante: stockVariante.id_stock_variante,
        stock_actual: nuevoStock,
      },
        idUsuario);

      if (!res.ok) {
        setStockError(res.error);
        return;
      }
      setStockAbierto(false);
      await cargarDatos();
    } catch {
      setStockError('No fue posible actualizar el stock.');
    } finally {
      setStockGuardando(false);
    }
  };

  const abrirConfimacion = (tipo, id, nombre) => {
    setErrorEliminar('');
    setConfirmar({
      tipo,
      id,
      nombre,
    });
  };

  /* ── Eliminar (artículo o variante) ── */
  const ejecutarBorrado = async () => {
    if (!confirmar) return;
    setBorrando(true);
    setErrorEliminar('');
    try {
      const res = confirmar.tipo === 'articulo'
        ? await api.inventario.eliminarArticulo(confirmar.id, idUsuario)
        : await api.inventario.eliminarVariante(confirmar.id, idUsuario);
      // Validacion
      if (!res.ok) {
        setErrorEliminar(res.error);
        return;
      }
      setConfirmar(null);
      await cargarDatos();
    } catch {
      setError("No fue posible eliminar el registro.");
    } finally {
      setBorrando(false);
    }
  };

  if (cargando) return <Skeleton />;
  if (error) {
    return (
      <Card className="p-8 text-center text-danger">
        <AlertTriangle className="mx-auto mb-2" /> {error}
      </Card>
    );
  }

  const categoriaTalla = CATEGORIAS_TALLA[varForm.categoria];

  const stockResultante = stockVariante
    ? (
      tipoMovimiento === 'sumar'
        ? Number(stockVariante.stock_actual) + Number(cantidadMovimiento || 0)
        : Number(stockVariante.stock_actual) - Number(cantidadMovimiento || 0)
    ) : 0;

  return (
    <div className="space-y-5">
      {/* Stock por área */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Boxes size={18} className="text-primary" />
          <h2 className="text-sm font-bold text-ink-dark uppercase tracking-wide">
            Estado de Stock por Área
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.values(resumen).length === 0 ? (
            <Card className="p-6 text-center text-muted col-span-full">Sin datos de stock.</Card>
          ) : Object.values(resumen).map((s) => <StockAreaCard key={s.area} {...s} />)}
        </div>
      </div>

      {/* Administración de dotaciones (artículos) */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-edge">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary-light text-primary">
            <Package size={18} />
          </span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink-dark">Dotaciones registradas</h3>
            <p className="text-xs text-subtle">{articulos.length} dotación(es)</p>
          </div>
          <Button size="sm" icon={Plus} onClick={abrirArtNuevo}>Nueva dotación</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge bg-canvas/50">
                {['Dotación', 'Área', 'Stock total', 'Stock mínimo', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left font-semibold text-subtle text-xs uppercase
                    tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articulos.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-10">
                  No hay dotaciones registradas. Cree la primera con "Nueva dotación".
                </td></tr>
              ) : articulos.map((a) => (
                <tr key={a.id_articulo} className="border-b border-edge/70 last:border-0
                  hover:bg-canvas/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-medium text-ink-dark">
                      <PackageCheck size={15} className="text-muted" />{a.nombre_item}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">{a.nom_area || '—'}</td>
                  <td className="px-4 py-3 font-bold text-ink-dark">{a.stock_total}</td>
                  <td className="px-4 py-3 text-muted">{a.stock_minimo}</td>
                  <td className="px-4 py-3">
                    <Badge tone={TONO_ESTADO[a.estado]} dot>{ETIQUETA_ESTADO[a.estado]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => abrirVarNueva(a.id_articulo)} title="Agregar variante de talla"
                        className="grid place-items-center w-8 h-8 rounded-lg text-subtle
                          hover:bg-primary-light hover:text-primary transition-colors">
                        <Tag size={16} />
                      </button>
                      <button onClick={() => abrirArtEditar(a)} title="Editar dotación"
                        className="grid place-items-center w-8 h-8 rounded-lg text-subtle
                          hover:bg-primary-light hover:text-primary transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => abrirConfimacion('articulo', a.id_articulo, a.nombre_item)}
                        title="Eliminar dotación"
                        className="grid place-items-center w-8 h-8 rounded-lg text-subtle
                          hover:bg-danger-light hover:text-danger transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Filtros de variantes — Diseño mejorado */}
      <Card className="p-4">
        <div className="mb-4">
          <Input
            icon={Search}
            placeholder="Buscar artículo o variante..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="[&_input]:py-3 [&_input]:text-base"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] items-end">
          <div className="flex flex-wrap gap-2 items-end">
            <Select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="w-full sm:w-[140px]"
              aria-label="Filtrar por área"
            >
              <option value="">Área</option>
              {areasFiltro.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </Select>
            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full sm:w-[140px]"
              aria-label="Filtrar por estado"
            >
              <option value="">Estado</option>
              <option value="normal">Normal</option>
              <option value="bajo">Bajo</option>
              <option value="critico">Crítico</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => abrirVarNueva('')}
              className="w-full sm:w-auto"
            >
              Nueva variante
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted mt-3">{filtrados.length} variante(s)</p>
      </Card>

      {/* Tabla de variantes */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-edge">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary-light text-primary">
            <Layers size={18} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink-dark">Stock por variante de talla</h3>
            <p className="text-xs text-subtle">{filtrados.length} variante(s)</p>
          </div>
        </div>
        <VariantesTable
          items={filtrados}
          TONO_ESTADO={TONO_ESTADO}
          ETIQUETA_ESTADO={ETIQUETA_ESTADO}
          fmtFecha={fmtFecha}
          onAjuste={abrirAjuste}
          onDelete={(v) =>
            abrirConfimacion(
              'variante',
              v.id_stock_variante,
              `${v.nombre_item} · ${v.general && v.nombre_general
                ? v.nombre_general
                : v.variante
              }`
            )
          }
        />
      </Card>

      {/* ── Modal: artículo (crear / editar) ── */}
      <Modal
        open={artAbierto}
        onClose={() => {
          setArtAbierto(false);
        }}
        title={artEditando ? 'Editar dotación' : 'Nueva dotación'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setArtAbierto(false)} disabled={artGuardando}>Cancelar</Button>
            <Button onClick={guardarArt} disabled={artGuardando} icon={artGuardando ? RefreshCw : undefined}>
              {artGuardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        {artError && (
          <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm rounded-lg px-3 py-2">
            <AlertTriangle size={16} /> {artError}
          </div>
        )}
        <div className="space-y-4">
          <Input label="Nombre de la dotación *" value={artForm.nombre_item}
            onChange={(e) => setArtForm((f) => ({ ...f, nombre_item: e.target.value }))}
            placeholder="Ej.: Camisa institucional, Botas de seguridad..." />
          <Select label="Área" value={artForm.fk_id_area}
            onChange={(e) => setArtForm((f) => ({ ...f, fk_id_area: e.target.value }))}>
            <option value="">Sin área específica</option>
            {areas.map((a) => <option key={a.id_area} value={a.id_area}>{a.nom_area}</option>)}
          </Select>
          <Input label="Stock mínimo *" inputMode="numeric" value={artForm.stock_minimo} maxLength={4}
            onChange={(e) => setArtForm((f) => ({ ...f, stock_minimo: soloEnteros(e.target.value) }))}
            placeholder="10" />
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input type="checkbox" checked={artForm.vencimiento}
              onChange={(e) => setArtForm((f) => ({ ...f, vencimiento: e.target.checked }))}
              className="w-4 h-4 rounded border-edge text-primary focus:ring-primary/25" />
            Esta dotación tiene fecha de vencimiento
          </label>
        </div>
      </Modal>

      {/* ── Modal: variante de talla ── */}
      <Modal
        open={varAbierto}
        onClose={() => {
          setVarAbierto(false);
        }}
        title="Nueva variante de talla"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setVarAbierto(false)} disabled={varGuardando}>Cancelar</Button>
            <Button onClick={guardarVar} disabled={varGuardando} icon={varGuardando ? RefreshCw : undefined}>
              {varGuardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        {varError && (
          <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm rounded-lg px-3 py-2">
            <AlertTriangle size={16} /> {varError}
          </div>
        )}
        <div className="space-y-4">
          <Select label="Dotación *" value={varForm.fk_id_articulo}
            onChange={(e) => setVarForm((f) => ({ ...f, fk_id_articulo: e.target.value }))}>
            <option value="">Seleccione...</option>
            {articulos.map((a) => <option key={a.id_articulo} value={a.id_articulo}>{a.nombre_item}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Categoría *" value={varForm.categoria}
              onChange={(e) => setVarForm((f) => ({ ...f, categoria: e.target.value, talla: '' }))}>
              {Object.keys(CATEGORIAS_TALLA).map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            {varForm.categoria === "General" && (
              <Input
                label="Nombre de la prenda *"
                value={varForm.nombre_general}
                placeholder="Ej.: Gorra, Casco, Chaleco..."
                onChange={(e) =>
                  setVarForm((f) => ({
                    ...f,
                    nombre_general: e.target.value,
                  }))
                }
              />
            )}
            <Input label="Talla *" value={varForm.talla}
              placeholder={categoriaTalla?.placeholder || 'Ingrese la talla'}
              onChange={(e) => setVarForm((f) => ({ ...f, talla: formatTalla(e.target.value) }))} />
          </div>
          <Input label="Stock inicial *" inputMode="numeric" value={varForm.stock_actual}
            onChange={(e) => {
              const valor = soloEnteros(e.target.value);

              if (Number(valor) <= 9999 || valor === "") {
                setVarForm((f) => ({
                  ...f,
                  stock_actual: valor,
                }));
              }
            }}
            placeholder="Ingrese stock inicial" />
          <p className="text-xs text-muted">
            Si la combinación dotación + talla ya existe, el stock indicado se sumará al actual.
          </p>
        </div>
      </Modal>

      {/* ── Modal: ajustar stock ── */}
      <Modal
        open={stockAbierto}
        onClose={() => {
          setStockAbierto(false);
          setCantidadMovimiento('');
          setTipoMovimiento('sumar');
          setStockError('');
          setStockVariante(null);
        }}
        title="Ajustar stock"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStockAbierto(false)} disabled={stockGuardando}>Cancelar</Button>
            <Button
              onClick={guardarStock}
              disabled={stockGuardando}
              icon={stockGuardando ? RefreshCw : undefined}
            >
              {stockGuardando
                ? 'Guardando...'
                : tipoMovimiento === 'sumar'
                  ? 'Agregar stock'
                  : 'Descontar stock'}
            </Button>
          </>
        }
      >
        {stockError && (
          <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm rounded-lg px-3 py-2">
            <AlertTriangle size={16} /> {stockError}
          </div>
        )}
        {stockVariante && (
          <p className="text-sm text-muted mb-3">
            {stockVariante.nombre_item} · <span className="font-medium text-ink">{stockVariante.variante}</span>
          </p>
        )}
        <p className="text-sm font-semibold mb-3">
          Stock actual: {stockVariante?.stock_actual}
        </p>
        
        <div className="mb-4 p-3 bg-primary-light/50 rounded-lg border border-primary/20">
          <p className="text-xs text-primary-dark font-medium mb-2">Cómo funciona:</p>
          <ol className="text-xs text-primary-dark/80 space-y-1 list-decimal list-inside">
            <li>Ingresa la cantidad</li>
            <li>Selecciona <span className="font-semibold">Agregar</span> o <span className="font-semibold">Descontar</span></li>
            <li>Confirma con el botón correspondiente</li>
          </ol>
        </div>

        <Input
          label="Cantidad"
          inputMode="numeric"
          maxLength={4}
          value={cantidadMovimiento}
          onChange={(e) => setCantidadMovimiento(soloEnteros(e.target.value))}
          placeholder="0"
        />
        <p className="mt-2 text-sm text-muted">
          Stock resultante:{' '}
          <span
            className={`font-semibold ${stockResultante < 0 ? 'text-danger' : 'text-ink-dark'
              }`}
          >
            {Math.max(0, stockResultante)}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            variant={tipoMovimiento === "sumar" ? "primary" : "secondary"}
            onClick={() => setTipoMovimiento("sumar")}
          >
            + Agregar
          </Button>

          <Button
            variant={tipoMovimiento === "restar" ? "danger" : "secondary"}
            onClick={() => setTipoMovimiento("restar")}
          >
            - Descontar
          </Button>
        </div>
      </Modal>

      {/* ── Modal: confirmar borrado ── */}
      <Modal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        title="Confirmar eliminación"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmar(null)} disabled={borrando}>Cancelar</Button>
            <Button variant="danger" onClick={ejecutarBorrado} disabled={borrando}
              icon={borrando ? RefreshCw : Trash2}>
              {borrando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </>
        }
      >
        {errorEliminar && (
          <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm rounded-lg px-3 py-2">
            <AlertTriangle size={16} />
            {errorEliminar}
          </div>
        )}
        <p className="text-sm text-ink">
          ¿Está seguro de eliminar {confirmar?.tipo === 'articulo' ? 'la dotación' : 'la variante'}{' '}
          <span className="font-semibold">{confirmar?.nombre}</span>?
        </p>
        {confirmar?.tipo === 'articulo' && (
          <p className="text-xs text-danger mt-2">
            Se eliminarán también todas sus variantes de talla y su stock asociado.
          </p>
        )}
      </Modal>
    </div >
  );
}
