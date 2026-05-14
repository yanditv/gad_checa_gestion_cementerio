import {
  drawFooter,
  drawHeader,
  drawTable,
  formatCurrency,
  formatDate,
  streamPdf,
  type Column,
} from './common';

export async function buildIngresosPdf(data: any): Promise<Buffer> {
  return streamPdf((doc) => {
    const desde = data.rango?.desde
      ? formatDate(new Date(data.rango.desde))
      : '—';
    const hasta = data.rango?.hasta
      ? formatDate(new Date(data.rango.hasta))
      : '—';

    drawHeader(doc, 'REPORTE DE INGRESOS', `Período: ${desde} → ${hasta}`);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;

    // Resumen
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#0f172a')
      .text(`Total ingresos: ${formatCurrency(data.totales.general)}`, left, doc.y)
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#475569')
      .text(`Cantidad de pagos: ${data.totales.cantidad}`, left, doc.y);

    doc.moveDown(0.6);

    if (data.totales.porMetodo?.length) {
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#334155')
        .text('Por método de pago:', left, doc.y);
      doc.moveDown(0.2);
      for (const m of data.totales.porMetodo) {
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#475569')
          .text(`· ${m.metodo}: ${formatCurrency(m.total)} (${m.cantidad})`, left + 12, doc.y);
      }
      doc.moveDown(0.4);
    }

    // Tabla
    const columns: Column<any>[] = [
      { header: 'Fecha', width: 60, format: (r) => formatDate(r.fechaPago) },
      { header: 'Recibo', width: 60, format: (r) => r.numeroRecibo ?? '—' },
      { header: 'Método', width: 60, format: (r) => r.metodoPago ?? '—' },
      { header: 'Contrato', width: 70, format: (r) => r.contrato?.numeroSecuencial ?? '—' },
      { header: 'Bóveda', width: 50, format: (r) => r.boveda ?? '—' },
      {
        header: 'Pagado por',
        width: 110,
        format: (r) => r.responsable ?? '—',
      },
      {
        header: 'Monto',
        width: 60,
        align: 'right',
        format: (r) => formatCurrency(r.monto),
      },
    ];
    drawTable(doc, data.items ?? [], columns);

    // Total
    doc.moveDown(0.5);
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#0f172a')
      .text(`TOTAL: ${formatCurrency(data.totales.general)}`, left, doc.y, {
        width: contentWidth,
        align: 'right',
      });

    drawFooter(doc);
  }, { size: 'A4', layout: 'landscape' });
}
