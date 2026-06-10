import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';
import { UpdateBovedaDto } from './dto/request/update-boveda.dto';

@Injectable()
export class BovedaService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const where: any = {
      estado: true,
      ...(search
        ? {
            OR: [
              { numero: { contains: search, mode: 'insensitive' } },
              { tipo: { contains: search, mode: 'insensitive' } },
              {
                propietario: {
                  is: {
                    persona: {
                      is: {
                        OR: [
                          { nombre: { contains: search, mode: 'insensitive' } },
                          { apellido: { contains: search, mode: 'insensitive' } },
                          {
                            numeroIdentificacion: {
                              contains: search,
                              mode: 'insensitive',
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                bloque: {
                  is: { nombre: { contains: search, mode: 'insensitive' } },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.boveda.findMany({
        where,
        include: {
          bloque: { include: { cementerio: true } },
          piso: true,
          propietario: { include: { persona: true } },
          contratos: {
            where: { estado: true },
            select: { id: true, numeroSecuencial: true },
          },
        },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.boveda.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByBloque(bloqueId: number) {
    return this.prisma.boveda.findMany({
      where: { bloqueId, estado: true },
      include: { piso: true },
    });
  }

  async findOne(id: number) {
    const boveda = await this.prisma.boveda.findUnique({
      where: { id },
      include: {
        bloque: { include: { cementerio: true } },
        piso: true,
        propietario: { include: { persona: true } },
        difuntos: { where: { estado: true, exhumado: false } },
        contratos: {
          where: { estado: true },
          include: {
            difunto: true,
            responsables: {
              include: { responsable: { include: { persona: true } } },
            },
          },
        },
      },
    });
    if (!boveda) throw new NotFoundException('Bóveda no encontrada');
    return boveda;
  }

  async create(dto: UpdateBovedaDto) {
    const bloqueId = this.requireInt(dto.bloqueId, 'Debe seleccionar un bloque');
    await this.ensureBloqueActivo(bloqueId);
    const numero = this.normalizeNumero(dto.numero);
    await this.ensureUniqueNumero(numero, bloqueId);

    return this.prisma.boveda.create({
      data: {
        ...(dto as Prisma.BovedaUncheckedCreateInput),
        numero,
        bloqueId,
        ubicacion: dto.ubicacion ?? null,
        observaciones: dto.observaciones ?? null,
      },
    });
  }

  async update(id: number, dto: UpdateBovedaDto) {
    const actual = await this.findOne(id);

    const bloqueId = dto.bloqueId ?? actual.bloqueId;
    await this.ensureBloqueActivo(bloqueId);

    if (dto.numero !== undefined) {
      await this.ensureUniqueNumero(this.normalizeNumero(dto.numero), bloqueId, id);
    }

    return this.prisma.boveda.update({
      where: { id },
      data: {
        ...(dto as Prisma.BovedaUncheckedUpdateInput),
        ...(dto.numero !== undefined ? { numero: this.normalizeNumero(dto.numero) } : {}),
        ...(dto.ubicacion !== undefined ? { ubicacion: dto.ubicacion ?? null } : {}),
        ...(dto.observaciones !== undefined ? { observaciones: dto.observaciones ?? null } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    const today = new Date();
    const contratosActivos = await this.prisma.contrato.count({
      where: {
        bovedaId: id,
        estado: true,
        OR: [{ fechaFin: null }, { fechaFin: { gte: today } }],
      },
    });
    if (contratosActivos > 0) {
      throw new ConflictException(
        'No se puede eliminar la bóveda porque tiene contratos activos',
      );
    }
    return this.prisma.boveda.update({
      where: { id },
      data: { estado: false },
    });
  }

  // ---------------------------------------------------------------------------
  // Asignación de propietario
  // ---------------------------------------------------------------------------

  /**
   * Asigna o quita el propietario de una bóveda.
   *   personaId === null  → quita el propietario actual.
   *   personaId === number → asigna; si la persona no es Propietario aún,
   *                          se crea la fila correspondiente.
   */
  async setPropietario(bovedaId: number, personaId: number | null) {
    const boveda = await this.prisma.boveda.findUnique({
      where: { id: bovedaId },
    });
    if (!boveda) throw new NotFoundException('Bóveda no encontrada');

    if (personaId === null) {
      return this.prisma.boveda.update({
        where: { id: bovedaId },
        data: { propietarioId: null },
        include: { propietario: { include: { persona: true } } },
      });
    }

    const persona = await this.prisma.persona.findUnique({
      where: { id: personaId },
    });
    if (!persona || !persona.estado) {
      throw new BadRequestException(
        'La persona seleccionada no existe o está inactiva',
      );
    }

    // Buscar/crear el Propietario asociado a esta persona.
    let propietario = await this.prisma.propietario.findFirst({
      where: { personaId },
    });
    if (!propietario) {
      propietario = await this.prisma.propietario.create({
        data: { personaId, estado: true },
      });
    } else if (!propietario.estado) {
      throw new ConflictException(
        'El propietario está inactivo. Reactívalo desde el módulo de personas primero.',
      );
    }

    return this.prisma.boveda.update({
      where: { id: bovedaId },
      data: { propietarioId: propietario.id },
      include: { propietario: { include: { persona: true } } },
    });
  }

  // ---------------------------------------------------------------------------
  // Histórico de la bóveda
  // ---------------------------------------------------------------------------

  /**
   * Línea de tiempo de la bóveda: todos los contratos (activos e
   * inactivos) ordenados por fechaInicio descendente. Útil para el
   * detalle/historial.
   */
  async findHistorial(id: number) {
    const boveda = await this.prisma.boveda.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!boveda) throw new NotFoundException('Bóveda no encontrada');

    return this.prisma.contrato.findMany({
      where: { bovedaId: id },
      include: {
        difunto: true,
        responsables: {
          include: { responsable: { include: { persona: true } } },
        },
        cuotas: true,
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  private normalizeNumero(numero?: string) {
    const normalized = (numero || '').trim();
    if (!normalized) {
      throw new BadRequestException('El número de la bóveda es obligatorio');
    }
    return normalized;
  }

  private requireInt(value: number | undefined, message: string) {
    if (!value || !Number.isInteger(Number(value))) {
      throw new BadRequestException(message);
    }
    return Number(value);
  }

  private async ensureBloqueActivo(bloqueId: number) {
    const bloque = await this.prisma.bloque.findUnique({
      where: { id: bloqueId },
      select: { id: true, estado: true },
    });
    if (!bloque) {
      throw new BadRequestException('El bloque seleccionado no existe');
    }
    if (!bloque.estado) {
      throw new BadRequestException('El bloque seleccionado está inactivo');
    }
  }

  private async ensureUniqueNumero(numero: string, bloqueId: number, excludeId?: number) {
    const existing = await this.prisma.boveda.findFirst({
      where: {
        bloqueId,
        numero: { equals: numero, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una bóveda con ese número en el bloque seleccionado',
      );
    }
  }
}
