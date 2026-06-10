import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { CreateExhumacionDto, QueryExhumacionDto } from './dto/exhumacion.dto';

type Tx = Prisma.TransactionClient;

const INCLUDE_RELACIONES = {
  difunto: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      numeroIdentificacion: true,
    },
  },
  bovedaOrigen: { select: { id: true, numero: true, tipo: true } },
} as const;

@Injectable()
export class ExhumacionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra una exhumación / traslado en una sola transacción:
   *   1. Valida que el difunto exista, esté activo y no esté ya exhumado.
   *   2. Si el motivo es "traslado": valida la bóveda destino (activa, distinta
   *      de la origen y con capacidad disponible vs. difuntos activos no
   *      exhumados).
   *   3. Genera `numeroActa` (EXH-YYYY-NNNN) de forma atómica.
   *   4. Crea el registro `Exhumacion`.
   *   5. Marca `Difunto.exhumado=true` + `fechaExhumacion`. En un traslado,
   *      reasigna `bovedaId`, vuelve a poner `exhumado=false` y registra la
   *      nueva `fechaInhumacion` (el difunto sigue ocupando una plaza, ahora
   *      en la bóveda destino).
   */
  async registrar(dto: CreateExhumacionDto, userId?: string) {
    const esTraslado = dto.motivo === 'traslado';
    const fechaExhumacion = new Date(dto.fechaExhumacion);
    if (Number.isNaN(fechaExhumacion.getTime())) {
      throw new BadRequestException('La fecha de exhumación no es válida');
    }

    if (esTraslado && !dto.bovedaDestinoId) {
      throw new BadRequestException(
        'Debe indicar la bóveda destino para un traslado',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const difunto = await tx.difunto.findUnique({
        where: { id: dto.difuntoId },
        select: { id: true, estado: true, exhumado: true, bovedaId: true },
      });
      if (!difunto) {
        throw new NotFoundException('El difunto indicado no existe');
      }
      if (!difunto.estado) {
        throw new UnprocessableEntityException('El difunto está inactivo');
      }
      if (difunto.exhumado) {
        throw new ConflictException('El difunto ya fue exhumado');
      }

      const bovedaOrigenId = difunto.bovedaId;

      if (esTraslado) {
        if (dto.bovedaDestinoId === bovedaOrigenId) {
          throw new UnprocessableEntityException(
            'La bóveda destino no puede ser la misma de origen',
          );
        }
        await this.assertBovedaDestinoDisponible(tx, dto.bovedaDestinoId!);
      }

      const numeroActa = await this.generarNumeroActaAtomic(
        tx,
        fechaExhumacion.getFullYear(),
      );

      await tx.exhumacion.create({
        data: {
          numeroActa,
          difuntoId: difunto.id,
          bovedaOrigenId,
          fechaExhumacion,
          motivo: dto.motivo,
          destino: dto.destino,
          bovedaDestinoId: esTraslado ? dto.bovedaDestinoId : null,
          numeroAutorizacion: dto.numeroAutorizacion ?? null,
          entidadAutorizante: dto.entidadAutorizante ?? null,
          observaciones: dto.observaciones ?? null,
          estado: true,
          usuarioCreadorId: userId ?? null,
        },
      });

      if (esTraslado) {
        await tx.difunto.update({
          where: { id: difunto.id },
          data: {
            bovedaId: dto.bovedaDestinoId!,
            exhumado: false,
            fechaExhumacion: null,
            fechaInhumacion: fechaExhumacion,
            usuarioActualizadorId: userId ?? null,
          },
        });
      } else {
        await tx.difunto.update({
          where: { id: difunto.id },
          data: {
            exhumado: true,
            fechaExhumacion,
            usuarioActualizadorId: userId ?? null,
          },
        });
      }

      return tx.exhumacion.findFirst({
        where: { numeroActa },
        include: INCLUDE_RELACIONES,
      });
    });
  }

  async findAll(query: QueryExhumacionDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exhumacion.findMany({
        where,
        include: INCLUDE_RELACIONES,
        orderBy: { fechaExhumacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.exhumacion.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  /**
   * Historial completo (sin paginar) para el reporte exportable. Aplica los
   * mismos filtros que `findAll` (rango de fechas, motivo, bóveda).
   */
  async getHistorial(query: QueryExhumacionDto) {
    return this.prisma.exhumacion.findMany({
      where: this.buildWhere(query),
      include: {
        ...INCLUDE_RELACIONES,
        bovedaOrigen: {
          select: {
            id: true,
            numero: true,
            tipo: true,
            bloque: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaExhumacion: 'desc' },
    });
  }

  async findOne(id: number) {
    const exhumacion = await this.prisma.exhumacion.findUnique({
      where: { id },
      include: INCLUDE_RELACIONES,
    });
    if (!exhumacion) {
      throw new NotFoundException('Exhumación no encontrada');
    }
    return exhumacion;
  }

  async findByBoveda(bovedaId: number) {
    return this.prisma.exhumacion.findMany({
      where: { bovedaOrigenId: bovedaId, estado: true },
      include: INCLUDE_RELACIONES,
      orderBy: { fechaExhumacion: 'desc' },
    });
  }

  /**
   * Anula una exhumación (borrado lógico) y revierte su efecto sobre el
   * difunto, en una transacción:
   *   - Exhumación simple: el difunto vuelve a `exhumado=false` (recupera la
   *     plaza en su bóveda origen).
   *   - Traslado: el difunto regresa a la bóveda origen guardada.
   */
  async anular(id: number, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const exhumacion = await tx.exhumacion.findUnique({
        where: { id },
        select: {
          id: true,
          estado: true,
          motivo: true,
          difuntoId: true,
          bovedaOrigenId: true,
        },
      });
      if (!exhumacion) {
        throw new NotFoundException('Exhumación no encontrada');
      }
      if (!exhumacion.estado) {
        throw new ConflictException('La exhumación ya está anulada');
      }

      await tx.exhumacion.update({
        where: { id },
        data: {
          estado: false,
          usuarioEliminadorId: userId ?? null,
        },
      });

      if (exhumacion.motivo === 'traslado') {
        await tx.difunto.update({
          where: { id: exhumacion.difuntoId },
          data: {
            bovedaId: exhumacion.bovedaOrigenId,
            exhumado: false,
            fechaExhumacion: null,
            usuarioActualizadorId: userId ?? null,
          },
        });
      } else {
        await tx.difunto.update({
          where: { id: exhumacion.difuntoId },
          data: {
            exhumado: false,
            fechaExhumacion: null,
            usuarioActualizadorId: userId ?? null,
          },
        });
      }

      return tx.exhumacion.findUnique({
        where: { id },
        include: INCLUDE_RELACIONES,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private buildWhere(query: QueryExhumacionDto): Prisma.ExhumacionWhereInput {
    const where: Prisma.ExhumacionWhereInput = { estado: true };

    if (query.motivo) where.motivo = query.motivo;
    if (query.bovedaId) where.bovedaOrigenId = query.bovedaId;

    if (query.desde || query.hasta) {
      const rango: Prisma.DateTimeFilter = {};
      if (query.desde) {
        const d = new Date(query.desde);
        d.setHours(0, 0, 0, 0);
        rango.gte = d;
      }
      if (query.hasta) {
        const h = new Date(query.hasta);
        h.setHours(23, 59, 59, 999);
        rango.lte = h;
      }
      where.fechaExhumacion = rango;
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { numeroActa: { contains: search, mode: 'insensitive' } },
        { difunto: { is: { nombre: { contains: search, mode: 'insensitive' } } } },
        { difunto: { is: { apellido: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    return where;
  }

  /**
   * Valida que la bóveda destino exista, esté activa y tenga capacidad libre
   * (capacidad > difuntos activos no exhumados que ya la ocupan).
   */
  private async assertBovedaDestinoDisponible(tx: Tx, bovedaDestinoId: number) {
    const boveda = await tx.boveda.findUnique({
      where: { id: bovedaDestinoId },
      select: { id: true, estado: true, capacidad: true },
    });
    if (!boveda) {
      throw new BadRequestException('La bóveda destino no existe');
    }
    if (!boveda.estado) {
      throw new BadRequestException('La bóveda destino está inactiva');
    }

    const ocupacion = await tx.difunto.count({
      where: { bovedaId: bovedaDestinoId, estado: true, exhumado: false },
    });
    if (ocupacion >= boveda.capacidad) {
      throw new ConflictException(
        'La bóveda destino no tiene capacidad disponible',
      );
    }
  }

  /** Hash determinista a int32 para clave de advisory lock. */
  private advisoryLockKey(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return hash;
  }

  /**
   * Genera `EXH-YYYY-NNNN` serializando el cálculo con un advisory lock dentro
   * de la transacción (igual patrón que la numeración de contratos/recibos).
   */
  private async generarNumeroActaAtomic(tx: Tx, year: number): Promise<string> {
    const pattern = `EXH-${year}-`;
    const lockKey = this.advisoryLockKey(`exhumacion:${year}`);
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockKey})`);

    const last = await tx.exhumacion.findFirst({
      where: { numeroActa: { startsWith: pattern } },
      orderBy: { numeroActa: 'desc' },
      select: { numeroActa: true },
    });

    const next = last
      ? Number(last.numeroActa.split('-').pop() || '0') + 1
      : 1;
    return `${pattern}${String(next).padStart(4, '0')}`;
  }
}
