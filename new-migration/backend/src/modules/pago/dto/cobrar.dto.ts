import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';

/**
 * Cobro multi-cuota:
 *   contratoId      → identifica el contrato cuyas cuotas se cobran.
 *   cuotasIds       → ≥1 cuotas a marcar como pagadas. Deben pertenecer
 *                     al contrato y estar pendientes (no pagadas, estado=true).
 *   metodoPago      → 'Efectivo' | 'Transferencia' | 'Banco' | 'Cheque' | 'Tarjeta'.
 *   bancoId         → opcional, requerido cuando metodoPago != 'Efectivo'.
 *   referencia      → comprobante / nº de transferencia / cheque.
 *   descuentoId     → opcional; el server valida porcentaje y reduce monto.
 *   fechaPago       → default hoy.
 *
 * Mora: el monto cobrado se calcula server-side aplicando
 * `Cementerio.tasaMoraDiaria` a cada cuota vencida. El cliente NO controla
 * el monto final.
 */
export class CobrarDto {
  @ApiProperty()
  @IsInt()
  contratoId!: number;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos una cuota' })
  @IsInt({ each: true })
  cuotasIds!: number[];

  @ApiProperty({ example: 'Efectivo' })
  @IsString()
  @IsNotEmpty()
  metodoPago!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  bancoId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  descuentoId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fechaPago?: string;
}
