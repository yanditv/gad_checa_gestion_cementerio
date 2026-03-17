import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type BlockMutation = {
  name?: string;
  description?: string;
  isActive?: boolean;
  cemeteryId?: string;
};

@Injectable()
export class BlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.block.findUnique({
      where: { id },
      include: { cemetery: true, floors: true, vaults: true },
    });
  }

  create(data: BlockMutation) {
    return this.block.create({
      data: this.mapCreate(data),
    });
  }

  update(id: string, data: BlockMutation) {
    return this.block.update({
      where: { id },
      data: this.mapUpdate(data),
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

  private mapCreate(data: BlockMutation): Prisma.BlockUncheckedCreateInput {
    return {
      name: data.name ?? '',
      description: data.description ?? null,
      isActive: data.isActive ?? true,
      cemeteryId: data.cemeteryId ?? '',
    };
  }

  private mapUpdate(data: BlockMutation): Prisma.BlockUncheckedUpdateInput {
    const updateData: Prisma.BlockUncheckedUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.cemeteryId !== undefined) {
      updateData.cemeteryId = data.cemeteryId;
    }

    return updateData;
  }
}