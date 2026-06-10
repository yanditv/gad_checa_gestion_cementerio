import { ApiProperty } from '@nestjs/swagger';
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
