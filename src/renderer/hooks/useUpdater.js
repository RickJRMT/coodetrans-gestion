import { useState, useEffect } from 'react';

/**
 * Hook para gestionar las actualizaciones de la aplicación
 * Retorna el estado actual de la actualización y funciones de control
 */
export default function useUpdater() {
  const [updateState, setUpdateState] = useState({
    estado: null, // 'disponible', 'descargando', 'descargado', 'error'
    version: null,
    progreso: 0,
    velocidad: null,
    fecha: null,
    notas: null,
    error: null,
  });

  useEffect(() => {
    // Listener para actualización disponible
    const limpiar1 = window.api?.update?.disponible?.((info) => {
      console.log('Nueva versión disponible', info);
      setUpdateState((prev) => ({
        ...prev,
        estado: 'disponible',
        version: info.version,
        fecha: info.fecha,
        notas: info.notas,
      }));
    });

    // Listener para progreso de descarga
    const limpiar2 = window.api?.update?.progreso?.((info) => {
      console.log('Progreso de descarga:', info.progreso + '%');
      setUpdateState((prev) => ({
        ...prev,
        estado: 'descargando',
        progreso: info.progreso,
        velocidad: info.velocidad,
      }));
    });

    // Listener para actualización descargada
    const limpiar3 = window.api?.update?.descargada?.((info) => {
      console.log('Actualización descargada', info);
      setUpdateState((prev) => ({
        ...prev,
        estado: 'descargado',
        version: info.version,
        progreso: 100,
      }));
    });

    // Listener para error
    const limpiar4 = window.api?.update?.error?.((info) => {
      console.error('Error en actualización:', info);
      setUpdateState((prev) => ({
        ...prev,
        estado: 'error',
        error: info.mensaje,
      }));
    });

    return () => {
      limpiar1?.();
      limpiar2?.();
      limpiar3?.();
      limpiar4?.();
    };
  }, []);

  const instalarActualizacion = async () => {
    try {
      await window.api?.update?.instalar?.();
    } catch (err) {
      console.error('Error al instalar actualización:', err);
      setUpdateState((prev) => ({
        ...prev,
        estado: 'error',
        error: err.message,
      }));
    }
  };

  const cerrarNotificacion = () => {
    setUpdateState({
      estado: null,
      version: null,
      progreso: 0,
      velocidad: null,
      fecha: null,
      notas: null,
      error: null,
    });
  };

  return {
    ...updateState,
    instalarActualizacion,
    cerrarNotificacion,
  };
}