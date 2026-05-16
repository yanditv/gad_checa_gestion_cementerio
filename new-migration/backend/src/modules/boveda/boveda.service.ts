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
        difuntos: { where: { estado: true } },
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
    return this.prisma.boveda.create({ data: dto as Prisma.BovedaUncheckedCreateInput });
  }

  async update(id: number, dto: UpdateBovedaDto) {
    await this.findOne(id);
    return this.prisma.boveda.update({ where: { id }, data: dto as Prisma.BovedaUncheckedUpdateInput });
  }

  async remove(id: number) {
    await this.findOne(id);
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
}
