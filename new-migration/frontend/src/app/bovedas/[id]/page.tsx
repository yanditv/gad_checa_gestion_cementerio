'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleCheck,
  CircleOff,
  FilePlus2,
  Loader2,
  Pencil,
  Save,
  Search,
  Trash2,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { bovedasApi, difuntosApi, personasApi } from '@/lib/api';
import {
  Button,
  DataTable,
  DatePicker,
  Input,
  Modal,
  Select,
  Textarea,
  type DataTableColumn,
} from '@/components/ui';

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  numeroIdentificacion: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

interface Boveda {
  id: number;
  numero: string;
  tipo: string | null;
  capacidad: number;
  estado: boolean;
  precio: number | string;
  precioArrendamiento: number | string;
  ubicacion: string | null;
  observaciones: string | null;
  bloque: {
    id: number;
    nombre: string;
    cementerio?: { nombre: string };
  };
  piso?: { numero: number } | null;
  propietario?: {
    id: number;
    persona: Persona;
  } | null;
  difuntos: { id: number; nombre: string; apellido: string; fechaDefuncion: string | null }[];
}

interface ContratoHistorico {
  id: number;
  numeroSecuencial: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: boolean;
  esRenovacion: boolean;
  vecesRenovado?: number;
  montoTotal: number | string;
  observaciones?: string | null;
  difunto?: { nombre: string; apellido: string };
}

type Difunto = Boveda['difuntos'][number];

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

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
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function BovedaDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [boveda, setBoveda] = useState<Boveda | null>(null);
  const [historial, setHistorial] = useState<ContratoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPropietarioModal, setShowPropietarioModal] = useState(false);
  const [showDifuntoModal, setShowDifuntoModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bovedaRes, histRes] = await Promise.all([
        fetch(`/api/bovedas/${id}`, {
          credentials: 'same-origin',
          cache: 'no-store',
        }),
        fetch(`/api/bovedas/${id}/historial`, {
          credentials: 'same-origin',
          cache: 'no-store',
        }),
      ]);
      if (!bovedaRes.ok) {
        const payload = await bovedaRes.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo cargar la bóveda');
      }
      const bvJson = await bovedaRes.json();
      setBoveda((bvJson?.data ?? bvJson) as Boveda);

      if (histRes.ok) {
        const hist = await histRes.json();
        setHistorial(
          (Array.isArray(hist) ? hist : hist?.data ?? []) as ContratoHistorico[],
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function quitarPropietario() {
    if (!boveda) return;
    if (!window.confirm('¿Quitar el propietario actual?')) return;
    try {
      const res = await fetch(`/api/bovedas/${id}/propietario`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId: null }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo quitar el propietario');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Desactivar esta bóveda?')) return;
    try {
      const res = await fetch(`/api/bovedas/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo eliminar');
      }
      router.push('/bovedas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2
          className="h-6 w-6 animate-spin text-primary-500"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!boveda) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Bóveda</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'No se pudo cargar la bóveda.'}
        </div>
        <Link
          href="/bovedas"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Volver
        </Link>
      </div>
    );
  }

  const contratoActivo = historial.find((c) => c.estado);

  const difuntosColumns: DataTableColumn<Difunto>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      sortValue: (d) => `${d.nombre} ${d.apellido}`,
      cell: (d) => (
        <span className="font-medium text-slate-700">
          {d.nombre} {d.apellido}
        </span>
      ),
    },
    {
      key: 'fechaDefuncion',
      header: 'Fecha de defunción',
      sortable: true,
      sortValue: (d) => d.fechaDefuncion,
      cell: (d) => (
        <span className="text-slate-600">{formatDate(d.fechaDefuncion)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bóveda {boveda.numero}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {boveda.bloque.nombre}
            {boveda.bloque.cementerio?.nombre
              ? ` · ${boveda.bloque.cementerio.nombre}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/bovedas"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Volver al listado
          </Link>
        </div>
      </div>

      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
          boveda.estado
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-slate-200 bg-slate-100 text-slate-600'
        }`}
      >
        {boveda.estado ? (
          <CircleCheck
            className="h-5 w-5 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : (
          <CircleOff
            className="h-5 w-5 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
        <div>
          Bóveda <strong>{boveda.estado ? 'disponible' : 'ocupada'}</strong>
          {contratoActivo && (
            <>
              {' '}— contrato vigente{' '}
              <Link
                href={`/contratos/${contratoActivo.id}`}
                className="font-mono font-semibold text-primary-700 hover:underline"
              >
                {contratoActivo.numeroSecuencial}
              </Link>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Información de la Bóveda */}
        <Card title="Información de la Bóveda">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Número" value={boveda.numero} />
            <Field label="Tipo" value={boveda.tipo || 'Bóveda'} />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">Estado</p>
              <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${contratoActivo ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-green-50 text-green-700 ring-green-200'}`}>
                {contratoActivo ? (
                  <X className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Check className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                )}
                {contratoActivo ? 'Ocupada' : 'Disponible'}
              </span>
            </div>
            <Field label="Capacidad" value={`${boveda.capacidad} persona(s)`} />
            <Field label="Precio de Venta" value={formatCurrency(boveda.precio)} />
            <Field label="Precio de Arrendamiento" value={formatCurrency(boveda.precioArrendamiento)} />
          </div>
        </Card>

        {/* Ubicación */}
        <Card title="Ubicación">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Bloque" value={boveda.bloque?.nombre || '—'} />
            <Field label="Piso" value={boveda.piso?.numero != null ? String(boveda.piso.numero) : '—'} />
            <div className="sm:col-span-2">
              <Field label="Ubicación descriptiva" value={boveda.ubicacion} />
            </div>
          </div>
        </Card>
      </div>

      {boveda.observaciones && (
        <Card title="Observaciones">
          <p className="text-sm text-slate-700">{boveda.observaciones}</p>
        </Card>
      )}

      {/* Información del Propietario */}
      <Card title="Información del Propietario">
        {boveda.propietario ? (
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombres" value={boveda.propietario.persona.nombre} />
              <Field label="Apellidos" value={boveda.propietario.persona.apellido} />
              <Field label="Identificación" value={boveda.propietario.persona.numeroIdentificacion} />
              <Field label="Teléfono" value={boveda.propietario.persona.telefono} />
              <Field label="Email" value={boveda.propietario.persona.email} />
              <Field label="Dirección" value={boveda.propietario.persona.direccion} />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPropietarioModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Cambiar
              </button>
              <button
                type="button"
                onClick={quitarPropietario}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <UserX className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Quitar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Esta bóveda no tiene propietario asignado.</p>
            <button
              type="button"
              onClick={() => setShowPropietarioModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Asignar propietario
            </button>
          </div>
        )}
      </Card>

      {/* Contrato Vigente (si existe) */}
      {contratoActivo && (() => {
        const c = contratoActivo;
        return (
          <Card title="Contrato Vigente">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="N° Secuencial" value={c.numeroSecuencial} />
                <Field label="Fecha de Inicio" value={formatDate(c.fechaInicio)} />
                <Field label="Fecha de Vencimiento" value={formatDate(c.fechaFin) || 'Indefinido'} />
                <Field label="Valor del Contrato" value={formatCurrency(c.montoTotal)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="¿Es Renovación?" value={c.esRenovacion ? 'Sí' : 'No'} />
                <Field label="Veces Renovado" value={String(c.vecesRenovado ?? 0)} />
                <Field label="Observaciones" value={c.observaciones} />
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Difuntos */}
      <Card title={`Difuntos en la bóveda · ${boveda.difuntos.length}`}>
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            leftIcon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setShowDifuntoModal(true)}
          >
            Registrar difunto
          </Button>
        </div>
        {boveda.difuntos.length > 0 ? (
          <div className="-m-5 mt-0">
            <DataTable
              columns={difuntosColumns}
              rows={boveda.difuntos}
              rowKey={(d) => d.id}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Esta bóveda aún no tiene difuntos registrados.
          </p>
        )}
      </Card>

      {/* Histórico de contratos */}
      <Card title={`Histórico de contratos · ${historial.length}`}>
        {historial.length === 0 ? (
          <p className="text-sm text-slate-600">
            Esta bóveda aún no tiene contratos registrados.
          </p>
        ) : (
          <ol className="relative border-l border-slate-200 pl-6">
            {historial.map((c) => (
              <li key={c.id} className="mb-5 ml-0">
                <span
                  className={`absolute -left-[5px] h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                    c.estado ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                />
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    href={`/contratos/${c.id}`}
                    className="font-mono text-sm font-semibold text-primary-600 hover:underline"
                  >
                    {c.numeroSecuencial}
                  </Link>
                  {c.estado ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      Inactivo
                    </span>
                  )}
                  {c.esRenovacion && (
                    <span className="inline-flex items-center rounded-full bg-info-50 px-2 py-0.5 text-xs font-medium text-info-600 ring-1 ring-info-200">
                      Renovación
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {formatDate(c.fechaInicio)} → {formatDate(c.fechaFin)}
                  </span>
                </div>
                {c.difunto && (
                  <p className="mt-0.5 text-sm text-slate-600">
                    Difunto: {c.difunto.nombre} {c.difunto.apellido}
                  </p>
                )}
                <p className="text-xs text-slate-600">
                  Monto: {formatCurrency(c.montoTotal)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Acciones */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-600">
            Bloque: <strong className="text-slate-600">{boveda.bloque.nombre}</strong>
            {boveda.bloque.cementerio?.nombre && <> · {boveda.bloque.cementerio.nombre}</>}
          </p>
          <Link
            href={`/bloques/${boveda.bloque.id}`}
            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
          >
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> Ver bloque
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/contratos/create?boveda=${boveda.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <FilePlus2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Crear contrato
          </Link>
          <Link
            href="/bovedas"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
          </Link>
          <Link
            href={`/bovedas/${boveda.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Editar
          </Link>
          {boveda.estado && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Eliminar
            </button>
          )}
        </div>
      </div>

      {showPropietarioModal && (
        <PropietarioModal
          bovedaId={boveda.id}
          actualPersonaId={boveda.propietario?.persona.id ?? null}
          onClose={() => setShowPropietarioModal(false)}
          onSaved={() => {
            setShowPropietarioModal(false);
            void load();
          }}
        />
      )}

      {showDifuntoModal && (
        <RegistrarDifuntoModal
          bovedaId={boveda.id}
          bovedaNumero={boveda.numero}
          onClose={() => setShowDifuntoModal(false)}
          onSaved={() => {
            setShowDifuntoModal(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  );
}

function RegistrarDifuntoModal({
  bovedaId,
  bovedaNumero,
  onClose,
  onSaved,
}: {
  bovedaId: number;
  bovedaNumero: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    numeroIdentificacion: '',
    fechaDefuncion: '',
    fechaInhumacion: '',
    causaMuerte: '',
    observaciones: '',
  });

  async function guardar() {
    setSaving(true);
    setError(null);
    try {
      await difuntosApi.create({
        bovedaId,
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        numeroIdentificacion: formData.numeroIdentificacion.trim() || undefined,
        fechaDefuncion: formData.fechaDefuncion || undefined,
        fechaInhumacion: formData.fechaInhumacion || undefined,
        causaMuerte: formData.causaMuerte.trim() || undefined,
        observaciones: formData.observaciones.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el difunto');
    } finally {
      setSaving(false);
    }
  }

  const canSave = formData.nombre.trim() && formData.apellido.trim();

  return (
    <Modal
      open
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Registrar difunto"
      description={`Registro directo en la bóveda ${bovedaNumero}, sin crear contrato.`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={guardar}
            disabled={saving || !canSave}
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombres"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombres del difunto"
          />
          <Input
            label="Apellidos"
            required
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            placeholder="Apellidos del difunto"
          />
          <Input
            label="Identificación"
            value={formData.numeroIdentificacion}
            onChange={(e) =>
              setFormData({ ...formData, numeroIdentificacion: e.target.value })
            }
            placeholder="Opcional"
          />
          <DatePicker
            label="Fecha de defunción"
            labelIcon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            value={formData.fechaDefuncion}
            onChange={(value) => setFormData({ ...formData, fechaDefuncion: value })}
          />
          <DatePicker
            label="Fecha de inhumación"
            labelIcon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            value={formData.fechaInhumacion}
            onChange={(value) => setFormData({ ...formData, fechaInhumacion: value })}
          />
          <Input
            label="Causa de muerte"
            value={formData.causaMuerte}
            onChange={(e) => setFormData({ ...formData, causaMuerte: e.target.value })}
            placeholder="Opcional"
          />
          <Textarea
            label="Observaciones"
            wrapperClassName="sm:col-span-2"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// Modal: asignar / cambiar propietario
// =============================================================================
function PropietarioModal({
  bovedaId,
  actualPersonaId,
  onClose,
  onSaved,
}: {
  bovedaId: number;
  actualPersonaId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<'buscar' | 'crear'>('buscar');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario crear persona
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipoIdentificacion: 'Cédula',
    numeroIdentificacion: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      if (search.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await personasApi.search(search.trim());
        if (cancelled) return;
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled && (err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [search]);

  async function asignar(personaId: number) {
    setSaving(true);
    setError(null);
    try {
      await bovedasApi.setPropietario(bovedaId, personaId);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function crearYAsignar() {
    setSaving(true);
    setError(null);
    try {
      const persona = await personasApi.create({
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        tipoIdentificacion: formData.tipoIdentificacion,
        numeroIdentificacion: formData.numeroIdentificacion.trim(),
        telefono: formData.telefono.trim() || undefined,
        email: formData.email.trim() || undefined,
        direccion: formData.direccion.trim() || undefined,
      });
      const p = persona.data || persona;
      await bovedasApi.setPropietario(bovedaId, p.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Asignar propietario"
      description="Busca una persona registrada o crea una nueva para asignarla como propietario."
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex border-b border-slate-100">
          <button
            type="button"
            onClick={() => setTab('buscar')}
            className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'buscar'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Buscar existente
          </button>
          <button
            type="button"
            onClick={() => setTab('crear')}
            className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'crear'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Crear nuevo
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {tab === 'buscar' ? (
          <>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mínimo 2 caracteres..."
                autoFocus
                className={`${INPUT_CLS} pl-12`}
              />
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
              {loading ? (
                <div className="py-6 text-center text-sm text-slate-600">
                  Buscando...
                </div>
              ) : results.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-600">
                  {search.trim().length < 2
                    ? 'Escribe al menos 2 caracteres.'
                    : 'No se encontraron personas.'}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {results.map((p) => {
                    const isCurrent = actualPersonaId === p.id;
                    return (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-slate-50/50"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800">
                            {p.nombre} {p.apellido}
                          </div>
                          <div className="text-xs text-slate-500">
                            {p.numeroIdentificacion}
                            {p.telefono ? ` · ${p.telefono}` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={saving || isCurrent}
                          onClick={() => asignar(p.id)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            isCurrent
                              ? 'cursor-default bg-slate-100 text-slate-500'
                              : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60'
                          }`}
                        >
                          {isCurrent ? 'Actual' : 'Asignar'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Nombres *
                </label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Apellidos *
                </label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData({ ...formData, apellido: e.target.value })
                  }
                />
              </div>
              <div>
                <Select
                  label="Tipo ID"
                  required
                  value={formData.tipoIdentificacion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipoIdentificacion: e.target.value,
                    })
                  }
                  options={[
                    { value: 'Cédula', label: 'Cédula' },
                    { value: 'RUC', label: 'RUC' },
                  ]}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Número ID *
                </label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={formData.numeroIdentificacion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numeroIdentificacion: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Teléfono
                </label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  className={INPUT_CLS}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Dirección
                </label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={crearYAsignar}
                disabled={
                  saving ||
                  !formData.nombre.trim() ||
                  !formData.apellido.trim() ||
                  !formData.numeroIdentificacion.trim()
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 disabled:opacity-60"
              >
                {saving ? (
                  'Guardando...'
                ) : (
                  <>
                    <Save
                      className="h-4 w-4"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    Crear y asignar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
