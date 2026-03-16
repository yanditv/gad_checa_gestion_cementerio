import { API_URL, unwrapApiResponse } from '@/app/api/_utils';

export async function getContratoById(id: string | number) {
  const response = await fetch(`${API_URL}/contratos/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el contrato ${id}`);
  }

  const payload = await response.json();
  return unwrapApiResponse<any>(payload).data;
}

export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function getContratoEstado(contrato: any) {
  if (!contrato?.estado) return 'Inactivo';
  if (!contrato.fechaFin) return 'Activo';
  return new Date(contrato.fechaFin) >= new Date() ? 'Activo' : 'Vencido';
}
