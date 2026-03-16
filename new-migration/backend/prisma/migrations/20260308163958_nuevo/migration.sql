-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "tipoIdentificacion" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "concurrencyStamp" TEXT,
    "permisos" TEXT,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioRol" (
    "usuarioId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,

    CONSTRAINT "UsuarioRol_pkey" PRIMARY KEY ("usuarioId","rolId")
);

-- CreateTable
CREATE TABLE "Cementerio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "ruc" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "Cementerio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bloque" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cementerioId" INTEGER NOT NULL,
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "Bloque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piso" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "bloqueId" INTEGER NOT NULL,

    CONSTRAINT "Piso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boveda" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "tipo" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "ubicacion" TEXT,
    "precio" DECIMAL(18,2) NOT NULL,
    "precioArrendamiento" DECIMAL(18,2) NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bloqueId" INTEGER NOT NULL,
    "pisoId" INTEGER,
    "propietarioId" INTEGER,
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "Boveda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" SERIAL NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "tipoIdentificacion" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "genero" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoPersona" TEXT NOT NULL DEFAULT 'Persona',
    "usuarioCreadorId" TEXT,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propietario" (
    "id" SERIAL NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personaId" INTEGER NOT NULL,

    CONSTRAINT "Propietario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsable" (
    "id" SERIAL NOT NULL,
    "parentesco" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personaId" INTEGER NOT NULL,
    "propietarioId" INTEGER,

    CONSTRAINT "Responsable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Difunto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "numeroIdentificacion" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "fechaDefuncion" TIMESTAMP(3),
    "fechaInhumacion" TIMESTAMP(3),
    "causaMuerte" TEXT,
    "observaciones" TEXT,
    "edad" INTEGER,
    "genero" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bovedaId" INTEGER NOT NULL,
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "Difunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" SERIAL NOT NULL,
    "numeroSecuencial" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "numeroDeMeses" INTEGER NOT NULL,
    "montoTotal" DECIMAL(18,2) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "esRenovacion" BOOLEAN NOT NULL DEFAULT false,
    "vecesRenovado" INTEGER NOT NULL DEFAULT 0,
    "pathDocumentoFirmado" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3),
    "bovedaId" INTEGER NOT NULL,
    "difuntoId" INTEGER NOT NULL,
    "contratoOrigenId" INTEGER,
    "contratoRelacionadoId" INTEGER,
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoResponsable" (
    "contratoId" INTEGER NOT NULL,
    "responsableId" INTEGER NOT NULL,

    CONSTRAINT "ContratoResponsable_pkey" PRIMARY KEY ("contratoId","responsableId")
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "monto" DECIMAL(18,2) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "pagada" BOOLEAN NOT NULL DEFAULT false,
    "intereses" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "contratoId" INTEGER NOT NULL,

    CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "numeroRecibo" TEXT NOT NULL,
    "monto" DECIMAL(18,2) NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "referencia" TEXT,
    "observacion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "bancoId" INTEGER,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuotaPago" (
    "cuotaId" INTEGER NOT NULL,
    "pagoId" INTEGER NOT NULL,

    CONSTRAINT "CuotaPago_pkey" PRIMARY KEY ("cuotaId","pagoId")
);

-- CreateTable
CREATE TABLE "Descuento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioCreadorId" TEXT,
    "usuarioActualizadorId" TEXT,
    "usuarioEliminadorId" TEXT,

    CONSTRAINT "Descuento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banco" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuenta" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GADInformacion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "logo" TEXT,
    "slogan" TEXT,

    CONSTRAINT "GADInformacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_numeroIdentificacion_key" ON "Usuario"("numeroIdentificacion");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombreNormalizado_key" ON "Rol"("nombreNormalizado");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_numeroIdentificacion_tipoPersona_key" ON "Persona"("numeroIdentificacion", "tipoPersona");

-- CreateIndex
CREATE UNIQUE INDEX "Responsable_propietarioId_key" ON "Responsable"("propietarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_numeroSecuencial_key" ON "Contrato"("numeroSecuencial");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_numeroRecibo_key" ON "Pago"("numeroRecibo");

-- CreateIndex
CREATE UNIQUE INDEX "Banco_nombre_key" ON "Banco"("nombre");

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cementerio" ADD CONSTRAINT "Cementerio_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cementerio" ADD CONSTRAINT "Cementerio_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cementerio" ADD CONSTRAINT "Cementerio_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bloque" ADD CONSTRAINT "Bloque_cementerioId_fkey" FOREIGN KEY ("cementerioId") REFERENCES "Cementerio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bloque" ADD CONSTRAINT "Bloque_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bloque" ADD CONSTRAINT "Bloque_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bloque" ADD CONSTRAINT "Bloque_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piso" ADD CONSTRAINT "Piso_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES "Bloque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boveda" ADD CONSTRAINT "Boveda_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES "Bloque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boveda" ADD CONSTRAINT "Boveda_pisoId_fkey" FOREIGN KEY ("pisoId") REFERENCES "Piso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boveda" ADD CONSTRAINT "Boveda_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boveda" ADD CONSTRAINT "Boveda_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boveda" ADD CONSTRAINT "Boveda_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boveda" ADD CONSTRAINT "Boveda_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propietario" ADD CONSTRAINT "Propietario_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsable" ADD CONSTRAINT "Responsable_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsable" ADD CONSTRAINT "Responsable_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Difunto" ADD CONSTRAINT "Difunto_bovedaId_fkey" FOREIGN KEY ("bovedaId") REFERENCES "Boveda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Difunto" ADD CONSTRAINT "Difunto_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Difunto" ADD CONSTRAINT "Difunto_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Difunto" ADD CONSTRAINT "Difunto_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_bovedaId_fkey" FOREIGN KEY ("bovedaId") REFERENCES "Boveda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_difuntoId_fkey" FOREIGN KEY ("difuntoId") REFERENCES "Difunto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_contratoOrigenId_fkey" FOREIGN KEY ("contratoOrigenId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_contratoRelacionadoId_fkey" FOREIGN KEY ("contratoRelacionadoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoResponsable" ADD CONSTRAINT "ContratoResponsable_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoResponsable" ADD CONSTRAINT "ContratoResponsable_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Responsable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "Banco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuotaPago" ADD CONSTRAINT "CuotaPago_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "Cuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuotaPago" ADD CONSTRAINT "CuotaPago_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Descuento" ADD CONSTRAINT "Descuento_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Descuento" ADD CONSTRAINT "Descuento_usuarioActualizadorId_fkey" FOREIGN KEY ("usuarioActualizadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Descuento" ADD CONSTRAINT "Descuento_usuarioEliminadorId_fkey" FOREIGN KEY ("usuarioEliminadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
