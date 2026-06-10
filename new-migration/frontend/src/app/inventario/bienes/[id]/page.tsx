'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { inventarioBienesApi, inventarioCustodiosApi } from '@/lib/api';

interface CategoriaResumen {
  id: number;
  nombre: string;
}

interface Bien {
  id: number;
  codigo: string;
  descripcion: string;
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  fechaAdquisicion: string;
  valorAdquisicion: number;
  fuenteFinanciamiento: string | null;
  estadoConservacion: string;
  ubicacion: string | null;
  valorResidual: number | null;
  vidaUtilMesesOverride: number | null;
  dadoDeBaja: boolean;
  fechaBaja: string | null;
  motivoBaja: string | null;
  estado: boolean;
  fechaCreacion: string;
  categoria: CategoriaResumen | null;
  custodio: { id: number; nombre: string } | null;
}

interface HistorialItem {
  origen: 'movimiento' | 'depreciacion';
  tipo: string;
  fecha: string;
  detalle: string | null;
  custodioAnterior: { id: number; nombre: string } | null;
  custodioNuevo: { id: number; nombre: string } | null;
  ubicacionAnterior: string | null;
  ubicacionNueva: string | null;
  documento: string | null;
  valorDepreciado: number | null;
  depreciacionAcumulada: number | null;
  valorEnLibros: number | null;
}

interface Depreciacion {
  bienId: number;
  valorAdquisicion: number;
  valorResidual: number;
  vidaUtilMeses: number;
  depreciacionMensual: number;
  periodos: { anio: number; mes: number; valorEnLibros: number }[];
}

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

const MOTIVOS_BAJA = [
  { value: 'obsolescencia', label: 'Obsolescencia' },
  { value: 'robo', label: 'Robo' },
  { value: 'venta', label: 'Venta' },
  { value: 'donacion', label: 'Donación' },
  { value: 'otro', label: 'Otro' },
];

const TIPO_LABEL: Record<string, string> = {
  alta: 'Alta',
  baja: 'Baja',
  reactivacion: 'Reactivación',
  reasignacion_custodio: 'Reasignación de custodio',
  cambio_ubicacion: 'Cambio de ubicación',
  depreciacion: 'Depreciación',
};

const TIPO_STYLE: Record<string, string> = {
  alta: 'bg-green-50 text-green-700 ring-green-200',
  baja: 'bg-red-50 text-red-700 ring-red-200',
  reactivacion: 'bg-green-50 text-green-700 ring-green-200',
  reasignacion_custodio: 'bg-info-50 text-info-600 ring-info-500/30',
  cambio_ubicacion: 'bg-warning-50 text-warning-600 ring-warning-500/30',
  depreciacion: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-EC');
}

function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft ${className}`}
    >
      {title && (
        <header className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">
        {value === null || value === undefined || value === '' ? '—' : value}
      </p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <i className="ti ti-x" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

type ModalKind = 'reasignar' | 'mover' | 'baja' | null;

export default function BienDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bienId = Number(id);
  const router = useRouter();

  const [bien, setBien] = useState<Bien | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [depreciacion, setDepreciacion] = useState<Depreciacion | null>(null);
  const [custodios, setCustodios] = useState<{ id: number; nombre: string }[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalKind>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // form state for modals
  const [nuevoCustodioId, setNuevoCustodioId] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');
  const [motivoBaja, setMotivoBaja] = useState('obsolescencia');
  const [fechaMovimiento, setFechaMovimiento] = useState('');
  const [detalleMovimiento, setDetalleMovimiento] = useState('');
  const [autorizacionBaja, setAutorizacionBaja] = useState('');

  const loadAll = async () => {
    setError(null);
    try {
      const [b, h] = await Promise.all([
        inventarioBienesApi.findOne(bienId),
        inventarioBienesApi.historial(bienId),
      ]);
      setBien(b as Bien);
      setHistorial((h ?? []) as HistorialItem[]);
      try {
        const dep = await inventarioBienesApi.depreciacion(bienId);
        setDepreciacion(dep as Depreciacion);
      } catch {
        setDepreciacion(null);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el bien');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadAll();
      try {
        const cust = await inventarioCustodiosApi.findAll();
        if (!cancelled) setCustodios(cust ?? []);
      } catch {
        if (!cancelled) setCustodios([]);
      }
      try {
        const res = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (res.ok) {
          const payload = await res.json();
          const roles: string[] = payload?.data?.roles ?? [];
          if (!cancelled)
            setIsAdmin(
              roles.includes('Administrador') || roles.includes('Admin'),
            );
        }
      } catch {
        /* no-op */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bienId]);

  const openModal = (kind: ModalKind) => {
    setModalError('');
    setFechaMovimiento('');
    setDetalleMovimiento('');
    setNuevoCustodioId(bien?.custodio?.id ? String(bien.custodio.id) : '');
    setNuevaUbicacion(bien?.ubicacion ?? '');
    setMotivoBaja('obsolescencia');
    setAutorizacionBaja('');
    setModal(kind);
  };

  const handleReasignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCustodioId) {
      setModalError('Seleccione el nuevo custodio.');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      await inventarioBienesApi.reasignarCustodio(bienId, {
        custodioId: Number(nuevoCustodioId),
        fecha: fechaMovimiento || undefined,
        detalle: detalleMovimiento.trim() || undefined,
      });
      setModal(null);
      await loadAll();
    } catch (err: any) {
      setModalError(err.message || 'No se pudo reasignar el custodio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaUbicacion.trim()) {
      setModalError('La ubicación es obligatoria.');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      await inventarioBienesApi.mover(bienId, {
        ubicacion: nuevaUbicacion.trim(),
        fecha: fechaMovimiento || undefined,
        detalle: detalleMovimiento.trim() || undefined,
      });
      setModal(null);
      await loadAll();
    } catch (err: any) {
      setModalError(err.message || 'No se pudo cambiar la ubicación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaMovimiento) {
      setModalError('La fecha de baja es obligatoria.');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      await inventarioBienesApi.baja(bienId, {
        motivo: motivoBaja,
        fecha: fechaMovimiento,
        autorizacion: autorizacionBaja.trim() || undefined,
      });
      setModal(null);
      await loadAll();
    } catch (err: any) {
      setModalError(err.message || 'No se pudo dar de baja el bien');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivar = async () => {
    if (!window.confirm('¿Reactivar este bien (revertir la baja)?')) return;
    setSubmitting(true);
    setError(null);
    try {
      await inventarioBienesApi.reactivar(bienId, {
        detalle: 'Reactivación desde la ficha del bien',
      });
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'No se pudo reactivar el bien');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!bien) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Bien</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'No se pudo cargar el registro.'}
        </div>
        <Link
          href="/inventario/bienes"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>
    );
  }

  const valorEnLibros =
    depreciacion && depreciacion.periodos.length > 0
      ? depreciacion.periodos[depreciacion.periodos.length - 1].valorEnLibros
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{bien.descripcion}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="font-mono font-semibold text-slate-600">{bien.codigo}</span>
            {bien.dadoDeBaja && (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                Dado de baja
              </span>
            )}
            {!bien.estado && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                Inactivo
              </span>
            )}
          </p>
        </div>
        <Link
          href="/inventario/bienes"
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Datos del bien">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Código" value={bien.codigo} />
              <Field label="Categoría" value={bien.categoria?.nombre} />
              <Field label="Estado de conservación" value={bien.estadoConservacion} />
              <Field label="Marca" value={bien.marca} />
              <Field label="Modelo" value={bien.modelo} />
              <Field label="Serie" value={bien.serie} />
              <Field label="Fecha de adquisición" value={formatDate(bien.fechaAdquisicion)} />
              <Field label="Valor de adquisición" value={formatMoney(bien.valorAdquisicion)} />
              <Field label="Fuente de financiamiento" value={bien.fuenteFinanciamiento} />
            </div>
          </Card>

          {bien.dadoDeBaja && (
            <Card title="Baja del bien">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Fecha de baja" value={formatDate(bien.fechaBaja)} />
                <Field label="Motivo" value={bien.motivoBaja} />
              </div>
            </Card>
          )}

          <Card title={`Historial · ${historial.length}`}>
            {historial.length === 0 ? (
              <p className="text-sm text-slate-400">Sin movimientos registrados.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {historial.map((h, idx) => (
                  <li key={idx} className="relative">
                    <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full bg-primary-500 ring-2 ring-white" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          TIPO_STYLE[h.tipo] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                      >
                        {TIPO_LABEL[h.tipo] ?? h.tipo}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(h.fecha)}</span>
                    </div>
                    {h.detalle && (
                      <p className="mt-1 text-sm text-slate-600">{h.detalle}</p>
                    )}
                    {(h.custodioAnterior || h.custodioNuevo) && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Custodio: {h.custodioAnterior?.nombre ?? '—'} →{' '}
                        {h.custodioNuevo?.nombre ?? '—'}
                      </p>
                    )}
                    {(h.ubicacionAnterior || h.ubicacionNueva) && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Ubicación: {h.ubicacionAnterior ?? '—'} →{' '}
                        {h.ubicacionNueva ?? '—'}
                      </p>
                    )}
                    {h.origen === 'depreciacion' && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Depreciado {formatMoney(h.valorDepreciado)} · acumulada{' '}
                        {formatMoney(h.depreciacionAcumulada)} · en libros{' '}
                        {formatMoney(h.valorEnLibros)}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Custodio y ubicación">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Custodio</dt>
                <dd className="text-right font-medium text-slate-700">
                  {bien.custodio?.nombre ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Ubicación</dt>
                <dd className="text-right text-slate-700">{bien.ubicacion ?? '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Depreciación">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Valor en libros</dt>
                <dd className="text-right font-semibold text-slate-700">
                  {formatMoney(valorEnLibros)}
                </dd>
              </div>
              {depreciacion && (
                <>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Valor residual</dt>
                    <dd className="text-right text-slate-700">
                      {formatMoney(depreciacion.valorResidual)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Vida útil (meses)</dt>
                    <dd className="text-right text-slate-700">
                      {depreciacion.vidaUtilMeses}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Depreciación mensual</dt>
                    <dd className="text-right text-slate-700">
                      {formatMoney(depreciacion.depreciacionMensual)}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </Card>

          <Card title="Acciones">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => openModal('reasignar')}
                disabled={bien.dadoDeBaja}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="ti ti-user-share" /> Reasignar custodio
              </button>
              <button
                type="button"
                onClick={() => openModal('mover')}
                disabled={bien.dadoDeBaja}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="ti ti-arrows-move" /> Mover de ubicación
              </button>

              {isAdmin && !bien.dadoDeBaja && (
                <button
                  type="button"
                  onClick={() => openModal('baja')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="ti ti-circle-x" /> Dar de baja
                </button>
              )}
              {isAdmin && bien.dadoDeBaja && (
                <button
                  type="button"
                  onClick={handleReactivar}
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="ti ti-rotate" /> Reactivar bien
                </button>
              )}
              {!isAdmin && (
                <p className="pt-1 text-xs text-slate-400">
                  La baja y reactivación de bienes está reservada a Administradores.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {modal === 'reasignar' && (
        <Modal title="Reasignar custodio" onClose={() => setModal(null)}>
          <form onSubmit={handleReasignar} className="space-y-4">
            {modalError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {modalError}
              </div>
            )}
            <div>
              <label className={LABEL_CLS}>Nuevo custodio *</label>
              <select
                className={INPUT_CLS}
                value={nuevoCustodioId}
                onChange={(e) => setNuevoCustodioId(e.target.value)}
              >
                <option value="">Seleccione…</option>
                {custodios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha</label>
              <input
                type="date"
                className={INPUT_CLS}
                value={fechaMovimiento}
                onChange={(e) => setFechaMovimiento(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Detalle</label>
              <input
                type="text"
                className={INPUT_CLS}
                placeholder="Entrega-recepción por cambio de responsable"
                value={detalleMovimiento}
                onChange={(e) => setDetalleMovimiento(e.target.value)}
              />
            </div>
            <ModalActions submitting={submitting} onCancel={() => setModal(null)} />
          </form>
        </Modal>
      )}

      {modal === 'mover' && (
        <Modal title="Mover de ubicación" onClose={() => setModal(null)}>
          <form onSubmit={handleMover} className="space-y-4">
            {modalError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {modalError}
              </div>
            )}
            <div>
              <label className={LABEL_CLS}>Nueva ubicación *</label>
              <input
                type="text"
                className={INPUT_CLS}
                placeholder="Tesorería"
                value={nuevaUbicacion}
                onChange={(e) => setNuevaUbicacion(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha</label>
              <input
                type="date"
                className={INPUT_CLS}
                value={fechaMovimiento}
                onChange={(e) => setFechaMovimiento(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Detalle</label>
              <input
                type="text"
                className={INPUT_CLS}
                placeholder="Traslado por reorganización de oficinas"
                value={detalleMovimiento}
                onChange={(e) => setDetalleMovimiento(e.target.value)}
              />
            </div>
            <ModalActions submitting={submitting} onCancel={() => setModal(null)} />
          </form>
        </Modal>
      )}

      {modal === 'baja' && (
        <Modal title="Dar de baja el bien" onClose={() => setModal(null)}>
          <form onSubmit={handleBaja} className="space-y-4">
            {modalError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {modalError}
              </div>
            )}
            <div>
              <label className={LABEL_CLS}>Motivo *</label>
              <select
                className={INPUT_CLS}
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
              >
                {MOTIVOS_BAJA.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha de baja *</label>
              <input
                type="date"
                className={INPUT_CLS}
                value={fechaMovimiento}
                onChange={(e) => setFechaMovimiento(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Autorización</label>
              <input
                type="text"
                className={INPUT_CLS}
                placeholder="Resolución Administrativa N° 014-2026"
                value={autorizacionBaja}
                onChange={(e) => setAutorizacionBaja(e.target.value)}
              />
            </div>
            <ModalActions
              submitting={submitting}
              onCancel={() => setModal(null)}
              danger
              submitLabel="Dar de baja"
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

function ModalActions({
  submitting,
  onCancel,
  danger = false,
  submitLabel = 'Guardar',
}: {
  submitting: boolean;
  onCancel: () => void;
  danger?: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={submitting}
        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
          danger
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-primary-500 hover:bg-primary-600'
        }`}
      >
        {submitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Procesando…
          </>
        ) : (
          <>
            <i className="ti ti-check" /> {submitLabel}
          </>
        )}
      </button>
    </div>
  );
}
