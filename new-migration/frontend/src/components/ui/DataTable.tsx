'use client';

import { useMemo, useState, type ReactNode, type Key } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from './cn';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<T> {
  /** Clave estable de la columna (también usada para ordenar). */
  key: string;
  /** Encabezado de la columna. */
  header: ReactNode;
  /** Render de la celda para una fila. */
  cell: (row: T, index: number) => ReactNode;
  /** Alineación del contenido. */
  align?: 'left' | 'center' | 'right';
  /** Habilita el ordenamiento por esta columna (requiere `onSort` o `sortValue`). */
  sortable?: boolean;
  /** Valor por el que ordena la fila. Si se define y no hay `onSort`, la
   * tabla ordena sola las filas visibles en el cliente. */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  /** Clases extra para la celda (`td`). */
  cellClassName?: string;
  /** Clases extra para el encabezado (`th`). */
  headerClassName?: string;
  /** Ancho fijo opcional (clase Tailwind, p. ej. `w-32`). */
  width?: string;
}

export interface DataTableSort {
  key: string;
  direction: SortDirection;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Clave única por fila. */
  rowKey: (row: T, index: number) => Key;
  /** Estado de carga: muestra filas skeleton. */
  loading?: boolean;
  /** Nº de filas skeleton durante la carga. */
  skeletonRows?: number;
  /** Contenido del estado vacío (acepta `EmptyState` o texto). */
  empty?: ReactNode;
  /** Estado de orden controlado. */
  sort?: DataTableSort | null;
  /** Callback al pedir orden por una columna sortable. */
  onSort?: (key: string) => void;
  /** Click sobre una fila (hace la fila navegable + cursor). */
  onRowClick?: (row: T, index: number) => void;
  /** Cabecera sticky al hacer scroll vertical. */
  stickyHeader?: boolean;
  className?: string;
}

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

type SortPrimitive = string | number | Date | null | undefined;

/** Orden natural es-EC: números como números, nulos al final. */
function compareSortValues(a: SortPrimitive, b: SortPrimitive): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const av = a instanceof Date ? a.getTime() : a;
  const bv = b instanceof Date ? b.getTime() : b;
  if (typeof av === 'number' && typeof bv === 'number') return av - bv;
  return String(av).localeCompare(String(bv), 'es', {
    numeric: true,
    sensitivity: 'base',
  });
}

/**
 * Tabla de datos del CRM (DESIGN.md §6.2): header `bg-slate-50` en mayúsculas,
 * hover de fila, orden por columna con indicador, cabecera sticky opcional y
 * estados de carga (skeleton) / vacío (`EmptyState`). El ordenamiento admite
 * dos modos: controlado (`onSort(key)` y el padre decide) o autogestionado
 * (columna con `sortValue` y sin `onSort`: la tabla ordena en el cliente las
 * filas visibles, alternando asc/desc).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  skeletonRows = 6,
  empty,
  sort,
  onSort,
  onRowClick,
  stickyHeader = false,
  className,
}: DataTableProps<T>) {
  const showEmpty = !loading && rows.length === 0;
  const clickable = typeof onRowClick === 'function';

  // Orden autogestionado cuando no hay `onSort` (el prop `sort` manda si viene).
  const [internalSort, setInternalSort] = useState<DataTableSort | null>(null);
  const effectiveSort = sort !== undefined ? sort : internalSort;

  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
      return;
    }
    setInternalSort((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  };

  const sortedRows = useMemo(() => {
    if (!effectiveSort) return rows;
    const col = columns.find((c) => c.key === effectiveSort.key);
    const accessor = col?.sortValue;
    if (!accessor) return rows;
    const dir = effectiveSort.direction === 'asc' ? 1 : -1;
    return [...rows].sort(
      (a, b) => dir * compareSortValues(accessor(a), accessor(b)),
    );
  }, [rows, columns, effectiveSort]);

  const emptyContent =
    empty ?? <EmptyState title="No hay registros para mostrar" compact />;

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full border-collapse text-sm">
        <thead
          className={cn(
            'bg-slate-50',
            stickyHeader && 'sticky top-0 z-10',
          )}
        >
          <tr className="border-b border-slate-200">
            {columns.map((col) => {
              const isSorted = effectiveSort?.key === col.key;
              const sortable =
                col.sortable &&
                (typeof onSort === 'function' ||
                  typeof col.sortValue === 'function');
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    isSorted
                      ? effectiveSort?.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : sortable
                        ? 'none'
                        : undefined
                  }
                  className={cn(
                    'px-4 py-3 text-caption font-semibold uppercase tracking-wide text-slate-500',
                    alignClass[col.align ?? 'left'],
                    col.width,
                    col.headerClassName,
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded transition-colors duration-150 hover:text-slate-700',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1',
                        col.align === 'right' && 'flex-row-reverse',
                        isSorted && 'text-slate-700',
                      )}
                    >
                      <span>{col.header}</span>
                      {!isSorted ? (
                        <ArrowUpDown
                          aria-hidden="true"
                          strokeWidth={2}
                          className="h-4 w-4 text-slate-300"
                        />
                      ) : effectiveSort?.direction === 'asc' ? (
                        <ArrowUp
                          aria-hidden="true"
                          strokeWidth={2}
                          className="h-4 w-4 text-primary-500"
                        />
                      ) : (
                        <ArrowDown
                          aria-hidden="true"
                          strokeWidth={2}
                          className="h-4 w-4 text-primary-500"
                        />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading
            ? Array.from({ length: skeletonRows }).map((_, r) => (
                <tr key={`sk-${r}`}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3.5', alignClass[col.align ?? 'left'])}
                    >
                      <Skeleton className="h-3.5 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            : sortedRows.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  onClick={clickable ? () => onRowClick?.(row, index) : undefined}
                  className={cn(
                    'transition-colors duration-150 hover:bg-slate-50',
                    clickable &&
                      'cursor-pointer focus-within:bg-slate-50',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3.5 align-middle text-slate-700',
                        alignClass[col.align ?? 'left'],
                        col.cellClassName,
                      )}
                    >
                      {col.cell(row, index)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {showEmpty && <div className="border-t border-slate-100">{emptyContent}</div>}
    </div>
  );
}
