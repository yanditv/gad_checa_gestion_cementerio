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

### 2.2 De código

- **TypeScript estricto**. Nada de `any` salvo en frontera con librerías sin
  tipos; en ese caso encapsula y tipa el wrapper.
- **DTOs validados**: `class-validator` en backend, `zod` en frontend en la
  frontera HTTP. Rechaza propiedades no declaradas.
- **Sin lógica de dominio en controllers**. Los controllers orquestan; la
  lógica vive en services.
- **Multi-tabla = transacción**: cualquier operación que escriba en ≥ 2
  tablas usa `prisma.$transaction`.
- **Sin SQL crudo** salvo (a) secuencias `nextval`, (b) `EXTENSION` /
  `CREATE SEQUENCE` idempotentes. Cualquier `$queryRawUnsafe` o
  `$executeRawUnsafe` debe ser revisado en PR.
- **Errores con mensajes en español** dirigidos al usuario final, no stack
  traces ni nombres de columna.
- **Paginación obligatoria** en cualquier listado de dominio. Default `limit=15`,
  cap `limit=100`. Ver `common/dto/pagination.dto.ts`.

### 2.3 De producto

- **No** introduzcas dependencias UI nuevas (otra librería de componentes,
  otro framework CSS) sin discutir. La pila visible es Bootstrap (Able Pro) +
  Tabler Icons + ApexCharts (`DESIGN.md`).
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

---

## 3. Cómo trabajar tareas comunes

### 3.1 Añadir un nuevo endpoint backend

1. Identifica el módulo (`backend/src/modules/<X>/`). Si no existe, créalo
   con `nest g module/controller/service` (o a mano).
2. Define el DTO de entrada en `dto/` con `class-validator` y `@ApiProperty`.
3. Implementa la lógica en el service. Si toca ≥ 2 tablas, transacción.
4. Expón en el controller con guards (`JwtAuthGuard`, `@Roles(...)` si
   aplica) y decoradores Swagger.
5. Si devuelve listado, recibe `PaginationDto` (o subclase).
6. Si registra escritura, rellena auditoría con el `req.user.id`.
7. Si el endpoint es público (login, health), marca `@Public()`.
8. **No** te olvides de exportar el módulo en `app.module.ts` cuando sea
   nuevo.

### 3.2 Añadir una pantalla frontend

1. Crea la ruta en `frontend/src/app/<X>/page.tsx`.
2. Marca `'use client'` sólo si necesitas hooks.
3. Empieza con `<PageHeader>`, sigue con `<div className="card">` (Bootstrap),
   `<SearchFilters>`, `<DataGrid>`, `<PaginationNav>` para listados.
4. Formularios: usa el patrón col-md-8 + col-md-4 (form + tarjeta de ayuda).
5. Llama a la API vía `frontend/src/lib/api.ts` (no `fetch` suelto).
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
4. Reemplazar partials (`_Modal*.cshtml`) por componentes React en
   `components/ui/` o locales a la página si son únicos.
5. Reemplazar Razor helpers (`@Html.ActionLink`, `@Html.DropDownList`) por
   `<Link>`, `<SelectInput>`, etc.
6. Confirmar paridad visual con la vista legada (mismo template Able Pro).

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
- [ ] Si cambia UI: alineado con `DESIGN.md` (wrappers, tonos, iconos).
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
- ❌ Mezclar Tailwind y Bootstrap en el mismo componente.
- ❌ Hardcodear textos del cementerio (presidente, dirección, etc.). Vienen
  de `Cementerio` y `GADInformacion`.

---

## 7. Cosas que SÍ debes hacer

- ✅ Leer la sección correspondiente del **manual de usuario legado**
  (`../gad_checa_gestion_cementerio/Manual_Usuario_Sistema_Cementerio.md`)
  antes de migrar un módulo.
- ✅ Reproducir el comportamiento del legado **incluyendo bordes**: orden de
  fechas, mensajes de validación, qué muestra una tabla vacía.
- ✅ Cuando la migración exija una decisión técnica nueva, registrarla en
  `MIGRATION_PLAN.md` §3 (decisiones cerradas) en el mismo PR.
- ✅ Usar los wrappers UI antes de escribir Bootstrap a mano.
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
