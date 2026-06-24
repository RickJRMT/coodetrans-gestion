import { useRef, useState } from 'react';
import { MapPin, History, Pencil } from 'lucide-react';
import Badge from './Badge';
import { formatCedula } from '../utils/format';

const ROW_HEIGHT = 56;
const BUFFER = 5;

/**
 * Tabla de empleados con altura fija, scroll interno y renderizado virtual
 * para mantener fluidez con grandes volúmenes de datos.
 */
export default function EmpleadosTable({ items, onEdit, onHistory }) {
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 520;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + BUFFER * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);
  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = Math.max(0, (items.length - endIndex) * ROW_HEIGHT);

  const headers = ['Empleado', 'Cédula', 'Área / Cargo', 'Ubicación', 'Observaciones', 'Estado', 'Acciones'];

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
                No se encontraron carpetas con los filtros aplicados.
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
                  key={e.id_empleado}
                  className="border-b border-edge/70 last:border-0 hover:bg-canvas/60 transition-colors"
                  style={{ height: ROW_HEIGHT }}
                >
                  <td className="px-4 py-3 align-middle">
                    <p className="font-semibold text-ink-dark truncate">{e.nombre_completo}</p>
                    <p className="text-xs text-muted truncate">{e.genero || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink align-middle font-mono text-xs">
                    {formatCedula(e.cedula)}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <p className="text-ink truncate">{e.nom_area || '—'}</p>
                    <p className="text-xs text-muted truncate">{e.nom_cargo || 'Sin cargo'}</p>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="inline-flex items-center gap-1 text-ink truncate max-w-full">
                      <MapPin size={14} className="text-muted shrink-0" />
                      <span className="truncate">{e.ubicacion_fisica || '—'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="text-ink text-xs line-clamp-2" title={e.observaciones || ''}>
                      {e.observaciones || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Badge tone={e.estado === 'Activo' ? 'ok' : 'neutral'} dot>{e.estado}</Badge>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onHistory(e)}
                        title="Ver historial de dotación"
                        className="grid place-items-center w-8 h-8 rounded-lg text-subtle hover:bg-primary-light hover:text-primary transition-colors"
                      >
                        <History size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(e)}
                        title="Editar carpeta"
                        className="grid place-items-center w-8 h-8 rounded-lg text-subtle hover:bg-primary-light hover:text-primary transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
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
