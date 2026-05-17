import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateNotificacionDto,
  ListNotificacionesDto,
} from './dto/request/notificacion.dto';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';

/**
 * Servicio de notificaciones.
 *
 * Nota de auditoría: el modelo `Notificacion` no tiene campos de auditoría
 * (`usuarioCreadorId`, `usuarioActualizadorId`, `estado`, `fechaEliminacion`).
 * Es una tabla de eventos inmutables (log) — las notificaciones se crean por
 * sistema (job diario) o admin y se marcan como leídas, no se editan ni se
 * eliminan. La trazabilidad de quién disparó el evento está implícita en el
 * tipo de notificación y la entidad referenciada. Excepción documentada en
 * `MIGRATION_PLAN.md` §3.
 */
@Injectable()
export class NotificacionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista notificaciones del usuario autenticado. El `usuarioId` se deriva
   * del token, no del query — no se puede listar notificaciones ajenas.
   */
  async findAll(query: ListNotificacionesDto, userId: string) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Prisma.NotificacionWhereInput = {
      usuarioId: userId,
    };
    if (query.leida !== undefined) {
      where.leida = query.leida;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notificacion.findMany({
        where,
        include: {
          usuario: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
        },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notificacion.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  /**
   * Detalle de notificación con validación de pertenencia.
   */
  async findOne(id: number, userId: string) {
    const notif = await this.prisma.notificacion.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });
    if (!notif) {
      throw new NotFoundException('Notificación no encontrada');
    }
    if (notif.usuarioId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta notificación');
    }
    return notif;
  }

  async create(dto: CreateNotificacionDto) {
    return this.prisma.notificacion.create({
      data: {
        tipo: dto.tipo,
        titulo: dto.titulo,
        mensaje: dto.mensaje,
        usuarioId: dto.usuarioId,
        entidadTipo: dto.entidadTipo ?? null,
        entidadId: dto.entidadId ?? null,
      },
    });
  }

  /**
   * Marca una notificación como leída con validación de pertenencia.
   */
  async markRead(id: number, userId: string) {
    const notif = await this.prisma.notificacion.findUnique({
      where: { id },
    });
    if (!notif) {
      throw new NotFoundException('Notificación no encontrada');
    }
    if (notif.usuarioId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar esta notificación');
    }
    return this.prisma.notificacion.update({
      where: { id },
      data: {
        leida: true,
        fechaLectura: new Date(),
      },
    });
  }
}
