import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from './cn';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Etiqueta a la derecha de la casilla. */
  label?: ReactNode;
  /** Ayuda secundaria bajo la etiqueta. */
  hint?: ReactNode;
}

/**
 * Casilla de verificación con etiqueta clicable. Usa el control nativo (estado
 * y teclado accesibles) con estilos Tailwind sobre los tokens.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, className, id, disabled, ...rest }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          disabled={disabled}
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-primary-500 ' +
              'shadow-xs transition-colors duration-150 focus:outline-none focus-visible:ring-2 ' +
              'focus-visible:ring-primary-400 focus-visible:ring-offset-1 ' +
              'disabled:cursor-not-allowed disabled:opacity-60',
            className,
          )}
          {...rest}
        />
        {(label != null || hint != null) && (
          <label
            htmlFor={fieldId}
            className={cn(
              'flex cursor-pointer flex-col',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {label != null && (
              <span className="text-base text-slate-700">{label}</span>
            )}
            {hint != null && <span className="text-xs text-slate-500">{hint}</span>}
          </label>
        )}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
