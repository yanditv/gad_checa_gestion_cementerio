'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { contratosApi } from '@/lib/api';

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
  const [meta, setMeta] = useState<PaginationMeta>();

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total de contratos" value={meta?.total ?? contratos.length} icon="ti-file-text" tone="primary" />
        <SummaryCard label="Contratos activos" value={contratosActivos} icon="ti-check-circle" tone="success" />
        <SummaryCard label="Renovaciones" value={contratosRenovados} icon="ti-repeat" tone="info" />
        <SummaryCard label="Por vencer" value={contratosPorVencer} icon="ti-alert-triangle" tone="warning" />
      </div>

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestión de contratos de arrendamiento de bóvedas y nichos.
          </p>
        </div>
        <Link
          href="/contratos/create"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <i className="ti ti-plus" />
          Nuevo contrato
        </Link>
      </div>

      {/* Tarjeta principal */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        {/* Filtros */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar por número, difunto o identificación…"
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
              htmlFor="estado-filter"
              className="text-xs font-medium uppercase tracking-wide text-slate-500"
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
            <i className="ti ti-x" /> Limpiar
          </button>
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3">Número</th>
                <th scope="col" className="px-4 py-3">Difunto</th>
                <th scope="col" className="px-4 py-3">Bóveda</th>
                <th scope="col" className="px-4 py-3">Propietario</th>
                <th scope="col" className="px-4 py-3 text-right">Monto</th>
                <th scope="col" className="px-4 py-3">Vigencia</th>
                <th scope="col" className="px-4 py-3">Tipo</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
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
                      Cargando contratos…
                    </div>
                  </td>
                </tr>
              ) : contratos.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <i className="ti ti-folder-x text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">
                      No hay contratos que coincidan con los filtros.
                    </div>
                  </td>
                </tr>
              ) : (
                contratos.map((row) => {
                  const e = estadoVisual(row);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                        {row.numeroSecuencial}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {`${row.difunto?.nombre ?? ''} ${row.difunto?.apellido ?? ''}`.trim()}
                        </div>
                        {row.difunto?.numeroIdentificacion && (
                          <div className="text-xs text-slate-400">
                            {row.difunto.numeroIdentificacion}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700">{row.boveda?.numero ?? '-'}</div>
                        <div className="text-xs text-slate-400">
                          {row.boveda?.bloque?.nombre ?? '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.boveda?.propietario?.persona
                          ? `${row.boveda.propietario.persona.nombre} ${row.boveda.propietario.persona.apellido}`
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-700">
                        {formatCurrency(row.montoTotal)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        <div>{formatDate(row.fechaInicio)}</div>
                        <div className="text-slate-400">→ {formatDate(row.fechaFin)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {row.esRenovacion ? (
                          <span className="inline-flex items-center rounded-full bg-info-50 px-2 py-0.5 text-xs font-medium text-info-600 ring-1 ring-info-200">
                            Renovación
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
                            Nuevo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${e.classes}`}
                        >
                          {e.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/contratos/${row.id}`}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                            title="Ver detalle"
                          >
                            <i className="ti ti-eye" />
                          </Link>
                          <Link
                            href={`/contratos/${row.id}/edit`}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
            <p className="text-xs text-slate-500">
              Página <strong className="text-slate-700">{meta.page}</strong> de{' '}
              <strong className="text-slate-700">{meta.totalPages}</strong>
              <span className="mx-1.5 text-slate-300">·</span>
              <strong className="text-slate-700">{meta.total}</strong>{' '}
              contrato{meta.total === 1 ? '' : 's'}
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

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: string;
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
          <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${tones[tone]}`}>
          <i className={`ti ${icon} text-xl`} />
        </span>
      </div>
    </div>
  );
}
