/**
 * Helpers compartidos entre los reportes:
 *   - resolución de rango de fechas (default = mes actual)
 *   - clasificación de estado de bóveda (disponible / ocupada / por_caducar / vencida)
 *   - cálculo de días de mora
 */

export interface DateRange {
  desde: Date;
  hasta: Date;
}

export function resolveRange(
  desde?: string | null,
  hasta?: string | null,
): DateRange {
  const now = new Date();
  let from = desde ? new Date(desde) : null;
  let to = hasta ? new Date(hasta) : null;

  if (!from || Number.isNaN(from.getTime())) {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (!to || Number.isNaN(to.getTime())) {
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // Normalizar el rango: inicio del día / fin del día
  from.setHours(0, 0, 0, 0);
  const adjustedTo = new Date(to);
  adjustedTo.setHours(23, 59, 59, 999);

  return { desde: from, hasta: adjustedTo };
}

export type EstadoBoveda =
  | 'disponible'
  | 'ocupada'
  | 'por_caducar'
  | 'vencida';

export function clasificarEstadoBoveda(
  contratoActivo: { fechaFin: Date | null } | null | undefined,
  hoy: Date = new Date(),
): EstadoBoveda {
  if (!contratoActivo) return 'disponible';
  if (!contratoActivo.fechaFin) return 'ocupada';

  const fin = new Date(contratoActivo.fechaFin);
  if (fin < hoy) return 'vencida';

  const limite30 = new Date(hoy);
  limite30.setDate(limite30.getDate() + 30);
  if (fin <= limite30) return 'por_caducar';

  return 'ocupada';
}

export function diasMora(fechaVencimiento: Date, hoy: Date = new Date()): number {
  const venc = new Date(fechaVencimiento);
  venc.setHours(0, 0, 0, 0);
  const ref = new Date(hoy);
  ref.setHours(0, 0, 0, 0);
  const diff = Math.floor((ref.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}
