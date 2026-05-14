-- DropForeignKey
ALTER TABLE "ContratoResponsable" DROP CONSTRAINT "ContratoResponsable_contratoId_fkey";

-- DropForeignKey
ALTER TABLE "CuotaPago" DROP CONSTRAINT "CuotaPago_pagoId_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioRol" DROP CONSTRAINT "UsuarioRol_rolId_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioRol" DROP CONSTRAINT "UsuarioRol_usuarioId_fkey";

-- AlterTable
ALTER TABLE "Descuento" ALTER COLUMN "fechaInicio" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "CatastroImport" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EN_PROGRESO',
    "registrosProcesados" INTEGER NOT NULL DEFAULT 0,
    "bloquesCreados" INTEGER NOT NULL DEFAULT 0,
    "bovedasCreadas" INTEGER NOT NULL DEFAULT 0,
    "contratosCreados" INTEGER NOT NULL DEFAULT 0,
    "errores" TEXT,
    "mensajeError" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "adminUserId" TEXT NOT NULL,

    CONSTRAINT "CatastroImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatastroImport_fechaInicio_idx" ON "CatastroImport"("fechaInicio");

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoResponsable" ADD CONSTRAINT "ContratoResponsable_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuotaPago" ADD CONSTRAINT "CuotaPago_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatastroImport" ADD CONSTRAINT "CatastroImport_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
