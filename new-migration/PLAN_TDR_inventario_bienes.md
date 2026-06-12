# Plan de implementación — Módulo 1: Inventario de Bienes Institucionales (INV-R1…R10)

> Deriva de `REQUIREMENTS_TDR_ElValle.md` §1. Es la **mayor brecha del TDR**: el
> sistema de Checa **no tiene** ningún concepto de bienes, custodios ni
> depreciación. Se construye como **módulo nuevo completo**, anclado a las Normas
> de Control Interno CGE **406-01** (Propiedad, Planta y Equipo) y **406-03**
> (depreciación de bienes de larga duración).

## Realidades del repo que este plan respeta (verificadas en código)

- **Auditoría manual**: no existe `common/audit/`; se asigna `userId` desde
  `@CurrentUser()` a `usuarioCreadorId/Actualizador/Eliminador` (patrón de
  `difunto.service.ts`).
- **Numeración secuencial**: no existe `common/sequences/`; se genera con
  `findFirst({ orderBy: desc })` + parse dentro de `$transaction` (patrón de
  `contrato.service.ts`). Aplica al código/placa correlativo del bien si se desea.
- **Paginación**: `common/dto/pagination.dto.ts` (default 15, cap 100).
- **PDF**: `pdfkit` + helpers `modules/report/pdf/common.ts` (`streamPdf`,
  `drawHeader`, `drawFooter`, `drawTable`).
- **Excel**: patrón `modules/report/excel/`.
- **Sin enums en el schema**: los "tipos/estados" son `String`/`Boolean` por
  convención (se documentan los valores válidos en el DTO).
- Estructura canónica de módulo: `CLAUDE.md §3.6` (con `mapper.ts` y
  `dto/request|response/`, ya que este módulo es grande → sí usa mapper y, muy
  probablemente, repository).

## Decisiones de diseño

| # | Decisión | Resolución propuesta |
|---|----------|----------------------|
| D1 | ¿Un módulo o varios? | **Un módulo `inventario`** con sub-recursos: `bienes`, `categorias`, `custodios`. La depreciación es un service interno. |
| D2 | Método de depreciación | **Línea recta CGE 406-03**: `depreciaciónAnual = (valorAdquisición − valorResidual) / vidaÚtilAños`. Cálculo mensual = anual/12. Valor en libros nunca baja del valor residual. |
| D3 | Valor residual | Por defecto **10 %** del valor de adquisición (uso común sector público EC), **configurable por categoría**. |
| D4 | Custodio | Entidad propia `Custodio` (funcionario: nombre, identificación, cargo). **No** se reutiliza `Persona` del cementerio para no acoplar dominios distintos. |
| D5 | Historial (INV-R8) | Tabla única `MovimientoBien` que unifica alta, baja, reasignación de custodio, cambio de ubicación y depreciación. |
| D6 | Baja (INV-R6) | **Lógica**: flag en `Bien` (`dadoDeBaja`, `fechaBaja`, `motivoBaja`) + registro `MovimientoBien` tipo `baja`. Nunca borrado físico. |
| D7 | Código de bien | `codigo` único (placa institucional). Si el GAD no trae placas, autogenerar `BN-YYYY-NNNN` con el patrón atómico. |

> ⚠️ Las migraciones Prisma (Fase 1) son **[crítica] reservadas a @yanditv**
> (`CLAUDE.md §2.5`). Se preparan en PR; el merge lo aprueba @yanditv.

---

## Fase 1 — Modelo de datos `[crítica @yanditv]`

`backend/prisma/schema.prisma` — cinco modelos nuevos:

```prisma
model CategoriaBien {
  id                  Int     @id @default(autoincrement())
  nombre              String                       // "Equipo informático", "Mueble"...
  vidaUtilAnios       Int                          // tabla CGE 406-03
  valorResidualPct    Decimal @db.Decimal(5,2) @default(10)
  estado              Boolean @default(true)
  bienes              Bien[]
  // auditoría
}

model Custodio {
  id                  Int     @id @default(autoincrement())
  nombre              String
  identificacion      String?
  cargo               String?
  estado              Boolean @default(true)
  bienes              Bien[]
  // auditoría
}

model Bien {
  id                  Int      @id @default(autoincrement())
  codigo              String   @unique             // placa BN-YYYY-NNNN
  descripcion         String
  marca               String?
  modelo              String?
  serie               String?
  fechaAdquisicion    DateTime
  valorAdquisicion    Decimal  @db.Decimal(18,2)
  fuenteFinanciamiento String?
  estadoConservacion  String   @default("bueno")   // bueno | regular | malo
  ubicacion           String?                      // dependencia/oficina actual
  // depreciación (overrides opcionales sobre la categoría)
  valorResidual       Decimal? @db.Decimal(18,2)
  vidaUtilMesesOverride Int?
  // baja lógica de uso (distinta de `estado`)
  dadoDeBaja          Boolean  @default(false)
  fechaBaja           DateTime?
  motivoBaja          String?                      // obsolescencia | robo | venta | donacion | otro
  // relaciones
  categoriaId         Int
  categoria           CategoriaBien @relation(fields:[categoriaId], references:[id])
  custodioId          Int?
  custodio            Custodio? @relation(fields:[custodioId], references:[id])
  movimientos         MovimientoBien[]
  depreciaciones      DepreciacionBien[]
  estado              Boolean  @default(true)       // borrado lógico
  fechaCreacion       DateTime @default(now())
  // auditoría usuarioCreador/Actualizador/Eliminador
}

model MovimientoBien {
  id                  Int      @id @default(autoincrement())
  bienId              Int
  bien                Bien     @relation(fields:[bienId], references:[id])
  tipo                String   // alta | baja | reasignacion_custodio | cambio_ubicacion | depreciacion
  fecha               DateTime @default(now())
  detalle             String?
  custodioAnteriorId  Int?
  custodioNuevoId     Int?
  ubicacionAnterior   String?
  ubicacionNueva      String?
  documento           String?  // path de respaldo (acta)
  usuarioCreadorId    String?
}

model DepreciacionBien {
  id                  Int      @id @default(autoincrement())
  bienId              Int
  bien                Bien     @relation(fields:[bienId], references:[id])
  anio                Int
  mes                 Int
  valorDepreciado     Decimal  @db.Decimal(18,2)   // del periodo
  depreciacionAcumulada Decimal @db.Decimal(18,2)
  valorEnLibros       Decimal  @db.Decimal(18,2)
  fechaCalculo        DateTime @default(now())
  @@unique([bienId, anio, mes])
}
```

`cd backend && bun prisma migrate dev --name add_inventario_bienes`.
Actualizar `seed.service.ts` con el **catálogo CGE de categorías** (vidas útiles):
muebles y enseres 10, maquinaria y equipo 10, equipo de cómputo 3, vehículos 5,
equipo de comunicación 10, herramientas 10 (confirmar tabla con el GAD).

---

## Fase 2 — Catálogos (CRUD simple)

Estructura canónica `modules/inventario/`. CRUD de:
- `categorias/` — `CategoriaBienController/Service`, DTOs request/response, mapper.
- `custodios/` — `CustodioController/Service`, DTOs, mapper.

CRUDs estables → service usa `prisma` directo (sin repository, `CLAUDE.md §2.2`).
Listados paginados. Escrituras auditadas (manual). `DELETE` → `@Roles('Administrador')`.

---

## Fase 3 — Bienes: registro, alta y listado (INV-R1, R5, R9)

- `bien.service.ts` + `bien.repository.ts` (probable, >300 LOC y filtros múltiples).
- `bien.mapper.ts` → `BienResponseDto` / `BienListItemDto` (oculta nada sensible pero unifica forma).
- `POST /inventario/bienes` (alta): valida categoría/custodio, genera `codigo` si falta (patrón atómico), crea `Bien` + `MovimientoBien` tipo `alta` en `$transaction`. `@CurrentUser()`.
- `GET /inventario/bienes` (INV-R9): paginado + búsqueda (`codigo`, `descripcion`, `serie`) + filtros (`categoriaId`, `custodioId`, `ubicacion`, `dadoDeBaja`).
- `GET /inventario/bienes/:id`: ficha con categoría, custodio, último valor en libros.
- `PUT /inventario/bienes/:id`: edición de datos (no de baja ni reasignación, que tienen endpoints propios).

---

## Fase 4 — Custodios, ubicación e historial (INV-R3, R4, R8)

- `POST /inventario/bienes/:id/reasignar-custodio` `{ custodioId, fecha, detalle }`: `$transaction` actualiza `Bien.custodioId` + crea `MovimientoBien` tipo `reasignacion_custodio` (guarda `custodioAnterior/Nuevo`).
- `POST /inventario/bienes/:id/mover` `{ ubicacion, fecha, detalle }`: idem con `cambio_ubicacion`.
- `GET /inventario/bienes/:id/historial` (INV-R8): cronología unificada desde `MovimientoBien` + `DepreciacionBien`, ordenada por fecha.

---

## Fase 5 — Baja de bienes (INV-R6) `[financiero/destructivo]`

- `POST /inventario/bienes/:id/baja` `{ motivo, fecha, documento?, autorizacion? }` → **`@Roles('Administrador')`**: `$transaction` marca `dadoDeBaja=true`, `fechaBaja`, `motivoBaja` + `MovimientoBien` tipo `baja`. Nunca borra físico.
- `POST /inventario/bienes/:id/reactivar` (revertir baja por error) → Administrador.

---

## Fase 6 — Motor de depreciación (INV-R7) `[financiero]`

- `depreciacion.service.ts`:
  - `calcularValorEnLibros(bien, fechaCorte)`: línea recta CGE.
    - `vidaUtilMeses = override ?? categoria.vidaUtilAnios*12`
    - `valorResidual = bien.valorResidual ?? valorAdquisicion * categoria.valorResidualPct/100`
    - `deprecMensual = (valorAdquisicion − valorResidual) / vidaUtilMeses`
    - `mesesTranscurridos = min(mesesEntre(fechaAdquisicion, fechaCorte), vidaUtilMeses)`
    - `depreciacionAcumulada = deprecMensual * mesesTranscurridos`
    - `valorEnLibros = max(valorAdquisicion − depreciacionAcumulada, valorResidual)`
  - `recalcularPeriodo(anio, mes, userId)`: recorre bienes activos no dados de baja, **upsert** `DepreciacionBien` por `(bienId, anio, mes)`, registra `MovimientoBien` tipo `depreciacion`. `$transaction` por lotes.
- Endpoint `POST /inventario/depreciacion/recalcular` `{ anio, mes }` → **`@Roles('Administrador')`**.
- `GET /inventario/bienes/:id/depreciacion`: tabla de depreciación del bien.
- **Garantía §10.1 del TDR**: exactitud de cálculo → cubrir con pruebas unitarias del motor (casos: bien nuevo, a mitad de vida útil, totalmente depreciado, con override de residual).

---

## Fase 7 — Reportes y exportación (INV-R10 / Módulo 4, REP-R2)

Patrón `modules/report` (o sub-rutas en inventario):
- Inventario **por custodio**, **por ubicación**, **por categoría**.
- **Reporte de depreciación** a fecha de corte (acumulada + valor en libros).
- **Acta de entrega-recepción de bienes** (PDF A4, header del cementerio/GAD parametrizado, lista de bienes, firmas custodio entrante/saliente).
- Cada reporte exporta **PDF + XLSX + CSV** (REP-R2). PDF con `drawTable`; Excel con patrón `report/excel`; CSV simple.

---

## Fase 8 — Frontend

Rutas Next (Tailwind puro, sin Bootstrap ni `components/ui/*`, `CLAUDE.md §6`; API vía `lib/api.ts`):
- `app/inventario/categorias/` y `app/inventario/custodios/` — catálogos.
- `app/inventario/bienes/` — listado con filtros (INV-R9).
- `app/inventario/bienes/nuevo/` — alta.
- `app/inventario/bienes/[id]/` — ficha: datos, valor en libros, custodio/ubicación actuales, **historial** (INV-R8), acciones (reasignar, mover, dar de baja).
- `app/inventario/depreciacion/` — recálculo por periodo + tabla.
- `app/inventario/reportes/` — generación y descarga (PDF/XLSX/CSV).
- Tipos compartidos en `frontend/src/types/`.

---

## Fase 9 — Migración de datos (GEN-R8) `[crítica @yanditv]`

El TDR (§6 entregable nº2, §10) obliga a **cargar y verificar** el inventario
existente del GAD. Replicar el patrón de `catastro.importer.ts`:
- `inventario.importer.ts` que lea el Excel de bienes del GAD El Valle,
  mapee a `CategoriaBien`/`Custodio`/`Bien`, valide y reporte filas con error.
- Endpoint `POST /inventario/import` → **`@Roles('Administrador')`** + vista de
  estado de última importación (como Fase 9.3 del catastro).

> El relevamiento físico de los bienes (Semana 1–2 del cronograma TDR) es
> responsabilidad del contratista; este importer es la herramienta de carga.

---

## Fase 10 — Cierre y documentación

- Marcar INV-R1…R10 en `REQUIREMENTS_TDR_ElValle.md`.
- Documentar los 5 modelos en el **diccionario de datos** (entregable §6 nº5).
- Sección de **manual de usuario** del módulo de inventario.
- Registrar el módulo en `app.module.ts` y rutas en `ARCHITECTURE.md §6.1`.
- `bun run lint` + `bun run build` (back y front) limpios.
- PRs por fase en ramas `feat/inventario-*` (una rama = una tarea, `CLAUDE.md §2.5`).

---

## Riesgos / decisiones abiertas

1. **Tabla CGE de vidas útiles y % residual**: confirmar con el GAD El Valle /
   Contraloría antes de sembrar el catálogo. Default propuesto en Fase 1.
2. **Reutilizar `report` vs. reportes propios**: decidir si los reportes de bienes
   viven en `modules/report` (consistencia) o en `modules/inventario` (cohesión).
3. **Custodio = `Persona` o entidad propia**: plan propone entidad propia (D4);
   revisar si el GAD quiere un único catálogo de personas.
4. **`drawHeader` hardcodea "GAD Parroquial de Checa"**: parametrizar para El Valle
   (compartido con el plan de exhumación).
5. **Depreciación de bienes ya parcialmente depreciados al migrar**: el importer
   debe aceptar `fechaAdquisicion` real para que el motor calcule el acumulado
   correcto; verificar que el Excel del GAD traiga esa fecha.

## Esfuerzo estimado

| Fase | Tamaño |
|------|--------|
| 1 Modelo + migración | M `[crítica @yanditv]` |
| 2 Catálogos | M |
| 3 Bienes CRUD | M–L |
| 4 Custodio/ubicación/historial | M |
| 5 Baja | S |
| 6 Motor depreciación | M–L (con pruebas) |
| 7 Reportes/export | L |
| 8 Frontend | L |
| 9 Importer de datos | M `[crítica @yanditv]` |
| 10 Docs/cierre | S |
| **Total** | **~3–4 semanas** (es el grueso del contrato de 30 días) |
