export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const API_TIMEOUT_MS = 8000;

export async function fetchWithTimeout(input: string, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
}

export function unwrapApiResponse<T>(payload: any): { data: T; meta?: any } {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    return {
      data: payload.data as T,
      meta: payload.meta,
    };
  }

  return { data: payload as T };
}
