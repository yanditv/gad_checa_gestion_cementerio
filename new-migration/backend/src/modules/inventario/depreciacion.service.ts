import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BienDepreciable,
  CategoriaDepreciacion,
  calcularDepreciacion,
  fechaCortePeriodo,
} from './depreciacion.calc';
import {
  DepreciacionBienResponseDto,
  RecalcularDepreciacionResponseDto,
} from './dto/depreciacion.dto';

type BienConCategoria = Prisma.BienGetPayload<{
  include: {
    categoria: {
      select: { vidaUtilAnios: true; valorResidualPct: true };
    };
  };
}>;

const CATEGORIA_SELECT = {
  vidaUtilAnios: true,
  valorResidualPct: true,
} as const;

@Injectable()
export class DepreciacionService {
  private readonly logger = new Logger(DepreciacionService.name);

  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Recálculo de un periodo (INV-R7): recorre los bienes activos no dados de
  // baja, hace upsert de DepreciacionBien por (bienId, anio, mes) y registra un
  // MovimientoBien tipo 'depreciacion'. Cada bien se procesa en su propia
  // transacción (upsert depreciación + movimiento = 2 tablas). Solo Administrador.
  // ---------------------------------------------------------------------------
  async recalcularPeriodo(
    anio: number,
    mes: number,
    userId?: string,
  ): Promise<RecalcularDepreciacionResponseDto> {
    const fechaCorte = fechaCortePeriodo(anio, mes);

    const bienes = await this.prisma.bien.findMany({
      where: { estado: true, dadoDeBaja: false },
      include: { categoria: { select: CATEGORIA_SELECT } },
    });

    let bienesProcesados = 0;
    let totalDepreciadoPeriodo = new Prisma.Decimal(0);

    for (const bien of bienes) {
      // Bienes adquiridos después del corte del periodo aún no deprecian.
      if (bien.fechaAdquisicion > fechaCorte) {
        continue;
      }

      const { valorDepreciado, depreciacionAcumulada, valorEnLibros } =
        this.computarPeriodo(bien, anio, mes, fechaCorte);

      await this.prisma.$transaction(async (tx) => {
        await tx.depreciacionBien.upsert({
          where: { bienId_anio_mes: { bienId: bien.id, anio, mes } },
          create: {
            bienId: bien.id,
            anio,
            mes,
            valorDepreciado,
            depreciacionAcumulada,
            valorEnLibros,
          },
          update: {
            valorDepreciado,
            depreciacionAcumulada,
            valorEnLibros,
            fechaCalculo: new Date(),
          },
        });

        await tx.movimientoBien.create({
          data: {
            bienId: bien.id,
            tipo: 'depreciacion',
            detalle: `Depreciación del periodo ${String(mes).padStart(2, '0')}/${anio}`,
            usuarioCreadorId: userId ?? null,
          },
        });
      });

      bienesProcesados += 1;
      totalDepreciadoPeriodo = totalDepreciadoPeriodo.add(valorDepreciado);
    }

    this.logger.log(
      `Depreciación recalculada para ${String(mes).padStart(2, '0')}/${anio}: ` +
        `${bienesProcesados} bienes procesados`,
    );

    return {
      anio,
      mes,
      bienesProcesados,
      totalDepreciadoPeriodo: Number(totalDepreciadoPeriodo),
    };
  }

  // ---------------------------------------------------------------------------
  // Tabla de depreciación de un bien (registros persistidos por periodo).
  // ---------------------------------------------------------------------------
  async depreciacionDeBien(
    bienId: number,
  ): Promise<DepreciacionBienResponseDto> {
    const bien = await this.prisma.bien.findFirst({
      where: { id: bienId, estado: true },
      include: { categoria: { select: CATEGORIA_SELECT } },
    });
    if (!bien) {
      throw new NotFoundException('Bien no encontrado');
    }

    const resultado = calcularDepreciacion(
      this.toBienDepreciable(bien),
      this.toCategoria(bien.categoria),
      new Date(),
    );

    const periodos = await this.prisma.depreciacionBien.findMany({
      where: { bienId },
      orderBy: [{ anio: 'asc' }, { mes: 'asc' }],
    });

    return {
      bienId: bien.id,
      codigo: bien.codigo,
      valorAdquisicion: Number(bien.valorAdquisicion),
      valorResidual: resultado.valorResidual,
      vidaUtilMeses: resultado.vidaUtilMeses,
      depreciacionMensual: resultado.depreciacionMensual,
      periodos: periodos.map((p) => ({
        anio: p.anio,
        mes: p.mes,
        valorDepreciado: Number(p.valorDepreciado),
        depreciacionAcumulada: Number(p.depreciacionAcumulada),
        valorEnLibros: Number(p.valorEnLibros),
        fechaCalculo: p.fechaCalculo.toISOString(),
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Calcula los valores del periodo (anio, mes). El `valorDepreciado` del mes es
   * la diferencia entre la acumulada al corte del periodo y la acumulada al
   * corte del periodo anterior.
   */
  private computarPeriodo(
    bien: BienConCategoria,
    anio: number,
    mes: number,
    fechaCorte: Date,
  ): {
    valorDepreciado: Prisma.Decimal;
    depreciacionAcumulada: Prisma.Decimal;
    valorEnLibros: Prisma.Decimal;
  } {
    const bienCalc = this.toBienDepreciable(bien);
    const categoria = this.toCategoria(bien.categoria);

    const actual = calcularDepreciacion(bienCalc, categoria, fechaCorte);

    const mesAnterior = mes === 1 ? 12 : mes - 1;
    const anioAnterior = mes === 1 ? anio - 1 : anio;
    const corteAnterior = fechaCortePeriodo(anioAnterior, mesAnterior);
    const anterior = calcularDepreciacion(bienCalc, categoria, corteAnterior);

    const valorDepreciado = Math.max(
      actual.depreciacionAcumulada - anterior.depreciacionAcumulada,
      0,
    );

    return {
      valorDepreciado: new Prisma.Decimal(valorDepreciado.toFixed(2)),
      depreciacionAcumulada: new Prisma.Decimal(
        actual.depreciacionAcumulada.toFixed(2),
      ),
      valorEnLibros: new Prisma.Decimal(actual.valorEnLibros.toFixed(2)),
    };
  }

  private toBienDepreciable(bien: BienConCategoria): BienDepreciable {
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
