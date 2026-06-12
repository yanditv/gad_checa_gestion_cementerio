'use client';

import { useEffect, useState } from 'react';
import { FileText, Table } from 'lucide-react';
import { reportesApi } from '@/lib/api';
import { Card, PageHeader, Spinner } from '@/components/ui';

interface BloqueItem {
  bloqueId: number;
  nombre: string;
  descripcion: string | null;
  cementerio: string | null;
  total: number;
  ocupadas: number;
  disponibles: number;
  porCaducar: number;
  vencidas: number;
  porcentajeOcupacion: number;
  proximasLiberaciones: {
    boveda: string;
    contrato: string | null;
    fechaFin: string | null;
  }[];
}

interface BloqueData {
  items: BloqueItem[];
  totales: {
    total: number;
    ocupadas: number;
    disponibles: number;
    porCaducar: number;
    vencidas: number;
  };
}

function formatDate(v?: string | Date | null) {
  if (!v) return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-EC');
}

function colorOcupacion(p: number) {
  if (p >= 90) return 'bg-red-500';
  if (p >= 70) return 'bg-amber-500';
  if (p >= 40) return 'bg-blue-500';
  return 'bg-green-500';
}

export default function ReporteBloquesPage() {
  const [data, setData] = useState<BloqueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    reportesApi
      .bloques()
      .then((res) => setData(res as BloqueData))
      .catch((err: any) => setError(err.message || 'No se pudo cargar'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-6 space-y-5">
      <PageHeader
        title="Reporte por bloque"
        subtitle="Ocupación por bloque y próximas liberaciones (30 días)."
        backHref="/reportes"
        actions={
          <>
            <a
              href="/api/reportes/bloques/pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> PDF
            </a>
            <a
              href="/api/reportes/bloques/excel"
              className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
            >
              <Table className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Excel
            </a>
          </>
        }
      />

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
              ['Total bóvedas', data.totales.total, 'text-slate-900'],
              ['Disponibles', data.totales.disponibles, 'text-green-600'],
              ['Ocupadas', data.totales.ocupadas, 'text-blue-600'],
              ['Por caducar', data.totales.porCaducar, 'text-amber-600'],
              ['Vencidas', data.totales.vencidas, 'text-red-600'],
            ].map(([label, value, cls]) => (
              <Card key={label as string} padding="sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${cls}`}>{value as number}</p>
              </Card>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.items.map((bl) => (
              <Card key={bl.bloqueId} padding="none">
                <header className="border-b border-slate-100 px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700">{bl.nombre}</h3>
                      {bl.descripcion && (
                        <p className="text-xs text-slate-500">{bl.descripcion}</p>
                      )}
                      {bl.cementerio && (
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          {bl.cementerio}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Ocupación</p>
                      <p className="text-xl font-bold text-slate-900">
                        {bl.porcentajeOcupacion}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full ${colorOcupacion(bl.porcentajeOcupacion)}`}
                      style={{ width: `${Math.min(100, bl.porcentajeOcupacion)}%` }}
                    />
                  </div>
                </header>
                <div className="grid grid-cols-4 gap-2 p-4 text-center text-xs">
                  <div>
                    <p className="text-slate-400">Total</p>
                    <p className="font-semibold text-slate-700">{bl.total}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Disp.</p>
                    <p className="font-semibold text-green-600">{bl.disponibles}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Ocup.</p>
                    <p className="font-semibold text-blue-600">{bl.ocupadas}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Por venc.</p>
                    <p className="font-semibold text-amber-600">{bl.porCaducar}</p>
                  </div>
                </div>
                {bl.proximasLiberaciones.length > 0 && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Próximas liberaciones
                    </p>
                    <ul className="mt-2 divide-y divide-slate-100 text-xs">
                      {bl.proximasLiberaciones.map((p) => (
                        <li
                          key={`${bl.bloqueId}-${p.boveda}`}
                          className="flex items-center justify-between py-1.5"
                        >
                          <span className="text-slate-600">
                            <span className="font-mono font-semibold">{p.boveda}</span>
                            {p.contrato && (
                              <span className="ml-2 text-[10px] text-slate-400">
                                {p.contrato}
                              </span>
                            )}
                          </span>
                          <span className="text-slate-500">{formatDate(p.fechaFin)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}
