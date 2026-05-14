'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ContratoRelacionado {
  id: number;
  numeroSecuencial: string;
  difunto?: { nombre: string; apellido: string };
}

interface CandidatoContrato {
  id: number;
  numeroSecuencial: string;
  difunto: {
    nombre: string;
    apellido: string;
    numeroIdentificacion: string | null;
  };
  boveda: { numero: string; bloque: { nombre: string } };
}

interface RelacionActionsProps {
  contratoId: number;
  relacionado: ContratoRelacionado | null;
}

export function RelacionActions({
  contratoId,
  relacionado,
}: RelacionActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmRomper, setConfirmRomper] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (relacionado) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Comparte bóveda con:
          </span>
          <Link
            href={`/contratos/${relacionado.id}`}
            className="ml-2 font-medium text-primary-600 hover:underline"
          >
            {relacionado.numeroSecuencial}
          </Link>
          {relacionado.difunto && (
            <span className="ml-2 text-xs text-slate-500">
              ({relacionado.difunto.nombre} {relacionado.difunto.apellido})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setConfirmRomper(true)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          <i className="ti ti-unlink" />
          Romper relación
        </button>

        {confirmRomper && (
          <ConfirmRomperModal
            busy={busy}
            error={error}
            onCancel={() => {
              if (!busy) {
                setConfirmRomper(false);
                setError(null);
              }
            }}
            onConfirm={async () => {
              setBusy(true);
              setError(null);
              try {
                const res = await fetch(
                  `/api/contratos/${contratoId}/relacionar`,
                  {
                    method: 'DELETE',
                    credentials: 'same-origin',
                  },
                );
                if (!res.ok) {
                  const payload = await res.json().catch(() => ({}));
                  throw new Error(
                    payload?.message || 'No se pudo romper la relación',
                  );
                }
                setConfirmRomper(false);
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Error');
              } finally {
                setBusy(false);
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
      >
        <i className="ti ti-link" />
        Relacionar con otro contrato
      </button>

      {open && (
        <CandidatosModal
          contratoId={contratoId}
          onClose={() => setOpen(false)}
          onLinked={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------------

function ConfirmRomperModal({
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell title="Romper relación" onClose={onCancel}>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      <p className="text-sm text-slate-600">
        ¿Confirmas que deseas romper la relación entre estos dos contratos? La
        operación se aplica a ambos.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {busy ? 'Procesando…' : 'Romper relación'}
        </button>
      </div>
    </ModalShell>
  );
}

// ----------------------------------------------------------------------------

function CandidatosModal({
  contratoId,
  onClose,
  onLinked,
}: {
  contratoId: number;
  onClose: () => void;
  onLinked: () => void;
}) {
  const [search, setSearch] = useState('');
  const [candidatos, setCandidatos] = useState<CandidatoContrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: '1', limit: '15' });
        if (search.trim()) params.set('search', search.trim());
        const res = await fetch(
          `/api/contratos/${contratoId}/candidatos-relacion?${params}`,
          {
            credentials: 'same-origin',
            signal: controller.signal,
            cache: 'no-store',
          },
        );
        if (!res.ok) throw new Error('No se pudieron cargar los candidatos');
        const payload = await res.json();
        if (!cancelled) setCandidatos(payload.data || []);
      } catch (err) {
        if (!cancelled && (err as Error).name !== 'AbortError') {
          setError(
            err instanceof Error ? err.message : 'Error al cargar candidatos',
          );
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
  }, [contratoId, search]);

  async function relacionar(candidatoId: number) {
    setLinking(candidatoId);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${contratoId}/relacionar`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contratoIdB: candidatoId }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || 'No se pudo relacionar');
      }
      onLinked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLinking(null);
    }
  }

  return (
    <ModalShell
      title="Relacionar con otro contrato"
      subtitle="Selecciona un contrato vigente de la misma bóveda con un difunto distinto."
      onClose={onClose}
      size="lg"
    >
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
          placeholder="Buscar por número, nombre o apellido del difunto…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
          autoFocus
        />
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">Contrato</th>
              <th className="px-3 py-2">Difunto</th>
              <th className="px-3 py-2">Bóveda</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                  Cargando candidatos…
                </td>
              </tr>
            ) : candidatos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                  No hay contratos elegibles en esta bóveda.
                </td>
              </tr>
            ) : (
              candidatos.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-700">
                    {c.numeroSecuencial}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-slate-800">
                      {c.difunto.nombre} {c.difunto.apellido}
                    </div>
                    {c.difunto.numeroIdentificacion && (
                      <div className="text-xs text-slate-400">
                        {c.difunto.numeroIdentificacion}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">
                    {c.boveda?.numero}{' '}
                    <span className="text-xs text-slate-400">
                      ({c.boveda?.bloque?.nombre})
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => relacionar(c.id)}
                      disabled={linking !== null}
                      className="rounded-md bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                    >
                      {linking === c.id ? 'Vinculando…' : 'Relacionar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={linking !== null}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </ModalShell>
  );
}

// ----------------------------------------------------------------------------

function ModalShell({
  title,
  subtitle,
  size = 'md',
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  size?: 'md' | 'lg';
  onClose: () => void;
  children: React.ReactNode;
}) {
  const widthClass = size === 'lg' ? 'max-w-3xl' : 'max-w-md';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${widthClass} rounded-xl bg-white shadow-lifted`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <i className="ti ti-x" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
