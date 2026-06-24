import { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Pencil, History, MapPin, AlertTriangle, RefreshCw,
  FolderOpen, IdCard, Shirt,
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const GENEROS = ['Masculino', 'Femenino', 'Otro'];
const ESTADOS = ['Activo', 'Retirado'];

const FORM_VACIO = {
  cedula: '', nombre_completo: '', genero: 'Masculino', id_area: '',
  fk_id_cargo: '', camisa: '', pantalon: '', calzado: '',
  fecha_ingreso: '', fecha_retiro: '', estado: 'Activo',
  fk_id_ubicacion: '', observaciones: '',
};

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Esqueleto de carga ─────────────────────────────────────────────── */
function Skeleton() {
  return (
    <Card className="p-4">
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-canvas rounded-lg" />
        ))}
      </div>
    </Card>
  );
}

export default function CarpetasPage() {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id_usuario;

  const [empleados, setEmpleados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroArea, setFiltroArea] = useState('');

  // Modal edición/creación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // id_empleado o null
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Modal historial
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [empleadoHist, setEmpleadoHist] = useState(null);
  const [cargandoHist, setCargandoHist] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [emp, ar, ca, ub] = await Promise.all([
        api.empleados.listar(),
        api.catalogos.areasActivas(),
        api.catalogos.cargosActivos(),
        api.catalogos.ubicaciones(),
      ]);
      if (emp.ok) setEmpleados(emp.data); else setError(emp.error);
      if (ar.ok) setAreas(ar.data);
      if (ca.ok) setCargos(ca.data);
      if (ub.ok) setUbicaciones(ub.data);
    } catch {
      setError('Error de comunicación con la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  /* ── Filtrado en memoria ── */
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return empleados.filter((e) => {
      if (filtroEstado && e.estado !== filtroEstado) return false;
      if (filtroArea && String(e.id_area) !== String(filtroArea)) return false;
      if (q && !(`${e.nombre_completo} ${e.cedula}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [empleados, busqueda, filtroEstado, filtroArea]);

  // Cargos disponibles según el área seleccionada en el formulario
  const cargosForm = useMemo(
    () => cargos.filter((c) => String(c.fk_id_area) === String(form.id_area)),
    [cargos, form.id_area]
  );

  /* ── Abrir modal nuevo / editar ── */
  const abrirNuevo = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirEditar = (e) => {
    setEditando(e.id_empleado);
    setForm({
      cedula: e.cedula || '', nombre_completo: e.nombre_completo || '',
      genero: e.genero || 'Masculino', id_area: e.id_area || '',
      fk_id_cargo: e.fk_id_cargo || '', camisa: e.camisa || '',
      pantalon: e.pantalon || '', calzado: e.calzado || '',
      fecha_ingreso: e.fecha_ingreso || '', fecha_retiro: e.fecha_retiro || '',
      estado: e.estado || 'Activo', fk_id_ubicacion: e.fk_id_ubicacion || '',
      observaciones: e.observaciones || '',
    });
    setErrorForm('');
    setModalAbierto(true);
  };

  const cambiar = (campo, valor) => {
    setForm((f) => {
      const next = { ...f, [campo]: valor };
      // Al cambiar de área, reiniciar el cargo
      if (campo === 'id_area') next.fk_id_cargo = '';
      return next;
    });
  };

  const guardar = async () => {
    setErrorForm('');
    if (!form.cedula.trim()) return setErrorForm('La cédula es obligatoria.');
    if (!form.nombre_completo.trim()) return setErrorForm('El nombre completo es obligatorio.');
    if (!form.fk_id_ubicacion) return setErrorForm('Debe seleccionar una ubicación física.');
    if (form.estado === 'Retirado' && !form.fecha_retiro) {
      return setErrorForm('Indique la fecha de retiro para un empleado retirado.');
    }
    setGuardando(true);
    try {
      const datos = {
        cedula: form.cedula, nombre_completo: form.nombre_completo,
        genero: form.genero, fk_id_cargo: form.fk_id_cargo || null,
        camisa: form.camisa, pantalon: form.pantalon, calzado: form.calzado,
        fecha_ingreso: form.fecha_ingreso || null,
        fecha_retiro: form.estado === 'Retirado' ? form.fecha_retiro : null,
        estado: form.estado, fk_id_ubicacion: form.fk_id_ubicacion,
        observaciones: form.observaciones,
      };
      const res = editando
        ? await api.empleados.actualizar(editando, datos, idUsuario)
        : await api.empleados.crear(datos, idUsuario);
      if (!res.ok) { setErrorForm(res.error); return; }
      setModalAbierto(false);
      await cargarDatos();
    } catch {
      setErrorForm('No fue posible guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  /* ── Historial de dotaciones ── */
  const abrirHistorial = async (e) => {
    setEmpleadoHist(e);
    setHistorialAbierto(true);
    setCargandoHist(true);
    try {
      const res = await api.empleados.historial(e.id_empleado);
      setHistorial(res.ok ? res.data : []);
    } catch {
      setHistorial([]);
    } finally {
      setCargandoHist(false);
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
            <Input
              icon={Search}
              placeholder="Buscar por nombre o cédula..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className="min-w-[150px]">
              <option value="">Todos los estados</option>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}
              className="min-w-[160px]">
              <option value="">Todas las áreas</option>
              {areas.map((a) => <option key={a.id_area} value={a.id_area}>{a.nom_area}</option>)}
            </Select>
            <Button icon={Plus} onClick={abrirNuevo}>Nueva carpeta</Button>
          </div>
        </div>
        <p className="text-xs text-muted mt-3">
          {filtrados.length} de {empleados.length} carpeta(s)
        </p>
      </Card>

      {/* Tabla (escritorio) */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge bg-canvas/50">
                {['Empleado', 'Cédula', 'Área / Cargo', 'Ubicación', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left font-semibold text-subtle text-xs uppercase
                    tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-10">
                  No se encontraron carpetas con los filtros aplicados.
                </td></tr>
              ) : filtrados.map((e) => (
                <tr key={e.id_empleado} className="border-b border-edge/70 last:border-0
                  hover:bg-canvas/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-dark">{e.nombre_completo}</p>
                    <p className="text-xs text-muted">{e.genero || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink">{e.cedula}</td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{e.nom_area || '—'}</p>
                    <p className="text-xs text-muted">{e.nom_cargo || 'Sin cargo'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-ink">
                      <MapPin size={14} className="text-muted" />
                      {e.ubicacion_fisica || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={e.estado === 'Activo' ? 'ok' : 'neutral'} dot>{e.estado}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => abrirHistorial(e)} title="Ver historial de dotación"
                        className="grid place-items-center w-8 h-8 rounded-lg text-subtle
                          hover:bg-primary-light hover:text-primary transition-colors">
                        <History size={16} />
                      </button>
                      <button onClick={() => abrirEditar(e)} title="Editar carpeta"
                        className="grid place-items-center w-8 h-8 rounded-lg text-subtle
                          hover:bg-primary-light hover:text-primary transition-colors">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tarjetas (móvil) */}
      <div className="md:hidden space-y-3">
        {filtrados.length === 0 ? (
          <Card className="p-8 text-center text-muted">
            No se encontraron carpetas con los filtros aplicados.
          </Card>
        ) : filtrados.map((e) => (
          <Card key={e.id_empleado} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-ink-dark truncate">{e.nombre_completo}</p>
                <p className="text-xs text-muted flex items-center gap-1">
                  <IdCard size={13} /> {e.cedula}
                </p>
              </div>
              <Badge tone={e.estado === 'Activo' ? 'ok' : 'neutral'} dot>{e.estado}</Badge>
            </div>
            <div className="text-sm text-ink space-y-1 mb-3">
              <p>{e.nom_area || '—'} · <span className="text-muted">{e.nom_cargo || 'Sin cargo'}</span></p>
              <p className="flex items-center gap-1 text-muted text-xs">
                <MapPin size={13} /> {e.ubicacion_fisica || '—'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={History}
                onClick={() => abrirHistorial(e)}>Historial</Button>
              <Button size="sm" variant="secondary" icon={Pencil}
                onClick={() => abrirEditar(e)}>Editar</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Modal: crear / editar ── */}
      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editando ? 'Editar carpeta / hoja de vida' : 'Nueva carpeta / hoja de vida'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalAbierto(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando} icon={guardando ? RefreshCw : undefined}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        {errorForm && (
          <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm
            rounded-lg px-3 py-2">
            <AlertTriangle size={16} /> {errorForm}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Cédula *" value={form.cedula}
            onChange={(e) => cambiar('cedula', e.target.value)} />
          <Input label="Nombre completo *" value={form.nombre_completo}
            onChange={(e) => cambiar('nombre_completo', e.target.value)} />
          <Select label="Género" value={form.genero}
            onChange={(e) => cambiar('genero', e.target.value)}>
            {GENEROS.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
          <Select label="Ubicación física *" value={form.fk_id_ubicacion}
            onChange={(e) => cambiar('fk_id_ubicacion', e.target.value)}>
            <option value="">Seleccione...</option>
            {ubicaciones.map((u) => (
              <option key={u.id_ubicacion} value={u.id_ubicacion}>{u.ubicacion_fisica}</option>
            ))}
          </Select>
          <Select label="Área" value={form.id_area}
            onChange={(e) => cambiar('id_area', e.target.value)}>
            <option value="">Seleccione...</option>
            {areas.map((a) => <option key={a.id_area} value={a.id_area}>{a.nom_area}</option>)}
          </Select>
          <Select label="Cargo" value={form.fk_id_cargo}
            onChange={(e) => cambiar('fk_id_cargo', e.target.value)} disabled={!form.id_area}>
            <option value="">{form.id_area ? 'Seleccione...' : 'Seleccione un área primero'}</option>
            {cargosForm.map((c) => <option key={c.id_cargo} value={c.id_cargo}>{c.nom_cargo}</option>)}
          </Select>
        </div>

        {/* Tallas */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-2
            flex items-center gap-1.5"><Shirt size={14} /> Tallas de dotación</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Camisa" value={form.camisa}
              onChange={(e) => cambiar('camisa', e.target.value)} placeholder="S, M, L..." />
            <Input label="Pantalón" value={form.pantalon}
              onChange={(e) => cambiar('pantalon', e.target.value)} placeholder="30, 32..." />
            <Input label="Calzado" value={form.calzado}
              onChange={(e) => cambiar('calzado', e.target.value)} placeholder="38, 40..." />
          </div>
        </div>

        {/* Fechas y estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Input type="date" label="Fecha de ingreso" value={form.fecha_ingreso}
            onChange={(e) => cambiar('fecha_ingreso', e.target.value)} />
          <Select label="Estado" value={form.estado}
            onChange={(e) => cambiar('estado', e.target.value)}>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          {form.estado === 'Retirado' && (
            <Input type="date" label="Fecha de retiro" value={form.fecha_retiro}
              onChange={(e) => cambiar('fecha_retiro', e.target.value)} />
          )}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-subtle mb-1.5">Observaciones</label>
          <textarea rows={3} value={form.observaciones}
            onChange={(e) => cambiar('observaciones', e.target.value)}
            className="w-full rounded-lg border border-edge bg-white text-sm text-ink px-3 py-2.5
              focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
            placeholder="Notas adicionales sobre la hoja de vida..." />
        </div>
      </Modal>

      {/* ── Modal: historial de dotaciones ── */}
      <Modal
        open={historialAbierto}
        onClose={() => setHistorialAbierto(false)}
        title={`Historial de dotación — ${empleadoHist?.nombre_completo || ''}`}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setHistorialAbierto(false)}>Cerrar</Button>}
      >
        {cargandoHist ? (
          <div className="grid place-items-center py-10 text-subtle">
            <RefreshCw className="animate-spin" />
          </div>
        ) : historial.length === 0 ? (
          <div className="text-center py-10 text-muted">
            <FolderOpen className="mx-auto mb-2 opacity-50" size={32} />
            Este empleado aún no tiene entregas de dotación registradas.
          </div>
        ) : (
          <div className="space-y-4">
            {historial.map((h) => (
              <div key={h.id_entrega} className="border border-edge rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-canvas/60 border-b border-edge">
                  <div className="flex items-center gap-2">
                    <Badge tone="info">{h.periodo}</Badge>
                    <span className="text-sm font-medium text-ink">{fmt(h.fecha_entrega)}</span>
                  </div>
                  <span className="text-xs text-muted">Por: {h.usuario || '—'}</span>
                </div>
                <ul className="divide-y divide-edge/70">
                  {h.items.map((it) => (
                    <li key={it.id_detalle} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="text-ink">{it.nombre_item}</span>
                      <span className="text-muted">
                        Talla {it.talla_entregada || '—'} · x{it.cantidad}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
