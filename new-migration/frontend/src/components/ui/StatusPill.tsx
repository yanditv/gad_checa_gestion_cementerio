import { type ReactNode } from 'react';
import { Badge } from './Badge';
import type { ToneOrNeutral } from './tokens';

export interface StatusPillProps {
  /** Tono semántico del estado (los seis + `neutral`). */
  tone?: ToneOrNeutral;
  /** Etiqueta del estado (Activo, Vencido, Disponible…). */
  label: ReactNode;
  size?: 'sm' | 'md';
  /** Muestra punto de color (por defecto activado en StatusPill). */
  dot?: boolean;
  className?: string;
}

/**
 * Pill de estado de dominio (DESIGN.md §6.1 / §8): atajo de `Badge` con punto
 * de color por defecto para estados como Activo / Vencido / Disponible /
 * Ocupada. Mantén la asignación de tonos consistente en toda la app.
 */
export function StatusPill({
  tone = 'neutral',
  label,
  size = 'md',
  dot = true,
  className,
}: StatusPillProps) {
  return (
    <Badge tone={tone} size={size} dot={dot} className={className}>
      {label}
    </Badge>
  );
}
