import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../_utils';
import { authHeaders } from '@/lib/auth';

function extractList<T>(payload: any): T[] {
  const unwrapped = unwrapApiResponse<any>(payload).data;
  if (Array.isArray(unwrapped)) return unwrapped as T[];
  if (Array.isArray(unwrapped?.items)) return unwrapped.items as T[];
  if (Array.isArray(unwrapped?.data)) return unwrapped.data as T[];
  if (Array.isArray(payload?.items)) return payload.items as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
}

export async function GET() {
  try {
    const headers = await authHeaders();
    const [contratosRes, bovedasRes, difuntosRes, pagosRes] = await Promise.allSettled([
      fetchWithTimeout(`${API_URL}/contratos?limit=100`, { headers, cache: 'no-store' }),
      fetchWithTimeout(`${API_URL}/bovedas?limit=100`, { headers, cache: 'no-store' }),
      fetchWithTimeout(`${API_URL}/difuntos?limit=100`, { headers, cache: 'no-store' }),
      fetchWithTimeout(`${API_URL}/pagos`, { headers, cache: 'no-store' }),
    ]);

    let contratos: any[] = [];
    let bovedas: any[] = [];
    let difuntos: any[] = [];
    let pagos: any[] = [];

    if (contratosRes.status === 'fulfilled' && contratosRes.value.ok) {
      const payload = await contratosRes.value.json();
      contratos = extractList<any>(payload);
    }

    if (bovedasRes.status === 'fulfilled' && bovedasRes.value.ok) {
      const payload = await bovedasRes.value.json();
      bovedas = extractList<any>(payload);
    }

    if (difuntosRes.status === 'fulfilled' && difuntosRes.value.ok) {
      const payload = await difuntosRes.value.json();
      difuntos = extractList<any>(payload);
    }

    if (pagosRes.status === 'fulfilled' && pagosRes.value.ok) {
      const payload = await pagosRes.value.json();
      pagos = extractList<any>(payload);
    }

    const contratosActivosRows = contratos.filter((c: any) => c.estado);
    const activeBovedaIds = new Set(contratosActivosRows.map((c: any) => c.bovedaId).filter(Boolean));

    const bovedasTipoBoveda = bovedas.filter((b: any) => (b.tipo || 'Boveda') !== 'Nicho');
    const bovedasTipoNicho = bovedas.filter((b: any) => b.tipo === 'Nicho');

    const bovedasDisponibles = bovedasTipoBoveda.filter((b: any) => !activeBovedaIds.has(b.id)).length;
    const bovedasOcupadas = bovedasTipoBoveda.filter((b: any) => activeBovedaIds.has(b.id)).length;
    const nichosDisponibles = bovedasTipoNicho.filter((b: any) => !activeBovedaIds.has(b.id)).length;
    const nichosOcupados = bovedasTipoNicho.filter((b: any) => activeBovedaIds.has(b.id)).length;

    const now = new Date();
    const treintaDias = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);

    const contratosActivos = contratos.filter((c: any) =>
      c.estado && c.fechaFin && new Date(c.fechaFin) > now
    ).length;

    const contratosPorVencer = contratos.filter((c: any) =>
      c.estado && c.fechaFin && new Date(c.fechaFin) > now && new Date(c.fechaFin) <= treintaDias
    ).length;

    const contratosVencidos = contratos.filter((c: any) =>
      c.estado && c.fechaFin && new Date(c.fechaFin) <= now
    ).length;

    const currentYear = now.getFullYear();
    const ingresosTotales = pagos.reduce((sum: number, p: any) => {
      const fechaPago = p.fechaPago ? new Date(p.fechaPago) : null;
      if (!fechaPago || Number.isNaN(fechaPago.getTime())) return sum;
      if (fechaPago.getFullYear() !== currentYear) return sum;
      return sum + Number(p.monto || 0);
    }, 0);

    const ultimosContratos = [...contratos]
      .sort(
        (a, b) =>
          new Date(b.fechaCreacion || b.fechaInicio || 0).getTime() -
          new Date(a.fechaCreacion || a.fechaInicio || 0).getTime(),
      )
      .slice(0, 5)
      .map((contrato: any) => ({
        id: contrato.id,
        numeroSecuencial: contrato.numeroSecuencial,
        fechaFin: contrato.fechaFin,
        montoTotal: Number(contrato.montoTotal || 0),
        estadoContrato:
          contrato.estado && contrato.fechaFin && new Date(contrato.fechaFin) <= now
            ? 'Vencido'
            : contrato.estado && contrato.fechaFin && new Date(contrato.fechaFin) <= treintaDias
              ? 'Próximo a vencer'
              : 'Activo',
      }));

    const transaccionesRecientes = [...pagos]
      .sort(
        (a, b) =>
          new Date(b.fechaPago || 0).getTime() - new Date(a.fechaPago || 0).getTime(),
      )
      .slice(0, 8)
      .map((pago: any) => ({
        id: pago.id,
        numeroRecibo: pago.numeroRecibo,
        fechaPago: pago.fechaPago,
        monto: Number(pago.monto || 0),
        nombrePersona:
          pago.cuotas?.[0]?.cuota?.contrato?.difunto
            ? `${pago.cuotas[0].cuota.contrato.difunto.nombre} ${pago.cuotas[0].cuota.contrato.difunto.apellido}`
            : 'Sin referencia',
      }));

    return NextResponse.json({
      numeroDifuntos: difuntos.length,
      ingresosTotales,
      bovedasDisponibles,
      bovedasOcupadas,
      nichosDisponibles,
      nichosOcupados,
      contratosActivos,
      contratosPorVencer,
      contratosVencidos,
      ultimosContratos,
      transaccionesRecientes,
    });
  } catch {
    return NextResponse.json({
      numeroDifuntos: 0,
      ingresosTotales: 0,
      bovedasDisponibles: 0,
      bovedasOcupadas: 0,
      nichosDisponibles: 0,
      nichosOcupados: 0,
      contratosActivos: 0,
      contratosPorVencer: 0,
      contratosVencidos: 0,
      ultimosContratos: [],
      transaccionesRecientes: [],
    });
  }
}
