import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type PersonMutation = {
  identificationNumber?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  identificationType?: string;
  gender?: string | null;
  isActive?: boolean;
  personType?: string;
};

type ResponsiblePartyMutation = {
  personId: string;
  relationship?: string | null;
};

@Injectable()
export class PersonRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.person.findUnique({
      where: { id },
      include: {
        owners: { include: { vaults: true } },
        responsibleParties: { include: { contracts: true, owner: true } },
      },
    });
  }

  create(data: PersonMutation) {
    return this.person.create({
      data: this.mapCreate(data),
    });
  }

  update(id: string, data: PersonMutation) {
    return this.person.update({
      where: { id },
      data: this.mapUpdate(data),
    });
  }

  createInTransaction(tx: Prisma.TransactionClient, data: PersonMutation) {
    return tx.person.create({
      data: this.mapCreate(data),
    });
  }

  findActiveByIdInTransaction(tx: Prisma.TransactionClient, id: string) {
    return tx.person.findFirst({
      where: {
        id,
        isActive: true,
      },
    });
  }

  findResponsiblePartyInTransaction(
    tx: Prisma.TransactionClient,
    personId: string,
    relationship?: string | null,
  ) {
    return tx.responsibleParty.findFirst({
      where: {
        personId,
        relationship,
        ownerId: null,
      },
    });
  }

  createResponsiblePartyInTransaction(
    tx: Prisma.TransactionClient,
    data: ResponsiblePartyMutation,
  ) {
    return tx.responsibleParty.create({
      data: {
        personId: data.personId,
        relationship: data.relationship ?? null,
        isActive: true,
      },
    });
  }

  async listPaginated(search: string | undefined, type: string | undefined, skip: number, take: number) {
    const where: Prisma.PersonWhereInput = {
      isActive: true,
    };

    if (type) {
      where.personType = type;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { identificationNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.person.findMany({
        where,
        select: {
          id: true,
          identificationNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          address: true,
          identificationType: true,
          gender: true,
          isActive: true,
          createdAt: true,
          personType: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.person.count({ where }),
    ]);

    return { items, total };
  }

  search(term: string) {
    return this.person.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: term, mode: Prisma.QueryMode.insensitive } },
          { lastName: { contains: term, mode: Prisma.QueryMode.insensitive } },
          { identificationNumber: { contains: term, mode: Prisma.QueryMode.insensitive } },
        ],
      },
      take: 20,
    });
  }

  private get person() {
    return this.prisma.person;
  }

  private mapCreate(data: PersonMutation): Prisma.PersonUncheckedCreateInput {
    return {
      identificationNumber: data.identificationNumber ?? '',
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      identificationType: data.identificationType ?? 'Cedula',
      gender: data.gender ?? null,
      isActive: data.isActive ?? true,
      personType: data.personType ?? 'Person',
    };
  }

  private mapUpdate(data: PersonMutation): Prisma.PersonUncheckedUpdateInput {
    const updateData: Prisma.PersonUncheckedUpdateInput = {};

    if (data.identificationNumber !== undefined) {
      updateData.identificationNumber = data.identificationNumber;
    }

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
    }

    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.address !== undefined) {
      updateData.address = data.address;
    }

    if (data.identificationType !== undefined) {
      updateData.identificationType = data.identificationType;
    }

    if (data.gender !== undefined) {
      updateData.gender = data.gender;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.personType !== undefined) {
      updateData.personType = data.personType;
    }

    return updateData;
  }
}