'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { cn } from './cn';
import type { Tone } from './tokens';

export interface DropdownMenuItem {
  /** Clave estable. */
  key: string;
  /** Etiqueta del ítem. */
  label: ReactNode;
  /** Icono Tabler opcional a la izquierda. */
  icon?: ReactNode;
  /** Acción al seleccionar. */
  onSelect?: () => void;
  /** Convierte el ítem en enlace (`next/link`). */
  href?: string;
  /** Tono de énfasis (p. ej. `danger` para eliminar). */
  tone?: Extract<Tone, 'danger'> | 'default';
  disabled?: boolean;
}

export interface DropdownMenuProps {
  /** Disparador (botón/elemento). Recibe el click de apertura. */
  trigger: ReactNode;
  items: DropdownMenuItem[];
  /** Alineación del panel respecto al disparador. */
  align?: 'start' | 'end';
  className?: string;
}

/**
 * Menú desplegable controlado por estado React (sin Bootstrap JS, DESIGN.md
 * §9): un solo panel abierto, cierre con click fuera / `Esc`, navegación por
 * flechas y `Home`/`End`, `shadow-lifted`, `role="menu"`. El disparador se
 * envuelve para gestionar `aria-expanded`/`aria-haspopup`.
 */
export function DropdownMenu({
  trigger,
  items,
  align = 'end',
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([]);
  const menuId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const enabledIndexes = items
    .map((it, i) => (it.disabled ? -1 : i))
    .filter((i) => i >= 0);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open, close]);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [open, activeIndex]);

  const moveActive = (dir: 1 | -1) => {
    if (enabledIndexes.length === 0) return;
    const current = enabledIndexes.indexOf(activeIndex);
    const nextPos =
      current === -1
        ? dir === 1
          ? 0
          : enabledIndexes.length - 1
        : (current + dir + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[nextPos]);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(enabledIndexes[0] ?? -1);
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(enabledIndexes[0] ?? -1);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
    }
  };

  const select = (item: DropdownMenuItem) => {
    if (item.disabled) return;
    close();
    item.onSelect?.();
  };

  const itemClass = (item: DropdownMenuItem) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
      item.disabled && 'cursor-not-allowed opacity-50',
      !item.disabled && item.tone === 'danger'
        ? 'text-danger-600 hover:bg-danger-50'
        : !item.disabled && 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
    );

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <span
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="inline-flex"
      >
        {trigger}
      </span>
      {open && (
        <div
          id={menuId}
          role="menu"
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute top-full z-50 mt-1.5 min-w-[11rem] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lifted animate-fade-in',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) => {
            const ref = (
              el: HTMLButtonElement | HTMLAnchorElement | null,
            ) => {
              itemRefs.current[i] = el;
            };
            if (item.href && !item.disabled) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  ref={ref}
                  role="menuitem"
                  tabIndex={activeIndex === i ? 0 : -1}
                  onClick={() => close()}
                  className={itemClass(item)}
                >
                  {item.icon && (
                    <span aria-hidden="true" className="inline-flex text-base text-slate-600">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.key}
                ref={ref}
                type="button"
                role="menuitem"
                tabIndex={activeIndex === i ? 0 : -1}
                disabled={item.disabled}
                onClick={() => select(item)}
                className={itemClass(item)}
              >
                {item.icon && (
                  <span aria-hidden="true" className="inline-flex text-base text-slate-600">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
