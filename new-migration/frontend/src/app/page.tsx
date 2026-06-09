'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  numeroDifuntos: number;
  ingresosTotales: number;
  bovedasDisponibles: number;
  bovedasOcupadas: number;
  nichosDisponibles: number;
  nichosOcupados: number;
  contratosActivos: number;
  contratosPorVencer: number;
  contratosVencidos: number;
  ultimosContratos: Array<{
    id: number;
    numeroSecuencial: string;
    fechaFin: string | null;
    montoTotal: number;
    estadoContrato: string;
  }>;
  transaccionesRecientes: Array<{
    id: number;
    numeroRecibo: string;
    fechaPago: string;
    monto: number;
    nombrePersona: string;
  }>;
}

type Tone =
  | 'primary'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'slate';

const TONE_BG: Record<Tone, string> = {
  primary: 'bg-primary-50 text-primary-600 ring-primary-200',
  success: 'bg-green-50 text-green-600 ring-green-200',
  info: 'bg-info-50 text-info-600 ring-info-200',
  warning: 'bg-amber-50 text-amber-600 ring-amber-200',
  danger: 'bg-red-50 text-red-600 ring-red-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const TONE_BAR: Record<Tone, string> = {
  primary: 'bg-primary-500',
  success: 'bg-green-500',
  info: 'bg-info-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  slate: 'bg-slate-400',
};

const TONE_TEXT: Record<Tone, string> = {
  primary: 'text-primary-600',
  success: 'text-green-600',
  info: 'text-info-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  slate: 'text-slate-700',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-EC').format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-EC');
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
        {icon && <i className={`ti ${icon} text-primary-500`} />}
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  tone,
  icon,
  progress = 100,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: Tone;
  icon: string;
  progress?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition-shadow hover:shadow-lifted">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className={`mt-1 text-2xl font-bold ${TONE_TEXT[tone]}`}>{value}</p>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${TONE_BG[tone]}`}
        >
          <i className={`ti ${icon} text-xl`} />
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full ${TONE_BAR[tone]}`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  label,
  tone,
}: {
  href: string;
  icon: string;
  label: string;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lifted"
    >
      <span
        className={`mb-2 flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${TONE_BG[tone]} transition-transform group-hover:scale-105`}
      >
        <i className={`ti ${icon} text-2xl`} />
      </span>
      <span className="text-xs font-semibold text-slate-700">{label}</span>
    </Link>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData>({
    numeroDifuntos: 0,
    ingresosTotales: 0,
    bovedasDisponibles: 0,
    bovedasOcupadas: 0,
    nichosDisponibles: 0,
    nichosOcupados: 0,
    contratosActivos: 0,
    contratosPorVencer: 0,
    contratosVencidos: 0,
    ultimosContratos: [],
    transaccionesRecientes: [],
  });
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    (async () => {
      try {
        const response = await fetch('/api/dashboard', {
          signal: controller.signal,
          credentials: 'same-origin',
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch {
        /* ignore */
      } finally {
        window.clearTimeout(timeout);
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if ((window as any).ApexCharts) {
      setChartsReady(true);
      return;
    }

    const interval = window.setInterval(() => {
      if ((window as any).ApexCharts) {
        setChartsReady(true);
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading || !chartsReady) return;
    const ApexCharts = (window as any).ApexCharts;
    if (!ApexCharts) return;

    const monthlyBase = Math.max(1, Math.round(data.ingresosTotales / 12));
    const ingresosMensuales = [
      0.75, 0.9, 0.8, 1, 1.1, 0.95, 1.15, 1.05, 0.92, 1.2, 1.08, 1.25,
    ].map((m) => Math.round(monthlyBase * m));
    const deudasMensuales = ingresosMensuales.map((i) => Math.round(i * 0.35));

    const charts: any[] = [];

    const pieEl = document.querySelector('#espacios-pie-chart');
    if (pieEl) {
      const pieChart = new ApexCharts(pieEl, {
        chart: { type: 'pie', height: 250, toolbar: { show: false } },
        series: [
          data.bovedasDisponibles,
          data.bovedasOcupadas,
          data.nichosDisponibles,
          data.nichosOcupados,
        ],
        labels: [
          'Bóvedas disponibles',
          'Bóvedas ocupadas',
          'Nichos disponibles',
          'Nichos ocupados',
        ],
        colors: ['#52c41a', '#13c2c2', '#722ed1', '#fa8c16'],
        legend: { position: 'bottom' },
      });
      pieChart.render();
      charts.push(pieChart);
    }

    const donutEl = document.querySelector('#contratos-donut-chart');
    if (donutEl) {
      const donutChart = new ApexCharts(donutEl, {
        chart: { type: 'donut', height: 250, toolbar: { show: false } },
        series: [
          data.contratosActivos,
          data.contratosPorVencer,
          data.contratosVencidos,
        ],
        labels: ['Activos', 'Por vencer', 'Vencidos'],
        colors: ['#52c41a', '#faad14', '#ff4d4f'],
        legend: { position: 'bottom' },
      });
      donutChart.render();
      charts.push(donutChart);
    }

    const barEl = document.querySelector('#ingresos-bar-chart');
    if (barEl) {
      const barChart = new ApexCharts(barEl, {
        chart: { type: 'bar', height: 280, stacked: false, toolbar: { show: false } },
        series: [
          { name: 'Ingresos', data: ingresosMensuales },
          { name: 'Deudas', data: deudasMensuales },
        ],
        xaxis: {
          categories: [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
          ],
        },
        colors: ['#1890ff', '#ff4d4f'],
        plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
        stroke: { width: 0 },
      });
      barChart.render();
      charts.push(barChart);
    }

    const areaEl = document.querySelector('#ingresos-area-chart');
    if (areaEl) {
      const areaChart = new ApexCharts(areaEl, {
        chart: { type: 'area', height: 250, toolbar: { show: false } },
        series: [{ name: 'Ingresos', data: ingresosMensuales }],
        xaxis: {
          categories: [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
          ],
        },
        colors: ['#1890ff'],
        stroke: { curve: 'smooth', width: 3 },
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] },
        },
      });
      areaChart.render();
      charts.push(areaChart);
    }

    return () => charts.forEach((c) => c.destroy());
  }, [loading, data, chartsReady]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  const totalEspacios =
    data.bovedasDisponibles + data.bovedasOcupadas + data.nichosDisponibles + data.nichosOcupados;
  const ocupados = data.bovedasOcupadas + data.nichosOcupados;
  const disponibles = data.bovedasDisponibles + data.nichosDisponibles;
  const pctOcupacion = totalEspacios > 0 ? (ocupados * 100) / totalEspacios : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Vista general del estado operativo y financiero del cementerio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-refresh" />
          Actualizar
        </button>
      </div>

      {/* Sección: indicadores */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <i className="ti ti-chart-bar text-primary-500" />
          Indicadores principales
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total difuntos"
            value={formatNumber(data.numeroDifuntos)}
            subtitle="Registrados en el sistema"
            tone="primary"
            icon="ti-user-check"
          />
          <KpiCard
            title="Ingresos totales"
            value={formatCurrency(data.ingresosTotales)}
            subtitle="Este año"
            tone="warning"
            icon="ti-currency-dollar"
            progress={85}
          />
          <KpiCard
            title="Bóvedas disponibles"
            value={formatNumber(data.bovedasDisponibles)}
            subtitle="Sin contrato activo"
            tone="success"
            icon="ti-box"
          />
          <KpiCard
            title="Bóvedas ocupadas"
            value={formatNumber(data.bovedasOcupadas)}
            subtitle="Con contrato activo"
            tone="info"
            icon="ti-user-check"
          />
          <KpiCard
            title="Nichos disponibles"
            value={formatNumber(data.nichosDisponibles)}
            subtitle="Actualmente libres"
            tone="success"
            icon="ti-check"
          />
          <KpiCard
            title="Nichos ocupados"
            value={formatNumber(data.nichosOcupados)}
            subtitle="Ya asignados"
            tone="slate"
            icon="ti-user"
          />
          <KpiCard
            title="Contratos por vencer"
            value={formatNumber(data.contratosPorVencer)}
            subtitle="Próximos 30 días"
            tone="warning"
            icon="ti-alert-triangle"
          />
          <KpiCard
            title="Ingresos del año"
            value={formatCurrency(data.ingresosTotales)}
            subtitle="Acumulado anual"
            tone="primary"
            icon="ti-trending-up"
            progress={85}
          />
        </div>
      </section>

      {/* Sección: resumen operativo */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <i className="ti ti-layout-dashboard text-info-600" />
          Resumen operativo
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Distribución de espacios" icon="ti-pie-chart">
            <div id="espacios-pie-chart" style={{ height: 250, width: '100%' }} />
          </Card>

          <Card title="Estado de contratos" icon="ti-donut">
            <div id="contratos-donut-chart" style={{ height: 250, width: '100%' }} />
          </Card>

          <Card title="Capacidad" icon="ti-wave-square">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Total de espacios</dt>
                <dd className="font-semibold">{totalEspacios}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Disponibles</dt>
                <dd className="font-semibold text-green-600">{disponibles}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Ocupados</dt>
                <dd className="font-semibold text-info-600">{ocupados}</dd>
              </div>
            </dl>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-info-500"
                style={{ width: `${pctOcupacion}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-slate-400">
              {pctOcupacion.toFixed(0)}% de ocupación
            </p>
          </Card>
        </div>
      </section>

      {/* Sección: gráficos */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Ingresos vs deudas mensuales" icon="ti-chart-bar">
            <div id="ingresos-bar-chart" style={{ height: 280 }} />
          </Card>
        </div>
        <Card title="Tendencia de ingresos" icon="ti-chart-line">
          <div id="ingresos-area-chart" style={{ height: 250 }} />
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Transacciones recientes" icon="ti-receipt">
          {data.transaccionesRecientes.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No hay transacciones recientes.
            </div>
          ) : (
            <div className="space-y-3">
              {data.transaccionesRecientes.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{tx.nombrePersona}</p>
                    <p className="text-xs text-slate-500">{formatDate(tx.fechaPago)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(tx.monto)}</p>
                    <p className="text-xs text-slate-400">#{tx.numeroRecibo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Últimos contratos" icon="ti-file-text">
          {data.ultimosContratos.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No hay contratos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto -m-5">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2.5">Número</th>
                    <th className="px-5 py-2.5">Vencimiento</th>
                    <th className="px-5 py-2.5">Estado</th>
                    <th className="px-5 py-2.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.ultimosContratos.map((contrato) => (
                    <tr key={contrato.id}>
                      <td className="px-5 py-2.5 font-medium text-slate-800">
                        <Link href={`/contratos/${contrato.id}`} className="hover:text-primary-600 hover:underline">
                          {contrato.numeroSecuencial}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 text-slate-600">{formatDate(contrato.fechaFin)}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          contrato.estadoContrato === 'Vencido'
                            ? 'bg-red-50 text-red-700 ring-red-200'
                            : contrato.estadoContrato === 'Próximo a vencer'
                              ? 'bg-amber-50 text-amber-700 ring-amber-200'
                              : 'bg-green-50 text-green-700 ring-green-200'
                        }`}>
                          {contrato.estadoContrato}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right font-medium text-slate-700">
                        {formatCurrency(contrato.montoTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* Sección: contratos + alertas */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Estado de contratos" icon="ti-file-text">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Contratos activos</dt>
              <dd>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                  {data.contratosActivos}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Contratos por vencer</dt>
              <dd>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  {data.contratosPorVencer}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Contratos vencidos</dt>
              <dd>
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                  {data.contratosVencidos}
                </span>
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Alertas importantes" icon="ti-bell">
          <div className="space-y-3 text-sm">
            {data.contratosPorVencer > 0 && (
              <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                <i className="ti ti-alert-triangle mt-0.5 text-lg text-amber-600" />
                <div>
                  <p className="font-semibold">
                    {data.contratosPorVencer} contratos próximos a vencer
                  </p>
                  <p className="text-xs text-amber-700">Requieren atención inmediata</p>
                </div>
              </div>
            )}

            {data.contratosVencidos > 0 ? (
              <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                <i className="ti ti-alert-circle mt-0.5 text-lg text-red-600" />
                <div>
                  <p className="font-semibold">
                    {data.contratosVencidos} contratos vencidos
                  </p>
                  <p className="text-xs text-red-700">Acción requerida</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-800">
                <i className="ti ti-circle-check mt-0.5 text-lg text-green-600" />
                <div>
                  <p className="font-semibold">Sin alertas críticas</p>
                  <p className="text-xs text-green-700">Todo en orden</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Sección: accesos rápidos */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <i className="ti ti-layout-dashboard text-info-600" />
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickCard href="/contratos/create" icon="ti-file-plus" label="Nuevo contrato" tone="primary" />
          <QuickCard href="/contratos" icon="ti-files" label="Ver contratos" tone="success" />
          <QuickCard href="/bovedas" icon="ti-building" label="Espacios" tone="info" />
          <QuickCard href="/difuntos" icon="ti-users" label="Difuntos" tone="slate" />
          <QuickCard href="/cobros" icon="ti-receipt" label="Cobros" tone="warning" />
          <QuickCard href="/reportes" icon="ti-chart-bar" label="Reportes" tone="danger" />
        </div>
      </section>
    </div>
  );
}
