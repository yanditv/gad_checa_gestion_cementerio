import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Boveda } from './boveda.entity';

@Injectable()
export class BovedaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.vault.findUnique({
      where: { id },
      include: {
        block: { include: { cemetery: true } },
        floor: true,
        owner: { include: { person: true } },
        deceased: { where: { isActive: true } },
        contracts: {
          where: { isActive: true },
          include: {
            deceased: true,
            assignments: { include: { responsibleParty: { include: { person: true } } } },
          },
        },
      },
    });
  }

  create(data: Boveda) {
    return this.vault.create({ data });
  }

  update(id: string, data: Partial<Boveda>) {
    return this.vault.update({ where: { id }, data });
  }

  async listPaginated(search: string | undefined, skip: number, take: number) {
    const where = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: 'insensitive' } },
              { type: { contains: search, mode: 'insensitive' } },
              { block: { is: { name: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.vault.findMany({
        where,
        include: { block: { include: { cemetery: true } }, floor: true, owner: { include: { person: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.vault.count({ where }),
    ]);

    return { items, total };
  }

  listByBlock(blockId: string) {
    return this.vault.findMany({
      where: { blockId, isActive: true },
      include: { floor: true },
    });
  }

  private get vault() {
    return this.prisma.vault;
  }
}