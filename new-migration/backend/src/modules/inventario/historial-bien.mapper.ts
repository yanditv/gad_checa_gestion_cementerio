import { DepreciacionBien, MovimientoBien } from '@prisma/client';
import { HistorialItemDto } from './dto/movimiento-bien.dto';

export interface CustodioResumen {
  id: number;
  nombre: string;
}

function resumenCustodio(
  id: number | null,
  custodios: Map<number, string>,
): CustodioResumen | null {
  if (id === null) return null;
  const nombre = custodios.get(id);
  return nombre ? { id, nombre } : { id, nombre: 'Custodio eliminado' };
}

export function movimientoToHistorialItem(
  mov: MovimientoBien,
  custodios: Map<number, string>,
): HistorialItemDto {
  return {
    origen: 'movimiento',
    tipo: mov.tipo,
    fecha: mov.fecha.toISOString(),
    detalle: mov.detalle,
    custodioAnterior: resumenCustodio(mov.custodioAnteriorId, custodios),
    custodioNuevo: resumenCustodio(mov.custodioNuevoId, custodios),
    ubicacionAnterior: mov.ubicacionAnterior,
    ubicacionNueva: mov.ubicacionNueva,
    documento: mov.documento,
    valorDepreciado: null,
    depreciacionAcumulada: null,
    valorEnLibros: null,
  };
}

export function depreciacionToHistorialItem(
  dep: DepreciacionBien,
): HistorialItemDto {
  return {
    origen: 'depreciacion',
    tipo: 'depreciacion',
    fecha: dep.fechaCalculo.toISOString(),
    detalle: `Depreciación del periodo ${String(dep.mes).padStart(2, '0')}/${dep.anio}`,
    custodioAnterior: null,
    custodioNuevo: null,
    ubicacionAnterior: null,
    ubicacionNueva: null,
    documento: null,
    valorDepreciado: Number(dep.valorDepreciado),
    depreciacionAcumulada: Number(dep.depreciacionAcumulada),
    valorEnLibros: Number(dep.valorEnLibros),
  };
}
