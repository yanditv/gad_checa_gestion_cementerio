import {
  BadRequestException,
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
        pisos: { orderBy: { numero: 'asc' }, include: { bovedas: true } },
        bovedas: {
          include: {
            piso: true,
            propietario: { include: { persona: true } },
            contratos: {
              where: { estado: true },
              select: { id: true, fechaInicio: true, fechaFin: true, difunto: { select: { nombre: true, apellido: true } } },
            },
            difuntos: { where: { estado: true }, select: { id: true, nombre: true, apellido: true, fechaDefuncion: true } },
          },
        },
      },
    });
    if (!bloque) throw new NotFoundException('Bloque no encontrado');
    return bloque;
  }

  async create(dto: CreateBloqueDto, userId?: string) {
    const numeroPisos = dto.numeroPisos ?? 0;
    const bovedasPorPiso = dto.bovedasPorPiso ?? 0;
    const nombre = dto.nombre.trim();

    await this.ensureCementerioExists(dto.cementerioId);
    await this.ensureUniqueNombre(nombre, dto.cementerioId);

    return this.prisma.$transaction(async (tx) => {
      const bloque = await tx.bloque.create({
        data: {
          nombre,
          descripcion: dto.descripcion ?? null,
          tipo: dto.tipo ?? null,
          tarifaBase: dto.tarifaBase != null ? dto.tarifaBase : null,
          bovedasPorPiso,
          cementerioId: dto.cementerioId,
          estado: true,
          usuarioCreadorId: userId ?? null,
        },
      });

      if (numeroPisos > 0) {
        for (let pisoNum = 1; pisoNum <= numeroPisos; pisoNum++) {
          const precioPiso = dto.preciosPorPiso?.find(
            (p) => p.numeroPiso === pisoNum,
          )?.precio;

          const piso = await tx.piso.create({
            data: {
              numero: pisoNum,
              descripcion: `Piso ${pisoNum}`,
              precio: precioPiso != null ? precioPiso : null,
              bloqueId: bloque.id,
              estado: true,
            },
          });

          if (bovedasPorPiso > 0) {
            await tx.boveda.createMany({
              data: Array.from({ length: bovedasPorPiso }, (_, bIdx) => ({
                numero: `${pisoNum}-${bIdx + 1}`,
                capacidad: 1,
                tipo: dto.tipo === 'Nichos' ? 'Nicho' : 'Boveda',
                precio: dto.tarifaBase ?? 0,
                precioArrendamiento: dto.tarifaBase ?? 0,
                bloqueId: bloque.id,
                pisoId: piso.id,
                estado: true,
                usuarioCreadorId: userId ?? null,
              })),
            });
          }
        }
      }

      return tx.bloque.findUnique({
        where: { id: bloque.id },
        include: {
          cementerio: true,
          pisos: { orderBy: { numero: 'asc' } },
          bovedas: { where: { estado: true } },
        },
      });
    });
  }

  async update(id: number, dto: UpdateBloqueDto, userId?: string) {
    const actual = await this.findOne(id);

    if (dto.nombre !== undefined) {
      await this.ensureUniqueNombre(dto.nombre.trim(), actual.cementerioId, id);
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (dto.nombre !== undefined) updateData.nombre = dto.nombre.trim();
      if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion;
      if (dto.estado !== undefined) updateData.estado = dto.estado;
      if (dto.tipo !== undefined) updateData.tipo = dto.tipo;
      if (dto.tarifaBase !== undefined) updateData.tarifaBase = dto.tarifaBase;
      if (dto.bovedasPorPiso !== undefined) updateData.bovedasPorPiso = dto.bovedasPorPiso;
      updateData.usuarioActualizadorId = userId ?? null;

      await tx.bloque.update({ where: { id }, data: updateData });

      // ── Ajuste de numeroPisos ──────────────────────────────────
      const newNumeroPisos = dto.numeroPisos;
      if (newNumeroPisos !== undefined) {
        const pisosActuales = await tx.piso.findMany({
          where: { bloqueId: id, estado: true },
          orderBy: { numero: 'asc' },
          include: { bovedas: { include: { contratos: { where: { estado: true } } } } },
        });

        if (newNumeroPisos > pisosActuales.length) {
          // Aumentar pisos: crear los que faltan
          for (let p = pisosActuales.length + 1; p <= newNumeroPisos; p++) {
            const precioPiso = dto.preciosPorPiso?.find(
              (pp) => pp.numeroPiso === p,
            )?.precio;

            const piso = await tx.piso.create({
              data: {
                numero: p,
                descripcion: `Piso ${p}`,
                precio: precioPiso != null ? precioPiso : null,
                bloqueId: id,
                estado: true,
              },
            });

            const bovedasXPiso = dto.bovedasPorPiso ?? actual.bovedasPorPiso;
            if (bovedasXPiso > 0) {
              await tx.boveda.createMany({
                data: Array.from({ length: bovedasXPiso }, (_, bIdx) => ({
                  numero: `${p}-${bIdx + 1}`,
                  capacidad: 1,
                  tipo: dto.tipo ?? actual.tipo === 'Nichos' ? 'Nicho' : 'Boveda',
                  precio: dto.tarifaBase ?? actual.tarifaBase ?? 0,
                  precioArrendamiento: dto.tarifaBase ?? actual.tarifaBase ?? 0,
                  bloqueId: id,
                  pisoId: piso.id,
                  estado: true,
                  usuarioCreadorId: userId ?? null,
                })),
              });
            }
          }
        } else if (newNumeroPisos < pisosActuales.length) {
          // Reducir pisos: verificar contratos en los pisos a eliminar
          const pisosAEliminar = pisosActuales.filter(
            (p) => p.numero > newNumeroPisos,
          );

          for (const piso of pisosAEliminar) {
            const tieneContratos = piso.bovedas.some(
              (b) => b.contratos.length > 0,
            );
            if (tieneContratos) {
              throw new BadRequestException(
                `No se puede reducir: el piso ${piso.numero} tiene bóvedas con contratos activos`,
              );
            }
          }

          // Soft-delete bóvedas y pisos excedentes
          for (const piso of pisosAEliminar) {
            await tx.boveda.updateMany({
              where: { pisoId: piso.id },
              data: {
                estado: false,
                usuarioEliminadorId: userId ?? null,
              },
            });
            await tx.piso.update({
              where: { id: piso.id },
              data: { estado: false },
            });
          }
        }
      }

      // ── Actualizar precios por piso ────────────────────────────
      if (dto.preciosPorPiso) {
        for (const pp of dto.preciosPorPiso) {
          const pisoExistente = await tx.piso.findFirst({
            where: { bloqueId: id, numero: pp.numeroPiso },
          });
          if (pisoExistente) {
            await tx.piso.update({
              where: { id: pisoExistente.id },
              data: { precio: pp.precio != null ? pp.precio : null },
            });
          }
        }
      }

      return tx.bloque.findUnique({
        where: { id },
        include: {
          cementerio: true,
          pisos: { orderBy: { numero: 'asc' } },
          bovedas: { where: { estado: true } },
        },
      });
    });
  }

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
      select: { id: true, estado: true, tarifaArriendo: true },
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
