import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cementerio } from './cementerio.entity';

@Injectable()
export class CementerioRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.cementerio.findUnique({
      where: { id },
      include: { bloques: { where: { estado: true }, include: { bovedas: true } } },
    });
  }

  create(data: Cementerio) {
    return this.cementerio.create({ data });
  }

  update(id: number, data: Partial<Cementerio>) {
    return this.cementerio.update({ where: { id }, data });
  }

  findActive() {
    return this.cementerio.findMany({
      where: { estado: true },
      include: { bloques: { where: { estado: true } } },
    });
  }

  private get cementerio() {
    return this.prisma.cementerio;
  }
}