import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../../_utils';

export async function GET() {
  try {
    const response = await fetchWithTimeout(`${API_URL}/contratos/create-metadata`, {
      headers: {
        'Content-Type': 'application/json',
      },
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
