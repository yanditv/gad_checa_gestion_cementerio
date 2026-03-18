export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const API_TIMEOUT_MS = 8000;

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export async function fetchWithTimeout(input: string, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
}

export function unwrapApiResponse<T>(payload: unknown): { data: T; meta?: unknown } {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const typedPayload = payload as unknown as { data: T; meta?: unknown };
    return {
      data: typedPayload.data,
      meta: typedPayload.meta,
    };
  }

  return { data: payload as T };
}

export function buildQueryString(params?: PaginationParams) {
  if (!params) return '';

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const result = query.toString();
  return result ? `?${result}` : '';
}

export async function fetchApiPayload<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchWithTimeout(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: init.cache ?? 'no-store',
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return unwrapApiResponse<T>(payload).data;
}

export async function fetchApiPaginated<T>(path: string, params?: PaginationParams) {
  const response = await fetchWithTimeout(`${API_URL}${path}${buildQueryString(params)}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  const unwrapped = unwrapApiResponse<T[]>(payload);
  return {
    data: unwrapped.data ?? [],
    meta: (unwrapped.meta ?? {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: Array.isArray(unwrapped.data) ? unwrapped.data.length : 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }) as {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    },
  };
}

export async function postApiPayload<T>(path: string, body?: unknown) {
  return fetchApiPayload<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function putApiPayload<T>(path: string, body?: unknown) {
  return fetchApiPayload<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}