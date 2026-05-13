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
    const response = await fetchWithTimeout(
      `${API_URL}/auth/forgot-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.message || 'No se pudo procesar la solicitud';
      return NextResponse.json({ message }, { status: response.status });
    }
    return NextResponse.json({
      success: true,
      message:
        payload?.data?.message ||
        payload?.message ||
        'Si el correo está registrado, recibirás un enlace.',
    });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo contactar al servidor' },
      { status: 502 },
    );
  }
}
