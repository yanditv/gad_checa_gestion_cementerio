import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';
import { Field, controlBase, controlInvalid } from './Field';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Opciones del select. Alternativa: pasar `children` con `<option>`. */
  options?: SelectOption[];
  /** Opción inicial deshabilitada (placeholder). */
  placeholder?: string;
  wrapperClassName?: string;
  children?: ReactNode;
}

/**
 * Select nativo estilizado. Mantiene la accesibilidad del control nativo y
 * añade un chevron Tabler. Acepta `options` o `children` con `<option>`.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      options,
      placeholder,
      required,
      className,
      wrapperClassName,
      id,
      value,
      defaultValue,
      children,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const describedById = `${fieldId}-desc`;
    const hasDesc = error != null || hint != null;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={fieldId}
        describedById={hasDesc ? describedById : undefined}
        className={wrapperClassName}
      >
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            required={required}
            value={value}
            defaultValue={
              defaultValue ?? (placeholder != null && value === undefined ? '' : undefined)
            }
            aria-invalid={error != null || undefined}
            aria-describedby={hasDesc ? describedById : undefined}
            className={cn(
              controlBase,
              'h-10 appearance-none px-3 py-2 pr-9',
              error != null && controlInvalid,
              className,
            )}
            {...rest}
          >
            {placeholder != null && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
          >
            <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </span>
        </div>
      </Field>
    );
  },
);

Select.displayName = 'Select';
