import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

type VaultMutation = {
  number?: string;
  capacity?: number;
  type?: string | null;
  isActive?: boolean;
  notes?: string | null;
  location?: string | null;
  price?: number;
  rentalPrice?: number;
  blockId?: string;
  floorId?: string | null;
  ownerId?: string | null;
};

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

  async create(data: VaultMutation) {
    return await this.vault.create({
      data: this.mapCreate(data),
    });
  }

  async update(id: string, data: VaultMutation) {
    return await this.vault.update({
      where: { id },
      data: this.mapUpdate(data),
    });
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
      select: {
        id: true,
        number: true,
        capacity: true,
        type: true,
        isActive: true,
        notes: true,
        location: true,
        price: true,
        rentalPrice: true,
        createdAt: true,
        blockId: true,
        floorId: true,
        ownerId: true,
        block: {
          select: {
            id: true,
            name: true,
            cemetery: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        floor: {
          select: {
            id: true,
            number: true,
          },
        },
        owner: {
          select: {
            id: true,
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
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
      select: {
        id: true,
        number: true,
        capacity: true,
        type: true,
        isActive: true,
        blockId: true,
        floorId: true,
        ownerId: true,
        floor: {
          select: {
            id: true,
            number: true,
          },
        },
        block: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAvailableForContracts(
    search: string | undefined,
    type: string | undefined,
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
      select: {
        id: true,
        number: true,
        type: true,
        isActive: true,
        rentalPrice: true,
        blockId: true,
        floorId: true,
        ownerId: true,
        block: {
          select: {
            id: true,
            name: true,
          },
        },
        floor: {
          select: {
            id: true,
            number: true,
          },
        },
        owner: {
          select: {
            id: true,
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
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

  private toAmount(value: { toNumber(): number } | number | null | undefined) {
    if (value == null) return 0;

    if (typeof value === 'number') {
      return value;
    }

    return value.toNumber();
  }

  private mapCreate(data: VaultMutation): Prisma.VaultCreateInput {
    return {
      number: data.number ?? '',
      capacity: data.capacity ?? 1,
      type: data.type ?? null,
      isActive: data.isActive ?? true,
      notes: data.notes ?? null,
      location: data.location ?? null,
      price: data.price ?? 0,
      rentalPrice: data.rentalPrice ?? 0,
      block: this.mapRequiredRelation(data.blockId),
      floor: this.mapRelation(data.floorId),
      owner: this.mapRelation(data.ownerId),
    };
  }

  private mapUpdate(data: VaultMutation) {
    const updateData: Prisma.VaultUpdateInput = {};

    
    if (data.number !== undefined) {
      updateData.number = data.number;
    }

    if (data.capacity !== undefined) {
      updateData.capacity = data.capacity;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.location !== undefined) {
      updateData.location = data.location;
    }

    if (data.price !== undefined) {
      updateData.price = data.price;
    }

    if (data.rentalPrice !== undefined) {
      updateData.rentalPrice = data.rentalPrice;
    }

    if (data.blockId !== undefined) {
      updateData.block = this.mapRequiredRelation(data.blockId);
    }

    if (data.floorId !== undefined) {
      updateData.floor = this.mapRelation(data.floorId);
    }

    if (data.ownerId !== undefined) {
      updateData.owner = this.mapRelation(data.ownerId);
    }

    return updateData;
  }

  private mapRequiredRelation(id?: string) {
    return {
      connect: {
        id: id ?? '',
      },
    };
  }

  private mapRelation(id?: string | null) {
    if (id === undefined) return undefined;
    if (id === null) return { disconnect: true };

    return {
      connect: {
        id,
      },
    };
  }
}
