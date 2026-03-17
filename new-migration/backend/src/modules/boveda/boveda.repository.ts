import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Boveda } from './boveda.entity';

@Injectable()
export class BovedaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.boveda.findUnique({
      where: { id },
      include: {
        bloque: { include: { cementerio: true } },
        piso: true,
        propietario: { include: { persona: true } },
        difuntos: { where: { estado: true } },
        contratos: {
          where: { estado: true },
          include: {
            difunto: true,
            responsables: { include: { responsable: { include: { persona: true } } } },
          },
        },
      },
    });
  }

  create(data: Boveda) {
    return this.boveda.create({ data });
  }

  update(id: number, data: Partial<Boveda>) {
    return this.boveda.update({ where: { id }, data });
  }

  async listPaginated(search: string | undefined, skip: number, take: number) {
    const where = {
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
      this.boveda.findMany({
        where,
        include: { bloque: { include: { cementerio: true } }, piso: true, propietario: { include: { persona: true } } },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take,
      }),
      this.boveda.count({ where }),
    ]);

    return { items, total };
  }

  listByBlock(blockId: number) {
    return this.boveda.findMany({
      where: { bloqueId: blockId, estado: true },
      include: { piso: true },
    });
  }

  private get boveda() {
    return this.prisma.boveda;
  }
}