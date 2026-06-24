# Informe de Correcciones v2 — Integridad de Datos

**Fecha:** 18 de junio de 2026  
**Proyecto:** Coodetrans Gestión  
**Contexto:** Pruebas funcionales con evidencia visual (columna Cédula mostrando 1, 2, 3…)

---

## Resumen ejecutivo

Se identificó una **causa raíz común** que explicaba la mayoría de las inconsistencias reportadas: la importación mapeaba la columna **"ID"** (consecutivo interno del Excel) como si fuera la **cédula del empleado**. Esto provocaba:

1. Visualización de 1, 2, 3… en la columna Cédula (como en la captura adjunta).
2. **Sobrescritura masiva** de registros al importar (upsert por cédula con valores 1, 2, 3…).
3. Empleados que "desaparecían" al importar otra área o estado.
4. Dashboard con conteos incorrectos.
5. Exportaciones incompletas (solo los últimos registros sobrescritos).

Adicionalmente se corrigió la importación multi-hoja y la restauración de BD en modo `npm run dev`.

---

## Problemas, causas raíz y correcciones

### 1. Importación Excel multi-hoja incompleta

| Aspecto | Antes | Después |
|---------|-------|---------|
| Recorrido de hojas | Solo hojas pre-filtradas como "válidas" | **Todas** las hojas del archivo (`wb.SheetNames`) |
| Consolidación | Deduplicación sin trazabilidad | Resumen por hoja: encontrados, válidos, omitidos |
| Errores silenciosos | Hojas con `ok: false` ignoradas | Cada hoja reportada en `detalleHojas` |

**Causa raíz:** El flujo "Importar todas" dependía de `listarHojasValidas()` y solo agregaba hojas con `res.ok === true`, omitiendo hojas procesables con advertencias.

**Corrección:** Nueva función `parsearTodasLasHojas()` que recorre cada worksheet, consolida registros y devuelve `resumenMultiHoja` con métricas detalladas.

---

### 2. Tabla muestra 1, 2, 3… en lugar de cédula

**Evidencia:** La captura muestra la columna **CÉDULA** con valores 1, 2, 3, 4, 5, 6, 7.

**Causa raíz:** En `detectarColumnas()`, el encabezado `'id'` estaba mapeado a la columna de código/cédula. Los archivos Excel con columna **ID** (consecutivo) importaban 1, 2, 3… como cédula real en la base de datos.

**Corrección:**
- Eliminado mapeo de `'id'`, `'no'`, `'#'`, `'consecutivo'`, etc.
- Detección inteligente con puntuación por nombre de encabezado **y** contenido de datos.
- Preferencia explícita por columnas `Codigo`, `Cédula`, `Documento`.
- Validación `esCedulaValida()`: rechaza cédulas ≤3 dígitos o consecutivos (1, 2, 3…).

**Nota importante:** Los registros ya importados con cédulas incorrectas (1, 2, 3…) **permanecen en la BD actual**. Se recomienda **restaurar un backup previo** o **reimportar** los archivos Excel originales tras esta corrección.

---

### 3. Empleados desaparecen / Dashboard incorrecto / Exportación incompleta

**Causa raíz (cadena de efectos):**

```
Excel columna ID → cédula "1", "2", "3"…
        ↓
Upsert por cédula → cada importación SOBRESCRIBE los mismos 7 registros
        ↓
Importar retirados → cambia estado de los mismos registros a "Retirado"
        ↓
Listado activos disminuye · Dashboard muestra conteos erróneos · Export solo muestra última área
```

**Correcciones:**
- Detección correcta de columna de documento (punto 2).
- Validación de cédula en importación con registro de omitidos.
- Consulta Dashboard `contarActivosPorArea()` reescrita: cuenta desde `empleado` (no desde catálogo `area`).
- Exportación: JOIN optimizado, orden por área y nombre, sin filtros ocultos.

---

### 4. Restauración de BD — pantalla en blanco en `npm run dev`

**Causa raíz:** `app.relaunch()` + `app.exit(0)` reiniciaba **solo Electron**, no el servidor Vite. El nuevo proceso perdía `NODE_ENV=development` e intentaba cargar `dist-renderer/index.html` (inexistente o vacío en dev) → **pantalla blanca**.

**Corrección:**
- **Modo desarrollo:** Restauración suave — cierra BD, copia archivo, `initDatabase()`, `webContents.reload()` sin matar Vite.
- **Modo producción:** Reinicio completo con argumento `--relaunch-dev` y reintentos de carga a `localhost:5173`.
- Nueva función `reiniciarTrasRestauracionBD()` en `main.js`.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/services/importExportService.js` | Detección cédula, multi-hoja, resumen, validación |
| `src/repositories/repositories.js` | `contarActivosPorArea()` corregido |
| `src/main/main.js` | Recarga suave post-restore, reintentos Vite |
| `src/main/ipc-handlers.js` | Usa `reiniciarTrasRestauracionBD()` |
| `src/renderer/pages/CarpetasPage.jsx` | UI resumen multi-hoja e importación |
| `src/renderer/pages/ConfiguracionPage.jsx` | Mensaje de restauración actualizado |
| `scripts/test-import-export.js` | 14 pruebas automatizadas |

---

## Evidencia de pruebas

```
npm run test:import

✓ Columna Codigo se elige sobre ID
✓ Cédula real importada, no ID interno
✓ Cédula "1" y "123" rechazadas
✓ Importación multi-hoja: 3 hojas, 5 registros
✓ Encabezados desplazados detectados
✓ Formato visual 1.234.567.890

Resultado: 14/14 OK
```

---

## Antes vs después

| Escenario | Antes | Después |
|-----------|-------|---------|
| Excel con columna ID + Codigo | Cédula = 1, 2, 3… | Cédula = documento real |
| Importar 3 hojas (5 empleados) | Solo algunos registros | 5 registros consolidados con resumen |
| Importar retirados tras activos | Activos desaparecen | Cada empleado conserva su cédula única |
| Dashboard empleados activos | Conteo erróneo | Conteo desde tabla empleado |
| Exportar retirados | Solo 1 área (7 registros) | Todos los que cumplan filtro en BD |
| Restaurar BD en `npm run dev` | Pantalla blanca | Recarga suave, UI operativa |

---

## Acción recomendada para el cliente

1. **Restaurar** un backup de BD anterior a las importaciones erróneas, **o**
2. **Eliminar** empleados con cédulas inválidas (1–7) desde la app y **reimportar** los Excel originales.

Tras reimportar con la versión corregida, la columna Cédula mostrará documentos reales con formato `1.234.567.890`.

---

© 2026 RickLabs
