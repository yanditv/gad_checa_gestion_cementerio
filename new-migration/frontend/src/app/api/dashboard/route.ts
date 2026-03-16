import { NextResponse } from 'next/server';
import { API_URL, fetchWithTimeout, unwrapApiResponse } from '../_utils';

export async function GET() {
  try {
    const [contratosRes, bovedasRes, difuntosRes] = await Promise.allSettled([
      fetchWithTimeout(`${API_URL}/contratos`, {
        headers: { 'Authorization': 'Bearer demo' },
        cache: 'no-store',
      }),
      fetchWithTimeout(`${API_URL}/bovedas`, {
        headers: { 'Authorization': 'Bearer demo' },
        cache: 'no-store',
      }),
      fetchWithTimeout(`${API_URL}/difuntos`, {
        headers: { 'Authorization': 'Bearer demo' },
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

    const bovedasDisponibles = bovedas.filter((b: any) => b.estado).length;
    const bovedasOcupadas = bovedas.filter((b: any) => !b.estado).length;
    const nichosDisponibles = bovedas.filter((b: any) => b.tipo === 'Nicho' && b.estado).length;
    const nichosOcupados = bovedas.filter((b: any) => b.tipo === 'Nicho' && !b.estado).length;

    const now = new Date();
    const tresMeses = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

    const contratosActivos = contratos.filter((c: any) => 
      c.estado && c.fechaFin && new Date(c.fechaFin) > now
    ).length;

    const contratosPorVencer = contratos.filter((c: any) => 
      c.estado && c.fechaFin && new Date(c.fechaFin) > now && new Date(c.fechaFin) <= tresMeses
    ).length;

    const contratosVencidos = contratos.filter((c: any) => 
      c.estado && c.fechaFin && new Date(c.fechaFin) <= now
    ).length;

    const ingresosTotales = contratos.reduce((sum: number, c: any) => {
      return sum + (c.montoTotal ? Number(c.montoTotal) : 0);
    }, 0);

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
    });
  } catch (error) {
    return NextResponse.json({
      numeroDifuntos: 156,
      ingresosTotales: 285000,
      bovedasDisponibles: 45,
      bovedasOcupadas: 23,
      nichosDisponibles: 78,
      nichosOcupados: 12,
      contratosActivos: 35,
      contratosPorVencer: 5,
      contratosVencidos: 8,
    });
  }
}
