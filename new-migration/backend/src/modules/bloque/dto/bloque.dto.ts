import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

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

  @ApiProperty()
  @IsInt()
  cementerioId!: number;

  /**
   * Si se envía un valor > 0, el servicio crea automáticamente N pisos
   * numerados de 1 a N al guardar el bloque. Paridad legado: el formulario
   * de creación de bloques permite definir cuántos pisos tiene.
   */
  @ApiProperty({ required: false, minimum: 0, maximum: 50, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  numeroPisos?: number;
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
  @IsBoolean()
  estado?: boolean;
}
