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
  X,
} from 'lucide-react';
import { bloquesApi, bovedasApi, tiposEspacioApi, PaginationMeta, TipoEspacio } from '@/lib/api';
import { getEstadoBoveda } from '@/lib/boveda-estado';
import { DataTable, EmptyState, Select, type DataTableColumn } from '@/components/ui';

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
  const [filterBloqueId, setFilterBloqueId] = useState('');
  const [bloques, setBloques] = useState<{ id: number; nombre: string; estado: boolean }[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();
  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    filterTipo !== '' ||
    filterEstado !== '' ||
    filterPropietario !== '' ||
    filterBloqueId !== '';

  useEffect(() => {
    loadBovedas();
  }, [page, searchTerm, filterEstado, filterTipo, filterPropietario, filterBloqueId]);

  useEffect(() => {
    bloquesApi.findPage({ page: 1, limit: 100 }).then((r) => {
      setBloques((r.data || []).filter((b: { estado: boolean }) => b.estado));
    }).catch(() => {});
  }, []);

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
        ...(filterBloqueId ? { bloqueId: Number(filterBloqueId) } : {}),
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

  const clearFilters = () => {
    setPage(1);
    setSearchTerm('');
    setFilterTipo('');
    setFilterEstado('');
    setFilterPropietario('');
    setFilterBloqueId('');
  };

  function calcVisiblePages() {
    if (!meta) return [];
    const start = Math.max(1, meta.page - 2);
    const end = Math.min(meta.totalPages, meta.page + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  const visiblePages = calcVisiblePages();

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
      sortValue: (row) => getEstadoBoveda(row.contratos).label,
      cell: (row) => {
        const estado = getEstadoBoveda(row.contratos);
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${estado.bg}`}>
            {estado.label}
          </span>
        );
      },
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
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-[minmax(16rem,24rem)_repeat(4,minmax(11rem,1fr))_auto] xl:items-end">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700" htmlFor="bovedas-search">
              <Search className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
              Buscar
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                id="bovedas-search"
                type="search"
                placeholder="Buscar bóvedas..."
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-12 pr-3 text-sm text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>

          <div>
            <Select
              label="Tipo"
              id="tipo-filter"
              value={filterTipo}
              onChange={(e) => {
                setPage(1);
                setFilterTipo(e.target.value);
              }}
              options={[
                { value: '', label: 'Todos los tipos' },
                ...tiposEspacio.map((tipo) => ({ value: tipo.id, label: tipo.nombre })),
              ]}
              wrapperClassName="gap-1"
            />
          </div>

          <div>
            <Select
              label="Estado"
              id="estado-filter"
              value={filterEstado}
              onChange={(e) => {
                setPage(1);
                setFilterEstado(e.target.value);
              }}
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'disponible', label: 'Disponibles' },
                { value: 'ocupada', label: 'Ocupadas' },
              ]}
              wrapperClassName="gap-1"
            />
          </div>

          <div>
            <Select
              label="Bloque"
              value={filterBloqueId}
              onChange={(e) => {
                setPage(1);
                setFilterBloqueId(e.target.value);
              }}
              options={[
                { value: '', label: 'Todos los bloques' },
                ...bloques.map((b) => ({ value: b.id, label: b.nombre })),
              ]}
              wrapperClassName="gap-1"
            />
          </div>

          <div>
            <Select
              label="Propietario"
              id="propietario-filter"
              value={filterPropietario}
              onChange={(e) => {
                setPage(1);
                setFilterPropietario(e.target.value);
              }}
              options={[
                { value: '', label: 'Todos' },
                { value: 'con', label: 'Con propietario' },
                { value: 'sin', label: 'Sin propietario' },
              ]}
              wrapperClassName="gap-1"
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-10 items-center justify-center gap-1.5 self-end rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Limpiar
          </button>
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
