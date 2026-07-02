/**
 * main.js
 * Proceso principal de Electron.
 */

const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { initDatabase, closeDatabase } = require('../database/database');
const { registrarHandlersIPC } = require('./ipc-handlers');
const { ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

const VITE_DEV_URL = 'http://localhost:5173';

function esModoDesarrollo() {
  if (app.isPackaged) return false;
  return (
    process.env.NODE_ENV === 'development' ||
    process.argv.includes('--dev') ||
    process.argv.includes('--relaunch-dev') ||
    !fs.existsSync(path.join(__dirname, '../../dist-renderer/index.html'))
  );
}

const isDev = esModoDesarrollo();
let mainWindow = null;

/** Icono corporativo para ventana, barra de tareas y accesos directos en runtime. */
function resolverIconoApp() {
  const candidatos = [
    path.join(process.resourcesPath || '', 'icon.ico'),
    path.join(process.resourcesPath || '', 'icon.png'),
    path.join(__dirname, '../../build/icon.ico'),
    path.join(__dirname, '../../build/icon.png'),
    path.join(__dirname, '../../src/renderer/assets/coodetransLogo.png'),
  ];
  for (const ruta of candidatos) {
    if (!ruta || !fs.existsSync(ruta)) continue;
    const img = nativeImage.createFromPath(ruta);
    if (!img.isEmpty()) return img;
  }
  return undefined;
}

function cargarRenderer(win) {
  if (isDev) {
    let intentos = 0;
    const maxIntentos = 12;

    const intentarCarga = () => {
      intentos += 1;
      win.loadURL(VITE_DEV_URL).catch(() => { });
    };

    win.webContents.on('did-fail-load', (_event, errorCode, _desc, validatedURL) => {
      if (validatedURL === VITE_DEV_URL && intentos < maxIntentos) {
        setTimeout(intentarCarga, 800);
      } else if (errorCode !== -3) {
        console.error('[Main] Error cargando Vite:', errorCode);
      }
    });

    intentarCarga();
    // ✅ SEGURIDAD: DevTools solo en desarrollo (no en producción)
    if (process.env.NODE_ENV === 'development' && !process.env.DISABLE_DEVTOOLS) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    win.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }
}

function createWindow() {
  const icono = resolverIconoApp();
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#F4F7F9',
    title: 'Coodetrans Gestión',
    icon: icono,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      webSecurity: true,
      safeDialogs: true,
      safeDialogsMessage: 'Diálogo de aplicación Coodetrans',
    },
  });

  cargarRenderer(mainWindow);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    if (!isDev) {
      console.log('[Updater] Buscando actualizaciones...');
      autoUpdater.checkForUpdates();
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

/**
 * Tras restaurar la BD: recarga suave del renderer en todos los entornos.
 * Evita app.relaunch() que destruye sessionStorage y fuerza el login.
 */
function reiniciarTrasRestauracionBD() {
  closeDatabase();
  initDatabase(app.getPath('userData'));

  const ventanas = BrowserWindow.getAllWindows();
  if (ventanas.length) {
    ventanas.forEach((w) => {
      if (!w.isDestroyed()) {
        w.webContents.send('db:restored');
        w.webContents.reload();
      }
    });
  } else {
    createWindow();
  }
  return { modo: 'recarga-suave' };
}

ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.ricklabs.coodetrans.gestion');
  }
  initDatabase(app.getPath('userData'));
  registrarHandlersIPC({ reiniciarTrasRestauracionBD });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });

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

// Logs para ver exactamente que ocurre
autoUpdater.on('checking-for-update', () => {
  console.log('[Updater] Buscando actualizaciones...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[Updater] Actualización disponible:', info.version);

  // ✅ SEGURIDAD: Validar información de actualización
  if (info && typeof info.version === 'string') {
    setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;

      mainWindow.webContents.send('update:available', {
        version: info.version,
        fecha: info.releaseDate || new Date().toISOString(),
        notas: info.releaseNotes || '',
      });
    }, 1200);
  } else {
    console.warn('[Updater] Información de actualización inválida');
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('[Updater] No hay actualizaciones disponibles');
});

autoUpdater.on('download-progress', (progressObj) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  // ✅ SEGURIDAD: Validar que el progreso sea confiable
  if (typeof progressObj.transferred === 'number' && typeof progressObj.total === 'number' && progressObj.total > 0) {
    const progreso = Math.round((progressObj.transferred / progressObj.total) * 100);
    mainWindow.webContents.send('update:download-progress', {
      progreso: Math.min(progreso, 100),
      velocidad: progressObj.bytesPerSecond || 0,
      descargados: progressObj.transferred,
      total: progressObj.total,
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[Updater] Actualización descargada:', info.version);

  mainWindow?.webContents.send('update:downloaded', {
    version: info.version,
    fecha: info.releaseDate,
    notas: info.releaseNotes,
  });
});

autoUpdater.on('error', (err) => {
  console.error('[Updater] Error:', err);
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  mainWindow.webContents.send('update:error', {
    mensaje: err.message,
  });
});
module.exports = { reiniciarTrasRestauracionBD, esModoDesarrollo };
