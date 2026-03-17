import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Difunto } from './difunto.entity';

@Injectable()
export class DifuntoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.deceased.findUnique({
      where: { id },
      include: {
        vault: { include: { block: { include: { cemetery: true } }, floor: true } },
        contracts: { where: { isActive: true } },
      },
    });
  }

  create(data: Difunto) {
    return this.deceased.create({ data });
  }

  update(id: string, data: Partial<Difunto>) {
    return this.deceased.update({ where: { id }, data });
  }

  async listPaginated(search: string | undefined, skip: number, take: number) {
    const where = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { identificationNumber: { contains: search, mode: 'insensitive' } },
              { vault: { is: { number: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.deceased.findMany({
        where,
        include: { vault: { include: { block: { include: { cemetery: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.deceased.count({ where }),
    ]);

    return { items, total };
  }

  listByVault(vaultId: string) {
    return this.deceased.findMany({
      where: { vaultId, isActive: true },
    });
  }

  private get deceased() {
    return this.prisma.deceased;
  }
}