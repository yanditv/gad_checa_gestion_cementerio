# Estado de Migración

> Última actualización: **2026-05-13** — cierre de **Fase 1** (auth + middleware).

## Estado real de paridad

La migración **no está completa al 100 %** respecto al sistema legado ASP.NET
(`gad_checa_gestion_cementerio/`). Las fases del plan vivo están en
`new-migration/MIGRATION_PLAN.md`.

## Avances aplicados en esta iteración

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
| Importación de catastro (`CATASTRO_FINAL.xlsx`)     | Parcial |
| Autenticación / login / recuperación                | **Completo** |
| Dashboard                                           | Parcial |
| Contratos — listado, detalle, edición básica        | Parcial |
| Contratos — wizard multi-paso (versión inicial)     | Parcial |
| Contratos — renovación, relación, documentos firmados, PDF | Pendiente |
| Bloques                                             | Parcial |
| Bóvedas                                             | Parcial |
| Personas / Propietarios / Responsables              | Parcial |
| Difuntos                                            | Parcial |
| Cobros / Pagos / Facturas                           | Pendiente |
| Reportes (5 + comparativa, PDF, Excel)              | Pendiente |
| Administración (usuarios y roles)                   | Parcial |
| Configuración (cementerio + GAD + descuentos + bancos) | Pendiente |
| Notificaciones (bandeja + cron + email)             | Pendiente |
| Documentos auxiliares (uploads + storage)           | Pendiente |
| Identidad visual (paridad con Razor + Able Pro)     | Parcial |

## Pendiente para cierre 100 %

Según el plan de fases (`new-migration/MIGRATION_PLAN.md`):

- ~~**Fase 1** — Autenticación completa (`AUTH-R1..R9`).~~ ✅
- **Fase 2** — Contratos: paridad de las 39 acciones del legado, PDFs.
- **Fase 3** — Cobros: pantalla multi-cuota, descuentos, factura PDF, anulación.
- **Fase 4** — Bloques, bóvedas con propietario, histórico.
- **Fase 5** — Personas, difuntos, responsables, autocompletado.
- **Fase 6** — 5 reportes con PDF y export Excel.
- **Fase 7** — CRUD completo de usuarios y roles + reset forzado.
- **Fase 8** — Notificaciones + job programado + email opt-in.
- **Fase 9** — Configuración + importación de catastro on-demand.
- **Fase 10** — Pulido, QA, paridad visual 100 %.
