import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { formatCurrency, formatDate } from '@/lib/contratos-server';

function formatLongDate(value?: string | Date | null) {
  if (!value) return 'fecha no disponible';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'fecha no disponible';

  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc
    .moveDown(0.45)
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#1f2937')
    .text(title)
    .moveDown(0.08);
}

function addLabelValue(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc
    .font('Helvetica-Bold')
    .fontSize(9.2)
    .fillColor('#111827')
    .text(`${label}: `, { continued: true })
    .font('Helvetica')
    .text(value)
    .moveDown(0.02);
}

function addParagraph(doc: PDFKit.PDFDocument, text: string) {
  doc
    .font('Helvetica')
    .fontSize(9.6)
    .fillColor('#1f2937')
    .text(text, { align: 'justify', lineGap: 1.5 })
    .moveDown(0.12);
}

function ensureSpace(doc: PDFKit.PDFDocument, requiredHeight: number) {
  const availableHeight = doc.page.height - doc.page.margins.bottom - doc.y;
  if (availableHeight < requiredHeight) {
    doc.addPage();
  }
}

export async function buildContratoPdfBuffer(contrato: any) {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 28,
      info: {
        Title: `Contrato ${contrato.numeroSecuencial || contrato.id}`,
        Author: 'GAD Parroquial de Checa',
        Subject: 'Contrato de arrendamiento de boveda',
      },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const cementerio = contrato.boveda?.bloque?.cementerio;
    const responsablePrincipal = contrato.responsables?.[0]?.responsable?.persona;
    const cuotas = contrato.cuotas || [];
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.jpeg');
    const totalContrato =
      cuotas.length > 0
        ? cuotas.reduce((sum: number, cuota: any) => sum + Number(cuota.monto || 0), 0)
        : Number(contrato.montoTotal || 0);

    const nombreDifunto =
      `${contrato.difunto?.nombre || 'No especificado'} ${contrato.difunto?.apellido || ''}`.trim();
    const nombreResponsable =
      `${responsablePrincipal?.nombre || '________________'} ${responsablePrincipal?.apellido || ''}`.trim();
    const presidente = cementerio?.presidente || 'Presidente del GAD Parroquial de Checa';
    const numeroContrato = contrato.numeroSecuencial || `CTR-${contrato.id}`;
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, left, 26, { width: 44, height: 44 });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#0f172a')
      .text('GAD Parroquial de Checa', left + 60, 30)
      .fontSize(9.5)
      .font('Helvetica')
      .fillColor('#475569')
      .text('Sistema de Gestion de Cementerio', left + 60, 48)
      .text(`Contrato: ${numeroContrato}`, left + 60, 62);

    doc
      .moveTo(left, 86)
      .lineTo(right, 86)
      .strokeColor('#cbd5e1')
      .stroke();

    doc.y = 98;

    doc
      .font('Helvetica-Bold')
      .fontSize(11.5)
      .fillColor('#111827')
      .text(
        `CONTRATO DE ARRIENDO DE BOVEDA DEL CEMENTERIO DE LA PARROQUIA CHECA NRO. ${numeroContrato}`,
        { align: 'center', width: contentWidth },
      );

    doc.moveDown(0.45);

    addParagraph(
      doc,
      `En la Parroquia de Checa, a los ${formatLongDate(
        contrato.fechaInicio,
      )}, comparecen a celebrar el presente contrato de arrendamiento, por una parte y en calidad de arrendador el Gobierno Parroquial de Checa, representado por ${presidente}; y por otra, ${nombreResponsable}, con identificacion ${
        responsablePrincipal?.numeroIdentificacion || '__________'
      }, para suscribir el presente contrato de arrendamiento de conformidad con las siguientes clausulas.`,
    );

    addParagraph(
      doc,
      `PRIMERA. Comparecen por una parte el Gobierno Parroquial de Checa, a quien en lo posterior se le llamara ARRENDADOR; y por otra parte ${nombreResponsable}, a quien en lo posterior se le llamara ARRENDATARIO.`,
    );

    addParagraph(
      doc,
      'SEGUNDA. El Gobierno Parroquial de Checa administra el Cementerio General de la Parroquia y se encuentra facultado para suscribir contratos de arrendamiento o venta de boveda del cementerio.',
    );

    addParagraph(
      doc,
      `TERCERA. El presente contrato otorga en arriendo la boveda numero ${
        contrato.boveda?.numero || '________________'
      } del bloque ${contrato.boveda?.bloque?.nombre || '________________'} para los restos de ${nombreDifunto}, con identificacion ${
        contrato.difunto?.numeroIdentificacion || 'No especificado'
      }.`,
    );

    addParagraph(
      doc,
      `CUARTA. El valor del contrato es ${formatCurrency(totalContrato)}. El pago se registra en ${
        cementerio?.nombreEntidadFinanciera || 'Banco del Austro'
      }, cuenta ${cementerio?.numeroCuenta || '2000324704'}.`,
    );

    addParagraph(
      doc,
      `QUINTA. El derecho de uso se concede desde ${formatDate(contrato.fechaInicio)} hasta ${formatDate(
        contrato.fechaFin,
      )}, con un plazo de ${cuotas.length || contrato.numeroDeMeses || 0} anos.`,
    );

    addParagraph(
      doc,
      'SEXTA. Las partes declaran conocer y aceptar el contenido del presente documento y firman para constancia.',
    );

    ensureSpace(doc, 160);

    addSectionTitle(doc, 'Datos del contrato');
    addLabelValue(doc, 'Estado', contrato.estado ? 'Activo' : 'Inactivo');
    addLabelValue(doc, 'Tipo', contrato.esRenovacion ? 'Renovacion' : 'Nuevo');
    addLabelValue(doc, 'Monto total', formatCurrency(contrato.montoTotal));
    addLabelValue(doc, 'Observaciones', contrato.observaciones || 'Sin observaciones');

    addSectionTitle(doc, 'Datos del difunto');
    addLabelValue(doc, 'Nombre', nombreDifunto);
    addLabelValue(doc, 'Identificacion', contrato.difunto?.numeroIdentificacion || '-');
    addLabelValue(doc, 'Fecha de nacimiento', formatDate(contrato.difunto?.fechaNacimiento));
    addLabelValue(doc, 'Fecha de defuncion', formatDate(contrato.difunto?.fechaDefuncion));

    addSectionTitle(doc, 'Responsables');
    if ((contrato.responsables || []).length === 0) {
      addLabelValue(doc, 'Responsables', 'Sin responsables registrados');
    } else {
      for (const item of contrato.responsables) {
        const persona = item.responsable?.persona;
        addLabelValue(
          doc,
          `${persona?.nombre || '-'} ${persona?.apellido || ''}`.trim(),
          [
            persona?.numeroIdentificacion || '-',
            item.responsable?.parentesco || 'Sin parentesco',
            persona?.telefono || 'Sin telefono',
            persona?.email || 'Sin correo',
          ].join(' | '),
        );
      }
    }

    addSectionTitle(doc, 'Cuotas');
    if (cuotas.length === 0) {
      addLabelValue(doc, 'Cuotas', 'Sin cuotas registradas');
    } else {
      cuotas.forEach((cuota: any) => {
        addLabelValue(
          doc,
          `Cuota ${cuota.numero}`,
          `${formatCurrency(cuota.monto)} | vence ${formatDate(cuota.fechaVencimiento)} | ${
            cuota.pagada ? 'Pagada' : 'Pendiente'
          }`,
        );
      });
    }

    ensureSpace(doc, 90);
    doc.moveDown(0.8);

    const signatureTop = doc.y + 8;

    doc
      .moveTo(left + 20, signatureTop)
      .lineTo(left + 180, signatureTop)
      .strokeColor('#94a3b8')
      .stroke();
    doc
      .moveTo(right - 180, signatureTop)
      .lineTo(right - 20, signatureTop)
      .strokeColor('#94a3b8')
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#111827')
      .text(nombreResponsable, left + 20, signatureTop + 6, { width: 160, align: 'center' })
      .text(presidente, right - 180, signatureTop + 6, { width: 160, align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(8.2)
      .fillColor('#475569')
      .text('ARRENDATARIO', left + 20, signatureTop + 20, { width: 160, align: 'center' })
      .text('ARRENDADOR', right - 180, signatureTop + 20, { width: 160, align: 'center' });

    doc.y = signatureTop + 38;
    doc.moveDown(0.8);
    doc
      .fontSize(7.6)
      .text(
        `Direccion: ${cementerio?.direccion || 'Checa, Ecuador'} | Telefono: ${
          cementerio?.telefono || '02-XXXXXXX'
        } | Correo: ${cementerio?.email || 'checa@example.gob.ec'}`,
        left,
        doc.y,
        { width: contentWidth, align: 'center' },
      );

    doc.end();
  });
}
