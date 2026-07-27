import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
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
  async ingresosPdf(@Query() q: DateRangeDto, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const [data, institucion] = await Promise.all([
      this.service.getIngresos(q.desde, q.hasta),
      this.service.getInstitucion(),
    ]);
    const buffer = await buildIngresosPdf(data, institucion);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="reporte-ingresos.pdf"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Get('cuentas-por-cobrar/pdf')
  @ApiOperation({ summary: 'PDF de cuentas por cobrar' })
  async cuentasPdf(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const [data, institucion] = await Promise.all([
      this.service.getCuentasPorCobrar(),
      this.service.getInstitucion(),
    ]);
    const buffer = await buildCuentasPorCobrarPdf(data, institucion);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="cuentas-por-cobrar.pdf"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Get('bovedas/pdf')
  @ApiOperation({ summary: 'PDF del reporte de bóvedas' })
  async bovedasPdf(@Query() q: BovedasFilterDto, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const [data, institucion] = await Promise.all([
      this.service.getBovedas(q.tipo, q.bloque, q.estado),
      this.service.getInstitucion(),
    ]);
    const buffer = await buildBovedasPdf(data, institucion);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="reporte-bovedas.pdf"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Get('bloques/pdf')
  @ApiOperation({ summary: 'PDF de ocupación por bloque' })
  async bloquesPdf(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const [data, institucion] = await Promise.all([
      this.service.getBloques(),
      this.service.getInstitucion(),
    ]);
    const buffer = await buildBloquesPdf(data, institucion);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="reporte-bloques.pdf"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  // ---------------------------------------------------------------------------
  // Excel
  // ---------------------------------------------------------------------------
  @Get('ingresos/excel')
  @ApiOperation({ summary: 'Excel de ingresos en rango' })
  async ingresosExcel(@Query() q: DateRangeDto, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const data = await this.service.getIngresos(q.desde, q.hasta);
    const buffer = buildIngresosExcel(data);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="reporte-ingresos.xlsx"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Get('cuentas-por-cobrar/excel')
  @ApiOperation({ summary: 'Excel de cuentas por cobrar' })
  async cuentasExcel(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const data = await this.service.getCuentasPorCobrar();
    const buffer = buildCuentasExcel(data);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="cuentas-por-cobrar.xlsx"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Get('bovedas/excel')
  @ApiOperation({ summary: 'Excel del reporte de bóvedas' })
  async bovedasExcel(@Query() q: BovedasFilterDto, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const data = await this.service.getBovedas(q.tipo, q.bloque, q.estado);
    const buffer = buildBovedasExcel(data);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="reporte-bovedas.xlsx"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }

  @Get('bloques/excel')
  @ApiOperation({ summary: 'Excel de ocupación por bloque' })
  async bloquesExcel(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const data = await this.service.getBloques();
    const buffer = buildBloquesExcel(data);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="reporte-bloques.xlsx"',
    });
    return new StreamableFile(buffer, { length: buffer.length });
  }
}

// Helpers eliminados — reemplazados por StreamableFile en cada endpoint.
