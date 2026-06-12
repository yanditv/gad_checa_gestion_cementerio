'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { bovedasApi, tiposEspacioApi, PaginationMeta, TipoEspacio } from '@/lib/api';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui';

interface Boveda {
  id: number;
  numero: string;
  capacidad: number;
  tipo: string | null;
  tipoEspacioId: number | null;
  tipoEspacio?: { id: number; nombre: string } | null;
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
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
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

  useEffect(() => {
    tiposEspacioApi
      .findAll()
      .then((tipos) => setTiposEspacio(Array.isArray(tipos) ? tipos : []))
      .catch(() => setTiposEspacio([]));
  }, []);

  const loadBovedas = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await bovedasApi.findPage({
        page,
        limit: 15,
        search: searchTerm.trim() || undefined,
        ...(filterTipo ? { tipoEspacioId: filterTipo } : {}),
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

  const columns: DataTableColumn<Boveda>[] = [
    {
      key: 'numero',
      header: 'Número',
      sortable: true,
      sortValue: (row) => row.numero,
      cell: (row) => (
        <span className="font-medium text-slate-900">{row.numero}</span>
      ),
    },
    {
      key: 'bloque',
      header: 'Bloque',
      sortable: true,
      sortValue: (row) => row.bloque?.nombre ?? null,
      cell: (row) => (
        <span className="text-slate-600">{row.bloque?.nombre || '-'}</span>
      ),
    },
    {
      key: 'piso',
      header: 'Piso',
      sortable: true,
      sortValue: (row) => row.piso?.numero ?? null,
      cell: (row) => (
        <span className="text-slate-600">{row.piso?.numero || '-'}</span>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      sortable: true,
      sortValue: (row) => row.tipoEspacio?.nombre ?? row.tipo ?? null,
      cell: (row) => (
        <span className="text-slate-600">
          {row.tipoEspacio?.nombre || row.tipo || '-'}
        </span>
      ),
    },
    {
      key: 'capacidad',
      header: 'Capacidad',
      sortable: true,
      sortValue: (row) => row.capacidad,
      cell: (row) => <span className="text-slate-600">{row.capacidad}</span>,
    },
    {
      key: 'propietario',
      header: 'Propietario',
      sortable: true,
      sortValue: (row) =>
        row.propietario
          ? `${row.propietario.persona.nombre} ${row.propietario.persona.apellido}`
          : null,
      cell: (row) => (
        <span className="text-slate-600">
          {row.propietario
            ? `${row.propietario.persona.nombre} ${row.propietario.persona.apellido}`
            : '-'}
        </span>
      ),
    },
    {
      key: 'precio',
      header: 'Precio',
      align: 'right',
      sortable: true,
      sortValue: (row) => Number(row.precio),
      cell: (row) => (
        <span className="whitespace-nowrap text-slate-700">
          ${Number(row.precio).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'precioArrendamiento',
      header: 'Precio Arriendo',
      align: 'right',
      sortable: true,
      sortValue: (row) => Number(row.precioArrendamiento),
      cell: (row) => (
        <span className="whitespace-nowrap text-slate-700">
          ${Number(row.precioArrendamiento).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      sortValue: (row) =>
        (row.contratos?.length ?? 0) === 0 ? 'Disponible' : 'Ocupada',
      cell: (row) =>
        (row.contratos?.length ?? 0) === 0 ? (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
            Disponible
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
            Ocupada
          </span>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cell: (row) => (
        <div className="inline-flex items-center gap-1 whitespace-nowrap">
          <Link
            href={`/bovedas/${row.id}`}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
            title="Ver"
          >
            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
          <Link
            href={`/bovedas/${row.id}/edit`}
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
          <h1 className="text-2xl font-bold text-slate-900">Lista de Bóvedas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Administración de bóvedas y nichos.
          </p>
        </div>
        <Link
          href="/bovedas/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Nueva Bóveda
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
              placeholder="Buscar bóvedas..."
              value={searchTerm}
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
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
              value={filterTipo}
              onChange={(e) => {
                setPage(1);
                setFilterTipo(e.target.value);
              }}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Todos los tipos</option>
              {tiposEspacio.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="estado-filter"
              className="text-xs font-medium uppercase tracking-wide text-slate-600"
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
              className="text-xs font-medium uppercase tracking-wide text-slate-600"
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

        <DataTable
          columns={columns}
          rows={bovedas}
          rowKey={(row) => row.id}
          loading={loading}
          empty={
            <EmptyState
              icon={
                <Package
                  className="h-6 w-6"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              }
              title="No hay bóvedas registradas."
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
              bóveda{meta.total === 1 ? '' : 's'}
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
