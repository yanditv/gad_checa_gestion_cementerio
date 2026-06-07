'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
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
    return persona.propietarios.flatMap((p) => p.bovedas ?? []);
  }, [persona]);

  const contratos: ContratoRow[] = useMemo(() => {
    if (!persona) return [];
    return persona.responsables.flatMap((r) =>
      r.contratoResponsables.map((cr) => cr.contrato),
    );
  }, [persona]);

  async function handleDelete() {
    if (!window.confirm('¿Desactivar esta persona?')) return;
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
          <i className="ti ti-arrow-left" />
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
    <div className="space-y-6">
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-edit" />
            Editar
          </Link>
          {persona.estado && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <i className={`ti ${deleting ? 'ti-loader animate-spin' : 'ti-trash'}`} />
              Desactivar
            </button>
          )}
          <Link
            href="/personas"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-arrow-left" />
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
            icon="ti-user"
            label="Datos personales"
          />
          <TabButton
            active={tab === 'bovedas'}
            onClick={() => setTab('bovedas')}
            icon="ti-box-multiple"
            label={`Bóvedas · ${bovedas.length}`}
          />
          <TabButton
            active={tab === 'contratos'}
            onClick={() => setTab('contratos')}
            icon="ti-file-text"
            label={`Contratos · ${contratos.length}`}
          />
        </nav>
      </div>

      {tab === 'datos' && (
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nombres" value={persona.nombre} />
            <Field label="Apellidos" value={persona.apellido} />
            <Field
              label="Identificación"
              value={`${persona.tipoIdentificacion} ${persona.numeroIdentificacion}`}
            />
            <Field label="Email" value={persona.email} />
            <Field label="Teléfono" value={persona.telefono} />
            <Field label="Fecha de nacimiento" value={formatDate(persona.fechaNacimiento)} />
            <Field label="Género" value={persona.genero} />
            <Field label="Estado civil" value={persona.estadoCivil} />
            <Field label="Nacionalidad" value={persona.nacionalidad} />
            <Field label="Profesión" value={persona.profesion} />
            <Field label="Tipo de persona" value={persona.tipoPersona} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Dirección" value={persona.direccion} />
            </div>
          </div>
        </Card>
      )}

      {tab === 'bovedas' && (
        <Card title={`Bóvedas como propietario · ${bovedas.length}`}>
          {bovedas.length === 0 ? (
            <p className="text-sm text-slate-400">
              Esta persona no es propietaria de ninguna bóveda.
            </p>
          ) : (
            <div className="overflow-x-auto -m-5">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2.5">Bóveda</th>
                    <th className="px-5 py-2.5">Bloque</th>
                    <th className="px-5 py-2.5">Piso</th>
                    <th className="px-5 py-2.5">Tipo</th>
                    <th className="px-5 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bovedas.map((b) => (
                    <tr key={b.id}>
                      <td className="px-5 py-2.5 font-medium text-slate-700">
                        {b.numero}
                      </td>
                      <td className="px-5 py-2.5 text-slate-600">
                        {b.bloque?.nombre ?? '—'}
                        {b.bloque?.cementerio?.nombre && (
                          <div className="text-xs text-slate-400">
                            {b.bloque.cementerio.nombre}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-slate-600">
                        {b.piso?.numero ?? '—'}
                      </td>
                      <td className="px-5 py-2.5 text-slate-600">
                        {b.tipo || '—'}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <Link
                          href={`/bovedas/${b.id}`}
                          className="text-xs font-medium text-primary-600 hover:underline"
                        >
                          Ver bóveda →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'contratos' && (
        <Card title={`Contratos como responsable · ${contratos.length}`}>
          {contratos.length === 0 ? (
            <p className="text-sm text-slate-400">
              Esta persona no figura como responsable en ningún contrato.
            </p>
          ) : (
            <div className="overflow-x-auto -m-5">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2.5">Contrato</th>
                    <th className="px-5 py-2.5">Difunto</th>
                    <th className="px-5 py-2.5">Bóveda</th>
                    <th className="px-5 py-2.5">Vigencia</th>
                    <th className="px-5 py-2.5">Estado</th>
                    <th className="px-5 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contratos.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-2.5 font-mono text-xs font-semibold text-slate-700">
                        {c.numeroSecuencial}
                      </td>
                      <td className="px-5 py-2.5 text-slate-600">
                        {c.difunto
                          ? `${c.difunto.nombre} ${c.difunto.apellido}`
                          : '—'}
                      </td>
                      <td className="px-5 py-2.5 text-slate-600">
                        {c.boveda?.numero ?? '—'}
                        {c.boveda?.bloque?.nombre && (
                          <span className="ml-1 text-xs text-slate-400">
                            ({c.boveda.bloque.nombre})
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
                          Ver contrato →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
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
  icon: string;
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
      <i className={`ti ${icon}`} />
      {label}
    </button>
  );
}
