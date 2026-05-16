import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateContratoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  bovedaId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  difuntoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaFin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  aniosArriendo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoArriendo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  tarifaArriendo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  responsablesIds?: number[];
}
