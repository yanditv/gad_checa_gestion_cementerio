import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateBancoDto {
  @ApiProperty({ example: 'Banco del Austro' })
  @IsString()
  nombre!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cuenta?: string;
}

export class UpdateBancoDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cuenta?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
