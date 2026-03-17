import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type InstallmentMutation = {
  number?: number;
  amount?: number;
  dueDate?: Date;
  paidAt?: Date | null;
  isActive?: boolean;
  contractId?: string;
};

@Injectable()
export class InstallmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.installment.findUnique({
      where: { id },
      include: {
        contract: { include: { deceased: true, vault: true } },
        installmentPayments: { include: { payment: true } },
      },
    });
  }

  create(data: InstallmentMutation) {
    return this.installment.create({
      data: this.mapCreate(data),
    });
  }

  update(id: string, data: InstallmentMutation) {
    return this.installment.update({
      where: { id },
      data: this.mapUpdate(data),
    });
  }

  async createManyForContract(
    tx: Prisma.TransactionClient,
    contractId: string,
    installments: Array<{ number: number; amount: number; dueDate: Date; paidAt?: Date | null }>,
  ) {
    await tx.installment.createMany({
      data: installments.map((installment) => ({
        number: installment.number,
        amount: installment.amount,
        dueDate: installment.dueDate,
        paidAt: installment.paidAt ?? null,
        contractId,
        isActive: true,
        notes: null,
      })),
    });

    return tx.installment.findMany({
      where: { contractId },
      orderBy: { number: 'asc' },
    });
  }

  listByContractNumbers(tx: Prisma.TransactionClient, contractId: string, numbers: number[]) {
    return tx.installment.findMany({
      where: {
        contractId,
        number: { in: numbers },
      },
      orderBy: { number: 'asc' },
    });
  }

  findActive() {
    return this.installment.findMany({
      where: { isActive: true },
      select: {
        id: true,
        number: true,
        amount: true,
        dueDate: true,
        paidAt: true,
        isActive: true,
        contractId: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  findByContract(contractId: string) {
    return this.installment.findMany({
      where: { contractId, isActive: true },
      select: {
        id: true,
        number: true,
        amount: true,
        dueDate: true,
        paidAt: true,
        isActive: true,
        contractId: true,
      },
      orderBy: { number: 'asc' },
    });
  }

  findPending() {
    return this.installment.findMany({
      where: { paidAt: null, dueDate: { lte: new Date() }, isActive: true },
      select: {
        id: true,
        number: true,
        amount: true,
        dueDate: true,
        paidAt: true,
        isActive: true,
        contractId: true,
        contract: {
          select: {
            id: true,
            deceased: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  private get installment() {
    return this.prisma.installment;
  }

  private mapCreate(data: InstallmentMutation): Prisma.InstallmentUncheckedCreateInput {
    return {
      number: data.number ?? 1,
      amount: data.amount ?? 0,
      dueDate: data.dueDate ?? new Date(),
      paidAt: data.paidAt ?? null,
      isActive: data.isActive ?? true,
      contractId: data.contractId ?? '',
    };
  }

  private mapUpdate(data: InstallmentMutation): Prisma.InstallmentUncheckedUpdateInput {
    const updateData: Prisma.InstallmentUncheckedUpdateInput = {};

    if (data.number !== undefined) {
      updateData.number = data.number;
    }

    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
    }

    if (data.paidAt !== undefined) {
      updateData.paidAt = data.paidAt;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.contractId !== undefined) {
      updateData.contractId = data.contractId;
    }

    return updateData;
  }
}