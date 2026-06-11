'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from './cn';
import { Field, controlBase, controlInvalid } from './Field';

export interface DatePickerProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Valor ISO `yyyy-mm-dd` (o `''` si está vacío). */
  value: string;
  /** Recibe el nuevo valor ISO `yyyy-mm-dd` (o `''` al limpiar). */
  onChange: (value: string) => void;
  /** Fecha mínima seleccionable (ISO `yyyy-mm-dd`). */
  min?: string;
  /** Fecha máxima seleccionable (ISO `yyyy-mm-dd`). */
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  /** Clase del contenedor `Field`. */
  wrapperClassName?: string;
}

/** Fecha desarmada en local (sin zonas horarias): `m` va de 1 a 12. */
interface DateParts {
  y: number;
  m: number;
  d: number;
}

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** Semana es-EC: lunes primero. */
const WEEKDAYS_ES = [
  { short: 'lun', long: 'lunes' },
  { short: 'mar', long: 'martes' },
  { short: 'mié', long: 'miércoles' },
  { short: 'jue', long: 'jueves' },
  { short: 'vie', long: 'viernes' },
  { short: 'sáb', long: 'sábado' },
  { short: 'dom', long: 'domingo' },
];

const pad2 = (n: number) => String(n).padStart(2, '0');

function isValidDate(y: number, m: number, d: number): boolean {
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
}

/** `yyyy-mm-dd` → partes (o `null` si no es una fecha válida). */
function parseIso(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return isValidDate(y, m, d) ? { y, m, d } : null;
}

const toIso = ({ y, m, d }: DateParts) => `${y}-${pad2(m)}-${pad2(d)}`;

/** Partes → display es-EC `dd/mm/aaaa`. */
const toDisplay = ({ y, m, d }: DateParts) => `${pad2(d)}/${pad2(m)}/${y}`;

/** Display `dd/mm/aaaa` (tolerante a `d/m/aaaa`) → partes. */
function parseDisplay(text: string): DateParts | null {
  const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(text);
  if (!match) return null;
  const [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return isValidDate(y, m, d) ? { y, m, d } : null;
}

function todayParts(): DateParts {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

function addDays(parts: DateParts, days: number): DateParts {
  const dt = new Date(parts.y, parts.m - 1, parts.d + days);
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
}

const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

/** Día de la semana con lunes = 0 (es-EC). */
const weekdayMondayFirst = (y: number, m: number, d: number) =>
  (new Date(y, m - 1, d).getDay() + 6) % 7;

/**
 * Selector de fecha (DESIGN.md §6.1) construido a mano con React + Tailwind +
 * lucide-react, sin dependencias de calendario. Locale es-EC: semana inicia
 * lunes, meses y días en español, display `dd/mm/aaaa`; hacia fuera el valor
 * viaja en ISO `yyyy-mm-dd` (compatible con la API y con `min`/`max`).
 *
 * Accesibilidad (WAI-ARIA APG date picker dialog): el input acepta tipeo
 * `dd/mm/aaaa`; el botón calendario (`aria-haspopup="dialog"`) abre un popover
 * `role="dialog"` `aria-modal="true"` con `role="grid"` y tabindex itinerante.
 * El foco entra al día activo al abrir, `Tab` cicla dentro del diálogo (focus
 * trap) y vuelve al input al cerrar. Flechas mueven el día (±1 / ±7),
 * `RePág`/`AvPág` cambian de mes, `Inicio`/`Fin` saltan al lunes/domingo,
 * `Enter`/`Espacio` seleccionan, `Esc` cierra y devuelve el foco. Cierra
 * también al hacer click fuera (light dismiss).
 */
export function DatePicker({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  min,
  max,
  placeholder = 'dd/mm/aaaa',
  disabled,
  id,
  name,
  className,
  wrapperClassName,
}: DatePickerProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedById = `${inputId}-desc`;
  const dialogId = `${inputId}-dialog`;
  const hasDesc = error != null || hint != null;

  const selected = parseIso(value);
  const today = todayParts();
  const todayIso = toIso(today);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState(selected ? toDisplay(selected) : '');
  // Mes visible en el popover.
  const [view, setView] = useState<{ y: number; m: number }>(() => ({
    y: (selected ?? today).y,
    m: (selected ?? today).m,
  }));
  // Día con tabindex 0 dentro de la grilla (tabindex itinerante).
  const [active, setActive] = useState<DateParts>(selected ?? today);
  // Sólo enfocar el día activo cuando el cambio nace del teclado/apertura.
  const shouldFocusDay = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza el texto visible cuando el valor cambia desde fuera
  // (p. ej. "Limpiar filtros" del padre).
  useEffect(() => {
    const parts = parseIso(value);
    setText(parts ? toDisplay(parts) : '');
  }, [value]);

  const inRange = useCallback(
    (iso: string) => (!min || iso >= min) && (!max || iso <= max),
    [min, max],
  );

  const openCalendar = useCallback(() => {
    const base = parseIso(value) ?? todayParts();
    setView({ y: base.y, m: base.m });
    setActive(base);
    shouldFocusDay.current = true;
    setOpen(true);
  }, [value]);

  const close = useCallback(
    (focusInput = false) => {
      setOpen(false);
      if (focusInput) inputRef.current?.focus();
    },
    [],
  );

  // Cierre al hacer click fuera del control.
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open, close]);

  // Enfoca el día activo tras abrir o navegar con teclado.
  useEffect(() => {
    if (!open || !shouldFocusDay.current) return;
    shouldFocusDay.current = false;
    const el = gridRef.current?.querySelector<HTMLElement>(
      `[data-iso="${toIso(active)}"]`,
    );
    el?.focus();
  }, [open, active]);

  const selectDay = (parts: DateParts) => {
    const iso = toIso(parts);
    if (!inRange(iso)) return;
    onChange(iso);
    close(true);
  };

  /** Aplica lo tipeado en el input (commit en blur / Enter). */
  const commitText = () => {
    const trimmed = text.trim();
    if (trimmed === '') {
      if (value !== '') onChange('');
      return;
    }
    const parts = parseDisplay(trimmed);
    if (parts && inRange(toIso(parts))) {
      const iso = toIso(parts);
      if (iso !== value) onChange(iso);
      setText(toDisplay(parts));
    } else {
      // Entrada inválida o fuera de rango: revertir al último valor válido.
      const prev = parseIso(value);
      setText(prev ? toDisplay(prev) : '');
    }
  };

  const moveActive = (next: DateParts) => {
    setActive(next);
    if (next.y !== view.y || next.m !== view.m) {
      setView({ y: next.y, m: next.m });
    }
    shouldFocusDay.current = true;
  };

  const shiftMonth = (delta: number, base = view) => {
    const total = base.y * 12 + (base.m - 1) + delta;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    return { y, m };
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        moveActive(addDays(active, 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveActive(addDays(active, -1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveActive(addDays(active, 7));
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(addDays(active, -7));
        break;
      case 'Home':
        e.preventDefault();
        moveActive(
          addDays(active, -weekdayMondayFirst(active.y, active.m, active.d)),
        );
        break;
      case 'End':
        e.preventDefault();
        moveActive(
          addDays(active, 6 - weekdayMondayFirst(active.y, active.m, active.d)),
        );
        break;
      case 'PageUp':
      case 'PageDown': {
        e.preventDefault();
        const next = shiftMonth(e.key === 'PageUp' ? -1 : 1, {
          y: active.y,
          m: active.m,
        });
        moveActive({
          ...next,
          d: Math.min(active.d, daysInMonth(next.y, next.m)),
        });
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectDay(active);
        break;
    }
  };

  // `Esc` cierra sólo el popover (stopPropagation evita cerrar un Modal padre).
  // `Tab` queda atrapado dentro del diálogo (requisito de `aria-modal="true"`,
  // WAI-ARIA APG date picker dialog).
  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(true);
      return;
    }
    if (e.key === 'Tab') {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled):not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || (e.altKey && e.key === 'ArrowDown')) {
      e.preventDefault();
      openCalendar();
    } else if (e.key === 'Enter') {
      commitText();
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  // ─── Construcción de la grilla del mes visible ─────────────────────────
  const totalDays = daysInMonth(view.y, view.m);
  const leadingBlanks = weekdayMondayFirst(view.y, view.m, 1);
  const cells: (DateParts | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => ({
      y: view.y,
      m: view.m,
      d: i + 1,
    })),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (DateParts | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthLabel = `${MONTHS_ES[view.m - 1]} ${view.y}`;
  const activeInView = active.y === view.y && active.m === view.m;

  const navButton = (
    icon: ReactNode,
    ariaLabel: string,
    onClick: () => void,
  ) => (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
    >
      {icon}
    </button>
  );

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      describedById={hasDesc ? describedById : undefined}
      className={wrapperClassName}
    >
      <div ref={containerRef} className="relative">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={onInputKeyDown}
          aria-invalid={error != null || undefined}
          aria-describedby={hasDesc ? describedById : undefined}
          className={cn(
            controlBase,
            'h-10 px-3 py-2 pr-10 tabular-nums',
            error != null && controlInvalid,
            className,
          )}
        />
        <button
          type="button"
          aria-label="Abrir calendario"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          disabled={disabled}
          onClick={() => (open ? close() : openCalendar())}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-slate-400 transition-colors duration-150 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <Calendar className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </button>

        {open && (
          <div
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label={`Calendario, ${monthLabel}`}
            onKeyDown={onDialogKeyDown}
            className="absolute left-0 top-full z-50 mt-1.5 w-[19rem] rounded-xl border border-slate-200 bg-white p-3 shadow-lifted animate-fade-in"
          >
            {/* Navegación de mes y año */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center">
                {navButton(
                  <ChevronsLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />,
                  'Año anterior',
                  () => setView((v) => ({ ...v, y: v.y - 1 })),
                )}
                {navButton(
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />,
                  'Mes anterior',
                  () => setView((v) => shiftMonth(-1, v)),
                )}
              </div>
              <p
                aria-live="polite"
                className="text-sm font-semibold capitalize text-slate-900"
              >
                {monthLabel}
              </p>
              <div className="flex items-center">
                {navButton(
                  <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />,
                  'Mes siguiente',
                  () => setView((v) => shiftMonth(1, v)),
                )}
                {navButton(
                  <ChevronsRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />,
                  'Año siguiente',
                  () => setView((v) => ({ ...v, y: v.y + 1 })),
                )}
              </div>
            </div>

            {/* Grilla mensual */}
            <div
              ref={gridRef}
              role="grid"
              aria-label={monthLabel}
              onKeyDown={onGridKeyDown}
              className="mt-2"
            >
              <div role="row" className="grid grid-cols-7">
                {WEEKDAYS_ES.map((day) => (
                  <div
                    key={day.short}
                    role="columnheader"
                    aria-label={day.long}
                    className="flex h-8 items-center justify-center text-xs font-medium uppercase text-slate-400"
                  >
                    {day.short}
                  </div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} role="row" className="grid grid-cols-7">
                  {week.map((day, di) => {
                    if (!day) {
                      return <div key={di} role="gridcell" className="h-9" />;
                    }
                    const iso = toIso(day);
                    const isSelected = iso === value;
                    const isToday = iso === todayIso;
                    const isDisabled = !inRange(iso);
                    const isActive =
                      activeInView &&
                      day.d === active.d &&
                      day.m === active.m &&
                      day.y === active.y;
                    return (
                      <div key={di} role="gridcell" className="flex h-9 items-center justify-center">
                        <button
                          type="button"
                          data-iso={iso}
                          tabIndex={isActive || (!activeInView && day.d === 1) ? 0 : -1}
                          aria-label={`${day.d} de ${MONTHS_ES[day.m - 1]} de ${day.y}`}
                          aria-pressed={isSelected}
                          aria-disabled={isDisabled || undefined}
                          aria-current={isToday ? 'date' : undefined}
                          onClick={() => selectDay(day)}
                          onFocus={() => setActive(day)}
                          className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm tabular-nums transition-colors duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
                            isSelected
                              ? 'bg-primary-600 font-semibold text-white hover:bg-primary-700'
                              : isDisabled
                                ? 'cursor-not-allowed text-slate-300'
                                : isToday
                                  ? 'font-semibold text-primary-700 ring-1 ring-inset ring-primary-200 hover:bg-primary-50'
                                  : 'text-slate-700 hover:bg-slate-100',
                          )}
                        >
                          {day.d}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Acciones rápidas */}
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <button
                type="button"
                disabled={!inRange(todayIso)}
                onClick={() => selectDay(today)}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary-600 transition-colors duration-150 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  close(true);
                }}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}
