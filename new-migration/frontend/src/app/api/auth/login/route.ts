import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../../_utils';
import { buildAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
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
    const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.message || payload?.error?.message || 'Credenciales inválidas';
      return NextResponse.json({ message }, { status: response.status });
    }

    const { data } = unwrapApiResponse<{
      token: string;
      user: Record<string, unknown>;
    }>(payload);

    const res = NextResponse.json({ user: data.user });
    res.cookies.set(buildAuthCookie(data.token));
    return res;
  } catch {
    return NextResponse.json(
      { message: 'No se pudo contactar al servidor' },
      { status: 502 },
    );
  }
}
