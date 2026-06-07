# Validaciones Actuales

Este archivo resume las validaciones reforzadas durante la revisión de la
interfaz migrada. Se enfoca en las validaciones actualmente implementadas en
frontend y backend sobre el modelo vigente del sistema nuevo.

## Bloques

### Frontend

Archivos:

- `frontend/src/app/bloques/create/page.tsx`
- `frontend/src/app/bloques/[id]/edit/page.tsx`

Validaciones implementadas:

- `nombre` obligatorio.
- `nombre` con mínimo de 2 caracteres.
- `nombre` con máximo de 80 caracteres.
- `nombre` se envía con `trim()`.
- `cementerioId` obligatorio en creación.
- `descripcion` con máximo de 200 caracteres.
- `numeroPisos` debe ser entero.
- `numeroPisos` debe ser mayor o igual a 0.
- `numeroPisos` no puede ser mayor a 50.

### Backend

Archivos:

- `backend/src/modules/bloque/dto/bloque.dto.ts`
- `backend/src/modules/bloque/bloque.service.ts`

Validaciones implementadas:

- `nombre` obligatorio real con `trim()`.
- `nombre` mínimo 2 caracteres.
- `nombre` máximo 80 caracteres.
- `descripcion` opcional con `trim()` y máximo 200 caracteres.
- `numeroPisos` entero entre 0 y 50.
- `cementerioId` debe existir.
- `cementerioId` debe pertenecer a un cementerio activo.
- no permite crear dos bloques con el mismo `nombre` dentro del mismo
  cementerio.
- no permite renombrar un bloque a un nombre ya existente dentro del mismo
  cementerio.
- eliminación lógica bloqueada si existen bóvedas activas en el bloque.

## Bovedas

### Frontend

Archivos:

- `frontend/src/app/bovedas/create/page.tsx`
- `frontend/src/app/bovedas/[id]/edit/page.tsx`

Validaciones implementadas:

- `numero` obligatorio.
- `numero` máximo 30 caracteres.
- `numero` se envía con `trim()`.
- `bloqueId` obligatorio.
- `tipo` sólo puede ser `Boveda`, `Nicho` o `Mausoleo`.
- `capacidad` debe ser entero.
- `capacidad` debe ser mayor o igual a 1.
- `capacidad` no puede ser mayor a 20.
- `precio` no puede ser negativo.
- `precioArrendamiento` no puede ser negativo.
- `ubicacion` máximo 150 caracteres.
- `observaciones` máximo 300 caracteres.
- corrección de carga de bloques en edición para respuestas paginadas.

### Backend

Archivos:

- `backend/src/modules/boveda/dto/request/update-boveda.dto.ts`
- `backend/src/modules/boveda/boveda.service.ts`

Validaciones implementadas:

- `numero` obligatorio real con `trim()`.
- `numero` máximo 30 caracteres.
- `tipo` restringido a `Boveda`, `Nicho`, `Mausoleo`.
- `capacidad` entero mínimo 1.
- `precio` mínimo 0.
- `precioArrendamiento` mínimo 0.
- `ubicacion` opcional con `trim()` y máximo 150 caracteres.
- `observaciones` opcional con `trim()` y máximo 300 caracteres.
- `bloqueId` debe existir.
- `bloqueId` debe pertenecer a un bloque activo.
- no permite crear dos bóvedas con el mismo `numero` dentro del mismo bloque.
- no permite actualizar una bóveda a un `numero` ya existente dentro del mismo
  bloque.
- eliminación lógica bloqueada si la bóveda tiene contratos activos.

## Contratos

### Frontend

Archivo:

- `frontend/src/app/contratos/[id]/edit/page.tsx`

Ajustes aplicados:

- corrección de consumo de API paginada para bóvedas y difuntos.
- evita error runtime `*.filter is not a function`.

Nota:

- en esta sesión no se reforzó todavía una capa profunda nueva de validaciones
  de negocio para edición de contratos; se corrigió primero la estabilidad del
  formulario.

## Sidebar / Header

### Sidebar

Archivo:

- `frontend/src/components/Sidebar.tsx`

Ajustes aplicados:

- eliminación de viñetas/puntos visuales del menú lateral.
- corrección de activo doble en `Contratos`:
  - `Nuevo` se activa sólo en `/contratos/create` y descendientes.
  - `Listado` se activa en `/contratos` y rutas de detalle/edición.

### Header

Archivo:

- `frontend/src/components/Header.tsx`

Ajustes aplicados:

- uso de avatar real del template para el usuario.
- eliminación del borde visual no deseado en botones del área superior.

## Dashboard

Archivos:

- `frontend/src/app/page.tsx`
- `frontend/src/app/api/dashboard/route.ts`

Ajustes aplicados:

- reintento de inicialización de gráficos cuando `ApexCharts` carga tarde.
- eliminación de fallback con datos falsos hardcodeados.
- corrección de cálculo de ocupación e ingresos sobre datos reales disponibles.

## Observaciones

- Varias diferencias visuales con el sistema anterior no son sólo validación:
  dependen de datos faltantes o de campos que el modelo nuevo todavía no tiene.
- La base de datos actual verificada durante esta revisión estaba casi vacía en
  tablas de negocio (`Bloque`, `Boveda`, `Contrato`, `Difunto`, `Persona`,
  `Pago`), por lo que muchas pantallas vacías no implican necesariamente fallo
  de validación o de render.
