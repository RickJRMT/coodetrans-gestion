# Changelog - Coodetrans Gestión

Todas las versiones lanzadas del sistema de gestión de dotación de Coodetrans.

---

## [1.0.8] - 2026-06-19

### 🎨 Mejoras

- **Mejora visual y estructural del módulo de Inventarios**
  - Optimización en la identificación de variantes generales y configuración mejorada
  - Ahora las variantes de tipo "General" muestran el nombre descriptivo de la prenda (ej: Chalecos, Gorras, Botas) en lugar de valores técnicos como `ESTÁNDAR`

- **Optimización del helper `variantesLabel()`**
  - Se centralizó la lógica de representación visual de tallas y variantes
  - Mayor claridad visual para el usuario final

### 🔧 Correcciones

- **Corrección en persistencia de tallas generales**
  - Se solucionó el almacenamiento de `nombre_general` al registrar nuevas variantes
  
- **Corrección de consultas SQL**
  - Ajustados los parámetros en búsquedas e inserciones de tallas generales para evitar errores de desajuste

- **Corrección del error: "Too few parameter values were provided"**
  - Se validaron y corrigieron los parámetros de todas las consultas SQL del módulo

### 🏷️ Unificación

- **Etiquetas visuales consistentes**
  - Inventarios, Movimientos, Entregas, Historiales ahora muestran nombres profesionales y consistentes

### 💡 Impacto Técnico

- Mejor compatibilidad con categorías generales
- Mayor claridad visual para el usuario final
- Menor ambigüedad al identificar dotaciones y prendas
- Corrección de integridad en la base de datos para nuevas variantes

### 📋 Recomendación

Para instalaciones previas a esta versión:
- Se recomienda limpiar o migrar registros de la tabla `talla` si fueron creados antes de la implementación de `nombre_general`
- Para asegurar consistencia visual

---

## [1.0.7] - 2026-06-10

### 📦 Optimización del proceso de importación de datos

- Se mejoró el reconocimiento y validación de archivos de importación para garantizar una lectura más confiable de la información
- Ajustes en el procesamiento de registros provenientes de plantillas Excel y CSV, incrementando la compatibilidad con los formatos soportados por el sistema
- Corrección de escenarios donde determinados registros no eran interpretados correctamente durante la carga masiva

### 📤 Correcciones en la exportación de información

- Optimización del proceso de exportación para asegurar que los datos generados correspondan exactamente a la información almacenada en la base de datos
- Mejoras en la consistencia del contenido exportado, evitando diferencias entre la información visualizada y los archivos generados

### 🏷️ Normalización del formato de nombres

- Implementación de un formato uniforme para la presentación de nombres propios dentro de la aplicación
- Estandarización de mayúsculas y minúsculas para mejorar la legibilidad y mantener una presentación consistente en todos los módulos

### 🎨 Mejoras en la interfaz de usuario

- Ajustes en el diseño y distribución de las tablas de los diferentes módulos
- Optimización del espaciado, alineación y visualización de columnas para ofrecer una experiencia de navegación más clara y organizada
- Correcciones visuales orientadas a mantener una apariencia uniforme entre los módulos del sistema

### 🔧 Mejoras generales

- Correcciones menores de funcionamiento interno
- Optimización de procesos relacionados con el manejo de información
- Mejoras de estabilidad y consistencia general del aplicativo

---

## [1.0.6] - 2026-06-01

### 🚀 Mejoras técnicas

- **Mejoras en el sistema de detección de actualizaciones automáticas mediante `electron-updater`**
  - Optimización en la detección confiable y rápida de nuevas versiones disponibles

- **Ajustes en el flujo de comunicación entre el proceso principal (Electron) y la interfaz (React)**
  - Optimización en la velocidad y fiabilidad de los eventos IPC

- **Optimización de los eventos IPC relacionados con la búsqueda y descarga de nuevas versiones**
  - Reducción del tiempo de latencia en las operaciones de actualización
  - Mejora en la estabilidad del proceso de descarga en segundo plano

### 📊 Estado

Esta versión está enfocada en la **validación y optimización del sistema de actualizaciones automáticas**, como preparación para futuras mejoras funcionales del aplicativo.

---

## [1.0.5] - 2026-05-25

### 🚀 Mejoras implementadas

#### 📦 Optimización del proceso de importación de datos
- Se mejoró el reconocimiento y validación de archivos de importación para garantizar una lectura más confiable de la información
- Ajustes en el procesamiento de registros provenientes de plantillas Excel y CSV, incrementando la compatibilidad con los formatos soportados por el sistema
- Corrección de escenarios donde determinados registros no eran interpretados correctamente durante la carga masiva

#### 📤 Correcciones en la exportación de información
- Optimización del proceso de exportación para asegurar que los datos generados correspondan exactamente a la información almacenada en la base de datos
- Mejoras en la consistencia del contenido exportado, evitando diferencias entre la información visualizada y los archivos generados

#### 🏷️ Normalización del formato de nombres
- Implementación de un formato uniforme para la presentación de nombres propios dentro de la aplicación
- Estandarización de mayúsculas y minúsculas para mejorar la legibilidad y mantener una presentación consistente en todos los módulos

#### 🎨 Mejoras en la interfaz de usuario
- Ajustes en el diseño y distribución de las tablas de los diferentes módulos
- Optimización del espaciado, alineación y visualización de columnas para ofrecer una experiencia de navegación más clara y organizada
- Correcciones visuales orientadas a mantener una apariencia uniforme entre los módulos del sistema

#### 🔧 Mejoras generales
- Correcciones menores de funcionamiento interno
- Optimización de procesos relacionados con el manejo de información
- Mejoras de estabilidad y consistencia general del aplicativo

### 📋 Estado

Esta versión continúa fortaleciendo la infraestructura de distribución y actualización automática del aplicativo, preparando el sistema para ofrecer una experiencia de actualización más fluida y confiable en futuras versiones.

---

## [1.0.4] - 2026-05-15

### 🎯 Objetivo de la versión

Versión destinada a pruebas y validación del flujo de actualización automática mediante GitHub Releases y electron-updater.

### 🔄 Cambios realizados

#### Sistema de actualizaciones
- Reincorporación de los modales informativos de actualización
- Validación del evento `update:available` en el proceso principal
- Validación del evento `update:downloaded` en la interfaz React
- Verificación del flujo completo de descarga e instalación de nuevas versiones
- Pruebas de comunicación IPC entre proceso principal (Electron Main) y proceso de renderizado (React)

#### Interfaz de usuario
- Restauración del modal de "Nueva actualización disponible"
- Restauración del modal de "Actualización lista para instalar"
- Ajustes visuales en los indicadores de progreso de descarga

#### Pruebas realizadas
- ✅ Detección automática de nuevas versiones desde GitHub Releases
- ✅ Descarga silenciosa en segundo plano
- ✅ Notificación cuando la actualización está lista para instalar
- ✅ Recepción de eventos en el renderizador mediante preload y contextBridge
- ✅ Verificación del comportamiento al reiniciar la aplicación

### 📋 Notas técnicas

Esta versión se utiliza exclusivamente para verificar el correcto funcionamiento del mecanismo de actualización automática antes de su despliegue en el entorno institucional de Coodetrans.

---

## [1.0.3] - 2026-05-10

### 🎯 Objetivo de la versión

Versión destinada a pruebas internas del sistema de actualización automática mediante GitHub Releases.

### 🔄 Cambios implementados

#### Ajustes en la configuración de electron-updater
- Configuración optimizada para la detección de nuevas versiones

#### Corrección de nombres de instaladores y metadatos de actualización
- Asegurar que los nombres generados sean compatibles con `electron-updater`

#### Validación del archivo `latest.yml`
- Generado correctamente por `electron-builder` con checksums válidos

#### Mejoras menores en la interfaz de usuario
- Ajustes visuales para preparar los componentes de actualización

### 🧪 Pruebas realizadas

- Detección automática de nuevas versiones desde GitHub Releases
- Descarga silenciosa en segundo plano
- Notificación cuando la actualización está lista para instalar

### 📋 Estado

Esta versión contiene la infraestructura fundamental de distribución y actualización automática del aplicativo, preparando el sistema para ofrecer actualizaciones transparentes y seguras al usuario.

---

## [1.0.2] - 2026-05-05

### 🔧 Correcciones

- **Mejoras en el sistema de actualizaciones automáticas**
  - Refinamiento del proceso de detección de nuevas versiones disponibles

- **Corrección del nombre generado para los instaladores**
  - Asegurar consistencia en la nomenclatura de archivos ejecutables

- **Actualización de documentación**
  - Se actualizaron los documentos de referencia del sistema

### ⚙️ Ajustes de configuración

- **Ajustes en la configuración para GitHub Releases**
  - Optimización de los parámetros para publicación automática de versiones

---

## [1.0.1] - 2026-04-28

### 🚀 Características principales

#### Integración a GitHub Release
- Implementación del sistema de publicación automática de versiones mediante GitHub Releases
- Configuración de `electron-builder` para generación de instaladores
- Integración con `electron-updater` para descargas automáticas

#### Correcciones en el módulo de Inventario
- Optimización en la consulta y presentación de variantes de inventario
- Mejoras en la identificación y filtrado de tallas y categorías

#### Optimización de consultas SQLite
- Ajuste de parámetros en búsquedas de inventario
- Mejora en la indexación de tablas para acelerar las consultas

### 📋 Estado

Esta versión establece la base para el sistema de distribución y actualización automática del aplicativo, permitiendo que futuras versiones se descarguen e instalen de manera automática.

---

## [1.0.0] - 2026-04-15

### 🎉 Versión Inicial

Lanzamiento oficial de Coodetrans Gestión - Sistema de gestión de dotación de empleados.

### ✨ Características principales

- **Gestión de Empleados** (CarpetasPage)
  - Registro y búsqueda de empleados
  - Gestión de hojas de vida físicas (carpetas)
  - Filtros por área y cargo

- **Gestión de Inventario** (InventarioPage)
  - Registro de dotaciones con categorías
  - Gestión de variantes por talla (Camisa, Pantalón, Zapato)
  - Control de stock con alertas de bajo stock

- **Movimientos de Dotación** (MovimientosPage)
  - Registro de entregas de equipos
  - Seguimiento de dotación por empleado
  - Filtros por período, área y cargo

- **Gestión de Configuración** (ConfiguracionPage)
  - Administración de usuarios y roles
  - Gestión de áreas y cargos
  - Backup y restauración de base de datos

### 🏗️ Arquitectura

- **Frontend**: React 18 con hooks y componentes funcionales
- **Backend**: Electron con SQLite
- **Componentes reutilizables**: Input, Button, Select, Modal, Table, Badge
- **Gestión de estado**: React hooks (useState, useEffect, useMemo)
- **Estilos**: Tailwind CSS

### 🔐 Seguridad

- Sistema de autenticación basado en usuarios
- Registro de auditoría de acciones (creación, actualización, eliminación)
- Validación de datos en entrada

### 📊 Escalabilidad

- Tablas virtualizadas para manejo de grandes volúmenes de datos
- Índices en base de datos para optimizar consultas
- Arquitectura preparada para 100,000+ registros

---

## Notas sobre versionado

El versionado sigue el esquema [Semantic Versioning](https://semver.org/):
- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Nuevas funcionalidades compatibles con versiones anteriores
- **PATCH**: Correcciones de bugs

Cada versión es identificada por su tag en GitHub y disponible mediante el sistema de actualización automática.
