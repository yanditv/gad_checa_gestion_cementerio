/**
 * Acta de exhumación / traslado (CAT-R4d). A4 vertical, estilo acta
 * administrativa. Header/footer parametrizados con los datos institucionales
 * (no se hardcodea "Checa"; el sistema también sirve a El Valle).
 */
import {
  drawFooter,
  drawHeader,
  formatDate,
  InstitucionPdf,
  streamPdf,
} from '../report/pdf/common';

const MOTIVO_LABEL: Record<string, string> = {
  vencimiento_arriendo: 'Vencimiento de arriendo',
  traslado: 'Traslado',
  orden_judicial: 'Orden judicial',
  osario_comun: 'Osario común',
  otro: 'Otro',
};

export interface ActaExhumacionData {
  numeroActa: string;
  fechaExhumacion: Date | string;
  motivo: string;
  destino: string;
  numeroAutorizacion?: string | null;
  entidadAutorizante?: string | null;
  observaciones?: string | null;
  difunto: {
    nombre: string;
    apellido: string;
    numeroIdentificacion?: string | null;
  };
  bovedaOrigen: {
    numero: string;
    tipo?: string | null;
    bloque?: string | null;
  };
  bovedaDestino?: {
    numero: string;
    tipo?: string | null;
    bloque?: string | null;
  } | null;
}

export function buildActaExhumacionPdf(
  data: ActaExhumacionData,
  institucion?: InstitucionPdf,
): Promise<Buffer> {
  return streamPdf(
    (doc) => {
      drawHeader(
        doc,
        'ACTA DE EXHUMACIÓN',
        `Acta N.° ${data.numeroActa}`,
        institucion,
      );

      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const contentWidth = right - left;

      const motivoLabel = MOTIVO_LABEL[data.motivo] ?? data.motivo;

      doc.moveDown(0.5);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#1f2937')
        .text(
          `En la fecha ${formatDate(
            data.fechaExhumacion,
          )} se deja constancia del acto administrativo de exhumación` +
            ` de los restos del/la causante detallado a continuación, por motivo de ${motivoLabel.toLowerCase()}.`,
          left,
          doc.y,
          { width: contentWidth, align: 'justify' },
        );

      doc.moveDown(1);

      const row = (label: string, value: string) => {
        const y = doc.y;
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#334155')
          .text(label, left, y, { width: 150 });
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#1f2937')
          .text(value || '—', left + 155, y, { width: contentWidth - 155 });
        doc.moveDown(0.4);
      };

      section(doc, left, contentWidth, 'Datos del causante');
      row(
        'Nombres y apellidos:',
        `${data.difunto.nombre} ${data.difunto.apellido}`.trim(),
      );
      row('Identificación:', data.difunto.numeroIdentificacion ?? '—');

      doc.moveDown(0.4);
      section(doc, left, contentWidth, 'Bóveda de origen');
      row(
        'Bóveda:',
        bovedaTexto(
          data.bovedaOrigen.numero,
          data.bovedaOrigen.tipo,
          data.bovedaOrigen.bloque,
        ),
      );

      doc.moveDown(0.4);
      section(doc, left, contentWidth, 'Exhumación');
      row('Motivo:', motivoLabel);
      row('Destino:', data.destino);
      if (data.bovedaDestino) {
        row(
          'Bóveda destino:',
          bovedaTexto(
            data.bovedaDestino.numero,
            data.bovedaDestino.tipo,
            data.bovedaDestino.bloque,
          ),
        );
      }
      row('N.° de autorización:', data.numeroAutorizacion ?? '—');
      row('Entidad autorizante:', data.entidadAutorizante ?? '—');
      if (data.observaciones) {
        row('Observaciones:', data.observaciones);
      }

      drawFirmas(doc, left, contentWidth);
      drawFooter(doc, institucion);
    },
    { size: 'A4', layout: 'portrait' },
  );
}

function section(
  doc: PDFKit.PDFDocument,
  left: number,
  contentWidth: number,
  title: string,
) {
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#1890ff')
    .text(title, left, doc.y, { width: contentWidth });
  doc
    .strokeColor('#cbd5e1')
    .moveTo(left, doc.y + 1)
    .lineTo(left + contentWidth, doc.y + 1)
    .stroke();
  doc.moveDown(0.4);
}

function bovedaTexto(
  numero: string,
  tipo?: string | null,
  bloque?: string | null,
): string {
  const partes = [`N.° ${numero}`];
  if (tipo) partes.push(tipo);
  if (bloque) partes.push(`Bloque ${bloque}`);
  return partes.join(' · ');
}

function drawFirmas(
  doc: PDFKit.PDFDocument,
  left: number,
  contentWidth: number,
) {
  const y = Math.max(doc.y + 60, doc.page.height - 140);
  const colWidth = (contentWidth - 40) / 2;

  const firma = (x: number, label: string) => {
    doc
      .strokeColor('#94a3b8')
      .moveTo(x, y)
      .lineTo(x + colWidth, y)
      .stroke();
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#475569')
      .text(label, x, y + 4, { width: colWidth, align: 'center' });
  };

  firma(left, 'Responsable del cementerio');
  firma(left + colWidth + 40, 'Solicitante / Autoridad');
}
