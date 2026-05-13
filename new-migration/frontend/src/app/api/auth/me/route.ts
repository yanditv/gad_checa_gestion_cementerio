import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../../_utils';
import { authHeaders, readAuthToken } from '@/lib/auth';

export async function GET() {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { message: 'No autenticado' },
      { status: 401 },
    );
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: await authHeaders(),
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.message || 'No autenticado';
      return NextResponse.json({ message }, { status: response.status });
    }
    const { data } = unwrapApiResponse(payload);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo contactar al servidor' },
      { status: 502 },
    );
  }
}
