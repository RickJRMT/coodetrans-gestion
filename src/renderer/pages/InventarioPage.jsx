import { useEffect, useMemo, useState } from 'react';
import {
  Search, AlertTriangle, RefreshCw, Boxes, PackageCheck, Layers,
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Select from '../components/Select';
import { api } from '../utils/api';

const TONO_ESTADO = { normal: 'ok', bajo: 'bajo', critico: 'critico' };
const ETIQUETA_ESTADO = { normal: 'Normal', bajo: 'Bajo', critico: 'Crítico' };

function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T'));
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const [resumen, setResumen] = useState({});
  const [variantes, setVariantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const [res, vars] = await Promise.all([
          api.inventario.resumen(),
          api.inventario.variantes(),
        ]);
        if (!activo) return;
        if (res.ok) setResumen(res.data);
        if (vars.ok) setVariantes(vars.data); else setError(vars.error);
      } catch {
        setError('Error de comunicación con la base de datos.');
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
  }, []);

  // Áreas únicas para el filtro
  const areas = useMemo(() => {
    const set = new Map();
    variantes.forEach((v) => { if (v.nom_area) set.set(v.fk_id_area, v.nom_area); });
    return Array.from(set, ([id, nom]) => ({ id, nom }));
  }, [variantes]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return variantes.filter((v) => {
      if (filtroArea && String(v.fk_id_area) !== String(filtroArea)) return false;
      if (filtroEstado && v.estado !== filtroEstado) return false;
      if (q && !(`${v.nombre_item} ${v.variante}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [variantes, busqueda, filtroArea, filtroEstado]);

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

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <Input icon={Search} placeholder="Buscar artículo o variante..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}
              className="min-w-[160px]">
              <option value="">Todas las áreas</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </Select>
            <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className="min-w-[150px]">
              <option value="">Todos los estados</option>
              <option value="normal">Normal</option>
              <option value="bajo">Bajo</option>
              <option value="critico">Crítico</option>
            </Select>
          </div>
        </div>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge bg-canvas/50">
                {['Artículo', 'Área', 'Variante', 'Stock actual', 'Stock mínimo', 'Estado', 'Actualizado'].map((h) => (
                  <th key={h} className="text-left font-semibold text-subtle text-xs uppercase
                    tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-10">
                  No se encontraron variantes con los filtros aplicados.
                </td></tr>
              ) : filtrados.map((v) => (
                <tr key={v.id_stock_variante} className="border-b border-edge/70 last:border-0
                  hover:bg-canvas/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-medium text-ink-dark">
                      <PackageCheck size={15} className="text-muted" />{v.nombre_item}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">{v.nom_area || '—'}</td>
                  <td className="px-4 py-3"><Badge tone="neutral">{v.variante}</Badge></td>
                  <td className="px-4 py-3 font-bold text-ink-dark">{v.stock_actual}</td>
                  <td className="px-4 py-3 text-muted">{v.stock_minimo}</td>
                  <td className="px-4 py-3">
                    <Badge tone={TONO_ESTADO[v.estado]} dot>{ETIQUETA_ESTADO[v.estado]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{fmtFecha(v.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
