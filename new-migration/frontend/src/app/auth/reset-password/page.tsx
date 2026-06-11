'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CircleCheck, Lock } from 'lucide-react';
import { AuthShell } from '../AuthShell';
import { Button, Input } from '@/components/ui';

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
        throw new Error(payload.message || 'No se pudo restablecer la contraseña');
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
        <Link href="/auth/login" className="inline-flex items-center gap-1 text-primary-600 hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver al inicio de sesión
        </Link>
      }
    >
      {done ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CircleCheck className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Contraseña actualizada. Ya puedes iniciar sesión.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}
          <Input
            id="password"
            type="password"
            label="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            autoComplete="new-password"
            autoFocus
            leftIcon={<Lock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            hint="Mínimo 6 caracteres, con una mayúscula, una minúscula y un dígito."
          />
          <Input
            id="confirm"
            type="password"
            label="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
            required
            autoComplete="new-password"
            leftIcon={<Lock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          />
          <Button type="submit" block loading={loading} disabled={!password || !confirm}>
            {loading ? 'Actualizando…' : 'Restablecer contraseña'}
          </Button>
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
          <div className="py-3 text-center text-sm text-slate-400">Cargando…</div>
        </AuthShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
