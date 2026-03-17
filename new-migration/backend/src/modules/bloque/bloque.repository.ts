import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Bloque } from './bloque.entity';

@Injectable()
export class BloqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.bloque.findUnique({
      where: { id },
      include: { cementerio: true, pisos: true, bovedas: true },
    });
  }

  create(data: Bloque) {
    
    return this.bloque.create({ data });
  }

  update(id: number, data: Partial<Bloque>) {
    return this.bloque.update({ where: { id }, data });
  }

  async listPaginated(search: string | undefined, skip: number, take: number) {
    const where = {
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
      this.bloque.findMany({
        where,
        include: { cementerio: true, pisos: true, bovedas: { where: { estado: true } } },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take,
      }),
      this.bloque.count({ where }),
    ]);

    return { items, total };
  }

  listByCemetery(cemeteryId: number) {
    return this.bloque.findMany({
      where: { cementerioId: cemeteryId, estado: true },
      include: { pisos: true, bovedas: { where: { estado: true } } },
    });
  }

  private get bloque() {
    return this.prisma.bloque;
  }
}