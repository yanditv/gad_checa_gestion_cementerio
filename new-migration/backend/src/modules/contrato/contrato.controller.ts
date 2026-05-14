import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContratoService } from './contrato.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RenovarContratoDto } from './dto/renovar-contrato.dto';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('contratos')
@ApiBearerAuth()
@Controller('contratos')
export class ContratoController {
  constructor(private service: ContratoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar contratos paginados (con filtros)' })
  findAll(@Query() query: PaginationQueryDto & { estado?: string }) {
    return this.service.findAll(query);
  }

  @Get('reportes')
  getReportes() {
    return this.service.getReportes();
  }

  @Get('create-metadata')
  getCreateMetadata() {
    return this.service.getCreateMetadata();
  }

  @Get('bovedas-disponibles')
  getBovedasDisponibles(
    @Query() query: PaginationQueryDto,
    @Query('tipo') tipo?: string,
  ) {
    return this.service.getBovedasDisponibles(query, tipo);
  }

  @Get('numero-secuencial')
  getNumeroSecuencial(
    @Query('bovedaId') bovedaId?: string,
    @Query('isRenovacion') isRenovacion?: string,
  ) {
    return this.service.getNumeroSecuencialPreview(
      bovedaId ? Number(bovedaId) : undefined,
      isRenovacion === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear contrato (wizard o simple)' })
  create(@Body() data: any, @CurrentUser() user: AuthUser) {
    return this.service.create(data, user.id);
  }

  @Post(':id/renovar')
  @ApiOperation({
    summary: 'Renovar un contrato existente',
    description:
      'Crea una renovación a partir del contrato indicado. Hereda bóveda y difunto del origen.',
  })
  renovar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RenovarContratoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.renovar(id, dto, user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
