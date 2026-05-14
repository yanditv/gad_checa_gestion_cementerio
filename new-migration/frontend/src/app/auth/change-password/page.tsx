'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '../AuthShell';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

interface SessionUser {
  id: string;
  email: string;
  mustChangePassword?: boolean;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (cancelled) return;
        if (payload?.data) setUser(payload.data as SessionUser);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isForced = user?.mustChangePassword === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser distinta a la actual.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo cambiar la contraseña');
      }
      setSuccess(true);
      setTimeout(() => router.replace('/'), 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cambiar la contraseña',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell
      title={isForced ? 'Debes cambiar tu contraseña' : 'Cambiar contraseña'}
      subtitle={
        isForced
          ? 'Tu administrador restableció tu contraseña. Define una nueva antes de continuar.'
          : 'Define una nueva contraseña para tu cuenta.'
      }
      footer={
        !isForced && (
          <Link href="/cuenta" className="text-primary-600 hover:underline">
            ← Volver a mi cuenta
          </Link>
        )
      }
    >
      {loadingSession ? (
        <div className="py-3 text-center text-sm text-slate-400">Cargando…</div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {success && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-green-200">
              Contraseña actualizada. Redirigiendo…
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
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
              required
              autoComplete="current-password"
              className={INPUT_CLS}
            />
            {isForced && (
              <p className="mt-1 text-xs text-slate-500">
                Es la contraseña temporal que te entregó el administrador.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className={INPUT_CLS}
            />
            <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className={INPUT_CLS}
            />
          </div>

          <button
            type="submit"
            disabled={saving || success}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
