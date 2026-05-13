import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout } from '../../_utils';
import { authHeaders, buildClearAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    await fetchWithTimeout(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: await authHeaders(),
      cache: 'no-store',
    });
  } catch {
    // Aún si el backend no responde, limpiamos la cookie local.
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(buildClearAuthCookie());
  return res;
}
