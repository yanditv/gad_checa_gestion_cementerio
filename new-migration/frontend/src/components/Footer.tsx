'use client';

import { useEffect, useState } from 'react';

/**
 * Footer silencioso CRM (PLAN_frontend_ux.md, feedback 2026-06-10): una sola
 * línea discreta sobre el fondo slate-100, sin banda blanca ni chips de
 * pseudo-estado. Hairline superior como único separador.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const [gadName, setGadName] = useState('GAD Parroquial de Checa');

  useEffect(() => {
    fetch('/api/cementerios/gad-informacion', { credentials: 'same-origin', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const data = payload?.data ?? payload;
        if (data?.nombre) {
          setGadName(data.nombre);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <footer className="mt-8 border-t border-slate-200">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-1 px-4 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>
          © {year} {gadName} — Sistema de Gestión de Cementerio
        </span>
        <span>
          v1.0.0 ·{' '}
          <a
            href="https://teobu.com"
            target="_blank"
            rel="noreferrer"
            className="text-slate-600 transition-colors hover:text-slate-600"
          >
            Desarrollado por Teobu
          </a>
        </span>
      </div>
    </footer>
  );
}
