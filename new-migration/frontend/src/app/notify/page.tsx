'use client';

import { useEffect, useState, type ComponentType } from 'react';
import {
  AlertTriangle,
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  CircleDollarSign,
  Coins,
  Loader2,
} from 'lucide-react';
import { Button, EmptyState, Pagination } from '@/components/ui';
import { notificacionesApi, PaginationMeta } from '@/lib/api';
import { timeAgo } from '@/lib/timeago';

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

type IconType = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

const TIPO_ICON: Record<string, IconType> = {
  ContratoPorVencer: CalendarClock,
  ContratoVencido: AlertTriangle,
  CuotaVencida: CircleDollarSign,
  PagoRegistrado: Coins,
  Generico: Bell,
};

const TIPO_TONE: Record<string, string> = {
  ContratoPorVencer: 'bg-amber-50 text-amber-700 ring-amber-200',
  ContratoVencido: 'bg-danger-50 text-danger-700 ring-danger-200',
  CuotaVencida: 'bg-danger-50 text-danger-700 ring-danger-200',
  PagoRegistrado: 'bg-success-50 text-success-700 ring-success-200',
  Generico: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function NotifyPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'todas' | 'no-leidas' | 'leidas'>('todas');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const leidaParam = filter === 'no-leidas' ? false : filter === 'leidas' ? true : undefined;
      const result = await notificacionesApi.findPage({ page, limit: 20, leida: leidaParam });
      setNotificaciones(result.data ?? []);
      setMeta(result.meta ?? null);
    } catch {
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, filter]);

  const handleMarkRead = async (id: number) => {
    try {
      await notificacionesApi.markRead(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true, fechaLectura: new Date().toISOString() } : n)),
      );
    } catch {
      // ignorar
    }
  };

  const handleMarkAllRead = async () => {
    const pendientes = notificaciones.filter((n) => !n.leida);
    await Promise.all(pendientes.map((n) => notificacionesApi.markRead(n.id)));
    load();
  };

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notificaciones</h1>
          <p className="mt-1 text-sm text-slate-600">
            Alertas del sistema sobre contratos, cuotas y vencimientos.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="h-4 w-4" aria-hidden="true" />}
            className="self-start"
          >
            Marcar todas como leídas
          </Button>
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
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'todas' ? 'Todas' : f === 'no-leidas' ? 'No leídas' : 'Leídas'}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* Lista */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        {loading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-hidden="true" />
          </div>
        ) : notificaciones.length === 0 ? (
          <EmptyState
            icon={<BellOff className="h-7 w-7" aria-hidden="true" />}
            title="No hay notificaciones."
          />
        ) : (
          <ul>
            {notificaciones.map((n) => {
              const Icon = TIPO_ICON[n.tipo] ?? Bell;
              return (
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
                      <Icon className="h-4 w-4" aria-hidden={true} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-700">{n.titulo}</p>
                        {!n.leida && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">{n.mensaje}</p>
                      <p className="mt-1 text-xs text-slate-600">{timeAgo(n.fechaCreacion)}</p>
                    </div>
                    {!n.leida && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkRead(n.id)}
                        className="shrink-0 text-primary-600 hover:bg-primary-50"
                      >
                        Marcar leída
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Paginación */}
      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          pageCount={meta.totalPages}
          total={meta.total}
          pageSize={20}
          onChange={setPage}
        />
      )}
    </div>
  );
}
