import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, Matches } from 'class-validator';

const SOLO_LETRAS_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.'-]+$/;

export class UpdatePersonaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'La identificación debe contener solo números' })
  numeroIdentificacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(SOLO_LETRAS_REGEX, {
    message: 'El nombre debe contener solo letras',
  })
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(SOLO_LETRAS_REGEX, {
    message: 'El apellido debe contener solo letras',
  })
  apellido?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d*$/, { message: 'El teléfono debe contener solo números' })
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoIdentificacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estadoCivil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profesion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nacionalidad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoPersona?: string;
}
