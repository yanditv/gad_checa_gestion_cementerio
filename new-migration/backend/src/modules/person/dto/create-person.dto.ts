import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { normalizeOptionalEmail, toOptionalBoolean, trimOptionalString, trimString } from '../../../common/dto/dto-transforms';

export class CreatePersonDto {
  @ApiProperty({ example: '0102030405' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  identificationNumber: string;

  @ApiProperty({ example: 'Juan' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Perez' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  lastName: string;

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
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  identificationType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  personType?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;
}