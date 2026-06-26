# Arquitectura de Coodetrans Gestión

## Introducción

Coodetrans Gestión es una aplicación de escritorio desarrollada utilizando Electron, React y SQLite.

La solución implementa una arquitectura MVC adaptada al entorno Electron para mantener una separación clara entre:

* Interfaz de usuario
* Lógica de negocio
* Persistencia de datos

---

## Arquitectura General

```text
Usuario
   │
   ▼
React Renderer
   │
   ▼
Preload (contextBridge)
   │
   ▼
IPC Seguro
   │
   ▼
Electron Main Process
   │
   ▼
Controladores
   │
   ▼
Repositorios
   │
   ▼
SQLite
```

---

## Componentes

### Renderer

Construido con React.

Responsabilidades:

* Mostrar interfaces.
* Validaciones básicas.
* Navegación.
* Consumo de APIs expuestas por preload.

---

### Preload

Puente seguro entre Renderer y Main.

Responsabilidades:

* Exponer únicamente funciones autorizadas.
* Evitar acceso directo a Node.js.

---

### Main Process

Responsable de:

* Gestión de ventanas.
* Base de datos.
* Actualizaciones.
* Operaciones del sistema.

---

### Controllers

Contienen la lógica de negocio.

Ejemplos:

* Crear empleado.
* Registrar entrega.
* Ajustar inventario.

---

### Repositories

Responsables de las consultas SQLite.

Utilizan sentencias preparadas mediante better-sqlite3.

---

### Database

Ubicación:

```text
AppData/
```

Características:

* Persistencia local.
* Sin dependencia de internet.
* Compatible con copias de seguridad.

---

## Seguridad

La aplicación implementa:

* Context Isolation.
* IPC controlado.
* Node Integration deshabilitado.
* Base de datos local aislada.

---

## Actualizaciones

Las actualizaciones se distribuyen mediante GitHub Releases y electron-updater.

El proceso incluye:

* Verificación de nuevas versiones.
* Descarga automática.
* Instalación tras reinicio.
