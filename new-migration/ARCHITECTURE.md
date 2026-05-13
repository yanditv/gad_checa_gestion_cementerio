# Arquitectura — `new-migration/`

Documenta la arquitectura objetivo del sistema migrado. Es el contrato técnico
que cualquier cambio debe respetar. Si una decisión aquí se contradice, el PR
debe actualizar este documento.

> Sobre qué construye: `REQUIREMENTS.md` describe el **qué** y `DESIGN.md`
> describe el **aspecto**. Este documento describe el **cómo está montado**.

---

## 1. Vista de alto nivel

```
                              ┌─────────────────────────────┐
                              │        Navegador             │
                              │   Next.js (App Router)       │
                              │   React 19, Bootstrap UI     │
                              └──────────────┬───────────────┘
                                             │ HTTPS, JWT bearer
                                             ▼
              ┌──────────────────────────────────────────────────────┐
              │  Next.js Route Handlers (BFF)                        │
              │  /app/api/*  → proxy + reglas de negocio cliente     │
              └──────────────┬───────────────────────────────────────┘
                             │ HTTP/JSON
                             ▼
              ┌──────────────────────────────────────────────────────┐
              │  NestJS 11 (cementerio-backend)                      │
              │  ┌────────────┬────────────┬────────────┐            │
              │  │ Auth/Guard │ Modules    │ Interceptors│           │
              │  │ JWT, Roles │ (dominio)  │ Response,   │           │
              │  │            │            │ Exceptions, │           │
              │  │            │            │ Audit       │           │
              │  └────────────┴────────────┴────────────┘            │
              │            │                                          │
              │            ▼                                          │
              │     Prisma Client                                     │
              └────────────┬─────────────────────────────────────────┘
                           │ SQL
                           ▼
                    ┌────────────────┐    ┌────────────────────┐
                    │ PostgreSQL 14+ │    │  Storage (PDFs)     │
                    │  cementerio    │    │  local / S3-compat  │
                    └────────────────┘    └────────────────────┘

      Cron (NestJS)                       Email (nodemailer)
      ────────────                        ──────────────────
      - notificaciones diarias            - reset password
      - vencimientos                      - notificaciones opt-in
```

---

## 2. Estructura de directorios

```
new-migration/
├── ARCHITECTURE.md            ← este archivo
├── CLAUDE.md                  ← instrucciones para agentes IA
├── DESIGN.md                  ← sistema de diseño visual
├── MIGRATION_PLAN.md          ← plan por fases
├── REQUIREMENTS.md            ← requerimientos funcionales / no funcionales
├── docker-compose.postgres.yml
├── backend/                   ← cementerio-backend (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma      ← fuente única del modelo
│   │   └── migrations/
│   ├── src/
│   │   ├── main.ts            ← bootstrap, CORS, Swagger, seed
│   │   ├── app.module.ts
│   │   ├── prisma/            ← PrismaService, PrismaModule
│   │   ├── common/
│   │   │   ├── interceptors/  ← ApiResponseInterceptor, AuditInterceptor
│   │   │   ├── filters/       ← AllExceptionsFilter
│   │   │   ├── guards/        ← JwtAuthGuard, RolesGuard
│   │   │   ├── decorators/    ← @Roles, @CurrentUser, @Public
│   │   │   ├── dto/           ← PaginationDto, ApiResponse<T>
│   │   │   └── pdf/           ← helpers compartidos para pdfkit
│   │   ├── bootstrap/
│   │   │   ├── seed.service.ts
│   │   │   └── catastro-import.service.ts
│   │   └── modules/
│   │       ├── auth/          ← login, refresh, password reset
│   │       ├── usuario/
│   │       ├── rol/
│   │       ├── cementerio/    ← Cementerio + GADInformacion
│   │       ├── descuento/     ← (pendiente)
│   │       ├── banco/         ← (pendiente)
│   │       ├── bloque/
│   │       ├── boveda/
│   │       ├── persona/       ← Persona + Propietario + Responsable
│   │       ├── difunto/
│   │       ├── contrato/
│   │       ├── cuota/
│   │       ├── pago/
│   │       ├── reporte/       ← (pendiente)
│   │       ├── notificacion/  ← (pendiente)
│   │       └── catastro/      ← (pendiente)
│   └── package.json
│
└── frontend/                  ← cementerio-frontend (Next.js 15)
    ├── public/                ← assets estáticos del template Able Pro
    ├── src/
    │   ├── app/               ← App Router (server + client components)
    │   │   ├── layout.tsx
    │   │   ├── globals.css
    │   │   ├── page.tsx       ← dashboard
    │   │   ├── auth/          ← (pendiente)
    │   │   ├── contratos/
    │   │   ├── bovedas/
    │   │   ├── bloques/
    │   │   ├── personas/
    │   │   ├── difuntos/
    │   │   ├── cobros/
    │   │   ├── pagos/
    │   │   ├── reportes/
    │   │   ├── admin/
    │   │   ├── configuracion/
    │   │   ├── notify/
    │   │   ├── manual/
    │   │   └── api/           ← Route Handlers (BFF proxy + helpers)
    │   ├── components/
    │   │   ├── DashboardLayout.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   └── ui/            ← wrappers reutilizables
    │   ├── lib/
    │   │   ├── api.ts                ← cliente HTTP
    │   │   ├── contratos-server.ts   ← helpers server-only
    │   │   ├── contrato-pdf.ts       ← generador PDF con pdfkit
    │   │   └── reportes-server.ts
    │   └── types/             ← tipos compartidos (DTOs eco backend)
    └── package.json
```

---

## 3. Backend (NestJS)

### 3.1 Convenciones de módulo

Cada módulo de dominio expone **un** controlador, **un** servicio y **DTOs**.
La regla general es:

```
modules/<nombre>/
├── <nombre>.module.ts
├── <nombre>.controller.ts
├── <nombre>.service.ts
├── dto/
│   ├── create-<nombre>.dto.ts
│   ├── update-<nombre>.dto.ts
│   └── query-<nombre>.dto.ts
└── <nombre>.pdf.ts       (opcional, si genera PDF)
```

### 3.2 Capas

1. **Controller**
   - Sólo orquesta: valida DTO (Pipes), llama servicio, devuelve resultado.
   - Decorado con `@ApiTags`, `@ApiOperation`, `@ApiResponse` para Swagger.
   - Aplica `@UseGuards(JwtAuthGuard)` por defecto, `@Public()` para excepciones.
   - Aplica `@Roles('Administrador', ...)` cuando aplica.
2. **Service**
   - Toda la lógica de negocio.
   - Recibe `PrismaService` por DI.
   - No conoce HTTP (`Request`/`Response`).
   - Las operaciones que tocan ≥ 2 tablas usan `prisma.$transaction`.
3. **DTO**
   - `class-validator` para validación.
   - `class-transformer` para deserialización tipada (`@Type`, `@Transform`).
   - Decorados con `@ApiProperty` para Swagger.

### 3.3 Respuesta unificada

Todas las respuestas pasan por `ApiResponseInterceptor`:

```ts
// Éxito
{
  "success": true,
  "data": <payload>
}

// Paginado
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 15, "total": 100, "totalPages": 7,
            "hasNextPage": true, "hasPrevPage": false }
}

// Error (vía AllExceptionsFilter)
{
  "success": false,
  "message": "Mensaje legible en español",
  "code": "ERR_VALIDATION",   // opcional
  "errors": [ ... ]            // opcional, validación campo a campo
}
```

El frontend (`lib/api.ts`) **desenvuelve** automáticamente la propiedad `data`.

### 3.4 Paginación estándar

DTO base (`common/dto/pagination.dto.ts`):

```ts
class PaginationDto {
  @IsInt() @Min(1) @Type(() => Number) page = 1;
  @IsInt() @Min(1) @Max(100) @Type(() => Number) limit = 15;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsIn(['asc','desc']) sortOrder: 'asc'|'desc' = 'desc';
}
```

Cualquier endpoint de listado recibe este DTO (o uno que lo extienda).

### 3.5 Auditoría

Interceptor `AuditInterceptor` (a crear):

- Para métodos `POST`/`PUT`/`PATCH`/`DELETE`, lee el `req.user.id` (JwtAuthGuard
  lo deposita) y lo inyecta en `req.auditContext`.
- Los servicios consultan `req.auditContext.userId` y rellenan los campos
  `usuarioCreadorId`/`usuarioActualizadorId`/`usuarioEliminadorId`
  apropiados al persistir.
- Para `DELETE` lógico, el patrón estándar es:

  ```ts
  await prisma.contrato.update({
    where: { id },
    data: { estado: false, usuarioEliminadorId: userId,
            fechaEliminacion: new Date() },
  });
  ```

### 3.6 Errores

- `BadRequestException` (400): validación.
- `UnauthorizedException` (401): falta o expira token.
- `ForbiddenException` (403): falta de rol.
- `NotFoundException` (404): recurso no existe.
- `ConflictException` (409): violación de unicidad (Prisma `P2002`).
- `UnprocessableEntityException` (422): regla de negocio.

Mensajes **en español** dirigidos al usuario final.

### 3.7 Numeración anual

Para contratos y pagos se usa una secuencia PostgreSQL por año, creada
perezosamente:

```ts
// pseudo
const year = new Date().getFullYear();
const seqName = `contrato_numero_${year}_seq`;
await prisma.$executeRawUnsafe(
  `CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1`
);
const [{ nextval }] = await prisma.$queryRawUnsafe<[{nextval: bigint}]>(
  `SELECT nextval('"${seqName}"') AS nextval`
);
const numero = `${year}-${String(nextval).padStart(4, '0')}`;
```

Atómico, evita carreras.

### 3.8 Storage (PDFs firmados)

Servicio `StorageService` con interfaz única:

```ts
interface StorageService {
  put(key: string, data: Buffer | NodeJS.ReadableStream, mime: string): Promise<string>; // returns canonical key
  get(key: string): Promise<NodeJS.ReadableStream>;
  delete(key: string): Promise<void>;
  url(key: string, opts?: { expiresIn?: number }): Promise<string>; // signed url
}
```

Implementaciones: `LocalStorageService` (filesystem) y `S3StorageService`
(`@aws-sdk/client-s3`). Selección por `STORAGE_DRIVER` env.

### 3.9 Cron

`@nestjs/schedule` registrado en `AppModule`:

```ts
@Cron('0 7 * * *', { timeZone: 'America/Guayaquil' })
async generarNotificacionesDiarias() { ... }
```

---

## 4. Frontend (Next.js)

### 4.1 Renderizado

- **App Router** (`src/app/`).
- Páginas listado/detalle: client components (`'use client'`) porque dependen
  de hooks y filtros vivos.
- Pantallas de impresión y PDF de reportes: server components que llaman al
  backend con el JWT proxado.
- BFF: las llamadas del navegador van a `/api/*` (Route Handlers de Next), no
  directo a `http://localhost:3001`. Esto permite:
  - Inyectar el JWT desde cookie httpOnly sin exponerlo al cliente.
  - Reescribir URLs en producción (mismo dominio).

### 4.2 Cliente API

`frontend/src/lib/api.ts` centraliza el cliente. Convenciones:

- Métodos por recurso: `contratosApi.findPage(...)`, `contratosApi.findById(id)`,
  `contratosApi.create(data)`, etc.
- Tipos compartidos en `src/types/`.
- Caché con `@tanstack/react-query` para listados y detalle; mutaciones
  invalidan claves relevantes.

### 4.3 Componentes UI

Documentados en `DESIGN.md` §6. Reglas inflexibles:

- **No** mezclar Bootstrap y Tailwind en un mismo componente.
- Reutilizar wrappers (`Button`, `PageHeader`, `DataGrid`, …) antes de
  escribir clases Bootstrap directas.
- Iconos solo Tabler.

### 4.4 Wizards multi-paso

Sustituyen al `HttpContext.Session` del legado mediante:

```ts
const STORAGE_KEY = 'cementerio:wizard:contrato:v1';
const TTL_MS = 4 * 60 * 60 * 1000;

type WizardState<T> = { savedAt: number; data: T };

function loadWizard<T>(): T | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const w = JSON.parse(raw) as WizardState<T>;
  if (Date.now() - w.savedAt > TTL_MS) return null;
  return w.data;
}

function saveWizard<T>(data: T) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
}

function clearWizard() {
  localStorage.removeItem(STORAGE_KEY);
}
```

Cada wizard tiene su clave (`contrato:v1`, `boveda:v1`, …). Versionar la clave
cuando cambie el shape para forzar reset.

### 4.5 Autenticación en el cliente

- Token JWT vive en cookie **httpOnly** (`auth-token`) seteada por
  `/api/auth/login`.
- `middleware.ts` (a crear en Fase 1) lee la cookie y redirige a
  `/auth/login` si falta. Las APIs internas la leen y la traducen a
  `Authorization: Bearer` hacia el backend.

---

## 5. Modelo de datos (resumen)

Diagrama lógico de las entidades principales (sólo cardinalidades):

```
Cementerio ──┬─< Bloque ──< Piso ──< Boveda
             │                            │
             └─< GADInformacion           ├─< Difunto
                                          │
                                          └─< Contrato
                                                │
              Persona ──┬─< Propietario ────────┘ (FK propietarioId)
                        │
                        ├─< Responsable ───< ContratoResponsable >─── Contrato
                        │
                        └─< Usuario (no real — Usuario es entidad separada
                                     pero referencia Persona vía email)

Contrato ──< Cuota ──< CuotaPago >── Pago ──> Banco
                                       │
                                       └──> Descuento (opcional)
```

Detalle completo en `backend/prisma/schema.prisma` (recrear) y
`REQUIREMENTS.md` §2.

---

## 6. API — convenciones

### 6.1 URL

```
/auth/login                      POST
/auth/forgot-password            POST
/auth/profile                    GET

/usuarios                        GET (paginado), POST
/usuarios/:id                    GET, PUT, DELETE
/usuarios/:id/roles              GET, POST, DELETE :rolId

/roles                           GET, POST
/roles/:id                       GET, PUT, DELETE
/roles/:id/usuarios              GET

/cementerio                      GET, PUT          (singleton)
/gad-informacion                 GET, PUT          (singleton)
/descuentos                      GET, POST
/descuentos/:id                  GET, PUT, DELETE
/bancos                          GET, POST
/bancos/:id                      GET, PUT, DELETE

/bloques                         GET (paginado), POST
/bloques/:id                     GET, PUT, DELETE
/bloques/:id/pisos               GET

/bovedas                         GET (paginado), POST
/bovedas/:id                     GET, PUT, DELETE
/bovedas/:id/propietario         PATCH { personaId | null }
/bovedas/:id/historial           GET

/personas                        GET (paginado), POST
/personas/:id                    GET, PUT, DELETE
/personas/buscar?q=              GET   (autocompletado)

/difuntos                        GET (paginado), POST
/difuntos/:id                    GET, PUT, DELETE

/contratos                       GET (paginado), POST
/contratos/create-metadata       GET
/contratos/bovedas-disponibles   GET
/contratos/numero-secuencial     GET
/contratos/:id                   GET, PUT, DELETE
/contratos/:id/renovar           POST
/contratos/:id/relacionar        POST { contratoIdB }
/contratos/:id/relacionar        DELETE
/contratos/:id/documento-firmado POST   (multipart)
/contratos/:id/pdf               GET    (PDF oficial)
/contratos/:id/recibo-pdf        GET

/cuotas/:id                      GET
/pagos                           GET (paginado), POST
/pagos/cobrar                    POST   (multi-cuota)
/pagos/:id                       GET
/pagos/:id/anular                POST   (Administrador)
/pagos/:id/factura.pdf           GET

/reportes/ingresos               GET ?desde&hasta
/reportes/ingresos.pdf           GET
/reportes/ingresos.xlsx          GET
/reportes/cuentas-por-cobrar     GET
/reportes/cuentas-por-cobrar.pdf GET
/reportes/bovedas                GET ?tipoBloque&nombreBloque
/reportes/bovedas.pdf            GET

/notificaciones                  GET ?leida=
/notificaciones/:id/marcar-leida POST

/catastro/import                 POST   (multipart, sólo Administrador)
/catastro/last-import            GET

/dashboard                       GET
/health                          GET
```

### 6.2 Códigos HTTP

| Operación | OK | Error frecuente |
|-----------|----|-----------------|
| GET listado | 200 | 400 (parámetros inválidos) |
| GET detalle | 200 | 404 |
| POST create | 201 | 400, 409, 422 |
| PUT update | 200 | 404, 409 |
| DELETE | 204 | 404, 422 (no se puede eliminar) |
| Operaciones largas (import) | 202 (accepted) o 200 con resumen | — |

---

## 7. Configuración por entorno

Variables esperadas (consolidar en un `.env.example` por servicio).

### 7.1 Backend

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cementerio
JWT_SECRET=cementerio-secret-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
PORT=3001

# SMTP
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@gadcheca.gob.ec

# Storage
STORAGE_DRIVER=local
STORAGE_PATH=/app/storage
S3_BUCKET=
S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Misc
TZ=America/Guayaquil
NODE_ENV=production
```

### 7.2 Frontend

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Gad Checa - Gestión Cementerio
AUTH_COOKIE_NAME=cementerio_auth
AUTH_COOKIE_DOMAIN=
```

---

## 8. Despliegue

### 8.1 Local

```
docker compose -f docker-compose.postgres.yml up -d   # solo BD
cd backend  && bun install && bun prisma migrate dev && bun run start:dev
cd frontend && bun install && bun run dev
```

### 8.2 Docker Compose (producción)

`docker-compose.yml` (a crear/consolidar) con servicios `postgres`,
`mailhog` (opcional dev), `backend`, `frontend` y `nginx` como reverse-proxy.

### 8.3 Migraciones

- Local: `bun prisma migrate dev --name <descripcion>`.
- Producción: `bun prisma migrate deploy` ejecutado en el entrypoint del
  contenedor backend antes de `node dist/main`.

### 8.4 Seed

- `seed.service.ts` corre al arrancar (idempotente).
- `catastro-import.service.ts` corre si encuentra `CATASTRO_FINAL.xlsx`
  (idempotente: renombra el archivo a `*_MIGRADO_<timestamp>.xlsx` tras éxito).

---

## 9. Observabilidad

- Logs JSON estructurados (pino o `nestjs-pino`). Campos mínimos: `level`,
  `time`, `module`, `userId`, `traceId`.
- Métricas mínimas en `/health`: uptime, db latency, memoria.
- Errores 5xx → log con stack y `traceId` referenciable.
- Auditoría escrita ya queda en BD (campos `usuarioCreadorId` etc.). Para una
  auditoría más rica considerar tabla `AuditLog` en una fase posterior (no
  está en alcance inicial).

---

## 10. Reglas inflexibles

- **No** se borra físicamente; siempre `estado=false` + auditoría.
- **No** se rompe la unicidad por número secuencial (usar secuencias PG).
- **No** se exponen endpoints sin paginación para listados de dominio.
- **No** se mezclan responsabilidades: las migraciones de datos viven en
  `bootstrap/` o `scripts/`, no en módulos de dominio.
- **No** se duplica lógica entre frontend y backend; el cliente confía en el
  cálculo del servidor (ej: totales de cuota, descuentos, mora).
- **No** se inyectan strings al usuario sin pasar por `class-validator` o `zod`.
- **Sí** se mantiene paridad con la UI legada hasta firmar la entrega. Las
  mejoras visuales sólo después del go-live.
