import {
  drawFooter,
  drawHeader,
  drawTable,
  formatCurrency,
  formatDate,
  streamPdf,
  type Column,
  type InstitucionPdf,
} from './common';

export async function buildCuentasPorCobrarPdf(data: any, institucion?: InstitucionPdf): Promise<Buffer> {
  return streamPdf((doc) => {
    drawHeader(doc, 'CUENTAS POR COBRAR', undefined, institucion);

    const left = doc.page.margins.left;

    // Resumen
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#0f172a')
      .text(
        `Total a cobrar: ${formatCurrency(data.totales.monto)}`,
        left,
        doc.y,
      )
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#475569')
      .text(
        `Cuotas pendientes: ${data.totales.cantidad}  ·  Vencidas: ${data.totales.vencidas}`,
        left,
        doc.y,
      );

    doc.moveDown(0.6);

    const columns: Column<any>[] = [
      {
        header: 'Contrato',
        width: 70,
        format: (r) => r.contrato?.numeroSecuencial ?? '—',
      },
      { header: 'Responsable', width: 110, format: (r) => r.responsable ?? '—' },
      { header: 'Teléfono', width: 60, format: (r) => r.telefono ?? '—' },
      { header: 'Difunto', width: 100, format: (r) => r.difunto ?? '—' },
      { header: 'Bóveda', width: 60, format: (r) => r.boveda ?? '—' },
      {
        header: 'Vencimiento',
        width: 60,
        format: (r) => formatDate(r.fechaVencimiento),
      },
      {
        header: 'Mora',
        width: 35,
        align: 'right',
        format: (r) => (r.diasMora > 0 ? `${r.diasMora} d` : '—'),
      },
      {
        header: 'Total',
        width: 55,
        align: 'right',
        format: (r) => formatCurrency(r.total),
      },
    ];

    drawTable(doc, data.items ?? [], columns);

    doc.moveDown(0.5);
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#0f172a')
      .text(`TOTAL POR COBRAR: ${formatCurrency(data.totales.monto)}`, left, doc.y, {
        align: 'right',
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      });

    drawFooter(doc, institucion);
  }, { size: 'A4', layout: 'landscape' });
}
