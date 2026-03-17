import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SoftDeleteCrudService } from '../../common/services/soft-delete-crud.service';
import { CreateContractInstallmentDto } from './dto/create-contract-installment.dto';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { UpdateInstallmentDto } from './dto/update-installment.dto';
import { InstallmentRepository } from './installment.repository';

@Injectable()
export class InstallmentService extends SoftDeleteCrudService<
  Prisma.InstallmentGetPayload<{
    include: {
      contract: {
        include: {
          deceased: true;
          vault: true;
        };
      };
      installmentPayments: {
        include: {
          payment: true;
        };
      };
    };
  }>,
  number,
  Prisma.InstallmentUncheckedCreateInput,
  Prisma.InstallmentUncheckedUpdateInput
> {
  constructor(private readonly installmentRepository: InstallmentRepository) {
    super('Installment');
  }

  protected get repository() {
    return this.installmentRepository;
  }

  protected override detailRelations() {
    return {
      contract: { include: { deceased: true, vault: true } },
      installmentPayments: { include: { payment: true } },
    };
  }

  async list() {
    return this.installmentRepository.findActive();
  }

  async listByContract(contractId: string) {
    return this.installmentRepository.findByContract(contractId);
  }

  async listPending() {
    return this.installmentRepository.findPending();
  }

  async getById(id: string) {
    return this.getByIdOrThrow(id);
  }

  async create(data: CreateInstallmentDto) {
    return super.create(data);
  }

  async createForContract(
    tx: Prisma.TransactionClient,
    contractId: string,
    installments: CreateContractInstallmentDto[],
  ) {
    if (installments.length === 0) {
      return [];
    }

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

  async listByContractNumbers(tx: Prisma.TransactionClient, contractId: string, numbers: number[]) {
    if (numbers.length === 0) {
      return [];
    }

    return tx.installment.findMany({
      where: {
        contractId,
        number: { in: numbers },
      },
      orderBy: { number: 'asc' },
    });
  }

  calculatePaidAmount(installments: Array<{ amount: unknown; paidAt?: Date | null }>) {
    return installments.reduce((sum, installment) => {
      if (!installment.paidAt) {
        return sum;
      }

      return sum + Number(installment.amount);
    }, 0);
  }

  async update(id: string, data: UpdateInstallmentDto) {
    return super.update(id, data);
  }

  async remove(id: string) {
    return super.remove(id);
  }
}
