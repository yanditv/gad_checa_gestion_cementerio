'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleCheck, Mail } from 'lucide-react';
import { AuthShell } from '../AuthShell';
import { Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'No se pudo procesar la solicitud');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para restablecerla."
      footer={
        <Link href="/auth/login" className="inline-flex items-center gap-1 text-primary-600 hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver al inicio de sesión
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex gap-3">
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" strokeWidth={2} aria-hidden="true" />
            <div>
              <p className="font-semibold text-green-800">Solicitud enviada</p>
              <p className="mt-1 text-sm text-green-700">
                Si el correo está registrado, recibirás un enlace en los próximos
                minutos. Revisa la bandeja de entrada y la carpeta de spam.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}
          <Input
            id="email"
            type="email"
            label="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            leftIcon={<Mail className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          />
          <Button type="submit" block loading={loading} disabled={!email}>
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
