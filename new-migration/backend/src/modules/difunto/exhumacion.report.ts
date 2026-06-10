/**
 * Reporte/historial de exhumaciones exportable (CAT-R4d / REP-R2) en los tres
 * formatos del sistema: PDF tabular (A4 horizontal), Excel y CSV.
 */
import {
  drawFooter,
  drawHeader,
  drawTable,
  formatDate,
  streamPdf,
  type Column,
} from '../report/pdf/common';
import { buildExcelBuffer, type ExcelColumn } from '../report/excel/excel.helper';

const MOTIVO_LABEL: Record<string, string> = {
  vencimiento_arriendo: 'Vencimiento de arriendo',
  traslado: 'Traslado',
  orden_judicial: 'Orden judicial',
  osario_comun: 'Osario común',
  otro: 'Otro',
};

export interface ExhumacionRow {
  numeroActa: string;
  fechaExhumacion: Date | string;
  motivo: string;
  destino: string;
  numeroAutorizacion?: string | null;
  entidadAutorizante?: string | null;
  difunto?: {
    nombre: string;
    apellido: string;
    numeroIdentificacion?: string | null;
  } | null;
  bovedaOrigen?: {
    numero: string;
    tipo?: string | null;
    bloque?: { nombre: string | null } | null;
  } | null;
}

function motivoLabel(m: string): string {
  return MOTIVO_LABEL[m] ?? m;
}

function difuntoNombre(r: ExhumacionRow): string {
  if (!r.difunto) return '—';
  return `${r.difunto.nombre} ${r.difunto.apellido}`.trim();
}

function bovedaNumero(r: ExhumacionRow): string {
  return r.bovedaOrigen?.numero ?? '—';
}

function bloqueNombre(r: ExhumacionRow): string {
  return r.bovedaOrigen?.bloque?.nombre ?? '—';
}

export function buildExhumacionesPdf(rows: ExhumacionRow[]): Promise<Buffer> {
  return streamPdf(
    (doc) => {
      drawHeader(
        doc,
        'HISTORIAL DE EXHUMACIONES',
        `Total de registros: ${rows.length}`,
      );

      const columns: Column<ExhumacionRow>[] = [
        { header: 'Acta', width: 70, format: (r) => r.numeroActa },
        {
          header: 'Fecha',
          width: 50,
          format: (r) => formatDate(r.fechaExhumacion),
        },
        { header: 'Difunto', width: 110, format: difuntoNombre },
        { header: 'Bóveda', width: 45, format: bovedaNumero },
        { header: 'Bloque', width: 70, format: bloqueNombre },
        { header: 'Motivo', width: 80, format: (r) => motivoLabel(r.motivo) },
        { header: 'Destino', width: 90, format: (r) => r.destino ?? '—' },
        {
          header: 'Autorización',
          width: 60,
          format: (r) => r.numeroAutorizacion ?? '—',
        },
      ];

      drawTable(doc, rows, columns);
      drawFooter(doc);
    },
    { size: 'A4', layout: 'landscape' },
  );
}

export function buildExhumacionesExcel(rows: ExhumacionRow[]): Buffer {
  const columns: ExcelColumn<ExhumacionRow>[] = [
    { header: 'Acta', key: 'numeroActa', width: 18 },
    {
      header: 'Fecha',
      key: 'fechaExhumacion',
      width: 12,
      format: (r) => formatDate(r.fechaExhumacion),
    },
    { header: 'Difunto', key: 'difunto', width: 28, format: difuntoNombre },
    {
      header: 'Identificación',
      key: 'identificacion',
      width: 16,
      format: (r) => r.difunto?.numeroIdentificacion ?? '',
    },
    { header: 'Bóveda', key: 'boveda', width: 12, format: bovedaNumero },
    { header: 'Bloque', key: 'bloque', width: 18, format: bloqueNombre },
    { header: 'Motivo', key: 'motivo', width: 22, format: (r) => motivoLabel(r.motivo) },
    { header: 'Destino', key: 'destino', width: 28, format: (r) => r.destino ?? '' },
    {
      header: 'N.° Autorización',
      key: 'numeroAutorizacion',
      width: 18,
      format: (r) => r.numeroAutorizacion ?? '',
    },
    {
      header: 'Entidad Autorizante',
      key: 'entidadAutorizante',
      width: 24,
      format: (r) => r.entidadAutorizante ?? '',
    },
  ];
  return buildExcelBuffer('Exhumaciones', rows, columns);
}

function csvField(value: string | null | undefined): string {
  const v = value ?? '';
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function buildExhumacionesCsv(rows: ExhumacionRow[]): Buffer {
  const headers = [
    'Acta',
    'Fecha',
    'Difunto',
    'Identificacion',
    'Boveda',
    'Bloque',
    'Motivo',
    'Destino',
    'NumeroAutorizacion',
    'EntidadAutorizante',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        csvField(r.numeroActa),
        csvField(formatDate(r.fechaExhumacion)),
        csvField(difuntoNombre(r)),
        csvField(r.difunto?.numeroIdentificacion ?? ''),
        csvField(bovedaNumero(r)),
        csvField(bloqueNombre(r)),
        csvField(motivoLabel(r.motivo)),
        csvField(r.destino ?? ''),
        csvField(r.numeroAutorizacion ?? ''),
        csvField(r.entidadAutorizante ?? ''),
      ].join(','),
    );
  }
  // BOM para que Excel reconozca UTF-8 con acentos.
  return Buffer.from('﻿' + lines.join('\r\n'), 'utf8');
}
