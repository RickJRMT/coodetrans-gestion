import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Package, History, Settings,
} from 'lucide-react';
import logo from '../assets/coodetransLogo.png';
import useAppVersion from '../hooks/useAppVersion';

/**
 * Sidebar — Barra lateral colapsable.
 * Comportamiento: minimizada por defecto (solo iconos). Se expande
 * automáticamente al pasar el cursor (hover) con animaciones suaves.
 */


const NAV_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',                  Icon: LayoutDashboard },
  { to: '/carpetas',      label: 'Control de Carpetas Físicas', Icon: FolderOpen     },
  { to: '/inventario',    label: 'Inventario General',         Icon: Package         },
  { to: '/movimientos',   label: 'Historial de Movimientos',   Icon: History         },
  { to: '/configuracion', label: 'Configuración',              Icon: Settings        },
];

export default function Sidebar() {
  const version = useAppVersion();
  const [expandida, setExpandida] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpandida(true)}
      onMouseLeave={() => setExpandida(false)}
      className="sidebar-gradient h-full flex flex-col shrink-0 shadow-sidebar
        overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-20"
      style={{ width: expandida ? 240 : 64 }}
    >
      {/* Encabezado de marca */}
      <div
        className="flex items-center gap-3 px-3 border-b border-white/10 min-h-[68px]"
        style={{ justifyContent: expandida ? 'flex-start' : 'center' }}
      >
        <img
          src={logo}
          alt="Coodetrans"
          className="object-contain shrink-0"
          style={{ height: expandida ? 38 : 34, width: expandida ? 38 : 34 }}
        />
        <div
          className="overflow-hidden transition-all duration-300 whitespace-nowrap"
          style={{ width: expandida ? 'auto' : 0, opacity: expandida ? 1 : 0 }}
        >
          <p className="text-white font-bold text-sm leading-tight">Coodetrans</p>
          <p className="text-white/50 text-[10px] leading-tight">Gestión Documental</p>
        </div>
      </div>

      {/* Etiqueta de sección — con más separación y sin recorte del texto */}
      <div className="px-4 pt-5 pb-2 mt-1 h-[34px] flex items-center overflow-hidden">
        <span
          className="text-white/40 text-[10px] font-bold tracking-[0.14em] uppercase
            whitespace-nowrap leading-none transition-opacity duration-200"
          style={{ opacity: expandida ? 1 : 0 }}
        >
          Módulos
        </span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2.5 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={!expandida ? label : undefined}
            className={({ isActive }) =>
              `relative flex items-center rounded-lg cursor-pointer
               transition-all duration-150 group
               ${expandida ? 'gap-3 px-3.5 py-2.5 justify-start' : 'justify-center p-2.5'}
               ${isActive
                 ? 'bg-white/15 text-white font-semibold'
                 : 'text-white/60 hover:bg-white/[0.07] hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-ok" />
                )}
                <Icon size={18} className="shrink-0" />
                <span
                  className="overflow-hidden whitespace-nowrap text-[13px]
                    transition-all duration-300"
                  style={{ width: expandida ? 'auto' : 0, opacity: expandida ? 1 : 0 }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Pie con marca RickLabs */}
      <div className="border-t border-white/10 px-3 py-3 flex flex-col items-center gap-1">
        {expandida && (
          <span className="text-white/25 text-[10px]">v{version} — SQLite3 Local</span>
        )}
        <span className="text-white/25 text-[9px] tracking-wide whitespace-nowrap">
          {expandida ? 'Desarrollado por RickLabs' : 'RL'}
        </span>
      </div>
    </aside>
  );
}
