import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../../_utils';
import { authHeaders } from '@/lib/auth';

export async function GET() {
  try {
    const response = await fetchWithTimeout(`${API_URL}/contratos/create-metadata`, {
      headers: await authHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch');
    }

    const payload = await response.json();
    const { data } = unwrapApiResponse<any>(payload);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      descuentos: [],
      bancos: [],
      tiposPago: ['Efectivo', 'Transferencia', 'Banco'],
      numeroDeMesesDefault: 5,
    });
  }
}
