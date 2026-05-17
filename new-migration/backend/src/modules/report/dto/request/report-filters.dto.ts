import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class DateRangeDto {
  @ApiPropertyOptional({ description: 'Fecha inicial (ISO yyyy-MM-dd)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Fecha final (ISO yyyy-MM-dd)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}

export class BovedasFilterDto {
  @ApiPropertyOptional({
    description: 'Tipo de bóveda: "Boveda" | "Nicho"',
  })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({
    description: 'Nombre del bloque (filtro de igualdad exacta)',
  })
  @IsOptional()
  @IsString()
  bloque?: string;

  @ApiPropertyOptional({
    description: 'Estado calculado: disponible | ocupada | por_caducar | vencida',
  })
  @IsOptional()
  @IsString()
  estado?: string;
}
