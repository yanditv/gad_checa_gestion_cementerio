import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Persona } from './persona.entity';

@Injectable()
export class PersonaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.persona.findUnique({
      where: { id },
      include: {
        propietarios: { include: { bovedas: true } },
        responsables: { include: { contratoResponsables: true, propietario: true } },
      },
    });
  }

  create(data: Persona) {
    return this.persona.create({ data });
  }

  update(id: number, data: Partial<Persona>) {
    return this.persona.update({ where: { id }, data });
  }

  async listPaginated(search: string | undefined, type: string | undefined, skip: number, take: number) {
    const where = {
      estado: true,
      ...(type ? { tipoPersona: type } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { apellido: { contains: search, mode: 'insensitive' } },
              { numeroIdentificacion: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.persona.findMany({
        where,
        include: { propietarios: true, responsables: true },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take,
      }),
      this.persona.count({ where }),
    ]);

    return { items, total };
  }

  search(term: string) {
    return this.persona.findMany({
      where: {
        estado: true,
        OR: [
          { nombre: { contains: term, mode: 'insensitive' } },
          { apellido: { contains: term, mode: 'insensitive' } },
          { numeroIdentificacion: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }

  private get persona() {
    return this.prisma.persona;
  }
}