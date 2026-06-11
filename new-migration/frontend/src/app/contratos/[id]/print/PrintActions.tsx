'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export function PrintActions({
  backHref,
  autoPrint,
}: {
  backHref: string;
  autoPrint: boolean;
}) {
  const pdfHref = `${backHref.replace(/\/$/, '')}/pdf`.replace(
    '/contratos/',
    '/api/contratos/',
  );

  useEffect(() => {
    if (autoPrint) {
      const timer = window.setTimeout(() => {
        window.print();
      }, 300);
      return () => window.clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <i className="ti ti-arrow-left" />
        Volver
      </Link>
      <div className="flex gap-2">
        <a
          href={pdfHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-file-text" />
          Ver PDF real
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
        >
          <i className="ti ti-printer" />
          Imprimir
        </button>
      </div>
    </div>
  );
}
