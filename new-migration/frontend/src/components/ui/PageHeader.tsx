import { type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from './cn';

export interface PageHeaderProps {
  /** Título de la página (`text-2xl font-bold`). */
  title: ReactNode;
  /** Subtítulo descriptivo bajo el título. */
  subtitle?: ReactNode;
  /** Acciones (botones/CTA) alineadas a la derecha. */
  actions?: ReactNode;
  /** Si se indica, muestra un enlace "Volver" antes del título. */
  backHref?: string;
  /** Texto del enlace de volver. */
  backLabel?: string;
  /** Icono decorativo a la izquierda del título. */
  icon?: ReactNode;
  className?: string;
}

/**
 * Encabezado inline de página (DESIGN.md §6.2 / §7): título `text-2xl` +
 * subtítulo `text-sm text-slate-500` y CTA a la derecha. Con `backHref`
 * antepone un enlace "Volver" secundario.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
  backLabel = 'Volver',
  icon,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {icon && (
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xl text-primary-600 ring-1 ring-inset ring-primary-100"
            >
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle != null && (
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            )}
          </div>
        </div>
        {actions != null && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
