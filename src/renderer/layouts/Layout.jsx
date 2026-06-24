import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';

/** Metadatos de cada pantalla (título y subtítulo de la barra superior). */
const META = {
  '/dashboard':     { titulo: 'Dashboard', sub: 'Panel general de la operación' },
  '/carpetas':      { titulo: 'Control de Carpetas Físicas', sub: 'Hojas de vida y ubicación física de carpetas' },
  '/inventario':    { titulo: 'Inventario General', sub: 'Administración de dotaciones y stock' },
  '/movimientos':   { titulo: 'Historial de Movimientos', sub: 'Entregas de dotación y actividad del sistema' },
  '/configuracion': { titulo: 'Configuración', sub: 'Usuarios, roles y estructura organizacional' },
};

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const meta = META[pathname] || { titulo: 'Coodetrans', sub: '' };

  const cerrarSesion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const iniciales = (usuario?.nombre_completo || usuario?.username || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      <Sidebar />

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior */}
        <header className="h-[68px] bg-white border-b border-edge flex items-center
          justify-between px-6 shrink-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-ink-dark leading-tight">{meta.titulo}</h1>
            <p className="text-xs text-subtle">{meta.sub}</p>
          </div>

          {/* Menú de usuario */}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg
                hover:bg-canvas transition-colors"
            >
              <span className="grid place-items-center w-9 h-9 rounded-full
                bg-primary text-white text-xs font-bold">
                {iniciales}
              </span>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-ink leading-tight">
                  {usuario?.nombre_completo || usuario?.username}
                </p>
                <p className="text-[11px] text-subtle leading-tight">{usuario?.rol}</p>
              </div>
              <ChevronDown size={15} className="text-muted" />
            </button>

            {menuAbierto && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-edge
                  rounded-xl shadow-card-hover py-1.5 z-20 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-edge">
                    <p className="text-sm font-semibold text-ink">{usuario?.nombre_completo}</p>
                    <p className="text-xs text-subtle">@{usuario?.username}</p>
                  </div>
                  <button
                    onClick={cerrarSesion}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                      text-danger hover:bg-danger-light/50 transition-colors"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Área de páginas */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
