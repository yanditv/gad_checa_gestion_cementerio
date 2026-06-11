# CLAUDE.md — Guía para asistentes IA en `new-migration/`

Estas instrucciones se aplican a **todo** trabajo dentro del directorio
`new-migration/`. Si vas a tocar código aquí, lee este archivo primero y
respeta lo que dice. Cuando una decisión no está aquí, consulta en este orden:

1. `REQUIREMENTS.md` — qué tiene que hacer el sistema.
2. `MIGRATION_PLAN.md` — qué fase estamos cerrando y cuál es el alcance.
3. `ARCHITECTURE.md` — cómo está montado el sistema y dónde encajan las piezas.
4. `DESIGN.md` — cómo se ve y se comporta la UI.
5. Sistema legado en `../gad_checa_gestion_cementerio/` — referencia
   funcional. **Es la fuente de verdad** sobre comportamiento de dominio
   hasta que la migración se cierre.

Si tras revisar todo lo anterior la respuesta sigue sin estar clara, **pregunta
al usuario** en vez de inventar.

---

## 1. Contexto del proyecto

- Es una **migración 1:1** de un sistema legado ASP.NET MVC + EF Core + SQL
  Server hacia **NestJS + Prisma + PostgreSQL** en el backend y **Next.js 15
  (App Router) + React 19** en el frontend.
- El cliente es el **GAD Parroquial de Checa** (Ecuador). El producto es un
  sistema de **gestión de cementerio** (catastro, contratos de arriendo,
  cobranza, reportes).
- La paridad funcional con el legado es **obligatoria**. Las mejoras se
  toleran cuando no rompen comportamiento existente.
- Idioma de UI y mensajes al usuario: **español de Ecuador**. Identificadores
  y comentarios en código: **inglés** (excepto nombres de dominio que ya
  existen en español: `Boveda`, `Difunto`, etc.).

---

## 2. Reglas no negociables

### 2.1 De dominio

- **Nunca borrar físicamente**. Eliminación lógica con `estado=false`,
  `usuarioEliminadorId`, `fechaEliminacion`.
- **Toda escritura es auditada**: rellena `usuarioCreadorId` o
  `usuarioActualizadorId` desde el contexto del request. Si te falta el
  usuario en el contexto, no inventes uno; pide aclarar.
- **Numeración secuencial** (`Contrato.numeroSecuencial`, `Pago.numeroRecibo`)
  usa secuencias PostgreSQL por año (ver `ARCHITECTURE.md` §3.7). Nunca
  `max()+1`.
- **Una bóveda tiene a lo sumo un contrato activo** salvo que estén
  relacionados (`contratoRelacionadoId`).
- **Las cuotas pueden pagarse en partes** (`CuotaPago`). `Cuota.pagada=true`
  sólo si la suma de pagos cubre `monto + intereses`.
- **Renovaciones encadenadas**: validar `vecesRenovado <
  Cementerio.VecesRenovacion[Bovedas|Nicho]` antes de crear la renovación.
- **Auditoría se aplica vía helper**: `applyAuditCreate(data, ctx)`,
  `applyAuditUpdate(data, ctx)` y `applyAuditDelete(ctx)` viven en
  `common/audit/`. **No** copiar manualmente `usuarioCreadorId` /
  `usuarioActualizadorId` / `usuarioEliminadorId` en cada `.create({ data })`
  o `.update({ data })`. El contexto `ctx: AuditContext` lo provee
  `AuditContextInterceptor` desde `req.auditContext`.

### 2.2 De código

- **TypeScript estricto**. Nada de `any` salvo en frontera con librerías sin
  tipos; en ese caso encapsula y tipa el wrapper.
- **DTOs validados**: `class-validator` en backend, `zod` en frontend en la
  frontera HTTP. Rechaza propiedades no declaradas.
- **Nunca `@Body() x: any`** en controllers. Toda entrada HTTP tiene un DTO
  en `dto/request/` con `class-validator`. Verificable en code review con
  `grep -rn '@Body() .*: any' backend/src/modules`.
- **Nunca retornar entidades Prisma desde controllers**. Toda respuesta
  pasa por un `<feature>.mapper.ts` que produce un DTO en `dto/response/`.
  Especialmente crítico para `Usuario` (no exponer `passwordHash`).
- **Sin lógica de dominio en controllers**. Los controllers orquestan; la
  lógica vive en services.
- **Controllers no acceden a `prisma.*` directamente**. Solo via service.
- **Repository pattern es opcional**: solo se crea `<feature>.repository.ts`
  cuando el service supera ~300 LOC o tiene ≥3 queries con `where` no
  triviales. Para CRUDs estables (Banco, Descuento, Rol, Cementerio) el
  service usa `prisma` directo. **No** introducir un repository por simetría.
- **Multi-tabla = transacción**: cualquier operación que escriba en ≥ 2
  tablas usa `prisma.$transaction`.
- **Sin SQL crudo** salvo (a) secuencias `nextval`, (b) `EXTENSION` /
  `CREATE SEQUENCE` idempotentes. Cualquier `$queryRawUnsafe` o
  `$executeRawUnsafe` debe ser revisado en PR.
- **Numeración secuencial** se obtiene siempre vía
  `YearSequenceService.next(prefix, year)` en `common/sequences/`.
  Prohibido `prisma.<X>.aggregate({ _max })` + `+1` para campos de numeración.
- **Endpoints destructivos y financieros** llevan `@Roles('Administrador')`
  u `@AdminOnly()` sin excepción: `DELETE /*`, `POST /pagos/:id/anular`,
  `POST /catastro/import`, `PUT /cementerio`, `PUT /gad-informacion`, todos
  los `PUT/PATCH /usuarios/*`.
- **`JwtAuthGuard` es global** (registrado en `app.module.ts` vía
  `APP_GUARD`). No repetir `@UseGuards(JwtAuthGuard)` en controllers; usar
  `@Public()` para excepciones.
- **Configuración backend**: en modules/services preferir `ConfigService`.
  Las lecturas directas de `process.env` que hoy existen quedan acotadas a
  bootstrap, middleware o helpers de frontera. No agregar nuevas lecturas
  directas en lógica de dominio sin necesidad clara.
- **Errores con mensajes en español** dirigidos al usuario final, no stack
  traces ni nombres de columna. `AllExceptionsFilter` preserva `errors[]`
  cuando vienen de `ValidationPipe` (no se reduce a string).
- **Logging**: usar `Logger` de Nest (`new Logger('Contexto').log(...)`).
  `console.log` está prohibido en código de producción.
- **Paginación obligatoria** en cualquier listado de dominio. Default `limit=15`,
  cap `limit=100`. Ver `common/dto/pagination.dto.ts`.

### 2.3 De producto

- **No** introduzcas dependencias UI nuevas (otra librería de componentes,
  otro framework CSS) sin discutir. La UI actual se escribe en **Tailwind**,
  reutilizando assets globales de Able Pro y usando **Tabler Icons** +
  **ApexCharts** (`DESIGN.md`).
- **No** rompas la URL ni el contenido visible de una pantalla migrada sólo
  por "refactor". Las pantallas migradas son el contrato visual con el GAD.
- **No** agregues features fuera del scope de la fase activa
  (`MIGRATION_PLAN.md`) en un mismo PR. Mejoras "obvias" se ofrecen como
  follow-up.

### 2.4 De git / repo

- El working tree muestra `D backend/prisma/schema.prisma`. **Restaúralo o
  recréalo** antes de modificar el modelo. Nunca crear migraciones contra un
  schema fantasma.
- No tocar `node_modules/`, `dist/`, `bun.lock` salvo cuando el cambio sea
  estrictamente requerido.
- Commits en **español**, modo imperativo, mensajes específicos
  (`fix: corregir cálculo de mora cuando la cuota tiene pagos parciales`).
- **Nunca** `git push --force`, `git reset --hard`, `git checkout -- .` ni
  `--no-verify` sin permiso explícito del usuario.

### 2.5 De colaboración (vigente desde 2026-05-14)

El proyecto tiene dos colaboradores activos: **@yanditv** (owner) y
**@Famiitry** (nuevo). Branch protection sobre `master` exige:

- **Nadie puede pushear directo a `master`** (ni los admins; `enforce_admins=true`).
- **Todo cambio entra vía PR** con al menos **1 approving review**.
- `CODEOWNERS` (`.github/CODEOWNERS`) auto-asigna a ambos como revisores.
- Cada colaborador trabaja en **su propia rama** por tarea:
  - Nombrado: `feat/<modulo>-<corto>`, `fix/<modulo>-<corto>`,
    `chore/<corto>`, `docs/<corto>`. Ejemplo: `feat/usuarios-listado`,
    `chore/famiitry-workflow`.
  - **Una rama = una tarea**. Si la tarea es Fase 7.1, la rama vive hasta
    que esa tarea se mergea.
  - `git pull --rebase origin master` antes de abrir el PR para que el diff
    sea limpio.
- **Antes de mergear un PR**, el autor debe actualizar:
  - `MIGRATION_PLAN.md` (marcar `[x]` y fecha en la sub-tarea cerrada).
  - `MIGRATION_STATUS.md` si la tarea cierra una brecha de paridad.
  - `CLAUDE.md` si la tarea introduce una decisión nueva (sección §3 o §2).
  - `REQUIREMENTS.md` si la tarea cubre un requerimiento marcado Pendiente.
- **Decisiones de arquitectura, secretos, migraciones de datos en
  producción** son responsabilidad exclusiva de **@yanditv**. Famiitry
  puede prepararlas en un PR pero no puede mergear sin aprobación de
  @yanditv.
- **Distribución de actividades vigente**: ver `MIGRATION_PLAN.md` §6
  "Distribución de actividades". Las tareas marcadas con `[IA]` están
  acotadas para que Famiitry use Claude / agentes con seguridad; las
  marcadas `[crítica]` quedan reservadas a @yanditv.

---

## 3. Cómo trabajar tareas comunes

### 3.1 Añadir un nuevo endpoint backend

1. Identifica el módulo (`backend/src/modules/<X>/`). Si no existe, créalo
   siguiendo §3.6 (estructura canónica con DTOs `request/`+`response/` y
   `mapper.ts`).
2. Define el DTO de entrada en `dto/request/` con `class-validator` y
   `@ApiProperty`. Si es listado, extiende `PaginationQueryDto`.
3. Define el DTO de salida en `dto/response/` con `@Expose`/`@Exclude` +
   `@ApiProperty`. **Nunca devuelvas la entidad Prisma cruda** — pásala
   por `<feature>.mapper.ts`.
4. Implementa la lógica en el service. Si toca ≥ 2 tablas, transacción.
   Para escrituras usa `applyAuditCreate` / `applyAuditUpdate` /
   `applyAuditDelete` desde `common/audit/`.
5. Expón en el controller. Decoradores requeridos:
   - `@ApiTags`, `@ApiOperation`, `@ApiResponse({ type: <Response>Dto })`.
   - `@Roles('Administrador')` u `@AdminOnly()` si es destructivo o
     financiero (`DELETE`, `*/anular`, `catastro/import`, etc.).
   - `@Public()` si es endpoint público (login, health).
   - **No** repitas `@UseGuards(JwtAuthGuard)` — es global.
6. Si registra escritura, recibe `@CurrentUser() user: AuthUser` y pásalo al
   service como `ctx`. Sin contexto de usuario, no inventes uno: pide
   aclarar.
7. Si el módulo es nuevo, regístralo en `app.module.ts`.

### 3.2 Añadir una pantalla frontend

1. Crea la ruta en `frontend/src/app/<X>/page.tsx`.
2. Marca `'use client'` sólo si necesitas hooks.
3. Usa el patrón actual del repo: encabezado inline (`h1` + subtítulo + CTA),
   card Tailwind (`rounded-xl border bg-white shadow-soft`), filtros inline,
   tabla propia y paginación inline para listados.
4. Formularios: usa `grid grid-cols-1 gap-6 lg:grid-cols-3` con formulario en
   `lg:col-span-2` y tarjeta lateral de ayuda/contexto.
5. Llama a la API de dominio vía `frontend/src/lib/api.ts`; reserva
   `fetch('/api/...')` para route handlers BFF / auth internos de Next.
6. Si la pantalla es protegida, asume el middleware de auth (`Fase 1` del
   plan). Mientras no exista, **no** generes endpoints públicos por
   conveniencia.

### 3.3 Cambiar el esquema de base de datos

1. Restaurar `backend/prisma/schema.prisma` si estuviera borrado.
2. Editar el modelo.
3. `cd backend && bun prisma migrate dev --name <descripcion-snake-case>`.
4. Actualizar `backend/src/bootstrap/seed.service.ts` si los datos semilla
   necesitan ajustarse.
5. Actualizar tipos compartidos en `frontend/src/types/` si la forma del
   recurso cambia.
6. Actualizar `REQUIREMENTS.md` §2.2 si se cierra una brecha listada.
7. Probar `bun run start:dev` desde cero.

> **Síntoma típico cuando olvidas aplicar la migración:** al arrancar el
> servidor obtienes `PrismaClientKnownRequestError P2022: The column X does
> not exist`. Significa que el cliente Prisma fue regenerado contra el
> nuevo schema pero la BD aún no tiene los `ALTER TABLE`. Solución:
> `bun prisma migrate deploy` (o `migrate dev` en local).
>
> **Tras `git pull`** cuando hay cambios de schema, siempre correr:
> ```
> cd backend && bun prisma migrate deploy && bun prisma generate
> ```

### 3.4 Generar un PDF nuevo

1. Crear `backend/src/modules/<modulo>/<modulo>.pdf.ts` o, si la generación
   queda mejor en el BFF, en `frontend/src/lib/<modulo>-pdf.ts`.
2. Usar `pdfkit`. Helpers compartidos en `backend/src/common/pdf/` (crear si
   no existe).
3. **Comparar visualmente** con el PDF legado equivalente en
   `../gad_checa_gestion_cementerio/Controllers/Pdf/`. Mantener la
   estructura: header con logo y datos del cementerio, cuerpo con cláusulas,
   firmas al pie.
4. Tamaño A4 vertical para contrato y recibos; A4 horizontal para reportes
   tabulares.

### 3.5 Migrar una vista Razor del legado

1. Localizar la vista (`../gad_checa_gestion_cementerio/Views/<X>/*.cshtml`).
2. Identificar la acción del controlador que la renderiza y los modelos que
   recibe.
3. Crear la página Next equivalente. Mantener:
   - Mismos labels y mensajes (copiar textos en español).
   - Mismas reglas de validación (`Required`, `StringLength`, etc.).
   - Mismo orden de campos y agrupación visual.
   - Misma paginación / filtros / acciones por fila.
4. Reemplazar partials (`_Modal*.cshtml`) por componentes React locales o
   compartidos en `components/` solo si el patrón ya se repite.
5. Reemplazar Razor helpers (`@Html.ActionLink`, `@Html.DropDownList`) por
   `<Link>`, `<select>`, `<input>` y composición Tailwind inline.
6. Confirmar paridad visual con la vista legada (mismo template Able Pro).

### 3.6 Crear un módulo nuevo en el backend

Estructura canónica (ver `ARCHITECTURE.md` §3.1):

```
backend/src/modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts        ← OPCIONAL (solo si service >300 LOC o
│                                     ≥3 queries con where no triviales)
├── <feature>.mapper.ts            ← Prisma → ResponseDto (oculta sensibles)
├── <feature>.pdf.ts               ← OPCIONAL (si genera PDF)
└── dto/
    ├── request/
    │   ├── create-<feature>.dto.ts
    │   ├── update-<feature>.dto.ts
    │   └── query-<feature>.dto.ts
    └── response/
        ├── <feature>.response.dto.ts
        └── <feature>-list-item.response.dto.ts (si difiere del detalle)
```

Pasos:

1. `nest g module/controller/service modules/<feature>` (o crear a mano).
2. Crear DTOs en `dto/request/` y `dto/response/`.
3. Crear `<feature>.mapper.ts` con `toResponse(entity): <Feature>ResponseDto`
   y `toListItem(entity)` cuando difiera.
4. Implementar service con `applyAuditCreate/Update/Delete`.
5. Si requiere configuración por env, añadir el namespace en `config/`.
6. Si crece (>300 LOC o ≥3 queries complejas), extraer
   `<feature>.repository.ts`. **No** hacerlo por anticipado.
7. Registrar el módulo en `app.module.ts`.
8. Documentar las rutas nuevas en `ARCHITECTURE.md` §6.1.

---

## 4. Comandos útiles

```bash
# DB local (PostgreSQL)
docker compose -f docker-compose.postgres.yml up -d

# Backend
cd backend
bun install
bun prisma migrate dev
bun run start:dev          # http://localhost:3001  +  /api/docs (Swagger)

# Frontend
cd frontend
bun install
bun run dev                # http://localhost:3000

# Lint
cd backend  && bun run lint
cd frontend && bun run lint

# Build (verificación de tipos antes de PR)
cd backend  && bun run build   # nest build
cd frontend && bun run build   # next build

# Prisma Studio
cd backend && bun prisma studio
```

---

## 5. Antes de cerrar una tarea

Checklist mínimo:

- [ ] La feature respeta la fase activa de `MIGRATION_PLAN.md`.
- [ ] Tests/manual repro del flujo descrito en `REQUIREMENTS.md`.
- [ ] DTOs validados; mensajes en español.
- [ ] Si escribe en BD: auditoría completa y eliminación lógica.
- [ ] Si afecta listado: paginación funcional.
- [ ] Swagger actualizado (decoradores en controller + DTO).
- [ ] Si cambia esquema: migración aplicada y `seed` revisado.
- [ ] Si cambia UI: alineado con `DESIGN.md` (Tailwind, tonos, iconos).
- [ ] Si cambia UI: con backend + frontend arriba, `cd frontend && bun run smoke`
  en verde. Abre cada pantalla en un Chromium real y atrapa errores de runtime
  (p. ej. `X.map is not a function`) que `next build` NO detecta. La pantalla
  nueva debe añadirse a la lista de rutas en `frontend/scripts/smoke.mjs` y
  estar enlazada en `components/Sidebar.tsx` para ser accesible.
- [ ] `bun run lint` limpio en el módulo tocado.
- [ ] `MIGRATION_STATUS.md` actualizado si cerraste un punto pendiente.

---

## 6. Cosas que NO debes hacer

- ❌ Introducir un ORM distinto (TypeORM, Drizzle). Prisma es la decisión.
- ❌ Cambiar a otro framework de PDF (no QuestPDF, no Puppeteer). Usar
  `pdfkit`.
- ❌ Eliminar registros con `prisma.X.delete(...)` cuando se trata de
  entidades de dominio (ver §2.1). Sólo para registros de pivot/auxiliares
  cuando se reasignan responsables, cuotas-pago, etc.
- ❌ Crear archivos `*.md` de progreso (TODOs, NOTES, IDEAS) en la raíz salvo
  que el usuario lo pida explícitamente.
- ❌ Saltar el wizard multi-paso de contratos con un "formulario único".
  El usuario final lo conoce paso a paso.
- ❌ Cambiar tonos del sistema de diseño (los seis canónicos: `primary`,
  `success`, `info`, `warning`, `danger`, `secondary`).
- ❌ Reintroducir clases Bootstrap (`btn`, `card`, `form-control`, `col-md-*`,
  `row`, `pc-*`, `d-flex`, `badge bg-*`, etc.) en cualquier archivo de la
  app. Todo el frontend está en **Tailwind puro** desde 2026-05-14. Si una
  pantalla nueva las usa, el cambio se rechaza en revisión.
- ❌ Hardcodear textos del cementerio (presidente, dirección, etc.). Vienen
  de `Cementerio` y `GADInformacion`.

> **Reversión de regla (2026-06-10, rama `feat/frontend-ux`).** Queda
> **permitido** y recomendado usar `frontend/src/components/ui/*` de nuevo. La
> prohibición anterior ("esos archivos fueron eliminados, no importar wrappers")
> **se revierte**: se reintroduce `components/ui/` como **librería curada,
> tipada y accesible en Tailwind puro** (no son los wrappers viejos basados en
> Bootstrap). Guía de uso:
>
> - Compón la UI nueva con los componentes de `components/ui/` (`Button`,
>   `Field`, `Select`, `Badge`, `Avatar`, `Card`, `PageHeader`, `DataTable`,
>   `Pagination`, `Modal`, `EmptyState`, `Toast`, …). Catálogo y contrato de
>   props en `DESIGN.md` §6.
> - **Tailwind puro** dentro de los componentes: prohibido Bootstrap
>   (`btn`, `card`, `form-control`, `col-*`, `pc-*`, `badge bg-*`).
> - Tipados (TS estricto), accesibles (`focus-visible`, `aria-*`, estados
>   loading/empty/error) y construidos sobre los tokens de `DESIGN.md` §3
>   (los seis tonos, sombras en capas, radios `xl`, Inter).
> - Si un patrón se repite 3+ veces y no existe en la librería, **créalo en
>   `components/ui/`** en vez de duplicar Tailwind inline. No lo hagas por
>   anticipado: extrae cuando el patrón ya se repite.
> - Tokens nuevos van en `tailwind.config.js` y se documentan en `DESIGN.md`
>   §3 en el mismo PR.

---

## 7. Cosas que SÍ debes hacer

- ✅ Leer la sección correspondiente del **manual de usuario legado**
  (`../gad_checa_gestion_cementerio/Manual_Usuario_Sistema_Cementerio.md`)
  antes de migrar un módulo.
- ✅ Reproducir el comportamiento del legado **incluyendo bordes**: orden de
  fechas, mensajes de validación, qué muestra una tabla vacía.
- ✅ Cuando la migración exija una decisión técnica nueva, registrarla en
  `MIGRATION_PLAN.md` §3 (decisiones cerradas) en el mismo PR.
- ✅ Reutilizar los componentes de `components/ui/` (y los patrones Tailwind
  del repo) antes de escribir UI nueva a mano. Ver `DESIGN.md` §6.
- ✅ Reportar al usuario, al cerrar, qué quedó cubierto y qué queda
  pendiente, citando los IDs de requerimiento (`CONTRA-R8`, `DASH-R4`, ...).

---

## 8. Mapa rápido del repositorio

```
new-migration/
├── ARCHITECTURE.md         # cómo está montado el sistema
├── CLAUDE.md               # este archivo
├── DESIGN.md               # sistema de diseño visual
├── MIGRATION_PLAN.md       # plan por fases
├── MIGRATION_STATUS.md     # matriz de paridad viva (en ../)
├── REQUIREMENTS.md         # requerimientos funcionales / NF
├── docker-compose.postgres.yml
├── backend/                # NestJS
│   ├── prisma/schema.prisma
│   └── src/{main.ts, app.module.ts, modules/, common/, bootstrap/}
└── frontend/               # Next.js
    └── src/{app/, components/, lib/, types/}
```

---

## 9. Cuando dudes

Si una operación que vas a realizar es **destructiva, irreversible o
visible para el usuario final** (borrar branches, eliminar tablas, force
push, cambiar URLs públicas, modificar PDFs ya entregados, anular pagos
históricos), **pregunta al usuario antes de actuar**.

Si una decisión técnica tiene impacto en más de un módulo o cambia una
regla descrita en este archivo, propón la decisión, espera aprobación, y
actualiza tanto este archivo como `MIGRATION_PLAN.md` §3 en el mismo PR.

Lema: **paridad primero, mejora después, destrucción nunca**.
