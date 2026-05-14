import { buildExcelBuffer, type ExcelColumn } from './excel.helper';

function isoDate(v: any) {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function buildIngresosExcel(data: any): Buffer {
  const columns: ExcelColumn<any>[] = [
    { header: 'Fecha', key: 'fechaPago', width: 12, format: (r) => isoDate(r.fechaPago) },
    { header: 'Recibo', key: 'numeroRecibo', width: 15 },
    { header: 'Método', key: 'metodoPago', width: 14 },
    { header: 'Banco', key: 'banco', width: 18 },
    {
      header: 'Contrato',
      key: 'contrato',
      width: 18,
      format: (r) => r.contrato?.numeroSecuencial ?? '',
    },
    {
      header: 'Tipo',
      key: 'tipoIngreso',
      width: 12,
      format: (r) => r.contrato?.tipoIngreso ?? '',
    },
    { header: 'Bloque', key: 'bloque', width: 18 },
    { header: 'Bóveda', key: 'boveda', width: 12 },
    { header: 'Difunto', key: 'difunto', width: 28 },
    { header: 'Responsable', key: 'responsable', width: 28 },
    {
      header: 'Identificación',
      key: 'identificacionResponsable',
      width: 16,
    },
    {
      header: 'Monto',
      key: 'monto',
      width: 12,
      format: (r) => Number(r.monto) || 0,
    },
  ];
  return buildExcelBuffer('Ingresos', data.items ?? [], columns);
}

export function buildCuentasExcel(data: any): Buffer {
  const columns: ExcelColumn<any>[] = [
    {
      header: 'Contrato',
      key: 'contrato',
      width: 18,
      format: (r) => r.contrato?.numeroSecuencial ?? '',
    },
    { header: 'Cuota #', key: 'numero', width: 8 },
    { header: 'Responsable', key: 'responsable', width: 28 },
    { header: 'Teléfono', key: 'telefono', width: 14 },
    { header: 'Difunto', key: 'difunto', width: 28 },
    { header: 'Bloque', key: 'bloque', width: 18 },
    { header: 'Bóveda', key: 'boveda', width: 12 },
    {
      header: 'Fecha venc.',
      key: 'fechaVencimiento',
      width: 12,
      format: (r) => isoDate(r.fechaVencimiento),
    },
    { header: 'Días mora', key: 'diasMora', width: 10 },
    {
      header: 'Monto',
      key: 'monto',
      width: 12,
      format: (r) => Number(r.monto) || 0,
    },
    {
      header: 'Intereses',
      key: 'intereses',
      width: 12,
      format: (r) => Number(r.intereses) || 0,
    },
    {
      header: 'Total',
      key: 'total',
      width: 12,
      format: (r) => Number(r.total) || 0,
    },
  ];
  return buildExcelBuffer('CuentasPorCobrar', data.items ?? [], columns);
}

export function buildBovedasExcel(data: any): Buffer {
  const columns: ExcelColumn<any>[] = [
    { header: 'Bóveda', key: 'numero', width: 12 },
    { header: 'Tipo', key: 'tipo', width: 10 },
    { header: 'Bloque', key: 'bloque', width: 18 },
    { header: 'Piso', key: 'piso', width: 8 },
    { header: 'Cementerio', key: 'cementerio', width: 22 },
    { header: 'Estado', key: 'estado', width: 14 },
    { header: 'Propietario', key: 'propietario', width: 28 },
    {
      header: 'Identificación prop.',
      key: 'identificacionPropietario',
      width: 16,
    },
    { header: 'Difunto', key: 'difunto', width: 28 },
    {
      header: 'Fecha fallec.',
      key: 'fechaFallecimiento',
      width: 14,
      format: (r) => isoDate(r.fechaFallecimiento),
    },
    {
      header: 'Contrato',
      key: 'contrato',
      width: 18,
      format: (r) => r.contrato?.numeroSecuencial ?? '',
    },
    {
      header: 'Inicio contrato',
      key: 'fechaInicio',
      width: 14,
      format: (r) => isoDate(r.contrato?.fechaInicio),
    },
    {
      header: 'Fin contrato',
      key: 'fechaFin',
      width: 14,
      format: (r) => isoDate(r.contrato?.fechaFin),
    },
    {
      header: 'Monto total',
      key: 'montoTotal',
      width: 14,
      format: (r) => Number(r.contrato?.montoTotal ?? 0),
    },
    { header: 'Responsable', key: 'responsable', width: 28 },
    { header: 'Teléfono resp.', key: 'telefonoResponsable', width: 14 },
  ];
  return buildExcelBuffer('Bóvedas', data.items ?? [], columns);
}

export function buildBloquesExcel(data: any): Buffer {
  const columns: ExcelColumn<any>[] = [
    { header: 'Bloque', key: 'nombre', width: 22 },
    { header: 'Cementerio', key: 'cementerio', width: 22 },
    { header: 'Descripción', key: 'descripcion', width: 28 },
    { header: 'Total bóvedas', key: 'total', width: 14 },
    { header: 'Disponibles', key: 'disponibles', width: 14 },
    { header: 'Ocupadas', key: 'ocupadas', width: 12 },
    { header: 'Por caducar', key: 'porCaducar', width: 14 },
    { header: 'Vencidas', key: 'vencidas', width: 12 },
    { header: '% Ocupación', key: 'porcentajeOcupacion', width: 14 },
  ];
  return buildExcelBuffer('Bloques', data.items ?? [], columns);
}
