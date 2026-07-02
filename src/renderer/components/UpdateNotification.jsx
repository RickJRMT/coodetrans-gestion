import { AlertCircle, CheckCircle, Download, RefreshCw, X } from 'lucide-react';

/**
 * UpdateNotification - Notificación de actualización en esquina inferior derecha
 * Muestra estado: disponible → descargando → descargado → error
 */
export default function UpdateNotification({
  estado,
  version,
  progreso,
  velocidad,
  error,
  onInstalar,
  onCerrar,
}) {
  if (!estado) return null;

  const getPorcentajeFormato = () => {
    if (!velocidad) return `${progreso}%`;
    const mb = (velocidad / 1024 / 1024).toFixed(1);
    return `${progreso}% - ${mb} MB/s`;
  };

  const getVelocidadFormato = () => {
    if (!velocidad) return '';
    if (velocidad > 1024 * 1024) {
      return `${(velocidad / 1024 / 1024).toFixed(1)} MB/s`;
    }
    return `${(velocidad / 1024).toFixed(1)} KB/s`;
  };

  return (
    <div className="fixed bottom-5 right-5 z-[999] max-w-sm">
      {estado === 'disponible' && (
        <div className="bg-white border border-primary/30 rounded-lg shadow-lg p-4 space-y-3 animate-slide-in-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Download size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-dark text-sm">
                  Nueva versión disponible
                </p>
                <p className="text-xs text-muted">v{version}</p>
              </div>
            </div>
            <button
              onClick={onCerrar}
              className="text-muted hover:text-ink transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onInstalar}
              className="flex-1 px-3 py-2 bg-primary text-white text-xs font-medium rounded-lg
                hover:bg-primary/90 transition-colors"
            >
              Descargar
            </button>
            <button
              onClick={onCerrar}
              className="flex-1 px-3 py-2 bg-canvas text-ink text-xs font-medium rounded-lg
                hover:bg-canvas/80 transition-colors"
            >
              Después
            </button>
          </div>
        </div>
      )}

      {estado === 'descargando' && (
        <div className="bg-white border border-primary/30 rounded-lg shadow-lg p-4 space-y-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <RefreshCw size={20} className="text-primary flex-shrink-0 mt-0.5 animate-spin" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink-dark text-sm">
                Descargando actualización
              </p>
              <p className="text-xs text-muted">v{version}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Progreso</span>
              <span className="text-xs font-medium text-ink-dark">
                {getPorcentajeFormato()}
              </span>
            </div>
            <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progreso, 100)}%` }}
              />
            </div>
            {velocidad && (
              <p className="text-xs text-muted text-right">
                {getVelocidadFormato()}
              </p>
            )}
          </div>

          <p className="text-xs text-muted">
            No cierre la aplicación mientras se descarga
          </p>
        </div>
      )}

      {estado === 'descargado' && (
        <div className="bg-white border border-ok/30 rounded-lg shadow-lg p-4 space-y-3 animate-slide-in-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <CheckCircle size={20} className="text-ok flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-dark text-sm">
                  Actualización descargada
                </p>
                <p className="text-xs text-muted">v{version} lista para instalar</p>
              </div>
            </div>
            <button
              onClick={onCerrar}
              className="text-muted hover:text-ink transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onInstalar}
              className="flex-1 px-3 py-2 bg-ok text-white text-xs font-medium rounded-lg
                hover:bg-ok/90 transition-colors"
            >
              Reiniciar e Instalar
            </button>
            <button
              onClick={onCerrar}
              className="flex-1 px-3 py-2 bg-canvas text-ink text-xs font-medium rounded-lg
                hover:bg-canvas/80 transition-colors"
            >
              Después
            </button>
          </div>
        </div>
      )}

      {estado === 'error' && (
        <div className="bg-white border border-danger/30 rounded-lg shadow-lg p-4 space-y-3 animate-slide-in-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-dark text-sm">
                  Error en la actualización
                </p>
                <p className="text-xs text-danger/80">{error}</p>
              </div>
            </div>
            <button
              onClick={onCerrar}
              className="text-muted hover:text-ink transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
          <button
            onClick={onCerrar}
            className="w-full px-3 py-2 bg-canvas text-ink text-xs font-medium rounded-lg
              hover:bg-canvas/80 transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
