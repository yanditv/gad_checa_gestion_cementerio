import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDescuentoDto,
  UpdateDescuentoDto,
} from './dto/request/descuento.dto';

@Injectable()
export class DescuentoService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.descuento.findMany({
      where: includeInactive ? undefined : { estado: true },
      orderBy: [{ estado: 'desc' }, { porcentaje: 'desc' }],
    });
  }

  async findOne(id: number) {
    const d = await this.prisma.descuento.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Descuento no encontrado');
    return d;
  }

  async create(dto: CreateDescuentoDto, userId?: string) {
    return this.prisma.descuento.create({
      data: {
        nombre: dto.nombre,
        porcentaje: new Prisma.Decimal(dto.porcentaje),
        descripcion: dto.descripcion ?? dto.nombre,
        fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : new Date(),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
        estado: true,
        usuarioCreadorId: userId ?? null,
      },
    });
  }

  async update(id: number, dto: UpdateDescuentoDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.descuento.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.porcentaje !== undefined && {
          porcentaje: new Prisma.Decimal(dto.porcentaje),
        }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.fechaInicio !== undefined && {
          fechaInicio: new Date(dto.fechaInicio),
        }),
        ...(dto.fechaFin !== undefined && {
          fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
        }),
        usuarioActualizadorId: userId ?? null,
      },
    });
  }

  async remove(id: number, userId?: string) {
    const d = await this.findOne(id);
    // Si el descuento está siendo usado por contratos o pagos, lo desactivamos
    // en vez de borrar (preserva integridad referencial e histórico).
    const inUse = await this.prisma.contrato.count({
      where: { descuentoId: id },
    });
    if (inUse > 0) {
      // Soft delete: marcar como inactivo.
      return this.prisma.descuento.update({
        where: { id },
        data: {
          estado: false,
          usuarioEliminadorId: userId ?? null,
        },
      });
    }
    if (!d.estado) {
      throw new ConflictException('El descuento ya está inactivo');
    }
    return this.prisma.descuento.update({
      where: { id },
      data: { estado: false, usuarioEliminadorId: userId ?? null },
    });
  }
}
