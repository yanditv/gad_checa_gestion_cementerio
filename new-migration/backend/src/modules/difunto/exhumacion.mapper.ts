import { Exhumacion, Boveda, Difunto } from '@prisma/client';

type ExhumacionConRelaciones = Exhumacion & {
  difunto?: Pick<Difunto, 'id' | 'nombre' | 'apellido' | 'numeroIdentificacion'> | null;
  bovedaOrigen?: Pick<Boveda, 'id' | 'numero' | 'tipo'> | null;
};

/**
 * Convierte una Exhumacion de Prisma a un objeto de respuesta que oculta los
 * FK de auditoría (`usuarioCreadorId` / `usuarioActualizadorId` /
 * `usuarioEliminadorId`). Nunca se devuelve la entidad cruda desde el
 * controller.
 */
export function toExhumacionResponse(entity: ExhumacionConRelaciones) {
  return {
    id: entity.id,
    numeroActa: entity.numeroActa,
    difuntoId: entity.difuntoId,
    bovedaOrigenId: entity.bovedaOrigenId,
    bovedaDestinoId: entity.bovedaDestinoId,
    fechaExhumacion: entity.fechaExhumacion,
    motivo: entity.motivo,
    destino: entity.destino,
    numeroAutorizacion: entity.numeroAutorizacion,
    entidadAutorizante: entity.entidadAutorizante,
    observaciones: entity.observaciones,
    estado: entity.estado,
    fechaCreacion: entity.fechaCreacion,
    difunto: entity.difunto
      ? {
          id: entity.difunto.id,
          nombre: entity.difunto.nombre,
          apellido: entity.difunto.apellido,
          numeroIdentificacion: entity.difunto.numeroIdentificacion,
        }
      : undefined,
    bovedaOrigen: entity.bovedaOrigen
      ? {
          id: entity.bovedaOrigen.id,
          numero: entity.bovedaOrigen.numero,
          tipo: entity.bovedaOrigen.tipo,
        }
      : undefined,
  };
}
