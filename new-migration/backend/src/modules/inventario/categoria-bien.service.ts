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
import {
  CreateCategoriaBienDto,
  UpdateCategoriaBienDto,
} from './dto/categoria-bien.dto';
import { toCategoriaBienResponse } from './categoria-bien.mapper';

@Injectable()
export class CategoriaBienService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const categorias = await this.prisma.categoriaBien.findMany({
      where: includeInactive ? undefined : { estado: true },
      orderBy: [{ estado: 'desc' }, { nombre: 'asc' }],
    });
    return categorias.map(toCategoriaBienResponse);
  }

  async findPage(query: PaginationQueryDto, includeInactive = false) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const where: Prisma.CategoriaBienWhereInput = {
      ...(includeInactive ? {} : { estado: true }),
      ...(search
        ? { nombre: { contains: search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.categoriaBien.findMany({
        where,
        orderBy: [{ estado: 'desc' }, { nombre: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.categoriaBien.count({ where }),
    ]);

    return {
      items: items.map(toCategoriaBienResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number) {
    const categoria = await this.findEntity(id);
    return toCategoriaBienResponse(categoria);
  }

  async create(dto: CreateCategoriaBienDto, userId?: string) {
    await this.assertNombreUnico(dto.nombre);
    const creada = await this.prisma.categoriaBien.create({
      data: {
        nombre: dto.nombre.trim(),
        vidaUtilAnios: dto.vidaUtilAnios,
        ...(dto.valorResidualPct !== undefined && {
          valorResidualPct: dto.valorResidualPct,
        }),
        estado: true,
        usuarioCreadorId: userId ?? null,
      },
    });
    return toCategoriaBienResponse(creada);
  }

  async update(id: number, dto: UpdateCategoriaBienDto, userId?: string) {
    await this.findEntity(id);
    if (dto.nombre !== undefined) {
      await this.assertNombreUnico(dto.nombre, id);
    }
    const actualizada = await this.prisma.categoriaBien.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.vidaUtilAnios !== undefined && {
          vidaUtilAnios: dto.vidaUtilAnios,
        }),
        ...(dto.valorResidualPct !== undefined && {
          valorResidualPct: dto.valorResidualPct,
        }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        usuarioActualizadorId: userId ?? null,
      },
    });
    return toCategoriaBienResponse(actualizada);
  }

  async remove(id: number, userId?: string) {
    const categoria = await this.findEntity(id);
    if (!categoria.estado) {
      throw new ConflictException('La categoría ya está inactiva');
    }
    const eliminada = await this.prisma.categoriaBien.update({
      where: { id },
      data: {
        estado: false,
        fechaEliminacion: new Date(),
        usuarioEliminadorId: userId ?? null,
      },
    });
    return toCategoriaBienResponse(eliminada);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async findEntity(id: number) {
    const categoria = await this.prisma.categoriaBien.findUnique({
      where: { id },
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');
    return categoria;
  }

  private async assertNombreUnico(nombre: string, exceptId?: number) {
    const existente = await this.prisma.categoriaBien.findFirst({
      where: {
        nombre: { equals: nombre.trim(), mode: 'insensitive' },
        ...(exceptId !== undefined && { id: { not: exceptId } }),
      },
      select: { id: true },
    });
    if (existente) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
  }
}
