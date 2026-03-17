import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type ContractMutation = {
  sequentialNumber?: string;
  startDate?: Date;
  endDate?: Date | null;
  monthCount?: number;
  totalAmount?: number;
  isActive?: boolean;
  notes?: string | null;
  signedDocumentPath?: string | null;
  vaultId?: string;
  deceasedId?: string | null;
  sourceContractId?: string | null;
  relatedContractId?: string | null;
};

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
      select: {
        id: true,
        sequentialNumber: true,
        startDate: true,
        endDate: true,
        monthCount: true,
        totalAmount: true,
        isActive: true,
        notes: true,
        createdAt: true,
        vaultId: true,
        deceasedId: true,
        responsiblePartyId: true,
        sourceContractId: true,
        relatedContractId: true,
        vault: {
          select: {
            id: true,
            number: true,
            block: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        deceased: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identificationNumber: true,
          },
        },
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

  create(data: ContractMutation, responsiblePartyId?: string) {
    return this.contract.create({
      data: this.mapCreate(data, responsiblePartyId),
      include: {
        responsibleParty: { include: { person: true } },
      },
    });
  }

  update(id: string, data: ContractMutation) {
    return this.contract.update({
      where: { id },
      data: this.mapUpdate(data),
    });
  }

  createInTransaction(
    tx: Prisma.TransactionClient,
    data: ContractMutation,
    responsiblePartyId?: string,
  ) {
    return tx.contract.create({
      data: this.mapCreate(data, responsiblePartyId),
    });
  }

  findByIdInTransaction(tx: Prisma.TransactionClient, id: string) {
    return tx.contract.findUnique({
      where: { id },
      include: {
        vault: { include: { block: true, floor: true } },
        deceased: true,
        responsibleParty: { include: { person: true } },
        installments: { orderBy: { number: 'asc' } },
      },
    });
  }

  replaceResponsibleAssignments(contractId: string, responsibleIds: string[]) {
    return this.contract.update({
      where: { id: contractId },
      data: { responsiblePartyId: responsibleIds[0] ?? null },
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

  private mapCreate(data: ContractMutation, responsiblePartyId?: string): Prisma.ContractUncheckedCreateInput {
    const createData: Prisma.ContractUncheckedCreateInput = {
      sequentialNumber: data.sequentialNumber ?? '',
      startDate: data.startDate ?? new Date(),
      endDate: data.endDate ?? null,
      monthCount: data.monthCount ?? 1,
      totalAmount: data.totalAmount ?? 0,
      isActive: data.isActive ?? true,
      notes: data.notes ?? null,
      signedDocumentPath: data.signedDocumentPath ?? null,
      vaultId: data.vaultId ?? '',
      deceasedId: data.deceasedId ?? null,
      sourceContractId: data.sourceContractId ?? null,
      relatedContractId: data.relatedContractId ?? null,
    };

    if (responsiblePartyId !== undefined) {
      createData.responsiblePartyId = responsiblePartyId;
    }

    return createData;
  }

  private mapUpdate(data: ContractMutation): Prisma.ContractUncheckedUpdateInput {
    const updateData: Prisma.ContractUncheckedUpdateInput = {};

    if (data.sequentialNumber !== undefined) {
      updateData.sequentialNumber = data.sequentialNumber;
    }

    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate;
    }

    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate;
    }

    if (data.monthCount !== undefined) {
      updateData.monthCount = data.monthCount;
    }

    if (data.totalAmount !== undefined) {
      updateData.totalAmount = data.totalAmount;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.signedDocumentPath !== undefined) {
      updateData.signedDocumentPath = data.signedDocumentPath;
    }

    if (data.vaultId !== undefined) {
      updateData.vaultId = data.vaultId;
    }

    if (data.deceasedId !== undefined) {
      updateData.deceasedId = data.deceasedId;
    }

    if (data.sourceContractId !== undefined) {
      updateData.sourceContractId = data.sourceContractId;
    }

    if (data.relatedContractId !== undefined) {
      updateData.relatedContractId = data.relatedContractId;
    }

    return updateData;
  }
}
