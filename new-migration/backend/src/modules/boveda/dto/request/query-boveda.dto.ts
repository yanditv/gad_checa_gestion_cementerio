import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class QueryBovedaDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  bloqueId?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  tipoEspacioId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['disponible', 'ocupada'])
  estado?: string;

  @IsOptional()
  @IsString()
  @IsIn(['con', 'sin'])
  tienePropietario?: string;
}
