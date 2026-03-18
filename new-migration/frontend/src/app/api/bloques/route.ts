import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../_utils';

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams.toString();
    const response = await fetchWithTimeout(`${API_URL}/blocks${params ? `?${params}` : ''}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch');
    }

    const payload = await response.json();
    const normalized = 'items' in payload ? { data: payload.items, meta: payload.meta } : unwrapApiResponse<any[]>(payload);
    const data = (normalized.data || []).map((block: any) => ({
      id: String(block.id),
      nombre: block.name ?? block.nombre ?? '',
      descripcion: block.description ?? block.descripcion ?? null,
      estado: block.isActive ?? block.estado ?? true,
      cementerioId: block.cemeteryId ?? block.cementerioId ?? null,
    }));
    const meta = normalized.meta;

    return NextResponse.json({ data, meta });
  } catch (error) {
    return NextResponse.json({
      data: [
        { id: '1', nombre: 'Bloque A', descripcion: 'Zona principal', estado: true, cementerioId: '1' },
        { id: '2', nombre: 'Bloque B', descripcion: 'Zona norte', estado: true, cementerioId: '1' },
      ],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    });
  }
}
