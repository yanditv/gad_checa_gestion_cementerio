import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CementerioResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombre: string;

  @ApiPropertyOptional()
  direccion?: string;

  @ApiPropertyOptional()
  telefono?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  ruc?: string;

  @ApiPropertyOptional()
  abreviaturaTituloPresidente?: string;

  @ApiPropertyOptional()
  presidente?: string;

  @ApiProperty()
  vecesRenovacionBovedas: number;

  @ApiProperty()
  vecesRenovacionNicho: number;

  @ApiProperty()
  aniosArriendoBovedas: number;

  @ApiProperty()
  aniosArriendoNicho: number;

  @ApiPropertyOptional()
  tarifaArriendo: number | null;

  @ApiPropertyOptional()
  tarifaArriendoNicho: number | null;

  @ApiPropertyOptional()
  entidadFinanciera?: string;

  @ApiPropertyOptional()
  nombreEntidadFinanciera?: string;

  @ApiPropertyOptional()
  numeroCuenta?: string;

  @ApiProperty()
  tasaMoraDiaria: number;

  @ApiProperty()
  estado: boolean;

  @ApiPropertyOptional()
  contratoPreambulo?: string;

  @ApiPropertyOptional()
  contratoClausula1?: string;

  @ApiPropertyOptional()
  contratoClausula2?: string;

  @ApiPropertyOptional()
  contratoClausula3?: string;

  @ApiPropertyOptional()
  contratoClausula4?: string;

  @ApiPropertyOptional()
  contratoClausula5?: string;

  @ApiPropertyOptional()
  contratoClausula6?: string;
}

export class GADInformacionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  direccion: string;

  @ApiProperty()
  telefono: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  ruc: string;

  @ApiPropertyOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  mision?: string;

  @ApiPropertyOptional()
  vision?: string;

  @ApiPropertyOptional()
  slogan?: string;

  @ApiProperty()
  usarHeaderImagen: boolean;

  @ApiPropertyOptional()
  headerImagenUrl?: string;

  @ApiProperty()
  usarFooterImagen: boolean;

  @ApiPropertyOptional()
  footerImagenUrl?: string;

  @ApiProperty()
  fechaCreacion: string;

  @ApiPropertyOptional()
  fechaActualizacion?: string;
}

export class GADImageUploadResponseDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  logoUrl: string;
}
