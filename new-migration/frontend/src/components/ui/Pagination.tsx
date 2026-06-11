import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './cn';

export interface PaginationProps {
  /** Página actual (1-based). */
  page: number;
  /** Total de páginas. */
  pageCount: number;
  /** Total de registros (para el resumen textual). */
  total?: number;
  /** Tamaño de página (para calcular el rango mostrado). */
  pageSize?: number;
  /** Cambio de página. */
  onChange: (page: number) => void;
  /** Oculta el resumen textual ("Mostrando X–Y de Z"). */
  hideSummary?: boolean;
  className?: string;
}

/** Genera la ventana de páginas con elipsis (±2 alrededor de la actual). */
function buildPages(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, page - 2);
  const end = Math.min(pageCount - 1, page + 2);
  if (start > 2) pages.push('gap');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < pageCount - 1) pages.push('gap');
  pages.push(pageCount);
  return pages;
}

const navBase =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium ' +
  'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-primary-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Paginación del CRM (DESIGN.md §6.1): resumen textual + ventana de páginas
 * con elipsis (±2). La página activa lleva `aria-current="page"`. Navegable
 * por teclado con foco visible.
 */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize = 15,
  onChange,
  hideSummary = false,
  className,
}: PaginationProps) {
  if (pageCount <= 1 && !total) return null;

  const pages = buildPages(page, Math.max(pageCount, 1));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = total ? Math.min(page * pageSize, total) : 0;

  const go = (p: number) => {
    if (p < 1 || p > pageCount || p === page) return;
    onChange(p);
  };

  return (
    <nav
      aria-label="Paginación"
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className,
      )}
    >
      {!hideSummary && total != null && (
        <p className="text-sm text-slate-500">
          Mostrando <span className="font-medium text-slate-700 tabular-nums">{total === 0 ? 0 : from}</span>
          {'–'}
          <span className="font-medium text-slate-700 tabular-nums">{to}</span> de{' '}
          <span className="font-medium text-slate-700 tabular-nums">{total}</span>
        </p>
      )}
      {pageCount > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <button
              type="button"
              onClick={() => go(page - 1)}
              disabled={page <= 1}
              aria-label="Página anterior"
              className={cn(
                navBase,
                'text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-700',
              )}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </button>
          </li>
          {pages.map((p, i) =>
            p === 'gap' ? (
              <li key={`gap-${i}`}>
                <span className="inline-flex h-9 w-9 items-center justify-center text-sm text-slate-400">
                  …
                </span>
              </li>
            ) : (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => go(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={cn(
                    navBase,
                    'tabular-nums',
                    p === page
                      ? 'bg-primary-500 text-white shadow-xs'
                      : 'text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  {p}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              onClick={() => go(page + 1)}
              disabled={page >= pageCount}
              aria-label="Página siguiente"
              className={cn(
                navBase,
                'text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-700',
              )}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}
