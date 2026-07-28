/**
 * Card — Contenedor reutilizable con borde, sombra suave y padding.
 */
export default function Card({ children, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`bg-white border border-edge rounded-xl shadow-card ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Encabezado opcional para una Card (título + acción a la derecha). */
export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 border-b border-edge sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary-light text-primary shrink-0">
            <Icon size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink-dark">{title}</h3>
          {subtitle && <p className="text-xs text-subtle mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
