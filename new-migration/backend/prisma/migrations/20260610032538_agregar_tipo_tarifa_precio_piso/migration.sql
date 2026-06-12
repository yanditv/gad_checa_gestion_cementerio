-- AlterTable
ALTER TABLE "Bloque" ADD COLUMN     "bovedasPorPiso" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tarifaBase" DECIMAL(18,2),
ADD COLUMN     "tipo" TEXT;

-- AlterTable
ALTER TABLE "Piso" ADD COLUMN     "precio" DECIMAL(18,2);
