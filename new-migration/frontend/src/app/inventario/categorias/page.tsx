'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { inventarioCategoriasApi, PaginationMeta } from '@/lib/api';

interface Categoria {
  id: number;
  nombre: string;
  vidaUtilAnios: number;
  valorResidualPct: number;
  estado: boolean;
}

export default function CategoriasBienPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, includeInactive, filtroNombre]);

  const loadCategorias = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await inventarioCategoriasApi.findPage({
        page,
        limit: 15,
        search: filtroNombre.trim() || undefined,
        includeInactive: includeInactive ? 'true' : undefined,
      });
      setCategorias(result.data);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar esta categoría?')) return;

    setDeletingId(id);
    setError('');
    try {
      await inventarioCategoriasApi.delete(id);
      if (categorias.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadCategorias();
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo desactivar la categoría');
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
          <h1 className="text-2xl font-bold text-slate-900">
            Categorías de bienes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vida útil y valor residual para el cálculo de depreciación.
          </p>
        </div>
        <Link
          href="/inventario/categorias/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <i className="ti ti-plus" />
          Nueva categoría
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="search"
              placeholder="Nombre de la categoría"
              value={filtroNombre}
              onChange={(e) => {
                setPage(1);
                setFiltroNombre(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => {
                  setPage(1);
                  setIncludeInactive(e.target.checked);
                }}
                className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-200"
              />
              Mostrar inactivas
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              setFiltroNombre('');
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-x" /> Limpiar
          </button>
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Vida útil (años)</th>
                <th scope="col" className="px-4 py-3">Valor residual</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
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
                      Cargando categorías…
                    </div>
                  </td>
                </tr>
              ) : categorias.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    <i className="ti ti-folder-x text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">
                      No hay categorías registradas.
                    </div>
                  </td>
                </tr>
              ) : (
                categorias.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.vidaUtilAnios}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.valorResidualPct}%
                    </td>
                    <td className="px-4 py-3">
                      {row.estado ? (
                        <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 ring-1 ring-success-200">
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/inventario/categorias/${row.id}/edit`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                          title="Editar"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          disabled={deletingId === row.id || !row.estado}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Desactivar"
                        >
                          <i
                            className={`ti ${
                              deletingId === row.id
                                ? 'ti-loader animate-spin'
                                : 'ti-trash'
                            }`}
                          />
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
              categoría{meta.total === 1 ? '' : 's'}
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
