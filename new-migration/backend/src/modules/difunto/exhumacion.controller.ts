import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ExhumacionService } from './exhumacion.service';
import {
  CreateExhumacionDto,
  QueryExhumacionDto,
} from './dto/exhumacion.dto';
import { toExhumacionResponse } from './exhumacion.mapper';
import { buildActaExhumacionPdf } from './exhumacion.pdf';
import {
  buildExhumacionesCsv,
  buildExhumacionesExcel,
  buildExhumacionesPdf,
} from './exhumacion.report';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('exhumaciones')
@ApiBearerAuth()
@Controller('exhumaciones')
export class ExhumacionController {
  constructor(
    private service: ExhumacionService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @Roles('Administrador')
  @ApiOperation({ summary: 'Registrar una exhumación o traslado' })
  async create(
    @Body() dto: CreateExhumacionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const exhumacion = await this.service.registrar(dto, user.id);
    return exhumacion ? toExhumacionResponse(exhumacion) : null;
  }

  @Get()
  @ApiOperation({ summary: 'Listar exhumaciones (paginado, con filtros)' })
  async findAll(@Query() query: QueryExhumacionDto) {
    const { items, meta } = await this.service.findAll(query);
    return { items: items.map(toExhumacionResponse), meta };
  }

  // ---------------------------------------------------------------------------
  // Reporte / historial exportable (CAT-R4d / REP-R2)
  // ---------------------------------------------------------------------------
  @Get('reporte')
  @ApiOperation({ summary: 'Historial de exhumaciones (JSON, sin paginar)' })
  async reporte(@Query() query: QueryExhumacionDto) {
    const rows = await this.service.getHistorial(query);
    return { items: rows, total: rows.length };
  }

  @Get('reporte/pdf')
  @ApiOperation({ summary: 'Historial de exhumaciones en PDF' })
  async reportePdf(
    @Query() query: QueryExhumacionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const rows = await this.service.getHistorial(query);
    const buffer = await buildExhumacionesPdf(rows);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="historial-exhumaciones.pdf"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Get('reporte/excel')
  @ApiOperation({ summary: 'Historial de exhumaciones en Excel' })
  async reporteExcel(
    @Query() query: QueryExhumacionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const rows = await this.service.getHistorial(query);
    const buffer = buildExhumacionesExcel(rows);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="historial-exhumaciones.xlsx"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Get('reporte/csv')
  @ApiOperation({ summary: 'Historial de exhumaciones en CSV' })
  async reporteCsv(
    @Query() query: QueryExhumacionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const rows = await this.service.getHistorial(query);
    const buffer = buildExhumacionesCsv(rows);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="historial-exhumaciones.csv"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Get('boveda/:bovedaId')
  @ApiOperation({ summary: 'Exhumaciones cuya bóveda de origen es la indicada' })
  async findByBoveda(@Param('bovedaId', ParseIntPipe) bovedaId: number) {
    const rows = await this.service.findByBoveda(bovedaId);
    return rows.map(toExhumacionResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una exhumación' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const exhumacion = await this.service.findOne(id);
    return toExhumacionResponse(exhumacion);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Acta de exhumación en PDF' })
  async actaPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const exhumacion = await this.service.findOne(id);

    // Datos institucionales y bloque de la bóveda origen para el header/cuerpo.
    const bovedaOrigen = await this.prisma.boveda.findUnique({
      where: { id: exhumacion.bovedaOrigenId },
      select: {
        numero: true,
        tipo: true,
        bloque: { select: { nombre: true } },
      },
    });
    const bovedaDestino = exhumacion.bovedaDestinoId
      ? await this.prisma.boveda.findUnique({
          where: { id: exhumacion.bovedaDestinoId },
          select: {
            numero: true,
            tipo: true,
            bloque: { select: { nombre: true } },
          },
        })
      : null;

    const buffer = await buildActaExhumacionPdf({
      numeroActa: exhumacion.numeroActa,
      fechaExhumacion: exhumacion.fechaExhumacion,
      motivo: exhumacion.motivo,
      destino: exhumacion.destino,
      numeroAutorizacion: exhumacion.numeroAutorizacion,
      entidadAutorizante: exhumacion.entidadAutorizante,
      observaciones: exhumacion.observaciones,
      difunto: {
        nombre: exhumacion.difunto?.nombre ?? '',
        apellido: exhumacion.difunto?.apellido ?? '',
        numeroIdentificacion: exhumacion.difunto?.numeroIdentificacion ?? null,
      },
      bovedaOrigen: {
        numero: bovedaOrigen?.numero ?? '—',
        tipo: bovedaOrigen?.tipo ?? null,
        bloque: bovedaOrigen?.bloque?.nombre ?? null,
      },
      bovedaDestino: bovedaDestino
        ? {
            numero: bovedaDestino.numero,
            tipo: bovedaDestino.tipo,
            bloque: bovedaDestino.bloque?.nombre ?? null,
          }
        : null,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="acta-exhumacion-${exhumacion.numeroActa}.pdf"`,
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Post(':id/anular')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Anular una exhumación (revierte el efecto)' })
  async anular(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    const exhumacion = await this.service.anular(id, user.id);
    return exhumacion ? toExhumacionResponse(exhumacion) : null;
  }
}
