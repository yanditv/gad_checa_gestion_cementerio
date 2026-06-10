import { CategoriaBien } from '@prisma/client';
import { CategoriaBienResponseDto } from './dto/categoria-bien.dto';

export function toCategoriaBienResponse(
  entity: CategoriaBien,
): CategoriaBienResponseDto {
  return {
    id: entity.id,
    nombre: entity.nombre,
    vidaUtilAnios: entity.vidaUtilAnios,
    valorResidualPct: Number(entity.valorResidualPct),
    estado: entity.estado,
  };
}
