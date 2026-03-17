import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { normalizeEmail, normalizeOptionalEmail, trimOptionalString, trimString } from '../../../common/dto/dto-transforms';

export class RegisterUserDto {
  @ApiProperty({ example: '1234567890' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  identificationNumber: string;

  @ApiProperty({ example: 'John' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'admin@cemetery.com' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'CED' })
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  identificationType?: string;

  @ApiPropertyOptional({ example: '0999999999' })
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Main Street' })
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  address?: string;
}