/**
 * Helpers compartidos entre los PDF de reportes (header GAD, footer,
 * formato de fecha/moneda, tabla básica).
 */
import fs from 'node:fs';
import path from 'node:path';
import type PDFDocument from 'pdfkit';

export const PAGE_MARGIN = 36;

export function formatCurrency(value: number | string | null | undefined): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function findLogo(): string | null {
  const candidates = [
    path.join(process.cwd(), 'public', 'logo_gad.png'),
    path.join(process.cwd(), '..', 'frontend', 'public', 'logo.png'),
    path.join(process.cwd(), 'public', 'logo.png'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

/**
 * Datos institucionales que parametrizan el encabezado/pie del PDF. Provienen
 * de `Cementerio` / `GADInformacion` para no hardcodear "Checa" (el sistema se
 * despliega también para otros GAD, p. ej. El Valle).
 */
export interface InstitucionPdf {
  /** Nombre institucional (ej. "GAD Parroquial de El Valle"). */
  nombre: string;
  /** Línea secundaria (ej. "Sistema de Gestión de Inventario"). */
  subtitulo?: string;
}

const INSTITUCION_DEFAULT: InstitucionPdf = {
  nombre: 'GAD Parroquial de Checa',
  subtitulo: 'Sistema de Gestión de Cementerio',
};

export function drawHeader(
  doc: PDFKit.PDFDocument,
  titulo: string,
  subtitulo?: string,
  institucion: InstitucionPdf = INSTITUCION_DEFAULT,
) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;

  const logoPath = findLogo();
  if (logoPath) {
    try {
      doc.image(logoPath, left, 24, { width: 42, height: 42 });
    } catch {
      // ignore
    }
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#0f172a')
    .text(institucion.nombre, left + 50, 28)
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#475569')
    .text(
      institucion.subtitulo ?? INSTITUCION_DEFAULT.subtitulo!,
      left + 50,
      42,
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#1890ff')
    .text(titulo, left, 28, { width: contentWidth, align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#475569')
    .text(
      subtitulo ?? `Generado: ${new Date().toLocaleString('es-EC')}`,
      left,
      44,
      { width: contentWidth, align: 'right' },
    );

  doc
    .strokeColor('#cbd5e1')
    .moveTo(left, 76)
    .lineTo(right, 76)
    .stroke();

  doc.y = 86;
}

export function drawFooter(
  doc: PDFKit.PDFDocument,
  institucion: InstitucionPdf = INSTITUCION_DEFAULT,
) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;
  const footerY = doc.page.height - 24;

  const subtitulo = institucion.subtitulo ?? INSTITUCION_DEFAULT.subtitulo!;

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#94a3b8')
    .text(`${subtitulo} · ${institucion.nombre}`, left, footerY, {
      width: contentWidth,
      align: 'center',
    });
}

export type Column<T> = {
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
  format: (row: T) => string;
};

export function drawTable<T>(
  doc: PDFKit.PDFDocument,
  rows: T[],
  columns: Column<T>[],
  options: { rowHeight?: number } = {},
) {
  const rowHeight = options.rowHeight ?? 18;
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);
  const scale = contentWidth / totalWidth;
  const scaledWidths = columns.map((c) => c.width * scale);

  const drawRow = (
    values: string[],
    y: number,
    opts: { bold?: boolean; bg?: string; color?: string } = {},
  ) => {
    if (opts.bg) {
      doc.rect(left, y, contentWidth, rowHeight).fill(opts.bg);
    }
    let cursorX = left;
    doc
      .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(8)
      .fillColor(opts.color ?? '#1f2937');
    values.forEach((v, idx) => {
      doc.text(v, cursorX + 4, y + 5, {
        width: scaledWidths[idx] - 8,
        align: columns[idx].align ?? 'left',
        ellipsis: true,
        lineBreak: false,
      });
      cursorX += scaledWidths[idx];
    });
  };

  // Header
  drawRow(
    columns.map((c) => c.header),
    doc.y,
    { bold: true, bg: '#f1f5f9', color: '#334155' },
  );
  doc.y += rowHeight;

  for (const row of rows) {
    if (doc.y + rowHeight > doc.page.height - 48) {
      doc.addPage();
      drawRow(
        columns.map((c) => c.header),
        doc.y,
        { bold: true, bg: '#f1f5f9', color: '#334155' },
      );
      doc.y += rowHeight;
    }
    drawRow(
      columns.map((c) => c.format(row)),
      doc.y,
    );
    doc
      .strokeColor('#e2e8f0')
      .moveTo(left, doc.y + rowHeight)
      .lineTo(right, doc.y + rowHeight)
      .stroke();
    doc.y += rowHeight;
  }
}

export function streamPdf(build: (doc: PDFKit.PDFDocument) => void, opts: PDFKit.PDFDocumentOptions = {}): Promise<Buffer> {
  // Importación dinámica para no hacer que el módulo se cargue en arranque.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PDFDocument = require('pdfkit');
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: PAGE_MARGIN,
      ...opts,
    }) as PDFKit.PDFDocument;
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      build(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
