import { useId, type ReactNode } from 'react';
import { cn } from './cn';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Texto del tooltip. */
  content: ReactNode;
  /** Lado respecto al disparador. */
  side?: TooltipSide;
  /** Elemento disparador (recibe el hover/focus). */
  children: ReactNode;
  className?: string;
}

const sidePos: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

/**
 * Tooltip ligero por CSS (hover + focus-within del grupo), sin JS de posición.
 * `role="tooltip"` y vínculo `aria-describedby` con el disparador. Aparece y
 * desaparece con transición de opacidad (respeta `prefers-reduced-motion`).
 */
export function Tooltip({ content, side = 'top', children, className }: TooltipProps) {
  const id = useId();
  return (
    <span className="group/tooltip relative inline-flex">
      <span aria-describedby={id} className="inline-flex">
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-xs rounded-lg bg-slate-900 px-2.5 py-1.5 ' +
            'text-xs font-medium text-white shadow-lifted opacity-0 transition-opacity duration-150 ' +
            'group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
          sidePos[side],
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
