'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { personasApi, PaginationMeta } from '@/lib/api';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui';

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  numeroIdentificacion: string;
  email: string | null;
  telefono: string | null;
  tipoPersona: string;
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadPersonas();
  }, [tipo, page, search]);

  const loadPersonas = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await personasApi.findPage({
        page,
        limit: 15,
        search,
        tipo: tipo || undefined,
      });
      setPersonas(result.data);
      setMeta(result.meta);
    } catch (error: any) {
      setError(error.message || 'No se pudieron cargar las personas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar esta persona?')) return;

    setDeletingId(id);
    setError('');
    try {
      await personasApi.delete(id);
      if (personas.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadPersonas();
      }
    } catch (error: any) {
      setError(error.message || 'No se pudo desactivar la persona');
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

  const columns: DataTableColumn<Persona>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      sortValue: (row) => `${row.nombre} ${row.apellido}`,
      cell: (row) => (
        <span className="font-medium text-slate-900">
          {row.nombre} {row.apellido}
        </span>
      ),
    },
    {
      key: 'identificacion',
      header: 'Identificación',
      sortable: true,
      sortValue: (row) => row.numeroIdentificacion,
      cell: (row) => (
        <span className="text-slate-600">{row.numeroIdentificacion}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      sortValue: (row) => row.email,
      cell: (row) => <span className="text-slate-600">{row.email || '-'}</span>,
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      sortable: true,
      sortValue: (row) => row.telefono,
      cell: (row) => (
        <span className="text-slate-600">{row.telefono || '-'}</span>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      sortable: true,
      sortValue: (row) => row.tipoPersona,
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
          {row.tipoPersona}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      width: 'w-32',
      cell: (row) => (
        <div className="inline-flex items-center gap-1">
          <Link
            href={`/personas/${row.id}`}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
            title="Ver"
          >
            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
          <Link
            href={`/personas/${row.id}/edit`}
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lista de Personas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestión de propietarios y responsables.
          </p>
        </div>
        <Link
          href="/personas/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Nueva Persona
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
              placeholder="Buscar personas..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="tipo-filter"
              className="text-xs font-medium uppercase tracking-wide text-slate-600"
            >
              Tipo
            </label>
            <select
              id="tipo-filter"
              value={tipo}
              onChange={(e) => {
                setPage(1);
                setTipo(e.target.value);
              }}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Todos los tipos</option>
              <option value="Propietario">Propietarios</option>
              <option value="Responsable">Responsables</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={personas}
          rowKey={(row) => row.id}
          loading={loading}
          empty={
            <EmptyState
              icon={
                <Users
                  className="h-6 w-6"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              }
              title="No hay personas registradas."
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
              persona{meta.total === 1 ? '' : 's'}
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
