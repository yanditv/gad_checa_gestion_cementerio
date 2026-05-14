'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { contratosApi } from '@/lib/api';

interface Reportes {
  totalContratos: number;
  contratosActivos: number;
  contratosVencidos: number;
  ingresosTotales: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-EC').format(value);
}

export default function ReportesPage() {
  const [reportes, setReportes] = useState<Reportes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportes();
  }, []);

  const loadReportes = async () => {
    try {
      const data = await contratosApi.getReportes();
      setReportes(data);
    } catch (error) {
      console.error('Error loading reportes:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const kpis = [
    {
      label: 'Total Contratos',
      value: formatNumber(reportes?.totalContratos || 0),
      tone: 'bg-primary-50 text-primary-600 ring-primary-200',
      icon: 'ti-files',
      valueClass: 'text-slate-900',
    },
    {
      label: 'Contratos Activos',
      value: formatNumber(reportes?.contratosActivos || 0),
      tone: 'bg-green-50 text-green-600 ring-green-200',
      icon: 'ti-circle-check',
      valueClass: 'text-green-600',
    },
    {
      label: 'Contratos Vencidos',
      value: formatNumber(reportes?.contratosVencidos || 0),
      tone: 'bg-red-50 text-red-600 ring-red-200',
      icon: 'ti-alert-circle',
      valueClass: 'text-red-600',
    },
    {
      label: 'Ingresos Totales',
      value: formatCurrency(reportes?.ingresosTotales || 0),
      tone: 'bg-amber-50 text-amber-600 ring-amber-200',
      icon: 'ti-currency-dollar',
      valueClass: 'text-primary-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resumen e impresión de reportes del sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/reportes/ingresos/print"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-printer" />
            Imprimir ingresos
          </Link>
          <Link
            href="/reportes/cuentas-por-cobrar/print"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-printer" />
            Cuentas por cobrar
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition-shadow hover:shadow-lifted"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">{kpi.label}</p>
                <p className={`mt-1 text-2xl font-bold ${kpi.valueClass}`}>{kpi.value}</p>
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

      {/* Reportes disponibles */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Reportes disponibles</h2>
        </header>
        <div className="p-5">
          <p className="text-sm text-slate-500">
            Sistema de gestión de cementerio · GAD Checa
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Ingresos */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-primary-200">
                  <i className="ti ti-cash text-xl" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Reporte de Ingresos</h3>
                  <p className="text-xs text-slate-500">Detalle de pagos recibidos.</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/reportes/ingresos/print"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
                >
                  <i className="ti ti-eye" />
                  Abrir
                </Link>
                <Link
                  href="/reportes/ingresos/print?autoprint=1"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
                >
                  <i className="ti ti-printer" />
                  Imprimir
                </Link>
              </div>
            </div>

            {/* Cuentas por cobrar */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                  <i className="ti ti-receipt text-xl" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Cuentas por cobrar</h3>
                  <p className="text-xs text-slate-500">Saldos pendientes de cobro.</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/reportes/cuentas-por-cobrar/print"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
                >
                  <i className="ti ti-eye" />
                  Abrir
                </Link>
                <Link
                  href="/reportes/cuentas-por-cobrar/print?autoprint=1"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50"
                >
                  <i className="ti ti-printer" />
                  Imprimir
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
