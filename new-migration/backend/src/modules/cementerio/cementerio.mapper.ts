import { Cementerio, GADInformacion } from '@prisma/client';
import { CementerioResponseDto, GADInformacionResponseDto } from './dto/response/cementerio.response.dto';

export function toCementerioResponse(entity: Cementerio): CementerioResponseDto {
  return {
    id: entity.id,
    nombre: entity.nombre,
    direccion: entity.direccion ?? undefined,
    telefono: entity.telefono ?? undefined,
    email: entity.email ?? undefined,
    ruc: entity.ruc ?? undefined,
    abreviaturaTituloPresidente: entity.abreviaturaTituloPresidente ?? undefined,
    presidente: entity.presidente ?? undefined,
    vecesRenovacionBovedas: entity.vecesRenovacionBovedas,
    vecesRenovacionNicho: entity.vecesRenovacionNicho,
    aniosArriendoBovedas: entity.aniosArriendoBovedas,
    aniosArriendoNicho: entity.aniosArriendoNicho,
    tarifaArriendo: entity.tarifaArriendo ? Number(entity.tarifaArriendo) : null,
    tarifaArriendoNicho: entity.tarifaArriendoNicho ? Number(entity.tarifaArriendoNicho) : null,
    entidadFinanciera: entity.entidadFinanciera ?? undefined,
    nombreEntidadFinanciera: entity.nombreEntidadFinanciera ?? undefined,
    numeroCuenta: entity.numeroCuenta ?? undefined,
    tasaMoraDiaria: Number(entity.tasaMoraDiaria),
    estado: entity.estado,
    contratoPreambulo: entity.contratoPreambulo ?? undefined,
    contratoClausula1: entity.contratoClausula1 ?? undefined,
    contratoClausula2: entity.contratoClausula2 ?? undefined,
    contratoClausula3: entity.contratoClausula3 ?? undefined,
    contratoClausula4: entity.contratoClausula4 ?? undefined,
    contratoClausula5: entity.contratoClausula5 ?? undefined,
    contratoClausula6: entity.contratoClausula6 ?? undefined,
  };
}

export function toGADInformacionResponse(entity: GADInformacion): GADInformacionResponseDto {
  return {
    id: entity.id,
    nombre: entity.nombre,
    direccion: entity.direccion,
    telefono: entity.telefono,
    email: entity.email,
    ruc: entity.ruc,
    logoUrl: entity.logoUrl ?? undefined,
    website: entity.website ?? undefined,
    mision: entity.mision ?? undefined,
    vision: entity.vision ?? undefined,
    slogan: entity.slogan ?? undefined,
    usarHeaderImagen: entity.usarHeaderImagen,
    headerImagenUrl: entity.headerImagenUrl ?? undefined,
    usarFooterImagen: entity.usarFooterImagen,
    footerImagenUrl: entity.footerImagenUrl ?? undefined,
    fechaCreacion: entity.fechaCreacion.toISOString(),
    fechaActualizacion: entity.fechaActualizacion?.toISOString(),
  };
}
