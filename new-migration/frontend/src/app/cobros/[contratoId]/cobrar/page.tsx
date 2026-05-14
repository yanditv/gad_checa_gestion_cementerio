'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CuotaPreview {
  id: number;
  numero: number;
  fechaVencimiento: string;
  monto: number;
  diasVencido: number;
  mora: number;
  totalConMora: number;
}

interface ContratoResumen {
  id: number;
  numeroSecuencial: string;
  boveda: {
    numero: string;
    bloque: { nombre: string };
  };
  difunto: { nombre: string; apellido: string };
  responsables: {
    responsable: { persona: { nombre: string; apellido: string } };
  }[];
  tasaMoraDiaria: number;
}

interface CobroPreview {
  contrato: ContratoResumen;
  cuotas: CuotaPreview[];
  descuentos: { id: number; nombre: string; porcentaje: number }[];
  bancos: { id: number; nombre: string }[];
  tiposPago: string[];
}

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
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

export default function CobrarPage({
  params,
}: {
  params: Promise<{ contratoId: string }>;
}) {
  const { contratoId } = use(params);
  const router = useRouter();

  const [preview, setPreview] = useState<CobroPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    descuentoId: 0,
    metodoPago: 'Efectivo',
    bancoId: 0,
    referencia: '',
    observacion: '',
    fechaPago: today,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/pagos/cobro-preview?contratoId=${contratoId}`,
          { credentials: 'same-origin', cache: 'no-store' },
        );
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.message || 'No se pudo cargar el contrato');
        }
        const payload = await res.json();
        if (cancelled) return;
        const data = (payload?.data ?? payload) as CobroPreview;
        setPreview(data);
        // Pre-seleccionar todas las cuotas
        setSeleccionadas(new Set(data.cuotas.map((c) => c.id)));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [contratoId]);

  function toggleCuota(id: number, checked: boolean) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (!preview) return;
    if (checked) setSeleccionadas(new Set(preview.cuotas.map((c) => c.id)));
    else setSeleccionadas(new Set());
  }

  const cuotasSeleccionadas = useMemo(
    () => preview?.cuotas.filter((c) => seleccionadas.has(c.id)) ?? [],
    [preview, seleccionadas],
  );

  const subtotal = useMemo(
    () => round2(cuotasSeleccionadas.reduce((s, c) => s + c.totalConMora, 0)),
    [cuotasSeleccionadas],
  );

  const descuentoSeleccionado =
    preview?.descuentos.find((d) => d.id === Number(form.descuentoId)) ?? null;
  const descuentoPorcentaje = descuentoSeleccionado
    ? Number(descuentoSeleccionado.porcentaje)
    : 0;
  const montoDescuento = round2(subtotal * (descuentoPorcentaje / 100));
  const total = round2(subtotal - montoDescuento);

  const moraTotal = round2(
    cuotasSeleccionadas.reduce((s, c) => s + c.mora, 0),
  );

  const requiereBanco =
    form.metodoPago !== 'Efectivo' && form.metodoPago !== 'Tarjeta';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (cuotasSeleccionadas.length === 0) {
      setError('Selecciona al menos una cuota.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        contratoId: Number(contratoId),
        cuotasIds: cuotasSeleccionadas.map((c) => c.id),
        metodoPago: form.metodoPago,
        bancoId: form.bancoId ? Number(form.bancoId) : undefined,
        referencia: form.referencia || undefined,
        descuentoId: form.descuentoId ? Number(form.descuentoId) : undefined,
        observacion: form.observacion || undefined,
        fechaPago: form.fechaPago,
      };
      const res = await fetch('/api/pagos/cobrar', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'No se pudo registrar el cobro');
      }
      const pagoId = data.id ?? data.data?.id;
      router.push(pagoId ? `/pagos/${pagoId}` : '/cobros');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
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

  if (!preview) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Cobrar</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'No se pudo cargar la información del contrato.'}
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

  const responsablePrincipal =
    preview.contrato.responsables?.[0]?.responsable?.persona ?? null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cobrar contrato{' '}
            <span className="font-mono text-primary-600">
              {preview.contrato.numeroSecuencial}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Selecciona las cuotas a cobrar y registra el pago.
          </p>
        </div>
        <Link
          href="/cobros"
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" />
          Volver
        </Link>
      </div>

      {preview.cuotas.length === 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <i className="ti ti-circle-check mr-1" />
          Este contrato no tiene cuotas pendientes.
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      >
        {/* Cuotas + datos del pago */}
        <div className="space-y-6 lg:col-span-8">
          <Card title="Cuotas a cobrar">
            {preview.cuotas.length === 0 ? (
              <p className="text-sm text-slate-400">
                Sin cuotas pendientes.
              </p>
            ) : (
              <div className="overflow-x-auto -m-5">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="w-12 px-5 py-2.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-300"
                          checked={
                            seleccionadas.size === preview.cuotas.length
                          }
                          onChange={(e) => toggleAll(e.target.checked)}
                        />
                      </th>
                      <th className="px-5 py-2.5">Cuota</th>
                      <th className="px-5 py-2.5">Vencimiento</th>
                      <th className="px-5 py-2.5">Mora</th>
                      <th className="px-5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.cuotas.map((c) => {
                      const isVencida = c.diasVencido > 0;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-2.5">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-300"
                              checked={seleccionadas.has(c.id)}
                              onChange={(e) =>
                                toggleCuota(c.id, e.target.checked)
                              }
                            />
                          </td>
                          <td className="px-5 py-2.5 font-medium text-slate-700">
                            #{c.numero}
                            <div className="text-xs text-slate-400">
                              {formatCurrency(c.monto)}
                            </div>
                          </td>
                          <td className="px-5 py-2.5">
                            <div className="text-slate-700">
                              {formatDate(c.fechaVencimiento)}
                            </div>
                            {isVencida && (
                              <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-red-200">
                                {c.diasVencido} día{c.diasVencido === 1 ? '' : 's'}{' '}
                                vencida
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-2.5 text-amber-700">
                            {c.mora > 0 ? `+${formatCurrency(c.mora)}` : '—'}
                          </td>
                          <td className="px-5 py-2.5 text-right font-medium text-slate-700">
                            {formatCurrency(c.totalConMora)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {moraTotal > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                Mora calculada con tasa diaria{' '}
                <strong>
                  {(preview.contrato.tasaMoraDiaria * 100).toFixed(4)}%
                </strong>{' '}
                del cementerio.
              </p>
            )}
          </Card>

          <Card title="Datos del pago">
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={LABEL_CLS}>Método</label>
                <select
                  value={form.metodoPago}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, metodoPago: e.target.value }))
                  }
                  className={INPUT_CLS}
                >
                  {preview.tiposPago.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Fecha de pago</label>
                <input
                  type="date"
                  value={form.fechaPago}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fechaPago: e.target.value }))
                  }
                  required
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Descuento</label>
                <select
                  value={form.descuentoId}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      descuentoId: Number(e.target.value),
                    }))
                  }
                  className={INPUT_CLS}
                >
                  <option value={0}>Sin descuento</option>
                  {preview.descuentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} — {Number(d.porcentaje)}%
                    </option>
                  ))}
                </select>
              </div>
              {requiereBanco && preview.bancos.length > 0 && (
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Banco</label>
                  <select
                    value={form.bancoId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, bancoId: Number(e.target.value) }))
                    }
                    className={INPUT_CLS}
                  >
                    <option value={0}>Seleccionar…</option>
                    {preview.bancos.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className={requiereBanco ? '' : 'sm:col-span-2'}>
                <label className={LABEL_CLS}>Referencia / comprobante</label>
                <input
                  value={form.referencia}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, referencia: e.target.value }))
                  }
                  placeholder="Nº depósito, cheque o transacción"
                  className={INPUT_CLS}
                />
              </div>
              <div className="sm:col-span-3">
                <label className={LABEL_CLS}>Observación</label>
                <input
                  value={form.observacion}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, observacion: e.target.value }))
                  }
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Resumen lateral */}
        <div className="space-y-6 lg:col-span-4">
          <Card title="Contrato">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Número</dt>
                <dd className="font-mono font-semibold text-slate-700">
                  {preview.contrato.numeroSecuencial}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Bóveda</dt>
                <dd className="text-slate-700 text-right">
                  {preview.contrato.boveda?.numero}
                  <div className="text-xs text-slate-400">
                    {preview.contrato.boveda?.bloque?.nombre}
                  </div>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Difunto</dt>
                <dd className="text-slate-700 text-right">
                  {preview.contrato.difunto?.nombre}{' '}
                  {preview.contrato.difunto?.apellido}
                </dd>
              </div>
              {responsablePrincipal && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Responsable</dt>
                  <dd className="text-slate-700 text-right">
                    {responsablePrincipal.nombre}{' '}
                    {responsablePrincipal.apellido}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Resumen del cobro">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Cuotas seleccionadas</dt>
                <dd className="font-semibold text-slate-700">
                  {cuotasSeleccionadas.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="text-slate-700">{formatCurrency(subtotal)}</dd>
              </div>
              {moraTotal > 0 && (
                <div className="flex justify-between text-amber-700">
                  <dt>· Incluye mora</dt>
                  <dd>{formatCurrency(moraTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">
                  Descuento ({descuentoPorcentaje}%)
                </dt>
                <dd className="text-red-600">
                  −{formatCurrency(montoDescuento)}
                </dd>
              </div>
            </dl>
            <hr className="my-3 border-slate-100" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-500">Total a cobrar</span>
              <span className="text-xl font-bold text-primary-600">
                {formatCurrency(total)}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving || cuotasSeleccionadas.length === 0}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="ti ti-coin" />
              {saving ? 'Registrando…' : 'Registrar cobro'}
            </button>
          </Card>
        </div>
      </form>
    </div>
  );
}
