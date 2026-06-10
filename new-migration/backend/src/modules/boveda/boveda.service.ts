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
import { CreateBovedaDto, UpdateBovedaDto } from './dto/request/boveda.dto';

interface BovedaFilters {
  bloqueId?: number;
  tipoEspacioId?: number;
  estado?: string; // 'disponible' | 'ocupada'
  tienePropietario?: string; // 'con' | 'sin'
}

@Injectable()
export class BovedaService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto, filters?: BovedaFilters) {
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
      ...(filters?.bloqueId ? { bloqueId: filters.bloqueId } : {}),
      ...(filters?.tipoEspacioId
        ? { tipoEspacioId: filters.tipoEspacioId }
        : {}),
      ...(filters?.tienePropietario === 'con'
        ? { propietarioId: { not: null } }
        : {}),
      ...(filters?.tienePropietario === 'sin'
        ? { propietarioId: null }
        : {}),
    };

    // El filtro de estado (disponible/ocupada) se aplica post-query
    // porque depende de contratos activos, no del campo estado
    let estadoFilter: ((b: any) => boolean) | null = null;
    if (filters?.estado === 'disponible') {
      estadoFilter = (b: any) => !b.contratos?.length;
    } else if (filters?.estado === 'ocupada') {
      estadoFilter = (b: any) => (b.contratos?.length ?? 0) > 0;
    }

    const [allItems, total] = await this.prisma.$transaction([
      this.prisma.boveda.findMany({
        where,
        include: {
          bloque: { include: { cementerio: true } },
          piso: true,
          tipoEspacio: true,
          propietario: { include: { persona: true } },
          contratos: {
            where: {
              estado: true,
              fechaInicio: { lte: new Date() },
              OR: [
                { fechaFin: null },
                { fechaFin: { gte: new Date() } },
              ],
            },
            select: { id: true, numeroSecuencial: true },
          },
        },
        orderBy: { fechaCreacion: 'desc' },
        skip: estadoFilter ? undefined : skip,
        take: estadoFilter ? undefined : limit,
      }),
      this.prisma.boveda.count({ where }),
    ]);

    // Aplicar filtro de estado post-query (necesita datos de contratos)
    const filtered = estadoFilter ? allItems.filter(estadoFilter) : allItems;
    const totalFiltered = estadoFilter ? filtered.length : total;

    // Re-paginar si aplicamos filtro post-query
    const items = estadoFilter
      ? filtered.slice(skip, skip + limit)
      : filtered;

    return {
      items,
      meta: buildPaginationMeta(page, limit, totalFiltered),
    };
  }

  async findByBloque(bloqueId: number) {
    return this.prisma.boveda.findMany({
      where: { bloqueId, estado: true },
      include: { piso: true, tipoEspacio: true },
    });
  }

  async findOne(id: number) {
    const boveda = await this.prisma.boveda.findUnique({
      where: { id },
      include: {
        bloque: { include: { cementerio: true } },
        piso: true,
        tipoEspacio: true,
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

  async create(dto: CreateBovedaDto, userId?: string) {
    const bloqueId = this.requireInt(dto.bloqueId, 'Debe seleccionar un bloque');
    await this.ensureBloqueActivo(bloqueId);
    const tipoEspacioId = this.requireInt(
      dto.tipoEspacioId,
      'Debe seleccionar un tipo de espacio',
    );
    const tipoEspacio = await this.ensureTipoEspacioActivo(tipoEspacioId);
    const numero = this.normalizeNumero(dto.numero);
    await this.ensureUniqueNumero(numero, bloqueId);

    return this.prisma.boveda.create({
      data: {
        numero,
        capacidad: dto.capacidad,
        tipoEspacioId,
        // Espejo del nombre del catálogo en la columna legada `tipo`,
        // que se mantiene hasta el DROP manual posterior.
        tipo: tipoEspacio.nombre,
        precio: dto.precio ?? 0,
        precioArrendamiento: dto.precioArrendamiento ?? 0,
        bloqueId,
        pisoId: dto.pisoId ?? null,
        ubicacion: dto.ubicacion ?? null,
        observaciones: dto.observaciones ?? null,
        estado: dto.estado ?? true,
        usuarioCreadorId: userId ?? null,
      },
      include: { tipoEspacio: true },
    });
  }

  async update(id: number, dto: UpdateBovedaDto, userId?: string) {
    const actual = await this.findOne(id);

    const bloqueId = dto.bloqueId ?? actual.bloqueId;
    await this.ensureBloqueActivo(bloqueId);

    if (dto.numero !== undefined) {
      await this.ensureUniqueNumero(this.normalizeNumero(dto.numero), bloqueId, id);
    }

    // Resolver tipo de espacio (si cambia) y reflejar su nombre en la
    // columna legada `tipo` mientras esta exista.
    let tipoEspacioData: { tipoEspacioId: number; tipo: string } | undefined;
    if (dto.tipoEspacioId !== undefined) {
      const tipoEspacio = await this.ensureTipoEspacioActivo(dto.tipoEspacioId);
      tipoEspacioData = {
        tipoEspacioId: tipoEspacio.id,
        tipo: tipoEspacio.nombre,
      };
    }

    return this.prisma.boveda.update({
      where: { id },
      data: {
        ...(dto.numero !== undefined ? { numero: this.normalizeNumero(dto.numero) } : {}),
        ...(dto.capacidad !== undefined ? { capacidad: dto.capacidad } : {}),
        ...(tipoEspacioData ?? {}),
        ...(dto.estado !== undefined ? { estado: dto.estado } : {}),
        ...(dto.precio !== undefined ? { precio: dto.precio } : {}),
        ...(dto.precioArrendamiento !== undefined ? { precioArrendamiento: dto.precioArrendamiento } : {}),
        ...(dto.bloqueId !== undefined ? { bloqueId: dto.bloqueId } : {}),
        ...(dto.pisoId !== undefined ? { pisoId: dto.pisoId } : {}),
        ...(dto.ubicacion !== undefined ? { ubicacion: dto.ubicacion ?? null } : {}),
        ...(dto.observaciones !== undefined ? { observaciones: dto.observaciones ?? null } : {}),
        usuarioActualizadorId: userId ?? null,
      },
      include: { tipoEspacio: true },
    });
  }

  async remove(id: number, userId?: string) {
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
      data: {
        estado: false,
        usuarioEliminadorId: userId ?? null,
      },
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
  async setPropietario(bovedaId: number, personaId: number | null, userId?: string) {
    const boveda = await this.prisma.boveda.findUnique({
      where: { id: bovedaId },
    });
    if (!boveda) throw new NotFoundException('Bóveda no encontrada');

    if (personaId === null) {
      return this.prisma.boveda.update({
        where: { id: bovedaId },
        data: {
          propietarioId: null,
          usuarioActualizadorId: userId ?? null,
        },
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

    let propietario = await this.prisma.propietario.findFirst({
      where: { personaId },
    });
    if (!propietario) {
      propietario = await this.prisma.propietario.create({
        data: {
          personaId,
          estado: true,
        },
      });
    } else if (!propietario.estado) {
      throw new ConflictException(
        'El propietario está inactivo. Reactívalo desde el módulo de personas primero.',
      );
    }

    return this.prisma.boveda.update({
      where: { id: bovedaId },
      data: {
        propietarioId: propietario.id,
        usuarioActualizadorId: userId ?? null,
      },
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

  private async ensureTipoEspacioActivo(tipoEspacioId: number) {
    const tipoEspacio = await this.prisma.tipoEspacio.findUnique({
      where: { id: tipoEspacioId },
      select: { id: true, nombre: true, estado: true },
    });
    if (!tipoEspacio) {
      throw new BadRequestException('El tipo de espacio seleccionado no existe');
    }
    if (!tipoEspacio.estado) {
      throw new BadRequestException(
        'El tipo de espacio seleccionado está inactivo',
      );
    }
    return tipoEspacio;
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
