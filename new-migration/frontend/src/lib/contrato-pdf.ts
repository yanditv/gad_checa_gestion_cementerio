/**
 * Generador del PDF oficial del contrato. Paridad con el legado .NET
 * (Controllers/Pdf/ContratoPDF.cs):
 *   - Página A4 con logo del GAD centrado en el header.
 *   - Título centrado.
 *   - Preámbulo con fechas en formato "dd de MMMM del yyyy".
 *   - 6 cláusulas (PRIMERA COMPARECIENTES, SEGUNDA ANTECEDENTE, TERCER
 *     OBJETO, CUARTA PRECIO, QUINTA OTRA, SEXTA).
 *   - Bloque OBSERVACIONES opcional.
 *   - Bloque de firmas: ARRENDADOR (presidente) y ARRENDATARIO (responsable
 *     principal con CI), ambos centrados, separados horizontalmente.
 *   - Footer con dirección, teléfono y correo del cementerio.
 */
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const PAGE_MARGIN_HORIZONTAL = 60;
const PAGE_MARGIN_VERTICAL = 60;
const HEADER_HEIGHT = 70;
const FOOTER_HEIGHT = 36;

type RichSegment = string | { text: string; bold?: boolean };

function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  return text.length <= maxLength
    ? text
    : `${text.slice(0, maxLength - 3)}...`;
}

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatFechaLarga(value: string | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return { dia: '--', mes: '--------', anio: '----' };
  return {
    dia: String(date.getDate()).padStart(2, '0'),
    mes: MESES_ES[date.getMonth()] ?? '--------',
    anio: String(date.getFullYear()),
  };
}

function formatCurrencyUsd(value: number | string | null | undefined) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function joinNombre(persona?: {
  nombre?: string | null;
  apellido?: string | null;
} | null): string {
  if (!persona) return '';
  return `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim();
}

async function getLogoBufferOrPath(gadInfo?: any): Promise<string | Buffer | null> {
  if (gadInfo?.logoUrl) {
    if (gadInfo.logoUrl.startsWith('http://') || gadInfo.logoUrl.startsWith('https://')) {
      try {
        const res = await fetch(gadInfo.logoUrl);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch (e) {
        console.error('Error downloading remote GAD logo:', e);
      }
    } else {
      const relativePath = gadInfo.logoUrl.startsWith('/') 
        ? gadInfo.logoUrl 
        : `/${gadInfo.logoUrl}`;
      const localPath = path.join(process.cwd(), 'public', relativePath);
      if (fs.existsSync(localPath)) {
        return localPath;
      }
    }
  }

  const candidates = [
    path.join(process.cwd(), 'public', 'logo.png'),
    path.join(process.cwd(), 'public', 'images', 'logo_gad.png'),
    path.join(process.cwd(), 'public', 'images', 'logo.png'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers de dibujo
// ---------------------------------------------------------------------------

function richParagraph(
  doc: PDFKit.PDFDocument,
  segments: RichSegment[],
  contentWidth: number,
) {
  const normalized = segments.map<{ text: string; bold: boolean }>((s) =>
    typeof s === 'string'
      ? { text: s, bold: false }
      : { text: s.text ?? '', bold: !!s.bold },
  );

  doc.fontSize(10.5).fillColor('#1f2937');
  normalized.forEach((seg, idx) => {
    doc.font(seg.bold ? 'Helvetica-Bold' : 'Helvetica');
    const isLast = idx === normalized.length - 1;
    doc.text(seg.text, {
      align: 'justify',
      lineGap: 2,
      width: contentWidth,
      continued: !isLast,
    });
  });
  doc.moveDown(0.4);
}

function drawHeader(doc: PDFKit.PDFDocument, logo: string | Buffer | null) {
  if (!logo) return;
  try {
    const pageWidth = doc.page.width;
    const imgWidth = 56;
    const x = (pageWidth - imgWidth) / 2;
    doc.image(logo, x, 16, { width: imgWidth, height: 56 });
  } catch {
    // ignorar errores de imagen
  }
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  gadInfo: any,
  cementerio: {
    direccion?: string | null;
    telefono?: string | null;
    email?: string | null;
  },
) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const y = doc.page.height - FOOTER_HEIGHT + 8;

  const direccion = truncate(cementerio.direccion || gadInfo?.direccion || 'Checa, Ecuador', 60);
  const telefono = truncate(cementerio.telefono || gadInfo?.telefono || '02-XXXXXXX', 15);
  const email = truncate(cementerio.email || gadInfo?.email || 'checa@example.gob.ec', 40);

  doc.save();
  
  // Temporarily disable bottom margin to prevent recursive page breaks
  const oldBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = -1000;

  doc.fontSize(8.4).fillColor('#475569');
  const footerText = `Dirección: ${direccion}  |  Teléfono: ${telefono}  |  Correo: ${email}`;
  doc
    .font('Helvetica')
    .text(footerText, left, y, {
      width: right - left,
      align: 'center',
      lineGap: 2,
    });

  // Restore bottom margin
  doc.page.margins.bottom = oldBottomMargin;

  doc.restore();
}

// ---------------------------------------------------------------------------
// Generación
// ---------------------------------------------------------------------------

export async function buildContratoPdfBuffer(contrato: any, gadInfo?: any): Promise<Buffer> {
  const logo = await getLogoBufferOrPath(gadInfo);

  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: PAGE_MARGIN_VERTICAL + HEADER_HEIGHT,
        bottom: PAGE_MARGIN_VERTICAL + FOOTER_HEIGHT,
        left: PAGE_MARGIN_HORIZONTAL,
        right: PAGE_MARGIN_HORIZONTAL,
      },
      info: {
        Title: `Contrato ${contrato.numeroSecuencial || contrato.id}`,
        Author: gadInfo?.nombre || 'Gobierno Parroquial de Checa',
        Subject: 'Contrato de arrendamiento de bóveda',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // -----------------------------------------------------------------------
    // Datos derivados
    // -----------------------------------------------------------------------
    const cementerio = contrato.boveda?.bloque?.cementerio ?? {};
    const difunto = contrato.difunto ?? {};
    const responsable = contrato.responsables?.[0]?.responsable?.persona ?? {};
    const boveda = contrato.boveda ?? {};
    const piso = boveda.piso ?? null;
    const bloque = boveda.bloque ?? {};
    const cuotas: Array<{ monto: number | string }> = contrato.cuotas ?? [];

    const presidenteTitulo = cementerio.abreviaturaTituloPresidente || 'Presidente';
    const presidenteNombre = cementerio.presidente || 'Presidente del GAD Parroquial de Checa';
    const presidente = truncate(
      `${presidenteTitulo} ${presidenteNombre}`.trim(),
      60,
    );
    const gadNombre = gadInfo?.nombre || 'Gobierno Parroquial de Checa';
    const parroquia = gadNombre
      .replace(/gobierno\s+(autónomo\s+descentralizado\s+)?parroquial\s+(de\s+)?/gi, '')
      .replace(/gad\s+/gi, '')
      .trim();

    const entidadFinanciera = cementerio.entidadFinanciera || 'BANCO';
    const nombreEntidadFinanciera = truncate(
      cementerio.nombreEntidadFinanciera || 'Banco del Austro',
      40,
    );
    const numeroCuenta = truncate(cementerio.numeroCuenta || '2000324704', 20);

    let bancoTexto = nombreEntidadFinanciera;
    if (String(entidadFinanciera).toUpperCase() === 'BANCO') {
      if (!nombreEntidadFinanciera.toLowerCase().startsWith('banco')) {
        bancoTexto = `el Banco ${nombreEntidadFinanciera}`;
      } else {
        bancoTexto = `el ${nombreEntidadFinanciera}`;
      }
    } else {
      if (!nombreEntidadFinanciera.toLowerCase().startsWith('cooperativa')) {
        bancoTexto = `la Cooperativa ${nombreEntidadFinanciera}`;
      } else {
        bancoTexto = `la ${nombreEntidadFinanciera}`;
      }
    }

    const nombreCementerioRaw = cementerio.nombre || 'de la Parroquia Checa';
    const nombreCementerioUpper = nombreCementerioRaw.toUpperCase();
    const cementerioTexto = nombreCementerioUpper.startsWith('CEMENTERIO')
      ? nombreCementerioUpper
      : `CEMENTERIO ${nombreCementerioUpper}`;

    const responsableNombre = truncate(
      joinNombre(responsable) || '________________',
      50,
    );
    const responsableCI = truncate(
      responsable.numeroIdentificacion || '__________',
      20,
    );
    const responsableTelefono = truncate(responsable.telefono || '__________', 15);
    const responsableEmail = truncate(
      responsable.email || '________________',
      30,
    );

    const difuntoNombre = truncate(
      joinNombre(difunto) || 'No especificado',
      50,
    );
    const difuntoCI = truncate(difunto.numeroIdentificacion || '__________', 20);

    const bovedaNumero = truncate(boveda.numero || '________________', 20);
    const bloqueDescripcion = truncate(
      bloque.descripcion || bloque.nombre || '________________',
      30,
    );

    const numeroContrato = contrato.numeroSecuencial || `CTR-${contrato.id}`;
    const totalCuotas = cuotas.reduce(
      (sum, c) => sum + Number(c.monto ?? 0),
      0,
    );
    const montoTotal = totalCuotas > 0 ? totalCuotas : Number(contrato.montoTotal ?? 0);

    const fechaInicio = formatFechaLarga(contrato.fechaInicio);
    const fechaFin = formatFechaLarga(contrato.fechaFin);
    const aniosArriendo = cuotas.length || Number(contrato.numeroDeMeses) || 0;

    // Observaciones: truncar a 300 chars como hace el legado.
    let observaciones: string | null = contrato.observaciones?.trim() || null;
    if (observaciones && observaciones.length > 300) {
      observaciones = `${observaciones.slice(0, 297)}...`;
    }

    // -----------------------------------------------------------------------
    // Decoración por página (header + footer en cada página, incl. saltos)
    // -----------------------------------------------------------------------
    const decoratePage = () => {
      const savedX = doc.x;
      const savedY = doc.y;
      drawHeader(doc, logo);
      drawFooter(doc, gadInfo, cementerio);
      doc.x = savedX;
      doc.y = savedY;
    };
    doc.on('pageAdded', decoratePage);
    decoratePage(); // primera página

    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // -----------------------------------------------------------------------
    // Título
    // -----------------------------------------------------------------------
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#0f172a')
      .text(
        truncate(
          `CONTRATO DE ARRIENDO DE BÓVEDA DEL ${cementerioTexto} NRO. ${numeroContrato}`,
          100,
        ),
        { align: 'center', width: contentWidth },
      );
    doc.moveDown(0.8);

    // -----------------------------------------------------------------------
    // Preámbulo
    // -----------------------------------------------------------------------
    richParagraph(
      doc,
      [
        `En la Parroquia de ${parroquia}, a los `,
        { text: fechaInicio.dia + ' ', bold: true },
        'días del mes de ',
        { text: fechaInicio.mes + ' ', bold: true },
        'del ',
        { text: fechaInicio.anio, bold: true },
        `, comparecen a celebrar el presente contrato de arrendamiento, por una parte y en calidad de arrendador, el ${gadNombre}, debidamente representado por el `,
        { text: presidente, bold: true },
        '; por otro lado, el/la Sr/Sra. ',
        { text: responsableNombre + ' ', bold: true },
        'con número de identidad ',
        { text: responsableCI, bold: true },
        ', número de teléfono ',
        { text: responsableTelefono, bold: true },
        ', correo electrónico ',
        { text: responsableEmail, bold: true },
        ', los comparecientes son mayores de edad, capaces ante la ley para celebrar todo acto y contrato quienes celebran el presente contrato de arrendamiento de acuerdo con las siguientes cláusulas:',
      ],
      contentWidth,
    );

    // -----------------------------------------------------------------------
    // Cláusulas
    // -----------------------------------------------------------------------
    richParagraph(
      doc,
      [
        { text: 'PRIMERA COMPARECIENTES. -', bold: true },
        ` Comparecen por una parte el ${gadNombre} representada por su presidente el `,
        { text: presidente, bold: true },
        '; a quien en lo posterior se lo llamará arrendador, y por otra parte comparece el/la Sr/Sra. ',
        { text: responsableNombre + ' ', bold: true },
        'a quien en lo posterior se le llamará Arrendatario.',
      ],
      contentWidth,
    );

    richParagraph(
      doc,
      [
        { text: 'SEGUNDA ANTECEDENTE. -', bold: true },
        ` El ${gadNombre} es la Institución Pública que administra el ${cementerio.nombre || 'Cementerio General de la Parroquia'}, es por ello que se encuentra facultado para suscribir todo contrato de arrendamiento o venta de bóveda del cementerio.`,
      ],
      contentWidth,
    );

    richParagraph(
      doc,
      [
        { text: 'TERCER OBJETO. -', bold: true },
        ` El ${gadNombre}, en su calidad de Administrador del ${cementerio.nombre || 'Cementerio General de la Parroquia'}, por el presente contrato da en arriendo una bóveda a favor de quien en vida fue: `,
        { text: difuntoNombre + ' ', bold: true },
        'con número de cédula ',
        { text: difuntoCI, bold: true },
        ', restos que serán depositados en la bóveda número ',
        { text: bovedaNumero + ' ', bold: true },
        'en el bloque ',
        { text: bloqueDescripcion, bold: true },
        piso?.numero != null
          ? `, piso ${piso.numero}.`
          : '.',
      ],
      contentWidth,
    );

    richParagraph(
      doc,
      [
        { text: 'CUARTA: PRECIO. -', bold: true },
        ' El valor por arriendo de la Bóveda es de ',
        { text: formatCurrencyUsd(montoTotal) + ' ', bold: true },
        `valor que fue cancelado con depósito en ${bancoTexto} cta. # `,
        { text: numeroCuenta, bold: true },
      ],
      contentWidth,
    );

    richParagraph(
      doc,
      [
        { text: 'QUINTA: OTRA. -', bold: true },
        ` La parte arrendadora aclara que una vez que el ${gadNombre} entrega el derecho de uso por `,
        { text: `${aniosArriendo} años `, bold: true },
        'a partir de la fecha del ',
        {
          text: `${fechaInicio.dia} de ${fechaInicio.mes} del ${fechaInicio.anio}`,
          bold: true,
        },
        ', la parte arrendataria. Vence el contrato el ',
        {
          text: `${fechaFin.dia} de ${fechaFin.mes} del ${fechaFin.anio}`,
          bold: true,
        },
        '.',
      ],
      contentWidth,
    );

    richParagraph(
      doc,
      [
        { text: 'SEXTA: -', bold: true },
        ' Las partes por estar conforme con las estipulaciones del presente contrato, firman al pie del mismo y por duplicado para constancia de lo actuado suscriben.',
      ],
      contentWidth,
    );

    if (observaciones) {
      richParagraph(
        doc,
        [
          { text: 'OBSERVACIONES: -', bold: true },
          ` ${observaciones}`,
        ],
        contentWidth,
      );
    }

    // -----------------------------------------------------------------------
    // Firmas
    // -----------------------------------------------------------------------
    const signatureMinHeight = 160;
    const availableHeight =
      doc.page.height - doc.page.margins.bottom - doc.y;
    if (availableHeight < signatureMinHeight) {
      doc.addPage();
      doc.moveDown(3);
    } else {
      doc.moveDown(4.5);
    }

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const colWidth = (right - left) / 2 - 30;
    const lineY = doc.y;
    const leftX = left + 20;
    const rightX = right - 20 - colWidth;

    doc
      .strokeColor('#94a3b8')
      .moveTo(leftX, lineY)
      .lineTo(leftX + colWidth, lineY)
      .stroke();
    doc
      .moveTo(rightX, lineY)
      .lineTo(rightX + colWidth, lineY)
      .stroke();

    const textY = lineY + 4;
    const labelStyle = (size = 9.5, bold = true) =>
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor('#111827');

    const cargoPresidente = 'PRESIDENTE';
    const nombreEntidad = (gadInfo?.nombre || 'GAD CHECA').toUpperCase();
    const firmaCargo = `${cargoPresidente} DEL ${nombreEntidad}`;

    labelStyle().text(presidente, leftX, textY, { width: colWidth, align: 'center' });
    labelStyle(8.6, false).text(
      firmaCargo,
      leftX,
      textY + 14,
      { width: colWidth, align: 'center' },
    );
    labelStyle(8.6, false).text('ARRENDADOR', leftX, textY + 26, {
      width: colWidth,
      align: 'center',
    });

    labelStyle().text(
      truncate(`Sr/Sra. ${responsableNombre}`, 40),
      rightX,
      textY,
      { width: colWidth, align: 'center' },
    );
    labelStyle(8.6, false).text(
      truncate(`CI. ${responsableCI}`, 25),
      rightX,
      textY + 14,
      { width: colWidth, align: 'center' },
    );
    labelStyle(8.6, false).text('ARRENDATARIO', rightX, textY + 26, {
      width: colWidth,
      align: 'center',
    });

    doc.end();
  });
}
