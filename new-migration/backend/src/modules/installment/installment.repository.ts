import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Installment } from './installment.entity';

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

  create(data: Installment) {
    return this.installment.create({
      data
    });
  }

  update(id: string, data: Partial<Installment>) {
    const updateData: Partial<Installment> = {};

    updateData.number = data.number ?? updateData.number;
    updateData.amount = data.amount ?? updateData.amount;
    updateData.dueDate = data.dueDate ?? updateData.dueDate;
    updateData.paidAt = data.paidAt ?? updateData.paidAt;
    updateData.isActive = data.isActive ?? updateData.isActive;
    updateData.contractId = data.contractId ?? updateData.contractId;

    return this.installment.update({
      where: { id },
      data: updateData,
    });
  }

  findActive() {
    return this.installment.findMany({
      where: { isActive: true },
      include: { contract: { include: { deceased: true, vault: true } }, installmentPayments: { include: { payment: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  findByContract(contractId: string) {
    return this.installment.findMany({
      where: { contractId, isActive: true },
      include: { installmentPayments: { include: { payment: true } } },
      orderBy: { number: 'asc' },
    });
  }

  findPending() {
    return this.installment.findMany({
      where: { paidAt: null, dueDate: { lte: new Date() }, isActive: true },
      include: { contract: { include: { deceased: true, vault: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  private get installment() {
    return this.prisma.installment;
  }
}