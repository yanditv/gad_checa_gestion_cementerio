import {
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
import { CreateCustodioDto, UpdateCustodioDto } from './dto/custodio.dto';
import { toCustodioResponse } from './custodio.mapper';

@Injectable()
export class CustodioService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const custodios = await this.prisma.custodio.findMany({
      where: includeInactive ? undefined : { estado: true },
      orderBy: [{ estado: 'desc' }, { nombre: 'asc' }],
    });
    return custodios.map(toCustodioResponse);
  }

  async findPage(query: PaginationQueryDto, includeInactive = false) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const where: Prisma.CustodioWhereInput = {
      ...(includeInactive ? {} : { estado: true }),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { identificacion: { contains: search, mode: 'insensitive' } },
              { cargo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.custodio.findMany({
        where,
        orderBy: [{ estado: 'desc' }, { nombre: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.custodio.count({ where }),
    ]);

    return {
      items: items.map(toCustodioResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number) {
    const custodio = await this.findEntity(id);
    return toCustodioResponse(custodio);
  }

  async create(dto: CreateCustodioDto, userId?: string) {
    const creado = await this.prisma.custodio.create({
      data: {
        nombre: dto.nombre.trim(),
        identificacion: dto.identificacion?.trim() || null,
        cargo: dto.cargo?.trim() || null,
        estado: true,
        usuarioCreadorId: userId ?? null,
      },
    });
    return toCustodioResponse(creado);
  }

  async update(id: number, dto: UpdateCustodioDto, userId?: string) {
    await this.findEntity(id);
    const actualizado = await this.prisma.custodio.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.identificacion !== undefined && {
          identificacion: dto.identificacion?.trim() || null,
        }),
        ...(dto.cargo !== undefined && { cargo: dto.cargo?.trim() || null }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        usuarioActualizadorId: userId ?? null,
      },
    });
    return toCustodioResponse(actualizado);
  }

  async remove(id: number, userId?: string) {
    const custodio = await this.findEntity(id);
    if (!custodio.estado) {
      throw new ConflictException('El custodio ya está inactivo');
    }
    const eliminado = await this.prisma.custodio.update({
      where: { id },
      data: {
        estado: false,
        fechaEliminacion: new Date(),
        usuarioEliminadorId: userId ?? null,
      },
    });
    return toCustodioResponse(eliminado);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async findEntity(id: number) {
    const custodio = await this.prisma.custodio.findUnique({ where: { id } });
    if (!custodio) throw new NotFoundException('Custodio no encontrado');
    return custodio;
  }
}
