'use client';

import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MutableRefObject,
  type OptionHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from './cn';
import { Field, controlBase, controlInvalid } from './Field';
import { usePopover } from './usePopover';

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
  labelIcon?: ReactNode;
  /** Opciones del select. Alternativa: pasar `children` con `<option>`. */
  options?: SelectOption[];
  /** Opción inicial deshabilitada (placeholder). */
  placeholder?: string;
  wrapperClassName?: string;
  children?: ReactNode;
}

type OptionElement = ReactElement<OptionHTMLAttributes<HTMLOptionElement>>;

function optionText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return Children.toArray(children).join('');
}

function optionsFromChildren(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== 'option') return [];
    const option = child as OptionElement;
    const value = option.props.value;
    return [{
      value: value == null ? optionText(option.props.children) : String(value),
      label: optionText(option.props.children),
      disabled: option.props.disabled,
    }];
  });
}

/**
 * Select estilizado con listbox propio. Evita el desplegable nativo enorme:
 * el menú tiene alto máximo, scroll interno y conserva `onChange` con la
 * misma forma que un `<select>` para los formularios actuales.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      labelIcon,
      options,
      placeholder,
      required,
      className,
      wrapperClassName,
      id,
      value,
      defaultValue,
      children,
      onChange,
      disabled,
      name,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const describedById = `${fieldId}-desc`;
    const hasDesc = error != null || hint != null;
    const hiddenRef = useRef<HTMLSelectElement | null>(null);
    const [internalValue, setInternalValue] = useState(
      String(value ?? defaultValue ?? (placeholder != null ? '' : '')),
    );
    const { open, setOpen, triggerRef, popRef, style } = usePopover<HTMLButtonElement>({
      estimatedHeight: 280,
      matchTriggerWidth: true,
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    useEffect(() => {
      if (value !== undefined) setInternalValue(String(value));
    }, [value]);

    const optionRows = useMemo(() => {
      const rows = options ?? optionsFromChildren(children);
      return placeholder != null
        ? [{ value: '', label: placeholder, disabled: required }, ...rows]
        : rows;
    }, [children, options, placeholder, required]);

    const selected = optionRows.find((opt) => String(opt.value) === internalValue);
    const displayLabel = selected?.label ?? placeholder ?? 'Seleccione';

    const selectValue = (nextValue: string | number, optionDisabled?: boolean) => {
      if (optionDisabled || disabled) return;
      const normalized = String(nextValue);
      setInternalValue(normalized);
      setOpen(false);

      if (hiddenRef.current) {
        hiddenRef.current.value = normalized;
      }
      onChange?.({
        target: { value: normalized, name },
        currentTarget: { value: normalized, name },
      } as ChangeEvent<HTMLSelectElement>);
      triggerRef.current?.focus();
    };

    const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(true);
      }
    };

    const popover = mounted && open
      ? createPortal(
          <div
            ref={popRef}
            style={style}
            role="listbox"
            aria-labelledby={fieldId}
            className="z-50 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl"
          >
            {optionRows.map((opt) => {
              const optValue = String(opt.value);
              const active = optValue === internalValue;
              return (
                <button
                  key={optValue || '__empty'}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={opt.disabled}
                  onClick={() => selectValue(opt.value, opt.disabled)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition-colors',
                    'hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
                    active && 'bg-primary-50 font-medium text-primary-700',
                    opt.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-slate-700',
                  )}
                >
                  <span className="min-w-0 truncate">{opt.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        labelIcon={labelIcon}
        htmlFor={fieldId}
        describedById={hasDesc ? describedById : undefined}
        className={wrapperClassName}
      >
        <select
          ref={(node) => {
            hiddenRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as MutableRefObject<HTMLSelectElement | null>).current = node;
          }}
          id={fieldId}
          name={name}
          required={required}
          value={internalValue}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          onChange={onChange}
          {...rest}
        >
          {placeholder != null && (
            <option value="" disabled={required}>
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
        <button
          ref={triggerRef}
          id={`${fieldId}-button`}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={error != null || undefined}
          aria-describedby={hasDesc ? describedById : undefined}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={onButtonKeyDown}
          className={cn(
            controlBase,
            'flex h-10 items-center justify-between gap-2 px-3 py-2 text-left text-sm',
            error != null && controlInvalid,
            className,
          )}
        >
          <span className={cn('min-w-0 truncate', selected ? 'text-slate-900' : 'text-slate-600')}>
            {displayLabel}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} aria-hidden="true" />
        </button>
        {popover}
      </Field>
    );
  },
);

Select.displayName = 'Select';
