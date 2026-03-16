import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContratoService } from './contrato.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('contratos')
@Controller('contratos')
export class ContratoController {
  constructor(private service: ContratoService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
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
  getBovedasDisponibles(@Query() query: PaginationQueryDto, @Query('tipo') tipo?: string) {
    return this.service.getBovedasDisponibles(query, tipo);
  }

  @Get('numero-secuencial')
  getNumeroSecuencial(@Query('bovedaId') bovedaId?: string, @Query('isRenovacion') isRenovacion?: string) {
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
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
