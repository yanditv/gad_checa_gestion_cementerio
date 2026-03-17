import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { normalizeOptionalEmail, trimOptionalString } from '../../../common/dto/dto-transforms';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  identificationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalEmail(value))
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  phone?: string;

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
}