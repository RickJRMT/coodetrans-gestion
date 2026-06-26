# Base de Datos

## Motor

SQLite 3

Biblioteca utilizada:

```text
better-sqlite3
```

---

## Características

* Local.
* Sin servidor.
* Alta velocidad.
* Bajo consumo de recursos.

---

## Ubicación

La base de datos se almacena dentro de:

```text
userData
```

administrado por Electron.

---

## Esquema

Definido en:

```text
src/database/schema.sql
```

---

## Migraciones

Las migraciones son no destructivas.

Objetivos:

* Conservar información existente.
* Agregar columnas faltantes.
* Mantener compatibilidad entre versiones.

---

## Copias de seguridad

Disponibles desde:

```text
Configuración → Base de Datos
```

Funciones:

* Crear respaldo.
* Restaurar respaldo.

---

## Restauración

Tras restaurar:

1. Se cierra la conexión SQLite.
2. Se recarga la base de datos.
3. Se actualiza la interfaz automáticamente.

---

## Recomendaciones

* Realizar respaldos periódicos.
* No modificar la base manualmente.
* Utilizar únicamente las herramientas del sistema.
