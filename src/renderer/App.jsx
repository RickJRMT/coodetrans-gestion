import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CarpetasPage from './pages/CarpetasPage';
import InventarioPage from './pages/InventarioPage';
import MovimientosPage from './pages/MovimientosPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import { useEffect } from 'react';
import useUpdater from './hooks/useUpdater';

/** Protege rutas privadas: redirige al login si no hay sesión. */
function RutaPrivada({ children }) {
  const { autenticado } = useAuth();
  const location = useLocation();
  if (!autenticado) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function Enrutador() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RutaPrivada>
            <Layout />
          </RutaPrivada>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="carpetas" element={<CarpetasPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="movimientos" element={<MovimientosPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  useUpdater();
  return (
    <AuthProvider>
      <Enrutador />
    </AuthProvider>
  );
}


