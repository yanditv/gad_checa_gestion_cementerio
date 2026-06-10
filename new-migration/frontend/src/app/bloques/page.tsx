'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bloquesApi, PaginationMeta } from '@/lib/api';

interface Bloque {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  cementerioId: number;
  cementerio?: { id: number; nombre: string } | null;
  pisos?: { id: number; numero: number }[];
  bovedas?: { id: number }[];
}

export default function BloquesPage() {
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadBloques();
  }, [page, search]);

  const loadBloques = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await bloquesApi.findPage({
        page,
        limit: 15,
        search: search.trim() || undefined,
      });

      setBloques(payload.data || []);
      setMeta(payload.meta);
    } catch (error: any) {
      setError(error.message || 'No se pudieron cargar los bloques');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar este bloque?')) return;

    setDeletingId(id);
    setError('');
    try {
      await bloquesApi.delete(id);
      if (bloques.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadBloques();
      }
    } catch (error: any) {
      setError(error.message || 'No se pudo desactivar el bloque');
    } finally {
      setDeletingId(null);
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
          <h1 className="text-2xl font-bold text-slate-900">Lista de Bloques</h1>
          <p className="mt-1 text-sm text-slate-500">
            Administración de bloques del cementerio.
          </p>
        </div>
        <Link
          href="/bloques/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <i className="ti ti-plus" />
          Nuevo Bloque
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar bloques..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Cementerio</th>
                <th scope="col" className="px-4 py-3">Pisos</th>
                <th scope="col" className="px-4 py-3">Bóvedas</th>
                <th scope="col" className="px-4 py-3">Descripción</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
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
                      Cargando bloques…
                    </div>
                  </td>
                </tr>
              ) : bloques.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <i className="ti ti-stack-2 text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">No hay bloques registrados.</div>
                  </td>
                </tr>
              ) : (
                bloques.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{row.cementerio?.nombre || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{row.pisos?.length ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600">{row.bovedas?.length ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.descripcion || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {row.estado ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/bloques/${row.id}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                          title="Ver"
                        >
                          <i className="ti ti-eye" />
                        </Link>
                        <Link
                          href={`/bloques/${row.id}/edit`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                          title="Editar"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          disabled={deletingId === row.id}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <i className={`ti ${deletingId === row.id ? 'ti-loader animate-spin' : 'ti-trash'}`} />
                        </button>
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
              bloque{meta.total === 1 ? '' : 's'}
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
