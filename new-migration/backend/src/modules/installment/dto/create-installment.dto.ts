import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { toNumber, toOptionalBoolean, trimOptionalString, trimString } from '../../../common/dto/dto-transforms';

export class CreateInstallmentDto {
  @ApiProperty({ example: 1 })
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  number: number;

  @ApiProperty({ example: 48 })
  @Transform(({ value }) => toNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @ApiProperty({ example: '2026-03-17' })
  @Transform(({ value }) => trimString(value))
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: '2026-03-17' })
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty()
  @Transform(({ value }) => trimString(value))
  @IsUUID()
  contractId: string;
}