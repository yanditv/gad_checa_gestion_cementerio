import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PhotoService } from '../../common/storage/photo.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';
import { CreateDifuntoDto, UpdateDifuntoDto } from './dto/difunto.dto';

@Injectable()
export class DifuntoService {
  constructor(
    private prisma: PrismaService,
    private photos: PhotoService,
  ) {}

  /**
   * Reemplaza `fotoStorageKey` por `fotoUrl` (ruta de servido) en la respuesta,
   * de modo que nunca se expone la key cruda de almacenamiento.
   */
  private withFotoUrl<T extends { id: number; fotoStorageKey?: string | null }>(
    difunto: T,
  ): Omit<T, 'fotoStorageKey'> & { fotoUrl: string | null } {
    const { fotoStorageKey, ...rest } = difunto;
    return {
      ...rest,
      fotoUrl: fotoStorageKey ? `/difuntos/${difunto.id}/foto` : null,
    };
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const where: any = {
      estado: true,
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { apellido: { contains: search, mode: 'insensitive' } },
              {
                numeroIdentificacion: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                boveda: {
                  is: {
                    OR: [
                      { numero: { contains: search, mode: 'insensitive' } },
                      {
                        bloque: {
                          is: {
                            nombre: { contains: search, mode: 'insensitive' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.difunto.findMany({
        where,
        include: {
          boveda: {
            include: { bloque: { include: { cementerio: true } } },
          },
        },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.difunto.count({ where }),
    ]);

    return {
      items: items.map((d) => this.withFotoUrl(d)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByBoveda(bovedaId: number) {
    // Excluye difuntos exhumados: la plaza queda liberada (CAT-R4c).
    const items = await this.prisma.difunto.findMany({
      where: { bovedaId, estado: true, exhumado: false },
    });
    return items.map((d) => this.withFotoUrl(d));
  }

  async findOne(id: number) {
    const difunto = await this.prisma.difunto.findUnique({
      where: { id },
      include: {
        boveda: {
          include: {
            bloque: { include: { cementerio: true } },
            piso: true,
          },
        },
        contratos: {
          where: { estado: true },
          include: {
            responsables: {
              include: { responsable: { include: { persona: true } } },
            },
          },
        },
      },
    });
    if (!difunto) throw new NotFoundException('Difunto no encontrado');
    return this.withFotoUrl(difunto);
  }

  async create(dto: CreateDifuntoDto, userId?: string) {
    await this.assertBovedaExists(dto.bovedaId);
    this.assertFechas(dto.fechaNacimiento, dto.fechaDefuncion);

    const creado = await this.prisma.difunto.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        numeroIdentificacion: dto.numeroIdentificacion ?? null,
        bovedaId: dto.bovedaId,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
        fechaDefuncion: dto.fechaDefuncion ? new Date(dto.fechaDefuncion) : null,
        fechaInhumacion: dto.fechaInhumacion ? new Date(dto.fechaInhumacion) : null,
        causaMuerte: dto.causaMuerte ?? null,
        observaciones: dto.observaciones ?? null,
        genero: dto.genero ?? null,
        edad: computeEdad(dto.fechaNacimiento, dto.fechaDefuncion),

        nacionalidad: dto.nacionalidad ?? null,
        estadoCivil: dto.estadoCivil ?? null,
        lugarNacimiento: dto.lugarNacimiento ?? null,
        lugarDefuncion: dto.lugarDefuncion ?? null,
        nombreConyuge: dto.nombreConyuge ?? null,
        nombrePadre: dto.nombrePadre ?? null,
        nombreMadre: dto.nombreMadre ?? null,

        numeroCertificadoDefuncion: dto.numeroCertificadoDefuncion ?? null,
        entidadEmisora: dto.entidadEmisora ?? null,
        fechaEmisionCertificado: dto.fechaEmisionCertificado
          ? new Date(dto.fechaEmisionCertificado)
          : null,

        estado: true,
        usuarioCreadorId: userId ?? null,
      },
    });
    return this.withFotoUrl(creado);
  }

  async update(id: number, dto: UpdateDifuntoDto, userId?: string) {
    const actual = await this.findOne(id);
    if (dto.bovedaId !== undefined) {
      await this.assertBovedaExists(dto.bovedaId);
    }

    const fechaNac =
      dto.fechaNacimiento !== undefined
        ? dto.fechaNacimiento
        : actual.fechaNacimiento?.toISOString();
    const fechaDef =
      dto.fechaDefuncion !== undefined
        ? dto.fechaDefuncion
        : actual.fechaDefuncion?.toISOString();
    this.assertFechas(fechaNac, fechaDef);

    const data: any = { ...dto, usuarioActualizadorId: userId ?? null };
    // Convertir fechas string → Date
    for (const k of [
      'fechaNacimiento',
      'fechaDefuncion',
      'fechaInhumacion',
      'fechaEmisionCertificado',
    ] as const) {
      if (dto[k] !== undefined) {
        data[k] = dto[k] ? new Date(dto[k] as string) : null;
      }
    }
    // Recalcular edad si cambió alguna fecha relevante
    if (dto.fechaNacimiento !== undefined || dto.fechaDefuncion !== undefined) {
      data.edad = computeEdad(fechaNac, fechaDef);
    }

    const actualizado = await this.prisma.difunto.update({
      where: { id },
      data,
    });
    return this.withFotoUrl(actualizado);
  }

  async remove(id: number, userId?: string) {
    await this.findOne(id);
    const eliminado = await this.prisma.difunto.update({
      where: { id },
      data: {
        estado: false,
        usuarioEliminadorId: userId ?? null,
      },
    });
    return this.withFotoUrl(eliminado);
  }

  // ---------------------------------------------------------------------------
  // Foto del difunto (opcional). La imagen vive en StorageService; en BD solo
  // guardamos la `fotoStorageKey`.
  // ---------------------------------------------------------------------------
  async uploadFoto(id: number, file: Express.Multer.File, userId?: string) {
    const actual = await this.prisma.difunto.findUnique({
      where: { id },
      select: { id: true, fotoStorageKey: true },
    });
    if (!actual) throw new NotFoundException('Difunto no encontrado');

    const key = await this.photos.store('difuntos', id, file);

    const actualizado = await this.prisma.difunto.update({
      where: { id },
      data: { fotoStorageKey: key, usuarioActualizadorId: userId ?? null },
    });

    if (actual.fotoStorageKey && actual.fotoStorageKey !== key) {
      try {
        await this.photos.remove(actual.fotoStorageKey);
      } catch {
        // el registro ya apunta a la nueva; el huérfano no es crítico
      }
    }

    return this.withFotoUrl(actualizado);
  }

  async getFoto(id: number) {
    const difunto = await this.prisma.difunto.findUnique({
      where: { id },
      select: { fotoStorageKey: true },
    });
    if (
      !difunto?.fotoStorageKey ||
      !(await this.photos.exists(difunto.fotoStorageKey))
    ) {
      throw new NotFoundException('El difunto no tiene foto');
    }
    return this.photos.streamFor(difunto.fotoStorageKey);
  }

  async removeFoto(id: number, userId?: string) {
    const difunto = await this.prisma.difunto.findUnique({
      where: { id },
      select: { id: true, fotoStorageKey: true },
    });
    if (!difunto) throw new NotFoundException('Difunto no encontrado');
    if (!difunto.fotoStorageKey) {
      throw new NotFoundException('El difunto no tiene foto');
    }
    const key = difunto.fotoStorageKey;

    const actualizado = await this.prisma.difunto.update({
      where: { id },
      data: { fotoStorageKey: null, usuarioActualizadorId: userId ?? null },
    });

    try {
      await this.photos.remove(key);
    } catch {
      // best-effort
    }

    return this.withFotoUrl(actualizado);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async assertBovedaExists(bovedaId: number) {
    const boveda = await this.prisma.boveda.findUnique({
      where: { id: bovedaId },
      select: { id: true, estado: true },
    });
    if (!boveda) {
      throw new BadRequestException('La bóveda indicada no existe');
    }
    if (!boveda.estado) {
      throw new BadRequestException(
        'La bóveda indicada está inactiva',
      );
    }
  }

  private assertFechas(
    fechaNacimiento?: string | null,
    fechaDefuncion?: string | null,
  ) {
    if (!fechaNacimiento || !fechaDefuncion) return;
    const nac = new Date(fechaNacimiento);
    const def = new Date(fechaDefuncion);
    if (Number.isNaN(nac.getTime()) || Number.isNaN(def.getTime())) return;
    if (def < nac) {
      throw new UnprocessableEntityException(
        'La fecha de defunción no puede ser anterior a la fecha de nacimiento',
      );
    }
  }
}

function computeEdad(
  fechaNacimiento?: string | Date | null,
  fechaDefuncion?: string | Date | null,
): number | null {
  if (!fechaNacimiento || !fechaDefuncion) return null;
  const nac = new Date(fechaNacimiento);
  const def = new Date(fechaDefuncion);
  if (Number.isNaN(nac.getTime()) || Number.isNaN(def.getTime())) return null;
  let years = def.getFullYear() - nac.getFullYear();
  const sinCumpleEsteAno =
    def.getMonth() < nac.getMonth() ||
    (def.getMonth() === nac.getMonth() && def.getDate() < nac.getDate());
  if (sinCumpleEsteAno) years -= 1;
  return years >= 0 ? years : null;
}
