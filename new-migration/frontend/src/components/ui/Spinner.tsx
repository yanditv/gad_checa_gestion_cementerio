import { cn } from './cn';

export interface SpinnerProps {
  /** Tamaño del indicador. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Etiqueta accesible (anunciada por lectores de pantalla). */
  label?: string;
  className?: string;
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  xs: 'h-3.5 w-3.5 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-7 w-7 border-2',
};

/**
 * Indicador de carga circular. `role="status"` + `aria-label` para que sea
 * anunciado. La animación respeta `prefers-reduced-motion` vía `globals.css`.
 */
export function Spinner({ size = 'md', label = 'Cargando', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent align-[-0.125em]',
        sizeMap[size],
        className,
      )}
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}
