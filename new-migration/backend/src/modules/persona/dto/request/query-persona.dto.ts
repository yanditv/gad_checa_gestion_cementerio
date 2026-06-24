import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class QueryPersonaDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['Persona', 'Propietario', 'Responsable'],
    description: 'Filtra por tipo de persona.',
  })
  @IsOptional()
  @IsIn(['Persona', 'Propietario', 'Responsable'])
  tipo?: string;
}
