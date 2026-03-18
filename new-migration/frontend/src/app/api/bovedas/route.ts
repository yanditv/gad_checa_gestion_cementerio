import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../_utils';

function normalizeVaultType(type: unknown) {
  if (typeof type !== 'string') {
    return 'Boveda';
  }

  const normalizedType = type.trim().toLowerCase();

  if (normalizedType === 'niche' || normalizedType === 'nicho') {
    return 'Nicho';
  }

  if (normalizedType === 'tomb' || normalizedType === 'mausoleo') {
    return 'Mausoleo';
  }

  return 'Boveda';
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams.toString();
    const response = await fetchWithTimeout(`${API_URL}/vaults${params ? `?${params}` : ''}`, {
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
    const data = (normalized.data || []).map((vault: any) => ({
      id: String(vault.id),
      numero: vault.number ?? vault.numero ?? '',
      capacidad: vault.capacity ?? vault.capacidad ?? 1,
      tipo: normalizeVaultType(vault.type ?? vault.tipo),
      estado: vault.isActive ?? vault.estado ?? true,
      precio: vault.price ?? vault.precio ?? 0,
      precioArrendamiento: vault.rentalPrice ?? vault.precioArrendamiento ?? 0,
      ubicacion: vault.location ?? vault.ubicacion ?? '',
      observaciones: vault.notes ?? vault.observaciones ?? '',
      bloqueId: vault.blockId ?? vault.bloqueId ?? '',
      bloque: vault.block
        ? {
            id: String(vault.block.id),
            nombre: vault.block.name ?? vault.block.nombre ?? '',
            cementerio: vault.block.cemetery
              ? {
                  id: String(vault.block.cemetery.id),
                  nombre: vault.block.cemetery.name ?? vault.block.cemetery.nombre ?? '',
                }
              : vault.block.cementerio,
          }
        : vault.bloque,
      propietario: vault.owner
        ? {
            id: String(vault.owner.id),
            persona: {
              id: String(vault.owner.person?.id ?? ''),
              nombre: vault.owner.person?.firstName ?? vault.owner.persona?.nombre ?? '',
              apellido: vault.owner.person?.lastName ?? vault.owner.persona?.apellido ?? '',
            },
          }
        : vault.propietario ?? null,
    }));
      const meta = normalized.meta;

    return NextResponse.json({ data, meta });
  } catch (error) {
    return NextResponse.json({
      data: [
      { id: '1', numero: 'B001', capacidad: 4, tipo: 'Bóveda', estado: true, precio: 2500, precioArrendamiento: 800, bloque: { nombre: 'Bloque A', cementerio: { nombre: 'Cementerio Central' } }, propietario: { persona: { nombre: 'Juan', apellido: 'Pérez' } } },
      { id: '2', numero: 'B002', capacidad: 6, tipo: 'Bóveda', estado: true, precio: 3000, precioArrendamiento: 1000, bloque: { nombre: 'Bloque A', cementerio: { nombre: 'Cementerio Central' } }, propietario: null },
      { id: '3', numero: 'B003', capacidad: 2, tipo: 'Nicho', estado: false, precio: 1500, precioArrendamiento: 500, bloque: { nombre: 'Bloque B', cementerio: { nombre: 'Cementerio Central' } }, propietario: { persona: { nombre: 'María', apellido: 'García' } } },
      { id: '4', numero: 'N001', capacidad: 1, tipo: 'Nicho', estado: true, precio: 1200, precioArrendamiento: 400, bloque: { nombre: 'Bloque C', cementerio: { nombre: 'Cementerio Central' } }, propietario: null },
      { id: '5', numero: 'N002', capacidad: 1, tipo: 'Nicho', estado: true, precio: 1200, precioArrendamiento: 400, bloque: { nombre: 'Bloque C', cementerio: { nombre: 'Cementerio Central' } }, propietario: null },
      ],
      meta: { page: 1, limit: 20, total: 5, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetchWithTimeout(`${API_URL}/vaults`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization') as string } : {}),
      },
      body: JSON.stringify({
        number: body.number ?? body.numero,
        capacity: body.capacity ?? body.capacidad,
        type: body.type ?? body.tipo,
        isActive: body.isActive ?? body.estado,
        notes: body.notes ?? body.observaciones,
        location: body.location ?? body.ubicacion,
        price: body.price ?? body.precio,
        rentalPrice: body.rentalPrice ?? body.precioArrendamiento,
        blockId: body.blockId ?? body.bloqueId,
        floorId: body.floorId,
        ownerId: body.ownerId,
      }),
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.message || payload?.error?.message || 'No se pudo crear la bóveda';
      return NextResponse.json({ message }, { status: response.status });
    }

    const normalized = unwrapApiResponse<any>(payload).data ?? payload;
    return NextResponse.json({
      id: String(normalized.id),
      numero: normalized.number ?? normalized.numero ?? '',
      capacidad: normalized.capacity ?? normalized.capacidad ?? 1,
      tipo: normalizeVaultType(normalized.type ?? normalized.tipo),
      estado: normalized.isActive ?? normalized.estado ?? true,
      precio: normalized.price ?? normalized.precio ?? 0,
      precioArrendamiento: normalized.rentalPrice ?? normalized.precioArrendamiento ?? 0,
      ubicacion: normalized.location ?? normalized.ubicacion ?? '',
      observaciones: normalized.notes ?? normalized.observaciones ?? '',
      bloqueId: normalized.blockId ?? normalized.bloqueId ?? '',
    });
  } catch (error) {
    return NextResponse.json({ message: 'No se pudo crear la bóveda' }, { status: 500 });
  }
}
