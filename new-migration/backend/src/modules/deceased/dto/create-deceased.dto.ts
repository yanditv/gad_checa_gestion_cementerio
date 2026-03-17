import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { toNumber, toOptionalBoolean, trimOptionalString, trimString } from '../../../common/dto/dto-transforms';

export class CreateDeceasedDto {
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
  identificationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  causeOfDeath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(0)
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty()
  @Transform(({ value }) => trimString(value))
  @IsUUID()
  vaultId: string;
}