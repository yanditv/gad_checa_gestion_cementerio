import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Pago } from './pago.entity';

@Injectable()
export class PagoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return this.payment.findMany({
      where: { isActive: true },
      include: { bank: true, installmentPayments: { include: { installment: { include: { contract: true } } } } },
      orderBy: { paymentDate: 'desc' },
    });
  }

  findById(id: string) {
    return this.payment.findUnique({
      where: { id },
      include: {
        bank: true,
        installmentPayments: { include: { installment: { include: { contract: { include: { deceased: true, vault: true } } } } } },
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
        installmentPayments: cuotasIds?.length
          ? {
              create: cuotasIds.map((installmentId) => ({ installmentId })),
            }
          : undefined,
      },
      include: { installmentPayments: { include: { installment: true } } },
    });
  }

  update(id: string, data: Partial<Pago>) {
    return this.payment.update({ where: { id }, data });
  }

  updateInstallmentsAsPaid(cuotasIds: number[], fechaPago: Date) {
    return this.installment.updateMany({
      where: { id: { in: cuotasIds } },
      data: { isPaid: true, paymentDate: fechaPago },
    });
  }

  deleteInstallmentPaymentsByPagoId(paymentId: string) {
    return this.installmentPayment.deleteMany({
      where: { paymentId },
    });
  }

  updateInstallmentsAsPending(cuotasIds: number[]) {
    return this.installment.updateMany({
      where: { id: { in: cuotasIds } },
      data: { isPaid: false, paymentDate: null },
    });
  }

  private get payment() {
    return this.prisma.payment;
  }

  private get installment() {
    return this.prisma.installment;
  }

  private get installmentPayment() {
    return this.prisma.installmentPayment;
  }
}