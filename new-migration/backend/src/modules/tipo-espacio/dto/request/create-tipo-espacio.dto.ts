import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTipoEspacioDto {
  @ApiProperty({ example: 'Bóveda' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre!: string;

  @ApiProperty({
    required: false,
    example: 'CTR',
    description: 'Prefijo para la numeración de contratos (CTR, NCH, TML…)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  prefijoNumeracion?: string;

  @ApiProperty({ example: 100, description: 'Tarifa de arriendo' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tarifaArriendo!: number;

  @ApiProperty({ example: 5, description: 'Años de arriendo' })
  @IsInt()
  @Min(0)
  aniosArriendo!: number;

  @ApiProperty({ example: 2, description: 'Veces que se puede renovar' })
  @IsInt()
  @Min(0)
  vecesRenovacion!: number;
}
