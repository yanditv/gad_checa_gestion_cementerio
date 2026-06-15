'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { bloquesApi, PaginationMeta } from '@/lib/api';
import {
  DataTable,
  EmptyState,
  type DataTableColumn,
} from '@/components/ui';

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
  const [filterTipo, setFilterTipo] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadBloques();
  }, [page, search, filterTipo]);

  const loadBloques = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await bloquesApi.findPage({
        page,
        limit: 15,
        search: search.trim() || undefined,
        ...(filterTipo ? { tipo: filterTipo } : {}),
      });
      setBloques(payload.data || []);
      setMeta(payload.meta);
    } catch (error: any) {
      setError(error.message || 'No se pudieron cargar los bloques');
    } finally {
      setLoading(false);
    }
  };

  function limpiarFiltros() {
    setSearch('');
    setFilterTipo('');
    setPage(1);
  }

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

  const columns: DataTableColumn<Bloque>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      sortValue: (row) => row.nombre,
      cell: (row) => (
        <span className="font-medium text-slate-900">{row.nombre}</span>
      ),
    },
    {
      key: 'cementerio',
      header: 'Cementerio',
      sortable: true,
      sortValue: (row) => row.cementerio?.nombre ?? null,
      cell: (row) => (
        <span className="text-slate-600">{row.cementerio?.nombre || '-'}</span>
      ),
    },
    {
      key: 'pisos',
      header: 'Pisos',
      sortable: true,
      sortValue: (row) => row.pisos?.length ?? 0,
      cell: (row) => (
        <span className="text-slate-600">{row.pisos?.length ?? 0}</span>
      ),
    },
    {
      key: 'bovedas',
      header: 'Bóvedas',
      sortable: true,
      sortValue: (row) => row.bovedas?.length ?? 0,
      cell: (row) => (
        <span className="text-slate-600">{row.bovedas?.length ?? 0}</span>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      sortable: true,
      sortValue: (row) => row.descripcion ?? null,
      cell: (row) => (
        <span className="text-slate-600">{row.descripcion || '-'}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      sortValue: (row) => (row.estado ? 'Activo' : 'Inactivo'),
      cell: (row) =>
        row.estado ? (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            Inactivo
          </span>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cellClassName: 'whitespace-nowrap',
      cell: (row) => (
        <div className="inline-flex items-center gap-1">
          <Link
            href={`/bloques/${row.id}`}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
            title="Ver"
          >
            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
          <Link
            href={`/bloques/${row.id}/edit`}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
            title="Editar"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            disabled={deletingId === row.id}
            className="rounded-md p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
            title="Eliminar"
          >
            {deletingId === row.id ? (
              <Loader2
                className="h-4 w-4 animate-spin"
                strokeWidth={2}
                aria-hidden="true"
              />
            ) : (
              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lista de Bloques</h1>
          <p className="mt-1 text-sm text-slate-600">
            Administración de bloques del cementerio.
          </p>
        </div>
        <Link
          href="/bloques/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Nuevo Bloque
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar bloques..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div className="sm:w-56">
            <select
              aria-label="Filtrar por tipo de bloque"
              value={filterTipo}
              onChange={(e) => {
                setPage(1);
                setFilterTipo(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Tipo de bloque: Todos</option>
              <option value="Nichos">Nichos</option>
              <option value="Bovedas">Bovedas</option>
            </select>
          </div>
          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={!search && !filterTipo}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar filtros
          </button>
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={bloques}
          rowKey={(row) => row.id}
          loading={loading}
          empty={
            <EmptyState
              icon={
                <Layers
                  className="h-6 w-6"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              }
              title="No hay bloques registrados."
              compact
            />
          }
        />

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
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft
                  className="h-3.5 w-3.5"
                  strokeWidth={2}
                  aria-hidden="true"
                />{' '}
                Anterior
              </button>
              {visiblePages.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    p === meta.page
                      ? 'bg-primary-600 text-white'
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
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente{' '}
                <ChevronRight
                  className="h-3.5 w-3.5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
}
