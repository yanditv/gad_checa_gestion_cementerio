'use client';

import { blockOptionListSchema } from './schemas';
import type { BlockOption, CreateBovedaPayload } from './types';

function getAuthHeaders() {
  if (typeof window === 'undefined') {
    return {} as Record<string, string>;
  }

  const token = window.localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || payload?.error?.message || 'No se pudo completar la solicitud';
    throw new Error(message);
  }

  return payload as T;
}

export async function getBlockOptions(): Promise<BlockOption[]> {
  const payload = await parseResponse<{ data?: unknown }>(
    await fetch('/api/bloques', {
      method: 'GET',
      cache: 'no-store',
    }),
  );

  return blockOptionListSchema.parse(payload.data ?? []);
}

export async function createBoveda(payload: CreateBovedaPayload) {
  return parseResponse<Record<string, unknown>>(
    await fetch('/api/bovedas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    }),
  );
}