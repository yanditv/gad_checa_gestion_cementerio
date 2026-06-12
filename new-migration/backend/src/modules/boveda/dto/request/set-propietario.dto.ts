import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class SetPropietarioDto {
  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value != null ? Number(value) : null))
  personaId!: number | null;
}
