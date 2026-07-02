import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../../_utils';
import { authHeaders } from '@/lib/auth';
import { buildContratoPdfBuffer } from '@/lib/contrato-pdf';
import { getGADInformacion } from '@/lib/contratos-server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const draft = await request.json();

    // Fetch GAD and Bóveda details
    const [gadInfo, bovedaRes] = await Promise.all([
      getGADInformacion().catch(() => null),
      fetchWithTimeout(`${API_URL}/bovedas/${draft.contrato.bovedaId}`, {
        headers: await authHeaders(),
        cache: 'no-store',
      }).catch(() => null),
    ]);

    let boveda = null;
    if (bovedaRes && bovedaRes.ok) {
      const payload = await bovedaRes.json();
      boveda = unwrapApiResponse(payload).data;
    }

    // Build mock contrato matching buildContratoPdfBuffer structure
    const mockContrato = {
      id: 0,
      numeroSecuencial: draft.contrato.numeroSecuencial || 'PRE-VIEW',
      fechaInicio: draft.contrato.fechaInicio,
      fechaFin: draft.contrato.fechaFin,
      numeroDeMeses: draft.contrato.numeroDeMeses,
      montoTotal: draft.contrato.montoTotal,
      observaciones: draft.contrato.observaciones,
      boveda,
      difunto: {
        nombre: draft.difunto.nombres,
        apellido: draft.difunto.apellidos,
        numeroIdentificacion: draft.difunto.numeroIdentificacion || null,
        fechaNacimiento: draft.difunto.fechaNacimiento || null,
        fechaDefuncion: draft.difunto.fechaFallecimiento || null,
      },
      responsables: draft.responsables.map((r: any) => ({
        responsable: {
          persona: {
            nombre: r.nombres,
            apellido: r.apellidos,
            numeroIdentificacion: r.numeroIdentificacion,
            telefono: r.telefono || null,
            email: r.email || null,
            direccion: r.direccion || null,
          }
        },
        parentesco: r.parentesco || null,
      })),
      cuotas: draft.cuotas.map((c: any) => ({
        monto: c.monto
      }))
    };

    const pdfBuffer = await buildContratoPdfBuffer(mockContrato, gadInfo);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview.pdf"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('Error generating preview PDF', error);
    return new Response('No se pudo generar la vista previa del PDF.', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}
