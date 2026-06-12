-- AlterTable
ALTER TABLE "Boveda" ADD COLUMN     "tipoEspacioId" INTEGER;

-- CreateTable
CREATE TABLE "TipoEspacio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "prefijoNumeracion" TEXT,
    "tarifaArriendo" DECIMAL(18,2) NOT NULL,
    "aniosArriendo" INTEGER NOT NULL,
    "vecesRenovacion" INTEGER NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3),
    "fechaEliminacion" TIMESTAMP(3),
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "TipoEspacio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoEspacio_nombre_key" ON "TipoEspacio"("nombre");

-- AddForeignKey
ALTER TABLE "Boveda" ADD CONSTRAINT "Boveda_tipoEspacioId_fkey" FOREIGN KEY ("tipoEspacioId") REFERENCES "TipoEspacio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoEspacio" ADD CONSTRAINT "TipoEspacio_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoEspacio" ADD CONSTRAINT "TipoEspacio_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoEspacio" ADD CONSTRAINT "TipoEspacio_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- BACKFILL (aditivo, idempotente). NO elimina columnas existentes:
-- las 6 columnas de "Cementerio" y "Boveda"."tipo" se conservan; su DROP es un
-- paso manual posterior a cargo de @yanditv.
-- =============================================================================

-- 1) Sembrar "Bóveda" y "Nicho" con los valores actuales del Cementerio id=1.
--    Si no existe Cementerio id=1, se usan valores por defecto razonables.
INSERT INTO "TipoEspacio" ("nombre", "prefijoNumeracion", "tarifaArriendo", "aniosArriendo", "vecesRenovacion", "estado")
SELECT 'Bóveda', 'CTR',
       COALESCE((SELECT "tarifaArriendo" FROM "Cementerio" WHERE "id" = 1), 0),
       COALESCE((SELECT "aniosArriendoBovedas" FROM "Cementerio" WHERE "id" = 1), 5),
       COALESCE((SELECT "vecesRenovacionBovedas" FROM "Cementerio" WHERE "id" = 1), 1),
       true
WHERE NOT EXISTS (SELECT 1 FROM "TipoEspacio" WHERE "nombre" = 'Bóveda');

INSERT INTO "TipoEspacio" ("nombre", "prefijoNumeracion", "tarifaArriendo", "aniosArriendo", "vecesRenovacion", "estado")
SELECT 'Nicho', 'NCH',
       COALESCE((SELECT "tarifaArriendoNicho" FROM "Cementerio" WHERE "id" = 1), 0),
       COALESCE((SELECT "aniosArriendoNicho" FROM "Cementerio" WHERE "id" = 1), 5),
       COALESCE((SELECT "vecesRenovacionNicho" FROM "Cementerio" WHERE "id" = 1), 1),
       true
WHERE NOT EXISTS (SELECT 1 FROM "TipoEspacio" WHERE "nombre" = 'Nicho');

-- 2) Crear "Túmulo" solo si hay bóvedas cuyo "tipo" lo refiera (toma valores de Bóveda).
INSERT INTO "TipoEspacio" ("nombre", "prefijoNumeracion", "tarifaArriendo", "aniosArriendo", "vecesRenovacion", "estado")
SELECT 'Túmulo', 'TML',
       COALESCE((SELECT "tarifaArriendo" FROM "Cementerio" WHERE "id" = 1), 0),
       COALESCE((SELECT "aniosArriendoBovedas" FROM "Cementerio" WHERE "id" = 1), 5),
       COALESCE((SELECT "vecesRenovacionBovedas" FROM "Cementerio" WHERE "id" = 1), 1),
       true
WHERE EXISTS (SELECT 1 FROM "Boveda" WHERE lower("tipo") LIKE '%tumulo%' OR lower("tipo") LIKE '%túmulo%')
  AND NOT EXISTS (SELECT 1 FROM "TipoEspacio" WHERE "nombre" = 'Túmulo');

-- 3) Mapear Boveda.tipo (string libre) -> FK tipoEspacioId.
--    Solo filas aún sin tipo asignado (idempotente).
UPDATE "Boveda" SET "tipoEspacioId" = (SELECT "id" FROM "TipoEspacio" WHERE "nombre" = 'Nicho')
WHERE "tipoEspacioId" IS NULL AND lower("tipo") LIKE '%nicho%';

UPDATE "Boveda" SET "tipoEspacioId" = (SELECT "id" FROM "TipoEspacio" WHERE "nombre" = 'Túmulo')
WHERE "tipoEspacioId" IS NULL
  AND (lower("tipo") LIKE '%tumulo%' OR lower("tipo") LIKE '%túmulo%')
  AND EXISTS (SELECT 1 FROM "TipoEspacio" WHERE "nombre" = 'Túmulo');

-- Resto (incluye tipo NULL/vacío/otros) -> Bóveda.
UPDATE "Boveda" SET "tipoEspacioId" = (SELECT "id" FROM "TipoEspacio" WHERE "nombre" = 'Bóveda')
WHERE "tipoEspacioId" IS NULL;
