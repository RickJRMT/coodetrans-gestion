# Coodetrans — Gestión Documental e Inventario

Aplicación de **escritorio** (Electron + React + SQLite) para la gestión de
hojas de vida físicas, ubicación física de carpetas, inventario de dotación y
movimientos de la cooperativa **Coodetrans**.

Arquitectura **MVC** sobre Electron, con base de datos **SQLite3** local
mediante el driver nativo **better-sqlite3** (sin Prisma).

> Desarrollado por **RickLabs** · Versión **1.0.0**

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Vista (Renderer) | React 18 + React Router + Tailwind CSS + Recharts + lucide-react |
| Controlador (Main) | Electron (Node.js) + IPC seguro (contextBridge) |
| Modelo (Datos) | SQLite3 + better-sqlite3 (consultas nativas preparadas) |
| Importación/Exportación | xlsx (Excel/CSV) |
| Build | Vite (renderer) + electron-builder (empaquetado) |

---

## 📁 Estructura del proyecto (MVC)

```
src/
  main/                Proceso principal de Electron
    main.js            Ventana, ciclo de vida, init BD, placeholder auto-update
    preload.js         Puente seguro (window.api) vía contextBridge
    ipc-handlers.js    Registro de handlers IPC -> controladores
  database/
    schema.sql         Esquema SQLite (portado desde dbEmpresa.sql)
    database.js        Conexión singleton + creación de tablas (userData)
    seed.js            Siembra mínima: 1 usuario predefinido (Programador)
  models/
    models.js          Entidades del dominio y helpers (estado de stock)
  repositories/
    repositories.js    Acceso a datos SQLite (prepared statements)
  controllers/
    controllers.js     Lógica de negocio y validaciones
  services/
    importExportService.js   Lectura/validación/escritura de Excel y CSV
  config/
    app.config.js      Configuración central (usuario predefinido, etc.)
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
~/Library/Application Support en macOS).

> **Instalación completamente vacía:** la aplicación se entrega **sin datos de
> demostración**. No hay empleados, áreas, cargos, inventario ni movimientos
> precargados. La primera ejecución solo crea el **único usuario predefinido**
> para poder iniciar sesión y configurar el sistema desde cero.

### Credencial inicial (único usuario predefinido)

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `Programador` | `Coodetrans2026` | Desarrollador |

> Este usuario tiene rol **Desarrollador** (acceso total). Desde
> **Configuración → Usuarios / Roles** se crean los demás usuarios y roles.
> Se recomienda cambiar la contraseña del usuario predefinido tras el primer
> ingreso. La contraseña por defecto puede personalizarse antes de empaquetar
> mediante la variable de entorno `COODETRANS_DEV_PASSWORD`.

---

## 📦 Empaquetado (producción)

```bash
npm run build        # construye el renderer y genera el instalable
```

El resultado (instalador NSIS en Windows, DMG en macOS, AppImage en
Linux) queda en la carpeta `dist/`. La configuración del empaquetado está en
la sección `build` de `package.json` (electron-builder): identificador de la
app, destinos por plataforma, `asarUnpack` de `better-sqlite3` y `schema.sql`
como recurso extra.

---

## 🧩 Módulos

### 📊 Dashboard
- Tarjetas KPI **compactas** (empleados, stock, alertas, actividad reciente).
- Gráfico de stock por área y panel de actividad del sistema.

### 🗂️ Control de Carpetas Físicas
- Listado de hojas de vida con vista **responsiva** y **esqueletos de carga**.
- Búsqueda por nombre/cédula y filtros por **estado** y **área**.
- Alta y edición de empleados; **Ubicación física** como **campo de texto libre**.
- **Importación masiva** desde **Excel/CSV** con flujo de 3 pasos: seleccionar
  archivo → **previsualizar y validar** (filas válidas e inválidas) → confirmar.
  Soporta dos formatos de plantilla y hace *upsert* por cédula.
- **Exportación** de empleados (**Activos / Retirados / Todos**) a **Excel o CSV**.

### 📦 Inventario General
- Administración completa de **dotaciones** (CRUD de artículos).
- **Variantes por categoría** con selector de talla:
  - **Camisa**: S, M, L, XL
  - **Pantalón**: 28, 30, 32, 34
  - **Zapato**: 37, 38, 39, 40
- Ajuste de stock por variante. **Cantidades siempre enteras**.
- Estado de stock calculado (normal / bajo / crítico).

### 🔄 Historial de Movimientos
- Listado de **entregas de dotación** con filtros por período y empleado.
- Detalle de artículos entregados por entrega.
- Registro de **nueva entrega** con descuento automático de stock por variante.
- **Cantidades enteras** en todos los campos.

### ⚙️ Configuración (pestañas)
- **Usuarios**: CRUD con activación/desactivación (sin borrado). El **empleado
  vinculado es opcional**. El **rol se selecciona dinámicamente** entre los
  roles existentes.
- **Roles**: CRUD de roles dinámicos (nombre + descripción) con
  activación/desactivación.
- **Áreas** y **Cargos**: CRUD con activación/desactivación.
- **Base de datos**: información del archivo, **copia de seguridad** y
  **restauración** (con reinicio automático tras restaurar).
- **Sistema**: información técnica (Versión **1.0.0**, desarrollado por RickLabs).

---

## 🔄 Actualizaciones automáticas vía GitHub Releases (electron-updater)

El proyecto incluye un **placeholder documentado** en `src/main/main.js` para
habilitar actualizaciones automáticas. Pasos para activarlo:

### 1. Instalar la dependencia
```bash
npm install electron-updater
```

### 2. Configurar el repositorio de publicación
Añadir la sección `publish` dentro de `build` en `package.json`:
```json
"build": {
  "publish": [
    {
      "provider": "github",
      "owner": "TU_USUARIO_U_ORGANIZACION_GITHUB",
      "repo": "coodetrans-app",
      "releaseType": "release"
    }
  ]
}
```
- **owner**: usuario u organización de GitHub propietaria del repositorio.
- **repo**: nombre del repositorio (p. ej. `coodetrans-app`).
- electron-builder generará y subirá automáticamente el archivo `latest.yml`
  (Windows), `latest-mac.yml` (macOS) o `latest-linux.yml` (Linux), que el
  actualizador usa para detectar nuevas versiones.

### 3. Publicar una nueva versión
1. Incrementar `"version"` en `package.json` (p. ej. `1.0.1`).
2. Generar un **token de GitHub** (`GH_TOKEN`) con permiso **`repo`**
   (Settings → Developer settings → Personal access tokens).
3. Construir y publicar:
   ```bash
   # Windows (PowerShell)
   $env:GH_TOKEN="ghp_xxxxxxxxxxxx"; npm run build -- --publish always

   # Linux / macOS
   GH_TOKEN=ghp_xxxxxxxxxxxx npm run build -- --publish always
   ```
   electron-builder subirá el instalador firmado y los archivos `*.yml` a una
   **GitHub Release** (con tag `v<versión>`).

### 4. Activar la verificación automática
Descomentar el bloque `autoUpdater` al final de `src/main/main.js`:
```js
const { autoUpdater } = require('electron-updater');
autoUpdater.on('update-downloaded', () => autoUpdater.quitAndInstall());
app.whenReady().then(() => {
  if (!isDev) autoUpdater.checkForUpdatesAndNotify();
});
```
Al iniciarse, la app consultará la URL de releases
`https://github.com/<owner>/<repo>/releases`, descargará la versión más
reciente y la instalará tras reiniciar.

> **Nota:** para repositorios privados, el equipo cliente debe disponer del
> token de acceso configurado; para repositorios públicos no se requiere token
> en el lado del usuario final.

---

## 🗃️ Base de datos y migraciones

- El esquema vive en `src/database/schema.sql` (**fuente de verdad**, portado
  desde `dbEmpresa.sql`).
- La conexión se crea en la carpeta `userData`, por lo que los datos del usuario
  **persisten entre actualizaciones** de la aplicación.
- Las migraciones de columnas (`estado`, etc.) son **no destructivas**: se
  aplican solo si la columna no existe, sin borrar información del usuario.

---

## ✅ Estado del proyecto (v1.0.0)

- [x] Electron + React + Vite + Tailwind, BD SQLite (better-sqlite3) en userData
- [x] Esquema portado a SQLite con migraciones no destructivas
- [x] **Instalación vacía** + un único usuario predefinido (Programador / Desarrollador)
- [x] Login funcional, sidebar colapsable, **Dashboard compacto** con datos reales
- [x] **Control de Carpetas Físicas**: CRUD, ubicación física libre, import/export Excel-CSV
- [x] **Inventario General**: CRUD de dotaciones + variantes por categoría/talla, enteros
- [x] **Historial de Movimientos**: entregas, detalle, registro con descuento de stock
- [x] **Configuración**: usuarios (empleado opcional), **roles dinámicos**, áreas, cargos, BD
- [x] Repositorios, controladores y handlers IPC completos con fallback mock para navegador
- [x] Configuración de instalador (electron-builder) y **placeholder de auto-actualización**

---

© 2026 Coodetrans · Desarrollado por **RickLabs**
