import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal — Ventana modal reutilizable con fondo oscurecido.
 * Se cierra con la tecla Escape o al hacer clic en el fondo.
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const anchos = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4
        bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${anchos[size]} bg-white rounded-xl shadow-2xl
          max-h-[90vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
          <h3 className="text-base font-semibold text-ink-dark">{title}</h3>
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-lg text-muted
              hover:bg-canvas hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-edge bg-canvas/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
