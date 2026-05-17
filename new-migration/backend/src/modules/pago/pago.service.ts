import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CobrarDto } from './dto/request/cobrar.dto';
import { CreatePagoDto } from './dto/request/create-pago.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';

type Tx = Prisma.TransactionClient;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class PagoService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const where = { estado: true };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.pago.findMany({
        where,
        include: {
          banco: true,
          descuento: true,
          cuotas: {
            include: {
              cuota: {
                include: {
                  contrato: {
                    include: { difunto: true, boveda: { include: { bloque: true } } },
                  },
                },
              },
            },
          },
          usuarioCreador: { select: { id: true, nombre: true, apellido: true } },
        },
        orderBy: { fechaPago: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pago.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number) {
    const pago = await this.prisma.pago.findUnique({
      where: { id },
      include: {
        banco: true,
        descuento: true,
        cuotas: {
          include: {
            cuota: {
              include: {
                contrato: {
                  include: {
                    difunto: true,
                    boveda: {
                      include: { bloque: { include: { cementerio: true } } },
                    },
                    responsables: {
                      include: { responsable: { include: { persona: true } } },
                    },
                  },
                },
              },
            },
          },
        },
        usuarioCreador: { select: { id: true, nombre: true, apellido: true } },
        usuarioEliminador: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');
    return pago;
  }

  // ---------------------------------------------------------------------------
  // Cobro multi-cuota
  // ---------------------------------------------------------------------------

  /**
   * Carga la pantalla de cobro: cuotas pendientes del contrato con mora
   * calculada por cuota usando `Cementerio.tasaMoraDiaria` × días vencidos.
   */
  async getCobroPreview(contratoId: number) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      include: {
        boveda: { include: { bloque: { include: { cementerio: true } } } },
        difunto: true,
        responsables: {
          include: { responsable: { include: { persona: true } } },
        },
        cuotas: {
          where: { estado: true, pagada: false },
          orderBy: { numero: 'asc' },
        },
      },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');

    const tasa = Number(contrato.boveda.bloque.cementerio.tasaMoraDiaria ?? 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cuotas = contrato.cuotas.map((c) => {
      const venc = new Date(c.fechaVencimiento);
      venc.setHours(0, 0, 0, 0);
      const diasVencido =
        venc < today
          ? Math.floor((today.getTime() - venc.getTime()) / (24 * 3600 * 1000))
          : 0;
      const baseMonto = Number(c.monto);
      const mora = diasVencido > 0 ? round2(baseMonto * tasa * diasVencido) : 0;
      return {
        id: c.id,
        numero: c.numero,
        fechaVencimiento: c.fechaVencimiento,
        monto: baseMonto,
        diasVencido,
        mora,
        totalConMora: round2(baseMonto + mora),
      };
    });

    const [descuentos, bancos] = await Promise.all([
      this.prisma.descuento.findMany({ where: { estado: true } }),
      this.prisma.banco.findMany({ where: { estado: true } }),
    ]);

    return {
      contrato: {
        id: contrato.id,
        numeroSecuencial: contrato.numeroSecuencial,
        boveda: contrato.boveda,
        difunto: contrato.difunto,
        responsables: contrato.responsables,
        tasaMoraDiaria: tasa,
      },
      cuotas,
      descuentos,
      bancos,
      tiposPago: ['Efectivo', 'Transferencia', 'Banco', 'Cheque', 'Tarjeta'],
    };
  }

  async cobrar(dto: CobrarDto, userId?: string) {
    // Validar contrato existe y activo
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: dto.contratoId },
      include: {
        boveda: { include: { bloque: { include: { cementerio: true } } } },
      },
    });
    if (!contrato || !contrato.estado) {
      throw new NotFoundException(
        'El contrato no existe o está inactivo',
      );
    }

    // Cargar cuotas y validar pertenencia / pendientes
    const cuotas = await this.prisma.cuota.findMany({
      where: { id: { in: dto.cuotasIds } },
    });
    if (cuotas.length !== dto.cuotasIds.length) {
      throw new BadRequestException(
        'Una o más cuotas no existen',
      );
    }
    for (const c of cuotas) {
      if (c.contratoId !== contrato.id) {
        throw new BadRequestException(
          `La cuota ${c.numero} no pertenece al contrato`,
        );
      }
      if (c.pagada) {
        throw new ConflictException(
          `La cuota ${c.numero} ya está pagada`,
        );
      }
      if (!c.estado) {
        throw new BadRequestException(
          `La cuota ${c.numero} está inactiva`,
        );
      }
    }

    // Calcular mora server-side
    const tasa = Number(contrato.boveda.bloque.cementerio.tasaMoraDiaria ?? 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let montoSubtotal = 0;
    for (const c of cuotas) {
      const venc = new Date(c.fechaVencimiento);
      venc.setHours(0, 0, 0, 0);
      const diasVencido =
        venc < today
          ? Math.floor((today.getTime() - venc.getTime()) / (24 * 3600 * 1000))
          : 0;
      const baseMonto = Number(c.monto);
      const mora = diasVencido > 0 ? baseMonto * tasa * diasVencido : 0;
      montoSubtotal += baseMonto + mora;
    }
    montoSubtotal = round2(montoSubtotal);

    // Aplicar descuento
    let montoDescuento = 0;
    if (dto.descuentoId) {
      const descuento = await this.prisma.descuento.findUnique({
        where: { id: dto.descuentoId },
      });
      if (!descuento || !descuento.estado) {
        throw new BadRequestException(
          'El descuento seleccionado no existe o está inactivo',
        );
      }
      montoDescuento = round2(
        montoSubtotal * (Number(descuento.porcentaje) / 100),
      );
    }
    const montoTotal = round2(montoSubtotal - montoDescuento);

    // Validar banco si aplica
    if (dto.bancoId) {
      const banco = await this.prisma.banco.findUnique({
        where: { id: dto.bancoId },
      });
      if (!banco || !banco.estado) {
        throw new BadRequestException(
          'El banco seleccionado no existe o está inactivo',
        );
      }
    }

    const fechaPago = dto.fechaPago ? new Date(dto.fechaPago) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const numeroRecibo = await this.generateNumeroReciboAtomic(tx);

      const pago = await tx.pago.create({
        data: {
          numeroRecibo,
          monto: new Prisma.Decimal(montoTotal),
          montoSubtotal: new Prisma.Decimal(montoSubtotal),
          montoDescuento: new Prisma.Decimal(montoDescuento),
          fechaPago,
          metodoPago: dto.metodoPago,
          referencia: dto.referencia || null,
          observacion: dto.observacion || null,
          bancoId: dto.bancoId ?? null,
          descuentoId: dto.descuentoId ?? null,
          estado: true,
          usuarioCreadorId: userId ?? null,
          cuotas: {
            create: dto.cuotasIds.map((id) => ({ cuotaId: id })),
          },
        },
        include: { cuotas: true },
      });

      // Marcar cuotas como pagadas
      await tx.cuota.updateMany({
        where: { id: { in: dto.cuotasIds } },
        data: { pagada: true, fechaPago },
      });

      return tx.pago.findUnique({
        where: { id: pago.id },
        include: {
          banco: true,
          descuento: true,
          cuotas: {
            include: {
              cuota: {
                include: { contrato: { include: { difunto: true } } },
              },
            },
          },
        },
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Anulación (solo Administrador)
  // ---------------------------------------------------------------------------

  async anular(id: number, userId?: string, roles: string[] = []) {
    if (
      !roles.includes('Administrador') &&
      !roles.includes('Admin')
    ) {
      throw new ForbiddenException(
        'Solo un administrador puede anular pagos',
      );
    }

    const pago = await this.prisma.pago.findUnique({
      where: { id },
      include: { cuotas: true },
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');
    if (!pago.estado) {
      throw new ConflictException('El pago ya está anulado');
    }

    const cuotasIds = pago.cuotas.map((c) => c.cuotaId);

    return this.prisma.$transaction(async (tx) => {
      await tx.cuotaPago.deleteMany({ where: { pagoId: pago.id } });
      await tx.cuota.updateMany({
        where: { id: { in: cuotasIds } },
        data: { pagada: false, fechaPago: null },
      });
      return tx.pago.update({
        where: { id: pago.id },
        data: {
          estado: false,
          usuarioEliminadorId: userId ?? null,
          fechaEliminacion: new Date(),
        },
      });
    });
  }

  // ---------------------------------------------------------------------------
  // CRUD legacy (compat)
  // ---------------------------------------------------------------------------

  async create(dto: CreatePagoDto, userId?: string) {
    // Mantenido por compat: usar `cobrar()` para nuevos cobros.
    const { cuotasIds, ...pagoData } = dto;
    return this.prisma.$transaction(async (tx) => {
      const numeroRecibo = await this.generateNumeroReciboAtomic(tx);
      const pago = await tx.pago.create({
        data: {
          ...pagoData,
          numeroRecibo,
          usuarioCreadorId: userId ?? null,
          cuotas: cuotasIds?.length
            ? {
                create: cuotasIds.map((cuotaId: number) => ({ cuotaId })),
              }
            : undefined,
        } as Prisma.PagoUncheckedCreateInput,
        include: { cuotas: { include: { cuota: true } } },
      });
      if (cuotasIds) {
        await tx.cuota.updateMany({
          where: { id: { in: cuotasIds } },
          data: { pagada: true, fechaPago: new Date() },
        });
      }
      return pago;
    });
  }

  async update(id: number, dto: CreatePagoDto) {
    await this.findOne(id);
    return this.prisma.pago.update({ where: { id }, data: dto as Prisma.PagoUncheckedUpdateInput });
  }

  async remove(id: number, userId?: string, roles: string[] = []) {
    return this.anular(id, userId, roles);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Hash determinista a int32 para advisory lock. */
  private advisoryLockKey(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return hash;
  }

  /** Espejo del helper en ContratoService — numeración de recibo atómica. */
  private async generateNumeroReciboAtomic(tx: Tx): Promise<string> {
    const year = new Date().getFullYear();
    const pattern = `REC-${year}-`;
    const lockKey = this.advisoryLockKey(`recibo:${year}`);
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockKey})`);

    const last = await tx.pago.findFirst({
      where: { numeroRecibo: { startsWith: pattern } },
      orderBy: { numeroRecibo: 'desc' },
      select: { numeroRecibo: true },
    });
    const next = last
      ? Number(last.numeroRecibo.split('-').pop() || '0') + 1
      : 1;
    return `${pattern}${String(next).padStart(5, '0')}`;
  }
}
