# Sistema de Actualizaciones

## Descripción

Coodetrans Gestión utiliza electron-updater para distribuir nuevas versiones.

Las actualizaciones se publican mediante GitHub Releases.

---

## Flujo de actualización

### 1. Incrementar versión

Editar:

```json
{
  "version": "1.0.1"
}
```

---

### 2. Construir aplicación

```bash
npm run build
```

---

### 3. Crear Release

Crear una nueva Release en GitHub.

Ejemplo:

```text
v1.0.1
```

---

### 4. Adjuntar archivos

Subir:

```text
latest.yml
.exe
.exe.blockmap
```

---

### 5. Publicar

Publicar la Release.

---

## Comportamiento del cliente

Al iniciar:

1. Consulta GitHub.
2. Detecta nueva versión.
3. Descarga automáticamente.
4. Notifica al usuario.
5. Instala al reiniciar.

---

## Datos del usuario

Las actualizaciones NO eliminan:

* Empleados.
* Inventario.
* Configuración.
* Usuarios.
* Base de datos SQLite.

Los datos permanecen en AppData.

---

## Compatibilidad

Versiones soportadas:

* Windows x64

---

## Solución de problemas

### No detecta actualizaciones

Verificar:

* Repositorio configurado.
* Release publicada.
* latest.yml presente.

### Error al descargar

Verificar:

* Conexión a internet.
* Permisos de GitHub.
* Configuración del repositorio.
