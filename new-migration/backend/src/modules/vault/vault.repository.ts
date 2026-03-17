import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { Vault } from "./vault.entity";

@Injectable()
export class VaultRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return await this.vault.findUnique({
      where: { id },
      include: {
        block: { include: { cemetery: true } },
        floor: true,
        owner: { include: { person: true } },
        deceased: { where: { isActive: true } },
        contracts: {
          where: { isActive: true },
          include: {
            deceased: true,
            responsibleParty: { include: { person: true } },
          },
        },
      },
    });
  }

  async findContractContextById(id: string) {
    const vault = await this.vault.findUnique({
      where: { id },
      include: { floor: { include: { block: true } } },
    });

    if (!vault) return null;

    return {
      ...vault,
      rentalPrice: this.toAmount(vault.rentalPrice),
    };
  }

  async create(data: Vault) {
    return await this.vault.create({ data });
  }

  async update(id: string, data: Partial<Vault>) {
    const updateData: Partial<Vault> = {};

    updateData.number = data.number ?? updateData.number;
    updateData.capacity = data.capacity ?? updateData.capacity;
    updateData.type = data.type ?? updateData.type;
    updateData.isActive = data.isActive ?? updateData.isActive;
    updateData.notes = data.notes ?? updateData.notes;
    updateData.location = data.location ?? updateData.location;
    updateData.price = data.price ?? updateData.price;
    updateData.rentalPrice = data.rentalPrice ?? updateData.rentalPrice;
    updateData.blockId = data.blockId ?? updateData.blockId;
    updateData.floorId = data.floorId ?? updateData.floorId;
    updateData.ownerId = data.ownerId ?? updateData.ownerId;

    return await this.vault.update({ where: { id }, data: updateData });
  }

  async listPaginated(search?: string, skip = 0, take = 10) {
    const where: Prisma.VaultWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { type: { contains: search, mode: "insensitive" } },
        {
          block: {
            is: {
              name: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const itemsQuery = this.prisma.vault.findMany({
      where,
      include: {
        block: { include: { cemetery: true } },
        floor: true,
        owner: { include: { person: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    const countQuery = this.prisma.vault.count({ where });

    const [items, total] = await this.prisma.$transaction([
      itemsQuery,
      countQuery,
    ]);

    return { items, total };
  }

  async listByBlock(blockId: string) {
    return await this.vault.findMany({
      where: { blockId, isActive: true },
      include: { floor: true },
    });
  }

  async findAvailableForContracts(
    search: string,
    type: string,
    currentDate: Date,
    skip: number,
    take: number,
  ) {
    const where = this.buildAvailableForContractsWhere(
      search,
      type,
      currentDate,
    );

    return await this.vault.findMany({
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

  async countAvailableForContracts(
    search: string | undefined,
    type: string | undefined,
    currentDate: Date,
  ) {
    const where = this.buildAvailableForContractsWhere(
      search,
      type,
      currentDate,
    );

    return await this.vault.count({ where });
  }

  private buildAvailableForContractsWhere(
    search: string | undefined,
    type: string | undefined,
    currentDate: Date,
  ): Prisma.VaultWhereInput {
    const where: Prisma.VaultWhereInput = {
      isActive: true,
      contracts: {
        none: {
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: currentDate } }],
        },
      },
    };

    if (type) {
      where.type = { equals: type, mode: Prisma.QueryMode.insensitive };
    }

    if (search) {
      where.OR = [
        {
          number: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          type: { contains: search, mode: Prisma.QueryMode.insensitive },
        },
        {
          block: {
            is: {
              name: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        },
      ];
    }

    return where;
  }

  private get vault() {
    return this.prisma.vault;
  }

  private toAmount(value: number) {
    if (value == null) return 0;
    return value.toNumber();
  }
}
