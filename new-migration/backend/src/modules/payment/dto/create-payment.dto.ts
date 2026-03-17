import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { trimOptionalString, trimString } from '../../../common/dto/dto-transforms';

export class CreatePaymentDto {
  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Cash' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  paymentMethod: string;

  @ApiProperty({ example: '2026-03-17T10:30:00.000Z' })
  @Type(() => Date)
  @IsDate()
  paidAt: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  note?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  bankId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value)
    ? value
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter((item) => typeof item === 'string' && item.length > 0)
    : value)
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  installmentIds?: string[];
}