-- AlterTable
ALTER TABLE "Cementerio" ADD COLUMN     "contratoClausula1" TEXT,
ADD COLUMN     "contratoClausula2" TEXT,
ADD COLUMN     "contratoClausula3" TEXT,
ADD COLUMN     "contratoClausula4" TEXT,
ADD COLUMN     "contratoClausula5" TEXT,
ADD COLUMN     "contratoClausula6" TEXT,
ADD COLUMN     "contratoPreambulo" TEXT;

-- AlterTable
ALTER TABLE "GADInformacion" ADD COLUMN     "footerImagenUrl" TEXT,
ADD COLUMN     "headerImagenUrl" TEXT,
ADD COLUMN     "usarFooterImagen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usarHeaderImagen" BOOLEAN NOT NULL DEFAULT false;
