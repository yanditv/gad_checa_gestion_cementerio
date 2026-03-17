import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { trimString } from '../../../common/dto/dto-transforms';

export class PersonSearchQueryDto {
  @ApiProperty({ example: 'juan' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  q: string;
}