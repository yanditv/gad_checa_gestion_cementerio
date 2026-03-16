import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../_utils';

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams.toString();
    const response = await fetchWithTimeout(`${API_URL}/contratos${params ? `?${params}` : ''}`, {
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
      { id: 1, numeroSecuencial: 'CTR-2024-00001', fechaInicio: '2024-01-15', fechaFin: '2027-01-15', montoTotal: 2500, estado: true, esRenovacion: false, difunto: { nombre: 'Juan', apellido: 'Pérez', numeroIdentificacion: '1234567890' }, boveda: { numero: 'B001', bloque: { nombre: 'Bloque A' } } },
      { id: 2, numeroSecuencial: 'CTR-2024-00002', fechaInicio: '2024-02-20', fechaFin: '2027-02-20', montoTotal: 3000, estado: true, esRenovacion: false, difunto: { nombre: 'María', apellido: 'García', numeroIdentificacion: '0987654321' }, boveda: { numero: 'B002', bloque: { nombre: 'Bloque A' } } },
      { id: 3, numeroSecuencial: 'CTR-2024-00003', fechaInicio: '2024-03-10', fechaFin: '2025-03-10', montoTotal: 1800, estado: true, esRenovacion: true, difunto: { nombre: 'Pedro', apellido: 'Martínez', numeroIdentificacion: '5678901234' }, boveda: { numero: 'B003', bloque: { nombre: 'Bloque B' } } },
    ],
      meta: { page: 1, limit: 20, total: 3, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetchWithTimeout(`${API_URL}/contratos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload?.error?.message || payload?.message || 'Failed to create contrato';
      return NextResponse.json({ message }, { status: response.status });
    }

    const { data } = unwrapApiResponse<any>(payload);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'No se pudo crear el contrato' }, { status: 500 });
  }
}
