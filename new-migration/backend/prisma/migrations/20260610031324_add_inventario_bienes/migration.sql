-- CreateTable
CREATE TABLE "CategoriaBien" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "vidaUtilAnios" INTEGER NOT NULL,
    "valorResidualPct" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3),
    "fechaEliminacion" TIMESTAMP(3),
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "CategoriaBien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Custodio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "identificacion" TEXT,
    "cargo" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3),
    "fechaEliminacion" TIMESTAMP(3),
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "Custodio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bien" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "serie" TEXT,
    "fechaAdquisicion" TIMESTAMP(3) NOT NULL,
    "valorAdquisicion" DECIMAL(18,2) NOT NULL,
    "fuenteFinanciamiento" TEXT,
    "estadoConservacion" TEXT NOT NULL DEFAULT 'bueno',
    "ubicacion" TEXT,
    "valorResidual" DECIMAL(18,2),
    "vidaUtilMesesOverride" INTEGER,
    "dadoDeBaja" BOOLEAN NOT NULL DEFAULT false,
    "fechaBaja" TIMESTAMP(3),
    "motivoBaja" TEXT,
    "categoriaId" INTEGER NOT NULL,
    "custodioId" INTEGER,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3),
    "fechaEliminacion" TIMESTAMP(3),
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "Bien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoBien" (
    "id" SERIAL NOT NULL,
    "bienId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalle" TEXT,
    "custodioAnteriorId" INTEGER,
    "custodioNuevoId" INTEGER,
    "ubicacionAnterior" TEXT,
    "ubicacionNueva" TEXT,
    "documento" TEXT,
    "usuarioCreadorId" TEXT,

    CONSTRAINT "MovimientoBien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepreciacionBien" (
    "id" SERIAL NOT NULL,
    "bienId" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "valorDepreciado" DECIMAL(18,2) NOT NULL,
    "depreciacionAcumulada" DECIMAL(18,2) NOT NULL,
    "valorEnLibros" DECIMAL(18,2) NOT NULL,
    "fechaCalculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepreciacionBien_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bien_codigo_key" ON "Bien"("codigo");

-- CreateIndex
CREATE INDEX "Bien_categoriaId_idx" ON "Bien"("categoriaId");

-- CreateIndex
CREATE INDEX "Bien_custodioId_idx" ON "Bien"("custodioId");

-- CreateIndex
CREATE INDEX "MovimientoBien_bienId_idx" ON "MovimientoBien"("bienId");

-- CreateIndex
CREATE INDEX "DepreciacionBien_bienId_idx" ON "DepreciacionBien"("bienId");

-- CreateIndex
CREATE UNIQUE INDEX "DepreciacionBien_bienId_anio_mes_key" ON "DepreciacionBien"("bienId", "anio", "mes");

-- AddForeignKey
ALTER TABLE "CategoriaBien" ADD CONSTRAINT "CategoriaBien_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaBien" ADD CONSTRAINT "CategoriaBien_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaBien" ADD CONSTRAINT "CategoriaBien_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Custodio" ADD CONSTRAINT "Custodio_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Custodio" ADD CONSTRAINT "Custodio_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Custodio" ADD CONSTRAINT "Custodio_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaBien"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_custodioId_fkey" FOREIGN KEY ("custodioId") REFERENCES "Custodio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBien" ADD CONSTRAINT "MovimientoBien_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBien" ADD CONSTRAINT "MovimientoBien_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepreciacionBien" ADD CONSTRAINT "DepreciacionBien_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
