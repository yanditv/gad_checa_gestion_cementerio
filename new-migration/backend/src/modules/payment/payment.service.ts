import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateInstallmentPaymentDto } from './dto/create-installment-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './payment.entity';
import { PaymentRepository } from './payment.repository';
import { buildPaymentReceiptNumber } from './payment.utils';

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async list() {
    return this.paymentRepository.findMany();
  }

  async getById(id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async create(dto: CreatePaymentDto) {
    const { installmentIds = [], ...paymentData } = dto;

    const createdPayment = await this.createPaymentRecord({
      amount: paymentData.amount,
      paidAt: paymentData.paidAt,
      paymentMethod: paymentData.paymentMethod,
      reference: paymentData.reference,
      note: paymentData.note,
      bankId: paymentData.bankId,
      installmentIds,
    });

    if (Array.isArray(installmentIds) && installmentIds.length > 0) {
      await this.paymentRepository.updateInstallmentsAsPaid(installmentIds, dto.paidAt);
    }

    return createdPayment;
  }

  async update(id: string, dto: UpdatePaymentDto) {
    await this.getById(id);

    const { installmentIds: _installmentIds, ...paymentData } = dto;

    const payment = Payment.create(paymentData);

    return this.paymentRepository.update(id, payment);
  }

  async createForInstallments(tx: Prisma.TransactionClient, input: CreateInstallmentPaymentDto) {
    if (input.installmentIds.length === 0) {
      return null;
    }

    const createdPayment = await this.createPaymentRecord(input, tx);

    await tx.installment.updateMany({
      where: { id: { in: input.installmentIds } },
      data: {
        paidAt: input.paidAt,
      },
    });

    return createdPayment;
  }

  async remove(id: string) {
    const payment = await this.getById(id);
    await this.paymentRepository.deleteInstallmentPaymentsByPaymentId(id);
    await this.paymentRepository.updateInstallmentsAsPending(
      payment.installmentPayments.map((installmentPayment: { installmentId: string }) => installmentPayment.installmentId),
    );
    return this.paymentRepository.update(id, Payment.create({ isActive: false }));
  }

  private async createPaymentRecord(input: CreatePaymentDto | CreateInstallmentPaymentDto, tx?: Prisma.TransactionClient) {
    const receiptNumber = buildPaymentReceiptNumber(
      await this.getNextReceiptSequence(tx),
      input.paidAt,
    );

    const payment = Payment.create({
      amount: input.amount,
      paidAt: input.paidAt,
      paymentMethod: input.paymentMethod ?? undefined,
      reference: input.reference ?? undefined,
      note: input.note ?? undefined,
      bankId: input.bankId ?? null,
      receiptNumber,
    });

    if (!tx) {
      return this.paymentRepository.create(payment, input.installmentIds);
    }

    return tx.payment.create({
      data: {
        ...payment,
        installmentPayments: input.installmentIds.length
          ? {
              create: input.installmentIds.map((installmentId) => ({ installmentId })),
            }
          : undefined,
      },
      include: { installmentPayments: { include: { installment: true } } },
    });
  }

  private async getNextReceiptSequence(tx?: Prisma.TransactionClient) {
    const lastPayment = tx
      ? await tx.payment.findFirst({ orderBy: { paidAt: 'desc' } })
      : await this.paymentRepository.findLastPayment();

    const lastSequence = lastPayment?.receiptNumber.match(/-(\d+)$/)?.[1];
    return lastSequence ? Number(lastSequence) + 1 : 1;
  }
}
