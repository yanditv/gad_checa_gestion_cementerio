import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TipoEspacioService } from './tipo-espacio.service';
import { CreateTipoEspacioDto } from './dto/request/create-tipo-espacio.dto';
import { UpdateTipoEspacioDto } from './dto/request/update-tipo-espacio.dto';
import { TipoEspacioResponseDto } from './dto/response/tipo-espacio.response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('tipos-espacio')
@ApiBearerAuth()
@Controller('tipos-espacio')
export class TipoEspacioController {
  constructor(private service: TipoEspacioService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar tipos de espacio (para selects y administración)',
  })
  @ApiResponse({ type: TipoEspacioResponseDto, isArray: true })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de espacio' })
  @ApiResponse({ type: TipoEspacioResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Crear tipo de espacio (solo Administrador)' })
  @ApiResponse({ type: TipoEspacioResponseDto })
  create(
    @Body() dto: CreateTipoEspacioDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Actualizar tipo de espacio (solo Administrador)' })
  @ApiResponse({ type: TipoEspacioResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoEspacioDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({
    summary: 'Dar de baja (lógicamente) un tipo de espacio (solo Administrador)',
  })
  @ApiResponse({ type: TipoEspacioResponseDto })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }
}
