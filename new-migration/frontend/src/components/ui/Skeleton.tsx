import { cn } from './cn';

export interface SkeletonProps {
  /** Clases extra (alto/ancho/forma). Por defecto bloque de una línea. */
  className?: string;
  /** Si se indica (>1), renderiza esa cantidad de líneas apiladas. */
  lines?: number;
  /** Hace el bloque circular (útil para avatares de carga). */
  circle?: boolean;
}

/**
 * Bloque de carga con brillo (`.skeleton-shimmer` de `globals.css`, respeta
 * `prefers-reduced-motion`). Con `lines` renderiza varias líneas; la última
 * sale más corta para simular texto. Decorativo: `aria-hidden`.
 */
export function Skeleton({ className, lines, circle }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'skeleton-shimmer block h-3.5 rounded-md',
              i === lines - 1 ? 'w-2/3' : 'w-full',
              className,
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'skeleton-shimmer block h-4 w-full',
        circle ? 'rounded-full' : 'rounded-md',
        className,
      )}
    />
  );
}
