import { useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import Badge from './Badge';
import { formatNombre, formatCedula } from '../utils/format';

const ROW_HEIGHT = 56;
const BUFFER = 5;

/**
 * Tabla de entregas de dotación con altura fija, scroll interno y renderizado virtual
 */
export default function EntregasTable({
  items,
  fmtFecha,
  fmt,
  onDetalle,
}) {
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 520;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + BUFFER * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);
  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = Math.max(0, (items.length - endIndex) * ROW_HEIGHT);

  const headers = ['Fecha', 'Período', 'Empleado', 'Artículos', 'Unidades', 'Registró', 'Detalle'];

  return (
    <div
      ref={scrollRef}
      className="overflow-auto border-t border-edge"
      style={{ maxHeight: 'min(520px, calc(100vh - 280px))', height: 'min(520px, calc(100vh - 280px))' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <table className="w-full text-sm table-fixed">
        <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
          <tr className="border-b border-edge bg-canvas/50">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left font-semibold text-subtle text-xs uppercase tracking-wide px-4 py-3 whitespace-nowrap bg-canvas/95 backdrop-blur-sm"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-muted py-10">
                No hay entregas registradas con los filtros aplicados.
              </td>
            </tr>
          ) : (
            <>
              {paddingTop > 0 && (
                <tr aria-hidden="true" style={{ height: paddingTop }}>
                  <td colSpan={7} className="p-0 border-0" />
                </tr>
              )}
              {visibleItems.map((e) => (
                <tr
                  key={e.id_entrega}
                  className="border-b border-edge/70 last:border-0 hover:bg-canvas/60 transition-colors"
                  style={{ height: ROW_HEIGHT }}
                >
                  <td className="px-4 py-3 text-ink align-middle">{fmt(e.fecha_entrega)}</td>
                  <td className="px-4 py-3 align-middle">
                    <Badge tone="info">{e.periodo}</Badge>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <p className="font-medium text-ink-dark truncate">{formatNombre(e.empleado)}</p>
                    <p className="text-xs text-muted">{formatCedula(e.cedula)}</p>
                  </td>
                  <td className="px-4 py-3 text-ink align-middle">{e.items}</td>
                  <td className="px-4 py-3 font-semibold text-ink-dark align-middle">{e.total_unidades}</td>
                  <td className="px-4 py-3 text-muted align-middle truncate">{e.usuario || '—'}</td>
                  <td className="px-4 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => onDetalle(e)}
                      title="Ver detalle"
                      className="grid place-items-center w-8 h-8 rounded-lg text-subtle hover:bg-primary-light hover:text-primary transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {paddingBottom > 0 && (
                <tr aria-hidden="true" style={{ height: paddingBottom }}>
                  <td colSpan={7} className="p-0 border-0" />
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
