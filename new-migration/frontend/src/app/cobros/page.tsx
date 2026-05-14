'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { cuotasApi, pagosApi } from '@/lib/api';

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-EC');
}

interface ContratoAgrupado {
  contratoId: number;
  numeroSecuencial: string;
  difunto: string;
  cuotas: unknown[];
  totalPendiente: number;
}

export default function CobrosPage() {
  const [loading, setLoading] = useState(true);
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cuotas, pagosData] = await Promise.all([
          cuotasApi.pendientes(),
          pagosApi.findAll(),
        ]);
        setPendientes(cuotas);
        setPagos(pagosData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Agrupa cuotas por contrato para que el operador "cobre" en un solo paso.
  const contratosConPendientes = useMemo<ContratoAgrupado[]>(() => {
    const map = new Map<number, ContratoAgrupado>();
    for (const cuota of pendientes) {
      const contratoId = cuota.contratoId ?? cuota.contrato?.id;
      if (!contratoId) continue;
      const grupo: ContratoAgrupado = map.get(contratoId) ?? {
        contratoId,
        numeroSecuencial: cuota.contrato?.numeroSecuencial ?? `Contrato #${contratoId}`,
        difunto: cuota.contrato?.difunto
          ? `${cuota.contrato.difunto.nombre ?? ''} ${cuota.contrato.difunto.apellido ?? ''}`.trim()
          : '—',
        cuotas: [] as unknown[],
        totalPendiente: 0,
      };
      grupo.cuotas.push(cuota);
      grupo.totalPendiente += Number(cuota.monto ?? 0);
      map.set(contratoId, grupo);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.cuotas.length - a.cuotas.length,
    );
  }, [pendientes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="inline-flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin text-primary-500"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="text-sm">Cargando…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cobros</h1>
          <p className="mt-1 text-sm text-slate-500">
            Contratos con cuotas pendientes y últimos pagos registrados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contratos con cuotas pendientes */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <i className="ti ti-clock-exclamation text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Contratos con cuotas pendientes
              </h3>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
              {contratosConPendientes.length}
            </span>
          </header>
          <div className="max-h-[480px] overflow-y-auto p-5">
            {contratosConPendientes.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <i className="ti ti-check text-3xl text-slate-300" />
                <div className="mt-2 text-sm">
                  No hay cuotas vencidas pendientes.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {contratosConPendientes.map((c) => (
                  <li
                    key={c.contratoId}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-xs font-semibold text-slate-800">
                          {c.numeroSecuencial}
                        </strong>
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                          {c.cuotas.length} cuota{c.cuotas.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {c.difunto}
                      </p>
                      <p className="text-xs text-slate-400">
                        Total pendiente:{' '}
                        <strong className="text-slate-700">
                          {formatCurrency(c.totalPendiente)}
                        </strong>
                      </p>
                    </div>
                    <Link
                      href={`/cobros/${c.contratoId}/cobrar`}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600"
                    >
                      <i className="ti ti-coin" />
                      Cobrar
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Últimos pagos */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <i className="ti ti-receipt text-primary-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Últimos pagos
              </h3>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
              {pagos.length}
            </span>
          </header>
          <div className="max-h-[480px] overflow-y-auto p-5">
            {pagos.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <i className="ti ti-folder-x text-3xl text-slate-300" />
                <div className="mt-2 text-sm">No hay pagos registrados.</div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pagos.slice(0, 20).map((pago) => (
                  <li
                    key={pago.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <strong className="font-mono text-xs font-semibold text-slate-800">
                        {pago.numeroRecibo}
                      </strong>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {formatDate(pago.fechaPago)} · {pago.metodoPago}
                      </p>
                      <p className="text-xs text-slate-400">
                        {pago.referencia || 'Sin referencia'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-medium text-slate-700">
                        {formatCurrency(pago.monto)}
                      </span>
                      <a
                        href={`/api/pagos/${pago.id}/factura.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                      >
                        <i className="ti ti-file-type-pdf" />
                        Recibo
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
