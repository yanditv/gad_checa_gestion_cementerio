'use client';

import { FormEvent, useEffect, useState } from 'react';
import { rolesApi } from '@/lib/api';

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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
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
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Guardando…
                  </>
                ) : (
                  <>
                    <i className="ti ti-plus" />
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3">Usuarios</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-400">
                      <i className="ti ti-shield-off text-3xl text-slate-300" />
                      <div className="mt-2 text-sm">No hay roles registrados.</div>
                    </td>
                  </tr>
                ) : (
                  roles.map((rol) => (
                    <tr key={rol.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{rol.nombre}</td>
                      <td className="px-4 py-3 text-slate-600">
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
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(rol)}
                            disabled={busyRoleId === rol.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            <i className="ti ti-edit" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rol.id)}
                            disabled={busyRoleId === rol.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            <i className={`ti ${busyRoleId === rol.id ? 'ti-loader animate-spin' : 'ti-trash'}`} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editingRoleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={cancelEdit}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lifted">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Editar rol</h2>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <i className="ti ti-x" />
              </button>
            </header>
            <div className="space-y-4 p-5">
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
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate(editingRoleId)}
                  disabled={busyRoleId === editingRoleId}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
                >
                  <i className={`ti ${busyRoleId === editingRoleId ? 'ti-loader animate-spin' : 'ti-check'}`} />
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
