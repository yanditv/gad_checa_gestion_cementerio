import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Payment } from './payment.entity';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return this.payment.findMany({
      where: { isActive: true },
      include: { bank: true, installmentPayments: { include: { installment: { include: { contract: true } } } } },
      orderBy: { paidAt: 'desc' },
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

  create(data: Payment, installmentIds?: string[]) {
    const createData: Parameters<typeof this.payment.create>[0]['data'] = {
      ...data,
    };

    if (installmentIds?.length) {
      createData.installmentPayments = {
        create: installmentIds.map((installmentId) => ({ installmentId })),
      };
    }

    return this.payment.create({
      data: createData,
      include: { installmentPayments: { include: { installment: true } } },
    });
  }

  update(id: string, data: Partial<Payment>) {
    const updateData: Partial<Payment> = {};

    updateData.receiptNumber = data.receiptNumber ?? updateData.receiptNumber;
    updateData.amount = data.amount ?? updateData.amount;
    updateData.paidAt = data.paidAt ?? updateData.paidAt;
    updateData.paymentMethod = data.paymentMethod ?? updateData.paymentMethod;
    updateData.reference = data.reference ?? updateData.reference;
    updateData.note = data.note ?? updateData.note;
    updateData.isActive = data.isActive ?? updateData.isActive;
    updateData.bankId = data.bankId ?? updateData.bankId;

    return this.payment.update({ where: { id }, data: updateData });
  }

  updateInstallmentsAsPaid(installmentIds: string[], paidAt: Date) {
    return this.installment.updateMany({
      where: { id: { in: installmentIds } },
      data: { paidAt },
    });
  }

  deleteInstallmentPaymentsByPaymentId(paymentId: string) {
    return this.installmentPayment.deleteMany({
      where: { paymentId },
    });
  }

  updateInstallmentsAsPending(installmentIds: string[]) {
    return this.installment.updateMany({
      where: { id: { in: installmentIds } },
      data: { paidAt: null },
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