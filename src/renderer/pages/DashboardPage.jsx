import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Users, FolderArchive, AlertTriangle, PackageCheck, TrendingUp,
  UserPlus, RefreshCw, Truck, LogIn, Boxes, History,
} from 'lucide-react';
import Card, { CardHeader } from '../components/Card';
import Badge from '../components/Badge';
import { api } from '../utils/api';

/* ─── Configuración visual de iconos por tipo de actividad ──────────── */
const ICONO_ACCION = {
  creacion:      { Icon: UserPlus,  color: '#0052D4', bg: '#E8F0FD' },
  actualizacion: { Icon: RefreshCw, color: '#B45309', bg: '#FEF3C7' },
  entrega:       { Icon: Truck,     color: '#28A745', bg: '#D4EDDA' },
  eliminacion:   { Icon: AlertTriangle, color: '#DC3545', bg: '#F8D7DA' },
  sistema:       { Icon: LogIn,     color: '#64748B', bg: '#F1F5F9' },
};

const TONO_ACCION = {
  creacion: 'info', actualizacion: 'bajo', entrega: 'ok',
  eliminacion: 'critico', sistema: 'neutral',
};

const ETIQUETA_ACCION = {
  creacion: 'Creación', actualizacion: 'Actualización', entrega: 'Entrega',
  eliminacion: 'Eliminación', sistema: 'Sistema',
};

/* ─── Tarjeta KPI ───────────────────────────────────────────────────── */
function KpiCard({ Icon, label, valor, sub, color, bg }) {
  return (
    <Card className="p-5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-subtle mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-ink-dark leading-none">{valor}</p>
          {sub && <p className="text-xs text-muted mt-2">{sub}</p>}
        </div>
        <span className="grid place-items-center w-11 h-11 rounded-xl shrink-0"
          style={{ background: bg, color }}>
          <Icon size={22} />
        </span>
      </div>
    </Card>
  );
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

/* ─── Etiqueta de valor sobre las barras ───────────────────────────── */
function BarLabel({ x, y, width, value }) {
  return (
    <text x={x + width / 2} y={y - 6} fill="#0F172A" textAnchor="middle"
      fontSize={12} fontWeight={700}>
      {value}
    </text>
  );
}

const COLORES_BARRA = ['#0052D4', '#28A745', '#4D89E8'];

function formatoFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  if (isNaN(d)) return iso;
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const res = await api.dashboard.obtenerResumen();
        if (!activo) return;
        if (res.ok) setData(res.data);
        else setError(res.error || 'No fue posible cargar el panel.');
      } catch {
        setError('Error de comunicación con la base de datos.');
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
  }, []);

  if (cargando) {
    return (
      <div className="grid place-items-center h-64 text-subtle">
        <div className="flex items-center gap-2">
          <RefreshCw size={18} className="animate-spin" /> Cargando panel...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center text-danger">
        <AlertTriangle className="mx-auto mb-2" /> {error}
      </Card>
    );
  }

  const { kpis, stockPorArea, activosPorArea, actividades } = data;

  // Datos del gráfico: empleados activos por área
  const datosGrafico = activosPorArea.map((a) => ({
    nombre: a.nom_area.replace(' (Estaciones de Servicio)', '').replace('Administración', 'Admin.'),
    total: a.total,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard Icon={Users} label="Empleados Activos" valor={kpis.empleadosActivos}
          sub={`${kpis.empleadosRetirados} retirados`} color="#0052D4" bg="#E8F0FD" />
        <KpiCard Icon={FolderArchive} label="Carpetas Archivadas" valor={kpis.carpetasArchivadas}
          sub="Hojas de vida físicas" color="#28A745" bg="#D4EDDA" />
        <KpiCard Icon={AlertTriangle} label="Alertas de Stock" valor={kpis.alertasStock}
          sub="Ítems en bajo o crítico" color="#B45309" bg="#FEF3C7" />
        <KpiCard Icon={PackageCheck} label="Entregas de Dotación" valor={kpis.totalEntregas}
          sub="Total registradas" color="#4D89E8" bg="#E8F0FD" />
      </div>

      {/* Stock por área */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Boxes size={18} className="text-primary" />
          <h2 className="text-sm font-bold text-ink-dark uppercase tracking-wide">
            Estado de Stock por Área
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.values(stockPorArea).map((s) => (
            <StockAreaCard key={s.area} {...s} />
          ))}
        </div>
      </div>

      {/* Gráfico + actividad */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Gráfico de barras */}
        <Card className="xl:col-span-2">
          <CardHeader title="Empleados Activos por Área" subtitle="Distribución actual del personal"
            icon={TrendingUp} />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGrafico} margin={{ top: 24, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,82,212,0.06)' }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }}
                  formatter={(v) => [`${v} empleados`, 'Activos']}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} label={<BarLabel />} maxBarSize={70}>
                  {datosGrafico.map((_, i) => (
                    <Cell key={i} fill={COLORES_BARRA[i % COLORES_BARRA.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Feed de actividades recientes */}
        <Card className="flex flex-col">
          <CardHeader title="Actividad Reciente" subtitle="Últimos movimientos" icon={History} />
          <div className="p-3 flex-1 overflow-y-auto max-h-[360px]">
            {actividades.length === 0 ? (
              <p className="text-center text-muted text-sm py-8">Sin actividad registrada.</p>
            ) : (
              <ul className="space-y-1">
                {actividades.map((a) => {
                  const cfg = ICONO_ACCION[a.accion] || ICONO_ACCION.sistema;
                  const { Icon } = cfg;
                  return (
                    <li key={a.id_actividad}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-canvas transition-colors">
                      <span className="grid place-items-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-ink leading-snug">{a.detalle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge tone={TONO_ACCION[a.accion]} className="!text-[10px] !py-0">
                            {ETIQUETA_ACCION[a.accion]}
                          </Badge>
                          <span className="text-[11px] text-muted">{formatoFecha(a.fecha)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
