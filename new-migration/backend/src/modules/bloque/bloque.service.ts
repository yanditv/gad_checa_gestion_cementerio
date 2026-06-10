import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';
import { CreateBloqueDto, UpdateBloqueDto } from './dto/bloque.dto';

@Injectable()
export class BloqueService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const where: any = {
      estado: true,
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { descripcion: { contains: search, mode: 'insensitive' } },
              {
                cementerio: {
                  is: { nombre: { contains: search, mode: 'insensitive' } },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.bloque.findMany({
        where,
        include: {
          cementerio: true,
          pisos: { orderBy: { numero: 'asc' } },
          bovedas: { where: { estado: true } },
        },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bloque.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByCementerio(cementerioId: number) {
    return this.prisma.bloque.findMany({
      where: { cementerioId, estado: true },
      include: {
        pisos: { orderBy: { numero: 'asc' } },
        bovedas: { where: { estado: true } },
      },
    });
  }

  async findOne(id: number) {
    const bloque = await this.prisma.bloque.findUnique({
      where: { id },
      include: {
        cementerio: true,
        pisos: { orderBy: { numero: 'asc' } },
        bovedas: { include: { piso: true } },
      },
    });
    if (!bloque) throw new NotFoundException('Bloque no encontrado');
    return bloque;
  }

  /**
   * Crea el bloque y opcionalmente autogenera N pisos numerados 1..N.
   * Operación transaccional: si falla la creación de pisos, no queda un
   * bloque huérfano. Paridad con el flujo legado de creación de bloque.
   */
  async create(dto: CreateBloqueDto, userId?: string) {
    const numeroPisos = dto.numeroPisos ?? 0;
    const nombre = dto.nombre.trim();

    await this.ensureCementerioExists(dto.cementerioId);
    await this.ensureUniqueNombre(nombre, dto.cementerioId);

    return this.prisma.$transaction(async (tx) => {
      const bloque = await tx.bloque.create({
        data: {
          nombre,
          descripcion: dto.descripcion ?? null,
          cementerioId: dto.cementerioId,
          estado: true,
          usuarioCreadorId: userId ?? null,
        },
      });

      if (numeroPisos > 0) {
        await tx.piso.createMany({
          data: Array.from({ length: numeroPisos }, (_, idx) => ({
            numero: idx + 1,
            descripcion: `Piso ${idx + 1}`,
            bloqueId: bloque.id,
            estado: true,
          })),
        });
      }

      return tx.bloque.findUnique({
        where: { id: bloque.id },
        include: {
          cementerio: true,
          pisos: { orderBy: { numero: 'asc' } },
        },
      });
    });
  }

  async update(id: number, dto: UpdateBloqueDto, userId?: string) {
    const actual = await this.findOne(id);

    if (dto.nombre !== undefined) {
      await this.ensureUniqueNombre(dto.nombre.trim(), actual.cementerioId, id);
    }

    return this.prisma.bloque.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        usuarioActualizadorId: userId ?? null,
      },
    });
  }

  /**
   * Eliminación lógica con validación de integridad:
   * un bloque con bóvedas activas NO se puede eliminar — el operador debe
   * primero desactivar/migrar las bóvedas.
   */
  async remove(id: number, userId?: string) {
    const bloque = await this.findOne(id);
    if (!bloque.estado) {
      throw new ConflictException('El bloque ya está inactivo');
    }
    const bovedasActivas = await this.prisma.boveda.count({
      where: { bloqueId: id, estado: true },
    });
    if (bovedasActivas > 0) {
      throw new ConflictException(
        `No se puede eliminar: el bloque tiene ${bovedasActivas} bóveda(s) activa(s). Desactívalas primero.`,
      );
    }
    return this.prisma.bloque.update({
      where: { id },
      data: {
        estado: false,
        usuarioEliminadorId: userId ?? null,
      },
    });
  }

  private async ensureCementerioExists(cementerioId: number) {
    const cementerio = await this.prisma.cementerio.findUnique({
      where: { id: cementerioId },
      select: { id: true, estado: true },
    });
    if (!cementerio) {
      throw new NotFoundException('El cementerio seleccionado no existe');
    }
    if (!cementerio.estado) {
      throw new ConflictException('El cementerio seleccionado está inactivo');
    }
  }

  private async ensureUniqueNombre(
    nombre: string,
    cementerioId: number,
    excludeId?: number,
  ) {
    const existing = await this.prisma.bloque.findFirst({
      where: {
        cementerioId,
        nombre: { equals: nombre, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un bloque con ese nombre en el cementerio seleccionado',
      );
    }
  }
}
