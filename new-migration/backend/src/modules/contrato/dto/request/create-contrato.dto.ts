import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/** Plan de cuotas. `unico` colapsa todo el monto en una cuota con vencimiento
 *  = fechaInicio del contrato. Los demás distribuyen el monto en partes
 *  iguales con la periodicidad indicada. */
export const PLANES_CUOTA = [
  'unico',
  'mensual',
  'trimestral',
  'semestral',
  'anual',
] as const;
export type PlanCuota = (typeof PLANES_CUOTA)[number];

export class ContratoCabeceraDto {
  @ApiProperty()
  @IsInt()
  bovedaId!: number;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  fechaInicio!: string;

  @ApiProperty({ example: 5, description: 'Años de duración del contrato' })
  @IsInt()
  @Min(1)
  numeroDeMeses!: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  esRenovacion?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  contratoOrigenId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  contratoRelacionadoId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  descuentoId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class DifuntoWizardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  apellidos!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroIdentificacion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaFallecimiento?: string;
}

export class ResponsableWizardDto {
  /**
   * Si esExistente=true, `id` debe ser el id de la Persona ya registrada.
   * Si esExistente=false, los campos `nombres`/`apellidos`/`numeroIdentificacion`
   * son obligatorios para crear la persona desde el wizard.
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty()
  @IsBoolean()
  esExistente!: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombres?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apellidos?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tipoIdentificacion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroIdentificacion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido' })
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parentesco?: string;
}

export class PagoWizardDto {
  @ApiProperty({ enum: PLANES_CUOTA, default: 'anual' })
  @IsIn(PLANES_CUOTA as unknown as string[])
  plan!: PlanCuota;

  @ApiProperty({ example: 'Efectivo' })
  @IsString()
  @IsNotEmpty()
  tipoPago!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  bancoId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroComprobante?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacion?: string;

  /** Números de cuota (1..N) que se cobran al momento de crear el contrato. */
  @ApiProperty({ type: [Number], required: false, default: [] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  cuotasSeleccionadas?: number[];

  /** Fecha del pago inicial; default = hoy. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaPago?: string;
}

export class CreateContratoWizardDto {
  @ApiProperty({ type: ContratoCabeceraDto })
  @ValidateNested()
  @Type(() => ContratoCabeceraDto)
  contrato!: ContratoCabeceraDto;

  @ApiProperty({ type: DifuntoWizardDto })
  @ValidateNested()
  @Type(() => DifuntoWizardDto)
  difunto!: DifuntoWizardDto;

  @ApiProperty({ type: [ResponsableWizardDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe registrar al menos un responsable' })
  @ValidateNested({ each: true })
  @Type(() => ResponsableWizardDto)
  responsables!: ResponsableWizardDto[];

  @ApiProperty({ type: PagoWizardDto })
  @ValidateNested()
  @Type(() => PagoWizardDto)
  pago!: PagoWizardDto;
}

/** DTO simple para creaciones no-wizard (poco común). Permite cualquier campo;
 *  el service lo procesa por separado. */
export class CreateContratoSimpleDto {
  @ApiProperty()
  @IsInt()
  bovedaId!: number;

  @ApiProperty()
  @IsInt()
  difuntoId!: number;

  @ApiProperty()
  @IsDateString()
  fechaInicio!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  numeroDeMeses!: number;

  @ApiProperty()
  @IsNumber()
  montoTotal!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  responsablesIds?: number[];
}
