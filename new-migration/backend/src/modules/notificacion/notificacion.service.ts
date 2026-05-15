import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateNotificacionDto,
  ListNotificacionesDto,
} from './dto/notificacion.dto';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';

@Injectable()
export class NotificacionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ListNotificacionesDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Prisma.NotificacionWhereInput = {};
    if (query.usuarioId) {
      where.usuarioId = query.usuarioId;
    }
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

  async findOne(id: number) {
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

  async markRead(id: number) {
    const notif = await this.prisma.notificacion.findUnique({
      where: { id },
    });
    if (!notif) {
      throw new NotFoundException('Notificación no encontrada');
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
