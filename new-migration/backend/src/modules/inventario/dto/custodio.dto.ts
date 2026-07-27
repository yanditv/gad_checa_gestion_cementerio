import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCustodioDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  nombre!: string;

  @ApiProperty({ required: false, example: '0102030405' })
  @IsOptional()
  @IsString()
  identificacion?: string;

  @ApiProperty({ required: false, example: 'Secretario' })
  @IsOptional()
  @IsString()
  cargo?: string;
}

export class UpdateCustodioDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  identificacion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class CustodioResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nombre!: string;

  @ApiProperty({ nullable: true })
  identificacion!: string | null;

  @ApiProperty({ nullable: true })
  cargo!: string | null;

  @ApiProperty()
  estado!: boolean;
}

export class QueryCustodioDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Incluir también custodios inactivos',
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
