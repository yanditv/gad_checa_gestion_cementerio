import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ReporteInventarioService } from './reporte-inventario.service';
import {
  ActaEntregaRecepcionFiltroDto,
  ReporteDepreciacionFiltroDto,
  ReporteInventarioFiltroDto,
} from './dto/reporte-inventario.dto';
import {
  buildActaEntregaRecepcionPdf,
  buildDepreciacionPdf,
  buildInventarioAgrupadoPdf,
} from './reporte-inventario.pdf';
import {
  buildActaCsv,
  buildActaExcel,
  buildDepreciacionCsv,
  buildDepreciacionExcel,
  buildInventarioAgrupadoCsv,
  buildInventarioAgrupadoExcel,
} from './reporte-inventario.excel';

const PDF = 'application/pdf';
const XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CSV = 'text/csv; charset=utf-8';

function setPdf(res: Response, filename: string) {
  res.set({
    'Content-Type': PDF,
    'Content-Disposition': `inline; filename="${filename}.pdf"`,
  });
}

function setXlsx(res: Response, filename: string) {
  res.set({
    'Content-Type': XLSX,
    'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
  });
}

function setCsv(res: Response, filename: string) {
  res.set({
    'Content-Type': CSV,
    'Content-Disposition': `attachment; filename="${filename}.csv"`,
  });
}

function file(buffer: Buffer): StreamableFile {
  return new StreamableFile(buffer, { length: buffer.length });
}

@ApiTags('inventario-reportes')
@ApiBearerAuth()
@Controller('inventario/reportes')
export class ReporteInventarioController {
  constructor(private service: ReporteInventarioService) {}

  // ===========================================================================
  // Inventario por custodio (INV-R10)
  // ===========================================================================
  @Get('por-custodio')
  @ApiOperation({ summary: 'Inventario agrupado por custodio (JSON)' })
  porCustodio(@Query() q: ReporteInventarioFiltroDto) {
    return this.service.inventarioPorCustodio(q);
  }

  @Get('por-custodio/pdf')
  @ApiOperation({ summary: 'Inventario por custodio (PDF)' })
  async porCustodioPdf(
    @Query() q: ReporteInventarioFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const [grupos, institucion] = await Promise.all([
      this.service.inventarioPorCustodio(q),
      this.service.getInstitucion(),
    ]);
    const buffer = await buildInventarioAgrupadoPdf(
      'INVENTARIO POR CUSTODIO',
      'Custodio',
      grupos,
      institucion,
    );
    setPdf(res, 'inventario-por-custodio');
    return file(buffer);
  }

  @Get('por-custodio/excel')
  @ApiOperation({ summary: 'Inventario por custodio (XLSX)' })
  async porCustodioExcel(
    @Query() q: ReporteInventarioFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const grupos = await this.service.inventarioPorCustodio(q);
    setXlsx(res, 'inventario-por-custodio');
    return file(
      buildInventarioAgrupadoExcel('Por custodio', 'Custodio', grupos),
    );
  }

  @Get('por-custodio/csv')
  @ApiOperation({ summary: 'Inventario por custodio (CSV)' })
  async porCustodioCsv(
    @Query() q: ReporteInventarioFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const grupos = await this.service.inventarioPorCustodio(q);
    setCsv(res, 'inventario-por-custodio');
    return file(buildInventarioAgrupadoCsv('Custodio', grupos));
  }

  // ===========================================================================
  // Inventario por ubicación (INV-R10)
  // ===========================================================================
  @Get('por-ubicacion')
  @ApiOperation({ summary: 'Inventario agrupado por ubicación (JSON)' })
  porUbicacion(@Query() q: ReporteInventarioFiltroDto) {
    return this.service.inventarioPorUbicacion(q);
  }

  @Get('por-ubicacion/pdf')
  @ApiOperation({ summary: 'Inventario por ubicación (PDF)' })
  async porUbicacionPdf(
    @Query() q: ReporteInventarioFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const [grupos, institucion] = await Promise.all([
      this.service.inventarioPorUbicacion(q),
      this.service.getInstitucion(),
    ]);
    const buffer = await buildInventarioAgrupadoPdf(
      'INVENTARIO POR UBICACIÓN',
      'Ubicación',
      grupos,
      institucion,
    );
    setPdf(res, 'inventario-por-ubicacion');
    return file(buffer);
  }

  @Get('por-ubicacion/excel')
  @ApiOperation({ summary: 'Inventario por ubicación (XLSX)' })
  async porUbicacionExcel(
    @Query() q: ReporteInventarioFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const grupos = await this.service.inventarioPorUbicacion(q);
    setXlsx(res, 'inventario-por-ubicacion');
    return file(
      buildInventarioAgrupadoExcel('Por ubicación', 'Ubicación', grupos),
    );
  }

  @Get('por-ubicacion/csv')
  @ApiOperation({ summary: 'Inventario por ubicación (CSV)' })
  async porUbicacionCsv(
    @Query() q: ReporteInventarioFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const grupos = await this.service.inventarioPorUbicacion(q);
    setCsv(res, 'inventario-por-ubicacion');
    return file(buildInventarioAgrupadoCsv('Ubicación', grupos));
  }

  // ===========================================================================
  // Inventario por categoría (INV-R10)
  // ===========================================================================
  @Get('por-categoria')
  @ApiOperation({ summary: 'Inventario agrupado por categoría (JSON)' })
  porCategoria(@Query() q: ReporteInventarioFiltroDto) {
    return this.service.inventarioPorCategoria(q);
  }

  @Get('por-categoria/pdf')
  @ApiOperation({ summary: 'Inventario por categoría (PDF)' })
  async porCategoriaPdf(
    @Query() q: ReporteInventarioFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const [grupos, institucion] = await Promise.all([
      this.service.inventarioPorCategoria(q),
      this.service.getInstitucion(),
    ]);
    const buffer = await buildInventarioAgrupadoPdf(
      'INVENTARIO POR CATEGORÍA',
      'Categoría',
      grupos,
      institucion,
    );
    setPdf(res, 'inventario-por-categoria');
    return file(buffer);
  }

  @Get('por-categoria/excel')
  @ApiOperation({ summary: 'Inventario por categoría (XLSX)' })
  async porCategoriaExcel(
    @Query() q: ReporteInventarioFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const grupos = await this.service.inventarioPorCategoria(q);
    setXlsx(res, 'inventario-por-categoria');
    return file(
      buildInventarioAgrupadoExcel('Por categoría', 'Categoría', grupos),
    );
  }

  @Get('por-categoria/csv')
  @ApiOperation({ summary: 'Inventario por categoría (CSV)' })
  async porCategoriaCsv(
    @Query() q: ReporteInventarioFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const grupos = await this.service.inventarioPorCategoria(q);
    setCsv(res, 'inventario-por-categoria');
    return file(buildInventarioAgrupadoCsv('Categoría', grupos));
  }

  // ===========================================================================
  // Reporte de depreciación a fecha de corte (INV-R7 / INV-R10)
  // ===========================================================================
  @Get('depreciacion')
  @ApiOperation({ summary: 'Reporte de depreciación a fecha de corte (JSON)' })
  depreciacion(@Query() q: ReporteDepreciacionFiltroDto) {
    return this.service.reporteDepreciacion(q);
  }

  @Get('depreciacion/pdf')
  @ApiOperation({ summary: 'Reporte de depreciación (PDF)' })
  async depreciacionPdf(
    @Query() q: ReporteDepreciacionFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const [data, institucion] = await Promise.all([
      this.service.reporteDepreciacion(q),
      this.service.getInstitucion(),
    ]);
    const buffer = await buildDepreciacionPdf(
      data.fechaCorte,
      data.filas,
      data.total,
      institucion,
    );
    setPdf(res, 'reporte-depreciacion');
    return file(buffer);
  }

  @Get('depreciacion/excel')
  @ApiOperation({ summary: 'Reporte de depreciación (XLSX)' })
  async depreciacionExcel(
    @Query() q: ReporteDepreciacionFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const data = await this.service.reporteDepreciacion(q);
    setXlsx(res, 'reporte-depreciacion');
    return file(buildDepreciacionExcel(data.filas));
  }

  @Get('depreciacion/csv')
  @ApiOperation({ summary: 'Reporte de depreciación (CSV)' })
  async depreciacionCsv(
    @Query() q: ReporteDepreciacionFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const data = await this.service.reporteDepreciacion(q);
    setCsv(res, 'reporte-depreciacion');
    return file(buildDepreciacionCsv(data.filas));
  }

  // ===========================================================================
  // Acta de entrega-recepción de bienes (INV-R10)
  // ===========================================================================
  @Get('acta-entrega')
  @ApiOperation({ summary: 'Datos del acta de entrega-recepción (JSON)' })
  acta(@Query() q: ActaEntregaRecepcionFiltroDto) {
    return this.service.actaEntregaRecepcion(q);
  }

  @Get('acta-entrega/pdf')
  @ApiOperation({ summary: 'Acta de entrega-recepción de bienes (PDF)' })
  async actaPdf(
    @Query() q: ActaEntregaRecepcionFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const [acta, institucion] = await Promise.all([
      this.service.actaEntregaRecepcion(q),
      this.service.getInstitucion(),
    ]);
    const buffer = await buildActaEntregaRecepcionPdf(acta, institucion);
    setPdf(res, 'acta-entrega-recepcion');
    return file(buffer);
  }

  @Get('acta-entrega/excel')
  @ApiOperation({ summary: 'Acta de entrega-recepción (XLSX)' })
  async actaExcel(
    @Query() q: ActaEntregaRecepcionFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const acta = await this.service.actaEntregaRecepcion(q);
    setXlsx(res, 'acta-entrega-recepcion');
    return file(buildActaExcel(acta));
  }

  @Get('acta-entrega/csv')
  @ApiOperation({ summary: 'Acta de entrega-recepción (CSV)' })
  async actaCsv(
    @Query() q: ActaEntregaRecepcionFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const acta = await this.service.actaEntregaRecepcion(q);
    setCsv(res, 'acta-entrega-recepcion');
    return file(buildActaCsv(acta));
  }
}
