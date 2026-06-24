/**
 * seed.js
 * ------------------------------------------------------------------
 * Inicialización mínima de la base de datos Coodetrans (v1.0.0).
 *
 * IMPORTANTE: La aplicación se instala COMPLETAMENTE VACÍA.
 *   - NO se crean empleados, inventario, áreas, cargos ni movimientos.
 *   - Solo se crean los ROLES iniciales y el ÚNICO usuario predefinido:
 *       username: "Programador" · rol: "Desarrollador" · empleado: NULL
 *   - La contraseña se toma de src/config/app.config.js (o de la variable
 *     de entorno COODETRANS_DEV_PASSWORD).
 *
 * Los registros solo se insertan si las tablas correspondientes están vacías,
 * de modo que nunca se sobrescriban datos del usuario en arranques posteriores.
 *
 * NOTA DE SEGURIDAD:
 *   Las contraseñas se almacenan con un hash SHA-256 con prefijo. En una fase
 *   posterior puede reemplazarse por BCrypt sin afectar el resto del sistema.
 */

const crypto = require('crypto');
const { USUARIO_INICIAL, ROLES_INICIALES, getPasswordUsuarioInicial } = require('../config/app.config');

// Hash simple SHA-256 (placeholder).
function hashPassword(plain) {
  return 'sha256$' + crypto.createHash('sha256').update(plain).digest('hex');
}

function runSeed(db) {
  const insertIfEmpty = (table, fn) => {
    const count = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
    if (count === 0) fn();
  };

  const tx = db.transaction(() => {
    // Roles iniciales (administrables luego desde Configuración)
    insertIfEmpty('rol', () => {
      const stmt = db.prepare('INSERT INTO rol (nombre, descripcion) VALUES (?, ?)');
      ROLES_INICIALES.forEach((r) => stmt.run(r.nombre, r.descripcion || null));
    });

    // Único usuario inicial: Programador / Desarrollador / empleado NULL
    insertIfEmpty('usuario', () => {
      db.prepare(`
        INSERT INTO usuario (username, rol, password, estado, fk_id_empleado)
        VALUES (?, ?, ?, ?, ?)`)
        .run(
          USUARIO_INICIAL.username,
          USUARIO_INICIAL.rol,
          hashPassword(getPasswordUsuarioInicial()),
          USUARIO_INICIAL.estado,
          USUARIO_INICIAL.fk_id_empleado, // NULL
        );
      console.log(`[BD] Usuario inicial "${USUARIO_INICIAL.username}" creado.`);
    });
  });

  tx();
  console.log('[BD] Inicialización mínima verificada (instalación limpia).');
}

module.exports = { runSeed, hashPassword };
