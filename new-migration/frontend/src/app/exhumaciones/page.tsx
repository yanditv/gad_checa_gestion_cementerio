'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  exhumacionesApi,
  MOTIVOS_EXHUMACION,
  MOTIVO_EXHUMACION_LABEL,
  type ExhumacionResponse,
  type MotivoExhumacion,
  type PaginationMeta,
} from '@/lib/api';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-EC');
}

export default function ExhumacionesPage() {
  const [rows, setRows] = useState<ExhumacionResponse[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const [page, setPage] = useState(1);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [motivo, setMotivo] = useState<MotivoExhumacion | ''>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await exhumacionesApi.findPage({
          page,
          limit: 15,
          desde: desde || undefined,
          hasta: hasta || undefined,
          motivo: motivo || undefined,
        });
        if (cancelled) return;
        setRows(result.data ?? []);
        setMeta(result.meta);
      } catch (err: any) {
        if (!cancelled)
          setError(err.message || 'No se pudieron cargar las exhumaciones');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, desde, hasta, motivo]);

  const clearFilters = () => {
    setPage(1);
    setDesde('');
    setHasta('');
    setMotivo('');
  };

  const handleDescargarActa = async (exh: ExhumacionResponse) => {
    try {
      const { blob, filename } = await exhumacionesApi.actaPdf(exh.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? `acta-exhumacion-${exh.numeroActa}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      setError(err.message || 'No se pudo descargar el acta');
    }
  };

  const handleExport = async (formato: 'pdf' | 'excel' | 'csv') => {
    setDownloading(true);
    setError('');
    try {
      const { blob, filename } = await exhumacionesApi.descargarHistorial(
        formato,
        {
          desde: desde || undefined,
          hasta: hasta || undefined,
          motivo: motivo || undefined,
        },
      );
      const ext = formato === 'excel' ? 'xlsx' : formato;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? `historial-exhumaciones.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      setError(err.message || 'No se pudo exportar el historial');
    } finally {
      setDownloading(false);
    }
  };

  const visiblePages = (() => {
    if (!meta) return [];
    const start = Math.max(1, meta.page - 2);
    const end = Math.min(meta.totalPages, meta.page + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exhumaciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            Historial de exhumaciones y traslados registrados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <i className="ti ti-file-type-pdf" /> PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport('excel')}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <i className="ti ti-file-type-xls" /> Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <i className="ti ti-file-type-csv" /> CSV
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Desde
              </label>
              <input
                type="date"
                value={desde}
                onChange={(e) => {
                  setPage(1);
                  setDesde(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Hasta
              </label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => {
                  setPage(1);
                  setHasta(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Motivo
              </label>
              <select
                value={motivo}
                onChange={(e) => {
                  setPage(1);
                  setMotivo(e.target.value as MotivoExhumacion | '');
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Todos</option>
                {MOTIVOS_EXHUMACION.map((m) => (
                  <option key={m} value={m}>
                    {MOTIVO_EXHUMACION_LABEL[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-1.5 self-end rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-x" /> Limpiar
          </button>
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3">Acta</th>
                <th scope="col" className="px-4 py-3">Fecha</th>
                <th scope="col" className="px-4 py-3">Difunto</th>
                <th scope="col" className="px-4 py-3">Motivo</th>
                <th scope="col" className="px-4 py-3">Destino</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin text-primary-500"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Cargando exhumaciones…
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <i className="ti ti-folder-x text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">
                      No hay exhumaciones registradas.
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {row.numeroActa}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(row.fechaExhumacion)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.difunto ? (
                        <Link
                          href={`/difuntos/${row.difuntoId}`}
                          className="font-medium text-primary-600 hover:underline"
                        >
                          {row.difunto.nombre} {row.difunto.apellido}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {MOTIVO_EXHUMACION_LABEL[row.motivo] ?? row.motivo}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.destino}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          row.estado
                            ? 'bg-amber-50 text-amber-700 ring-amber-200'
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                      >
                        {row.estado ? 'Registrada' : 'Anulada'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDescargarActa(row)}
                        className="inline-flex items-center gap-1 rounded-md p-1.5 text-xs font-medium text-primary-600 hover:bg-slate-100"
                        title="Descargar acta"
                      >
                        <i className="ti ti-download" /> Acta
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
            <p className="text-xs text-slate-500">
              Página <strong className="text-slate-700">{meta.page}</strong> de{' '}
              <strong className="text-slate-700">{meta.totalPages}</strong>
              <span className="mx-1.5 text-slate-300">·</span>
              <strong className="text-slate-700">{meta.total}</strong>{' '}
              exhumación{meta.total === 1 ? '' : 'es'}
            </p>
            <nav className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(meta.page - 1)}
                disabled={!meta.hasPrevPage}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="ti ti-chevron-left" /> Anterior
              </button>
              {visiblePages.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    p === meta.page
                      ? 'bg-primary-500 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(meta.page + 1)}
                disabled={!meta.hasNextPage}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente <i className="ti ti-chevron-right" />
              </button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
}
