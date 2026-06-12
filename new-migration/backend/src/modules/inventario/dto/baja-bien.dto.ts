import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

// ---------------------------------------------------------------------------
// Request DTO — Fase 5 (INV-R6): Baja de bienes
// ---------------------------------------------------------------------------

export const MOTIVOS_BAJA = [
  'obsolescencia',
  'robo',
  'venta',
  'donacion',
  'otro',
] as const;

export type MotivoBaja = (typeof MOTIVOS_BAJA)[number];

export class BajaBienDto {
  @ApiProperty({
    description: 'Motivo de la baja del bien',
    enum: MOTIVOS_BAJA,
    example: 'obsolescencia',
  })
  @IsIn(MOTIVOS_BAJA, {
    message:
      'El motivo debe ser uno de: obsolescencia, robo, venta, donacion, otro',
  })
  motivo!: MotivoBaja;

  @ApiProperty({
    description: 'Fecha de la baja (ISO)',
    example: '2026-06-09',
  })
  @IsDateString(
    {},
    { message: 'La fecha de baja debe ser una fecha válida (ISO)' },
  )
  fecha!: string;

  @ApiPropertyOptional({
    description: 'Ruta del documento de respaldo (acta de baja)',
    example: '/actas/baja-2026-06-09.pdf',
  })
  @IsOptional()
  @IsString()
  documento?: string;

  @ApiPropertyOptional({
    description: 'Número o referencia de la autorización de la baja',
    example: 'Resolución Administrativa N° 014-2026',
  })
  @IsOptional()
  @IsString()
  autorizacion?: string;
}

export class ReactivarBienDto {
  @ApiPropertyOptional({
    description: 'Motivo / observación de la reactivación (reversión por error)',
    example: 'Baja registrada por error; el bien sigue en uso',
  })
  @IsOptional()
  @IsString()
  detalle?: string;
}
