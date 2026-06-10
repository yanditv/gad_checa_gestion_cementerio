'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { inventarioCustodiosApi } from '@/lib/api';

interface Custodio {
  id: number;
  nombre: string;
  identificacion: string | null;
  cargo: string | null;
  estado: boolean;
}

export default function CustodiosPage() {
  const [custodios, setCustodios] = useState<Custodio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadCustodios();
  }, [includeInactive]);

  const loadCustodios = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await inventarioCustodiosApi.findAll(includeInactive);
      setCustodios(data);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los custodios');
    } finally {
      setLoading(false);
    }
  };

  const filtrados = useMemo(() => {
    const term = filtro.trim().toLowerCase();
    if (!term) return custodios;
    return custodios.filter(
      (c) =>
        c.nombre.toLowerCase().includes(term) ||
        (c.identificacion || '').toLowerCase().includes(term) ||
        (c.cargo || '').toLowerCase().includes(term),
    );
  }, [custodios, filtro]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar este custodio?')) return;

    setDeletingId(id);
    setError('');
    try {
      await inventarioCustodiosApi.delete(id);
      await loadCustodios();
    } catch (err: any) {
      setError(err.message || 'No se pudo desactivar el custodio');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Custodios</h1>
          <p className="mt-1 text-sm text-slate-500">
            Responsables de los bienes del inventario.
          </p>
        </div>
        <Link
          href="/inventario/custodios/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <i className="ti ti-plus" />
          Nuevo custodio
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="search"
              placeholder="Nombre, identificación o cargo"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-200"
              />
              Mostrar inactivos
            </label>
          </div>

          <button
            type="button"
            onClick={() => setFiltro('')}
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
                <th scope="col" className="px-4 py-3">Identificación</th>
                <th scope="col" className="px-4 py-3">Cargo</th>
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
                      Cargando custodios…
                    </div>
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    <i className="ti ti-folder-x text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">
                      No hay custodios registrados.
                    </div>
                  </td>
                </tr>
              ) : (
                filtrados.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.identificacion || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.cargo || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {row.estado ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/inventario/custodios/${row.id}/edit`}
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
      </section>
    </div>
  );
}
