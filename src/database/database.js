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
let storedDbPath = null;

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
  storedDbPath = dbPath;
  db = new Database(dbPath);

  // Configuración de rendimiento y consistencia
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('temp_store = MEMORY');

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
 * Aplica migraciones NO destructivas sobre bases de datos existentes para
 * preservar los datos del usuario entre actualizaciones de la aplicación.
 *
 * Migraciones aplicadas:
 *   - Columna `estado` en area/cargo/usuario (Fase 2).
 *   - Columnas `ubicacion_fisica` (texto libre) y `fk_id_area` en empleado (v1.0.0).
 *   - Relajación de NOT NULL en usuario.fk_id_empleado (usuario sin empleado).
 *   - Relajación de NOT NULL en empleado.fk_id_ubicacion (ubicación como texto).
 * La tabla `rol` se crea automáticamente vía schema.sql (CREATE TABLE IF NOT EXISTS).
 */
function migrar(db) {
  const columnas = (tabla) => db.prepare(`PRAGMA table_info(${tabla})`).all();
  const tieneColumna = (tabla, columna) => columnas(tabla).some((c) => c.name === columna);
  const esNotNull = (tabla, columna) => {
    const c = columnas(tabla).find((x) => x.name === columna);
    return c ? c.notnull === 1 : false;
  };

  // 1) Columna 'estado' en tablas de la Fase 2
  ['area', 'cargo', 'usuario'].forEach((tabla) => {
    if (!tieneColumna(tabla, 'estado')) {
      db.exec(`ALTER TABLE ${tabla} ADD COLUMN estado TEXT NOT NULL DEFAULT 'Activo'`);
      console.log(`[BD] Migración: columna 'estado' agregada a ${tabla}.`);
    }
  });

  // 2) Nuevas columnas en empleado (v1.0.0)
  if (!tieneColumna('empleado', 'ubicacion_fisica')) {
    db.exec('ALTER TABLE empleado ADD COLUMN ubicacion_fisica TEXT');
    // Copiar el texto desde la antigua tabla ubicacion_fisica cuando exista vínculo
    try {
      db.exec(`
        UPDATE empleado SET ubicacion_fisica = (
          SELECT uf.ubicacion_fisica FROM ubicacion_fisica uf
          WHERE uf.id_ubicacion = empleado.fk_id_ubicacion
        ) WHERE fk_id_ubicacion IS NOT NULL`);
    } catch (_) { /* ignorar si la tabla aún no existe */ }
    console.log("[BD] Migración: columna 'ubicacion_fisica' agregada a empleado.");
  }
  if (!tieneColumna('empleado', 'fk_id_area')) {
    db.exec('ALTER TABLE empleado ADD COLUMN fk_id_area INTEGER');
    // Derivar el área desde el cargo cuando exista
    try {
      db.exec(`
        UPDATE empleado SET fk_id_area = (
          SELECT c.fk_id_area FROM cargo c WHERE c.id_cargo = empleado.fk_id_cargo
        ) WHERE fk_id_cargo IS NOT NULL`);
    } catch (_) { /* ignorar */ }
    console.log("[BD] Migración: columna 'fk_id_area' agregada a empleado.");
  }

  // 3) Relajar NOT NULL en usuario.fk_id_empleado (reconstrucción de tabla)
  if (esNotNull('usuario', 'fk_id_empleado')) {
    db.pragma('foreign_keys = OFF');
    db.transaction(() => {
      db.exec('ALTER TABLE usuario RENAME TO _usuario_old');
      db.exec(`
        CREATE TABLE usuario (
          id_usuario        INTEGER PRIMARY KEY AUTOINCREMENT,
          username          TEXT NOT NULL UNIQUE,
          rol               TEXT NOT NULL,
          password          TEXT NOT NULL,
          estado            TEXT NOT NULL DEFAULT 'Activo',
          intentos_fallidos INTEGER NOT NULL DEFAULT 0,
          ultimo_acceso     TEXT,
          fk_id_empleado    INTEGER,
          createdAt         TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          updatedAt         TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          FOREIGN KEY (fk_id_empleado) REFERENCES empleado (id_empleado)
            ON DELETE SET NULL ON UPDATE CASCADE
        )`);
      db.exec(`
        INSERT INTO usuario (id_usuario, username, rol, password, estado,
          intentos_fallidos, ultimo_acceso, fk_id_empleado, createdAt, updatedAt)
        SELECT id_usuario, username, rol, password, COALESCE(estado,'Activo'),
          COALESCE(intentos_fallidos,0), ultimo_acceso, fk_id_empleado,
          COALESCE(createdAt, datetime('now','localtime')),
          COALESCE(updatedAt, datetime('now','localtime'))
        FROM _usuario_old`);
      db.exec('DROP TABLE _usuario_old');
    })();
    db.pragma('foreign_keys = ON');
    console.log('[BD] Migración: usuario.fk_id_empleado ahora admite NULL.');
  }

  // 4) Relajar NOT NULL en empleado.fk_id_ubicacion (reconstrucción de tabla)
  if (esNotNull('empleado', 'fk_id_ubicacion')) {
    db.pragma('foreign_keys = OFF');
    db.transaction(() => {
      db.exec('ALTER TABLE empleado RENAME TO _empleado_old');
      db.exec(`
        CREATE TABLE empleado (
          id_empleado      INTEGER PRIMARY KEY AUTOINCREMENT,
          cedula           TEXT NOT NULL UNIQUE,
          nombre_completo  TEXT NOT NULL,
          genero           TEXT,
          fecha_ingreso    TEXT,
          fecha_retiro     TEXT,
          estado           TEXT NOT NULL CHECK (estado IN ('Activo', 'Retirado')),
          observaciones    TEXT,
          ubicacion_fisica TEXT,
          fk_id_area       INTEGER,
          fk_id_cargo      INTEGER,
          fk_id_ubicacion  INTEGER,
          fk_id_talla      INTEGER,
          createdAt        TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          updatedAt        TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          FOREIGN KEY (fk_id_area)      REFERENCES area (id_area)              ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY (fk_id_cargo)     REFERENCES cargo (id_cargo)            ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY (fk_id_ubicacion) REFERENCES ubicacion_fisica (id_ubicacion) ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY (fk_id_talla)     REFERENCES talla (id_talla)            ON DELETE SET NULL ON UPDATE CASCADE
        )`);
      db.exec(`
        INSERT INTO empleado (id_empleado, cedula, nombre_completo, genero,
          fecha_ingreso, fecha_retiro, estado, observaciones, ubicacion_fisica,
          fk_id_area, fk_id_cargo, fk_id_ubicacion, fk_id_talla, createdAt, updatedAt)
        SELECT id_empleado, cedula, nombre_completo, genero, fecha_ingreso,
          fecha_retiro, estado, observaciones, ubicacion_fisica, fk_id_area,
          fk_id_cargo, fk_id_ubicacion, fk_id_talla,
          COALESCE(createdAt, datetime('now','localtime')),
          COALESCE(updatedAt, datetime('now','localtime'))
        FROM _empleado_old`);
      db.exec('DROP TABLE _empleado_old');
    })();
    db.pragma('foreign_keys = ON');
    console.log('[BD] Migración: empleado.fk_id_ubicacion ahora admite NULL.');
  }

  // 5) Índices para consultas frecuentes sobre empleados
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_empleado_estado ON empleado(estado);
    CREATE INDEX IF NOT EXISTS idx_empleado_fk_area ON empleado(fk_id_area);
    CREATE INDEX IF NOT EXISTS idx_empleado_nombre ON empleado(nombre_completo);
    CREATE INDEX IF NOT EXISTS idx_empleado_cedula ON empleado(cedula);
  `);
}

/**
 * Cierra la conexión y elimina archivos WAL/SHM antes de copiar o restaurar
 * la base de datos. Evita corrupción y pantallas en blanco tras reinicio.
 */
function prepareForFileOperation() {
  const dbPath = db ? db.name : storedDbPath;
  if (db) {
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (_) { /* ignorar si ya está cerrada */ }
    db.close();
    db = null;
  }
  if (dbPath) {
    for (const suffix of ['-wal', '-shm']) {
      const sidecar = `${dbPath}${suffix}`;
      if (fs.existsSync(sidecar)) {
        try { fs.unlinkSync(sidecar); } catch (_) { /* ignorar */ }
      }
    }
  }
  return dbPath;
}

/** Devuelve la ruta absoluta del archivo de base de datos activo. */
function getDbPath() {
  return db ? db.name : storedDbPath;
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
    try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch (_) { /* ignorar */ }
    db.close();
    db = null;
  }
}

module.exports = { initDatabase, getDb, getDbPath, closeDatabase, prepareForFileOperation };
