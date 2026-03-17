import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { trimOptionalString } from '../../../common/dto/dto-transforms';

export class UserListQueryDto {
  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  search?: string;

  get resolvedSearch(): string | undefined {
    return this.search;
  }
}