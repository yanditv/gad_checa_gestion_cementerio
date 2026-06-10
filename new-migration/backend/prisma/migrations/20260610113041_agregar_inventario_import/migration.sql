-- CreateTable
CREATE TABLE "InventarioImport" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EN_PROGRESO',
    "registrosProcesados" INTEGER NOT NULL DEFAULT 0,
    "categoriasCreadas" INTEGER NOT NULL DEFAULT 0,
    "custodiosCreados" INTEGER NOT NULL DEFAULT 0,
    "bienesCreados" INTEGER NOT NULL DEFAULT 0,
    "bienesActualizados" INTEGER NOT NULL DEFAULT 0,
    "errores" TEXT,
    "mensajeError" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "adminUserId" TEXT NOT NULL,

    CONSTRAINT "InventarioImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventarioImport_fechaInicio_idx" ON "InventarioImport"("fechaInicio");

-- AddForeignKey
ALTER TABLE "InventarioImport" ADD CONSTRAINT "InventarioImport_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
