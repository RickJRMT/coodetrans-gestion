import { useEffect } from 'react';

export default function useUpdater() {

    useEffect(() => {

        const limpiar1 =
            window.api?.update?.disponible?.((info) => {
                console.log('Nueva versión disponible', info);
            });

        const limpiar2 =
            window.api?.update?.descargada?.((info) => {
                console.log('Actualización descargada', info);
            });

        return () => {
            limpiar1?.();
            limpiar2?.();
        };

    }, []);

}