import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PagoService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.pago.findMany({
      where: { estado: true },
      include: { banco: true, cuotas: { include: { cuota: { include: { contrato: true } } } } },
      orderBy: { fechaPago: 'desc' }
    });
  }

  async findOne(id: number) {
    const pago = await this.prisma.pago.findUnique({
      where: { id },
      include: { 
        banco: true, 
        cuotas: { include: { cuota: { include: { contrato: { include: { difunto: true, boveda: true } } } } } }
      },
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');
    return pago;
  }

  async create(data: any) {
    const { cuotasIds, ...pagoData } = data;

    const ultimoPago = await this.prisma.pago.findFirst({ orderBy: { id: 'desc' } });
    const nuevoNumero = ultimoPago ? ultimoPago.id + 1 : 1;
    const numeroRecibo = `REC-${new Date().getFullYear()}-${nuevoNumero.toString().padStart(5, '0')}`;

    const pago = await this.prisma.pago.create({
      data: {
        ...pagoData,
        numeroRecibo,
        cuotas: cuotasIds ? {
          create: cuotasIds.map((cuotaId: number) => ({ cuotaId }))
        } : undefined
      },
      include: { cuotas: { include: { cuota: true } } }
    });

    if (cuotasIds) {
      await this.prisma.cuota.updateMany({
        where: { id: { in: cuotasIds } },
        data: { pagada: true, fechaPago: new Date() }
      });
    }

    return pago;
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.pago.update({ where: { id }, data });
  }

  async remove(id: number) {
    const pago = await this.findOne(id);
    await this.prisma.cuotaPago.deleteMany({ where: { pagoId: id } });
    await this.prisma.cuota.updateMany({
      where: { id: { in: pago.cuotas.map(c => c.cuotaId) } },
      data: { pagada: false, fechaPago: null }
    });
    return this.prisma.pago.update({ where: { id }, data: { estado: false } });
  }
}
