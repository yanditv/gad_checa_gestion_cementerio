import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../../_utils';

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams.toString();
    const response = await fetchWithTimeout(
      `${API_URL}/contratos/numero-secuencial${params ? `?${params}` : ''}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch');
    }

    const payload = await response.json();
    const { data } = unwrapApiResponse<any>(payload);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      numeroSecuencial: '',
      montoTotal: 0,
      boveda: null,
    });
  }
}
