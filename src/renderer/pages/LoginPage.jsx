import { useState, version } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/coodetransLogo.png';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import useAppVersion from '../hooks/useAppVersion';

/**
 * LoginPage — Pantalla de autenticación contra la tabla usuario.
 * Diseño moderno de dos columnas con identidad corporativa Coodetrans.
 */
export default function LoginPage() {
  const version = useAppVersion();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await login({ username, password });
      if (res.ok) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.error || 'No fue posible iniciar sesión.');
      }
    } catch (err) {
      setError('Error de conexión con la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] sidebar-gradient p-12 text-white relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -left-16 bottom-10 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-3">
          <img src={logo} alt="Coodetrans" className="w-12 h-12 object-contain" />
          <div>
            <p className="font-bold text-xl leading-tight">Coodetrans</p>
            <p className="text-white/60 text-xs">Gestión Documental e Inventario</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold leading-tight mb-4">
            Control documental e<br />inventarios
          </h2>
          <p className="text-white/70 text-sm max-w-md leading-relaxed">
            Administre hojas de vida físicas, ubicaciones de archivo, stock de
            dotación y movimientos de su organización de forma rápida, segura y
            local con tecnología SQLite3.
          </p>
        </div>

        <div className="relative z-10 text-white/40 text-xs">
          v{version} — Edición Local · Desarrollado por RickLabs
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src={logo} alt="Coodetrans" className="w-16 h-16 object-contain mb-3" />
            <p className="font-bold text-xl text-ink-dark">Coodetrans</p>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-ink-dark mb-1">Bienvenido de nuevo</h1>
            <p className="text-sm text-subtle">Ingrese sus credenciales para continuar.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-danger-light text-danger text-sm
              px-3 py-2.5 rounded-lg mb-4 animate-fade-in">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Usuario"
              name="username"
              icon={User}
              placeholder="Ej: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <Input
              label="Contraseña"
              name="password"
              type={mostrarPassword ? 'text' : 'password'}
              icon={Lock}
              rightIcon={mostrarPassword ? EyeOff : Eye}
              rightIconOnClick={() => setMostrarPassword((prev) => !prev)}
              rightIconLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              icon={LogIn}
              size="lg"
              className="w-full mt-2"
              disabled={cargando}
            >
              {cargando ? 'Verificando...' : 'Ingresar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
