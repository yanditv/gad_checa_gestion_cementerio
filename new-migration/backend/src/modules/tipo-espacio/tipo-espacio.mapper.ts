import { TipoEspacio } from '@prisma/client';
import { TipoEspacioResponseDto } from './dto/response/tipo-espacio.response.dto';

export function toTipoEspacioResponse(
  entity: TipoEspacio,
): TipoEspacioResponseDto {
  return {
    id: entity.id,
    nombre: entity.nombre,
    prefijoNumeracion: entity.prefijoNumeracion ?? null,
    tarifaArriendo: Number(entity.tarifaArriendo),
    aniosArriendo: entity.aniosArriendo,
    vecesRenovacion: entity.vecesRenovacion,
    estado: entity.estado,
  };
}
