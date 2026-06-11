'use client';

import { type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from './cn';

export interface SearchFiltersProps {
  /** Valor del buscador (controlado). */
  search: string;
  onSearch: (value: string) => void;
  /** Placeholder del buscador. */
  placeholder?: string;
  /** `aria-label` del campo de búsqueda. */
  searchLabel?: string;
  /** Filtros adicionales (selects, toggles) a la derecha. */
  children?: ReactNode;
  /** Acción al limpiar el buscador (muestra botón X cuando hay texto). */
  onClear?: () => void;
  className?: string;
}

/**
 * Barra de búsqueda + filtros para la cabecera de un listado (DESIGN.md §6.1 /
 * §7.1). Buscador con icono a la izquierda y botón de limpiar; los filtros
 * extra se pasan como `children` y se alinean a la derecha. Va dentro de la
 * tarjeta, sobre la tabla.
 */
export function SearchFilters({
  search,
  onSearch,
  placeholder = 'Buscar…',
  searchLabel = 'Buscar',
  children,
  onClear,
  className,
}: SearchFiltersProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="relative w-full sm:max-w-xs">
        <Search
          aria-hidden="true"
          strokeWidth={2}
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={searchLabel}
          className="block h-10 w-full rounded-lg border-0 bg-white pl-9 pr-9 text-base text-slate-900 ring-1 ring-inset ring-slate-200 shadow-xs transition-shadow duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => (onClear ? onClear() : onSearch(''))}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
      {children != null && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}
