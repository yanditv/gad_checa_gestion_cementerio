import { type ReactNode } from 'react';
import { cn } from './cn';
import type { ToneOrNeutral } from './tokens';

export interface BadgeProps {
  /** Tono semántico (los seis canónicos) o `neutral`. */
  tone?: ToneOrNeutral;
  size?: 'sm' | 'md';
  /** Muestra un punto de color a la izquierda. */
  dot?: boolean;
  /** Icono Tabler opcional a la izquierda. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Pill suave `bg-{tono}-50 text-{tono}-700 ring-{tono}-200` (DESIGN.md §8). */
const tones: Record<ToneOrNeutral, string> = {
  primary: 'bg-primary-50 text-primary-700 ring-primary-200',
  success: 'bg-success-50 text-success-700 ring-success-200',
  info: 'bg-info-50 text-info-700 ring-info-200',
  warning: 'bg-warning-50 text-warning-700 ring-warning-200',
  danger: 'bg-danger-50 text-danger-700 ring-danger-200',
  secondary: 'bg-secondary-100 text-secondary-700 ring-secondary-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const dotTones: Record<ToneOrNeutral, string> = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  info: 'bg-info-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  secondary: 'bg-secondary-500',
  neutral: 'bg-slate-400',
};

const sizes = {
  sm: 'px-2 py-0.5 text-caption',
  md: 'px-2.5 py-1 text-xs',
} as const;

/**
 * Etiqueta de estado en forma de pill. Variante suave por tono, con punto o
 * icono opcional. Para estados de dominio usar `StatusPill` (Fase 2).
 */
export function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset',
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 rounded-full', dotTones[tone])}
        />
      )}
      {icon && (
        <span aria-hidden="true" className="inline-flex text-[0.9em]">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
