import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Person } from './person.entity';

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

  create(data: Person) {
    return this.person.create({
      data
    });
  }

  update(id: string, data: Partial<Person>) {
    const updateData: Partial<Person> = {};

    updateData.identificationNumber = data.identificationNumber ?? updateData.identificationNumber;
    updateData.firstName = data.firstName ?? updateData.firstName;
    updateData.lastName = data.lastName ?? updateData.lastName;
    updateData.phone = data.phone ?? updateData.phone;
    updateData.email = data.email ?? updateData.email;
    updateData.address = data.address ?? updateData.address;
    updateData.identificationType = data.identificationType ?? updateData.identificationType;
    updateData.gender = data.gender ?? updateData.gender;
    updateData.isActive = data.isActive ?? updateData.isActive;
    updateData.personType = data.personType ?? updateData.personType;

    return this.person.update({
      where: { id },
      data: updateData,
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
        include: { owners: true, responsibleParties: true },
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
}