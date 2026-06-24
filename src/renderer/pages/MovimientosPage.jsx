import { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Eye, Truck, AlertTriangle, RefreshCw, Trash2, PackagePlus,
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const PERIODOS = ['Abril', 'Agosto', 'Diciembre'];

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const hoy = () => new Date().toISOString().slice(0, 10);

function Skeleton() {
  return (
    <Card className="p-4"><div className="animate-pulse space-y-3">
      {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-10 bg-canvas rounded-lg" />)}
    </div></Card>
  );
}

export default function MovimientosPage() {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id_usuario;

  const [entregas, setEntregas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');

  // Modal detalle
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [detalle, setDetalle] = useState([]);
  const [entregaSel, setEntregaSel] = useState(null);
  const [cargandoDet, setCargandoDet] = useState(false);

  // Modal nueva entrega
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({ fk_id_empleado: '', periodo: 'Abril', fecha_entrega: hoy() });
  const [items, setItems] = useState([{ fk_id_stock_variante: '', cantidad: 1 }]);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const [ent, emp, vars] = await Promise.all([
        api.movimientos.listarEntregas({}),
        api.empleados.listar(),
        api.inventario.variantes(),
      ]);
      if (ent.ok) setEntregas(ent.data); else setError(ent.error);
      if (emp.ok) setEmpleados(emp.data.filter((e) => e.estado === 'Activo'));
      if (vars.ok) setVariantes(vars.data);
    } catch {
      setError('Error de comunicación con la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return entregas.filter((e) => {
      if (filtroPeriodo && e.periodo !== filtroPeriodo) return false;
      if (q && !(`${e.empleado} ${e.cedula}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [entregas, busqueda, filtroPeriodo]);

  /* ── Ver detalle ── */
  const verDetalle = async (e) => {
    setEntregaSel(e);
    setDetalleAbierto(true);
    setCargandoDet(true);
    try {
      const res = await api.movimientos.detalleEntrega(e.id_entrega);
      setDetalle(res.ok ? res.data : []);
    } catch {
      setDetalle([]);
    } finally {
      setCargandoDet(false);
    }
  };

  /* ── Nueva entrega ── */
  const abrirNueva = () => {
    setForm({ fk_id_empleado: '', periodo: 'Abril', fecha_entrega: hoy() });
    setItems([{ fk_id_stock_variante: '', cantidad: 1 }]);
    setErrorForm('');
    setModalAbierto(true);
  };

  const cambiarItem = (i, campo, valor) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)));
  };
  const agregarItem = () => setItems((arr) => [...arr, { fk_id_stock_variante: '', cantidad: 1 }]);
  const quitarItem = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i));

  const guardar = async () => {
    setErrorForm('');
    if (!form.fk_id_empleado) return setErrorForm('Seleccione un empleado.');
    if (!form.fecha_entrega) return setErrorForm('Indique la fecha de entrega.');
    const detalles = items
      .filter((it) => it.fk_id_stock_variante && Number(it.cantidad) > 0)
      .map((it) => {
        const v = variantes.find((x) => String(x.id_stock_variante) === String(it.fk_id_stock_variante));
        return {
          fk_id_stock_variante: Number(it.fk_id_stock_variante),
          cantidad: Number(it.cantidad),
          talla_entregada: v ? v.variante : null,
        };
      });
    if (!detalles.length) return setErrorForm('Agregue al menos un artículo con cantidad.');

    setGuardando(true);
    try {
      const res = await api.movimientos.crearEntrega({
        fk_id_empleado: Number(form.fk_id_empleado),
        periodo: form.periodo, fecha_entrega: form.fecha_entrega, detalles,
      }, idUsuario);
      if (!res.ok) { setErrorForm(res.error); return; }
      setModalAbierto(false);
      await cargar();
    } catch {
      setErrorForm('No fue posible registrar la entrega.');
    } finally {
      setGuardando(false);
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

  return (
    <div className="space-y-5">
      {/* Barra de herramientas */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <Input icon={Search} placeholder="Buscar por empleado o cédula..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="min-w-[160px]">
              <option value="">Todos los períodos</option>
              {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Button icon={Plus} onClick={abrirNueva}>Nueva entrega</Button>
          </div>
        </div>
        <p className="text-xs text-muted mt-3">{filtradas.length} entrega(s)</p>
      </Card>

      {/* Tabla de entregas */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge bg-canvas/50">
                {['Fecha', 'Período', 'Empleado', 'Artículos', 'Unidades', 'Registró', 'Detalle'].map((h) => (
                  <th key={h} className="text-left font-semibold text-subtle text-xs uppercase
                    tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-10">
                  No hay entregas registradas con los filtros aplicados.
                </td></tr>
              ) : filtradas.map((e) => (
                <tr key={e.id_entrega} className="border-b border-edge/70 last:border-0
                  hover:bg-canvas/60 transition-colors">
                  <td className="px-4 py-3 text-ink">{fmt(e.fecha_entrega)}</td>
                  <td className="px-4 py-3"><Badge tone="info">{e.periodo}</Badge></td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-dark">{e.empleado}</p>
                    <p className="text-xs text-muted">{e.cedula}</p>
                  </td>
                  <td className="px-4 py-3 text-ink">{e.items}</td>
                  <td className="px-4 py-3 font-semibold text-ink-dark">{e.total_unidades}</td>
                  <td className="px-4 py-3 text-muted">{e.usuario || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => verDetalle(e)} title="Ver detalle"
                      className="grid place-items-center w-8 h-8 rounded-lg text-subtle
                        hover:bg-primary-light hover:text-primary transition-colors">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Modal: detalle de entrega ── */}
      <Modal
        open={detalleAbierto}
        onClose={() => setDetalleAbierto(false)}
        title={`Detalle de entrega — ${entregaSel?.empleado || ''}`}
        footer={<Button variant="secondary" onClick={() => setDetalleAbierto(false)}>Cerrar</Button>}
      >
        {cargandoDet ? (
          <div className="grid place-items-center py-10 text-subtle"><RefreshCw className="animate-spin" /></div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 text-sm text-muted">
              <Badge tone="info">{entregaSel?.periodo}</Badge>
              <span>{fmt(entregaSel?.fecha_entrega)}</span>
            </div>
            {detalle.length === 0 ? (
              <p className="text-center text-muted py-6">Sin artículos registrados.</p>
            ) : (
              <ul className="divide-y divide-edge/70 border border-edge rounded-lg overflow-hidden">
                {detalle.map((d) => (
                  <li key={d.id_detalle} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-ink flex items-center gap-2">
                      <Truck size={14} className="text-muted" />{d.nombre_item}
                    </span>
                    <span className="text-muted">Talla {d.talla_entregada || '—'} · x{d.cantidad}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Modal>

      {/* ── Modal: nueva entrega ── */}
      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Registrar nueva entrega de dotación"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalAbierto(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Registrar entrega'}
            </Button>
          </>
        }
      >
        {errorForm && (
          <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm
            rounded-lg px-3 py-2"><AlertTriangle size={16} /> {errorForm}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Empleado *" value={form.fk_id_empleado} className="sm:col-span-1"
            onChange={(e) => setForm((f) => ({ ...f, fk_id_empleado: e.target.value }))}>
            <option value="">Seleccione...</option>
            {empleados.map((e) => (
              <option key={e.id_empleado} value={e.id_empleado}>{e.nombre_completo}</option>
            ))}
          </Select>
          <Select label="Período *" value={form.periodo}
            onChange={(e) => setForm((f) => ({ ...f, periodo: e.target.value }))}>
            {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Input type="date" label="Fecha de entrega *" value={form.fecha_entrega}
            onChange={(e) => setForm((f) => ({ ...f, fecha_entrega: e.target.value }))} />
        </div>

        {/* Artículos */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-subtle uppercase tracking-wide
              flex items-center gap-1.5"><PackagePlus size={14} /> Artículos a entregar</p>
            <Button size="sm" variant="secondary" icon={Plus} onClick={agregarItem}>Agregar</Button>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex items-end gap-2">
                <Select label={i === 0 ? 'Variante' : undefined} value={it.fk_id_stock_variante}
                  className="flex-1"
                  onChange={(e) => cambiarItem(i, 'fk_id_stock_variante', e.target.value)}>
                  <option value="">Seleccione un artículo...</option>
                  {variantes.map((v) => (
                    <option key={v.id_stock_variante} value={v.id_stock_variante}>
                      {v.nombre_item} — {v.variante} (stock: {v.stock_actual})
                    </option>
                  ))}
                </Select>
                <Input inputMode="numeric" min="1" label={i === 0 ? 'Cant.' : undefined}
                  className="w-20" value={it.cantidad}
                  onChange={(e) => cambiarItem(i, 'cantidad', e.target.value.replace(/[^\d]/g, ''))} />
                <button onClick={() => quitarItem(i)} disabled={items.length === 1}
                  title="Quitar"
                  className="grid place-items-center w-10 h-[42px] rounded-lg text-muted
                    hover:bg-danger-light hover:text-danger transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
