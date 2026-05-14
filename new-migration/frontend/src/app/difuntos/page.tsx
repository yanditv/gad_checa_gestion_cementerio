'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { difuntosApi, PaginationMeta } from '@/lib/api';

interface Difunto {
  id: number;
  nombre: string;
  apellido: string;
  numeroIdentificacion: string | null;
  fechaNacimiento: string | null;
  fechaDefuncion: string | null;
  fechaInhumacion: string | null;
  causaMuerte: string | null;
  estado: boolean;
  boveda: { numero: string; bloque: { nombre: string } };
}

export default function DifuntosPage() {
  const [difuntos, setDifuntos] = useState<Difunto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadDifuntos();
  }, [page, search]);

  const loadDifuntos = async () => {
    setLoading(true);
    try {
      const result = await difuntosApi.findPage({ page, limit: 15, search });
      setDifuntos(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error('Error loading difuntos:', error);
    } finally {
      setLoading(false);
    }
  };

  const visiblePages = (() => {
    if (!meta) return [];
    const start = Math.max(1, meta.page - 2);
    const end = Math.min(meta.totalPages, meta.page + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lista de Difuntos</h1>
          <p className="mt-1 text-sm text-slate-500">Gestión de difuntos registrados.</p>
        </div>
        <Link
          href="/difuntos/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <i className="ti ti-plus" />
          Nuevo Difunto
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar difuntos..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Identificación</th>
                <th scope="col" className="px-4 py-3">Fecha Defunción</th>
                <th scope="col" className="px-4 py-3">Bóveda</th>
                <th scope="col" className="px-4 py-3">Causa Muerte</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
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
                      Cargando difuntos…
                    </div>
                  </td>
                </tr>
              ) : difuntos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <i className="ti ti-folder-x text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">No hay difuntos registrados.</div>
                  </td>
                </tr>
              ) : (
                difuntos.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.nombre} {row.apellido}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.numeroIdentificacion || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.fechaDefuncion
                        ? new Date(row.fechaDefuncion).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {`${row.boveda?.numero || '-'} - ${row.boveda?.bloque?.nombre || '-'}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.causaMuerte || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/difuntos/${row.id}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                          title="Ver"
                        >
                          <i className="ti ti-eye" />
                        </Link>
                        <Link
                          href={`/difuntos/${row.id}/edit`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                          title="Editar"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
            <p className="text-xs text-slate-500">
              Página <strong className="text-slate-700">{meta.page}</strong> de{' '}
              <strong className="text-slate-700">{meta.totalPages}</strong>
              <span className="mx-1.5 text-slate-300">·</span>
              <strong className="text-slate-700">{meta.total}</strong>{' '}
              difunto{meta.total === 1 ? '' : 's'}
            </p>
            <nav className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(meta.page - 1)}
                disabled={!meta.hasPrevPage}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="ti ti-chevron-left" /> Anterior
              </button>
              {visiblePages.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    p === meta.page
                      ? 'bg-primary-500 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(meta.page + 1)}
                disabled={!meta.hasNextPage}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente <i className="ti ti-chevron-right" />
              </button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
}
