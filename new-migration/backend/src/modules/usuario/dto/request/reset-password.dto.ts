import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Cuerpo opcional para el reset administrativo. El admin puede:
 *   - Pedir que la contraseña temporal se envíe por email al usuario
 *     (`notifyByEmail=true`, default).
 *   - O recibirla en la respuesta para entregarla por otro canal
 *     (`notifyByEmail=false`).
 */
export class ResetPasswordDto {
  @ApiPropertyOptional({
    description:
      'Si es true, se envía la nueva contraseña por email al usuario (si SMTP está configurado). Default: true.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  notifyByEmail?: boolean;
}
