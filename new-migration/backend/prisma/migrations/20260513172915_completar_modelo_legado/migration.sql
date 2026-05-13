-- Migración: completar paridad con el modelo legado ASP.NET
-- Cubre las brechas listadas en MIGRATION_PLAN.md §1.1:
--   * Cementerio  : tarifas, renovaciones, presidente, entidad financiera, mora, auditoría completa
--   * Persona     : estadoCivil, profesion, nacionalidad, auditoría completa
--   * Difunto     : certificado de defunción + datos familiares
--   * Contrato    : descuentoId, montoSubtotal/montoDescuento, fechaEliminacion
--   * Pago        : descuentoId, montoSubtotal/montoDescuento, auditoría completa, fechaCreacion
--   * Banco       : fechaCreacion
--   * GADInformacion: campos institucionales + auditoría
--   * Usuario     : mustChangePassword
--   * Tablas nuevas: "Documento", "Notificacion"

-- =============================================================================
-- Usuario
-- =============================================================================
ALTER TABLE "Usuario"
    ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- =============================================================================
-- Cementerio
-- =============================================================================
ALTER TABLE "Cementerio"
    ADD COLUMN "abreviaturaTituloPresidente" TEXT,
    ADD COLUMN "presidente"                  TEXT,
    ADD COLUMN "vecesRenovacionBovedas"      INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "vecesRenovacionNicho"        INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "aniosArriendoBovedas"        INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN "aniosArriendoNicho"          INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN "tarifaArriendo"              DECIMAL(18,2),
    ADD COLUMN "tarifaArriendoNicho"         DECIMAL(18,2),
    ADD COLUMN "entidadFinanciera"           TEXT,
    ADD COLUMN "nombreEntidadFinanciera"     TEXT,
    ADD COLUMN "numeroCuenta"                TEXT,
    ADD COLUMN "tasaMoraDiaria"              DECIMAL(5,4) NOT NULL DEFAULT 0,
    ADD COLUMN "fechaActualizacion"          TIMESTAMP(3),
    ADD COLUMN "fechaEliminacion"            TIMESTAMP(3);

-- =============================================================================
-- GADInformacion
-- =============================================================================
ALTER TABLE "GADInformacion"
    ADD COLUMN "logoUrl"               TEXT,
    ADD COLUMN "website"               TEXT,
    ADD COLUMN "mision"                TEXT,
    ADD COLUMN "vision"                TEXT,
    ADD COLUMN "fechaCreacion"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "fechaActualizacion"    TIMESTAMP(3),
    ADD COLUMN "usuarioCreadorId"      TEXT,
    ADD COLUMN "usuarioActualizadorId" TEXT;

ALTER TABLE "GADInformacion"
    ADD CONSTRAINT "GADInformacion_usuarioCreadorId_fkey"
        FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "GADInformacion_usuarioActualizadorId_fkey"
        FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Persona — auditoría completa + campos opcionales del manual
-- =============================================================================
ALTER TABLE "Persona"
    ADD COLUMN "estadoCivil"           TEXT,
    ADD COLUMN "profesion"             TEXT,
    ADD COLUMN "nacionalidad"          TEXT,
    ADD COLUMN "fechaActualizacion"    TIMESTAMP(3),
    ADD COLUMN "fechaEliminacion"      TIMESTAMP(3),
    ADD COLUMN "usuarioActualizadorId" TEXT,
    ADD COLUMN "usuarioEliminadorId"   TEXT;

ALTER TABLE "Persona"
    ADD CONSTRAINT "Persona_usuarioActualizadorId_fkey"
        FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "Persona_usuarioEliminadorId_fkey"
        FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Difunto — certificado de defunción y datos familiares
-- =============================================================================
ALTER TABLE "Difunto"
    ADD COLUMN "nacionalidad"               TEXT,
    ADD COLUMN "estadoCivil"                TEXT,
    ADD COLUMN "lugarNacimiento"            TEXT,
    ADD COLUMN "lugarDefuncion"             TEXT,
    ADD COLUMN "nombreConyuge"              TEXT,
    ADD COLUMN "nombrePadre"                TEXT,
    ADD COLUMN "nombreMadre"                TEXT,
    ADD COLUMN "numeroCertificadoDefuncion" TEXT,
    ADD COLUMN "entidadEmisora"             TEXT,
    ADD COLUMN "fechaEmisionCertificado"    TIMESTAMP(3);

-- =============================================================================
-- Contrato — descuento aplicado y eliminación lógica
-- =============================================================================
ALTER TABLE "Contrato"
    ADD COLUMN "montoSubtotal"    DECIMAL(18,2),
    ADD COLUMN "montoDescuento"   DECIMAL(18,2),
    ADD COLUMN "descuentoId"      INTEGER,
    ADD COLUMN "fechaEliminacion" TIMESTAMP(3);

ALTER TABLE "Contrato"
    ADD CONSTRAINT "Contrato_descuentoId_fkey"
        FOREIGN KEY ("descuentoId") REFERENCES "Descuento"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Pago — descuento aplicado, auditoría completa
-- =============================================================================
ALTER TABLE "Pago"
    ADD COLUMN "montoSubtotal"         DECIMAL(18,2),
    ADD COLUMN "montoDescuento"        DECIMAL(18,2),
    ADD COLUMN "descuentoId"           INTEGER,
    ADD COLUMN "fechaCreacion"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "fechaActualizacion"    TIMESTAMP(3),
    ADD COLUMN "fechaEliminacion"      TIMESTAMP(3),
    ADD COLUMN "usuarioCreadorId"      TEXT,
    ADD COLUMN "usuarioActualizadorId" TEXT,
    ADD COLUMN "usuarioEliminadorId"   TEXT;

ALTER TABLE "Pago"
    ADD CONSTRAINT "Pago_descuentoId_fkey"
        FOREIGN KEY ("descuentoId") REFERENCES "Descuento"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "Pago_usuarioCreadorId_fkey"
        FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "Pago_usuarioActualizadorId_fkey"
        FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "Pago_usuarioEliminadorId_fkey"
        FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Banco — fecha de creación para trazabilidad
-- =============================================================================
ALTER TABLE "Banco"
    ADD COLUMN "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- =============================================================================
-- Documento — adjuntos del contrato (ej. PDF firmado escaneado)
-- =============================================================================
CREATE TABLE "Documento" (
    "id"             SERIAL                NOT NULL,
    "contratoId"     INTEGER               NOT NULL,
    "storageKey"     TEXT                  NOT NULL,
    "nombreOriginal" TEXT                  NOT NULL,
    "mimeType"       TEXT                  NOT NULL,
    "tamanioBytes"   INTEGER               NOT NULL,
    "tipo"           TEXT                  NOT NULL DEFAULT 'ContratoFirmado',
    "estado"         BOOLEAN               NOT NULL DEFAULT true,
    "fechaCreacion"  TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subidoPorId"    TEXT,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Documento_contratoId_idx" ON "Documento"("contratoId");

ALTER TABLE "Documento"
    ADD CONSTRAINT "Documento_contratoId_fkey"
        FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "Documento_subidoPorId_fkey"
        FOREIGN KEY ("subidoPorId") REFERENCES "Usuario"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Notificacion — bandeja por usuario
-- =============================================================================
CREATE TABLE "Notificacion" (
    "id"            SERIAL       NOT NULL,
    "usuarioId"     TEXT         NOT NULL,
    "tipo"          TEXT         NOT NULL,
    "titulo"        TEXT         NOT NULL,
    "mensaje"       TEXT         NOT NULL,
    "entidadTipo"   TEXT,
    "entidadId"     INTEGER,
    "leida"         BOOLEAN      NOT NULL DEFAULT false,
    "fechaLectura"  TIMESTAMP(3),
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notificacion_usuarioId_leida_idx" ON "Notificacion"("usuarioId", "leida");
CREATE INDEX "Notificacion_fechaCreacion_idx"   ON "Notificacion"("fechaCreacion");

ALTER TABLE "Notificacion"
    ADD CONSTRAINT "Notificacion_usuarioId_fkey"
        FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- Backfill — valores del legado (Program.cs:461-481) para el cementerio semilla
-- =============================================================================
UPDATE "Cementerio"
SET "abreviaturaTituloPresidente" = COALESCE("abreviaturaTituloPresidente", 'Sr.'),
    "presidente"                  = COALESCE("presidente", 'Bolívar Robles Iñamagua'),
    "vecesRenovacionBovedas"      = COALESCE("vecesRenovacionBovedas", 1),
    "vecesRenovacionNicho"        = COALESCE("vecesRenovacionNicho", 1),
    "aniosArriendoBovedas"        = COALESCE("aniosArriendoBovedas", 5),
    "aniosArriendoNicho"          = COALESCE("aniosArriendoNicho", 5),
    "tarifaArriendo"              = COALESCE("tarifaArriendo", 240.00),
    "tarifaArriendoNicho"         = COALESCE("tarifaArriendoNicho", 240.00)
WHERE "nombre" = 'Cementerio de checa';
