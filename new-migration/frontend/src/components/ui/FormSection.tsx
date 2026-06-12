import { type ReactNode } from 'react';
import { cn } from './cn';

export interface FormSectionProps {
  /** Título de la sección. */
  title?: ReactNode;
  /** Descripción/ayuda bajo el título. */
  description?: ReactNode;
  /** Icono Tabler opcional junto al título. */
  icon?: ReactNode;
  /** Quita el separador superior (primera sección del formulario). */
  divided?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Agrupa campos de un formulario bajo un título y una descripción (DESIGN.md
 * §6.1). Por defecto añade un separador superior fino entre secciones; usa
 * `divided={false}` en la primera. Los campos se pasan como `children`
 * (típicamente un grid `sm:grid-cols-2`).
 */
export function FormSection({
  title,
  description,
  icon,
  divided = true,
  className,
  children,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        divided && 'border-t border-slate-100 pt-6',
        className,
      )}
    >
      {(title != null || description != null) && (
        <div className="mb-4">
          {title != null && (
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              {icon && (
                <span
                  aria-hidden="true"
                  className="inline-flex text-lg text-slate-600"
                >
                  {icon}
                </span>
              )}
              {title}
            </h3>
          )}
          {description != null && (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
