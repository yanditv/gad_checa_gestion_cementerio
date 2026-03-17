import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Block } from './block.entity';

@Injectable()
export class BlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.block.findUnique({
      where: { id },
      include: { cemetery: true, floors: true, vaults: true },
    });
  }

  create(data: Block) {
    return this.block.create({ data });
  }

  update(id: string, data: Partial<Block>) {
    const updateData: Partial<Block> = {};

    updateData.name = data.name ?? updateData.name;
    updateData.description = data.description ?? updateData.description;
    updateData.isActive = data.isActive ?? updateData.isActive;
    updateData.cemeteryId = data.cemeteryId ?? updateData.cemeteryId;

    return this.block.update({
      where: { id },
      data: updateData,
    });
  }

  async listPaginated(search: string | undefined, skip: number, take: number) {
    const where: Prisma.BlockWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { cemetery: { is: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
      ];
    }

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