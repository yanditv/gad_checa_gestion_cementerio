import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { trimOptionalString } from '../../../common/dto/dto-transforms';

export class AvailableVaultsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'niche' })
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  type?: string;

  get resolvedType(): string | undefined {
    return this.type;
  }
}