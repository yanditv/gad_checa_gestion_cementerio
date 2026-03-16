import React from 'react';

export interface DataGridColumn<T> {
  key: string;
  title: string;
  width?: string;
  render: (row: T) => React.ReactNode;
}

interface DataGridProps<T> {
  columns: DataGridColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataGrid<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'No hay registros',
  loading = false,
}: DataGridProps<T>) {
  return (
    <div className="card-body" style={{ padding: 0 }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} style={column.width ? { width: column.width } : undefined}>
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-4">
                  Cargando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-4">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((column) => (
                    <td key={`${rowKey(row)}-${column.key}`}>{column.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

