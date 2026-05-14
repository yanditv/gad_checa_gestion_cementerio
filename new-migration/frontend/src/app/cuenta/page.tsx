'use client';

import { FormEvent, useEffect, useState } from 'react';

interface Profile {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  direccion?: string | null;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  mustChangePassword?: boolean;
  roles?: string[];
}

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  );
}

export default function CuentaPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((res) => res.json().then((payload) => ({ ok: res.ok, payload })))
      .then(({ ok, payload }) => {
        if (cancelled) return;
        if (!ok) {
          setError(payload?.message || 'No se pudo obtener el perfil');
          return;
        }
        setProfile((payload?.data ?? null) as Profile | null);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo contactar al servidor');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword !== confirm) {
      setPwError('Las contraseñas no coinciden');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo actualizar la contraseña');
      }
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Error');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <svg
          className="h-6 w-6 animate-spin text-primary-500"
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Información personal y seguridad de la cuenta.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* Datos personales */}
        <section className="lg:col-span-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Datos personales</h2>
          </header>
          <div className="p-5">
            {profile ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nombres" value={profile.nombre} />
                  <Field label="Apellidos" value={profile.apellido} />
                  <Field label="Correo" value={profile.email} />
                  <Field
                    label="Identificación"
                    value={`${profile.tipoIdentificacion} ${profile.numeroIdentificacion}`}
                  />
                  <Field label="Teléfono" value={profile.telefono} />
                  <Field label="Dirección" value={profile.direccion} />
                </div>
                {profile.roles && profile.roles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Roles
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {profile.roles.map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">
                No se encontró información del usuario.
              </p>
            )}
          </div>
        </section>

        {/* Cambiar contraseña */}
        <section className="lg:col-span-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Cambiar contraseña</h2>
          </header>
          <div className="p-5">
            {profile?.mustChangePassword && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Debes definir una nueva contraseña antes de continuar usando el
                sistema.
              </div>
            )}

            <form onSubmit={handleChangePassword} noValidate className="space-y-3">
              {pwError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-green-200">
                  Contraseña actualizada correctamente.
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className={INPUT_CLS}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Mínimo 6 caracteres con mayúscula, minúscula y un dígito.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className={INPUT_CLS}
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading || !currentPassword || !newPassword || !confirm}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pwLoading ? 'Guardando…' : 'Actualizar contraseña'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
