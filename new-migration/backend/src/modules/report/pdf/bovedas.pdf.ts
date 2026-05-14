import {
  drawFooter,
  drawHeader,
  drawTable,
  streamPdf,
  type Column,
} from './common';

const ESTADO_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  ocupada: 'Ocupada',
  por_caducar: 'Por caducar',
  vencida: 'Vencida',
};

export async function buildBovedasPdf(data: any): Promise<Buffer> {
  return streamPdf((doc) => {
    drawHeader(doc, 'REPORTE DE BÓVEDAS');

    const left = doc.page.margins.left;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#475569')
      .text(
        `Total: ${data.totales.total}  ·  Disponibles: ${data.totales.disponible ?? 0}  ·  Ocupadas: ${data.totales.ocupada ?? 0}  ·  Por caducar: ${data.totales.por_caducar ?? 0}  ·  Vencidas: ${data.totales.vencida ?? 0}`,
        left,
        doc.y,
      );

    doc.moveDown(0.6);

    const columns: Column<any>[] = [
      { header: 'Bóveda', width: 50, format: (r) => r.numero ?? '—' },
      { header: 'Tipo', width: 40, format: (r) => r.tipo ?? '—' },
      { header: 'Bloque', width: 70, format: (r) => r.bloque ?? '—' },
      {
        header: 'Piso',
        width: 30,
        align: 'right',
        format: (r) => (r.piso != null ? String(r.piso) : '—'),
      },
      {
        header: 'Estado',
        width: 60,
        format: (r) => ESTADO_LABELS[r.estado] ?? r.estado,
      },
      {
        header: 'Propietario',
        width: 110,
        format: (r) => r.propietario ?? '—',
      },
      { header: 'Difunto', width: 110, format: (r) => r.difunto ?? '—' },
      {
        header: 'Contrato',
        width: 70,
        format: (r) => r.contrato?.numeroSecuencial ?? '—',
      },
    ];

    drawTable(doc, data.items ?? [], columns);
    drawFooter(doc);
  }, { size: 'A4', layout: 'landscape' });
}
