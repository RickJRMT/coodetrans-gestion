import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/coodetransLogo.png';

/** Metadatos de cada pantalla (título y subtítulo de la barra superior). */
const META = {
  '/dashboard': { titulo: 'Dashboard', sub: 'Panel general de la operación' },
  '/carpetas': { titulo: 'Control de Carpetas Físicas', sub: 'Hojas de vida y ubicación física de carpetas' },
  '/inventario': { titulo: 'Inventario General', sub: 'Administración de dotaciones y stock' },
  '/movimientos': { titulo: 'Historial de Movimientos', sub: 'Entregas de dotación y actividad del sistema' },
  '/configuracion': { titulo: 'Configuración', sub: 'Usuarios, roles y estructura organizacional' },
};


export default function Layout() {
  const instalarActualizacion = async () => {
    try {
      await window.api?.update?.instalar?.();
    } catch (error) {
      console.error('Error instalando actualización:', error);
    }
  };
  const [actualizacionDisponible, setActualizacionDisponible] = useState(null);
  const [actualizacionLista, setActualizacionLista] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const meta = META[pathname] || { titulo: 'Coodetrans', sub: '' };

  useEffect(() => {

    const limpiar1 =
      window.api?.update?.disponible?.((info) => {

        console.log("RECIBÍ update:available");

        console.log(info);

        setActualizacionDisponible(info);
      });

    const limpiar2 =
      window.api?.update?.descargada?.((info) => {

        console.log("RECIBÍ update:downloaded");

        console.log(info);

        setActualizacionDisponible(null);
        setActualizacionLista(info);
      });

    return () => {
      limpiar1?.();
      limpiar2?.();
    };

  }, []);

  const cerrarSesion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const nombreMostrado = usuario?.username || usuario?.nombre_completo || 'Usuario';
  const nombreCompletoMostrado = usuario?.nombre_completo || '';

  const iniciales = nombreMostrado
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
          <div className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="Coodetrans" className="w-9 h-9 object-contain shrink-0 lg:hidden" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-ink-dark leading-tight truncate">{meta.titulo}</h1>
              <p className="text-xs text-subtle truncate">{meta.sub}</p>
            </div>
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
                  {nombreMostrado}
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
                    <p className="text-sm font-semibold text-ink">{nombreMostrado}</p>
                    {nombreCompletoMostrado && (
                      <p className="text-xs text-subtle">{nombreCompletoMostrado}</p>
                    )}
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
      {actualizacionDisponible && !actualizacionLista && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl">
            <h2 className="text-lg font-bold mb-2">
              Nueva actualización disponible
            </h2>

            <p className="text-sm text-gray-600">
              Se encontró una nueva versión de Coodetrans Gestión.
            </p>

            <p className="text-sm mt-2 font-medium">
              Versión: {actualizacionDisponible?.version}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>

              <span className="text-sm">
                Descargando actualización...
              </span>
            </div>
          </div>
        </div>
      )}
      {actualizacionLista && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[450px] shadow-xl">

            <h2 className="text-lg font-bold mb-2">
              Actualización lista
            </h2>

            <p className="text-sm text-gray-600">
              La nueva versión ya fue descargada.
            </p>

            <p className="text-sm mt-2 font-medium">
              Versión: {actualizacionLista?.version}
            </p>

            <p className="text-sm mt-2">
              Es necesario reiniciar la aplicación para completar la instalación.
            </p>

            <div className="mt-5 flex justify-end gap-2">

              <button
                onClick={() => setActualizacionLista(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Más tarde
              </button>

              <button
                onClick={instalarActualizacion}
                className="px-4 py-2 bg-primary text-white rounded-lg"
              >
                Actualizar ahora
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
