import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { toOptionalBoolean } from '../../../common/dto/dto-transforms';

export class UpdateUserStatusDto {
  @ApiProperty({ default: true })
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isActive: boolean;
}