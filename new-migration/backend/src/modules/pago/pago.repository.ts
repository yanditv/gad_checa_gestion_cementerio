import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Pago } from './pago.entity';

@Injectable()
export class PagoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return this.payment.findMany({
      where: { estado: true },
      include: { banco: true, cuotas: { include: { cuota: { include: { contrato: true } } } } },
      orderBy: { fechaPago: 'desc' },
    });
  }

  findById(id: number) {
    return this.payment.findUnique({
      where: { id },
      include: {
        banco: true,
        cuotas: { include: { cuota: { include: { contrato: { include: { difunto: true, boveda: true } } } } } },
      },
    });
  }

  findLastPayment() {
    return this.payment.findFirst({
      orderBy: { id: 'desc' },
    });
  }

  create(data: Pago, cuotasIds?: number[]) {
    return this.payment.create({
      data: {
        ...data,
        cuotas: cuotasIds?.length
          ? {
              create: cuotasIds.map((cuotaId) => ({ cuotaId })),
            }
          : undefined,
      },
      include: { cuotas: { include: { cuota: true } } },
    });
  }

  update(id: number, data: Partial<Pago>) {
    return this.payment.update({ where: { id }, data });
  }

  updateInstallmentsAsPaid(cuotasIds: number[], fechaPago: Date) {
    return this.installment.updateMany({
      where: { id: { in: cuotasIds } },
      data: { pagada: true, fechaPago },
    });
  }

  deleteInstallmentPaymentsByPagoId(pagoId: number) {
    return this.installmentPayment.deleteMany({
      where: { pagoId },
    });
  }

  updateInstallmentsAsPending(cuotasIds: number[]) {
    return this.installment.updateMany({
      where: { id: { in: cuotasIds } },
      data: { pagada: false, fechaPago: null },
    });
  }

  private get payment() {
    return this.prisma.pago;
  }

  private get installment() {
    return this.prisma.cuota;
  }

  private get installmentPayment() {
    return this.prisma.cuotaPago;
  }
}