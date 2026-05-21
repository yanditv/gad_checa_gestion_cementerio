import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ListNotificacionesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'true = solo no leídas, false = solo leídas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : undefined)
  leida?: boolean;
}

export class CreateNotificacionDto {
  @ApiProperty({ example: 'ContratoPorVencer' })
  @IsString()
  tipo!: string;

  @ApiProperty({ example: 'Contrato por vencer' })
  @IsString()
  titulo!: string;

  @ApiProperty({ example: 'El contrato CTR-GADCHECA-2026-001 vence en 30 días.' })
  @IsString()
  mensaje!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  usuarioId!: string;

  @ApiPropertyOptional({ example: 'Contrato' })
  @IsOptional()
  @IsString()
  entidadTipo?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  entidadId?: number;
}
