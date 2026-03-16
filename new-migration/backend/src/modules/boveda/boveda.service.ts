import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';

@Injectable()
export class BovedaService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const where: any = {
      estado: true,
      ...(search
        ? {
            OR: [
              { numero: { contains: search, mode: 'insensitive' } },
              { tipo: { contains: search, mode: 'insensitive' } },
              { bloque: { is: { nombre: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.boveda.findMany({
        where,
        include: { bloque: { include: { cementerio: true } }, piso: true, propietario: { include: { persona: true } } },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.boveda.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByBloque(bloqueId: number) {
    return this.prisma.boveda.findMany({
      where: { bloqueId, estado: true },
      include: { piso: true },
    });
  }

  async findOne(id: number) {
    const boveda = await this.prisma.boveda.findUnique({
      where: { id },
      include: { 
        bloque: { include: { cementerio: true } }, 
        piso: true, 
        propietario: { include: { persona: true } },
        difuntos: { where: { estado: true } },
        contratos: { where: { estado: true }, include: { difunto: true, responsables: { include: { responsable: { include: { persona: true } } } } } }
      },
    });
    if (!boveda) throw new NotFoundException('Bóveda no encontrada');
    return boveda;
  }

  async create(data: any) {
    return this.prisma.boveda.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.boveda.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.boveda.update({ where: { id }, data: { estado: false } });
  }
}
