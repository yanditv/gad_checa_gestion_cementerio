import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBovedaDto {
  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El número de la bóveda es obligatorio' })
  @MinLength(1, { message: 'El número de la bóveda es obligatorio' })
  @MaxLength(30, {
    message: 'El número de la bóveda no puede exceder 30 caracteres',
  })
  numero!: string;

  @ApiProperty({
    minimum: 1,
    description: 'Identificador del tipo de espacio (catálogo TipoEspacio)',
  })
  @IsInt({ message: 'Debe seleccionar un tipo de espacio' })
  @Min(1, { message: 'Debe seleccionar un tipo de espacio' })
  @Transform(({ value }) => Number(value))
  tipoEspacioId!: number;

  @ApiPropertyOptional({
    deprecated: true,
    description: 'Campo legado. Usar tipoEspacioId.',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  tipo?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  capacidad!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  bloqueId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  pisoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  precio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  precioArrendamiento?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  })
  @IsString()
  @MaxLength(150, {
    message: 'La ubicación no puede exceder 150 caracteres',
  })
  ubicacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  })
  @IsString()
  @MaxLength(300, {
    message: 'Las observaciones no pueden exceder 300 caracteres',
  })
  observaciones?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateBovedaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El número de la bóveda es obligatorio' })
  @MinLength(1, { message: 'El número de la bóveda es obligatorio' })
  @MaxLength(30, {
    message: 'El número de la bóveda no puede exceder 30 caracteres',
  })
  numero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  capacidad?: number;

  @ApiPropertyOptional({
    minimum: 1,
    description: 'Identificador del tipo de espacio (catálogo TipoEspacio)',
  })
  @IsOptional()
  @IsInt({ message: 'Debe seleccionar un tipo de espacio' })
  @Min(1, { message: 'Debe seleccionar un tipo de espacio' })
  @Transform(({ value }) => Number(value))
  tipoEspacioId?: number;

  @ApiPropertyOptional({
    deprecated: true,
    description: 'Campo legado. Usar tipoEspacioId.',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  tipo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  })
  @IsString()
  @MaxLength(300, {
    message: 'Las observaciones no pueden exceder 300 caracteres',
  })
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  })
  @IsString()
  @MaxLength(150, {
    message: 'La ubicación no puede exceder 150 caracteres',
  })
  ubicacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  precio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  precioArrendamiento?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  bloqueId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  pisoId?: number;
}
