import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Deceased } from './deceased.entity';

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

  create(data: Deceased) {
    return this.deceased.create({
      data
    });
  }

  update(id: string, data: Partial<Deceased>) {
    const updateData: Partial<Deceased> = {};

    updateData.firstName = data.firstName ?? updateData.firstName;
    updateData.lastName = data.lastName ?? updateData.lastName;
    updateData.identificationNumber = data.identificationNumber ?? updateData.identificationNumber;
    updateData.causeOfDeath = data.causeOfDeath ?? updateData.causeOfDeath;
    updateData.notes = data.notes ?? updateData.notes;
    updateData.age = data.age ?? updateData.age;
    updateData.gender = data.gender ?? updateData.gender;
    updateData.isActive = data.isActive ?? updateData.isActive;
    updateData.vaultId = data.vaultId ?? updateData.vaultId;

    return this.deceased.update({
      where: { id },
      data: updateData,
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
}