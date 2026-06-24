import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal — Ventana modal reutilizable con fondo oscurecido.
 * Se cierra con la tecla Escape o al hacer clic en el fondo.
 *
 * IMPORTANTE: se renderiza mediante un PORTAL a `document.body`. Esto evita
 * que algún contenedor padre con `transform` (p. ej. la animación fade-in del
 * layout) o con `overflow` atrape el `position: fixed`, lo que provocaba que
 * el overlay oscuro no cubriera toda la pantalla y se viera una línea/corte
 * en la parte superior del formulario. Al usar un portal, el overlay siempre
 * cubre el viewport completo, sin bordes ni líneas visibles.
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    // Bloquear el scroll del fondo mientras el modal está abierto
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [open, onClose]);

  if (!open) return null;

  const anchos = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  const contenido = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4
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

  // Renderizar fuera de la jerarquía del layout para cubrir todo el viewport.
  return createPortal(contenido, document.body);
}
