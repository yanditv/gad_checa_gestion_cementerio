import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from './cn';
import { Field, controlBase, controlInvalid } from './Field';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Icono Tabler decorativo a la izquierda del control. */
  leftIcon?: ReactNode;
  /** Icono decorativo junto a la etiqueta. */
  labelIcon?: ReactNode;
  /** Nodo a la derecha (sufijo, acción). */
  rightSlot?: ReactNode;
  /** Clase del contenedor `Field`. */
  wrapperClassName?: string;
}

/**
 * Campo de texto. Compone `Field` (label + hint/error) con el `<input>` y
 * cablea `aria-invalid` / `aria-describedby`. Soporta icono izquierdo y un
 * slot derecho. Estilos derivados de los tokens (DESIGN.md §3, §7.2).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      labelIcon,
      rightSlot,
      required,
      className,
      wrapperClassName,
      id,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedById = `${inputId}-desc`;
    const hasDesc = error != null || hint != null;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        labelIcon={labelIcon}
        htmlFor={inputId}
        describedById={hasDesc ? describedById : undefined}
        className={wrapperClassName}
      >
        <div className="relative">
          {leftIcon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 flex w-5 items-center justify-center text-base text-slate-600"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error != null || undefined}
            aria-describedby={hasDesc ? describedById : undefined}
            className={cn(
              controlBase,
              'h-10 py-2 pr-3',
              !leftIcon && 'pl-3',
              leftIcon && 'pl-12',
              className,
              rightSlot && 'pr-10',
              error != null && controlInvalid,
            )}
            {...rest}
          />
          {rightSlot && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-600">
              {rightSlot}
            </span>
          )}
        </div>
      </Field>
    );
  },
);

Input.displayName = 'Input';
