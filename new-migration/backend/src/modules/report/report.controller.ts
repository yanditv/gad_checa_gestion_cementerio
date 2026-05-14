import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportService } from './report.service';
import {
  BovedasFilterDto,
  DateRangeDto,
} from './dto/report-filters.dto';
import { buildIngresosPdf } from './pdf/ingresos.pdf';
import { buildCuentasPorCobrarPdf } from './pdf/cuentas.pdf';
import { buildBovedasPdf } from './pdf/bovedas.pdf';
import { buildBloquesPdf } from './pdf/bloques.pdf';
import {
  buildBloquesExcel,
  buildBovedasExcel,
  buildCuentasExcel,
  buildIngresosExcel,
} from './excel/report.excel';

@ApiTags('reportes')
@ApiBearerAuth()
@Controller('reportes')
export class ReportController {
  constructor(private service: ReportService) {}

  // ---------------------------------------------------------------------------
  // JSON
  // ---------------------------------------------------------------------------
  @Get('resumen')
  resumen(@Query() q: DateRangeDto) {
    return this.service.getResumen(q.desde, q.hasta);
  }

  @Get('ingresos')
  ingresos(@Query() q: DateRangeDto) {
    return this.service.getIngresos(q.desde, q.hasta);
  }

  @Get('cuentas-por-cobrar')
  cuentasPorCobrar() {
    return this.service.getCuentasPorCobrar();
  }

  @Get('bovedas')
  bovedas(@Query() q: BovedasFilterDto) {
    return this.service.getBovedas(q.tipo, q.bloque, q.estado);
  }

  @Get('bloques')
  bloques() {
    return this.service.getBloques();
  }

  @Get('comparativa')
  comparativa() {
    return this.service.getComparativaMensual();
  }

  // ---------------------------------------------------------------------------
  // PDF
  // ---------------------------------------------------------------------------
  @Get('ingresos/pdf')
  @ApiOperation({ summary: 'PDF de ingresos en rango' })
  async ingresosPdf(@Query() q: DateRangeDto, @Res() res: Response) {
    const data = await this.service.getIngresos(q.desde, q.hasta);
    const buffer = await buildIngresosPdf(data);
    sendPdf(res, buffer, 'reporte-ingresos.pdf');
  }

  @Get('cuentas-por-cobrar/pdf')
  @ApiOperation({ summary: 'PDF de cuentas por cobrar' })
  async cuentasPdf(@Res() res: Response) {
    const data = await this.service.getCuentasPorCobrar();
    const buffer = await buildCuentasPorCobrarPdf(data);
    sendPdf(res, buffer, 'cuentas-por-cobrar.pdf');
  }

  @Get('bovedas/pdf')
  @ApiOperation({ summary: 'PDF del reporte de bóvedas' })
  async bovedasPdf(@Query() q: BovedasFilterDto, @Res() res: Response) {
    const data = await this.service.getBovedas(q.tipo, q.bloque, q.estado);
    const buffer = await buildBovedasPdf(data);
    sendPdf(res, buffer, 'reporte-bovedas.pdf');
  }

  @Get('bloques/pdf')
  @ApiOperation({ summary: 'PDF de ocupación por bloque' })
  async bloquesPdf(@Res() res: Response) {
    const data = await this.service.getBloques();
    const buffer = await buildBloquesPdf(data);
    sendPdf(res, buffer, 'reporte-bloques.pdf');
  }

  // ---------------------------------------------------------------------------
  // Excel
  // ---------------------------------------------------------------------------
  @Get('ingresos/excel')
  @ApiOperation({ summary: 'Excel de ingresos en rango' })
  async ingresosExcel(@Query() q: DateRangeDto, @Res() res: Response) {
    const data = await this.service.getIngresos(q.desde, q.hasta);
    sendExcel(res, buildIngresosExcel(data), 'reporte-ingresos.xlsx');
  }

  @Get('cuentas-por-cobrar/excel')
  @ApiOperation({ summary: 'Excel de cuentas por cobrar' })
  async cuentasExcel(@Res() res: Response) {
    const data = await this.service.getCuentasPorCobrar();
    sendExcel(res, buildCuentasExcel(data), 'cuentas-por-cobrar.xlsx');
  }

  @Get('bovedas/excel')
  @ApiOperation({ summary: 'Excel del reporte de bóvedas' })
  async bovedasExcel(@Query() q: BovedasFilterDto, @Res() res: Response) {
    const data = await this.service.getBovedas(q.tipo, q.bloque, q.estado);
    sendExcel(res, buildBovedasExcel(data), 'reporte-bovedas.xlsx');
  }

  @Get('bloques/excel')
  @ApiOperation({ summary: 'Excel de ocupación por bloque' })
  async bloquesExcel(@Res() res: Response) {
    const data = await this.service.getBloques();
    sendExcel(res, buildBloquesExcel(data), 'reporte-bloques.xlsx');
  }
}

function sendPdf(res: Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Content-Length', String(buffer.length));
  res.end(buffer);
}

function sendExcel(res: Response, buffer: Buffer, filename: string) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', String(buffer.length));
  res.end(buffer);
}
