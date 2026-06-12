import { InventarioImport } from '@prisma/client';
import {
  InventarioImportListItemDto,
  InventarioImportResponseDto,
} from './dto/inventario-import.dto';

export type InventarioImportConRelaciones = InventarioImport & {
  adminUser: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  } | null;
};

function parseErrores(
  raw: string | null,
): InventarioImportResponseDto['errores'] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toInventarioImportListItem(
  entity: InventarioImportConRelaciones,
): InventarioImportListItemDto {
  return {
    id: entity.id,
    filename: entity.filename,
    estado: entity.estado,
    registrosProcesados: entity.registrosProcesados,
    categoriasCreadas: entity.categoriasCreadas,
    custodiosCreados: entity.custodiosCreados,
    bienesCreados: entity.bienesCreados,
    bienesActualizados: entity.bienesActualizados,
    tieneErrores: Boolean(entity.errores),
    fechaInicio: entity.fechaInicio.toISOString(),
    fechaFin: entity.fechaFin ? entity.fechaFin.toISOString() : null,
    adminUser: entity.adminUser
      ? {
          id: entity.adminUser.id,
          nombre: `${entity.adminUser.nombre} ${entity.adminUser.apellido}`.trim(),
          email: entity.adminUser.email,
        }
      : null,
  };
}

export function toInventarioImportResponse(
  entity: InventarioImportConRelaciones,
): InventarioImportResponseDto {
  return {
    ...toInventarioImportListItem(entity),
    mensajeError: entity.mensajeError,
    errores: parseErrores(entity.errores),
  };
}
