'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Pago {
  id: number;
  numeroRecibo: string;
  monto: number | string;
  montoSubtotal?: number | string | null;
  montoDescuento?: number | string | null;
  fechaPago: string;
  metodoPago: string;
  referencia?: string | null;
  observacion?: string | null;
  estado: boolean;
  banco?: { id: number; nombre: string } | null;
  descuento?: { id: number; nombre: string; porcentaje: number } | null;
  usuarioCreador?: { nombre: string; apellido: string } | null;
  usuarioEliminador?: { nombre: string; apellido: string } | null;
  cuotas: {
    cuota: {
      id: number;
      numero: number;
      monto: number | string;
      fechaVencimiento: string;
      contrato?: {
        id: number;
        numeroSecuencial: string;
        difunto?: { nombre: string; apellido: string };
        boveda?: {
          numero: string;
          bloque?: { nombre: string };
        };
      };
    };
  }[];
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

function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      {title && (
        <header className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function PagoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [pago, setPago] = useState<Pago | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anulando, setAnulando] = useState(false);
  const [confirmAnular, setConfirmAnular] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [pagoRes, meRes] = await Promise.all([
          fetch(`/api/pagos/${id}`, {
            credentials: 'same-origin',
            cache: 'no-store',
          }),
          fetch('/api/auth/me', {
            credentials: 'same-origin',
            cache: 'no-store',
          }),
        ]);
        if (!pagoRes.ok) {
          const payload = await pagoRes.json().catch(() => ({}));
          throw new Error(payload.message || 'No se pudo cargar el pago');
        }
        const payload = await pagoRes.json();
        if (cancelled) return;
        setPago((payload?.data ?? payload) as Pago);

        if (meRes.ok) {
          const me = await meRes.json();
          setRoles(me?.data?.roles ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleAnular() {
    setAnulando(true);
    setError(null);
    try {
      const res = await fetch(`/api/pagos/${id}/anular`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo anular el pago');
      }
      router.refresh();
      // Recargar
      const reload = await fetch(`/api/pagos/${id}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const payload = await reload.json();
      setPago((payload?.data ?? payload) as Pago);
      setConfirmAnular(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setAnulando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <svg
          className="h-6 w-6 animate-spin text-primary-500"
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
      </div>
    );
  }

  if (!pago) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Pago</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'No se pudo cargar el pago.'}
        </div>
        <Link
          href="/cobros"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" />
          Volver
        </Link>
      </div>
    );
  }

  const puedeAnular =
    pago.estado && (roles.includes('Administrador') || roles.includes('Admin'));
  const contrato = pago.cuotas[0]?.cuota?.contrato;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Recibo{' '}
            <span className="font-mono text-primary-600">
              {pago.numeroRecibo}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Detalle del pago registrado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/pagos/${id}/factura.pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-file-type-pdf" />
            Factura PDF
          </a>
          {puedeAnular && (
            <button
              type="button"
              onClick={() => setConfirmAnular(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <i className="ti ti-ban" />
              Anular
            </button>
          )}
          <Link
            href="/cobros"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-arrow-left" />
            Volver
          </Link>
        </div>
      </div>

      {!pago.estado && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <i className="ti ti-ban mr-1" />
          <strong>Pago anulado.</strong> Las cuotas asociadas fueron revertidas
          a pendientes.
          {pago.usuarioEliminador && (
            <> Anulado por {pago.usuarioEliminador.nombre}{' '}
              {pago.usuarioEliminador.apellido}.</>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cuotas cubiertas */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Cuotas cubiertas">
            <div className="overflow-x-auto -m-5">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2.5">Contrato</th>
                    <th className="px-5 py-2.5">Cuota</th>
                    <th className="px-5 py-2.5">Vencimiento</th>
                    <th className="px-5 py-2.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pago.cuotas.map((cp) => {
                    const c = cp.cuota;
                    return (
                      <tr key={c.id}>
                        <td className="px-5 py-2.5">
                          {c.contrato ? (
                            <Link
                              href={`/contratos/${c.contrato.id}`}
                              className="font-mono text-xs font-semibold text-primary-600 hover:underline"
                            >
                              {c.contrato.numeroSecuencial}
                            </Link>
                          ) : (
                            '—'
                          )}
                          {c.contrato?.difunto && (
                            <div className="text-xs text-slate-400">
                              {c.contrato.difunto.nombre}{' '}
                              {c.contrato.difunto.apellido}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-2.5 font-medium text-slate-700">
                          #{c.numero}
                        </td>
                        <td className="px-5 py-2.5 text-slate-600">
                          {formatDate(c.fechaVencimiento)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-medium text-slate-700">
                          {formatCurrency(c.monto)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {contrato && (
            <Card title="Contrato asociado">
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Número
                  </dt>
                  <dd className="mt-0.5 font-mono font-semibold text-slate-700">
                    {contrato.numeroSecuencial}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Difunto
                  </dt>
                  <dd className="mt-0.5 text-slate-700">
                    {contrato.difunto?.nombre} {contrato.difunto?.apellido}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Bóveda
                  </dt>
                  <dd className="mt-0.5 text-slate-700">
                    {contrato.boveda?.numero}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Bloque
                  </dt>
                  <dd className="mt-0.5 text-slate-700">
                    {contrato.boveda?.bloque?.nombre}
                  </dd>
                </div>
              </dl>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Resumen">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="text-slate-700">
                  {formatCurrency(pago.montoSubtotal ?? pago.monto)}
                </dd>
              </div>
              {pago.descuento && pago.montoDescuento && (
                <div className="flex justify-between text-red-600">
                  <dt>
                    Descuento ({Number(pago.descuento.porcentaje)}%)
                  </dt>
                  <dd>−{formatCurrency(pago.montoDescuento)}</dd>
                </div>
              )}
              <hr className="border-slate-100" />
              <div className="flex items-baseline justify-between">
                <dt className="text-sm font-semibold text-slate-700">Total</dt>
                <dd className="text-xl font-bold text-primary-600">
                  {formatCurrency(pago.monto)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Método de pago">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Método</dt>
                <dd className="font-semibold text-slate-700">
                  {pago.metodoPago}
                </dd>
              </div>
              {pago.banco && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Banco</dt>
                  <dd className="text-slate-700">{pago.banco.nombre}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Fecha</dt>
                <dd className="text-slate-700">{formatDate(pago.fechaPago)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Referencia</dt>
                <dd className="text-slate-700 text-right">
                  {pago.referencia || '—'}
                </dd>
              </div>
              {pago.observacion && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Observación
                  </dt>
                  <dd className="mt-0.5 text-slate-700">{pago.observacion}</dd>
                </div>
              )}
            </dl>
          </Card>

          {pago.usuarioCreador && (
            <Card title="Auditoría">
              <p className="text-sm text-slate-600">
                Registrado por{' '}
                <strong>
                  {pago.usuarioCreador.nombre} {pago.usuarioCreador.apellido}
                </strong>
                .
              </p>
              {pago.usuarioEliminador && (
                <p className="mt-1 text-sm text-red-600">
                  Anulado por{' '}
                  <strong>
                    {pago.usuarioEliminador.nombre}{' '}
                    {pago.usuarioEliminador.apellido}
                  </strong>
                  .
                </p>
              )}
            </Card>
          )}
        </div>
      </div>

      {confirmAnular && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget && !anulando) setConfirmAnular(false);
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white shadow-lifted">
            <header className="border-b border-slate-100 px-5 py-3">
              <h3 className="text-base font-semibold text-slate-800">
                Anular pago
              </h3>
            </header>
            <div className="p-5 text-sm text-slate-600">
              <p>
                ¿Confirmas la anulación del recibo{' '}
                <strong>{pago.numeroRecibo}</strong>? Las cuotas asociadas
                volverán a estar pendientes.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Esta operación queda registrada con tu usuario y no se puede
                deshacer.
              </p>
            </div>
            <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setConfirmAnular(false)}
                disabled={anulando}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAnular}
                disabled={anulando}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                {anulando ? 'Anulando…' : 'Anular pago'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
