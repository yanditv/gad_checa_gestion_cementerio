import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Contract } from './contract.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  getCreationMetadata() {
    return this.prisma.$transaction([
      this.discount.findMany({
        where: { isActive: true },
        orderBy: { percentage: "desc" },
      }),
      this.bank.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);
  }

  findLastContractByPrefix(prefix: string) {
    return this.contract.findFirst({
      where: {
        sequentialNumber: { startsWith: prefix },
      },
      orderBy: { createdAt: 'desc' },
      select: { sequentialNumber: true },
    });
  }

  findMany(search: string, skip: number, take: number) {
    const where = this.buildContractsWhere(search);

    return this.contract.findMany({
      where,
      include: {
        vault: { include: { block: { include: { cemetery: true } } } },
        deceased: true,
        responsibleParty: { include: { person: true } },
        installments: { where: { isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  count(search: string) {
    const where = this.buildContractsWhere(search);
    return this.contract.count({ where });
  }

  findById(id: string) {
    return this.contract.findUnique({
      where: { id },
      include: {
        vault: {
          include: { block: { include: { cemetery: true } }, floor: true },
        },
        deceased: true,
        responsibleParty: { include: { person: true, owner: true } },
        installments: {
          include: { installmentPayments: { include: { payment: true } } },
          orderBy: { number: "asc" },
        },
        sourceContract: true,
        relatedContract: true,
      },
    });
  }

  create(data: Contract, responsibleIds: string[] = []) {
    const responsiblePartyId = responsibleIds[0];
    const createData: Parameters<typeof this.contract.create>[0]['data'] = {
      ...data,
    };

    if (responsiblePartyId) {
      createData.responsiblePartyId = responsiblePartyId;
    }

    return this.contract.create({
      data: createData,
      include: {
        responsibleParty: { include: { person: true } },
      },
    });
  }

  update(id: string, data: Partial<Contract>) {
    const updateData: Partial<Contract> = {};

    updateData.sequentialNumber = data.sequentialNumber ?? updateData.sequentialNumber;
    updateData.startDate = data.startDate ?? updateData.startDate;
    updateData.endDate = data.endDate ?? updateData.endDate;
    updateData.monthCount = data.monthCount ?? updateData.monthCount;
    updateData.totalAmount = data.totalAmount ?? updateData.totalAmount;
    updateData.isActive = data.isActive ?? updateData.isActive;
    updateData.notes = data.notes ?? updateData.notes;
    updateData.isRenewal = data.isRenewal ?? updateData.isRenewal;
    updateData.renewalCount = data.renewalCount ?? updateData.renewalCount;
    updateData.signedDocumentPath = data.signedDocumentPath ?? updateData.signedDocumentPath;
    updateData.vaultId = data.vaultId ?? updateData.vaultId;
    updateData.deceasedId = data.deceasedId ?? updateData.deceasedId;
    updateData.sourceContractId = data.sourceContractId ?? updateData.sourceContractId;
    updateData.relatedContractId = data.relatedContractId ?? updateData.relatedContractId;
    updateData.createdByUserId = data.createdByUserId ?? updateData.createdByUserId;
    updateData.updatedByUserId = data.updatedByUserId ?? updateData.updatedByUserId;
    updateData.deletedByUserId = data.deletedByUserId ?? updateData.deletedByUserId;

    return this.contract.update({
      where: { id },
      data: updateData,
    });
  }

  replaceResponsibleAssignments(contractId: string, responsibleIds: string[]) {
    const responsiblePartyId = responsibleIds[0] ?? null;

    return this.contract.update({
      where: { id: contractId },
      data: { responsiblePartyId },
    });
  }

  findReports() {
    return this.contract.findMany({
      where: { isActive: true },
      include: {
        vault: { include: { block: { include: { cemetery: true } } } },
        deceased: true,
        installments: { include: { installmentPayments: true } },
      },
    });
  }

  runInTransaction<T>(callback: (tx: any) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  private buildContractsWhere(search: string | undefined): Prisma.ContractWhereInput {
    const where: Prisma.ContractWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { sequentialNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
        {
          deceased: {
            is: { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          },
        },
        {
          deceased: {
            is: { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          },
        },
        {
          vault: {
            is: { number: { contains: search, mode: Prisma.QueryMode.insensitive } },
          },
        },
      ];
    }

    return where;
  }

  private get contract() {
    return this.prisma.contract;
  }

  private get discount() {
    return this.prisma.discount;
  }

  private get bank() {
    return this.prisma.bank;
  }
}
