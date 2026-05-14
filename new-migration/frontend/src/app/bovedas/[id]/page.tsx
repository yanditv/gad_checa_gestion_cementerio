'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  numeroIdentificacion: string;
  telefono?: string | null;
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
  montoTotal: number | string;
  difunto?: { nombre: string; apellido: string };
}

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

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
          <i className="ti ti-arrow-left" />
          Volver
        </Link>
      </div>
    );
  }

  const contratoActivo = historial.find((c) => c.estado);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bóveda {boveda.numero}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {boveda.bloque.nombre}
            {boveda.bloque.cementerio?.nombre
              ? ` · ${boveda.bloque.cementerio.nombre}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/bovedas/${boveda.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-edit" />
            Editar
          </Link>
          <Link
            href="/bovedas"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-arrow-left" />
            Volver
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
        <i
          className={`ti ${
            boveda.estado ? 'ti-circle-check' : 'ti-circle-off'
          } text-xl`}
        />
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Información de la bóveda">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Número" value={boveda.numero} />
              <Field label="Tipo" value={boveda.tipo} />
              <Field label="Capacidad" value={`${boveda.capacidad} persona(s)`} />
              <Field
                label="Piso"
                value={boveda.piso?.numero ? String(boveda.piso.numero) : '—'}
              />
              <Field label="Precio de venta" value={formatCurrency(boveda.precio)} />
              <Field
                label="Precio de arrendamiento"
                value={formatCurrency(boveda.precioArrendamiento)}
              />
              <div className="sm:col-span-2">
                <Field label="Ubicación" value={boveda.ubicacion} />
              </div>
              {boveda.observaciones && (
                <div className="sm:col-span-2">
                  <Field label="Observaciones" value={boveda.observaciones} />
                </div>
              )}
            </div>
          </Card>

          {/* Propietario */}
          <Card title="Propietario">
            {boveda.propietario ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-800">
                    {boveda.propietario.persona.nombre}{' '}
                    {boveda.propietario.persona.apellido}
                  </div>
                  <div className="text-xs text-slate-500">
                    {boveda.propietario.persona.numeroIdentificacion}
                  </div>
                  {boveda.propietario.persona.telefono && (
                    <div className="text-xs text-slate-500">
                      <i className="ti ti-phone mr-1 text-slate-400" />
                      {boveda.propietario.persona.telefono}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPropietarioModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <i className="ti ti-user-edit" />
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={quitarPropietario}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    <i className="ti ti-user-off" />
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Sin propietario asignado.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPropietarioModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
                >
                  <i className="ti ti-user-plus" />
                  Asignar propietario
                </button>
              </div>
            )}
          </Card>

          {boveda.difuntos.length > 0 && (
            <Card title="Difuntos en la bóveda">
              <div className="overflow-x-auto -m-5">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-2.5">Nombre</th>
                      <th className="px-5 py-2.5">Fecha de defunción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {boveda.difuntos.map((d) => (
                      <tr key={d.id}>
                        <td className="px-5 py-2.5 font-medium text-slate-700">
                          {d.nombre} {d.apellido}
                        </td>
                        <td className="px-5 py-2.5 text-slate-600">
                          {formatDate(d.fechaDefuncion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Histórico */}
          <Card title={`Histórico de contratos · ${historial.length}`}>
            {historial.length === 0 ? (
              <p className="text-sm text-slate-400">
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
                    <p className="text-xs text-slate-400">
                      Monto: {formatCurrency(c.montoTotal)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Acciones rápidas">
            <div className="flex flex-col gap-2">
              <Link
                href={`/contratos/create?boveda=${boveda.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600"
              >
                <i className="ti ti-file-plus" />
                Crear contrato
              </Link>
              <button
                type="button"
                onClick={() => setShowPropietarioModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <i className="ti ti-user" />
                {boveda.propietario ? 'Cambiar propietario' : 'Asignar propietario'}
              </button>
              {boveda.estado && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <i className="ti ti-trash" />
                  Eliminar bóveda
                </button>
              )}
            </div>
          </Card>

          <Card title="Bloque">
            <p className="text-sm font-medium text-slate-700">
              {boveda.bloque.nombre}
            </p>
            {boveda.bloque.cementerio?.nombre && (
              <p className="mt-0.5 text-xs text-slate-500">
                {boveda.bloque.cementerio.nombre}
              </p>
            )}
            <Link
              href={`/bloques/${boveda.bloque.id}`}
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
            >
              <i className="ti ti-arrow-up-right" />
              Ver bloque
            </Link>
          </Card>
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
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
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
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const res = await fetch(
          `/api/personas/search?q=${encodeURIComponent(search.trim())}`,
          {
            credentials: 'same-origin',
            signal: controller.signal,
            cache: 'no-store',
          },
        );
        if (!res.ok) throw new Error('No se pudo buscar');
        const payload = await res.json();
        if (cancelled) return;
        setResults(
          (Array.isArray(payload) ? payload : payload?.data ?? []) as Persona[],
        );
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
      const res = await fetch(`/api/bovedas/${bovedaId}/propietario`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo asignar');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-lifted">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Asignar propietario
            </h3>
            <p className="text-xs text-slate-500">
              Busca una persona registrada por nombre, apellido o cédula.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <i className="ti ti-x" />
          </button>
        </header>

        <div className="p-5">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="relative mb-3">
            <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mínimo 2 caracteres…"
              autoFocus
              className={`${INPUT_CLS} pl-9`}
            />
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
            {loading ? (
              <div className="py-6 text-center text-sm text-slate-400">
                Buscando…
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400">
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
                            : 'bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60'
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
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
