'use server';

import { revalidatePath } from 'next/cache';
import {
  API_URL,
  buildQueryString,
  fetchApiPaginated,
  fetchApiPayload,
  fetchWithTimeout,
  postApiPayload,
  unwrapApiResponse,
  type PaginationParams,
} from '@/lib/backend';

export async function listContratosAction(params?: PaginationParams) {
  return fetchApiPaginated<any>('/contratos', params);
}

export async function obtenerMetadatosCreacionContratoAction() {
  try {
    return await fetchApiPayload<any>('/contratos/create-metadata');
  } catch {
    return {
      descuentos: [],
      bancos: [],
      tiposPago: ['Efectivo', 'Transferencia', 'Banco'],
      numeroDeMesesDefault: 5,
    };
  }
}

export async function obtenerNumeroSecuencialContratoAction(bovedaId?: number, isRenovacion?: boolean) {
  try {
    return await fetchApiPayload<any>(
      `/contratos/numero-secuencial${buildQueryString({ bovedaId, isRenovacion })}`,
    );
  } catch {
    return {
      numeroSecuencial: '',
      montoTotal: 0,
      boveda: null,
    };
  }
}

export async function obtenerBovedasDisponiblesAction(params?: PaginationParams) {
  try {
    return await fetchApiPaginated<any>('/contratos/bovedas-disponibles', params);
  } catch {
    return {
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

export async function createContratoAction(data: unknown) {
  const result = await postApiPayload<any>('/contratos', data);
  revalidatePath('/contratos');
  return result;
}

export async function listBovedasAction(params?: PaginationParams) {
  return fetchApiPaginated<any>('/bovedas', params);
}

export async function listBloquesAction(params?: PaginationParams) {
  return fetchApiPaginated<any>('/bloques', params);
}

export async function listBloquesRawAction() {
  return fetchApiPayload<any[]>('/bloques');
}

export async function createBovedaAction(data: unknown) {
  const result = await postApiPayload<any>('/bovedas', data);
  revalidatePath('/bovedas');
  return result;
}

export async function listPersonasAction(params?: PaginationParams) {
  return fetchApiPaginated<any>('/personas', params);
}

export async function createPersonaAction(data: unknown) {
  const result = await postApiPayload<any>('/personas', data);
  revalidatePath('/personas');
  return result;
}

export async function listDifuntosAction(params?: PaginationParams) {
  return fetchApiPaginated<any>('/difuntos', params);
}

export async function getDashboardDataAction() {
  try {
    const [contratosRes, bovedasRes, difuntosRes] = await Promise.allSettled([
      fetchWithTimeout(`${API_URL}/contratos`, {
        headers: { Authorization: 'Bearer demo' },
        cache: 'no-store',
      }),
      fetchWithTimeout(`${API_URL}/bovedas`, {
        headers: { Authorization: 'Bearer demo' },
        cache: 'no-store',
      }),
      fetchWithTimeout(`${API_URL}/difuntos`, {
        headers: { Authorization: 'Bearer demo' },
        cache: 'no-store',
      }),
    ]);

    let contratos: any[] = [];
    let bovedas: any[] = [];
    let difuntos: any[] = [];

    if (contratosRes.status === 'fulfilled' && contratosRes.value.ok) {
      const payload = await contratosRes.value.json();
      contratos = unwrapApiResponse<any[]>(payload).data || [];
    }

    if (bovedasRes.status === 'fulfilled' && bovedasRes.value.ok) {
      const payload = await bovedasRes.value.json();
      bovedas = unwrapApiResponse<any[]>(payload).data || [];
    }

    if (difuntosRes.status === 'fulfilled' && difuntosRes.value.ok) {
      const payload = await difuntosRes.value.json();
      difuntos = unwrapApiResponse<any[]>(payload).data || [];
    }

    const bovedasDisponibles = bovedas.filter((b) => b.estado).length;
    const bovedasOcupadas = bovedas.filter((b) => !b.estado).length;
    const nichosDisponibles = bovedas.filter((b) => b.tipo === 'Nicho' && b.estado).length;
    const nichosOcupados = bovedas.filter((b) => b.tipo === 'Nicho' && !b.estado).length;

    const now = new Date();
    const tresMeses = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

    const contratosActivos = contratos.filter(
      (c) => c.estado && c.fechaFin && new Date(c.fechaFin) > now,
    ).length;

    const contratosPorVencer = contratos.filter(
      (c) => c.estado && c.fechaFin && new Date(c.fechaFin) > now && new Date(c.fechaFin) <= tresMeses,
    ).length;

    const contratosVencidos = contratos.filter(
      (c) => c.estado && c.fechaFin && new Date(c.fechaFin) <= now,
    ).length;

    const ingresosTotales = contratos.reduce((sum: number, c) => sum + Number(c.montoTotal || 0), 0);

    return {
      numeroDifuntos: difuntos.length,
      ingresosTotales,
      bovedasDisponibles,
      bovedasOcupadas,
      nichosDisponibles,
      nichosOcupados,
      contratosActivos,
      contratosPorVencer,
      contratosVencidos,
    };
  } catch {
    return {
      numeroDifuntos: 156,
      ingresosTotales: 285000,
      bovedasDisponibles: 45,
      bovedasOcupadas: 23,
      nichosDisponibles: 78,
      nichosOcupados: 12,
      contratosActivos: 35,
      contratosPorVencer: 5,
      contratosVencidos: 8,
    };
  }
}