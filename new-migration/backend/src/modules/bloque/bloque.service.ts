import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';

@Injectable()
export class BloqueService {
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
              { descripcion: { contains: search, mode: 'insensitive' } },
              { cementerio: { is: { nombre: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.bloque.findMany({
        where,
        include: { cementerio: true, pisos: true, bovedas: { where: { estado: true } } },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bloque.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByCementerio(cementerioId: number) {
    return this.prisma.bloque.findMany({
      where: { cementerioId, estado: true },
      include: { pisos: true, bovedas: { where: { estado: true } } },
    });
  }

  async findOne(id: number) {
    const bloque = await this.prisma.bloque.findUnique({
      where: { id },
      include: { cementerio: true, pisos: true, bovedas: true },
    });
    if (!bloque) throw new NotFoundException('Bloque no encontrado');
    return bloque;
  }

  async create(data: any) {
    return this.prisma.bloque.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.bloque.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.bloque.update({ where: { id }, data: { estado: false } });
  }
}
