import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../_utils';

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams.toString();
    const response = await fetchWithTimeout(`${API_URL}/bloques${params ? `?${params}` : ''}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch');
    }

    const payload = await response.json();
    const { data, meta } = unwrapApiResponse<any[]>(payload);
    return NextResponse.json({ data, meta });
  } catch (error) {
    return NextResponse.json({
      data: [
        { id: 1, nombre: 'Bloque A', descripcion: 'Zona principal', estado: true, cementerioId: 1 },
        { id: 2, nombre: 'Bloque B', descripcion: 'Zona norte', estado: true, cementerioId: 1 },
      ],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    });
  }
}
