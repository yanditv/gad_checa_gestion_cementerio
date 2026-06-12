import { type ReactNode } from 'react';
import { cn } from './cn';

export interface EmptyStateProps {
  /** Icono Tabler grande (centrado). */
  icon?: ReactNode;
  /** Título principal del estado vacío. */
  title: ReactNode;
  /** Descripción/ayuda opcional. */
  description?: ReactNode;
  /** CTA opcional (botón/enlace). */
  action?: ReactNode;
  /** Compacta el bloque (útil dentro de tablas). */
  compact?: boolean;
  className?: string;
}

/**
 * Estado vacío ilustrado (DESIGN.md §6.1): icono Tabler grande sobre disco
 * suave + copy centrado + CTA opcional. Para listas sin datos dentro de una
 * tarjeta o tabla.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-14',
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-600',
            compact ? 'h-12 w-12 text-2xl' : 'h-16 w-16 text-3xl',
          )}
        >
          {icon}
        </span>
      )}
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description != null && (
        <p className="max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action != null && <div className="mt-1">{action}</div>}
    </div>
  );
}
