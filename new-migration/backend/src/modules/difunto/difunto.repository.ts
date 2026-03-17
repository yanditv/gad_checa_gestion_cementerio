import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Difunto } from './difunto.entity';

@Injectable()
export class DifuntoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.difunto.findUnique({
      where: { id },
      include: {
        boveda: { include: { bloque: { include: { cementerio: true } }, piso: true } },
        contratos: { where: { estado: true } },
      },
    });
  }

  create(data: Difunto) {
    return this.difunto.create({ data });
  }

  update(id: number, data: Partial<Difunto>) {
    return this.difunto.update({ where: { id }, data });
  }

  async listPaginated(search: string | undefined, skip: number, take: number) {
    const where = {
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
      this.difunto.findMany({
        where,
        include: { boveda: { include: { bloque: { include: { cementerio: true } } } } },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take,
      }),
      this.difunto.count({ where }),
    ]);

    return { items, total };
  }

  listByVault(vaultId: number) {
    return this.difunto.findMany({
      where: { bovedaId: vaultId, estado: true },
    });
  }

  private get difunto() {
    return this.prisma.difunto;
  }
}