import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Se usa HashRouter porque Electron carga el renderer mediante el
// protocolo file:// en producción, donde el enrutamiento por historial
// del navegador (BrowserRouter) no funciona correctamente.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
