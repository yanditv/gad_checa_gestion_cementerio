'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Eye, KeyRound, Loader2, Search, ShieldCheck, UserCheck, UserX, Users } from 'lucide-react';
import { usuariosApi, rolesApi, PaginationMeta } from '@/lib/api';
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  EmptyState,
  Input,
  Modal,
  Pagination,
  type DataTableColumn,
} from '@/components/ui';

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
  mustChangePassword: boolean;
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
  const [error, setError] = useState('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{ userId: string; value: string } | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [rolesModalUser, setRolesModalUser] = useState<Usuario | null>(null);

  const loadUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await usuariosApi.findPage({
        page,
        limit: 15,
        search: search.trim() || undefined,
      });
      setUsuarios(result.data);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rolesApi.findAll();
      setRoles(data);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los roles');
    }
  };

  useEffect(() => {
    loadUsuarios();
    loadRoles();
  }, [page, search]);

  const toggleEstado = async (id: string, estado: boolean) => {
    setSavingUserId(id);
    setError('');
    setTempPassword(null);
    try {
      await usuariosApi.updateEstado(id, !estado);
      await loadUsuarios();
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el estado del usuario');
    } finally {
      setSavingUserId(null);
    }
  };

  const updateRoles = async (id: string, selected: string[]) => {
    setSavingUserId(id);
    setError('');
    setTempPassword(null);
    try {
      await usuariosApi.setRoles(id, selected);
      await loadUsuarios();
      setRolesModalUser((current) => {
        if (!current || current.id !== id) return current;
        const selectedSet = new Set(selected);
        return {
          ...current,
          usuarioRols: roles
            .filter((rol) => selectedSet.has(rol.id))
            .map((rol) => ({ rolId: rol.id, rol })),
        };
      });
    } catch (err: any) {
      setError(err.message || 'No se pudieron actualizar los roles');
    } finally {
      setSavingUserId(null);
    }
  };

  const resetPassword = async (id: string) => {
    if (!window.confirm('¿Generar una contraseña temporal para este usuario?')) return;

    setSavingUserId(id);
    setError('');
    setTempPassword(null);
    try {
      const result = await usuariosApi.resetPassword(id, false);
      if (result.tempPassword) {
        setTempPassword({ userId: id, value: result.tempPassword });
      }
      await loadUsuarios();
    } catch (err: any) {
      setError(err.message || 'No se pudo resetear la contraseña');
    } finally {
      setSavingUserId(null);
    }
  };

  const columns: DataTableColumn<Usuario>[] = [
    {
      key: 'usuario',
      header: 'Usuario',
      sortable: true,
      sortValue: (u) => `${u.nombre} ${u.apellido}`,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${u.nombre} ${u.apellido}`} size="sm" />
          <div>
            <div className="font-medium text-slate-900">
              {u.nombre} {u.apellido}
            </div>
            <div className="text-xs text-slate-600">{u.numeroIdentificacion}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      sortValue: (u) => u.email,
      cell: (u) => <span className="text-slate-600">{u.email}</span>,
    },
    {
      key: 'roles',
      header: 'Roles',
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.usuarioRols && u.usuarioRols.length > 0 ? (
            u.usuarioRols.map((ur) => (
              <Badge key={ur.rolId} tone="primary" size="sm">
                {ur.rol.nombre}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-600">Sin roles</span>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      sortValue: (u) => (u.estado ? 'Activo' : 'Inactivo'),
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={u.estado ? 'success' : 'danger'} size="sm">
            {u.estado ? 'Activo' : 'Inactivo'}
          </Badge>
          {u.mustChangePassword && (
            <Badge tone="warning" size="sm">
              Debe cambiar contraseña
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cellClassName: 'whitespace-nowrap',
      cell: (usuario) => {
        return (
          <div className="inline-flex items-center gap-2">
            <Link
              href={`/admin/usuarios/${usuario.id}`}
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
              title="Ver detalle"
            >
              <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setRolesModalUser(usuario)}
              disabled={savingUserId === usuario.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Roles
            </button>
            <button
              type="button"
              onClick={() => resetPassword(usuario.id)}
              disabled={savingUserId === usuario.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              {savingUserId === usuario.id ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
              ) : (
                <KeyRound className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              )}
              Resetear
            </button>
            <button
              type="button"
              onClick={() => toggleEstado(usuario.id, usuario.estado)}
              disabled={savingUserId === usuario.id}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                usuario.estado
                  ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              } disabled:opacity-60`}
            >
              {savingUserId === usuario.id ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
              ) : usuario.estado ? (
                <UserX className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              ) : (
                <UserCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              )}
              {usuario.estado ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
        <p className="mt-1 text-sm text-slate-600">
          Administración de usuarios y asignación de roles.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        {/* Filtros */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="flex-1 sm:max-w-md">
            <Input
              type="search"
              placeholder="Buscar por nombre, email o identificación…"
              value={search}
              leftIcon={<Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {tempPassword && (
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Contraseña temporal generada:{' '}
            <span className="font-mono text-base font-semibold tracking-wide">
              {tempPassword.value}
            </span>
          </div>
        )}

        <DataTable
          columns={columns}
          rows={usuarios}
          rowKey={(u) => u.id}
          loading={loading}
          empty={
            <EmptyState
              icon={<Users className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />}
              title="No hay usuarios que coincidan con los filtros."
            />
          }
        />

        {meta && meta.totalPages > 1 && (
          <div className="border-t border-slate-100 px-4 py-3">
            <Pagination
              page={meta.page}
              pageCount={meta.totalPages}
              total={meta.total}
              pageSize={15}
              onChange={setPage}
            />
          </div>
        )}
      </section>

      <Modal
        open={rolesModalUser !== null}
        onClose={() => setRolesModalUser(null)}
        title="Asignar roles"
        description={
          rolesModalUser
            ? `${rolesModalUser.nombre} ${rolesModalUser.apellido}`
            : undefined
        }
        size="md"
        footer={
          <Button type="button" variant="secondary" onClick={() => setRolesModalUser(null)}>
            Cerrar
          </Button>
        }
      >
        {rolesModalUser && (
          <div
            role="group"
            aria-label={`Roles de ${rolesModalUser.nombre} ${rolesModalUser.apellido}`}
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {roles.map((rol) => {
              const currentRoles = rolesModalUser.usuarioRols?.map((item) => item.rolId) || [];
              const checked = currentRoles.includes(rol.id);
              return (
                <button
                  key={rol.id}
                  type="button"
                  aria-pressed={checked}
                  disabled={savingUserId === rolesModalUser.id}
                  onClick={() =>
                    updateRoles(
                      rolesModalUser.id,
                      checked
                        ? currentRoles.filter((id) => id !== rol.id)
                        : [...currentRoles, rol.id],
                    )
                  }
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-60 ${
                    checked
                      ? 'border-primary-200 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{rol.nombre}</span>
                  {checked && <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
