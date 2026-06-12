import { ApiProperty } from '@nestjs/swagger';

export class TipoEspacioResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nombre!: string;

  @ApiProperty({ nullable: true })
  prefijoNumeracion!: string | null;

  @ApiProperty()
  tarifaArriendo!: number;

  @ApiProperty()
  aniosArriendo!: number;

  @ApiProperty()
  vecesRenovacion!: number;

  @ApiProperty()
  estado!: boolean;
}
