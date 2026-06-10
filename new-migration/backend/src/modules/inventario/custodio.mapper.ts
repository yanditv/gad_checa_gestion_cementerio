import { Custodio } from '@prisma/client';
import { CustodioResponseDto } from './dto/custodio.dto';

export function toCustodioResponse(entity: Custodio): CustodioResponseDto {
  return {
    id: entity.id,
    nombre: entity.nombre,
    identificacion: entity.identificacion,
    cargo: entity.cargo,
    estado: entity.estado,
  };
}
