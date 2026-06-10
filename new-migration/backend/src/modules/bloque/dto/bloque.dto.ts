import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PisoPrecioDto {
  @ApiProperty()
  @IsInt()
  numeroPiso!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value != null ? Number(value) : null))
  precio?: number | null;
}

export class CreateBloqueDto {
  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El nombre del bloque es obligatorio' })
  @MinLength(2, {
    message: 'El nombre del bloque debe tener al menos 2 caracteres',
  })
  @MaxLength(80, {
    message: 'El nombre del bloque no puede exceder 80 caracteres',
  })
  nombre!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  })
  @IsString()
  @MaxLength(200, {
    message: 'La descripción no puede exceder 200 caracteres',
  })
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsIn(['Bovedas', 'Nichos'], {
    message: 'El tipo debe ser Bovedas o Nichos',
  })
  tipo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value != null ? Number(value) : null))
  tarifaBase?: number | null;

  @ApiProperty()
  @IsInt()
  cementerioId!: number;

  @ApiProperty({ required: false, minimum: 0, maximum: 50, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  numeroPisos?: number;

  @ApiProperty({ required: false, minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bovedasPorPiso?: number;

  @ApiProperty({ required: false, type: [PisoPrecioDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PisoPrecioDto)
  preciosPorPiso?: PisoPrecioDto[];
}

export class UpdateBloqueDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El nombre del bloque es obligatorio' })
  @MinLength(2, {
    message: 'El nombre del bloque debe tener al menos 2 caracteres',
  })
  @MaxLength(80, {
    message: 'El nombre del bloque no puede exceder 80 caracteres',
  })
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  })
  @IsString()
  @MaxLength(200, {
    message: 'La descripción no puede exceder 200 caracteres',
  })
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsIn(['Bovedas', 'Nichos'], {
    message: 'El tipo debe ser Bovedas o Nichos',
  })
  tipo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value != null ? Number(value) : null))
  tarifaBase?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @ApiProperty({ required: false, minimum: 0, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  numeroPisos?: number;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bovedasPorPiso?: number;

  @ApiProperty({ required: false, type: [PisoPrecioDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PisoPrecioDto)
  preciosPorPiso?: PisoPrecioDto[];
}
