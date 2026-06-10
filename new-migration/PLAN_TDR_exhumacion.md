# Plan de implementación — Registro de Exhumación / Traslado (CAT-R4b…R4d)

> Deriva de `REQUIREMENTS_TDR_ElValle.md` §2 (Módulo 2 — Catastro). Cubre el acto
> administrativo de exhumación (retiro de restos) y traslado, como **extensión
> del dominio `Difunto`** (no es un módulo nuevo). Vive en `modules/difunto/`.

## Realidades del repo que este plan respeta (verificadas en código)

- **No existen** `common/audit/` ni `common/sequences/` (pese a lo que dice
  `CLAUDE.md §2.1/§3.1`). La auditoría se hace **manual**: `userId` desde
  `@CurrentUser()` + asignación directa de `usuarioCreadorId/Actualizador/Eliminador`
  (como en `difunto.service.ts`). La numeración secuencial se genera con
  `findFirst({ orderBy: desc })` + parse dentro de `$transaction` (como
  `contrato.service.ts`).
- El módulo `difunto` es más simple que la estructura canónica: un solo
  `dto/difunto.dto.ts`, sin mapper, sin repository. Se mantiene esa simetría.
- La **ocupación de bóveda se calcula**, no se almacena: helper
  `clasificarEstadoBoveda()` (`modules/report/report.helpers.ts:42`, basado en
  contratos) y conteo de difuntos activos (`difunto.service.findByBoveda`).

## Decisiones de diseño

| # | Decisión | Resolución |
|---|----------|-----------|
| D1 | ¿Histórico o solo campos en `Difunto`? | **Tabla nueva `Exhumacion`** (1 difunto → N eventos). Da trazabilidad y acta numerada. |
| D2 | ¿Cómo se libera la plaza (CAT-R4c)? | Flag **`Difunto.exhumado`** + `fechaExhumacion`. Las consultas de ocupación excluyen `exhumado:true`. **No** se usa `estado=false` (eso es borrado lógico). |
| D3 | Traslado interno | Registro `Exhumacion` (motivo=`traslado`) + reasignar `Difunto.bovedaId` + nueva `fechaInhumacion`, en una transacción. |
| D4 | Nº de acta | `EXH-YYYY-NNNN`, patrón atómico existente. |
| D5 | Header del acta PDF | Datos del cementerio desde `Cementerio`/`GADInformacion` (no hardcodear "Checa"; esto va para El Valle). |

> ⚠️ D1/D2 implican **migración Prisma** → tarea **[crítica] reservada a @yanditv**
> (`CLAUDE.md §2.5`). Se puede preparar en PR; el merge lo aprueba @yanditv.

## Fase 1 — Modelo de datos `[crítica @yanditv]`

`backend/prisma/schema.prisma`:

1. `model Difunto`: añadir `exhumado Boolean @default(false)`, `fechaExhumacion DateTime?`, `exhumaciones Exhumacion[]`.
2. `model Boveda`: añadir inversa `exhumaciones Exhumacion[]`.
3. Nuevo modelo:
   ```prisma
   model Exhumacion {
     id                 Int      @id @default(autoincrement())
     numeroActa         String   @unique          // EXH-YYYY-NNNN
     difuntoId          Int
     difunto            Difunto  @relation(fields: [difuntoId], references: [id])
     bovedaOrigenId     Int
     bovedaOrigen       Boveda   @relation(fields: [bovedaOrigenId], references: [id])
     fechaExhumacion    DateTime
     motivo             String   // vencimiento_arriendo | traslado | orden_judicial | osario_comun | otro
     destino            String
     bovedaDestinoId    Int?
     numeroAutorizacion String?
     entidadAutorizante String?
     observaciones      String?
     estado             Boolean  @default(true)
     fechaCreacion      DateTime @default(now())
     usuarioCreadorId      String?
     usuarioActualizadorId String?
     usuarioEliminadorId   String?
   }
   ```
4. `cd backend && bun prisma migrate dev --name add_exhumacion`. Revisar `seed.service.ts` (sin datos semilla nuevos).

## Fase 2 — Backend: lógica y endpoints

Todo dentro de `modules/difunto/` (no tocar `app.module.ts`).

- `dto/exhumacion.dto.ts`: `CreateExhumacionDto` (`difuntoId!`, `fechaExhumacion!`, `motivo!`, `destino!`, `bovedaDestinoId?`, `numeroAutorizacion?`, `entidadAutorizante?`, `observaciones?`) con `class-validator` + `@ApiProperty`; `QueryExhumacionDto extends PaginationQueryDto` (`desde?`, `hasta?`, `bovedaId?`, `motivo?`).
- `exhumacion.service.ts`:
  - `registrar(dto, userId)` — `$transaction`: valida difunto activo y no exhumado; si traslado valida bóveda destino disponible (capacidad vs difuntos activos no exhumados); genera `numeroActa` atómico; crea `Exhumacion`; marca `Difunto.exhumado=true`+`fechaExhumacion`; si traslado reasigna `bovedaId`, `exhumado=false`, nueva `fechaInhumacion`.
  - `findAll(query)` paginado (`$transaction([findMany, count])`); `findOne(id)`; `findByBoveda(bovedaId)`; `anular(id, userId)` (borrado lógico + reversión, transacción).
- `exhumacion.controller.ts` (`@Controller('exhumaciones')`):

  | Verbo | Ruta | Roles |
  |------|------|-------|
  | POST | `/exhumaciones` | `@Roles('Administrador')` |
  | GET | `/exhumaciones` | — |
  | GET | `/exhumaciones/:id` | — |
  | GET | `/exhumaciones/boveda/:bovedaId` | — |
  | GET | `/exhumaciones/:id/pdf` | — |
  | POST | `/exhumaciones/:id/anular` | `@Roles('Administrador')` |

  Decoradores Swagger + `@CurrentUser()` en escrituras. Registrar en `difunto.module.ts`.

## Fase 3 — Integración con disponibilidad (CAT-R4c)

- `findByBoveda` y conteos de ocupación → añadir `exhumado:false` al `where`.
- La exhumación **no** cancela el contrato automáticamente (desacoplado en este alcance). Regla: exhumar por vencimiento cuando el contrato ya está vencido/inactivo. Acoplar exhumación↔contrato = follow-up.

## Fase 4 — Acta PDF (CAT-R4d)

`modules/difunto/exhumacion.pdf.ts` con `pdfkit` + helpers de `modules/report/pdf/common.ts` (`streamPdf`, `drawHeader`, `drawFooter`). A4 vertical, estilo acta (modelo: `frontend/src/lib/contrato-pdf.ts`). Header parametrizado (D5). Cuerpo: nº acta, fecha, difunto, bóveda origen, motivo, destino, autorización, observaciones. Pie con firmas. Endpoint retorna `StreamableFile`.

## Fase 5 — Historial y reporte exportable (CAT-R4d / REP-R2)

Patrón de `modules/report`: `GET /reportes/exhumaciones` (`DateRangeDto` + `motivo?`, `bovedaId?`) con variantes `/pdf` (`drawTable`) y `/excel`, más CSV para cubrir los 3 formatos.

## Fase 6 — Frontend

- `frontend/src/app/difuntos/[id]/page.tsx`: botón "Registrar exhumación/traslado" (rol Administrador) → form (fecha, motivo select, destino, bóveda destino si traslado, autorización, entidad, observaciones); badge "Exhumado"; bloque historial con descarga de acta.
- Opcional `frontend/src/app/exhumaciones/page.tsx` (listado global + filtros + export). Tailwind puro (sin Bootstrap ni `components/ui/*`, `CLAUDE.md §6`). API vía `lib/api.ts`.

## Fase 7 — Cierre

Marcar CAT-R4b…R4d en `REQUIREMENTS_TDR_ElValle.md`; documentar `Exhumacion` en diccionario de datos; sección de manual; `lint`+`build` limpios; PR `feat/difunto-exhumacion`.

## Riesgos

1. Acoplamiento exhumación↔contrato: desacoplado por ahora (follow-up).
2. Reversión de traslado: usa `bovedaOrigenId` guardado.
3. `drawHeader` hardcodea "Checa": parametrizarlo toca un helper compartido por otros PDFs → regresión-probar reportes.

## Esfuerzo: ~5–6 días

| Fase | Tamaño |
|------|--------|
| 1 Modelo+migración | S `[crítica @yanditv]` |
| 2 Backend | M |
| 3 Disponibilidad | S |
| 4 PDF acta | M |
| 5 Reporte/export | M |
| 6 Frontend | M |
| 7 Docs | S |
