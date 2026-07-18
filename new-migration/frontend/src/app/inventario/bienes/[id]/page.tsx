'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Camera,
  Check,
  CircleX,
  ClipboardList,
  History,
  MapPin,
  Package,
  Receipt,
  RotateCcw,
  Settings,
  Pencil,
  TrendingDown,
  Truck,
  UserPlus,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DatePicker,
  FormSection,
  ImageUpload,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  type Tone,
} from '@/components/ui';
import { inventarioBienesApi, inventarioCustodiosApi, mediaUrl } from '@/lib/api';

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
  fotoUrl: string | null;
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
      <p className="text-caption font-medium uppercase tracking-wide text-slate-600">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-slate-700">
        {isEmpty ? <span className="text-slate-600">—</span> : value}
      </div>
    </div>
  );
}

type ModalKind = 'reasignar' | 'mover' | 'baja' | null;

export default function BienDetailPage() {
  const params = useParams<{ id: string }>();
  const bienId = Number(params.id);

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

  const [fotoBusy, setFotoBusy] = useState(false);
  const [fotoError, setFotoError] = useState('');

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

  const handleFotoChange = async (file: File | null) => {
    setFotoBusy(true);
    setFotoError('');
    try {
      if (file) {
        await inventarioBienesApi.uploadFoto(bienId, file);
      } else {
        await inventarioBienesApi.deleteFoto(bienId);
      }
      await loadAll();
    } catch (err: any) {
      setFotoError(err.message || 'No se pudo actualizar la foto del bien');
    } finally {
      setFotoBusy(false);
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
    <div className="space-y-6">
      <PageHeader
        title={bien.descripcion}
        backHref="/inventario/bienes"
        subtitle="Información detallada del bien"
        icon={<Package className="h-5 w-5" strokeWidth={2} aria-hidden="true" />}
      />

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      {/* 1. Datos del bien (estilo crear bien) */}
      <Card
        padding="none"
        header={
          <Card.Title icon={<ClipboardList className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
            Datos del bien
          </Card.Title>
        }
      >
        <div className="space-y-6 px-5 py-5">
          <FormSection divided={false}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ImageUpload
                shape="square"
                value={mediaUrl(bien.fotoUrl)}
                disabled={fotoBusy}
                hint="JPG, PNG o WEBP, máx. 5 MB"
                onChange={handleFotoChange}
              />
              {fotoError && (
                <p className="mt-2 text-caption text-danger-600">{fotoError}</p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                <DataField label="Código (placa)" value={bien.codigo} />
                <DataField label="Categoría" value={bien.categoria?.nombre} />
              </div>

              <DataField label="Descripción" value={bien.descripcion} />
              <DataField label="Custodio" value={bien.custodio?.nombre} />
              <DataField label="Marca" value={bien.marca} />
              <DataField label="Modelo" value={bien.modelo} />
              <DataField label="Serie" value={bien.serie} />
              <DataField
                label="Estado de conservación"
                value={
                  <Badge tone={CONSERVACION_TONE[bien.estadoConservacion] ?? 'neutral'}>
                    {bien.estadoConservacion}
                  </Badge>
                }
              />
            </div>
          </FormSection>

          <FormSection title="Adquisición y depreciación" icon={<Receipt className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <DataField label="Ubicación" value={bien.ubicacion} />
              <DataField
                label="Valor residual"
                value={formatMoney(bien.valorResidual ?? (depreciacion?.valorResidual))}
              />
              <DataField
                label="Vida útil en meses"
                value={bien.vidaUtilMesesOverride ?? (depreciacion?.vidaUtilMeses)}
              />
            </div>
          </FormSection>
        </div>
      </Card>

      {/* 2. Información de Baja si aplica */}
      {bien.dadoDeBaja && (
        <Card
          padding="md"
          header={
            <Card.Title icon={<CircleX className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
              Baja del bien
            </Card.Title>
          }
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
            <DataField label="Fecha de baja" value={formatDate(bien.fechaBaja)} />
            <DataField label="Motivo" value={bien.motivoBaja} />
          </div>
        </Card>
      )}

      {/* 3. Secciones secundarias: Historial y Depreciación en dos columnas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
        {/* Historial de Movimientos */}
        <Card
          padding="none"
          header={
            <div className="flex items-center gap-2">
              <Card.Title icon={<History className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
                Historial
              </Card.Title>
              <Badge tone="neutral" size="md">
                {historial.length}
              </Badge>
            </div>
          }
        >
          {historial.length === 0 ? (
            <p className="text-sm text-slate-600">Sin movimientos registrados.</p>
          ) : (
            <ol className="relative space-y-5 border-l border-slate-200 pl-5 px-5 py-3">
              {historial.map((h, idx) => (
                <li key={idx} className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TIPO_TONE[h.tipo] ?? 'neutral'} size="sm">
                      {TIPO_LABEL[h.tipo] ?? h.tipo}
                    </Badge>
                    <span className="text-md text-slate-600">
                      {formatDate(h.fecha)}
                    </span>
                  </div>
                  {h.detalle && (
                    <p className="mt-1.5 text-md text-slate-600">{h.detalle}</p>
                  )}
                  {(h.custodioAnterior || h.custodioNuevo) && (
                    <p className="mt-1 text-md text-slate-500">
                      Custodio: {h.custodioAnterior?.nombre ?? '—'} →{' '}
                      {h.custodioNuevo?.nombre ?? '—'}
                    </p>
                  )}
                  {(h.ubicacionAnterior || h.ubicacionNueva) && (
                    <p className="mt-1 text-md text-slate-500">
                      Ubicación: {h.ubicacionAnterior ?? '—'} →{' '}
                      {h.ubicacionNueva ?? '—'}
                    </p>
                  )}
                  {h.origen === 'depreciacion' && (
                    <p className="mt-1 text-md text-slate-500">
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

        {/* Depreciación Contable */}
        <Card
          padding="none"
          header={
            <Card.Title icon={<TrendingDown className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
              Cálculo de Depreciación
            </Card.Title>
          }
        >
          <dl className="grid grid-cols-2 gap-4 px-5 py-3">
            <div className="col-span-2 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <dt className="text-slate-500 font-medium">Valor actual en libros</dt>
              <dd className="mt-1 font-bold text-slate-900 text-2xl">
                {formatMoney(valorEnLibros)}
              </dd>
            </div>
            {depreciacion && (
              <>
                <div>
                  <dt className="text-slate-500">Valor residual</dt>
                  <dd className="mt-1 font-semibold text-slate-700 text-base">
                    {formatMoney(depreciacion.valorResidual)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Vida útil (meses)</dt>
                  <dd className="mt-1 font-semibold text-slate-700 text-base">
                    {depreciacion.vidaUtilMeses}
                  </dd>
                </div>
                <div className="col-span-2 border-t border-slate-100 pt-3 mt-1">
                  <dt className="text-slate-500">Depreciación mensual</dt>
                  <dd className="mt-1 font-semibold text-slate-900 text-base">
                    {formatMoney(depreciacion.depreciacionMensual)}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </Card>
      </div>

      {/* 4. Tarjeta de Acciones al fondo */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`/inventario/bienes/${bien.id}/edit`} className="block">
          <Button
            variant="secondary"
            block
            disabled={bien.dadoDeBaja}
            leftIcon={<Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          >
            Editar datos del bien
          </Button>
        </Link>
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
          <div className="flex items-center justify-center p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-center text-xs font-medium text-slate-500">
            Baja reservada a Administradores
          </div>
        )}
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
          <DatePicker
            label="Fecha"
            value={fechaMovimiento}
            onChange={setFechaMovimiento}
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
          <DatePicker
            label="Fecha"
            value={fechaMovimiento}
            onChange={setFechaMovimiento}
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
          <DatePicker
            label="Fecha de baja"
            required
            value={fechaMovimiento}
            onChange={setFechaMovimiento}
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
