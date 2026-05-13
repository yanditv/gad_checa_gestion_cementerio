/**
 * Catch-all BFF proxy: cualquier ruta `/api/*` que no tenga route handler
 * específico (login, logout, contratos, etc.) cae aquí. Lee el JWT desde la
 * cookie httpOnly y lo anexa como `Authorization: Bearer <token>` antes de
 * proxyar al backend NestJS.
 *
 * Mantiene el query string, el body, el método y desempaqueta la convención
 * `{ success: true, data, meta }` del `ApiResponseInterceptor` del backend
 * para que el cliente reciba el shape esperado (`{ data, meta }`).
 */
import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../_utils';
import { authHeaders } from '@/lib/auth';

const PASSTHROUGH_METHODS = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

async function proxy(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const url = new URL(request.url);
  const targetUrl = `${API_URL}/${path.join('/')}${url.search}`;

  if (!PASSTHROUGH_METHODS.has(request.method)) {
    return NextResponse.json(
      { message: `Método ${request.method} no permitido` },
      { status: 405 },
    );
  }

  const method = request.method;
  const init: RequestInit = {
    method,
    headers: await authHeaders(),
    cache: 'no-store',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    // Reenviamos el cuerpo crudo si lo hay
    const body = await request.text();
    if (body) init.body = body;
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(targetUrl, init);
  } catch {
    return NextResponse.json(
      { message: 'No se pudo contactar al servidor' },
      { status: 502 },
    );
  }

  // Streams binarios (PDF, Excel): no se desempaquetan como JSON.
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    if (contentType) headers.set('Content-Type', contentType);
    const disp = response.headers.get('content-disposition');
    if (disp) headers.set('Content-Disposition', disp);
    return new Response(buffer, { status: response.status, headers });
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error?.message ||
      `Error ${response.status}`;
    return NextResponse.json(
      { message, errors: payload?.errors },
      { status: response.status },
    );
  }

  // Desempaqueta { success, data, meta } → { data, meta }
  const { data, meta } = unwrapApiResponse<unknown>(payload);
  return NextResponse.json(meta ? { data, meta } : data);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
