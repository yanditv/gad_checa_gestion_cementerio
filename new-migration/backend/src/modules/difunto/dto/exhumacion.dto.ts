import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/**
 * Motivos válidos de exhumación (paridad TDR §2 — Módulo Catastro).
 * `traslado` implica reasignar al difunto a la bóveda destino.
 */
export const MOTIVOS_EXHUMACION = [
  'vencimiento_arriendo',
  'traslado',
  'orden_judicial',
  'osario_comun',
  'otro',
] as const;

export type MotivoExhumacion = (typeof MOTIVOS_EXHUMACION)[number];

export class CreateExhumacionDto {
  @ApiProperty({ description: 'Difunto a exhumar (activo y no exhumado)' })
  @IsInt()
  difuntoId!: number;

  @ApiProperty({ description: 'Fecha del acto de exhumación (ISO)' })
  @IsDateString()
  fechaExhumacion!: string;

  @ApiProperty({
    description: 'Motivo de la exhumación',
    enum: MOTIVOS_EXHUMACION,
  })
  @IsIn(MOTIVOS_EXHUMACION as unknown as string[])
  motivo!: MotivoExhumacion;

  @ApiProperty({
    description:
      'Destino de los restos (texto libre: osario, otra bóveda, otro cementerio…)',
  })
  @IsString()
  destino!: string;

  @ApiPropertyOptional({
    description:
      'Bóveda destino, obligatoria si el motivo es "traslado" (reasigna al difunto)',
  })
  @IsOptional()
  @IsInt()
  bovedaDestinoId?: number;

  @ApiPropertyOptional({ description: 'Número de autorización administrativa' })
  @IsOptional()
  @IsString()
  numeroAutorizacion?: string;

  @ApiPropertyOptional({ description: 'Entidad que autoriza la exhumación' })
  @IsOptional()
  @IsString()
  entidadAutorizante?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class QueryExhumacionDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Fecha inicial del rango (ISO)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Fecha final del rango (ISO)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({ description: 'Filtrar por bóveda de origen' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  bovedaId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por motivo',
    enum: MOTIVOS_EXHUMACION,
  })
  @IsOptional()
  @IsIn(MOTIVOS_EXHUMACION as unknown as string[])
  motivo?: MotivoExhumacion;
}
