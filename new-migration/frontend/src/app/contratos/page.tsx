'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Eye,
  FileText,
  FolderX,
  Loader2,
  Pencil,
  Plus,
  Repeat,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { contratosApi } from '@/lib/api';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui';

type EstadoFiltro = '' | 'activos' | 'porvencer' | 'vencidos' | 'inactivos';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Contrato {
  id: number;
  numeroSecuencial: string;
  fechaInicio: string;
  fechaFin: string | null;
  montoTotal: number | string;
  estado: boolean;
  esRenovacion: boolean;
  boveda: {
    numero: string;
    bloque: { nombre: string };
    propietario?: { persona: { nombre: string; apellido: string } } | null;
  };
  difunto: {
    nombre: string;
    apellido: string;
    numeroIdentificacion: string | null;
  };
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-EC');
}

function estadoVisual(row: Contrato): {
  label: string;
  classes: string;
} {
  if (!row.estado)
    return {
      label: 'Inactivo',
      classes: 'bg-slate-100 text-slate-600 ring-slate-200',
    };
  if (!row.fechaFin)
    return {
      label: 'Activo',
      classes: 'bg-green-50 text-green-700 ring-green-200',
    };
  const fin = new Date(row.fechaFin);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const en30 = new Date(hoy);
  en30.setDate(en30.getDate() + 30);
  if (fin < hoy)
    return {
      label: 'Vencido',
      classes: 'bg-red-50 text-red-700 ring-red-200',
    };
  if (fin <= en30)
    return {
      label: 'Por vencer',
      classes: 'bg-amber-50 text-amber-700 ring-amber-200',
    };
  return {
    label: 'Activo',
    classes: 'bg-green-50 text-green-700 ring-green-200',
  };
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estado, setEstado] = useState<EstadoFiltro>('');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '15',
        });
        if (searchTerm.trim()) params.set('search', searchTerm.trim());
        if (estado) params.set('estado', estado);

        const response = await fetch(`/api/contratos?${params.toString()}`, {
          signal: controller.signal,
          credentials: 'same-origin',
        });
        if (!response.ok) throw new Error('Error al cargar contratos');
        const payload = await response.json();
        if (cancelled) return;
        setContratos(payload.data || []);
        setMeta(payload.meta);
      } catch (err) {
        if (!cancelled && (err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los contratos');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [page, searchTerm, estado]);

  const visiblePages = (() => {
    if (!meta) return [];
    const start = Math.max(1, meta.page - 2);
    const end = Math.min(meta.totalPages, meta.page + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  const clearFilters = () => {
    setPage(1);
    setSearchTerm('');
    setEstado('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar este contrato?')) return;

    setDeletingId(id);
    setError('');
    try {
      await contratosApi.delete(id);
      if (contratos.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        const response = await fetch(`/api/contratos?page=${page}&limit=15${searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : ''}${estado ? `&estado=${estado}` : ''}`, {
          credentials: 'same-origin',
        });
        if (!response.ok) throw new Error('No se pudo refrescar la lista');
        const payload = await response.json();
        setContratos(payload.data || []);
        setMeta(payload.meta);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo desactivar el contrato');
    } finally {
      setDeletingId(null);
    }
  };

  const contratosActivos = contratos.filter((row) => estadoVisual(row).label === 'Activo').length;
  const contratosRenovados = contratos.filter((row) => row.esRenovacion).length;
  const contratosPorVencer = contratos.filter((row) => estadoVisual(row).label === 'Por vencer').length;

  const columns: DataTableColumn<Contrato>[] = [
    {
      key: 'numero',
      header: 'Número',
      sortable: true,
      sortValue: (row) => row.numeroSecuencial,
      cell: (row) => (
        <span className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
          {row.numeroSecuencial}
        </span>
      ),
    },
    {
      key: 'difunto',
      header: 'Difunto',
      sortable: true,
      sortValue: (row) =>
        `${row.difunto?.nombre ?? ''} ${row.difunto?.apellido ?? ''}`.trim(),
      cell: (row) => (
        <>
          <div className="font-medium text-slate-900">
            {`${row.difunto?.nombre ?? ''} ${row.difunto?.apellido ?? ''}`.trim()}
          </div>
          {row.difunto?.numeroIdentificacion && (
            <div className="text-xs text-slate-600">
              {row.difunto.numeroIdentificacion}
            </div>
          )}
        </>
      ),
    },
    {
      key: 'boveda',
      header: 'Bóveda',
      sortable: true,
      sortValue: (row) => row.boveda?.numero ?? null,
      cell: (row) => (
        <>
          <div className="text-slate-700">{row.boveda?.numero ?? '-'}</div>
          <div className="text-xs text-slate-600">
            {row.boveda?.bloque?.nombre ?? '-'}
          </div>
        </>
      ),
    },
    {
      key: 'propietario',
      header: 'Propietario',
      sortable: true,
      sortValue: (row) =>
        row.boveda?.propietario?.persona
          ? `${row.boveda.propietario.persona.nombre} ${row.boveda.propietario.persona.apellido}`
          : null,
      cell: (row) => (
        <span className="text-slate-600">
          {row.boveda?.propietario?.persona
            ? `${row.boveda.propietario.persona.nombre} ${row.boveda.propietario.persona.apellido}`
            : '-'}
        </span>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      sortable: true,
      sortValue: (row) => Number(row.montoTotal ?? 0),
      cell: (row) => (
        <span className="whitespace-nowrap font-medium text-slate-700">
          {formatCurrency(row.montoTotal)}
        </span>
      ),
    },
    {
      key: 'vigencia',
      header: 'Vigencia',
      sortable: true,
      sortValue: (row) => row.fechaInicio,
      cell: (row) => (
        <div className="whitespace-nowrap text-xs text-slate-500">
          <div>{formatDate(row.fechaInicio)}</div>
          <div className="text-slate-600">→ {formatDate(row.fechaFin)}</div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      sortable: true,
      sortValue: (row) => (row.esRenovacion ? 'Renovación' : 'Nuevo'),
      cell: (row) =>
        row.esRenovacion ? (
          <span className="inline-flex items-center rounded-full bg-info-50 px-2 py-0.5 text-xs font-medium text-info-600 ring-1 ring-info-200">
            Renovación
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
            Nuevo
          </span>
        ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      sortValue: (row) => estadoVisual(row).label,
      cell: (row) => {
        const e = estadoVisual(row);
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${e.classes}`}
          >
            {e.label}
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
            href={`/contratos/${row.id}`}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
          <Link
            href={`/contratos/${row.id}/edit`}
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
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total de contratos"
          value={meta?.total ?? contratos.length}
          icon={<FileText className="h-5 w-5" strokeWidth={2} aria-hidden="true" />}
          tone="primary"
        />
        <SummaryCard
          label="Contratos activos"
          value={contratosActivos}
          icon={<CircleCheck className="h-5 w-5" strokeWidth={2} aria-hidden="true" />}
          tone="success"
        />
        <SummaryCard
          label="Renovaciones"
          value={contratosRenovados}
          icon={<Repeat className="h-5 w-5" strokeWidth={2} aria-hidden="true" />}
          tone="info"
        />
        <SummaryCard
          label="Por vencer"
          value={contratosPorVencer}
          icon={<TriangleAlert className="h-5 w-5" strokeWidth={2} aria-hidden="true" />}
          tone="warning"
        />
      </div>

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestión de contratos de arrendamiento de bóvedas y nichos.
          </p>
        </div>
        <Link
          href="/contratos/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Nuevo contrato
        </Link>
      </div>

      {/* Tarjeta principal */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        {/* Filtros */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar por número, difunto o identificación…"
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
              htmlFor="estado-filter"
              className="text-xs font-medium uppercase tracking-wide text-slate-600"
            >
              Estado
            </label>
            <select
              id="estado-filter"
              value={estado}
              onChange={(e) => {
                setPage(1);
                setEstado(e.target.value as EstadoFiltro);
              }}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Todos</option>
              <option value="activos">Activos</option>
              <option value="porvencer">Por vencer (30 días)</option>
              <option value="vencidos">Vencidos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Limpiar
          </button>
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Tabla */}
        <DataTable
          columns={columns}
          rows={contratos}
          rowKey={(row) => row.id}
          loading={loading}
          empty={
            <EmptyState
              icon={<FolderX className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />}
              title="No hay contratos que coincidan con los filtros."
              compact
            />
          }
        />

        {/* Paginación */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
            <div className="flex items-center gap-4">
              <p className="text-xs text-slate-500">
                Página <strong className="text-slate-700">{meta.page}</strong> de{' '}
                <strong className="text-slate-700">{meta.totalPages}</strong>
                <span className="mx-1.5 text-slate-300">·</span>
                <strong className="text-slate-700">{meta.total}</strong>{' '}
                contrato{meta.total === 1 ? '' : 's'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Ir a:</span>
                <input
                  type="number"
                  min={1}
                  max={meta.totalPages}
                  value={pageInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPageInput(val);
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= meta.totalPages) {
                      setPage(parsed);
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseInt(pageInput, 10);
                    if (isNaN(parsed) || parsed < 1 || parsed > meta.totalPages) {
                      setPageInput(String(page));
                    }
                  }}
                  className="w-12 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-center text-xs text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <nav className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(meta.page - 1)}
                disabled={!meta.hasPrevPage}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /> Anterior
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
                Siguiente <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              </button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: 'primary' | 'success' | 'info' | 'warning';
}) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700 ring-primary-200',
    success: 'bg-green-50 text-green-700 ring-green-200',
    info: 'bg-info-50 text-info-700 ring-info-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  } as const;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
