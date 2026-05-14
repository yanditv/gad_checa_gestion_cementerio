# Plan de Migración — ASP.NET MVC → NestJS + Next.js + PostgreSQL

Este plan parte del estado actual descrito en `MIGRATION_STATUS.md` y enumera
las fases concretas hasta cerrar la paridad funcional con el sistema legado
(`../gad_checa_gestion_cementerio/`).

> Lectura recomendada antes de comenzar: `REQUIREMENTS.md`, `ARCHITECTURE.md`,
> `DESIGN.md` y `CLAUDE.md`.

---

## 0. Inventario del sistema legado

Cifras del repositorio original que ayudan a estimar el esfuerzo restante:

| Categoría | Cantidad |
|-----------|---------:|
| Controladores MVC (raíz) | 16 |
| Controladores área `Admin` | 2 |
| Generadores PDF (`Controllers/Pdf/`) | 5 |
| Modelos de dominio | 21 |
| Vistas Razor (`.cshtml`) | 88 |
| Servicios de dominio | 4 (`ContratoService`, `PdfService`, `EmailSender`, `CatastroMigrationService`) |
| LOC controlador más grande | 2 327 (`ContratosController.cs`) |
| LOC servicio más grande | 681 (`CatastroMigrationService.cs`) |

---

## 1. Análisis de brechas (snapshot)

### 1.1 Brechas de esquema (Prisma) — **resueltas**

Cerradas el 2026-05-13 mediante la migración
`prisma/migrations/20260513172915_completar_modelo_legado/migration.sql`
y el `schema.prisma` recreado. Ver detalle en `REQUIREMENTS.md` §2.2 y
`MIGRATION_STATUS.md`.

Resumen:

- `Cementerio` ahora incluye: `abreviaturaTituloPresidente`, `presidente`,
  `vecesRenovacionNicho`, `vecesRenovacionBovedas`, `aniosArriendoNicho`,
  `aniosArriendoBovedas`, `tarifaArriendo`, `tarifaArriendoNicho`,
  `entidadFinanciera`, `nombreEntidadFinanciera`, `numeroCuenta`,
  `tasaMoraDiaria`, `fechaActualizacion`, `fechaEliminacion`.
- `Contrato` incluye: `descuentoId` (FK), `montoSubtotal`, `montoDescuento`,
  `fechaEliminacion`.
- `Pago` incluye: `descuentoId` (FK), `montoSubtotal`, `montoDescuento`,
  `fechaCreacion`, `fechaActualizacion`, `fechaEliminacion`, auditoría
  completa (creador, actualizador, eliminador).
- Tablas nuevas: **`Notificacion`** y **`Documento`** creadas.
- `Persona` y `Difunto` con campos opcionales del manual de usuario y
  auditoría completa en `Persona`.
- `GADInformacion` con `logoUrl`, `website`, `mision`, `vision` + auditoría.
- `Banco.fechaCreacion`, `Usuario.mustChangePassword` añadidos.

### 1.2 Brechas de backend (módulos Nest)

Endpoints inexistentes o stub, agrupados por módulo:

| Módulo | Endpoints faltantes |
|--------|---------------------|
| `auth` | `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password`, `POST /auth/logout`. |
| `contrato` | `POST /:id/renovar`, `POST /:id/relacionar`, `DELETE /:id/relacionar`, `GET /:id/contratos-en-boveda`, `POST /:id/documento-firmado` (upload), `GET /:id/pdf` (oficial), `GET /:id/recibo-pdf`. |
| `cuota` / `pago` | `POST /pagos/cobrar` (multi-cuota), `POST /pagos/:id/anular`, `GET /pagos/:id/factura.pdf`. |
| `boveda` | `PATCH /:id/propietario`, `GET /:id/historial`. |
| `cementerio` | `GET /` (configuración actual), `PUT /` (actualizar), `GET /gad-informacion`, `PUT /gad-informacion`. |
| `descuento` | módulo completo. |
| `banco` | módulo completo. |
| `notificacion` | módulo completo. |
| `reporte` | `GET /reportes/ingresos`, `GET /reportes/cuentas-por-cobrar`, `GET /reportes/bovedas`, sus respectivas variantes `.pdf` y `.xlsx`. |
| `usuario` / `rol` | `GET /usuarios/:id/roles`, `POST /usuarios/:id/roles`, `DELETE /usuarios/:id/roles/:rolId`, `POST /usuarios/:id/reset-password`. |
| `catastro` | `POST /catastro/import` (upload), `GET /catastro/last-import` (estado). |
| `health` | `GET /health` (mejorar con checks reales). |

### 1.3 Brechas de frontend (rutas Next.js)

Rutas ausentes o sólo en stub:

- `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`.
- `/configuracion` (página existe pero no edita `Cementerio` ni `GADInformacion`).
- `/configuracion/descuentos`, `/configuracion/bancos`.
- `/admin/usuarios/[id]/edit`, `/admin/usuarios/[id]/reset-password`,
  `/admin/roles/[id]/edit`, `/admin/roles/[id]/usuarios`.
- `/bloques/[id]/edit`, `/bovedas/[id]/edit` (este último existe pero sin
  cambio de propietario).
- `/cobros/[contratoId]/cobrar` (pantalla específica de cobro multi-cuota).
- `/contratos/[id]/renovar`, `/contratos/[id]/relacionar`.
- `/contratos/[id]/documentos` (sube PDF firmado).
- `/reportes/bovedas`.
- `/notify` (lista completa).
- `/propietario/[id]` (detalle, edición del propietario).

---

## 2. Fases del plan

Cada fase tiene un **entregable verificable**. Las fases pueden solaparse, pero
**ninguna fase posterior puede iniciar sin que la anterior tenga su entregable
funcionando en `master`**.

### Fase 0 — Estabilización del esquema

**Entregable:** una nueva migración Prisma `*_completar_modelo_legado` que
añade las brechas descritas en §1.1 y un `seed-dev.ts` actualizado.

Tareas:

1. Editar `backend/prisma/schema.prisma` (archivo a recrear: hoy `D` en git).
2. Añadir campos al modelo `Cementerio` y backfill con los valores semilla
   (`tarifaArriendo=240.00`, `vecesRenovacionBovedas=1`, etc., tomados de
   `Program.cs:461-481`).
3. Crear tabla `Notificacion` (`id`, `usuarioId`, `tipo`, `mensaje`,
   `entidadTipo`, `entidadId`, `leida`, `fechaCreacion`).
4. Crear tabla `Documento` para documentos firmados (`id`, `contratoId`,
   `path`, `mimeType`, `nombreOriginal`, `tamanioBytes`, `subidoPorId`,
   `fechaCreacion`).
5. Añadir `descuentoId` opcional a `Contrato` y `Pago`.
6. Añadir campos opcionales del manual a `Persona` y `Difunto`.
7. Generar migración: `bun prisma migrate dev --name completar_modelo_legado`.
8. Actualizar `seed.service.ts` para llenar los nuevos campos del cementerio
   con los mismos valores del legado.
9. Verificar que `catastro-import.service.ts` siga importando sin errores.

**Definition of done:**

- `bun prisma migrate dev` aplica sin errores en una base limpia.
- `bun run start:dev` ejecuta el seed y termina con cementerio configurado.
- `GET /cementerio` devuelve los campos nuevos con valores semilla.

### Fase 1 — Autenticación completa

**Entregable:** flujo de login/logout/recuperación de contraseña operativo, con
guardia global de rutas en el frontend.

Tareas:

1. **Backend:**
   - `POST /auth/login` ya existe; añadir `POST /auth/logout` (invalidación
     opcional vía blacklist en memoria), `POST /auth/forgot-password`,
     `POST /auth/reset-password`, `POST /auth/change-password`.
   - Crear `EmailService` (`nodemailer`) configurable por env (`SMTP_HOST`,
     `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
   - Implementar `RolesGuard` global y decorador `@Roles(...)`.
2. **Frontend:**
   - Crear `/app/auth/login`, `/auth/forgot-password`, `/auth/reset-password`.
   - Middleware `middleware.ts` que valide JWT y redirija a `/auth/login`.
   - Persistir token en cookie httpOnly (vía API route Next).
   - Adaptar `Header.tsx` para mostrar el nombre del usuario autenticado y
     ejecutar `logout` real (hoy es texto estático).
3. Documentar variables de entorno nuevas en `README.md`.

**Definition of done:**

- Acceder a cualquier ruta sin token → redirección a `/auth/login`.
- Login con `admin@teobu.com` / `Admin123!` → entra al dashboard.
- Email de recuperación llega en entorno con SMTP de prueba (MailHog).
- `/cuenta` permite cambiar contraseña.

### Fase 2 — Contratos: paridad completa

Es la fase más larga porque el controlador legado tiene **39 acciones**.

**Entregable:** módulo `/contratos` con paridad funcional 100 % (lista,
detalle, creación multi-paso, edición, eliminación lógica, renovación,
relacionar, subir documento, generar PDF, imprimir recibo).

Sub-fases:

- **2.a — Listado y detalle**
  - Filtros completos (`activos`, `porvencer`, `vencidos`, `inactivos`).
  - Búsqueda multi-palabra (AND por palabra como el legado).
  - Detalle con tabs: Datos, Difunto, Bóveda, Responsables, Cuotas, Pagos,
    Documentos, Contratos relacionados, Histórico.
- **2.b — Wizard de creación**
  - Persistir estado en `localStorage` con TTL 4 h (alternativa al `Session`
    del legado).
  - Migrar los 5 pasos del wizard manteniendo navegación adelante/atrás sin
    perder datos.
  - Asignación automática de número secuencial `YYYY-NNNN` (transacción
    Prisma con bloqueo optimista o secuencia por año).
  - Cálculo de cuotas con plan (único, mensual, trimestral, semestral, anual)
    y aplicación de descuentos.
- **2.c — Renovación**
  - `POST /contratos/:id/renovar` con validación de `vecesRenovado`.
  - Botón "Renovar" en el detalle (sólo si elegible).
- **2.d — Relacionar contratos**
  - `POST /contratos/:id/relacionar { contratoIdB }` con validación de
    bóveda común y fechas solapadas.
  - UI: modal de búsqueda en el detalle.
- **2.e — Documentos firmados**
  - `POST /contratos/:id/documento-firmado` (multipart, valida PDF, ≤10 MB).
  - Almacenamiento configurable: `STORAGE_DRIVER=local|s3`.
- **2.f — PDFs**
  - Migrar `Controllers/Pdf/ContratoPDF.cs` a `backend/src/modules/contrato/contrato.pdf.ts` (o reutilizar
    `frontend/src/lib/contrato-pdf.ts` y exponerlo como ruta server).
  - Producir el mismo layout del legado (logos, cláusulas, plan de pagos,
    firmas).

**Definition of done:**

- Crear, editar, renovar, relacionar, subir documento, descargar PDF — todos
  los flujos funcionan desde la UI.
- PDFs comparados visualmente con el legado y aprobados por el GAD.

### Fase 3 — Cobros, pagos y descuentos

**Entregable:** módulo `/cobros` con pantalla de cobro multi-cuota, descuentos
y factura PDF.

Tareas:

1. Pantalla `/cobros/[contratoId]/cobrar`: lista de cuotas con checkbox,
   suma total, descuento aplicable, método de pago, banco/referencia.
2. Backend `POST /pagos/cobrar { contratoId, cuotasIds, metodoPago,
   bancoId?, referencia?, descuentoId?, monto }` transaccional.
3. Numeración de recibo `YYYY-NNNN` anual.
4. PDF de factura (`facturaPagoPdfDocument.cs` → `pago.pdf.ts`).
5. Endpoint y botón **Anular pago** (sólo `Administrador`).
6. Recargo por mora automático al cargar la pantalla (lee
   `cementerio.tasaMoraDiaria` y los días vencidos).
7. CRUD de **Descuentos** y **Bancos** en `/configuracion`.

**Definition of done:**

- Operador puede cobrar 1..N cuotas con un descuento y método de pago.
- Factura PDF se genera y descarga.
- Administrador puede anular un pago y las cuotas vuelven a `pagada=false`.

### Fase 4 — Bóvedas, bloques, propietarios

**Entregable:** módulos `/bloques` y `/bovedas` completos, incluyendo
asignación de propietario.

Tareas:

1. Crear bloque con N pisos (formulario "número de pisos" + autogeneración).
2. Editar bóveda con modal de cambio de propietario (búsqueda de personas).
3. Endpoint y UI para histórico de la bóveda (contratos pasados y actual).
4. Validación: no permitir eliminar un bloque con bóvedas activas.

### Fase 5 — Personas, Difuntos, Responsables

**Entregable:** CRUD completo, autocompletado, relaciones cruzadas.

Tareas:

1. Endpoint de búsqueda autocompletado (`GET /personas/buscar?q=`).
2. Detalle de persona con tabs: Datos, Contratos como responsable, Bóvedas
   como propietario, Pagos realizados.
3. Crear difunto exige bóveda existente + validaciones de fechas.
4. Cálculo de edad al fallecer en el detalle.
5. Mostrar campos opcionales nuevos del difunto en formularios.

### Fase 6 — Reportes

**Entregable:** 5 reportes con vista HTML, PDF y Excel.

Tareas:

1. Implementar `report.module.ts` con servicios por reporte.
2. UI con filtros conservados en query string.
3. Generación PDF (mismo layout que legado) y export Excel (`xlsx`).
4. Comparativa mensual (mejora `[N]`).

### Fase 7 — Administración (usuarios y roles)

**Entregable:** CRUD completo de usuarios y roles, con asignación múltiple y
reset de contraseña forzado.

Tareas:

1. Listado de usuarios con sus roles.
2. Asignar/quitar roles desde el detalle.
3. Reset de contraseña que marca `mustChangePassword=true`.
4. Bloqueo de eliminación para `admin@teobu.com`.

### Fase 8 — Notificaciones

**Entregable:** módulo de notificaciones operativo con job programado.

Tareas:

1. Tabla `Notificacion` (creada en Fase 0).
2. `NotificacionService` con `crear`, `marcarLeida`, `listar`.
3. Job NestJS (`@nestjs/schedule`) que corre diariamente y genera
   notificaciones para:
   - contratos por vencer en 30 días → al responsable principal.
   - cuotas vencidas → al responsable principal.
4. Dropdown del header con badge de contador + lista paginada.
5. Página `/notify` completa.
6. Envío de email opcional (si SMTP configurado).

### Fase 9 — Configuración y catastro on-demand

**Entregable:** `/configuracion` permite editar todo y subir un nuevo catastro.

Tareas:

1. Pantalla edición de cementerio (campos de Fase 0).
2. Pantalla edición de `GADInformacion` (logos, misión, visión).
3. `POST /catastro/import` con multipart Excel.
4. Vista de estado de la última importación.

### Fase 10 — Pulido y QA

**Entregable:** sistema listo para entrega.

Tareas:

1. Validación visual contra el legado de las 88 vistas migradas.
2. Pruebas de carga con dataset real (~5000 contratos).
3. Auditoría WCAG AA.
4. Verificación de SEO/meta de Next (no es público, pero `<title>` correcto).
5. Actualizar `MIGRATION_STATUS.md` con todos los módulos en `Completo`.

---

## 3. Decisiones técnicas vigentes

Estas decisiones están **cerradas** y no deben revisitarse a menos que haya
una razón documentada. Cualquier desviación se discute en PR y se actualiza
este archivo.

| Decisión | Resolución |
|----------|-----------|
| Sustituto de `HttpContext.Session` para wizards | **`localStorage`** con namespace `cementerio:wizard:contrato:v1` y TTL 4 h. Razón: el wizard es del lado cliente y no debe acoplar al backend. |
| Identidad y JWT | `@nestjs/jwt` + `passport-jwt`. Tokens válidos 7 d. Refresh manual (re-login). Sin OAuth externo. |
| Hash de contraseña | `bcrypt`, cost 10. |
| Almacenamiento de PDFs firmados | Driver pluggable: `local` (filesystem `STORAGE_PATH=/app/storage`) o `s3` (variables `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`). Default: `local`. |
| Generador de PDF | `pdfkit`. Quedó descartado QuestPDF (.NET) y Rotativa (requiere wkhtmltopdf). |
| Cron | `@nestjs/schedule`. Job principal: `0 7 * * *` America/Guayaquil. |
| Idioma del código | Identificadores y comentarios en **inglés**; literales de UI y mensajes al usuario en **español**. Excepción: nombres de dominio (`Boveda`, `Difunto`, `Cementerio`) se mantienen en español por consistencia con el cliente. |
| Numeración anual | Secuencias PostgreSQL `contrato_numero_YYYY_seq` y `pago_numero_YYYY_seq` creadas perezosamente. Alternativa rechazada: contar `max()` (race condition). |
| Cliente HTTP frontend | `fetch` nativo + `@tanstack/react-query` para caché. **No** axios (ya está en `package.json`; remover en limpieza posterior si no se usa). |
| Validación formularios | `zod` en frontend (ya en `package.json`), `class-validator` en backend. |

---

## 4. Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| Reglas de cálculo de cuotas con bordes (años bisiestos, descuento aplicado parcialmente) divergen del legado | Tests unitarios reproduciendo escenarios reales tomados del legado en producción. |
| Datos de producción incluyen contratos con campos NULL inesperados | Importador de SQL Server (Fase 0 extendida) reporta nulls problemáticos y permite mapeo manual. |
| PDF del contrato debe ser **idéntico** al legado (firma del presidente, sellos) | Iterar con el GAD validando 3 PDFs antes de cerrar Fase 2.f. |
| Pérdida de sesión durante wizard si el usuario refresca | `localStorage` mitiga; si el navegador limpia, se acepta como degradación con un toast "datos no guardados". |
| Concurrencia: dos operadores creando contratos al mismo tiempo asignan mismo número secuencial | Uso de secuencias PostgreSQL (atómicas) en lugar de `max()+1`. |
| Migración SQL Server → PostgreSQL en producción | Ensayo en staging con copia de la BD legada. Reversible por backup completo. |
| Subida de PDFs grandes bloquea el event loop | `multer` con streaming a disco/S3; límite 10 MB; rechazo `413` si excede. |

---

## 5. Checklist de cierre por fase

```
[x] Fase 0  — Esquema completo + seed actualizado            ← 2026-05-13
[x] Fase 1  — Auth + middleware                              ← 2026-05-13
[~] Fase 2  — Contratos
    [x] 2.a Listado con filtros y detalle completo           ← 2026-05-13
    [x] 2.b Wizard validado + numeración atómica + planes    ← 2026-05-13
    [x] 2.c Renovación                                       ← 2026-05-13
    [ ] 2.d Relacionar contratos
    [ ] 2.e Documentos firmados (upload)
    [ ] 2.f PDF oficial del contrato
[ ] Fase 2  — Contratos: listado, wizard, renovación, relacionar, documentos, PDF
[ ] Fase 3  — Cobros: multi-cuota, descuentos, factura PDF, anulación
[ ] Fase 4  — Bóvedas, bloques, propietarios
[ ] Fase 5  — Personas, difuntos, responsables
[ ] Fase 6  — Reportes (5 + comparativa)
[ ] Fase 7  — Usuarios y roles
[ ] Fase 8  — Notificaciones + job
[ ] Fase 9  — Configuración + catastro on-demand
[ ] Fase 10 — Pulido / QA / entrega
```

Cada cierre actualiza `MIGRATION_STATUS.md` y este checklist.
