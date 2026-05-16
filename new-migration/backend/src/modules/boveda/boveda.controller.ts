import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BovedaService } from './boveda.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UpdateBovedaDto } from './dto/request/update-boveda.dto';

class SetPropietarioDto {
  personaId!: number | null;
}

@ApiTags('bovedas')
@ApiBearerAuth()
@Controller('bovedas')
export class BovedaController {
  constructor(private service: BovedaService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get('bloque/:bloqueId')
  findByBloque(@Param('bloqueId', ParseIntPipe) bloqueId: number) {
    return this.service.findByBloque(bloqueId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/historial')
  @ApiOperation({
    summary: 'Histórico de contratos en la bóveda (activos e inactivos)',
  })
  findHistorial(@Param('id', ParseIntPipe) id: number) {
    return this.service.findHistorial(id);
  }

  @Post()
  create(@Body() dto: UpdateBovedaDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBovedaDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/propietario')
  @ApiOperation({
    summary: 'Asignar/quitar propietario de la bóveda',
    description:
      'Envía { personaId: number } para asignar o { personaId: null } para quitar.',
  })
  setPropietario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetPropietarioDto,
  ) {
    return this.service.setPropietario(
      id,
      dto.personaId == null ? null : Number(dto.personaId),
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
