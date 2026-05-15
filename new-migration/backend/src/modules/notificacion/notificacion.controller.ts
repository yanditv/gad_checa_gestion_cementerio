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
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
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
  @ApiOperation({ summary: 'Listar notificaciones del usuario autenticado (paginado, filtrable por leída)' })
  findAll(@Query() query: ListNotificacionesDto, @CurrentUser() user: AuthUser) {
    return this.service.findAll(query, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de notificación (solo propia)' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user.id);
  }

  @Post()
  @Roles('Administrador')
  @ApiOperation({ summary: 'Crear notificación (solo administrador, para jobs y sistema)' })
  create(@Body() dto: CreateNotificacionDto) {
    return this.service.create(dto);
  }

  @Patch(':id/leida')
  @ApiOperation({ summary: 'Marcar notificación propia como leída' })
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.markRead(id, user.id);
  }
}
