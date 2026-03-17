import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cementerio } from './cementerio.entity';

@Injectable()
export class CementerioRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.cemetery.findUnique({
      where: { id },
      include: { blocks: { where: { isActive: true }, include: { vaults: true } } },
    });
  }

  create(data: Cementerio) {
    return this.cemetery.create({ data });
  }

  update(id: string, data: Partial<Cementerio>) {
    return this.cemetery.update({ where: { id }, data });
  }

  findActive() {
    return this.cemetery.findMany({
      where: { isActive: true },
      include: { blocks: { where: { isActive: true } } },
    });
  }

  private get cemetery() {
    return this.prisma.cemetery;
  }
}