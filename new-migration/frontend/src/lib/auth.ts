/**
 * Helpers de autenticación del lado servidor.
 *
 * El JWT vive en una cookie httpOnly llamada `cementerio_auth` para que el
 * cliente no pueda leerla con JavaScript. Las rutas BFF (`/api/*`) leen la
 * cookie, anexan `Authorization: Bearer <token>` y proxyan al backend Nest.
 */
import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || 'cementerio_auth';

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días (espejo de JWT_EXPIRES_IN)

const isProd = process.env.NODE_ENV === 'production';

export function buildAuthCookie(token: string) {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

export function buildClearAuthCookie() {
  return {
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
    maxAge: 0,
  };
}

/** Lee el token JWT desde la cookie httpOnly (server-only). */
export async function readAuthToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/** Construye los headers con Authorization si hay token. */
export async function authHeaders(
  init: HeadersInit = {},
): Promise<HeadersInit> {
  const headers = new Headers(init);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = await readAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}
