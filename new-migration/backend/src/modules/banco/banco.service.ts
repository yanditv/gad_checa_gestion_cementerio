import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBancoDto, UpdateBancoDto } from './dto/request/banco.dto';

@Injectable()
export class BancoService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.banco.findMany({
      where: includeInactive ? undefined : { estado: true },
      orderBy: [{ estado: 'desc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: number) {
    const b = await this.prisma.banco.findUnique({ where: { id } });
    if (!b) throw new NotFoundException('Banco no encontrado');
    return b;
  }

  async create(dto: CreateBancoDto) {
    try {
      return await this.prisma.banco.create({
        data: {
          nombre: dto.nombre.trim(),
          cuenta: dto.cuenta?.trim() || null,
          estado: true,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un banco con ese nombre');
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateBancoDto) {
    await this.findOne(id);
    try {
      return await this.prisma.banco.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          ...(dto.cuenta !== undefined && {
            cuenta: dto.cuenta?.trim() || null,
          }),
          ...(dto.estado !== undefined && { estado: dto.estado }),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un banco con ese nombre');
      }
      throw err;
    }
  }

  async remove(id: number) {
    const b = await this.findOne(id);
    // Soft delete: nunca borramos físicamente porque Pagos legados pueden
    // referirse al banco.
    if (!b.estado) {
      throw new ConflictException('El banco ya está inactivo');
    }
    return this.prisma.banco.update({
      where: { id },
      data: { estado: false },
    });
  }
}
