'use client';

import { useCallback, useEffect, useState } from 'react';

type Tab = 'descuentos' | 'bancos';

interface Descuento {
  id: number;
  nombre: string;
  porcentaje: number | string;
  descripcion: string | null;
  estado: boolean;
}

interface Banco {
  id: number;
  nombre: string;
  cuenta: string | null;
  estado: boolean;
}

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>('descuentos');
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload?.data?.roles) setRoles(payload.data.roles);
      })
      .catch(() => undefined);
  }, []);

  const isAdmin = roles.includes('Administrador') || roles.includes('Admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestión de descuentos y bancos disponibles al cobrar.
        </p>
      </div>

      {!isAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <i className="ti ti-shield-lock mr-1" />
          Solo lectura. Para modificar la configuración se requiere rol{' '}
          <strong>Administrador</strong>.
        </div>
      )}

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-4">
          <TabButton
            active={tab === 'descuentos'}
            onClick={() => setTab('descuentos')}
            icon="ti-discount"
            label="Descuentos"
          />
          <TabButton
            active={tab === 'bancos'}
            onClick={() => setTab('bancos')}
            icon="ti-building-bank"
            label="Bancos"
          />
        </nav>
      </div>

      {tab === 'descuentos' ? (
        <DescuentosPanel canEdit={isAdmin} />
      ) : (
        <BancosPanel canEdit={isAdmin} />
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

// =============================================================================
// Descuentos
// =============================================================================
function DescuentosPanel({ canEdit }: { canEdit: boolean }) {
  const [items, setItems] = useState<Descuento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Descuento | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/descuentos?includeInactive=true', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('No se pudieron cargar los descuentos');
      const payload = await res.json();
      setItems(Array.isArray(payload) ? payload : payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: number) {
    if (!window.confirm('¿Desactivar este descuento?')) return;
    try {
      const res = await fetch(`/api/descuentos/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo eliminar');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Descuentos aplicables al crear contratos y cobrar cuotas.
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-plus" />
            Nuevo descuento
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3 text-right">Porcentaje</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Estado</th>
                {canEdit && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={canEdit ? 5 : 4}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Cargando descuentos…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 5 : 4}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No hay descuentos registrados.
                  </td>
                </tr>
              ) : (
                items.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">
                      {d.nombre}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm">
                      {Number(d.porcentaje).toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {d.descripcion || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          d.estado
                            ? 'bg-green-50 text-green-700 ring-green-200'
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                      >
                        {d.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditing(d)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                          title="Editar"
                        >
                          <i className="ti ti-edit" />
                        </button>
                        {d.estado && (
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            className="ml-1 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Desactivar"
                          >
                            <i className="ti ti-trash" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && canEdit && (
        <DescuentoModal
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void load();
          }}
        />
      )}
    </section>
  );
}

function DescuentoModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Descuento | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [porcentaje, setPorcentaje] = useState(
    initial ? Number(initial.porcentaje) : 0,
  );
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '');
  const [estado, setEstado] = useState(initial?.estado ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      const url = initial
        ? `/api/descuentos/${initial.id}`
        : '/api/descuentos';
      const method = initial ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        nombre,
        porcentaje: Number(porcentaje),
        descripcion: descripcion || undefined,
      };
      if (initial) body.estado = estado;
      const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo guardar');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={initial ? 'Editar descuento' : 'Nuevo descuento'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="space-y-4 p-5"
      >
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <div>
          <label className={LABEL_CLS}>Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Porcentaje (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={porcentaje}
            onChange={(e) => setPorcentaje(Number(e.target.value))}
            required
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Descripción</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        {initial && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={estado}
              onChange={(e) => setEstado(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-300"
            />
            Activo
          </label>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !nombre.trim()}
            className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// =============================================================================
// Bancos
// =============================================================================
function BancosPanel({ canEdit }: { canEdit: boolean }) {
  const [items, setItems] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Banco | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bancos?includeInactive=true', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('No se pudieron cargar los bancos');
      const payload = await res.json();
      setItems(Array.isArray(payload) ? payload : payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: number) {
    if (!window.confirm('¿Desactivar este banco?')) return;
    try {
      const res = await fetch(`/api/bancos/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo eliminar');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Entidades financieras para transferencias y cheques.
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-plus" />
            Nuevo banco
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Cuenta</th>
                <th className="px-4 py-3">Estado</th>
                {canEdit && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={canEdit ? 4 : 3}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Cargando bancos…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 4 : 3}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No hay bancos registrados.
                  </td>
                </tr>
              ) : (
                items.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">
                      {b.nombre}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                      {b.cuenta || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          b.estado
                            ? 'bg-green-50 text-green-700 ring-green-200'
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                      >
                        {b.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditing(b)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                          title="Editar"
                        >
                          <i className="ti ti-edit" />
                        </button>
                        {b.estado && (
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id)}
                            className="ml-1 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Desactivar"
                          >
                            <i className="ti ti-trash" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && canEdit && (
        <BancoModal
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void load();
          }}
        />
      )}
    </section>
  );
}

function BancoModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Banco | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [cuenta, setCuenta] = useState(initial?.cuenta ?? '');
  const [estado, setEstado] = useState(initial?.estado ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      const url = initial ? `/api/bancos/${initial.id}` : '/api/bancos';
      const method = initial ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        nombre,
        cuenta: cuenta || undefined,
      };
      if (initial) body.estado = estado;
      const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo guardar');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={initial ? 'Editar banco' : 'Nuevo banco'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="space-y-4 p-5"
      >
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <div>
          <label className={LABEL_CLS}>Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Cuenta</label>
          <input
            value={cuenta ?? ''}
            onChange={(e) => setCuenta(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        {initial && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={estado}
              onChange={(e) => setEstado(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-300"
            />
            Activo
          </label>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !nombre.trim()}
            className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// =============================================================================
// Modal shell
// =============================================================================
function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-lifted">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <i className="ti ti-x" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
