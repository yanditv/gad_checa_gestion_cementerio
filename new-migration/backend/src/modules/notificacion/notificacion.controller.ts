import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificacionService } from './notificacion.service';
import {
  CreateNotificacionDto,
  ListNotificacionesDto,
} from './dto/notificacion.dto';

@ApiTags('notificaciones')
@ApiBearerAuth()
@Controller('notificaciones')
export class NotificacionController {
  constructor(private service: NotificacionService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones (paginado, filtrable por usuario y leída)' })
  findAll(@Query() query: ListNotificacionesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de notificación' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear notificación (para jobs y sistema)' })
  create(@Body() dto: CreateNotificacionDto) {
    return this.service.create(dto);
  }

  @Patch(':id/leida')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.service.markRead(id);
  }
}
