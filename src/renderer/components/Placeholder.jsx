import Card from './Card';
import Badge from './Badge';

/**
 * Placeholder — Plantilla para módulos en construcción (Fase 1).
 * Muestra el propósito del módulo y las funciones próximas.
 */
export default function Placeholder({ Icon, titulo, descripcion, proximamente = [] }) {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-10 text-center">
        <span className="grid place-items-center w-16 h-16 rounded-2xl bg-primary-light
          text-primary mx-auto mb-5">
          <Icon size={32} />
        </span>
        <h2 className="text-xl font-bold text-ink-dark mb-2">{titulo}</h2>
        <p className="text-sm text-subtle max-w-md mx-auto mb-6">{descripcion}</p>
        <Badge tone="info">Disponible en la próxima fase</Badge>

        {proximamente.length > 0 && (
          <div className="mt-8 text-left">
            <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-3">
              Funciones planeadas
            </p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {proximamente.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-ink
                  bg-canvas rounded-lg px-3 py-2 border border-edge">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
