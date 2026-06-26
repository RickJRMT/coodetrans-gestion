import { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Pencil, History, MapPin, AlertTriangle, RefreshCw,
  FolderOpen, IdCard, Shirt, Upload, Download, FileSpreadsheet,
  CheckCircle2, XCircle, FileDown,
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import EmpleadosTable from '../components/EmpleadosTable';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  empleadoCoincideBusqueda, formatCedula, formatTalla, sanitizeCedula,
  capitalizarNombre, formatNombre,
} from '../utils/format';

const GENEROS = ['Masculino', 'Femenino', 'Otro'];
const ESTADOS = ['Activo', 'Retirado'];

const FORM_VACIO = {
  cedula: '', nombre_completo: '', genero: 'Masculino', id_area: '',
  fk_id_cargo: '', camisa: '', pantalon: '', calzado: '',
  fecha_ingreso: '', fecha_retiro: '', estado: 'Activo',
  ubicacion_fisica: '', observaciones: '',
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
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Importación de empleados (Excel / CSV)
  const [importAbierto, setImportAbierto] = useState(false);
  const [previa, setPrevia] = useState(null);
  const [rutaImport, setRutaImport] = useState('');
  const [hojaImport, setHojaImport] = useState('');
  const [importarTodasHojas, setImportarTodasHojas] = useState(false);
  const [importando, setImportando] = useState(false);
  const [errorImport, setErrorImport] = useState('');
  const [resultadoImport, setResultadoImport] = useState(null);

  // Exportación de empleados
  const [exportAbierto, setExportAbierto] = useState(false);
  const [exportFiltro, setExportFiltro] = useState('activos');
  const [exportFormato, setExportFormato] = useState('xlsx');
  const [exportando, setExportando] = useState(false);
  const [mensajeExport, setMensajeExport] = useState('');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 180);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');

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
      const [emp, ar, ca] = await Promise.all([
        api.empleados.listar(),
        api.catalogos.areasActivas(),
        api.catalogos.cargosActivos(),
      ]);
      if (emp.ok) setEmpleados(emp.data); else setError(emp.error);
      if (ar.ok) setAreas(ar.data);
      if (ca.ok) setCargos(ca.data);
    } catch {
      setError('Error de comunicación con la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  /* ── Filtrado en memoria (búsqueda global con debounce) ── */
  const filtrados = useMemo(() => {
    const q = busquedaDebounced.trim();
    return empleados.filter((e) => {
      if (filtroEstado && e.estado !== filtroEstado) return false;
      if (filtroArea && String(e.id_area) !== String(filtroArea)) return false;
      if (filtroCargo && String(e.fk_id_cargo) !== String(filtroCargo)) return false;
      if (!empleadoCoincideBusqueda(e, q)) return false;
      return true;
    });
  }, [empleados, busquedaDebounced, filtroEstado, filtroArea, filtroCargo]);

  // Cargos disponibles según el área seleccionada en el formulario
  const cargosForm = useMemo(
    () => cargos.filter((c) => String(c.fk_id_area) === String(form.id_area)),
    [cargos, form.id_area]
  );

  // Cargos disponibles para el filtro (si hay un área seleccionada)
  const cargosFiltro = useMemo(
    () => filtroArea ? cargos.filter((c) => String(c.fk_id_area) === String(filtroArea)) : cargos,
    [cargos, filtroArea]
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
      cedula: e.cedula || '', nombre_completo: capitalizarNombre(e.nombre_completo) || '',
      genero: e.genero || 'Masculino', id_area: e.id_area || '',
      fk_id_cargo: e.fk_id_cargo || '', camisa: e.camisa || '',
      pantalon: e.pantalon || '', calzado: e.calzado || '',
      fecha_ingreso: e.fecha_ingreso || '', fecha_retiro: e.fecha_retiro || '',
      estado: e.estado || 'Activo', ubicacion_fisica: e.ubicacion_fisica || '',
      observaciones: e.observaciones || '',
    });
    setErrorForm('');
    setModalAbierto(true);
  };

  const cambiar = (campo, valor) => {
    setForm((f) => {
      let v = valor;
      if (campo === 'cedula') v = sanitizeCedula(valor);
      if (campo === 'nombre_completo') {
        v = capitalizarNombre(valor);
      }
      if (['camisa', 'pantalon', 'calzado'].includes(campo)) {
        v = formatTalla(valor);
      }
      const next = { ...f, [campo]: v };
      if (campo === 'id_area') {
        next.fk_id_cargo = '';
      }
      return next;
    });
  };

  const guardar = async () => {
    setErrorForm('');
    if (!form.cedula.trim()) return setErrorForm('La cédula es obligatoria.');
    if (!/^\d+$/.test(form.cedula.trim())) return setErrorForm('La cédula solo puede contener números.');
    if (!form.nombre_completo.trim()) return setErrorForm('El nombre completo es obligatorio.');
    if (!form.id_area && !form.fk_id_cargo) return setErrorForm('Debe seleccionar un área.');
    if (form.estado === 'Retirado' && !form.fecha_retiro) {
      return setErrorForm('Indique la fecha de retiro para un empleado retirado.');
    }
    setGuardando(true);
    try {
      const datos = {
        cedula: form.cedula, nombre_completo: capitalizarNombre(form.nombre_completo),
        genero: form.genero, fk_id_area: form.id_area || null,
        fk_id_cargo: form.fk_id_cargo || null,
        camisa: form.camisa, pantalon: form.pantalon, calzado: form.calzado,
        fecha_ingreso: form.fecha_ingreso || null,
        fecha_retiro: form.estado === 'Retirado' ? form.fecha_retiro : null,
        estado: form.estado, ubicacion_fisica: form.ubicacion_fisica.trim() || null,
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

  /* ── Importación desde Excel / CSV ── */
  const abrirImportador = () => {
    setPrevia(null);
    setRutaImport('');
    setHojaImport('');
    setImportarTodasHojas(false);
    setErrorImport('');
    setResultadoImport(null);
    setImportAbierto(true);
  };

  const aplicarPrevia = (res) => {
    if (!res.ok) {
      if (res.error && res.error !== 'Operación cancelada.') setErrorImport(res.error);
      return;
    }
    setRutaImport(res.rutaArchivo || '');
    setHojaImport(res.hojaActiva || '');
    setPrevia({
      formato: res.formato,
      columnas: res.columnas || [],
      filaEncabezado: res.filaEncabezado,
      filasValidas: res.filasValidas || [],
      filasInvalidas: res.filasInvalidas || [],
      total: res.total || 0,
      multiHoja: res.multiHoja,
      hojas: res.hojas || [],
      hojaActiva: res.hojaActiva,
      resumenMultiHoja: res.resumenMultiHoja || null,
    });
  };

  const seleccionarArchivo = async () => {
    setErrorImport('');
    setResultadoImport(null);
    try {
      const res = await api.importExport.seleccionarArchivo();
      if (!res.ok) {
        if (res.error && res.error !== 'Operación cancelada.') setErrorImport(res.error);
        return;
      }
      aplicarPrevia(res);
    } catch {
      setErrorImport('No fue posible leer el archivo seleccionado.');
    }
  };

  const cambiarHojaImport = async (opciones) => {
    if (!rutaImport) return;
    setErrorImport('');
    setImportando(true);
    try {
      const res = await api.importExport.previsualizar(rutaImport, opciones);
      aplicarPrevia(res);
    } catch {
      setErrorImport('No fue posible procesar la hoja seleccionada.');
    } finally {
      setImportando(false);
    }
  };

  const confirmarImportacion = async () => {
    if (!previa || !previa.filasValidas?.length) return;
    setImportando(true);
    setErrorImport('');
    try {
      const res = await api.importExport.confirmar(previa.filasValidas, idUsuario);
      if (!res.ok) { setErrorImport(res.error); return; }
      setResultadoImport(res.data);
      setPrevia(null);
      await cargarDatos();
    } catch {
      setErrorImport('Ocurrió un error durante la importación.');
    } finally {
      setImportando(false);
    }
  };

  /* ── Exportación a Excel / CSV ── */
  const exportar = async () => {
    setExportando(true);
    setMensajeExport('');
    try {
      const res = await api.importExport.exportar(exportFiltro, exportFormato);
      if (!res.ok) {
        if (res.error && res.error !== 'Operación cancelada.') setMensajeExport(res.error);
        return;
      }
      setMensajeExport(`Archivo exportado correctamente en:\n${res.data?.ruta || ''}`);
    } catch {
      setMensajeExport('No fue posible exportar el archivo.');
    } finally {
      setExportando(false);
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
      {/* Barra de herramientas — Diseño mejorado */}
      <Card className="p-4">
        {/* Búsqueda principal — ancho completo */}
        <div className="mb-4">
          <Input
            icon={Search}
            placeholder="Buscar por nombre, cédula, ubicación u observaciones..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="[&_input]:py-3 [&_input]:text-base"
          />
        </div>

        {/* Filtros y acciones — Layout mejorado */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex flex-wrap gap-2 flex-1">
            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-[120px]"
              aria-label="Filtrar por estado"
            >
              <option value="">Estado</option>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select
              value={filtroArea}
              onChange={(e) => {
                setFiltroArea(e.target.value);
                setFiltroCargo('');
              }}
              className="w-[120px]"
              aria-label="Filtrar por área"
            >
              <option value="">Área</option>
              {areas.map((a) => <option key={a.id_area} value={a.id_area}>{a.nom_area}</option>)}
            </Select>
            <Select
              value={filtroCargo}
              onChange={(e) => setFiltroCargo(e.target.value)}
              className="w-[140px]"
              aria-label="Filtrar por cargo"
              disabled={!filtroArea}
            >
              <option value="">Cargo</option>
              {cargosFiltro.map((c) => <option key={c.id_cargo} value={c.id_cargo}>{c.nom_cargo}</option>)}
            </Select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              icon={Upload}
              onClick={abrirImportador}
              className="flex-1 sm:flex-none"
            >
              Importar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() => {
                setMensajeExport('');
                setExportAbierto(true);
              }}
              className="flex-1 sm:flex-none"
            >
              Exportar
            </Button>
            <Button
              size="sm"
              icon={Plus}
              onClick={abrirNuevo}
              className="flex-1 sm:flex-none"
            >
              Nueva carpeta
            </Button>
          </div>
        </div>

        {/* Contador de resultados */}
        <p className="text-xs text-muted mt-3">
          {filtrados.length} de {empleados.length} carpeta(s)
        </p>
      </Card>

      {/* Tabla (escritorio) con scroll interno y virtualización */}
      <Card className="hidden md:block overflow-hidden p-0">
        <EmpleadosTable
          items={filtrados}
          onEdit={abrirEditar}
          onHistory={abrirHistorial}
        />
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
                <p className="font-semibold text-ink-dark truncate">{formatNombre(e.nombre_completo)}</p>
                <p className="text-xs text-muted flex items-center gap-1">
                  <IdCard size={13} /> {formatCedula(e.cedula)}
                </p>
              </div>
              <Badge tone={e.estado === 'Activo' ? 'ok' : 'neutral'} dot>{e.estado}</Badge>
            </div>
            <div className="text-sm text-ink space-y-1 mb-3">
              <p>{e.nom_area || '—'} · <span className="text-muted">{e.nom_cargo || 'Sin cargo'}</span></p>
              <p className="flex items-center gap-1 text-muted text-xs">
                <MapPin size={13} /> {e.ubicacion_fisica || '—'}
              </p>
              {e.observaciones && (
                <p className="text-xs text-subtle line-clamp-2">{e.observaciones}</p>
              )}
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
          <Input label="Cédula *" value={form.cedula} inputMode="numeric"
            onChange={(e) => cambiar('cedula', e.target.value)}
            placeholder="Solo números" />
          <Input label="Nombre completo *" value={form.nombre_completo}
            onChange={(e) => cambiar('nombre_completo', e.target.value)} />
          <Select label="Género" value={form.genero}
            onChange={(e) => cambiar('genero', e.target.value)}>
            {GENEROS.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
          <Input label="Ubicación física" value={form.ubicacion_fisica}
            onChange={(e) => cambiar('ubicacion_fisica', e.target.value)}
            placeholder="Ej.: Archivador 3, Carpeta 12, Estante B..." />
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

        {/* Fechas y estado — ambas fechas siempre visibles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <Input type="date" label="Fecha de ingreso" value={form.fecha_ingreso}
            onChange={(e) => cambiar('fecha_ingreso', e.target.value)} />
          <Input type="date" label="Fecha de retiro" value={form.fecha_retiro}
            onChange={(e) => cambiar('fecha_retiro', e.target.value)}
            disabled={form.estado === 'Activo'}
            title={form.estado === 'Activo' ? 'Disponible al marcar el empleado como Retirado' : undefined} />
          <Select label="Estado" value={form.estado}
            onChange={(e) => cambiar('estado', e.target.value)}>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        {form.estado === 'Retirado' && !form.fecha_retiro && (
          <p className="text-xs text-warn mt-2 flex items-center gap-1">
            <AlertTriangle size={13} /> Indique la fecha de retiro para empleados retirados.
          </p>
        )}

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
        title={`Historial de dotación — ${formatNombre(empleadoHist?.nombre_completo || '')}`}
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

      {/* ── Modal: importar empleados (Excel / CSV) ── */}
      <Modal
        open={importAbierto}
        onClose={() => setImportAbierto(false)}
        title="Importar empleados desde Excel / CSV"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setImportAbierto(false)} disabled={importando}>
              Cerrar
            </Button>
            <Button onClick={confirmarImportacion}
              disabled={importando || !previa || !previa.filasValidas?.length}
              icon={importando ? RefreshCw : CheckCircle2}>
              {importando ? 'Importando...' : `Confirmar importación${previa ? ` (${previa.filasValidas.length})` : ''}`}
            </Button>
          </>
        }
      >
        {errorImport && (
          <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm rounded-lg px-3 py-2">
            <AlertTriangle size={16} /> {errorImport}
          </div>
        )}

        {/* Resultado de una importación finalizada */}
        {resultadoImport ? (
          <div className="py-6 space-y-3">
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 text-success" size={40} />
              <p className="text-ink-dark font-semibold mb-1">Importación completada</p>
            </div>
            {resultadoImport.resumen && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm">
                <div className="p-2 bg-canvas rounded-lg">
                  <p className="font-bold text-ink">{resultadoImport.resumen.registrosRecibidos}</p>
                  <p className="text-xs text-muted">Recibidos</p>
                </div>
                <div className="p-2 bg-canvas rounded-lg">
                  <p className="font-bold text-success">{resultadoImport.resumen.registrosImportados}</p>
                  <p className="text-xs text-muted">Importados</p>
                </div>
                <div className="p-2 bg-canvas rounded-lg">
                  <p className="font-bold text-primary">{resultadoImport.resumen.insertados}</p>
                  <p className="text-xs text-muted">Nuevos</p>
                </div>
                <div className="p-2 bg-canvas rounded-lg">
                  <p className="font-bold text-ink">{resultadoImport.resumen.actualizados}</p>
                  <p className="text-xs text-muted">Actualizados</p>
                </div>
              </div>
            )}
            <p className="text-sm text-muted text-center">
              {resultadoImport.insertados} nuevo(s) · {resultadoImport.actualizados} actualizado(s)
              {(resultadoImport.omitidos?.length || resultadoImport.errores?.length)
                ? ` · ${(resultadoImport.omitidos?.length || 0) + (resultadoImport.errores?.length || 0)} omitido(s)`
                : ''}
            </p>
          </div>
        ) : !previa ? (
          /* Paso 1: seleccionar archivo */
          <div className="text-center py-8">
            <FileSpreadsheet className="mx-auto mb-3 text-primary" size={40} />
            <p className="text-ink-dark font-medium mb-1">Seleccione un archivo de empleados</p>
            <p className="text-sm text-muted mb-5">
              Formatos admitidos: Excel (.xlsx, .xls) y CSV. Se detectan automáticamente
              encabezados aunque existan títulos previos y se soportan archivos multi-hoja.
            </p>
            <Button icon={Upload} onClick={seleccionarArchivo}>Seleccionar archivo...</Button>
          </div>
        ) : (
          /* Paso 2: vista previa y validación */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="info">Formato {previa.formato}</Badge>
              {previa.filaEncabezado && (
                <span className="text-xs text-muted">Encabezado detectado en fila {previa.filaEncabezado}</span>
              )}
              <span className="inline-flex items-center gap-1 text-sm text-success">
                <CheckCircle2 size={15} /> {previa.filasValidas.length} válido(s)
              </span>
              {previa.filasInvalidas.length > 0 && (
                <span className="inline-flex items-center gap-1 text-sm text-danger">
                  <XCircle size={15} /> {previa.filasInvalidas.length} con error
                </span>
              )}
              <button type="button" onClick={seleccionarArchivo}
                className="text-sm text-primary hover:underline ml-auto">Cambiar archivo</button>
            </div>

            {previa.resumenMultiHoja && (
              <div className="p-3 bg-primary-light/40 rounded-lg border border-primary/20 text-sm space-y-2">
                <p className="font-semibold text-primary-dark">Resumen multi-hoja</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <span>{previa.resumenMultiHoja.hojasProcesadas} / {previa.resumenMultiHoja.totalHojasArchivo} hojas procesadas</span>
                  <span>{previa.resumenMultiHoja.registrosValidosEncontrados} registros válidos encontrados</span>
                  <span>{previa.resumenMultiHoja.registrosUnicosAImportar} únicos a importar</span>
                </div>
                {previa.resumenMultiHoja.duplicadosConsolidados > 0 && (
                  <p className="text-xs text-muted">
                    {previa.resumenMultiHoja.duplicadosConsolidados} cédula(s) duplicada(s) entre hojas (se conserva la última aparición).
                  </p>
                )}
                <div className="max-h-[120px] overflow-y-auto divide-y divide-edge/50">
                  {previa.resumenMultiHoja.detalleHojas.map((h) => (
                    <div key={h.nombre} className="py-1 flex justify-between gap-2">
                      <span className="font-medium truncate">{h.nombre}</span>
                      <span className="text-muted shrink-0">
                        {h.validas} válidos · {h.invalidas} omitidos
                        {!h.procesada && h.error ? ` · ${h.error}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previa.multiHoja && previa.hojas?.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-canvas/60 rounded-lg border border-edge">
                <Select
                  label="Hoja de Excel"
                  value={importarTodasHojas ? '__todas__' : hojaImport}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__todas__') {
                      setImportarTodasHojas(true);
                      cambiarHojaImport({ todasLasHojas: true });
                    } else {
                      setImportarTodasHojas(false);
                      setHojaImport(val);
                      cambiarHojaImport({ hoja: val });
                    }
                  }}
                >
                  {previa.hojas.map((h) => (
                    <option key={h.nombre} value={h.nombre}>
                      {h.nombre} ({h.totalValidas} válidos)
                    </option>
                  ))}
                  <option value="__todas__">Importar todas las hojas válidas</option>
                </Select>
                <p className="text-xs text-muted self-end pb-2">
                  {previa.hojas.length} hoja(s) con tablas detectadas en el archivo.
                </p>
              </div>
            )}

            {/* Tabla de filas válidas */}
            {previa.filasValidas.length > 0 && (
              <div className="border border-edge rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-canvas/60 border-b border-edge text-xs font-semibold text-subtle uppercase tracking-wide">
                  Registros a importar
                </div>
                <div className="max-h-[240px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-edge">
                        {['Cédula', 'Nombre', 'Área', 'Ubicación', 'Observaciones', 'Estado'].map((h) => (
                          <th key={h} className="text-left font-semibold text-subtle text-xs px-3 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previa.filasValidas.map((f, i) => (
                        <tr key={i} className="border-b border-edge/60 last:border-0">
                          <td className="px-3 py-1.5 text-ink">{formatCedula(f.cedula)}</td>
                          <td className="px-3 py-1.5 text-ink">{formatNombre(f.nombre_completo)}</td>
                          <td className="px-3 py-1.5 text-muted">{f.area || '—'}</td>
                          <td className="px-3 py-1.5 text-muted">{f.ubicacion_fisica || '—'}</td>
                          <td className="px-3 py-1.5 text-muted">{f.observaciones || '—'}</td>
                          <td className="px-3 py-1.5">
                            <Badge tone={f.estado === 'Activo' ? 'ok' : 'neutral'}>{f.estado}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Filas inválidas */}
            {previa.filasInvalidas.length > 0 && (
              <div className="border border-danger/30 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-danger-light/60 border-b border-danger/20 text-xs font-semibold text-danger uppercase tracking-wide">
                  Registros omitidos (no se importarán)
                </div>
                <div className="max-h-[160px] overflow-y-auto divide-y divide-edge/60">
                  {previa.filasInvalidas.map((f, i) => (
                    <div key={i} className="px-3 py-2 text-sm">
                      <span className="text-ink">Fila {f.fila}: {formatNombre(f.nombre_completo) || formatCedula(f.cedula) || '(vacío)'}</span>
                      <span className="text-danger text-xs block">{f.motivo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Modal: exportar empleados ── */}
      <Modal
        open={exportAbierto}
        onClose={() => setExportAbierto(false)}
        title="Exportar empleados"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExportAbierto(false)} disabled={exportando}>
              Cerrar
            </Button>
            <Button onClick={exportar} disabled={exportando}
              icon={exportando ? RefreshCw : FileDown}>
              {exportando ? 'Exportando...' : 'Exportar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Empleados a exportar" value={exportFiltro}
            onChange={(e) => setExportFiltro(e.target.value)}>
            <option value="activos">Solo activos</option>
            <option value="retirados">Solo retirados</option>
            <option value="todos">Todos</option>
          </Select>
          <Select label="Formato de archivo" value={exportFormato}
            onChange={(e) => setExportFormato(e.target.value)}>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
          </Select>
          {mensajeExport && (
            <div className="flex items-start gap-2 bg-primary-light text-primary text-sm rounded-lg px-3 py-2 whitespace-pre-line">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {mensajeExport}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
