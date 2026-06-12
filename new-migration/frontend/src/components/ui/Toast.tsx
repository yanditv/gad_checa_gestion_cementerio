'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from './cn';
import type { Tone } from './tokens';

export type ToastTone = Extract<
  Tone,
  'primary' | 'success' | 'warning' | 'danger' | 'info'
>;

export interface ToastOptions {
  tone?: ToastTone;
  title: ReactNode;
  description?: ReactNode;
  /** Duración en ms antes del autocierre. `0` = persistente. */
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  /** Encola un toast. Devuelve su id. */
  toast: (options: ToastOptions) => number;
  /** Cierra un toast por id. */
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneConfig: Record<ToastTone, { icon: LucideIcon; classes: string; iconColor: string }> = {
  primary: {
    icon: Info,
    classes: 'border-primary-200',
    iconColor: 'text-primary-500',
  },
  info: {
    icon: Info,
    classes: 'border-info-200',
    iconColor: 'text-info-500',
  },
  success: {
    icon: CircleCheck,
    classes: 'border-success-200',
    iconColor: 'text-success-600',
  },
  warning: {
    icon: TriangleAlert,
    classes: 'border-warning-200',
    iconColor: 'text-warning-600',
  },
  danger: {
    icon: CircleAlert,
    classes: 'border-danger-200',
    iconColor: 'text-danger-500',
  },
};

/**
 * Proveedor de toasts. Móntalo una vez cerca de la raíz de la app. Expone
 * `useToast()` para feedback no bloqueante (DESIGN.md §6.1). La región usa
 * `aria-live="polite"` y `role="status"`; cada toast respeta su `duration`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      const duration = options.duration ?? 4500;
      setToasts((prev) => [...prev, { ...options, id }]);
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-live="polite"
            role="status"
            className="pointer-events-none fixed bottom-4 right-4 z-[1100] flex w-full max-w-sm flex-col gap-2.5"
          >
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: () => void;
}) {
  const cfg = toneConfig[toast.tone ?? 'primary'];
  const ToneIcon = cfg.icon;
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lifted animate-scale-in',
        cfg.classes,
      )}
    >
      <ToneIcon
        aria-hidden="true"
        strokeWidth={2}
        className={cn('mt-0.5 h-5 w-5 shrink-0', cfg.iconColor)}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        {toast.description != null && (
          <p className="mt-0.5 text-sm text-slate-500">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
      >
        <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Hook de acceso al sistema de toasts. Requiere `ToastProvider` en el árbol. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  }
  return ctx;
}
