import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { normalizeOptionalEmail, toOptionalBoolean, trimOptionalString, trimString } from '../../../common/dto/dto-transforms';

export class CreateCemeteryDto {
  @ApiProperty({ example: 'General Cemetery' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalEmail(value))
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;
}