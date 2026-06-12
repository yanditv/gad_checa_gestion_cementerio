import { formatCurrency, formatDate } from '@/lib/contratos-server';
import { buildIngresosRows, getReportesData, IngresoRow } from '@/lib/reportes-server';
import { PrintActions } from '@/app/contratos/[id]/print/PrintActions';

export default async function IngresosPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const { autoprint } = await searchParams;
  const reportes = await getReportesData();
  const rows = buildIngresosRows(reportes);
  const totalIngresos = rows.reduce((sum: number, row: IngresoRow) => sum + row.monto, 0);
  const promedio = rows.length ? totalIngresos / rows.length : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 print:p-0">
      <PrintActions backHref="/reportes" autoPrint={autoprint === '1'} />

      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-soft print:rounded-none print:border-0 print:p-0 print:shadow-none">
        {/* Cabecera */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.jpeg"
              alt="GAD Checa"
              className="h-[72px] w-[72px] rounded-lg object-cover"
            />
            <div>
              <div className="text-sm font-bold uppercase">Gobierno Autónomo Descentralizado</div>
              <div className="text-sm font-bold uppercase">Parroquial de Checa</div>
              <div className="mt-1 text-lg font-bold">REPORTE DE INGRESOS POR FECHA</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Fecha: {formatDate(new Date())}</div>
            <div>Hora: {new Date().toLocaleTimeString('es-EC')}</div>
            <div className="font-semibold text-slate-800">Total Registros: {rows.length}</div>
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-green-700">
              Total Ingresos
            </div>
            <div className="mt-0.5 text-xl font-bold text-green-700">
              {formatCurrency(totalIngresos)}
            </div>
          </div>
          <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Promedio por pago
            </div>
            <div className="mt-0.5 text-xl font-bold text-primary-700">
              {formatCurrency(promedio)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Total registros
            </div>
            <div className="mt-0.5 text-xl font-bold text-slate-800">{rows.length}</div>
          </div>
        </div>

        {/* Tabla */}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border border-slate-200 text-xs">
            <thead className="bg-primary-50 text-primary-700">
              <tr className="text-left">
                <th className="border border-slate-200 px-2 py-2 font-semibold uppercase tracking-wide">Fecha</th>
                <th className="border border-slate-200 px-2 py-2 font-semibold uppercase tracking-wide">Tipo pago</th>
                <th className="border border-slate-200 px-2 py-2 font-semibold uppercase tracking-wide">Bóveda</th>
                <th className="border border-slate-200 px-2 py-2 font-semibold uppercase tracking-wide">Pagado por</th>
                <th className="border border-slate-200 px-2 py-2 font-semibold uppercase tracking-wide">Contrato</th>
                <th className="border border-slate-200 px-2 py-2 font-semibold uppercase tracking-wide">Comprobante</th>
                <th className="border border-slate-200 px-2 py-2 text-right font-semibold uppercase tracking-wide">Monto</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="even:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-1.5">{formatDate(row.fechaPago)}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{row.tipoPago}</td>
                    <td className="border border-slate-200 px-2 py-1.5">
                      {row.bloque} / {row.boveda}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5">{row.pagadoPor}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{row.numeroContrato}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{row.numeroComprobante}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right">
                      {formatCurrency(row.monto)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="border border-slate-200 px-2 py-6 text-center text-slate-500">
                    No hay ingresos para mostrar en el reporte.
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 ? (
              <tfoot>
                <tr className="bg-primary-50 font-semibold text-primary-800">
                  <th colSpan={6} className="border border-slate-200 px-2 py-2 text-right">
                    TOTAL INGRESOS:
                  </th>
                  <th className="border border-slate-200 px-2 py-2 text-right">
                    {formatCurrency(totalIngresos)}
                  </th>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Generado por Sistema de Gestión de Cementerio · GAD Checa
        </div>
      </div>
    </div>
  );
}
