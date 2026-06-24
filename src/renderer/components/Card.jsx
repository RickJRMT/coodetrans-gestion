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
    <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary-light text-primary">
            <Icon size={18} />
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-ink-dark">{title}</h3>
          {subtitle && <p className="text-xs text-subtle mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
