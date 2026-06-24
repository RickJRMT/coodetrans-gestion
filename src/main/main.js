/**
 * main.js
 * Proceso principal de Electron.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { initDatabase, closeDatabase } = require('../database/database');
const { registrarHandlersIPC } = require('./ipc-handlers');

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

function cargarRenderer(win) {
  if (isDev) {
    let intentos = 0;
    const maxIntentos = 12;

    const intentarCarga = () => {
      intentos += 1;
      win.loadURL(VITE_DEV_URL).catch(() => {});
    };

    win.webContents.on('did-fail-load', (_event, errorCode, _desc, validatedURL) => {
      if (validatedURL === VITE_DEV_URL && intentos < maxIntentos) {
        setTimeout(intentarCarga, 800);
      } else if (errorCode !== -3) {
        console.error('[Main] Error cargando Vite:', errorCode);
      }
    });

    intentarCarga();
    if (process.env.NODE_ENV === 'development') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    win.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }
}

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

  cargarRenderer(mainWindow);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

/**
 * Tras restaurar la BD: en desarrollo recarga sin matar Vite;
 * en producción reinicia el proceso completo.
 */
function reiniciarTrasRestauracionBD() {
  const userData = app.getPath('userData');
  initDatabase(userData);

  if (isDev) {
    const ventanas = BrowserWindow.getAllWindows();
    if (ventanas.length) {
      ventanas.forEach((w) => w.webContents.reload());
    } else {
      createWindow();
    }
    return { modo: 'recarga-suave' };
  }

  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch-dev']) });
  app.exit(0);
  return { modo: 'reinicio-completo' };
}

app.whenReady().then(() => {
  initDatabase(app.getPath('userData'));
  registrarHandlersIPC({ reiniciarTrasRestauracionBD });
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

module.exports = { reiniciarTrasRestauracionBD, esModoDesarrollo };
