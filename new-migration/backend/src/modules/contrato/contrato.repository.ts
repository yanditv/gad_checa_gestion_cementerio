import { Injectable } from "@nestjs/common";
import { Contrato } from "./contrato.entity";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ContratoRepository {
  constructor(private readonly prisma: PrismaService) {}

  getCreationMetadata() {
    return this.prisma.$transaction([
      this.discount.findMany({
        where: { estado: true },
        orderBy: { porcentaje: "desc" },
      }),
      this.bank.findMany({
        where: { estado: true },
        orderBy: { nombre: "asc" },
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
        bloque: { include: { cementerio: true } },
        piso: true,
        propietario: { include: { persona: true } },
      },
      orderBy: [{ numero: "asc" }],
      skip,
      take,
    });
  }

  countAvailableVaults(search: string, type: string, currentDate: Date) {
    const where = this.buildAvailableVaultsWhere(search, type, currentDate);

    return this.vault.count({ where });
  }

  findVaultById(id: number) {
    return this.vault.findUnique({
      where: { id },
    });
  }

  findVaultForContractNumber(id: number) {
    return this.vault.findUnique({
      where: { id },
      include: { piso: { include: { bloque: true } } },
    });
  }

  findLastContractByPrefix(prefix: string) {
    return this.contract.findFirst({
      where: {
        numeroSecuencial: { startsWith: prefix },
      },
      orderBy: { id: "desc" },
      select: { numeroSecuencial: true },
    });
  }

  findMany(search: string, skip: number, take: number) {
    const where = this.buildContractsWhere(search);

    return this.contract.findMany({
      where,
      include: {
        boveda: { include: { bloque: { include: { cementerio: true } } } },
        difunto: true,
        responsables: {
          include: { responsable: { include: { persona: true } } },
        },
        cuotas: { where: { estado: true } },
      },
      orderBy: { fechaCreacion: "desc" },
      skip,
      take,
    });
  }

  count(search: string ) {
    const where = this.buildContractsWhere(search);
    return this.contract.count({ where });
  }

  findById(id: number) {
    return this.contract.findUnique({
      where: { id },
      include: {
        boveda: {
          include: { bloque: { include: { cementerio: true } }, piso: true },
        },
        difunto: true,
        responsables: {
          include: {
            responsable: { include: { persona: true, propietario: true } },
          },
        },
        cuotas: {
          include: { pagos: { include: { pago: true } } },
          orderBy: { numero: "asc" },
        },
        contratoOrigen: true,
        contratoRelacionado: true,
      },
    });
  }

  create(data: Contrato, responsibleIds: number[] = []) {
    return this.contract.create({
      data: {
        ...this.toPersistence(data),
        responsables: responsibleIds.length
          ? {
              create: responsibleIds.map((responsableId) => ({
                responsableId,
              })),
            }
          : undefined,
      },
      include: {
        responsables: {
          include: { responsable: { include: { persona: true } } },
        },
      },
    });
  }

  update(id: number, data: Partial<Contrato>) {
    return this.contract.update({
      where: { id },
      data: this.toPersistence(data),
    });
  }

  replaceResponsibleAssignments(contractId: number, responsibleIds: number[]) {
    return this.prisma.$transaction([
      this.contractResponsible.deleteMany({
        where: { contratoId: contractId },
      }),
      this.contractResponsible.createMany({
        data: responsibleIds.map((responsableId) => ({
          contratoId: contractId,
          responsableId,
        })),
      }),
    ]);
  }

  findReports() {
    return this.contract.findMany({
      where: { estado: true },
      include: {
        boveda: { include: { bloque: { include: { cementerio: true } } } },
        difunto: true,
        cuotas: { include: { pagos: true } },
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
      estado: true,
      contratos: {
        none: {
          estado: true,
          OR: [{ fechaFin: null }, { fechaFin: { gte: currentDate } }],
        },
      },
      ...(type ? { tipo: { equals: type, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { numero: { contains: search, mode: "insensitive" } },
              { tipo: { contains: search, mode: "insensitive" } },
              {
                bloque: {
                  is: { nombre: { contains: search, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    };
  }

  private buildContractsWhere(search: string | undefined) {
    return {
      estado: true,
      ...(search
        ? {
            OR: [
              { numeroSecuencial: { contains: search, mode: "insensitive" } },
              {
                difunto: {
                  is: { nombre: { contains: search, mode: "insensitive" } },
                },
              },
              {
                difunto: {
                  is: { apellido: { contains: search, mode: "insensitive" } },
                },
              },
              {
                boveda: {
                  is: { numero: { contains: search, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    };
  }

}
