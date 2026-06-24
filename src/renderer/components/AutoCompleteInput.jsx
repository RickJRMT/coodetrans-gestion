import { useEffect, useRef, useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { normalizarBusqueda } from '../utils/format';

/**
 * Componente AutoCompleteInput (Memoizado)
 * Proporciona autocompletado inteligente para buscar empleados.
 * Permite escribir libremente y acepta lo escrito si no hay coincidencias.
 *
 * Props:
 * - items: Array de objetos disponibles para búsqueda
 * - value: Valor seleccionado (id del empleado)
 * - onChange: Callback cuando se selecciona un item
 * - getLabel: Función para extraer el label del item (por defecto: e.nombre_completo)
 * - filterFields: Array de campos donde buscar (por defecto: ['nombre_completo', 'cedula'])
 * - placeholder: Placeholder del input
 * - searchPlaceholder: Placeholder para búsqueda en dropdown
 * - preFilterOptions: Array de opciones para pre-filtrar (ej: {label: 'Área', field: 'nom_area'})
 * - disabled: Desabilitar el componente
 * - label: Etiqueta del campo
 * - allowFreeText: Permitir escribir texto libre (default: false)
 */
const AutoCompleteInput = ({
  items = [],
  value = '',
  onChange,
  getLabel = (e) => e.nombre_completo || '',
  filterFields = ['nombre_completo', 'cedula'],
  placeholder = 'Buscar...',
  searchPlaceholder = 'Filtrar resultados...',
  preFilterOptions = [],
  disabled = false,
  label = '',
  allowFreeText = true,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({});
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Determinar el label del item actualmente seleccionado (memoizado)
  const itemSeleccionado = useMemo(
    () => items.find((it) => String(it.id_empleado || it.id) === String(value)),
    [items, value]
  );
  const labelSeleccionado = useMemo(
    () => (itemSeleccionado ? getLabel(itemSeleccionado) : ''),
    [itemSeleccionado, getLabel]
  );

  // Filtrar items según búsqueda y pre-filtros (memoizado)
  const filtrados = useMemo(() => {
    return items.filter((item) => {
      // Aplicar pre-filtros
      for (const [key, val] of Object.entries(filtros)) {
        if (val && item[key] !== val) return false;
      }

      // Aplicar búsqueda
      if (!busqueda) return true;
      const q = normalizarBusqueda(busqueda);
      return filterFields.some((field) => {
        const fieldVal = String(item[field] || '');
        return normalizarBusqueda(fieldVal).includes(q);
      });
    });
  }, [items, busqueda, filtros, filterFields]);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const seleccionar = (item) => {
    onChange?.(item);
    setAbierto(false);
    setBusqueda('');
  };

  // Aceptar búsqueda como texto libre
  const aceptarBusqueda = () => {
    if (allowFreeText && busqueda.trim()) {
      onChange?.({ 
        id_empleado: null, 
        nombre_completo: busqueda.trim(),
        _isCustom: true
      });
      setAbierto(false);
      setBusqueda('');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-subtle mb-1.5">{label}</label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={abierto ? busqueda : labelSeleccionado}
          onChange={(e) => setBusqueda(e.target.value)}
          onClick={() => !disabled && setAbierto(true)}
          onFocus={() => !disabled && setAbierto(true)}
          placeholder={abierto ? searchPlaceholder : placeholder}
          disabled={disabled}
          className={`w-full rounded-lg border border-edge bg-white text-sm px-3 py-2.5 pr-10
            text-ink placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
            transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          `}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <ChevronDown size={16} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Pre-filtros (si hay) */}
      {preFilterOptions.length > 0 && abierto && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border border-edge rounded-lg
          shadow-sm z-20 space-y-1.5">
          {preFilterOptions.map((opt) => (
            <select
              key={opt.field}
              value={filtros[opt.field] || ''}
              onChange={(e) => setFiltros((f) => ({ ...f, [opt.field]: e.target.value }))}
              className="w-full text-xs rounded px-2 py-1 border border-edge bg-white
                text-ink focus:outline-none focus:ring-1 focus:ring-primary/25"
            >
              <option value="">Todas {opt.label.toLowerCase()}</option>
              {Array.from(new Set(items.map((it) => it[opt.field]).filter(Boolean))).map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Dropdown de resultados */}
      {abierto && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-edge rounded-lg
          shadow-lg z-10 max-h-80 overflow-y-auto">
          {filtrados.length === 0 && !busqueda ? (
            <div className="px-3 py-4 text-center text-muted text-sm">
              {items.length === 0 ? 'Sin opciones disponibles' : 'Escribe para buscar'}
            </div>
          ) : filtrados.length === 0 && busqueda && allowFreeText ? (
            <div className="divide-y divide-edge/50">
              <button
                type="button"
                onClick={aceptarBusqueda}
                className="w-full text-left px-3 py-2.5 hover:bg-primary-light hover:text-primary
                  transition-colors text-sm text-ink font-medium"
              >
                ✓ Usar: <span className="font-semibold">{busqueda}</span>
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-edge/50">
              {filtrados.slice(0, 50).map((item, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => seleccionar(item)}
                    className="w-full text-left px-3 py-2.5 hover:bg-primary-light hover:text-primary
                      transition-colors text-sm"
                  >
                    <p className="font-medium text-ink">{getLabel(item)}</p>
                    {item.cedula && (
                      <p className="text-xs text-muted mt-0.5">{item.cedula}</p>
                    )}
                    {item.nom_area && (
                      <p className="text-xs text-muted">{item.nom_area}</p>
                    )}
                    {item.nom_cargo && (
                      <p className="text-xs text-muted">{item.nom_cargo}</p>
                    )}
                  </button>
                </li>
              ))}
              {filtrados.length > 0 && busqueda && allowFreeText && (
                <>
                  <li className="bg-canvas/50">
                    <button
                      type="button"
                      onClick={aceptarBusqueda}
                      className="w-full text-left px-3 py-2.5 hover:bg-primary-light hover:text-primary
                        transition-colors text-sm text-muted hover:text-primary font-medium"
                    >
                      + Usar: <span className="font-semibold">{busqueda}</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoCompleteInput;
