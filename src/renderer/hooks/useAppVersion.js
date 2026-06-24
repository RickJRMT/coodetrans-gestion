import { useEffect, useState } from "react";

export default function useAppVersion() {
    const [version, setVersion] = useState('');

    useEffect(() => {
        window.api.app.version()
            .then(setVersion)
            .catch(() => setVersion('N/D'));
    }, []);

    return version;
}