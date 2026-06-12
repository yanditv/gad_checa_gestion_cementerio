import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class QueryTipoEspacioDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Incluir también los tipos de espacio dados de baja (para administración del catálogo).',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true
      ? true
      : value === 'false' || value === false
        ? false
        : undefined,
  )
  @IsBoolean()
  includeInactive?: boolean;
}
