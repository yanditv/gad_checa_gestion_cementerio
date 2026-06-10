'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type PlanCuota = 'unico' | 'mensual' | 'trimestral' | 'semestral' | 'anual';

const PLAN_OPTIONS: { value: PlanCuota; label: string }[] = [
  { value: 'unico', label: 'Pago único (al contado)' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual (paridad legado)' },
];

interface MetadataResponse {
  descuentos: { id: number; nombre: string; porcentaje: number }[];
  bancos: { id: number; nombre: string }[];
  tiposPago: string[];
}

interface OrigenResumen {
  id: number;
  numeroSecuencial: string;
  vecesRenovado: number;
  estado: boolean;
  fechaFin: string | null;
  boveda: {
    id: number;
    numero: string;
    tipo: string | null;
    precioArrendamiento: number | string;
    bloque: {
      nombre: string;
      cementerio: {
        nombre: string;
        vecesRenovacionBovedas: number;
        vecesRenovacionNicho: number;
      };
    };
  };
  difunto: {
    nombre: string;
    apellido: string;
    numeroIdentificacion: string | null;
  };
  responsables: {
    responsable: {
      id: number;
      personaId: number;
      parentesco: string | null;
      persona: { nombre: string; apellido: string; numeroIdentificacion: string };
    };
  }[];
}

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value ?? 0));
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

export default function RenovarContratoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const today = toInputDate(new Date());

  const [origen, setOrigen] = useState<OrigenResumen | null>(null);
  const [metadata, setMetadata] = useState<MetadataResponse>({
    descuentos: [],
    bancos: [],
    tiposPago: ['Efectivo', 'Transferencia', 'Banco'],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [nuevoNumeroSecuencial, setNuevoNumeroSecuencial] = useState<string>('');

  const [form, setForm] = useState({
    fechaInicio: today,
    numeroDeMeses: 5,
    descuentoId: 0,
    observaciones: '',
    plan: 'anual' as PlanCuota,
    tipoPago: 'Efectivo',
    bancoId: 0,
    numeroComprobante: '',
    observacion: '',
    fechaPago: today,
    pagarAlContado: false,
    responsablesPersonaIds: [] as number[],
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [origenRes, metaRes] = await Promise.all([
          fetch(`/api/contratos/${id}`, {
            credentials: 'same-origin',
            cache: 'no-store',
          }),
          fetch('/api/contratos/create-metadata', {
            credentials: 'same-origin',
            cache: 'no-store',
          }),
        ]);
        if (!origenRes.ok) throw new Error('No se pudo cargar el contrato origen');
        const origenJson = await origenRes.json();
        const metaJson = metaRes.ok ? await metaRes.json() : null;
        if (cancelled) return;
        const origenData = (origenJson?.data ?? origenJson) as OrigenResumen;
        setOrigen(origenData);
        if (metaJson) setMetadata(metaJson);
        setForm((prev) => ({
          ...prev,
          responsablesPersonaIds: origenData.responsables.map(
            (r) => r.responsable.personaId,
          ),
        }));

        if (origenData?.boveda?.id) {
          try {
            const previewRes = await fetch(`/api/contratos/numero-secuencial?bovedaId=${origenData.boveda.id}&isRenovacion=true`, {
              credentials: 'same-origin',
              cache: 'no-store',
            });
            if (previewRes.ok) {
              const previewJson = await previewRes.json();
              setNuevoNumeroSecuencial(previewJson?.numeroSecuencial || '');
            }
          } catch (e) {
            console.error('Error loading new sequential contract number preview:', e);
          }
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

  const maxRenovaciones = (() => {
    if (!origen) return 0;
    const tipo = (origen.boveda.tipo || '').toLowerCase();
    return tipo.includes('nicho')
      ? origen.boveda.bloque.cementerio.vecesRenovacionNicho
      : origen.boveda.bloque.cementerio.vecesRenovacionBovedas;
  })();
  const puedeRenovar = origen ? origen.vecesRenovado + 1 <= maxRenovaciones : false;

  const subtotal = Number(origen?.boveda?.precioArrendamiento ?? 0);
  const descuento =
    metadata.descuentos.find((d) => d.id === Number(form.descuentoId)) ?? null;
  const descuentoPorcentaje = descuento ? Number(descuento.porcentaje) : 0;
  const montoDescuento = round2(subtotal * (descuentoPorcentaje / 100));
  const montoTotal = round2(subtotal - montoDescuento);

  const cuotasPreview = (() => {
    const years = Number(form.numeroDeMeses) || 0;
    if (years <= 0 || montoTotal <= 0) return [];
    if (form.plan === 'unico') {
      return [
        { numero: 1, monto: montoTotal, fechaVencimiento: form.fechaInicio },
      ];
    }
    const totalCuotas =
      form.plan === 'mensual'
        ? years * 12
        : form.plan === 'trimestral'
          ? years * 4
          : form.plan === 'semestral'
            ? years * 2
            : years;
    const mesesEntreCuotas =
      form.plan === 'mensual'
        ? 1
        : form.plan === 'trimestral'
          ? 3
          : form.plan === 'semestral'
            ? 6
            : 12;
    const cuotaBase = round2(montoTotal / totalCuotas);
    let acumulado = 0;
    const base = new Date(form.fechaInicio);
    return Array.from({ length: totalCuotas }, (_, i) => {
      const isUltima = i === totalCuotas - 1;
      const monto = isUltima ? round2(montoTotal - acumulado) : cuotaBase;
      acumulado += monto;
      const venc = new Date(base);
      venc.setMonth(venc.getMonth() + (i + 1) * mesesEntreCuotas);
      return {
        numero: i + 1,
        monto,
        fechaVencimiento: toInputDate(venc),
      };
    });
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origen) return;
    if (!puedeRenovar) {
      setError('Este contrato ya alcanzó el máximo de renovaciones.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        fechaInicio: form.fechaInicio,
        numeroDeMeses: Number(form.numeroDeMeses),
        descuentoId: form.descuentoId ? Number(form.descuentoId) : undefined,
        observaciones: form.observaciones || undefined,
        responsablesPersonaIds:
          form.responsablesPersonaIds.length > 0
            ? form.responsablesPersonaIds
            : undefined,
        pago: {
          plan: form.plan,
          tipoPago: form.tipoPago,
          bancoId: form.bancoId ? Number(form.bancoId) : undefined,
          numeroComprobante: form.numeroComprobante || undefined,
          observacion: form.observacion || undefined,
          fechaPago: form.fechaPago,
          cuotasSeleccionadas: form.pagarAlContado
            ? cuotasPreview.map((c) => c.numero)
            : [],
        },
      };
      const res = await fetch(`/api/contratos/${id}/renovar`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo renovar el contrato');
      }
      router.push(`/contratos/${data.id ?? data.data?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (!origen) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Renovar contrato</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'No se pudo cargar el contrato.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Renovar contrato{' '}
            <span className="font-mono text-primary-600">
              {origen.numeroSecuencial}
            </span>
            {nuevoNumeroSecuencial && (
              <>
                <span className="text-slate-400 mx-2">→</span>
                <span className="font-mono text-green-600">
                  Nuevo: {nuevoNumeroSecuencial}
                </span>
              </>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Crea una renovación heredando bóveda, difunto y responsables del
            contrato actual.
          </p>
        </div>
        <Link
          href={`/contratos/${id}`}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" />
          Volver
        </Link>
      </div>

      {!puedeRenovar && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <i className="ti ti-alert-triangle mr-1" />
          Este contrato ya alcanzó el máximo de{' '}
          <strong>{maxRenovaciones}</strong> renovación(es) permitido por el
          cementerio. No se puede renovar nuevamente.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Formulario */}
        <div className="space-y-6 lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card title="Datos del nuevo contrato">
              {error && (
                <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLS}>Fecha de inicio</label>
                  <input
                    type="date"
                    required
                    value={form.fechaInicio}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fechaInicio: e.target.value }))
                    }
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Años de duración</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.numeroDeMeses}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        numeroDeMeses: Number(e.target.value),
                      }))
                    }
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
                    {metadata.descuentos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} — {Number(d.porcentaje)}%
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Plan de cuotas</label>
                  <select
                    value={form.plan}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, plan: e.target.value as PlanCuota }))
                    }
                    className={INPUT_CLS}
                  >
                    {PLAN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Observaciones</label>
                  <textarea
                    rows={2}
                    value={form.observaciones}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, observaciones: e.target.value }))
                    }
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            </Card>

            <Card title="Pago">
              <label className="mb-3 flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.pagarAlContado}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, pagarAlContado: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-300"
                />
                <span>
                  Marcar todas las cuotas como pagadas al crear (cobro al
                  contado)
                </span>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={LABEL_CLS}>Método</label>
                  <select
                    value={form.tipoPago}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, tipoPago: e.target.value }))
                    }
                    className={INPUT_CLS}
                  >
                    {metadata.tiposPago.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Comprobante / referencia</label>
                  <input
                    value={form.numeroComprobante}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        numeroComprobante: e.target.value,
                      }))
                    }
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Fecha de pago</label>
                  <input
                    type="date"
                    value={form.fechaPago}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fechaPago: e.target.value }))
                    }
                    className={INPUT_CLS}
                  />
                </div>
                {form.tipoPago !== 'Efectivo' && metadata.bancos.length > 0 && (
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
                      {metadata.bancos.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="sm:col-span-3">
                  <label className={LABEL_CLS}>Observación del pago</label>
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

            <div className="flex justify-end gap-2">
              <Link
                href={`/contratos/${id}`}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving || !puedeRenovar}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className="ti ti-copy" />
                {saving ? 'Renovando…' : 'Crear renovación'}
              </button>
            </div>
          </form>
        </div>

        {/* Resumen lateral */}
        <div className="space-y-6 lg:col-span-5">
          <Card title="Contrato a renovar">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Número</dt>
                <dd className="font-mono font-semibold text-slate-700">
                  {origen.numeroSecuencial}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Bóveda</dt>
                <dd className="text-slate-700">
                  {origen.boveda.numero} · {origen.boveda.bloque.nombre}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tipo</dt>
                <dd className="text-slate-700">
                  {origen.boveda.tipo || 'Bóveda'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Difunto</dt>
                <dd className="text-slate-700">
                  {origen.difunto.nombre} {origen.difunto.apellido}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Renovaciones previas</dt>
                <dd className="text-slate-700">
                  {origen.vecesRenovado} de {maxRenovaciones}
                </dd>
              </div>
            </dl>

            <hr className="my-3 border-slate-100" />

            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">
                  Descuento ({descuentoPorcentaje}%)
                </dt>
                <dd className="text-red-600">−{formatCurrency(montoDescuento)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(montoTotal)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Responsables heredados">
            {origen.responsables.length === 0 ? (
              <p className="text-sm text-slate-400">
                El contrato origen no tiene responsables registrados.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {origen.responsables.map((r) => (
                  <li key={r.responsable.id}>
                    <div className="flex items-baseline gap-2">
                      <i className="ti ti-user text-slate-400" />
                      <strong className="text-slate-800">
                        {r.responsable.persona.nombre}{' '}
                        {r.responsable.persona.apellido}
                      </strong>
                    </div>
                    <div className="ml-5 text-xs text-slate-500">
                      {r.responsable.persona.numeroIdentificacion}
                      {r.responsable.parentesco
                        ? ` · ${r.responsable.parentesco}`
                        : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {cuotasPreview.length > 0 && (
            <Card title={`Plan calculado · ${cuotasPreview.length} cuota(s)`}>
              <div className="overflow-x-auto -m-5">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-2">#</th>
                      <th className="px-5 py-2">Vencimiento</th>
                      <th className="px-5 py-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cuotasPreview.slice(0, 12).map((c) => (
                      <tr key={c.numero}>
                        <td className="px-5 py-2 font-medium text-slate-700">
                          {c.numero}
                        </td>
                        <td className="px-5 py-2 text-slate-600">
                          {c.fechaVencimiento}
                        </td>
                        <td className="px-5 py-2 text-right">
                          {formatCurrency(c.monto)}
                        </td>
                      </tr>
                    ))}
                    {cuotasPreview.length > 12 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-2 text-center text-xs text-slate-400"
                        >
                          … {cuotasPreview.length - 12} cuota(s) más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
