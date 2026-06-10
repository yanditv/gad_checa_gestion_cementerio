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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BovedaService } from './boveda.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { CreateBovedaDto, UpdateBovedaDto } from './dto/request/boveda.dto';

class SetPropietarioDto {
  personaId!: number | null;
}

@ApiTags('bovedas')
@ApiBearerAuth()
@Controller('bovedas')
export class BovedaController {
  constructor(private service: BovedaService) {}

  @Get()
  @ApiQuery({ name: 'bloqueId', required: false, type: Number })
  @ApiQuery({ name: 'tipo', required: false, type: String })
  @ApiQuery({ name: 'estado', required: false, type: String, description: 'disponible | ocupada' })
  @ApiQuery({ name: 'tienePropietario', required: false, type: String, description: 'con | sin' })
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('bloqueId') bloqueId?: string,
    @Query('tipo') tipo?: string,
    @Query('estado') estado?: string,
    @Query('tienePropietario') tienePropietario?: string,
  ) {
    return this.service.findAll(query, {
      bloqueId: bloqueId ? Number(bloqueId) : undefined,
      tipo,
      estado,
      tienePropietario,
    });
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
  create(
    @Body() dto: CreateBovedaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBovedaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
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
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.setPropietario(
      id,
      dto.personaId == null ? null : Number(dto.personaId),
      user.id,
    );
  }

  @Delete(':id')
  @Roles('Administrador')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }
}
