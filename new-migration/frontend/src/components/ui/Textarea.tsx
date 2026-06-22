import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from './cn';
import { Field, controlBase, controlInvalid } from './Field';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  labelIcon?: ReactNode;
  wrapperClassName?: string;
}

/**
 * Área de texto multilínea. Mismo contrato que `Input`: compone `Field` y
 * cablea `aria-invalid` / `aria-describedby`.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      labelIcon,
      required,
      rows = 4,
      className,
      wrapperClassName,
      id,
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
        labelIcon={labelIcon}
        htmlFor={fieldId}
        describedById={hasDesc ? describedById : undefined}
        className={wrapperClassName}
      >
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          aria-invalid={error != null || undefined}
          aria-describedby={hasDesc ? describedById : undefined}
          className={cn(
            controlBase,
            'resize-y px-3 py-2 leading-relaxed',
            error != null && controlInvalid,
            className,
          )}
          {...rest}
        />
      </Field>
    );
  },
);

Textarea.displayName = 'Textarea';
