'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  Boxes,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  User,
} from 'lucide-react';
import { Button, DataTable, Modal, type DataTableColumn } from '@/components/ui';

interface Boveda {
  id: number;
  numero: string;
  tipo: string | null;
  bloque?: { nombre: string; cementerio?: { nombre: string } };
  piso?: { numero: number } | null;
}

interface ContratoRow {
  id: number;
  numeroSecuencial: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: boolean;
  difunto?: { nombre: string; apellido: string };
  boveda?: { numero: string; bloque?: { nombre: string } };
}

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  numeroIdentificacion: string;
  tipoIdentificacion: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  estadoCivil: string | null;
  profesion: string | null;
  nacionalidad: string | null;
  estado: boolean;
  tipoPersona: string;
  propietarios: {
    id: number;
    bovedas: Boveda[];
  }[];
  responsables: {
    id: number;
    contratoResponsables: {
      contrato: ContratoRow;
    }[];
  }[];
}

type Tab = 'datos' | 'bovedas' | 'contratos';
type DetailModal = 'identificacion' | 'contacto' | 'complementaria' | null;

function formatDate(value?: string | null) {
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
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  );
}

function CompactSection({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-soft ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SectionDetailButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
    >
      <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      Ver detalle
    </button>
  );
}

export default function PersonaDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<Tab>('datos');
  const [detailModal, setDetailModal] = useState<DetailModal>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/personas/${id}`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.message || 'No se pudo cargar');
        }
        const payload = await res.json();
        if (cancelled) return;
        setPersona((payload?.data ?? payload) as Persona);
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

  const bovedas: Boveda[] = useMemo(() => {
    if (!persona) return [];
    const all = persona.propietarios.flatMap((p) => p.bovedas ?? []);
    // Una persona puede figurar como propietaria de la misma bóveda en más de
    // un registro; deduplicamos por id para no repetir filas (ni keys React).
    return Array.from(new Map(all.map((b) => [b.id, b])).values());
  }, [persona]);

  const contratos: ContratoRow[] = useMemo(() => {
    if (!persona) return [];
    const all = persona.responsables.flatMap((r) =>
      r.contratoResponsables.map((cr) => cr.contrato),
    );
    // Mismo contrato puede llegar vía varios registros de responsable.
    return Array.from(new Map(all.map((c) => [c.id, c])).values());
  }, [persona]);

  const bovedaColumns: DataTableColumn<Boveda>[] = [
    {
      key: 'boveda',
      header: 'Bóveda',
      sortable: true,
      sortValue: (b) => b.numero,
      cell: (b) => (
        <span className="font-medium text-slate-700">{b.numero}</span>
      ),
    },
    {
      key: 'bloque',
      header: 'Bloque',
      sortable: true,
      sortValue: (b) => b.bloque?.nombre,
      cell: (b) => (
        <span className="text-slate-600">
          {b.bloque?.nombre ?? '—'}
          {b.bloque?.cementerio?.nombre && (
            <span className="block text-xs text-slate-600">
              {b.bloque.cementerio.nombre}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'piso',
      header: 'Piso',
      sortable: true,
      sortValue: (b) => b.piso?.numero,
      cell: (b) => <span className="text-slate-600">{b.piso?.numero ?? '—'}</span>,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      sortable: true,
      sortValue: (b) => b.tipo,
      cell: (b) => <span className="text-slate-600">{b.tipo || '—'}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cell: (b) => (
        <Link
          href={`/bovedas/${b.id}`}
          className="text-xs font-medium text-primary-600 hover:underline"
        >
          Ver bóveda →
        </Link>
      ),
    },
  ];

  const contratoColumns: DataTableColumn<ContratoRow>[] = [
    {
      key: 'contrato',
      header: 'Contrato',
      sortable: true,
      sortValue: (c) => c.numeroSecuencial,
      cell: (c) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {c.numeroSecuencial}
        </span>
      ),
    },
    {
      key: 'difunto',
      header: 'Difunto',
      sortable: true,
      sortValue: (c) =>
        c.difunto ? `${c.difunto.nombre} ${c.difunto.apellido}` : null,
      cell: (c) => (
        <span className="text-slate-600">
          {c.difunto ? `${c.difunto.nombre} ${c.difunto.apellido}` : '—'}
        </span>
      ),
    },
    {
      key: 'boveda',
      header: 'Bóveda',
      sortable: true,
      sortValue: (c) => c.boveda?.numero,
      cell: (c) => (
        <span className="text-slate-600">
          {c.boveda?.numero ?? '—'}
          {c.boveda?.bloque?.nombre && (
            <span className="ml-1 text-xs text-slate-600">
              ({c.boveda.bloque.nombre})
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'vigencia',
      header: 'Vigencia',
      sortable: true,
      sortValue: (c) => c.fechaInicio,
      cell: (c) => (
        <span className="text-xs text-slate-500">
          {formatDate(c.fechaInicio)} → {formatDate(c.fechaFin)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      sortValue: (c) => (c.estado ? 'Activo' : 'Inactivo'),
      cell: (c) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
            c.estado
              ? 'bg-green-50 text-green-700 ring-green-200'
              : 'bg-slate-100 text-slate-600 ring-slate-200'
          }`}
        >
          {c.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cell: (c) => (
        <Link
          href={`/contratos/${c.id}`}
          className="text-xs font-medium text-primary-600 hover:underline"
        >
          Ver contrato →
        </Link>
      ),
    },
  ];

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/personas/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo eliminar');
      }
      router.push('/personas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
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

  if (!persona) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Persona</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'No se pudo cargar la persona.'}
        </div>
        <Link
          href="/personas"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Volver
        </Link>
      </div>
    );
  }

  const fullName = `${persona.nombre} ${persona.apellido}`.trim();
  const initials = fullName
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
            {initials || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {persona.tipoIdentificacion} {persona.numeroIdentificacion}
              {!persona.estado && (
                <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  Inactiva
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/personas/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Editar
          </Link>
          {persona.estado && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {deleting ? (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              ) : (
                <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              )}
              Desactivar
            </button>
          )}
          <Link
            href="/personas"
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

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex flex-wrap gap-4">
          <TabButton
            active={tab === 'datos'}
            onClick={() => setTab('datos')}
            icon={<User className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            label="Datos personales"
          />
          <TabButton
            active={tab === 'bovedas'}
            onClick={() => setTab('bovedas')}
            icon={<Boxes className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            label={`Bóvedas · ${bovedas.length}`}
          />
          <TabButton
            active={tab === 'contratos'}
            onClick={() => setTab('contratos')}
            icon={<FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            label={`Contratos · ${contratos.length}`}
          />
        </nav>
      </div>

      {tab === 'datos' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <CompactSection
            title="Identificación"
            action={<SectionDetailButton onClick={() => setDetailModal('identificacion')} />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombres" value={persona.nombre} />
              <Field label="Apellidos" value={persona.apellido} />
              <Field
                label="Identificación"
                value={`${persona.tipoIdentificacion} ${persona.numeroIdentificacion}`}
              />
              <Field label="Tipo de persona" value={persona.tipoPersona} />
            </div>
          </CompactSection>

          <CompactSection
            title="Contacto"
            action={<SectionDetailButton onClick={() => setDetailModal('contacto')} />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Email" value={persona.email} />
              <Field label="Teléfono" value={persona.telefono} />
              <Field label="Dirección" value={persona.direccion} />
            </div>
          </CompactSection>

          <CompactSection
            title="Información complementaria"
            className="xl:col-span-2"
            action={<SectionDetailButton onClick={() => setDetailModal('complementaria')} />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Fecha de nacimiento" value={formatDate(persona.fechaNacimiento)} />
              <Field label="Género" value={persona.genero} />
              <Field label="Estado civil" value={persona.estadoCivil} />
              <Field label="Nacionalidad" value={persona.nacionalidad} />
              <Field label="Profesión" value={persona.profesion} />
              <Field label="Estado del registro" value={persona.estado ? 'Activa' : 'Inactiva'} />
              <Field label="Bóvedas vinculadas" value={String(bovedas.length)} />
              <Field label="Contratos vinculados" value={String(contratos.length)} />
            </div>
          </CompactSection>
        </div>
      )}

      {tab === 'bovedas' && (
        <Card title={`Bóvedas como propietario · ${bovedas.length}`}>
          {bovedas.length === 0 ? (
            <p className="text-sm text-slate-600">
              Esta persona no es propietaria de ninguna bóveda.
            </p>
          ) : (
            <div className="-m-5">
              <DataTable
                columns={bovedaColumns}
                rows={bovedas}
                rowKey={(b) => b.id}
              />
            </div>
          )}
        </Card>
      )}

      {tab === 'contratos' && (
        <Card title={`Contratos como responsable · ${contratos.length}`}>
          {contratos.length === 0 ? (
            <p className="text-sm text-slate-600">
              Esta persona no figura como responsable en ningún contrato.
            </p>
          ) : (
            <div className="-m-5">
              <DataTable
                columns={contratoColumns}
                rows={contratos}
                rowKey={(c) => c.id}
              />
            </div>
          )}
        </Card>
      )}

      <Modal
        open={detailModal !== null}
        onClose={() => setDetailModal(null)}
        title={
          detailModal === 'identificacion'
            ? 'Identificación'
            : detailModal === 'contacto'
              ? 'Contacto'
              : 'Información complementaria'
        }
        description={fullName}
        size="lg"
        footer={
          <Button type="button" variant="secondary" onClick={() => setDetailModal(null)}>
            Cerrar
          </Button>
        }
      >
        {detailModal === 'identificacion' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Nombres" value={persona.nombre} />
            <Field label="Apellidos" value={persona.apellido} />
            <Field label="Tipo de identificación" value={persona.tipoIdentificacion} />
            <Field label="Número de identificación" value={persona.numeroIdentificacion} />
            <Field label="Tipo de persona" value={persona.tipoPersona} />
            <Field label="Estado del registro" value={persona.estado ? 'Activa' : 'Inactiva'} />
          </div>
        )}

        {detailModal === 'contacto' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Email" value={persona.email} />
            <Field label="Teléfono" value={persona.telefono} />
            <div className="sm:col-span-2">
              <Field label="Dirección" value={persona.direccion} />
            </div>
          </div>
        )}

        {detailModal === 'complementaria' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Fecha de nacimiento" value={formatDate(persona.fechaNacimiento)} />
            <Field label="Género" value={persona.genero} />
            <Field label="Estado civil" value={persona.estadoCivil} />
            <Field label="Nacionalidad" value={persona.nacionalidad} />
            <Field label="Profesión" value={persona.profesion} />
            <Field label="Bóvedas vinculadas" value={String(bovedas.length)} />
            <Field label="Contratos vinculados" value={String(contratos.length)} />
          </div>
        )}
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => {
          if (!deleting) setDeleteModalOpen(false);
        }}
        title="Desactivar persona"
        description="Esta acción marcará el registro como inactivo."
        size="sm"
        disableOverlayClose={deleting}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={handleDelete}
            >
              Desactivar
            </Button>
          </>
        }
      >
        <div className="flex gap-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
          <p>
            ¿Deseas desactivar a <span className="font-semibold">{fullName}</span>?
            No se eliminará físicamente, pero dejará de figurar como activa en el sistema.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-primary-500 text-primary-700'
          : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
