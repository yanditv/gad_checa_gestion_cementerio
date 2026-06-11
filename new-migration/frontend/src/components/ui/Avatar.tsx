'use client';

import { useState } from 'react';
import { cn } from './cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps {
  /** URL de la imagen. Si falta o falla, cae a iniciales de `name`. */
  src?: string | null;
  /** Nombre para iniciales y `alt`. */
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-caption',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

/** Deriva hasta dos iniciales del nombre. */
function initials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar circular. Muestra la imagen cuando hay `src` válida; si falta o falla
 * la carga, cae a iniciales sobre fondo neutro. `alt` derivado de `name`.
 */
export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src != null && src !== '' && !errored;
  const label = name?.trim() || 'Usuario';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ' +
          'bg-slate-100 font-semibold text-slate-600 ring-1 ring-inset ring-slate-200',
        sizes[size],
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span aria-hidden="true">{initials(name) || '?'}</span>
      )}
    </span>
  );
}
