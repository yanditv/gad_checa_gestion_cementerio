'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from './cn';

export interface TabItem {
  /** Valor único de la pestaña. */
  value: string;
  /** Etiqueta visible. */
  label: ReactNode;
  /** Icono Tabler opcional a la izquierda. */
  icon?: ReactNode;
  /** Contador opcional (badge a la derecha). */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  /** Valor activo (controlado). */
  value: string;
  onChange: (value: string) => void;
  /** Variante visual: subrayado (por defecto) o pills. */
  variant?: 'underline' | 'pills';
  className?: string;
  /** `aria-label` del `tablist`. */
  label?: string;
}

/**
 * Pestañas accesibles (DESIGN.md §6.1): `role="tablist"` con foco gestionado
 * por flechas (`←`/`→`, `Home`/`End`) y `aria-selected`. Dos variantes:
 * `underline` (CRM por defecto) y `pills`. Controlado por `value`/`onChange`.
 */
export function Tabs({
  tabs,
  value,
  onChange,
  variant = 'underline',
  className,
  label = 'Secciones',
}: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const enabled = tabs
    .map((t, i) => (t.disabled ? -1 : i))
    .filter((i) => i >= 0);

  const focusTab = (index: number) => {
    tabRefs.current[index]?.focus();
    onChange(tabs[index].value);
  };

  const onKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    const pos = enabled.indexOf(currentIndex);
    if (pos === -1) return;
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = enabled[(pos + 1) % enabled.length];
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = enabled[(pos - 1 + enabled.length) % enabled.length];
        break;
      case 'Home':
        next = enabled[0];
        break;
      case 'End':
        next = enabled[enabled.length - 1];
        break;
    }
    if (next != null) {
      e.preventDefault();
      focusTab(next);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'flex items-center gap-1 overflow-x-auto',
        variant === 'underline' && 'border-b border-slate-200',
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              variant === 'underline' &&
                cn(
                  '-mb-px border-b-2 px-3.5 py-2.5',
                  active
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
                ),
              variant === 'pills' &&
                cn(
                  'rounded-lg px-3.5 py-1.5',
                  active
                    ? 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                ),
            )}
          >
            {tab.icon && (
              <span aria-hidden="true" className="inline-flex text-base">
                {tab.icon}
              </span>
            )}
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-caption font-semibold tabular-nums',
                  active
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-slate-100 text-slate-500',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
