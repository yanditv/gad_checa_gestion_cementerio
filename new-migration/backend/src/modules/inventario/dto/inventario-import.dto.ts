import { ApiProperty } from '@nestjs/swagger';

class InventarioImportAdminDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nombre!: string;

  @ApiProperty()
  email!: string;
}

class InventarioImportErrorDto {
  @ApiProperty()
  fila!: number;

  @ApiProperty()
  sheet!: string;

  @ApiProperty()
  mensaje!: string;
}

export class InventarioImportListItemDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  filename!: string;

  @ApiProperty({ description: 'EN_PROGRESO | COMPLETADO | ERROR' })
  estado!: string;

  @ApiProperty()
  registrosProcesados!: number;

  @ApiProperty()
  categoriasCreadas!: number;

  @ApiProperty()
  custodiosCreados!: number;

  @ApiProperty()
  bienesCreados!: number;

  @ApiProperty()
  bienesActualizados!: number;

  @ApiProperty()
  tieneErrores!: boolean;

  @ApiProperty()
  fechaInicio!: string;

  @ApiProperty({ nullable: true })
  fechaFin!: string | null;

  @ApiProperty({ type: InventarioImportAdminDto, nullable: true })
  adminUser!: InventarioImportAdminDto | null;
}

export class InventarioImportResponseDto extends InventarioImportListItemDto {
  @ApiProperty({ nullable: true })
  mensajeError!: string | null;

  @ApiProperty({ type: [InventarioImportErrorDto] })
  errores!: InventarioImportErrorDto[];
}
