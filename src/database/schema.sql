-- ============================================================
-- ESQUEMA SQLite — BASE DE DATOS COODETRANS
-- Portado desde dbEmpresa.sql (MySQL) a SQLite (better-sqlite3)
-- Conversiones aplicadas:
--   INT AUTO_INCREMENT  -> INTEGER PRIMARY KEY AUTOINCREMENT
--   VARCHAR(n) / TEXT   -> TEXT
--   DATETIME            -> TEXT (ISO 8601)
--   ENGINE / CHARSET    -> eliminados (no aplican en SQLite)
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- MÓDULO ESTRUCTURA ORGANIZACIONAL
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS area (
    id_area     INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_area    TEXT NOT NULL,
    estado      TEXT NOT NULL DEFAULT 'Activo',   -- 'Activo' | 'Inactivo'
    createdAt   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updatedAt   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS cargo (
    id_cargo    INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_cargo   TEXT NOT NULL,
    estado      TEXT NOT NULL DEFAULT 'Activo',   -- 'Activo' | 'Inactivo'
    fk_id_area  INTEGER NOT NULL,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updatedAt   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (fk_id_area) REFERENCES area (id_area)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- MÓDULO LOGÍSTICA DE ARCHIVO Y TALLAS (Catálogo Central)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ubicacion_fisica (
    id_ubicacion        INTEGER PRIMARY KEY AUTOINCREMENT,
    ubicacion_fisica    TEXT NOT NULL,
    createdAt           TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updatedAt           TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS talla (
    id_talla    INTEGER PRIMARY KEY AUTOINCREMENT,
    camisa      TEXT,
    pantalon    TEXT,
    calzado     TEXT,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updatedAt   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ------------------------------------------------------------
-- MÓDULO GESTIÓN DE PERSONAL Y SEGURIDAD
-- ------------------------------------------------------------
-- Tabla de roles DINÁMICOS administrables por el usuario.
CREATE TABLE IF NOT EXISTS rol (
    id_rol      INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    estado      TEXT NOT NULL DEFAULT 'Activo',   -- 'Activo' | 'Inactivo'
    createdAt   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updatedAt   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- NOTA: La ubicación física de la carpeta del empleado se almacena como
-- TEXTO LIBRE en la columna `ubicacion_fisica` (ej: "Archivo Central -
-- Estante A - Nivel 2"). La columna fk_id_ubicacion se conserva como
-- opcional únicamente por compatibilidad histórica y puede ser NULL.
-- El área del empleado se guarda directamente en `fk_id_area` para soportar
-- importaciones donde llega el área pero no el cargo.
CREATE TABLE IF NOT EXISTS empleado (
    id_empleado      INTEGER PRIMARY KEY AUTOINCREMENT,
    cedula           TEXT NOT NULL UNIQUE,
    nombre_completo  TEXT NOT NULL,
    genero           TEXT,
    fecha_ingreso    TEXT,
    fecha_retiro     TEXT,
    estado           TEXT NOT NULL CHECK (estado IN ('Activo', 'Retirado')),
    observaciones    TEXT,
    ubicacion_fisica TEXT,                 -- Texto libre (reemplaza el selector)
    fk_id_area       INTEGER,              -- Área directa (opcional)
    fk_id_cargo      INTEGER,
    fk_id_ubicacion  INTEGER,              -- Opcional / compatibilidad
    fk_id_talla      INTEGER,
    createdAt        TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updatedAt        TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (fk_id_area)      REFERENCES area (id_area)              ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (fk_id_cargo)     REFERENCES cargo (id_cargo)            ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (fk_id_ubicacion) REFERENCES ubicacion_fisica (id_ubicacion) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (fk_id_talla)     REFERENCES talla (id_talla)            ON DELETE SET NULL ON UPDATE CASCADE
);

-- El usuario puede NO estar vinculado a un empleado (fk_id_empleado NULL),
-- por ejemplo el usuario inicial "Programador".
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario        INTEGER PRIMARY KEY AUTOINCREMENT,
    username          TEXT NOT NULL UNIQUE,
    rol               TEXT NOT NULL,
    password          TEXT NOT NULL,
    estado            TEXT NOT NULL DEFAULT 'Activo',   -- 'Activo' | 'Inactivo'
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    ultimo_acceso     TEXT,
    fk_id_empleado    INTEGER,                          -- Opcional (puede ser NULL)
    createdAt         TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updatedAt         TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (fk_id_empleado) REFERENCES empleado (id_empleado)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- MÓDULO INVENTARIO Y MOVIMIENTOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articulo (
    id_articulo  INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_item  TEXT NOT NULL,
    stock_minimo INTEGER NOT NULL DEFAULT 10,
    vencimiento  INTEGER NOT NULL DEFAULT 0,   -- 0 = No, 1 = Sí
    fk_id_area   INTEGER,
    createdAt    TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updatedAt    TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (fk_id_area) REFERENCES area (id_area)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla intermedia: control de stock exacto por variantes de talla
CREATE TABLE IF NOT EXISTS articulo_talla_stock (
    id_stock_variante INTEGER PRIMARY KEY AUTOINCREMENT,
    fk_id_articulo    INTEGER NOT NULL,
    fk_id_talla       INTEGER NOT NULL,
    stock_actual      INTEGER NOT NULL DEFAULT 0,
    createdAt         TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updatedAt         TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE (fk_id_articulo, fk_id_talla),
    FOREIGN KEY (fk_id_articulo) REFERENCES articulo (id_articulo) ON DELETE CASCADE  ON UPDATE CASCADE,
    FOREIGN KEY (fk_id_talla)    REFERENCES talla (id_talla)       ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS entrega_dotacion (
    id_entrega     INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_entrega  TEXT NOT NULL,
    periodo        TEXT NOT NULL CHECK (periodo IN ('Abril', 'Agosto', 'Diciembre')),
    fk_id_empleado INTEGER NOT NULL,
    fk_id_usuario  INTEGER NOT NULL,
    createdAt      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updatedAt      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (fk_id_empleado) REFERENCES empleado (id_empleado) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (fk_id_usuario)  REFERENCES usuario (id_usuario)   ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS detalle_entrega (
    id_detalle           INTEGER PRIMARY KEY AUTOINCREMENT,
    cantidad             INTEGER NOT NULL CHECK (cantidad > 0),
    talla_entregada      TEXT NOT NULL,
    fk_id_entrega        INTEGER NOT NULL,
    fk_id_stock_variante INTEGER NOT NULL,
    createdAt            TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (fk_id_entrega)        REFERENCES entrega_dotacion (id_entrega)        ON DELETE CASCADE  ON UPDATE CASCADE,
    FOREIGN KEY (fk_id_stock_variante) REFERENCES articulo_talla_stock (id_stock_variante) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- MÓDULO AUDITORÍA — Actividad reciente / movimientos del sistema
-- (No existe en el esquema MySQL original; se agrega para el dashboard
--  y el historial global solicitado por la aplicación.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actividad_reciente (
    id_actividad   INTEGER PRIMARY KEY AUTOINCREMENT,
    accion         TEXT NOT NULL,         -- 'creacion','actualizacion','entrega','eliminacion','sistema'
    detalle        TEXT NOT NULL,
    entidad        TEXT,                  -- 'empleado','articulo','entrega', etc.
    fk_id_empleado INTEGER,               -- empleado responsable (opcional)
    fk_id_usuario  INTEGER,               -- usuario del sistema que ejecutó (opcional)
    fecha          TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (fk_id_empleado) REFERENCES empleado (id_empleado) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (fk_id_usuario)  REFERENCES usuario (id_usuario)   ON DELETE SET NULL ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- ÍNDICES DE RENDIMIENTO PARA ACCESO ALFABÉTICO INMEDIATO
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_empleado_nombre ON empleado (nombre_completo);
CREATE INDEX IF NOT EXISTS idx_empleado_estado ON empleado (estado);
CREATE INDEX IF NOT EXISTS idx_empleado_fk_area ON empleado (fk_id_area);
CREATE INDEX IF NOT EXISTS idx_empleado_cedula ON empleado (cedula);
CREATE INDEX IF NOT EXISTS idx_articulo_nombre ON articulo (nombre_item);
CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON actividad_reciente (fecha);
