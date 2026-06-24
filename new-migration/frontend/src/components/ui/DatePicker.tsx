'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from './cn';
import { Field, controlBase, controlInvalid } from './Field';
import { usePopover } from './usePopover';

export interface DatePickerProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  labelIcon?: ReactNode;
  required?: boolean;
  /** Valor ISO `yyyy-mm-dd` (o `''`). Se muestra como `dd/mm/aaaa`. */
  value: string;
  /** Recibe el nuevo valor ISO `yyyy-mm-dd` (o `''` al limpiar). */
  onChange: (value: string) => void;
  /** Fecha mínima seleccionable (ISO). */
  min?: string;
  /** Fecha máxima seleccionable (ISO). */
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  wrapperClassName?: string;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayISO = () => {
  const t = new Date();
  return toISO(t.getFullYear(), t.getMonth(), t.getDate());
};
const fmtDisplay = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};
/** Comparación lexicográfica válida para ISO yyyy-mm-dd. */
const inRange = (iso: string, min?: string, max?: string) =>
  (!min || iso >= min) && (!max || iso <= max);

interface DayCell {
  iso: string;
  day: number;
  outside: boolean;
}

/** Semanas lunes-domingo del mes visible (es-EC), con días de relleno. */
function monthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1);
  // getDay(): 0=domingo … queremos 0=lunes.
  const lead = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - lead);
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({
      iso: toISO(d.getFullYear(), d.getMonth(), d.getDate()),
      day: d.getDate(),
      outside: d.getMonth() !== month,
    });
  }
  return cells;
}

/**
 * Selector de fecha propio (es-EC): input con calendario en popover.
 *
 * - El popover se monta por **portal** (no lo recorta ningún `overflow-hidden`).
 * - Días sin bordes: hover suave, seleccionado en `primary-600`, hoy resaltado.
 * - Teclado: flechas mueven el día, AvPág/RePág cambian de mes, Enter
 *   selecciona, Esc cierra, Tab queda atrapado dentro del diálogo
 *   (`aria-modal="true"`, WAI-ARIA APG). `role="grid"` + `aria-selected`.
 */
export function DatePicker({
  label,
  hint,
  error,
  labelIcon,
  required,
  value,
  onChange,
  min,
  max,
  placeholder = 'dd/mm/aaaa',
  disabled,
  id,
  wrapperClassName,
}: DatePickerProps) {
  const reactId = useId();
  const inputId = id ?? `datepicker-${reactId}`;
  const hintId = `${inputId}-hint`;
  const { open, setOpen, triggerRef, popRef, style } = usePopover<HTMLButtonElement>({
    estimatedHeight: 352,
  });

  const baseISO = value || todayISO();
  const [viewYear, setViewYear] = useState(() => Number(baseISO.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(baseISO.slice(5, 7)) - 1);
  const [focusISO, setFocusISO] = useState(baseISO);
  const [pickerMode, setPickerMode] = useState<'day' | 'month' | 'year'>('day');
  const [yearPageStart, setYearPageStart] = useState(
    () => Math.floor(Number(baseISO.slice(0, 4)) / 12) * 12,
  );
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Al abrir, centrar la vista en el valor actual (o en hoy).
  useEffect(() => {
    if (!open) return;
    const iso = value || todayISO();
    setViewYear(Number(iso.slice(0, 4)));
    setViewMonth(Number(iso.slice(5, 7)) - 1);
    setFocusISO(iso);
    setPickerMode('day');
    setYearPageStart(Math.floor(Number(iso.slice(0, 4)) / 12) * 12);
  }, [open, value]);

  // Mover el foco DOM al día focalizado cuando cambia (navegación por teclado).
  useEffect(() => {
    if (!open) return;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-iso="${focusISO}"]`)
      ?.focus();
  }, [open, focusISO]);

  const moveView = (deltaMonths: number) => {
    const d = new Date(viewYear, viewMonth + deltaMonths, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setYearPageStart(Math.floor(d.getFullYear() / 12) * 12);
  };

  const moveFocus = (deltaDays: number) => {
    const [y, m, d] = focusISO.split('-').map(Number);
    const next = new Date(y, m - 1, d + deltaDays);
    const iso = toISO(next.getFullYear(), next.getMonth(), next.getDate());
    setFocusISO(iso);
    if (next.getFullYear() !== viewYear || next.getMonth() !== viewMonth) {
      setViewYear(next.getFullYear());
      setViewMonth(next.getMonth());
    }
  };

  const select = (iso: string) => {
    if (!inRange(iso, min, max)) return;
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowLeft: () => moveFocus(-1),
      ArrowRight: () => moveFocus(1),
      ArrowUp: () => moveFocus(-7),
      ArrowDown: () => moveFocus(7),
      PageUp: () => moveView(-1),
      PageDown: () => moveView(1),
      Enter: () => select(focusISO),
      ' ': () => select(focusISO),
    };
    const fn = keys[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  // Trampa de foco: Tab/Shift+Tab ciclan dentro del diálogo (aria-modal).
  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const root = popRef.current;
    if (!root) return;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled)'),
    ).filter((el) => el.tabIndex >= 0);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const hoy = todayISO();
  const cells = monthGrid(viewYear, viewMonth);
  const currentYear = new Date().getFullYear();
  const minYear = Math.min(min ? Number(min.slice(0, 4)) : 1900, viewYear);
  const maxYear = Math.max(max ? Number(max.slice(0, 4)) : currentYear + 10, viewYear);
  const years = Array.from({ length: 12 }, (_, i) => yearPageStart + i);

  const monthEnabled = (month: number) => {
    const first = toISO(viewYear, month, 1);
    const lastDate = new Date(viewYear, month + 1, 0).getDate();
    const last = toISO(viewYear, month, lastDate);
    return (!min || last >= min) && (!max || first <= max);
  };

  const yearEnabled = (year: number) => year >= minYear && year <= maxYear;

  const moveHeader = (direction: -1 | 1) => {
    if (pickerMode === 'year') {
      setYearPageStart((year) => year + direction * 12);
    } else if (pickerMode === 'month') {
      setViewYear((year) => year + direction);
      setYearPageStart((year) => year + direction);
    } else {
      moveView(direction);
    }
  };

  const popover = open && mounted
    ? createPortal(
        <div
          ref={popRef}
          style={style}
          role="dialog"
          aria-modal="true"
          aria-label="Elegir fecha"
          onKeyDown={onDialogKeyDown}
          className="z-[1200] w-[19rem] rounded-xl border border-slate-200 bg-white p-3 shadow-lifted"
        >
          {/* Cabecera: navegación directa por mes y año sin desplegables largos. */}
          <div className="mb-2 grid grid-cols-[1.75rem_1fr_1.75rem] items-center gap-2 px-1">
            <button
              type="button"
              onClick={() => moveHeader(-1)}
              aria-label="Anterior"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex min-w-0 items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => setPickerMode((mode) => (mode === 'month' ? 'day' : 'month'))}
                className={cn(
                  'h-8 rounded-md px-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
                  pickerMode === 'month' && 'bg-primary-50 text-primary-700',
                )}
              >
                {MESES[viewMonth]}
              </button>
              <button
                type="button"
                onClick={() => {
                  setYearPageStart(Math.floor(viewYear / 12) * 12);
                  setPickerMode((mode) => (mode === 'year' ? 'day' : 'year'));
                }}
                className={cn(
                  'h-8 rounded-md px-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
                  pickerMode === 'year' && 'bg-primary-50 text-primary-700',
                )}
              >
                {pickerMode === 'year' ? `${yearPageStart}-${yearPageStart + 11}` : viewYear}
              </button>
            </div>
            <button
              type="button"
              onClick={() => moveHeader(1)}
              aria-label="Siguiente"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {pickerMode === 'month' && (
            <div className="grid grid-cols-3 gap-2 py-1">
              {MESES.map((mes, index) => {
                const selected = index === viewMonth;
                const enabled = monthEnabled(index);
                return (
                  <button
                    key={mes}
                    type="button"
                    disabled={!enabled}
                    onClick={() => {
                      setViewMonth(index);
                      setPickerMode('day');
                    }}
                    className={cn(
                      'h-10 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
                      selected
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100',
                      !enabled && 'cursor-not-allowed bg-slate-50 text-slate-300 hover:bg-slate-50',
                    )}
                  >
                    {mes.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}

          {pickerMode === 'year' && (
            <div className="grid grid-cols-3 gap-2 py-1">
              {years.map((year) => {
                const selected = year === viewYear;
                const enabled = yearEnabled(year);
                return (
                  <button
                    key={year}
                    type="button"
                    disabled={!enabled}
                    onClick={() => {
                      setViewYear(year);
                      setPickerMode('month');
                    }}
                    className={cn(
                      'h-10 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
                      selected
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100',
                      !enabled && 'cursor-not-allowed bg-slate-50 text-slate-300 hover:bg-slate-50',
                    )}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {pickerMode === 'day' && (
            <>
              {/* Días de la semana */}
              <div className="grid grid-cols-7" aria-hidden="true">
                {DIAS.map((d) => (
                  <span
                    key={d}
                    className="flex h-8 items-center justify-center text-[11px] font-medium uppercase text-slate-600"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Grid de días — sin bordes; estados por color */}
              <div ref={gridRef} role="grid" onKeyDown={onGridKeyDown} className="grid grid-cols-7">
                {cells.map((c) => {
                  const selected = value === c.iso;
                  const isToday = c.iso === hoy;
                  const enabled = inRange(c.iso, min, max);
                  return (
                    <button
                      key={c.iso}
                      type="button"
                      role="gridcell"
                      data-iso={c.iso}
                      tabIndex={c.iso === focusISO ? 0 : -1}
                      aria-selected={selected || undefined}
                      disabled={!enabled}
                      onClick={() => select(c.iso)}
                      className={cn(
                        'mx-auto flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
                        selected
                          ? 'bg-primary-600 font-semibold text-white shadow-sm'
                          : isToday
                            ? 'font-semibold text-primary-600 ring-1 ring-inset ring-primary-200'
                            : c.outside
                              ? 'text-slate-300 hover:bg-slate-50'
                              : 'text-slate-700 hover:bg-slate-100',
                        !enabled && 'cursor-not-allowed text-slate-200 hover:bg-transparent',
                      )}
                    >
                      {c.day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Pie: atajos discretos */}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 px-1 pt-2">
            <button
              type="button"
              onClick={() => select(hoy)}
              disabled={!inRange(hoy, min, max)}
              className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Hoy
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      labelIcon={labelIcon}
      htmlFor={inputId}
      describedById={hint != null || error != null ? hintId : undefined}
      className={wrapperClassName}
    >
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          controlBase,
          error != null && controlInvalid,
          'flex h-10 items-center justify-between gap-2 px-3 text-left text-sm',
        )}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-600'}>
          {value ? fmtDisplay(value) : placeholder}
        </span>
        <span className="flex items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Limpiar fecha"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="rounded p-0.5 text-slate-600 transition-colors hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          )}
          <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </span>
      </button>
      {popover}
    </Field>
  );
}
