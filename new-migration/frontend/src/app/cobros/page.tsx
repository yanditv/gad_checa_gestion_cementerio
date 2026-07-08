'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Coins,
  Eye,
  FileText,
  FolderX,
  Loader2,
  Receipt,
  Search,
  TrendingUp,
} from 'lucide-react';
import { cuotasApi, pagosApi } from '@/lib/api';
import { Button, Modal, Select } from '@/components/ui';

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

interface ContratoAgrupado {
  contratoId: number;
  numeroSecuencial: string;
  difunto: string;
  cuotas: unknown[];
  totalPendiente: number;
}

export default function CobrosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'pendiente' | 'pagado'>('todos');
  const [selectedPago, setSelectedPago] = useState<any | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setError('');
      try {
        const [cuotas, pagosData] = await Promise.all([
          cuotasApi.pendientes(),
          pagosApi.findAll(),
        ]);
        // Los endpoints pueden devolver un array o una respuesta envuelta
        // ({ data, meta } vía el proxy /api); normalizamos a array.
        const toArray = (x: any) =>
          Array.isArray(x) ? x : (x?.data ?? x?.items ?? []);
        setPendientes(toArray(cuotas));
        setPagos(toArray(pagosData));
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar los cobros');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Agrupa cuotas por contrato para que el operador "cobre" en un solo paso.
  const contratosConPendientes = useMemo<ContratoAgrupado[]>(() => {
    const map = new Map<number, ContratoAgrupado>();
    for (const cuota of pendientes) {
      const contratoId = cuota.contratoId ?? cuota.contrato?.id;
      if (!contratoId) continue;
      const grupo: ContratoAgrupado = map.get(contratoId) ?? {
        contratoId,
        numeroSecuencial: cuota.contrato?.numeroSecuencial ?? `Contrato #${contratoId}`,
        difunto: cuota.contrato?.difunto
          ? `${cuota.contrato.difunto.nombre ?? ''} ${cuota.contrato.difunto.apellido ?? ''}`.trim()
          : '—',
        cuotas: [] as unknown[],
        totalPendiente: 0,
      };
      grupo.cuotas.push(cuota);
      grupo.totalPendiente += Number(cuota.monto ?? 0);
      map.set(contratoId, grupo);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.cuotas.length - a.cuotas.length,
    );
  }, [pendientes]);

  const contratosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contratosConPendientes.filter((item) => {
      if (estadoFiltro === 'pagado') return false;
      if (!term) return true;
      return (
        item.numeroSecuencial.toLowerCase().includes(term) ||
        item.difunto.toLowerCase().includes(term)
      );
    });
  }, [contratosConPendientes, search, estadoFiltro]);

  const pagosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pagos.filter((pago) => {
      if (estadoFiltro === 'pendiente') return false;
      if (!term) return true;
      return (
        String(pago.numeroRecibo || '').toLowerCase().includes(term) ||
        String(pago.metodoPago || '').toLowerCase().includes(term) ||
        String(pago.referencia || '').toLowerCase().includes(term)
      );
    });
  }, [pagos, search, estadoFiltro]);

  const totalPendiente = useMemo(
    () => contratosFiltrados.reduce((acc, item) => acc + item.totalPendiente, 0),
    [contratosFiltrados],
  );

  const totalPagado = useMemo(
    () => pagosFiltrados.reduce((acc, pago) => acc + Number(pago.monto ?? 0), 0),
    [pagosFiltrados],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-600">
        <div className="inline-flex items-center gap-2">
          <Loader2
            className="h-4 w-4 animate-spin text-primary-500"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="text-sm">Cargando…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cobros</h1>
          <p className="mt-1 text-sm text-slate-600">
            Contratos con cuotas pendientes y últimos pagos registrados.
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[minmax(18rem,28rem)_minmax(14rem,18rem)] md:items-end">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700" htmlFor="cobros-search">
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
                id="cobros-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por contrato, difunto o recibo..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-12 pr-3 text-sm text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>

          <div>
            <Select
              label="Estado"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value as 'todos' | 'pendiente' | 'pagado')}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'pendiente', label: 'Pendientes' },
                { value: 'pagado', label: 'Pagados' },
              ]}
              wrapperClassName="gap-1"
            />
          </div>
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryTile
          icon={<Clock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          label="Pendientes"
          value={String(contratosFiltrados.length)}
          tone="amber"
        />
        <SummaryTile
          icon={<Coins className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          label="Por cobrar"
          value={formatCurrency(totalPendiente)}
          tone="slate"
        />
        <SummaryTile
          icon={<TrendingUp className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          label="Pagado"
          value={formatCurrency(totalPagado)}
          tone="primary"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Contratos con cuotas pendientes */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Clock
                className="h-4 w-4 text-amber-500"
                strokeWidth={2}
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold text-slate-700">
                Contratos con cuotas pendientes
              </h3>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
              {contratosFiltrados.length}
            </span>
          </header>
          <div className="max-h-[34rem] overflow-y-auto p-4">
            {contratosFiltrados.length === 0 ? (
              <div className="rounded-lg border border-green-100 bg-green-50/70 px-4 py-5 text-center text-slate-600">
                <Check className="mx-auto h-7 w-7 text-green-500" strokeWidth={2} aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-green-800">
                  No hay cuotas vencidas pendientes.
                </p>
                <p className="mt-1 text-xs text-green-700">
                  Los contratos filtrados están al día.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {contratosFiltrados.map((c) => (
                  <li
                    key={c.contratoId}
                    className="rounded-lg border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="font-mono text-xs font-semibold text-slate-800">
                          {c.numeroSecuencial}
                        </strong>
                        <p className="mt-1 truncate text-sm font-medium text-slate-700">
                          {c.difunto}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                        {c.cuotas.length} cuota{c.cuotas.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-600">
                        Pendiente{' '}
                        <strong className="text-slate-900">
                          {formatCurrency(c.totalPendiente)}
                        </strong>
                      </p>
                      <Link
                        href={`/cobros/${c.contratoId}/cobrar`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                      >
                        <Coins className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                        Cobrar
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Últimos pagos */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Receipt
              className="h-4 w-4 text-primary-500"
              strokeWidth={2}
              aria-hidden="true"
            />
              <h3 className="text-sm font-semibold text-slate-700">
                Últimos pagos
              </h3>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
              {pagosFiltrados.length}
            </span>
          </header>
          <div className="max-h-[34rem] overflow-y-auto p-4">
            {pagosFiltrados.length === 0 ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-5 text-center text-slate-600">
                <FolderX className="mx-auto h-7 w-7 text-slate-300" strokeWidth={2} aria-hidden="true" />
                <p className="mt-2 text-sm font-medium">No hay pagos registrados.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {pagosFiltrados.slice(0, 20).map((pago) => (
                  <li
                    key={pago.id}
                    className="rounded-lg border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="font-mono text-xs font-semibold text-slate-800">
                          {pago.numeroRecibo}
                        </strong>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {formatDate(pago.fechaPago)} · {pago.metodoPago}
                        </p>
                        <p className="truncate text-xs text-slate-600">
                          {pago.referencia || 'Sin referencia'}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-slate-800">
                        {formatCurrency(pago.monto)}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPago(pago)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-primary-700"
                      >
                        <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                        Detalle
                      </button>
                      <a
                        href={`/api/pagos/${pago.id}/factura.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                      >
                        <FileText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                        Recibo
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <Modal
        open={selectedPago !== null}
        onClose={() => setSelectedPago(null)}
        title="Detalle del pago"
        description={selectedPago?.numeroRecibo}
        size="md"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setSelectedPago(null)}>
              Cerrar
            </Button>
            {selectedPago && (
              <a
                href={`/api/pagos/${selectedPago.id}/factura.pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-primary-700"
              >
                <FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Ver recibo
              </a>
            )}
          </>
        }
      >
        {selectedPago && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoField label="Fecha" value={formatDate(selectedPago.fechaPago)} />
            <InfoField label="Método" value={selectedPago.metodoPago || '—'} />
            <InfoField label="Monto" value={formatCurrency(selectedPago.monto)} />
            <InfoField label="Referencia" value={selectedPago.referencia || 'Sin referencia'} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'amber' | 'primary' | 'slate';
}) {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    primary: 'bg-primary-50 text-primary-700 ring-primary-200',
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
  }[tone];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${toneClass}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="truncate text-lg font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </section>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
