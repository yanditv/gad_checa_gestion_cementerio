/**
 * Generador del PDF de factura/recibo de pago. Paridad con el legado
 * (Controllers/Pdf/FacturaPagoPdfDocument.cs):
 *   - A5/A4 vertical con cabecera GAD + número de recibo.
 *   - Datos del contrato (número, difunto, bóveda).
 *   - Tabla de cuotas cubiertas con fecha de vencimiento y monto.
 *   - Subtotal, descuento, total cobrado.
 *   - Pie con método de pago, fecha y referencia.
 *   - Firmas Tesorería / Responsable.
 */
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const PAGE_MARGIN = 36;

function formatCurrency(value: number | string | null | undefined): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function findLogo(): string | null {
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

export async function buildFacturaPdfBuffer(pago: any): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A5',
      margin: PAGE_MARGIN,
      info: {
        Title: `Recibo ${pago.numeroRecibo}`,
        Author: 'GAD Parroquial de Checa',
        Subject: 'Recibo de pago',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // -----------------------------------------------------------------------
    // Datos derivados
    // -----------------------------------------------------------------------
    const cuotas = (pago.cuotas || []).map((cp: any) => cp.cuota);
    const contrato = cuotas[0]?.contrato ?? null;
    const cementerio =
      contrato?.boveda?.bloque?.cementerio ?? null;
    const difunto = contrato?.difunto ?? null;
    const responsablePrincipal =
      contrato?.responsables?.[0]?.responsable?.persona ?? null;

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;

    // -----------------------------------------------------------------------
    // Cabecera
    // -----------------------------------------------------------------------
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
      .text('GAD Parroquial de Checa', left + 50, 28)
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#475569')
      .text('Sistema de Gestión de Cementerio', left + 50, 42);

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#1890ff')
      .text(`Recibo ${pago.numeroRecibo}`, left, 28, {
        width: contentWidth,
        align: 'right',
      });
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#475569')
      .text(`Fecha: ${formatDate(pago.fechaPago)}`, left, 42, {
        width: contentWidth,
        align: 'right',
      });

    doc
      .strokeColor('#cbd5e1')
      .moveTo(left, 76)
      .lineTo(right, 76)
      .stroke();

    doc.y = 86;

    // -----------------------------------------------------------------------
    // Título
    // -----------------------------------------------------------------------
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#111827')
      .text('Recibo de pago', { align: 'center', width: contentWidth });

    doc.moveDown(0.6);

    // -----------------------------------------------------------------------
    // Datos del contrato
    // -----------------------------------------------------------------------
    const labelStyle = () =>
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569');
    const valueStyle = () =>
      doc.font('Helvetica').fontSize(9).fillColor('#111827');

    const drawField = (label: string, value: string) => {
      const y = doc.y;
      labelStyle().text(label, left, y, { width: 110 });
      valueStyle().text(value, left + 110, y, {
        width: contentWidth - 110,
      });
      doc.moveDown(0.2);
    };

    drawField('Contrato:', contrato?.numeroSecuencial ?? '—');
    drawField(
      'Difunto:',
      `${difunto?.nombre ?? ''} ${difunto?.apellido ?? ''}`.trim() || '—',
    );
    drawField(
      'Bóveda:',
      contrato?.boveda
        ? `${contrato.boveda.numero ?? ''} · Bloque ${contrato.boveda.bloque?.nombre ?? ''}`
        : '—',
    );
    if (responsablePrincipal) {
      drawField(
        'Responsable:',
        `${responsablePrincipal.nombre ?? ''} ${responsablePrincipal.apellido ?? ''}`.trim(),
      );
    }

    doc.moveDown(0.3);

    // -----------------------------------------------------------------------
    // Tabla de cuotas
    // -----------------------------------------------------------------------
    const tableTop = doc.y;
    const colWidths = [40, 130, 90, 80]; // #, fecha vencimiento, monto base, total
    const colHeaders = ['#', 'Vencimiento', 'Monto base', 'Total'];

    doc
      .rect(left, tableTop, contentWidth, 18)
      .fillAndStroke('#f1f5f9', '#cbd5e1');

    let cursorX = left;
    colHeaders.forEach((h, idx) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#334155')
        .text(h, cursorX + 6, tableTop + 5, {
          width: colWidths[idx] - 12,
          align: idx >= 2 ? 'right' : 'left',
        });
      cursorX += colWidths[idx];
    });

    doc.y = tableTop + 22;

    cuotas.forEach((cuota: any) => {
      const y = doc.y;
      cursorX = left;
      doc.font('Helvetica').fontSize(8.5).fillColor('#1f2937');

      const cells = [
        String(cuota.numero ?? ''),
        formatDate(cuota.fechaVencimiento),
        formatCurrency(cuota.monto),
        formatCurrency(cuota.monto), // total individual aprox; el cálculo de mora vive en el pago.monto consolidado
      ];

      cells.forEach((value, idx) => {
        doc.text(value, cursorX + 6, y, {
          width: colWidths[idx] - 12,
          align: idx >= 2 ? 'right' : 'left',
        });
        cursorX += colWidths[idx];
      });

      doc
        .strokeColor('#e2e8f0')
        .moveTo(left, y + 14)
        .lineTo(right, y + 14)
        .stroke();
      doc.y = y + 18;
    });

    doc.moveDown(0.3);

    // -----------------------------------------------------------------------
    // Totales
    // -----------------------------------------------------------------------
    const totalsX = right - 200;
    const writeTotalLine = (label: string, value: string, bold = false) => {
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9)
        .fillColor('#111827')
        .text(label, totalsX, doc.y, { width: 110, align: 'right' });
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9)
        .fillColor(bold ? '#0f172a' : '#1f2937')
        .text(value, totalsX + 110, doc.y - doc.heightOfString(value, { width: 90 }), {
          width: 90,
          align: 'right',
        });
      doc.moveDown(0.2);
    };

    writeTotalLine('Subtotal:', formatCurrency(pago.montoSubtotal ?? pago.monto));
    if (
      pago.montoDescuento &&
      Number(pago.montoDescuento) > 0
    ) {
      writeTotalLine(
        `Descuento (${pago.descuento?.porcentaje ?? 0}%):`,
        `−${formatCurrency(pago.montoDescuento)}`,
      );
    }
    writeTotalLine('Total cobrado:', formatCurrency(pago.monto), true);

    doc.moveDown(0.4);

    // -----------------------------------------------------------------------
    // Pie con método de pago
    // -----------------------------------------------------------------------
    drawField('Método:', pago.metodoPago ?? '—');
    if (pago.banco) {
      drawField('Banco:', pago.banco.nombre);
    }
    if (pago.referencia) {
      drawField('Referencia:', pago.referencia);
    }
    if (pago.observacion) {
      drawField('Observación:', pago.observacion);
    }

    // -----------------------------------------------------------------------
    // Firmas
    // -----------------------------------------------------------------------
    doc.moveDown(2);
    const signY = doc.y;
    const colW = (contentWidth - 40) / 2;

    doc
      .strokeColor('#94a3b8')
      .moveTo(left + 20, signY)
      .lineTo(left + 20 + colW, signY)
      .stroke();
    doc
      .moveTo(right - 20 - colW, signY)
      .lineTo(right - 20, signY)
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#111827')
      .text('TESORERÍA', left + 20, signY + 4, {
        width: colW,
        align: 'center',
      })
      .text('RESPONSABLE', right - 20 - colW, signY + 4, {
        width: colW,
        align: 'center',
      });

    if (responsablePrincipal) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#475569')
        .text(
          `${responsablePrincipal.nombre ?? ''} ${responsablePrincipal.apellido ?? ''}`.trim(),
          right - 20 - colW,
          signY + 16,
          { width: colW, align: 'center' },
        );
    }

    // -----------------------------------------------------------------------
    // Footer
    // -----------------------------------------------------------------------
    const footerY = doc.page.height - 30;
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#94a3b8')
      .text(
        `${cementerio?.direccion ?? 'Checa, Ecuador'} · ${cementerio?.telefono ?? ''} · ${cementerio?.email ?? ''}`,
        left,
        footerY,
        { width: contentWidth, align: 'center' },
      );

    doc.end();
  });
}
