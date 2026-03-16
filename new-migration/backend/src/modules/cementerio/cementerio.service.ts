import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CementerioService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cementerio.findMany({
      where: { estado: true },
      include: { bloques: { where: { estado: true } } },
    });
  }

  async findOne(id: number) {
    const cementerio = await this.prisma.cementerio.findUnique({
      where: { id },
      include: { bloques: { where: { estado: true }, include: { bovedas: true } } },
    });
    if (!cementerio) throw new NotFoundException('Cementerio no encontrado');
    return cementerio;
  }

  async create(data: any) {
    return this.prisma.cementerio.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.cementerio.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.cementerio.update({ where: { id }, data: { estado: false } });
  }
}
