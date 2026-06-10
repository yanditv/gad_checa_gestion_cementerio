'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bovedasApi, PaginationMeta } from '@/lib/api';

interface Boveda {
  id: number;
  numero: string;
  capacidad: number;
  tipo: string | null;
  estado: boolean;
  precio: number;
  precioArrendamiento: number;
  bloque: {
    nombre: string;
    cementerio: { nombre: string };
  };
  propietario: {
    persona: {
      nombre: string;
      apellido: string;
      numeroIdentificacion?: string;
    };
  } | null;
  piso?: { numero: number } | null;
  contratos?: { id: number; numeroSecuencial: string }[];
}

export default function BovedasPage() {
  const [bovedas, setBovedas] = useState<Boveda[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPropietario, setFilterPropietario] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadBovedas();
  }, [page, searchTerm, filterEstado, filterTipo, filterPropietario]);

  const loadBovedas = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await bovedasApi.findPage({
        page,
        limit: 15,
        search: searchTerm.trim() || undefined,
        ...(filterTipo ? { tipo: filterTipo } : {}),
        ...(filterEstado ? { estado: filterEstado } : {}),
        ...(filterPropietario ? { tienePropietario: filterPropietario } : {}),
      });

      setBovedas(payload.data || []);
      setMeta(payload.meta);
    } catch (error: any) {
      setError(error.message || 'No se pudieron cargar las bóvedas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar esta bóveda?')) return;

    setDeletingId(id);
    setError('');
    try {
      await bovedasApi.delete(id);
      if (bovedas.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadBovedas();
      }
    } catch (error: any) {
      setError(error.message || 'No se pudo desactivar la bóveda');
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
          <h1 className="text-2xl font-bold text-slate-900">Lista de Bóvedas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Administración de bóvedas y nichos.
          </p>
        </div>
        <Link
          href="/bovedas/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <i className="ti ti-plus" />
          Nueva Bóveda
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar bóvedas..."
              value={searchTerm}
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="tipo-filter"
              className="text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Tipo
            </label>
            <select
              id="tipo-filter"
              value={filterTipo}
              onChange={(e) => {
                setPage(1);
                setFilterTipo(e.target.value);
              }}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Todos los tipos</option>
              <option value="Boveda">Bóvedas</option>
              <option value="Nicho">Nichos</option>
              <option value="Mausoleo">Mausoleos</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="estado-filter"
              className="text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Estado
            </label>
            <select
              id="estado-filter"
              value={filterEstado}
              onChange={(e) => {
                setPage(1);
                setFilterEstado(e.target.value);
              }}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Todos los estados</option>
              <option value="disponible">Disponibles</option>
              <option value="ocupada">Ocupadas</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="propietario-filter"
              className="text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Propietario
            </label>
            <select
              id="propietario-filter"
              value={filterPropietario}
              onChange={(e) => {
                setPage(1);
                setFilterPropietario(e.target.value);
              }}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Todos</option>
              <option value="con">Con propietario</option>
              <option value="sin">Sin propietario</option>
            </select>
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
                <th scope="col" className="px-4 py-3">Número</th>
                <th scope="col" className="px-4 py-3">Bloque</th>
                <th scope="col" className="px-4 py-3">Piso</th>
                <th scope="col" className="px-4 py-3">Tipo</th>
                <th scope="col" className="px-4 py-3">Capacidad</th>
                <th scope="col" className="px-4 py-3">Propietario</th>
                <th scope="col" className="px-4 py-3 text-right">Precio</th>
                <th scope="col" className="px-4 py-3 text-right">Precio Arriendo</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
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
                      Cargando bóvedas…
                    </div>
                  </td>
                </tr>
              ) : bovedas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <i className="ti ti-box-off text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">No hay bóvedas registradas.</div>
                  </td>
                </tr>
              ) : (
                bovedas.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.numero}</td>
                    <td className="px-4 py-3 text-slate-600">{row.bloque?.nombre || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{row.piso?.numero || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{row.tipo || 'Bóveda'}</td>
                    <td className="px-4 py-3 text-slate-600">{row.capacidad}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.propietario
                        ? `${row.propietario.persona.nombre} ${row.propietario.persona.apellido}`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                      ${Number(row.precio).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                      ${Number(row.precioArrendamiento).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {(row.contratos?.length ?? 0) === 0 ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                          Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                          Ocupada
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/bovedas/${row.id}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                          title="Ver"
                        >
                          <i className="ti ti-eye" />
                        </Link>
                        <Link
                          href={`/bovedas/${row.id}/edit`}
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
              bóveda{meta.total === 1 ? '' : 's'}
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
