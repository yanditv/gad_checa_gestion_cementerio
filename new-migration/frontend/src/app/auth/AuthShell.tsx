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
 * Centrado vertical, card minimal, marca arriba.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #f6f9ff 0%, #eef3ff 50%, #f7fbff 100%)',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div className="text-center mb-4">
          <Link
            href="/"
            className="d-inline-flex align-items-center text-decoration-none"
            style={{ gap: '0.1rem' }}
          >
            <img
              src="/logo.png"
              width={56}
              height={56}
              alt="logo"
              style={{ objectFit: 'contain' }}
            />
            <span
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#1a237e',
                fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif',
                textTransform: 'lowercase',
              }}
            >
              cementer<span style={{ color: '#43a047' }}>io</span>
            </span>
          </Link>
          <p className="text-muted small mt-2 mb-0">
            Sistema de Gestión de Cementerio · GAD Checa
          </p>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-md-5">
            <h4 className="mb-1" style={{ fontWeight: 600 }}>
              {title}
            </h4>
            {subtitle && <p className="text-muted small mb-4">{subtitle}</p>}
            {children}
          </div>
        </div>

        {footer && (
          <div className="text-center mt-3 small text-muted">{footer}</div>
        )}
      </div>
    </div>
  );
}
