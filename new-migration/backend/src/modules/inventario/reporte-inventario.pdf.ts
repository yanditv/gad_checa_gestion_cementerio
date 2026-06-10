/**
 * Generadores de PDF para los reportes de inventario (Fase 7, INV-R10 / REP-R2).
 * Reutiliza los helpers compartidos de `report/pdf/common.ts`. El encabezado se
 * parametriza con la institución (Cementerio/GADInformacion), nunca "Checa".
 */
import {
  drawFooter,
  drawHeader,
  drawTable,
  formatCurrency,
  formatDate,
  streamPdf,
  type Column,
  type InstitucionPdf,
} from '../report/pdf/common';
import type {
  ActaEntregaRecepcion,
  FilaDepreciacion,
  FilaInventario,
  GrupoInventario,
} from './reporte-inventario.service';

const COLUMNAS_BIEN: Column<FilaInventario>[] = [
  { header: 'Código', width: 70, format: (r) => r.codigo },
  { header: 'Descripción', width: 150, format: (r) => r.descripcion },
  { header: 'Marca', width: 70, format: (r) => r.marca ?? '—' },
  { header: 'Serie', width: 80, format: (r) => r.serie ?? '—' },
  { header: 'Estado', width: 60, format: (r) => r.estadoConservacion },
  {
    header: 'F. adquisición',
    width: 70,
    format: (r) => formatDate(r.fechaAdquisicion),
  },
  {
    header: 'Valor adq.',
    width: 75,
    align: 'right',
    format: (r) => formatCurrency(r.valorAdquisicion),
  },
];

/** Reporte agrupado (por custodio / ubicación / categoría). */
export async function buildInventarioAgrupadoPdf(
  titulo: string,
  etiquetaGrupo: string,
  grupos: GrupoInventario[],
  institucion: InstitucionPdf,
): Promise<Buffer> {
  return streamPdf(
    (doc) => {
      drawHeader(doc, titulo, undefined, institucion);

      const left = doc.page.margins.left;

      if (grupos.length === 0) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#475569')
          .text('No se encontraron bienes para los filtros indicados.', left, doc.y);
        drawFooter(doc, institucion);
        return;
      }

      let totalGeneral = 0;
      let totalBienes = 0;

      for (const grupo of grupos) {
        if (doc.y + 60 > doc.page.height - 48) doc.addPage();

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0f172a')
          .text(`${etiquetaGrupo}: ${grupo.titulo}`, left, doc.y);
        doc.moveDown(0.3);

        drawTable(doc, grupo.filas, COLUMNAS_BIEN);

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#334155')
          .text(
            `Subtotal (${grupo.filas.length} bienes): ${formatCurrency(grupo.total)}`,
            left,
            doc.y + 2,
            {
              width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
              align: 'right',
            },
          );
        doc.moveDown(1);

        totalGeneral += grupo.total;
        totalBienes += grupo.filas.length;
      }

      doc
        .strokeColor('#cbd5e1')
        .moveTo(left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#0f172a')
        .text(
          `Total general (${totalBienes} bienes): ${formatCurrency(totalGeneral)}`,
          left,
          doc.y + 4,
          {
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
            align: 'right',
          },
        );

      drawFooter(doc, institucion);
    },
    { size: 'A4', layout: 'landscape' },
  );
}

/** Reporte de depreciación a fecha de corte. */
export async function buildDepreciacionPdf(
  fechaCorte: Date,
  filas: FilaDepreciacion[],
  total: number,
  institucion: InstitucionPdf,
): Promise<Buffer> {
  return streamPdf(
    (doc) => {
      drawHeader(
        doc,
        'REPORTE DE DEPRECIACIÓN',
        `Fecha de corte: ${formatDate(fechaCorte)}`,
        institucion,
      );

      const left = doc.page.margins.left;

      const columns: Column<FilaDepreciacion>[] = [
        { header: 'Código', width: 65, format: (r) => r.codigo },
        { header: 'Descripción', width: 130, format: (r) => r.descripcion },
        { header: 'Categoría', width: 80, format: (r) => r.categoriaNombre },
        {
          header: 'V. adquisición',
          width: 70,
          align: 'right',
          format: (r) => formatCurrency(r.valorAdquisicion),
        },
        {
          header: 'Deprec. acum.',
          width: 70,
          align: 'right',
          format: (r) => formatCurrency(r.depreciacionAcumulada),
        },
        {
          header: 'V. en libros',
          width: 70,
          align: 'right',
          format: (r) => formatCurrency(r.valorEnLibros),
        },
      ];

      if (filas.length === 0) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#475569')
          .text('No se encontraron bienes para los filtros indicados.', left, doc.y);
      } else {
        drawTable(doc, filas, columns);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#0f172a')
          .text(
            `Total valor en libros: ${formatCurrency(total)}`,
            left,
            doc.y + 4,
            {
              width:
                doc.page.width - doc.page.margins.left - doc.page.margins.right,
              align: 'right',
            },
          );
      }

      drawFooter(doc, institucion);
    },
    { size: 'A4', layout: 'landscape' },
  );
}

/** Acta de entrega-recepción de bienes (A4 vertical, con firmas). */
export async function buildActaEntregaRecepcionPdf(
  acta: ActaEntregaRecepcion,
  institucion: InstitucionPdf,
): Promise<Buffer> {
  return streamPdf(
    (doc) => {
      drawHeader(doc, 'ACTA DE ENTREGA-RECEPCIÓN', undefined, institucion);

      const left = doc.page.margins.left;
      const contentWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#1f2937')
        .text(
          'En la fecha y lugar indicados se procede a la entrega-recepción de ' +
            'los bienes institucionales detallados a continuación, conforme a las ' +
            'Normas de Control Interno de la Contraloría General del Estado.',
          left,
          doc.y,
          { width: contentWidth, align: 'justify' },
        );
      doc.moveDown(0.6);

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#0f172a')
        .text(
          `Custodio entrante: ${acta.custodioEntrante ?? '—'}` +
            (acta.identificacionEntrante
              ? `  (C.I. ${acta.identificacionEntrante})`
              : ''),
          left,
          doc.y,
        );
      doc.text(
        `Custodio saliente: ${acta.custodioSaliente ?? '—'}` +
          (acta.identificacionSaliente
            ? `  (C.I. ${acta.identificacionSaliente})`
            : ''),
        left,
        doc.y + 2,
      );
      doc.moveDown(0.6);

      const columns: Column<FilaInventario>[] = [
        { header: 'Código', width: 70, format: (r) => r.codigo },
        { header: 'Descripción', width: 180, format: (r) => r.descripcion },
        { header: 'Serie', width: 90, format: (r) => r.serie ?? '—' },
        { header: 'Estado', width: 60, format: (r) => r.estadoConservacion },
        {
          header: 'Valor',
          width: 80,
          align: 'right',
          format: (r) => formatCurrency(r.valorAdquisicion),
        },
      ];

      if (acta.filas.length === 0) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#475569')
          .text('No hay bienes asociados al acta.', left, doc.y);
      } else {
        drawTable(doc, acta.filas, columns);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#0f172a')
          .text(
            `Total (${acta.filas.length} bienes): ${formatCurrency(acta.total)}`,
            left,
            doc.y + 4,
            { width: contentWidth, align: 'right' },
          );
      }

      // Firmas al pie
      const firmaY = Math.max(doc.y + 60, doc.page.height - 140);
      const colW = contentWidth / 2;
      doc
        .strokeColor('#475569')
        .moveTo(left + 20, firmaY)
        .lineTo(left + colW - 20, firmaY)
        .stroke()
        .moveTo(left + colW + 20, firmaY)
        .lineTo(left + contentWidth - 20, firmaY)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#1f2937')
        .text('Entrega (custodio saliente)', left + 20, firmaY + 6, {
          width: colW - 40,
          align: 'center',
        })
        .text('Recibe (custodio entrante)', left + colW + 20, firmaY + 6, {
          width: colW - 40,
          align: 'center',
        });

      drawFooter(doc, institucion);
    },
    { size: 'A4', layout: 'portrait' },
  );
}
