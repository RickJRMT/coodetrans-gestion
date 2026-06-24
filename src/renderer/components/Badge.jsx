/**
 * Badge — Etiqueta de estado reutilizable.
 * Tonos: ok | bajo | critico | info | neutral
 */
const TONOS = {
  ok:      'bg-ok-light text-ok-dark',
  bajo:    'bg-warn-light text-warn',
  critico: 'bg-danger-light text-danger',
  info:    'bg-primary-light text-primary',
  neutral: 'bg-canvas text-subtle border border-edge',
};

export default function Badge({ children, tone = 'neutral', dot = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold
        px-2.5 py-0.5 rounded-full ${TONOS[tone]} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
