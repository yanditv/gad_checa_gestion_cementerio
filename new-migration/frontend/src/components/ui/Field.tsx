import { type ReactNode } from 'react';
import { Tag } from 'lucide-react';
import { cn } from './cn';

export interface FieldProps {
  /** Texto de la etiqueta. */
  label?: ReactNode;
  /** Ayuda contextual bajo el control. */
  hint?: ReactNode;
  /** Mensaje de error (sustituye a `hint` y marca el control inválido). */
  error?: ReactNode;
  /** Marca el campo como obligatorio (añade asterisco). */
  required?: boolean;
  /** Icono decorativo junto a la etiqueta. */
  labelIcon?: ReactNode;
  /** `id` del control para vincular `<label htmlFor>`. */
  htmlFor?: string;
  /** `id` del nodo hint/error para `aria-describedby` del control. */
  describedById?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Envoltura de campo de formulario: etiqueta + control + hint/error con el
 * cableado de accesibilidad (`htmlFor`, `aria-describedby`). Los controles
 * (Input/Textarea/Select) la usan internamente, pero también puede envolver
 * un control a medida.
 */
export function Field({
  label,
  hint,
  error,
  required,
  labelIcon,
  htmlFor,
  describedById,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label != null && (
        <label
          htmlFor={htmlFor}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700"
        >
          <span aria-hidden="true" className="inline-flex text-slate-500">
            {labelIcon ?? <Tag className="h-3.5 w-3.5" strokeWidth={2} />}
          </span>
          <span>{label}</span>
          {required && (
            <span aria-hidden="true" className="text-danger-500">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error != null ? (
        <p id={describedById} className="text-xs text-danger-600">
          {error}
        </p>
      ) : hint != null ? (
        <p id={describedById} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Clases base compartidas por los controles de texto (input/textarea/select). */
export const controlBase =
  'block w-full rounded-lg border-0 bg-white text-base text-slate-900 ring-1 ring-inset ' +
  'ring-slate-200 shadow-xs transition-shadow duration-150 placeholder:text-slate-600 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-400 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600';

/** Estado inválido para controles de texto. */
export const controlInvalid =
  'ring-danger-300 focus:ring-danger-400';
