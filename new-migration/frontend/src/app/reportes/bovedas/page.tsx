'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { reportesApi } from '@/lib/api';

interface BovedaItem {
  bovedaId: number;
  numero: string;
  tipo: string;
  bloque: string | null;
  piso: number | null;
  cementerio: string | null;
  estado: 'disponible' | 'ocupada' | 'por_caducar' | 'vencida';
  propietario: string | null;
  identificacionPropietario: string | null;
  difunto: string | null;
  responsable: string | null;
  telefonoResponsable: string | null;
  contrato: {
    numeroSecuencial: string;
    fechaInicio: string;
    fechaFin: string | null;
  } | null;
}

interface BovedaData {
  items: BovedaItem[];
  filtros: { tipos: string[]; bloques: string[] };
  totales: Record<string, number>;
}

const ESTADO_LABELS: Record<string, { label: string; cls: string }> = {
  disponible: {
    label: 'Disponible',
    cls: 'bg-green-50 text-green-700 ring-green-200',
  },
  ocupada: {
    label: 'Ocupada',
    cls: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  por_caducar: {
    label: 'Por caducar',
    cls: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  vencida: {
    label: 'Vencida',
    cls: 'bg-red-50 text-red-700 ring-red-200',
  },
};

function formatDate(v?: string | Date | null) {
  if (!v) return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-EC');
}

export default function ReporteBovedasPage() {
  return (
    <Suspense fallback={null}>
      <ReporteBovedasInner />
    </Suspense>
  );
}

function ReporteBovedasInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tipo, setTipo] = useState(searchParams.get('tipo') ?? '');
  const [bloque, setBloque] = useState(searchParams.get('bloque') ?? '');
  const [estado, setEstado] = useState(searchParams.get('estado') ?? '');
  const [data, setData] = useState<BovedaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (t: string, b: string, e: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await reportesApi.bovedas({
        tipo: t || undefined,
        bloque: b || undefined,
        estado: e || undefined,
      });
      setData(res as BovedaData);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tipo, bloque, estado);
  }, []);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (tipo) sp.set('tipo', tipo);
    if (bloque) sp.set('bloque', bloque);
    if (estado) sp.set('estado', estado);
    router.replace(`/reportes/bovedas${sp.size ? `?${sp.toString()}` : ''}`);
    load(tipo, bloque, estado);
  };

  const reset = () => {
    setTipo('');
    setBloque('');
    setEstado('');
    router.replace('/reportes/bovedas');
    load('', '', '');
  };

  const params = new URLSearchParams();
  if (tipo) params.set('tipo', tipo);
  if (bloque) params.set('bloque', bloque);
  if (estado) params.set('estado', estado);
  const exportUrl = (kind: 'pdf' | 'excel') =>
    `/api/reportes/bovedas/${kind}${params.size ? `?${params.toString()}` : ''}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reporte de bóvedas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Inventario filtrado con estado, propietario y contrato vigente.
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
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-4"
      >
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tipo
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos</option>
            {(data?.filtros.tipos ?? []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bloque
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            value={bloque}
            onChange={(e) => setBloque(e.target.value)}
          >
            <option value="">Todos</option>
            {(data?.filtros.bloques ?? []).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="ocupada">Ocupada</option>
            <option value="por_caducar">Por caducar</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-filter" /> Aplicar
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-eraser" /> Limpiar
          </button>
          <a
            href={exportUrl('pdf')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            PDF
          </a>
          <a
            href={exportUrl('excel')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
          >
            Excel
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
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              ['Total', data.totales.total, 'text-slate-900'],
              ['Disponibles', data.totales.disponible ?? 0, 'text-green-600'],
              ['Ocupadas', data.totales.ocupada ?? 0, 'text-blue-600'],
              ['Por caducar', data.totales.por_caducar ?? 0, 'text-amber-600'],
              ['Vencidas', data.totales.vencida ?? 0, 'text-red-600'],
            ].map(([label, value, cls]) => (
              <div
                key={label as string}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"
              >
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${cls}`}>{value as number}</p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Bóvedas · {data.items.length}
              </h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2.5">Bóveda</th>
                    <th className="px-5 py-2.5">Tipo</th>
                    <th className="px-5 py-2.5">Bloque / Piso</th>
                    <th className="px-5 py-2.5">Estado</th>
                    <th className="px-5 py-2.5">Propietario</th>
                    <th className="px-5 py-2.5">Difunto</th>
                    <th className="px-5 py-2.5">Contrato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                        Sin resultados.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((b) => {
                      const est = ESTADO_LABELS[b.estado] ?? ESTADO_LABELS.disponible;
                      return (
                        <tr key={b.bovedaId}>
                          <td className="px-5 py-2.5">
                            <Link
                              href={`/bovedas/${b.bovedaId}`}
                              className="font-mono text-xs font-semibold text-primary-600 hover:underline"
                            >
                              {b.numero}
                            </Link>
                          </td>
                          <td className="px-5 py-2.5 text-xs text-slate-500">{b.tipo}</td>
                          <td className="px-5 py-2.5 text-xs text-slate-500">
                            {b.bloque ?? '—'}
                            {b.piso != null ? ` · piso ${b.piso}` : ''}
                          </td>
                          <td className="px-5 py-2.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${est.cls}`}
                            >
                              {est.label}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-xs text-slate-500">
                            {b.propietario ?? '—'}
                            {b.identificacionPropietario && (
                              <p className="text-[10px] text-slate-400">
                                {b.identificacionPropietario}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-2.5 text-xs text-slate-500">
                            {b.difunto ?? '—'}
                          </td>
                          <td className="px-5 py-2.5 text-xs text-slate-500">
                            {b.contrato ? (
                              <>
                                <span className="font-mono font-semibold text-slate-700">
                                  {b.contrato.numeroSecuencial}
                                </span>
                                <p className="text-[10px] text-slate-400">
                                  {formatDate(b.contrato.fechaInicio)} →{' '}
                                  {formatDate(b.contrato.fechaFin)}
                                </p>
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
