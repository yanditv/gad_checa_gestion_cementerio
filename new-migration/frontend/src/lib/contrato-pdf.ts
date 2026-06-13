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
import { logger } from './logger';
import {
  DEFAULT_PREAMBULO,
  DEFAULT_CLAUSULA1,
  DEFAULT_CLAUSULA2,
  DEFAULT_CLAUSULA3,
  DEFAULT_CLAUSULA4,
  DEFAULT_CLAUSULA5,
  DEFAULT_CLAUSULA6,
} from './default-contrato-templates';

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

async function getImageBufferOrPath(imgUrl?: string | null): Promise<string | Buffer | null> {
  if (!imgUrl) return null;

  // Si es una ruta local del frontend (anterior o fallback uploads)
  if (imgUrl.startsWith('/uploads/')) {
    const localPath = path.join(process.cwd(), 'public', imgUrl);
    if (fs.existsSync(localPath)) {
      return localPath;
    }
  }

  // Si es la ruta de imágenes del GAD servida por el backend
  if (imgUrl.startsWith('/api/cementerios/gad-informacion/image') || imgUrl.startsWith('api/cementerios/gad-informacion/image')) {
    const cleanUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Mapeamos /api/* a la URL interna del backend (removiendo el /api de Next.js BFF)
    const targetUrl = `${backendBase}${cleanUrl.replace(/^\/api/, '')}`;
    try {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (e) {
      logger.error('Error fetching GAD image from backend:', e, targetUrl);
    }
    return null;
  }

  // Si es una URL completa
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
    // Validar contra allowlist de dominios autorizados para prevenir SSRF.
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const parsedUrl = new URL(imgUrl);
      const parsedBackend = new URL(backendBase);
      
      const isAllowedHost = parsedUrl.host === parsedBackend.host;
      
      if (!isAllowedHost) {
        logger.warn('Blocked SSRF attempt: URL host not in allowlist', imgUrl);
        return null;
      }

      const res = await fetch(imgUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (e) {
      logger.error('Error downloading remote image:', e, imgUrl);
    }
  } else {
    // Fallback original para archivos locales
    const relativePath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
    const localPath = path.join(process.cwd(), 'public', relativePath);
    if (fs.existsSync(localPath)) {
      return localPath;
    }
  }
  return null;
}

async function getLogoBufferOrPath(gadInfo?: any): Promise<string | Buffer | null> {
  if (gadInfo?.logoUrl) {
    const customLogo = await getImageBufferOrPath(gadInfo.logoUrl);
    if (customLogo) return customLogo;
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

function compileTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, val ?? '');
  }
  return result;
}

function richParagraph(
  doc: PDFKit.PDFDocument,
  input: RichSegment[] | string,
  contentWidth: number,
) {
  let segments: RichSegment[];
  if (typeof input === 'string') {
    // Parse Markdown-style **bold**
    const parts = input.split('**');
    segments = parts.map((part, idx) => {
      // Even indexes are normal, odd indexes are bold
      const isBold = idx % 2 === 1;
      return { text: part, bold: isBold };
    }).filter(s => s.text !== '');
  } else {
    segments = input;
  }

  const normalized = segments.map<{ text: string; bold: boolean }>((s) =>
    typeof s === 'string'
      ? { text: s, bold: false }
      : { text: s.text ?? '', bold: !!s.bold },
  );

  // PDFKit space collapse prevention: 
  // If a segment starts with a space and there is a previous segment,
  // append the space to the end of the previous segment instead.
  for (let i = 1; i < normalized.length; i++) {
    if (normalized[i].text.startsWith(' ') && !normalized[i - 1].text.endsWith(' ')) {
      normalized[i - 1].text += ' ';
      normalized[i].text = normalized[i].text.slice(1);
    }
  }

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

function drawHeader(
  doc: PDFKit.PDFDocument,
  logo: string | Buffer | null,
  headerBanner: string | Buffer | null,
  usarHeaderImagen: boolean,
) {
  try {
    if (usarHeaderImagen && headerBanner) {
      const pageWidth = doc.page.width;
      const height = 80;
      doc.image(headerBanner, 0, 0, { width: pageWidth, height: height });
    } else if (logo) {
      const pageWidth = doc.page.width;
      const imgWidth = 56;
      const x = (pageWidth - imgWidth) / 2;
      doc.image(logo, x, 16, { width: imgWidth, height: 56 });
    }
  } catch (err) {
    logger.error('Error rendering PDF header image:', err);
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
  footerBanner: string | Buffer | null,
  usarFooterImagen: boolean,
) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const pageHeight = doc.page.height;
  const y = pageHeight - FOOTER_HEIGHT + 8;

  doc.save();
  
  // Temporarily disable bottom margin to prevent recursive page breaks
  const oldBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = -1000;

  try {
    if (usarFooterImagen && footerBanner) {
      const pageWidth = doc.page.width;
      const height = 60;
      doc.image(footerBanner, 0, pageHeight - height, { width: pageWidth, height: height });
    } else {
      const direccion = truncate(cementerio.direccion || gadInfo?.direccion || 'Checa, Ecuador', 60);
      const telefono = truncate(cementerio.telefono || gadInfo?.telefono || '02-XXXXXXX', 15);
      const email = truncate(cementerio.email || gadInfo?.email || 'checa@example.gob.ec', 40);

      doc.fontSize(8.4).fillColor('#475569');
      const footerText = `Dirección: ${direccion}  |  Teléfono: ${telefono}  |  Correo: ${email}`;
      doc
        .font('Helvetica')
        .text(footerText, left, y, {
          width: right - left,
          align: 'center',
          lineGap: 2,
        });
    }
  } catch (err) {
    logger.error('Error rendering PDF footer image:', err);
  }

  // Restore bottom margin
  doc.page.margins.bottom = oldBottomMargin;

  doc.restore();
}

// ---------------------------------------------------------------------------
// Generación
// ---------------------------------------------------------------------------

export async function buildContratoPdfBuffer(contrato: any, gadInfo?: any): Promise<Buffer> {
  const logo = await getLogoBufferOrPath(gadInfo);
  const headerBanner = gadInfo?.usarHeaderImagen
    ? await getImageBufferOrPath(gadInfo.headerImagenUrl)
    : null;
  const footerBanner = gadInfo?.usarFooterImagen
    ? await getImageBufferOrPath(gadInfo.footerImagenUrl)
    : null;

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
      bloque.nombre || bloque.descripcion || '________________',
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
      drawHeader(doc, logo, headerBanner, !!gadInfo?.usarHeaderImagen);
      drawFooter(doc, gadInfo, cementerio, footerBanner, !!gadInfo?.usarFooterImagen);
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
    // Variables para compilación de plantillas
    // -----------------------------------------------------------------------
    const pisoTexto = piso?.numero != null ? `, piso ${piso.numero}` : '';
    const vars: Record<string, string> = {
      parroquia,
      fechaInicioDia: fechaInicio.dia,
      fechaInicioMes: fechaInicio.mes,
      fechaInicioAnio: fechaInicio.anio,
      fechaFinDia: fechaFin.dia,
      fechaFinMes: fechaFin.mes,
      fechaFinAnio: fechaFin.anio,
      gadNombre,
      presidente,
      responsableNombre,
      responsableCI,
      responsableTelefono,
      responsableEmail,
      difuntoNombre,
      difuntoCI,
      bovedaNumero,
      bloqueDescripcion,
      pisoTexto,
      pisoNumero: piso?.numero != null ? String(piso.numero) : '',
      montoTotal: formatCurrencyUsd(montoTotal),
      bancoTexto,
      numeroCuenta,
      aniosArriendo: String(aniosArriendo),
      cementerioNombre: cementerio.nombre || 'Cementerio de la Parroquia',
      numeroContrato,
    };

    // Plantillas con fallbacks si no están configuradas en la base de datos
    const tPreambulo = cementerio.contratoPreambulo || DEFAULT_PREAMBULO;
    const tClausula1 = cementerio.contratoClausula1 || DEFAULT_CLAUSULA1;
    const tClausula2 = cementerio.contratoClausula2 || DEFAULT_CLAUSULA2;
    const tClausula3 = cementerio.contratoClausula3 || DEFAULT_CLAUSULA3;
    const tClausula4 = cementerio.contratoClausula4 || DEFAULT_CLAUSULA4;
    const tClausula5 = cementerio.contratoClausula5 || DEFAULT_CLAUSULA5;
    const tClausula6 = cementerio.contratoClausula6 || DEFAULT_CLAUSULA6;

    // -----------------------------------------------------------------------
    // Renderizado del Contenido del PDF
    // -----------------------------------------------------------------------
    richParagraph(doc, compileTemplate(tPreambulo, vars), contentWidth);
    richParagraph(doc, compileTemplate(tClausula1, vars), contentWidth);
    richParagraph(doc, compileTemplate(tClausula2, vars), contentWidth);
    richParagraph(doc, compileTemplate(tClausula3, vars), contentWidth);
    richParagraph(doc, compileTemplate(tClausula4, vars), contentWidth);
    richParagraph(doc, compileTemplate(tClausula5, vars), contentWidth);
    richParagraph(doc, compileTemplate(tClausula6, vars), contentWidth);

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
      truncate(responsableNombre, 40),
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
