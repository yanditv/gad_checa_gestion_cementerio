import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  private normalizeDto(dto: UpdatePersonaDto): UpdatePersonaDto {
    const trimOrKeep = (value?: string | null) =>
      typeof value === 'string' ? value.trim() : undefined;
    const trimOrUndefined = (value?: string | null) => {
      const trimmed =
        typeof value === 'string' ? value.trim() : undefined;
      return trimmed ? trimmed : undefined;
    };

    return {
      ...dto,
      numeroIdentificacion: trimOrKeep(dto.numeroIdentificacion),
      nombre: trimOrKeep(dto.nombre),
      apellido: trimOrKeep(dto.apellido),
      telefono: trimOrUndefined(dto.telefono),
      email: trimOrUndefined(dto.email),
      direccion: trimOrUndefined(dto.direccion),
      tipoIdentificacion: trimOrKeep(dto.tipoIdentificacion),
      genero: trimOrUndefined(dto.genero),
      estadoCivil: trimOrUndefined(dto.estadoCivil),
      profesion: trimOrUndefined(dto.profesion),
      nacionalidad: trimOrUndefined(dto.nacionalidad),
      tipoPersona: trimOrKeep(dto.tipoPersona),
      fechaNacimiento: dto.fechaNacimiento
        ? new Date(dto.fechaNacimiento).toISOString()
        : dto.fechaNacimiento,
    };
  }

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
    const normalizedDto = this.normalizeDto(dto);
    await this.assertIdentificacionDisponible({
      numeroIdentificacion: normalizedDto.numeroIdentificacion,
      tipoPersona: normalizedDto.tipoPersona,
    });

    try {
      return await this.prisma.persona.create({
        data: {
          ...(normalizedDto as Prisma.PersonaUncheckedCreateInput),
          usuarioCreadorId: userId ?? null,
        },
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async update(id: number, dto: UpdatePersonaDto, userId?: string) {
    const actual = await this.findOne(id);
    const normalizedDto = this.normalizeDto(dto);
    await this.assertIdentificacionDisponible({
      numeroIdentificacion:
        normalizedDto.numeroIdentificacion ?? actual.numeroIdentificacion,
      tipoPersona: normalizedDto.tipoPersona ?? actual.tipoPersona,
      excludeId: id,
    });

    try {
      return await this.prisma.persona.update({
        where: { id },
        data: {
          ...(normalizedDto as Prisma.PersonaUncheckedUpdateInput),
          usuarioActualizadorId: userId ?? null,
          fechaActualizacion: new Date(),
        },
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
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

  private handlePrismaError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException(
        'Ya existe una persona con esa identificación',
      );
    }
    throw err;
  }

  private async assertIdentificacionDisponible(params: {
    numeroIdentificacion?: string | null;
    tipoPersona?: string | null;
    excludeId?: number;
  }) {
    const numeroIdentificacion = params.numeroIdentificacion?.trim();
    if (!numeroIdentificacion) return;

    const tipoPersona = params.tipoPersona?.trim() || 'Persona';
    const existente = await this.prisma.persona.findFirst({
      where: {
        numeroIdentificacion,
        tipoPersona,
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      },
      select: { estado: true },
    });

    if (!existente) return;

    throw new ConflictException(
      existente.estado
        ? 'Ya existe una persona activa con esa identificación'
        : 'Ya existe una persona inactiva con esa identificación',
    );
  }
}
