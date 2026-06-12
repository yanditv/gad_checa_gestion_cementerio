'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderX,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { difuntosApi, mediaUrl, PaginationMeta } from '@/lib/api';
import { Avatar, DataTable, EmptyState, type DataTableColumn } from '@/components/ui';

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
  fotoUrl: string | null;
  boveda: { numero: string; bloque: { nombre: string } };
}

export default function DifuntosPage() {
  const [difuntos, setDifuntos] = useState<Difunto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtroNumeroIdentificacion, setFiltroNumeroIdentificacion] = useState('');
  const [filtroNombres, setFiltroNombres] = useState('');
  const [filtroApellidos, setFiltroApellidos] = useState('');
  const [filtroBoveda, setFiltroBoveda] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadDifuntos();
  }, [
    page,
    filtroNumeroIdentificacion,
    filtroNombres,
    filtroApellidos,
    filtroBoveda,
  ]);

  const loadDifuntos = async () => {
    setLoading(true);
    setError('');
    try {
      const search = [
        filtroNumeroIdentificacion,
        filtroNombres,
        filtroApellidos,
        filtroBoveda,
      ]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(' ');

      const result = await difuntosApi.findPage({ page, limit: 15, search });

      const rows = result.data.filter((row) => {
        const fullName = `${row.nombre} ${row.apellido}`.toLowerCase();
        const numero = (row.numeroIdentificacion || '').toLowerCase();
        const nombres = row.nombre.toLowerCase();
        const apellidos = row.apellido.toLowerCase();
        const boveda = `${row.boveda?.numero || ''} ${row.boveda?.bloque?.nombre || ''}`.toLowerCase();

        const numeroOk = !filtroNumeroIdentificacion.trim() || numero.includes(filtroNumeroIdentificacion.trim().toLowerCase());
        const nombresOk = !filtroNombres.trim() || nombres.includes(filtroNombres.trim().toLowerCase()) || fullName.includes(filtroNombres.trim().toLowerCase());
        const apellidosOk = !filtroApellidos.trim() || apellidos.includes(filtroApellidos.trim().toLowerCase()) || fullName.includes(filtroApellidos.trim().toLowerCase());
        const bovedaOk = !filtroBoveda.trim() || boveda.includes(filtroBoveda.trim().toLowerCase());

        return numeroOk && nombresOk && apellidosOk && bovedaOk;
      });

      setDifuntos(rows);
      setMeta(result.meta);
    } catch (error: any) {
      setError(error.message || 'No se pudieron cargar los difuntos');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setPage(1);
    setFiltroNumeroIdentificacion('');
    setFiltroNombres('');
    setFiltroApellidos('');
    setFiltroBoveda('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar este registro?')) return;

    setDeletingId(id);
    setError('');
    try {
      await difuntosApi.delete(id);
      if (difuntos.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadDifuntos();
      }
    } catch (error: any) {
      setError(error.message || 'No se pudo desactivar el difunto');
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

  const columns: DataTableColumn<Difunto>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      sortValue: (row) => `${row.apellido} ${row.nombre}`,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            src={mediaUrl(row.fotoUrl)}
            name={`${row.nombre} ${row.apellido}`}
            size="sm"
          />
          <span className="font-medium text-slate-900">
            {row.nombre} {row.apellido}
          </span>
        </div>
      ),
    },
    {
      key: 'numeroIdentificacion',
      header: 'Identificación',
      sortable: true,
      sortValue: (row) => row.numeroIdentificacion,
      cell: (row) => (
        <span className="text-slate-600">{row.numeroIdentificacion || '-'}</span>
      ),
    },
    {
      key: 'fechaDefuncion',
      header: 'Fecha Defunción',
      sortable: true,
      sortValue: (row) => row.fechaDefuncion,
      cell: (row) => (
        <span className="text-slate-600">
          {row.fechaDefuncion
            ? new Date(row.fechaDefuncion).toLocaleDateString()
            : '-'}
        </span>
      ),
    },
    {
      key: 'boveda',
      header: 'Bóveda',
      sortable: true,
      sortValue: (row) =>
        `${row.boveda?.numero || '-'} - ${row.boveda?.bloque?.nombre || '-'}`,
      cell: (row) => (
        <span className="text-slate-600">
          {`${row.boveda?.numero || '-'} - ${row.boveda?.bloque?.nombre || '-'}`}
        </span>
      ),
    },
    {
      key: 'causaMuerte',
      header: 'Causa Muerte',
      sortable: true,
      sortValue: (row) => row.causaMuerte,
      cell: (row) => (
        <span className="text-slate-600">{row.causaMuerte || '-'}</span>
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
            href={`/difuntos/${row.id}`}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
            title="Ver"
          >
            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
          <Link
            href={`/difuntos/${row.id}/edit`}
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
          <h1 className="text-2xl font-bold text-slate-900">Lista de Difuntos</h1>
          <p className="mt-1 text-sm text-slate-600">Gestión de difuntos registrados.</p>
        </div>
        <Link
          href="/difuntos/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Nuevo Difunto
        </Link>
      </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                type="search"
                placeholder="Número de identificación"
                value={filtroNumeroIdentificacion}
                onChange={(e) => {
                  setPage(1);
                  setFiltroNumeroIdentificacion(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <input
                type="search"
                placeholder="Nombres"
                value={filtroNombres}
                onChange={(e) => {
                  setPage(1);
                  setFiltroNombres(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <input
                type="search"
                placeholder="Apellidos"
                value={filtroApellidos}
                onChange={(e) => {
                  setPage(1);
                  setFiltroApellidos(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <input
                type="search"
                placeholder="Bóveda o bloque"
                value={filtroBoveda}
                onChange={(e) => {
                  setPage(1);
                  setFiltroBoveda(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Limpiar
            </button>
          </div>

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

        <DataTable
          columns={columns}
          rows={difuntos}
          rowKey={(row) => row.id}
          loading={loading}
          empty={
            <EmptyState
              icon={
                <FolderX
                  className="h-6 w-6"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              }
              title="No hay difuntos registrados."
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
              difunto{meta.total === 1 ? '' : 's'}
            </p>
            <nav className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(meta.page - 1)}
                disabled={!meta.hasPrevPage}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />{' '}
                Anterior
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
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente{' '}
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              </button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
}
