import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';
import { Spinner } from './Spinner';
import { Tooltip } from './Tooltip';

export type IconButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'subtle';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Icono Tabler (o nodo). Decorativo: el significado lo da `label`. */
  icon: ReactNode;
  /** Obligatorio → se expone como `aria-label` (botón icon-only accesible). */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Muestra tooltip con `label` al hover/focus. */
  tooltip?: boolean;
  loading?: boolean;
}

const base =
  'inline-flex items-center justify-center rounded-lg transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<IconButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-300',
  secondary:
    'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 shadow-xs hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-primary-300',
  ghost:
    'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-primary-300',
  danger:
    'bg-transparent text-danger-500 hover:bg-danger-50 hover:text-danger-600 focus-visible:ring-danger-300',
  subtle:
    'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100 hover:bg-primary-100 focus-visible:ring-primary-300',
};

const sizes: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8 text-base',
  md: 'h-10 w-10 text-lg',
  lg: 'h-11 w-11 text-xl',
};

/**
 * Botón de solo icono. `label` es obligatorio y alimenta `aria-label`. Con
 * `tooltip` muestra ese mismo texto al hover/focus (DESIGN.md §5).
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      variant = 'ghost',
      size = 'md',
      tooltip = false,
      loading = false,
      disabled,
      type = 'button',
      className,
      ...rest
    },
    ref,
  ) => {
    const button = (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={tooltip ? undefined : label}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(base, variants[variant], sizes[size], className)}
        {...rest}
      >
        {loading ? (
          <Spinner size={size === 'sm' ? 'xs' : 'sm'} label="Procesando" />
        ) : (
          <span aria-hidden="true" className="inline-flex">
            {icon}
          </span>
        )}
      </button>
    );

    if (tooltip) {
      return <Tooltip content={label}>{button}</Tooltip>;
    }
    return button;
  },
);

IconButton.displayName = 'IconButton';
