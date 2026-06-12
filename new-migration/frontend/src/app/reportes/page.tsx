'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { reportesApi } from '@/lib/api';

interface Resumen {
  rango: { desde: string; hasta: string };
  contratos: { total: number; activos: number; vencidos: number };
  ingresos: {
    rango: number;
    porMetodo: { metodo: string; total: number; cantidad: number }[];
  };
  bovedas: {
    total: number;
    bovedasOcupadas: number;
    nichosOcupados: number;
    porCaducar: number;
    vencidas: number;
  };
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(v || 0));
}

function formatNumber(v: number) {
  return new Intl.NumberFormat('es-EC').format(v);
}

const REPORTES = [
  {
    href: '/reportes/ingresos',
    title: 'Ingresos por fecha',
    description: 'Pagos recibidos agrupados por método.',
    icon: 'ti-cash',
    tone: 'bg-primary-50 text-primary-600 ring-primary-200',
  },
  {
    href: '/reportes/cuentas-por-cobrar',
    title: 'Cuentas por cobrar',
    description: 'Cuotas vencidas con días de mora y contacto.',
    icon: 'ti-receipt-tax',
    tone: 'bg-amber-50 text-amber-600 ring-amber-200',
  },
  {
    href: '/reportes/bovedas',
    title: 'Bóvedas',
    description: 'Inventario filtrado por tipo, bloque y estado.',
    icon: 'ti-grid-dots',
    tone: 'bg-blue-50 text-blue-600 ring-blue-200',
  },
  {
    href: '/reportes/bloques',
    title: 'Ocupación por bloque',
    description: 'Porcentaje de ocupación y próximas liberaciones.',
    icon: 'ti-stack-2',
    tone: 'bg-green-50 text-green-600 ring-green-200',
  },
  {
    href: '/reportes/comparativa',
    title: 'Comparativa mensual',
    description: 'Ingresos mes-a-mes último año vs anterior.',
    icon: 'ti-chart-line',
    tone: 'bg-purple-50 text-purple-600 ring-purple-200',
  },
];

export default function ReportesPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    reportesApi
      .resumen()
      .then((r) => setResumen(r as Resumen))
      .catch((err: any) => {
        setResumen(null);
        setError(err.message || 'No se pudo cargar el resumen de reportes');
      })
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    {
      label: 'Contratos activos',
      value: formatNumber(resumen?.contratos.activos ?? 0),
      tone: 'bg-green-50 text-green-600 ring-green-200',
      icon: 'ti-circle-check',
      valueClass: 'text-green-600',
    },
    {
      label: 'Contratos vencidos',
      value: formatNumber(resumen?.contratos.vencidos ?? 0),
      tone: 'bg-red-50 text-red-600 ring-red-200',
      icon: 'ti-alert-circle',
      valueClass: 'text-red-600',
    },
    {
      label: 'Bóvedas por caducar',
      value: formatNumber(resumen?.bovedas.porCaducar ?? 0),
      tone: 'bg-amber-50 text-amber-600 ring-amber-200',
      icon: 'ti-clock',
      valueClass: 'text-amber-600',
    },
    {
      label: 'Ingresos del mes',
      value: formatCurrency(resumen?.ingresos.rango ?? 0),
      tone: 'bg-primary-50 text-primary-600 ring-primary-200',
      icon: 'ti-currency-dollar',
      valueClass: 'text-primary-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="mt-1 text-sm text-slate-600">
            Resumen del sistema y acceso a los 5 reportes principales.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition-shadow hover:shadow-lifted"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-slate-600">{kpi.label}</p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    loading ? 'text-slate-300' : kpi.valueClass
                  }`}
                >
                  {loading ? '…' : kpi.value}
                </p>
              </div>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${kpi.tone}`}
              >
                <i className={`ti ${kpi.icon} text-xl`} />
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Ingresos por método</h2>
          </header>
          <div className="p-5">
            {loading ? (
              <div className="text-sm text-slate-600">Cargando resumen…</div>
            ) : resumen?.ingresos.porMetodo?.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {resumen.ingresos.porMetodo.map((metodo) => (
                  <div key={metodo.metodo} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-600">{metodo.metodo}</p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {formatCurrency(metodo.total)}
                    </p>
                    <p className="text-xs text-slate-600">{metodo.cantidad} pago(s)</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-600">No hay ingresos para resumir.</div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Estado del espacio funerario</h2>
          </header>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-600">Total</p>
              <p className="mt-1 text-lg font-bold text-slate-800">
                {formatNumber(resumen?.bovedas.total ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-600">Bóvedas ocupadas</p>
              <p className="mt-1 text-lg font-bold text-blue-700">
                {formatNumber(resumen?.bovedas.bovedasOcupadas ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3">
              <p className="text-xs uppercase tracking-wide text-purple-600">Nichos ocupados</p>
              <p className="mt-1 text-lg font-bold text-purple-700">
                {formatNumber(resumen?.bovedas.nichosOcupados ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs uppercase tracking-wide text-red-600">Vencidas</p>
              <p className="mt-1 text-lg font-bold text-red-700">
                {formatNumber(resumen?.bovedas.vencidas ?? 0)}
              </p>
            </div>
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTES.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition hover:border-primary-300 hover:shadow-lifted"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${r.tone}`}
            >
              <i className={`ti ${r.icon} text-xl`} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 group-hover:text-primary-600">
                {r.title}
              </h3>
              <p className="text-xs text-slate-500">{r.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
