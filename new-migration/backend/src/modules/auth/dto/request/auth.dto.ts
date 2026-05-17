import {
  IsEmail,
  IsString,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Política de contraseña (paridad legada — Program.cs:118-123):
 *   longitud ≥ 6, una mayúscula, una minúscula, un dígito.
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 6 caracteres e incluir mayúscula, minúscula y un dígito';

export class LoginDto {
  @ApiProperty({ example: 'admin@teobu.com' })
  @IsEmail({}, { message: 'El correo no es válido' })
  email!: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  numeroIdentificacion!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  nombre!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  apellido!: string;

  @ApiProperty({ example: 'usuario@cementerio.com' })
  @IsEmail({}, { message: 'El correo no es válido' })
  email!: string;

  @ApiProperty({ example: 'Pass123' })
  @IsString()
  @MinLength(6, { message: PASSWORD_MESSAGE })
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;

  @ApiProperty({ example: 'CED', required: false })
  @IsOptional()
  @IsString()
  tipoIdentificacion?: string;

  @ApiProperty({ example: '0999999999', required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ example: 'Calle Principal', required: false })
  @IsOptional()
  @IsString()
  direccion?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@teobu.com' })
  @IsEmail({}, { message: 'El correo no es válido' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recibido por correo electrónico' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NuevaClave1' })
  @IsString()
  @MinLength(6, { message: PASSWORD_MESSAGE })
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NuevaClave1' })
  @IsString()
  @MinLength(6, { message: PASSWORD_MESSAGE })
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}
