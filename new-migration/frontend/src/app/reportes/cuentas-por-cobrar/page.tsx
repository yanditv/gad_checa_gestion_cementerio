'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Table } from 'lucide-react';
import { reportesApi } from '@/lib/api';
import { Card, Checkbox, Input, PageHeader, Spinner } from '@/components/ui';

function formatCurrency(v: number | string | null | undefined) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(v ?? 0));
}

function formatDate(v?: string | Date | null) {
  if (!v) return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-EC');
}

interface CuentaItem {
  cuotaId: number;
  numero: number;
  fechaVencimiento: string;
  diasMora: number;
  monto: number;
  intereses: number;
  total: number;
  contrato: { id: number; numeroSecuencial: string } | null;
  difunto: string | null;
  responsable: string | null;
  telefono: string | null;
  boveda: string | null;
  bloque: string | null;
}

interface CuentaData {
  items: CuentaItem[];
  totales: { cantidad: number; vencidas: number; monto: number };
}

export default function CuentasPorCobrarPage() {
  const [data, setData] = useState<CuentaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');
  const [soloVencidas, setSoloVencidas] = useState(false);

  useEffect(() => {
    reportesApi
      .cuentasPorCobrar()
      .then((res) => setData(res as CuentaData))
      .catch((err: any) => setError(err.message || 'No se pudo cargar'))
      .finally(() => setLoading(false));
  }, []);

  const itemsFiltrados = useMemo(() => {
    if (!data) return [];
    const q = filtro.trim().toLowerCase();
    return data.items.filter((i) => {
      if (soloVencidas && i.diasMora === 0) return false;
      if (!q) return true;
      const haystack = [
        i.contrato?.numeroSecuencial,
        i.responsable,
        i.difunto,
        i.telefono,
        i.boveda,
        i.bloque,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, filtro, soloVencidas]);

  const totalFiltrado = useMemo(
    () => itemsFiltrados.reduce((s, i) => s + i.total, 0),
    [itemsFiltrados],
  );

  return (
    <div className="py-6 space-y-5">
      <PageHeader
        title="Cuentas por cobrar"
        subtitle="Cuotas pendientes con días de mora y datos del responsable."
        backHref="/reportes"
        actions={
          <>
            <a
              href="/api/reportes/cuentas-por-cobrar/pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> PDF
            </a>
            <a
              href="/api/reportes/cuentas-por-cobrar/excel"
              className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
            >
              <Table className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Excel
            </a>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Cuotas pendientes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {data?.totales.cantidad ?? 0}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Vencidas</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {data?.totales.vencidas ?? 0}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Monto por cobrar</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {formatCurrency(data?.totales.monto ?? 0)}
          </p>
        </Card>
      </section>

      <Card padding="none">
        <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Cuentas · {itemsFiltrados.length}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="text"
              placeholder="Buscar responsable, contrato…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              wrapperClassName="w-64"
            />
            <Checkbox
              label="Solo vencidas"
              checked={soloVencidas}
              onChange={(e) => setSoloVencidas(e.target.checked)}
            />
          </div>
        </header>

        {error && (
          <div className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Spinner size="lg" className="text-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-2.5">Contrato</th>
                  <th className="px-5 py-2.5">Responsable</th>
                  <th className="px-5 py-2.5">Difunto</th>
                  <th className="px-5 py-2.5">Bóveda</th>
                  <th className="px-5 py-2.5">Vencimiento</th>
                  <th className="px-5 py-2.5 text-center">Mora</th>
                  <th className="px-5 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      No hay cuentas por cobrar.
                    </td>
                  </tr>
                ) : (
                  itemsFiltrados.map((i) => (
                    <tr key={i.cuotaId}>
                      <td className="px-5 py-2.5">
                        {i.contrato ? (
                          <Link
                            href={`/contratos/${i.contrato.id}`}
                            className="font-mono text-xs font-semibold text-primary-600 hover:underline"
                          >
                            {i.contrato.numeroSecuencial}
                          </Link>
                        ) : (
                          '—'
                        )}
                        <p className="text-[10px] text-slate-400">Cuota #{i.numero}</p>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="text-xs font-medium text-slate-700">
                          {i.responsable ?? '—'}
                        </span>
                        {i.telefono && (
                          <p className="text-[10px] text-slate-400">{i.telefono}</p>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-500">
                        {i.difunto ?? '—'}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-500">
                        {i.bloque && i.boveda
                          ? `${i.bloque} · ${i.boveda}`
                          : i.boveda ?? '—'}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-500">
                        {formatDate(i.fechaVencimiento)}
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        {i.diasMora > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                            {i.diasMora} d
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right font-medium text-slate-700">
                        {formatCurrency(i.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {itemsFiltrados.length > 0 && (
                <tfoot className="bg-slate-50">
                  <tr className="text-sm font-bold text-slate-700">
                    <td colSpan={6} className="px-5 py-2.5 text-right">
                      Total filtrado
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      {formatCurrency(totalFiltrado)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
