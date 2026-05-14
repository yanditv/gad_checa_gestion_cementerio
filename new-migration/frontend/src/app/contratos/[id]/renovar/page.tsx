'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';

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
  difunto: { nombre: string; apellido: string; numeroIdentificacion: string | null };
  responsables: {
    responsable: {
      id: number;
      personaId: number;
      parentesco: string | null;
      persona: { nombre: string; apellido: string; numeroIdentificacion: string };
    };
  }[];
}

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

  // Carga inicial: contrato origen + metadatos.
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
        // Precargar responsables del origen.
        setForm((prev) => ({
          ...prev,
          responsablesPersonaIds: origenData.responsables.map(
            (r) => r.responsable.personaId,
          ),
        }));
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Cálculos de UI
  const maxRenovaciones = (() => {
    if (!origen) return 0;
    const tipo = (origen.boveda.tipo || '').toLowerCase();
    return tipo.includes('nicho')
      ? origen.boveda.bloque.cementerio.vecesRenovacionNicho
      : origen.boveda.bloque.cementerio.vecesRenovacionBovedas;
  })();
  const puedeRenovar = origen
    ? origen.vecesRenovado + 1 <= maxRenovaciones
    : false;

  const subtotal = Number(origen?.boveda?.precioArrendamiento ?? 0);
  const descuento =
    metadata.descuentos.find((d) => d.id === Number(form.descuentoId)) ?? null;
  const descuentoPorcentaje = descuento ? Number(descuento.porcentaje) : 0;
  const montoDescuento = round2(subtotal * (descuentoPorcentaje / 100));
  const montoTotal = round2(subtotal - montoDescuento);

  // Vista previa local del plan de cuotas
  const cuotasPreview = (() => {
    const years = Number(form.numeroDeMeses) || 0;
    if (years <= 0 || montoTotal <= 0) return [];
    if (form.plan === 'unico') {
      return [
        {
          numero: 1,
          monto: montoTotal,
          fechaVencimiento: form.fechaInicio,
        },
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
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '40vh' }}
      >
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!origen) {
    return (
      <div>
        <PageHeader title="Renovar contrato" />
        <div className="alert alert-danger" role="alert">
          {error || 'No se pudo cargar el contrato.'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Renovar contrato ${origen.numeroSecuencial}`}
        subtitle="Crea una renovación heredando bóveda, difunto y responsables del contrato actual."
        actions={
          <Link href={`/contratos/${id}`} className="btn btn-secondary">
            <i className="ti ti-arrow-left me-1"></i> Volver
          </Link>
        }
      />

      {!puedeRenovar && (
        <div className="alert alert-warning" role="alert">
          <i className="ti ti-alert-triangle me-2"></i>
          Este contrato ya alcanzó el máximo de{' '}
          <strong>{maxRenovaciones}</strong> renovación(es) permitido por el
          cementerio. No se puede renovar nuevamente.
        </div>
      )}

      <div className="row">
        <div className="col-lg-7">
          <form onSubmit={handleSubmit}>
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">Datos del nuevo contrato</h5>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Fecha de inicio</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.fechaInicio}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, fechaInicio: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Años de duración</label>
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      value={form.numeroDeMeses}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          numeroDeMeses: Number(e.target.value),
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Descuento</label>
                    <select
                      className="form-select"
                      value={form.descuentoId}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          descuentoId: Number(e.target.value),
                        }))
                      }
                    >
                      <option value={0}>Sin descuento</option>
                      {metadata.descuentos.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre} — {Number(d.porcentaje)}%
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Plan de cuotas</label>
                    <select
                      className="form-select"
                      value={form.plan}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          plan: e.target.value as PlanCuota,
                        }))
                      }
                    >
                      {PLAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Observaciones</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={form.observaciones}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          observaciones: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">Pago</h5>
              </div>
              <div className="card-body">
                <div className="form-check mb-3">
                  <input
                    id="pago-contado"
                    type="checkbox"
                    className="form-check-input"
                    checked={form.pagarAlContado}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        pagarAlContado: e.target.checked,
                      }))
                    }
                  />
                  <label className="form-check-label" htmlFor="pago-contado">
                    Marcar todas las cuotas como pagadas al crear (cobro al
                    contado)
                  </label>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Método</label>
                    <select
                      className="form-select"
                      value={form.tipoPago}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, tipoPago: e.target.value }))
                      }
                    >
                      {metadata.tiposPago.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Comprobante / referencia</label>
                    <input
                      className="form-control"
                      value={form.numeroComprobante}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          numeroComprobante: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Fecha de pago</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.fechaPago}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, fechaPago: e.target.value }))
                      }
                    />
                  </div>
                  {form.tipoPago !== 'Efectivo' && metadata.bancos.length > 0 && (
                    <div className="col-md-6">
                      <label className="form-label">Banco</label>
                      <select
                        className="form-select"
                        value={form.bancoId}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            bancoId: Number(e.target.value),
                          }))
                        }
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
                  <div className="col-12">
                    <label className="form-label">Observación del pago</label>
                    <input
                      className="form-control"
                      value={form.observacion}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, observacion: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mb-4">
              <Link href={`/contratos/${id}`} className="btn btn-secondary">
                Cancelar
              </Link>
              <Button type="submit" disabled={saving || !puedeRenovar}>
                {saving ? 'Renovando…' : 'Crear renovación'}
              </Button>
            </div>
          </form>
        </div>

        {/* Lateral: resumen del origen y plan calculado */}
        <div className="col-lg-5">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Contrato a renovar</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Número</span>
                <strong>{origen.numeroSecuencial}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Bóveda</span>
                <span>
                  {origen.boveda.numero} ·{' '}
                  {origen.boveda.bloque.nombre}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tipo</span>
                <span>{origen.boveda.tipo || 'Bóveda'}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Difunto</span>
                <span>
                  {origen.difunto.nombre} {origen.difunto.apellido}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Renovaciones previas</span>
                <span>
                  {origen.vecesRenovado} de {maxRenovaciones}
                </span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">
                  Descuento ({descuentoPorcentaje}%)
                </span>
                <span className="text-danger">
                  − {formatCurrency(montoDescuento)}
                </span>
              </div>
              <div className="d-flex justify-content-between fw-semibold">
                <span>Total</span>
                <span>{formatCurrency(montoTotal)}</span>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Responsables heredados</h5>
            </div>
            <div className="card-body">
              {origen.responsables.length === 0 ? (
                <p className="text-muted mb-0">
                  El contrato origen no tiene responsables registrados.
                </p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {origen.responsables.map((r) => (
                    <li key={r.responsable.id} className="mb-2">
                      <i className="ti ti-user me-2 text-muted"></i>
                      <strong>
                        {r.responsable.persona.nombre}{' '}
                        {r.responsable.persona.apellido}
                      </strong>
                      <small className="text-muted d-block ms-4">
                        {r.responsable.persona.numeroIdentificacion}
                        {r.responsable.parentesco
                          ? ` · ${r.responsable.parentesco}`
                          : ''}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {cuotasPreview.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  Plan calculado · {cuotasPreview.length} cuota(s)
                </h5>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table mb-0 small">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Vencimiento</th>
                      <th className="text-end">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuotasPreview.slice(0, 12).map((c) => (
                      <tr key={c.numero}>
                        <td>{c.numero}</td>
                        <td>{c.fechaVencimiento}</td>
                        <td className="text-end">
                          {formatCurrency(c.monto)}
                        </td>
                      </tr>
                    ))}
                    {cuotasPreview.length > 12 && (
                      <tr>
                        <td colSpan={3} className="text-center text-muted">
                          … {cuotasPreview.length - 12} cuota(s) más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
