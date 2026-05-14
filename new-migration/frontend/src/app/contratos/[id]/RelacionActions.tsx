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
  fechaInicio: string;
  fechaFin: string | null;
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
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <div>
          <span className="text-muted small me-2">
            Comparte bóveda con:
          </span>
          <Link
            href={`/contratos/${relacionado.id}`}
            className="link-primary fw-semibold"
          >
            {relacionado.numeroSecuencial}
          </Link>
          {relacionado.difunto && (
            <span className="text-muted small ms-2">
              ({relacionado.difunto.nombre} {relacionado.difunto.apellido})
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() => setConfirmRomper(true)}
          disabled={busy}
        >
          <i className="ti ti-unlink me-1"></i> Romper relación
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
                setError(
                  err instanceof Error ? err.message : 'Error',
                );
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
        className="btn btn-sm btn-outline-primary"
        onClick={() => setOpen(true)}
      >
        <i className="ti ti-link me-1"></i> Relacionar con otro contrato
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
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <p>
        ¿Confirmas que deseas romper la relación entre estos dos contratos?
        La operación se aplica a ambos.
      </p>
      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={onConfirm}
          disabled={busy}
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
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="search-box mb-3">
        <i className="ti ti-search"></i>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por número, nombre o apellido del difunto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <div className="table-responsive" style={{ maxHeight: 360 }}>
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Difunto</th>
              <th>Bóveda</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-3">
                  Cargando candidatos…
                </td>
              </tr>
            ) : candidatos.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-3">
                  No hay contratos elegibles en esta bóveda.
                </td>
              </tr>
            ) : (
              candidatos.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.numeroSecuencial}</strong>
                  </td>
                  <td>
                    {c.difunto.nombre} {c.difunto.apellido}
                    {c.difunto.numeroIdentificacion && (
                      <small className="text-muted d-block">
                        {c.difunto.numeroIdentificacion}
                      </small>
                    )}
                  </td>
                  <td>
                    {c.boveda?.numero}{' '}
                    <small className="text-muted">
                      ({c.boveda?.bloque?.nombre})
                    </small>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={linking !== null}
                      onClick={() => relacionar(c.id)}
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

      <div className="d-flex justify-content-end mt-3">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={linking !== null}
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
  return (
    <div
      className="modal show d-block"
      role="dialog"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal-dialog modal-dialog-centered ${size === 'lg' ? 'modal-lg' : ''}`}
      >
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title mb-0">{title}</h5>
              {subtitle && (
                <small className="text-muted">{subtitle}</small>
              )}
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={onClose}
            />
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}
