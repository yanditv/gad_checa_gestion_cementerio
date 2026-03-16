import { getContratoById } from '@/lib/contratos-server';
import { buildContratoPdfBuffer } from '@/lib/contrato-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, '_');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const contrato = await getContratoById(id);
    const pdfBuffer = await buildContratoPdfBuffer(contrato);
    const numeroContrato = contrato.numeroSecuencial || `CTR-${id}`;
    const fileName = `${sanitizeFileName(`Contrato_${numeroContrato}`)}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating contrato PDF', error);
    return new Response('No se pudo generar el PDF del contrato.', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}
