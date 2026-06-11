'use client';

import { useEffect, useState } from 'react';
import { reportesApi } from '@/lib/api';
import { Card, PageHeader, Spinner } from '@/components/ui';

interface ComparativaData {
  anios: { actual: number; anterior: number };
  items: { mes: string; anioAnterior: number; anioActual: number }[];
  totales: {
    anioAnterior: number;
    anioActual: number;
    variacionPct: number | null;
  };
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(v || 0));
}

export default function ComparativaMensualPage() {
  const [data, setData] = useState<ComparativaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    reportesApi
      .comparativa()
      .then((r) => setData(r as ComparativaData))
      .catch((err: any) => setError(err.message || 'No se pudo cargar'))
      .finally(() => setLoading(false));
  }, []);

  const maxValor = data
    ? Math.max(
        1,
        ...data.items.flatMap((i) => [i.anioActual, i.anioAnterior]),
      )
    : 1;

  return (
    <div className="py-6 space-y-5">
      <PageHeader
        title="Comparativa mensual"
        subtitle="Ingresos mes-a-mes último año vs. año anterior."
        backHref="/reportes"
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
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card padding="sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total {data.anios.anterior}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-600">
                {formatCurrency(data.totales.anioAnterior)}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total {data.anios.actual}
              </p>
              <p className="mt-1 text-2xl font-bold text-primary-600">
                {formatCurrency(data.totales.anioActual)}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Variación</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  data.totales.variacionPct == null
                    ? 'text-slate-400'
                    : data.totales.variacionPct >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {data.totales.variacionPct == null
                  ? '—'
                  : `${data.totales.variacionPct >= 0 ? '+' : ''}${data.totales.variacionPct}%`}
              </p>
            </Card>
          </section>

          <Card padding="none">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Por mes · {data.anios.anterior} vs {data.anios.actual}
              </h2>
            </header>
            <div className="space-y-3 p-5">
              {data.items.map((m) => (
                <div key={m.mes} className="grid grid-cols-[40px_1fr] items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500">{m.mes}</span>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-slate-400"
                          style={{ width: `${(m.anioAnterior / maxValor) * 100}%` }}
                        />
                      </div>
                      <span className="w-32 shrink-0 text-right text-xs text-slate-500">
                        {formatCurrency(m.anioAnterior)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-primary-500"
                          style={{ width: `${(m.anioActual / maxValor) * 100}%` }}
                        />
                      </div>
                      <span className="w-32 shrink-0 text-right text-xs font-medium text-primary-700">
                        {formatCurrency(m.anioActual)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-slate-400" />
                  {data.anios.anterior}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-primary-500" />
                  {data.anios.actual}
                </span>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
