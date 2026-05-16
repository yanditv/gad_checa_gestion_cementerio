import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';
import { UpdatePersonaDto } from './dto/request/update-persona.dto';

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

  /**
   * Detalle enriquecido con todas las relaciones útiles para mostrar en
   * tabs:
   *   - Bóvedas que esta persona posee como propietario.
   *   - Contratos donde participa como responsable.
   *   - Pagos realizados (registrados por ella como usuario) — pendiente,
   *     no hay relación directa Persona ↔ Pago; en la UI agregamos placeholder.
   */
  async findOne(id: number) {
    const persona = await this.prisma.persona.findUnique({
      where: { id },
      include: {
        propietarios: {
          include: {
            bovedas: {
              include: {
                bloque: { include: { cementerio: true } },
                piso: true,
              },
            },
          },
        },
        responsables: {
          include: {
            propietario: true,
            contratoResponsables: {
              include: {
                contrato: {
                  include: {
                    difunto: true,
                    boveda: {
                      include: { bloque: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!persona) throw new NotFoundException('Persona no encontrada');
    return persona;
  }

  async create(dto: UpdatePersonaDto, userId?: string) {
    return this.prisma.persona.create({
      data: {
        ...(dto as any),
        usuarioCreadorId: userId ?? null,
      },
    });
  }

  async update(id: number, dto: UpdatePersonaDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.persona.update({
      where: { id },
      data: {
        ...(dto as any),
        usuarioActualizadorId: userId ?? null,
        fechaActualizacion: new Date(),
      },
    });
  }

  async remove(id: number, userId?: string) {
    await this.findOne(id);
    return this.prisma.persona.update({
      where: { id },
      data: {
        estado: false,
        usuarioEliminadorId: userId ?? null,
        fechaEliminacion: new Date(),
      },
    });
  }

  async search(termino: string) {
    return this.prisma.persona.findMany({
      where: {
        estado: true,
        OR: [
          { nombre: { contains: termino, mode: 'insensitive' } },
          { apellido: { contains: termino, mode: 'insensitive' } },
          { numeroIdentificacion: { contains: termino, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }
}
