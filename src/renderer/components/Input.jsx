/**
 * Input — Campo de texto reutilizable con etiqueta e icono opcional.
 */
export default function Input({
  label,
  icon: Icon,
  error,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-subtle mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Icon size={17} />
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-lg border bg-white text-sm text-ink
            placeholder:text-muted py-2.5 transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
            ${Icon ? 'pl-10 pr-3' : 'px-3'}
            ${error ? 'border-danger' : 'border-edge'}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
