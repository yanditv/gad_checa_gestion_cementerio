'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Bell,
  Building2,
  ChartColumn,
  ChartLine,
  ChartPie,
  CircleAlert,
  CircleCheck,
  Coins,
  Donut,
  FilePlus,
  FileText,
  Files,
  Layers,
  LayoutDashboard,
  Package,
  Receipt,
  RefreshCw,
  TriangleAlert,
  UserCheck,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { reportesApi } from '@/lib/api';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui';

interface DashboardData {
  numeroDifuntos: number;
  ingresosTotales: number;
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

/**
 * Resumen de espacios por cada `TipoEspacio` del catálogo (Bóveda, Nicho,
 * Túmulo…). Es la fuente dinámica de las tarjetas/gráfico de espacios; viene
 * de `report.service` (`/reportes/resumen` → `bovedas.porTipo`).
 */
interface TipoEspacioResumen {
  tipoEspacioId: number | null;
  nombre: string;
  total: number;
  ocupados: number;
  disponibles: number;
  porCaducar: number;
  vencidas: number;
}

/** Normaliza un valor desconocido a número finito (0 por defecto). */
function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Normaliza la respuesta de `/reportes/resumen` (forma dinámica) a un arreglo
 * tipado de `TipoEspacioResumen`, tolerando ausencias o formas inesperadas.
 */
function normalizePorTipo(resumen: unknown): TipoEspacioResumen[] {
  const raw = (resumen as { bovedas?: { porTipo?: unknown } } | null)?.bovedas
    ?.porTipo;
  if (!Array.isArray(raw)) return [];
  return raw.map((t: any) => ({
    tipoEspacioId:
      t?.tipoEspacioId === null || t?.tipoEspacioId === undefined
        ? null
        : toNumber(t.tipoEspacioId),
    nombre: typeof t?.nombre === 'string' && t.nombre.trim() ? t.nombre : 'Espacio',
    total: toNumber(t?.total),
    ocupados: toNumber(t?.ocupados),
    disponibles: toNumber(t?.disponibles),
    porCaducar: toNumber(t?.porCaducar),
    vencidas: toNumber(t?.vencidas),
  }));
}

/** Paleta cíclica para las tarjetas y el gráfico de espacios por tipo. */
const TIPO_TONES: Tone[] = ['success', 'info', 'primary', 'warning', 'danger', 'slate'];
const TIPO_PIE_COLORS = ['#52c41a', '#13c2c2', '#722ed1', '#fa8c16', '#ff4d4f', '#8c8c8c'];

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

type UltimoContrato = DashboardData['ultimosContratos'][number];

const ultimosContratosColumns: DataTableColumn<UltimoContrato>[] = [
  {
    key: 'numero',
    header: 'Número',
    sortable: true,
    sortValue: (c) => c.numeroSecuencial,
    cell: (c) => (
      <Link
        href={`/contratos/${c.id}`}
        className="font-medium text-slate-800 hover:text-primary-600 hover:underline"
      >
        {c.numeroSecuencial}
      </Link>
    ),
  },
  {
    key: 'vencimiento',
    header: 'Vencimiento',
    sortable: true,
    sortValue: (c) => (c.fechaFin ? new Date(c.fechaFin) : null),
    cell: (c) => <span className="text-slate-600">{formatDate(c.fechaFin)}</span>,
  },
  {
    key: 'estado',
    header: 'Estado',
    sortable: true,
    sortValue: (c) => c.estadoContrato,
    cell: (c) => (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
          c.estadoContrato === 'Vencido'
            ? 'bg-red-50 text-red-700 ring-red-200'
            : c.estadoContrato === 'Próximo a vencer'
              ? 'bg-amber-50 text-amber-700 ring-amber-200'
              : 'bg-green-50 text-green-700 ring-green-200'
        }`}
      >
        {c.estadoContrato}
      </span>
    ),
  },
  {
    key: 'monto',
    header: 'Monto',
    align: 'right',
    sortable: true,
    sortValue: (c) => c.montoTotal,
    cell: (c) => (
      <span className="font-medium text-slate-700">
        {formatCurrency(c.montoTotal)}
      </span>
    ),
  },
];

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
        {Icon && (
          <Icon
            className="h-4 w-4 text-primary-500"
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
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
  icon: Icon,
  progress = 100,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: Tone;
  icon: LucideIcon;
  progress?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition-shadow hover:shadow-lifted">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-slate-600">
            {title}
          </p>
          <p className={`mt-1 text-2xl font-bold ${TONE_TEXT[tone]}`}>{value}</p>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${TONE_BG[tone]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
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
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: LucideIcon;
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
        <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="text-xs font-semibold text-slate-700">{label}</span>
    </Link>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData>({
    numeroDifuntos: 0,
    ingresosTotales: 0,
    contratosActivos: 0,
    contratosPorVencer: 0,
    contratosVencidos: 0,
    ultimosContratos: [],
    transaccionesRecientes: [],
  });
  const [porTipo, setPorTipo] = useState<TipoEspacioResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    (async () => {
      // El resumen global de contratos/ingresos sigue viniendo del BFF; el
      // desglose de espacios por tipo viene del `report.service` dinámico.
      const [dashboard, resumen] = await Promise.allSettled([
        fetch('/api/dashboard', {
          signal: controller.signal,
          credentials: 'same-origin',
        }).then((r) => (r.ok ? r.json() : null)),
        reportesApi.resumen(),
      ]);

      if (dashboard.status === 'fulfilled' && dashboard.value) {
        const result = dashboard.value;
        setData({
          numeroDifuntos: toNumber(result.numeroDifuntos),
          ingresosTotales: toNumber(result.ingresosTotales),
          contratosActivos: toNumber(result.contratosActivos),
          contratosPorVencer: toNumber(result.contratosPorVencer),
          contratosVencidos: toNumber(result.contratosVencidos),
          ultimosContratos: Array.isArray(result.ultimosContratos)
            ? result.ultimosContratos
            : [],
          transaccionesRecientes: Array.isArray(result.transaccionesRecientes)
            ? result.transaccionesRecientes
            : [],
        });
      }

      if (resumen.status === 'fulfilled') {
        setPorTipo(normalizePorTipo(resumen.value));
      }

      window.clearTimeout(timeout);
      setLoading(false);
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
    if (pieEl && porTipo.length > 0) {
      // Distribución dinámica: disponibles vs ocupados por cada TipoEspacio.
      const pieSeries: number[] = [];
      const pieLabels: string[] = [];
      const pieColors: string[] = [];
      porTipo.forEach((t, idx) => {
        const base = TIPO_PIE_COLORS[idx % TIPO_PIE_COLORS.length];
        pieSeries.push(t.disponibles, t.ocupados);
        pieLabels.push(`${t.nombre} disponibles`, `${t.nombre} ocupados`);
        pieColors.push(base, `${base}99`);
      });
      const pieChart = new ApexCharts(pieEl, {
        chart: { type: 'pie', height: 250, toolbar: { show: false } },
        series: pieSeries,
        labels: pieLabels,
        colors: pieColors,
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
  }, [loading, data, porTipo, chartsReady]);

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

  const totalEspacios = porTipo.reduce((s, t) => s + t.total, 0);
  const ocupados = porTipo.reduce((s, t) => s + t.ocupados, 0);
  const disponibles = porTipo.reduce((s, t) => s + t.disponibles, 0);
  const pctOcupacion = totalEspacios > 0 ? (ocupados * 100) / totalEspacios : 0;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Vista general del estado operativo y financiero del cementerio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {/* Sección: indicadores */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
          <ChartColumn
            className="h-4 w-4 text-primary-500"
            strokeWidth={2}
            aria-hidden="true"
          />
          Indicadores principales
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total difuntos"
            value={formatNumber(data.numeroDifuntos)}
            subtitle="Registrados en el sistema"
            tone="primary"
            icon={UserCheck}
          />
          <KpiCard
            title="Ingresos totales"
            value={formatCurrency(data.ingresosTotales)}
            subtitle="Este año"
            tone="warning"
            icon={Coins}
            progress={85}
          />
          <KpiCard
            title="Contratos por vencer"
            value={formatNumber(data.contratosPorVencer)}
            subtitle="Próximos 30 días"
            tone="warning"
            icon={TriangleAlert}
          />
          <KpiCard
            title="Total de espacios"
            value={formatNumber(totalEspacios)}
            subtitle={`${porTipo.length} tipos en catálogo`}
            tone="info"
            icon={Warehouse}
          />
        </div>
      </section>

      {/* Sección: espacios por tipo (dinámico por TipoEspacio) */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
          <Layers
            className="h-4 w-4 text-green-600"
            strokeWidth={2}
            aria-hidden="true"
          />
          Espacios por tipo
        </h2>
        {porTipo.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600 shadow-soft">
            No hay tipos de espacio configurados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {porTipo.map((tipo, idx) => {
              const tone = TIPO_TONES[idx % TIPO_TONES.length];
              const pct = tipo.total > 0 ? (tipo.disponibles * 100) / tipo.total : 0;
              return (
                <KpiCard
                  key={tipo.tipoEspacioId ?? `txt-${tipo.nombre}-${idx}`}
                  title={tipo.nombre}
                  value={`${formatNumber(tipo.disponibles)} / ${formatNumber(tipo.total)}`}
                  subtitle={`${formatNumber(tipo.ocupados)} ocupados · ${formatNumber(
                    tipo.disponibles,
                  )} disponibles`}
                  tone={tone}
                  icon={Package}
                  progress={pct}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Sección: resumen operativo */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
          <LayoutDashboard
            className="h-4 w-4 text-info-600"
            strokeWidth={2}
            aria-hidden="true"
          />
          Resumen operativo
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Distribución de espacios" icon={ChartPie}>
            <div id="espacios-pie-chart" style={{ height: 250, width: '100%' }} />
          </Card>

          <Card title="Estado de contratos" icon={Donut}>
            <div id="contratos-donut-chart" style={{ height: 250, width: '100%' }} />
          </Card>

          <Card title="Capacidad" icon={Activity}>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Total de espacios</dt>
                <dd className="font-semibold">{totalEspacios}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Disponibles</dt>
                <dd className="font-semibold text-green-700">{disponibles}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Ocupados</dt>
                <dd className="font-semibold text-info-700">{ocupados}</dd>
              </div>
            </dl>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-info-500"
                style={{ width: `${pctOcupacion}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-slate-600">
              {pctOcupacion.toFixed(0)}% de ocupación
            </p>
          </Card>
        </div>
      </section>

      {/* Sección: gráficos */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Ingresos vs deudas mensuales" icon={ChartColumn}>
            <div id="ingresos-bar-chart" style={{ height: 280 }} />
          </Card>
        </div>
        <Card title="Tendencia de ingresos" icon={ChartLine}>
          <div id="ingresos-area-chart" style={{ height: 250 }} />
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Transacciones recientes" icon={Receipt}>
          {data.transaccionesRecientes.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-600">
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
                    <p className="text-sm font-semibold text-green-700">{formatCurrency(tx.monto)}</p>
                    <p className="text-xs text-slate-600">#{tx.numeroRecibo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Últimos contratos" icon={FileText}>
          <div className="-m-5">
            <DataTable
              columns={ultimosContratosColumns}
              rows={data.ultimosContratos}
              rowKey={(contrato) => contrato.id}
              empty={
                <EmptyState title="No hay contratos registrados." compact />
              }
            />
          </div>
        </Card>
      </section>

      {/* Sección: contratos + alertas */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Estado de contratos" icon={FileText}>
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

        <Card title="Alertas importantes" icon={Bell}>
          <div className="space-y-3 text-sm">
            {data.contratosPorVencer > 0 && (
              <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
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
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold">
                    {data.contratosVencidos} contratos vencidos
                  </p>
                  <p className="text-xs text-red-700">Acción requerida</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-800">
                <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
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
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
          <LayoutDashboard className="h-4 w-4 text-info-600" />
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickCard href="/contratos/create" icon={FilePlus} label="Nuevo contrato" tone="primary" />
          <QuickCard href="/contratos" icon={Files} label="Ver contratos" tone="success" />
          <QuickCard href="/bovedas" icon={Building2} label="Espacios" tone="info" />
          <QuickCard href="/difuntos" icon={Users} label="Difuntos" tone="slate" />
          <QuickCard href="/cobros" icon={Receipt} label="Cobros" tone="warning" />
          <QuickCard href="/reportes" icon={ChartColumn} label="Reportes" tone="danger" />
        </div>
      </section>
    </div>
  );
}
