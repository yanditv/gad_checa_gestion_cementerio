'use client';

import { useEffect, useState } from 'react';
import { usuariosApi, rolesApi, PaginationMeta } from '@/lib/api';

interface UsuarioRol {
  rolId: string;
  rol: { id: string; nombre: string };
}

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  numeroIdentificacion: string;
  estado: boolean;
  usuarioRols: UsuarioRol[];
}

interface Rol {
  id: string;
  nombre: string;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const result = await usuariosApi.findPage({
        page,
        limit: 15,
        search: search.trim() || undefined,
      });
      setUsuarios(result.data);
      setMeta(result.meta);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rolesApi.findAll();
      setRoles(data);
    } catch (err) {
      console.error('Error al cargar roles:', err);
    }
  };

  useEffect(() => {
    loadUsuarios();
    loadRoles();
  }, [page, search]);

  const toggleEstado = async (id: string, estado: boolean) => {
    await usuariosApi.updateEstado(id, !estado);
    await loadUsuarios();
  };

  const updateRoles = async (id: string, selected: string[]) => {
    await usuariosApi.setRoles(id, selected);
    await loadUsuarios();
  };

  const visiblePages = (() => {
    if (!meta) return [];
    const start = Math.max(1, meta.page - 2);
    const end = Math.min(meta.totalPages, meta.page + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Administración de usuarios y asignación de roles.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        {/* Filtros */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar por nombre, email o identificación…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>

        {/* Tabla */}
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin text-primary-500"
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
                      Cargando usuarios…
                    </div>
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    <i className="ti ti-users-off text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">
                      No hay usuarios que coincidan con los filtros.
                    </div>
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => {
                  const currentRoles = usuario.usuarioRols?.map((item) => item.rolId) || [];

                  return (
                    <tr key={usuario.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {usuario.nombre} {usuario.apellido}
                        </div>
                        <div className="text-xs text-slate-400">
                          {usuario.numeroIdentificacion}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{usuario.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {usuario.usuarioRols && usuario.usuarioRols.length > 0 ? (
                            usuario.usuarioRols.map((ur) => (
                              <span
                                key={ur.rolId}
                                className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200"
                              >
                                {ur.rol.nombre}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Sin roles</span>
                          )}
                        </div>
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
                        <div className="inline-flex items-center gap-2">
                          <select
                            multiple
                            value={currentRoles}
                            onChange={(e) => {
                              const values = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                              updateRoles(usuario.id, values);
                            }}
                            className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          >
                            {roles.map((rol) => (
                              <option key={rol.id} value={rol.id}>
                                {rol.nombre}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => toggleEstado(usuario.id, usuario.estado)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                              usuario.estado
                                ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                : 'bg-primary-500 text-white hover:bg-primary-600'
                            }`}
                          >
                            <i className={`ti ${usuario.estado ? 'ti-user-off' : 'ti-user-check'}`} />
                            {usuario.estado ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
            <p className="text-xs text-slate-500">
              Página <strong className="text-slate-700">{meta.page}</strong> de{' '}
              <strong className="text-slate-700">{meta.totalPages}</strong>
              <span className="mx-1.5 text-slate-300">·</span>
              <strong className="text-slate-700">{meta.total}</strong>{' '}
              usuario{meta.total === 1 ? '' : 's'}
            </p>
            <nav className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(meta.page - 1)}
                disabled={!meta.hasPrevPage}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="ti ti-chevron-left" /> Anterior
              </button>
              {visiblePages.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    p === meta.page
                      ? 'bg-primary-500 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(meta.page + 1)}
                disabled={!meta.hasNextPage}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente <i className="ti ti-chevron-right" />
              </button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
}
