# Coodetrans — Gestión Documental e Inventario

Aplicación de **escritorio** (Electron + React + SQLite) para la gestión de
hojas de vida físicas, ubicaciones de archivo, inventario de dotación y
movimientos de la cooperativa **Coodetrans**.

Arquitectura **MVC** sobre Electron, con base de datos **SQLite3** local
mediante el driver nativo **better-sqlite3** (sin Prisma).

> Desarrollado por **RickLabs** · Edición Local v2.0.0 (Fase 2)

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Vista (Renderer) | React 18 + React Router + Tailwind CSS + Recharts + lucide-react |
| Controlador (Main) | Electron (Node.js) + IPC seguro (contextBridge) |
| Modelo (Datos) | SQLite3 + better-sqlite3 (consultas nativas preparadas) |
| Build | Vite (renderer) + electron-builder (empaquetado) |

---

## 📁 Estructura del proyecto (MVC)

```
src/
  main/                Proceso principal de Electron
    main.js            Ventana, ciclo de vida, init BD
    preload.js         Puente seguro (window.api) vía contextBridge
    ipc-handlers.js    Registro de handlers IPC -> controladores
  database/
    schema.sql         Esquema SQLite (portado desde dbEmpresa.sql)
    database.js        Conexión singleton + creación de tablas (userData)
    seed.js            Datos semilla (áreas, 38 cargos, usuarios, etc.)
  models/
    models.js          Entidades del dominio y helpers (estado de stock)
  repositories/
    repositories.js    Acceso a datos SQLite (prepared statements)
  controllers/
    controllers.js     Lógica de negocio y validaciones
  renderer/            Aplicación React
    components/         Card, Button, Modal, Table, Input, Select, Badge, Placeholder
    layouts/           Layout + Sidebar colapsable
    pages/             Login, Dashboard, Carpetas, Inventario, Movimientos, Configuración
    hooks/             useAuth (contexto de sesión)
    utils/             api.js (IPC con fallback mock), mockData.js
    assets/            coodetransLogo.png
```

---

## 🚀 Puesta en marcha (desarrollo)

```bash
# 1. Instalar dependencias
npm install

# 2. Recompilar better-sqlite3 para el ABI de Electron
npm run rebuild

# 3. Ejecutar en modo desarrollo (Vite + Electron)
npm run dev
```

La base de datos `coodetrans.db` se crea automáticamente en la carpeta
`userData` del sistema (AppData en Windows, ~/.config en Linux,
~/Library/Application Support en macOS) y se rellena con datos semilla la
primera vez.

### Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |
| `pcastillo` | `coodetrans` | Auxiliar |

---

## 📦 Empaquetado (producción)

```bash
npm run build        # construye el renderer y genera el instalable
```

El resultado (instalador NSIS en Windows, DMG en macOS, AppImage/deb en
Linux) queda en la carpeta `dist/`. La configuración del empaquetado está en
la sección `build` de `package.json` (electron-builder): identificador de la
app, destinos por plataforma, `asarUnpack` de `better-sqlite3` y `schema.sql`
como recurso extra.

---

## 🧩 Módulos (Fase 2)

### 🗂️ Carpetas / Ubicaciones
- Listado de hojas de vida con vista **responsiva** (tabla en escritorio,
  tarjetas en móvil) y **esqueletos de carga**.
- Búsqueda por nombre/cédula y filtros por **estado** y **área**.
- Alta y edición de empleados con cascada **Área → Cargo**, tallas de dotación
  (camisa/pantalón/calzado), fechas, ubicación física y observaciones.
- Historial de **dotaciones entregadas** por empleado (agrupado por entrega).

### 📦 Inventario
- Tarjetas de **estado de stock por área** (normal / bajo / crítico).
- Tabla de **stock por variante de talla** con estado calculado por variante.
- Filtros por artículo/variante, área y estado de stock.

### 🔄 Movimientos
- Listado de **entregas de dotación** con filtros por período y empleado.
- Detalle de artículos entregados por entrega.
- Registro de **nueva entrega** (empleado, período, fecha y artículos), con
  descuento automático de stock por variante.

### ⚙️ Configuración (pestañas)
- **Usuarios**: CRUD con activación/desactivación (sin borrado), vinculación a
  empleado y gestión de roles/contraseña.
- **Áreas** y **Cargos**: CRUD con activación/desactivación.
- **Base de datos**: información del archivo, **copia de seguridad** y
  **restauración** (con reinicio automático tras restaurar).
- **Sistema**: información técnica de la aplicación.

---

## 🔄 Actualizaciones automáticas (electron-updater)

El proyecto incluye un **placeholder documentado** en `src/main/main.js` para
habilitar actualizaciones automáticas vía **GitHub Releases**:

1. `npm install electron-updater`
2. Añadir la sección `publish` (provider `github`, `owner`, `repo`) en
   `package.json → build`.
3. Publicar el instalador firmado con `GH_TOKEN=xxxx npm run build`.
4. Descomentar el bloque `autoUpdater` en `main.js` para verificar e instalar
   actualizaciones al iniciar la aplicación.

---

## ✅ Estado del proyecto

### Fase 1
- [x] Electron + React + Vite + Tailwind, BD SQLite (better-sqlite3) en userData
- [x] Esquema portado a SQLite + datos semilla (3 áreas, 38 cargos, empleados, inventario)
- [x] Login funcional, sidebar colapsable, Dashboard con datos reales

### Fase 2
- [x] Repositorios y controladores completos (empleados, inventario, entregas, usuarios, áreas, cargos)
- [x] Handlers IPC y API (`window.api`) ampliados, con fallback simulado para navegador
- [x] **Carpetas** completas (CRUD, historial, filtros, responsivo, esqueletos)
- [x] **Inventario** (stock por área + variantes con filtros)
- [x] **Movimientos** (entregas, detalle y registro con descuento de stock)
- [x] **Configuración** (usuarios, áreas, cargos, copia/restauración de BD, sistema)
- [x] Migración no destructiva de columnas `estado` (área/cargo/usuario)
- [x] Configuración de instalador (electron-builder) y placeholder de auto-actualización

---

© 2026 Coodetrans · Desarrollado por **RickLabs**
