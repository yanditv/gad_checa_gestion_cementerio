'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui';

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
        <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Volver
      </Link>
      <div className="flex gap-2">
        <a
          href={pdfHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Ver PDF real
        </a>
        <Button
          type="button"
          onClick={() => window.print()}
          variant="primary"
          size="sm"
          leftIcon={<Printer className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
        >
          Imprimir
        </Button>
      </div>
    </div>
  );
}
