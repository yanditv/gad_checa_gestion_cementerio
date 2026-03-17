import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { trimString } from './dto-transforms';

export class IdParamDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Transform(({ value }) => trimString(value))
  @IsUUID()
  id: string;
}