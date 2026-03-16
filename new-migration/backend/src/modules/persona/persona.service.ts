import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';

@Injectable()
export class PersonaService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto, tipo?: string) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();
    const where: any = { estado: true };
    if (tipo) where.tipoPersona = tipo;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { numeroIdentificacion: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.persona.findMany({
        where,
        include: { propietarios: true, responsables: true },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.persona.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number) {
    const persona = await this.prisma.persona.findUnique({
      where: { id },
      include: { propietarios: { include: { bovedas: true } }, responsables: { include: { contratoResponsables: true, propietario: true } } },
    });
    if (!persona) throw new NotFoundException('Persona no encontrada');
    return persona;
  }

  async create(data: any) {
    return this.prisma.persona.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.persona.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.persona.update({ where: { id }, data: { estado: false } });
  }

  async search(termino: string) {
    return this.prisma.persona.findMany({
      where: {
        estado: true,
        OR: [
          { nombre: { contains: termino, mode: 'insensitive' } },
          { apellido: { contains: termino, mode: 'insensitive' } },
          { numeroIdentificacion: { contains: termino, mode: 'insensitive' } },
        ]
      },
      take: 20
    });
  }
}
