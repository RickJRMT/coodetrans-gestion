# Changelog

Todos los cambios relevantes de Coodetrans Gestión serán documentados en este archivo.

El formato está basado en Keep a Changelog y sigue Versionado Semántico (SemVer).

---

## [1.1.0] - 2026-06-24

### Agregado

* Integración con GitHub Releases para distribución de versiones.
* Sistema de actualizaciones automáticas mediante electron-updater.
* Detección automática de nuevas versiones al iniciar la aplicación.
* Modal de notificación para versiones disponibles.
* Modal de actualización lista para instalar.
* Obtención automática de versión desde package.json.
* Visualización dinámica de la versión actual en Sidebar.

### Mejorado

* Estructura de actualización preparada para futuros repositorios institucionales.
* Centralización de la versión de la aplicación mediante app.getVersion().
* Optimización de eventos IPC relacionados con actualizaciones.

### Corregido

* Corrección en listeners de update-downloaded.
* Corrección de actualización de versión mostrada en la interfaz.
* Ajustes de integración entre Main Process y Renderer Process.

---

## [1.0.5] - 2026-06-22

### Mejorado

* Optimización de importación de empleados desde Excel.
* Mejora en el análisis de hojas múltiples.
* Compatibilidad ampliada con diferentes estructuras de archivos.

### Corregido

* Detección de encabezados cuando existen títulos o textos previos a la tabla.
* Validación de campos obligatorios para empleados.
* Corrección de errores durante la previsualización de importaciones.

---

## [1.0.4] - 2026-06-19

### Mejorado

* Optimización del módulo de Carpetas Físicas.
* Ajustes visuales en formularios y tablas.
* Mejor distribución de espacios en pantallas principales.

### Corregido

* Problemas de visualización en filtros de búsqueda.
* Inconsistencias en listados de empleados.
* Ajustes en formularios de creación y edición.

---

## [1.0.3] - 2026-06-18

### Mejorado

* Reestructuración interna de componentes React.
* Ajustes de navegación entre módulos.
* Mejor organización de controladores y servicios.

### Corregido

* Problemas relacionados con rutas extensas en Git.
* Errores de compilación detectados durante pruebas.

---

## [1.0.2] - 2026-06-16

### Mejorado

* Refinamiento visual del Dashboard.
* Mejor adaptación de componentes a diferentes resoluciones.
* Ajustes de consistencia visual entre módulos.

### Corregido

* Problemas de alineación de componentes.
* Ajustes de comportamiento en tablas y formularios.

---

## [1.0.1] - 2026-06-11

### Agregado

* Mejoras iniciales de documentación.
* Preparación de estructura para futuras funcionalidades.

### Corregido

* Ajustes menores detectados durante pruebas internas.

---

## [1.0.0] - 2026-06-01

### Lanzamiento Inicial

#### Incluye

* Dashboard.
* Control de Carpetas Físicas.
* Inventario General.
* Historial de Movimientos.
* Configuración de Usuarios.
* Gestión de Roles.
* Base de datos SQLite local.
* Importación y exportación de información.
* Sistema de autenticación.
