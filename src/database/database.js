/**
 * database.js
 * Inicialización y conexión única (singleton) a la base de datos SQLite
 * mediante el driver nativo better-sqlite3.
 *
 * - La base de datos se almacena en la carpeta userData de la aplicación
 *   (AppData en Windows, ~/Library en macOS, ~/.config en Linux).
 * - Al iniciar, se crea el esquema (schema.sql) si las tablas no existen
 *   y se cargan los datos semilla iniciales.
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let db = null;

/**
 * Resuelve la ruta del archivo schema.sql tanto en desarrollo como
 * empaquetado (electron-builder lo copia a process.resourcesPath).
 */
function resolveSchemaPath() {
  const candidates = [
    path.join(__dirname, 'schema.sql'),
    path.join(process.resourcesPath || '', 'schema.sql'),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  // Por defecto, devolver el primero (lanzará un error claro si no existe)
  return candidates[0];
}

/**
 * Inicializa la base de datos:
 *  @param {string} userDataPath  Carpeta userData provista por Electron app.getPath('userData')
 *  @returns {Database} instancia de better-sqlite3
 */
function initDatabase(userDataPath) {
  if (db) return db;

  // Asegurar que la carpeta exista
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, 'coodetrans.db');
  db = new Database(dbPath);

  // Configuración de rendimiento y consistencia
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Crear esquema si no existe
  const schema = fs.readFileSync(resolveSchemaPath(), 'utf-8');
  db.exec(schema);

  // Migraciones ligeras para bases de datos creadas en versiones previas
  migrar(db);

  // Cargar datos semilla (solo si las tablas están vacías)
  const { runSeed } = require('./seed');
  runSeed(db);

  console.log(`[BD] Base de datos lista en: ${dbPath}`);
  return db;
}

/**
 * Aplica migraciones no destructivas sobre bases de datos existentes.
 * Agrega la columna `estado` a las tablas que la incorporaron en la Fase 2
 * (area, cargo, usuario) si todavía no existe.
 */
function migrar(db) {
  const tieneColumna = (tabla, columna) =>
    db.prepare(`PRAGMA table_info(${tabla})`).all().some((c) => c.name === columna);

  const agregarEstado = (tabla) => {
    if (!tieneColumna(tabla, 'estado')) {
      db.exec(`ALTER TABLE ${tabla} ADD COLUMN estado TEXT NOT NULL DEFAULT 'Activo'`);
      console.log(`[BD] Migración: columna 'estado' agregada a ${tabla}.`);
    }
  };

  ['area', 'cargo', 'usuario'].forEach(agregarEstado);
}

/** Devuelve la ruta absoluta del archivo de base de datos activo. */
function getDbPath() {
  return db ? db.name : null;
}

/**
 * Devuelve la instancia activa de la base de datos.
 * Lanza un error si initDatabase no ha sido llamado.
 */
function getDb() {
  if (!db) {
    throw new Error('La base de datos no ha sido inicializada. Llame a initDatabase() primero.');
  }
  return db;
}

/** Cierra la conexión de forma segura. */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { initDatabase, getDb, getDbPath, closeDatabase };
