'use client';

import { useEffect, useState } from 'react';

interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
  fechaLectura: string | null;
  entidadTipo: string | null;
  entidadId: number | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const TIPO_ICON: Record<string, string> = {
  ContratoPorVencer: 'ti-calendar-exclamation',
  ContratoVencido: 'ti-alert-triangle',
  CuotaVencida: 'ti-coin-off',
  PagoRegistrado: 'ti-coin',
  Generico: 'ti-bell',
};

const TIPO_TONE: Record<string, string> = {
  ContratoPorVencer: 'bg-amber-50 text-amber-700 ring-amber-200',
  ContratoVencido: 'bg-red-50 text-red-700 ring-red-200',
  CuotaVencida: 'bg-red-50 text-red-700 ring-red-200',
  PagoRegistrado: 'bg-green-50 text-green-700 ring-green-200',
  Generico: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} minuto${mins > 1 ? 's' : ''}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} hora${hrs > 1 ? 's' : ''}`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
}

export default function NotifyPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'todas' | 'no-leidas' | 'leidas'>('todas');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (filter === 'no-leidas') params.set('leida', 'false');
      if (filter === 'leidas') params.set('leida', 'true');

      const res = await fetch(`/api/notificaciones?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Error al cargar notificaciones');
      const payload = await res.json();
      setNotificaciones((payload?.data ?? []) as Notificacion[]);
      setMeta((payload?.meta ?? null) as PaginationMeta | null);
    } catch {
      setNotificaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, filter]);

  const handleMarkRead = async (id: number) => {
    try {
      await fetch(`/api/notificaciones/${id}/leida`, {
        method: 'PATCH',
        credentials: 'same-origin',
      });
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true, fechaLectura: new Date().toISOString() } : n)),
      );
    } catch {
      // ignorar
    }
  };

  const handleMarkAllRead = async () => {
    for (const n of notificaciones) {
      if (!n.leida) {
        try {
          await fetch(`/api/notificaciones/${n.id}/leida`, {
            method: 'PATCH',
            credentials: 'same-origin',
          });
        } catch {
          // continuar
        }
      }
    }
    load();
  };

  const visiblePages = (() => {
    if (!meta) return [];
    const start = Math.max(1, meta.page - 2);
    const end = Math.min(meta.totalPages, meta.page + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notificaciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            Alertas del sistema sobre contratos, cuotas y vencimientos.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <i className="ti ti-checks" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {(['todas', 'no-leidas', 'leidas'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => { setPage(1); setFilter(f); }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'todas' ? 'Todas' : f === 'no-leidas' ? 'No leídas' : 'Leídas'}
          </button>
        ))}
      </div>

      {/* Lista */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        {loading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <svg className="h-6 w-6 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="px-5 py-16 text-center text-slate-400">
            <i className="ti ti-bell-off text-3xl text-slate-300" />
            <p className="mt-2 text-sm">No hay notificaciones.</p>
          </div>
        ) : (
          <ul>
            {notificaciones.map((n) => (
              <li
                key={n.id}
                className={`border-b border-slate-100 last:border-b-0 ${
                  !n.leida ? 'bg-primary-50/20' : ''
                }`}
              >
                <div className="flex items-start gap-3 px-5 py-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${
                      TIPO_TONE[n.tipo] ?? TIPO_TONE.Generico
                    }`}
                  >
                    <i className={`ti ${TIPO_ICON[n.tipo] ?? 'ti-bell'} text-sm`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700">{n.titulo}</p>
                      {!n.leida && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{n.mensaje}</p>
                    <p className="mt-1 text-xs text-slate-400">{timeAgo(n.fechaCreacion)}</p>
                  </div>
                  {!n.leida && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                    >
                      Marcar leída
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Paginación */}
      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            Página <strong className="text-slate-700">{meta.page}</strong> de{' '}
            <strong className="text-slate-700">{meta.totalPages}</strong>
            <span className="mx-1.5 text-slate-300">·</span>
            <strong className="text-slate-700">{meta.total}</strong>{' '}
            notificación{meta.total !== 1 ? 'es' : ''}
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
    </div>
  );
}
