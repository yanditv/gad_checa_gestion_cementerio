import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PagoWizardDto } from './create-contrato.dto';

/**
 * Payload de renovación. La bóveda y el difunto se heredan del contrato
 * origen (no es necesario re-enviarlos). Por defecto se reutilizan los
 * responsables del origen; si se envían `responsablesIds`, se reemplazan.
 */
export class RenovarContratoDto {
  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  fechaInicio!: string;

  @ApiProperty({ example: 5, description: 'Años de duración del contrato' })
  @IsInt()
  @Min(1)
  numeroDeMeses!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  descuentoId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  /**
   * IDs de Persona (no de Responsable) que actuarán como responsables del
   * nuevo contrato. Si se omite, se reutilizan los del origen.
   */
  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsInt({ each: true })
  responsablesPersonaIds?: number[];

  @ApiProperty({ type: PagoWizardDto })
  @ValidateNested()
  @Type(() => PagoWizardDto)
  pago!: PagoWizardDto;
}
