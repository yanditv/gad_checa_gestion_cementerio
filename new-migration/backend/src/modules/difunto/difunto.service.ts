import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';

@Injectable()
export class DifuntoService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const where: any = {
      estado: true,
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { apellido: { contains: search, mode: 'insensitive' } },
              { numeroIdentificacion: { contains: search, mode: 'insensitive' } },
              { boveda: { is: { numero: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.difunto.findMany({
        where,
        include: { boveda: { include: { bloque: { include: { cementerio: true } } } } },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.difunto.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByBoveda(bovedaId: number) {
    return this.prisma.difunto.findMany({
      where: { bovedaId, estado: true },
    });
  }

  async findOne(id: number) {
    const difunto = await this.prisma.difunto.findUnique({
      where: { id },
      include: { 
        boveda: { include: { bloque: { include: { cementerio: true } }, piso: true } },
        contratos: { where: { estado: true } }
      },
    });
    if (!difunto) throw new NotFoundException('Difunto no encontrado');
    return difunto;
  }

  async create(data: any) {
    return this.prisma.difunto.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.difunto.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.difunto.update({ where: { id }, data: { estado: false } });
  }
}
