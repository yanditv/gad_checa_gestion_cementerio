import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type PaymentMutation = {
  receiptNumber?: string;
  amount?: number;
  paidAt?: Date;
  paymentMethod?: string;
  reference?: string | null;
  note?: string | null;
  isActive?: boolean;
  bankId?: string | null;
};

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
      orderBy: { paidAt: 'desc' },
    });
  }

  findLastPaymentInTransaction(tx: Prisma.TransactionClient) {
    return tx.payment.findFirst({
      orderBy: { paidAt: 'desc' },
    });
  }

  create(data: PaymentMutation, installmentIds?: string[]) {
    return this.payment.create({
      data: this.mapCreate(data, installmentIds),
      include: { installmentPayments: { include: { installment: true } } },
    });
  }

  createInTransaction(tx: Prisma.TransactionClient, data: PaymentMutation, installmentIds?: string[]) {
    return tx.payment.create({
      data: this.mapCreate(data, installmentIds),
      include: { installmentPayments: { include: { installment: true } } },
    });
  }

  update(id: string, data: PaymentMutation) {
    return this.payment.update({
      where: { id },
      data: this.mapUpdate(data),
    });
  }

  updateInstallmentsAsPaid(installmentIds: string[], paidAt: Date) {
    return this.installment.updateMany({
      where: { id: { in: installmentIds } },
      data: { paidAt },
    });
  }

  updateInstallmentsAsPaidInTransaction(tx: Prisma.TransactionClient, installmentIds: string[], paidAt: Date) {
    return tx.installment.updateMany({
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

  private mapCreate(data: PaymentMutation, installmentIds?: string[]): Prisma.PaymentCreateInput {
    const createData: Prisma.PaymentCreateInput = {
      receiptNumber: data.receiptNumber ?? '',
      amount: data.amount ?? 0,
      paidAt: data.paidAt ?? new Date(),
      paymentMethod: data.paymentMethod ?? '',
      reference: data.reference ?? null,
      note: data.note ?? null,
      isActive: data.isActive ?? true,
    };

    if (data.bankId) {
      createData.bank = { connect: { id: data.bankId } };
    }

    if (installmentIds && installmentIds.length > 0) {
      createData.installmentPayments = {
        create: installmentIds.map((installmentId) => ({ installment: { connect: { id: installmentId } } })),
      };
    }

    return createData;
  }

  private mapUpdate(data: PaymentMutation): Prisma.PaymentUpdateInput {
    const updateData: Prisma.PaymentUpdateInput = {};

    if (data.receiptNumber !== undefined) {
      updateData.receiptNumber = data.receiptNumber;
    }

    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }

    if (data.paidAt !== undefined) {
      updateData.paidAt = data.paidAt;
    }

    if (data.paymentMethod !== undefined) {
      updateData.paymentMethod = data.paymentMethod;
    }

    if (data.reference !== undefined) {
      updateData.reference = data.reference;
    }

    if (data.note !== undefined) {
      updateData.note = data.note;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.bankId !== undefined) {
      if (data.bankId === null) {
        updateData.bank = { disconnect: true };
      } else {
        updateData.bank = { connect: { id: data.bankId } };
      }
    }

    return updateData;
  }
}