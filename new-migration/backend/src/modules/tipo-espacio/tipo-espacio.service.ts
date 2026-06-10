import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTipoEspacioDto } from './dto/request/create-tipo-espacio.dto';
import { UpdateTipoEspacioDto } from './dto/request/update-tipo-espacio.dto';
import { toTipoEspacioResponse } from './tipo-espacio.mapper';
import { TipoEspacioResponseDto } from './dto/response/tipo-espacio.response.dto';

@Injectable()
export class TipoEspacioService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista de tipos de espacio. Por defecto solo activos (para alimentar
   * los selects del frontend). `includeInactive=true` devuelve también los
   * dados de baja para la administración del catálogo.
   */
  async findAll(includeInactive = false): Promise<TipoEspacioResponseDto[]> {
    const tipos = await this.prisma.tipoEspacio.findMany({
      where: includeInactive ? undefined : { estado: true },
      orderBy: [{ estado: 'desc' }, { nombre: 'asc' }],
    });
    return tipos.map(toTipoEspacioResponse);
  }

  async findOne(id: number): Promise<TipoEspacioResponseDto> {
    const tipo = await this.findEntity(id);
    return toTipoEspacioResponse(tipo);
  }

  async create(
    dto: CreateTipoEspacioDto,
    userId?: string,
  ): Promise<TipoEspacioResponseDto> {
    try {
      const tipo = await this.prisma.tipoEspacio.create({
        data: {
          nombre: dto.nombre.trim(),
          prefijoNumeracion: dto.prefijoNumeracion?.trim() || null,
          tarifaArriendo: new Prisma.Decimal(dto.tarifaArriendo),
          aniosArriendo: dto.aniosArriendo,
          vecesRenovacion: dto.vecesRenovacion,
          estado: true,
          usuarioCreadorId: userId ?? null,
        },
      });
      return toTipoEspacioResponse(tipo);
    } catch (err) {
      throw this.mapUniqueError(err);
    }
  }

  async update(
    id: number,
    dto: UpdateTipoEspacioDto,
    userId?: string,
  ): Promise<TipoEspacioResponseDto> {
    await this.findEntity(id);
    try {
      const tipo = await this.prisma.tipoEspacio.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          ...(dto.prefijoNumeracion !== undefined && {
            prefijoNumeracion: dto.prefijoNumeracion?.trim() || null,
          }),
          ...(dto.tarifaArriendo !== undefined && {
            tarifaArriendo: new Prisma.Decimal(dto.tarifaArriendo),
          }),
          ...(dto.aniosArriendo !== undefined && {
            aniosArriendo: dto.aniosArriendo,
          }),
          ...(dto.vecesRenovacion !== undefined && {
            vecesRenovacion: dto.vecesRenovacion,
          }),
          ...(dto.estado !== undefined && { estado: dto.estado }),
          fechaActualizacion: new Date(),
          usuarioActualizadorId: userId ?? null,
        },
      });
      return toTipoEspacioResponse(tipo);
    } catch (err) {
      throw this.mapUniqueError(err);
    }
  }

  /**
   * Baja lógica. Nunca se borra físicamente porque hay bóvedas que apuntan
   * al tipo de espacio.
   */
  async remove(
    id: number,
    userId?: string,
  ): Promise<TipoEspacioResponseDto> {
    const tipo = await this.findEntity(id);
    if (!tipo.estado) {
      throw new ConflictException('El tipo de espacio ya está inactivo');
    }

    const bovedasAsociadas = await this.prisma.boveda.count({
      where: { tipoEspacioId: id, estado: true },
    });
    if (bovedasAsociadas > 0) {
      throw new ConflictException(
        'No se puede dar de baja: hay bóvedas activas con este tipo de espacio',
      );
    }

    const actualizado = await this.prisma.tipoEspacio.update({
      where: { id },
      data: {
        estado: false,
        fechaEliminacion: new Date(),
        usuarioEliminadorId: userId ?? null,
      },
    });
    return toTipoEspacioResponse(actualizado);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async findEntity(id: number) {
    const tipo = await this.prisma.tipoEspacio.findUnique({ where: { id } });
    if (!tipo) throw new NotFoundException('Tipo de espacio no encontrado');
    return tipo;
  }

  private mapUniqueError(err: unknown): unknown {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return new ConflictException('Ya existe un tipo de espacio con ese nombre');
    }
    return err;
  }
}
