import { Prisma } from '@prisma/client';
import { BienListItemDto, BienResponseDto } from './dto/bien.dto';

export type BienConRelaciones = Prisma.BienGetPayload<{
  include: {
    categoria: { select: { id: true; nombre: true } };
    custodio: { select: { id: true; nombre: true } };
  };
}>;

export function toBienListItem(entity: BienConRelaciones): BienListItemDto {
  return {
    id: entity.id,
    codigo: entity.codigo,
    descripcion: entity.descripcion,
    marca: entity.marca,
    serie: entity.serie,
    fechaAdquisicion: entity.fechaAdquisicion.toISOString(),
    valorAdquisicion: Number(entity.valorAdquisicion),
    estadoConservacion: entity.estadoConservacion,
    ubicacion: entity.ubicacion,
    dadoDeBaja: entity.dadoDeBaja,
    fotoUrl: entity.fotoStorageKey
      ? `/inventario/bienes/${entity.id}/foto`
      : null,
    categoria: entity.categoria
      ? { id: entity.categoria.id, nombre: entity.categoria.nombre }
      : null,
    custodio: entity.custodio
      ? { id: entity.custodio.id, nombre: entity.custodio.nombre }
      : null,
  };
}

export function toBienResponse(entity: BienConRelaciones): BienResponseDto {
  return {
    ...toBienListItem(entity),
    modelo: entity.modelo,
    fuenteFinanciamiento: entity.fuenteFinanciamiento,
    valorResidual:
      entity.valorResidual !== null ? Number(entity.valorResidual) : null,
    vidaUtilMesesOverride: entity.vidaUtilMesesOverride,
    fechaBaja: entity.fechaBaja ? entity.fechaBaja.toISOString() : null,
    motivoBaja: entity.motivoBaja,
    estado: entity.estado,
    fechaCreacion: entity.fechaCreacion.toISOString(),
  };
}
