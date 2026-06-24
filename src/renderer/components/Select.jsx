/**
 * Select — Lista desplegable reutilizable con la misma estética que Input.
 * Acepta `options` como arreglo de { value, label } o children <option>.
 */
export default function Select({
  label,
  error,
  className = '',
  id,
  options,
  children,
  ...props
}) {
  const selectId = id || props.name;
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-subtle mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-lg border bg-white text-sm text-ink px-3 py-2.5
          transition-colors focus:outline-none focus:ring-2 focus:ring-primary/25
          focus:border-primary ${error ? 'border-danger' : 'border-edge'}`}
        {...props}
      >
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
