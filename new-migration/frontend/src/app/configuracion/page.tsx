'use client';

import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Building2,
  ChevronRight,
  Database,
  Landmark,
  LayoutGrid,
  Loader2,
  Lock,
  Pencil,
  Percent,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Modal,
  Tabs,
  type DataTableColumn,
} from '@/components/ui';
import {
  cementeriosApi,
  gadInformacionApi,
  catastroApi,
  tiposEspacioApi,
  descuentosApi,
  bancosApi,
  type TipoEspacio,
  type Descuento,
  type Banco,
} from '@/lib/api';

import {
  DEFAULT_PREAMBULO,
  DEFAULT_CLAUSULA1,
  DEFAULT_CLAUSULA2,
  DEFAULT_CLAUSULA3,
  DEFAULT_CLAUSULA4,
  DEFAULT_CLAUSULA5,
  DEFAULT_CLAUSULA6,
} from '@/lib/default-contrato-templates';

type Tab = 'descuentos' | 'bancos' | 'tipos' | 'cementerio';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600';

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>('descuentos');
  const [roles, setRoles] = useState<string[]>([]);
  const [lastImport, setLastImport] = useState<{
    id: number;
    filename: string;
    estado: string;
    fechaInicio: string;
    registrosProcesados: number;
    bloquesCreados: number;
    bovedasCreadas: number;
    contratosCreados: number;
    errores: string | null;
  } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload?.data?.roles) setRoles(payload.data.roles);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    catastroApi.list({ limit: 1 })
      .then((res: any) => {
        const items = res?.data ?? res?.items ?? [];
        if (Array.isArray(items) && items.length > 0) {
          setLastImport(items[0]);
        }
      })
      .catch(() => {});
  }, []);

  const isAdmin = roles.includes('Administrador') || roles.includes('Admin');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestión de descuentos y bancos disponibles al cobrar.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/configuracion/catastro"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
          >
            <Database className="h-4 w-4" strokeWidth={2} aria-hidden="true" />{' '}
            Importar catastro
          </Link>
        )}
      </div>

      {!isAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Lock
            className="mr-1 inline h-4 w-4 align-[-0.125em]"
            strokeWidth={2}
            aria-hidden="true"
          />
          Solo lectura. Para modificar la configuración se requiere rol{' '}
          <strong>Administrador</strong>.
        </div>
      )}

      {isAdmin && lastImport && (
        <Link
          href="/configuracion/catastro"
          className="block rounded-xl border border-slate-200 bg-white p-4 shadow-soft transition-colors hover:border-primary-200 hover:bg-primary-50/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                <Database className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Última importación de catastro
                </p>
                <p className="text-xs text-slate-500">
                  {lastImport.filename} · {new Date(lastImport.fechaInicio).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-700">{lastImport.registrosProcesados} registros</p>
                <p className="text-xs text-slate-600">
                  {lastImport.bloquesCreados} bloques · {lastImport.bovedasCreadas} bóvedas · {lastImport.contratosCreados} contratos
                </p>
              </div>
              <Badge
                tone={
                  lastImport.estado === 'COMPLETADO'
                    ? 'success'
                    : lastImport.estado === 'ERROR'
                      ? 'danger'
                      : 'warning'
                }
              >
                {lastImport.estado === 'EN_PROGRESO' ? 'En progreso' : lastImport.estado === 'COMPLETADO' ? 'Completado' : 'Error'}
              </Badge>
              <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={2} aria-hidden="true" />
            </div>
          </div>
        </Link>
      )}

      <div className="overflow-x-auto border-b border-slate-200">
        <nav className="-mb-px flex gap-4">
          <TabButton
            active={tab === 'descuentos'}
            onClick={() => setTab('descuentos')}
            icon={<Percent className="h-4 w-4" aria-hidden="true" />}
            label="Descuentos"
          />
          <TabButton
            active={tab === 'bancos'}
            onClick={() => setTab('bancos')}
            icon={<Landmark className="h-4 w-4" aria-hidden="true" />}
            label="Bancos"
          />
          <TabButton
            active={tab === 'tipos'}
            onClick={() => setTab('tipos')}
            icon={<LayoutGrid className="h-4 w-4" aria-hidden="true" />}
            label="Tipos de espacio"
          />
          <TabButton
            active={tab === 'cementerio'}
            onClick={() => setTab('cementerio')}
            icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
            label="Cementerio"
          />
        </nav>
      </div>

      {tab === 'descuentos' ? (
        <DescuentosPanel canEdit={isAdmin} />
      ) : tab === 'bancos' ? (
        <BancosPanel canEdit={isAdmin} />
      ) : tab === 'tipos' ? (
        <TiposEspacioPanel canEdit={isAdmin} />
      ) : (
        <CementerioPanel canEdit={isAdmin} />
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
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
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
    setError(null);
    try {
      const res = await descuentosApi.findAll({ includeInactive: true });
      setItems(res ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los descuentos',
      );
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
      await descuentosApi.delete(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo descuento
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3 text-right">Porcentaje</th>
                <th scope="col" className="px-4 py-3">Descripción</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                {canEdit && <th scope="col" className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={canEdit ? 5 : 4}
                    className="px-4 py-8 text-center text-slate-600"
                  >
                    Cargando descuentos…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 5 : 4}
                    className="px-4 py-10 text-center text-slate-600"
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
                          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {d.estado && (
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            className="ml-1 rounded-md p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
                            title="Desactivar"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
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
      if (initial) {
        await descuentosApi.update(initial.id, {
          nombre,
          porcentaje: Number(porcentaje),
          descripcion: descripcion || undefined,
          estado,
        });
      } else {
        await descuentosApi.create({
          nombre,
          porcentaje: Number(porcentaje),
          descripcion: descripcion || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
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
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
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
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
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
    setError(null);
    try {
      const res = await bancosApi.findAll({ includeInactive: true });
      setItems(res ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron cargar los bancos',
      );
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
      await bancosApi.delete(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo banco
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Cuenta</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                {canEdit && <th scope="col" className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={canEdit ? 4 : 3}
                    className="px-4 py-8 text-center text-slate-600"
                  >
                    Cargando bancos…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 4 : 3}
                    className="px-4 py-10 text-center text-slate-600"
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
                          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {b.estado && (
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id)}
                            className="ml-1 rounded-md p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
                            title="Desactivar"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
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
      if (initial) {
        await bancosApi.update(initial.id, {
          nombre,
          cuenta: cuenta || undefined,
          estado,
        });
      } else {
        await bancosApi.create({
          nombre,
          cuenta: cuenta || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
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
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
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
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// =============================================================================
// Tipos de espacio (catálogo configurable: Bóveda, Nicho, Túmulo…)
// =============================================================================
function TiposEspacioPanel({ canEdit }: { canEdit: boolean }) {
  const [items, setItems] = useState<TipoEspacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<TipoEspacio | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tiposEspacioApi.findPage({
        includeInactive: true,
        limit: 100,
      });
      setItems(res?.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los tipos de espacio',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: number) {
    if (!window.confirm('¿Dar de baja este tipo de espacio?')) return;
    try {
      await tiposEspacioApi.delete(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo dar de baja');
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Tipos de espacio (Bóveda, Nicho, Túmulo…) con su tarifa, años de
          arriendo, veces de renovación y prefijo de numeración.
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo tipo
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Prefijo</th>
                <th scope="col" className="px-4 py-3 text-right">Tarifa</th>
                <th scope="col" className="px-4 py-3 text-right">Años</th>
                <th scope="col" className="px-4 py-3 text-right">Renovaciones</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                {canEdit && <th scope="col" className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={canEdit ? 7 : 6}
                    className="px-4 py-8 text-center text-slate-600"
                  >
                    Cargando tipos de espacio…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 7 : 6}
                    className="px-4 py-10 text-center text-slate-600"
                  >
                    No hay tipos de espacio registrados.
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">
                      {t.nombre}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                      {t.prefijoNumeracion || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm">
                      ${Number(t.tarifaArriendo).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm">
                      {t.aniosArriendo}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm">
                      {t.vecesRenovacion}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          t.estado
                            ? 'bg-green-50 text-green-700 ring-green-200'
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                      >
                        {t.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditing(t)}
                          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {t.estado && (
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="ml-1 rounded-md p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
                            title="Dar de baja"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
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
        <TipoEspacioModal
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

function TipoEspacioModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: TipoEspacio | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [prefijoNumeracion, setPrefijoNumeracion] = useState(
    initial?.prefijoNumeracion ?? '',
  );
  const [tarifaArriendo, setTarifaArriendo] = useState(
    initial ? Number(initial.tarifaArriendo) : 0,
  );
  const [aniosArriendo, setAniosArriendo] = useState(
    initial ? Number(initial.aniosArriendo) : 0,
  );
  const [vecesRenovacion, setVecesRenovacion] = useState(
    initial ? Number(initial.vecesRenovacion) : 0,
  );
  const [estado, setEstado] = useState(initial?.estado ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      if (initial) {
        await tiposEspacioApi.update(initial.id, {
          nombre,
          prefijoNumeracion: prefijoNumeracion.trim() || undefined,
          tarifaArriendo: Number(tarifaArriendo),
          aniosArriendo: Number(aniosArriendo),
          vecesRenovacion: Number(vecesRenovacion),
          estado,
        });
      } else {
        await tiposEspacioApi.create({
          nombre,
          prefijoNumeracion: prefijoNumeracion.trim() || undefined,
          tarifaArriendo: Number(tarifaArriendo),
          aniosArriendo: Number(aniosArriendo),
          vecesRenovacion: Number(vecesRenovacion),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={initial ? 'Editar tipo de espacio' : 'Nuevo tipo de espacio'}
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
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <div>
          <label className={LABEL_CLS}>Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Bóveda, Nicho, Túmulo…"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Prefijo de numeración</label>
          <input
            value={prefijoNumeracion}
            onChange={(e) => setPrefijoNumeracion(e.target.value)}
            placeholder="CTR, NCH, TML…"
            className={INPUT_CLS}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={LABEL_CLS}>Tarifa arriendo</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={tarifaArriendo}
              onChange={(e) => setTarifaArriendo(Number(e.target.value))}
              required
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Años arriendo</label>
            <input
              type="number"
              min={0}
              step="1"
              value={aniosArriendo}
              onChange={(e) => setAniosArriendo(Number(e.target.value))}
              required
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Veces renovación</label>
            <input
              type="number"
              min={0}
              step="1"
              value={vecesRenovacion}
              onChange={(e) => setVecesRenovacion(Number(e.target.value))}
              required
              className={INPUT_CLS}
            />
          </div>
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
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// El preámbulo y las cláusulas predeterminadas se importan de '@/lib/default-contrato-templates'

// =============================================================================
// Cementerio + GADInformacion
// =============================================================================
function CementerioPanel({ canEdit }: { canEdit: boolean }) {
  const [cementerio, setCementerio] = useState<any>(null);
  const [gad, setGad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [headerUploadError, setHeaderUploadError] = useState<string | null>(null);
  const [uploadingFooter, setUploadingFooter] = useState(false);
  const [footerUploadError, setFooterUploadError] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setLogoUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/cementerios/gad-informacion/image?type=logo', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Error al subir el logo');
      const payload = await res.json();
      setGadField('logoUrl', payload.url);
    } catch (err) {
      setLogoUploadError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeader(true);
    setHeaderUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/cementerios/gad-informacion/image?type=header', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Error al subir la cabecera');
      const payload = await res.json();
      setGadField('headerImagenUrl', payload.url);
    } catch (err) {
      setHeaderUploadError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploadingHeader(false);
    }
  };

  const handleFooterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFooter(true);
    setFooterUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/cementerios/gad-informacion/image?type=footer', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Error al subir el pie de página');
      const payload = await res.json();
      setGadField('footerImagenUrl', payload.url);
    } catch (err) {
      setFooterUploadError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploadingFooter(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cemList, gadData] = await Promise.all([
        cementeriosApi.findAll(),
        gadInformacionApi.get(),
      ]) as [any, any];
      const list = Array.isArray(cemList) ? cemList : cemList?.data ?? [];
      const cem = Array.isArray(list) ? list[0] : list;
      if (cem) {
        if (!cem.contratoPreambulo) cem.contratoPreambulo = DEFAULT_PREAMBULO;
        if (!cem.contratoClausula1) cem.contratoClausula1 = DEFAULT_CLAUSULA1;
        if (!cem.contratoClausula2) cem.contratoClausula2 = DEFAULT_CLAUSULA2;
        if (!cem.contratoClausula3) cem.contratoClausula3 = DEFAULT_CLAUSULA3;
        if (!cem.contratoClausula4) cem.contratoClausula4 = DEFAULT_CLAUSULA4;
        if (!cem.contratoClausula5) cem.contratoClausula5 = DEFAULT_CLAUSULA5;
        if (!cem.contratoClausula6) cem.contratoClausula6 = DEFAULT_CLAUSULA6;
      }
      setCementerio(cem);
      setGad((gadData as any)?.data ?? gadData);
    } catch (err) {
      setError('No se pudieron cargar los datos de configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSaveCementerio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cementerio?.id) return;
    setError(null);
    setSaving(true);
    try {
      const {
        id,
        estado,
        fechaCreacion,
        fechaActualizacion,
        fechaEliminacion,
        usuarioCreador,
        usuarioCreadorId,
        usuarioActualizador,
        usuarioActualizadorId,
        usuarioEliminador,
        usuarioEliminadorId,
        bloques,
        ...updatePayload
      } = cementerio;
      await cementeriosApi.update(cementerio.id, updatePayload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGAD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gad) return;
    setError(null);
    setSaving(true);
    try {
      const {
        id,
        fechaCreacion,
        fechaActualizacion,
        usuarioCreador,
        usuarioCreadorId,
        usuarioActualizador,
        usuarioActualizadorId,
        ...updatePayload
      } = gad;
      await gadInformacionApi.update(updatePayload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  const setField = (key: string, value: any) => {
    setCementerio((prev: any) => (prev ? { ...prev, [key]: value } : prev));
  };

  const setGadField = (key: string, value: any) => {
    setGad((prev: any) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      )}

      {saved && (
        <div role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-green-200">Guardado correctamente.</div>
      )}

      {/* Cementerio */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Datos del cementerio</h2>
        </header>
        <form onSubmit={handleSaveCementerio} className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" value={cementerio?.nombre ?? ''} onChange={(v) => setField('nombre', v)} disabled={!canEdit} />
            <Field label="Dirección" value={cementerio?.direccion ?? ''} onChange={(v) => setField('direccion', v)} disabled={!canEdit} />
            <Field label="Teléfono" value={cementerio?.telefono ?? ''} onChange={(v) => setField('telefono', v)} disabled={!canEdit} />
            <Field label="Email" value={cementerio?.email ?? ''} onChange={(v) => setField('email', v)} disabled={!canEdit} />
            <Field label="RUC" value={cementerio?.ruc ?? ''} onChange={(v) => setField('ruc', v)} disabled={!canEdit} />
            <Field label="Título presidente" value={cementerio?.abreviaturaTituloPresidente ?? ''} onChange={(v) => setField('abreviaturaTituloPresidente', v)} disabled={!canEdit} />
            <Field label="Presidente" value={cementerio?.presidente ?? ''} onChange={(v) => setField('presidente', v)} disabled={!canEdit} />
          </div>
          <h3 className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-600">Mora</h3>
          <p className="mb-3 text-xs text-slate-600">
            Las tarifas, años y veces de renovación por tipo de espacio se
            administran en la pestaña <strong>Tipos de espacio</strong>.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tasa mora diaria (%)" value={cementerio?.tasaMoraDiaria ?? ''} onChange={(v) => setField('tasaMoraDiaria', v ? Number(v) : null)} type="number" disabled={!canEdit} />
          </div>
          <h3 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-600">Datos bancarios</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Entidad financiera" value={cementerio?.entidadFinanciera ?? ''} onChange={(v) => setField('entidadFinanciera', v)} disabled={!canEdit} />
            <Field label="Nombre entidad" value={cementerio?.nombreEntidadFinanciera ?? ''} onChange={(v) => setField('nombreEntidadFinanciera', v)} disabled={!canEdit} />
            <Field label="Número de cuenta" value={cementerio?.numeroCuenta ?? ''} onChange={(v) => setField('numeroCuenta', v)} disabled={!canEdit} />
          </div>

          <details className="group mt-6 rounded-lg border border-slate-200 bg-slate-50/50">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-semibold text-slate-700 select-none">
              <span className="text-sm flex items-center gap-1.5">
                <i className="ti ti-file-text text-lg text-primary-500" />
                Plantillas del Contrato PDF (Cláusulas y Preámbulo)
              </span>
              <i className="ti ti-chevron-down text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-slate-200 p-4 space-y-4 bg-white">
              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">Guía de formato y variables:</p>
                <p className="mb-1">
                  1. Usa <code>**texto**</code> para formatear cualquier palabra en <strong>negrita</strong>.
                </p>
                <p>
                  2. Placeholders disponibles: <code>{`{presidente}`}</code>, <code>{`{responsableNombre}`}</code>, <code>{`{difuntoNombre}`}</code>, <code>{`{bovedaNumero}`}</code>, <code>{`{bloqueDescripcion}`}</code>, <code>{`{pisoNumero}`}</code>, <code>{`{montoTotal}`}</code>, <code>{`{bancoTexto}`}</code>, <code>{`{numeroCuenta}`}</code>, <code>{`{aniosArriendo}`}</code>, <code>{`{fechaInicioDia}`}</code>, <code>{`{fechaInicioMes}`}</code>, <code>{`{fechaInicioAnio}`}</code>, <code>{`{fechaFinDia}`}</code>, <code>{`{fechaFinMes}`}</code>, <code>{`{fechaFinAnio}`}</code>, <code>{`{gadNombre}`}</code>, <code>{`{parroquia}`}</code>.
                </p>
              </div>

              <div>
                <label className={LABEL_CLS}>Preámbulo del Contrato</label>
                <textarea
                  value={cementerio?.contratoPreambulo ?? ''}
                  onChange={(e) => setField('contratoPreambulo', e.target.value)}
                  disabled={!canEdit}
                  rows={4}
                  className={INPUT_CLS}
                  placeholder="Texto del preámbulo..."
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLS}>Cláusula Primera (Comparecientes)</label>
                  <textarea
                    value={cementerio?.contratoClausula1 ?? ''}
                    onChange={(e) => setField('contratoClausula1', e.target.value)}
                    disabled={!canEdit}
                    rows={4}
                    className={INPUT_CLS}
                    placeholder="Texto de la cláusula..."
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Cláusula Segunda (Antecedentes)</label>
                  <textarea
                    value={cementerio?.contratoClausula2 ?? ''}
                    onChange={(e) => setField('contratoClausula2', e.target.value)}
                    disabled={!canEdit}
                    rows={4}
                    className={INPUT_CLS}
                    placeholder="Texto de la cláusula..."
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Cláusula Tercera (Objeto)</label>
                  <textarea
                    value={cementerio?.contratoClausula3 ?? ''}
                    onChange={(e) => setField('contratoClausula3', e.target.value)}
                    disabled={!canEdit}
                    rows={4}
                    className={INPUT_CLS}
                    placeholder="Texto de la cláusula..."
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Cláusula Cuarta (Precio)</label>
                  <textarea
                    value={cementerio?.contratoClausula4 ?? ''}
                    onChange={(e) => setField('contratoClausula4', e.target.value)}
                    disabled={!canEdit}
                    rows={4}
                    className={INPUT_CLS}
                    placeholder="Texto de la cláusula..."
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Cláusula Quinta (Plazo)</label>
                  <textarea
                    value={cementerio?.contratoClausula5 ?? ''}
                    onChange={(e) => setField('contratoClausula5', e.target.value)}
                    disabled={!canEdit}
                    rows={4}
                    className={INPUT_CLS}
                    placeholder="Texto de la cláusula..."
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Cláusula Sexta (Suscripción)</label>
                  <textarea
                    value={cementerio?.contratoClausula6 ?? ''}
                    onChange={(e) => setField('contratoClausula6', e.target.value)}
                    disabled={!canEdit}
                    rows={4}
                    className={INPUT_CLS}
                    placeholder="Texto de la cláusula..."
                  />
                </div>
              </div>
            </div>
          </details>

          {canEdit && (
            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
                {saving ? 'Guardando…' : 'Guardar cementerio'}
              </button>
            </div>
          )}
        </form>
      </section>

      {/* GAD Informacion */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Información del GAD</h2>
        </header>
        <form onSubmit={handleSaveGAD} className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" value={gad?.nombre ?? ''} onChange={(v) => setGadField('nombre', v)} disabled={!canEdit} />
            <Field label="Dirección" value={gad?.direccion ?? ''} onChange={(v) => setGadField('direccion', v)} disabled={!canEdit} />
            <Field label="Teléfono" value={gad?.telefono ?? ''} onChange={(v) => setGadField('telefono', v)} disabled={!canEdit} />
            <Field label="Email" value={gad?.email ?? ''} onChange={(v) => setGadField('email', v)} disabled={!canEdit} />
            <Field label="RUC" value={gad?.ruc ?? ''} onChange={(v) => setGadField('ruc', v)} disabled={!canEdit} />
            <Field label="Sitio web" value={gad?.website ?? ''} onChange={(v) => setGadField('website', v)} disabled={!canEdit} />
            <div className="space-y-1">
              <Field label="Logo URL" value={gad?.logoUrl ?? ''} onChange={(v) => setGadField('logoUrl', v)} disabled={!canEdit} />
              {canEdit && (
                <div className="flex flex-col gap-1.5">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 w-fit">
                    <i className="ti ti-upload" /> Subir archivo de logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  </label>
                  {uploadingLogo && <span className="text-[10px] text-primary-500 animate-pulse">Subiendo logo...</span>}
                  {logoUploadError && <span className="text-[10px] text-red-500">{logoUploadError}</span>}
                </div>
              )}
              <div className="mt-2">
                <span className="block text-xs font-medium text-slate-500 mb-1">Vista previa del logo:</span>
                <div className="h-24 w-24 relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                  <img
                    src={gad?.logoUrl || '/logo.png'}
                    alt="Logo del GAD / Cementerio"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                </div>
              </div>
            </div>
            <Field label="Eslogan" value={gad?.slogan ?? ''} onChange={(v) => setGadField('slogan', v)} disabled={!canEdit} />
          </div>

          <h3 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Banners del Contrato PDF (Cabecera y Pie)
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border border-slate-200 rounded-lg p-4 bg-slate-50/50 mb-4">
            {/* Cabecera (Header Image) */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={gad?.usarHeaderImagen ?? false}
                  onChange={(e) => setGadField('usarHeaderImagen', e.target.checked)}
                  disabled={!canEdit}
                  className="rounded border-slate-300 text-primary-500 focus:ring-primary-500 h-4 w-4"
                />
                Usar imagen de cabecera personalizada (Banner)
              </label>

              {gad?.usarHeaderImagen && (
                <div className="space-y-2 pl-6">
                  <Field label="URL Cabecera" value={gad?.headerImagenUrl ?? ''} onChange={(v) => setGadField('headerImagenUrl', v)} disabled={!canEdit} />
                  {canEdit && (
                    <div className="flex flex-col gap-1.5">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 w-fit">
                        <i className="ti ti-upload" /> Subir banner de cabecera
                        <input type="file" accept="image/*" className="hidden" onChange={handleHeaderUpload} disabled={uploadingHeader} />
                      </label>
                      {uploadingHeader && <span className="text-[10px] text-primary-500 animate-pulse">Subiendo cabecera...</span>}
                      {headerUploadError && <span className="text-[10px] text-red-500">{headerUploadError}</span>}
                    </div>
                  )}
                  <div className="mt-2">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Vista previa del banner:</span>
                    <div className="h-16 w-full relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                      {gad?.headerImagenUrl ? (
                        <img src={gad.headerImagenUrl} alt="Cabecera Contrato" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400">Sin imagen de cabecera</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie de Página (Footer Image) */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={gad?.usarFooterImagen ?? false}
                  onChange={(e) => setGadField('usarFooterImagen', e.target.checked)}
                  disabled={!canEdit}
                  className="rounded border-slate-300 text-primary-500 focus:ring-primary-500 h-4 w-4"
                />
                Usar imagen de pie de página personalizada (Banner)
              </label>

              {gad?.usarFooterImagen && (
                <div className="space-y-2 pl-6">
                  <Field label="URL Pie de Página" value={gad?.footerImagenUrl ?? ''} onChange={(v) => setGadField('footerImagenUrl', v)} disabled={!canEdit} />
                  {canEdit && (
                    <div className="flex flex-col gap-1.5">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 w-fit">
                        <i className="ti ti-upload" /> Subir banner de pie
                        <input type="file" accept="image/*" className="hidden" onChange={handleFooterUpload} disabled={uploadingFooter} />
                      </label>
                      {uploadingFooter && <span className="text-[10px] text-primary-500 animate-pulse">Subiendo pie...</span>}
                      {footerUploadError && <span className="text-[10px] text-red-500">{footerUploadError}</span>}
                    </div>
                  )}
                  <div className="mt-2">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Vista previa del banner:</span>
                    <div className="h-16 w-full relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                      {gad?.footerImagenUrl ? (
                        <img src={gad.footerImagenUrl} alt="Pie de Página Contrato" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400">Sin imagen de pie de página</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className={LABEL_CLS}>Misión</label>
              <textarea value={gad?.mision ?? ''} onChange={(e) => setGadField('mision', e.target.value)}
                disabled={!canEdit} rows={3}
                className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Visión</label>
              <textarea value={gad?.vision ?? ''} onChange={(e) => setGadField('vision', e.target.value)}
                disabled={!canEdit} rows={3}
                className={INPUT_CLS} />
            </div>
          </div>
          {canEdit && (
            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
                {saving ? 'Guardando…' : 'Guardar GAD'}
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, disabled, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; type?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLS}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        disabled={disabled} step={type === 'number' ? '0.01' : undefined}
        className={`${INPUT_CLS} ${disabled ? 'bg-slate-50 text-slate-500' : ''}`} />
    </div>
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
      aria-modal="true"
      aria-label={title}
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
            className="rounded-md p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
