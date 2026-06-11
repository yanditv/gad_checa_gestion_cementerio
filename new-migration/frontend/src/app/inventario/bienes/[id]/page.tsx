'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CircleX,
  ClipboardList,
  History,
  MapPin,
  Package,
  RotateCcw,
  Settings,
  TrendingDown,
  Truck,
  UserPlus,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  type Tone,
} from '@/components/ui';
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

const TIPO_TONE: Record<string, Tone> = {
  alta: 'success',
  baja: 'danger',
  reactivacion: 'success',
  reasignacion_custodio: 'info',
  cambio_ubicacion: 'warning',
  depreciacion: 'secondary',
};

const CONSERVACION_TONE: Record<string, Tone> = {
  bueno: 'success',
  regular: 'warning',
  malo: 'danger',
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

function DataField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  const isEmpty =
    value === null || value === undefined || value === '';
  return (
    <div>
      <p className="text-caption font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-slate-700">
        {isEmpty ? <span className="text-slate-400">—</span> : value}
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
        <Spinner size="lg" label="Cargando bien" className="text-primary-500" />
      </div>
    );
  }

  if (!bien) {
    return (
      <div>
        <PageHeader title="Bien" backHref="/inventario/bienes" />
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error || 'No se pudo cargar el registro.'}
        </div>
      </div>
    );
  }

  const valorEnLibros =
    depreciacion && depreciacion.periodos.length > 0
      ? depreciacion.periodos[depreciacion.periodos.length - 1].valorEnLibros
      : null;

  const modalFooter = (
    handler: (e: React.FormEvent) => void,
    formId: string,
    danger = false,
    submitLabel = 'Guardar',
  ) => (
    <>
      <Button variant="secondary" onClick={() => setModal(null)}>
        Cancelar
      </Button>
      <Button
        type="submit"
        form={formId}
        loading={submitting}
        variant={danger ? 'danger' : 'primary'}
        leftIcon={<Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
      >
        {submitLabel}
      </Button>
    </>
  );

  return (
    <div>
      <PageHeader
        title={bien.descripcion}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold text-slate-600">
              {bien.codigo}
            </span>
            {bien.dadoDeBaja && (
              <Badge tone="danger" dot>
                Dado de baja
              </Badge>
            )}
            {!bien.estado && (
              <Badge tone="neutral" dot>
                Inactivo
              </Badge>
            )}
          </span>
        }
        backHref="/inventario/bienes"
        icon={<Package className="h-5 w-5" strokeWidth={2} aria-hidden="true" />}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            padding="md"
            header={
              <Card.Title icon={<ClipboardList className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
                Datos del bien
              </Card.Title>
            }
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DataField label="Código" value={bien.codigo} />
              <DataField label="Categoría" value={bien.categoria?.nombre} />
              <DataField
                label="Estado de conservación"
                value={
                  <Badge tone={CONSERVACION_TONE[bien.estadoConservacion] ?? 'neutral'}>
                    {bien.estadoConservacion}
                  </Badge>
                }
              />
              <DataField label="Marca" value={bien.marca} />
              <DataField label="Modelo" value={bien.modelo} />
              <DataField label="Serie" value={bien.serie} />
              <DataField
                label="Fecha de adquisición"
                value={formatDate(bien.fechaAdquisicion)}
              />
              <DataField
                label="Valor de adquisición"
                value={formatMoney(bien.valorAdquisicion)}
              />
              <DataField
                label="Fuente de financiamiento"
                value={bien.fuenteFinanciamiento}
              />
            </div>
          </Card>

          {bien.dadoDeBaja && (
            <Card
              padding="md"
              header={
                <Card.Title icon={<CircleX className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
                  Baja del bien
                </Card.Title>
              }
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <DataField label="Fecha de baja" value={formatDate(bien.fechaBaja)} />
                <DataField label="Motivo" value={bien.motivoBaja} />
              </div>
            </Card>
          )}

          <Card
            padding="md"
            header={
              <div className="flex items-center gap-2">
                <Card.Title icon={<History className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
                  Historial
                </Card.Title>
                <Badge tone="neutral" size="sm">
                  {historial.length}
                </Badge>
              </div>
            }
          >
            {historial.length === 0 ? (
              <p className="text-sm text-slate-400">Sin movimientos registrados.</p>
            ) : (
              <ol className="relative space-y-5 border-l border-slate-200 pl-5">
                {historial.map((h, idx) => (
                  <li key={idx} className="relative">
                    <span className="absolute -left-[1.45rem] top-1 h-2.5 w-2.5 rounded-full bg-primary-500 ring-2 ring-white" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={TIPO_TONE[h.tipo] ?? 'neutral'} size="sm">
                        {TIPO_LABEL[h.tipo] ?? h.tipo}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {formatDate(h.fecha)}
                      </span>
                    </div>
                    {h.detalle && (
                      <p className="mt-1.5 text-sm text-slate-600">{h.detalle}</p>
                    )}
                    {(h.custodioAnterior || h.custodioNuevo) && (
                      <p className="mt-1 text-xs text-slate-500">
                        Custodio: {h.custodioAnterior?.nombre ?? '—'} →{' '}
                        {h.custodioNuevo?.nombre ?? '—'}
                      </p>
                    )}
                    {(h.ubicacionAnterior || h.ubicacionNueva) && (
                      <p className="mt-1 text-xs text-slate-500">
                        Ubicación: {h.ubicacionAnterior ?? '—'} →{' '}
                        {h.ubicacionNueva ?? '—'}
                      </p>
                    )}
                    {h.origen === 'depreciacion' && (
                      <p className="mt-1 text-xs text-slate-500">
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
          <Card
            padding="md"
            header={
              <Card.Title icon={<MapPin className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
                Custodio y ubicación
              </Card.Title>
            }
          >
            <dl className="space-y-3 text-sm">
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

          <Card
            padding="md"
            header={
              <Card.Title icon={<TrendingDown className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
                Depreciación
              </Card.Title>
            }
          >
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Valor en libros</dt>
                <dd className="text-right font-semibold text-slate-900">
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

          <Card
            padding="md"
            header={
              <Card.Title icon={<Settings className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
                Acciones
              </Card.Title>
            }
          >
            <div className="space-y-2">
              <Button
                variant="secondary"
                block
                disabled={bien.dadoDeBaja}
                onClick={() => openModal('reasignar')}
                leftIcon={<UserPlus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
              >
                Reasignar custodio
              </Button>
              <Button
                variant="secondary"
                block
                disabled={bien.dadoDeBaja}
                onClick={() => openModal('mover')}
                leftIcon={<Truck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
              >
                Mover de ubicación
              </Button>

              {isAdmin && !bien.dadoDeBaja && (
                <Button
                  variant="secondary"
                  block
                  onClick={() => openModal('baja')}
                  leftIcon={<CircleX className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
                  className="border-danger-200 text-danger-600 ring-danger-200 hover:bg-danger-50 hover:text-danger-700"
                >
                  Dar de baja
                </Button>
              )}
              {isAdmin && bien.dadoDeBaja && (
                <Button
                  variant="secondary"
                  block
                  loading={submitting}
                  onClick={handleReactivar}
                  leftIcon={<RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
                  className="border-success-200 text-success-700 ring-success-200 hover:bg-success-50"
                >
                  Reactivar bien
                </Button>
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

      <Modal
        open={modal === 'reasignar'}
        onClose={() => setModal(null)}
        title="Reasignar custodio"
        footer={modalFooter(handleReasignar, 'form-reasignar')}
      >
        <form id="form-reasignar" onSubmit={handleReasignar} className="space-y-4">
          {modalError && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-inset ring-danger-200">
              {modalError}
            </div>
          )}
          <Select
            label="Nuevo custodio"
            required
            placeholder="Seleccione…"
            value={nuevoCustodioId}
            onChange={(e) => setNuevoCustodioId(e.target.value)}
          >
            {custodios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          <Input
            label="Fecha"
            type="date"
            value={fechaMovimiento}
            onChange={(e) => setFechaMovimiento(e.target.value)}
          />
          <Input
            label="Detalle"
            placeholder="Entrega-recepción por cambio de responsable"
            value={detalleMovimiento}
            onChange={(e) => setDetalleMovimiento(e.target.value)}
          />
        </form>
      </Modal>

      <Modal
        open={modal === 'mover'}
        onClose={() => setModal(null)}
        title="Mover de ubicación"
        footer={modalFooter(handleMover, 'form-mover')}
      >
        <form id="form-mover" onSubmit={handleMover} className="space-y-4">
          {modalError && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-inset ring-danger-200">
              {modalError}
            </div>
          )}
          <Input
            label="Nueva ubicación"
            required
            placeholder="Tesorería"
            value={nuevaUbicacion}
            onChange={(e) => setNuevaUbicacion(e.target.value)}
          />
          <Input
            label="Fecha"
            type="date"
            value={fechaMovimiento}
            onChange={(e) => setFechaMovimiento(e.target.value)}
          />
          <Input
            label="Detalle"
            placeholder="Traslado por reorganización de oficinas"
            value={detalleMovimiento}
            onChange={(e) => setDetalleMovimiento(e.target.value)}
          />
        </form>
      </Modal>

      <Modal
        open={modal === 'baja'}
        onClose={() => setModal(null)}
        title="Dar de baja el bien"
        footer={modalFooter(handleBaja, 'form-baja', true, 'Dar de baja')}
      >
        <form id="form-baja" onSubmit={handleBaja} className="space-y-4">
          {modalError && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-inset ring-danger-200">
              {modalError}
            </div>
          )}
          <Select
            label="Motivo"
            required
            value={motivoBaja}
            onChange={(e) => setMotivoBaja(e.target.value)}
            options={MOTIVOS_BAJA}
          />
          <Input
            label="Fecha de baja"
            required
            type="date"
            value={fechaMovimiento}
            onChange={(e) => setFechaMovimiento(e.target.value)}
          />
          <Input
            label="Autorización"
            placeholder="Resolución Administrativa N° 014-2026"
            value={autorizacionBaja}
            onChange={(e) => setAutorizacionBaja(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
