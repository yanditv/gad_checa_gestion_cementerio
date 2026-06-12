# Estado de Migración

> Última actualización: **2026-05-14** — cierre de **Fase 9.2** (importador
> de catastro on-demand). 9 de 10 fases mayoritariamente cerradas; quedan
> tareas atómicas de Famiitry (7.2, 8.1–8.3, 9.1, 9.3, 10.1, 10.4, 10.5) y
> de yanditv (8.4 email, 10.3 carga, 10.6 cierre).

## Estado real de paridad

La migración avanza alineada con `new-migration/MIGRATION_PLAN.md`. Las
fases 0 a 6 están **completas**; la Fase 7 está parcial (7.1 + 7.3 + 7.4
cerradas); la Fase 9 está parcial (9.2 cerrada). Quedan abiertas las
secciones marcadas en §6.1 del plan vivo.

## Avances aplicados en esta iteración

### 2026-06-12 — Fase 2: Módulo de Contratos y Renovación PDF Completo (Revisión y Ajustes)

- **Corrección de Banners y Logo GAD**: Migración del endpoint de carga local del frontend a un controlador del backend seguro y auditado bajo `@Roles('Administrador')`. Las imágenes se validan rigurosamente por tipo (JPG/PNG/WEBP) y tamaño (≤5MB) y se persisten en el driver de almacenamiento configurado (`StorageService` del backend).
- **Mitigación de SSRF**: Restricción y saneamiento del recuperador de imágenes en el generador de PDF del BFF, verificando el host contra un allowlist estricto (permitiendo solo la URL del backend) y resolviendo URLs locales de API directamente sin realizar llamadas HTTP externas.
- **Parametrización Segura**: Configuración del seed de base de datos para no sobrescribir las cláusulas personalizadas en cada inicio del servidor (moviendo los valores predeterminados solo al bloque `create`). Centralización de cláusulas predeterminadas en `default-contrato-templates.ts`.
- **Prevención de Colisión de Secuenciales**: Fijación del código de GAD (`gadCode = 'GADCHECA'`) en la resolución del número secuencial para evitar reinicios accidentales del contador y colisiones en caso de cambios en el nombre del GAD.

### 2026-05-14 — Fase 9.2: Importador de catastro on-demand

- Nuevo modelo Prisma `CatastroImport` (log de cada importación: estado,
  conteos, errores, ref. admin).
- Migración `20260514213713_add_catastro_import`.
- Módulo `modules/catastro/` con:
  - `CatastroImporter` reusable que parsea Buffer de Excel y hace upsert
    idempotente (nunca borra).
  - `CatastroService.runImport` con tracking de log y manejo de errores
    por fila (hasta 100).
  - `POST /catastro/import` multipart 10 MB, rol Administrador.
  - `GET /catastro/imports` paginado + `GET /catastro/imports/:id`.
- Frontend: `/configuracion/catastro` con dropzone, reporte inmediato y
  tabla de historial; botón "Importar catastro" desde `/configuracion`.
- Tarifas leídas de `Cementerio.tarifaArriendo` / `tarifaArriendoNicho` y
  años de arriendo configurables (no hardcoded).

### 2026-05-14 — Fase 7.3 + 7.4: Reset forzado y bloqueo super-admin

- `POST /usuarios/:id/reset-password` (rol Administrador): genera
  contraseña temporal segura, marca `mustChangePassword=true`, envía email
  si SMTP está configurado o devuelve la temporal para entrega manual.
- `DELETE /usuarios/:id` y `PATCH /usuarios/:id/estado=false` bloquean a
  `admin@teobu.com` y al usuario actual.
- `update()` también protege identidad/desactivación del super-admin.
- Frontend `/auth/change-password` con copia diferenciada para cambio
  forzado vs voluntario.
- `DashboardLayout` redirige automáticamente cuando
  `session.mustChangePassword=true`.

### 2026-05-14 — Fase 7.1: Listado de usuarios (Famiitry)

- `GET /usuarios` paginado con búsqueda multi-campo.
- `/admin/usuarios` con roles renderizados como badges y paginación.

### 2026-05-14 — Fase 6: Reportes (5 + comparativa, PDF, Excel)

- Backend `modules/report/` con 6 endpoints JSON: resumen, ingresos,
  cuentas-por-cobrar, bóvedas, bloques, comparativa mensual.
- 4 endpoints PDF (A4 horizontal con `pdfkit`) + 4 endpoints Excel (`xlsx`).
- 5 pantallas frontend con filtros sincronizados al query string.
- Comparativa mensual con barras CSS: año actual vs. anterior + variación %.

### 2026-05-14 — Fase 5: Personas, difuntos, responsables

- Endpoint `GET /personas/:id` enriquecido (bóvedas como propietario,
  contratos como responsable).
- Pantalla `/personas/:id` con tabs (datos, bóvedas, contratos).
- Difuntos con campos nuevos: nacionalidad, estado civil, lugar
  nacimiento/defunción, padres, cónyuge, certificado de defunción.
- Cálculo automático de edad al fallecer.
- Validación de fechas (`def < nac` → error) y existencia de bóveda.

### 2026-05-14 — Fase 4: Bóvedas, bloques, propietarios

- Bloques con N pisos generados automáticamente + validación de delete
  con bóvedas activas.
- Modal de cambio de propietario con búsqueda de personas.
- Endpoint y UI para histórico de bóveda (contratos pasados y actual).

### 2026-05-14 — Fase 3: Cobros, pagos, descuentos, bancos

- Backend cobrar multi-cuota con interés/mora y descuento; anular pago;
  factura PDF con `pdfkit`.
- Pantalla `/cobros/[contratoId]/cobrar`.
- Detalle de pago + anular UI.
- CRUD de Descuentos y Bancos en `/configuracion`.

### 2026-05-14 — Fase 2.6: Migración frontend a Tailwind puro

- 5 lotes que migraron todo el frontend a Tailwind.
- Wrappers Bootstrap (`components/ui/*`) eliminados.
- `corePlugins.preflight: false` ya no necesario; Tailwind dominante.

### 2026-05-14 — Fase 2.5: Tailwind + rediseño módulo contratos

- Tailwind activado con tokens `primary-500`, `brand-dark`, `brand-accent`,
  `shadow-soft`, `shadow-lifted`.
- Sidebar, Header, Footer y `DashboardLayout` reescritos en Tailwind.
- Listado, detalle y wizard de contratos migrados.

### 2026-05-13 — Fase 2: Contratos completos

- Listado con filtros, detalle, wizard multi-paso (paridad con legado).
- Renovación con `vecesRenovado` y bloqueo cuando se excede el máximo.
- Relacionar contratos (`contratoRelacionadoId`).
- Upload de documentos firmados (`Documento` model + StorageService local/S3).
- PDF oficial del contrato con `pdfkit` (cabecera GAD, cláusulas, firmas).

### 2026-05-13 — Fase 1: Autenticación completa

**Backend (NestJS)**
- Decoradores comunes: `@Public()`, `@Roles(...)`, `@CurrentUser()`
  (`backend/src/common/decorators/`).
- `RolesGuard` (`backend/src/common/guards/roles.guard.ts`).
- `JwtAuthGuard` ahora respeta `@Public()` (`backend/src/modules/auth/jwt-auth.guard.ts`).
- `JwtStrategy` extendida: `req.user` incluye `nombre`, `apellido`, `roles[]`
  y `mustChangePassword`; rechaza tokens con `purpose != 'access'`.
- `EmailService` con nodemailer (`backend/src/common/email/email.service.ts`)
  configurable por SMTP_*; modo log-only si no hay host.
- `AuthService` extendido: `logout`, `forgotPassword` (token JWT
  `purpose=password-reset`, TTL 1h, email enviado), `resetPassword`,
  `changePassword`, política de contraseñas (≥6, mayúscula, minúscula,
  dígito) aplicada vía `class-validator`.
- `AuthController`: nuevos endpoints `POST /auth/logout`,
  `POST /auth/forgot-password`, `POST /auth/reset-password`,
  `POST /auth/change-password`. Login marcado `@Public()`.
- `JwtAuthGuard` y `RolesGuard` registrados como `APP_GUARD` global
  (todos los endpoints requieren JWT salvo `@Public()`).
- `main.ts` con `helmet`, `ValidationPipe` estricto
  (`forbidNonWhitelisted`), implicit conversion.
- `.env.example` con todas las variables nuevas (`JWT_EXPIRES_IN`,
  `JWT_RESET_EXPIRES_IN`, `SMTP_*`).

**Frontend (Next.js)**
- Helpers `frontend/src/lib/auth.ts`: cookie httpOnly `cementerio_auth`,
  `readAuthToken`, `authHeaders`, `buildAuthCookie`, `buildClearAuthCookie`.
- Rutas BFF `/api/auth/{login,logout,me,forgot-password,reset-password,
  change-password}` que proxyan al backend y manejan la cookie httpOnly.
- `middleware.ts` global: redirige a `/auth/login?from=<destino>` si falta
  cookie; APIs internas devuelven 401 JSON.
- Páginas nuevas: `/auth/login`, `/auth/forgot-password`,
  `/auth/reset-password`. Shell visual aislado en `AuthShell.tsx`.
- `/cuenta` reescrita: lee perfil de `/api/auth/me`, formulario de cambio
  de contraseña con validación.
- `DashboardLayout` detecta rutas `/auth/*` y omite el shell con sidebar;
  consume `/api/auth/me` para mostrar nombre y rol reales en el `Header`.
- `Header` con logout real (`POST /api/auth/logout` + redirect).

**Dependencias añadidas**
- Backend: `nodemailer`, `@types/nodemailer`, `helmet`.
- Frontend: ninguna (se usa `next/headers` nativo).

### 2026-05-13 — Fase 0: Estabilización del esquema

- **`backend/prisma/schema.prisma` restaurado y completado** (estaba `D` en git).
- **Brechas de esquema cerradas** respecto al legado:
  - `Cementerio`: `abreviaturaTituloPresidente`, `presidente`,
    `vecesRenovacionBovedas`, `vecesRenovacionNicho`, `aniosArriendoBovedas`,
    `aniosArriendoNicho`, `tarifaArriendo`, `tarifaArriendoNicho`,
    `entidadFinanciera`, `nombreEntidadFinanciera`, `numeroCuenta`,
    `tasaMoraDiaria` (mejora), `fechaActualizacion`, `fechaEliminacion`.
  - `GADInformacion`: `logoUrl`, `website`, `mision`, `vision`,
    `fechaCreacion`, `fechaActualizacion` + auditoría.
  - `Persona`: `estadoCivil`, `profesion`, `nacionalidad`, auditoría completa
    (`usuarioActualizador*`, `usuarioEliminador*`, `fechaActualizacion`,
    `fechaEliminacion`).
  - `Difunto`: `nacionalidad`, `estadoCivil`, `lugarNacimiento`,
    `lugarDefuncion`, `nombreConyuge`, `nombrePadre`, `nombreMadre`,
    `numeroCertificadoDefuncion`, `entidadEmisora`,
    `fechaEmisionCertificado`.
  - `Contrato`: `descuentoId` (FK), `montoSubtotal`, `montoDescuento`,
    `fechaEliminacion`.
  - `Pago`: `descuentoId` (FK), `montoSubtotal`, `montoDescuento`,
    `fechaCreacion`, `fechaActualizacion`, `fechaEliminacion`, auditoría
    completa (creador, actualizador, eliminador).
  - `Banco`: `fechaCreacion`.
  - `Usuario`: `mustChangePassword` (preparación para Fase 1).
- **Tablas nuevas:**
  - `Documento` (adjuntos de contrato, ej. PDF firmado escaneado).
  - `Notificacion` (bandeja por usuario para Fase 8).
- **Migración Prisma incremental** generada:
  `prisma/migrations/20260513172915_completar_modelo_legado/migration.sql`.
- **Seed actualizado** (`backend/src/bootstrap/seed.service.ts`):
  valores semilla del cementerio idénticos a los del legado
  (`Program.cs:461-481`).
- Validaciones ejecutadas:
  - `bunx prisma validate` ✔
  - `bunx prisma format` ✔
  - `bunx prisma generate` ✔
  - `bun run build` ✔ (el código existente sigue compilando).

### Trabajo previo conservado

- Seed inicial backend alineado con `Program.cs`:
  - Roles: `Admin`, `Usuario`, `Administrador`
  - Usuario admin: `admin@teobu.com`
  - Datos base: `GADInformacion`, `Cementerio de checa`, descuentos
    (`Ninguno`, `50%`, `100%`).
- Frontend:
  - Creación de contrato migrada a flujo multi-paso.
  - Creación de bloques conectada a API real.
  - Ajustes de layout para evitar superposición de sidebar.
  - Ajustes de arranque de Next para mayor estabilidad en desarrollo.
- Documentación de soporte (`new-migration/`):
  `REQUIREMENTS.md`, `ARCHITECTURE.md`, `DESIGN.md`, `MIGRATION_PLAN.md`,
  `CLAUDE.md`.

## Matriz de paridad (legado → nuevo)

| Módulo                                              | Estado |
|-----------------------------------------------------|--------|
| **Esquema de base de datos**                        | **Completo** |
| Seed inicial (roles, admin, GAD, cementerio)        | **Completo** |
| Importación de catastro on-demand                   | **Completo** (Fase 9.2) |
| Autenticación / login / recuperación                | **Completo** |
| Administración — asignación de roles                | **Completo** (7.2) |

## Pendiente para cierre 100 %

Según el plan vivo (`new-migration/MIGRATION_PLAN.md` §5 y §6.1):

- ~~**Fase 0** — Esquema completo + seed.~~ ✅
- ~~**Fase 1** — Autenticación completa.~~ ✅
- ~~**Fase 2** — Contratos completos (listado, wizard, renovación,
  relación, documentos, PDF).~~ ✅
- ~~**Fase 2.5 / 2.6** — Migración completa a Tailwind.~~ ✅
- ~~**Fase 3** — Cobros, pagos, descuentos, bancos.~~ ✅
- ~~**Fase 4** — Bóvedas, bloques, propietarios, histórico.~~ ✅
- ~~**Fase 5** — Personas, difuntos, responsables.~~ ✅
- ~~**Fase 6** — 5 reportes con PDF y Excel + comparativa mensual.~~ ✅
- **Fase 7** — Usuarios y roles
  - ~~7.1 Listado (Famiitry)~~ ✅
  - **7.2 Asignar/quitar roles desde detalle** — @Famiitry
  - ~~7.3 Reset de contraseña forzado~~ ✅
  - ~~7.4 Bloqueo eliminación admin@teobu.com~~ ✅
- **Fase 8** — Notificaciones
  - ~~8.1 NotificacionService (CRUD) — @Famiitry~~ ✅
  - ~~8.2 Job diario `@nestjs/schedule` — @Famiitry~~ ✅
  - ~~8.3 Dropdown header + página `/notify` — @Famiitry~~ ✅
  - **8.4 Envío de email (si SMTP)** — @yanditv (bloqueado por 8.1)
- **Fase 9** — Configuración + catastro on-demand
  - ~~9.1 Edición Cementerio + GADInformacion~~ ✅
  - ~~9.2 Importador catastro on-demand~~ ✅
  - ~~9.3 Vista de estado de última importación~~ ✅
- **Fase 10** — Pulido y QA
  - **10.1 Manual de usuario** — @Famiitry
  - **10.2 Validación visual contra legado (88 vistas)** — mixto
  - **10.3 Pruebas de carga con dataset real (~5000 contratos)** — @yanditv
  - **10.4 Tests E2E con Playwright** — @Famiitry
  - ~~10.5 Auditoría WCAG AA~~ ✅
  - **10.6 Cierre `MIGRATION_STATUS.md` final** — @yanditv

## Brechas técnicas residuales

Estas no son features pero quedan en el radar para fases futuras:

- Auditoría granular en `Piso`, `Propietario`, `Responsable`, `Cuota`
  (modelos sin `usuarioCreadorId`). Aceptable hoy: la trazabilidad vive
  en logs de aplicación. Requiere extensión de schema.
- Numeración secuencial en el importador de catastro usa `max+1`. El
  caso de uso (admin sube Excel desde UI) corre de a uno, así que no hay
  race. Si se hace importación paralela en el futuro, migrar a secuencia
  PostgreSQL.
- ~~Notificacion sin service ni job~~ → Fase 8.1–8.3 completada (PRs #11, #12, #13).
- ~~Autorización inconsistente en endpoints~~ → Fase 11.4: `@Roles('Administrador')` en DELETE / anular / roles. Resto alineado con paridad legado (PR #18).
- ~~`@Body() data: any` en controllers~~ → Fase 11.3: DTOs tipados en 7 módulos (PR #17).
- ~~Fuga de `passwordHash`~~ → Pendiente en Fase 11.2 (asignada a @yanditv).
