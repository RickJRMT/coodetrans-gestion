import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Contexto de autenticación.
 * Mantiene el usuario en sesión y expone login / logout.
 * La sesión se conserva en memoria (y se respalda en sessionStorage para
 * sobrevivir a recargas del renderer durante el desarrollo).
 */
const AuthContext = createContext(null);

const CLAVE = 'coodetrans_sesion';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = sessionStorage.getItem(CLAVE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (credenciales) => {
    const res = await api.auth.login(credenciales);
    if (res.ok) {
      setUsuario(res.data);
      sessionStorage.setItem(CLAVE, JSON.stringify(res.data));
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    sessionStorage.removeItem(CLAVE);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, autenticado: !!usuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return ctx;
}
