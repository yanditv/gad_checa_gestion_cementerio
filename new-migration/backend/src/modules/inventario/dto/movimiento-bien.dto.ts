import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

// ---------------------------------------------------------------------------
// Request DTOs (Fase 4 — INV-R3, R4)
// ---------------------------------------------------------------------------

export class ReasignarCustodioDto {
  @ApiProperty({
    description: 'Identificador del nuevo custodio del bien',
    example: 7,
  })
  @IsInt()
  custodioId!: number;

  @ApiPropertyOptional({
    description:
      'Fecha del movimiento (ISO). Si se omite, se usa la fecha actual.',
    example: '2026-06-09',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Observación o detalle de la reasignación',
    example: 'Entrega-recepción por cambio de responsable de Secretaría',
  })
  @IsOptional()
  @IsString()
  detalle?: string;

  @ApiPropertyOptional({
    description: 'Ruta del documento de respaldo (acta)',
    example: '/actas/reasignacion-2026-06-09.pdf',
  })
  @IsOptional()
  @IsString()
  documento?: string;
}

export class MoverBienDto {
  @ApiProperty({
    description: 'Nueva ubicación (dependencia / oficina) del bien',
    example: 'Tesorería',
  })
  @IsString()
  ubicacion!: string;

  @ApiPropertyOptional({
    description:
      'Fecha del movimiento (ISO). Si se omite, se usa la fecha actual.',
    example: '2026-06-09',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Observación o detalle del cambio de ubicación',
    example: 'Traslado por reorganización de oficinas',
  })
  @IsOptional()
  @IsString()
  detalle?: string;

  @ApiPropertyOptional({
    description: 'Ruta del documento de respaldo (acta)',
    example: '/actas/traslado-2026-06-09.pdf',
  })
  @IsOptional()
  @IsString()
  documento?: string;
}

// ---------------------------------------------------------------------------
// Response DTOs (historial — INV-R8)
// ---------------------------------------------------------------------------

class CustodioResumenDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nombre!: string;
}

export class HistorialItemDto {
  @ApiProperty({
    description:
      'Origen del evento: movimiento (alta/baja/reasignación/ubicación) o depreciación',
    enum: ['movimiento', 'depreciacion'],
  })
  origen!: 'movimiento' | 'depreciacion';

  @ApiProperty({
    description:
      'Tipo de evento: alta | baja | reasignacion_custodio | cambio_ubicacion | depreciacion',
  })
  tipo!: string;

  @ApiProperty({ description: 'Fecha del evento (ISO)' })
  fecha!: string;

  @ApiProperty({ nullable: true })
  detalle!: string | null;

  @ApiProperty({ type: CustodioResumenDto, nullable: true })
  custodioAnterior!: CustodioResumenDto | null;

  @ApiProperty({ type: CustodioResumenDto, nullable: true })
  custodioNuevo!: CustodioResumenDto | null;

  @ApiProperty({ nullable: true })
  ubicacionAnterior!: string | null;

  @ApiProperty({ nullable: true })
  ubicacionNueva!: string | null;

  @ApiProperty({ nullable: true })
  documento!: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Valor depreciado del periodo (solo eventos de depreciación)',
  })
  valorDepreciado!: number | null;

  @ApiProperty({
    nullable: true,
    description: 'Depreciación acumulada (solo eventos de depreciación)',
  })
  depreciacionAcumulada!: number | null;

  @ApiProperty({
    nullable: true,
    description: 'Valor en libros (solo eventos de depreciación)',
  })
  valorEnLibros!: number | null;
}
