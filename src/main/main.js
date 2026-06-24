/**
 * main.js
 * Proceso principal de Electron.
 * - Crea la ventana de la aplicación.
 * - Inicializa la base de datos SQLite en la carpeta userData.
 * - Registra los manejadores IPC y carga el renderer (React/Vite).
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { initDatabase, closeDatabase } = require('../database/database');
const { registrarHandlersIPC } = require('./ipc-handlers');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#F4F7F9',
    title: 'Coodetrans Gestión',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Cargar el renderer: servidor de Vite en desarrollo, build estático en producción
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  // Inicializar BD en userData antes de abrir la ventana
  initDatabase(app.getPath('userData'));
  registrarHandlersIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  closeDatabase();
});

/* ──────────────────────────────────────────────────────────────────────
   ACTUALIZACIONES AUTOMÁTICAS (electron-updater) — PLACEHOLDER
   ─────────────────────────────────────────────────────────────────────
   Para habilitar las actualizaciones automáticas vía GitHub Releases:

   1) Instalar la dependencia:
        npm install electron-updater

   2) Configurar el "publish" en package.json (sección "build"):
        "publish": [{
          "provider": "github",
          "owner": "TU_USUARIO_GITHUB",
          "repo": "coodetrans-app"
        }]

   3) Publicar el instalador firmado en GitHub Releases:
        - Generar un token de GitHub (GH_TOKEN) con permiso "repo".
        - Ejecutar:  GH_TOKEN=xxxx npm run dist  (o el script de build:electron)
        - electron-builder subirá los artefactos y el archivo latest.yml.

   4) Descomentar el siguiente bloque para verificar e instalar
      actualizaciones al iniciar la aplicación:

   // const { autoUpdater } = require('electron-updater');
   // autoUpdater.on('update-available', () => {
   //   console.log('[Updater] Hay una actualización disponible, descargando...');
   // });
   // autoUpdater.on('update-downloaded', () => {
   //   // Notificar al usuario y reiniciar para aplicar la actualización
   //   autoUpdater.quitAndInstall();
   // });
   // autoUpdater.on('error', (err) => console.error('[Updater] Error:', err));
   //
   // app.whenReady().then(() => {
   //   if (!isDev) autoUpdater.checkForUpdatesAndNotify();
   // });
─────────────────────────────────────────────────────────────────────── */
