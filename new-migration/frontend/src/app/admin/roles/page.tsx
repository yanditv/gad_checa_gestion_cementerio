'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, Loader2, Pencil, Plus, ShieldOff, Trash2 } from 'lucide-react';
import { rolesApi } from '@/lib/api';
import {
  Button,
  DataTable,
  EmptyState,
  Modal,
  type DataTableColumn,
} from '@/components/ui';

export default function AdminRolesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ nombre: '', permisos: '' });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({ nombre: '', permisos: '' });
  const [busyRoleId, setBusyRoleId] = useState<string | null>(null);

  const loadRoles = async () => {
    setError('');
    try {
      const data = await rolesApi.findAll();
      setRoles(data);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await rolesApi.create(formData);
      setFormData({ nombre: '', permisos: '' });
      await loadRoles();
    } catch (err: any) {
      setError(err.message || 'No se pudo crear el rol');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar rol?')) return;
    setBusyRoleId(id);
    setError('');
    try {
      await rolesApi.delete(id);
      await loadRoles();
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar el rol');
    } finally {
      setBusyRoleId(null);
    }
  };

  const startEdit = (rol: any) => {
    setEditingRoleId(rol.id);
    setEditingForm({
      nombre: rol.nombre || '',
      permisos: rol.permisos || '',
    });
  };

  const cancelEdit = () => {
    setEditingRoleId(null);
    setEditingForm({ nombre: '', permisos: '' });
  };

  const handleUpdate = async (id: string) => {
    setBusyRoleId(id);
    setError('');
    try {
      await rolesApi.update(id, editingForm);
      await loadRoles();
      cancelEdit();
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el rol');
    } finally {
      setBusyRoleId(null);
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      sortValue: (rol) => rol.nombre,
      cell: (rol) => (
        <span className="font-medium text-slate-900">{rol.nombre}</span>
      ),
    },
    {
      key: 'usuarios',
      header: 'Usuarios',
      sortable: true,
      sortValue: (rol) => rol.usuarios?.length || 0,
      cell: (rol) => (
        <div className="text-slate-600">
          <div>{rol.usuarios?.length || 0}</div>
          {rol.usuarios?.length > 0 && (
            <div className="mt-1 text-xs text-slate-400">
              {rol.usuarios
                .slice(0, 3)
                .map((item: any) => item.usuario?.email)
                .filter(Boolean)
                .join(', ')}
              {rol.usuarios.length > 3 ? '…' : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cellClassName: 'whitespace-nowrap',
      cell: (rol) => (
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => startEdit(rol)}
            disabled={busyRoleId === rol.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => handleDelete(rol.id)}
            disabled={busyRoleId === rol.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {busyRoleId === rol.id ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            )}
            Eliminar
          </button>
        </div>
      ),
    },
  ];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Roles</h1>
        <p className="mt-1 text-sm text-slate-500">
          Crear y administrar roles del sistema.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Nuevo rol */}
        <section className="lg:col-span-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Nuevo Rol</h2>
          </header>
          <div className="p-5">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Permisos (texto)
                </label>
                <textarea
                  rows={4}
                  value={formData.permisos}
                  onChange={(e) => setFormData({ ...formData, permisos: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    Crear Rol
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Roles existentes */}
        <section className="lg:col-span-7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Roles Existentes</h2>
          </header>
          <DataTable
            columns={columns}
            rows={roles}
            rowKey={(rol) => rol.id}
            empty={
              <EmptyState
                icon={
                  <ShieldOff className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                }
                title="No hay roles registrados."
                compact
              />
            }
          />
        </section>
      </div>

      <Modal
        open={editingRoleId !== null}
        onClose={cancelEdit}
        title="Editar rol"
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={cancelEdit}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => editingRoleId && handleUpdate(editingRoleId)}
              loading={busyRoleId === editingRoleId}
              leftIcon={<Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            >
              Guardar cambios
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nombre
            </label>
            <input
              type="text"
              value={editingForm.nombre}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, nombre: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Permisos
            </label>
            <textarea
              rows={5}
              value={editingForm.permisos}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, permisos: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
