'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export function PrintActions({ backHref, autoPrint }: { backHref: string; autoPrint: boolean }) {
  const pdfHref = `${backHref.replace(/\/$/, '')}/pdf`.replace('/contratos/', '/api/contratos/');

  useEffect(() => {
    if (autoPrint) {
      const timer = window.setTimeout(() => {
        window.print();
      }, 300);

      return () => window.clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="d-print-none d-flex justify-content-between align-items-center mb-4 gap-2">
      <Link href={backHref} className="btn btn-outline-secondary">
        Volver
      </Link>
      <div className="d-flex gap-2">
        <a href={pdfHref} className="btn btn-outline-primary" target="_blank" rel="noreferrer">
          Ver PDF real
        </a>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Imprimir desde navegador
        </button>
      </div>
    </div>
  );
}
