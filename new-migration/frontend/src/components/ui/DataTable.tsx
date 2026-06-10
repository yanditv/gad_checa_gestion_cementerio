import { type ReactNode, type Key } from 'react';
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
  /** Habilita el ordenamiento por esta columna (requiere `onSort`). */
  sortable?: boolean;
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

/**
 * Tabla de datos del CRM (DESIGN.md §6.2): header `bg-slate-50` en mayúsculas,
 * hover de fila, orden por columna con indicador, cabecera sticky opcional y
 * estados de carga (skeleton) / vacío (`EmptyState`). El ordenamiento es
 * controlado: se notifica `onSort(key)` y el padre decide la nueva dirección.
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
              const isSorted = sort?.key === col.key;
              const sortable = col.sortable && typeof onSort === 'function';
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    isSorted
                      ? sort?.direction === 'asc'
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
                      onClick={() => onSort?.(col.key)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded transition-colors duration-150 hover:text-slate-700',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1',
                        col.align === 'right' && 'flex-row-reverse',
                        isSorted && 'text-slate-700',
                      )}
                    >
                      <span>{col.header}</span>
                      <i
                        aria-hidden="true"
                        className={cn(
                          'ti text-sm',
                          !isSorted && 'ti-arrows-sort text-slate-300',
                          isSorted &&
                            (sort?.direction === 'asc'
                              ? 'ti-arrow-up text-primary-500'
                              : 'ti-arrow-down text-primary-500'),
                        )}
                      />
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
            : rows.map((row, index) => (
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
