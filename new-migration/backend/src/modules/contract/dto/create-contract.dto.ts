import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { toDate, toNumber, toOptionalBoolean, toOptionalDate, toTrimmedStringArray, trimOptionalString, trimString } from '../../../common/dto/dto-transforms';

export class CreateContractDto {
  @ApiProperty()
  @Transform(({ value }) => trimString(value))
  @IsString()
  sequentialNumber: string;

  @ApiProperty()
  @Transform(({ value }) => toDate(value))
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalDate(value))
  @IsDate()
  endDate?: Date;

  @ApiProperty()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  monthCount: number;

  @ApiProperty()
  @Transform(({ value }) => toNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  totalAmount: number;

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
  signedDocumentPath?: string;

  @ApiProperty()
  @Transform(({ value }) => trimString(value))
  @IsUUID()
  vaultId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  deceasedId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  responsiblePartyId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Single responsible party id only.' })
  @IsOptional()
  @Transform(({ value }) => toTrimmedStringArray(value))
  @IsArray()
  @ArrayMaxSize(1)
  @IsUUID(undefined, { each: true })
  responsibleIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  sourceContractId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  relatedContractId?: string;

  get resolvedResponsibleIds(): string[] | undefined {
    if (this.responsibleIds === undefined) {
      return undefined;
    }

    if (!Array.isArray(this.responsibleIds)) {
      throw new BadRequestException('A vault can only have one responsible party.');
    }

    const normalizedIds = [...new Set(this.responsibleIds.map((id) => String(id)).filter(Boolean))];
    if (normalizedIds.length > 1) {
      throw new BadRequestException('A vault can only have one responsible party.');
    }

    return normalizedIds;
  }

  get resolvedResponsibleId(): string | undefined {
    return this.resolvedResponsibleIds?.[0];
  }

  toContractData(): Partial<CreateContractDto> {
    const { responsibleIds: _responsibleIds, responsiblePartyId: _responsiblePartyId, ...contractData } = this;
    return contractData;
  }
}