import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout } from '../../_utils';
import { authHeaders, readAuthToken } from '@/lib/auth';

export async function POST(request: Request) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { message: 'No autenticado' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Solicitud inválida' },
      { status: 400 },
    );
  }

  try {
    const response = await fetchWithTimeout(
      `${API_URL}/auth/change-password`,
      {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.message || 'No se pudo actualizar la contraseña';
      return NextResponse.json({ message }, { status: response.status });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo contactar al servidor' },
      { status: 502 },
    );
  }
}
