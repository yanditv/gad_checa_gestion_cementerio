'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { reportesApi } from '@/lib/api';

function formatCurrency(v: number | string | null | undefined) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(v ?? 0));
}

function formatDate(v?: string | Date | null) {
  if (!v) return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-EC');
}

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

interface IngresoItem {
  id: number;
  fechaPago: string;
  numeroRecibo: string;
  metodoPago: string;
  banco: string | null;
  monto: number;
  contrato: { numeroSecuencial: string; tipoIngreso: string } | null;
  difunto: string | null;
  responsable: string | null;
  boveda: string | null;
  bloque: string | null;
}

interface IngresoData {
  items: IngresoItem[];
  totales: {
    general: number;
    cantidad: number;
    porMetodo: { metodo: string; total: number; cantidad: number }[];
  };
}

export default function ReporteIngresosPage() {
  return (
    <Suspense fallback={null}>
      <ReporteIngresosInner />
    </Suspense>
  );
}

function ReporteIngresosInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [desde, setDesde] = useState(searchParams.get('desde') ?? firstOfMonth());
  const [hasta, setHasta] = useState(searchParams.get('hasta') ?? today());
  const [data, setData] = useState<IngresoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (d: string, h: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await reportesApi.ingresos({ desde: d, hasta: h });
      setData(res as IngresoData);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(desde, hasta);
  }, []);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    sp.set('desde', desde);
    sp.set('hasta', hasta);
    router.replace(`/reportes/ingresos?${sp.toString()}`);
    load(desde, hasta);
  };

  const exportUrl = (kind: 'pdf' | 'excel') =>
    `/api/reportes/ingresos/${kind}?desde=${desde}&hasta=${hasta}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reporte de ingresos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Detalle de pagos recibidos en un rango de fechas.
          </p>
        </div>
        <Link
          href="/reportes"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

      <form
        onSubmit={applyFilters}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Desde
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Hasta
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-filter" /> Aplicar
          </button>
          <a
            href={exportUrl('pdf')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <i className="ti ti-file-text" /> PDF
          </a>
          <a
            href={exportUrl('excel')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
          >
            <i className="ti ti-table" /> Excel
          </a>
        </div>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[20vh] items-center justify-center text-slate-400">
          <svg className="h-6 w-6 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      ) : data ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total ingresos</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {formatCurrency(data.totales.general)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wide text-slate-400">Cantidad de pagos</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{data.totales.cantidad}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wide text-slate-400">Promedio por pago</p>
              <p className="mt-1 text-2xl font-bold text-primary-600">
                {formatCurrency(
                  data.totales.cantidad > 0
                    ? data.totales.general / data.totales.cantidad
                    : 0,
                )}
              </p>
            </div>
          </section>

          {data.totales.porMetodo.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <header className="border-b border-slate-100 px-5 py-3">
                <h2 className="text-sm font-semibold text-slate-700">Por método de pago</h2>
              </header>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                {data.totales.porMetodo.map((m) => (
                  <div key={m.metodo} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{m.metodo}</p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {formatCurrency(m.total)}
                    </p>
                    <p className="text-xs text-slate-400">{m.cantidad} pago(s)</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Pagos · {data.totales.cantidad}
              </h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2.5">Fecha</th>
                    <th className="px-5 py-2.5">Recibo</th>
                    <th className="px-5 py-2.5">Método</th>
                    <th className="px-5 py-2.5">Contrato</th>
                    <th className="px-5 py-2.5">Bóveda</th>
                    <th className="px-5 py-2.5">Pagado por</th>
                    <th className="px-5 py-2.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                        No hay ingresos en el rango seleccionado.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((i) => (
                      <tr key={i.id}>
                        <td className="px-5 py-2.5 text-slate-600">{formatDate(i.fechaPago)}</td>
                        <td className="px-5 py-2.5 font-mono text-xs font-semibold text-slate-700">
                          {i.numeroRecibo}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
                            {i.metodoPago}
                          </span>
                          {i.banco && (
                            <span className="ml-1 text-xs text-slate-500">· {i.banco}</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-500">
                          {i.contrato?.numeroSecuencial ?? '—'}
                          {i.contrato?.tipoIngreso && (
                            <span className="ml-1 text-[10px] uppercase tracking-wide text-slate-400">
                              · {i.contrato.tipoIngreso}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-500">
                          {i.bloque && i.boveda
                            ? `${i.bloque} · ${i.boveda}`
                            : i.boveda || '—'}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-500">
                          {i.responsable ?? '—'}
                        </td>
                        <td className="px-5 py-2.5 text-right font-medium text-slate-700">
                          {formatCurrency(i.monto)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data.items.length > 0 && (
                  <tfoot className="bg-slate-50">
                    <tr className="text-sm font-bold text-slate-700">
                      <td colSpan={6} className="px-5 py-2.5 text-right">
                        Total
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {formatCurrency(data.totales.general)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
