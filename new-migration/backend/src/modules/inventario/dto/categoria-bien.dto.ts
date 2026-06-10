import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCategoriaBienDto {
  @ApiProperty({ example: 'Equipo de cómputo' })
  @IsString()
  nombre!: string;

  @ApiProperty({ example: 3, description: 'Vida útil en años (tabla CGE 406-03)' })
  @IsInt()
  @Min(1)
  vidaUtilAnios!: number;

  @ApiProperty({
    required: false,
    example: 10,
    description: 'Porcentaje de valor residual (0–100). Por defecto 10%.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  valorResidualPct?: number;
}

export class UpdateCategoriaBienDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  vidaUtilAnios?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  valorResidualPct?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class CategoriaBienResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nombre!: string;

  @ApiProperty()
  vidaUtilAnios!: number;

  @ApiProperty()
  valorResidualPct!: number;

  @ApiProperty()
  estado!: boolean;
}
