# 🚛 Coodetrans Gestión

Sistema de escritorio para la administración de carpetas físicas, inventario de dotación, movimientos internos y configuración organizacional de la Cooperativa Coodetrans.

Desarrollado con Electron, React y SQLite, permitiendo operar completamente de forma local sin depender de servicios externos.

---

## ✨ Características principales

### 📂 Control de Carpetas Físicas

- Registro y actualización de empleados.
- Administración de hojas de vida.
- Control de ubicación física de carpetas.
- Importación masiva mediante Excel y CSV.
- Exportación de información.

### 📦 Inventario General

- Gestión completa de dotaciones.
- Control de stock por talla y variante.
- Estados automáticos de inventario.
- Ajustes de existencias.

### 🔄 Historial de Movimientos

- Registro de entregas.
- Descuento automático de inventario.
- Consulta histórica de movimientos.
- Trazabilidad completa.

### ⚙️ Configuración

- Gestión de usuarios.
- Roles dinámicos.
- Áreas y cargos.
- Copias de seguridad.
- Restauración de base de datos.

### 🔄 Actualizaciones Automáticas

- Integración con GitHub Releases.
- Descarga automática de nuevas versiones.
- Instalación controlada desde la aplicación.

---

## 🧱 Tecnologías

| Tecnología       | Uso                       |
| ---------------- | ------------------------- |
| Electron         | Aplicación de escritorio  |
| React            | Interfaz de usuario       |
| React Router     | Navegación                |
| Tailwind CSS     | Estilos                   |
| SQLite           | Base de datos local       |
| better-sqlite3   | Acceso a datos            |
| Electron Builder | Empaquetado               |
| Electron Updater | Actualizaciones           |
| XLSX             | Importación y exportación |

---

## 📁 Arquitectura

El proyecto sigue una arquitectura MVC adaptada a Electron.

```
└── 📁src
    └── 📁config
    └── 📁controllers
    └── 📁database
    └── 📁main
    └── 📁models
    └── 📁renderer
    └── 📁repositories
    └── 📁services
```

---

## 🚀 Desarrollo

### Instalar dependencias

```bash
npm install
```

### Recompilar SQLite

```bash
npm run rebuild
```

### Ejecutar en modo desarrollo

```bash
npm run dev
```

---

## 📦 Compilación

### Generar instalador

```bash
npm run build
```

### Generar versión portable

```bash
npm run build:portable
```

### Generar únicamente instalador NSIS

```bash
npm run build:installer
```

Los archivos generados se almacenan en:

```
└── 📁dist
```

---

## 🔄 Actualizaciones

Las actualizaciones se distribuyen mediante GitHub Releases utilizando electron-updater.

Cada nueva versión requiere:

1. Actualizar la versión en package.json.
2. Generar el build.
3. Crear una Release en GitHub.
4. Publicar los archivos generados.

---

## 📖 Documentación

Documentación complementaria:

- CHANGELOG.md
- CONTRIBUTING.md

---

## 👨‍💻 Desarrollo

Proyecto desarrollado por RickLabs para la Cooperativa Coodetrans.

Autor principal:
Julian Ricardo Marcillo Tobar

---

## 📄 Licencia

Este software es privado y de uso exclusivo de Coodetrans.

Consulte el archivo LICENSE para más información.
