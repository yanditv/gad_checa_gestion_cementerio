'use client';

import { useEffect, useState } from 'react';
import { rolesApi, usuariosApi } from '@/lib/api';

export default function AdminUsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [usuariosData, rolesData] = await Promise.all([usuariosApi.findAll(), rolesApi.findAll()]);
      setUsuarios(usuariosData);
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la gestión de usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleEstado = async (id: string, estado: boolean) => {
    await usuariosApi.updateEstado(id, !estado);
    await loadData();
  };

  const updateRoles = async (id: string, selected: string[]) => {
    await usuariosApi.setRoles(id, selected);
    await loadData();
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
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Administración básica de usuarios y roles.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3">Usuario</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Roles</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    <i className="ti ti-users-off text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">No hay usuarios registrados.</div>
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => {
                  const currentRoles = usuario.usuarioRols?.map((item: any) => item.rolId) || [];

                  return (
                    <tr key={usuario.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {usuario.nombre} {usuario.apellido}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{usuario.email}</td>
                      <td className="px-4 py-3">
                        <select
                          multiple
                          value={currentRoles}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                            updateRoles(usuario.id, values);
                          }}
                          className="min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        >
                          {roles.map((rol) => (
                            <option key={rol.id} value={rol.id}>
                              {rol.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                            usuario.estado
                              ? 'bg-green-50 text-green-700 ring-green-200'
                              : 'bg-red-50 text-red-700 ring-red-200'
                          }`}
                        >
                          {usuario.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleEstado(usuario.id, usuario.estado)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                            usuario.estado
                              ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              : 'bg-primary-500 text-white hover:bg-primary-600'
                          }`}
                        >
                          <i className={`ti ${usuario.estado ? 'ti-user-off' : 'ti-user-check'}`} />
                          {usuario.estado ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
