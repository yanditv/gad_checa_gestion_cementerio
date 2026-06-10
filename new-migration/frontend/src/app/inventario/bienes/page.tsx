'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  inventarioBienesApi,
  inventarioCategoriasApi,
  inventarioCustodiosApi,
  PaginationMeta,
} from '@/lib/api';

interface CategoriaResumen {
  id: number;
  nombre: string;
}

interface BienListItem {
  id: number;
  codigo: string;
  descripcion: string;
  marca: string | null;
  serie: string | null;
  fechaAdquisicion: string;
  valorAdquisicion: number;
  estadoConservacion: string;
  ubicacion: string | null;
  dadoDeBaja: boolean;
  categoria: CategoriaResumen | null;
  custodio: { id: number; nombre: string } | null;
}

const SELECT_CLS =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-EC');
}

export default function BienesPage() {
  const [bienes, setBienes] = useState<BienListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [custodioId, setCustodioId] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [dadoDeBaja, setDadoDeBaja] = useState('');

  const [categorias, setCategorias] = useState<CategoriaResumen[]>([]);
  const [custodios, setCustodios] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    inventarioCategoriasApi
      .findAll()
      .then((rows) => setCategorias(rows ?? []))
      .catch(() => undefined);
    inventarioCustodiosApi
      .findAll()
      .then((rows) => setCustodios(rows ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadBienes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, categoriaId, custodioId, ubicacion, dadoDeBaja]);

  const loadBienes = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await inventarioBienesApi.findPage({
        page,
        limit: 15,
        search: search.trim() || undefined,
        categoriaId: categoriaId || undefined,
        custodioId: custodioId || undefined,
        ubicacion: ubicacion.trim() || undefined,
        dadoDeBaja: dadoDeBaja || undefined,
      });
      setBienes(result.data);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los bienes');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setPage(1);
    setSearch('');
    setCategoriaId('');
    setCustodioId('');
    setUbicacion('');
    setDadoDeBaja('');
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
          <h1 className="text-2xl font-bold text-slate-900">Bienes institucionales</h1>
          <p className="mt-1 text-sm text-slate-500">
            Inventario de propiedad, planta y equipo del GAD.
          </p>
        </div>
        <Link
          href="/inventario/bienes/nuevo"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <i className="ti ti-plus" />
          Nuevo bien
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              type="search"
              placeholder="Código, descripción o serie"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className={SELECT_CLS}
            />
            <select
              value={categoriaId}
              onChange={(e) => {
                setPage(1);
                setCategoriaId(e.target.value);
              }}
              className={SELECT_CLS}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              value={custodioId}
              onChange={(e) => {
                setPage(1);
                setCustodioId(e.target.value);
              }}
              className={SELECT_CLS}
            >
              <option value="">Todos los custodios</option>
              {custodios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Ubicación"
              value={ubicacion}
              onChange={(e) => {
                setPage(1);
                setUbicacion(e.target.value);
              }}
              className={SELECT_CLS}
            />
            <select
              value={dadoDeBaja}
              onChange={(e) => {
                setPage(1);
                setDadoDeBaja(e.target.value);
              }}
              className={SELECT_CLS}
            >
              <option value="">Todos los estados</option>
              <option value="false">Activos (en uso)</option>
              <option value="true">Dados de baja</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <i className="ti ti-x" /> Limpiar
            </button>
          </div>
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
                <th scope="col" className="px-4 py-3">Código</th>
                <th scope="col" className="px-4 py-3">Descripción</th>
                <th scope="col" className="px-4 py-3">Categoría</th>
                <th scope="col" className="px-4 py-3">Custodio</th>
                <th scope="col" className="px-4 py-3">Ubicación</th>
                <th scope="col" className="px-4 py-3 text-right">Valor adq.</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Cargando bienes…
                    </div>
                  </td>
                </tr>
              ) : bienes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <i className="ti ti-folder-x text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">No hay bienes registrados.</div>
                  </td>
                </tr>
              ) : (
                bienes.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {row.codigo}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.descripcion}
                      {(row.marca || row.serie) && (
                        <span className="block text-xs font-normal text-slate-400">
                          {[row.marca, row.serie].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.categoria?.nombre ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.custodio?.nombre ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.ubicacion || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {formatMoney(row.valorAdquisicion)}
                    </td>
                    <td className="px-4 py-3">
                      {row.dadoDeBaja ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                          Dado de baja
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                          En uso
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        href={`/inventario/bienes/${row.id}`}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                        title="Ver ficha"
                      >
                        <i className="ti ti-eye" />
                      </Link>
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
              bien{meta.total === 1 ? '' : 'es'}
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
