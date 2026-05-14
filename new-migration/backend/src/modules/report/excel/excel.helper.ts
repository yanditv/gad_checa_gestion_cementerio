/**
 * Helper para generar archivos Excel a partir de filas y columnas usando
 * `xlsx`. Devuelve un Buffer listo para enviar como respuesta.
 */
import * as XLSX from 'xlsx';

export interface ExcelColumn<T> {
  header: string;
  key: string;
  width?: number;
  format?: (row: T) => string | number | null;
}

export function buildExcelBuffer<T>(
  sheetName: string,
  rows: T[],
  columns: ExcelColumn<T>[],
): Buffer {
  const headers = columns.map((c) => c.header);
  const aoa: (string | number | null)[][] = [headers];

  for (const row of rows) {
    aoa.push(
      columns.map((c) => {
        if (c.format) return c.format(row);
        return ((row as any)[c.key] ?? null) as string | number | null;
      }),
    );
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 15 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buf);
}
