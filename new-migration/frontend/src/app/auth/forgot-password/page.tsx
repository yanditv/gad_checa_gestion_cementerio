'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '../AuthShell';

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
        throw new Error(
          payload.message || 'No se pudo procesar la solicitud',
        );
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
      subtitle="Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para restablecer la contraseña."
      footer={
        <Link href="/auth/login" className="text-primary">
          ← Volver al inicio de sesión
        </Link>
      }
    >
      {sent ? (
        <div className="alert alert-success border-0 mb-0" role="alert">
          <div className="d-flex">
            <i className="ti ti-circle-check me-2 mt-1"></i>
            <div>
              <strong>Solicitud enviada</strong>
              <br />
              <small>
                Si el correo está registrado, recibirás un enlace en los
                próximos minutos. Revisa la bandeja de entrada y la carpeta de
                spam.
              </small>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}
          <div className="form-group mb-3">
            <label className="form-label" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || !email}
          >
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
