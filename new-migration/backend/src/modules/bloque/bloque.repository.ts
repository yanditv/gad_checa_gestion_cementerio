import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Bloque } from './bloque.entity';

@Injectable()
export class BloqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.block.findUnique({
      where: { id },
      include: { cemetery: true, floors: true, vaults: true },
    });
  }

  create(data: Bloque) {
    
    return this.block.create({ data });
  }

  update(id: string, data: Partial<Bloque>) {
    return this.block.update({ where: { id }, data });
  }

  async listPaginated(search: string | undefined, skip: number, take: number) {
    const where = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { cemetery: { is: { name: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.block.findMany({
        where,
        include: { cemetery: true, floors: true, vaults: { where: { isActive: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.block.count({ where }),
    ]);

    return { items, total };
  }

  listByCemetery(cemeteryId: string) {
    return this.block.findMany({
      where: { cemeteryId, isActive: true },
      include: { floors: true, vaults: { where: { isActive: true } } },
    });
  }

  private get block() {
    return this.prisma.block;
  }
}