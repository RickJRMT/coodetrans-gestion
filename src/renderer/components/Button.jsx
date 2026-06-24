/**
 * Button — Botón reutilizable con variantes corporativas.
 * Variantes: primary | secondary | ghost | danger | success
 */
const VARIANTES = {
  primary:   'bg-primary text-white hover:bg-primary-dark shadow-sm',
  secondary: 'bg-white text-ink border border-edge hover:bg-canvas',
  ghost:     'bg-transparent text-subtle hover:bg-canvas hover:text-ink',
  danger:    'bg-danger text-white hover:opacity-90 shadow-sm',
  success:   'bg-ok text-white hover:bg-ok-dark shadow-sm',
};

const TAMANOS = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-5 py-2.5 gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTES[variant]} ${TAMANOS[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 15 : 17} />}
      {children}
    </button>
  );
}
