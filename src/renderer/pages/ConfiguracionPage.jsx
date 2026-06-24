import { useEffect, useMemo, useState } from 'react';
import {
  Users, Building2, Briefcase, Database, Info, Plus, Pencil, Power,
  AlertTriangle, RefreshCw, Save, HardDriveDownload, HardDriveUpload, ShieldCheck,
  UserCog,
} from 'lucide-react';
import Card, { CardHeader } from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import { api, ES_ELECTRON } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const TABS = [
  { id: 'usuarios', label: 'Usuarios', Icon: Users },
  { id: 'roles', label: 'Roles', Icon: UserCog },
  { id: 'areas', label: 'Áreas', Icon: Building2 },
  { id: 'cargos', label: 'Cargos', Icon: Briefcase },
  { id: 'bd', label: 'Base de datos', Icon: Database },
  { id: 'sistema', label: 'Sistema', Icon: Info },
];

function fmtFechaHora(iso) {
  if (!iso) return 'Nunca';
  const d = new Date(iso.replace(' ', 'T'));
  if (isNaN(d)) return iso;
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function EstadoBadge({ estado }) {
  return <Badge tone={estado === 'Activo' ? 'ok' : 'neutral'} dot>{estado || 'Activo'}</Badge>;
}

/* ════════════════════════════════════════════════════════════════════
   PESTAÑA: USUARIOS
════════════════════════════════════════════════════════════════════ */
function TabUsuarios({ idUsuario }) {
  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', rol: '', fk_id_empleado: '', estado: 'Activo' });
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const [u, e, r] = await Promise.all([
      api.usuarios.listar(), api.empleados.listar(), api.roles.listarActivos(),
    ]);
    if (u.ok) setUsuarios(u.data);
    if (e.ok) setEmpleados(e.data);
    if (r.ok) setRoles(r.data);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ username: '', password: '', rol: roles[0]?.nombre || '', fk_id_empleado: '', estado: 'Activo' });
    setErrorForm(''); setModal(true);
  };
  const abrirEditar = (u) => {
    setEditando(u.id_usuario);
    setForm({ username: u.username, password: '', rol: u.rol, fk_id_empleado: u.fk_id_empleado || '', estado: u.estado || 'Activo' });
    setErrorForm(''); setModal(true);
  };

  const guardar = async () => {
    setErrorForm('');
    if (!form.username.trim()) return setErrorForm('El nombre de usuario es obligatorio.');
    if (!form.rol) return setErrorForm('Debe seleccionar un rol.');
    if (!editando && form.password.length < 4) return setErrorForm('La contraseña debe tener al menos 4 caracteres.');
    setGuardando(true);
    try {
      const datos = {
        username: form.username, rol: form.rol,
        fk_id_empleado: form.fk_id_empleado || null, estado: form.estado,
        password: form.password || undefined,
      };
      const res = editando
        ? await api.usuarios.actualizar(editando, datos, idUsuario)
        : await api.usuarios.crear(datos, idUsuario);
      if (!res.ok) { setErrorForm(res.error); return; }
      setModal(false); await cargar();
    } finally { setGuardando(false); }
  };

  const alternarEstado = async (u) => {
    const nuevo = u.estado === 'Activo' ? 'Inactivo' : 'Activo';
    await api.usuarios.cambiarEstado(u.id_usuario, nuevo, idUsuario);
    await cargar();
  };

  if (cargando) return <div className="grid place-items-center py-12 text-subtle"><RefreshCw className="animate-spin" /></div>;

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Usuarios del sistema" subtitle={`${usuarios.length} usuario(s)`} icon={Users}
        action={<Button size="sm" icon={Plus} onClick={abrirNuevo}>Nuevo usuario</Button>} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-canvas/50">
              {['Usuario', 'Empleado', 'Rol', 'Último acceso', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="text-left font-semibold text-subtle text-xs uppercase
                  tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id_usuario} className="border-b border-edge/70 last:border-0 hover:bg-canvas/60">
                <td className="px-4 py-3 font-medium text-ink-dark">@{u.username}</td>
                <td className="px-4 py-3 text-ink">{u.nombre_completo || '—'}</td>
                <td className="px-4 py-3"><Badge tone={u.rol === 'Administrador' ? 'info' : 'neutral'}>{u.rol}</Badge></td>
                <td className="px-4 py-3 text-xs text-muted">{fmtFechaHora(u.ultimo_acceso)}</td>
                <td className="px-4 py-3"><EstadoBadge estado={u.estado} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => abrirEditar(u)} title="Editar"
                      className="grid place-items-center w-8 h-8 rounded-lg text-subtle hover:bg-primary-light hover:text-primary transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => alternarEstado(u)} title={u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      className={`grid place-items-center w-8 h-8 rounded-lg transition-colors
                        ${u.estado === 'Activo' ? 'text-subtle hover:bg-danger-light hover:text-danger' : 'text-subtle hover:bg-ok-light hover:text-ok-dark'}`}>
                      <Power size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editando ? 'Editar usuario' : 'Nuevo usuario'}
        footer={<>
          <Button variant="secondary" onClick={() => setModal(false)} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando} icon={Save}>{guardando ? 'Guardando...' : 'Guardar'}</Button>
        </>}>
        {errorForm && (
          <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm rounded-lg px-3 py-2">
            <AlertTriangle size={16} /> {errorForm}
          </div>
        )}
        <div className="space-y-4">
          <Input label="Nombre de usuario *" value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
          <Input type="password" label={editando ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña *'}
            value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Rol *" value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}>
              <option value="">Seleccione...</option>
              {roles.map((r) => <option key={r.id_rol} value={r.nombre}>{r.nombre}</option>)}
            </Select>
            <Select label="Estado" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </Select>
          </div>
          <Select label="Empleado vinculado (opcional)" value={form.fk_id_empleado}
            onChange={(e) => setForm((f) => ({ ...f, fk_id_empleado: e.target.value }))}>
            <option value="">Sin empleado vinculado</option>
            {empleados.map((e) => <option key={e.id_empleado} value={e.id_empleado}>{e.nombre_completo}</option>)}
          </Select>
        </div>
      </Modal>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PESTAÑA: ROLES
════════════════════════════════════════════════════════════════════ */
function TabRoles({ idUsuario }) {
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const r = await api.roles.listar();
    if (r.ok) setRoles(r.data);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setEditando(null); setForm({ nombre: '', descripcion: '' }); setErrorForm(''); setModal(true); };
  const abrirEditar = (r) => { setEditando(r.id_rol); setForm({ nombre: r.nombre, descripcion: r.descripcion || '' }); setErrorForm(''); setModal(true); };

  const guardar = async () => {
    setErrorForm('');
    if (!form.nombre.trim()) return setErrorForm('El nombre del rol es obligatorio.');
    setGuardando(true);
    try {
      const datos = { nombre: form.nombre, descripcion: form.descripcion };
      const res = editando
        ? await api.roles.actualizar(editando, datos, idUsuario)
        : await api.roles.crear(datos, idUsuario);
      if (!res.ok) { setErrorForm(res.error); return; }
      setModal(false); await cargar();
    } finally { setGuardando(false); }
  };

  const alternarEstado = async (r) => {
    const nuevo = r.estado === 'Activo' ? 'Inactivo' : 'Activo';
    await api.roles.cambiarEstado(r.id_rol, nuevo, idUsuario);
    await cargar();
  };

  if (cargando) return <div className="grid place-items-center py-12 text-subtle"><RefreshCw className="animate-spin" /></div>;

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Roles del sistema" subtitle={`${roles.length} rol(es)`} icon={UserCog}
        action={<Button size="sm" icon={Plus} onClick={abrirNuevo}>Nuevo rol</Button>} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-canvas/50">
              {['Rol', 'Descripción', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="text-left font-semibold text-subtle text-xs uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id_rol} className="border-b border-edge/70 last:border-0 hover:bg-canvas/60">
                <td className="px-4 py-3 font-medium text-ink-dark">{r.nombre}</td>
                <td className="px-4 py-3 text-ink">{r.descripcion || '—'}</td>
                <td className="px-4 py-3"><EstadoBadge estado={r.estado} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => abrirEditar(r)} title="Editar"
                      className="grid place-items-center w-8 h-8 rounded-lg text-subtle hover:bg-primary-light hover:text-primary transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => alternarEstado(r)} title={r.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      className={`grid place-items-center w-8 h-8 rounded-lg transition-colors ${r.estado === 'Activo' ? 'text-subtle hover:bg-danger-light hover:text-danger' : 'text-subtle hover:bg-ok-light hover:text-ok-dark'}`}><Power size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar rol' : 'Nuevo rol'} size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(false)} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando} icon={Save}>{guardando ? 'Guardando...' : 'Guardar'}</Button>
        </>}>
        {errorForm && <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm rounded-lg px-3 py-2"><AlertTriangle size={16} /> {errorForm}</div>}
        <div className="space-y-4">
          <Input label="Nombre del rol *" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={3} placeholder="Describa las responsabilidades de este rol (opcional)"
              className="w-full rounded-lg border border-edge bg-white px-3 py-2 text-sm text-ink
                placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>
        </div>
      </Modal>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PESTAÑA: ÁREAS
════════════════════════════════════════════════════════════════════ */
function TabAreas({ idUsuario }) {
  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const r = await api.catalogos.areas();
    if (r.ok) setAreas(r.data);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setEditando(null); setNombre(''); setErrorForm(''); setModal(true); };
  const abrirEditar = (a) => { setEditando(a.id_area); setNombre(a.nom_area); setErrorForm(''); setModal(true); };

  const guardar = async () => {
    setErrorForm('');
    if (!nombre.trim()) return setErrorForm('El nombre del área es obligatorio.');
    setGuardando(true);
    try {
      const res = editando
        ? await api.catalogos.actualizarArea(editando, { nom_area: nombre }, idUsuario)
        : await api.catalogos.crearArea({ nom_area: nombre }, idUsuario);
      if (!res.ok) { setErrorForm(res.error); return; }
      setModal(false); await cargar();
    } finally { setGuardando(false); }
  };

  const alternarEstado = async (a) => {
    const nuevo = a.estado === 'Activo' ? 'Inactivo' : 'Activo';
    await api.catalogos.cambiarEstadoArea(a.id_area, nuevo, idUsuario);
    await cargar();
  };

  if (cargando) return <div className="grid place-items-center py-12 text-subtle"><RefreshCw className="animate-spin" /></div>;

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Áreas organizacionales" subtitle={`${areas.length} área(s)`} icon={Building2}
        action={<Button size="sm" icon={Plus} onClick={abrirNuevo}>Nueva área</Button>} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-canvas/50">
              {['Área', 'Cargos', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="text-left font-semibold text-subtle text-xs uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.id_area} className="border-b border-edge/70 last:border-0 hover:bg-canvas/60">
                <td className="px-4 py-3 font-medium text-ink-dark">{a.nom_area}</td>
                <td className="px-4 py-3 text-ink">{a.cargos}</td>
                <td className="px-4 py-3"><EstadoBadge estado={a.estado} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => abrirEditar(a)} title="Editar"
                      className="grid place-items-center w-8 h-8 rounded-lg text-subtle hover:bg-primary-light hover:text-primary transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => alternarEstado(a)} title={a.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      className={`grid place-items-center w-8 h-8 rounded-lg transition-colors ${a.estado === 'Activo' ? 'text-subtle hover:bg-danger-light hover:text-danger' : 'text-subtle hover:bg-ok-light hover:text-ok-dark'}`}><Power size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar área' : 'Nueva área'} size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(false)} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando} icon={Save}>{guardando ? 'Guardando...' : 'Guardar'}</Button>
        </>}>
        {errorForm && <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm rounded-lg px-3 py-2"><AlertTriangle size={16} /> {errorForm}</div>}
        <Input label="Nombre del área *" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Modal>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PESTAÑA: CARGOS
════════════════════════════════════════════════════════════════════ */
function TabCargos({ idUsuario }) {
  const [cargos, setCargos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nom_cargo: '', fk_id_area: '' });
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [filtroArea, setFiltroArea] = useState('');

  const cargar = async () => {
    setCargando(true);
    const [c, a] = await Promise.all([api.catalogos.cargos(), api.catalogos.areasActivas()]);
    if (c.ok) setCargos(c.data);
    if (a.ok) setAreas(a.data);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(
    () => cargos.filter((c) => !filtroArea || String(c.fk_id_area) === String(filtroArea)),
    [cargos, filtroArea]
  );

  const abrirNuevo = () => { setEditando(null); setForm({ nom_cargo: '', fk_id_area: '' }); setErrorForm(''); setModal(true); };
  const abrirEditar = (c) => { setEditando(c.id_cargo); setForm({ nom_cargo: c.nom_cargo, fk_id_area: c.fk_id_area }); setErrorForm(''); setModal(true); };

  const guardar = async () => {
    setErrorForm('');
    if (!form.nom_cargo.trim()) return setErrorForm('El nombre del cargo es obligatorio.');
    if (!form.fk_id_area) return setErrorForm('Seleccione un área.');
    setGuardando(true);
    try {
      const datos = { nom_cargo: form.nom_cargo, fk_id_area: Number(form.fk_id_area) };
      const res = editando
        ? await api.catalogos.actualizarCargo(editando, datos, idUsuario)
        : await api.catalogos.crearCargo(datos, idUsuario);
      if (!res.ok) { setErrorForm(res.error); return; }
      setModal(false); await cargar();
    } finally { setGuardando(false); }
  };

  const alternarEstado = async (c) => {
    const nuevo = c.estado === 'Activo' ? 'Inactivo' : 'Activo';
    await api.catalogos.cambiarEstadoCargo(c.id_cargo, nuevo, idUsuario);
    await cargar();
  };

  if (cargando) return <div className="grid place-items-center py-12 text-subtle"><RefreshCw className="animate-spin" /></div>;

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Cargos por área" subtitle={`${filtrados.length} cargo(s)`} icon={Briefcase}
        action={<div className="flex items-center gap-2">
          <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="min-w-[150px]">
            <option value="">Todas las áreas</option>
            {areas.map((a) => <option key={a.id_area} value={a.id_area}>{a.nom_area}</option>)}
          </Select>
          <Button size="sm" icon={Plus} onClick={abrirNuevo}>Nuevo cargo</Button>
        </div>} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-canvas/50">
              {['Cargo', 'Área', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="text-left font-semibold text-subtle text-xs uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id_cargo} className="border-b border-edge/70 last:border-0 hover:bg-canvas/60">
                <td className="px-4 py-3 font-medium text-ink-dark">{c.nom_cargo}</td>
                <td className="px-4 py-3 text-ink">{c.nom_area}</td>
                <td className="px-4 py-3"><EstadoBadge estado={c.estado} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => abrirEditar(c)} title="Editar"
                      className="grid place-items-center w-8 h-8 rounded-lg text-subtle hover:bg-primary-light hover:text-primary transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => alternarEstado(c)} title={c.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      className={`grid place-items-center w-8 h-8 rounded-lg transition-colors ${c.estado === 'Activo' ? 'text-subtle hover:bg-danger-light hover:text-danger' : 'text-subtle hover:bg-ok-light hover:text-ok-dark'}`}><Power size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar cargo' : 'Nuevo cargo'} size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(false)} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando} icon={Save}>{guardando ? 'Guardando...' : 'Guardar'}</Button>
        </>}>
        {errorForm && <div className="mb-4 flex items-center gap-2 bg-danger-light text-danger text-sm rounded-lg px-3 py-2"><AlertTriangle size={16} /> {errorForm}</div>}
        <div className="space-y-4">
          <Input label="Nombre del cargo *" value={form.nom_cargo} onChange={(e) => setForm((f) => ({ ...f, nom_cargo: e.target.value }))} />
          <Select label="Área *" value={form.fk_id_area} onChange={(e) => setForm((f) => ({ ...f, fk_id_area: e.target.value }))}>
            <option value="">Seleccione...</option>
            {areas.map((a) => <option key={a.id_area} value={a.id_area}>{a.nom_area}</option>)}
          </Select>
        </div>
      </Modal>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PESTAÑA: BASE DE DATOS
════════════════════════════════════════════════════════════════════ */
function TabBaseDatos() {
  const [info, setInfo] = useState(null);
  const [mensaje, setMensaje] = useState(null); // { tipo, texto }
  const [ocupado, setOcupado] = useState(false);

  const cargar = async () => {
    const r = await api.bd.info();
    if (r.ok) setInfo(r.data);
  };
  useEffect(() => { cargar(); }, []);

  const tamano = info ? `${(info.tamano / 1024).toFixed(1)} KB` : '—';

  const hacerBackup = async () => {
    setOcupado(true); setMensaje(null);
    try {
      const r = await api.bd.backup();
      setMensaje(r.ok
        ? { tipo: 'ok', texto: `Copia de seguridad guardada correctamente.` }
        : { tipo: 'error', texto: r.error });
    } finally { setOcupado(false); }
  };

  const restaurar = async () => {
    setOcupado(true); setMensaje(null);
    try {
      const r = await api.bd.restore();
      setMensaje(r.ok
        ? { tipo: 'ok', texto: 'Base de datos restaurada. La aplicación se reiniciará...' }
        : { tipo: 'error', texto: r.error });
    } finally { setOcupado(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <Card>
        <CardHeader title="Archivo de base de datos" subtitle="Información del almacenamiento local" icon={Database} />
        <div className="p-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-subtle">Ubicación</span>
            <span className="text-ink font-mono text-xs text-right break-all">{info?.ruta || '—'}</span>
          </div>
          <div className="flex justify-between"><span className="text-subtle">Tamaño</span><span className="text-ink">{tamano}</span></div>
          <div className="flex justify-between"><span className="text-subtle">Última modificación</span><span className="text-ink">{fmtFechaHora(info?.modificado)}</span></div>
        </div>
      </Card>

      {mensaje && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5
          ${mensaje.tipo === 'ok' ? 'bg-ok-light text-ok-dark' : 'bg-danger-light text-danger'}`}>
          {mensaje.tipo === 'ok' ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />} {mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <HardDriveDownload className="text-primary mb-3" size={24} />
          <h4 className="font-semibold text-ink-dark mb-1">Copia de seguridad</h4>
          <p className="text-xs text-subtle mb-4">Guarde una copia del archivo de base de datos en la ubicación que elija.</p>
          <Button icon={HardDriveDownload} onClick={hacerBackup} disabled={ocupado}>Crear copia</Button>
        </Card>
        <Card className="p-5">
          <HardDriveUpload className="text-warn mb-3" size={24} />
          <h4 className="font-semibold text-ink-dark mb-1">Restaurar</h4>
          <p className="text-xs text-subtle mb-4">Reemplace los datos actuales con los de una copia previa. La app se reiniciará.</p>
          <Button variant="secondary" icon={HardDriveUpload} onClick={restaurar} disabled={ocupado}>Restaurar copia</Button>
        </Card>
      </div>

      {!ES_ELECTRON && (
        <p className="text-xs text-muted flex items-center gap-1.5">
          <Info size={13} /> Las copias de seguridad solo están disponibles en la app de escritorio.
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PESTAÑA: SISTEMA
════════════════════════════════════════════════════════════════════ */
function TabSistema() {
  const filas = [
    ['Aplicación', 'Coodetrans — Gestión de Dotación y Archivo'],
    ['Versión', '1.0.0'],
    ['Plataforma', ES_ELECTRON ? 'Aplicación de escritorio (Electron)' : 'Vista previa en navegador'],
    ['Base de datos', 'SQLite local (better-sqlite3)'],
    ['Arquitectura', 'MVC — Modelos · Repositorios · Controladores · IPC · React'],
    ['Desarrollado por', 'RickLabs'],
  ];
  return (
    <div className="max-w-2xl space-y-5">
      <Card>
        <CardHeader title="Información del sistema" subtitle="Detalles técnicos de la aplicación" icon={Info} />
        <div className="p-5 space-y-3 text-sm">
          {filas.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-edge/60 last:border-0 pb-2 last:pb-0">
              <span className="text-subtle">{k}</span>
              <span className="text-ink font-medium text-right">{v}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5 flex items-center gap-4">
        <span className="grid place-items-center w-12 h-12 rounded-xl bg-primary-light text-primary shrink-0">
          <ShieldCheck size={24} />
        </span>
        <div>
          <h4 className="font-semibold text-ink-dark">Datos almacenados localmente</h4>
          <p className="text-xs text-subtle mt-0.5">
            Toda la información se guarda de forma segura en este equipo. Realice copias de
            seguridad periódicas desde la pestaña «Base de datos».
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL DE CONFIGURACIÓN
════════════════════════════════════════════════════════════════════ */
export default function ConfiguracionPage() {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id_usuario;
  const [tab, setTab] = useState('usuarios');

  return (
    <div className="space-y-5">
      {/* Pestañas */}
      <div className="flex flex-wrap gap-1 bg-white border border-edge rounded-xl p-1.5 shadow-card">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === id ? 'bg-primary text-white shadow-sm' : 'text-subtle hover:bg-canvas hover:text-ink'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña */}
      {tab === 'usuarios' && <TabUsuarios idUsuario={idUsuario} />}
      {tab === 'roles' && <TabRoles idUsuario={idUsuario} />}
      {tab === 'areas' && <TabAreas idUsuario={idUsuario} />}
      {tab === 'cargos' && <TabCargos idUsuario={idUsuario} />}
      {tab === 'bd' && <TabBaseDatos />}
      {tab === 'sistema' && <TabSistema />}
    </div>
  );
}
