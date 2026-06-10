import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const ESTADOS_CONSERVACION = ['bueno', 'regular', 'malo'] as const;

export class CreateBienDto {
  @ApiPropertyOptional({
    description:
      'Placa institucional. Si se omite, se autogenera con el patrón BN-YYYY-NNNN.',
    example: 'BN-2026-0001',
  })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiProperty({ example: 'Computadora de escritorio HP' })
  @IsString()
  descripcion!: string;

  @ApiPropertyOptional({ example: 'HP' })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional({ example: 'ProDesk 600 G6' })
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional({ example: 'SN-123456' })
  @IsOptional()
  @IsString()
  serie?: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  fechaAdquisicion!: string;

  @ApiProperty({ example: 850.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorAdquisicion!: number;

  @ApiPropertyOptional({ example: 'Recursos propios' })
  @IsOptional()
  @IsString()
  fuenteFinanciamiento?: string;

  @ApiPropertyOptional({
    enum: ESTADOS_CONSERVACION,
    default: 'bueno',
    example: 'bueno',
  })
  @IsOptional()
  @IsIn(ESTADOS_CONSERVACION as unknown as string[])
  estadoConservacion?: string;

  @ApiPropertyOptional({ example: 'Secretaría' })
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({
    description: 'Override del valor residual (en lugar del % de la categoría).',
    example: 85.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorResidual?: number;

  @ApiPropertyOptional({
    description: 'Override de la vida útil en meses (en lugar de la categoría).',
    example: 36,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  vidaUtilMesesOverride?: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  categoriaId!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  custodioId?: number;
}

export class UpdateBienDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serie?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaAdquisicion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorAdquisicion?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fuenteFinanciamiento?: string;

  @ApiPropertyOptional({ enum: ESTADOS_CONSERVACION })
  @IsOptional()
  @IsIn(ESTADOS_CONSERVACION as unknown as string[])
  estadoConservacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorResidual?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  vidaUtilMesesOverride?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  categoriaId?: number;
}

export class QueryBienDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por categoría' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  categoriaId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por custodio' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  custodioId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por ubicación (coincidencia parcial)' })
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({ description: 'Filtrar por bienes dados de baja' })
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) =>
    value === 'true' || value === true
      ? true
      : value === 'false' || value === false
        ? false
        : undefined,
  )
  @IsBoolean()
  dadoDeBaja?: boolean;
}

class CategoriaResumenDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nombre!: string;
}

class CustodioResumenDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nombre!: string;
}

export class BienListItemDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  codigo!: string;

  @ApiProperty()
  descripcion!: string;

  @ApiProperty({ nullable: true })
  marca!: string | null;

  @ApiProperty({ nullable: true })
  serie!: string | null;

  @ApiProperty()
  fechaAdquisicion!: string;

  @ApiProperty()
  valorAdquisicion!: number;

  @ApiProperty()
  estadoConservacion!: string;

  @ApiProperty({ nullable: true })
  ubicacion!: string | null;

  @ApiProperty()
  dadoDeBaja!: boolean;

  @ApiProperty({ type: CategoriaResumenDto, nullable: true })
  categoria!: CategoriaResumenDto | null;

  @ApiProperty({ type: CustodioResumenDto, nullable: true })
  custodio!: CustodioResumenDto | null;
}

export class BienResponseDto extends BienListItemDto {
  @ApiProperty({ nullable: true })
  modelo!: string | null;

  @ApiProperty({ nullable: true })
  fuenteFinanciamiento!: string | null;

  @ApiProperty({ nullable: true })
  valorResidual!: number | null;

  @ApiProperty({ nullable: true })
  vidaUtilMesesOverride!: number | null;

  @ApiProperty({ nullable: true })
  fechaBaja!: string | null;

  @ApiProperty({ nullable: true })
  motivoBaja!: string | null;

  @ApiProperty()
  estado!: boolean;

  @ApiProperty()
  fechaCreacion!: string;
}
