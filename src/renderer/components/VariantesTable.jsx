import { useRef, useState } from 'react';
import { SlidersHorizontal, Trash2 } from 'lucide-react';
import Badge from './Badge';
import { formatNombre } from '../utils/format';

const ROW_HEIGHT = 56;
const BUFFER = 5;

/**
 * Tabla de variantes de inventario con altura fija, scroll interno y renderizado virtual
 * para mantener fluidez con grandes volúmenes de datos.
 */
export default function VariantesTable({
  items,
  TONO_ESTADO,
  ETIQUETA_ESTADO,
  fmtFecha,
  onAjuste,
  onDelete,
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

  const headers = ['Artículo', 'Área', 'Variante', 'Stock actual', 'Stock mínimo', 'Estado', 'Actualizado', 'Acciones'];

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
              <td colSpan={8} className="text-center text-muted py-10">
                No se encontraron variantes con los filtros aplicados.
              </td>
            </tr>
          ) : (
            <>
              {paddingTop > 0 && (
                <tr aria-hidden="true" style={{ height: paddingTop }}>
                  <td colSpan={8} className="p-0 border-0" />
                </tr>
              )}
              {visibleItems.map((v) => (
                <tr
                  key={v.id_stock_variante}
                  className="border-b border-edge/70 last:border-0 hover:bg-canvas/60 transition-colors"
                  style={{ height: ROW_HEIGHT }}
                >
                  <td className="px-4 py-3 align-middle">
                    <p className="font-semibold text-ink-dark truncate">{v.nombre_item}</p>
                  </td>
                  <td className="px-4 py-3 text-ink align-middle truncate">{v.nom_area || '—'}</td>
                  <td className="px-4 py-3 align-middle">
                    <Badge tone="neutral">{v.variante}</Badge>
                  </td>
                  <td className="px-4 py-3 font-bold text-ink-dark align-middle">{v.stock_actual}</td>
                  <td className="px-4 py-3 text-muted align-middle">{v.stock_minimo}</td>
                  <td className="px-4 py-3 align-middle">
                    <Badge tone={TONO_ESTADO[v.estado]} dot>{ETIQUETA_ESTADO[v.estado]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted align-middle whitespace-nowrap">{fmtFecha(v.updatedAt)}</td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onAjuste(v)}
                        title="Ajustar stock"
                        className="grid place-items-center w-8 h-8 rounded-lg text-subtle hover:bg-primary-light hover:text-primary transition-colors"
                      >
                        <SlidersHorizontal size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(v)}
                        title="Eliminar variante"
                        className="grid place-items-center w-8 h-8 rounded-lg text-subtle hover:bg-danger-light hover:text-danger transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paddingBottom > 0 && (
                <tr aria-hidden="true" style={{ height: paddingBottom }}>
                  <td colSpan={8} className="p-0 border-0" />
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
