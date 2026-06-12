import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

// ---------------------------------------------------------------------------
// Request DTO — Fase 6 (INV-R7): recálculo de depreciación por periodo
// ---------------------------------------------------------------------------

export class RecalcularDepreciacionDto {
  @ApiProperty({
    description: 'Año del periodo a recalcular',
    example: 2026,
  })
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(2000, { message: 'El año debe ser mayor o igual a 2000' })
  @Max(2100, { message: 'El año debe ser menor o igual a 2100' })
  anio!: number;

  @ApiProperty({
    description: 'Mes del periodo a recalcular (1-12)',
    example: 6,
  })
  @IsInt({ message: 'El mes debe ser un número entero' })
  @Min(1, { message: 'El mes debe estar entre 1 y 12' })
  @Max(12, { message: 'El mes debe estar entre 1 y 12' })
  mes!: number;
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export class RecalcularDepreciacionResponseDto {
  @ApiProperty({ description: 'Año del periodo recalculado', example: 2026 })
  anio!: number;

  @ApiProperty({ description: 'Mes del periodo recalculado', example: 6 })
  mes!: number;

  @ApiProperty({
    description: 'Cantidad de bienes activos procesados en el periodo',
    example: 42,
  })
  bienesProcesados!: number;

  @ApiProperty({
    description: 'Suma de la depreciación del periodo de todos los bienes',
    example: 1250.55,
  })
  totalDepreciadoPeriodo!: number;
}

export class DepreciacionBienItemDto {
  @ApiProperty({ example: 2026 })
  anio!: number;

  @ApiProperty({ example: 6 })
  mes!: number;

  @ApiProperty({
    description: 'Depreciación del periodo',
    example: 27.78,
  })
  valorDepreciado!: number;

  @ApiProperty({
    description: 'Depreciación acumulada hasta el corte del periodo',
    example: 333.36,
  })
  depreciacionAcumulada!: number;

  @ApiProperty({
    description: 'Valor en libros al corte del periodo',
    example: 666.64,
  })
  valorEnLibros!: number;

  @ApiProperty({ description: 'Fecha de cálculo (ISO)' })
  fechaCalculo!: string;
}

export class DepreciacionBienResponseDto {
  @ApiProperty({ description: 'Identificador del bien' })
  bienId!: number;

  @ApiProperty({ description: 'Código (placa) del bien' })
  codigo!: string;

  @ApiProperty({ description: 'Valor de adquisición' })
  valorAdquisicion!: number;

  @ApiProperty({ description: 'Valor residual efectivo' })
  valorResidual!: number;

  @ApiProperty({ description: 'Vida útil efectiva en meses' })
  vidaUtilMeses!: number;

  @ApiProperty({ description: 'Depreciación mensual (línea recta)' })
  depreciacionMensual!: number;

  @ApiProperty({
    type: DepreciacionBienItemDto,
    isArray: true,
    description: 'Tabla de depreciación registrada por periodo',
  })
  periodos!: DepreciacionBienItemDto[];
}
