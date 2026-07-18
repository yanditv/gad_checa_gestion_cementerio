'use client';

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  /** Controla la visibilidad. */
  open: boolean;
  /** Solicitud de cierre (Esc, click en overlay, botón X). */
  onClose: () => void;
  /** Título del diálogo (se vincula con `aria-labelledby`). */
  title?: ReactNode;
  /** Descripción breve bajo el título. */
  description?: ReactNode;
  size?: ModalSize;
  /** Pie con acciones. */
  footer?: ReactNode;
  /** Oculta el botón X de la cabecera. */
  hideClose?: boolean;
  /** Desactiva el cierre al hacer click en el overlay. */
  disableOverlayClose?: boolean;
  className?: string;
  children?: ReactNode;
}

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Diálogo modal accesible (DESIGN.md §6.1): `role="dialog"` `aria-modal`,
 * focus-trap dentro del panel, cierre con `Esc` u overlay, bloqueo de scroll
 * del body, `shadow-overlay` + `animate-scale-in`. Renderiza en portal sobre
 * `document.body`.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  hideClose = false,
  disableOverlayClose = false,
  className,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Foco inicial dentro del panel.
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target =
        panel.querySelector<HTMLElement>('[data-autofocus], input:not([disabled]), textarea:not([disabled]), select:not([disabled])') ??
        panel.querySelector<HTMLElement>(FOCUSABLE) ??
        panel;
      target.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center overflow-y-auto p-4 sm:items-center"
      aria-hidden={false}
    >
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] animate-fade-in"
        onClick={disableOverlayClose ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title != null ? titleId : undefined}
        aria-describedby={description != null ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-2xl bg-white shadow-overlay animate-scale-in focus:outline-none',
          sizes[size],
          className,
        )}
      >
        {(title != null || !hideClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 pt-5 pb-3">
            <div className="min-w-0">
              {title != null && (
                <h2
                  id={titleId}
                  className="text-lg font-semibold text-slate-900"
                >
                  {title}
                </h2>
              )}
              {description != null && (
                <p id={descId} className="mt-1 text-sm text-slate-600">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="-mr-1.5 -mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        {children != null && <div className="px-6 pb-5 pt-3">{children}</div>}
        {footer != null && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
