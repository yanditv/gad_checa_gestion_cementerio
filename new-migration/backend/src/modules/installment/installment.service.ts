import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateContractInstallmentDto } from './dto/create-contract-installment.dto';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { UpdateInstallmentDto } from './dto/update-installment.dto';
import { InstallmentRepository } from './installment.repository';

@Injectable()
export class InstallmentService {
  constructor(private readonly installmentRepository: InstallmentRepository) {}

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
    const installment = await this.installmentRepository.findById(id);
    if (!installment || installment.isActive === false) {
      throw new NotFoundException('Installment not found');
    }

    return installment;
  }

  async create(data: CreateInstallmentDto) {
    return this.installmentRepository.create(data);
  }

  async createForContract(
    tx: Prisma.TransactionClient,
    contractId: string,
    installments: CreateContractInstallmentDto[],
  ) {
    if (installments.length === 0) {
      return [];
    }

    return this.installmentRepository.createManyForContract(tx, contractId, installments);
  }

  async listByContractNumbers(tx: Prisma.TransactionClient, contractId: string, numbers: number[]) {
    if (numbers.length === 0) {
      return [];
    }

    return this.installmentRepository.listByContractNumbers(tx, contractId, numbers);
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
    await this.getById(id);
    return this.installmentRepository.update(id, data);
  }

  async remove(id: string) {
    await this.getById(id);
    return this.installmentRepository.update(id, { isActive: false });
  }
}
