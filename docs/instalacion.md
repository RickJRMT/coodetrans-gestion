# Instalación y Configuración

## Requisitos

### Desarrollo

* Node.js 20+
* npm 10+
* Git

### Producción

* Windows 10 o superior
* Arquitectura x64

---

## Clonar repositorio

```bash
git clone <repositorio>
cd coodetrans-app
```

---

## Instalar dependencias

```bash
npm install
```

---

## Recompilar SQLite

```bash
npm run rebuild
```

---

## Ejecutar proyecto

```bash
npm run dev
```

---

## Generar instalador

```bash
npm run build
```

---

## Generar versión portable

```bash
npm run build:portable
```

---

## Generar instalador NSIS

```bash
npm run build:installer
```

---

## Ubicación de la base de datos

Windows:

```text
%APPDATA%/Coodetrans Gestión
```

La base de datos se crea automáticamente durante la primera ejecución.

---

## Usuario Inicial

Usuario:

```text
Programador
```

Contraseña:

```text
Coodetrans2026
```

Se recomienda cambiar la contraseña después del primer ingreso.
