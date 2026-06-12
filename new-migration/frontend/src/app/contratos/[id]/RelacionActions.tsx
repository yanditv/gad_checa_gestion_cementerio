'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Link2, Search, Unlink } from 'lucide-react';
import {
  Button,
  DataTable,
  EmptyState,
  Modal,
  type DataTableColumn,
} from '@/components/ui';

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
          <span className="text-xs uppercase tracking-wide text-slate-600">
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
          <Unlink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
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
        <Link2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
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
    <Modal
      open
      onClose={onCancel}
      title="Romper relación"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} disabled={busy}>
            {busy ? 'Procesando…' : 'Romper relación'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      <p className="text-sm text-slate-600">
        ¿Confirmas que deseas romper la relación entre estos dos contratos? La
        operación se aplica a ambos.
      </p>
    </Modal>
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

  const columns: DataTableColumn<CandidatoContrato>[] = [
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
      sortValue: (c) => `${c.difunto.nombre} ${c.difunto.apellido}`,
      cell: (c) => (
        <>
          <div className="text-sm text-slate-800">
            {c.difunto.nombre} {c.difunto.apellido}
          </div>
          {c.difunto.numeroIdentificacion && (
            <div className="text-xs text-slate-600">
              {c.difunto.numeroIdentificacion}
            </div>
          )}
        </>
      ),
    },
    {
      key: 'boveda',
      header: 'Bóveda',
      sortable: true,
      sortValue: (c) => c.boveda?.numero ?? null,
      cell: (c) => (
        <span className="text-sm text-slate-600">
          {c.boveda?.numero}{' '}
          <span className="text-xs text-slate-600">
            ({c.boveda?.bloque?.nombre})
          </span>
        </span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      cell: (c) => (
        <button
          type="button"
          onClick={() => relacionar(c.id)}
          disabled={linking !== null}
          className="rounded-md bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {linking === c.id ? 'Vinculando…' : 'Relacionar'}
        </button>
      ),
    },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Relacionar con otro contrato"
      description="Selecciona un contrato vigente de la misma bóveda con un difunto distinto."
      size="lg"
      footer={
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={linking !== null}
        >
          Cancelar
        </Button>
      }
    >
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          strokeWidth={2}
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, nombre o apellido del difunto…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-600 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
          autoFocus
        />
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
        <DataTable
          columns={columns}
          rows={candidatos}
          rowKey={(c) => c.id}
          loading={loading}
          skeletonRows={3}
          empty={
            <EmptyState
              title="No hay contratos elegibles en esta bóveda."
              compact
            />
          }
        />
      </div>
    </Modal>
  );
}
