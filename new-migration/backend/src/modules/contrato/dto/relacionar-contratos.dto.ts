import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

/**
 * Relación lateral entre dos contratos que comparten la misma bóveda.
 * El destino debe estar en la misma bóveda y tener un difunto distinto.
 * El vínculo se setea bidireccionalmente:
 *   A.contratoRelacionadoId = B.id
 *   B.contratoRelacionadoId = A.id
 */
export class RelacionarContratosDto {
  @ApiProperty({
    description: 'ID del otro contrato a vincular (mismo bovedaId, difunto distinto)',
    example: 42,
  })
  @IsInt()
  contratoIdB!: number;
}
