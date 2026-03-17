import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type DeceasedMutation = {
  firstName?: string;
  lastName?: string;
  identificationNumber?: string | null;
  birthDate?: Date | null;
  deathDate?: Date | null;
  burialDate?: Date | null;
  causeOfDeath?: string | null;
  notes?: string | null;
  age?: number | null;
  gender?: string | null;
  isActive?: boolean;
  vaultId?: string;
};

@Injectable()
export class DeceasedRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.deceased.findUnique({
      where: { id },
      include: {
        vault: { include: { block: { include: { cemetery: true } }, floor: true } },
        contracts: { where: { isActive: true } },
      },
    });
  }

  create(data: DeceasedMutation) {
    return this.deceased.create({
      data: this.mapCreate(data),
    });
  }

  update(id: string, data: DeceasedMutation) {
    return this.deceased.update({
      where: { id },
      data: this.mapUpdate(data),
    });
  }

  createInTransaction(tx: Prisma.TransactionClient, data: DeceasedMutation) {
    return tx.deceased.create({
      data: this.mapCreate(data),
    });
  }

  async listPaginated(search: string | undefined, skip: number, take: number) {
    const where: Prisma.DeceasedWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { identificationNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { vault: { is: { number: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.deceased.findMany({
        where,
        include: { vault: { include: { block: { include: { cemetery: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.deceased.count({ where }),
    ]);

    return { items, total };
  }

  listByVault(vaultId: string) {
    return this.deceased.findMany({
      where: { vaultId, isActive: true },
    });
  }

  private get deceased() {
    return this.prisma.deceased;
  }

  private mapCreate(data: DeceasedMutation): Prisma.DeceasedUncheckedCreateInput {
    return {
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      identificationNumber: data.identificationNumber ?? null,
      birthDate: data.birthDate ?? null,
      deathDate: data.deathDate ?? null,
      burialDate: data.burialDate ?? null,
      causeOfDeath: data.causeOfDeath ?? null,
      notes: data.notes ?? null,
      age: data.age ?? null,
      gender: data.gender ?? null,
      isActive: data.isActive ?? true,
      vaultId: data.vaultId ?? '',
    };
  }

  private mapUpdate(data: DeceasedMutation): Prisma.DeceasedUncheckedUpdateInput {
    const updateData: Prisma.DeceasedUncheckedUpdateInput = {};

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
    }

    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
    }

    if (data.identificationNumber !== undefined) {
      updateData.identificationNumber = data.identificationNumber;
    }

    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate;
    }

    if (data.deathDate !== undefined) {
      updateData.deathDate = data.deathDate;
    }

    if (data.burialDate !== undefined) {
      updateData.burialDate = data.burialDate;
    }

    if (data.causeOfDeath !== undefined) {
      updateData.causeOfDeath = data.causeOfDeath;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.age !== undefined) {
      updateData.age = data.age;
    }

    if (data.gender !== undefined) {
      updateData.gender = data.gender;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.vaultId !== undefined) {
      updateData.vaultId = data.vaultId;
    }

    return updateData;
  }
}