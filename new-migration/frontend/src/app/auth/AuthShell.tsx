'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shell visual para las pantallas de autenticación.
 * Centrado vertical, card con shadow-lifted, marca arriba.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{
        background:
          'linear-gradient(135deg, #f6f9ff 0%, #eef3ff 50%, #f7fbff 100%)',
      }}
    >
      <main id="main-content" className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1"
          >
            <img
              src="/logo.png"
              width={56}
              height={56}
              alt="Logo del GAD Parroquial de Checa"
              className="h-14 w-14 object-contain"
            />
            <span className="font-display text-2xl font-bold lowercase tracking-tight text-brand-dark">
              cementer<span className="text-brand-accent">io</span>
            </span>
          </Link>
          <p className="mt-2 text-xs text-slate-500">
            Sistema de Gestión de Cementerio · GAD Checa
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lifted">
          <div className="p-6 sm:p-8">
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
            <div className="mt-6">{children}</div>
          </div>
        </div>

        {footer && (
          <div className="mt-4 text-center text-sm text-slate-500">{footer}</div>
        )}
      </main>
    </div>
  );
}
