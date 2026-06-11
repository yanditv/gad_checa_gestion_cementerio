'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Download,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui';
import {
  authApi,
  contratosApi,
  difuntosApi,
  exhumacionesApi,
  MOTIVOS_EXHUMACION,
  MOTIVO_EXHUMACION_LABEL,
  type ExhumacionResponse,
  type MotivoExhumacion,
} from '@/lib/api';

interface ContratoRow {
  id: number;
  numeroSecuencial: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: boolean;
  esRenovacion: boolean;
  responsables?: {
    responsable: { persona: { nombre: string; apellido: string } };
  }[];
}

interface Difunto {
  id: number;
  nombre: string;
  apellido: string;
  numeroIdentificacion: string | null;
  fechaNacimiento: string | null;
  fechaDefuncion: string | null;
  fechaInhumacion: string | null;
  causaMuerte: string | null;
  observaciones: string | null;
  edad: number | null;
  genero: string | null;
  nacionalidad: string | null;
  estadoCivil: string | null;
  lugarNacimiento: string | null;
  lugarDefuncion: string | null;
  nombreConyuge: string | null;
  nombrePadre: string | null;
  nombreMadre: string | null;
  numeroCertificadoDefuncion: string | null;
  entidadEmisora: string | null;
  fechaEmisionCertificado: string | null;
  estado: boolean;
  exhumado?: boolean;
  fechaExhumacion?: string | null;
  boveda: {
    id: number;
    numero: string;
    tipo: string | null;
    bloque?: { nombre: string; cementerio?: { nombre: string } };
    piso?: { numero: number } | null;
  };
  contratos: ContratoRow[];
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-EC');
}

function computeEdad(
  nac: string | null | undefined,
  def: string | null | undefined,
): number | null {
  if (!nac || !def) return null;
  const n = new Date(nac);
  const d = new Date(def);
  if (Number.isNaN(n.getTime()) || Number.isNaN(d.getTime())) return null;
  let years = d.getFullYear() - n.getFullYear();
  if (
    d.getMonth() < n.getMonth() ||
    (d.getMonth() === n.getMonth() && d.getDate() < n.getDate())
  ) {
    years -= 1;
  }
  return years >= 0 ? years : null;
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
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

interface BovedaOption {
  id: number;
  numero: string | number;
  bloque?: { nombre?: string } | null;
}

export default function DifuntoDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [difunto, setDifunto] = useState<Difunto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [exhumaciones, setExhumaciones] = useState<ExhumacionResponse[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [bovedasDestino, setBovedasDestino] = useState<BovedaOption[]>([]);

  const [fechaExhumacion, setFechaExhumacion] = useState('');
  const [motivo, setMotivo] = useState<MotivoExhumacion>('vencimiento_arriendo');
  const [destino, setDestino] = useState('');
  const [bovedaDestinoId, setBovedaDestinoId] = useState('');
  const [numeroAutorizacion, setNumeroAutorizacion] = useState('');
  const [entidadAutorizante, setEntidadAutorizante] = useState('');
  const [observacionesExh, setObservacionesExh] = useState('');

  async function reloadExhumaciones(difuntoId: number) {
    try {
      const { data } = await exhumacionesApi.findPage({ limit: 100 });
      const items: ExhumacionResponse[] = Array.isArray(data) ? data : [];
      setExhumaciones(items.filter((e) => e.difuntoId === difuntoId));
    } catch {
      /* no-op */
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = (await difuntosApi.findOne(parseInt(id, 10))) as Difunto;
        if (cancelled) return;
        setDifunto(data);
        await reloadExhumaciones(data.id);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await authApi.getProfile();
        const roles: string[] = profile?.roles ?? [];
        if (!cancelled)
          setIsAdmin(
            roles.includes('Administrador') || roles.includes('Admin'),
          );
      } catch {
        /* no-op */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openExhumacionModal() {
    setModalError('');
    setFechaExhumacion('');
    setMotivo('vencimiento_arriendo');
    setDestino('');
    setBovedaDestinoId('');
    setNumeroAutorizacion('');
    setEntidadAutorizante('');
    setObservacionesExh('');
    setModalOpen(true);
    if (bovedasDestino.length === 0) {
      try {
        const result = await contratosApi.getBovedasDisponibles({ limit: 500 });
        const list = (result?.data ?? []) as BovedaOption[];
        setBovedasDestino(list);
      } catch {
        setBovedasDestino([]);
      }
    }
  }

  async function handleRegistrarExhumacion(e: React.FormEvent) {
    e.preventDefault();
    if (!difunto) return;
    if (!fechaExhumacion) {
      setModalError('La fecha de exhumación es obligatoria.');
      return;
    }
    if (!destino.trim()) {
      setModalError('El destino de los restos es obligatorio.');
      return;
    }
    if (motivo === 'traslado' && !bovedaDestinoId) {
      setModalError('Para un traslado debe seleccionar la bóveda destino.');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      await exhumacionesApi.create({
        difuntoId: difunto.id,
        fechaExhumacion,
        motivo,
        destino: destino.trim(),
        bovedaDestinoId:
          motivo === 'traslado' && bovedaDestinoId
            ? Number(bovedaDestinoId)
            : undefined,
        numeroAutorizacion: numeroAutorizacion.trim() || undefined,
        entidadAutorizante: entidadAutorizante.trim() || undefined,
        observaciones: observacionesExh.trim() || undefined,
      });
      setModalOpen(false);
      // Recargar la ficha (cambia bóveda/estado exhumado) y el historial.
      const data = (await difuntosApi.findOne(parseInt(id, 10))) as Difunto;
      setDifunto(data);
      await reloadExhumaciones(data.id);
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : 'No se pudo registrar la exhumación',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnularExhumacion(exhId: number) {
    if (!difunto) return;
    if (!window.confirm('¿Anular esta exhumación? Se revertirá su efecto.')) return;
    try {
      await exhumacionesApi.anular(exhId);
      const data = (await difuntosApi.findOne(parseInt(id, 10))) as Difunto;
      setDifunto(data);
      await reloadExhumaciones(data.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo anular la exhumación',
      );
    }
  }

  async function handleDescargarActa(exh: ExhumacionResponse) {
    try {
      const { blob, filename } = await exhumacionesApi.actaPdf(exh.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? `acta-exhumacion-${exh.numeroActa}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo descargar el acta',
      );
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Desactivar este registro?')) return;
    try {
      await difuntosApi.delete(parseInt(id, 10));
      router.push('/difuntos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
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

  if (!difunto) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Difunto</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'No se pudo cargar el registro.'}
        </div>
        <Link
          href="/difuntos"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Volver
        </Link>
      </div>
    );
  }

  const edad = difunto.edad ?? computeEdad(difunto.fechaNacimiento, difunto.fechaDefuncion);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {difunto.nombre} {difunto.apellido}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{difunto.numeroIdentificacion ?? 'Sin identificación'}</span>
            {difunto.exhumado && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700 ring-1 ring-warning-200">
                <ArrowLeftRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                Exhumado
              </span>
            )}
            {!difunto.estado && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                Inactivo
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && difunto.estado && !difunto.exhumado && (
            <button
              type="button"
              onClick={openExhumacionModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-warning-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-warning-600"
            >
              <ArrowLeftRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Registrar exhumación/traslado
            </button>
          )}
          <Link
            href={`/difuntos/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Editar
          </Link>
          <Link
            href="/difuntos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Volver
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Información personal">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nombres" value={difunto.nombre} />
              <Field label="Apellidos" value={difunto.apellido} />
              <Field label="Identificación" value={difunto.numeroIdentificacion} />
              <Field label="Género" value={difunto.genero} />
              <Field label="Estado civil" value={difunto.estadoCivil} />
              <Field label="Nacionalidad" value={difunto.nacionalidad} />
              <Field label="Edad al fallecer" value={edad !== null ? `${edad} años` : null} />
              <Field label="Causa de muerte" value={difunto.causaMuerte} />
            </div>
          </Card>

          <Card title="Fechas">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Fecha de nacimiento" value={formatDate(difunto.fechaNacimiento)} />
              <Field label="Fecha de defunción" value={formatDate(difunto.fechaDefuncion)} />
              <Field label="Fecha de inhumación" value={formatDate(difunto.fechaInhumacion)} />
              <Field label="Lugar de nacimiento" value={difunto.lugarNacimiento} />
              <Field label="Lugar de defunción" value={difunto.lugarDefuncion} />
            </div>
          </Card>

          <Card title="Familia">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Padre" value={difunto.nombrePadre} />
              <Field label="Madre" value={difunto.nombreMadre} />
              <Field label="Cónyuge" value={difunto.nombreConyuge} />
            </div>
          </Card>

          <Card title="Certificado de defunción">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field
                label="Número"
                value={difunto.numeroCertificadoDefuncion}
              />
              <Field label="Entidad emisora" value={difunto.entidadEmisora} />
              <Field
                label="Fecha de emisión"
                value={formatDate(difunto.fechaEmisionCertificado)}
              />
            </div>
          </Card>

          {difunto.observaciones && (
            <Card title="Observaciones">
              <p className="text-sm text-slate-600">{difunto.observaciones}</p>
            </Card>
          )}

          {difunto.contratos && difunto.contratos.length > 0 && (
            <Card title={`Contratos · ${difunto.contratos.length}`}>
              <div className="overflow-x-auto -m-5">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-2.5">Contrato</th>
                      <th className="px-5 py-2.5">Vigencia</th>
                      <th className="px-5 py-2.5">Estado</th>
                      <th className="px-5 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {difunto.contratos.map((c) => (
                      <tr key={c.id}>
                        <td className="px-5 py-2.5 font-mono text-xs font-semibold text-slate-700">
                          {c.numeroSecuencial}
                          {c.esRenovacion && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-info-50 px-1.5 py-0.5 text-[10px] font-medium text-info-600 ring-1 ring-info-200">
                              Renovación
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-500">
                          {formatDate(c.fechaInicio)} → {formatDate(c.fechaFin)}
                        </td>
                        <td className="px-5 py-2.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                              c.estado
                                ? 'bg-green-50 text-green-700 ring-green-200'
                                : 'bg-slate-100 text-slate-600 ring-slate-200'
                            }`}
                          >
                            {c.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <Link
                            href={`/contratos/${c.id}`}
                            className="text-xs font-medium text-primary-600 hover:underline"
                          >
                            Ver →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {exhumaciones.length > 0 && (
            <Card title={`Exhumaciones · ${exhumaciones.length}`}>
              <div className="overflow-x-auto -m-5">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-2.5">Acta</th>
                      <th className="px-5 py-2.5">Fecha</th>
                      <th className="px-5 py-2.5">Motivo</th>
                      <th className="px-5 py-2.5">Destino</th>
                      <th className="px-5 py-2.5">Estado</th>
                      <th className="px-5 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exhumaciones.map((e) => (
                      <tr key={e.id}>
                        <td className="px-5 py-2.5 font-mono text-xs font-semibold text-slate-700">
                          {e.numeroActa}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-500">
                          {formatDate(e.fechaExhumacion)}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-600">
                          {MOTIVO_EXHUMACION_LABEL[e.motivo] ?? e.motivo}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-600">
                          {e.destino}
                        </td>
                        <td className="px-5 py-2.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                              e.estado
                                ? 'bg-warning-50 text-warning-700 ring-warning-200'
                                : 'bg-slate-100 text-slate-600 ring-slate-200'
                            }`}
                          >
                            {e.estado ? 'Registrada' : 'Anulada'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleDescargarActa(e)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                              Acta
                            </button>
                            {isAdmin && e.estado && (
                              <button
                                type="button"
                                onClick={() => handleAnularExhumacion(e.id)}
                                className="text-xs font-medium text-red-600 hover:underline"
                              >
                                Anular
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Ubicación">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Bóveda</dt>
                <dd className="font-mono font-medium text-slate-700">
                  {difunto.boveda.numero}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Bloque</dt>
                <dd className="text-right text-slate-700">
                  {difunto.boveda.bloque?.nombre ?? '—'}
                </dd>
              </div>
              {difunto.boveda.piso?.numero != null && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Piso</dt>
                  <dd className="text-slate-700">
                    {difunto.boveda.piso.numero}
                  </dd>
                </div>
              )}
              {difunto.boveda.bloque?.cementerio?.nombre && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Cementerio</dt>
                  <dd className="text-right text-slate-700">
                    {difunto.boveda.bloque.cementerio.nombre}
                  </dd>
                </div>
              )}
            </dl>
            <Link
              href={`/bovedas/${difunto.boveda.id}`}
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
            >
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              Ver bóveda
            </Link>
          </Card>

          <Card title="Acciones">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!difunto.estado}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Desactivar
            </button>
          </Card>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title="Registrar exhumación / traslado"
          onClose={() => (submitting ? undefined : setModalOpen(false))}
        >
          <form onSubmit={handleRegistrarExhumacion} className="space-y-4">
            {modalError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Fecha de exhumación <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={fechaExhumacion}
                  onChange={(e) => setFechaExhumacion(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <select
                  value={motivo}
                  onChange={(e) =>
                    setMotivo(e.target.value as MotivoExhumacion)
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                >
                  {MOTIVOS_EXHUMACION.map((m) => (
                    <option key={m} value={m}>
                      {MOTIVO_EXHUMACION_LABEL[m]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Destino de los restos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Osario común, otra bóveda, otro cementerio…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>

            {motivo === 'traslado' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Bóveda destino <span className="text-red-500">*</span>
                </label>
                <select
                  value={bovedaDestinoId}
                  onChange={(e) => setBovedaDestinoId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                >
                  <option value="">Seleccione una bóveda disponible…</option>
                  {bovedasDestino.map((b) => (
                    <option key={b.id} value={b.id}>
                      Bóveda {b.numero}
                      {b.bloque?.nombre ? ` · ${b.bloque.nombre}` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  El traslado reasigna al difunto a la bóveda seleccionada.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  N.º de autorización
                </label>
                <input
                  type="text"
                  value={numeroAutorizacion}
                  onChange={(e) => setNumeroAutorizacion(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Entidad autorizante
                </label>
                <input
                  type="text"
                  value={entidadAutorizante}
                  onChange={(e) => setEntidadAutorizante(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Observaciones
              </label>
              <textarea
                value={observacionesExh}
                onChange={(e) => setObservacionesExh(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-warning-500 px-3 py-2 text-sm font-medium text-white hover:bg-warning-600 disabled:opacity-50"
              >
                {submitting ? 'Registrando…' : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
