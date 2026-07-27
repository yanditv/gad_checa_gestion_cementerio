import { drawFooter, drawHeader, drawTable, streamPdf, type Column, type InstitucionPdf } from './common';

export async function buildBloquesPdf(data: any, institucion?: InstitucionPdf): Promise<Buffer> {
  return streamPdf((doc) => {
    drawHeader(doc, 'OCUPACIÓN POR BLOQUE', undefined, institucion);

    const left = doc.page.margins.left;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#475569')
      .text(
        `Total bóvedas: ${data.totales.total}  ·  Ocupadas: ${data.totales.ocupadas}  ·  Disponibles: ${data.totales.disponibles}  ·  Por caducar: ${data.totales.porCaducar}  ·  Vencidas: ${data.totales.vencidas}`,
        left,
        doc.y,
      );

    doc.moveDown(0.6);

    const columns: Column<any>[] = [
      { header: 'Bloque', width: 110, format: (r) => r.nombre ?? '—' },
      {
        header: 'Cementerio',
        width: 100,
        format: (r) => r.cementerio ?? '—',
      },
      {
        header: 'Total',
        width: 40,
        align: 'right',
        format: (r) => String(r.total),
      },
      {
        header: 'Disp.',
        width: 40,
        align: 'right',
        format: (r) => String(r.disponibles),
      },
      {
        header: 'Ocup.',
        width: 40,
        align: 'right',
        format: (r) => String(r.ocupadas),
      },
      {
        header: 'Por venc.',
        width: 50,
        align: 'right',
        format: (r) => String(r.porCaducar),
      },
      {
        header: 'Vencidas',
        width: 50,
        align: 'right',
        format: (r) => String(r.vencidas),
      },
      {
        header: '% Ocupación',
        width: 60,
        align: 'right',
        format: (r) => `${r.porcentajeOcupacion}%`,
      },
    ];

    drawTable(doc, data.items ?? [], columns);
    drawFooter(doc, institucion);
  }, { size: 'A4', layout: 'landscape' });
}
