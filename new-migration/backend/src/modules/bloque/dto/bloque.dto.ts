import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateBloqueDto {
  @ApiProperty()
  @IsString()
  nombre!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
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
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
