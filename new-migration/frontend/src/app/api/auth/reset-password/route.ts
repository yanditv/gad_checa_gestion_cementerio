import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout } from '../../_utils';

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
    const response = await fetchWithTimeout(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.message || 'El enlace es inválido o expiró';
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
