import { API_URL, unwrapApiResponse } from '@/lib/backend';

export interface IngresoRow {
  id: string;
  fechaPago: string;
  tipoPago: string;
  boveda: string;
  bloque: string;
  pagadoPor: string;
  numeroContrato: string;
  numeroComprobante: string;
  monto: number;
}

export interface CuentaPorCobrarRow {
  id: string;
  numeroContrato: string;
  responsable: string;
  telefono: string;
  difunto: string;
  ubicacion: string;
  fechaVencimiento: string;
  monto: number;
}

export async function getReportesData() {
  const response = await fetch(`${API_URL}/contratos/reportes`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('No se pudo cargar la informacion de reportes');
  }

  const payload = await response.json();
  return unwrapApiResponse<any>(payload).data;
}

export function buildIngresosRows(reportes: any): IngresoRow[] {
  const contratos = reportes?.contratos || [];

  return contratos.flatMap((contrato: any) =>
    (contrato.cuotas || [])
      .filter((cuota: any) => cuota.pagada)
      .map((cuota: any) => ({
        id: `${contrato.id}-${cuota.id}`,
        fechaPago: cuota.fechaPago || cuota.fechaVencimiento,
        tipoPago: cuota.pagos?.[0]?.pago?.metodoPago || 'N/A',
        boveda: contrato.boveda?.numero || 'N/A',
        bloque: contrato.boveda?.bloque?.nombre || 'N/A',
        pagadoPor:
          contrato.responsables?.[0]?.responsable?.persona
            ? `${contrato.responsables[0].responsable.persona.nombre} ${contrato.responsables[0].responsable.persona.apellido}`
            : 'N/A',
        numeroContrato: contrato.numeroSecuencial || 'N/A',
        numeroComprobante: cuota.pagos?.[0]?.pago?.numeroRecibo || cuota.pagos?.[0]?.pago?.referencia || 'N/A',
        monto: Number(cuota.monto || 0),
      })),
  );
}

export function buildCuentasPorCobrarRows(reportes: any): CuentaPorCobrarRow[] {
  const contratos = reportes?.contratos || [];

  return contratos.flatMap((contrato: any) =>
    (contrato.cuotas || [])
      .filter((cuota: any) => !cuota.pagada)
      .map((cuota: any) => {
        const persona = contrato.responsables?.[0]?.responsable?.persona;
        return {
          id: `${contrato.id}-${cuota.id}`,
          numeroContrato: contrato.numeroSecuencial || 'N/A',
          responsable: persona ? `${persona.nombre} ${persona.apellido}` : 'N/A',
          telefono: persona?.telefono || 'N/A',
          difunto: contrato.difunto ? `${contrato.difunto.nombre} ${contrato.difunto.apellido}` : 'N/A',
          ubicacion: `${contrato.boveda?.bloque?.nombre || 'N/A'} / ${contrato.boveda?.numero || 'N/A'}`,
          fechaVencimiento: cuota.fechaVencimiento,
          monto: Number(cuota.monto || 0),
        };
      }),
  );
}
