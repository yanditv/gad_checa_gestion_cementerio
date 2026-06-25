'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

interface UsePopoverOptions {
  /** Alto estimado del popover para decidir si se voltea hacia arriba. */
  estimatedHeight?: number;
  /** Igualar el ancho del popover al del trigger (selects). */
  matchTriggerWidth?: boolean;
  /** Z-index del popover. Por defecto es 1200 para mostrarse sobre modales. */
  zIndex?: number;
}

/**
 * Posicionamiento de popovers anclados (DatePicker, Select).
 *
 * El popover se renderiza vía portal en `document.body` con `position: fixed`,
 * de modo que NUNCA lo recorte un contenedor con `overflow-hidden` (bug visto
 * en la primera versión del DatePicker). Se voltea hacia arriba si no hay
 * espacio debajo, se reposiciona en scroll/resize y se cierra con click fuera
 * o Escape (devolviendo el foco al trigger).
 */
export function usePopover<T extends HTMLElement = HTMLElement>({
  estimatedHeight = 320,
  matchTriggerWidth = false,
  zIndex = 1200,
}: UsePopoverOptions = {}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex,
    visibility: 'hidden',
    pointerEvents: 'none',
  });
  const triggerRef = useRef<T | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const height = popRef.current?.offsetHeight || estimatedHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < height + gap && rect.top > height + gap;

    const next: CSSProperties = {
      position: 'fixed',
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 8 - (popRef.current?.offsetWidth || rect.width))),
      top: openUp ? rect.top - height - gap : rect.bottom + gap,
      zIndex,
      visibility: 'visible',
      pointerEvents: 'auto',
    };
    if (matchTriggerWidth) next.width = rect.width;
    setStyle(next);
  }, [estimatedHeight, matchTriggerWidth, zIndex]);

  // Posicionar al abrir (layout effect: antes del paint, sin parpadeo).
  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) {
      setStyle({
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex,
        visibility: 'hidden',
        pointerEvents: 'none',
      });
    }
  }, [open, zIndex]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onScrollOrResize = () => reposition();

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, reposition]);

  return { open, setOpen, triggerRef, popRef, style, reposition };
}
