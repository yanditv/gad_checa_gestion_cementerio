import { Injectable } from "@nestjs/common";
import { Contrato } from "./contrato.entity";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ContratoRepository {
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

  findAvailableVaults(
    search: string,
    type: string,
    currentDate: Date,
    skip: number,
    take: number,
  ) {
    const where = this.buildAvailableVaultsWhere(search, type, currentDate);

    return this.vault.findMany({
      where,
      include: {
        block: { include: { cemetery: true } },
        floor: true,
        owner: { include: { person: true } },
      },
      orderBy: [{ number: "asc" }],
      skip,
      take,
    });
  }

  countAvailableVaults(search: string, type: string, currentDate: Date) {
    const where = this.buildAvailableVaultsWhere(search, type, currentDate);

    return this.vault.count({ where });
  }

  findVaultById(id: string) {
    return this.vault.findUnique({
      where: { id },
    });
  }

  findVaultForContractNumber(id: string) {
    return this.vault.findUnique({
      where: { id },
      include: { floor: { include: { block: true } } },
    });
  }

  findLastContractByPrefix(prefix: string) {
    return this.contract.findFirst({
      where: {
        sequentialNumber: { startsWith: prefix },
      },
      orderBy: { id: "desc" },
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
        assignments: {
          include: { responsibleParty: { include: { person: true } } },
        },
        installments: { where: { isActive: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  count(search: string ) {
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
        assignments: {
          include: {
            responsibleParty: { include: { person: true, owner: true } },
          },
        },
        installments: {
          include: { installmentPayments: { include: { payment: true } } },
          orderBy: { number: "asc" },
        },
        sourceContract: true,
        relatedContract: true,
      },
    });
  }

  create(data: Contrato, responsibleIds: string[] = []) {
    return this.contract.create({
      data: {
        ...this.toPersistence(data),
        assignments: responsibleIds.length
          ? {
              create: responsibleIds.map((responsiblePartyId) => ({
                responsiblePartyId,
              })),
            }
          : undefined,
      },
      include: {
        assignments: {
          include: { responsibleParty: { include: { person: true } } },
        },
      },
    });
  }

  update(id: string, data: Partial<Contrato>) {
    return this.contract.update({
      where: { id },
      data: this.toPersistence(data),
    });
  }

  replaceResponsibleAssignments(contractId: string, responsibleIds: string[]) {
    return this.prisma.$transaction([
      this.contractResponsible.deleteMany({
        where: { contractId },
      }),
      this.contractResponsible.createMany({
        data: responsibleIds.map((responsiblePartyId) => ({
          contractId,
          responsiblePartyId,
        })),
      }),
    ]);
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

  private buildAvailableVaultsWhere(
    search: string | undefined,
    type: string | undefined,
    currentDate: Date,
  ) {
    return {
      isActive: true,
      contracts: {
        none: {
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: currentDate } }],
        },
      },
      ...(type ? { type: { equals: type, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: "insensitive" } },
              { type: { contains: search, mode: "insensitive" } },
              {
                block: {
                  is: { name: { contains: search, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    };
  }

  private buildContractsWhere(search: string | undefined) {
    return {
      isActive: true,
      ...(search
        ? {
            OR: [
              { sequentialNumber: { contains: search, mode: "insensitive" } },
              {
                deceased: {
                  is: { firstName: { contains: search, mode: "insensitive" } },
                },
              },
              {
                deceased: {
                  is: { lastName: { contains: search, mode: "insensitive" } },
                },
              },
              {
                vault: {
                  is: { number: { contains: search, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    };
  }

  private get contract() {
    return this.prisma.contract;
  }

  private get vault() {
    return this.prisma.vault;
  }

  private get discount() {
    return this.prisma.discount;
  }

  private get bank() {
    return this.prisma.bank;
  }

  private get contractResponsible() {
    return this.prisma.contractAssignment;
  }

}
