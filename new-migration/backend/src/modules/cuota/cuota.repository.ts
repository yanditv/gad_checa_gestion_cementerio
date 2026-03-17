import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cuota } from './cuota.entity';

@Injectable()
export class CuotaRepository {
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

  create(data: Cuota) {
    return this.installment.create({ data });
  }

  update(id: string, data: Partial<Cuota>) {
    return this.installment.update({ where: { id }, data });
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
      where: { isPaid: false, dueDate: { lte: new Date() }, isActive: true },
      include: { contract: { include: { deceased: true, vault: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  private get installment() {
    return this.prisma.installment;
  }
}