'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthShell } from '../AuthShell';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!token) {
      setError('Token no proporcionado en el enlace');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          payload.message || 'No se pudo restablecer la contraseña',
        );
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Restablecer contraseña"
      subtitle="Define una nueva contraseña para tu cuenta."
      footer={
        <Link href="/auth/login" className="text-primary">
          ← Volver al inicio de sesión
        </Link>
      }
    >
      {done ? (
        <div className="alert alert-success border-0" role="alert">
          <i className="ti ti-circle-check me-2"></i>
          Contraseña actualizada. Ya puedes iniciar sesión.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}
          <div className="form-group mb-3">
            <label className="form-label" htmlFor="password">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
              autoFocus
            />
            <small className="text-muted">
              Mínimo 6 caracteres, con una mayúscula, una minúscula y un
              dígito.
            </small>
          </div>
          <div className="form-group mb-3">
            <label className="form-label" htmlFor="confirm">
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              type="password"
              className="form-control"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || !password || !confirm}
          >
            {loading ? 'Actualizando…' : 'Restablecer contraseña'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Restablecer contraseña">
          <div className="text-center py-3 text-muted">Cargando…</div>
        </AuthShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
