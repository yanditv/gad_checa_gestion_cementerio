import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GetContratosQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  estado?: string;
}
