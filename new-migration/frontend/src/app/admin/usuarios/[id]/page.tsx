'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  KeyRound,
  Loader2,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { usuariosApi, rolesApi } from '@/lib/api';
import { Avatar, Badge, Button, Checkbox, Modal } from '@/components/ui';

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
  tipoIdentificacion: string;
  telefono: string | null;
  direccion: string | null;
  estado: boolean;
  mustChangePassword: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  usuarioRols: UsuarioRol[];
}

interface Rol {
  id: string;
  nombre: string;
}

function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft ${className}`}
    >
      {title && (
        <header className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  );
}

export default function UsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [confirmingAction, setConfirmingAction] = useState<'reset' | 'toggle' | 'delete' | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const loadUsuario = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        usuariosApi.findOne(id),
        rolesApi.findAll(),
      ]);
      setUsuario(u);
      setRoles(r);
      setSelectedRoleIds(u.usuarioRols?.map((ur: UsuarioRol) => ur.rolId) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el usuario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuario();
  }, [id]);

  const handleToggleRole = (rolId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(rolId) ? prev.filter((r) => r !== rolId) : [...prev, rolId],
    );
  };

  const handleSaveRoles = async () => {
    setError(null);
    setSaving(true);
    try {
      await usuariosApi.setRoles(id, selectedRoleIds);
      await loadUsuario();
      setShowRoleModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar roles');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setTempPassword(null);
    setConfirmingAction(null);
    setSaving(true);
    try {
      const result = await usuariosApi.resetPassword(id, false);
      setTempPassword(result.tempPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resetear contraseña');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async () => {
    setError(null);
    setTempPassword(null);
    setConfirmingAction(null);
    setSaving(true);
    try {
      await usuariosApi.updateEstado(id, !usuario?.estado);
      await loadUsuario();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setTempPassword(null);
    setConfirmingAction(null);
    setSaving(true);
    try {
      await usuariosApi.remove(id);
      router.replace('/admin/usuarios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario');
      setSaving(false);
    }
  };

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

  if (!usuario) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Usuario</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'No se pudo cargar el usuario.'}
        </div>
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
        </Link>
      </div>
    );
  }

  const fullName = `${usuario.nombre} ${usuario.apellido}`.trim();
  const initials = fullName
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const assignedRoles = usuario.usuarioRols?.map((ur) => ur.rol) || [];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={fullName} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
              {usuario.email}
              <Badge tone={usuario.estado ? 'success' : 'danger'} size="sm">
                {usuario.estado ? 'Activo' : 'Inactivo'}
              </Badge>
              {usuario.mustChangePassword && (
                <Badge tone="warning" size="sm">
                  Debe cambiar contraseña
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {tempPassword && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Contraseña temporal generada</p>
          <p className="mt-1 font-mono text-lg tracking-wider">{tempPassword}</p>
          <p className="mt-1 text-xs text-amber-600">
            Entrega esta contraseña al usuario. Deberá cambiarla al iniciar sesión.
          </p>
        </div>
      )}

      {/* Datos del usuario */}
      <Card title="Datos del usuario">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nombres" value={usuario.nombre} />
          <Field label="Apellidos" value={usuario.apellido} />
          <Field label="Email" value={usuario.email} />
          <Field label="Identificación" value={`${usuario.tipoIdentificacion} ${usuario.numeroIdentificacion}`} />
          <Field label="Teléfono" value={usuario.telefono} />
          <Field label="Dirección" value={usuario.direccion} />
          <Field label="Creado" value={new Date(usuario.fechaCreacion).toLocaleString('es-EC')} />
          <Field label="Actualizado" value={usuario.fechaActualizacion ? new Date(usuario.fechaActualizacion).toLocaleString('es-EC') : null} />
        </div>
      </Card>

      {/* Roles */}
      <Card title={`Roles asignados · ${assignedRoles.length}`}>
        <div className="space-y-3">
          {assignedRoles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {assignedRoles.map((rol) => (
                <Badge
                  key={rol.id}
                  tone="primary"
                  icon={<ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />}
                >
                  {rol.nombre}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Este usuario no tiene roles asignados.</p>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedRoleIds(usuario.usuarioRols?.map((ur) => ur.rolId) || []);
              setShowRoleModal(true);
            }}
            leftIcon={<Settings className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          >
            Gestionar roles
          </Button>
        </div>
      </Card>

      {/* Acciones */}
      <Card title="Acciones administrativas">
        <div className="flex flex-wrap items-center gap-3">
          {/* Reset password */}
          {confirmingAction === 'reset' ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <span className="text-xs text-amber-700">¿Resetear contraseña de {usuario.nombre}?</span>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={saving}
                className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {saving ? '…' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingAction(null)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingAction('reset')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              <KeyRound className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Resetear contraseña
            </button>
          )}

          {/* Toggle estado */}
          {confirmingAction === 'toggle' ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-600">
                ¿{usuario.estado ? 'Desactivar' : 'Activar'} a {usuario.nombre}?
              </span>
              <button
                type="button"
                onClick={handleToggleEstado}
                disabled={saving}
                className={`rounded-md px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50 ${
                  usuario.estado ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {saving ? '…' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingAction(null)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingAction('toggle')}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${
                usuario.estado
                  ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                  : 'border-green-200 bg-white text-green-600 hover:bg-green-50'
              }`}
            >
              {usuario.estado ? (
                <UserX className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              ) : (
                <UserCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              )}
              {usuario.estado ? 'Desactivar usuario' : 'Activar usuario'}
            </button>
          )}

          {/* Delete */}
          {confirmingAction === 'delete' ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <span className="text-xs text-red-700">
                ¿Eliminar a {usuario.nombre}? Esta acción es irreversible.
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {saving ? '…' : 'Eliminar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingAction(null)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingAction('delete')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Eliminar usuario
            </button>
          )}
        </div>
      </Card>

      {/* Modal de roles */}
      <Modal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={`Gestionar roles de ${usuario.nombre}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowRoleModal(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRoles}
              loading={saving}
            >
              Guardar roles
            </Button>
          </>
        }
      >
        {roles.length === 0 ? (
          <p className="text-sm text-slate-600">No hay roles disponibles.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
            {roles.map((rol) => {
              const checked = selectedRoleIds.includes(rol.id);
              return (
                <li key={rol.id}>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                    <Checkbox
                      checked={checked}
                      onChange={() => handleToggleRole(rol.id)}
                      label={rol.nombre}
                    />
                    {checked && (
                      <Check
                        className="ml-auto h-4 w-4 text-primary-500"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </div>
  );
}
