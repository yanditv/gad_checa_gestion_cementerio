import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { toOptionalBoolean, trimOptionalString, trimString } from '../../../common/dto/dto-transforms';

export class CreateBlockDto {
  @ApiProperty({ example: 'Block A' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Main block' })
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty()
  @Transform(({ value }) => trimString(value))
  @IsUUID()
  cemeteryId: string;
}