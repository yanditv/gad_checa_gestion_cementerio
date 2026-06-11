'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eraser, Filter } from 'lucide-react';
import { reportesApi } from '@/lib/api';
import { Button, Card, PageHeader, Select, Spinner } from '@/components/ui';

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
    <div className="py-6 space-y-5">
      <PageHeader
        title="Reporte de bóvedas"
        subtitle="Inventario filtrado con estado, propietario y contrato vigente."
        backHref="/reportes"
      />

      <Card padding="none">
        <form
          onSubmit={applyFilters}
          className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-4"
        >
          <Select
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos</option>
            {(data?.filtros.tipos ?? []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            label="Bloque"
            value={bloque}
            onChange={(e) => setBloque(e.target.value)}
          >
            <option value="">Todos</option>
            {(data?.filtros.bloques ?? []).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="ocupada">Ocupada</option>
            <option value="por_caducar">Por caducar</option>
            <option value="vencida">Vencida</option>
          </Select>
          <div className="flex items-end gap-2">
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Filter className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            >
              Aplicar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={reset}
              leftIcon={<Eraser className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            >
              Limpiar
            </Button>
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
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <Spinner size="lg" className="text-primary-500" />
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
              <Card key={label as string} padding="sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${cls}`}>{value as number}</p>
              </Card>
            ))}
          </section>

          <Card padding="none">
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
          </Card>
        </>
      ) : null}
    </div>
  );
}
