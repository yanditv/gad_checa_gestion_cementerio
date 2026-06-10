import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';
import { Spinner } from './Spinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'subtle';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra spinner, deshabilita y marca `aria-busy`. */
  loading?: boolean;
  /** Icono Tabler (o cualquier nodo) a la izquierda del texto. */
  leftIcon?: ReactNode;
  /** Icono a la derecha del texto. */
  rightIcon?: ReactNode;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium ' +
  'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white shadow-xs hover:bg-primary-600 active:bg-primary-700 ' +
    'focus-visible:ring-primary-300',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 shadow-xs ' +
    'hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 focus-visible:ring-primary-300',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 ' +
    'active:bg-slate-200 focus-visible:ring-primary-300',
  danger:
    'bg-danger-500 text-white shadow-xs hover:bg-danger-600 active:bg-danger-700 ' +
    'focus-visible:ring-danger-300',
  subtle:
    'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100 ' +
    'hover:bg-primary-100 active:bg-primary-200 focus-visible:ring-primary-300',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-11 px-5 text-md',
};

const spinnerSizeByButton: Record<ButtonSize, 'xs' | 'sm'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'sm',
};

/**
 * Botón principal de la librería. Cinco variantes y tres tamaños derivados de
 * los tokens (DESIGN.md §3). En `loading` muestra spinner, fija `aria-busy` y
 * se deshabilita. Accesible por teclado con anillo de foco visible.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      block = false,
      disabled,
      type = 'button',
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
        {...rest}
      >
        {loading ? (
          <Spinner size={spinnerSizeByButton[size]} label="Procesando" />
        ) : (
          leftIcon && <span aria-hidden="true" className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children != null && <span>{children}</span>}
        {!loading && rightIcon && (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
