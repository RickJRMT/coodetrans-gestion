# Contribuir a Coodetrans Gestión

Gracias por contribuir al proyecto.

## Requisitos

* Node.js 20+
* npm 10+
* Git

## Instalación

Clonar repositorio:

git clone <repositorio>

Instalar dependencias:

npm install

Ejecutar entorno de desarrollo:

npm run dev

## Estructura del proyecto

src/
├── controllers/
├── database/
├── main/
├── models/
├── renderer/
├── repositories/
└── services/

## Convenciones

### Versionado

Se utiliza SemVer:

MAJOR.MINOR.PATCH

Ejemplos:

1.0.1 → Correcciones.
1.1.0 → Nuevas funcionalidades.
2.0.0 → Cambios incompatibles.

### Commits

Formato recomendado:

feat: nueva funcionalidad
fix: corrección de error
refactor: reorganización interna
docs: documentación
style: cambios visuales

Ejemplos:

feat: agregar actualizaciones automáticas

fix: corregir importación de Excel

## Pull Requests

Antes de enviar cambios:

* Verificar que el proyecto compile.
* Ejecutar pruebas manuales.
* Actualizar CHANGELOG.md.
* Incrementar versión si corresponde.

## Publicación de versiones

1. Actualizar package.json.
2. Actualizar CHANGELOG.md.
3. Generar build.
4. Crear GitHub Release.
5. Publicar instaladores generados.
