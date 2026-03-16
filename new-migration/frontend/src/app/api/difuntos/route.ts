import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../_utils';

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams.toString();
    const response = await fetchWithTimeout(`${API_URL}/difuntos${params ? `?${params}` : ''}`, {
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
      { id: 1, nombre: 'Juan', apellido: 'Pérez', numeroIdentificacion: '1234567890', fechaNacimiento: '1950-05-15', fechaDefuncion: '2024-01-10', fechaInhumacion: '2024-01-12', causaMuerte: 'CA', estado: true, boveda: { numero: 'B001', bloque: { nombre: 'Bloque A' } } },
      { id: 2, nombre: 'María', apellido: 'García', numeroIdentificacion: '0987654321', fechaNacimiento: '1960-08-20', fechaDefuncion: '2024-02-15', fechaInhumacion: '2024-02-17', causaMuerte: 'IM', estado: true, boveda: { numero: 'B002', bloque: { nombre: 'Bloque A' } } },
      { id: 3, nombre: 'Pedro', apellido: 'Martínez', numeroIdentificacion: '5678901234', fechaNacimiento: '1945-03-10', fechaDefuncion: '2024-03-20', fechaInhumacion: '2024-03-22', causaMuerte: 'EC', estado: true, boveda: { numero: 'B003', bloque: { nombre: 'Bloque B' } } },
      ],
      meta: { page: 1, limit: 20, total: 3, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    });
  }
}
