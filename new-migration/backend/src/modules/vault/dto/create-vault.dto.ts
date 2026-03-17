import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { toNumber, toOptionalBoolean, toOptionalNumber, trimOptionalString, trimString } from '../../../common/dto/dto-transforms';

export class CreateVaultDto {
  @ApiProperty({ example: 'N-001' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  number: string;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 'Niche' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  type: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 240 })
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  price?: number;

  @ApiPropertyOptional({ example: 240 })
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  rentalPrice?: number;

  @ApiProperty()
  @Transform(({ value }) => trimString(value))
  @IsUUID()
  blockId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  floorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  ownerId?: string;
}