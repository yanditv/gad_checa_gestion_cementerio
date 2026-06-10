import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Formato de exportación admitido por los reportes de inventario (REP-R2).
 * El formato se resuelve por la ruta del endpoint, no por query, por lo que
 * este tipo solo documenta los valores válidos.
 */
export type FormatoExportacion = 'pdf' | 'xlsx' | 'csv';

/**
 * Filtros comunes a los reportes de inventario. Todos opcionales: sin filtros
 * se incluyen todos los bienes activos.
 */
export class ReporteInventarioFiltroDto {
  @ApiPropertyOptional({ description: 'Filtra por categoría.' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  categoriaId?: number;

  @ApiPropertyOptional({ description: 'Filtra por custodio.' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  custodioId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por ubicación (coincidencia parcial).',
  })
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({
    description:
      'Incluir bienes dados de baja. Por defecto se excluyen del reporte.',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  incluirBajas?: boolean;
}

/**
 * Filtro del reporte de depreciación: además de los filtros comunes, fija la
 * fecha de corte para el cálculo de valor en libros (CGE 406-03).
 */
export class ReporteDepreciacionFiltroDto extends ReporteInventarioFiltroDto {
  @ApiPropertyOptional({
    description:
      'Fecha de corte (ISO 8601). Por defecto la fecha actual del servidor.',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsString()
  fechaCorte?: string;
}

/**
 * Filtro del acta de entrega-recepción de bienes (INV-R10). El acta lista los
 * bienes de un custodio (custodio entrante) y opcionalmente referencia al
 * custodio saliente para las firmas.
 */
export class ActaEntregaRecepcionFiltroDto {
  @ApiPropertyOptional({
    description:
      'Custodio entrante (receptor). Si se omite, el acta lista los bienes ' +
      'según los demás filtros sin custodio fijo.',
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  custodioId?: number;

  @ApiPropertyOptional({
    description: 'Custodio saliente (entrega). Solo para la firma del acta.',
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  custodioSalienteId?: number;

  @ApiPropertyOptional({ description: 'Filtra por ubicación de los bienes.' })
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({ description: 'Filtra por categoría de los bienes.' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  categoriaId?: number;
}
