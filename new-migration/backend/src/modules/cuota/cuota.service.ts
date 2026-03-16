import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CuotaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cuota.findMany({
      where: { estado: true },
      include: { contrato: { include: { difunto: true, boveda: true } }, pagos: { include: { pago: true } } },
      orderBy: { fechaVencimiento: 'asc' }
    });
  }

  async findByContrato(contratoId: number) {
    return this.prisma.cuota.findMany({
      where: { contratoId, estado: true },
      include: { pagos: { include: { pago: true } } },
      orderBy: { numero: 'asc' }
    });
  }

  async findOne(id: number) {
    const cuota = await this.prisma.cuota.findUnique({
      where: { id },
      include: { 
        contrato: { include: { difunto: true, boveda: true } }, 
        pagos: { include: { pago: true } } 
      },
    });
    if (!cuota) throw new NotFoundException('Cuota no encontrada');
    return cuota;
  }

  async create(data: any) {
    return this.prisma.cuota.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.cuota.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.cuota.update({ where: { id }, data: { estado: false } });
  }

  async pendientes() {
    return this.prisma.cuota.findMany({
      where: { pagada: false, fechaVencimiento: { lte: new Date() }, estado: true },
      include: { contrato: { include: { difunto: true, boveda: true } } },
      orderBy: { fechaVencimiento: 'asc' }
    });
  }
}
