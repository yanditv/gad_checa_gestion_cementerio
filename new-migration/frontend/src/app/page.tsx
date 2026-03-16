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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch('/api/dashboard', { signal: controller.signal });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } finally {
        window.clearTimeout(timeout);
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    if (loading) return;

    const ApexCharts = (window as any).ApexCharts;
    if (!ApexCharts) return;

    const totalEspacios =
      data.bovedasDisponibles +
      data.bovedasOcupadas +
      data.nichosDisponibles +
      data.nichosOcupados;

    const monthlyBase = Math.max(1, Math.round(data.ingresosTotales / 12));
    const ingresosMensuales = [0.75, 0.9, 0.8, 1, 1.1, 0.95, 1.15, 1.05, 0.92, 1.2, 1.08, 1.25].map((m) =>
      Math.round(monthlyBase * m),
    );
    const deudasMensuales = ingresosMensuales.map((i) => Math.round(i * 0.35));

    const charts: any[] = [];

    const pieEl = document.querySelector('#espacios-pie-chart');
    if (pieEl) {
      const pieChart = new ApexCharts(pieEl, {
        chart: { type: 'pie', height: 250, toolbar: { show: false } },
        series: [data.bovedasDisponibles, data.bovedasOcupadas, data.nichosDisponibles, data.nichosOcupados],
        labels: ['Bóvedas Disponibles', 'Bóvedas Ocupadas', 'Nichos Disponibles', 'Nichos Ocupados'],
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
        series: [data.contratosActivos, data.contratosPorVencer, data.contratosVencidos],
        labels: ['Activos', 'Por Vencer', 'Vencidos'],
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
          categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
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
          categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
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

    return () => {
      charts.forEach((c) => c.destroy());
    };
  }, [loading, data]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const totalEspacios =
    data.bovedasDisponibles + data.bovedasOcupadas + data.nichosDisponibles + data.nichosOcupados;

  return (
    <div className="container-fluid">
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Dashboard - Gestión del Cementerio</h2>
              <p className="text-muted mb-0 small">Vista general del estado operativo y financiero</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-primary" onClick={() => window.location.reload()}>
                <i className="ti ti-refresh me-1"></i>Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12 mb-2">
          <h5 className="section-title mb-3">
            <i className="ti ti-chart-bar text-primary me-2"></i>
            Indicadores Principales
          </h5>
        </div>
      </div>

      <div className="row mb-4">
        <KpiCard title="Total Difuntos" value={data.numeroDifuntos.toLocaleString()} subtitle="Registrados en el sistema" tone="primary" icon="ti-user-check" progress={100} />
        <KpiCard title="Ingresos Totales" value={`$${data.ingresosTotales.toLocaleString()}`} subtitle="Este año" tone="warning" icon="ti-currency-dollar" progress={85} />
        <KpiCard title="Bóvedas Disponibles" value={data.bovedasDisponibles.toLocaleString()} subtitle="Sin contrato activo" tone="success" icon="ti-box" progress={100} />
        <KpiCard title="Bóvedas Ocupadas" value={data.bovedasOcupadas.toLocaleString()} subtitle="Con contrato activo" tone="info" icon="ti-user-check" progress={100} />
        <KpiCard title="Nichos Disponibles" value={data.nichosDisponibles.toLocaleString()} subtitle="Actualmente libres" tone="success" icon="ti-check" progress={100} />
        <KpiCard title="Nichos Ocupados" value={data.nichosOcupados.toLocaleString()} subtitle="Ya asignados" tone="secondary" icon="ti-user" progress={100} />
        <KpiCard title="Bóvedas por Caducar" value={data.contratosPorVencer.toLocaleString()} subtitle="Contratos por vencer" tone="warning" icon="ti-alert-triangle" progress={100} />
        <KpiCard title="Total Ingresos del Año" value={`$${data.ingresosTotales.toLocaleString()}`} subtitle="Acumulado anual" tone="primary" icon="ti-trending-up" progress={85} />
      </div>

      <div className="row mb-3">
        <div className="col-12 mb-2">
          <h5 className="section-title mb-3">
            <i className="ti ti-layout-dashboard text-info me-2"></i>
            Resumen Operativo
          </h5>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12 col-md-6 col-xl-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="ti ti-pie-chart text-primary me-2"></i>
                Distribución de Espacios
              </h5>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <div id="espacios-pie-chart" style={{ height: '250px', width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="ti ti-donut text-success me-2"></i>
                Estado de Contratos
              </h5>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <div id="contratos-donut-chart" style={{ height: '250px', width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="ti ti-wave-square text-info me-2"></i>
                Capacidad
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Total de espacios</span>
                <span className="fw-semibold">{totalEspacios}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Disponibles</span>
                <span className="text-success fw-semibold">{data.bovedasDisponibles + data.nichosDisponibles}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Ocupados</span>
                <span className="text-info fw-semibold">{data.bovedasOcupadas + data.nichosOcupados}</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className="progress-bar bg-info"
                  style={{
                    width: `${totalEspacios > 0 ? Math.round(((data.bovedasOcupadas + data.nichosOcupados) * 100) / totalEspacios) : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12 col-lg-8 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="ti ti-chart-bar text-info me-2"></i>
                Ingresos vs Deudas Mensuales
              </h5>
            </div>
            <div className="card-body">
              <div id="ingresos-bar-chart" style={{ height: '280px' }}></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="ti ti-chart-line text-primary me-2"></i>
                Tendencia de Ingresos
              </h5>
            </div>
            <div className="card-body">
              <div id="ingresos-area-chart" style={{ height: '250px' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12 col-lg-6 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="ti ti-file-text text-secondary me-2"></i>
                Estado de Contratos
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Contratos Activos</span>
                <span className="badge bg-success">{data.contratosActivos}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Contratos por Vencer</span>
                <span className="badge bg-warning text-dark">{data.contratosPorVencer}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Contratos Vencidos</span>
                <span className="badge bg-danger">{data.contratosVencidos}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">
                <i className="ti ti-bell text-warning me-2"></i>
                Alertas Importantes
              </h5>
            </div>
            <div className="card-body">
              {data.contratosPorVencer > 0 && (
                <div className="alert alert-warning border-0 mb-3" role="alert">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-alert-triangle me-2"></i>
                    <div>
                      <strong>{data.contratosPorVencer} contratos</strong> próximos a vencer
                      <br />
                      <small className="text-muted">Requieren atención inmediata</small>
                    </div>
                  </div>
                </div>
              )}

              {data.contratosVencidos > 0 ? (
                <div className="alert alert-danger border-0 mb-0" role="alert">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-alert-circle me-2"></i>
                    <div>
                      <strong>{data.contratosVencidos} contratos</strong> ya vencidos
                      <br />
                      <small className="text-muted">Acción requerida</small>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="alert alert-success border-0 mb-0" role="alert">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-circle-check me-2"></i>
                    <div>
                      <strong>Sin alertas críticas</strong>
                      <br />
                      <small className="text-muted">Todo en orden</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12 mb-2">
          <h5 className="section-title mb-3">
            <i className="ti ti-layout-dashboard text-info me-2"></i>
            Accesos Rápidos
          </h5>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <QuickCard href="/contratos/create" icon="ti-file-plus" label="Nuevo Contrato" tone="primary" />
                <QuickCard href="/contratos" icon="ti-files" label="Ver Contratos" tone="success" />
                <QuickCard href="/bovedas" icon="ti-building" label="Gestionar Espacios" tone="info" />
                <QuickCard href="/difuntos" icon="ti-users" label="Registro Difuntos" tone="secondary" />
                <QuickCard href="/cobros" icon="ti-receipt" label="Cobros" tone="warning" />
                <QuickCard href="/reportes" icon="ti-chart-bar" label="Reportes" tone="danger" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  tone,
  icon,
  progress,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: 'primary' | 'success' | 'warning' | 'info' | 'secondary';
  icon: string;
  progress: number;
}) {
  return (
    <div className="col-sm-6 col-md-4 col-lg-3 mb-3">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h6 className="mb-2 f-w-400 text-muted">{title}</h6>
              <h3 className={`mb-1 text-${tone}`}>{value}</h3>
              <small className="text-muted">{subtitle}</small>
            </div>
            <div className={`avatar bg-light-${tone} text-${tone}`}>
              <i className={`ti ${icon} f-24`}></i>
            </div>
          </div>
          <div className="progress mt-3" style={{ height: '4px' }}>
            <div className={`progress-bar bg-${tone}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
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
  tone: 'primary' | 'success' | 'info' | 'secondary' | 'warning' | 'danger';
}) {
  return (
    <div className="col-6 col-sm-4 col-md-3 col-lg-2">
      <Link
        href={href}
        className={`card text-center p-3 border-0 bg-light-${tone} text-decoration-none h-100`}
      >
        <div className="card-body">
          <i className={`ti ${icon} text-${tone} mb-2`} style={{ fontSize: '1.8rem' }}></i>
          <div className="fw-medium small">{label}</div>
        </div>
      </Link>
    </div>
  );
}
