import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';
import {
  CreateBienDto,
  QueryBienDto,
  UpdateBienDto,
} from './dto/bien.dto';
import {
  BienConRelaciones,
  toBienListItem,
  toBienResponse,
} from './bien.mapper';

const BIEN_INCLUDE = {
  categoria: { select: { id: true, nombre: true } },
  custodio: { select: { id: true, nombre: true } },
} as const;

@Injectable()
export class BienService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Listado paginado (INV-R9)
  // ---------------------------------------------------------------------------
  async findAll(query: QueryBienDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const where: Prisma.BienWhereInput = {
      estado: true,
      ...(query.categoriaId !== undefined && { categoriaId: query.categoriaId }),
      ...(query.custodioId !== undefined && { custodioId: query.custodioId }),
      ...(query.ubicacion
        ? { ubicacion: { contains: query.ubicacion, mode: 'insensitive' } }
        : {}),
      ...(query.dadoDeBaja !== undefined && { dadoDeBaja: query.dadoDeBaja }),
      ...(search
        ? {
            OR: [
              { codigo: { contains: search, mode: 'insensitive' } },
              { descripcion: { contains: search, mode: 'insensitive' } },
              { serie: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.bien.findMany({
        where,
        include: BIEN_INCLUDE,
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bien.count({ where }),
    ]);

    return {
      items: items.map((b) => toBienListItem(b as BienConRelaciones)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ---------------------------------------------------------------------------
  // Detalle (ficha)
  // ---------------------------------------------------------------------------
  async findOne(id: number) {
    const bien = await this.findEntity(id);
    return toBienResponse(bien);
  }

  // ---------------------------------------------------------------------------
  // Alta (INV-R1, R5): crea Bien + MovimientoBien tipo 'alta' en una transacción
  // ---------------------------------------------------------------------------
  async create(dto: CreateBienDto, userId?: string) {
    await this.validarCategoria(dto.categoriaId);
    if (dto.custodioId !== undefined) {
      await this.validarCustodio(dto.custodioId);
    }

    if (dto.codigo) {
      const existente = await this.prisma.bien.findUnique({
        where: { codigo: dto.codigo.trim() },
        select: { id: true },
      });
      if (existente) {
        throw new ConflictException(
          `Ya existe un bien con el código ${dto.codigo.trim()}`,
        );
      }
    }

    const creado = await this.prisma.$transaction(async (tx) => {
      const codigo = dto.codigo?.trim()
        ? dto.codigo.trim()
        : await this.generarCodigoAtomic(tx);

      const bien = await tx.bien.create({
        data: {
          codigo,
          descripcion: dto.descripcion.trim(),
          marca: dto.marca?.trim() || null,
          modelo: dto.modelo?.trim() || null,
          serie: dto.serie?.trim() || null,
          fechaAdquisicion: new Date(dto.fechaAdquisicion),
          valorAdquisicion: new Prisma.Decimal(dto.valorAdquisicion),
          fuenteFinanciamiento: dto.fuenteFinanciamiento?.trim() || null,
          estadoConservacion: dto.estadoConservacion ?? 'bueno',
          ubicacion: dto.ubicacion?.trim() || null,
          valorResidual:
            dto.valorResidual !== undefined
              ? new Prisma.Decimal(dto.valorResidual)
              : null,
          vidaUtilMesesOverride: dto.vidaUtilMesesOverride ?? null,
          categoriaId: dto.categoriaId,
          custodioId: dto.custodioId ?? null,
          estado: true,
          usuarioCreadorId: userId ?? null,
        },
        include: BIEN_INCLUDE,
      });

      await tx.movimientoBien.create({
        data: {
          bienId: bien.id,
          tipo: 'alta',
          detalle: 'Registro inicial del bien',
          custodioNuevoId: bien.custodioId,
          ubicacionNueva: bien.ubicacion,
          usuarioCreadorId: userId ?? null,
        },
      });

      return bien;
    });

    return toBienResponse(creado as BienConRelaciones);
  }

  // ---------------------------------------------------------------------------
  // Edición de datos (no baja ni reasignación: tienen endpoints propios)
  // ---------------------------------------------------------------------------
  async update(id: number, dto: UpdateBienDto, userId?: string) {
    const bien = await this.findEntity(id);
    if (bien.dadoDeBaja) {
      throw new ConflictException(
        'No se puede editar un bien dado de baja; reactívelo primero',
      );
    }

    if (dto.categoriaId !== undefined) {
      await this.validarCategoria(dto.categoriaId);
    }

    const actualizado = await this.prisma.bien.update({
      where: { id },
      data: {
        ...(dto.descripcion !== undefined && {
          descripcion: dto.descripcion.trim(),
        }),
        ...(dto.marca !== undefined && { marca: dto.marca?.trim() || null }),
        ...(dto.modelo !== undefined && { modelo: dto.modelo?.trim() || null }),
        ...(dto.serie !== undefined && { serie: dto.serie?.trim() || null }),
        ...(dto.fechaAdquisicion !== undefined && {
          fechaAdquisicion: new Date(dto.fechaAdquisicion),
        }),
        ...(dto.valorAdquisicion !== undefined && {
          valorAdquisicion: new Prisma.Decimal(dto.valorAdquisicion),
        }),
        ...(dto.fuenteFinanciamiento !== undefined && {
          fuenteFinanciamiento: dto.fuenteFinanciamiento?.trim() || null,
        }),
        ...(dto.estadoConservacion !== undefined && {
          estadoConservacion: dto.estadoConservacion,
        }),
        ...(dto.ubicacion !== undefined && {
          ubicacion: dto.ubicacion?.trim() || null,
        }),
        ...(dto.valorResidual !== undefined && {
          valorResidual:
            dto.valorResidual !== null
              ? new Prisma.Decimal(dto.valorResidual)
              : null,
        }),
        ...(dto.vidaUtilMesesOverride !== undefined && {
          vidaUtilMesesOverride: dto.vidaUtilMesesOverride,
        }),
        ...(dto.categoriaId !== undefined && { categoriaId: dto.categoriaId }),
        fechaActualizacion: new Date(),
        usuarioActualizadorId: userId ?? null,
      },
      include: BIEN_INCLUDE,
    });

    return toBienResponse(actualizado as BienConRelaciones);
  }

  // ---------------------------------------------------------------------------
  // Eliminación lógica
  // ---------------------------------------------------------------------------
  async remove(id: number, userId?: string) {
    const bien = await this.findEntity(id);
    if (!bien.estado) {
      throw new ConflictException('El bien ya está inactivo');
    }
    const eliminado = await this.prisma.bien.update({
      where: { id },
      data: {
        estado: false,
        fechaEliminacion: new Date(),
        usuarioEliminadorId: userId ?? null,
      },
      include: BIEN_INCLUDE,
    });
    return toBienResponse(eliminado as BienConRelaciones);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private async findEntity(id: number): Promise<BienConRelaciones> {
    const bien = await this.prisma.bien.findFirst({
      where: { id, estado: true },
      include: BIEN_INCLUDE,
    });
    if (!bien) throw new NotFoundException('Bien no encontrado');
    return bien as BienConRelaciones;
  }

  private async validarCategoria(categoriaId: number) {
    const categoria = await this.prisma.categoriaBien.findFirst({
      where: { id: categoriaId, estado: true },
      select: { id: true },
    });
    if (!categoria) {
      throw new BadRequestException('La categoría indicada no existe o está inactiva');
    }
  }

  private async validarCustodio(custodioId: number) {
    const custodio = await this.prisma.custodio.findFirst({
      where: { id: custodioId, estado: true },
      select: { id: true },
    });
    if (!custodio) {
      throw new BadRequestException('El custodio indicado no existe o está inactivo');
    }
  }

  /**
   * Genera el código correlativo BN-YYYY-NNNN dentro de la transacción usando
   * un advisory lock para evitar colisiones bajo concurrencia (mismo patrón que
   * `contrato.service.ts`). Prohibido aggregate _max+1.
   */
  private async generarCodigoAtomic(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const pattern = `BN-${year}-`;

    const lockKey = this.advisoryLockKey(`bien:${year}`);
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockKey})`);

    const last = await tx.bien.findFirst({
      where: { codigo: { startsWith: pattern } },
      orderBy: { codigo: 'desc' },
      select: { codigo: true },
    });

    const next = last ? Number(last.codigo.split('-').pop() || '0') + 1 : 1;
    return `${pattern}${String(next).padStart(4, '0')}`;
  }

  private advisoryLockKey(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return hash;
  }
}
