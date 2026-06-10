-- AlterTable
ALTER TABLE "Difunto" ADD COLUMN     "exhumado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaExhumacion" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Exhumacion" (
    "id" SERIAL NOT NULL,
    "numeroActa" TEXT NOT NULL,
    "difuntoId" INTEGER NOT NULL,
    "bovedaOrigenId" INTEGER NOT NULL,
    "fechaExhumacion" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "bovedaDestinoId" INTEGER,
    "numeroAutorizacion" TEXT,
    "entidadAutorizante" TEXT,
    "observaciones" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "Exhumacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exhumacion_numeroActa_key" ON "Exhumacion"("numeroActa");

-- AddForeignKey
ALTER TABLE "Exhumacion" ADD CONSTRAINT "Exhumacion_difuntoId_fkey" FOREIGN KEY ("difuntoId") REFERENCES "Difunto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exhumacion" ADD CONSTRAINT "Exhumacion_bovedaOrigenId_fkey" FOREIGN KEY ("bovedaOrigenId") REFERENCES "Boveda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exhumacion" ADD CONSTRAINT "Exhumacion_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exhumacion" ADD CONSTRAINT "Exhumacion_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exhumacion" ADD CONSTRAINT "Exhumacion_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
