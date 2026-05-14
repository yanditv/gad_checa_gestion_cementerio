'use client';

import { useEffect, useState } from 'react';
import { pagosApi } from '@/lib/api';

interface Pago {
  id: number;
  numeroRecibo: string;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  referencia: string | null;
  estado: boolean;
  cuotas: { cuota: { contrato: { difunto: { nombre: string; apellido: string } } } }[];
}

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

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPagos();
  }, []);

  const loadPagos = async () => {
    try {
      const data = await pagosApi.findAll();
      setPagos(data);
    } catch (error) {
      console.error('Error loading pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Listado de pagos registrados en el sistema.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <i className="ti ti-plus" />
          Nuevo pago
        </button>
      </div>

      {/* Tarjeta principal */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <i className="ti ti-receipt text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-700">Lista de Pagos</h3>
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3">Recibo</th>
                <th scope="col" className="px-4 py-3">Fecha</th>
                <th scope="col" className="px-4 py-3">Beneficiario</th>
                <th scope="col" className="px-4 py-3 text-right">Monto</th>
                <th scope="col" className="px-4 py-3">Método</th>
                <th scope="col" className="px-4 py-3">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
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
                      Cargando pagos…
                    </div>
                  </td>
                </tr>
              ) : pagos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <i className="ti ti-folder-x text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">No hay pagos registrados.</div>
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {pago.numeroRecibo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(pago.fechaPago)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {pago.cuotas[0]?.cuota.contrato.difunto.nombre}{' '}
                      {pago.cuotas[0]?.cuota.contrato.difunto.apellido}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-700">
                      {formatCurrency(pago.monto)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{pago.metodoPago}</td>
                    <td className="px-4 py-3 text-slate-500">{pago.referencia || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
