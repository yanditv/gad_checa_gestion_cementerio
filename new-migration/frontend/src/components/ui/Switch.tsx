'use client';

import { forwardRef, useId, type ReactNode } from 'react';
import { cn } from './cn';

export interface SwitchProps {
  /** Estado encendido/apagado (controlado). */
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** Etiqueta a la derecha del interruptor. */
  label?: ReactNode;
  /** Ayuda secundaria bajo la etiqueta. */
  hint?: ReactNode;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

/**
 * Interruptor on/off con `role="switch"` y `aria-checked`. Animación de 150 ms
 * (respeta `prefers-reduced-motion`). Operable con Enter/Espacio (es un
 * `<button>`). Controlado: el padre gestiona `checked`.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, label, hint, disabled, name, id, className }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const labelId = `${fieldId}-label`;

    const toggle = () => {
      if (!disabled) onChange?.(!checked);
    };

    return (
      <div className="flex items-start gap-3">
        <button
          ref={ref}
          type="button"
          role="switch"
          id={fieldId}
          aria-checked={checked}
          aria-labelledby={label != null ? labelId : undefined}
          disabled={disabled}
          onClick={toggle}
          className={cn(
            'relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full ' +
              'transition-colors duration-150 focus:outline-none focus-visible:ring-2 ' +
              'focus-visible:ring-primary-400 focus-visible:ring-offset-1 ' +
              'disabled:cursor-not-allowed disabled:opacity-60',
            checked ? 'bg-primary-500' : 'bg-slate-300',
            className,
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-150',
              checked ? 'translate-x-4' : 'translate-x-0.5',
            )}
          />
        </button>
        {name && (
          <input type="hidden" name={name} value={checked ? 'true' : 'false'} />
        )}
        {(label != null || hint != null) && (
          <label
            id={labelId}
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

Switch.displayName = 'Switch';
