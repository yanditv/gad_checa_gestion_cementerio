import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Campos del difunto. La identificación (`numeroIdentificacion`) es
 * opcional porque históricamente algunos registros del catastro no la
 * tienen. Las fechas se validan en el service: nacimiento < defunción.
 */
export class CreateDifuntoDto {
  @ApiProperty()
  @IsString()
  nombre!: string;

  @ApiProperty()
  @IsString()
  apellido!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroIdentificacion?: string;

  @ApiProperty()
  @IsInt()
  bovedaId!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaDefuncion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaInhumacion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  causaMuerte?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  genero?: string;

  // ---- Datos complementarios (Fase 0 §1.6 DIF-* / manual de usuario)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nacionalidad?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  estadoCivil?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lugarNacimiento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lugarDefuncion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombreConyuge?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombrePadre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombreMadre?: string;

  // ---- Certificado de defunción
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroCertificadoDefuncion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadEmisora?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaEmisionCertificado?: string;
}

export class UpdateDifuntoDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apellido?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroIdentificacion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  bovedaId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaDefuncion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaInhumacion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  causaMuerte?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  genero?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nacionalidad?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  estadoCivil?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lugarNacimiento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lugarDefuncion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombreConyuge?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombrePadre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombreMadre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroCertificadoDefuncion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadEmisora?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaEmisionCertificado?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
