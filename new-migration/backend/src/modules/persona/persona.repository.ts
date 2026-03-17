import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Persona } from './persona.entity';

@Injectable()
export class PersonaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.person.findUnique({
      where: { id },
      include: {
        owners: { include: { vaults: true } },
        responsibleParties: { include: { contractAssignments: true, owner: true } },
      },
    });
  }

  create(data: Persona) {
    return this.person.create({ data });
  }

  update(id: string, data: Partial<Persona>) {
    return this.person.update({ where: { id }, data });
  }

  async listPaginated(search: string | undefined, type: string | undefined, skip: number, take: number) {
    const where = {
      isActive: true,
      ...(type ? { personType: type } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { identificationNumber: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

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
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { identificationNumber: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }

  private get person() {
    return this.prisma.person;
  }
}