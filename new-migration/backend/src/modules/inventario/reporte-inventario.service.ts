import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getInstitucionPdf } from '../../common/utils/institucion.util';
import type { InstitucionPdf } from '../report/pdf/common';
import {
  calcularDepreciacion,
  type BienDepreciable,
  type CategoriaDepreciacion,
} from './depreciacion.calc';
import {
  ActaEntregaRecepcionFiltroDto,
  ReporteDepreciacionFiltroDto,
  ReporteInventarioFiltroDto,
} from './dto/reporte-inventario.dto';

const REPORTE_INCLUDE = {
  categoria: { select: { id: true, nombre: true } },
  custodio: { select: { id: true, nombre: true, identificacion: true } },
} as const;

type BienReporte = Prisma.BienGetPayload<{ include: typeof REPORTE_INCLUDE }>;

/** Fila plana de un bien para los reportes de inventario. */
export interface FilaInventario {
  id: number;
  codigo: string;
  descripcion: string;
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  fechaAdquisicion: Date;
  valorAdquisicion: number;
  estadoConservacion: string;
  ubicacion: string | null;
  dadoDeBaja: boolean;
  categoriaId: number | null;
  categoriaNombre: string;
  custodioId: number | null;
  custodioNombre: string;
}

/** Fila con datos de depreciación a una fecha de corte. */
export interface FilaDepreciacion extends FilaInventario {
  valorResidual: number;
  vidaUtilMeses: number;
  depreciacionMensual: number;
  mesesTranscurridos: number;
  depreciacionAcumulada: number;
  valorEnLibros: number;
}

/** Grupo de filas (por custodio / ubicación / categoría) con subtotal. */
export interface GrupoInventario {
  titulo: string;
  filas: FilaInventario[];
  total: number;
}

/** Datos del acta de entrega-recepción (INV-R10). */
export interface ActaEntregaRecepcion {
  custodioEntrante: string | null;
  identificacionEntrante: string | null;
  custodioSaliente: string | null;
  identificacionSaliente: string | null;
  filas: FilaInventario[];
  total: number;
}

@Injectable()
export class ReporteInventarioService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Encabezado institucional parametrizado (Cementerio / GADInformacion). No
  // hardcodea "Checa": el sistema se despliega para otros GAD.
  // ---------------------------------------------------------------------------
  async getInstitucion(): Promise<InstitucionPdf> {
    return getInstitucionPdf(this.prisma, 'Sistema de Gestión de Inventario de Bienes');
  }

  // ---------------------------------------------------------------------------
  // Inventario agrupado por custodio (INV-R10).
  // ---------------------------------------------------------------------------
  async inventarioPorCustodio(
    filtro: ReporteInventarioFiltroDto,
  ): Promise<GrupoInventario[]> {
    const filas = await this.cargarFilas(filtro);
    return this.agrupar(
      filas,
      (f) => f.custodioId ?? -1,
      (f) => f.custodioNombre,
    );
  }

  // ---------------------------------------------------------------------------
  // Inventario agrupado por ubicación (INV-R10).
  // ---------------------------------------------------------------------------
  async inventarioPorUbicacion(
    filtro: ReporteInventarioFiltroDto,
  ): Promise<GrupoInventario[]> {
    const filas = await this.cargarFilas(filtro);
    return this.agrupar(
      filas,
      (f) => f.ubicacion ?? '',
      (f) => f.ubicacion ?? 'Sin ubicación',
    );
  }

  // ---------------------------------------------------------------------------
  // Inventario agrupado por categoría (INV-R10).
  // ---------------------------------------------------------------------------
  async inventarioPorCategoria(
    filtro: ReporteInventarioFiltroDto,
  ): Promise<GrupoInventario[]> {
    const filas = await this.cargarFilas(filtro);
    return this.agrupar(
      filas,
      (f) => f.categoriaId ?? -1,
      (f) => f.categoriaNombre,
    );
  }

  // ---------------------------------------------------------------------------
  // Reporte de depreciación a fecha de corte (INV-R7 / INV-R10). Calcula valor
  // en libros y depreciación acumulada con el motor puro (CGE 406-03).
  // ---------------------------------------------------------------------------
  async reporteDepreciacion(
    filtro: ReporteDepreciacionFiltroDto,
  ): Promise<{ fechaCorte: Date; filas: FilaDepreciacion[]; total: number }> {
    const fechaCorte = this.resolverFechaCorte(filtro.fechaCorte);
    const bienes = await this.prisma.bien.findMany({
      where: this.buildWhere(filtro),
      include: {
        ...REPORTE_INCLUDE,
        categoria: {
          select: {
            id: true,
            nombre: true,
            vidaUtilAnios: true,
            valorResidualPct: true,
          },
        },
      },
      orderBy: { codigo: 'asc' },
    });

    const filas: FilaDepreciacion[] = bienes.map((bien) => {
      const calc = calcularDepreciacion(
        this.toBienDepreciable(bien),
        this.toCategoria(bien.categoria),
        fechaCorte,
      );
      return {
        ...this.toFila(bien as unknown as BienReporte),
        valorResidual: calc.valorResidual,
        vidaUtilMeses: calc.vidaUtilMeses,
        depreciacionMensual: calc.depreciacionMensual,
        mesesTranscurridos: calc.mesesTranscurridos,
        depreciacionAcumulada: calc.depreciacionAcumulada,
        valorEnLibros: calc.valorEnLibros,
      };
    });

    const total = filas.reduce((s, f) => s + f.valorEnLibros, 0);
    return { fechaCorte, filas, total: redondear2(total) };
  }

  // ---------------------------------------------------------------------------
  // Acta de entrega-recepción de bienes (INV-R10).
  // ---------------------------------------------------------------------------
  async actaEntregaRecepcion(
    filtro: ActaEntregaRecepcionFiltroDto,
  ): Promise<ActaEntregaRecepcion> {
    const filas = await this.cargarFilas({
      categoriaId: filtro.categoriaId,
      custodioId: filtro.custodioId,
      ubicacion: filtro.ubicacion,
      incluirBajas: false,
    });

    const [entrante, saliente] = await this.prisma.$transaction([
      filtro.custodioId
        ? this.prisma.custodio.findUnique({
            where: { id: filtro.custodioId },
            select: { nombre: true, identificacion: true },
          })
        : this.prisma.custodio.findFirst({ where: { id: -1 } }),
      filtro.custodioSalienteId
        ? this.prisma.custodio.findUnique({
            where: { id: filtro.custodioSalienteId },
            select: { nombre: true, identificacion: true },
          })
        : this.prisma.custodio.findFirst({ where: { id: -1 } }),
    ]);

    return {
      custodioEntrante: entrante?.nombre ?? null,
      identificacionEntrante: entrante?.identificacion ?? null,
      custodioSaliente: saliente?.nombre ?? null,
      identificacionSaliente: saliente?.identificacion ?? null,
      filas,
      total: redondear2(filas.reduce((s, f) => s + f.valorAdquisicion, 0)),
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private async cargarFilas(
    filtro: ReporteInventarioFiltroDto,
  ): Promise<FilaInventario[]> {
    const bienes = await this.prisma.bien.findMany({
      where: this.buildWhere(filtro),
      include: REPORTE_INCLUDE,
      orderBy: { codigo: 'asc' },
    });
    return bienes.map((b) => this.toFila(b));
  }

  private buildWhere(
    filtro: ReporteInventarioFiltroDto,
  ): Prisma.BienWhereInput {
    return {
      estado: true,
      ...(filtro.incluirBajas ? {} : { dadoDeBaja: false }),
      ...(filtro.categoriaId !== undefined && {
        categoriaId: filtro.categoriaId,
      }),
      ...(filtro.custodioId !== undefined && {
        custodioId: filtro.custodioId,
      }),
      ...(filtro.ubicacion
        ? { ubicacion: { contains: filtro.ubicacion, mode: 'insensitive' } }
        : {}),
    };
  }

  private toFila(bien: BienReporte): FilaInventario {
    return {
      id: bien.id,
      codigo: bien.codigo,
      descripcion: bien.descripcion,
      marca: bien.marca,
      modelo: bien.modelo,
      serie: bien.serie,
      fechaAdquisicion: bien.fechaAdquisicion,
      valorAdquisicion: Number(bien.valorAdquisicion),
      estadoConservacion: bien.estadoConservacion,
      ubicacion: bien.ubicacion,
      dadoDeBaja: bien.dadoDeBaja,
      categoriaId: bien.categoria?.id ?? null,
      categoriaNombre: bien.categoria?.nombre ?? 'Sin categoría',
      custodioId: bien.custodio?.id ?? null,
      custodioNombre: bien.custodio?.nombre ?? 'Sin custodio',
    };
  }

  private agrupar(
    filas: FilaInventario[],
    clave: (f: FilaInventario) => number | string,
    titulo: (f: FilaInventario) => string,
  ): GrupoInventario[] {
    const mapa = new Map<number | string, GrupoInventario>();
    for (const fila of filas) {
      const k = clave(fila);
      let grupo = mapa.get(k);
      if (!grupo) {
        grupo = { titulo: titulo(fila), filas: [], total: 0 };
        mapa.set(k, grupo);
      }
      grupo.filas.push(fila);
      grupo.total = redondear2(grupo.total + fila.valorAdquisicion);
    }
    return [...mapa.values()].sort((a, b) =>
      a.titulo.localeCompare(b.titulo, 'es'),
    );
  }

  private resolverFechaCorte(valor?: string): Date {
    if (!valor) return new Date();
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  private toBienDepreciable(bien: {
    valorAdquisicion: Prisma.Decimal;
    fechaAdquisicion: Date;
    valorResidual: Prisma.Decimal | null;
    vidaUtilMesesOverride: number | null;
  }): BienDepreciable {
    return {
      valorAdquisicion: Number(bien.valorAdquisicion),
      fechaAdquisicion: bien.fechaAdquisicion,
      valorResidual:
        bien.valorResidual !== null ? Number(bien.valorResidual) : null,
      vidaUtilMesesOverride: bien.vidaUtilMesesOverride,
    };
  }

  private toCategoria(categoria: {
    vidaUtilAnios: number;
    valorResidualPct: Prisma.Decimal;
  }): CategoriaDepreciacion {
    return {
      vidaUtilAnios: categoria.vidaUtilAnios,
      valorResidualPct: Number(categoria.valorResidualPct),
    };
  }
}

function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
