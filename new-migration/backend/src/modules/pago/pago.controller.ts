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
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PagoService } from './pago.service';
import { CobrarDto } from './dto/cobrar.dto';
import { CreatePagoDto } from './dto/request/create-pago.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { buildFacturaPdfBuffer } from './pago.pdf';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Paginated } from '../../common/decorators/paginated.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('pagos')
@ApiBearerAuth()
@Controller('pagos')
export class PagoController {
  constructor(private service: PagoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pagos (paginado)' })
  @Paginated()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get('cobro-preview')
  @ApiOperation({
    summary: 'Preview de cobro: cuotas pendientes del contrato con mora',
  })
  getCobroPreview(@Query('contratoId', ParseIntPipe) contratoId: number) {
    return this.service.getCobroPreview(contratoId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/factura.pdf')
  @ApiOperation({ summary: 'Descargar factura PDF del pago' })
  async factura(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const [pago, institucion] = await Promise.all([
      this.service.findOne(id),
      this.service.getInstitucion(),
    ]);
    const buffer = await buildFacturaPdfBuffer(pago, institucion);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Recibo_${pago.numeroRecibo}.pdf"`,
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Post('cobrar')
  @ApiOperation({ summary: 'Cobrar una o más cuotas de un contrato' })
  cobrar(@Body() dto: CobrarDto, @CurrentUser() user: AuthUser) {
    return this.service.cobrar(dto, user.id);
  }

  @Post(':id/anular')
  @Roles('Administrador')
  @ApiOperation({
    summary: 'Anular un pago (solo Administrador)',
    description:
      'Revierte las cuotas a pendientes y marca el pago como inactivo.',
  })
  anular(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.anular(id, user.id, user.roles ?? []);
  }

  @Post()
  @ApiOperation({ summary: 'Crear pago (legacy)' })
  create(@Body() dto: CreatePagoDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreatePagoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Administrador')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id, user.roles ?? []);
  }
}
