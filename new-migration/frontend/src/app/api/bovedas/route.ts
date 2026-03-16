import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../_utils';

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams.toString();
    const response = await fetchWithTimeout(`${API_URL}/bovedas${params ? `?${params}` : ''}`, {
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
      { id: 1, numero: 'B001', capacidad: 4, tipo: 'Bóveda', estado: true, precio: 2500, precioArrendamiento: 800, bloque: { nombre: 'Bloque A', cementerio: { nombre: 'Cementerio Central' } }, propietario: { persona: { nombre: 'Juan', apellido: 'Pérez' } } },
      { id: 2, numero: 'B002', capacidad: 6, tipo: 'Bóveda', estado: true, precio: 3000, precioArrendamiento: 1000, bloque: { nombre: 'Bloque A', cementerio: { nombre: 'Cementerio Central' } }, propietario: null },
      { id: 3, numero: 'B003', capacidad: 2, tipo: 'Nicho', estado: false, precio: 1500, precioArrendamiento: 500, bloque: { nombre: 'Bloque B', cementerio: { nombre: 'Cementerio Central' } }, propietario: { persona: { nombre: 'María', apellido: 'García' } } },
      { id: 4, numero: 'N001', capacidad: 1, tipo: 'Nicho', estado: true, precio: 1200, precioArrendamiento: 400, bloque: { nombre: 'Bloque C', cementerio: { nombre: 'Cementerio Central' } }, propietario: null },
      { id: 5, numero: 'N002', capacidad: 1, tipo: 'Nicho', estado: true, precio: 1200, precioArrendamiento: 400, bloque: { nombre: 'Bloque C', cementerio: { nombre: 'Cementerio Central' } }, propietario: null },
      ],
      meta: { page: 1, limit: 20, total: 5, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    });
  }
}
