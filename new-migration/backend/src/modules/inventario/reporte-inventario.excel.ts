/**
 * Generadores de Excel (XLSX) y CSV para los reportes de inventario
 * (Fase 7, INV-R10 / REP-R2). XLSX reutiliza `report/excel/excel.helper.ts`.
 */
import {
  buildExcelBuffer,
  type ExcelColumn,
} from '../report/excel/excel.helper';
import type {
  ActaEntregaRecepcion,
  FilaDepreciacion,
  FilaInventario,
  GrupoInventario,
} from './reporte-inventario.service';

function isoDate(v: Date | null): string {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Aplanado de grupos: cada fila lleva la columna de grupo para que el Excel/CSV
// sea tabular plano (consumible en hojas de cálculo).
// ---------------------------------------------------------------------------
interface FilaPlana extends FilaInventario {
  grupo: string;
}

function aplanar(grupos: GrupoInventario[]): FilaPlana[] {
  const out: FilaPlana[] = [];
  for (const g of grupos) {
    for (const f of g.filas) out.push({ ...f, grupo: g.titulo });
  }
  return out;
}

const COLUMNAS_AGRUPADO: (etiqueta: string) => ExcelColumn<FilaPlana>[] = (
  etiqueta,
) => [
  { header: etiqueta, key: 'grupo', width: 28 },
  { header: 'Código', key: 'codigo', width: 16 },
  { header: 'Descripción', key: 'descripcion', width: 32 },
  { header: 'Marca', key: 'marca', width: 16, format: (r) => r.marca ?? '' },
  { header: 'Modelo', key: 'modelo', width: 16, format: (r) => r.modelo ?? '' },
  { header: 'Serie', key: 'serie', width: 18, format: (r) => r.serie ?? '' },
  { header: 'Categoría', key: 'categoriaNombre', width: 22 },
  { header: 'Custodio', key: 'custodioNombre', width: 24 },
  {
    header: 'Ubicación',
    key: 'ubicacion',
    width: 22,
    format: (r) => r.ubicacion ?? '',
  },
  { header: 'Estado conserv.', key: 'estadoConservacion', width: 16 },
  {
    header: 'F. adquisición',
    key: 'fechaAdquisicion',
    width: 14,
    format: (r) => isoDate(r.fechaAdquisicion),
  },
  {
    header: 'Valor adquisición',
    key: 'valorAdquisicion',
    width: 16,
    format: (r) => r.valorAdquisicion,
  },
];

const COLUMNAS_DEPRECIACION: ExcelColumn<FilaDepreciacion>[] = [
  { header: 'Código', key: 'codigo', width: 16 },
  { header: 'Descripción', key: 'descripcion', width: 32 },
  { header: 'Categoría', key: 'categoriaNombre', width: 22 },
  { header: 'Custodio', key: 'custodioNombre', width: 24 },
  {
    header: 'F. adquisición',
    key: 'fechaAdquisicion',
    width: 14,
    format: (r) => isoDate(r.fechaAdquisicion),
  },
  {
    header: 'Valor adquisición',
    key: 'valorAdquisicion',
    width: 16,
    format: (r) => r.valorAdquisicion,
  },
  {
    header: 'Valor residual',
    key: 'valorResidual',
    width: 14,
    format: (r) => r.valorResidual,
  },
  { header: 'Vida útil (meses)', key: 'vidaUtilMeses', width: 16 },
  {
    header: 'Deprec. mensual',
    key: 'depreciacionMensual',
    width: 16,
    format: (r) => r.depreciacionMensual,
  },
  { header: 'Meses transc.', key: 'mesesTranscurridos', width: 14 },
  {
    header: 'Deprec. acumulada',
    key: 'depreciacionAcumulada',
    width: 18,
    format: (r) => r.depreciacionAcumulada,
  },
  {
    header: 'Valor en libros',
    key: 'valorEnLibros',
    width: 16,
    format: (r) => r.valorEnLibros,
  },
];

const COLUMNAS_ACTA: ExcelColumn<FilaInventario>[] = [
  { header: 'Código', key: 'codigo', width: 16 },
  { header: 'Descripción', key: 'descripcion', width: 32 },
  { header: 'Serie', key: 'serie', width: 18, format: (r) => r.serie ?? '' },
  { header: 'Estado conserv.', key: 'estadoConservacion', width: 16 },
  {
    header: 'Valor',
    key: 'valorAdquisicion',
    width: 16,
    format: (r) => r.valorAdquisicion,
  },
];

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------
export function buildInventarioAgrupadoExcel(
  hoja: string,
  etiquetaGrupo: string,
  grupos: GrupoInventario[],
): Buffer {
  return buildExcelBuffer(
    hoja,
    aplanar(grupos),
    COLUMNAS_AGRUPADO(etiquetaGrupo),
  );
}

export function buildDepreciacionExcel(filas: FilaDepreciacion[]): Buffer {
  return buildExcelBuffer('Depreciación', filas, COLUMNAS_DEPRECIACION);
}

export function buildActaExcel(acta: ActaEntregaRecepcion): Buffer {
  return buildExcelBuffer('Acta', acta.filas, COLUMNAS_ACTA);
}

// ---------------------------------------------------------------------------
// CSV (REP-R2). Genérico, escapa comillas/comas/saltos según RFC 4180.
// ---------------------------------------------------------------------------
function csvCell(value: string | number | null): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv<T>(rows: T[], columns: ExcelColumn<T>[]): Buffer {
  const lines: string[] = [];
  lines.push(columns.map((c) => csvCell(c.header)).join(','));
  for (const row of rows) {
    lines.push(
      columns
        .map((c) => {
          const v = c.format
            ? c.format(row)
            : ((row as Record<string, unknown>)[c.key] as
                | string
                | number
                | null);
          return csvCell(v ?? '');
        })
        .join(','),
    );
  }
  // BOM para que Excel reconozca UTF-8 (tildes correctas).
  return Buffer.from('﻿' + lines.join('\r\n'), 'utf8');
}

export function buildInventarioAgrupadoCsv(
  etiquetaGrupo: string,
  grupos: GrupoInventario[],
): Buffer {
  return buildCsv(aplanar(grupos), COLUMNAS_AGRUPADO(etiquetaGrupo));
}

export function buildDepreciacionCsv(filas: FilaDepreciacion[]): Buffer {
  return buildCsv(filas, COLUMNAS_DEPRECIACION);
}

export function buildActaCsv(acta: ActaEntregaRecepcion): Buffer {
  return buildCsv(acta.filas, COLUMNAS_ACTA);
}
