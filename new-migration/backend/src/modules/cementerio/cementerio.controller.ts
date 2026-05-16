import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CementerioService } from './cementerio.service';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { UpdateGADInformacionDto } from './dto/request/gad-informacion.dto';
import { UpdateCementerioDto } from './dto/request/update-cementerio.dto';
import { CementerioResponseDto, GADInformacionResponseDto } from './dto/response/cementerio.response.dto';

@ApiTags('cementerios')
@ApiBearerAuth()
@Controller('cementerios')
export class CementerioController {
  constructor(private service: CementerioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cementerios activos' })
  @ApiResponse({ status: 200, type: CementerioResponseDto, isArray: true })
  findAll() {
    return this.service.findAll();
  }

  @Get('gad-informacion')
  @ApiOperation({ summary: 'Obtener información del GAD' })
  @ApiResponse({ status: 200, type: GADInformacionResponseDto })
  getGADInformacion() {
    return this.service.getGADInformacion();
  }

  @Put('gad-informacion')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Actualizar información del GAD' })
  @ApiResponse({ status: 200, type: GADInformacionResponseDto })
  updateGADInformacion(@Body() dto: UpdateGADInformacionDto, @CurrentUser() user: AuthUser) {
    return this.service.updateGADInformacion(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar cementerio por ID' })
  @ApiResponse({ status: 200, type: CementerioResponseDto })
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  @Roles('Administrador')
  @ApiOperation({ summary: 'Crear cementerio' })
  @ApiResponse({ status: 201, type: CementerioResponseDto })
  create(@Body() dto: UpdateCementerioDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Put(':id')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Actualizar cementerio' })
  @ApiResponse({ status: 200, type: CementerioResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateCementerioDto, @CurrentUser() user: AuthUser) {
    return this.service.update(+id, dto, user.id);
  }

  @Delete(':id')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Eliminar cementerio (lógico)' })
  @ApiResponse({ status: 200, type: CementerioResponseDto })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(+id, user.id);
  }
}
