import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateIf } from 'class-validator';
import { toDate, toNumber, toOptionalBoolean, toTrimmedStringArray, trimNullableString, trimOptionalString, trimString } from '../../../common/dto/dto-transforms';

export class CreatePaymentDto {
  @ApiProperty({ example: 120 })
  @Transform(({ value }) => toNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Cash' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  paymentMethod: string;

  @ApiProperty({ example: '2026-03-17T10:30:00.000Z' })
  @Transform(({ value }) => toDate(value))
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
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimNullableString(value))
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  bankId?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => toTrimmedStringArray(value))
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  installmentIds?: string[];
}